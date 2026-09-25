import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { userMutation } from "./sessionAuth";
import { isoWeekId } from "./weekId";

/**
 * Ranking compartido de los minijuegos (Taquero Rush, Corre Nahual, Lotería
 * Express, Duelo de Albures). Antes eran cuatro copias con dos errores:
 *   - «Hoy» usaba la fecha UTC, así que en México se reiniciaba a las 6 de la tarde.
 *   - La semana usaba una fórmula propia que no cambiaba en lunes como la liga.
 * Ahora ambos periodos usan la hora del centro de México y la semana ISO de weekId.
 */

export type MinigameScoreTable = "taqueroScores" | "nahualScores" | "loteriaScores" | "alburesScores" | "chanclaScores";
export type LeaderboardType = "alltime" | "daily" | "weekly";

const CST_OFFSET_MS = -6 * 60 * 60 * 1000; // México no usa horario de verano desde 2022
const RANK_SCAN_LIMIT = 5000;

/** Fecha y hora con la hora local del centro de México (mismo criterio que la liga). */
export function nowMexico(at: number = Date.now()): Date {
  const now = new Date(at);
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + CST_OFFSET_MS);
}

export function mexicoDayKey(at: number = Date.now()): string {
  const d = nowMexico(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function mexicoWeekKey(at: number = Date.now()): string {
  return isoWeekId(nowMexico(at));
}

/** Un puntaje válido es un entero positivo que no supera el tope realista del juego. */
export function isValidScore(score: number, maxScore: number): boolean {
  return Number.isInteger(score) && score > 0 && score <= maxScore;
}

type ScoreRecord = {
  _id: any;
  userId: Id<"users">;
  allTimeBest: number;
  dailyBest: number;
  dailyDate: string;
  weeklyBest: number;
  weeklyStr: string;
};

/** Cambios para guardar un puntaje nuevo sobre el registro existente (función pura). */
export function planScorePatch(existing: ScoreRecord | null, score: number, day: string, week: string) {
  if (!existing) {
    return { insert: { allTimeBest: score, dailyBest: score, dailyDate: day, weeklyBest: score, weeklyStr: week } };
  }
  const patch: Record<string, unknown> = {};
  if (score > existing.allTimeBest) patch.allTimeBest = score;
  if (existing.dailyDate !== day) Object.assign(patch, { dailyBest: score, dailyDate: day });
  else if (score > existing.dailyBest) patch.dailyBest = score;
  if (existing.weeklyStr !== week) Object.assign(patch, { weeklyBest: score, weeklyStr: week });
  else if (score > existing.weeklyBest) patch.weeklyBest = score;
  return { patch };
}

export function createMinigameRanking(table: MinigameScoreTable, options: { maxScore: number; defaultAvatar: string }) {
  const findRecord = async (ctx: any, userId: Id<"users">): Promise<ScoreRecord | null> =>
    ctx.db.query(table).withIndex("by_user", (q: any) => q.eq("userId", userId)).first();

  // Consulta ordenada por el periodo pedido; `above` limita a puntajes mayores.
  const periodQuery = (ctx: any, type: LeaderboardType, day: string, week: string, above?: number) => {
    if (type === "alltime") {
      return ctx.db.query(table).withIndex("by_alltime", (q: any) => (above === undefined ? q : q.gt("allTimeBest", above)));
    }
    if (type === "daily") {
      return ctx.db.query(table).withIndex("by_daily", (q: any) => {
        const scoped = q.eq("dailyDate", day);
        return above === undefined ? scoped : scoped.gt("dailyBest", above);
      });
    }
    return ctx.db.query(table).withIndex("by_weekly", (q: any) => {
      const scoped = q.eq("weeklyStr", week);
      return above === undefined ? scoped : scoped.gt("weeklyBest", above);
    });
  };
  const scoreFor = (record: ScoreRecord, type: LeaderboardType) =>
    type === "alltime" ? record.allTimeBest : type === "daily" ? record.dailyBest : record.weeklyBest;

  const submitScore = userMutation({
    args: { userId: v.id("users"), score: v.number() },
    handler: async (ctx, { userId, score }) => {
      if (!isValidScore(score, options.maxScore)) return;
      const existing = await findRecord(ctx, userId);
      const plan = planScorePatch(existing, score, mexicoDayKey(), mexicoWeekKey());
      if (plan.insert) {
        await ctx.db.insert(table, { userId, ...plan.insert } as any);
      } else if (existing && plan.patch && Object.keys(plan.patch).length > 0) {
        await ctx.db.patch(existing._id, plan.patch);
      }
    },
  });

  const getLeaderboard = query({
    args: { type: v.union(v.literal("alltime"), v.literal("daily"), v.literal("weekly")) },
    handler: async (ctx, { type }) => {
      const entries: ScoreRecord[] = await periodQuery(ctx, type, mexicoDayKey(), mexicoWeekKey()).order("desc").take(20);
      return Promise.all(entries.map(async (entry, index) => {
        const user = await ctx.db.get(entry.userId);
        return {
          rank: index + 1,
          userId: entry.userId,
          name: user?.name ?? "Jugador",
          avatar: user?.avatar && user.avatar !== "default" ? user.avatar : options.defaultAvatar,
          score: scoreFor(entry, type),
        };
      }));
    },
  });

  const getMyBest = query({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
      const record = await findRecord(ctx, userId);
      if (!record) return { allTime: 0, daily: 0, weekly: 0 };
      return {
        allTime: record.allTimeBest,
        daily: record.dailyDate === mexicoDayKey() ? record.dailyBest : 0,
        weekly: record.weeklyStr === mexicoWeekKey() ? record.weeklyBest : 0,
      };
    },
  });

  /**
   * Tu lugar en cada periodo aunque no salgas en el top 20 («Vas #57 de 312 hoy»).
   * Devuelve null en los periodos donde todavía no juegas. Los conteos se detienen en
   * RANK_SCAN_LIMIT; en ese caso `capped` es true y la UI puede mostrar «5000+».
   */
  const getMyRank = query({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
      const record = await findRecord(ctx, userId);
      const day = mexicoDayKey();
      const week = mexicoWeekKey();
      const rankIn = async (type: LeaderboardType) => {
        if (!record) return null;
        if (type === "daily" && record.dailyDate !== day) return null;
        if (type === "weekly" && record.weeklyStr !== week) return null;
        const ahead = await periodQuery(ctx, type, day, week, scoreFor(record, type)).take(RANK_SCAN_LIMIT);
        const players = await periodQuery(ctx, type, day, week).take(RANK_SCAN_LIMIT);
        return {
          rank: ahead.length + 1,
          players: players.length,
          score: scoreFor(record, type),
          capped: players.length >= RANK_SCAN_LIMIT,
        };
      };
      return { daily: await rankIn("daily"), weekly: await rankIn("weekly"), alltime: await rankIn("alltime") };
    },
  });

  return { submitScore, getLeaderboard, getMyBest, getMyRank };
}
