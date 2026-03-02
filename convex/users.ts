import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Seeded random helpers (deterministic shuffle per user) ───────────────────

/** LCG pseudo-random number generator seeded with a 32-bit integer */
function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return (s >>> 0) / 4294967296;
  };
}

/** Hash a string to a 32-bit integer */
function hashStr(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic Fisher-Yates shuffle */
function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  const rng = seededRng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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
        word: word?.word || "Default",
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
        word: word?.word || "Default",
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

    // Load all levels and shuffle them using the userId as a seed.
    // This gives every user their own unique word order while keeping it
    // deterministic — the same user always gets the same word at the same position.
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

    const seed = hashStr(args.userId.toString());
    const shuffled = shuffleSeeded(allLevels, seed);
    const maxLevel = shuffled.length;

    // Clamp currentLevel to the available range
    const clampedLevel = Math.min(currentLevel, maxLevel);
    const levelConfig = shuffled[clampedLevel - 1];

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

    const word = await ctx.db.get(levelConfig.wordId);

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