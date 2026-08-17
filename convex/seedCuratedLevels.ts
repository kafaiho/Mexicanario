import { mutation } from "./_generated/server";
import { insertNewLevel } from "./levelWrites";

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
    // ── Nivel 1 – Bienvenida (Básico / Modismos) ───────────────────────────────
    { word: "Taco", meaning: "Tortilla rellena con guiso", example: "Vamos por unos tacos al pastor", region: "Todo México", category: "Comida Mexicana" },
    { word: "Wey", meaning: "Amigo o persona (coloquial)", example: "¿Qué onda, wey, cómo estás?", region: "Todo México", category: "Expresiones y Modismos" },
    { word: "Chido", meaning: "Bonito o muy bueno", example: "¡Qué chido está tu coche nuevo!", region: "Centro y Sur", category: "Expresiones y Modismos" },
    { word: "No manches", meaning: "Expresión de asombro o incredulidad", example: "¡No manches, sacaste diez en el examen!", region: "Todo México", category: "Expresiones y Modismos" },

    // ── Nivel 2 – Rompehielo (Expresiones fáciles) ─────────────────────────────
    { word: "Órale", meaning: "Expresión de asombro, afirmación o prisa", example: "¡Órale, apúrate que llegamos tarde!", region: "Nacional", category: "Expresiones y Modismos" },
    { word: "Ahorita", meaning: "En un momento (generalmente indefinido)", example: "Ahorita voy, dame cinco minutos", region: "Todo México", category: "Expresiones y Modismos" },
    { word: "Carnal", meaning: "Hermano o amigo muy cercano", example: "Ese wey es mi carnal de toda la vida", region: "CdMx y Centro", category: "Expresiones y Modismos" },

    // ── Nivel 3 – El Sabor Básicos (Comida muy común) ──────────────────────────
    { word: "Chamoy", meaning: "Salsa agridulce de ciruela con chile y limón", example: "Le puse chamoy a la fruta y quedó buenísima", region: "Nacional", category: "Comida Mexicana" },
    { word: "Aguacate", meaning: "Fruto verde, base del guacamole", example: "Ese taco lleva mucho aguacate", region: "Nacional", category: "Comida Mexicana" },
    { word: "Tamal", meaning: "Masa de maíz rellena envuelta en hoja", example: "Desayuné un tamal con atole", region: "Nacional", category: "Comida Mexicana" },

    // ── Nivel 4 – Juegos de recreo (Juegos) ───────────────────────────────────
    { word: "La víbora de la mar", meaning: "Juego tradicional en fiestas", example: "Cantamos en la víbora de la mar", region: "Tradicional", category: "Juegos y Niñez" },
    { word: "La roña", meaning: "Juego de persecución", example: "Me atraparon en la roña", region: "Callejero", category: "Juegos y Niñez" },
    { word: "Burro castigado", meaning: "Juego de resistencia física", example: "Saltamos en el burro castigado", region: "Escuela", category: "Juegos y Niñez" },
    { word: "Doña Blanca", meaning: "Juego en ronda con canción", example: "Jugamos a Doña Blanca en la fiesta", region: "Infantil", category: "Juegos y Niñez" },
    { word: "A las escondidas", meaning: "Juego de esconderse y buscar", example: "Nos escondimos jugando escondidas", region: "Todo México", category: "Juegos y Niñez" },

    // ── Nivel 11 – Voces mexicanas (Música) ────────────────────────────────────
    { word: "Pedro Infante", meaning: "Ídolo de la música ranchera y el cine de oro", example: "Escuchamos canciones de Pedro Infante, el ídolo de Guamúchil", region: "Sinaloa", category: "Música y Artistas" },
    { word: "Chavela Vargas", meaning: "Cantante costarricense naturalizada mexicana, ícono de la ranchera adoptada por México", example: "Chavela Vargas cantaba con sentimiento", region: "Internacional", category: "Música y Artistas" },
    { word: "José Alfredo Jiménez", meaning: "Compositor de rancheras", example: "José Alfredo escribió 'El Rey'", region: "Todo México", category: "Música y Artistas" },
    { word: "Lila Downs", meaning: "Cantante contemporánea mexicana de Oaxaca que mezcla lenguas indígenas con rock y jazz", example: "Lila Downs mezcla géneros en sus canciones", region: "Oaxaca", category: "Música y Artistas" },
    { word: "Juan Gabriel", meaning: "Cantante y compositor icónico", example: "Cantamos canciones de Juan Gabriel", region: "Todo México", category: "Música y Artistas" },
    { word: "Vicente Fernández", meaning: "Ícono de la música ranchera", example: "Vicente Fernández es 'El Charro de Huentitán'", region: "Jalisco", category: "Música y Artistas" },

    // ── Nivel 12 – Fauna mexicana (Animales) ───────────────────────────────────
    { word: "Ocelote", meaning: "Felino de tamaño mediano", example: "El ocelote vive en la selva", region: "Sur", category: "Animales de México" },
    { word: "Tlacuache", meaning: "Único marsupial nativo de México, habita en casi todo el país", example: "Un tlacuache se metió en la casa por el techo", region: "Todo México", category: "Animales de México" },
    { word: "Colibrí", meaning: "Ave pequeña de rápido vuelo", example: "El colibrí revoloteaba en el jardín", region: "Todo México", category: "Animales de México" },
    { word: "Murciélago magueyero", meaning: "Polinizador del agave, esencial para el tequila y el mezcal", example: "Sin el murciélago magueyero no habría tequila ni mezcal", region: "Occidente", category: "Animales de México" },
    { word: "Iguana", meaning: "Reptil común en zonas cálidas", example: "La iguana tomó sol en la roca", region: "Costa", category: "Animales de México" },
    { word: "Zorrillo", meaning: "Mamífero que lanza líquido fétido como defensa", example: "El zorrillo espantó a todos con su terrible olor", region: "Todo México", category: "Animales de México" },

    // ── Nivel 13 – Muralismo mexicano (Artistas) ───────────────────────────────
    { word: "Orozco", meaning: "Muralista mexicano", example: "Orozco pintó murales en Guadalajara", region: "Jalisco", category: "Música y Artistas" },
    { word: "Siqueiros", meaning: "Muralista y político", example: "Siqueiros creó murales con temática social", region: "Nacional", category: "Música y Artistas" },
    { word: "Rufino Tamayo", meaning: "Pintor de colores vibrantes", example: "Tamayo expuso en Nueva York", region: "Oaxaca", category: "Música y Artistas" },
    { word: "Leonora Carrington", meaning: "Pintora surrealista", example: "Carrington influyó en el surrealismo mexicano", region: "CDMX", category: "Música y Artistas" },
    { word: "Remedios Varo", meaning: "Artista surrealista", example: "Remedios Varo pintó mundos fantásticos", region: "CDMX", category: "Música y Artistas" },
    { word: "Octavio Paz", meaning: "Poeta y Nobel mexicano", example: "Octavio Paz escribió 'El Laberinto de la Soledad'", region: "CDMX", category: "Música y Artistas" },

    // ── Nivel 14 – Patrimonios UNESCO (Monumentos) ─────────────────────────────
    { word: "Monte Albán", meaning: "Zona arqueológica zapoteca", example: "Visitamos Monte Albán en Oaxaca", region: "Oaxaca", category: "Monumentos y Lugares" },
    { word: "Palenque", meaning: "Ciudad maya en Chiapas", example: "Palenque tiene templos impresionantes", region: "Chiapas", category: "Monumentos y Lugares" },
    { word: "Uxmal", meaning: "Zona arqueológica maya", example: "Uxmal es famosa por su pirámide del Adivino", region: "Yucatán", category: "Monumentos y Lugares" },
    { word: "Calakmul", meaning: "Gran ciudad maya", example: "Calakmul está en la selva", region: "Campeche", category: "Monumentos y Lugares" },
    { word: "Paquimé", meaning: "Sitio arqueológico del norte", example: "Paquimé está en Chihuahua", region: "Chihuahua", category: "Monumentos y Lugares" },
    { word: "Mitla", meaning: "Zona arqueológica zapoteca", example: "Mitla es conocida por sus grecas", region: "Oaxaca", category: "Monumentos y Lugares" },
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
            const coins = 2 + Math.floor((nextLevel - 1) / 100);
            const diamonds = Math.floor((nextLevel - 1) / 200);

            // Insert level
            await insertNewLevel(ctx, {
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
