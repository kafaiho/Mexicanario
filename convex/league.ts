import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ── Division metadata ───────────────────────────────────────────────────────

export const DIVISIONS = [
  { div: 1,  name: "Obsidiana",        emoji: "⬛", color: "#2C2C2C" },
  { div: 2,  name: "Nopal",            emoji: "🌵", color: "#4A7C59" },
  { div: 3,  name: "Copal",            emoji: "💨", color: "#8B7355" },
  { div: 4,  name: "Cenote",           emoji: "💧", color: "#2196F3" },
  { div: 5,  name: "Cempasúchil",      emoji: "🌼", color: "#FF9800" },
  { div: 6,  name: "Jade",             emoji: "💎", color: "#00C853" },
  { div: 7,  name: "Quetzal",          emoji: "🦜", color: "#00BFA5" },
  { div: 8,  name: "Obsidiana Solar",  emoji: "☀️", color: "#FF6D00" },
  { div: 9,  name: "Jaguar",           emoji: "🐆", color: "#D4A017" },
  { div: 10, name: "Tonatiuh",         emoji: "👑", color: "#FFD700" },
] as const;

// Rewards per division: [ascenso coins, ascenso diamonds, participación coins, top3 coins, top3 diamonds]
const DIVISION_REWARDS: Record<number, { promo: [number, number]; participation: number; top3: [number, number] }> = {
  1:  { promo: [10, 0],   participation: 5,  top3: [25, 0] },
  2:  { promo: [15, 0],   participation: 8,  top3: [35, 0] },
  3:  { promo: [20, 0],   participation: 10, top3: [50, 0] },
  4:  { promo: [30, 0],   participation: 15, top3: [75, 0] },
  5:  { promo: [40, 1],   participation: 20, top3: [100, 0] },
  6:  { promo: [60, 2],   participation: 25, top3: [150, 1] },
  7:  { promo: [80, 3],   participation: 30, top3: [200, 2] },
  8:  { promo: [100, 5],  participation: 40, top3: [300, 3] },
  9:  { promo: [150, 8],  participation: 50, top3: [400, 5] },
  10: { promo: [200, 10], participation: 75, top3: [500, 10] },
};

// ── Time helpers ────────────────────────────────────────────────────────────

const CST_OFFSET_MS = -6 * 60 * 60 * 1000; // UTC-6

/** Get current time in CST */
function nowCST(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + CST_OFFSET_MS);
}

/** Get "YYYY-MM-DD" in CST */
function getTodayCST(): string {
  const cst = nowCST();
  return cst.toISOString().slice(0, 10);
}

/** Get ISO week ID like "2026-W09" from a CST date */
function getWeekId(date?: Date): string {
  const d = date ?? nowCST();
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((d.getTime() - jan4.getTime()) / 86400000) + 4;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Get the Monday 00:00 CST of the current week as epoch ms */
function getWeekStartMs(): number {
  const cst = nowCST();
  const day = cst.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(cst);
  monday.setDate(cst.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  // Convert CST back to UTC epoch
  return monday.getTime() - CST_OFFSET_MS - monday.getTimezoneOffset() * 60000;
}

/** Get Sunday 23:59:59.999 CST of the current week as epoch ms */
function getWeekEndMs(): number {
  const startMs = getWeekStartMs();
  return startMs + 7 * 24 * 60 * 60 * 1000 - 1;
}

// ── cXP formula ─────────────────────────────────────────────────────────────

const BASE_CXP = 10;
const DAILY_SOFT_CAP = 100;
const DAILY_HARD_CAP = 150;

function calculateWordCXP(
  attempts: number,
  comboCount: number,
  playStreak: number,
  currentDayCXP: number
): { cxpAwarded: number; breakdown: { base: number; accuracy: number; combo: number; streak: number; raw: number } } {
  if (currentDayCXP >= DAILY_HARD_CAP) {
    return { cxpAwarded: 0, breakdown: { base: BASE_CXP, accuracy: 0, combo: 0, streak: 0, raw: 0 } };
  }

  const accuracyMultiplier = Math.max(0.2, 1.0 - attempts * 0.25);
  const comboBonus = 1.0 + Math.min(comboCount * 0.05, 0.50);
  const streakMultiplier = 1.0 + Math.min(playStreak * 0.033, 1.0);

  let raw = Math.round(BASE_CXP * accuracyMultiplier * comboBonus * streakMultiplier);

  // Diminishing returns after soft cap
  if (currentDayCXP >= DAILY_SOFT_CAP) {
    raw = Math.round(raw * 0.5);
  }

  // Don't exceed hard cap
  const cxpAwarded = Math.min(raw, DAILY_HARD_CAP - currentDayCXP);

  return {
    cxpAwarded,
    breakdown: {
      base: BASE_CXP,
      accuracy: Math.round(accuracyMultiplier * 100) / 100,
      combo: Math.round(comboBonus * 100) / 100,
      streak: Math.round(streakMultiplier * 100) / 100,
      raw,
    },
  };
}

// ── Queries ─────────────────────────────────────────────────────────────────

export const getLeagueStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const weekId = getWeekId();
    const division = (user as any).leagueDivision ?? null;

    // Not placed yet
    if (!division) {
      return {
        joined: false,
        division: null,
        weekId,
        divisionInfo: DIVISIONS[0],
        timeLeftMs: getWeekEndMs() - Date.now(),
      };
    }

    // Find player's league entry this week
    const playerEntry = await ctx.db
      .query("leaguePlayers")
      .withIndex("by_week_user", (q) => q.eq("weekId", weekId).eq("userId", args.userId))
      .first();

    if (!playerEntry) {
      return {
        joined: false,
        division,
        weekId,
        divisionInfo: DIVISIONS[division - 1] ?? DIVISIONS[0],
        timeLeftMs: getWeekEndMs() - Date.now(),
      };
    }

    // Get all players in the same group
    const groupPlayers = await ctx.db
      .query("leaguePlayers")
      .withIndex("by_group", (q) => q.eq("groupId", playerEntry.groupId))
      .collect();

    // Sort by cxpTotal desc, then by wordsThisWeek desc
    groupPlayers.sort((a, b) => b.cxpTotal - a.cxpTotal || b.wordsThisWeek - a.wordsThisWeek);

    // Enrich with user data
    const enriched = await Promise.all(
      groupPlayers.map(async (p, idx) => {
        const u = await ctx.db.get(p.userId);
        const rank = idx + 1;
        const zone =
          rank <= 5 ? "promotion" :
          rank > Math.max(groupPlayers.length - 5, 25) ? "demotion" :
          "safe";
        return {
          rank,
          zone,
          userId: p.userId,
          name: u?.name ?? "Jugador",
          avatar: u?.avatar ?? "👤",
          cxpTotal: p.cxpTotal,
          cxpToday: p.todayDate === getTodayCST() ? p.cxpToday : 0,
          wordsThisWeek: p.wordsThisWeek,
          isCurrentUser: p.userId === args.userId,
          playStreak: (u as any)?.playStreak ?? 0,
          isActive: (u as any)?.lastPlayDate === getTodayCST(),
        };
      })
    );

    const myRank = enriched.find((e) => e.isCurrentUser);
    const todayCxp = playerEntry.todayDate === getTodayCST() ? playerEntry.cxpToday : 0;

    return {
      joined: true,
      weekId,
      division,
      divisionInfo: DIVISIONS[division - 1] ?? DIVISIONS[0],
      rank: myRank?.rank ?? 0,
      zone: myRank?.zone ?? "safe",
      cxpTotal: playerEntry.cxpTotal,
      cxpToday: todayCxp,
      capRemaining: Math.max(0, DAILY_HARD_CAP - todayCxp),
      wordsThisWeek: playerEntry.wordsThisWeek,
      timeLeftMs: Math.max(0, getWeekEndMs() - Date.now()),
      players: enriched,
      outcome: playerEntry.outcome ?? null,
      leagueHighestDiv: (user as any).leagueHighestDiv ?? 1,
      leagueTrophies: (user as any).leagueTrophies ?? 0,
      leagueWeeklyStreak: (user as any).leagueWeeklyStreak ?? 0,
    };
  },
});

export const getDailyMiniStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayCST();

    const myScore = await ctx.db
      .query("dailyMiniScores")
      .withIndex("by_date_user", (q) => q.eq("dateStr", today).eq("userId", args.userId))
      .first();

    if (!myScore) {
      return { assigned: false, dateStr: today };
    }

    // Get all scores in the group
    const groupScores = await ctx.db
      .query("dailyMiniScores")
      .withIndex("by_group", (q) => q.eq("groupId", myScore.groupId))
      .collect();

    groupScores.sort((a, b) => b.cxpToday - a.cxpToday);

    const enriched = await Promise.all(
      groupScores.map(async (s, idx) => {
        const u = await ctx.db.get(s.userId);
        return {
          rank: idx + 1,
          userId: s.userId,
          name: u?.name ?? "Jugador",
          avatar: u?.avatar ?? "👤",
          cxpToday: s.cxpToday,
          isCurrentUser: s.userId === args.userId,
        };
      })
    );

    const myRank = enriched.find((e) => e.isCurrentUser)?.rank ?? 0;
    const reward = myRank === 1 ? 25 : myRank === 2 ? 15 : myRank === 3 ? 10 : 5;

    return {
      assigned: true,
      dateStr: today,
      groupId: myScore.groupId,
      players: enriched,
      myRank,
      reward,
      claimed: myScore.claimed,
      myCxp: myScore.cxpToday,
    };
  },
});

export const getLeagueHistory = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all league player entries for this user
    const entries = await ctx.db
      .query("leaguePlayers")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    // Sort by weekId descending and take the most recent
    entries.sort((a, b) => b.weekId.localeCompare(a.weekId));
    const recent = entries.slice(0, limit);

    return recent.map((e) => ({
      weekId: e.weekId,
      division: e.division,
      divisionInfo: DIVISIONS[e.division - 1] ?? DIVISIONS[0],
      cxpTotal: e.cxpTotal,
      wordsThisWeek: e.wordsThisWeek,
      rank: e.rank ?? null,
      outcome: e.outcome ?? null,
    }));
  },
});

// ── Mutations ───────────────────────────────────────────────────────────────

export const joinLeague = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const weekId = getWeekId();
    const now = Date.now();

    // Already joined this week?
    const existing = await ctx.db
      .query("leaguePlayers")
      .withIndex("by_week_user", (q) => q.eq("weekId", weekId).eq("userId", args.userId))
      .first();

    if (existing) {
      return { alreadyJoined: true, weekId, division: existing.division };
    }

    // Ensure leagueWeeks exists
    const weekEntries = await ctx.db
      .query("leagueWeeks")
      .filter((q) => q.eq(q.field("weekId"), weekId))
      .first();

    if (!weekEntries) {
      await ctx.db.insert("leagueWeeks", {
        weekId,
        startTime: getWeekStartMs(),
        endTime: getWeekEndMs(),
        status: "active",
        createdAt: now,
      });
    }

    // Determine division (default to 1 for new players)
    const division = (user as any).leagueDivision ?? 1;

    // Find or create a group with < 30 players
    const groups = await ctx.db
      .query("leagueGroups")
      .withIndex("by_week_division", (q) => q.eq("weekId", weekId).eq("division", division))
      .collect();

    let targetGroup = groups.find((g) => g.playerCount < 30);

    if (!targetGroup) {
      const groupIndex = groups.length + 1;
      const groupId = await ctx.db.insert("leagueGroups", {
        weekId,
        division,
        groupIndex,
        playerCount: 0,
        createdAt: now,
      });
      targetGroup = (await ctx.db.get(groupId))!;
    }

    // Increment player count
    await ctx.db.patch(targetGroup._id, {
      playerCount: targetGroup.playerCount + 1,
    });

    // Create player entry
    await ctx.db.insert("leaguePlayers", {
      weekId,
      groupId: targetGroup._id,
      userId: args.userId,
      division,
      cxpTotal: 0,
      cxpToday: 0,
      todayDate: getTodayCST(),
      wordsToday: 0,
      wordsThisWeek: 0,
      createdAt: now,
    });

    // Update user fields
    if (!(user as any).leagueDivision) {
      await ctx.db.patch(args.userId, {
        leagueDivision: 1,
        leagueHighestDiv: 1,
        leagueWeeklyStreak: 0,
        leagueTrophies: 0,
      } as any);
    }

    await ctx.db.patch(args.userId, {
      lastLeagueWeekId: weekId,
    } as any);

    return { alreadyJoined: false, weekId, division };
  },
});

export const recordLeagueCXP = mutation({
  args: {
    userId: v.id("users"),
    attempts: v.number(),
    comboCount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { cxpAwarded: 0 };

    const weekId = getWeekId();
    const today = getTodayCST();
    const playStreak = (user as any).playStreak ?? 0;

    // Find league entry
    const entry = await ctx.db
      .query("leaguePlayers")
      .withIndex("by_week_user", (q) => q.eq("weekId", weekId).eq("userId", args.userId))
      .first();

    if (!entry) return { cxpAwarded: 0, notJoined: true };

    // Reset daily if new day
    const currentDayCXP = entry.todayDate === today ? entry.cxpToday : 0;
    const currentDayWords = entry.todayDate === today ? entry.wordsToday : 0;

    // Calculate cXP
    const { cxpAwarded, breakdown } = calculateWordCXP(
      args.attempts,
      args.comboCount,
      playStreak,
      currentDayCXP
    );

    // Update league entry
    await ctx.db.patch(entry._id, {
      cxpTotal: entry.cxpTotal + cxpAwarded,
      cxpToday: currentDayCXP + cxpAwarded,
      todayDate: today,
      wordsToday: currentDayWords + 1,
      wordsThisWeek: entry.wordsThisWeek + 1,
    });

    // Also update daily mini score if assigned
    const miniScore = await ctx.db
      .query("dailyMiniScores")
      .withIndex("by_date_user", (q) => q.eq("dateStr", today).eq("userId", args.userId))
      .first();

    if (miniScore) {
      await ctx.db.patch(miniScore._id, {
        cxpToday: miniScore.cxpToday + cxpAwarded,
      });
    }

    return { cxpAwarded, breakdown, newTotal: entry.cxpTotal + cxpAwarded };
  },
});

export const assignDailyMiniGroup = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const today = getTodayCST();

    // Already assigned?
    const existing = await ctx.db
      .query("dailyMiniScores")
      .withIndex("by_date_user", (q) => q.eq("dateStr", today).eq("userId", args.userId))
      .first();

    if (existing) return { alreadyAssigned: true };

    // Determine activity tier based on totalWordsToday pattern
    const wordsToday = (user as any).totalWordsToday ?? 0;
    const tier = wordsToday >= 8 ? 2 : wordsToday >= 3 ? 1 : 0;

    // Find open group with < 5 players
    const groups = await ctx.db
      .query("dailyMiniGroups")
      .withIndex("by_date_tier", (q) => q.eq("dateStr", today).eq("activityTier", tier))
      .collect();

    let targetGroup = groups.find((g) => g.players.length < 5);

    if (!targetGroup) {
      const groupId = await ctx.db.insert("dailyMiniGroups", {
        dateStr: today,
        players: [args.userId],
        activityTier: tier,
        createdAt: Date.now(),
      });

      await ctx.db.insert("dailyMiniScores", {
        groupId,
        userId: args.userId,
        dateStr: today,
        cxpToday: 0,
        claimed: false,
      });

      return { alreadyAssigned: false, groupId };
    }

    // Add to existing group
    await ctx.db.patch(targetGroup._id, {
      players: [...targetGroup.players, args.userId],
    });

    await ctx.db.insert("dailyMiniScores", {
      groupId: targetGroup._id,
      userId: args.userId,
      dateStr: today,
      cxpToday: 0,
      claimed: false,
    });

    return { alreadyAssigned: false, groupId: targetGroup._id };
  },
});

export const claimDailyMiniReward = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayCST();

    const myScore = await ctx.db
      .query("dailyMiniScores")
      .withIndex("by_date_user", (q) => q.eq("dateStr", today).eq("userId", args.userId))
      .first();

    if (!myScore) throw new Error("No mini group today");
    if (myScore.claimed) throw new Error("Already claimed");

    // Determine rank
    const groupScores = await ctx.db
      .query("dailyMiniScores")
      .withIndex("by_group", (q) => q.eq("groupId", myScore.groupId))
      .collect();

    groupScores.sort((a, b) => b.cxpToday - a.cxpToday);
    const myRank = groupScores.findIndex((s) => s.userId === args.userId) + 1;
    const reward = myRank === 1 ? 25 : myRank === 2 ? 15 : myRank === 3 ? 10 : 5;

    // Award coins
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        coins: user.coins + reward,
      });
    }

    await ctx.db.patch(myScore._id, { claimed: true });

    return { reward, rank: myRank };
  },
});

// ── Internal: Week End Processing ───────────────────────────────────────────

export const processWeekEnd = internalMutation({
  handler: async (ctx) => {
    // Process the previous week
    const cst = nowCST();
    const prevDay = new Date(cst);
    prevDay.setDate(cst.getDate() - 1); // Yesterday = last day of prev week
    const weekId = getWeekId(prevDay);

    const weekEntry = await ctx.db
      .query("leagueWeeks")
      .filter((q) => q.eq(q.field("weekId"), weekId))
      .first();

    if (!weekEntry || weekEntry.status === "completed") return;

    await ctx.db.patch(weekEntry._id, { status: "processing" });

    // Get all groups for this week
    const allGroups = await ctx.db
      .query("leagueGroups")
      .filter((q) => q.eq(q.field("weekId"), weekId))
      .collect();

    for (const group of allGroups) {
      const players = await ctx.db
        .query("leaguePlayers")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect();

      // Sort by cxpTotal desc
      players.sort((a, b) => b.cxpTotal - a.cxpTotal || b.wordsThisWeek - a.wordsThisWeek);

      const total = players.length;

      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const rank = i + 1;
        const division = p.division;

        let outcome: "promoted" | "stayed" | "demoted" = "stayed";

        if (rank <= 5 && division < 10) {
          outcome = "promoted";
        } else if (rank > Math.max(total - 5, 25) && division > 1) {
          outcome = "demoted";
        }

        // Update player entry
        await ctx.db.patch(p._id, { rank, outcome });

        // Update user's division
        const user = await ctx.db.get(p.userId);
        if (!user) continue;

        let newDiv = division;
        if (outcome === "promoted") newDiv = Math.min(10, division + 1);
        if (outcome === "demoted") newDiv = Math.max(1, division - 1);

        const highestDiv = Math.max((user as any).leagueHighestDiv ?? 1, newDiv);
        const prevWeekId = (user as any).lastLeagueWeekId ?? "";
        const weeklyStreak = prevWeekId === weekId
          ? ((user as any).leagueWeeklyStreak ?? 0) + 1
          : 1;

        let trophies = (user as any).leagueTrophies ?? 0;
        if (division === 10 && rank <= 3) trophies += 1;

        // Award rewards
        const rewards = DIVISION_REWARDS[division] ?? DIVISION_REWARDS[1];
        let coinReward = rewards.participation;
        let diamondReward = 0;

        if (outcome === "promoted") {
          coinReward += rewards.promo[0];
          diamondReward += rewards.promo[1];
        }
        if (rank <= 3) {
          coinReward += rewards.top3[0];
          diamondReward += rewards.top3[1];
        }

        await ctx.db.patch(p.userId, {
          leagueDivision: newDiv,
          leagueHighestDiv: highestDiv,
          leagueWeeklyStreak: weeklyStreak,
          leagueTrophies: trophies,
          coins: user.coins + coinReward,
          diamonds: user.diamonds + diamondReward,
        } as any);
      }
    }

    await ctx.db.patch(weekEntry._id, { status: "completed" });
  },
});

export const resetDailyMini = internalMutation({
  handler: async (_ctx) => {
    // Daily mini groups are created lazily each day.
    // This cron is a placeholder for any cleanup needed.
    // Groups from previous days are naturally stale.
  },
});

// ── Helper query for division info ──────────────────────────────────────────

export const getDivisions = query({
  handler: async () => {
    return DIVISIONS;
  },
});
