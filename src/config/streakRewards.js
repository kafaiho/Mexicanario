// ── Streak rewards & copy (client mirror) ───────────────────────────────────
// Convex cannot import from src/, so the reward math below mirrors
// convex/streakMath.ts (premio diario unificado) and convex/streaks.ts
// (MILESTONE_REWARDS). Keep them in sync.

const STREAK_MILESTONES = [
  { days: 7, diamonds: 35, petStage: "Cría 🫧" },
  { days: 14, diamonds: 140, petStage: "Juvenil 🦎" },
  { days: 30, diamonds: 210, petStage: "Guardián ✨" },
  { days: 50, diamonds: 350, petStage: "Mítico 🐉" },
  { days: 100, diamonds: 500 },
  { days: 365, diamonds: 2000 },
];

/** Position (1-7) of a streak inside the weekly reward cycle. */
function getStreakCycleDay(streak) {
  if (!streak || streak < 1) return 0;
  return ((streak - 1) % 7) + 1;
}

/** Daily coin reward for reaching `streak` days. Day 7 of each cycle is a piñata (50-200, random). */
function getDailyStreakReward(streak) {
  const day = getStreakCycleDay(streak);
  if (day === 0) return { coins: 0, isPinata: false };
  if (day === 7) return { coins: null, isPinata: true };
  return { coins: 5 + day * 5, isPinata: false };
}

function getMilestoneForDay(streak) {
  return STREAK_MILESTONES.find((m) => m.days === streak) ?? null;
}

/**
 * Progress toward the next milestone, measured from the previous one.
 * Returns null once every milestone is behind the player.
 */
function getNextMilestoneProgress(streak) {
  const s = Math.max(0, streak || 0);
  const next = STREAK_MILESTONES.find((m) => m.days > s);
  if (!next) return null;
  const prevIdx = STREAK_MILESTONES.indexOf(next) - 1;
  const from = prevIdx >= 0 ? STREAK_MILESTONES[prevIdx].days : 0;
  return {
    milestone: next,
    daysLeft: next.days - s,
    progress: (s - from) / (next.days - from),
    progressBefore: Math.max(0, s - 1 - from) / (next.days - from),
  };
}

function getStreakPhrase(s) {
  if (s <= 0) return "¡Ándale, empiézale! 👊 Hoy es tu día cero, ¡mañana ya vas con todo!";
  if (s === 1) return "¡Ya arrancaste, pa'rriba! 🔥 ¡El primer paso es el que más cuesta!";
  if (s === 2) return "¡Dos días pa'dentro! 🌶️ ¡Ya te picó el gusto, cuate, no pares!";
  if (s === 3) return "¡Tres días y sin parar! ✨ ¡Ya te enganchaste, wey, tú puedes!";
  if (s <= 6) return `¡${s} días, qué neto! 🤙 ¡Estás que ardes, sigue así!`;
  if (s === 7) return "🎉 ¡Una semana enterita! ¡Te ganaste un taco de campeón, cuate!";
  if (s <= 13) return `¡${s} días! 💥 ¡Eres más neto que el pozole de un domingo!`;
  if (s === 14) return "🏆 ¡Dos semanas! ¡Qué chido eres, ya eres de los meros meros!";
  if (s <= 29) return `¡${s} días! 🚀 ¡Eso sí está de pelos, no te vayas a rajar!`;
  if (s === 30) return "🥇 ¡Un mes entero! ¡Eso se celebra con tamales y atole, campeón!";
  if (s <= 49) return `¡${s} días! 🔥 ¡Más picante que el chile de tu abuela, no te rajes!`;
  if (s === 50) return "🌈 ¡50 días! ¡Ya eres leyenda pura de Mexicanario, compa!";
  return `¡${s} días! 🌮 ¡Más neto que el jitomate del mercado, sigue echándole!`;
}

module.exports = {
  STREAK_MILESTONES,
  getStreakCycleDay,
  getDailyStreakReward,
  getMilestoneForDay,
  getNextMilestoneProgress,
  getStreakPhrase,
};
