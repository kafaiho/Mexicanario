import { mutation } from "./_generated/server";

/**
 * Correcciones de la 3ª auditoría cultural (bloques 3-6 de seedWords1000).
 * Errores verificados con búsquedas en internet.
 *
 * Run desde el dashboard de Convex:  patchAudit3Errors:patchAudit3Errors
 */

export const patchAudit3Errors = mutation({
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
      // ── 1. Silvia Pinal: nació en Guaymas, Sonora — NO en CDMX ──────────────
      {
        word: "Silvia Pinal",
        region: "Sonora",
        // Fuente: Wikipedia, Deadline obituary (nov 2024)
        // Nació el 12 de septiembre de 1931 en Guaymas, Sonora.
        // Error común: asociarla con CDMX por su carrera, pero era sonorense.
      },

      // ── 2. Toniná: pirámide más alta de México, NO de toda Mesoamérica ──────
      {
        word: "Toniná",
        example:
          "Toniná tiene la pirámide más alta de México con 75 metros de altura",
        // Fuente: Wikipedia (Toniná), Ancient Origins, The Travel
        // La acrópolis de Toniná mide 75 m, la más alta en México.
        // Decir "de Mesoamérica" es inexacto pues hay sitios en Guatemala
        // (El Mirador / La Danta) de altura comparable.
      },

      // ── 3. Astrid Hadad: nació en Chetumal, Quintana Roo — NO en CDMX ──────
      {
        word: "Astrid Hadad",
        region: "Quintana Roo",
        meaning: "Artista de cabaret político nacida en Chetumal",
        // Fuente: Wikipedia, Mexico News Daily
        // Nació en Chetumal, Quintana Roo, de familia maronita libanesa.
        // Se mudó a CDMX para estudiar, pero su origen es peninsular.
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
