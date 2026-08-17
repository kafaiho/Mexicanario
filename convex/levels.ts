import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOrderedLevels } from "./levelOrdering";

/** Strip accents/tildes so words are guessable without special keys */
function normalizeWord(str: string): string {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove diacritics (tildes, accents)
}

export const getCurrentLevel = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allLevels = await ctx.db.query("levels").collect();
    const allWords = await ctx.db.query("words").collect();
    const wordMap = new Map(allWords.map((w) => [w._id.toString(), w]));

    const DEFAULT_RESPONSE = {
      level: 1,
      word: "Default",
      meaning: "Default",
      example: "Default",
      region: "Default",
      reward: { coins: 2, diamonds: 0 },
      isLastLevel: false,
      isDefaultLevel: true,
    };

    if (allLevels.length === 0) return DEFAULT_RESPONSE;

    // Determine user's position (1-based) in the ordered level sequence
    let position = 1;
    let isDefaultLevel = true;
    let orderingVersion = 1;
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (user) {
        position = user.currentLevel || 1;
        isDefaultLevel = false;
        orderingVersion = user.culturalOrderVersion ?? 1;
      }
    }

    // Order levels per-user so creator/priority words appear first
    const ordered = getOrderedLevels(allLevels, allWords, args.userId?.toString() ?? "", orderingVersion);
    if (ordered.length === 0) return DEFAULT_RESPONSE;

    const idx = Math.min(position - 1, ordered.length - 1);
    const lvl = ordered[idx];
    const word = wordMap.get(lvl.wordId.toString());

    return {
      level: position,
      word: word?.word || "Default",
      meaning: word?.meaning || "Default",
      example: word?.example || "Default",
      region: word?.region || "Default",
      reward: lvl.reward,
      isLastLevel: position >= ordered.length,
      isDefaultLevel,
    };
  },
});

export const checkLevelUp = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentLevel = user.currentLevel || 1;

    const allLevels = await ctx.db.query("levels").collect();
    const allWords = await ctx.db.query("words").collect();
    const ordered = getOrderedLevels(allLevels, allWords, args.userId.toString(), user.culturalOrderVersion ?? 1);
    const totalLevels = ordered.length || 1;

    if (currentLevel < totalLevels) {
      // Reward comes from the next level in the ordered sequence
      const nextIdx = currentLevel; // currentLevel is 1-based; next is at index currentLevel
      const nextLevelDoc = ordered[nextIdx];
      const reward = nextLevelDoc?.reward ?? { coins: 2, diamonds: 0 };
      const nextLevel = currentLevel + 1;

      await ctx.db.patch(args.userId, {
        coins: user.coins + reward.coins,
        diamonds: user.diamonds + reward.diamonds,
        currentLevel: nextLevel,
      });

      return { leveledUp: true, newLevel: nextLevel, reward };
    }

    return { leveledUp: false, currentLevel: Math.min(currentLevel, totalLevels) };
  },
});

export const completeLevel = mutation({
  args: {
    userId: v.id("users"),
    levelNumber: v.number(), // 1-based position in the ordered level sequence
    isPerfect: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const allLevels = await ctx.db.query("levels").collect();
    const allWords = await ctx.db.query("words").collect();
    const ordered = getOrderedLevels(allLevels, allWords, args.userId.toString(), user.culturalOrderVersion ?? 1);
    const totalLevels = ordered.length || 1;

    // Get the reward for this position in the ordered sequence
    const idx = Math.min(args.levelNumber - 1, ordered.length - 1);
    const levelDoc = ordered[idx] ?? null;
    const DEFAULT_REWARD = { coins: 2, diamonds: 0 };
    const reward = levelDoc?.reward ?? DEFAULT_REWARD;

    // Update user's position — args.levelNumber is the position they just completed.
    // Clamp effectiveLevel so users past the total never get stuck.
    const currentLevel = user.currentLevel || 1;
    const effectiveLevel = Math.min(currentLevel, totalLevels);
    let levelUp = false;
    let nextLevel = currentLevel;
    if (args.levelNumber === effectiveLevel) {
      levelUp = true;
      // When user finishes the last word, stay at the last level (don't reset)
      nextLevel = currentLevel >= totalLevels ? totalLevels : currentLevel + 1;
      const levelPatch: any = {
        currentLevel: nextLevel,
        tacos: ((user as any).tacos ?? 0) + 1,
      };
      if (args.isPerfect) {
        levelPatch.perfectLevels = ((user as any).perfectLevels ?? 0) + 1;
      }
      await ctx.db.patch(args.userId, levelPatch);
    }

    // Rewards are given client-side via updateUserCurrency (avoids double-counting)
    return {
      success: true,
      level: args.levelNumber,
      levelUp,
      newLevel: nextLevel,
      reward,
    };
  },
});

/** Lightweight query — returns only the total level count (no ordering needed). */
export const getLevelCount = query({
  args: {},
  handler: async (ctx) => {
    const levels = await ctx.db.query("levels").collect();
    return levels.length;
  },
});

export const getAllLevels = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, { userId }) => {
    const rawLevels = await ctx.db.query("levels").collect();
    const rawWords = await ctx.db.query("words").collect();
    const user = userId ? await ctx.db.get(userId) : null;

    // Use same ordering logic as gameplay so map matches the game exactly
    const ordered = getOrderedLevels(rawLevels, rawWords, userId?.toString() ?? "", user?.culturalOrderVersion ?? 1);

    const wordMap = new Map(rawWords.map((w) => [w._id.toString(), w]));
    return ordered.map((lvl) => {
      const wordDoc = wordMap.get(lvl.wordId?.toString() ?? "");
      return {
        ...lvl,
        word: normalizeWord(wordDoc?.word ?? `Nivel ${lvl.levelNumber}`),
        meaning: wordDoc?.meaning ?? "",
      };
    });
  },
});


// Fetch a single level's word data by levelNumber (used for map repaso)
export const getLevelByNumber = query({
  args: { levelNumber: v.number() },
  handler: async (ctx, args) => {
    const lvl = await ctx.db
      .query("levels")
      .filter((q) => q.eq(q.field("levelNumber"), args.levelNumber))
      .first();
    if (!lvl) return null;
    const wordDoc = lvl.wordId ? await ctx.db.get(lvl.wordId) : null;
    return {
      level: lvl.levelNumber,
      wordId: lvl.wordId,
      word: wordDoc?.word ?? "",
      meaning: wordDoc?.meaning ?? "",
      example: wordDoc?.example ?? "",
      region: wordDoc?.region ?? "",
      reward: lvl.reward,
    };
  },
});

// Create levels for all words
export const createLevelsForAllWords = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all words
    const words = await ctx.db.query("words").collect();

    if (words.length === 0) {
      return { message: "No words found to create levels for" };
    }

    // Clear existing levels first
    const existingLevels = await ctx.db.query("levels").collect();
    for (const level of existingLevels) {
      await ctx.db.delete(level._id);
    }

    // Create levels for each word
    const createdLevels = [];

    // Explicit priority words for the first 7 levels (5 words each = 35 levels)
    const priorityWords = [
      // Nivel 1 - Taquito (Comida)
      { word: "TACO", meaning: "Tortilla rellena con guiso", example: "Vamos por unos tacos al pastor", region: "Todo México", category: "Comida" },
      { word: "TAMAL", meaning: "Masa de maíz envuelta en hoja", example: "En la mañana desayuné un tamal verde", region: "Nacional", category: "Comida" },
      { word: "POZOLE", meaning: "Caldo con maíz y carne", example: "El 15 de septiembre cenamos pozole", region: "Tradicional", category: "Comida" },
      { word: "MOLE", meaning: "Salsa espesa de chiles y especias", example: "El mole poblano es mi favorito", region: "Puebla", category: "Comida" },
      { word: "TLAYUDA", meaning: "Tortilla grande con frijoles y carne", example: "En Oaxaca comí una tlayuda enorme", region: "Oaxaca", category: "Comida" },

      // Nivel 2 - Pan de muerto (Comida)
      { word: "PAN DE MUERTO", meaning: "Pan dulce típico del Día de Muertos", example: "En noviembre comimos pan de muerto con chocolate", region: "Tradicional", category: "Comida" },
      { word: "ATOLE", meaning: "Bebida caliente de maíz", example: "En el Día de Muertos tomamos atole", region: "Tradicional", category: "Comida" },
      { word: "CHAMPURRADO", meaning: "Chocolate espeso con maíz", example: "En la feria vendían champurrado", region: "CDMX", category: "Comida" },
      { word: "BUÑUELO", meaning: "Fritura dulce con azúcar", example: "Comimos buñuelos en Navidad", region: "Nacional", category: "Comida" },
      { word: "CALABAZA EN TACHA", meaning: "Postre de calabaza con piloncillo", example: "En Día de Muertos prepararon calabaza en tacha", region: "Tradicional", category: "Comida" },

      // Nivel 3 - Juguetes de feria (Juegos)
      { word: "TROMPO", meaning: "Juguete de madera que gira", example: "El trompo se quedó bailando en la punta", region: "Infantil", category: "Juegos" },
      { word: "BALERO", meaning: "Juguete de madera con cuerda", example: "El niño encestó el balero a la primera", region: "Tradicional", category: "Juegos" },
      { word: "LOTERÍA", meaning: "Juego de cartas con imágenes", example: "Cantamos lotería en la fiesta", region: "Todo México", category: "Juegos" },
      { word: "CANICAS", meaning: "Esferas de vidrio para jugar", example: "Jugamos canicas en el recreo", region: "Infantil", category: "Juegos" },
      { word: "PIRINOLA", meaning: "Juguete que indica acciones", example: "La pirinola cayó en 'toma todo'", region: "Todo México", category: "Juegos" },

      // Nivel 4 - Rayuela mexicana (Juegos)
      { word: "SERPIENTES Y ESCALERAS", meaning: "Juego de tablero de avance y retroceso", example: "Jugamos serpientes y escaleras en familia", region: "Infantil", category: "Juegos" },
      { word: "RAYUELA", meaning: "Juego de piso con casillas numeradas", example: "Saltamos en la rayuela", region: "Callejero", category: "Juegos" },
      { word: "STOP", meaning: "Juego de categorías en papel", example: "Jugamos stop con mis primos", region: "Juvenil", category: "Juegos" },
      { word: "ENCANTADOS", meaning: "Juego de persecución", example: "Me atraparon en encantados", region: "Infantil", category: "Juegos" },

      // Nivel 5 - Mariachi básico (Música)
      { word: "MARIACHI", meaning: "Conjunto musical típico", example: "El mariachi tocó en la boda", region: "Todo México", category: "Música" },
      { word: "RANCHERA", meaning: "Género musical tradicional", example: "Cantamos rancheras toda la noche", region: "Nacional", category: "Música" },
      { word: "CORRIDO", meaning: "Canción narrativa popular", example: "Escuché un corrido revolucionario", region: "Norte", category: "Música" },
      { word: "BANDA", meaning: "Música sinaloense con viento", example: "La banda alegró la fiesta", region: "Sinaloa", category: "Música" },
      { word: "CUMBIA MEXICANA", meaning: "Versión nacional de la cumbia", example: "Bailamos cumbia mexicana en la boda", region: "Nacional", category: "Música" },

      // Nivel 6 - Son de la tierra (Música)
      { word: "SON JAROCHO", meaning: "Género musical de Veracruz", example: "El arpa sonó en el son jarocho", region: "Veracruz", category: "Música" },
      { word: "HUAPANGO", meaning: "Baile y música tradicional", example: "El huapango se baila en pareja", region: "Huasteca", category: "Música" },
      { word: "BOLERO", meaning: "Género romántico popular", example: "Cantaron boleros en la serenata", region: "Todo México", category: "Música" },
      { word: "NORTEÑO", meaning: "Música con acordeón y bajo sexto", example: "Escuchamos norteño en Monterrey", region: "Norte", category: "Música" },
      { word: "CHILENA COSTEÑA", meaning: "Música alegre del Pacífico", example: "Bailamos chilena en Oaxaca", region: "Costa Pacífico", category: "Música" },

      // Nivel 7 - Animales de leyenda (Animales)
      { word: "JAGUAR", meaning: "Felino emblemático mesoamericano", example: "El jaguar era símbolo de poder", region: "Sur de México", category: "Animales" },
      { word: "ÁGUILA REAL", meaning: "Ave nacional mexicana", example: "El águila real aparece en el escudo", region: "Todo México", category: "Animales" },
      { word: "SERPIENTE CASCABEL", meaning: "Reptil venenoso de México", example: "La serpiente cascabel sonó en el campo", region: "Norte y centro", category: "Animales" },
      { word: "CENZONTLE", meaning: "Ave conocida como el pájaro de las 400 voces", example: "El cenzontle canta variado", region: "Nacional", category: "Animales" },
      { word: "ARMADILLO", meaning: "Mamífero con caparazón", example: "Vimos un armadillo cruzar", region: "Sur", category: "Animales" },

      // Nivel 8 - Criaturas únicas (Animales)
      { word: "AJOLOTE", meaning: "Anfibio endémico de Xochimilco", example: "El ajolote se regenera solo", region: "CDMX", category: "Animales" },
      { word: "XOLOITZCUINTLE", meaning: "Perro ancestral mexicano", example: "El xoloitzcuintle acompañaba a los mexicas", region: "Nacional", category: "Animales" },
      { word: "CHAPULÍN", meaning: "Insecto comestible y típico", example: "Comimos chapulines con limón", region: "Oaxaca", category: "Animales" },
      { word: "GUACAMAYA", meaning: "Ave de plumas coloridas", example: "La guacamaya voló sobre la selva", region: "Selva", category: "Animales" },
      { word: "MAPACHE", meaning: "Mamífero nocturno de México", example: "Un mapache abrió la basura", region: "Bosques", category: "Animales" },

      // Nivel 9 - Antojitos callejeros (Comida)
      { word: "ESQUITES", meaning: "Maíz en vaso con mayonesa, queso y chile", example: "En la feria vendían esquites con chile piquín", region: "CDMX", category: "Comida" },
      { word: "TOSTILOCOS", meaning: "Botana de Tostitos con salsas y toppings", example: "Me comí unos tostilocos con cueritos", region: "Juvenil", category: "Comida" },
      { word: "PAMBAZO", meaning: "Torta bañada en salsa roja", example: "El pambazo me enchiló", region: "CDMX", category: "Comida" },
      { word: "TORTA AHOGADA", meaning: "Torta con salsa picante", example: "La torta ahogada estaba buenísima", region: "Guadalajara", category: "Comida" },
      { word: "HUARACHE", meaning: "Tortilla alargada con frijoles y guiso", example: "Me dieron un huarache con nopales", region: "CDMX", category: "Comida" },
      { word: "CHILAQUILES", meaning: "Totopos bañados en salsa", example: "Desayuné chilaquiles verdes con pollo", region: "Todo México", category: "Comida" },

      // Nivel 10 - Juegos de recreo (Juegos)
      { word: "ENCANTADOS", meaning: "Juego de persecución en el patio", example: "Jugamos encantados en la primaria", region: "Infantil", category: "Juegos" },
      { word: "LA VÍBORA DE LA MAR", meaning: "Juego tradicional en fiestas", example: "Cantamos en la víbora de la mar", region: "Tradicional", category: "Juegos" },
      { word: "LA ROÑA", meaning: "Juego de persecución", example: "Me atraparon en la roña", region: "Callejero", category: "Juegos" },
      { word: "BURRO CASTIGADO", meaning: "Juego de resistencia física", example: "Saltamos en el burro castigado", region: "Escuela", category: "Juegos" },
      { word: "DOÑA BLANCA", meaning: "Juego en ronda con canción", example: "Jugamos a Doña Blanca en la fiesta", region: "Infantil", category: "Juegos" },
      { word: "A LAS ESCONDIDAS", meaning: "Juego de esconderse y buscar", example: "Nos escondimos jugando escondidas", region: "Todo México", category: "Juegos" },

      // Nivel 11 - Voces mexicanas (Música)
      { word: "PEDRO INFANTE", meaning: "Ícono de la música ranchera", example: "Escuchamos canciones de Pedro Infante", region: "Época de Oro", category: "Música" },
      { word: "CHAVELA VARGAS", meaning: "Cantante reconocida de rancheras", example: "Chavela Vargas cantaba con sentimiento", region: "Tradicional", category: "Música" },
      { word: "JOSÉ ALFREDO JIMÉNEZ", meaning: "Compositor de rancheras", example: "José Alfredo escribió 'El Rey'", region: "Todo México", category: "Música" },
      { word: "LILA DOWNS", meaning: "Cantante contemporánea mexicana", example: "Lila Downs mezcla géneros en sus canciones", region: "Actual", category: "Música" },
      { word: "JUAN GABRIEL", meaning: "Cantante y compositor icónico", example: "Cantamos canciones de Juan Gabriel", region: "Todo México", category: "Música" },
      { word: "VICENTE FERNÁNDEZ", meaning: "Ícono de la música ranchera", example: "Vicente Fernández es 'El Charro de Huentitán'", region: "Jalisco", category: "Música" },

      // Nivel 12 - Fauna mexicana (Animales)
      { word: "OCELOTE", meaning: "Felino de tamaño mediano", example: "El ocelote vive en la selva", region: "Sur", category: "Animales" },
      { word: "TLACUACHE", meaning: "Marsupial mexicano", example: "Un tlacuache se metió en la casa", region: "CDMX", category: "Animales" },
      { word: "COLIBRÍ", meaning: "Ave pequeña de rápido vuelo", example: "El colibrí revoloteaba en el jardín", region: "Todo México", category: "Animales" },
      { word: "MURCIÉLAGO MAGUEYERO", meaning: "Polinizador del agave", example: "El murciélago magueyero ayuda al tequila", region: "Agavero", category: "Animales" },
      { word: "IGUANA", meaning: "Reptil común en zonas cálidas", example: "La iguana tomó sol en la roca", region: "Costa", category: "Animales" },
      { word: "ZORRILLO", meaning: "Mamífero con glándulas de defensa", example: "El zorrillo espantó a todos", region: "Bosques", category: "Animales" }
    ];

    // Priority sorting: Find the objects that match these words first
    const sortedWords = [];

    // 1. Push priority words in exact order
    for (const pw of priorityWords) {
      // Find the word in the DB (ignoring accents/case for matching)
      const foundIdx = words.findIndex(w => {
        const cleanDB = w.word.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cleanPW = pw.word.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return cleanDB === cleanPW;
      });

      if (foundIdx !== -1) {
        // If it exists in DB, update its definition to guarantee the newest image data
        const dbWord = words[foundIdx];
        await ctx.db.patch(dbWord._id, {
          meaning: pw.meaning,
          example: pw.example,
          region: pw.region,
          category: pw.category,
        });

        sortedWords.push({ ...dbWord, meaning: pw.meaning, example: pw.example, region: pw.region, category: pw.category });

        // Remove from original array so we don't duplicate it later
        words.splice(foundIdx, 1);
      } else {
        // If word doesn't exist in DB, create it with full details
        const newWordId = await ctx.db.insert("words", {
          word: pw.word.toUpperCase(),
          meaning: pw.meaning,
          example: pw.example,
          region: pw.region,
          category: pw.category,
        });
        sortedWords.push({ _id: newWordId, ...pw, word: pw.word.toUpperCase() });
      }
    }

    // 2. Classify and push all the rest of the words afterwards
    const fallbackCategories = ["Juegos", "Música", "Comida", "Animales", "Plantas", "Monumentos", "Artistas", "Tacos", "Historia"];
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word.category) {
        const cat = fallbackCategories[i % fallbackCategories.length];
        await ctx.db.patch(word._id, { category: cat });
        word.category = cat;
      }
    }
    sortedWords.push(...words);

    for (let i = 0; i < sortedWords.length; i++) {
      const word = sortedWords[i];
      const levelNumber = i + 1;

      // Calculate rewards based on level (increasing rewards)
      const baseCoins = 50;
      const baseDiamonds = 1;
      const coins = baseCoins + (levelNumber - 1) * 25; // 50, 75, 100, 125...
      const diamonds = baseDiamonds + Math.floor((levelNumber - 1) / 5); // 1, 1, 1, 1, 1, 2, 2, 2...

      const levelId = await ctx.db.insert("levels", {
        levelNumber,
        wordId: word._id,
        reward: {
          coins,
          diamonds,
        },
      });

      createdLevels.push({
        levelNumber,
        word: word.word,
        coins,
        diamonds,
        levelId,
      });
    }

    return {
      message: `Created ${createdLevels.length} levels`,
      levels: createdLevels,
    };
  },
});

const newWords15to18 = [
  // --- Nivel 15: Revolución mexicana (Historia) ---
  { word: "Francisco I Madero", meaning: "Presidente revolucionario", example: "Madero inició la Revolución", region: "Nacional", category: "Historia" },
  { word: "Venustiano Carranza", meaning: "Político y líder revolucionario", example: "Carranza promulgó la Constitución de 1917", region: "Coahuila", category: "Historia" },
  { word: "Alvaro Obregon", meaning: "General revolucionario", example: "Obregón fue presidente tras la Revolución", region: "Sonora", category: "Historia" },
  { word: "Lazaro Cardenas", meaning: "Presidente que expropió el petróleo", example: "Cárdenas nacionalizó el petróleo en 1938", region: "Michoacán", category: "Historia" },
  { word: "Porfirio Diaz", meaning: "Dictador mexicano", example: "Porfirio Díaz gobernó más de 30 años", region: "Oaxaca", category: "Historia" },
  { word: "Constitucion 1917", meaning: "Documento que rige a México", example: "La Constitución de 1917 se firmó en Querétaro", region: "Querétaro", category: "Historia" },

  // --- Nivel 16: Plantas mágicas (Plantas) ---
  { word: "Agave", meaning: "Planta usada para tequila y mezcal", example: "El agave azul produce tequila", region: "Jalisco", category: "Plantas" },
  { word: "Flor de nochebuena", meaning: "Planta típica de Navidad", example: "La nochebuena decora en diciembre", region: "Nacional", category: "Plantas" },
  { word: "Flor de dalia", meaning: "Flor nacional de México", example: "La dalia es la flor nacional desde 1963", region: "CDMX", category: "Plantas" },
  { word: "Flor de cacao", meaning: "Base del chocolate", example: "El cacao era considerado sagrado", region: "Tabasco", category: "Plantas" },
  { word: "Flor de vainilla", meaning: "Orquídea mexicana", example: "La vainilla es originaria de Papantla", region: "Veracruz", category: "Plantas" },
  { word: "Flor de maguey", meaning: "Comestible y tradicional", example: "Las flores de maguey se guisan", region: "Hidalgo", category: "Plantas" },

  // --- Nivel 17: Dulces mexicanos (Comida) ---
  { word: "Alegria", meaning: "Dulce de amaranto con miel", example: "De niño me daban alegrías de amaranto", region: "CDMX", category: "Comida" },
  { word: "Cocada", meaning: "Dulce de coco rallado con azúcar", example: "Compré cocadas en la feria", region: "Costeño", category: "Comida" },
  { word: "Palanqueta", meaning: "Dulce de cacahuate con piloncillo", example: "La palanqueta es muy crocante", region: "Nacional", category: "Comida" },
  { word: "Borrachito", meaning: "Dulce de Puebla con licor", example: "Probé un borrachito en Cholula", region: "Puebla", category: "Comida" },
  { word: "Glorias", meaning: "Dulce de leche quemada", example: "Las glorias son típicas de Monterrey", region: "Norte", category: "Comida" },
  { word: "Mazapan", meaning: "Dulce de cacahuate suave", example: "Se me rompió el mazapán sin romperlo", region: "Guadalajara", category: "Comida" },

  // --- Nivel 18: Juegos de cantos (Juegos) ---
  { word: "La viborita de la mar", meaning: "Juego en ronda con canción", example: "Cantamos la viborita de la mar en la kermés", region: "Tradicional", category: "Juegos" },
  { word: "El patio de mi casa", meaning: "Juego con canto y rondas", example: "Jugamos al patio de mi casa en el recreo", region: "Infantil", category: "Juegos" },
  { word: "Las estatuas", meaning: "Juego de quedarse quieto", example: "Perdí porque me moví en estatuas", region: "Infantil", category: "Juegos" },
  { word: "El avioncito", meaning: "Juego de rayuela", example: "Saltamos el avioncito en el recreo", region: "Infantil", category: "Juegos" },
  { word: "Policias y ladrones", meaning: "Juego de persecución", example: "Jugamos policías y ladrones en la calle", region: "Juvenil", category: "Juegos" },
];

export const seedLevels15_18 = mutation({
  handler: async (ctx) => {
    let addedCount = 0;
    for (const w of newWords15to18) {
      const cleanWord = w.word.toUpperCase();
      const existing = await ctx.db
        .query("words")
        .filter((q) => q.eq(q.field("word"), cleanWord))
        .first();

      if (!existing) {
        await ctx.db.insert("words", {
          word: cleanWord,
          meaning: w.meaning,
          example: w.example,
          region: w.region,
        });
        addedCount++;
      }
    }
    return `Añadidas ${addedCount} palabras. Agrega un botón en MainMenuScreen para llamar a api.levels.createLevelsForAllWords después de esto si quieres actualizar los niveles.`;
  },
});

/**
 * Adds level documents for every word that does not yet have one.
 * Safe: does NOT delete existing levels or change current user progress.
 *
 * Run from Convex dashboard: levels:addMissingLevels
 */
export const addMissingLevels = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const allLevels = await ctx.db.query("levels").collect();

    // Build set of wordIds that already have a level document
    const coveredWordIds = new Set(allLevels.map((l) => l.wordId.toString()));

    // Determine next available levelNumber
    const maxLevelNumber = allLevels.length > 0
      ? Math.max(...allLevels.map((l) => l.levelNumber))
      : 0;

    let nextLevelNumber = maxLevelNumber + 1;
    let added = 0;

    for (const word of allWords) {
      if (coveredWordIds.has(word._id.toString())) continue;

      const coins = 2 + Math.floor((nextLevelNumber - 1) / 100);
      const diamonds = Math.floor((nextLevelNumber - 1) / 200);

      await ctx.db.insert("levels", {
        levelNumber: nextLevelNumber,
        wordId: word._id,
        reward: { coins, diamonds },
      });

      nextLevelNumber++;
      added++;
    }

    return {
      added,
      totalLevels: allLevels.length + added,
      message: `Añadidos ${added} niveles nuevos. Total: ${allLevels.length + added} niveles.`,
    };
  },
});
