import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const getUserAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userAchievements = await ctx.db.query("userAchievements").filter((q) => q.eq(q.field("userId"), args.userId)).collect();
    return userAchievements;
  },
});

export const updateProgress = internalMutation({
  args: {
    userId: v.id("users"),
    achievementId: v.id("achievements"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    // Determine target based on mock logic to avoid throwing
    const achievements = await ctx.db
      .query("userAchievements")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("achievementId"), args.achievementId))
      .collect();

    if (achievements.length > 0) {
      await ctx.db.patch(achievements[0]._id, {
        progress: (achievements[0].progress || 0) + args.progress,
      });
    } else {
      await ctx.db.insert("userAchievements", {
        userId: args.userId,
        achievementId: args.achievementId,
        progress: args.progress,
        claimed: false,
      });
    }
  },
});