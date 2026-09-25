// ── Reglas de racha y premio diario (puras, sin ctx) ────────────────────────
// Única fuente de verdad del premio diario: lo paga recordDailyPlay con la
// primera palabra del día, y getStreakStatus usa lo mismo para la vista previa.
// src/config/streakRewards.js refleja la tabla para textos del cliente.

export const PINATA_RANGE = [50, 200] as const;

/** Días completos sin jugar entre lastPlay y today (ayer → 0). */
export function daysMissedSince(lastPlay: string, today: string): number {
  if (!lastPlay) return 0;
  const lastMs = new Date(lastPlay + "T12:00:00Z").getTime();
  const todayMs = new Date(today + "T12:00:00Z").getTime();
  return Math.max(0, Math.round((todayMs - lastMs) / 86_400_000) - 1);
}

/** Racha que quedaría al jugar hoy (aplica escudos si alcanzan). */
export function projectStreak(args: {
  lastPlay: string;
  oldStreak: number;
  freezeCount: number;
  today: string;
}): { newStreak: number; freezesConsumed: number; daysMissed: number } {
  const { lastPlay, oldStreak, freezeCount, today } = args;
  const daysMissed = daysMissedSince(lastPlay, today);
  if (daysMissed === 0) {
    // Continua (jugó ayer) o primera partida
    return { newStreak: lastPlay ? oldStreak + 1 : 1, freezesConsumed: 0, daysMissed };
  }
  if (freezeCount >= daysMissed) {
    // Escudos suficientes para todos los días perdidos → la racha sobrevive
    return { newStreak: oldStreak + 1, freezesConsumed: daysMissed, daysMissed };
  }
  // Sin escudos suficientes → reinicia (los escudos NO se gastan)
  return { newStreak: 1, freezesConsumed: 0, daysMissed };
}

/** Posición 1-7 dentro del ciclo semanal de premios. */
export function streakCycleDay(streak: number): number {
  return ((Math.max(1, streak) - 1) % 7) + 1;
}

/** Premio diario al alcanzar `streak`: días 1-6 → 5 + 5·día; día 7 → piñata aleatoria. */
export function rollDailyStreakReward(
  streak: number,
  random: () => number = Math.random
): { coins: number; isPinata: boolean } {
  const day = streakCycleDay(streak);
  if (day < 7) return { coins: 5 + day * 5, isPinata: false };
  const [min, max] = PINATA_RANGE;
  return { coins: Math.floor(random() * (max - min + 1)) + min, isPinata: true };
}

/** Vista previa (sin azar) del premio de hoy para `streak`. */
export function previewDailyStreakReward(streak: number): {
  cycleDay: number;
  coins: number | null;
  isPinata: boolean;
  pinataRange: readonly [number, number];
} {
  const cycleDay = streakCycleDay(streak);
  const isPinata = cycleDay === 7;
  return { cycleDay, coins: isPinata ? null : 5 + cycleDay * 5, isPinata, pinataRange: PINATA_RANGE };
}
