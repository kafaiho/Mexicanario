import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureAdultPack } from "./seedAdultWords";

// ─── Catalog ──────────────────────────────────────────────────────────────────
// Items that can be bought with coins or diamonds (not real money)
export const COIN_ITEMS: Record<string, { label: string; currency: "coins" | "diamonds"; price: number; category: string }> = {
  hint_x5:            { label: "Pistas x5",             currency: "coins",    price: 100,  category: "powerups" },
  reveal_x3:          { label: "Revelar x3",            currency: "coins",    price: 200,  category: "powerups" },
  complete_x1:        { label: "Completar x1",          currency: "coins",    price: 400,  category: "powerups" },
  synonym_x5:         { label: "Pista frase x5",        currency: "coins",    price: 150,  category: "powerups" },
  pet_food_x5:        { label: "Comida x5",             currency: "coins",    price: 80,   category: "mascota"  },
  pet_toy:            { label: "Juguete",                currency: "diamonds", price: 3,    category: "mascota"  },
  pet_candy:          { label: "Dulce especial",        currency: "diamonds", price: 5,    category: "mascota"  },
  streak_freeze_coins:{ label: "Protector de Racha",    currency: "coins",    price: 400,  category: "streak"   },
  skin_mariachi:      { label: "Traje de Mariachi",     currency: "coins",    price: 1500, category: "skins"    },
  skin_charro:        { label: "Charro de Jalisco",     currency: "coins",    price: 2000, category: "skins"    },
  skin_lucha:         { label: "Luchador Enmascarado",  currency: "coins",    price: 2500, category: "skins"    },
  skin_catrina:       { label: "La Catrina",            currency: "coins",    price: 3500, category: "skins"    },
  skin_azteca:        { label: "Guerrero Azteca",       currency: "coins",    price: 5000, category: "skins"    },
  content_insultos:   { label: "Insultos Finos",        currency: "coins",    price: 1000, category: "adulto"   },
  content_suegra:     { label: "Diccionario de la Suegra", currency: "coins", price: 1000, category: "adulto"   },
};

// IAP products (real money) — RevenueCat product IDs
export const IAP_ITEMS: Record<string, { label: string; currency: "real"; coins?: number; diamonds?: number; rcProductId: string }> = {
  coins_500:    { label: "500 Monedas",    currency: "real", coins: 500,    rcProductId: "mx_coins_500"    },
  coins_1200:   { label: "1200 Monedas",   currency: "real", coins: 1200,   rcProductId: "mx_coins_1200"   },
  coins_2000:   { label: "2000 Monedas",   currency: "real", coins: 2000,   rcProductId: "mx_coins_2000"   },
  diamonds_100: { label: "100 Diamantes",  currency: "real", diamonds: 100, rcProductId: "mx_diamonds_100" },
  diamonds_300: { label: "300 Diamantes",  currency: "real", diamonds: 300, rcProductId: "mx_diamonds_300" },
  diamonds_800: { label: "800 Diamantes",  currency: "real", diamonds: 800, rcProductId: "mx_diamonds_800" },
  pass_mexica:  { label: "Pase Mexica",    currency: "real", coins: 1200, diamonds: 17, rcProductId: "mx_season_pass" },
};

const FREE_COINS_AMOUNT = 10;
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
      .filter((q) => q.eq(q.field("userId"), args.userId))
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
export const claimFreeCoins = mutation({
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
export const buyWithCoins = mutation({
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
        hint_x5:     "hints",
        reveal_x3:   "hints",   // reuse hints slot for reveal
        complete_x1: "completes",
        synonym_x5:  "synonyms",
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
    } else if (item.category === "adulto") {
      // Auto-sembrar palabras del pack si aún no existen en la BD
      const pack = args.itemId === "content_insultos" ? "insultos" : "suegra";
      await ensureAdultPack(ctx, pack);
      // Unlock adult content category
      const currentUnlocked: string[] = (user as any).adultContentUnlocked ?? [];
      if (!currentUnlocked.includes(args.itemId)) {
        await ctx.db.patch(args.userId, { adultContentUnlocked: [...currentUnlocked, args.itemId] } as any);
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
export const applyIAPPurchase = mutation({
  args: {
    userId: v.id("users"),
    itemId: v.string(),
    receiptToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const item = IAP_ITEMS[args.itemId];
    if (!item) throw new Error("IAP item no encontrado: " + args.itemId);

    const now = Date.now();
    const patch: Record<string, number> = {};
    if (item.coins) patch.coins = user.coins + item.coins;
    if (item.diamonds) patch.diamonds = user.diamonds + item.diamonds;

    await ctx.db.patch(args.userId, patch as any);

    await ctx.db.insert("purchases", {
      userId: args.userId,
      itemId: args.itemId,
      type: "iap",
      amount: (item.coins ?? 0) + (item.diamonds ?? 0),
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
        .filter((q) => q.eq(q.field("userId"), args.userId))
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

    return { success: true, coins: patch.coins ?? user.coins, diamonds: patch.diamonds ?? user.diamonds };
  },
});

/** Use a power-up from inventory (called from GameplayScreen) */
export const usePowerup = mutation({
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
 * Sync the "Mexicanario Pro" entitlement status from RevenueCat to the database.
 * Called after paywall completion, purchase restoration, or customerInfo listener
 * updates (subscription renewals / lapses).
 *
 * Pass expiresAt as the epoch ms expiry from RevenueCat's entitlement.expirationDate,
 * or omit/pass 0 to mark the subscription as inactive.
 */
export const syncMexPlusEntitlement = mutation({
  args: {
    userId:    v.id("users"),
    expiresAt: v.optional(v.number()), // epoch ms; omit or 0 → not active
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(args.userId, { mexPlusExpiresAt: args.expiresAt ?? 0 } as any);
    return { success: true };
  },
});

// ─── Gift reward (every 4 tacos) ──────────────────────────────────────────────
const TACOS_PER_GIFT = 4;
const GIFT_REWARD_COINS = 100;

export const claimGiftReward = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Usuario no encontrado");

    const tacos = (user as any).tacos ?? 0;
    const lastClaimed = (user as any).lastGiftClaimed ?? 0;
    const nextRewardAt = lastClaimed + TACOS_PER_GIFT;

    if (tacos < nextRewardAt) {
      throw new Error(`Necesitas ${nextRewardAt - tacos} tacos mas`);
    }

    // Give coins and update lastGiftClaimed
    const newCoins = (user.coins || 0) + GIFT_REWARD_COINS;
    await ctx.db.patch(args.userId, {
      coins: newCoins,
      lastGiftClaimed: nextRewardAt,
    } as any);

    return {
      success: true,
      coinsAwarded: GIFT_REWARD_COINS,
      newCoins,
      nextRewardAt: nextRewardAt + TACOS_PER_GIFT,
    };
  },
});
