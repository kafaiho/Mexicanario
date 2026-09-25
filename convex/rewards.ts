// ─────────────────────────────────────────────────────────────────────────────
// Premios y gastos de varos/diamantes que antes la app se sumaba sola con
// users.updateUserCurrency (cualquiera podía mandarse la cantidad que quisiera).
// Aquí el servidor decide cuánto vale cada cosa y cuántas veces se puede cobrar:
//
//   claimLevelReward   premio de la palabra/nivel: un boleto por nivel superado
//   spendCoins         pistas del juego, con precio del servidor
//   claimAdReward      40 varos por anuncio, con tope diario
//   spinWheel          la ruleta: el servidor elige el premio y lleva el cooldown
//   claimAchievement   cada logro una vez por cuenta, verificando la meta
// ─────────────────────────────────────────────────────────────────────────────
import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { userMutation } from "./sessionAuth";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** "2026-09-25" en hora del centro de México (UTC-6). */
export function dayIdCST(now = Date.now()): string {
  const d = new Date(now - 6 * HOUR);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// ── Premio por nivel ────────────────────────────────────────────────────────
/** Varos base de la palabra en la posición `level` (igual que calculateReward en GameplayScreen). */
export const levelCoinReward = (level: number) => 3 + Math.floor((Math.max(1, level) - 1) / 25);
export const ZONE_BONUS_COINS = 100; // terminar un tramo del camino
export const REWARD_TICKET_TTL = 30 * MINUTE;

/**
 * Tope de un boleto: moneda dorada (x2) + bono de tramo en niveles; en el
 * repaso de palabras falladas no hay bono de tramo.
 */
export function rewardCap(ticket: { kind: "level" | "review"; level: number; diamonds: number }) {
  const base = levelCoinReward(ticket.level);
  return {
    coins: base * 2 + (ticket.kind === "level" ? ZONE_BONUS_COINS : 0),
    diamonds: Math.max(0, ticket.diamonds),
  };
}

/** Lo llaman completeLevel y resolveWord: deja un boleto de premio de un solo uso. */
export function rewardTicketPatch(kind: "level" | "review", level: number, diamonds: number, now = Date.now()) {
  return { rewardTicket: { kind, level, diamonds, issuedAt: now } };
}

export const claimLevelReward = userMutation({
  args: { userId: v.id("users"), coins: v.number(), diamonds: v.number() },
  handler: async (ctx, args) => {
    const user: any = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("Usuario no encontrado");
    const ticket = user.rewardTicket;
    const now = Date.now();
    if (!ticket || now - ticket.issuedAt > REWARD_TICKET_TTL) {
      return { coinsGranted: 0, diamondsGranted: 0 };
    }
    const cap = rewardCap(ticket);
    const coins = Math.max(0, Math.min(Math.floor(args.coins), cap.coins));
    const diamonds = Math.max(0, Math.min(Math.floor(args.diamonds), cap.diamonds));
    await ctx.db.patch(args.userId, {
      coins: (user.coins ?? 0) + coins,
      diamonds: (user.diamonds ?? 0) + diamonds,
      rewardTicket: undefined,
    } as any);
    return { coinsGranted: coins, diamondsGranted: diamonds };
  },
});

// ── Gastos del juego ────────────────────────────────────────────────────────
// Deben coincidir con HINT_COST, SYNONYM_COST, BORRAR_COST y VERIFICAR_COST de
// GameplayScreen (lo verifica convex/rewards.test.ts).
export const SPEND_PRICES: Record<string, number> = {
  hint: 25,       // revela 1 letra
  synonym: 30,    // muestra la definición
  borrar: 75,     // ilumina las letras de la palabra en el teclado
  verificar: 200, // completa todo
};

export const spendCoins = userMutation({
  args: { userId: v.id("users"), item: v.string() },
  handler: async (ctx, args) => {
    const price = SPEND_PRICES[args.item];
    if (!price) throw new ConvexError("Ese truco no existe.");
    const user: any = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("Usuario no encontrado");
    if ((user.coins ?? 0) < price) throw new ConvexError("Saldo insuficiente");
    await ctx.db.patch(args.userId, { coins: user.coins - price } as any);
    return { spent: price, coins: user.coins - price };
  },
});

// ── Anuncios con premio ─────────────────────────────────────────────────────
export const AD_REWARD_COINS = 40;
export const AD_REWARDS_PER_DAY = 15;
export const AD_MIN_GAP_MS = 20 * 1000; // un anuncio dura más que esto

/** ¿Se puede pagar otro anuncio? Devuelve el nuevo contador del día o un motivo. */
export function nextAdCount(user: any, now = Date.now()): { ok: true; count: number } | { ok: false; reason: string } {
  const today = dayIdCST(now);
  const count = user?.adRewardDay === today ? (user?.adRewardCount ?? 0) : 0;
  if (count >= AD_REWARDS_PER_DAY) return { ok: false, reason: "Ya viste todos los anuncios con premio de hoy. ¡Vuelve mañana!" };
  if (now - (user?.lastAdRewardAt ?? 0) < AD_MIN_GAP_MS) return { ok: false, reason: "Espera un momento antes del siguiente anuncio." };
  return { ok: true, count: count + 1 };
}

export const claimAdReward = userMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user: any = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("Usuario no encontrado");
    const now = Date.now();
    const next = nextAdCount(user, now);
    if ("reason" in next) throw new ConvexError(next.reason);
    await ctx.db.patch(args.userId, {
      coins: (user.coins ?? 0) + AD_REWARD_COINS,
      adRewardDay: dayIdCST(now),
      adRewardCount: next.count,
      lastAdRewardAt: now,
    } as any);
    return { coinsGranted: AD_REWARD_COINS, remainingToday: AD_REWARDS_PER_DAY - next.count };
  },
});

// ── Ruleta ──────────────────────────────────────────────────────────────────
// Mismo orden que SEGMENTS en src/components/WheelModal.jsx (lo verifica rewards.test.ts).
export const WHEEL_SEGMENTS = [
  { coins: 0, diamonds: 3 },
  { coins: 60, diamonds: 0 },
  { coins: 40, diamonds: 0 },
  { coins: 0, diamonds: 1 },
  { coins: 70, diamonds: 0 },
  { coins: 30, diamonds: 0 },
  { coins: 0, diamonds: 5 },
  { coins: 45, diamonds: 0 },
];
export const WHEEL_FREE_COOLDOWN_MS = 24 * HOUR;
export const WHEEL_AD_SPINS_PER_DAY = 3;

export function wheelState(user: any, now = Date.now()) {
  const today = dayIdCST(now);
  const adSpinsUsed = user?.wheelAdDay === today ? (user?.wheelAdCount ?? 0) : 0;
  return {
    freeReadyAt: (user?.wheelFreeSpunAt ?? 0) + WHEEL_FREE_COOLDOWN_MS,
    adSpinsLeft: Math.max(0, WHEEL_AD_SPINS_PER_DAY - adSpinsUsed),
  };
}

export const spinWheel = userMutation({
  args: { userId: v.id("users"), mode: v.union(v.literal("free"), v.literal("ad")) },
  handler: async (ctx, args) => {
    const user: any = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("Usuario no encontrado");
    const now = Date.now();
    const state = wheelState(user, now);
    const patch: Record<string, unknown> = {};
    if (args.mode === "free") {
      if (state.freeReadyAt > now) throw new ConvexError("La ruleta gratis todavía no está lista.");
      patch.wheelFreeSpunAt = now;
    } else {
      if (state.adSpinsLeft <= 0) throw new ConvexError("Ya usaste los giros con anuncio de hoy.");
      patch.wheelAdDay = dayIdCST(now);
      patch.wheelAdCount = WHEEL_AD_SPINS_PER_DAY - state.adSpinsLeft + 1;
    }
    const segmentIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const prize = WHEEL_SEGMENTS[segmentIndex];
    patch.coins = (user.coins ?? 0) + prize.coins;
    patch.diamonds = (user.diamonds ?? 0) + prize.diamonds;
    await ctx.db.patch(args.userId, patch as any);
    return { segmentIndex, ...prize, ...wheelState({ ...user, ...patch }, now) };
  },
});

// ── Logros ──────────────────────────────────────────────────────────────────
// Mismos ids y premios que AchievementsScreen (lo verifica rewards.test.ts).
// `check`: meta que el servidor puede comprobar con los datos del jugador.
// Sin `check` (colecciones y regiones) se confía en la app, pero solo se cobra una vez.
type Stat = "words" | "streak" | "level" | "combo" | "perfect";
type AchievementReward = { coins: number; diamonds: number; check?: [Stat, number]; never?: boolean };
export const ACHIEVEMENT_REWARDS: Record<string, AchievementReward> = {
  primer_taco: { coins: 25, diamonds: 0, check: ["words", 1] },
  diez_palabras: { coins: 50, diamonds: 0, check: ["words", 10] },
  cincuenta_palabras: { coins: 150, diamonds: 1, check: ["words", 50] },
  cien_palabras: { coins: 300, diamonds: 2, check: ["words", 100] },
  doscientas_palabras: { coins: 500, diamonds: 4, check: ["words", 200] },
  quinientas_palabras: { coins: 700, diamonds: 5, check: ["words", 500] },
  mil_palabras: { coins: 1500, diamonds: 12, check: ["words", 1000] },
  racha_3: { coins: 75, diamonds: 1, check: ["streak", 3] },
  racha_7: { coins: 200, diamonds: 2, check: ["streak", 7] },
  racha_14: { coins: 350, diamonds: 3, check: ["streak", 14] },
  racha_30: { coins: 500, diamonds: 5, check: ["streak", 30] },
  racha_60: { coins: 800, diamonds: 7, check: ["streak", 60] },
  racha_100: { coins: 1500, diamonds: 12, check: ["streak", 100] },
  primera_coleccion: { coins: 200, diamonds: 2 },
  cincuenta_cartas: { coins: 400, diamonds: 3, check: ["words", 50] },
  cien_cartas: { coins: 600, diamonds: 5, check: ["words", 100] },
  cinco_colecciones: { coins: 500, diamonds: 5 },
  nivel_perfecto: { coins: 150, diamonds: 2, check: ["perfect", 1] },
  nivel_50: { coins: 600, diamonds: 5, check: ["level", 50] },
  nivel_100: { coins: 1000, diamonds: 10, check: ["level", 100] },
  nivel_150: { coins: 1800, diamonds: 14, check: ["level", 150] },
  nivel_200: { coins: 3000, diamonds: 20, check: ["level", 200] },
  combo_3: { coins: 75, diamonds: 1, check: ["combo", 3] },
  combo_5: { coins: 200, diamonds: 2, check: ["combo", 5] },
  combo_10: { coins: 400, diamonds: 4, check: ["combo", 10] },
  tres_perfectos: { coins: 250, diamonds: 3, check: ["perfect", 3] },
  diez_perfectos: { coins: 700, diamonds: 6, check: ["perfect", 10] },
  veinticinco_perfectos: { coins: 1200, diamonds: 10, check: ["perfect", 25] },
  foodie_mx: { coins: 120, diamonds: 1 },
  mariachi_fan: { coins: 120, diamonds: 1 },
  historia_viva: { coins: 150, diamonds: 1 },
  mundo_digital: { coins: 200, diamonds: 2 },
  chilango_mx: { coins: 250, diamonds: 2 },
  norteno_mx: { coins: 250, diamonds: 2 },
  jarocho_mx: { coins: 250, diamonds: 2 },
  "tapatío_mx": { coins: 250, diamonds: 2 },
  invitar_3: { coins: 200, diamonds: 2, never: true },  // la app aún no cuenta invitaciones
  invitar_10: { coins: 500, diamonds: 5, never: true },
};

/** Valor de cada estadística, calculado igual que en AchievementsScreen. */
export function achievementStat(user: any, stat: Stat): number {
  const level = user?.currentLevel ?? 1;
  switch (stat) {
    case "words": return Math.max(0, level - 1);
    case "level": return level;
    case "streak": return Math.max(user?.playStreakMax ?? 0, user?.playStreak ?? 0);
    case "combo": return user?.bestCombo ?? 0;
    case "perfect": return user?.perfectLevels ?? 0;
  }
}

export const claimAchievement = userMutation({
  args: { userId: v.id("users"), achievementId: v.string() },
  handler: async (ctx, args) => {
    const reward = ACHIEVEMENT_REWARDS[args.achievementId];
    if (!reward || reward.never) throw new ConvexError("Ese logro no existe.");
    const user: any = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("Usuario no encontrado");
    const claimed: string[] = user.claimedAchievements ?? [];
    if (claimed.includes(args.achievementId)) throw new ConvexError("Ya reclamaste este logro.");
    if (reward.check && achievementStat(user, reward.check[0]) < reward.check[1]) {
      throw new ConvexError("Todavía no completas este logro.");
    }
    await ctx.db.patch(args.userId, {
      coins: (user.coins ?? 0) + reward.coins,
      diamonds: (user.diamonds ?? 0) + reward.diamonds,
      claimedAchievements: [...claimed, args.achievementId],
    } as any);
    return { coinsGranted: reward.coins, diamondsGranted: reward.diamonds };
  },
});

/**
 * Logros que el teléfono ya había cobrado cuando se guardaban solo en el
 * teléfono: se anotan en la cuenta sin volver a pagarlos.
 */
export const syncClaimedAchievements = userMutation({
  args: { userId: v.id("users"), achievementIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const user: any = await ctx.db.get(args.userId);
    if (!user) return null;
    const claimed: string[] = user.claimedAchievements ?? [];
    const add = args.achievementIds.filter((id) => ACHIEVEMENT_REWARDS[id] && !claimed.includes(id));
    if (add.length) await ctx.db.patch(args.userId, { claimedAchievements: [...claimed, ...add] } as any);
    return null;
  },
});

// ── Estado para la app ──────────────────────────────────────────────────────
export const getRewardState = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user: any = await ctx.db.get(args.userId);
    if (!user) return null;
    const now = Date.now();
    const ad = nextAdCount({ ...user, lastAdRewardAt: 0 }, now);
    return {
      wheel: wheelState(user, now),
      adRewardsLeft: ad.ok ? AD_REWARDS_PER_DAY - ad.count + 1 : 0,
      claimedAchievements: (user.claimedAchievements ?? []) as string[],
    };
  },
});
