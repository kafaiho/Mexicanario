import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Solo el dueño de la app puede llamar estas funciones en producción */
const OWNER_IDS = new Set([
    "k9761v6vrcwpafm745mhh5m95x8215dv",
    "k97b1y69czyn1zsm4d2avzxzrx826k7a",
]);
function requireOwner(userId: string) {
    if (!OWNER_IDS.has(userId))
        throw new Error("❌ Acceso denegado: solo el dueño puede usar esta función.");
}

/**
 * DEV ONLY — lista todos los usuarios (id, nombre, petType).
 */
export const listUsers = query({
    args: { requesterId: v.string() },
    handler: async (ctx, { requesterId }) => {
        requireOwner(requesterId);
        const users = await ctx.db.query("users").collect();
        return users.map((u) => ({
            _id: u._id,
            name: (u as any).name ?? (u as any).username ?? "?",
            petType: (u as any).petType ?? "none",
        }));
    },
});

/**
 * Mueve palabras de slang/jerga que están mal catalogadas en "Historia"
 * a la categoría correcta "Jerga".
 * Run: npx convex run devTools:redistributeHistoriaToJerga
 */
export const redistributeHistoriaToJerga = mutation({
  args: { requesterId: v.string() },
  handler: async (ctx, { requesterId }) => {
    requireOwner(requesterId);
    const JERGA_SET = new Set([
      "chido","neta","órale","orale","güey","wey","güey / wey",
      "chamba","no manches","platicar","sale","lana","fresa","naco",
      "chafa","gacho","morra / morro","morra","morro","carnal",
      "¡qué oso!","que oso","chismoso","cotorreo","agüitado",
      "irse de rol","poner el cuerno",
      "no dar el ancho","caer gordo","estar cañón","chilango",
      "camión","micro","cuate","neta del planeta","ándale","andale",
      "metro","chaleco","machín","machin","morrita",
      "fierro pariente","andar con madre","huerco","troca","congal",
      "plebe","a la bestia","un paro","choco","bato","ñero","nero",
      "pichar","me late","estar padre","chambear","echar relajo",
      "puchis","bato loco","andar bravo","tirar esquina","jalón","jalon",
      "cancelado","funar",
      "chismecito","stalkear","crush","shippear","postear",
      "subirse al tren","estar viral","meme",
      "vieja","jaina","tirar paro","crudo","ñero","pisto",
      "tuch","poch","pacha","jach","tuchito",
    ]);

    const words = await ctx.db.query("words").collect();
    let moved = 0;

    for (const word of words) {
      if ((word as any).category !== "Historia") continue;
      const key = (word as any).word.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const rawKey = (word as any).word.toLowerCase().trim();

      if (JERGA_SET.has(rawKey) || JERGA_SET.has(key)) {
        await ctx.db.patch(word._id, { category: "Jerga" });
        moved++;
      }
    }

    return { moved, message: `Moved ${moved} slang words from Historia → Jerga` };
  },
});

/**
 * DEV ONLY — wipes all words and levels, then resets user to level 1.
 * Call this once from the Convex dashboard or via the in-app DEV button.
 */
export const cleanupDuplicates = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        requireOwner(args.userId);
        // 1. Delete all existing levels
        const levels = await ctx.db.query("levels").collect();
        await Promise.all(levels.map((l) => ctx.db.delete(l._id)));

        // 2. Delete all existing words
        const words = await ctx.db.query("words").collect();
        await Promise.all(words.map((w) => ctx.db.delete(w._id)));

        // 3. Reset user to level 1
        try {
            const user = await ctx.db.get(args.userId as any);
            if (user) {
                await ctx.db.patch(user._id, { currentLevel: 1 });
            }
        } catch { }

        return {
            deletedLevels: levels.length,
            deletedWords: words.length,
            message: "Cleaned up. Now run the seed mutations.",
        };
    },
});

/**
 * DEV ONLY — adds a large amount of coins and diamonds to a user.
 */
export const giveDevCoins = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        requireOwner(args.userId);
        try {
            const user = await ctx.db.get(args.userId as any);
            if (user) {
                await ctx.db.patch(user._id, { coins: 999999, diamonds: 999 });
                return { success: true, coins: 999999, diamonds: 999 };
            }
        } catch { }
        return { success: false };
    },
});

/**
 * DEV ONLY — resets the user's level to 1.
 */
export const resetLevelDev = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        requireOwner(args.userId);
        try {
            const user = await ctx.db.get(args.userId as any);
            if (user) {
                await ctx.db.patch(user._id, { currentLevel: 1 });
                return { success: true };
            }
        } catch { }
        return { success: false };
    },
});

/**
 * DEV ONLY — patches category field for all known themed words.
 * Run once after seeding: npx convex run devTools:patchWordCategories
 */
export const patchWordCategories = mutation({
    args: { requesterId: v.string() },
    handler: async (ctx, { requesterId }) => {
        requireOwner(requesterId);
        // Map of lowercase word string → correct category
        const MAP: Record<string, string> = {
            // ── Levels 1-2 (Comida) ────────────────────────────────────────────
            "taco": "Comida", "tamal": "Comida", "pozole": "Comida", "mole": "Comida", "tlayuda": "Comida",
            "pan de muerto": "Comida", "atole": "Bebida", "champurrado": "Bebida", "buñuelo": "Comida", "calabaza en tacha": "Comida",
            // ── Levels 3-4 (Juegos) ────────────────────────────────────────────
            "trompo": "Juegos", "balero": "Juegos", "lotería": "Juegos", "canicas": "Juegos", "pirinola": "Juegos",
            "serpientes y escaleras": "Juegos", "rayuela": "Juegos", "stop": "Juegos",
            // ── Levels 5-6 (Música) ────────────────────────────────────────────
            "mariachi": "Música", "ranchera": "Música", "corrido": "Música", "banda": "Música", "cumbia mexicana": "Música",
            "son jarocho": "Música", "huapango": "Música", "bolero": "Música", "norteño": "Música", "chilena costeña": "Música",
            // ── Levels 7-8 (Animales) ──────────────────────────────────────────
            "jaguar": "Animales", "aguila real": "Animales", "serpiente cascabel": "Animales", "cenzontle": "Animales", "armadillo": "Animales",
            "ajolote": "Animales", "xoloitzcuintle": "Animales", "chapulin": "Animales", "guacamaya": "Animales", "mapache": "Animales",
            // ── Level 9 (Comida) ───────────────────────────────────────────────
            "esquites": "Comida", "tostilocos": "Comida", "pambazo": "Comida", "torta ahogada": "Comida", "chilaquiles": "Comida",
            // ── Level 10 (Juegos) ──────────────────────────────────────────────
            "encantados": "Juegos", "la vibora de la mar": "Juegos", "la roña": "Juegos", "burro castigado": "Juegos", "dona blanca": "Juegos", "a las escondidas": "Juegos",
            // ── Level 11 (Música) ──────────────────────────────────────────────
            "pedro infante": "Música", "chavela vargas": "Música", "jose alfredo jimenez": "Música", "lila downs": "Música", "juan gabriel": "Música", "vicente fernandez": "Música",
            // ── Level 12 (Animales) ────────────────────────────────────────────
            "ocelote": "Animales", "tlacuache": "Animales", "colibri": "Animales", "murcielago magueyero": "Animales", "iguana": "Animales", "zorrillo": "Animales",
            // ── Level 13 (Artistas) ────────────────────────────────────────────
            "orozco": "Artistas", "siqueiros": "Artistas", "rufino tamayo": "Artistas", "leonora carrington": "Artistas", "remedios varo": "Artistas", "octavio paz": "Artistas",
            // ── Level 14 (Monumentos) ──────────────────────────────────────────
            "monte alban": "Monumentos", "palenque": "Monumentos", "uxmal": "Monumentos", "calakmul": "Monumentos", "paquime": "Monumentos", "mitla": "Monumentos",
            // ── Level 15 (Historia) ────────────────────────────────────────────
            "francisco i madero": "Historia", "venustiano carranza": "Historia", "alvaro obregon": "Historia", "lazaro cardenas": "Historia", "porfirio diaz": "Historia", "constitucion 1917": "Historia",
            // ── Level 16 (Plantas) ─────────────────────────────────────────────
            "agave": "Plantas", "flor de nochebuena": "Plantas", "flor de dalia": "Plantas", "flor de cacao": "Plantas", "flor de vainilla": "Plantas", "flor de maguey": "Plantas",
            // ── Level 17 (Comida - Dulces) ─────────────────────────────────────
            "alegria": "Comida", "cocada": "Comida", "palanqueta": "Comida", "borrachito": "Comida", "glorias": "Comida", "mazapan": "Comida",
            // ── Level 18 (Juegos) ──────────────────────────────────────────────
            "la viborita de la mar": "Juegos", "el patio de mi casa": "Juegos", "las estatuas": "Juegos", "el avioncito": "Juegos", "policias y ladrones": "Juegos",
            // ── Level 19 (Música - Rock) ───────────────────────────────────────
            "caifanes": "Música", "mana": "Música", "molotov": "Música", "cafe tacuba": "Música", "zoe": "Música", "el tri": "Música",
            // ── Level 20 (Animales - Insectos) ─────────────────────────────────
            "escamoles": "Animales", "chinicuiles": "Animales", "jumiles": "Animales", "hormiga chicatana": "Animales", "chapulin tostado": "Animales", "gusano de maguey": "Animales",
            // ── Level 21 (Artistas - Cine clásico) ────────────────────────────
            "cantinflas": "Artistas", "maria felix": "Artistas", "pedro armendariz": "Artistas", "dolores del rio": "Artistas", "jorge negrete": "Artistas", "katy jurado": "Artistas",
            // ── Level 22 (Monumentos) ──────────────────────────────────────────
            "soumaya": "Monumentos", "biblioteca vasconcelos": "Monumentos", "estadio azteca": "Monumentos", "monumento a la revolucion": "Monumentos", "malecon de mazatlan": "Monumentos", "plaza de las tres culturas": "Monumentos",
            // ── Level 23 (Historia - Civilizaciones) ───────────────────────────
            "olmecas": "Historia", "mayas": "Historia", "mexicas": "Historia", "zapotecas": "Historia", "mixtecos": "Historia", "toltecas": "Historia",
            // ── Level 24 (Plantas - Hierbas) ───────────────────────────────────
            "epazote": "Plantas", "cilantro": "Plantas", "hierba santa": "Plantas", "achiote": "Plantas", "oregano mexicano": "Plantas", "manzanilla": "Plantas",
            // ── Level 25 (Comida - Norte) ──────────────────────────────────────
            "cabrito": "Comida", "machaca": "Comida", "discada": "Comida", "asado de puerco": "Comida", "menudo norteno": "Comida", "gorditas": "Comida",
            // ── Level 26 (Comida - Sur) ────────────────────────────────────────
            "cochinita pibil": "Comida", "panucho": "Comida", "salbute": "Comida", "tamales chiapanecos": "Comida", "pescado a la talla": "Comida", "mole negro": "Comida",
            // ── Level 27 (Juegos) ──────────────────────────────────────────────
            "futbolito": "Juegos", "domino": "Juegos", "ajedrez": "Juegos", "jenga": "Juegos", "uno": "Juegos", "loteria moderna": "Juegos",
            // ── Level 28 (Música contemporánea) ───────────────────────────────
            "natalia lafourcade": "Música", "julieta venegas": "Música", "carlos rivera": "Música", "danna paola": "Música", "christian nodal": "Música", "belinda": "Música",
            // ── Level 29 (Animales - Desierto) ─────────────────────────────────
            "puma": "Animales", "condor": "Animales", "coyote": "Animales", "halcon peregrino": "Animales", "zorra del desierto": "Animales", "berrendo": "Animales",
            // ── Level 30 (Artistas - Escritores) ──────────────────────────────
            "juan rulfo": "Artistas", "rosario castellanos": "Artistas", "carlos fuentes": "Artistas", "elena poniatowska": "Artistas", "jose emilio pacheco": "Artistas", "guadalupe nettel": "Artistas",
            // ── Level 31 (Monumentos - Ciudades coloniales) ────────────────────
            "guanajuato": "Monumentos", "san miguel de allende": "Monumentos", "puebla": "Monumentos", "queretaro": "Monumentos", "zacatecas": "Monumentos", "morelia": "Monumentos",
            // ── Level 32 (Entretenimiento - TV) ───────────────────────────────
            "chespirito": "Entretenimiento", "chabelo": "Entretenimiento", "el chavo del 8": "Entretenimiento", "la chilindrina": "Entretenimiento", "don ramon": "Entretenimiento", "viruta y capulina": "Entretenimiento",
            // ── Level 33 (Deporte - Lucha libre) ──────────────────────────────
            "lucha libre": "Deporte", "el santo": "Deporte", "blue demon": "Deporte", "mil mascaras": "Deporte", "hijo del santo": "Deporte", "arena mexico": "Deporte",
            // ── Level 34 (Naturaleza) ──────────────────────────────────────────
            "popocatepetl": "Naturaleza", "cenote": "Naturaleza", "barranca del cobre": "Naturaleza", "laguna de bacalar": "Naturaleza", "selva lacandona": "Naturaleza", "iztaccihuatl": "Naturaleza",
            // ── Level 35 (Arte Popular - Artesanías) ───────────────────────────
            "alebrijes": "Arte Popular", "talavera": "Arte Popular", "barro negro": "Arte Popular", "papel picado": "Arte Popular", "huipil": "Arte Popular", "reboso": "Arte Popular",
            // ── Level 36 (Lenguaje - Modismos) ────────────────────────────────
            "órale": "Lenguaje", "chido": "Lenguaje", "güey": "Lenguaje", "nel pastel": "Lenguaje", "a toda madre": "Lenguaje", "qué onda": "Lenguaje",
            // ── Level 37 (Tradiciones) ─────────────────────────────────────────
            "piñata": "Tradiciones", "quinceañera": "Tradiciones", "posada navideña": "Tradiciones", "grito de independencia": "Tradiciones", "kermes": "Tradiciones", "altar de muertos": "Tradiciones",
            // ── Level 38 (Bebida) ──────────────────────────────────────────────
            "horchata": "Bebida", "agua de jamaica": "Bebida", "tepache": "Bebida", "tejuino": "Bebida", "pulque": "Bebida", "michelada": "Bebida",
            // ── Level 39 (Deporte) ─────────────────────────────────────────────
            "charreria": "Deporte", "julio cesar chavez": "Deporte", "hugo sanchez": "Deporte", "pelota mixteca": "Deporte", "beisbol norteno": "Deporte", "ana guevara": "Deporte",
            // ── Level 40 (Cultura Urbana) ──────────────────────────────────────
            "tianguis": "Cultura Urbana", "xochimilco": "Cultura Urbana", "garibaldi": "Cultura Urbana", "el zocalo": "Cultura Urbana", "tepito": "Cultura Urbana", "la merced": "Cultura Urbana",
            // ── Level 41 (Comida - Abuela) ─────────────────────────────────────
            "sopa de fideos": "Comida", "arroz rojo": "Comida", "frijoles de olla": "Comida", "caldo de pollo": "Comida", "enchiladas verdes": "Comida", "chiles en nogada": "Comida",
            // ── Level 42 (Comida - Chiles) ─────────────────────────────────────
            "chile habanero": "Comida", "chile serrano": "Comida", "chile poblano": "Comida", "chile chipotle": "Comida", "chile de arbol": "Comida", "chile ancho": "Comida",
            // ── Level 43 (Entretenimiento - Telenovelas) ───────────────────────
            "rosa salvaje": "Entretenimiento", "cuna de lobos": "Entretenimiento", "los ricos también lloran": "Entretenimiento", "la usurpadora": "Entretenimiento", "thalia": "Entretenimiento", "veronica castro": "Entretenimiento",
            // ── Level 44 (Música - Grupero) ────────────────────────────────────
            "los bukis": "Música", "bronco": "Música", "los angeles azules": "Música", "los yonics": "Música", "selena": "Música", "jenni rivera": "Música",
            // ── Level 45 (Escuela) ─────────────────────────────────────────────
            "cuaderno scribe": "Escuela", "recreo escolar": "Escuela", "cooperativa": "Escuela", "conaliteg": "Escuela", "lonchera": "Escuela", "escolta": "Escuela",
            // ── Level 46 (Cultura Urbana - Transporte) ─────────────────────────
            "pesero": "Cultura Urbana", "metro cdmx": "Cultura Urbana", "mototaxi": "Cultura Urbana", "combi": "Cultura Urbana", "bicitaxi": "Cultura Urbana", "trolebus": "Cultura Urbana",
            // ── Level 47 (Comida - Feria) ──────────────────────────────────────
            "elote asado": "Comida", "churro": "Comida", "algodon de azucar": "Comida", "nieve de garrafa": "Comida", "pepino con chile": "Comida", "raspado": "Comida",
            // ── Level 48 (Entretenimiento - Cómics) ───────────────────────────
            "kaliman": "Entretenimiento", "memin pinguin": "Entretenimiento", "la familia burron": "Entretenimiento", "el payo": "Entretenimiento", "fantomas": "Entretenimiento", "chanoc": "Entretenimiento",
            // ── Level 49 (Remedios) ────────────────────────────────────────────
            "vicks vaporub": "Remedios", "agua de tila": "Remedios", "sábila": "Remedios", "limón con sal": "Remedios", "gordolobo": "Remedios", "ruda": "Remedios",
            // ── Level 50 (Lenguaje - Refranes) ────────────────────────────────
            "al que madruga": "Lenguaje", "camarón que se duerme": "Lenguaje", "el que con lobos anda": "Lenguaje", "más vale tarde": "Lenguaje", "en boca cerrada": "Lenguaje", "no hay mal que dure": "Lenguaje",
            // ── Level 51 (Tradiciones - Festivales) ───────────────────────────
            "guelaguetza": "Tradiciones", "festival cervantino": "Tradiciones", "feria de san marcos": "Tradiciones", "carnaval de veracruz": "Tradiciones", "dia de guadalupe": "Tradiciones", "semana santa": "Tradiciones",
            // ── Level 52 (Música - Instrumentos) ──────────────────────────────
            "guitarron": "Música", "vihuela": "Música", "arpa jarocha": "Música", "marimba": "Música", "tambora": "Música", "requinto": "Música",
            // ── Level 53 (Devoción) ────────────────────────────────────────────
            "virgen de guadalupe": "Devoción", "san judas tadeo": "Devoción", "la santa muerte": "Devoción", "cristo rey": "Devoción", "san miguel arcangel": "Devoción", "nino dios": "Devoción",
            // ── Level 54 (Historia - Héroes) ───────────────────────────────────
            "benito juarez": "Historia", "miguel hidalgo": "Historia", "emiliano zapata": "Historia", "sor juana ines": "Historia", "josefa ortiz": "Historia", "jose maria morelos": "Historia",
            // ── Level 55 (Entretenimiento - Cine moderno) ─────────────────────
            "amores perros": "Entretenimiento", "y tu mama tambien": "Entretenimiento", "roma": "Entretenimiento", "guillermo del toro": "Entretenimiento", "inarritu": "Entretenimiento", "alfonso cuaron": "Entretenimiento",
            // ── Level 56 (Arte Popular - Ropa) ────────────────────────────────
            "sombrero charro": "Arte Popular", "china poblana": "Arte Popular", "traje de charro": "Arte Popular", "sarape": "Arte Popular", "quechquemitl": "Arte Popular", "jorongo": "Arte Popular",
            // ── Level 57 (Comida - Pan dulce) ──────────────────────────────────
            "concha": "Comida", "cuernito": "Comida", "polvorón": "Comida", "cochito": "Comida", "oreja": "Comida",
            // ── Level 58 (Lenguaje - Náhuatl) ─────────────────────────────────
            "copal": "Lenguaje", "temazcal": "Lenguaje", "metate": "Lenguaje", "molcajete": "Lenguaje", "petate": "Lenguaje", "huarache": "Lenguaje",
            // ── Level 59 (Leyendas) ────────────────────────────────────────────
            "la llorona": "Leyendas", "nagual": "Leyendas", "chaneque": "Leyendas", "alux": "Leyendas", "encanto": "Leyendas", "wirikuta": "Leyendas",
            // ── Level 60 (Lenguaje - Jerga) ────────────────────────────────────
            "bato": "Lenguaje", "cantón": "Lenguaje", "jale": "Lenguaje", "feria": "Lenguaje", "chamba": "Lenguaje", "palomilla": "Lenguaje",
            // ── Level 61 (Historia - Colonial) ─────────────────────────────────
            "atrio": "Historia", "claustro": "Historia", "campanario": "Historia", "portada": "Historia", "sagrario": "Historia", "pilastra": "Historia",
        };

        const allWords = await ctx.db.query("words").collect();
        let patched = 0;
        let skipped = 0;

        for (const word of allWords) {
            const key = word.word.toLowerCase().trim();
            const category = MAP[key];
            if (category && word.category !== category) {
                await ctx.db.patch(word._id, { category });
                patched++;
            } else {
                skipped++;
            }
        }

        return { patched, skipped, total: allWords.length };
    },
});

/**
 * DEV ONLY — salta directamente al nivel indicado.
 */
export const jumpToLevel = mutation({
    args: { userId: v.string(), targetLevel: v.number() },
    handler: async (ctx, args) => {
        requireOwner(args.userId);
        try {
            const user = await ctx.db.get(args.userId as any);
            if (!user) return { success: false, error: "Usuario no encontrado" };

            // Verificar que el nivel existe
            const level = await ctx.db
                .query("levels")
                .filter((q) => q.eq(q.field("levelNumber"), args.targetLevel))
                .first();

            if (!level) return { success: false, error: `El nivel ${args.targetLevel} no existe` };

            // Sync tacos = niveles completados (targetLevel - 1)
            const newTacos = Math.max(0, args.targetLevel - 1);
            await ctx.db.patch(user._id, { currentLevel: args.targetLevel, tacos: newTacos } as any);
            return { success: true, level: args.targetLevel, tacos: newTacos };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    },
});

/**
 * DEV ONLY — resetea el contador de tacos a un valor específico.
 */
/**
 * DEV ONLY — cambia el tipo de mascota.
 */
export const switchPetType = mutation({
    args: { userId: v.string(), petType: v.string() },
    handler: async (ctx, args) => {
        requireOwner(args.userId);
        try {
            const user = await ctx.db.get(args.userId as any);
            if (!user) return { success: false, error: "Usuario no encontrado" };
            await ctx.db.patch(user._id, { petType: args.petType });
            return { success: true, petType: args.petType };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    },
});

export const resetTacos = mutation({
    args: { userId: v.string(), tacos: v.number() },
    handler: async (ctx, args) => {
        requireOwner(args.userId);
        try {
            const user = await ctx.db.get(args.userId as any);
            if (!user) return { success: false, error: "Usuario no encontrado" };

            await ctx.db.patch(user._id, { tacos: args.tacos } as any);
            return { success: true, tacos: args.tacos };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    },
});
