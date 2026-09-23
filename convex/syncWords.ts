import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";

// Temporary: insert words only (no level creation to avoid doc limit)
export const batchInsertWords = internalMutation({
  args: {
    words: v.array(
      v.object({
        word: v.string(),
        meaning: v.string(),
        example: v.string(),
        region: v.string(),
        category: v.string(),
        difficulty: v.number(),
      })
    ),
  },
  handler: async (ctx, { words }) => {
    let added = 0;
    let skipped = 0;
    for (const w of words) {
      const existing = await ctx.db
        .query("words")
        .filter((q) => q.eq(q.field("word"), w.word))
        .first();
      if (existing) { skipped++; continue; }
      await ctx.db.insert("words", {
        word: w.word,
        meaning: w.meaning,
        example: w.example,
        region: w.region,
        category: w.category,
        difficulty: w.difficulty,
      });
      added++;
    }
    return { added, skipped };
  },
});
