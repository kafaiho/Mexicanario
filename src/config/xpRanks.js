// ── 20-tier XP Ranking System ───────────────────────────────────────────────
// Tiers 1-6 align with the old 6-rank system to avoid demotivating existing
// players. Tiers 7-20 create long-term goals with exponential spacing.

export const XP_RANKS = [
  { min: 0,         max: 299,       title: "Principiante",          emoji: "🌱", color: "#8BC34A" },
  { min: 300,       max: 799,       title: "Aprendiz",              emoji: "📖", color: "#7CB87A" },
  { min: 800,       max: 1799,      title: "Conocedor",             emoji: "📚", color: "#4A90D9" },
  { min: 1800,      max: 3499,      title: "Explorador Cultural",   emoji: "🧭", color: "#FF9800" },
  { min: 3500,      max: 5999,      title: "Experto del Barrio",    emoji: "⭐", color: "#FFC107" },
  { min: 6000,      max: 9999,      title: "Maestro del Slang",     emoji: "🎓", color: "#C0392B" },
  { min: 10000,     max: 14999,     title: "Guardián del Lenguaje", emoji: "🛡️", color: "#2196F3" },
  { min: 15000,     max: 21999,     title: "Sabio Mexicano",        emoji: "🦅", color: "#9C27B0" },
  { min: 22000,     max: 29999,     title: "Embajador Cultural",    emoji: "🌮", color: "#E91E63" },
  { min: 30000,     max: 39999,     title: "Nahual del Saber",      emoji: "🐆", color: "#795548" },
  { min: 40000,     max: 54999,     title: "Guerrero Águila",       emoji: "🦅", color: "#607D8B" },
  { min: 55000,     max: 74999,     title: "Maestro Quetzal",       emoji: "🦜", color: "#00BFA5" },
  { min: 75000,     max: 99999,     title: "Centurión de Jade",     emoji: "💎", color: "#00C853" },
  { min: 100000,    max: 149999,    title: "Tonatiuh Dorado",       emoji: "☀️", color: "#FF6D00" },
  { min: 150000,    max: 224999,    title: "Leyenda Mexicana",      emoji: "👑", color: "#8B008B" },
  { min: 225000,    max: 349999,    title: "Leyenda Diamante",      emoji: "💠", color: "#0D47A1" },
  { min: 350000,    max: 549999,    title: "Leyenda Obsidiana",     emoji: "⬛", color: "#212121" },
  { min: 550000,    max: 849999,    title: "Deidad Prehispánica",   emoji: "🗿", color: "#4E342E" },
  { min: 850000,    max: 1249999,   title: "Quetzalcóatl",          emoji: "🐍", color: "#1B5E20" },
  { min: 1250000,   max: Infinity,  title: "Ometeotl Supremo",      emoji: "✨", color: "#FFD700" },
];

/** Get the rank object for a given XP value */
export function getRank(xp) {
  const val = xp ?? 0;
  for (let i = XP_RANKS.length - 1; i >= 0; i--) {
    if (val >= XP_RANKS[i].min) return XP_RANKS[i];
  }
  return XP_RANKS[0];
}

/** Get the rank index (0-based tier number) for a given XP value */
export function getRankIndex(xp) {
  const val = xp ?? 0;
  for (let i = XP_RANKS.length - 1; i >= 0; i--) {
    if (val >= XP_RANKS[i].min) return i;
  }
  return 0;
}

/** Get XP progress within current rank as 0.0-1.0 */
export function getXpProgress(xp) {
  const rank = getRank(xp);
  if (rank.max === Infinity) return 1.0;
  const range = rank.max - rank.min + 1;
  return Math.min(1.0, ((xp ?? 0) - rank.min) / range);
}

/** Get the next rank title, or null if at max */
export function getNextRankTitle(xp) {
  const idx = getRankIndex(xp);
  if (idx >= XP_RANKS.length - 1) return null;
  return XP_RANKS[idx + 1].title;
}

/** Get XP needed to reach the next rank, or 0 if at max */
export function getXpToNextRank(xp) {
  const idx = getRankIndex(xp);
  if (idx >= XP_RANKS.length - 1) return 0;
  return XP_RANKS[idx + 1].min - (xp ?? 0);
}

/** Check if XP crossed a rank boundary (for rank-up detection) */
export function didRankUp(oldXp, newXp) {
  return getRankIndex(oldXp) < getRankIndex(newXp);
}

/** Get the rank at a specific index */
export function getRankAtIndex(index) {
  return XP_RANKS[Math.min(index, XP_RANKS.length - 1)];
}
