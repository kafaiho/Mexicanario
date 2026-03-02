import { v } from "convex/values";
import { query } from "./_generated/server";

export const getUserCollectedCards = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userCollectedCards = await ctx.db.query("userCollectedCards").filter((q) => q.eq(q.field("userId"), args.userId)).collect();
    return userCollectedCards;
  },
});