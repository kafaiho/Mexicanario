import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { checkSession } from "./sessionAuth";
import { insertGuestUser } from "./sessions";

// Legacy entry point for app versions without sessions (returns only the id).
export const createAnonymousUser = mutation({
  args: {},
  handler: async (ctx) => insertGuestUser(ctx),
});

/**
 * The player's own document. Secrets never leave the server; the email is only
 * returned to a caller holding a valid session for this user.
 */
export const getUser = query({
  args: { userId: v.string(), sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("users", args.userId);
    const user = id ? await ctx.db.get(id) : null;
    if (!user) return null;
    const { passwordHash: _passwordHash, email, ...rest } = user;
    let ownsSession = false;
    if (args.sessionToken) {
      try {
        await checkSession(ctx, args.userId, args.sessionToken);
        ownsSession = true;
      } catch {
        ownsSession = false;
      }
    }
    return { ...rest, email: ownsSession ? email : undefined, hasEmail: !!email };
  },
});

// Validate that a target account exists (used before switching)
export const validateAccount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const id = ctx.db.normalizeId("users", args.userId);
      return !!id && (await ctx.db.get(id)) !== null;
    } catch {
      return false;
    }
  },
});

// ── Existing mutations ─────────────────────────────────────────────────────────

// Checks if a userId exists in the current deployment.
// Returns true if found, false if the ID is stale/invalid (e.g. from old project).
export const checkOrCreateUser = internalMutation({
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
