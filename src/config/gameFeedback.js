// ── Retroalimentación del juego (lógica pura, testeable) ────────────────────

/** Letras que no coinciden (ignora espacios y mayúsculas). */
function countLetterMisses(guess, answer) {
  const g = String(guess || "").toUpperCase();
  const a = String(answer || "").toUpperCase();
  let misses = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === " ") continue;
    if ((g[i] || "") !== a[i]) misses++;
  }
  return misses;
}

/** "¡Casi!": una sola letra mal en una palabra de al menos 4 letras. */
function isNearMiss(guess, answer) {
  const letters = String(answer || "").replace(/ /g, "").length;
  return letters >= 4 && countLetterMisses(guess, answer) === 1;
}

/**
 * XP por palabra acertada, desglosado para mostrarlo en la victoria.
 * Misma fórmula que antes vivía inline en GameplayScreen.
 */
function computeXpBreakdown({ isPerfect, combo = 0, streak = 0, completedLevels = 0, timeSeconds = Infinity }) {
  const parts = [{ key: "base", label: "Palabra", amount: 10 }];
  if (isPerfect) parts.push({ key: "perfect", label: "✨ Perfecto", amount: 15 });
  if (combo >= 3) parts.push({ key: "combo", label: `🔥 Combo x${combo}`, amount: Math.min(combo * 2, 20) });
  if (streak >= 3) parts.push({ key: "streak", label: "📅 Racha", amount: Math.min(streak, 10) });
  const session = (completedLevels >= 10 ? 5 : 0) + (completedLevels >= 20 ? 5 : 0);
  if (session > 0) parts.push({ key: "session", label: "🏃 Sesión larga", amount: session });
  const speed = timeSeconds <= 10 ? 5 : timeSeconds <= 20 ? 3 : timeSeconds <= 30 ? 1 : 0;
  if (speed > 0) parts.push({ key: "speed", label: "⚡ Rápido", amount: speed });
  return { total: parts.reduce((sum, p) => sum + p.amount, 0), parts };
}

// ── Moneda dorada: recompensa variable (x2 monedas) ──
// ~1 de cada 10 palabras, con protección de mala racha: nunca pasan más de
// GOLDEN_PITY palabras seguidas sin una.
const GOLDEN_CHANCE = 0.1;
const GOLDEN_PITY = 15;

/** @param wordsSinceLast palabras acertadas desde la última moneda dorada */
function rollGoldenCoin(wordsSinceLast, random = Math.random) {
  return wordsSinceLast + 1 >= GOLDEN_PITY || random() < GOLDEN_CHANCE;
}

module.exports = { countLetterMisses, isNearMiss, computeXpBreakdown, rollGoldenCoin, GOLDEN_CHANCE, GOLDEN_PITY };
