import { internalMutation } from "../_generated/server";

/**
 * Correcciones de la 9ª auditoría cultural (bloques 1-10 de seedWords1000).
 * Errores verificados con búsquedas en internet.
 *
 * Run desde el dashboard de Convex:  patchAudit9Errors:patchAudit9Errors
 */

export const patchAudit9Errors = internalMutation({
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
      // ── 1. Catedral Metropolitana: es la más ANTIGUA, no la más GRANDE ────────
      {
        word: "Catedral Metropolitana",
        meaning: "La catedral más antigua de América, símbolo del centro histórico de CDMX",
        // Fuente: Wikipedia, World Atlas, Britannica
        // La Basílica de Nuestra Señora de Aparecida (Brasil) tiene ~25,000 m² de interior
        // vs ~7,552 m² de la Catedral Metropolitana — es 3x más grande.
        // Lo correcto y verificado: la Catedral Metropolitana de CDMX es la MÁS ANTIGUA
        // de América Latina (fundada en 1573), no la más grande.
      },

      // ── 2. Sor Juana Inés de la Cruz: nació en Estado de México, no CDMX ──────
      {
        word: "Sor Juana Inés de la Cruz",
        region: "Estado de México",
        // Fuente: Wikipedia, Britannica, Municipio de Tepetlixpa
        // Nació c. 1648/1651 en San Miguel Nepantla, hoy "Nepantla de Sor Juana Inés de la Cruz",
        // municipio de Tepetlixpa, Estado de México. Vivió y trabajó en CDMX (convento).
      },

      // ── 3. Emilio Fernández: nació en Coahuila — NO en "Nacional" ─────────────
      {
        word: "Emilio Fernández",
        region: "Coahuila",
        // Fuente: Wikipedia, IMDb, Senses of Cinema
        // Nació el 26 de marzo de 1904 en Mineral del Hondo (Hondo), Coahuila.
        // Su madre era de ascendencia Kickapoo — de ahí su apodo "El Indio".
      },

      // ── 4. Grulla blanca: hiberna en Texas/Tamaulipas — NO en Chihuahua ───────
      {
        word: "Grulla blanca",
        region: "Norte",
        example: "La grulla blanca es la grulla más grande de Norteamérica y migra por el norte de México",
        // Fuente: USFWS, digitalcommons.unl.edu (NACWG Proceedings)
        // Grus americana hiberna principalmente en Aransas NWR, Texas.
        // Históricamente llegaba a Tamaulipas y Chihuahua, pero hoy su rango
        // invernal se limita a Texas; "llegaron a Chihuahua en invierno" es inexacto.
        // Lo que SÍ hiberna masivamente en Chihuahua (Laguna Babícora) es la
        // Grulla canadiense (sandhill crane), que es de color gris, no blanca.
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
