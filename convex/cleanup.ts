import { mutation, internalMutation } from "./_generated/server";

// Words to delete — all variants (lowercase for comparison)
const BANNED_WORDS = [
  "águila o sol",
  "aguila o sol",
  "piedra papel o tijera",
  "piedra papel tijeras",
];

export const deleteOAOWords = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find all matching word documents
    const allWords = await ctx.db.query("words").collect();
    const targets = allWords.filter((w) =>
      BANNED_WORDS.includes(w.word.toLowerCase().trim())
    );

    let deletedWords = 0;
    let deletedLevels = 0;
    let deletedFailedWords = 0;

    for (const wordDoc of targets) {
      // 2. Delete any level records that reference this word
      const levels = await ctx.db
        .query("levels")
        .filter((q) => q.eq(q.field("wordId"), wordDoc._id))
        .collect();
      for (const lvl of levels) {
        await ctx.db.delete(lvl._id);
        deletedLevels++;
      }

      // 3. Delete any failedWords records referencing this word
      const failed = await ctx.db
        .query("failedWords")
        .filter((q) => q.eq(q.field("wordId"), wordDoc._id))
        .collect();
      for (const fw of failed) {
        await ctx.db.delete(fw._id);
        deletedFailedWords++;
      }

      // 4. Delete the word itself
      await ctx.db.delete(wordDoc._id);
      deletedWords++;
    }

    return {
      deletedWords,
      deletedLevels,
      deletedFailedWords,
      wordNames: targets.map((w) => w.word),
    };
  },
});

export const clearDatabase = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all documents from each table
    const users = await ctx.db.query("users").collect();
    const achievements = await ctx.db.query("achievements").collect();
    const dailyRewards = await ctx.db.query("dailyRewards").collect();

    // Delete all documents
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    for (const achievement of achievements) {
      await ctx.db.delete(achievement._id);
    }

    for (const dailyReward of dailyRewards) {
      await ctx.db.delete(dailyReward._id);
    }

    return "Database cleared successfully";
  },
});
