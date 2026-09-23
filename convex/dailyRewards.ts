import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Daily rewards configuration (coins only as per latest strategy)
// For Day 7, we'll use a base value here, but the mutation will handle the randomness.
const DAILY_REWARDS = {
  1: { coins: 5, diamonds: 0 },
  2: { coins: 8, diamonds: 0 },
  3: { coins: 10, diamonds: 0 },
  4: { coins: 12, diamonds: 0 },
  5: { coins: 15, diamonds: 0 },
  6: { coins: 18, diamonds: 0 },
  7: { coins: 60, diamonds: 0 }, // Median for UI, randomness in claimDailyReward
};

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

// Get the daily rewards status for a user
export const getDailyRewardStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get the user's daily rewards record
    const dailyReward = await ctx.db
      .query("dailyRewards")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    const now = Date.now();

    // If no record exists, user can claim immediately
    if (!dailyReward) {
      return {
        canClaim: true,
        nextReward: DAILY_REWARDS[1],
        timeUntilNextClaim: 0,
        currentStreak: 0,
        maxStreak: 0,
      };
    }

    // Check if enough time has passed since last claim
    const timeUntilNextClaim = Math.max(0, dailyReward.nextResetTime - now);
    const canClaim = timeUntilNextClaim === 0;

    // Check if streak is broken (more than 48 hours since last claim)
    const streakBroken = now - dailyReward.lastClaimDate > 2 * MILLISECONDS_IN_DAY;
    const currentStreak = streakBroken ? 0 : dailyReward.currentStreak;

    // Next reward day (1-7)
    const nextRewardDay = ((currentStreak % 7) + 1) as keyof typeof DAILY_REWARDS;

    return {
      canClaim,
      nextReward: DAILY_REWARDS[nextRewardDay],
      timeUntilNextClaim,
      currentStreak,
      maxStreak: dailyReward.maxStreak,
    };
  },
});

// Claim daily reward
export const claimDailyReward = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get current status
    const status = await ctx.db
      .query("dailyRewards")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    const now = Date.now();

    // If user has a record, verify they can claim
    if (status && now < status.nextResetTime) {
      throw new Error("Daily reward not yet available");
    }

    // Check if streak is maintained (within 48 hours of last claim)
    const streakMaintained = status && (now - status.lastClaimDate <= 2 * MILLISECONDS_IN_DAY);
    const currentStreak = streakMaintained ? status?.currentStreak + 1 : 1;
    const maxStreak = status ? Math.max(status.maxStreak, currentStreak) : 1;
    const totalClaims = (status?.totalClaims ?? 0) + 1;

    // Calculate reward day (1-7)
    const rewardDay = ((currentStreak - 1) % 7 + 1) as keyof typeof DAILY_REWARDS;
    let reward = { ...DAILY_REWARDS[rewardDay] };

    // Day 7: Variable reward (Piñata) between 25 and 100 coins
    if (rewardDay === 7) {
      reward.coins = Math.floor(Math.random() * (100 - 25 + 1)) + 25;
    }

    // Update or create daily rewards record
    const dailyRewardId = status?._id ?? await ctx.db.insert("dailyRewards", {
      userId: args.userId,
      currentStreak: 0,
      maxStreak: 0,
      totalClaims: 0,
      lastClaimDate: 0,
      nextResetTime: 0,
    });

    // Update daily rewards record
    await ctx.db.patch(dailyRewardId, {
      lastClaimDate: now,
      nextResetTime: now + MILLISECONDS_IN_DAY,
      currentStreak,
      maxStreak,
      totalClaims,
    });

    // Update user's currency
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      coins: user.coins + reward.coins,
      diamonds: user.diamonds + reward.diamonds,
    });

    return {
      claimed: true,
      reward,
      currentStreak,
      maxStreak,
      nextResetTime: now + MILLISECONDS_IN_DAY,
    };
  },
});
