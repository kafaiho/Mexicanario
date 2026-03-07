import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  getOrderedLevels
} from "./levelOrdering";

function normalizeWord(str: string): string {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
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
        isLastLevel: false,
        isDefaultLevel: true,
      };
    }

    // Get user's current level (how many levels they've completed + 1)
    const currentLevel = user.currentLevel || 1;

    const allLevels = await ctx.db.query("levels").collect();

    if (allLevels.length === 0) {
      return {
        level: 1,
        word: "",
        meaning: "",
        example: "",
        region: "",
        reward: { coins: 2, diamonds: 0 },
        isLastLevel: true,
        isDefaultLevel: true,
      };
    }

    const allWords = await ctx.db.query("words").collect();

    // Order: first 50 = easy words (same for everyone), rest = seeded per user
    const ordered = getOrderedLevels(allLevels, allWords, args.userId.toString());
    const maxLevel = ordered.length;

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
        isLastLevel: true,
        isDefaultLevel: true,
      };
    }

    const word = await ctx.db.get(levelConfig.wordId as Id<"words">);

    return {
      level: clampedLevel,
      wordId: levelConfig.wordId,
      word: word?.word || "",
      meaning: word?.meaning || "",
      example: word?.example || "",
      region: word?.region || "",
      reward: levelConfig.reward,
      isLastLevel: clampedLevel >= maxLevel,
      isDefaultLevel: false,
    };
  },
});

export const updateUserCurrency = mutation({
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

    await ctx.db.patch(args.userId, update);
  },
});

export const updateUserLevel = mutation({
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

export const incrementUserLevel = mutation({
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

export const updateUserProfile = mutation({
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
export const resetLevel = mutation({
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

// ─── XP Cultural ─────────────────────────────────────────────────────────────
// Suma XP al perfil del jugador.
// amount: +10 por palabra, +5 sin errores, +15 nivel perfecto.
export const addXp = mutation({
  args: { userId: v.id("users"), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    await ctx.db.patch(args.userId, {
      xp: (user.xp ?? 0) + args.amount,
    });
  },
});

// ─── Global Rank (combined score) ────────────────────────────────────────────
export const getGlobalRank = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
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

// ─── Global Leaderboard (top 50) ────────────────────────────────────────────
export const getGlobalLeaderboard = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
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
          name: u.username ?? u.name ?? "Jugador",
          avatar: u.avatar ?? "🌮",
          level: u.currentLevel ?? 1,
          xp: u.xp ?? 0,
          score,
        };
      });

    scored.sort((a, b) => b.score - a.score);
    const top50 = scored.slice(0, 50);

    // Find caller's position
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

    return { leaderboard: top50, totalPlayers: scored.length, myRank, myEntry };
  },
});

// ─── Claim share reward (once per day) ──────────────────────────────────────
export const claimShareReward = mutation({
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

export const deleteAccount = mutation({
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