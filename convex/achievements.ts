
import { query } from "./_generated/server";

// Get game achievements
export const getAllAchievements = query({
  args: {},
  handler: async (ctx) => {
    // Get achievements
    const achievements = await ctx.db
      .query("achievements")
      .collect();

    return achievements;
  },
});