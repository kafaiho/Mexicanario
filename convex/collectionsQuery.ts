import { v } from "convex/values";
import { query } from "./_generated/server";
import { groupCollections, groupPlaces } from "./collectionGrouping";
import { completedWordIds, getOrderedLevels } from "./levelOrdering";

async function orderedCatalog(ctx: any, userId?: any) {
  const user = userId ? await ctx.db.get(userId) : null;
  const allLevels = await ctx.db.query("levels").collect();
  const allWords = await ctx.db.query("words").collect();
  const currentLevel = (user as any)?.currentLevel ?? 1;
  const orderVersion = (user as any)?.culturalOrderVersion ?? 1;
  const ordered = getOrderedLevels(allLevels, allWords, userId?.toString() ?? "", orderVersion);
  return { allWords, ordered, currentLevel, completed: completedWordIds(ordered, currentLevel) };
}

export const getCollectionData = query({
  args: {},
  handler: async (ctx) => {
    const { allWords, ordered } = await orderedCatalog(ctx);
    return groupCollections(ordered, allWords, new Set<string>(), 1);
  },
});

export const getCollectionsWithProgress = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const { allWords, ordered, currentLevel, completed } = await orderedCatalog(ctx, args.userId);
    return groupCollections(ordered, allWords, completed, currentLevel);
  },
});

export const getRegionsWithProgress = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const { allWords, ordered, completed } = await orderedCatalog(ctx, args.userId);
    return groupPlaces(ordered, allWords, completed);
  },
});
