import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, query } from "./_generated/server";
import { userAction, userMutation } from "./sessionAuth";

// ─── Catalog ──────────────────────────────────────────────────────────────────
// Items that can be bought with coins or diamonds (not real money)
export const COIN_ITEMS: Record<string, { label: string; currency: "coins" | "diamonds"; price: number; category: string }> = {
  hint_x5: { label: "Pistas x5", currency: "coins", price: 100, category: "powerups" },
  reveal_x3: { label: "Revelar x3", currency: "coins", price: 200, category: "powerups" },
  complete_x1: { label: "Completar x1", currency: "coins", price: 400, category: "powerups" },
  synonym_x5: { label: "Pista frase x5", currency: "coins", price: 150, category: "powerups" },
  pet_food_x5: { label: "Comida x5", currency: "coins", price: 80, category: "mascota" },
  pet_toy: { label: "Juguete", currency: "diamonds", price: 3, category: "mascota" },
  pet_candy: { label: "Dulce especial", currency: "diamonds", price: 5, category: "mascota" },
  streak_freeze_coins: { label: "Protector de Racha", currency: "coins", price: 400, category: "streak" },
  skin_mariachi: { label: "Traje de Mariachi", currency: "coins", price: 1500, category: "skins" },
  skin_charro: { label: "Charro de Jalisco", currency: "coins", price: 2000, category: "skins" },
  skin_lucha: { label: "Luchador Enmascarado", currency: "coins", price: 2500, category: "skins" },
  skin_catrina: { label: "La Catrina", currency: "coins", price: 3500, category: "skins" },
  skin_azteca: { label: "Guerrero Azteca", currency: "coins", price: 5000, category: "skins" },
};

// IAP products (real money) — RevenueCat product IDs
export const IAP_ITEMS: Record<string, { label: string; currency: "real"; coins?: number; diamonds?: number; rcProductId: string }> = {
  coins_500: { label: "500 Monedas", currency: "real", coins: 500, rcProductId: "mx_coins_500" },
  coins_1200: { label: "1200 Monedas", currency: "real", coins: 1200, rcProductId: "mx_coins_1200" },
  coins_2000: { label: "2000 Monedas", currency: "real", coins: 2000, rcProductId: "mx_coins_2000" },
  diamonds_100: { label: "100 Diamantes", currency: "real", diamonds: 100, rcProductId: "mx_diamonds_100" },
  diamonds_300: { label: "300 Diamantes", currency: "real", diamonds: 300, rcProductId: "mx_diamonds_300" },
  diamonds_800: { label: "800 Diamantes", currency: "real", diamonds: 800, rcProductId: "mx_diamonds_800" },
  pass_mexica: { label: "Pase Mexica", currency: "real", coins: 1200, diamonds: 17, rcProductId: "mx_season_pass" },
};

const FREE_COINS_AMOUNT = 15;
const FREE_COINS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getShopState = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const now = Date.now();

    // Free coins cooldown
    const lastFree = (user as any).freeCoinsClaimedAt ?? 0;
    const freeCooldownRemaining = Math.max(0, lastFree + FREE_COINS_COOLDOWN_MS - now);

    // Season pass
    const passes = await ctx.db
      .query("seasonPass")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const activePass = passes.find((p) => p.expiresAt > now) ?? null;

    return {
      coins: user.coins,
      diamonds: user.diamonds,
      powerups: (user as any).powerups ?? {},
      freeCooldownRemaining,
      streakFreezeCount: (user as any).streakFreezeCount ?? 0,
      activePass: activePass
        ? {
          passId: activePass.passId,
          expiresAt: activePass.expiresAt,
          rewardsClaimed: activePass.rewardsClaimed,
        }
        : null,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Claim the daily free 10 coins (24h cooldown) */
export const claimFreeCoins = userMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const lastFree = (user as any).freeCoinsClaimedAt ?? 0;
    if (now - lastFree < FREE_COINS_COOLDOWN_MS) {
      throw new Error("Cooldown activo — vuelve en 24h");
    }

    await ctx.db.patch(args.userId, {
      coins: user.coins + FREE_COINS_AMOUNT,
      freeCoinsClaimedAt: now,
    } as any);

    await ctx.db.insert("purchases", {
      userId: args.userId,
      itemId: "free_coins",
      type: "free",
      amount: FREE_COINS_AMOUNT,
      purchasedAt: now,
    });

    return { coinsAdded: FREE_COINS_AMOUNT, newTotal: user.coins + FREE_COINS_AMOUNT };
  },
});

/** Buy a power-up or mascota item with coins or diamonds */
export const buyWithCoins = userMutation({
  args: {
    userId: v.id("users"),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const item = COIN_ITEMS[args.itemId];
    if (!item) throw new Error("Item no encontrado: " + args.itemId);

    const now = Date.now();

    if (item.currency === "coins") {
      if (user.coins < item.price) throw new Error("Monedas insuficientes");
      await ctx.db.patch(args.userId, { coins: user.coins - item.price } as any);
    } else {
      if (user.diamonds < item.price) throw new Error("Diamantes insuficientes");
      await ctx.db.patch(args.userId, { diamonds: user.diamonds - item.price } as any);
    }

    // Handle special item categories
    if (item.category === "powerups") {
      const currentPowerups = (user as any).powerups ?? {};
      const inventoryKey: Record<string, string> = {
        hint_x5: "hints",
        reveal_x3: "hints",   // reuse hints slot for reveal
        complete_x1: "completes",
        synonym_x5: "synonyms",
      };
      const field = inventoryKey[args.itemId];
      const qty: Record<string, number> = {
        hint_x5: 5, reveal_x3: 3, complete_x1: 1, synonym_x5: 5,
      };
      if (field) {
        const updated = {
          ...currentPowerups,
          [field]: (currentPowerups[field] ?? 0) + (qty[args.itemId] ?? 1),
        };
        await ctx.db.patch(args.userId, { powerups: updated } as any);
      }
    } else if (item.category === "streak") {
      // Streak freeze via coins — acumular en contador
      const currentFreeze = (user as any).streakFreezeCount ?? 0;
      await ctx.db.patch(args.userId, { streakFreezeCount: currentFreeze + 1 } as any);
    } else if (item.category === "skins") {
      // Unlock skin — store in user's purchased skins list
      const currentSkins: string[] = (user as any).purchasedSkins ?? [];
      if (!currentSkins.includes(args.itemId)) {
        await ctx.db.patch(args.userId, { purchasedSkins: [...currentSkins, args.itemId] } as any);
      }
    }

    await ctx.db.insert("purchases", {
      userId: args.userId,
      itemId: args.itemId,
      type: item.currency,
      amount: item.price,
      purchasedAt: now,
    });

    return { success: true };
  },
});

/** Apply an IAP purchase (called after RevenueCat confirms payment) */
// ─── Real-money purchases (verified with RevenueCat) ──────────────────────────
// Store purchases are only credited after RevenueCat confirms the transaction for
// this player (RevenueCat app user id === Convex userId, see RevenueCatService.logIn).
const ENTITLEMENT_PLUS = "Mexicanario Pro";

async function fetchRevenueCatSubscriber(userId: string): Promise<any> {
  const secret = process.env.REVENUECAT_SECRET_API_KEY;
  if (!secret) throw new ConvexError("PAYMENTS_NOT_CONFIGURED");
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) throw new ConvexError("PAYMENTS_UNAVAILABLE");
  const body: any = await res.json();
  return body.subscriber ?? {};
}

/** Credits a store purchase after verifying its transaction with RevenueCat. */
export const applyIAPPurchase = userAction({
  args: {
    userId: v.id("users"),
    itemId: v.string(),
    transactionId: v.string(), // store transaction id from Purchases.purchasePackage
  },
  handler: async (ctx, args): Promise<{ success: boolean; coins: number; diamonds: number; coinsGranted: number; diamondsGranted: number; alreadyApplied?: boolean }> => {
    const item = IAP_ITEMS[args.itemId];
    if (!item) throw new ConvexError("IAP item no encontrado: " + args.itemId);
    const subscriber = await fetchRevenueCatSubscriber(args.userId);
    const transactions: any[] = [
      ...(subscriber.non_subscriptions?.[item.rcProductId] ?? []),
      ...(subscriber.subscriptions?.[item.rcProductId] ? [subscriber.subscriptions[item.rcProductId]] : []),
    ];
    const tx = transactions.find((t) => t?.store_transaction_id === args.transactionId || t?.id === args.transactionId);
    if (!tx) throw new ConvexError("PURCHASE_NOT_VERIFIED");
    return await ctx.runMutation(internal.shop.grantIAPPurchase, {
      userId: args.userId,
      itemId: args.itemId,
      receiptToken: String(tx.store_transaction_id ?? tx.id),
    });
  },
});

export const grantIAPPurchase = internalMutation({
  args: {
    userId: v.id("users"),
    itemId: v.string(),
    receiptToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const item = IAP_ITEMS[args.itemId];
    if (!item) throw new Error("IAP item no encontrado: " + args.itemId);

    // A verified transaction is credited once, no matter how often it is sent.
    const already = await ctx.db
      .query("purchases")
      .withIndex("by_receiptToken", (q) => q.eq("receiptToken", args.receiptToken))
      .first();
    if (already) {
      return { success: true, alreadyApplied: true, coins: user.coins, diamonds: user.diamonds, coinsGranted: 0, diamondsGranted: 0 };
    }

    const now = Date.now();
    const patch: Record<string, number> = {};

    // ── Bonus por código de creador (5% extra en varos) ──────────────────────
    let bonusCoins = 0;
    const creatorCode = (user as any).creatorCode as string | undefined;
    if (creatorCode && item.coins) {
      const codeDoc = await ctx.db
        .query("referralCodes")
        .withIndex("by_code", (q: any) => q.eq("code", creatorCode))
        .first();
      if (codeDoc && codeDoc.active) {
        bonusCoins = Math.floor(item.coins * (codeDoc.discountPct / 100));
        // Registrar compra atribuida al creador
        await ctx.db.patch(codeDoc._id, {
          totalPurchases: codeDoc.totalPurchases + 1,
        });
      }
    }

    if (item.coins) patch.coins = user.coins + item.coins + bonusCoins;
    if (item.diamonds) patch.diamonds = user.diamonds + item.diamonds;

    await ctx.db.patch(args.userId, patch as any);

    await ctx.db.insert("purchases", {
      userId: args.userId,
      itemId: args.itemId,
      type: "iap",
      amount: (item.coins ?? 0) + bonusCoins + (item.diamonds ?? 0),
      purchasedAt: now,
      receiptToken: args.receiptToken,
    });

    // If this is the season pass, create/update the pass record
    if (args.itemId === "pass_mexica") {
      // Expires at midnight of the first day of next month
      const d = new Date(now);
      const expiresAt = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const passId = `pass_mexica_${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}`;

      // Remove any existing non-expired passes
      const existing = await ctx.db
        .query("seasonPass")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      for (const p of existing) {
        await ctx.db.delete(p._id);
      }

      await ctx.db.insert("seasonPass", {
        userId: args.userId,
        passId,
        activatedAt: now,
        expiresAt,
        rewardsClaimed: true, // coins+diamonds already added above
      });
    }

    return {
      success: true,
      coins: patch.coins ?? user.coins,
      diamonds: patch.diamonds ?? user.diamonds,
      coinsGranted: item.coins ? item.coins + bonusCoins : 0,
      diamondsGranted: item.diamonds ?? 0,
    };
  },
});

/** Use a power-up from inventory (called from GameplayScreen) */
export const usePowerup = userMutation({
  args: {
    userId: v.id("users"),
    powerupType: v.string(), // "hints" | "skips" | "completes" | "synonyms"
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const powerups = (user as any).powerups ?? {};
    const current = powerups[args.powerupType] ?? 0;
    if (current <= 0) throw new Error("No tienes este power-up");

    const updated = { ...powerups, [args.powerupType]: current - 1 };
    await ctx.db.patch(args.userId, { powerups: updated } as any);

    return { remaining: current - 1 };
  },
});

/**
 * Refreshes the "Mexicanario Pro" entitlement from RevenueCat (server-side).
 * Called after paywall completion, purchase restoration, or customerInfo
 * listener updates (renewals / lapses). The client never sends the expiry.
 */
export const verifyMexPlusEntitlement = userAction({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<{ active: boolean; expiresAt: number }> => {
    const subscriber = await fetchRevenueCatSubscriber(args.userId);
    const entitlement = subscriber.entitlements?.[ENTITLEMENT_PLUS];
    let expiresAt = 0;
    if (entitlement) {
      // expires_date null = lifetime; keep it far in the future.
      expiresAt = entitlement.expires_date ? Date.parse(entitlement.expires_date) : Date.UTC(2100, 0, 1);
    }
    await ctx.runMutation(internal.shop.syncMexPlusEntitlement, { userId: args.userId, expiresAt });
    return { active: expiresAt > Date.now(), expiresAt };
  },
});

export const syncMexPlusEntitlement = internalMutation({
  args: {
    userId: v.id("users"),
    expiresAt: v.number(), // epoch ms; 0 → not active
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(args.userId, { mexPlusExpiresAt: args.expiresAt } as any);
    return { success: true };
  },
});

// ─── Gift reward (every 12 tacos, consumed on claim) ─────────────────────────
const TACOS_PER_GIFT = 12;
const GIFT_REWARD_COINS = 100;

export const claimGiftReward = userMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Usuario no encontrado");

    const tacos = (user as any).tacos ?? 0;

    if (tacos < TACOS_PER_GIFT) {
      throw new Error(`Necesitas ${TACOS_PER_GIFT - tacos} tacos mas`);
    }

    // Give coins and deduct tacos
    const newCoins = (user.coins || 0) + GIFT_REWARD_COINS;
    const newTacos = tacos - TACOS_PER_GIFT;
    await ctx.db.patch(args.userId, {
      coins: newCoins,
      tacos: newTacos,
    } as any);

    return {
      success: true,
      coinsAwarded: GIFT_REWARD_COINS,
      newCoins,
      tacosRemaining: newTacos,
    };
  },
});
