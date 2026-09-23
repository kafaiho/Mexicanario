import { internalMutation } from "../_generated/server";

/**
 * Correcciones de la 2ª auditoría cultural (bloques 1-20 de seedWords1000).
 * Errores verificados con búsquedas en internet.
 *
 * Run desde el dashboard de Convex:  patchAudit2Errors:patchAudit2Errors
 */

export const patchAudit2Errors = internalMutation({
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
      // ── 1. Jorge Negrete: nació en Silao, Guanajuato — NO en Jalisco ──────────
      {
        word: "Jorge Negrete",
        region: "Guanajuato",
        // Fuente: guanajuatodesconocido.com, lasillarota.com
        // El error más común: asociarlo con Jalisco por el mariachi, pero era guanajuatense.
      },

      // ── 2. "Mazahua silvestre" — no existe como especie animal ────────────────
      // Los Mazahuas son un pueblo indígena otomiano del Estado de México.
      // Su nombre viene del náhuatl "mazahua" = gente del venado.
      // Parcharemos el word, meaning, example y category para corrección completa.
      {
        word: "Mazahua silvestre",
        newWord: "Pueblo mazahua",
        meaning:
          "Pueblo indígena del Estado de México cuyo nombre significa 'gente del venado'",
        example:
          "El pueblo mazahua vive en San Felipe del Progreso y preserva su lengua otomiana",
        category: "Historia",
        // region permanece "Estado de México" — correcto
      },

      // ── 3. "Caste de la Nueva Galicia" → "Guerra del Mixtón" ─────────────────
      // La rebelión indígena del occidente de México (1540-1542) se llama
      // "Guerra del Mixtón". El nombre "Caste" no es el término histórico correcto.
      // Además el ejemplo anterior decía "del norte" (incorrecto, es occidente).
      {
        word: "Caste de la Nueva Galicia",
        newWord: "Guerra del Mixtón",
        meaning:
          "Mayor rebelión indígena del siglo XVI en el occidente de México",
        example:
          "La Guerra del Mixtón de 1540 fue la mayor sublevación caxcán contra los españoles en Jalisco",
        region: "Jalisco",
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
