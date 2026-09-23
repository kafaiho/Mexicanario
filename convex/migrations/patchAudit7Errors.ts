import { internalMutation } from "../_generated/server";

/**
 * Correcciones de la 7ª auditoría cultural (bloques 19-20 de seedWords1000).
 * Errores verificados con búsquedas en internet.
 *
 * Run desde el dashboard de Convex:  patchAudit7Errors:patchAudit7Errors
 */

export const patchAudit7Errors = internalMutation({
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
      // ── 1. Juan Gabriel: nació en Parácuaro, Michoacán — NO en Chihuahua ────
      {
        word: "Juan Gabriel",
        region: "Michoacán",
        // Fuente: UnoTV, Wikipedia, AM.com.mx
        // Nació el 7 de enero de 1950 en Parácuaro, Michoacán.
        // La confusión viene de que creció en Ciudad Juárez, Chihuahua
        // ("El Divo de Juárez"), pero su birthplace es Michoacán.
      },

      // ── 2. Nellie Campobello: nació en Villa Ocampo, Durango — NO Chihuahua ──
      {
        word: "Nellie Campobello",
        region: "Durango",
        // Fuente: Wikipedia, WorldAtlas, Encyclopedia.com
        // Nació como María Francisca Moya Luna en Villa Ocampo, Durango.
        // Pasó su infancia en Parral, Chihuahua, de ahí la confusión.
      },

      // ── 3. Museo Templo Mayor: la Piedra del Sol NO está ahí ─────────────────
      {
        word: "Museo del Templo Mayor",
        example:
          "El Museo del Templo Mayor guarda el disco de Coyolxauhqui y miles de piezas mexicas",
        // Fuente: Wikipedia (Aztec Sun Stone), Google Arts & Culture
        // La Piedra del Sol está en el Museo Nacional de Antropología (desde 1964),
        // NO en el Templo Mayor. El Templo Mayor sí tiene el disco de Coyolxauhqui.
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
