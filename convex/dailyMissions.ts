import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ── Mission pool ──────────────────────────────────────────────────────────────

const MISSION_POOL = [
  { id: "words_3",  type: "words",  label: "Aprende 3 palabras",   target: 3, reward: { coins: 10, diamonds: 0 } },
  { id: "words_5",  type: "words",  label: "Aprende 5 palabras",   target: 5, reward: { coins: 18, diamonds: 0 } },
  { id: "words_8",  type: "words",  label: "Aprende 8 palabras",   target: 8, reward: { coins: 30, diamonds: 0 } },
  { id: "combo_3",  type: "combo",  label: "Logra un combo de 3+", target: 3, reward: { coins: 15, diamonds: 0 } },
  { id: "combo_5",  type: "combo",  label: "Logra un combo de 5+", target: 5, reward: { coins: 25, diamonds: 1 } },
  { id: "streak",   type: "streak", label: "Juega hoy",            target: 1, reward: { coins: 12, diamonds: 0 } },
];

/**
 * Selecciona 3 misiones de forma determinista para userId+fecha.
 * Siempre incluye "Juega hoy" + 2 misiones aleatorias diferentes.
 */
function pickDailyMissions(userId: string, dateStr: string) {
  // Seed simple basado en userId + fecha
  let seed = 0;
  const str = userId + dateStr;
  for (let i = 0; i < str.length; i++) {
    seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
  }

  // Mezcla determinista del pool (Fisher-Yates con LCG)
  const pool = [...MISSION_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Misión "streak" siempre presente + 2 misiones del resto
  const streakMission = pool.find((m) => m.type === "streak")!;
  const others = pool.filter((m) => m.type !== "streak").slice(0, 2);
  return [streakMission, ...others].map((m) => ({ ...m, claimed: false }));
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Devuelve las 3 misiones de hoy con progreso actual. null si aún no generadas. */
export const getTodayMissions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayString();
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const record = await ctx.db
      .query("dailyMissions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("dateStr", today)
      )
      .first();

    if (!record) return null;

    // Progreso actual desde campos del usuario
    const totalWordsToday =
      (user as any).lastPlayDate === today
        ? ((user as any).totalWordsToday ?? 0)
        : 0;

    const bestComboToday =
      (user as any).comboTodayDate === today
        ? ((user as any).bestComboToday ?? 0)
        : 0;

    const playedToday = (user as any).lastPlayDate === today;

    const missions = record.missions.map((m) => {
      let progress = 0;
      if (m.type === "words")  progress = Math.min(totalWordsToday, m.target);
      if (m.type === "combo")  progress = Math.min(bestComboToday, m.target);
      if (m.type === "streak") progress = playedToday ? 1 : 0;
      return { ...m, progress };
    });

    return {
      dateStr: record.dateStr,
      missions,
      allClaimed: missions.every((m) => m.claimed),
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Crea las misiones del día si no existen. Seguro para llamar múltiples veces. */
export const ensureDailyMissions = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayString();

    const existing = await ctx.db
      .query("dailyMissions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("dateStr", today)
      )
      .first();

    if (existing) return { created: false };

    const missions = pickDailyMissions(args.userId, today);
    await ctx.db.insert("dailyMissions", {
      userId: args.userId,
      dateStr: today,
      missions,
    });

    return { created: true };
  },
});

/** Reclama la recompensa de una misión completada. */
export const claimMission = mutation({
  args: { userId: v.id("users"), missionId: v.string() },
  handler: async (ctx, args) => {
    const today = getTodayString();
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Usuario no encontrado");

    const record = await ctx.db
      .query("dailyMissions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("dateStr", today)
      )
      .first();

    if (!record) throw new Error("No hay misiones para hoy");

    const mission = record.missions.find((m) => m.id === args.missionId);
    if (!mission) throw new Error("Misión no encontrada");
    if (mission.claimed) throw new Error("Ya reclamada");

    // Verificar progreso actual
    const totalWordsToday =
      (user as any).lastPlayDate === today
        ? ((user as any).totalWordsToday ?? 0)
        : 0;
    const bestComboToday =
      (user as any).comboTodayDate === today
        ? ((user as any).bestComboToday ?? 0)
        : 0;
    const playedToday = (user as any).lastPlayDate === today;

    let progress = 0;
    if (mission.type === "words")  progress = totalWordsToday;
    if (mission.type === "combo")  progress = bestComboToday;
    if (mission.type === "streak") progress = playedToday ? 1 : 0;

    if (progress < mission.target) throw new Error("Misión no completada");

    // Marcar como reclamada
    const updatedMissions = record.missions.map((m) =>
      m.id === args.missionId ? { ...m, claimed: true } : m
    );
    await ctx.db.patch(record._id, { missions: updatedMissions });

    // Otorgar recompensa
    await ctx.db.patch(args.userId, {
      coins:    user.coins + mission.reward.coins,
      diamonds: user.diamonds + (mission.reward.diamonds ?? 0),
    });

    return {
      success: true,
      coinsAwarded:    mission.reward.coins,
      diamondsAwarded: mission.reward.diamonds ?? 0,
    };
  },
});
