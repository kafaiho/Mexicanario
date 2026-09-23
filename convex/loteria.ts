import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { userMutation } from "./sessionAuth";

function getDateStr() { return new Date().toISOString().slice(0, 10); }
function getWeekStr() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const week = Math.ceil((dayOfYear + startOfYear.getUTCDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, "0")}`;
}

export const submitScore = userMutation({
    args: { userId: v.id("users"), score: v.number() },
    handler: async (ctx, { userId, score }) => {
        if (score <= 0) return;
        const today = getDateStr();
        const week = getWeekStr();
        const existing = await ctx.db.query("loteriaScores").withIndex("by_user", (q) => q.eq("userId", userId)).first();
        if (!existing) {
            await ctx.db.insert("loteriaScores", { userId, allTimeBest: score, dailyBest: score, dailyDate: today, weeklyBest: score, weeklyStr: week });
            return;
        }
        const patch: Record<string, unknown> = {};
        if (score > existing.allTimeBest) patch.allTimeBest = score;
        if (existing.dailyDate === today) { if (score > existing.dailyBest) patch.dailyBest = score; }
        else { patch.dailyBest = score; patch.dailyDate = today; }
        if (existing.weeklyStr === week) { if (score > existing.weeklyBest) patch.weeklyBest = score; }
        else { patch.weeklyBest = score; patch.weeklyStr = week; }
        if (Object.keys(patch).length > 0) await ctx.db.patch(existing._id, patch);
    },
});

export const getLeaderboard = query({
    args: { type: v.union(v.literal("alltime"), v.literal("daily"), v.literal("weekly")) },
    handler: async (ctx, { type }) => {
        const today = getDateStr();
        const week = getWeekStr();
        let rows: { userId: string; score: number }[] = [];
        if (type === "alltime") {
            const e = await ctx.db.query("loteriaScores").withIndex("by_alltime").order("desc").take(20);
            rows = e.map((x) => ({ userId: x.userId, score: x.allTimeBest }));
        } else if (type === "daily") {
            const e = await ctx.db.query("loteriaScores").withIndex("by_daily", (q) => q.eq("dailyDate", today)).order("desc").take(20);
            rows = e.map((x) => ({ userId: x.userId, score: x.dailyBest }));
        } else {
            const e = await ctx.db.query("loteriaScores").withIndex("by_weekly", (q) => q.eq("weeklyStr", week)).order("desc").take(20);
            rows = e.map((x) => ({ userId: x.userId, score: x.weeklyBest }));
        }
        return Promise.all(rows.map(async (row, i) => {
            const user = await ctx.db.get(row.userId as Id<"users">);
            return { rank: i + 1, userId: row.userId, name: user?.name ?? "Jugador", avatar: (user?.avatar && user.avatar !== "default") ? user.avatar : "🌮", score: row.score };
        }));
    },
});

export const getMyBest = query({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const today = getDateStr(); const week = getWeekStr();
        const rec = await ctx.db.query("loteriaScores").withIndex("by_user", (q) => q.eq("userId", userId)).first();
        if (!rec) return { allTime: 0, daily: 0, weekly: 0 };
        return { allTime: rec.allTimeBest, daily: rec.dailyDate === today ? rec.dailyBest : 0, weekly: rec.weeklyStr === week ? rec.weeklyBest : 0 };
    },
});
