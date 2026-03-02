import { mutation } from "./_generated/server";

/**
 * Curated word list for the structured levels shown in the app design.
 * Each entry: { word, meaning, example, region, category }
 *
 * Categories (all based on Mexican culture):
 *   Comida     N1, N2, N9
 *   Juegos     N3, N4, N10
 *   Música     N5, N6, N11
 *   Animales   N7, N8, N12
 *   Artistas   N13
 *   Monumentos N14
 */
const CURATED_WORDS = [
    // ── Nivel 1 – Taquito fácil (Comida) ───────────────────────────────────────
    { word: "Taco", meaning: "Tortilla rellena con guiso", example: "Vamos por unos tacos al pastor", region: "Todo México", category: "Comida" },
    { word: "Tamal", meaning: "Masa de maíz envuelta en hoja", example: "En la mañana desayuné un tamal verde", region: "Nacional", category: "Comida" },
    { word: "Pozole", meaning: "Caldo con maíz y carne", example: "El 15 de septiembre cenamos pozole", region: "Tradicional", category: "Comida" },
    { word: "Mole", meaning: "Salsa espesa de chiles y especias", example: "El mole poblano es mi favorito", region: "Puebla", category: "Comida" },
    { word: "Tlayuda", meaning: "Tortilla grande con frijoles y carne", example: "En Oaxaca comí una tlayuda enorme", region: "Oaxaca", category: "Comida" },

    // ── Nivel 2 – Pan de muerto (Comida) ───────────────────────────────────────
    { word: "Pan de muerto", meaning: "Pan dulce típico del Día de Muertos", example: "En noviembre comimos pan de muerto con chocolate", region: "Tradicional", category: "Comida" },
    { word: "Atole", meaning: "Bebida caliente de maíz", example: "En el Día de Muertos tomamos atole", region: "Tradicional", category: "Comida" },
    { word: "Champurrado", meaning: "Chocolate espeso con maíz", example: "En la feria vendían champurrado", region: "CDMX", category: "Comida" },
    { word: "Buñuelo", meaning: "Fritura dulce con azúcar", example: "Comimos buñuelos en Navidad", region: "Nacional", category: "Comida" },
    { word: "Calabaza en tacha", meaning: "Postre de calabaza con piloncillo", example: "En Día de Muertos prepararon calabaza en tacha", region: "Tradicional", category: "Comida" },

    // ── Nivel 3 – Juguete de feria (Juegos) ────────────────────────────────────
    { word: "Trompo", meaning: "Juguete de madera que gira", example: "El trompo se quedó bailando en la punta", region: "Infantil", category: "Juegos" },
    { word: "Balero", meaning: "Juguete de madera con cuerda", example: "El niño encestó el balero a la primera", region: "Tradicional", category: "Juegos" },
    { word: "Lotería", meaning: "Juego de cartas con imágenes", example: "Cantamos lotería en la fiesta", region: "Todo México", category: "Juegos" },
    { word: "Canicas", meaning: "Esferas de vidrio para jugar", example: "Jugamos canicas en el recreo", region: "Infantil", category: "Juegos" },
    { word: "Pirinola", meaning: "Juguete que indica acciones", example: "La pirinola cayó en 'toma todo'", region: "Todo México", category: "Juegos" },

    // ── Nivel 4 – Rayuela mexicana (Juegos) ────────────────────────────────────
    { word: "Serpientes y escaleras", meaning: "Juego de tablero de avance y retroceso", example: "Jugamos serpientes y escaleras en familia", region: "Infantil", category: "Juegos" },
    { word: "Rayuela", meaning: "Juego de piso con casillas numeradas", example: "Saltamos en la rayuela", region: "Callejero", category: "Juegos" },
    { word: "Stop", meaning: "Juego de categorías en papel", example: "Jugamos stop con mis primos", region: "Juvenil", category: "Juegos" },
    { word: "Encantados", meaning: "Juego de persecución", example: "Me atraparon en encantados", region: "Infantil", category: "Juegos" },

    // ── Nivel 5 – Mariachi básico (Música) ─────────────────────────────────────
    { word: "Mariachi", meaning: "Conjunto musical típico", example: "El mariachi tocó en la boda", region: "Todo México", category: "Música" },
    { word: "Ranchera", meaning: "Género musical tradicional", example: "Cantamos rancheras toda la noche", region: "Nacional", category: "Música" },
    { word: "Corrido", meaning: "Canción narrativa popular", example: "Escuché un corrido revolucionario", region: "Norte", category: "Música" },
    { word: "Banda", meaning: "Música sinaloense con viento", example: "La banda alegró la fiesta", region: "Sinaloa", category: "Música" },
    { word: "Cumbia mexicana", meaning: "Versión nacional de la cumbia", example: "Bailamos cumbia mexicana en la boda", region: "Nacional", category: "Música" },

    // ── Nivel 6 – Son de la tierra (Música) ────────────────────────────────────
    { word: "Son jarocho", meaning: "Género musical de Veracruz", example: "El arpa sonó en el son jarocho", region: "Veracruz", category: "Música" },
    { word: "Huapango", meaning: "Baile y música tradicional", example: "El huapango se baila en pareja", region: "Huasteca", category: "Música" },
    { word: "Bolero", meaning: "Género romántico popular", example: "Cantaron boleros en la serenata", region: "Todo México", category: "Música" },
    { word: "Norteño", meaning: "Música con acordeón y bajo sexto", example: "Escuchamos norteño en Monterrey", region: "Norte", category: "Música" },
    { word: "Chilena costeña", meaning: "Música alegre del Pacífico", example: "Bailamos chilena en Oaxaca", region: "Costa Pacífico", category: "Música" },

    // ── Nivel 7 – Animales de leyenda (Animales) ───────────────────────────────
    { word: "Jaguar", meaning: "Felino emblemático mesoamericano", example: "El jaguar era símbolo de poder", region: "Sur de México", category: "Animales" },
    { word: "Águila real", meaning: "Ave nacional mexicana", example: "El águila real aparece en el escudo", region: "Todo México", category: "Animales" },
    { word: "Serpiente cascabel", meaning: "Reptil venenoso de México", example: "La serpiente cascabel sonó en el campo", region: "Norte y centro", category: "Animales" },
    { word: "Cenzontle", meaning: "Ave conocida como el pájaro de las 400 voces", example: "El cenzontle canta variado", region: "Nacional", category: "Animales" },
    { word: "Armadillo", meaning: "Mamífero con caparazón", example: "Vimos un armadillo cruzar", region: "Sur", category: "Animales" },

    // ── Nivel 8 – Criaturas únicas (Animales) ──────────────────────────────────
    { word: "Ajolote", meaning: "Anfibio endémico de Xochimilco", example: "El ajolote se regenera solo", region: "CDMX", category: "Animales" },
    { word: "Xoloitzcuintle", meaning: "Perro ancestral mexicano", example: "El xoloitzcuintle acompañaba a los mexicas", region: "Nacional", category: "Animales" },
    { word: "Chapulín", meaning: "Insecto comestible y típico", example: "Comimos chapulines con limón", region: "Oaxaca", category: "Animales" },
    { word: "Guacamaya", meaning: "Ave de plumas coloridas", example: "La guacamaya voló sobre la selva", region: "Selva", category: "Animales" },
    { word: "Mapache", meaning: "Mamífero nocturno de México", example: "Un mapache abrió la basura", region: "Bosques", category: "Animales" },

    // ── Nivel 9 – Antojitos callejeros (Comida) ────────────────────────────────
    { word: "Esquites", meaning: "Maíz en vaso con mayonesa, queso y chile", example: "En la feria vendían esquites con chile piquín", region: "CDMX", category: "Comida" },
    { word: "Tostilocos", meaning: "Botana de Tostitos con salsas y toppings", example: "Me comí unos tostilocos con cueritos", region: "Juvenil", category: "Comida" },
    { word: "Pambazo", meaning: "Torta bañada en salsa roja", example: "El pambazo me enchiló", region: "CDMX", category: "Comida" },
    { word: "Torta ahogada", meaning: "Torta con salsa picante", example: "La torta ahogada estaba buenísima", region: "Guadalajara", category: "Comida" },
    { word: "Huarache", meaning: "Tortilla alargada con frijoles y guiso", example: "Me dieron un huarache con nopales", region: "CDMX", category: "Comida" },
    { word: "Chilaquiles", meaning: "Totopos bañados en salsa", example: "Desayuné chilaquiles verdes con pollo", region: "Todo México", category: "Comida" },

    // ── Nivel 10 – Juegos de recreo (Juegos) ───────────────────────────────────
    { word: "La víbora de la mar", meaning: "Juego tradicional en fiestas", example: "Cantamos en la víbora de la mar", region: "Tradicional", category: "Juegos" },
    { word: "La roña", meaning: "Juego de persecución", example: "Me atraparon en la roña", region: "Callejero", category: "Juegos" },
    { word: "Burro castigado", meaning: "Juego de resistencia física", example: "Saltamos en el burro castigado", region: "Escuela", category: "Juegos" },
    { word: "Doña Blanca", meaning: "Juego en ronda con canción", example: "Jugamos a Doña Blanca en la fiesta", region: "Infantil", category: "Juegos" },
    { word: "A las escondidas", meaning: "Juego de esconderse y buscar", example: "Nos escondimos jugando escondidas", region: "Todo México", category: "Juegos" },

    // ── Nivel 11 – Voces mexicanas (Música) ────────────────────────────────────
    { word: "Pedro Infante", meaning: "Ícono de la música ranchera", example: "Escuchamos canciones de Pedro Infante", region: "Época de Oro", category: "Música" },
    { word: "Chavela Vargas", meaning: "Cantante reconocida de rancheras", example: "Chavela Vargas cantaba con sentimiento", region: "Tradicional", category: "Música" },
    { word: "José Alfredo Jiménez", meaning: "Compositor de rancheras", example: "José Alfredo escribió 'El Rey'", region: "Todo México", category: "Música" },
    { word: "Lila Downs", meaning: "Cantante contemporánea mexicana", example: "Lila Downs mezcla géneros en sus canciones", region: "Actual", category: "Música" },
    { word: "Juan Gabriel", meaning: "Cantante y compositor icónico", example: "Cantamos canciones de Juan Gabriel", region: "Todo México", category: "Música" },
    { word: "Vicente Fernández", meaning: "Ícono de la música ranchera", example: "Vicente Fernández es 'El Charro de Huentitán'", region: "Jalisco", category: "Música" },

    // ── Nivel 12 – Fauna mexicana (Animales) ───────────────────────────────────
    { word: "Ocelote", meaning: "Felino de tamaño mediano", example: "El ocelote vive en la selva", region: "Sur", category: "Animales" },
    { word: "Tlacuache", meaning: "Marsupial mexicano", example: "Un tlacuache se metió en la casa", region: "CDMX", category: "Animales" },
    { word: "Colibrí", meaning: "Ave pequeña de rápido vuelo", example: "El colibrí revoloteaba en el jardín", region: "Todo México", category: "Animales" },
    { word: "Murciélago magueyero", meaning: "Polinizador del agave", example: "El murciélago magueyero ayuda al tequila", region: "Agavero", category: "Animales" },
    { word: "Iguana", meaning: "Reptil común en zonas cálidas", example: "La iguana tomó sol en la roca", region: "Costa", category: "Animales" },
    { word: "Zorrillo", meaning: "Mamífero con glándulas de defensa", example: "El zorrillo espantó a todos", region: "Bosques", category: "Animales" },

    // ── Nivel 13 – Muralismo mexicano (Artistas) ───────────────────────────────
    { word: "Orozco", meaning: "Muralista mexicano", example: "Orozco pintó murales en Guadalajara", region: "Jalisco", category: "Artistas" },
    { word: "Siqueiros", meaning: "Muralista y político", example: "Siqueiros creó murales con temática social", region: "Nacional", category: "Artistas" },
    { word: "Rufino Tamayo", meaning: "Pintor de colores vibrantes", example: "Tamayo expuso en Nueva York", region: "Oaxaca", category: "Artistas" },
    { word: "Leonora Carrington", meaning: "Pintora surrealista", example: "Carrington influyó en el surrealismo mexicano", region: "CDMX", category: "Artistas" },
    { word: "Remedios Varo", meaning: "Artista surrealista", example: "Remedios Varo pintó mundos fantásticos", region: "CDMX", category: "Artistas" },
    { word: "Octavio Paz", meaning: "Poeta y Nobel mexicano", example: "Octavio Paz escribió 'El Laberinto de la Soledad'", region: "CDMX", category: "Artistas" },

    // ── Nivel 14 – Patrimonios UNESCO (Monumentos) ─────────────────────────────
    { word: "Monte Albán", meaning: "Zona arqueológica zapoteca", example: "Visitamos Monte Albán en Oaxaca", region: "Oaxaca", category: "Monumentos" },
    { word: "Palenque", meaning: "Ciudad maya en Chiapas", example: "Palenque tiene templos impresionantes", region: "Chiapas", category: "Monumentos" },
    { word: "Uxmal", meaning: "Zona arqueológica maya", example: "Uxmal es famosa por su pirámide del Adivino", region: "Yucatán", category: "Monumentos" },
    { word: "Calakmul", meaning: "Gran ciudad maya", example: "Calakmul está en la selva", region: "Campeche", category: "Monumentos" },
    { word: "Paquimé", meaning: "Sitio arqueológico del norte", example: "Paquimé está en Chihuahua", region: "Chihuahua", category: "Monumentos" },
    { word: "Mitla", meaning: "Zona arqueológica zapoteca", example: "Mitla es conocida por sus grecas", region: "Oaxaca", category: "Monumentos" },
];

/**
 * Safely seeds all curated level words without creating duplicates.
 * - Skips any word whose text already exists in the DB (case-insensitive).
 * - Assigns level numbers starting AFTER the current highest level number.
 * - Saves the `category` field to each word for the Colección screen.
 *
 * Run once from the Convex dashboard:  seedCuratedLevels:seedCuratedLevels
 */
export const seedCuratedLevels = mutation({
    args: {},
    handler: async (ctx) => {
        // Fetch existing data
        const existingWords = await ctx.db.query("words").collect();
        const existingWordNames = new Set(
            existingWords.map((w) => w.word.toLowerCase().trim())
        );

        const existingLevels = await ctx.db.query("levels").collect();
        const maxLevel =
            existingLevels.length > 0
                ? Math.max(...existingLevels.map((l) => l.levelNumber))
                : 0;

        let nextLevel = maxLevel + 1;
        const added: { word: string; level: number; category: string }[] = [];
        const skipped: string[] = [];

        for (const entry of CURATED_WORDS) {
            const key = entry.word.toLowerCase().trim();

            if (existingWordNames.has(key)) {
                skipped.push(entry.word);
                continue;
            }

            // Insert word WITH category
            const wordId = await ctx.db.insert("words", {
                word: entry.word,
                meaning: entry.meaning,
                example: entry.example,
                region: entry.region,
                category: entry.category,
            });

            // Coins scale with level, diamonds every 5 levels
            const coins = 50 + (nextLevel - 1) * 10;
            const diamonds = Math.floor((nextLevel - 1) / 5) + 1;

            // Insert level
            await ctx.db.insert("levels", {
                levelNumber: nextLevel,
                wordId,
                reward: { coins, diamonds },
            });

            added.push({ word: entry.word, level: nextLevel, category: entry.category });
            existingWordNames.add(key); // prevent re-insert within same run
            nextLevel++;
        }

        return {
            added: added.length,
            skipped: skipped.length,
            newMaxLevel: nextLevel - 1,
            addedWords: added,
            skippedWords: skipped,
        };
    },
});

/**
 * Patches existing curated words that are already in the DB but missing their category.
 * Maps each curated word name → correct category.
 * Safe to run multiple times (only updates words without category or with wrong category).
 *
 * Run from the Convex dashboard: seedCuratedLevels:patchCuratedCategories
 */
export const patchCuratedCategories = mutation({
    args: {},
    handler: async (ctx) => {
        // Build lookup map: word (lowercase) → category
        const categoryMap = new Map<string, string>();
        for (const entry of CURATED_WORDS) {
            categoryMap.set(entry.word.toLowerCase().trim(), entry.category);
        }

        const allWords = await ctx.db.query("words").collect();
        let updated = 0;
        let skipped = 0;

        for (const word of allWords) {
            const key = word.word.toLowerCase().trim();
            const correctCategory = categoryMap.get(key);

            if (correctCategory && word.category !== correctCategory) {
                await ctx.db.patch(word._id, { category: correctCategory });
                updated++;
            } else {
                skipped++;
            }
        }

        return { updated, skipped };
    },
});
