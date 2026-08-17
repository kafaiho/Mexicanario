import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const createAnonymousUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Create new anonymous user
    const userId = await ctx.db.insert("users", {
      name: `Player_${Math.floor(Math.random() * 10000)}`,
      coins: 100, // Starting coins
      diamonds: 0,
      country: "Venezuela",
      avatar: "🌮",
      currentLevel: 1, // Start at level 1
      culturalOrderVersion: 2,
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


// ── Social auth linking ────────────────────────────────────────────────────────

// Find a user by their Google ID
export const getUserByGoogleId = query({
  args: { googleId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_googleId", (q) => q.eq("googleId", args.googleId))
      .first();
  },
});

// Find a user by their Apple ID
export const getUserByAppleId = query({
  args: { appleId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_appleId", (q) => q.eq("appleId", args.appleId))
      .first();
  },
});

// Link a Google or Apple account to an existing anonymous user.
// Returns { success: true } or { conflict: true, existingUserId: string }
export const linkSocialAccount = mutation({
  args: {
    userId:   v.string(),
    provider: v.string(),          // "google" | "apple"
    socialId: v.string(),          // googleId or appleId
    email:    v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, provider, socialId, email } = args;

    // Check if another account already has this socialId
    const indexName = provider === "google" ? "by_googleId" : "by_appleId";
    const fieldName = provider === "google" ? "googleId" : "appleId";

    const existing = await ctx.db
      .query("users")
      .withIndex(indexName as any, (q: any) => q.eq(fieldName, socialId))
      .first();

    if (existing && existing._id !== userId) {
      // Conflict: another account already linked to this social ID
      return { conflict: true, existingUserId: existing._id as string };
    }

    // Link the social account to the current user
    const patch: Record<string, string | undefined> = { [fieldName]: socialId };
    if (email) patch.email = email;
    await ctx.db.patch(userId as Id<"users">, patch);

    return { success: true };
  },
});

// Validate that a target account exists (used before switching)
export const validateAccount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.userId as Id<"users">);
      return user !== null;
    } catch {
      return false;
    }
  },
});

// ── Existing mutations ─────────────────────────────────────────────────────────

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
