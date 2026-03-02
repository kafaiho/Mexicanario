import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Build a 7-day calendar array (Mon-Sun) with played status */
function buildWeekCalendar(
  lastPlayDate: string,
  currentStreak: number
): { label: string; played: boolean; isToday: boolean }[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  // Start from Monday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const labels = ["L", "Ma", "Mi", "J", "V", "S", "D"];
  const result = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const todayStr = getTodayString();

    // A day is "played" if it falls within the streak range up to lastPlayDate
    let played = false;
    if (currentStreak > 0 && lastPlayDate) {
      const lastPlayMs = new Date(lastPlayDate + "T12:00:00").getTime();
      const dayMs = new Date(dateStr + "T12:00:00").getTime();
      const streakStartMs = lastPlayMs - (currentStreak - 1) * 86400000;
      played = dayMs >= streakStartMs && dayMs <= lastPlayMs;
    }

    result.push({
      label: labels[i],
      played,
      isToday: dateStr === todayStr,
    });
  }

  return result;
}

// ── Milestone rewards (diamonds) ───────────────────────────────────────────────

const MILESTONE_REWARDS: Record<number, number> = {
  7: 35,
  14: 140,
  30: 210,
  50: 350,
  100: 500,
  365: 2000,
};

const ALL_MILESTONES = [7, 14, 30, 50, 100, 365];

// ── Queries ────────────────────────────────────────────────────────────────────

export const getStreakStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const today = getTodayString();
    const yesterday = getYesterdayString();
    const lastPlay = (user as any).lastPlayDate ?? "";
    const rawStreak = (user as any).playStreak ?? 0;

    // Check if streak is still active (played today or yesterday)
    const isActive = lastPlay === today || lastPlay === yesterday;
    const currentStreak = isActive ? rawStreak : 0;
    const playedToday = lastPlay === today;

    // Weekly calendar
    const weekDays = buildWeekCalendar(lastPlay, currentStreak);

    // Active goal
    const goalDays = (user as any).streakGoalDays ?? 0;

    // Claimed milestones
    const claimedMilestones = await ctx.db
      .query("streakMilestones")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId)
      )
      .collect();

    return {
      currentStreak,
      maxStreak: (user as any).playStreakMax ?? 0,
      playedToday,
      weekDays,
      goalDays,
      claimedMilestones: claimedMilestones.map((m) => m.milestoneDays),
      bestCombo: (user as any).bestCombo ?? 0,
      totalWordsToday: playedToday
        ? (user as any).totalWordsToday ?? 0
        : 0,
    };
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────────

/** Called when user completes a word — tracks daily play and streak */
export const recordDailyPlay = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const today = getTodayString();
    const lastPlay = (user as any).lastPlayDate ?? "";

    // Already recorded today — just increment word count
    if (lastPlay === today) {
      const currentCount = (user as any).totalWordsToday ?? 0;
      await ctx.db.patch(args.userId, {
        totalWordsToday: currentCount + 1,
      } as any);
      return {
        alreadyRecorded: true,
        streak: (user as any).playStreak ?? 0,
        isNewStreak: false,
        unclaimedMilestones: [] as number[],
      };
    }

    // New day — update streak
    const yesterday = getYesterdayString();
    const oldStreak = (user as any).playStreak ?? 0;
    const newStreak = lastPlay === yesterday ? oldStreak + 1 : 1;
    const maxStreak = Math.max((user as any).playStreakMax ?? 0, newStreak);

    await ctx.db.patch(args.userId, {
      lastPlayDate: today,
      playStreak: newStreak,
      playStreakMax: maxStreak,
      totalWordsToday: 1,
      todayDate: today,
    } as any);

    // Check unclaimed milestones
    const unclaimedMilestones: number[] = [];
    for (const m of ALL_MILESTONES) {
      if (newStreak >= m) {
        const existing = await ctx.db
          .query("streakMilestones")
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), args.userId),
              q.eq(q.field("milestoneDays"), m)
            )
          )
          .first();
        if (!existing) unclaimedMilestones.push(m);
      }
    }

    return {
      alreadyRecorded: false,
      streak: newStreak,
      isNewStreak: true,
      unclaimedMilestones,
    };
  },
});

/** Commit to a streak goal (7, 14, 30, or 50 days) */
export const commitStreakGoal = mutation({
  args: { userId: v.id("users"), targetDays: v.number() },
  handler: async (ctx, args) => {
    if (![7, 14, 30, 50].includes(args.targetDays)) {
      throw new Error("Meta no válida");
    }

    await ctx.db.patch(args.userId, {
      streakGoalDays: args.targetDays,
    } as any);

    return { success: true, targetDays: args.targetDays };
  },
});

/** Claim diamond reward for reaching a streak milestone */
export const claimStreakMilestone = mutation({
  args: { userId: v.id("users"), milestoneDays: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const reward = MILESTONE_REWARDS[args.milestoneDays];
    if (!reward) throw new Error("Milestone no válido");

    // Verify streak qualifies
    const streak = (user as any).playStreak ?? 0;
    if (streak < args.milestoneDays) throw new Error("Racha insuficiente");

    // Verify not already claimed
    const existing = await ctx.db
      .query("streakMilestones")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("milestoneDays"), args.milestoneDays)
        )
      )
      .first();
    if (existing) throw new Error("Ya reclamado");

    // Award diamonds
    await ctx.db.patch(args.userId, {
      diamonds: user.diamonds + reward,
    });

    await ctx.db.insert("streakMilestones", {
      userId: args.userId,
      milestoneDays: args.milestoneDays,
      claimedAt: Date.now(),
    });

    return { success: true, diamondsAwarded: reward };
  },
});

/** Update best combo (all-time + daily) if session combo is higher */
export const recordBestCombo = mutation({
  args: { userId: v.id("users"), sessionMaxCombo: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const today = getTodayString();
    const oldBest = (user as any).bestCombo ?? 0;
    const comboTodayDate = (user as any).comboTodayDate ?? "";
    const oldBestToday =
      comboTodayDate === today ? ((user as any).bestComboToday ?? 0) : 0;

    const updates: any = {};
    if (args.sessionMaxCombo > oldBest) {
      updates.bestCombo = args.sessionMaxCombo;
    }
    if (args.sessionMaxCombo > oldBestToday) {
      updates.bestComboToday = args.sessionMaxCombo;
      updates.comboTodayDate = today;
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.userId, updates);
    }
  },
});
