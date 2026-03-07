import { mutation } from "./_generated/server";

/**
 * Correcciones de la 6ª auditoría cultural (bloques 15-18 de seedWords1000).
 * Errores verificados con búsquedas en internet.
 *
 * Run desde el dashboard de Convex:  patchAudit6Errors:patchAudit6Errors
 */

export const patchAudit6Errors = mutation({
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
      // ── 1. María Grever: nació en León, Guanajuato — NO en Jalisco ─────────
      {
        word: "María Grever",
        region: "Guanajuato",
        // Fuente: Wikipedia, Astro.com Databank
        // Nació el 1 de septiembre de 1885 en León, Guanajuato.
        // No tiene vinculación con Jalisco; creció en CDMX y Sevilla.
      },

      // ── 2. Monte Albán: una de las primeras ciudades — NO "la primera" ──────
      {
        word: "Monte Albán",
        meaning: "Una de las primeras ciudades planificadas de Mesoamérica",
        // Fuente: Wikipedia, Britannica, Ancient Origins
        // Monte Albán se fundó ~500 a.C. Es de las más antiguas, pero San Lorenzo
        // olmeca (1500 a.C.) y La Venta (~900 a.C.) son anteriores.
        // "Primera" es incorrecto; "una de las primeras" es la descripción correcta.
      },

      // ── 3. Puente Baluarte: más alto de América, no del mundo ────────────────
      {
        word: "Puente Baluarte",
        meaning: "El puente atirantado más alto de América en la Sierra Madre",
        example: "El Puente Baluarte tiene su tablero a más de 400 metros sobre el cañón",
        // Fuente: Wikipedia, HighestBridges.com, Guinness Records
        // Fue el más alto del mundo al inaugurarse en 2012, pero fue superado en 2016
        // por el Beipanjiang (China, 565 m) y el Yachi (China, 434 m).
        // Sigue siendo el más alto de América.
      },

      // ── 4. Sara García: nació en Orizaba, Veracruz — NO en CDMX ─────────────
      {
        word: "Sara García",
        region: "Veracruz",
        // Fuente: Wikipedia, IMDb, Morelia Film Festival
        // Nació el 3 de septiembre de 1892 en Orizaba, Veracruz.
        // Sus padres eran inmigrantes españoles de Andalucía.
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
