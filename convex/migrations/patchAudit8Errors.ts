import { internalMutation } from "../_generated/server";

/**
 * Correcciones de la 8ª auditoría cultural (seedCulturaDigital, seedCulturaDigitalV2, seedCuratedLevels).
 * Errores verificados con búsquedas en internet.
 *
 * Run desde el dashboard de Convex:  patchAudit8Errors:patchAudit8Errors
 */

export const patchAudit8Errors = internalMutation({
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
      // ── 1. Chucky Lozano: nació en CDMX — NO en Culiacán ──────────────────────
      {
        word: "CHUCKY LOZANO",
        region: "Ciudad de México",
        // Fuente: Wikipedia, Transfermarkt, Infobae
        // Hirving Rodrigo Lozano Bahena nació el 30 de julio de 1995 en Ciudad de México.
        // Creció en CDMX y se formó en Pachuca. No tiene vínculo de nacimiento con Culiacán.
      },

      // ── 2. Hugo Sánchez: fue elegido mejor de CONCACAF, NO de toda América ─────
      {
        word: "HUGO SANCHEZ",
        example:
          "Hugo Sánchez anotó 38 goles en la temporada 1989-90 y fue elegido mejor futbolista de CONCACAF del siglo XX",
        // Fuente: IFFHS (1999), Wikipedia, Real Madrid
        // El IFFHS lo eligió mejor de CONCACAF (Norteamérica + Centroamérica + Caribe).
        // Decir "mejor de América" es incorrecto porque eso incluiría a Pelé y Maradona.
      },

      // ── 3. Santiago Giménez: nació en Buenos Aires — NO en CDMX ──────────────
      {
        word: "SANTIAGO GIMENEZ",
        region: "México",
        meaning:
          "Delantero nacido en Buenos Aires y criado en México que en 2025 fichó por el AC Milan convirtiéndose en el mexicano más caro de la historia",
        // Fuente: Wikipedia, Transfermarkt, AC Milan oficial
        // Nació el 18 de enero de 2001 en Buenos Aires, Argentina.
        // Su padre "El Chaco" Giménez jugó en el Veracruz, por eso creció en México desde los ~3 años.
        // Tiene nacionalidad mexicana y juega con la selección de México.
        // Transferido de Feyenoord al AC Milan por 32M€ base (35M€ con bonos) el 3 de febrero de 2025.
      },

      // ── 4. Grupo Frontera: "Un x100to" llegó al #5 del Hot 100, NO al #1 ─────
      {
        word: "GRUPO FRONTERA",
        example:
          "Grupo Frontera colaboró con Bad Bunny en 'Un x100to' que llegó al número 1 en Billboard Global y al Top 5 del Hot 100",
        // Fuente: Billboard (chart dated May 6, 2023)
        // "Un x100to" alcanzó el #5 en el Billboard Hot 100 (Morgan Wallen tenía el #1).
        // Sí llegó al #1 en Billboard Global 200 y Billboard Global Excl. U.S.
      },

      // ── 5. Lila Downs: nació en Oaxaca — "Actual" no es región geográfica ─────
      {
        word: "Lila Downs",
        region: "Oaxaca",
        // Fuente: Wikipedia, Encyclopedia.com
        // Nació el 9 de septiembre de 1968 en Tlaxiaco, Oaxaca.
        // Su madre es mixteca; su padre es escocés-americano de Minnesota.
        // "Actual" es una etiqueta temática, no una región geográfica válida.
      },

      // ── 6. Chavela Vargas: nació en Costa Rica — region "Tradicional" es ambigua
      {
        word: "Chavela Vargas",
        region: "Internacional",
        meaning:
          "Cantante costarricense naturalizada mexicana, ícono de la ranchera adoptada por México",
        // Fuente: Wikipedia, Britannica
        // Nació el 17 de abril de 1919 en San Joaquín de Flores, Costa Rica.
        // Emigró a México a los 17 años; obtuvo la ciudadanía mexicana.
        // Su música es parte del patrimonio mexicano pero ella NO nació en México.
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
