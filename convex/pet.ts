import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Constants ────────────────────────────────────────────────────────────────
const HUNGER_DECAY_PER_HOUR = 8;      // points per hour
const HAPPINESS_DECAY_PER_HOUR = 4;   // points per hour
const FEED_COST_COINS = 20;
const FEED_HUNGER_RESTORE = 45;
const FEED_XP = 5;
const PLAY_HAPPINESS_RESTORE = 25;
const PLAY_XP = 3;
const PLAY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const LEVEL_COMPLETE_XP = 25;

// XP needed to reach each stage (total accumulated XP)
const STAGE_XP_THRESHOLDS = [0, 0, 200, 600, 1500]; // index = stage

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeHunger(base: number, lastFed: number, now: number): number {
    const hoursElapsed = (now - lastFed) / (1000 * 60 * 60);
    return Math.max(0, Math.min(100, base - hoursElapsed * HUNGER_DECAY_PER_HOUR));
}

function computeHappiness(base: number, lastPlayed: number, now: number): number {
    const hoursElapsed = (now - lastPlayed) / (1000 * 60 * 60);
    return Math.max(0, Math.min(100, base - hoursElapsed * HAPPINESS_DECAY_PER_HOUR));
}

function computeStage(xp: number): number {
    if (xp >= STAGE_XP_THRESHOLDS[4]) return 4;
    if (xp >= STAGE_XP_THRESHOLDS[3]) return 3;
    if (xp >= STAGE_XP_THRESHOLDS[2]) return 2;
    return 1;
}

function xpToNextStage(currentStage: number, currentXp: number): { needed: number; have: number } {
    if (currentStage >= 4) return { needed: 0, have: 0 };
    const threshold = STAGE_XP_THRESHOLDS[currentStage + 1];
    return { needed: threshold, have: currentXp };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get the computed pet state for a user.
 * Returns null if no pet chosen yet.
 */
export const getPetState = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return null;

        // No pet chosen yet
        if (!user.petType || !user.petName) return { hasPet: false };

        const now = Date.now();
        const hunger = computeHunger(
            user.petHungerBase ?? 100,
            user.petLastFed ?? now,
            now
        );
        const happiness = computeHappiness(
            user.petHappinessBase ?? 100,
            user.petLastPlayed ?? now,
            now
        );
        const xp = user.petXp ?? 0;
        const stage = computeStage(xp);
        const { needed, have } = xpToNextStage(stage, xp);
        const canPlay = !user.petLastPlayed || (now - user.petLastPlayed) >= PLAY_COOLDOWN_MS;

        return {
            hasPet: true,
            petType: user.petType,
            petName: user.petName,
            stage,
            xp,
            xpToNext: needed - have,
            xpNeeded: needed,
            hunger: Math.round(hunger),
            happiness: Math.round(happiness),
            bornAt: user.petBornAt ?? now,
            canPlay,
            coins: user.coins,
        };
    },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Choose a pet type and name — hatches the egg.
 */
export const choosePet = mutation({
    args: {
        userId: v.string(),
        petType: v.string(),   // "ajolote" | "xolo" | "alebrije"
        petName: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return { success: false, error: "Usuario no encontrado" };
        if (user.petType) return { success: false, error: "Ya tienes una mascota" };

        const now = Date.now();
        await ctx.db.patch(user._id, {
            petType: args.petType,
            petName: args.petName.trim().slice(0, 20),
            petStage: 1,
            petXp: 0,
            petHungerBase: 100,
            petLastFed: now,
            petHappinessBase: 100,
            petLastPlayed: now,
            petBornAt: now,
        });
        return { success: true };
    },
});

/**
 * Feed the pet — costs 20 monedas, restores hunger, gives XP.
 */
export const feedPet = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return { success: false, error: "Usuario no encontrado" };
        if (!user.petType) return { success: false, error: "Sin mascota" };
        if ((user.coins ?? 0) < FEED_COST_COINS) return { success: false, error: "Monedas insuficientes" };

        const now = Date.now();
        const currentHunger = computeHunger(user.petHungerBase ?? 100, user.petLastFed ?? now, now);
        const newHunger = Math.min(100, currentHunger + FEED_HUNGER_RESTORE);
        const newXp = (user.petXp ?? 0) + FEED_XP;
        const newStage = computeStage(newXp);

        await ctx.db.patch(user._id, {
            coins: (user.coins ?? 0) - FEED_COST_COINS,
            petHungerBase: newHunger,
            petLastFed: now,
            petXp: newXp,
            petStage: newStage,
        });
        return { success: true, newHunger: Math.round(newHunger), newXp, newStage };
    },
});

/**
 * Play with the pet — free, 5-min cooldown, restores happiness, gives XP.
 */
export const playWithPet = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return { success: false, error: "Usuario no encontrado" };
        if (!user.petType) return { success: false, error: "Sin mascota" };

        const now = Date.now();
        const lastPlayed = user.petLastPlayed ?? 0;
        if (now - lastPlayed < PLAY_COOLDOWN_MS) {
            const waitMin = Math.ceil((PLAY_COOLDOWN_MS - (now - lastPlayed)) / 60000);
            return { success: false, error: `Espera ${waitMin} min más` };
        }

        const currentHappiness = computeHappiness(user.petHappinessBase ?? 100, lastPlayed, now);
        const newHappiness = Math.min(100, currentHappiness + PLAY_HAPPINESS_RESTORE);
        const newXp = (user.petXp ?? 0) + PLAY_XP;
        const newStage = computeStage(newXp);

        await ctx.db.patch(user._id, {
            petHappinessBase: newHappiness,
            petLastPlayed: now,
            petXp: newXp,
            petStage: newStage,
        });
        return { success: true, newHappiness: Math.round(newHappiness), newXp, newStage };
    },
});

/**
 * Reset/delete the current pet so the player can choose a new one.
 */
export const resetPet = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return { success: false };
        await ctx.db.patch(user._id, {
            petType: undefined,
            petName: undefined,
            petStage: undefined,
            petXp: undefined,
            petHungerBase: undefined,
            petLastFed: undefined,
            petHappinessBase: undefined,
            petLastPlayed: undefined,
            petBornAt: undefined,
            petVinculo: undefined,
        });
        return { success: true };
    },
});

// ─── Vínculo invisible ────────────────────────────────────────────────────────

/**
 * Sync the invisible bond value from the client Zustand store.
 * Called when the app closes or every ~2 minutes in background.
 * NOT called on every game action to avoid saturating the backend.
 */
export const syncVinculo = mutation({
    args: { userId: v.string(), vinculo: v.number() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return { success: false };
        const clamped = Math.max(0, Math.min(2000, args.vinculo));
        await ctx.db.patch(user._id, { petVinculo: clamped });
        return { success: true };
    },
});

/**
 * Get stored vínculo to hydrate the client Zustand store on login.
 */
export const getPetVinculo = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return { vinculo: 0 };
        return { vinculo: user.petVinculo ?? 0 };
    },
});

/**
 * Award pet XP when player completes a game level.
 * Called silently from GameplayScreen after a correct answer.
 */
export const gainPetXp = mutation({
    args: { userId: v.string(), xp: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user || !user.petType) return { success: false };

        const xpGain = args.xp ?? LEVEL_COMPLETE_XP;
        const newXp = (user.petXp ?? 0) + xpGain;
        const newStage = computeStage(newXp);
        const evolved = newStage > (user.petStage ?? 1);

        await ctx.db.patch(user._id, {
            petXp: newXp,
            petStage: newStage,
        });
        return { success: true, newXp, newStage, evolved };
    },
});
