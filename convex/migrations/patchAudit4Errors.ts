import { internalMutation } from "../_generated/server";

/**
 * Correcciones de la 4ª auditoría cultural (bloques 7-10 de seedWords1000).
 * Errores verificados con búsquedas en internet.
 *
 * Run desde el dashboard de Convex:  patchAudit4Errors:patchAudit4Errors
 */

export const patchAudit4Errors = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const results: { word: string; status: string; changes: string[] }[] = [];

    const corrections: {
      word: string;
      newWord?: string;
      region?: string;
      meaning?: string;
      example?: string;
      category?: string;
    }[] = [
      // ── 1. Pedro Armendáriz: nació en Churubusco, CDMX — NO en Chihuahua ────
      {
        word: "Pedro Armendáriz",
        region: "CDMX",
        // Fuente: IMDb, Wikipedia, Find A Grave
        // Nació el 9 de mayo de 1912 en Churubusco (absorbido por CDMX).
        // Error frecuente: confundirlo con Chihuahua por sus roles de norteño.
      },

      // ── 2. Cantona: zona más extensa, NO "mayor ciudad prehispánica" ──────────
      {
        word: "Cantona",
        meaning: "Zona arqueológica más extensa de México en el estado de Puebla",
        // Fuente: Wikipedia, INAH, El Universal Puebla
        // Cantona cubre ~12-14 km² — la zona arqueológica más grande de México por área.
        // Pero decir "la mayor ciudad prehispánica" es inexacto pues Teotihuacan
        // superaba a Cantona en población (125-200 mil vs ~90 mil habitantes).
      },
    ];

    for (const correction of corrections) {
      const dbWord = allWords.find(
        (w) =>
          w.word.trim().toLowerCase() === correction.word.trim().toLowerCase()
      );

      if (!dbWord) {
        results.push({ word: correction.word, status: "NOT_FOUND", changes: [] });
        continue;
      }

      const patch: Record<string, string> = {};
      const changes: string[] = [];

      if (correction.newWord && dbWord.word !== correction.newWord) {
        changes.push(`word: "${dbWord.word}" → "${correction.newWord}"`);
        patch.word = correction.newWord;
      }
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

    return {
      total: corrections.length,
      patched: results.filter((r) => r.status === "PATCHED").length,
      notFound: results.filter((r) => r.status === "NOT_FOUND").length,
      alreadyCorrect: results.filter((r) => r.status === "ALREADY_CORRECT").length,
      details: results,
    };
  },
});
