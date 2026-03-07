import { mutation } from "./_generated/server";

/**
 * Corrige errores culturales/geográficos encontrados en la auditoría de los
 * primeros 100 niveles. Ejecutar desde el dashboard de Convex una sola vez.
 *
 * Run: patchCulturalErrors:patchCulturalErrors
 */

const CORRECTIONS: {
  word: string;
  region?: string;
  meaning?: string;
  example?: string;
}[] = [
  // ── Regiones incorrectas ────────────────────────────────────────────────────
  {
    word: "Pedro Infante",
    region: "Sinaloa",
    meaning: "Ídolo de la música ranchera y el cine de oro",
    example: "Escuchamos canciones de Pedro Infante, el ídolo de Guamúchil",
    // ANTES: region "Época de Oro" (no es región geográfica)
    // Nació en Mazatlán, creció en Guamúchil, Sinaloa
  },
  {
    word: "Dolores del Río",
    region: "Durango",
    meaning: "Primera actriz latina en Hollywood, nacida en Durango",
    example: "Dolores del Río fue la primera gran estrella latina de Hollywood",
    // ANTES: region "Chihuahua" — INCORRECTO. Nació en Victoria de Durango.
  },
  {
    word: "Danzón",
    region: "Nacional",
    meaning: "Baile de salón de origen cubano adoptado y enriquecido por México",
    example: "El danzón se baila en el Parque México de CDMX y en Veracruz",
    // ANTES: region "Veracruz" pero el ejemplo mencionaba el Parque México (CDMX)
    // El danzón nació en Cuba (Matanzas, 1879), llegó a México por Veracruz y
    // Yucatán, y se desarrolló en el Salón México de CDMX.
  },
  {
    word: "Tlacuache",
    region: "Todo México",
    meaning: "Único marsupial nativo de México, habita en casi todo el país",
    example: "Un tlacuache se metió en la casa por el techo",
    // ANTES: region "CDMX" — se encuentra en 26 de los 32 estados
  },
  {
    word: "Tecolote",
    region: "Todo México",
    meaning: "Búho pequeño, en la cultura popular anuncia mal augurio",
    example: "Cuando canta el tecolote, el indio muere —dice el dicho mexicano",
    // ANTES: region "Norte" — el tecolote es símbolo cultural de todo México
  },
  {
    word: "Cacomixtle",
    region: "Norte",
    meaning: "Mamífero nocturno del norte y centro de México",
    example: "El cacomixtle se metió por el techo a robar comida",
    // ANTES: region "Sur" — el cacomixtle (Bassariscus astutus) vive en el Norte y Centro
  },
  {
    word: "Zorrillo",
    region: "Todo México",
    meaning: "Mamífero que lanza líquido fétido como defensa",
    example: "El zorrillo espantó a todos con su terrible olor",
    // ANTES: region "Bosques" — no es región geográfica válida
  },
  {
    word: "Murciélago magueyero",
    region: "Occidente",
    meaning: "Polinizador del agave, esencial para el tequila y el mezcal",
    example: "Sin el murciélago magueyero no habría tequila ni mezcal",
    // ANTES: region "Agavero" — no es región geográfica válida
  },
  // ── Descripción imprecisa ───────────────────────────────────────────────────
  {
    word: "Piedra del Sol",
    meaning: "Gran monolito mexica que representa el cosmograma del universo azteca",
    example: "La Piedra del Sol está en el Museo de Antropología y pesa 24 toneladas",
    // ANTES: "con el calendario" — error común: no es un calendario funcional sino
    // un cosmograma que sintetiza la cosmovisión mexica (los cinco soles, Tonatiuh).
    // El INAH la llama "representación del tiempo" no "calendario".
  },
];

export const patchCulturalErrors = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const results: { word: string; status: string; changes: string[] }[] = [];

    for (const correction of CORRECTIONS) {
      const dbWord = allWords.find(
        (w) => w.word.trim().toLowerCase() === correction.word.trim().toLowerCase()
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
      total: CORRECTIONS.length,
      patched: results.filter((r) => r.status === "PATCHED").length,
      notFound: results.filter((r) => r.status === "NOT_FOUND").length,
      alreadyCorrect: results.filter((r) => r.status === "ALREADY_CORRECT").length,
      details: results,
    };
  },
});
