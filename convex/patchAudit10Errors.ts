import { mutation } from "./_generated/server";

/**
 * Correcciones de la 10ª auditoría cultural (bloques 11-20 de seedWords1000).
 * Errores verificados con búsquedas en internet.
 *
 * Run desde el dashboard de Convex:  patchAudit10Errors:patchAudit10Errors
 */

export const patchAudit10Errors = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const results: { word: string; status: string; changes: string[] }[] = [];

    const corrections: {
      word: string;
      region?: string;
      meaning?: string;
      example?: string;
      category?: string;
    }[] = [
      // ── 1. Águila arpía: NO es la más grande del mundo (Philippine Eagle es más larga) ──
      {
        word: "Águila arpía",
        meaning: "La mayor rapaz del continente americano y una de las águilas más grandes del mundo",
        // Fuente: Wikipedia ES/EN, Peregrine Fund, A-Z Animals
        // La Philippine Eagle (Pithecophaga jefferyi) es más larga en cuerpo y mayor en superficie alar.
        // El Águila de Steller tiene mayor envergadura.
        // La Harpy Eagle es la MÁS PODEROSA de América, pero NO la más grande del mundo.
        // Wikipedia ES: "considerada una de las mayores águilas del mundo" (no "la mayor").
      },

      // ── 2. Sor Juana Inés de la Cruz (entrada en Bloque 15): region CDMX → Estado de México ──
      {
        word: "Sor Juana Inés de la Cruz",
        region: "Estado de México",
        // Fuente: Wikipedia, Municipio de Tepetlixpa, Britannica
        // Nació c. 1648/1651 en San Miguel Nepantla, hoy "Nepantla de Sor Juana Inés de la Cruz",
        // municipio de Tepetlixpa, Estado de México — NO en CDMX.
        // Esta es una segunda entrada (Artistas, Bloque 15) que tenía el mismo error
        // que ya se corrigió en la entrada de Historia (patchAudit9Errors).
      },

      // ── 3. Pueblo mazahua: categoría "Animales" → "Historia" ─────────────────────────────
      {
        word: "Pueblo mazahua",
        category: "Historia",
        // El pueblo mazahua es una comunidad indígena humana del Estado de México,
        // no un animal. Fue incorrectamente clasificado como "Animales" en el seed.
        // Correcto: "Historia" (o "Pueblos Indígenas", pero Historia es la categoría más cercana).
      },
    ];

    for (const correction of corrections) {
      // May have multiple entries with same word — patch all matches
      const dbWords = allWords.filter(
        (w) =>
          w.word.trim().toLowerCase() === correction.word.trim().toLowerCase()
      );

      if (dbWords.length === 0) {
        results.push({ word: correction.word, status: "NOT_FOUND", changes: [] });
        continue;
      }

      for (const dbWord of dbWords) {
        const patch: Record<string, string> = {};
        const changes: string[] = [];

        if (correction.region && dbWord.region !== correction.region) {
          changes.push(`region: "${dbWord.region}" → "${correction.region}"`);
          patch.region = correction.region;
        }
        if (correction.meaning && dbWord.meaning !== correction.meaning) {
          changes.push(`meaning actualizado`);
          patch.meaning = correction.meaning;
        }
        if (correction.example && dbWord.example !== correction.example) {
          changes.push(`example actualizado`);
          patch.example = correction.example;
        }
        if (correction.category && dbWord.category !== correction.category) {
          changes.push(`category: "${dbWord.category}" → "${correction.category}"`);
          patch.category = correction.category;
        }

        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(dbWord._id, patch);
          results.push({ word: correction.word, status: "PATCHED", changes });
        } else {
          results.push({ word: correction.word, status: "ALREADY_CORRECT", changes: [] });
        }
      }
    }

    return {
      total: corrections.length,
      patched: results.filter((r) => r.status === "PATCHED").length,
      notFound: results.filter((r) => r.status === "NOT_FOUND").length,
      alreadyCorrect: results.filter((r) => r.status === "ALREADY_CORRECT").length,
      details: results,
    };
  },
});
