import { mutation, internalMutation } from "./_generated/server";

/**
 * One-time migration: consolidates 22+ old categories into 15 canonical collections.
 *
 * Run from Convex dashboard: collectionMigration:migrateCategories
 */

const CATEGORY_MIGRATION: Record<string, string> = {
  // Expresiones y Modismos (absorbs 5 old categories)
  "Modismos":          "Expresiones y Modismos",
  "Popular":           "Expresiones y Modismos",
  "Expresiones":       "Expresiones y Modismos",
  "Tipos Sociales":    "Expresiones y Modismos",
  "Verbos del Barrio": "Expresiones y Modismos",

  // Comida Mexicana
  "Comida":       "Comida Mexicana",
  "Gastronomia":  "Comida Mexicana",

  // Bebidas
  "Bebida": "Bebidas",

  // Refranes y Dichos
  "Refranes": "Refranes y Dichos",

  // Animales de México
  "Animales": "Animales de México",

  // Flora Mexicana
  "Plantas": "Flora Mexicana",

  // Tradiciones y Fiestas
  "Tradiciones": "Tradiciones y Fiestas",

  // Música y Artistas (absorbs 3)
  "Música":   "Música y Artistas",
  "Músicos":  "Música y Artistas",
  "Artistas": "Música y Artistas",

  // Historia de México
  "Historia":       "Historia de México",
  "Civilizaciones": "Historia de México",

  // Albures y Picaresca
  "Picaresca": "Albures y Picaresca",

  // Cultura Popular (absorbs Telenovelas)
  "Telenovelas": "Cultura Popular",
  // "Cultura Popular" stays as-is

  // Monumentos y Lugares
  "Monumentos":     "Monumentos y Lugares",
  "Regionalismos":  "Monumentos y Lugares",

  // Leyendas y Mitos
  "Leyendas": "Leyendas y Mitos",

  // Mundo Digital (absorbs 5)
  "Streamers":         "Mundo Digital",
  "Futbolistas":       "Mundo Digital",
  "Jerga Digital":     "Mundo Digital",
  "Corridos Tumbados": "Mundo Digital",
  "Cultura Digital":   "Mundo Digital",
};

export const migrateCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();

    const stats: Record<string, number> = {};
    let patched = 0;

    for (const word of allWords) {
      const oldCat = (word as any).category as string | undefined;
      if (!oldCat) {
        // No category → default to Expresiones y Modismos
        await ctx.db.patch(word._id, { category: "Expresiones y Modismos" } as any);
        stats["(sin categoría)"] = (stats["(sin categoría)"] ?? 0) + 1;
        patched++;
        continue;
      }

      const newCat = CATEGORY_MIGRATION[oldCat];
      if (newCat) {
        await ctx.db.patch(word._id, { category: newCat } as any);
        // ASCII-safe key for return value
        const key = oldCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        stats[key] = (stats[key] ?? 0) + 1;
        patched++;
      }
      // Categories already canonical (Juegos y Niñez, Cultura Popular, etc.) are left as-is
    }

    return { patched, total: allWords.length, breakdown: stats };
  },
});
