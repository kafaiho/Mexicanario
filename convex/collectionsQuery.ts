import { v } from "convex/values";
import { query } from "./_generated/server";

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

    const allLevels = await ctx.db.query("levels").order("asc").collect();
    const levelsWithWords = await Promise.all(
      allLevels.map(async (level) => {
        const word = await ctx.db.get(level.wordId);
        return { ...level, wordData: word };
      })
    );

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

    for (const item of levelsWithWords) {
      if (!item.wordData) continue;
      const cat = (item.wordData as any).category || "Modismos";

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
      const isCompleted = item.levelNumber < userCurrentLevel;

      entry.words.push({
        levelNumber: item.levelNumber,
        word: (item.wordData as any).word,
        meaning: (item.wordData as any).meaning,
        region: (item.wordData as any).region,
        isCompleted,
      });
      entry.total++;
      if (isCompleted) entry.completed++;
    }

    // Sort: categories with progress first, then alphabetically
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
