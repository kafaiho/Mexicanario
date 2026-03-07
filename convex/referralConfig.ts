// ── Referral reward configuration ─────────────────────────────────────────────
// Shared between referrals.ts (claimReferral mutation) and friends.ts (registerAccount)
// Edit ONLY this file to change reward amounts.

export const COINS_REFERRED  = 100;   // coins awarded to the referred user
export const COINS_REFERRER  = 200;   // base coins awarded to the referrer per new user

export const REFERRAL_MILESTONES: Array<{ count: number; coins: number; diamonds: number }> = [
  { count: 5,  coins: 500,   diamonds: 2  },
  { count: 10, coins: 1000,  diamonds: 5  },
  { count: 25, coins: 2000,  diamonds: 15 },
  { count: 50, coins: 3000,  diamonds: 30 },
];
