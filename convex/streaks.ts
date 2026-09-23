import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { userMutation } from "./sessionAuth";

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
      streakFreezeCount: (user as any).streakFreezeCount ?? 0,
    };
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────────

/** Called when user completes a word — tracks daily play and streak */
export const recordDailyPlay = userMutation({
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

    // New day — compute days missed and apply freeze shields if available
    const oldStreak = (user as any).playStreak ?? 0;
    const freezeCount = (user as any).streakFreezeCount ?? 0;

    // Days missed = gap between lastPlay and today minus 1
    // e.g. yesterday → 0 missed, 2 days ago → 1 missed, etc.
    let daysMissed = 0;
    if (lastPlay) {
      const lastMs = new Date(lastPlay + "T12:00:00Z").getTime();
      const todayMs = new Date(today + "T12:00:00Z").getTime();
      daysMissed = Math.max(0, Math.round((todayMs - lastMs) / 86_400_000) - 1);
    }

    let newStreak: number;
    let freezesConsumed = 0;

    if (daysMissed === 0) {
      // Continuous (played yesterday or first play ever)
      newStreak = lastPlay ? oldStreak + 1 : 1;
    } else if (freezeCount >= daysMissed) {
      // Enough shields to cover all missed days → streak survives
      newStreak = oldStreak + 1;
      freezesConsumed = daysMissed;
    } else {
      // Not enough shields → streak resets (shields are NOT consumed on reset)
      newStreak = 1;
    }

    const maxStreak = Math.max((user as any).playStreakMax ?? 0, newStreak);

    // ── Reward Logic (7-day cycle) ──
    const streakDay = ((newStreak - 1) % 7) + 1;
    let coinsEarned = 0;
    let isPinata = false;

    if (streakDay < 7) {
      // Day 1: 10, Day 2: 15, Day 3: 20...
      coinsEarned = 5 + (streakDay * 5);
    } else {
      // Day 7: Piñata Surprise (50 - 200)
      coinsEarned = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
      isPinata = true;
    }

    await ctx.db.patch(args.userId, {
      lastPlayDate: today,
      playStreak: newStreak,
      playStreakMax: maxStreak,
      totalWordsToday: 1,
      todayDate: today,
      coins: (user.coins ?? 0) + coinsEarned,
      ...(freezesConsumed > 0 && {
        streakFreezeCount: Math.max(0, freezeCount - freezesConsumed),
      }),
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
      coinsAdded: coinsEarned,
      isPinata,
      freezesConsumed,
      shieldSaved: freezesConsumed > 0,
    };
  },
});

/** Commit to a streak goal (7, 14, 30, or 50 days) */
export const commitStreakGoal = userMutation({
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
export const claimStreakMilestone = userMutation({
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
export const recordBestCombo = userMutation({
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

/** Buy a streak freeze — stackable, one consumed per missed day */
export const buyStreakFreeze = userMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const COST = 150; // 150 diamantes por escudo
    if ((user.diamonds ?? 0) < COST) {
      throw new Error("Diamantes insuficientes para el Protector de Racha");
    }

    const currentCount = (user as any).streakFreezeCount ?? 0;

    await ctx.db.patch(args.userId, {
      diamonds: (user.diamonds ?? 0) - COST,
      streakFreezeCount: currentCount + 1,
    } as any);

    return { success: true, newCount: currentCount + 1 };
  },
});
