import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

import { isoWeekId } from "./weekId";
// ── Score formula (same as previous getGlobalRank but centralized) ──────────
function computeScore(user: {
  xp?: number;
  currentLevel?: number;
  playStreakMax?: number;
  leagueTrophies?: number;
  perfectLevels?: number;
}): number {
  return (
    (user.xp ?? 0) +
    ((user.currentLevel ?? 1) * 10) +
    ((user.playStreakMax ?? 0) * 5) +
    ((user.leagueTrophies ?? 0) * 50) +
    ((user.perfectLevels ?? 0) * 3)
  );
}

// ── Time helpers ────────────────────────────────────────────────────────────
const CST_OFFSET_MS = -6 * 60 * 60 * 1000;

function nowCST(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + CST_OFFSET_MS);
}

function getWeekId(): string {
  const d = nowCST();
  return isoWeekId(d);
}

function getMonthId(): string {
  const d = nowCST();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getSeasonId(): string {
  const d = nowCST();
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `${d.getFullYear()}-Q${q}`;
}

// ── Max entries in ranking snapshot ─────────────────────────────────────────
const TOP_N = 200;

// ── Cron: Recompute all rankings every 30 min ──────────────────────────────
export const recomputeAll = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const weekId = getWeekId();
    const monthId = getMonthId();

    // ── 1. Paginate all users ──────────────────────────────────────────────
    // Convex collect() can handle up to ~10K rows safely per transaction.
    // For 100K+ users we would need a paginated approach, but the cron
    // internal mutation can read up to the Convex limit. At scale, split
    // into batched scheduled mutations. For now, collect works.
    const allUsers = await ctx.db.query("users").collect();

    // ── 2. Compute scores ──────────────────────────────────────────────────
    type ScoredUser = {
      userId: string;
      name: string;
      avatar: string;
      score: number;
      level: number;
      xp: number;
      xpThisWeek: number;
      xpThisMonth: number;
    };

    const scored: ScoredUser[] = allUsers
      .filter((u) => (u.xp ?? 0) > 0 || (u.currentLevel ?? 1) > 1)
      .map((u) => ({
        userId: u._id as string,
        name: (u as any).username ?? u.name ?? "Jugador",
        avatar: u.avatar ?? "🌮",
        score: computeScore(u),
        level: u.currentLevel ?? 1,
        xp: u.xp ?? 0,
        xpThisWeek:
          (u as any).xpThisWeekId === weekId ? ((u as any).xpThisWeek ?? 0) : 0,
        xpThisMonth:
          (u as any).xpThisMonthId === monthId ? ((u as any).xpThisMonth ?? 0) : 0,
      }));

    const totalPlayers = scored.length;

    // ── 3. All-time ranking ────────────────────────────────────────────────
    scored.sort((a, b) => b.score - a.score);
    const alltimeTop = scored.slice(0, TOP_N).map((s, i) => ({
      userId: s.userId,
      name: s.name,
      avatar: s.avatar,
      score: s.score,
      level: s.level,
      xp: s.xp,
      rank: i + 1,
    }));

    await upsertSnapshot(ctx, "alltime", "alltime", alltimeTop, totalPlayers, now);

    // Store individual rank caches for all-time
    for (let i = 0; i < scored.length; i++) {
      const s = scored[i];
      const rank = i + 1;
      const percentile =
        totalPlayers <= 1 ? 1 : Math.max(1, Math.round((rank / totalPlayers) * 100));
      await upsertRankCache(ctx, s.userId, "alltime", "alltime", rank, s.score, percentile, now);
    }

    // ── 4. Weekly ranking (by xpThisWeek) ──────────────────────────────────
    const weeklyActive = scored.filter((s) => s.xpThisWeek > 0);
    weeklyActive.sort((a, b) => b.xpThisWeek - a.xpThisWeek);

    const weeklyTop = weeklyActive.slice(0, TOP_N).map((s, i) => ({
      userId: s.userId,
      name: s.name,
      avatar: s.avatar,
      score: s.xpThisWeek,
      level: s.level,
      xp: s.xp,
      rank: i + 1,
    }));

    await upsertSnapshot(ctx, "weekly", weekId, weeklyTop, weeklyActive.length, now);

    for (let i = 0; i < weeklyActive.length; i++) {
      const s = weeklyActive[i];
      const rank = i + 1;
      const percentile =
        weeklyActive.length <= 1
          ? 1
          : Math.max(1, Math.round((rank / weeklyActive.length) * 100));
      await upsertRankCache(ctx, s.userId, "weekly", weekId, rank, s.xpThisWeek, percentile, now);
    }

    // ── 5. Monthly ranking (by xpThisMonth) ────────────────────────────────
    const monthlyActive = scored.filter((s) => s.xpThisMonth > 0);
    monthlyActive.sort((a, b) => b.xpThisMonth - a.xpThisMonth);

    const monthlyTop = monthlyActive.slice(0, TOP_N).map((s, i) => ({
      userId: s.userId,
      name: s.name,
      avatar: s.avatar,
      score: s.xpThisMonth,
      level: s.level,
      xp: s.xp,
      rank: i + 1,
    }));

    await upsertSnapshot(ctx, "monthly", monthId, monthlyTop, monthlyActive.length, now);

    for (let i = 0; i < monthlyActive.length; i++) {
      const s = monthlyActive[i];
      const rank = i + 1;
      const percentile =
        monthlyActive.length <= 1
          ? 1
          : Math.max(1, Math.round((rank / monthlyActive.length) * 100));
      await upsertRankCache(ctx, s.userId, "monthly", monthId, rank, s.xpThisMonth, percentile, now);
    }
  },
});

// ── Helpers ─────────────────────────────────────────────────────────────────

async function upsertSnapshot(
  ctx: any,
  periodType: string,
  periodId: string,
  rankings: any[],
  totalPlayers: number,
  now: number
) {
  const existing = await ctx.db
    .query("rankingSnapshots")
    .withIndex("by_period", (q: any) => q.eq("periodType", periodType).eq("periodId", periodId))
    .first();

  const data = {
    periodType,
    periodId,
    rankings: JSON.stringify(rankings),
    totalPlayers,
    updatedAt: now,
  };

  if (existing) {
    await ctx.db.patch(existing._id, data);
  } else {
    await ctx.db.insert("rankingSnapshots", data);
  }
}

async function upsertRankCache(
  ctx: any,
  userId: string,
  periodType: string,
  periodId: string,
  rank: number,
  score: number,
  percentile: number,
  now: number
) {
  const existing = await ctx.db
    .query("userRankCache")
    .withIndex("by_user_period", (q: any) =>
      q.eq("userId", userId).eq("periodType", periodType).eq("periodId", periodId)
    )
    .first();

  const data = {
    userId,
    periodType,
    periodId,
    rank,
    score,
    percentile,
    updatedAt: now,
  };

  if (existing) {
    await ctx.db.patch(existing._id, { rank, score, percentile, updatedAt: now });
  } else {
    await ctx.db.insert("userRankCache", data);
  }
}

// ── Queries (O(1) lookups) ──────────────────────────────────────────────────

export const getRankingSnapshot = query({
  args: {
    periodType: v.string(),
    periodId: v.string(),
  },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db
      .query("rankingSnapshots")
      .withIndex("by_period", (q) =>
        q.eq("periodType", args.periodType).eq("periodId", args.periodId)
      )
      .first();

    if (!snapshot) return null;

    return {
      rankings: JSON.parse(snapshot.rankings),
      totalPlayers: snapshot.totalPlayers,
      updatedAt: snapshot.updatedAt,
    };
  },
});

// ── Country leaderboard (uses by_country index) ────────────────────────────
export const getCountryLeaderboard = query({
  args: {
    country: v.string(),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxResults = args.limit ?? 50;

    const countryUsers = await ctx.db
      .query("users")
      .withIndex("by_country", (q: any) => q.eq("country", args.country))
      .collect();

    const scored = countryUsers
      .filter((u: any) => (u.xp ?? 0) > 0 || (u.currentLevel ?? 1) > 1)
      .map((u: any) => ({
        userId: u._id as string,
        name: u.username ?? u.name ?? "Jugador",
        avatar: u.avatar ?? "🌮",
        level: u.currentLevel ?? 1,
        xp: u.xp ?? 0,
        score: computeScore(u),
      }));

    scored.sort((a: any, b: any) => b.score - a.score);
    const top = scored.slice(0, maxResults);

    let myRank = null;
    let myEntry = null;
    if (args.userId) {
      const uid = args.userId as string;
      const idx = scored.findIndex((s: any) => s.userId === uid);
      if (idx !== -1) {
        myRank = idx + 1;
        myEntry = scored[idx];
      }
    }

    return {
      leaderboard: top,
      totalPlayers: scored.length,
      country: args.country,
      myRank,
      myEntry,
    };
  },
});

export const getUserRank = query({
  args: {
    userId: v.id("users"),
    periodType: v.string(),
    periodId: v.string(),
  },
  handler: async (ctx, args) => {
    const cache = await ctx.db
      .query("userRankCache")
      .withIndex("by_user_period", (q) =>
        q
          .eq("userId", args.userId)
          .eq("periodType", args.periodType)
          .eq("periodId", args.periodId)
      )
      .first();

    if (!cache) return null;

    return {
      rank: cache.rank,
      score: cache.score,
      percentile: cache.percentile,
      updatedAt: cache.updatedAt,
    };
  },
});
