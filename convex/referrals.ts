import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { COINS_REFERRED, COINS_REFERRER, REFERRAL_MILESTONES } from "./referralConfig";

function getMilestoneBonus(newCount: number) {
  return REFERRAL_MILESTONES.find((m) => m.count === newCount) ?? null;
}

// ── claimReferral ─────────────────────────────────────────────────────────────
// Called from registerAccount when a pendingRef username is provided.
// Safe to call multiple times — idempotent via referredBy check.
export const claimReferral = internalMutation({
  args: {
    referredUserId:   v.id("users"),
    referrerUsername: v.string(),
  },
  handler: async (ctx, { referredUserId, referrerUsername }) => {
    // 1. Find referrer by username
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", referrerUsername.toLowerCase().trim()))
      .first();

    if (!referrer) return { success: false, reason: "referrer_not_found" };

    // 2. Anti-abuse guards
    if (referrer._id === referredUserId) return { success: false, reason: "self_referral" };

    const referred = await ctx.db.get(referredUserId);
    if (!referred) return { success: false, reason: "referred_not_found" };
    if (referred.referredBy) return { success: false, reason: "already_referred" };

    // 3. Calculate new referral count
    const newCount = (referrer.referralCount ?? 0) + 1;
    const milestone = getMilestoneBonus(newCount);

    // 4. Award referido
    await ctx.db.patch(referredUserId, {
      coins:      (referred.coins      ?? 0) + COINS_REFERRED,
      referredBy: referrer._id,
    });

    // 5. Award referidor (base + milestone bonus if applicable)
    const referrerCoinsGain   = COINS_REFERRER + (milestone?.coins   ?? 0);
    const referrerDiamondGain = milestone?.diamonds ?? 0;
    await ctx.db.patch(referrer._id, {
      coins:         (referrer.coins    ?? 0) + referrerCoinsGain,
      diamonds:      (referrer.diamonds ?? 0) + referrerDiamondGain,
      referralCount: newCount,
    });

    // 6. Record in referrals table
    await ctx.db.insert("referrals", {
      referrerId:     referrer._id,
      referredId:     referredUserId,
      createdAt:      Date.now(),
      coinsReferrer:  referrerCoinsGain,
      coinsReferred:  COINS_REFERRED,
      milestoneBonus: milestone ? true : undefined,
    });

    return {
      success:          true,
      coinsReferred:    COINS_REFERRED,
      coinsReferrer:    referrerCoinsGain,
      diamondsReferrer: referrerDiamondGain,
      milestoneReached: milestone ? milestone.count : null,
    };
  },
});

// ── getReferralStats ──────────────────────────────────────────────────────────
// Returns stats for the InviteModal: total count + recent referrals list
export const getReferralStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    const referralCount = user?.referralCount ?? 0;

    // Most recent 10 referrals
    const rows = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", userId))
      .order("desc")
      .take(10);

    const list = await Promise.all(
      rows.map(async (r) => {
        const u = await ctx.db.get(r.referredId);
        return {
          referredId:    r.referredId as string,
          username:      u?.username ?? null,
          name:          u?.name     ?? "Cuate",
          createdAt:     r.createdAt,
          coinsReferrer: r.coinsReferrer,
          milestone:     r.milestoneBonus ?? false,
        };
      })
    );

    // Next milestone info
    const nextMilestone = REFERRAL_MILESTONES.find((m) => m.count > referralCount)?.count ?? null;

    return {
      referralCount,
      nextMilestone,
      username: user?.username ?? null,
      list,
    };
  },
});
