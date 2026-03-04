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
          word: "Default",
          meaning: "Default meaning",
          example: "Default example",
          region: "Default region",
          reward: { coins: 50, diamonds: 1 },
          isLastLevel: false,
          isDefaultLevel: true,
        };
      }

      const word = await ctx.db.get(level1.wordId);
      return {
        level: 1,
        word: normalizeWord(word?.word || "Default"),
        meaning: word?.meaning || "Default meaning",
        example: word?.example || "Default example",
        region: word?.region || "Default region",
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
          word: "Default",
          meaning: "Default meaning",
          example: "Default example",
          region: "Default region",
          reward: { coins: 50, diamonds: 1 },
          isLastLevel: false,
          isDefaultLevel: true,
        };
      }

      const word = await ctx.db.get(level1.wordId);
      return {
        level: 1,
        word: normalizeWord(word?.word || "Default"),
        meaning: word?.meaning || "Default meaning",
        example: word?.example || "Default example",
        region: word?.region || "Default region",
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
        word: "Default",
        meaning: "Default meaning",
        example: "Default example",
        region: "Default region",
        reward: { coins: 50, diamonds: 1 },
        isLastLevel: true,
        isDefaultLevel: false,
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
        word: "Default",
        meaning: "Default meaning",
        example: "Default example",
        region: "Default region",
        reward: { coins: 50, diamonds: 1 },
        isLastLevel: true,
        isDefaultLevel: false,
      };
    }

    const word = await ctx.db.get(levelConfig.wordId as Id<"words">);

    // ── Adult content gate ───────────────────────────────────────────────────
    if ((word as any)?.category === "adulto") {
      const unlocked: string[] = (user as any).adultContentUnlocked ?? [];
      const packId = `content_${(word as any)?.pack ?? "insultos"}`;
      if (!unlocked.includes(packId)) {
        return {
          level: clampedLevel,
          word: "BLOQUEADO",
          meaning: "Pack de contenido +18 no desbloqueado.",
          example: "Ve a la tienda para desbloquear este pack.",
          region: "México",
          reward: { coins: 0, diamonds: 0 },
          isLastLevel: false,
          isDefaultLevel: false,
        };
      }
    }

    return {
      level: clampedLevel,
      word: word?.word || "Default",
      meaning: word?.meaning || "Default meaning",
      example: word?.example || "Default example",
      region: word?.region || "Default region",
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

// ─── Delete Account (Apple App Store required) ────────────────────────────────
// Permanently removes all data for a user across every table.
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