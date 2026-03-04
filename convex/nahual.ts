import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ── Date helpers ──────────────────────────────────────────────────────────────
function getDateStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getWeekStr() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + startOfYear.getUTCDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// ── Submit score ──────────────────────────────────────────────────────────────
export const submitScore = mutation({
  args: { userId: v.id("users"), score: v.number() },
  handler: async (ctx, { userId, score }) => {
    if (score <= 0) return;
    const today = getDateStr();
    const week  = getWeekStr();

    const existing = await ctx.db
      .query("nahualScores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existing) {
      await ctx.db.insert("nahualScores", {
        userId,
        allTimeBest: score,
        dailyBest:   score,
        dailyDate:   today,
        weeklyBest:  score,
        weeklyStr:   week,
      });
      return;
    }

    const patch: Record<string, unknown> = {};

    // All-time
    if (score > existing.allTimeBest) patch.allTimeBest = score;

    // Daily
    if (existing.dailyDate === today) {
      if (score > existing.dailyBest) patch.dailyBest = score;
    } else {
      patch.dailyBest = score;
      patch.dailyDate = today;
    }

    // Weekly
    if (existing.weeklyStr === week) {
      if (score > existing.weeklyBest) patch.weeklyBest = score;
    } else {
      patch.weeklyBest = score;
      patch.weeklyStr  = week;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
    }
  },
});

// ── Leaderboard ───────────────────────────────────────────────────────────────
export const getLeaderboard = query({
  args: {
    type: v.union(v.literal("alltime"), v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, { type }) => {
    const today = getDateStr();
    const week  = getWeekStr();

    let rows: { userId: string; score: number }[] = [];

    if (type === "alltime") {
      const entries = await ctx.db
        .query("nahualScores")
        .withIndex("by_alltime")
        .order("desc")
        .take(20);
      rows = entries.map((e) => ({ userId: e.userId, score: e.allTimeBest }));
    } else if (type === "daily") {
      const entries = await ctx.db
        .query("nahualScores")
        .withIndex("by_daily", (q) => q.eq("dailyDate", today))
        .order("desc")
        .take(20);
      rows = entries.map((e) => ({ userId: e.userId, score: e.dailyBest }));
    } else {
      const entries = await ctx.db
        .query("nahualScores")
        .withIndex("by_weekly", (q) => q.eq("weeklyStr", week))
        .order("desc")
        .take(20);
      rows = entries.map((e) => ({ userId: e.userId, score: e.weeklyBest }));
    }

    // Join with user names/avatars
    const result = await Promise.all(
      rows.map(async (row, i) => {
        const user = await ctx.db.get(row.userId as Id<"users">);
        return {
          rank:   i + 1,
          userId: row.userId,
          name:   user?.name   ?? "Jugador",
          avatar: user?.avatar ?? "🌮",
          score:  row.score,
        };
      })
    );
    return result;
  },
});

// ── Personal bests ────────────────────────────────────────────────────────────
export const getMyBest = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const today = getDateStr();
    const week  = getWeekStr();
    const rec   = await ctx.db
      .query("nahualScores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!rec) return { allTime: 0, daily: 0, weekly: 0 };
    return {
      allTime: rec.allTimeBest,
      daily:   rec.dailyDate  === today ? rec.dailyBest  : 0,
      weekly:  rec.weeklyStr  === week  ? rec.weeklyBest : 0,
    };
  },
});
