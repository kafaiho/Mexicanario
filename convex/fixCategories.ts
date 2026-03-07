import { mutation } from "./_generated/server";

// Normalize: uppercase, no accents, trimmed
function norm(s: string) {
  return s.toUpperCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

// ── Streamers ─────────────────────────────────────────────────────────────────
const STREAMERS = new Set([
  "EL RUBIUS", "AURONPLAY", "THEGREFG", "SPREEN", "QUACKITY",
  "IBAI LLANOS", "RIVERS", "KENAI", "ALANA FLORES", "EL MARIANA",
  "LUISITO COMUNICA", "YOSTOP", "BADABUN", "JUANSGUARNIZO",
  "LUISROX", "WEREVERTUMORRO", "CAELI", "MAKEUCHI", "ALAN ESTRADA",
].map(norm));

// ── Músicos (corridos tumbados + regional mexicano + pop) ─────────────────────
const MUSICOS = new Set([
  "PESO PLUMA", "NATANAEL CANO", "JUNIOR H", "ESLABÓN ARMADO",
  "CARIN LEON", "GRUPO FRONTERA", "EDEN MUNOZ", "BANDA MS",
  "CALIBRE 50", "CHRISTIAN NODAL", "YAHRITZA Y SU ESENCIA",
  "LOS DOS CARNALES", "XAVI", "GRUPO SOMBRA", "LUPILLO RIVERA",
  "GRUPO FIRME", "BANDA EL RECODO", "LOS YONICS", "LOS BUKIS",
  "LOS TIGRES DEL NORTE", "CHALINO SANCHEZ",
].map(norm));

// ── Futbolistas ───────────────────────────────────────────────────────────────
const FUTBOLISTAS = new Set([
  "CHICHARITO", "MEMO OCHOA", "CHUCKY LOZANO", "ANDRES GUARDADO",
  "RAFAEL MARQUEZ", "HUGO SANCHEZ", "CUAUHTEMOC BLANCO",
  "JORGE CAMPOS", "CARLOS HERMOSILLO", "ADOLFO BAUTISTA",
  "TECATITO CORONA", "ORBELIN PINEDA", "RAUL JIMENEZ",
].map(norm));

// ── Cultura Popular (TV, cine, lucha libre, personajes icónicos) ──────────────
const CULTURA_POPULAR = new Set([
  // Personajes de comedia / TV
  "CHESPIRITO", "EL CHAVO DEL 8", "EL CHAPULIN COLORADO", "LA CHILINDRINA",
  "DON RAMON", "QUICO", "LA BRUJA DEL 71", "CHABELO",
  "VIRUTA Y CAPULINA", "CANTINFLAS", "TIN TAN",
  // Lucha libre
  "LUCHA LIBRE", "EL SANTO", "BLUE DEMON", "MIL MASCARAS",
  "HIJO DEL SANTO", "ARENA MEXICO", "CMLL", "AAA",
  "PERRO AGUAYO", "LA PARKA", "SHOCKER", "MISTICO",
  "ANDRADE", "DR. WAGNER", "EL OLIMPICO",
  // Personajes de telenovela / cine
  "PEDRO INFANTE", "JORGE NEGRETE", "MARIA FELIX", "DOLORES DEL RIO",
  "MARIO MORENO",
].map(norm));

// ── Jerga Digital (internet, redes sociales, memes) ──────────────────────────
const JERGA_DIGITAL = new Set([
  "MEME", "VIRAL", "ESTAR VIRAL", "CANCELADO", "FUNAR", "CANCEL CULTURE",
  "STALKEAR", "SHIPPEAR", "POSTEAR", "SUBIRSE AL TREN",
  "CHISMECITO", "CHISME", "CRUSH", "GHOSTEAR", "GHOSTING",
  "LIKE", "COMENTARIO", "COMPARTIR", "HASHTAG", "THREAD",
  "TWITTER", "TIKTOK", "INSTAGRAM", "REELS", "STORIES",
  "STREAMER", "LIVE", "UNBOXING", "CHALLENGE", "TREND",
  "RATIO", "TEXTEAR", "HACKEAR", "TROLLEAR", "INFLUENCER",
  "YOUTUBER", "PODCAST", "SPAM", "FAKE NEWS", "CLICKBAIT",
].map(norm));

// ── Telenovelas ───────────────────────────────────────────────────────────────
const TELENOVELAS = new Set([
  "TELEVISA", "TV AZTECA", "TELENOVELA", "CUNA DE LOBOS",
  "LOS RICOS TAMBIEN LLORAN", "ROSA SALVAJE", "MARIA LA DEL BARRIO",
  "REBELDE", "LA USURPADORA", "EL CHEMA", "CANAVERAL DE PASIONES",
  "CORAZON SALVAJE", "MI CAMINO ES AMARTE",
  "VENEVISION", "UNIVISION",
].map(norm));

function getFixedCategory(word: string, currentCat: string): string | null {
  const n = norm(word);
  if (STREAMERS.has(n))       return "Mundo Digital";
  if (FUTBOLISTAS.has(n))     return "Mundo Digital";
  if (MUSICOS.has(n))         return "Música y Artistas";
  if (CULTURA_POPULAR.has(n)) return "Cultura Popular";
  if (JERGA_DIGITAL.has(n))   return "Mundo Digital";
  if (TELENOVELAS.has(n))     return "Cultura Popular";
  return null; // no change
}

/**
 * Reclasifica palabras mal categorized en Expresiones/Música hacia sus
 * categorías correctas: Streamers, Músicos, Futbolistas, Cultura Popular,
 * Jerga Digital, Telenovelas.
 *
 * Ejecutar: fixCategories:fixCategories
 */
export const fixCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    // Only look at words that might be miscategorized
    const candidates = allWords.filter((w) =>
      ["Expresiones", "Música", "Modismos", "Cultura Digital",
       "Corridos Tumbados", "Jerga Digital"].includes((w as any).category)
    );

    const results: { word: string; from: string; to: string }[] = [];

    for (const w of candidates) {
      const newCat = getFixedCategory(w.word, (w as any).category);
      if (newCat && newCat !== (w as any).category) {
        await ctx.db.patch(w._id, { category: newCat } as any);
        results.push({ word: w.word, from: (w as any).category, to: newCat });
      }
    }

    const summary: Record<string, number> = {};
    for (const r of results) {
      // ASCII-safe key (Convex disallows non-ASCII object keys in return values)
      const key = r.to.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      summary[key] = (summary[key] ?? 0) + 1;
    }

    return { patched: results.length, summary };
  },
});
