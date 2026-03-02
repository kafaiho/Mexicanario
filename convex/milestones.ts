import { query } from "./_generated/server";

export const getAllMilestones = query({
  args: {},
  handler: async (ctx) => {
    const milestones = await ctx.db.query("milestones").collect();
    return milestones;
  },
});