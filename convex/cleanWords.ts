import { mutation } from "./_generated/server";

// ─── reorganizeModismos ─────────────────────────────────────────────────────
/**
 * Splits the giant "Modismos" category (1045 words) into contextual sub-categories.
 *
 * New categories created:
 *   Tradiciones  — national customs, celebrations, school life
 *   Regionalismos — state-specific slang, places, crafts, culture
 *   Gastronomía  — food & drinks (also absorbs existing Comida + Bebida)
 *   Telenovelas  — soap operas & TV shows
 *
 * Existing categories enriched:
 *   Músicos  — adds composers, bolero artists, mariachi, music groups
 *   Historia — adds independence/revolution heroes
 *   Artistas — adds Época de Oro actors, comics
 *
 * Words in easy-region slang (CDMX, Norte, Todo México…) stay as "Modismos".
 * Idempotent — safe to run multiple times.
 */
export const reorganizeModismos = mutation({
  args: {},
  handler: async (ctx) => {
    function norm(s: string) {
      return s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    // Regions considered "national/universal slang" — stay as Modismos
    const EASY_REGIONS = new Set([
      "Todo México","CDMX","Norte","Centro","Barrio","Callejero","Juvenil",
      "Monterrey","Sinaloa","Sonora","Frontera","Sur","CDMX / Centro",
      "Barrio / Centro","CDMX/Sur","Centro/Sur","Sur/Centro","Barrio: 1",
      "Escuela","Infantil","Internet","Juvenil/Internet","Familiar","Escolar",
    ]);

    // Meaning-keyword rules (checked in priority order, first match wins)
    const RULES: Array<{ keywords: string[]; cat: string }> = [
      // Telenovelas
      { keywords: ["telenovela","novela de tv","serie de televisión"], cat: "Telenovelas" },
      // Historia
      { keywords: ["héroe","heroína","insurgente","revolucionario","conquistador",
                   "virrey","padre de la independencia","líder agrario","carta magna",
                   "reforma de 1856","plan de iguala","tratado de"], cat: "Historia" },
      // Músicos — composers, groups, instruments
      { keywords: ["compositor","compositora","cantante","bolero","canción tradicional",
                   "canción símbolo","mariachi","norteño que pegó","grupo emblemático",
                   "grupo romántico","grupo de marco","trova nueva"], cat: "Músicos" },
      // Artistas — actors, comedians, comics
      { keywords: ["dúo cómico","comediante","cine de oro","cómic mexicano","comic mexicano",
                   "superhéroe mexicano","antihéroe","actor contemporáneo",
                   "actor, cantante","director y actor","aventurero pescador del cómic"], cat: "Artistas" },
      // Gastronomia — food & drinks
      { keywords: ["platillo","comida","agua fresca","bebida fermentada","bebida de maíz",
                   "dulce esponjoso","masa frita","caldo ","arroz frito","chile ",
                   "churro","tamal","tortilla","pan de","postre","pulque","tepache",
                   "mezcal","tequila","pozole","menudo","barbacoa","carnitas",
                   "cochinita","birria","tepache","colonche","tejuino",
                   "pepino fresco","azúcar hilada","galleta","polvorón"], cat: "Gastronomia" },
      // Tradiciones — celebrations, customs, rituals
      { keywords: ["celebración","fiesta tradicional","festividad","novena","ritual",
                   "ofrenda con","posadas","quince años","grito de","altar de muertos",
                   "día de muertos","temazcal","baño de vapor","escolta","bandera",
                   "conaliteg","recreo","tienda de la escuela","bautizo","serenata",
                   "cantos nocturnos","lazo y arras","mayordomía","convite",
                   "sistema de organización de fiestas","descanso más esperado",
                   "nueve noches","piñata de posada","piñata","día de reyes",
                   "celebración del 15","celebración del 12","mañanitas"], cat: "Tradiciones" },
    ];

    const allWords = await ctx.db.query("words").collect();
    const counts: Record<string, number> = {};

    for (const word of allWords) {
      const cat = (word as any).category as string | undefined;
      const region = (word as any).region as string | undefined;
      const meaning = ((word as any).meaning ?? "") as string;

      let newCat: string | null = null;

      if (cat === "Modismos") {
        // Only reclassify if NOT in an easy/slang region
        if (!EASY_REGIONS.has(region ?? "")) {
          const ml = meaning.toLowerCase();
          for (const rule of RULES) {
            if (rule.keywords.some((k) => ml.includes(k))) {
              newCat = rule.cat;
              break;
            }
          }
          if (!newCat) {
            // Default: any non-easy-region Modismo → Regionalismos
            newCat = "Regionalismos";
          }
        }
      } else if (cat === "Comida" || cat === "Bebida") {
        // Consolidate into Gastronomia
        newCat = "Gastronomia";
      }

      if (newCat && newCat !== cat) {
        await ctx.db.patch(word._id, { category: newCat } as any);
        counts[newCat] = (counts[newCat] ?? 0) + 1;
      }
    }

    // Return as array so Convex doesn't treat category names as field names
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(counts).map(([cat, count]) => `${cat}:${count}`);
    return { moved: total, breakdown };
  },
});

/**
 * Lista de palabras a eliminar del juego por contenido inapropiado.
 * Normalizado a MAYÚSCULAS sin acento para coincidir con la DB.
 */
const WORDS_TO_REMOVE = [
  // Explícitamente vulgares
  "VERGAS", "VERGA", "OJETE", "OJETES",
  "PENDEJO", "PENDEJA", "PENDEJOS", "PENDEJAS",
  "CABRON", "CABRÓN", "CABRONA", "CABRONAS", "CABRONES",
  "PUTA", "PUTAS", "PUTO", "PUTOS",
  "CHINGADA", "CHINGADERA", "CHINGADERAS", "CHINGADOS",
  "CULERO", "CULERA", "CULEROS", "CULERAS",
  "MAMÓN", "MAMON", "MAMONA", "MAMONES",
  "PINCHE", "PINCHES",

  // Modismos con raíz vulgar
  "CHINGON", "CHINGÓN", "CHINGONA", "CHIN", "CHINGA",
  "HUEVON", "HUEVÓN", "HUEVA", "ECHAR LA HUEVA",
  "A HUEVO", "NO TENER MADRE",
  "JOTO", "JOTOS", "JOTA",
  "PICHE", "PICHES",
];

/** Normaliza a MAYÚSCULAS sin tildes para comparar */
function normalize(str: string): string {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Elimina de la DB todas las palabras de la lista y sus niveles asociados.
 * Seguro de correr múltiples veces (idempotente).
 *
 * Ejecutar desde Convex dashboard: cleanWords:removeVulgarWords
 */
/**
 * Mueve las palabras de creadores al pool "difícil" (difficulty:2)
 * para que aparezcan DESPUÉS de los primeros ~50 niveles básicos,
 * mezcladas aleatoriamente según el usuario.
 * Idempotente — seguro de correr varias veces.
 */
export const fixCreatorWordDifficulty = mutation({
  args: {},
  handler: async (ctx) => {
    // Palabras que deben aparecer después del nivel 50, no al inicio
    const creatorWords = [
      "ALANA FLORES", "LA VELADA", "EL MARIANA",
      "JUAN GUARNIZO", "ARIGAMEPLAYS", "LUISITO COMUNICA",
      "WEREVERTUMORRO", "YOSS HOFFMAN", "CAELI",
    ];

    function norm(s: string) {
      return s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    const allWords = await ctx.db.query("words").collect();
    const updated: string[] = [];

    for (const word of allWords) {
      if (creatorWords.some((cw) => norm(cw) === norm(word.word))) {
        await ctx.db.patch(word._id, { difficulty: 2 } as any);
        updated.push(word.word);
      }
    }

    return { updated: updated.length, updatedWords: updated };
  },
});

/**
 * Corrige las categorías de las palabras de cultura digital que
 * fueron sobrescritas a "Modismos" por patchCategories:assignSlangCategories.
 * Idempotente.
 */
export const fixCulturaDigitalCategories = mutation({
  args: {},
  handler: async (ctx) => {
    function norm(s: string) {
      return s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    const CORRECT_CATS: Record<string, string> = {
      "ALANA FLORES": "Streamers", "LA VELADA": "Streamers", "EL MARIANA": "Streamers",
      "JUAN GUARNIZO": "Streamers", "ARIGAMEPLAYS": "Streamers", "LUISITO COMUNICA": "Streamers",
      "WEREVERTUMORRO": "Streamers", "YOSS HOFFMAN": "Streamers", "CAELI": "Streamers",
      "ROIER": "Streamers",
      "NATANAEL CANO": "Músicos", "PESO PLUMA": "Músicos", "JUNIOR H": "Músicos",
      "ESLABON ARMADO": "Músicos", "CORRIDO TUMBADO": "Músicos",
      "GABITO BALLESTEROS": "Músicos", "FUERZA REGIDA": "Músicos",
      "SHEEEEESH": "Jerga Digital", "RATIO": "Jerga Digital",
      "CHUPAR RUEDA": "Jerga Digital", "GHOSTEAR": "Jerga Digital",
      "HUGO SANCHEZ": "Futbolistas", "RAFAEL MARQUEZ": "Futbolistas",
      "CUAUHTEMOC BLANCO": "Futbolistas", "JORGE CAMPOS": "Futbolistas",
      "CHICHARITO": "Futbolistas", "GUILLERMO OCHOA": "Futbolistas",
      "ANDRES GUARDADO": "Futbolistas", "CHUCKY LOZANO": "Futbolistas",
      "RAUL JIMENEZ": "Futbolistas", "SANTIAGO GIMENEZ": "Futbolistas",
      "CARLOS VELA": "Futbolistas", "MEMO OCHOA": "Futbolistas",
    };

    const allWords = await ctx.db.query("words").collect();
    const updated: string[] = [];

    for (const word of allWords) {
      const key = norm(word.word);
      const correctCat = CORRECT_CATS[key];
      if (correctCat && (word as any).category !== correctCat) {
        await ctx.db.patch(word._id, { category: correctCat } as any);
        updated.push(`${word.word} → ${correctCat}`);
      }
    }

    return { updated: updated.length, updatedWords: updated };
  },
});

/**
 * Elimina todas las palabras de la categoría "Streamers" del juego.
 * Riesgo IP: usar nombres reales de creadores de contenido sin acuerdo comercial
 * puede generar reclamaciones de derecho al nombre / publicidad.
 * Los códigos de creador en la tabla referralCodes se conservan (son promocionales).
 * Idempotente — seguro de correr varias veces.
 */
export const removeStreamersWords = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const allLevels = await ctx.db.query("levels").collect();
    const levelByWordId = new Map(allLevels.map((l) => [l.wordId.toString(), l]));
    const removed: string[] = [];

    for (const word of allWords) {
      if ((word as any).category === "Streamers") {
        const lvl = levelByWordId.get(word._id.toString());
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(word._id);
        removed.push(word.word);
      }
    }
    return { removed: removed.length, removedWords: removed };
  },
});

export const removeVulgarWords = mutation({
  args: {},
  handler: async (ctx) => {
    const normalized = new Set(WORDS_TO_REMOVE.map(normalize));

    const allWords = await ctx.db.query("words").collect();
    const allLevels = await ctx.db.query("levels").collect();

    // Índice: wordId → levelDoc
    const levelByWordId = new Map(allLevels.map((l) => [l.wordId.toString(), l]));

    const removed: string[] = [];

    for (const word of allWords) {
      if (normalized.has(normalize(word.word))) {
        // Eliminar nivel asociado primero
        const lvl = levelByWordId.get(word._id.toString());
        if (lvl) await ctx.db.delete(lvl._id);
        // Eliminar la palabra
        await ctx.db.delete(word._id);
        removed.push(word.word);
      }
    }

    return {
      removed: removed.length,
      removedWords: removed,
    };
  },
});
