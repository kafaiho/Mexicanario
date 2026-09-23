import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query, internalMutation } from "./_generated/server";
import { userMutation } from "./sessionAuth";

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
        const now = Date.now();
        if (!user.petType || !user.petName) return {
            hasPet: false,
            mexPlusActive: !!(user.mexPlusExpiresAt && user.mexPlusExpiresAt > now),
        };
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
            mexPlusActive: !!(user.mexPlusExpiresAt && user.mexPlusExpiresAt > now),
        };
    },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Choose a pet type and name — hatches the egg.
 */
export const choosePet = userMutation({
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
export const feedPet = internalMutation({
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
export const playWithPet = internalMutation({
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
export const resetPet = userMutation({
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

// ─── Compras con Diamantes ──────────────────────────────────────────────────

/**
 * Buy premium food with diamonds. Instantly increases the invisible bond (vínculo).
 * Food types: taco (cost 10, bond +5), tamal (cost 25, bond +15), pan_muerto (cost 50, bond +35)
 */
export const buyPetFood = userMutation({
    args: { userId: v.string(), foodType: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return { success: false, error: "Usuario no encontrado" };
        if (!user.petType) return { success: false, error: "Sin mascota" };

        let cost = 0;
        let bondIncrease = 0;

        switch (args.foodType) {
            case "taco":
                cost = 10;
                bondIncrease = 5;
                break;
            case "tamal":
                cost = 25;
                bondIncrease = 15;
                break;
            case "pan_muerto":
                cost = 50;
                bondIncrease = 35;
                break;
            default:
                return { success: false, error: "Comida no válida" };
        }

        if ((user.diamonds ?? 0) < cost) {
            return { success: false, error: "Diamantes insuficientes" };
        }

        const currentVinculo = user.petVinculo ?? 0;
        const newVinculo = Math.min(2000, currentVinculo + bondIncrease);

        await ctx.db.patch(user._id, {
            diamonds: (user.diamonds ?? 0) - cost,
            petVinculo: newVinculo,
        } as any);

        return { success: true, newVinculo };
    },
});

// ─── Vínculo invisible ────────────────────────────────────────────────────────

/**
 * Sync the invisible bond value from the client Zustand store.
 * Called when the app closes or every ~2 minutes in background.
 * NOT called on every game action to avoid saturating the backend.
 */
export const syncVinculo = internalMutation({
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
export const gainPetXp = userMutation({
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

// ─── Multi-mascota system ──────────────────────────────────────────────────────

const DEFAULT_PET_NAMES: Record<string, string> = {
    ajolote: "Ajolote",
    xolo: "Xolo",
    alebrije: "Alebrije",
};

/**
 * Returns the saved slot data for all 3 pet types, including the current active pet.
 * Used to render the pet-switcher UI.
 */
export const getPetSlots = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return null;

        const slots: Record<string, any> = JSON.parse((user as any).petSlots || "{}");

        // Always reflect the live active pet data in its slot
        if (user.petType) {
            slots[user.petType] = {
                name: user.petName ?? DEFAULT_PET_NAMES[user.petType] ?? user.petType,
                xp: user.petXp ?? 0,
                stage: user.petStage ?? 1,
                hungerBase: user.petHungerBase ?? 100,
                lastFed: user.petLastFed ?? Date.now(),
                happinessBase: user.petHappinessBase ?? 100,
                lastPlayed: user.petLastPlayed ?? Date.now(),
                bornAt: user.petBornAt ?? Date.now(),
                vinculo: user.petVinculo ?? 0,
            };
        }

        return { activePetType: user.petType ?? null, slots };
    },
});

/**
 * Switch to a different pet type, preserving each pet's individual progress.
 * Saves the current pet's stats (including local vinculo) then restores the new pet's stats.
 */
export const switchActivePet = userMutation({
    args: {
        userId: v.string(),
        newPetType: v.string(),   // "ajolote" | "xolo" | "alebrije"
        currentVinculo: v.number(),   // latest vinculo from client Zustand store
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId as Id<"users">);
        if (!user) return { success: false, error: "Usuario no encontrado" };

        // Already on this pet
        if (user.petType === args.newPetType) {
            return { success: true, alreadyActive: true, vinculo: args.currentVinculo };
        }

        const now = Date.now();
        const currentType = user.petType ?? "ajolote";

        // Parse saved slots
        const slots: Record<string, any> = JSON.parse((user as any).petSlots || "{}");

        // Save current active pet's data into its slot
        if (currentType) {
            slots[currentType] = {
                name: user.petName ?? DEFAULT_PET_NAMES[currentType],
                xp: user.petXp ?? 0,
                stage: user.petStage ?? 1,
                hungerBase: user.petHungerBase ?? 100,
                lastFed: user.petLastFed ?? now,
                happinessBase: user.petHappinessBase ?? 100,
                lastPlayed: user.petLastPlayed ?? now,
                bornAt: user.petBornAt ?? now,
                vinculo: args.currentVinculo,
            };
        }

        // Restore (or initialize) the new pet's data
        const saved = slots[args.newPetType];
        const newName = saved?.name ?? DEFAULT_PET_NAMES[args.newPetType] ?? args.newPetType;
        const newVinculo = saved?.vinculo ?? 0;

        const patch: Record<string, any> = {
            petType: args.newPetType,
            petName: newName,
            petXp: saved?.xp ?? 0,
            petStage: saved?.stage ?? 1,
            petHungerBase: saved?.hungerBase ?? 100,
            petLastFed: saved?.lastFed ?? now,
            petHappinessBase: saved?.happinessBase ?? 100,
            petLastPlayed: saved?.lastPlayed ?? now,
            petBornAt: saved?.bornAt ?? now,
            petVinculo: newVinculo,
            petSlots: JSON.stringify(slots),
        };

        await ctx.db.patch(user._id, patch as any);
        return { success: true, vinculo: newVinculo, petName: newName };
    },
});
