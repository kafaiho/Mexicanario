import { v } from "convex/values";
import { query } from "./_generated/server";
import { groupCollections, groupPlaces } from "./collectionGrouping";
import { completedWordIds, getOrderedLevels } from "./levelOrdering";
import { buildCulturalLibrary, buildCulturalProgressSummary } from "./culturalLibrary";

async function orderedCatalog(ctx: any, userId?: any) {
  const user = userId ? await ctx.db.get(userId) : null;
  const allLevels = await ctx.db.query("levels").collect();
  const allWords = await ctx.db.query("words").collect();
  const currentLevel = (user as any)?.currentLevel ?? 1;
  const orderVersion = (user as any)?.culturalOrderVersion ?? 1;
  const ordered = getOrderedLevels(allLevels, allWords, userId?.toString() ?? "", orderVersion);
  return { allWords, ordered, currentLevel, completed: completedWordIds(ordered, currentLevel) };
}

async function rawCatalog(ctx: any, userId?: any) {
  const user = userId ? await ctx.db.get(userId) : null;
  const levels = await ctx.db.query("levels").collect();
  const words = await ctx.db.query("words").collect();
  return { levels, words, userId: userId?.toString() ?? "", currentLevel: (user as any)?.currentLevel ?? 1, culturalOrderVersion: (user as any)?.culturalOrderVersion ?? 1 };
}

export const getCulturalLibraryWithProgress = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const data = await rawCatalog(ctx, args.userId);
    return buildCulturalLibrary(data.levels, data.words, data.userId, data.currentLevel, data.culturalOrderVersion);
  },
});

export const getCulturalProgressSummary = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const data = await rawCatalog(ctx, args.userId);
    return buildCulturalProgressSummary(data.levels, data.words, data.userId, data.currentLevel, data.culturalOrderVersion);
  },
});

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
