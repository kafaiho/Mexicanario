import { v } from "convex/values";
import { query } from "./_generated/server";
import { getOrderedLevels, completedWordIds } from "./levelOrdering";

// ─── Icon helper — 15 categorías canónicas ───────────────────────────────────
function categoryIcon(cat: string): string {
  const map: Record<string, string> = {
    // Tier 1 — Fácil
    "Comida":          "🌮",
    "Bebida":          "🍹",
    "Juegos":          "🎯",
    "Modismos":        "🤙",
    "Refranes":        "💭",
    // Tier 2 — Medio
    "Música":          "🎶",
    "Animales":        "🦅",
    "Plantas":         "🌿",
    "Artistas":        "🎨",
    "Tradiciones":     "🎉",
    "Cultura Popular": "📺",
    "Leyendas":        "👻",
    // Tier 3 — Difícil
    "Historia":        "📜",
    "Civilizaciones":  "🗿",
    "Monumentos":      "🏛️",
  };
  return map[cat] ?? "📖";
}

// ─── Region taxonomy (mirrors src/config/regionConfig.js) ────────────────────
const MACRO_REGIONS_DEF = [
  { key: 'nacional',  demonym: 'Nacional',      emoji: '🦅', color: '#006847', rawRegions: ['Todo México','Nacional','Infantil','Juvenil','Escuela','Callejero','Tradicional','Familiar','Feria','Colonial'] },
  { key: 'cdmx',      demonym: 'Chilango',      emoji: '🌮', color: '#C62828', rawRegions: ['CDMX'] },
  { key: 'norte',     demonym: 'Norteño',       emoji: '🤠', color: '#6D4C41', rawRegions: ['Norte','Chihuahua','Sinaloa','Sonora','Baja California','Baja California Sur','Nuevo León','Coahuila','Tamaulipas','Durango','Zacatecas','Frontera Norte','Sierra Madre'] },
  { key: 'jalisco',   demonym: 'Tapatío',       emoji: '🌵', color: '#2E7D32', rawRegions: ['Jalisco','Occidente','Centro-Occidente'] },
  { key: 'veracruz',  demonym: 'Jarocho',       emoji: '🎺', color: '#1565C0', rawRegions: ['Veracruz'] },
  { key: 'oaxaca',    demonym: 'Oaxaqueño',     emoji: '🍫', color: '#E65100', rawRegions: ['Oaxaca'] },
  { key: 'centro',    demonym: 'Del Centro',    emoji: '🏛️', color: '#5D4037', rawRegions: ['Centro','Estado de México','Morelos','Hidalgo','Puebla','Tlaxcala','Bajío'] },
  { key: 'bajio',     demonym: 'Bajío',         emoji: '🌾', color: '#F57F17', rawRegions: ['Guanajuato','Querétaro','Aguascalientes','San Luis Potosí'] },
  { key: 'sureste',   demonym: 'Yucateco',      emoji: '🌺', color: '#6A1B9A', rawRegions: ['Yucatán','Quintana Roo','Campeche','Tabasco','Sureste'] },
  { key: 'chiapas',   demonym: 'Chiapaneco',    emoji: '🌿', color: '#00695C', rawRegions: ['Chiapas','Sur'] },
  { key: 'guerrero',  demonym: 'Guerrerense',   emoji: '🏖️', color: '#00838F', rawRegions: ['Guerrero','Pacífico','Costas','Nayarit','Huasteca'] },
  { key: 'michoacan', demonym: 'Michoacano',    emoji: '🦋', color: '#6A1B9A', rawRegions: ['Michoacán'] },
];

// Build raw-region → macro-key lookup
const RAW_TO_MACRO: Record<string, string> = {};
for (const m of MACRO_REGIONS_DEF) {
  for (const r of m.rawRegions) RAW_TO_MACRO[r] = m.key;
}
const MACRO_BY_KEY = Object.fromEntries(MACRO_REGIONS_DEF.map(m => [m.key, m]));

// ─── Original query (no progress) ────────────────────────────────────────────
export const getCollectionData = query({
  args: {},
  handler: async (ctx) => {
    const allLevels = await ctx.db.query("levels").order("asc").collect();
    const levelsWithWords = await Promise.all(
      allLevels.map(async (level) => {
        const word = await ctx.db.get(level.wordId);
        return { ...level, wordData: word };
      })
    );

    const categoriesMap = new Map<string, { name: string; icon: string; levels: any[] }>();

    for (const item of levelsWithWords) {
      if (!item.wordData) continue;
      const cat = (item.wordData as any).category || "Modismos";
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, { name: cat, icon: categoryIcon(cat), levels: [] });
      }
      categoriesMap.get(cat)!.levels.push({
        levelNumber: item.levelNumber,
        word: (item.wordData as any).word,
        meaning: (item.wordData as any).meaning,
        region: (item.wordData as any).region,
      });
    }

    return Array.from(categoriesMap.values()).map((cat) => {
      cat.levels.sort((a: any, b: any) => a.levelNumber - b.levelNumber);
      return cat;
    });
  },
});

// ─── New query: categories + user progress ────────────────────────────────────
export const getCollectionsWithProgress = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = args.userId ? await ctx.db.get(args.userId) : null;
    const userCurrentLevel = (user as any)?.currentLevel ?? 1;

    const allLevels = await ctx.db.query("levels").collect();
    const allWords  = await ctx.db.query("words").collect();

    // Use the same ordering as gameplay so "completed" status matches exactly
    const userId = args.userId?.toString() ?? "";
    const ordered = getOrderedLevels(allLevels, allWords, userId);
    const done    = completedWordIds(ordered, userCurrentLevel);

    const wordMap = new Map(allWords.map((w) => [w._id.toString(), w]));

    const categoriesMap = new Map<
      string,
      {
        name: string;
        icon: string;
        total: number;
        completed: number;
        words: Array<{
          levelNumber: number;
          word: string;
          meaning: string;
          region: string;
          isCompleted: boolean;
        }>;
      }
    >();

    for (const lvl of ordered) {
      const wordDoc = wordMap.get(lvl.wordId.toString());
      if (!wordDoc) continue;
      const cat = (wordDoc as any).category || "Modismos";

      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, {
          name: cat,
          icon: categoryIcon(cat),
          total: 0,
          completed: 0,
          words: [],
        });
      }

      const entry = categoriesMap.get(cat)!;
      const isCompleted = done.has(lvl.wordId.toString());

      entry.words.push({
        levelNumber: lvl.levelNumber,
        word: wordDoc.word,
        meaning: wordDoc.meaning,
        region: wordDoc.region,
        isCompleted,
      });
      entry.total++;
      if (isCompleted) entry.completed++;
    }

    // Sort: categories with most progress first, then alphabetically
    return Array.from(categoriesMap.values())
      .map((cat) => {
        cat.words.sort((a, b) => a.levelNumber - b.levelNumber);
        return cat;
      })
      .sort((a, b) => {
        const pctA = a.total > 0 ? a.completed / a.total : 0;
        const pctB = b.total > 0 ? b.completed / b.total : 0;
        if (pctB !== pctA) return pctB - pctA;
        return a.name.localeCompare(b.name);
      });
  },
});

// ─── Region query: words grouped by macro-region with user progress ───────────
export const getRegionsWithProgress = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = args.userId ? await ctx.db.get(args.userId) : null;
    const userCurrentLevel = (user as any)?.currentLevel ?? 1;

    const allLevels = await ctx.db.query("levels").collect();
    const allWords  = await ctx.db.query("words").collect();

    const userId = args.userId?.toString() ?? "";
    const ordered = getOrderedLevels(allLevels, allWords, userId);
    const done    = completedWordIds(ordered, userCurrentLevel);

    const wordMap = new Map(allWords.map((w) => [w._id.toString(), w]));

    const regionsMap = new Map<
      string,
      {
        key: string;
        demonym: string;
        emoji: string;
        color: string;
        total: number;
        completed: number;
        words: Array<{
          levelNumber: number;
          word: string;
          meaning: string;
          region: string;
          isCompleted: boolean;
        }>;
      }
    >();

    // Initialise all macro-regions so they appear even with 0 words
    for (const macro of MACRO_REGIONS_DEF) {
      regionsMap.set(macro.key, {
        key: macro.key,
        demonym: macro.demonym,
        emoji: macro.emoji,
        color: macro.color,
        total: 0,
        completed: 0,
        words: [],
      });
    }

    for (const lvl of ordered) {
      const wordDoc = wordMap.get(lvl.wordId.toString());
      if (!wordDoc) continue;
      const rawRegion = (wordDoc as any).region ?? "Todo México";
      const macroKey  = RAW_TO_MACRO[rawRegion] ?? "nacional";

      const entry = regionsMap.get(macroKey)!;
      const isCompleted = done.has(lvl.wordId.toString());

      entry.words.push({
        levelNumber: lvl.levelNumber,
        word: wordDoc.word,
        meaning: wordDoc.meaning,
        region: rawRegion,
        isCompleted,
      });
      entry.total++;
      if (isCompleted) entry.completed++;
    }

    // Remove empty macro-regions, sort by progress desc then demonym
    return Array.from(regionsMap.values())
      .filter((r) => r.total > 0)
      .map((r) => {
        r.words.sort((a, b) => a.levelNumber - b.levelNumber);
        return r;
      })
      .sort((a, b) => {
        const pctA = a.total > 0 ? a.completed / a.total : 0;
        const pctB = b.total > 0 ? b.completed / b.total : 0;
        if (pctB !== pctA) return pctB - pctA;
        return a.demonym.localeCompare(b.demonym);
      });
  },
});
