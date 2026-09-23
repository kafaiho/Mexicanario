import type { QueryCtx } from "./_generated/server";

/**
 * Loads what getOrderedLevels needs. Cultural order v2 hides retired words, so
 * it reads only the active catalog through the by_isRetired index (~200 words
 * instead of the ~1,400 kept for v1 accounts). v1 still needs every word.
 */
export async function loadOrderingData(ctx: { db: QueryCtx["db"] }, orderingVersion: number) {
  const levels = await ctx.db.query("levels").collect();
  const words = orderingVersion === 2
    ? [
      ...(await ctx.db.query("words").withIndex("by_isRetired", (q) => q.eq("isRetired", undefined)).collect()),
      ...(await ctx.db.query("words").withIndex("by_isRetired", (q) => q.eq("isRetired", false)).collect()),
    ]
    : await ctx.db.query("words").collect();
  return { levels, words };
}
