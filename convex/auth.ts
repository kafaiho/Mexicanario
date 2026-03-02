import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createAnonymousUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Create new anonymous user
    const userId = await ctx.db.insert("users", {
      name: `Player_${Math.floor(Math.random() * 10000)}`,
      coins: 100, // Starting coins
      diamonds: 0,
      country: "Venezuela",
      avatar: "default",
      currentLevel: 1, // Start at level 1
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Cast to Id<"users"> — returns null if ID doesn't exist or is invalid
      return await ctx.db.get(args.userId as any);
    } catch {
      return null;
    }
  },
});


// Checks if a userId exists in the current deployment.
// Returns true if found, false if the ID is stale/invalid (e.g. from old project).
export const checkOrCreateUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Attempt to cast the string to a typed Id and fetch the user
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), args.userId))
        .first();
      return user !== null;
    } catch {
      return false; // Invalid ID format for this deployment
    }
  },
});