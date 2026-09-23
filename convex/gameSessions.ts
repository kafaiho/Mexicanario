import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const startGameSession = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gameSessions", {
      userId: args.userId,
      startedAt: Date.now(),
      status: "active",
    });
  },
});

export const updateGameSession = internalMutation({
  args: {
    sessionId: v.id("gameSessions"),
    score: v.optional(v.number()),
    currentWord: v.optional(v.id("words")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Game session not found");

    const update: any = {};
    if (args.score !== undefined) update.score = args.score;
    if (args.currentWord !== undefined) update.currentWord = args.currentWord;
    if (args.status !== undefined) {
      update.status = args.status;
      if (args.status === "completed") {
        update.endedAt = Date.now();
      }
    }

    await ctx.db.patch(args.sessionId, update);
  },
});

export const getCurrentSession = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("gameSessions")
      .filter((q) => q.and(
        q.eq(q.field("userId"), args.userId),
        q.eq(q.field("status"), "active")
      ))
      .collect();
    
    return sessions[0] || null;
  },
});
