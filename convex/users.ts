import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { userMutation } from "./sessionAuth";
import { loadOrderingData } from "./levelData";
import { isoWeekId } from "./weekId";
import {
  getOrderedLevels
} from "./levelOrdering";

function normalizeWord(str: string): string {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Public view of a player: never exposes the password hash or email. */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const { passwordHash: _passwordHash, email: _email, ...rest } = user;
    return rest;
  },
});

export const getCurrentLevel = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // If no userId is provided, return level 1 as default
    if (!args.userId) {
      const level1 = await ctx.db
        .query("levels")
        .filter((q) => q.eq(q.field("levelNumber"), 1))
        .first();

      if (!level1) {
        return {
          level: 1,
          word: "",
          meaning: "",
          example: "",
          region: "",
          reward: { coins: 2, diamonds: 0 },
          difficultyRole: null,
          difficultyBand: null,
          isChallenge: false,
          difficultyDeviation: null,
          isLastLevel: false,
          isDefaultLevel: true,
        };
      }

      const word = await ctx.db.get(level1.wordId);
      return {
        level: 1,
        word: normalizeWord(word?.word || ""),
        meaning: word?.meaning || "",
        example: word?.example || "",
        region: word?.region || "",
        reward: level1.reward,
        difficultyRole: null,
        difficultyBand: null,
        isChallenge: false,
        difficultyDeviation: null,
        isLastLevel: false,
        isDefaultLevel: true,
      };
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      // If user not found, return level 1 as default
      const level1 = await ctx.db
        .query("levels")
        .filter((q) => q.eq(q.field("levelNumber"), 1))
        .first();

      if (!level1) {
        return {
          level: 1,
          word: "",
          meaning: "",
          example: "",
          region: "",
          reward: { coins: 2, diamonds: 0 },
          difficultyRole: null,
          difficultyBand: null,
          isChallenge: false,
          difficultyDeviation: null,
          isLastLevel: false,
          isDefaultLevel: true,
        };
      }

      const word = await ctx.db.get(level1.wordId);
      return {
        level: 1,
        word: normalizeWord(word?.word || ""),
        meaning: word?.meaning || "",
        example: word?.example || "",
        region: word?.region || "",
        reward: level1.reward,
        difficultyRole: null,
        difficultyBand: null,
        isChallenge: false,
        difficultyDeviation: null,
        isLastLevel: false,
        isDefaultLevel: true,
      };
    }

    // Get user's current level (how many levels they've completed + 1)
    const currentLevel = user.currentLevel || 1;

    const { levels: allLevels, words: allWords } = await loadOrderingData(ctx, user.culturalOrderVersion ?? 1);

    if (allLevels.length === 0) {
      return {
        level: 1,
        word: "",
        meaning: "",
        example: "",
        region: "",
        reward: { coins: 2, diamonds: 0 },
        difficultyRole: null,
        difficultyBand: null,
        isChallenge: false,
        difficultyDeviation: null,
        isLastLevel: true,
        isDefaultLevel: true,
      };
    }

    // Order: first 50 = easy words (same for everyone), rest = seeded per user
    const ordered = getOrderedLevels(allLevels, allWords, args.userId.toString(), user.culturalOrderVersion ?? 1);
    const maxLevel = ordered.length;
    const wordMap = new Map(allWords.map((item) => [item._id.toString(), item]));
    const levelGroups = [];
    for (let index = 0; index < ordered.length; index += 50) {
      const group = ordered.slice(index, index + 50);
      const firstWord = group[0]
        ? wordMap.get(group[0].wordId.toString())?.word ?? ""
        : "";
      levelGroups.push({
        groupStart: index + 1,
        totalInGroup: group.length,
        firstWord: normalizeWord(firstWord),
      });
    }

    // Clamp currentLevel to the available range
    const clampedLevel = Math.min(currentLevel, maxLevel);
    const levelConfig = ordered[clampedLevel - 1];

    if (!levelConfig) {
      return {
        level: clampedLevel,
        word: "",
        meaning: "",
        example: "",
        region: "",
        reward: { coins: 2, diamonds: 0 },
        difficultyRole: null,
        difficultyBand: null,
        isChallenge: false,
        difficultyDeviation: null,
        isLastLevel: true,
        isDefaultLevel: true,
      };
    }

    const word = wordMap.get(levelConfig.wordId.toString());
    const nextLevelConfig = ordered[clampedLevel];
    const nextWord = nextLevelConfig
      ? wordMap.get(nextLevelConfig.wordId.toString())
      : null;

    return {
      level: clampedLevel,
      wordId: levelConfig.wordId,
      word: word?.word || "",
      meaning: word?.meaning || "",
      example: word?.example || "",
      region: word?.region || "",
      pathId: word?.pathId,
      placeId: word?.placeId,
      editorialOrder: word?.editorialOrder,
      culturalOrderVersion: user.culturalOrderVersion ?? 1,
      difficultyRole: levelConfig.difficultyRole ?? null,
      difficultyBand: levelConfig.difficultyBand ?? null,
      isChallenge: levelConfig.isChallenge ?? false,
      difficultyDeviation: levelConfig.deviation ?? null,
      nextPathId: nextWord?.pathId,
      reward: levelConfig.reward,
      totalLevels: maxLevel,
      levelGroups,
      isLastLevel: clampedLevel >= maxLevel,
      completedAll: currentLevel > maxLevel,
      isDefaultLevel: false,
    };
  },
});

export const updateUserCurrency = userMutation({
  args: {
    userId: v.id("users"),
    coins: v.optional(v.number()),
    diamonds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const update: { coins?: number; diamonds?: number } = {};
    if (args.coins !== undefined) {
      update.coins = (user.coins || 0) + args.coins;
    }
    if (args.diamonds !== undefined) {
      update.diamonds = (user.diamonds || 0) + args.diamonds;
    }
    // Sumar varos/diamantes desde la app ya no se permite: los premios pasan por
    // convex/rewards.ts. Mientras CURRENCY_ENFORCEMENT no sea "on", las versiones
    // anteriores de la app lo siguen usando; actívalo al forzar la actualización.
    const adds = (args.coins ?? 0) > 0 || (args.diamonds ?? 0) > 0;
    if (adds && process.env.CURRENCY_ENFORCEMENT === "on") {
      throw new ConvexError("Actualiza la app para recibir tus premios.");
    }
    // Spending must never leave a negative balance (e.g. two hints tapped
    // before the reactive balance refreshes on the client).
    const spendsCoins = (args.coins ?? 0) < 0 && (update.coins ?? 0) < 0;
    const spendsDiamonds = (args.diamonds ?? 0) < 0 && (update.diamonds ?? 0) < 0;
    if (spendsCoins || spendsDiamonds) {
      throw new Error("Saldo insuficiente");
    }

    await ctx.db.patch(args.userId, update);
  },
});

export const updateUserLevel = internalMutation({
  args: {
    userId: v.id("users"),
    level: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      currentLevel: args.level,
    });

    return { success: true, newLevel: args.level };
  },
});

export const incrementUserLevel = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentLevel = user.currentLevel || 1;
    const newLevel = currentLevel + 1;

    await ctx.db.patch(args.userId, {
      currentLevel: newLevel,
    });

    return { success: true, newLevel };
  },
});

export const updateUserProfile = userMutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    country: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const update: { name?: string; country?: string; avatar?: string } = {};
    if (args.name !== undefined) update.name = args.name;
    if (args.country !== undefined) update.country = args.country;
    if (args.avatar !== undefined) update.avatar = args.avatar;

    await ctx.db.patch(args.userId, update);
    return { success: true, message: "Profile updated successfully" };
  },
});

// ─── Reset level to 1 (keeps coins & diamonds) ────────────────────────────────
export const resetLevel = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, { currentLevel: 1 });

    return {
      success: true,
      message: "Level reset to 1. Coins and diamonds unchanged.",
      coins: user.coins,
      diamonds: user.diamonds,
    };
  },
});

// ── Time helpers (duplicated from league.ts to avoid cross-file deps) ───────
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

// ─── XP Cultural ─────────────────────────────────────────────────────────────
// Suma XP al perfil del jugador + trackea XP semanal/mensual.
// amount: +10 por palabra, +5 sin errores, +15 nivel perfecto.
export const addXp = userMutation({
  args: { userId: v.id("users"), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    // Server-side validation: clamp XP amount to reasonable range (1-50 per word)
    const amount = Math.max(0, Math.min(Math.round(args.amount), 50));
    if (amount <= 0) return;

    const weekId = getWeekId();
    const monthId = getMonthId();

    // Auto-reset weekly/monthly counters when period changes
    const currentWeekXp =
      (user as any).xpThisWeekId === weekId ? ((user as any).xpThisWeek ?? 0) : 0;
    const currentMonthXp =
      (user as any).xpThisMonthId === monthId ? ((user as any).xpThisMonth ?? 0) : 0;

    const oldXp = user.xp ?? 0;
    const newXp = oldXp + amount;

    await ctx.db.patch(args.userId, {
      xp: newXp,
      xpThisWeek: currentWeekXp + amount,
      xpThisWeekId: weekId,
      xpThisMonth: currentMonthXp + amount,
      xpThisMonthId: monthId,
    } as any);

    // Also upsert weeklyFriendScores for cuates leaderboard
    const existing = await ctx.db
      .query("weeklyFriendScores")
      .withIndex("by_user_week", (q: any) => q.eq("userId", args.userId).eq("weekId", weekId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        xpThisWeek: existing.xpThisWeek + amount,
        wordsThisWeek: existing.wordsThisWeek + 1,
        bestComboThisWeek: Math.max(existing.bestComboThisWeek, (user as any).bestCombo ?? 0),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("weeklyFriendScores", {
        userId: args.userId,
        weekId,
        xpThisWeek: amount,
        wordsThisWeek: 1,
        bestComboThisWeek: (user as any).bestCombo ?? 0,
        updatedAt: Date.now(),
      });
    }

    return { oldXp, newXp };
  },
});

// ─── Global Rank (O(1) cache lookup) ─────────────────────────────────────────
export const getGlobalRank = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Try cached rank first (O(1))
    const cached = await ctx.db
      .query("userRankCache")
      .withIndex("by_user_period", (q) =>
        q.eq("userId", args.userId).eq("periodType", "alltime").eq("periodId", "alltime")
      )
      .first();

    if (cached) {
      // Get total players from snapshot
      const snapshot = await ctx.db
        .query("rankingSnapshots")
        .withIndex("by_period", (q) => q.eq("periodType", "alltime").eq("periodId", "alltime"))
        .first();

      return {
        globalRank: cached.rank,
        totalPlayers: snapshot?.totalPlayers ?? cached.rank,
        percentile: cached.percentile,
        score: cached.score,
      };
    }

    // Fallback: compute on-the-fly (only before first cron run)
    const allUsers = await ctx.db.query("users").collect();

    const scored = allUsers.map((u) => {
      const score =
        (u.xp ?? 0) +
        ((u.currentLevel ?? 1) * 10) +
        ((u.playStreakMax ?? 0) * 5) +
        ((u.leagueTrophies ?? 0) * 50) +
        ((u.perfectLevels ?? 0) * 3);
      return { id: u._id, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const totalPlayers = scored.length;
    const idx = scored.findIndex((s) => s.id === args.userId);
    const globalRank = idx === -1 ? totalPlayers : idx + 1;
    const userScore = idx === -1 ? 0 : scored[idx].score;
    const percentile =
      totalPlayers <= 1 ? 1 : Math.max(1, Math.round((globalRank / totalPlayers) * 100));

    return { globalRank, totalPlayers, percentile, score: userScore };
  },
});

// ─── Global Leaderboard (O(1) snapshot lookup) ──────────────────────────────
export const getGlobalLeaderboard = query({
  args: {
    userId: v.optional(v.id("users")),
    periodType: v.optional(v.string()),  // "alltime" | "weekly" | "monthly"
    periodId: v.optional(v.string()),    // "alltime" | "2026-W09" | "2026-03"
  },
  handler: async (ctx, args) => {
    const pType = args.periodType ?? "alltime";
    // El servidor fija la semana/mes actual: versiones viejas de la app calculan
    // la semana con otra fórmula y verían un ranking vacío.
    const pId = pType === "weekly" ? getWeekId() : pType === "monthly" ? getMonthId() : (args.periodId ?? "alltime");

    // Try cached snapshot first (O(1))
    const snapshot = await ctx.db
      .query("rankingSnapshots")
      .withIndex("by_period", (q) => q.eq("periodType", pType).eq("periodId", pId))
      .first();

    if (snapshot) {
      const rankings = JSON.parse(snapshot.rankings);
      const top50 = rankings.slice(0, 50);

      // Get caller's cached rank
      let myRank = null;
      let myEntry = null;
      if (args.userId) {
        const cachedRank = await ctx.db
          .query("userRankCache")
          .withIndex("by_user_period", (q) =>
            q.eq("userId", args.userId!).eq("periodType", pType).eq("periodId", pId)
          )
          .first();

        if (cachedRank) {
          myRank = cachedRank.rank;
          // Find in top 50 or build from user data
          const inTop = top50.find((e: any) => e.userId === (args.userId as string));
          if (inTop) {
            myEntry = inTop;
          } else {
            const user = await ctx.db.get(args.userId!);
            if (user) {
              myEntry = {
                userId: user._id as string,
                name: (user as any).username ?? user.name ?? "Jugador",
                avatar: (user.avatar && user.avatar !== "default") ? user.avatar : "🌮",
                level: user.currentLevel ?? 1,
                xp: user.xp ?? 0,
                score: cachedRank.score,
              };
            }
          }
        }
      }

      return {
        leaderboard: top50,
        totalPlayers: snapshot.totalPlayers,
        myRank,
        myEntry,
        periodType: pType,
        periodId: pId,
      };
    }

    // Fallback: compute on-the-fly (only before first cron run)
    const allUsers = await ctx.db.query("users").collect();

    const scored = allUsers
      .filter((u) => (u.xp ?? 0) > 0 || (u.currentLevel ?? 1) > 1)
      .map((u) => {
        const score =
          (u.xp ?? 0) +
          ((u.currentLevel ?? 1) * 10) +
          ((u.playStreakMax ?? 0) * 5) +
          ((u.leagueTrophies ?? 0) * 50) +
          ((u.perfectLevels ?? 0) * 3);
        return {
          userId: u._id as string,
          name: (u as any).username ?? u.name ?? "Jugador",
          avatar: (u.avatar && u.avatar !== "default") ? u.avatar : "🌮",
          level: u.currentLevel ?? 1,
          xp: u.xp ?? 0,
          score,
        };
      });

    scored.sort((a, b) => b.score - a.score);
    const top50 = scored.slice(0, 50);

    let myRank = null;
    let myEntry = null;
    if (args.userId) {
      const uid = args.userId as string;
      const idx = scored.findIndex((s) => s.userId === uid);
      if (idx !== -1) {
        myRank = idx + 1;
        myEntry = scored[idx];
      }
    }

    return {
      leaderboard: top50,
      totalPlayers: scored.length,
      myRank,
      myEntry,
      periodType: pType,
      periodId: pId,
    };
  },
});

// ─── Claim share reward (once per day) ──────────────────────────────────────
export const claimShareReward = userMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    if (user.lastShareRewardDate === today) {
      return { success: false, alreadyClaimed: true };
    }

    await ctx.db.patch(args.userId, {
      coins: (user.coins || 0) + 50,
      lastShareRewardDate: today,
    });

    return { success: true, alreadyClaimed: false };
  },
});

export const deleteAccount = userMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Delete all related table rows in parallel
    const tables = [
      "userAchievements",
      "userCollectedCards",
      "dailyRewards",
      "purchases",
      "seasonPass",
      "streakMilestones",
      "gameSessions",
      "leaguePlayers",
      "dailyMissions",
      "failedWords",
      "friendships",
      "friendNotifications",
      "weeklyFriendScores",
      "referrals",
      "pvpHistory",
      "pvpQueue",
      "nahualScores",
      "taqueroScores",
      "alburesScores",
      "loteriaScores",
      "leagueBadges",
      "seasonalRankings",
      "friendChallenges",
      "pvpMatches",
      "dailyMiniScores",
      "userRankCache",
      "sessions",
    ] as const;

    for (const table of tables) {
      const rows = await (ctx.db.query(table) as any)
        .filter((q: any) => q.eq(q.field("userId"), userId))
        .collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
    }

    // Finally, delete the user record itself
    await ctx.db.delete(userId);

    return { success: true };
  },
});
