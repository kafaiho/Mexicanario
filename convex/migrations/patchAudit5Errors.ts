import { internalMutation } from "../_generated/server";

/**
 * Correcciones de la 5ª auditoría cultural (bloques 11-14 de seedWords1000).
 * Errores verificados con búsquedas en internet.
 *
 * Run desde el dashboard de Convex:  patchAudit5Errors:patchAudit5Errors
 */

export const patchAudit5Errors = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const results: { word: string; status: string; changes: string[] }[] = [];

    const corrections: {
      word: string;
      region?: string;
      meaning?: string;
      example?: string;
    }[] = [
      // ── 1. Guajolote: domesticado en todo México/Mesoamérica — NO solo Oaxaca ─
      {
        word: "Guajolote",
        region: "Todo México",
        // Fuente: SciELO (UNAM), INAH Cuicuilco
        // El guajolote fue domesticado en el Valle de Tehuacán (Puebla)
        // y dispersado por todo el altiplano mesoamericano. Asignarlo a Oaxaca
        // es un sesgo injustificado — es un animal verdaderamente nacional.
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
