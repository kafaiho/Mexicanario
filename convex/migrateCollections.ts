import { mutation, query, internalMutation } from "./_generated/server";

// ── Las 19 categorías canónicas ─────────────────────────────────────────────
const CANONICAL = new Set([
  "Expresiones y Modismos",
  "Comida Mexicana",
  "Juegos y Niñez",
  "Bebidas",
  "Vida Cotidiana",
  "Refranes y Dichos",
  "Animales de México",
  "Remedios Caseros",
  "Flora Mexicana",
  "Tradiciones y Fiestas",
  "Música y Artistas",
  "Historia de México",
  "Albures y Picaresca",
  "Artesanías de México",
  "Cultura Popular",
  "Deportes Mexicanos",
  "Monumentos y Lugares",
  "Leyendas y Mitos",
  "Mundo Digital",
]);

// Mapeo de categorías viejas/raras/cortas → canónica correcta
const REMAP: Record<string, string> = {
  // Nombres cortos (como aparecen en la DB)
  "Bebida":               "Bebidas",
  "Modismos":             "Expresiones y Modismos",
  "Comida":               "Comida Mexicana",
  "Animales":             "Animales de México",
  "Juegos":               "Juegos y Niñez",
  "Historia":             "Historia de México",
  "Música":               "Música y Artistas",
  "Musica":               "Música y Artistas",
  "Artistas":             "Música y Artistas",
  "Monumentos":           "Monumentos y Lugares",
  "Plantas":              "Flora Mexicana",
  "Leyendas":             "Leyendas y Mitos",
  "Tradiciones":          "Tradiciones y Fiestas",
  "Refranes":             "Refranes y Dichos",
  "Albures":              "Albures y Picaresca",
  "Digital":              "Mundo Digital",
  // Nombres viejos largos
  "Jerga":                "Expresiones y Modismos",
  "Slang":                "Expresiones y Modismos",
  "Expresiones":          "Expresiones y Modismos",
  "Flora":                "Flora Mexicana",
  "Cultura Digital":      "Mundo Digital",
  "Jerga Digital":        "Mundo Digital",
  "Corridos Tumbados":    "Música y Artistas",
  "Futbolistas":          "Cultura Popular",
  "Streamers":            "Mundo Digital",
  "Cultura Popular y Deportes": "Cultura Popular",
};

/**
 * Primero ejecutar esto para VER qué categorías raras hay en la DB.
 * Dashboard: migrateCollections:listNonCanonicalCategories
 */
export const listNonCanonicalCategories = query({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const all = new Map<string, number>();
    const bad = new Map<string, number>();

    for (const w of allWords) {
      const cat = (w as any).category ?? "(sin categoria)";
      all.set(cat, (all.get(cat) || 0) + 1);
      if (!CANONICAL.has(cat)) {
        bad.set(cat, (bad.get(cat) || 0) + 1);
      }
    }

    // Return as arrays of strings to avoid Convex accent-in-key errors
    const allCategories = Array.from(all.entries()).map(([cat, count]) => `${cat}: ${count}`);
    const nonCanonical = Array.from(bad.entries()).map(([cat, count]) => `${cat}: ${count}`);

    return { allCategories, nonCanonical, totalWords: allWords.length };
  },
});

/**
 * Reclasifica TODAS las palabras con categorías no canónicas
 * usando el mapeo REMAP. Las que no tienen mapeo van a "Expresiones y Modismos".
 *
 * Dashboard: migrateCollections:fixAllCategories
 */
export const fixAllCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    let updated = 0;
    const changes: string[] = [];

    for (const word of allWords) {
      const cat = (word as any).category ?? "";

      // Ya es canónica → skip
      if (CANONICAL.has(cat)) continue;

      // Buscar en el mapeo
      const newCat = REMAP[cat] ?? "Expresiones y Modismos";
      await ctx.db.patch(word._id, { category: newCat });
      changes.push(`${word.word}: "${cat}" → "${newCat}"`);
      updated++;
    }

    return { updated, changes, message: `Reclasificadas ${updated} palabras.` };
  },
});

/**
 * Reclasifica bebidas de "Comida Mexicana" → "Bebidas"
 * Dashboard: migrateCollections:reclassifyBeverages
 */
const BEVERAGE_WORDS = [
  "jamaica", "horchata", "pulque", "mezcal", "michelada",
  "tepache", "tequila", "tejuino", "chela", "pisto",
];

export const reclassifyBeverages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const beverageSet = new Set(BEVERAGE_WORDS.map((w) => w.toLowerCase().trim()));
    const allWords = await ctx.db.query("words").collect();
    let updated = 0;

    for (const word of allWords) {
      const key = word.word.toLowerCase().trim();
      if (beverageSet.has(key) && (word as any).category !== "Bebidas") {
        await ctx.db.patch(word._id, { category: "Bebidas" });
        updated++;
      }
    }

    return { updated, message: `Reclasificadas ${updated} bebidas a la colección "Bebidas".` };
  },
});

/**
 * Actualiza las recompensas de TODOS los niveles existentes
 * para usar la nueva fórmula: 2 coins base + 1 cada 100 niveles.
 *
 * Ejecutar desde Convex Dashboard: migrateCollections:fixLevelRewards
 */
export const fixLevelRewards = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allLevels = await ctx.db.query("levels").collect();
    let updated = 0;

    for (const level of allLevels) {
      const coins = 2 + Math.floor((level.levelNumber - 1) / 100);
      const diamonds = Math.floor((level.levelNumber - 1) / 200);
      const current = level.reward as any;

      if (current?.coins !== coins || current?.diamonds !== diamonds) {
        await ctx.db.patch(level._id, { reward: { coins, diamonds } });
        updated++;
      }
    }

    return { updated, message: `Actualizadas recompensas de ${updated} niveles.` };
  },
});
