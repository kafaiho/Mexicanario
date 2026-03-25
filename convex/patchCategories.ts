import { mutation } from "./_generated/server";

/**
 * Asigna categorías correctas a las palabras de slang/jerga mexicana.
 * CORREGIDO: slang → Modismos (ya NO → Historia), bebidas → Bebida.
 *
 * Run from Convex dashboard: patchCategories:assignSlangCategories
 */
export const assignSlangCategories = mutation({
    args: {},
    handler: async (ctx) => {
        // Palabras de slang/jerga → Modismos (expresiones culturales mexicanas)
        // Palabras de bebidas → Bebida, comidas → Comida, animales → Animales
        const SLANG_CATEGORY_MAP: Record<string, string> = {
            // Expresiones generales → Modismos
            "chido": "Modismos",
            "neta": "Modismos",
            "órale": "Modismos",
            "güey": "Modismos",
            "güey / wey": "Modismos",
            "chamba": "Modismos",
            "no manches": "Modismos",
            "platicar": "Modismos",
            "sale": "Modismos",
            "lana": "Modismos",
            "fresa": "Modismos",
            "naco": "Modismos",
            "chafa": "Modismos",
            "gacho": "Modismos",
            "morra / morro": "Modismos",
            "carnal": "Modismos",
            "¡qué oso!": "Modismos",
            "chismoso": "Modismos",
            "tirar paro": "Modismos",
            "echar la hueva": "Modismos",
            "hacerse güey": "Modismos",
            "ya valió madre": "Modismos",
            "pendejo": "Modismos",
            "cabrón": "Modismos",
            "vieja": "Modismos",
            "jaina": "Modismos",
            "cotorreo": "Modismos",
            "agüitado": "Modismos",
            "echar taco de ojo": "Comida",
            "irse de rol": "Modismos",
            "poner el cuerno": "Modismos",
            "no dar el ancho": "Modismos",
            "caer gordo": "Modismos",
            "estar cañón": "Modismos",
            "a darle que es mole de olla": "Comida",
            // Bebidas → Bebida
            "chela": "Bebida",
            "peda": "Bebida",
            "crudo": "Bebida",
            "andar pedo": "Bebida",
            "armarla de pedo": "Bebida",
            "estar hasta las chanclas": "Bebida",
            "pisto": "Bebida",
            // Regionalismos → Modismos
            "chilango": "Modismos",
            "camión": "Modismos",
            "micro": "Modismos",
            "cuate": "Modismos",
            "neta del planeta": "Modismos",
            "ándale": "Modismos",
            "metro": "Modismos",
            "puchador": "Modismos",
            "chaleco": "Modismos",
            "machín": "Modismos",
            "morrita": "Modismos",
            "fierro pariente": "Modismos",
            "andar con madre": "Modismos",
            "huerco": "Modismos",
            "troca": "Modismos",
            "congal": "Modismos",
            "plebe": "Modismos",
            "a la bestia": "Modismos",
            "un paro": "Modismos",
            "choco": "Modismos",
            "bato": "Modismos",
            "ñero": "Modismos",
            "pichar": "Modismos",
            "me late": "Modismos",
            "estar padre": "Modismos",
            "chambear": "Modismos",
            "echar relajo": "Modismos",
            "puchis": "Modismos",
            // Yucatán → Modismos (regionalismos) o categoría natural
            "xix": "Comida",
            "pib": "Comida",
            "tuch": "Modismos",
            "poch": "Modismos",
            "turix": "Animales",
            "pacha": "Modismos",
            "jach": "Modismos",
            "a'huevo": "Modismos",
            "tuchito": "Modismos",
            // Norte / Barrio → Modismos
            "bato loco": "Modismos",
            "andar bravo": "Modismos",
            "tirar esquina": "Modismos",
            "jalón": "Modismos",
            "halcón": "Animales",
            "troca blindada": "Modismos",
            "clica": "Modismos",
            "tirar barrio": "Modismos",
            "estar en la movida": "Modismos",
            // Internet / Juvenil → Modismos
            "cancelado": "Modismos",
            "funar": "Modismos",
            "chismecito": "Modismos",
            "stalkear": "Modismos",
            "crush": "Modismos",
            "shippear": "Modismos",
            "postear": "Modismos",
            "subirse al tren": "Modismos",
            "estar viral": "Modismos",
            "meme": "Modismos",
        };

        const allWords = await ctx.db.query("words").collect();
        let updated = 0;
        let alreadySet = 0;
        let notMapped = 0;

        for (const word of allWords) {
            // Skip words that already have a correct category (set by seedCuratedLevels)
            if (word.category && word.category !== "Misceláneo" && word.category !== "Arepas") {
                alreadySet++;
                continue;
            }

            const key = word.word.toLowerCase().trim();
            const correctCategory = SLANG_CATEGORY_MAP[key];

            if (correctCategory) {
                await ctx.db.patch(word._id, { category: correctCategory });
                updated++;
            } else if (!word.category || word.category === "Misceláneo" || word.category === "Arepas") {
                // Fallback: any expression not specifically mapped goes to Modismos (NOT Historia)
                await ctx.db.patch(word._id, { category: "Modismos" });
                updated++;
            } else {
                notMapped++;
            }
        }

        return { updated, alreadySet, notMapped };
    },
});

/**
 * @deprecated Use assignSlangCategories instead.
 * Kept for backwards compatibility only — do NOT use.
 */
export const forceCategories = mutation({
    args: {},
    handler: async (ctx) => {
        const words = await ctx.db.query("words").collect();
        let updated = 0;
        for (const word of words) {
            if (!word.category || word.category === "Misceláneo" || word.category === "Arepas") {
                await ctx.db.patch(word._id, { category: "Modismos" });
                updated++;
            }
        }
        return { updated };
    }
});

export const forceCorrectAllCategories = mutation({
    args: {},
    handler: async (ctx) => {
        // Complete mapping based on all known words
        const CORRECT_CATEGORY_MAP: Record<string, string> = {
            // N1
            "taco": "Comida", "tamal": "Comida", "pozole": "Comida", "mole": "Comida", "tlayuda": "Comida",
            // N2
            "pan de muerto": "Comida", "atole": "Bebida", "champurrado": "Bebida", "buñuelo": "Comida", "calabaza en tacha": "Comida",
            // N3
            "trompo": "Juegos", "balero": "Juegos", "lotería": "Juegos", "canicas": "Juegos", "pirinola": "Juegos",
            // N4
            "serpientes y escaleras": "Juegos", "rayuela": "Juegos", "stop": "Juegos", "encantados": "Juegos",
            // N5
            "mariachi": "Música", "ranchera": "Música", "corrido": "Música", "banda": "Música", "cumbia mexicana": "Música",
            // N6
            "son jarocho": "Música", "huapango": "Música", "bolero": "Música", "norteño": "Música", "chilena costeña": "Música",
            // N7
            "jaguar": "Animales", "águila real": "Animales", "serpiente cascabel": "Animales", "cenzontle": "Animales", "armadillo": "Animales",
            // N8
            "ajolote": "Animales", "xoloitzcuintle": "Animales", "chapulín": "Animales", "guacamaya": "Animales", "mapache": "Animales",
            // N9
            "esquites": "Comida", "tostilocos": "Comida", "pambazo": "Comida", "torta ahogada": "Comida", "huarache": "Comida", "chilaquiles": "Comida",
            // N10
            "la víbora de la mar": "Juegos", "la roña": "Juegos", "burro castigado": "Juegos", "doña blanca": "Juegos", "a las escondidas": "Juegos",
            // N11
            "pedro infante": "Música", "chavela vargas": "Música", "josé alfredo jiménez": "Música", "lila downs": "Música", "juan gabriel": "Música", "vicente fernández": "Música",
            // N12
            "ocelote": "Animales", "tlacuache": "Animales", "colibrí": "Animales", "murciélago magueyero": "Animales", "iguana": "Animales", "zorrillo": "Animales",
            // N13
            "orozco": "Artistas", "siqueiros": "Artistas", "rufino tamayo": "Artistas", "leonora carrington": "Artistas", "remedios varo": "Artistas", "octavio paz": "Artistas",
            // N14
            "monte albán": "Monumentos", "palenque": "Monumentos", "uxmal": "Monumentos", "calakmul": "Monumentos", "paquimé": "Monumentos", "mitla": "Monumentos",

            // ── NUEVOS NIVELES (15 a 31) Y SIMILARES ──
            "francisco i madero": "Historia", "venustiano carranza": "Historia", "alvaro obregon": "Historia", "lazaro cardenas": "Historia", "porfirio diaz": "Historia", "constitucion 1917": "Historia",
            "agave": "Plantas", "flor de nochebuena": "Plantas", "flor de dalia": "Plantas", "flor de cacao": "Plantas", "flor de vainilla": "Plantas", "flor de maguey": "Plantas",
            "alegria": "Comida", "cocada": "Comida", "palanqueta": "Comida", "borrachito": "Comida", "glorias": "Comida", "mazapan": "Comida",
            "la viborita de la mar": "Juegos", "el patio de mi casa": "Juegos", "las estatuas": "Juegos", "el avioncito": "Juegos", "policias y ladrones": "Juegos",
            "caifanes": "Música", "mana": "Música", "molotov": "Música", "cafe tacuba": "Música", "zoe": "Música", "el tri": "Música",
            "escamoles": "Animales", "chinicuiles": "Animales", "jumiles": "Animales", "hormiga chicatana": "Animales", "chapulin tostado": "Animales", "gusano de maguey": "Animales",
            "cantinflas": "Artistas", "maria felix": "Artistas", "pedro armendariz": "Artistas", "dolores del rio": "Artistas", "jorge negrete": "Artistas", "katy jurado": "Artistas",
            "soumaya": "Monumentos", "biblioteca vasconcelos": "Monumentos", "estadio azteca": "Monumentos", "monumento a la revolucion": "Monumentos", "malecon de mazatlan": "Monumentos", "plaza de las tres culturas": "Monumentos",
            // CORRECTED: civilizaciones prehispánicas → Civilizaciones (NOT Historia)
            "olmecas": "Civilizaciones", "mayas": "Civilizaciones", "mexicas": "Civilizaciones", "zapotecas": "Civilizaciones", "mixtecos": "Civilizaciones", "toltecas": "Civilizaciones",
            "epazote": "Plantas", "cilantro": "Plantas", "hierba santa": "Plantas", "achiote": "Plantas", "oregano mexicano": "Plantas", "manzanilla": "Plantas",
            "cabrito": "Comida", "machaca": "Comida", "discada": "Comida", "asado de puerco": "Comida", "menudo norteno": "Comida", "gorditas": "Comida",
            "cochinita pibil": "Comida", "panucho": "Comida", "salbute": "Comida", "tamales chiapanecos": "Comida", "pescado a la talla": "Comida", "mole negro": "Comida",
            "futbolito": "Juegos", "domino": "Juegos", "ajedrez": "Juegos", "jenga": "Juegos", "uno": "Juegos", "loteria moderna": "Juegos",
            "natalia lafourcade": "Música", "julieta venegas": "Música", "carlos rivera": "Música", "danna paola": "Música", "christian nodal": "Música", "belinda": "Música",
            "puma": "Animales", "condor": "Animales", "coyote": "Animales", "halcon peregrino": "Animales", "zorra del desierto": "Animales", "berrendo": "Animales",
            "juan rulfo": "Artistas", "rosario castellanos": "Artistas", "carlos fuentes": "Artistas", "elena poniatowska": "Artistas", "jose emilio pacheco": "Artistas", "guadalupe nettel": "Artistas",
            "guanajuato": "Monumentos", "san miguel de allende": "Monumentos", "puebla": "Monumentos", "queretaro": "Monumentos", "zacatecas": "Monumentos", "morelia": "Monumentos",

            // Bebidas
            "chela": "Bebida", "peda": "Bebida", "crudo": "Bebida", "andar pedo": "Bebida", "estar hasta las chanclas": "Bebida", "pisto": "Bebida",

            // Comidas del slang
            "xix": "Comida", "pib": "Comida", "a darle que es mole de olla": "Comida", "echar taco de ojo": "Comida",

            // Animales en slang
            "turix": "Animales", "halcón": "Animales", "halcon": "Animales"
        };

        const allWords = await ctx.db.query("words").collect();
        let updated = 0;

        for (const word of allWords) {
            let key = word.word.toLowerCase().trim();
            const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            let correctCat = CORRECT_CATEGORY_MAP[key] || CORRECT_CATEGORY_MAP[normalizedKey];

            // No fallback: keep current category if word not in map
            if (!correctCat) continue;

            if (word.category !== correctCat || word.category === "Arepas" || word.category === "Misceláneo") {
                await ctx.db.patch(word._id, { category: correctCat });
                updated++;
            }
        }

        return { updated, message: `Forcefully reassigned ${updated} words to accurate Mexican categories.` };
    }
});

export const autoFixDatabase = mutation({
    args: {},
    handler: async (ctx) => {
        // 1. Rename "Arepas" collection to "Taco"
        const collections = await ctx.db.query("collections").collect();
        for (const col of collections) {
            if (col.name === "Arepas") {
                await ctx.db.patch(col._id, { name: "Taco" });
            }
        }

        // 2. Fix words categories to be strictly Mexican
        const CORRECT_CATEGORY_MAP: Record<string, string> = {
            "taco": "Comida", "tamal": "Comida", "pozole": "Comida", "mole": "Comida", "tlayuda": "Comida",
            "pan de muerto": "Comida", "atole": "Bebida", "champurrado": "Bebida", "buñuelo": "Comida", "calabaza en tacha": "Comida",
            "trompo": "Juegos", "balero": "Juegos", "lotería": "Juegos", "canicas": "Juegos", "pirinola": "Juegos",
            "serpientes y escaleras": "Juegos", "rayuela": "Juegos", "stop": "Juegos", "encantados": "Juegos",
            "mariachi": "Música", "ranchera": "Música", "corrido": "Música", "banda": "Música", "cumbia mexicana": "Música",
            "son jarocho": "Música", "huapango": "Música", "bolero": "Música", "norteño": "Música", "chilena costeña": "Música",
            "jaguar": "Animales", "águila real": "Animales", "serpiente cascabel": "Animales", "cenzontle": "Animales", "armadillo": "Animales",
            "ajolote": "Animales", "xoloitzcuintle": "Animales", "chapulín": "Animales", "guacamaya": "Animales", "mapache": "Animales",
            "esquites": "Comida", "tostilocos": "Comida", "pambazo": "Comida", "torta ahogada": "Comida", "huarache": "Comida", "chilaquiles": "Comida",
            "la víbora de la mar": "Juegos", "la roña": "Juegos", "burro castigado": "Juegos", "doña blanca": "Juegos", "a las escondidas": "Juegos",
            "pedro infante": "Música", "chavela vargas": "Música", "josé alfredo jiménez": "Música", "lila downs": "Música", "juan gabriel": "Música", "vicente fernández": "Música",
            "ocelote": "Animales", "tlacuache": "Animales", "colibrí": "Animales", "murciélago magueyero": "Animales", "iguana": "Animales", "zorrillo": "Animales",
            "orozco": "Artistas", "siqueiros": "Artistas", "rufino tamayo": "Artistas", "leonora carrington": "Artistas", "remedios varo": "Artistas", "octavio paz": "Artistas",
            "monte albán": "Monumentos", "palenque": "Monumentos", "uxmal": "Monumentos", "calakmul": "Monumentos", "paquimé": "Monumentos", "mitla": "Monumentos",
            "francisco i madero": "Historia", "venustiano carranza": "Historia", "alvaro obregon": "Historia", "lazaro cardenas": "Historia", "porfirio diaz": "Historia", "constitucion 1917": "Historia",
            "agave": "Plantas", "flor de nochebuena": "Plantas", "flor de dalia": "Plantas", "flor de cacao": "Plantas", "flor de vainilla": "Plantas", "flor de maguey": "Plantas",
            "alegria": "Comida", "cocada": "Comida", "palanqueta": "Comida", "borrachito": "Comida", "glorias": "Comida", "mazapan": "Comida",
            "la viborita de la mar": "Juegos", "el patio de mi casa": "Juegos", "las estatuas": "Juegos", "el avioncito": "Juegos", "policias y ladrones": "Juegos",
            "caifanes": "Música", "mana": "Música", "molotov": "Música", "cafe tacuba": "Música", "zoe": "Música", "el tri": "Música",
            "escamoles": "Animales", "chinicuiles": "Animales", "jumiles": "Animales", "hormiga chicatana": "Animales", "chapulin tostado": "Animales", "gusano de maguey": "Animales",
            "cantinflas": "Artistas", "maria felix": "Artistas", "pedro armendariz": "Artistas", "dolores del rio": "Artistas", "jorge negrete": "Artistas", "katy jurado": "Artistas",
            "soumaya": "Monumentos", "biblioteca vasconcelos": "Monumentos", "estadio azteca": "Monumentos", "monumento a la revolucion": "Monumentos", "malecon de mazatlan": "Monumentos", "plaza de las tres culturas": "Monumentos",
            // CORRECTED: civilizaciones prehispánicas → Civilizaciones (NOT Historia)
            "olmecas": "Civilizaciones", "mayas": "Civilizaciones", "mexicas": "Civilizaciones", "zapotecas": "Civilizaciones", "mixtecos": "Civilizaciones", "toltecas": "Civilizaciones",
            "epazote": "Plantas", "cilantro": "Plantas", "hierba santa": "Plantas", "achiote": "Plantas", "oregano mexicano": "Plantas", "manzanilla": "Plantas",
            "cabrito": "Comida", "machaca": "Comida", "discada": "Comida", "asado de puerco": "Comida", "menudo norteno": "Comida", "gorditas": "Comida",
            "cochinita pibil": "Comida", "panucho": "Comida", "salbute": "Comida", "tamales chiapanecos": "Comida", "pescado a la talla": "Comida", "mole negro": "Comida",
            "futbolito": "Juegos", "domino": "Juegos", "ajedrez": "Juegos", "jenga": "Juegos", "uno": "Juegos", "loteria moderna": "Juegos",
            "natalia lafourcade": "Música", "julieta venegas": "Música", "carlos rivera": "Música", "danna paola": "Música", "christian nodal": "Música", "belinda": "Música",
            "puma": "Animales", "condor": "Animales", "coyote": "Animales", "halcon peregrino": "Animales", "zorra del desierto": "Animales", "berrendo": "Animales",
            "juan rulfo": "Artistas", "rosario castellanos": "Artistas", "carlos fuentes": "Artistas", "elena poniatowska": "Artistas", "jose emilio pacheco": "Artistas", "guadalupe nettel": "Artistas",
            "guanajuato": "Monumentos", "san miguel de allende": "Monumentos", "puebla": "Monumentos", "queretaro": "Monumentos", "zacatecas": "Monumentos", "morelia": "Monumentos",
            "chela": "Bebida", "peda": "Bebida", "crudo": "Bebida", "andar pedo": "Bebida", "estar hasta las chanclas": "Bebida", "pisto": "Bebida",
            "xix": "Comida", "pib": "Comida", "a darle que es mole de olla": "Comida", "echar taco de ojo": "Comida",
            "turix": "Animales", "halcón": "Animales", "halcon": "Animales"
        };

        const allWords = await ctx.db.query("words").collect();
        for (const word of allWords) {
            let key = word.word.toLowerCase().trim();
            const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let correctCat = CORRECT_CATEGORY_MAP[key] || CORRECT_CATEGORY_MAP[normalizedKey];

            if (key === "lotería" || key === "loteria") correctCat = "Juegos";
            if (key === "trompo") correctCat = "Juegos";
            if (key === "balero") correctCat = "Juegos";

            // No fallback: if word is not in the map, keep its current category
            // (reclassifyModismos:migrateAll already distributed words to 19 categories)
            if (!correctCat) continue;

            if (word.category !== correctCat || word.category === "Arepas" || word.category === "Misceláneo") {
                await ctx.db.patch(word._id, { category: correctCat });
            }
        }
        return "Database fixed successfully!";
    }
});

export const renameArepasToTacos = mutation({
    args: {},
    handler: async (ctx) => {
        const allWords = await ctx.db.query("words").collect();
        let updated = 0;
        for (const word of allWords) {
            if (word.category === "Arepas") {
                await ctx.db.patch(word._id, { category: "Tacos" });
                updated++;
            }
            if (word.word.toLowerCase() === "tamal") {
                await ctx.db.patch(word._id, { category: "Comida" });
                updated++;
            }
        }
        return `Renamed ${updated} items.`;
    }
});

/**
 * MIGRACIÓN DEFINITIVA — Reorganiza todas las palabras en 15 categorías canónicas.
 * Elimina "Historia" como categoría basura. Consolida categorías redundantes.
 *
 * 15 categorías canónicas:
 *   Tier 1 — Fácil:  Comida, Bebida, Juegos, Modismos, Refranes
 *   Tier 2 — Medio:  Música, Animales, Plantas, Artistas, Tradiciones, Cultura Popular, Leyendas
 *   Tier 3 — Difícil: Historia, Civilizaciones, Monumentos
 *
 * Run from Convex dashboard: patchCategories:reorganizeCategories
 */
export const reorganizeCategories = mutation({
    args: {},
    handler: async (ctx) => {
        // ── Category-level merges (old category name → canonical category) ──────
        const CATEGORY_MERGE: Record<string, string> = {
            // Tier 1 absorptions
            "Tacos":              "Comida",
            "Sabores":            "Comida",
            "Pan Dulce":          "Comida",
            "Feria":              "Juegos",
            "Jerga":              "Modismos",
            "Lenguaje":           "Modismos",
            "Escuela":            "Modismos",
            // Tier 2 absorptions
            "Grupero":            "Música",
            "Instrumentos":       "Música",
            "Remedios":           "Plantas",
            "Naturaleza":         "Plantas",
            "Cine":               "Artistas",
            "Devoción":           "Tradiciones",
            "Devocion":           "Tradiciones",
            "Festivales":         "Tradiciones",
            "Arte Popular":       "Tradiciones",
            "Entretenimiento":    "Cultura Popular",
            "Cómics":             "Cultura Popular",
            "Cultura Urbana":     "Cultura Popular",
            "Moda":               "Cultura Popular",
            "Deporte":            "Cultura Popular",
            // Tier 3 absorptions
            "Náhuatl":            "Civilizaciones",
            "Colonial":           "Monumentos",
            "Héroes":             "Historia",
            // Canonical 15 — identity (no change needed)
            "Comida":             "Comida",
            "Bebida":             "Bebida",
            "Juegos":             "Juegos",
            "Modismos":           "Modismos",
            "Refranes":           "Refranes",
            "Música":             "Música",
            "Animales":           "Animales",
            "Plantas":            "Plantas",
            "Artistas":           "Artistas",
            "Tradiciones":        "Tradiciones",
            "Cultura Popular":    "Cultura Popular",
            "Leyendas":           "Leyendas",
            "Historia":           "Historia",  // re-evaluated per-word below
            "Civilizaciones":     "Civilizaciones",
            "Monumentos":         "Monumentos",
        };

        // ── Word-level overrides ─────────────────────────────────────────────────
        // Fixes words that landed in "Historia" incorrectly (the dumping-ground bug).
        const WORD_OVERRIDE: Record<string, string> = {
            // Slang / jerga → Modismos
            "chido": "Modismos", "neta": "Modismos", "órale": "Modismos",
            "güey": "Modismos", "güey / wey": "Modismos",
            "chamba": "Modismos", "no manches": "Modismos",
            "platicar": "Modismos", "sale": "Modismos", "lana": "Modismos",
            "fresa": "Modismos", "naco": "Modismos", "chafa": "Modismos",
            "gacho": "Modismos", "morra / morro": "Modismos",
            "carnal": "Modismos", "¡qué oso!": "Modismos",
            "chismoso": "Modismos", "tirar paro": "Modismos",
            "echar la hueva": "Modismos", "hacerse güey": "Modismos",
            "ya valió madre": "Modismos", "pendejo": "Modismos",
            "cabrón": "Modismos", "vieja": "Modismos", "jaina": "Modismos",
            "cotorreo": "Modismos", "agüitado": "Modismos",
            "irse de rol": "Modismos", "poner el cuerno": "Modismos",
            "no dar el ancho": "Modismos", "caer gordo": "Modismos",
            "estar cañón": "Modismos",
            // Regionalismos → Modismos
            "chilango": "Modismos", "camión": "Modismos", "micro": "Modismos",
            "cuate": "Modismos", "neta del planeta": "Modismos",
            "ándale": "Modismos", "metro": "Modismos", "puchador": "Modismos",
            "chaleco": "Modismos", "machín": "Modismos", "morrita": "Modismos",
            "fierro pariente": "Modismos", "andar con madre": "Modismos",
            "huerco": "Modismos", "troca": "Modismos", "congal": "Modismos",
            "plebe": "Modismos", "a la bestia": "Modismos", "un paro": "Modismos",
            "choco": "Modismos", "bato": "Modismos", "ñero": "Modismos",
            "pichar": "Modismos", "me late": "Modismos", "estar padre": "Modismos",
            "chambear": "Modismos", "echar relajo": "Modismos", "puchis": "Modismos",
            // Yucatán regionalismos → Modismos
            "tuch": "Modismos", "poch": "Modismos", "pacha": "Modismos",
            "jach": "Modismos", "a'huevo": "Modismos", "tuchito": "Modismos",
            // Norte / Barrio → Modismos
            "bato loco": "Modismos", "andar bravo": "Modismos",
            "tirar esquina": "Modismos", "jalón": "Modismos",
            "troca blindada": "Modismos", "clica": "Modismos",
            "tirar barrio": "Modismos", "estar en la movida": "Modismos",
            // Internet / Juvenil → Modismos
            "cancelado": "Modismos", "funar": "Modismos",
            "chismecito": "Modismos", "stalkear": "Modismos", "crush": "Modismos",
            "shippear": "Modismos", "postear": "Modismos",
            "subirse al tren": "Modismos", "estar viral": "Modismos",
            "meme": "Modismos",
            // Bebidas mal clasificadas → Bebida
            "chela": "Bebida", "peda": "Bebida", "crudo": "Bebida",
            "andar pedo": "Bebida", "armarla de pedo": "Bebida",
            "estar hasta las chanclas": "Bebida", "pisto": "Bebida",
            // Civilizaciones prehispánicas → Civilizaciones
            "olmecas": "Civilizaciones", "mayas": "Civilizaciones",
            "mexicas": "Civilizaciones", "zapotecas": "Civilizaciones",
            "mixtecos": "Civilizaciones", "toltecas": "Civilizaciones",
            // Deidades prehispánicas → Civilizaciones
            "quetzalcóatl": "Civilizaciones", "quetzalcoatl": "Civilizaciones",
            "tlaloc": "Civilizaciones", "coatlicue": "Civilizaciones",
            "huitzilopochtli": "Civilizaciones", "tezcatlipoca": "Civilizaciones",
            "xipe totec": "Civilizaciones", "xochiquetzal": "Civilizaciones",
            // Artefactos / ciudades prehispánicas → Civilizaciones
            "piedra del sol": "Civilizaciones",
            "tenochtitlan": "Civilizaciones",  // the city; the battle stays Historia
            // Animales (halcón es un ave real)
            "turix": "Animales", "halcón": "Animales", "halcon": "Animales",
        };

        const allWords = await ctx.db.query("words").collect();
        let updated = 0;
        let skipped = 0;

        for (const word of allWords) {
            const wordText = word.word.trim();
            const key = wordText.toLowerCase();
            const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const currentCat = word.category ?? "";

            // Priority 1: explicit word-level override (fixes Historia dumping-ground)
            const wordOverride =
                WORD_OVERRIDE[wordText] ??
                WORD_OVERRIDE[key] ??
                WORD_OVERRIDE[normalizedKey];

            // Priority 2: category-level merge (consolidates legacy categories)
            const catMerged = CATEGORY_MERGE[currentCat];

            // Priority 3: truly unknown words → Modismos (NOT Historia)
            const newCat = wordOverride ?? catMerged ?? "Modismos";

            if (word.category !== newCat) {
                await ctx.db.patch(word._id, { category: newCat });
                updated++;
            } else {
                skipped++;
            }
        }

        return {
            updated,
            skipped,
            total: allWords.length,
            message: `Reorganized ${updated} words into 15 balanced categories. Historia fallback removed.`,
        };
    },
});

/**
 * Limpia la base de datos de palabras en 3 pasos:
 *   1. Repara entradas compuestas "X / Y" → queda solo la primera forma.
 *   2. Deduplica palabras con la misma forma normalizada (sin acentos, minúsculas).
 *      El canónico es el que tiene más referencias en `levels`; en caso de empate,
 *      el que tiene acentos (string más largo). Los duplicados se eliminan y sus
 *      referencias en `levels` se reasignan al canónico.
 *   3. Retorna un reporte con el conteo de cambios.
 *
 * Run from Convex dashboard: patchCategories:cleanupDuplicateWords
 */
export const cleanupDuplicateWords = mutation({
    args: {},
    handler: async (ctx) => {
        let allWords = await ctx.db.query("words").collect();
        const allLevels = await ctx.db.query("levels").collect();

        // Index: wordId (string) → level records that reference it
        const levelsByWord = new Map<string, typeof allLevels>();
        for (const lvl of allLevels) {
            const key = lvl.wordId.toString();
            if (!levelsByWord.has(key)) levelsByWord.set(key, []);
            levelsByWord.get(key)!.push(lvl);
        }

        // ── Paso 1: Reparar entradas compuestas "X / Y" ──────────────────────
        let compoundFixed = 0;
        for (const word of allWords) {
            if (word.word.includes(" / ")) {
                const firstForm = word.word.split(" / ")[0].trim();
                await ctx.db.patch(word._id, { word: firstForm });
                word.word = firstForm; // actualizar en memoria para el paso 2
                compoundFixed++;
            }
        }

        // ── Paso 2: Deduplicar por forma normalizada ──────────────────────────
        const normalize = (s: string) =>
            s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const groups = new Map<string, typeof allWords>();
        for (const word of allWords) {
            const key = normalize(word.word);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(word);
        }

        let deleted = 0;
        let levelsReassigned = 0;

        for (const [, group] of groups) {
            if (group.length <= 1) continue;

            // Canonical = más referencias en levels → luego string más largo (tiene acentos)
            group.sort((a, b) => {
                const aL = levelsByWord.get(a._id.toString())?.length ?? 0;
                const bL = levelsByWord.get(b._id.toString())?.length ?? 0;
                if (bL !== aL) return bL - aL;
                return b.word.length - a.word.length;
            });

            const [canonical, ...dupes] = group;
            for (const dup of dupes) {
                // Reasignar niveles del duplicado al canónico
                const dupLevels = levelsByWord.get(dup._id.toString()) ?? [];
                for (const lvl of dupLevels) {
                    await ctx.db.patch(lvl._id, { wordId: canonical._id });
                    levelsReassigned++;
                }
                await ctx.db.delete(dup._id);
                deleted++;
            }
        }

        return {
            compoundFixed,
            deleted,
            levelsReassigned,
            message: `Reparadas ${compoundFixed} entradas compuestas. Eliminados ${deleted} duplicados. Reasignados ${levelsReassigned} niveles.`,
        };
    },
});
