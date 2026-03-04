import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOrderedLevels, completedWordIds } from "./levelOrdering";

// Get all words
export const getAllWords = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("words").collect();
  },
});

// Get all words with unlocked status based on user progress
export const getWordsWithProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const currentLevel = user?.currentLevel ?? 1;

    const allLevels = await ctx.db.query("levels").collect();
    const allWords  = await ctx.db.query("words").collect();

    // Use the same ordering as gameplay for accurate unlock status
    const ordered = getOrderedLevels(allLevels, allWords, args.userId.toString());
    const done    = completedWordIds(ordered, currentLevel);

    return allWords.map((w) => ({
      ...w,
      unlocked: done.has(w._id.toString()),
    }));
  },
});

// Get a specific word by ID
export const getWordById = query({
  args: { wordId: v.id("words") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.wordId);
  },
});

// Add a new word
export const addWord = mutation({
  args: {
    word: v.string(),
    meaning: v.string(),
    example: v.string(),
    region: v.string(),
  },
  handler: async (ctx, args) => {
    const wordId = await ctx.db.insert("words", {
      word: args.word,
      meaning: args.meaning,
      example: args.example,
      region: args.region,
    });
    return wordId;
  },
});

// Update an existing word
export const updateWord = mutation({
  args: {
    wordId: v.id("words"),
    word: v.optional(v.string()),
    meaning: v.optional(v.string()),
    region: v.optional(v.string()),
    example: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { wordId, ...updates } = args;
    await ctx.db.patch(wordId, updates);
    return wordId;
  },
});

// Delete a word
export const deleteWord = mutation({
  args: { wordId: v.id("words") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.wordId);
    return "Word deleted successfully";
  },
});

// Search words by term
export const searchWords = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const words = await ctx.db.query("words").collect();
    return words.filter(word =>
      word.word.toLowerCase().includes(args.searchTerm.toLowerCase()) ||
      word.meaning.toLowerCase().includes(args.searchTerm.toLowerCase()) ||
      word.region.toLowerCase().includes(args.searchTerm.toLowerCase())
    );
  },
});

// Get words by level (useful for level progression)
export const getWordsByLevel = query({
  args: { levelNumbers: v.array(v.number()) },
  handler: async (ctx, args) => {
    const levels = await ctx.db
      .query("levels")
      .filter((q) => q.and(
        q.gte(q.field("levelNumber"), Math.min(...args.levelNumbers)),
        q.lte(q.field("levelNumber"), Math.max(...args.levelNumbers))
      ))
      .collect();

    const wordIds = levels.map(level => level.wordId);
    const words = await Promise.all(wordIds.map(id => ctx.db.get(id)));
    return words.filter(Boolean);
  },
});

// Get random words for practice (excluding specific levels)
export const getRandomWords = query({
  args: { count: v.number(), excludeLevels: v.optional(v.array(v.number())) },
  handler: async (ctx, args) => {
    let allWords = await ctx.db.query("words").collect();

    if (args.excludeLevels && args.excludeLevels.length > 0) {
      const excludeLevels = await ctx.db
        .query("levels")
        .filter((q) => q.and(
          q.gte(q.field("levelNumber"), Math.min(...args.excludeLevels!)),
          q.lte(q.field("levelNumber"), Math.max(...args.excludeLevels!))
        ))
        .collect();

      const excludeWordIds = new Set(excludeLevels.map(level => level.wordId));
      allWords = allWords.filter(word => !excludeWordIds.has(word._id));
    }

    // Shuffle and return requested count
    const shuffled = allWords.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, args.count);
  },
});

// Get word count for verification
export const getWordCount = query({
  args: {},
  handler: async (ctx) => {
    const words = await ctx.db.query("words").collect();
    return {
      totalWords: words.length,
      words: words.map(word => ({
        id: word._id,
        word: word.word,
        meaning: word.meaning,
        region: word.region,
        example: word.example
      }))
    };
  },
});

const sampleWords = [
  {
    "Palabra": "Chido",
    "Significado": "Algo bueno o bonito",
    "Ejemplo": "Está bien chido tu celular",
    "Region": "Todo México"
  },
  {
    "Palabra": "Neta",
    "Significado": "La verdad",
    "Ejemplo": "¿Neta me estás diciendo eso?",
    "Region": "Todo México"
  },
  {
    "Palabra": "Órale",
    "Significado": "Sorpresa o ánimo",
    "Ejemplo": "¡Órale! Qué rápido corres",
    "Region": "Todo México"
  },
  {
    "Palabra": "Wey",
    "Significado": "Amigo, persona",
    "Ejemplo": "Ese wey siempre llega tarde",
    "Region": "Todo México"
  },
  {
    "Palabra": "Chela",
    "Significado": "Cerveza",
    "Ejemplo": "Vamos por unas chelas",
    "Region": "Todo México"
  },
  {
    "Palabra": "Chamba",
    "Significado": "Trabajo",
    "Ejemplo": "Ya encontré chamba",
    "Region": "Todo México"
  },
  {
    "Palabra": "No manches",
    "Significado": "Asombro o incredulidad",
    "Ejemplo": "¡No manches, qué caro!",
    "Region": "Todo México"
  },
  {
    "Palabra": "Platicar",
    "Significado": "Conversar",
    "Ejemplo": "Vamos a platicar un rato",
    "Region": "Todo México"
  },
  {
    "Palabra": "Sale",
    "Significado": "De acuerdo",
    "Ejemplo": "Sale, nos vemos mañana",
    "Region": "Todo México"
  },
  {
    "Palabra": "Lana",
    "Significado": "Dinero",
    "Ejemplo": "No traigo lana",
    "Region": "Todo México"
  },
  {
    "Palabra": "Fresa",
    "Significado": "Presumido",
    "Ejemplo": "Ella habla bien fresa",
    "Region": "Todo México"
  },
  {
    "Palabra": "Naco",
    "Significado": "Persona de mal gusto",
    "Ejemplo": "Ese carro está naco",
    "Region": "Todo México"
  },
  {
    "Palabra": "Chafa",
    "Significado": "De mala calidad",
    "Ejemplo": "Ese reloj se ve chafa",
    "Region": "Todo México"
  },
  {
    "Palabra": "Gacho",
    "Significado": "Feo o mala onda",
    "Ejemplo": "Se portó bien gacho contigo",
    "Region": "Todo México"
  },
  {
    "Palabra": "Morra / Morro",
    "Significado": "Chica / chico",
    "Ejemplo": "Esa morra es mi amiga",
    "Region": "Todo México"
  },
  {
    "Palabra": "Carnal",
    "Significado": "Hermano / amigo cercano",
    "Ejemplo": "Ese es mi carnal",
    "Region": "Todo México"
  },
  {
    "Palabra": "¡Qué oso!",
    "Significado": "Vergüenza",
    "Ejemplo": "Me caí, qué oso",
    "Region": "Todo México"
  },
  {
    "Palabra": "Chismoso",
    "Significado": "Persona que cuenta chismes",
    "Ejemplo": "No seas chismoso",
    "Region": "Todo México"
  },
  {
    "Palabra": "Peda",
    "Significado": "Fiesta con alcohol",
    "Ejemplo": "Vamos a la peda",
    "Region": "Todo México"
  },
  {
    "Palabra": "Crudo",
    "Significado": "Resaca",
    "Ejemplo": "Ando bien crudo",
    "Region": "Todo México"
  },
  {
    "Palabra": "Tirar paro",
    "Significado": "Ayudar",
    "Ejemplo": "Tírame paro con esta tarea",
    "Region": "Todo México"
  },
  {
    "Palabra": "Echar la hueva",
    "Significado": "Descansar, no hacer nada",
    "Ejemplo": "Hoy solo voy a echar la hueva",
    "Region": "Todo México"
  },
  {
    "Palabra": "Hacerse güey",
    "Significado": "Fingir que no entiendes",
    "Ejemplo": "Se hizo güey para no pagar",
    "Region": "Todo México"
  },
  {
    "Palabra": "Ya valió madre",
    "Significado": "Todo salió mal",
    "Ejemplo": "Se me perdió el dinero, ya valió madre",
    "Region": "Todo México"
  },
  {
    "Palabra": "Pendejo",
    "Significado": "Insulto común",
    "Ejemplo": "Ese güey es un pendejo",
    "Region": "Todo México"
  },
  {
    "Palabra": "Cabrón",
    "Significado": "Insulto o admiración",
    "Ejemplo": "¡Ese cabrón juega muy bien!",
    "Region": "Todo México"
  },
  {
    "Palabra": "Vieja",
    "Significado": "Novia / esposa",
    "Ejemplo": "Esa es mi vieja",
    "Region": "Todo México"
  },
  {
    "Palabra": "Jaina",
    "Significado": "Novia",
    "Ejemplo": "Esa es mi jaina",
    "Region": "Barrio / Centro"
  },
  {
    "Palabra": "Cotorreo",
    "Significado": "Diversión, plática",
    "Ejemplo": "Qué buen cotorreo ayer",
    "Region": "Todo México"
  },
  {
    "Palabra": "Agüitado",
    "Significado": "Triste",
    "Ejemplo": "Ando agüitado",
    "Region": "Todo México"
  },
  {
    "Palabra": "Echar taco de ojo",
    "Significado": "Ver a alguien atractivo",
    "Ejemplo": "Voy a la playa a echar taco de ojo",
    "Region": "Todo México"
  },
  {
    "Palabra": "Irse de rol",
    "Significado": "Salir a pasear",
    "Ejemplo": "Nos fuimos de rol por la ciudad",
    "Region": "Norte"
  },
  {
    "Palabra": "Andar pedo",
    "Significado": "Estar borracho",
    "Ejemplo": "Ese güey anda pedo",
    "Region": "Todo México"
  },
  {
    "Palabra": "Armarla de pedo",
    "Significado": "Hacer problema",
    "Ejemplo": "La armó de pedo en la fiesta",
    "Region": "Todo México"
  },
  {
    "Palabra": "Poner el cuerno",
    "Significado": "Ser infiel",
    "Ejemplo": "Le puso el cuerno a su novia",
    "Region": "Todo México"
  },
  {
    "Palabra": "Estar hasta las chanclas",
    "Significado": "Muy borracho",
    "Ejemplo": "En la boda todos estaban hasta las chanclas",
    "Region": "Todo México"
  },
  {
    "Palabra": "No dar el ancho",
    "Significado": "No cumplir expectativas",
    "Ejemplo": "El jugador no dio el ancho",
    "Region": "Todo México"
  },
  {
    "Palabra": "Caer gordo",
    "Significado": "Caer mal",
    "Ejemplo": "Ese profe me cae gordo",
    "Region": "Todo México"
  },
  {
    "Palabra": "Estar cañón",
    "Significado": "Algo difícil o impresionante",
    "Ejemplo": "Ese examen estuvo cañón",
    "Region": "Todo México"
  },
  {
    "Palabra": "A darle que es mole de olla",
    "Significado": "Vamos con todo",
    "Ejemplo": "¡A darle que es mole de olla!",
    "Region": "Todo México"
  },
  {
    "Palabra": "Chilango",
    "Significado": "Capitalino",
    "Ejemplo": "Soy chilango de nacimiento",
    "Region": "CDMX"
  },
  {
    "Palabra": "Camión",
    "Significado": "Autobús",
    "Ejemplo": "Voy a tomar el camión",
    "Region": "CDMX / Centro"
  },
  {
    "Palabra": "Micro",
    "Significado": "Microbús",
    "Ejemplo": "Voy en el micro",
    "Region": "CDMX"
  },
  {
    "Palabra": "Cuate",
    "Significado": "Amigo",
    "Ejemplo": "Es mi cuate de la uni",
    "Region": "Centro"
  },
  {
    "Palabra": "Neta del planeta",
    "Significado": "Lo mejor",
    "Ejemplo": "Ese artista es la neta del planeta",
    "Region": "CDMX"
  },
  {
    "Palabra": "Ándale",
    "Significado": "Apúrate / acuerdo",
    "Ejemplo": "¡Ándale pues!",
    "Region": "Centro"
  },
  {
    "Palabra": "Metro",
    "Significado": "Transporte subterráneo",
    "Ejemplo": "Voy en el metro",
    "Region": "CDMX"
  },
  {
    "Palabra": "Puchador",
    "Significado": "Vendedor de droga",
    "Ejemplo": "Ese puchador lo agarró la poli",
    "Region": "Barrio CDMX"
  },
  {
    "Palabra": "Chaleco",
    "Significado": "Persona torpe",
    "Ejemplo": "Ese chavo está bien chaleco",
    "Region": "CDMX"
  },
  {
    "Palabra": "Machín",
    "Significado": "Muy fuerte o bueno",
    "Ejemplo": "Ese golpe estuvo machín",
    "Region": "Norte"
  },
  {
    "Palabra": "Morrita",
    "Significado": "Chica joven",
    "Ejemplo": "Esa morrita me gusta",
    "Region": "Norte"
  },
  {
    "Palabra": "Fierro pariente",
    "Significado": "Vamos con todo",
    "Ejemplo": "¡Fierro pariente!",
    "Region": "Norte"
  },
  {
    "Palabra": "Andar con madre",
    "Significado": "Estar muy bien",
    "Ejemplo": "Todo anda con madre",
    "Region": "Norte"
  },
  {
    "Palabra": "Huerco",
    "Significado": "Niño",
    "Ejemplo": "Ese huerco está jugando",
    "Region": "Monterrey"
  },
  {
    "Palabra": "Troca",
    "Significado": "Camioneta",
    "Ejemplo": "Compré una troca nueva",
    "Region": "Norte"
  },
  {
    "Palabra": "Congal",
    "Significado": "Cantina",
    "Ejemplo": "Se fue al congal",
    "Region": "Norte"
  },
  {
    "Palabra": "Plebe",
    "Significado": "Niño/joven",
    "Ejemplo": "Ese plebe juega fútbol",
    "Region": "Sinaloa"
  },
  {
    "Palabra": "A la bestia",
    "Significado": "Expresión de sorpresa",
    "Ejemplo": "¡A la bestia, qué calor!",
    "Region": "Sonora"
  },
  {
    "Palabra": "Un paro",
    "Significado": "Un favor",
    "Ejemplo": "Hazme un paro con eso",
    "Region": "Norte"
  },
  {
    "Palabra": "Choco",
    "Significado": "Tabasqueño",
    "Ejemplo": "Es un choco de Villahermosa",
    "Region": "Tabasco"
  },
  {
    "Palabra": "Bato",
    "Significado": "Amigo",
    "Ejemplo": "Ese bato es buena onda",
    "Region": "Guerrero"
  },
  {
    "Palabra": "Ñero",
    "Significado": "Amigo de la calle",
    "Ejemplo": "Ese ñero siempre anda conmigo",
    "Region": "CDMX/Sur"
  },
  {
    "Palabra": "Pichar",
    "Significado": "Invitar",
    "Ejemplo": "Yo picho las chelas",
    "Region": "Sur"
  },
  {
    "Palabra": "Me late",
    "Significado": "Me gusta",
    "Ejemplo": "Ese plan me late",
    "Region": "Centro/Sur"
  },
  {
    "Palabra": "Estar padre",
    "Significado": "Bonito",
    "Ejemplo": "Ese lugar está padre",
    "Region": "Todo México"
  },
  {
    "Palabra": "Chambear",
    "Significado": "Trabajar",
    "Ejemplo": "Anda chambeando en la obra",
    "Region": "Sur/Centro"
  },
  {
    "Palabra": "Echar relajo",
    "Significado": "Hacer desorden",
    "Ejemplo": "Los niños están echando relajo",
    "Region": "Sur/Centro"
  },
  {
    "Palabra": "Puchis",
    "Significado": "Expresión de sorpresa",
    "Ejemplo": "¡Puchis, qué caro!",
    "Region": "Oaxaca"
  },
  {
    "Palabra": "Xix",
    "Significado": "Sobras de comida",
    "Ejemplo": "Me comí el xix",
    "Region": "Yucatán"
  },
  {
    "Palabra": "Pib",
    "Significado": "Tamal horneado típico",
    "Ejemplo": "Comimos pib en el Hanal Pixán",
    "Region": "Yucatán"
  },
  {
    "Palabra": "Tuch",
    "Significado": "Ombligo",
    "Ejemplo": "Me duele el tuch",
    "Region": "Yucatán"
  },
  {
    "Palabra": "Poch",
    "Significado": "Despectivo para mestizo",
    "Ejemplo": "Le dijeron poch",
    "Region": "Yucatán"
  },
  {
    "Palabra": "Turix",
    "Significado": "Libélula",
    "Ejemplo": "Mira un turix",
    "Region": "Yucatán"
  },
  {
    "Palabra": "Pacha",
    "Significado": "Fiesta",
    "Ejemplo": "Hoy hay pacha en el pueblo",
    "Region": "Yucatán"
  },
  {
    "Palabra": "Jach",
    "Significado": "Muy",
    "Ejemplo": "Está jach bonito",
    "Region": "Yucatán"
  },
  {
    "Palabra": "A’huevo",
    "Significado": "Claro que sí",
    "Ejemplo": "Voy a ir a’huevo",
    "Region": "Todo México"
  },
  {
    "Palabra": "Tuchito",
    "Significado": "Cariño (vientre/ombligo)",
    "Ejemplo": "Ven mi tuchito",
    "Region": "Yucatán"
  },
  {
    "Palabra": "Bato loco",
    "Significado": "Amigo arriesgado",
    "Ejemplo": "Ese bato loco se la rifó",
    "Region": "Norte"
  },
  {
    "Palabra": "Andar bravo",
    "Significado": "Andar agresivo",
    "Ejemplo": "Hoy anda bravo",
    "Region": "Norte"
  },
  {
    "Palabra": "Tirar esquina",
    "Significado": "Apoyar",
    "Ejemplo": "Me tiró esquina en la pelea",
    "Region": "Barrio"
  },
  {
    "Palabra": "Jalón",
    "Significado": "Viaje en carro",
    "Ejemplo": "Dame un jalón",
    "Region": "Todo México"
  },
  {
    "Palabra": "Halcón",
    "Significado": "Espía callejero",
    "Ejemplo": "Ese halcón avisó a los demás",
    "Region": "Norte"
  },
  {
    "Palabra": "Troca blindada",
    "Significado": "Camioneta blindada",
    "Ejemplo": "Llegaron en troca blindada",
    "Region": "Norte"
  },
  {
    "Palabra": "Clica",
    "Significado": "Grupo/banda",
    "Ejemplo": "Esa es mi clica",
    "Region": "Barrio"
  },
  {
    "Palabra": "Tirar barrio",
    "Significado": "Representar tu zona",
    "Ejemplo": "Anda tirando barrio",
    "Region": "Barrio"
  },
  {
    "Palabra": "Estar en la movida",
    "Significado": "Andar en negocios turbios",
    "Ejemplo": "Está en la movida",
    "Region": "Norte"
  },
  {
    "Palabra": "Pisto",
    "Significado": "Alcohol",
    "Ejemplo": "Vamos a comprar pisto",
    "Region": "Norte"
  },
  {
    "Palabra": "Cancelado",
    "Significado": "Rechazado socialmente",
    "Ejemplo": "Ese influencer está cancelado",
    "Region": "Internet"
  },
  {
    "Palabra": "Funar",
    "Significado": "Exponer públicamente",
    "Ejemplo": "Lo funaron en Twitter",
    "Region": "Internet"
  },
  {
    "Palabra": "Chismecito",
    "Significado": "Plática de chismes",
    "Ejemplo": "Vamos al chismecito",
    "Region": "Juvenil/Internet"
  },
  {
    "Palabra": "Stalkear",
    "Significado": "Espiar en redes",
    "Ejemplo": "Lo stalkeé en Instagram",
    "Region": "Internet"
  },
  {
    "Palabra": "Crush",
    "Significado": "Persona que te gusta",
    "Ejemplo": "Ella es mi crush",
    "Region": "Juvenil/Internet"
  },
  {
    "Palabra": "Shippear",
    "Significado": "Juntar parejas",
    "Ejemplo": "Los shippeo juntos",
    "Region": "Juvenil/Internet"
  },
  {
    "Palabra": "Postear",
    "Significado": "Subir algo a redes",
    "Ejemplo": "Voy a postear una foto",
    "Region": "Internet"
  },
  {
    "Palabra": "Subirse al tren",
    "Significado": "Unirse a la moda",
    "Ejemplo": "Se subió al tren del meme",
    "Region": "Internet"
  },
  {
    "Palabra": "Estar viral",
    "Significado": "Ser tendencia",
    "Ejemplo": "Ese video está viral",
    "Region": "Internet"
  },
  {
    "Palabra": "Meme",
    "Significado": "Imagen graciosa",
    "Ejemplo": "Vi un meme buenísimo",
    "Region": "Internet"
  }
]

// Mutation to seed all words
export const seedWords = mutation({
  args: {},
  handler: async (ctx) => {
    const results = [];

    for (const word of sampleWords) {
      const wordId = await ctx.db.insert("words", {
        word: word.Palabra,
        meaning: word.Significado, // Empty meaning for Mexican slang words
        example: word.Ejemplo,
        region: word.Region,
      });
      results.push({ id: wordId, word: word.Palabra });
    }

    return {
      message: `Successfully added ${results.length} Mexican slang words`,
      words: results
    };
  },
});

// Mutation to add levels for all Mexican slang words (levels 14-113)
export const addMexicanSlangLevels = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all Mexican slang words
    const words = await ctx.db.query("words").collect();

    // Filter to get only the Mexican slang words (those with empty definitions)
    const mexicanSlangWords = words.filter(word => word.meaning === "");

    const results = [];

    // Start from level 14 (since we have levels 1-13 already)
    let levelNumber = 14;

    for (const word of mexicanSlangWords) {
      // Calculate rewards - increasing coins and diamonds
      const coins = 50 + (levelNumber - 1) * 25; // 50, 75, 100, 125, etc.
      const diamonds = Math.floor((levelNumber - 1) / 5) + 1; // 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, etc.

      const levelId = await ctx.db.insert("levels", {
        levelNumber: levelNumber,
        wordId: word._id,
        reward: { coins, diamonds },
      });

      results.push({
        levelId,
        levelNumber,
        word: word.word,
        coins,
        diamonds
      });

      levelNumber++;
    }

    return {
      message: `Successfully added ${results.length} levels for Mexican slang words`,
      levels: results
    };
  },
});

// Combined mutation to seed words and create levels in one go
export const seedWordsAndLevels = mutation({
  args: {},
  handler: async (ctx) => {
    // First, seed the words
    const wordResults = [];

    for (const word of sampleWords) {
      const wordId = await ctx.db.insert("words", {
        word: word.Palabra,
        meaning: "", // Empty meaning for Mexican slang words
        region: word.Palabra,
        example: word.Ejemplo,
      });
      wordResults.push({ id: wordId, word: word.Palabra });
    }

    // Then, create levels for each word
    const levelResults = [];
    let levelNumber = 14; // Start from level 14

    for (const wordResult of wordResults) {
      // Calculate rewards - increasing coins and diamonds
      const coins = 50 + (levelNumber - 1) * 25; // 50, 75, 100, 125, etc.
      const diamonds = Math.floor((levelNumber - 1) / 5) + 1; // 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, etc.

      const levelId = await ctx.db.insert("levels", {
        levelNumber: levelNumber,
        wordId: wordResult.id,
        reward: { coins, diamonds },
      });

      levelResults.push({
        levelId,
        levelNumber,
        word: wordResult.word,
        coins,
        diamonds
      });

      levelNumber++;
    }

    return {
      message: `Successfully added ${wordResults.length} Mexican slang words and ${levelResults.length} levels`,
      words: wordResults,
      levels: levelResults
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Seed the 4 themed levels from the user's vocabulary table.
// Run once: npx convex run words:seedMexicanLevels
// ─────────────────────────────────────────────────────────────────────────────
export const seedMexicanLevels = mutation({
  args: {},
  handler: async (ctx) => {
    const themed = [
      // ── Nivel 1 – Taquito fácil (Comida) ──────────────────────────────────
      { word: "Taco", meaning: "Tortilla rellena con guiso", example: "Vamos por unos tacos al pastor", region: "Todo México" },
      { word: "Tamal", meaning: "Masa de maíz envuelta en hoja", example: "En la mañana desayuné un tamal verde", region: "Nacional" },
      { word: "Pozole", meaning: "Caldo con maíz y carne", example: "El 15 de septiembre cenamos pozole", region: "Tradicional" },
      { word: "Mole", meaning: "Salsa espesa de chiles y especias", example: "El mole poblano es mi favorito", region: "Puebla" },
      { word: "Tlayuda", meaning: "Tortilla grande con frijoles y carne", example: "En Oaxaca comí una tlayuda enorme", region: "Oaxaca" },

      // ── Nivel 2 – Pan de muerto (Comida) ──────────────────────────────────
      { word: "Pan de muerto", meaning: "Pan dulce típico del Día de Muertos", example: "En noviembre comimos pan de muerto con chocolate", region: "Tradicional" },
      { word: "Atole", meaning: "Bebida caliente de maíz", example: "En el Día de Muertos tomamos atole", region: "Tradicional" },
      { word: "Champurrado", meaning: "Chocolate espeso con maíz", example: "En la feria vendían champurrado", region: "CDMX" },
      { word: "Buñuelo", meaning: "Fritura dulce con azúcar", example: "Comimos buñuelos en Navidad", region: "Nacional" },
      { word: "Calabaza en tacha", meaning: "Postre de calabaza con piloncillo", example: "En Día de Muertos prepararon calabaza en tacha", region: "Tradicional" },

      // ── Nivel 3 – Juguete de feria (Juegos) ───────────────────────────────
      { word: "Trompo", meaning: "Juguete de madera que gira", example: "El trompo se quedó bailando en la punta", region: "Infantil" },
      { word: "Balero", meaning: "Juguete de madera con cuerda", example: "El niño encestó el balero a la primera", region: "Tradicional" },
      { word: "Lotería", meaning: "Juego de cartas con imágenes", example: "Cantamos lotería en la fiesta", region: "Todo México" },
      { word: "Canicas", meaning: "Esferas de vidrio para jugar", example: "Jugamos canicas en el recreo", region: "Infantil" },
      { word: "Pirinola", meaning: "Juguete que indica acciones", example: "La pirinola cayó en 'toma todo'", region: "Todo México" },

      // ── Nivel 4 – Rayuela mexicana (Juegos) ───────────────────────────────
      { word: "Serpientes y escaleras", meaning: "Juego de tablero de avance y retroceso", example: "Jugamos serpientes y escaleras en familia", region: "Infantil" },
      { word: "Rayuela", meaning: "Juego de piso con casillas numeradas", example: "Saltamos en la rayuela", region: "Callejero" },
      { word: "Stop", meaning: "Juego de categorías en papel", example: "Jugamos stop con mis primos", region: "Juvenil" },
    ];

    // Remove old themed words that match these exact names (idempotent)
    const existingWords = await ctx.db.query("words").collect();
    const themedNames = new Set(themed.map(w => w.word.toLowerCase()));
    for (const w of existingWords) {
      if (themedNames.has(w.word.toLowerCase())) {
        // Also delete the level that points to this word
        const lvl = await ctx.db
          .query("levels")
          .filter((q) => q.eq(q.field("wordId"), w._id))
          .first();
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(w._id);
      }
    }

    // Find next available level number
    const allLevels = await ctx.db.query("levels").collect();
    let nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    const inserted = [];
    for (const data of themed) {
      const wordId = await ctx.db.insert("words", data);
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = 1 + Math.floor((nextLevel - 1) / 5);
      await ctx.db.insert("levels", { levelNumber: nextLevel, wordId, reward: { coins, diamonds } });
      inserted.push({ level: nextLevel, word: data.word });
      nextLevel++;
    }

    return { success: true, inserted };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Seed levels 5–22 from the user's vocabulary tables.
// Run once: npx convex run words:seedLevels5to22
// ─────────────────────────────────────────────────────────────────────────────
export const seedLevels5to22 = mutation({
  args: {},
  handler: async (ctx) => {
    const newWords = [
      // ── Nivel 5 – Mariachi básico (Música) ────────────────────────────────
      { word: "Mariachi", meaning: "Conjunto musical típico", example: "El mariachi tocó en la boda", region: "Todo México" },
      { word: "Ranchera", meaning: "Género musical tradicional", example: "Cantamos rancheras toda la noche", region: "Nacional" },
      { word: "Corrido", meaning: "Canción narrativa popular", example: "Escuché un corrido revolucionario", region: "Norte" },
      { word: "Banda", meaning: "Música sinaloense con viento", example: "La banda alegró la fiesta", region: "Sinaloa" },
      { word: "Cumbia mexicana", meaning: "Versión nacional de la cumbia", example: "Bailamos cumbia mexicana en la boda", region: "Nacional" },

      // ── Nivel 6 – Son de la tierra (Música) ───────────────────────────────
      { word: "Son jarocho", meaning: "Género musical de Veracruz", example: "El arpa sonó en el son jarocho", region: "Veracruz" },
      { word: "Huapango", meaning: "Baile y música tradicional", example: "El huapango se baila en pareja", region: "Huasteca" },
      { word: "Bolero", meaning: "Género romántico popular", example: "Cantaron boleros en la serenata", region: "Todo México" },
      { word: "Norteño", meaning: "Música con acordeón y bajo sexto", example: "Escuchamos norteño en Monterrey", region: "Norte" },
      { word: "Chilena costeña", meaning: "Música alegre del Pacífico", example: "Bailamos chilena en Oaxaca", region: "Costa Pacífico" },

      // ── Nivel 7 – Animales de leyenda (Animales) ──────────────────────────
      { word: "Jaguar", meaning: "Felino emblemático mesoamericano", example: "El jaguar era símbolo de poder", region: "Sur de México" },
      { word: "Aguila real", meaning: "Ave nacional mexicana", example: "El águila real aparece en el escudo", region: "Todo México" },
      { word: "Serpiente cascabel", meaning: "Reptil venenoso de México", example: "La serpiente cascabel sonó en el campo", region: "Norte y centro" },
      { word: "Cenzontle", meaning: "Ave conocida como el pájaro de las 400 voces", example: "El cenzontle canta variado", region: "Nacional" },
      { word: "Armadillo", meaning: "Mamífero con caparazón", example: "Vimos un armadillo cruzar", region: "Sur" },

      // ── Nivel 8 – Criaturas únicas (Animales) ─────────────────────────────
      { word: "Ajolote", meaning: "Anfibio endémico de Xochimilco", example: "El ajolote se regenera solo", region: "CDMX" },
      { word: "Xoloitzcuintle", meaning: "Perro ancestral mexicano", example: "El xoloitzcuintle acompañaba a los mexicas", region: "Nacional" },
      { word: "Chapulin", meaning: "Insecto comestible y típico", example: "Comimos chapulines con limón", region: "Oaxaca" },
      { word: "Guacamaya", meaning: "Ave de plumas coloridas", example: "La guacamaya voló sobre la selva", region: "Selva" },
      { word: "Mapache", meaning: "Mamífero nocturno de México", example: "Un mapache abrió la basura", region: "Bosques" },

      // ── Nivel 9 – Antojitos callejeros (Comida) ───────────────────────────
      { word: "Esquites", meaning: "Maíz en vaso con mayonesa, queso y chile", example: "En la feria vendían esquites con chile piquín", region: "CDMX" },
      { word: "Tostilocos", meaning: "Botana de Tostitos con salsas y toppings", example: "Me comí unos tostilocos con cueritos", region: "Juvenil" },
      { word: "Pambazo", meaning: "Torta bañada en salsa roja", example: "El pambazo me enchiló", region: "CDMX" },
      { word: "Torta ahogada", meaning: "Torta con salsa picante", example: "La torta ahogada estaba buenísima", region: "Guadalajara" },
      { word: "Huarache", meaning: "Tortilla alargada con frijoles y guiso", example: "Me dieron un huarache con nopales", region: "CDMX" },
      { word: "Chilaquiles", meaning: "Totopos bañados en salsa", example: "Desayuné chilaquiles verdes con pollo", region: "Todo México" },

      // ── Nivel 10 – Juegos de recreo (Juegos) ──────────────────────────────
      { word: "Encantados", meaning: "Juego de persecución en el patio", example: "Jugamos encantados en la primaria", region: "Infantil" },
      { word: "La vibora de la mar", meaning: "Juego tradicional en fiestas", example: "Cantamos en la víbora de la mar", region: "Tradicional" },
      { word: "La roña", meaning: "Juego de persecución", example: "Me atraparon en la roña", region: "Callejero" },
      { word: "Burro castigado", meaning: "Juego de resistencia física", example: "Saltamos en el burro castigado", region: "Escuela" },
      { word: "Dona Blanca", meaning: "Juego en ronda con canción", example: "Jugamos a Doña Blanca en la fiesta", region: "Infantil" },
      { word: "A las escondidas", meaning: "Juego de esconderse y buscar", example: "Nos escondimos jugando escondidas", region: "Todo México" },

      // ── Nivel 11 – Voces mexicanas (Música) ───────────────────────────────
      { word: "Pedro Infante", meaning: "Ícono de la música ranchera", example: "Escuchamos canciones de Pedro Infante", region: "Época de Oro" },
      { word: "Chavela Vargas", meaning: "Cantante reconocida de rancheras", example: "Chavela Vargas cantaba con sentimiento", region: "Tradicional" },
      { word: "Jose Alfredo Jimenez", meaning: "Compositor de rancheras", example: "José Alfredo escribió 'El Rey'", region: "Todo México" },
      { word: "Lila Downs", meaning: "Cantante contemporánea mexicana", example: "Lila Downs mezcla géneros en sus canciones", region: "Actual" },
      { word: "Juan Gabriel", meaning: "Cantante y compositor icónico", example: "Cantamos canciones de Juan Gabriel", region: "Todo México" },
      { word: "Vicente Fernandez", meaning: "Ícono de la música ranchera", example: "Vicente Fernández es 'El Charro de Huentitán'", region: "Jalisco" },

      // ── Nivel 12 – Fauna mexicana (Animales) ──────────────────────────────
      { word: "Ocelote", meaning: "Felino de tamaño mediano", example: "El ocelote vive en la selva", region: "Sur" },
      { word: "Tlacuache", meaning: "Marsupial mexicano", example: "Un tlacuache se metió en la casa", region: "CDMX" },
      { word: "Colibri", meaning: "Ave pequeña de rápido vuelo", example: "El colibrí revoloteaba en el jardín", region: "Todo México" },
      { word: "Murcielago magueyero", meaning: "Polinizador del agave", example: "El murciélago magueyero ayuda al tequila", region: "Agavero" },
      { word: "Iguana", meaning: "Reptil común en zonas cálidas", example: "La iguana tomó sol en la roca", region: "Costa" },
      { word: "Zorrillo", meaning: "Mamífero con glándulas de defensa", example: "El zorrillo espantó a todos", region: "Bosques" },

      // ── Nivel 13 – Muralismo mexicano (Artistas) ──────────────────────────
      { word: "Orozco", meaning: "Muralista mexicano", example: "Orozco pintó murales en Guadalajara", region: "Jalisco" },
      { word: "Siqueiros", meaning: "Muralista y político", example: "Siqueiros creó murales con temática social", region: "Nacional" },
      { word: "Rufino Tamayo", meaning: "Pintor de colores vibrantes", example: "Tamayo expuso en Nueva York", region: "Oaxaca" },
      { word: "Leonora Carrington", meaning: "Pintora surrealista", example: "Carrington influyó en el surrealismo mexicano", region: "CDMX" },
      { word: "Remedios Varo", meaning: "Artista surrealista", example: "Remedios Varo pintó mundos fantásticos", region: "CDMX" },
      { word: "Octavio Paz", meaning: "Poeta y Nobel mexicano", example: "Octavio Paz escribió 'El Laberinto de la Soledad'", region: "CDMX" },

      // ── Nivel 14 – Patrimonios UNESCO (Monumentos) ────────────────────────
      { word: "Monte Alban", meaning: "Zona arqueológica zapoteca", example: "Visitamos Monte Albán en Oaxaca", region: "Oaxaca" },
      { word: "Palenque", meaning: "Ciudad maya en Chiapas", example: "Palenque tiene templos impresionantes", region: "Chiapas" },
      { word: "Uxmal", meaning: "Zona arqueológica maya", example: "Uxmal es famosa por su pirámide del Adivino", region: "Yucatán" },
      { word: "Calakmul", meaning: "Gran ciudad maya", example: "Calakmul está en la selva", region: "Campeche" },
      { word: "Paquime", meaning: "Sitio arqueológico del norte", example: "Paquimé está en Chihuahua", region: "Chihuahua" },
      { word: "Mitla", meaning: "Zona arqueológica zapoteca", example: "Mitla es conocida por sus grecas", region: "Oaxaca" },

      // ── Nivel 15 – Revolución mexicana (Historia) ─────────────────────────
      { word: "Francisco I Madero", meaning: "Presidente revolucionario", example: "Madero inició la Revolución", region: "Nacional" },
      { word: "Venustiano Carranza", meaning: "Político y líder revolucionario", example: "Carranza promulgó la Constitución de 1917", region: "Coahuila" },
      { word: "Alvaro Obregon", meaning: "General revolucionario", example: "Obregón fue presidente tras la Revolución", region: "Sonora" },
      { word: "Lazaro Cardenas", meaning: "Presidente que expropió el petróleo", example: "Cárdenas nacionalizó el petróleo en 1938", region: "Michoacán" },
      { word: "Porfirio Diaz", meaning: "Dictador mexicano", example: "Porfirio Díaz gobernó más de 30 años", region: "Oaxaca" },
      { word: "Constitucion 1917", meaning: "Documento que rige a México", example: "La Constitución de 1917 se firmó en Querétaro", region: "Querétaro" },

      // ── Nivel 16 – Plantas mágicas (Plantas) ──────────────────────────────
      { word: "Agave", meaning: "Planta usada para tequila y mezcal", example: "El agave azul produce tequila", region: "Jalisco" },
      { word: "Flor de nochebuena", meaning: "Planta típica de Navidad", example: "La nochebuena decora en diciembre", region: "Nacional" },
      { word: "Flor de dalia", meaning: "Flor nacional de México", example: "La dalia es la flor nacional desde 1963", region: "CDMX" },
      { word: "Flor de cacao", meaning: "Base del chocolate", example: "El cacao era considerado sagrado", region: "Tabasco" },
      { word: "Flor de vainilla", meaning: "Orquídea mexicana", example: "La vainilla es originaria de Papantla", region: "Veracruz" },
      { word: "Flor de maguey", meaning: "Comestible y tradicional", example: "Las flores de maguey se guisan", region: "Hidalgo" },

      // ── Nivel 17 – Dulces mexicanos (Comida) ──────────────────────────────
      { word: "Alegria", meaning: "Dulce de amaranto con miel", example: "De niño me daban alegrías de amaranto", region: "CDMX" },
      { word: "Cocada", meaning: "Dulce de coco rallado con azúcar", example: "Compré cocadas en la feria", region: "Costeño" },
      { word: "Palanqueta", meaning: "Dulce de cacahuate con piloncillo", example: "La palanqueta es muy crocante", region: "Nacional" },
      { word: "Borrachito", meaning: "Dulce de Puebla con licor", example: "Probé un borrachito en Cholula", region: "Puebla" },
      { word: "Glorias", meaning: "Dulce de leche quemada", example: "Las glorias son típicas de Monterrey", region: "Norte" },
      { word: "Mazapan", meaning: "Dulce de cacahuate suave", example: "Se me rompió el mazapán sin romperlo", region: "Guadalajara" },

      // ── Nivel 18 – Juegos de cantos (Juegos) ──────────────────────────────
      { word: "La viborita de la mar", meaning: "Juego en ronda con canción", example: "Cantamos la viborita de la mar en la kermés", region: "Tradicional" },
      { word: "El patio de mi casa", meaning: "Juego con canto y rondas", example: "Jugamos al patio de mi casa en el recreo", region: "Infantil" },
      { word: "Las estatuas", meaning: "Juego de quedarse quieto", example: "Perdí porque me moví en estatuas", region: "Infantil" },
      { word: "El avioncito", meaning: "Juego de rayuela", example: "Saltamos el avioncito en el recreo", region: "Infantil" },
      { word: "Policias y ladrones", meaning: "Juego de persecución", example: "Jugamos policías y ladrones en la calle", region: "Juvenil" },

      // ── Nivel 19 – Rock mexicano (Música) ─────────────────────────────────
      { word: "Caifanes", meaning: "Banda de rock mexicana", example: "Caifanes tocaron La Negra Tomasa", region: "CDMX" },
      { word: "Mana", meaning: "Grupo de pop rock", example: "Escuchamos a Maná en los 90s", region: "Guadalajara" },
      { word: "Molotov", meaning: "Banda de rock alternativo", example: "Molotov critica con sus letras", region: "CDMX" },
      { word: "Cafe Tacuba", meaning: "Banda alternativa mexicana", example: "Café Tacuba mezcla géneros", region: "CDMX" },
      { word: "Zoe", meaning: "Banda de rock alternativo", example: "Zoé llenó el Auditorio Nacional", region: "CDMX" },
      { word: "El Tri", meaning: "Grupo de rock clásico mexicano", example: "El Tri canta 'Triste canción'", region: "CDMX" },

      // ── Nivel 20 – Insectos comestibles (Animales) ────────────────────────
      { word: "Escamoles", meaning: "Huevos de hormiga comestibles", example: "Los escamoles saben a nuez", region: "Hidalgo" },
      { word: "Chinicuiles", meaning: "Gusanos rojos del maguey", example: "Los chinicuiles se comen con tortillas", region: "Puebla" },
      { word: "Jumiles", meaning: "Insectos aromáticos comestibles", example: "Los jumiles se comen vivos en tacos", region: "Guerrero" },
      { word: "Hormiga chicatana", meaning: "Hormiga grande de temporada", example: "Las chicatanas se muelen en salsa", region: "Oaxaca" },
      { word: "Chapulin tostado", meaning: "Insecto tostado comestible", example: "Comimos chapulines en un taco", region: "Oaxaca" },
      { word: "Gusano de maguey", meaning: "Larva del maguey", example: "El mezcal lleva gusano de maguey", region: "Hidalgo" },

      // ── Nivel 21 – Cine mexicano (Artistas) ───────────────────────────────
      { word: "Cantinflas", meaning: "Actor cómico icónico", example: "Cantinflas fue el mimo de México", region: "CDMX" },
      { word: "Maria Felix", meaning: "Actriz de la Época de Oro", example: "María Félix fue 'La Doña'", region: "Sonora" },
      { word: "Pedro Armendariz", meaning: "Actor del cine clásico", example: "Armendáriz actuó en Hollywood", region: "CDMX" },
      { word: "Dolores del Rio", meaning: "Primera actriz mexicana en Hollywood", example: "Dolores del Río triunfó en EU", region: "Durango" },
      { word: "Jorge Negrete", meaning: "Actor y cantante mexicano", example: "Jorge Negrete fue charro en el cine", region: "CDMX" },
      { word: "Katy Jurado", meaning: "Actriz en Hollywood", example: "Katy Jurado ganó un Globo de Oro", region: "Guadalajara" },

      // ── Nivel 22 – Modernos de México (Monumentos) ────────────────────────
      { word: "Soumaya", meaning: "Museo moderno en CDMX", example: "El museo Soumaya tiene arte internacional", region: "CDMX" },
      { word: "Biblioteca Vasconcelos", meaning: "Biblioteca monumental", example: "La Biblioteca Vasconcelos es impresionante", region: "CDMX" },
      { word: "Estadio Azteca", meaning: "Estadio de fútbol icónico", example: "El Estadio Azteca albergó dos mundiales", region: "CDMX" },
      { word: "Monumento a la Revolucion", meaning: "Monumento a la Revolución Mexicana", example: "Subimos al mirador del Monumento", region: "CDMX" },
      { word: "Malecon de Mazatlan", meaning: "Paseo marítimo", example: "El malecón de Mazatlán es enorme", region: "Sinaloa" },
      { word: "Plaza de las Tres Culturas", meaning: "Plaza histórica de CDMX", example: "Visitamos la Plaza de las Tres Culturas", region: "CDMX" },
    ];

    // Remove any existing words with the same names (idempotent)
    const existingWords = await ctx.db.query("words").collect();
    const newNames = new Set(newWords.map(w => w.word.toLowerCase()));
    for (const w of existingWords) {
      if (newNames.has(w.word.toLowerCase())) {
        const lvl = await ctx.db
          .query("levels")
          .filter((q) => q.eq(q.field("wordId"), w._id))
          .first();
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(w._id);
      }
    }

    // Find next available level number
    const allLevels = await ctx.db.query("levels").collect();
    let nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    const inserted = [];
    for (const data of newWords) {
      const wordId = await ctx.db.insert("words", data);
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = 1 + Math.floor((nextLevel - 1) / 5);
      await ctx.db.insert("levels", { levelNumber: nextLevel, wordId, reward: { coins, diamonds } });
      inserted.push({ level: nextLevel, word: data.word });
      nextLevel++;
    }

    return { success: true, total: inserted.length, inserted };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Seed levels 23–31.
// Run: npx convex run words:seedLevels23to31   (from MexicanarioApp-main)
// ─────────────────────────────────────────────────────────────────────────────
export const seedLevels23to31 = mutation({
  args: {},
  handler: async (ctx) => {
    const newWords = [
      // ── Nivel 23 – México antiguo (Historia) ───────────────────────────────
      { word: "Olmecas", meaning: "Primera gran civilización mesoamericana", example: "Los olmecas tallaron cabezas colosales", region: "Veracruz" },
      { word: "Mayas", meaning: "Civilización mesoamericana", example: "Los mayas construyeron Chichén Itzá", region: "Yucatán" },
      { word: "Mexicas", meaning: "Pueblo fundador de Tenochtitlán", example: "Los mexicas fundaron CDMX", region: "CDMX" },
      { word: "Zapotecas", meaning: "Civilización en Oaxaca", example: "Los zapotecas construyeron Monte Albán", region: "Oaxaca" },
      { word: "Mixtecos", meaning: "Pueblo originario del sur", example: "Los mixtecos pintaron códices", region: "Oaxaca" },
      { word: "Toltecas", meaning: "Pueblo mesoamericano", example: "Los toltecas habitaron Tula", region: "Hidalgo" },

      // ── Nivel 24 – Hierbas mexicanas (Plantas) ─────────────────────────────
      { word: "Epazote", meaning: "Hierba usada en frijoles", example: "El epazote evita gases en los frijoles", region: "Nacional" },
      { word: "Cilantro", meaning: "Hierba aromática", example: "El cilantro da sabor a los tacos", region: "Nacional" },
      { word: "Hierba santa", meaning: "Planta usada en moles", example: "La hierba santa va en los tamales", region: "Oaxaca" },
      { word: "Achiote", meaning: "Semilla usada en adobos", example: "El achiote tiñe la cochinita pibil", region: "Yucatán" },
      { word: "Oregano mexicano", meaning: "Condimento tradicional", example: "El orégano va en la pizza y caldos", region: "Nacional" },
      { word: "Manzanilla", meaning: "Planta medicinal", example: "El té de manzanilla calma el estómago", region: "Todo México" },

      // ── Nivel 25 – Platillos del norte (Comida) ────────────────────────────
      { word: "Cabrito", meaning: "Carne de cabrito asado", example: "Comimos cabrito en Monterrey", region: "Norte" },
      { word: "Machaca", meaning: "Carne seca deshebrada", example: "Desayunamos machaca con huevo", region: "Norte" },
      { word: "Discada", meaning: "Mezcla de carnes cocinadas en disco", example: "Prepararon una discada en la reunión", region: "Norte" },
      { word: "Asado de puerco", meaning: "Guiso de cerdo en chile rojo", example: "El asado de puerco estaba picoso", region: "Coahuila" },
      { word: "Menudo norteno", meaning: "Sopa de pancita con chile rojo", example: "El menudo es para la cruda", region: "Norte" },
      { word: "Gorditas", meaning: "Tortillas rellenas de guisos", example: "Comimos gorditas de chicharrón", region: "Norte" },

      // ── Nivel 26 – Platillos del sur (Comida) ─────────────────────────────
      { word: "Cochinita pibil", meaning: "Carne de cerdo adobada con achiote", example: "Comimos cochinita pibil en tacos", region: "Yucatán" },
      { word: "Panucho", meaning: "Tortilla con frijol y carne", example: "El panucho se acompaña con cebolla morada", region: "Yucatán" },
      { word: "Salbute", meaning: "Tortilla inflada frita", example: "Los salbutes se sirven con lechuga y pollo", region: "Yucatán" },
      { word: "Tamales chiapanecos", meaning: "Tamales grandes envueltos en hoja de plátano", example: "Probamos tamales chiapanecos", region: "Chiapas" },
      { word: "Pescado a la talla", meaning: "Pescado adobado y asado", example: "En Acapulco comimos pescado a la talla", region: "Guerrero" },
      { word: "Mole negro", meaning: "Mole típico de Oaxaca", example: "El mole negro es fuerte y especiado", region: "Oaxaca" },

      // ── Nivel 27 – Juegos modernos (Juegos) ───────────────────────────────
      { word: "Futbolito", meaning: "Juego de mesa con muñecos", example: "Jugamos futbolito en el recreo", region: "Todo México" },
      { word: "Domino", meaning: "Juego de fichas con puntos", example: "Armamos una partida de dominó", region: "Todo México" },
      { word: "Ajedrez", meaning: "Juego de estrategia con piezas", example: "Ganamos en ajedrez en la escuela", region: "Todo México" },
      { word: "Jenga", meaning: "Juego de bloques apilados", example: "La torre de jenga se cayó", region: "Juvenil" },
      { word: "UNO", meaning: "Juego de cartas popular", example: "Gané con un +4 en UNO", region: "Juvenil" },
      { word: "Loteria moderna", meaning: "Versión digital de la lotería mexicana", example: "Jugamos lotería en el celular", region: "Nacional" },

      // ── Nivel 28 – Música contemporánea (Música) ──────────────────────────
      { word: "Natalia Lafourcade", meaning: "Cantautora mexicana", example: "Natalia Lafourcade canta baladas y folk", region: "Veracruz" },
      { word: "Julieta Venegas", meaning: "Cantante pop-rock mexicana", example: "Julieta Venegas toca el acordeón", region: "Tijuana" },
      { word: "Carlos Rivera", meaning: "Cantante pop contemporáneo", example: "Carlos Rivera interpretó 'Recuérdame'", region: "Hidalgo" },
      { word: "Danna Paola", meaning: "Cantante pop mexicana", example: "Danna Paola es también actriz", region: "CDMX" },
      { word: "Christian Nodal", meaning: "Cantante de regional mexicano", example: "Nodal canta 'Adiós amor'", region: "Sonora" },
      { word: "Belinda", meaning: "Cantante pop", example: "Belinda es famosa desde niña", region: "CDMX" },

      // ── Nivel 29 – Animales de desierto (Animales) ────────────────────────
      { word: "Puma", meaning: "Felino adaptable al desierto", example: "El puma vive en el norte de México", region: "Norte" },
      { word: "Condor", meaning: "Ave de gran envergadura", example: "El cóndor vuela en las montañas", region: "Norte" },
      { word: "Coyote", meaning: "Canino salvaje del desierto", example: "El coyote aulló en la noche", region: "Norte" },
      { word: "Halcon peregrino", meaning: "Ave cazadora", example: "El halcón cazó en el aire", region: "Todo México" },
      { word: "Zorra del desierto", meaning: "Mamífero pequeño", example: "La zorra del desierto es escurridiza", region: "Norte" },
      { word: "Berrendo", meaning: "Antílope del desierto", example: "El berrendo corre rápido", region: "Norte" },

      // ── Nivel 30 – Escritores mexicanos (Artistas) ────────────────────────
      { word: "Juan Rulfo", meaning: "Novelista y cuentista", example: "Juan Rulfo escribió 'Pedro Páramo'", region: "Jalisco" },
      { word: "Rosario Castellanos", meaning: "Poeta y ensayista", example: "Rosario Castellanos escribió sobre mujeres indígenas", region: "Chiapas" },
      { word: "Carlos Fuentes", meaning: "Novelista contemporáneo", example: "Carlos Fuentes escribió 'La muerte de Artemio Cruz'", region: "CDMX" },
      { word: "Elena Poniatowska", meaning: "Periodista y escritora", example: "Poniatowska escribió 'La noche de Tlatelolco'", region: "CDMX" },
      { word: "Jose Emilio Pacheco", meaning: "Poeta y ensayista", example: "José Emilio Pacheco escribió 'Las batallas en el desierto'", region: "CDMX" },
      { word: "Guadalupe Nettel", meaning: "Escritora contemporánea", example: "Guadalupe Nettel ganó premios internacionales", region: "CDMX" },

      // ── Nivel 31 – Ciudades coloniales (Monumentos) ───────────────────────
      { word: "Guanajuato", meaning: "Ciudad colonial con túneles", example: "Guanajuato tiene momias famosas", region: "Guanajuato" },
      { word: "San Miguel de Allende", meaning: "Ciudad patrimonio cultural", example: "San Miguel es destino turístico", region: "Guanajuato" },
      { word: "Puebla", meaning: "Ciudad con arquitectura colonial", example: "Puebla tiene la Capilla del Rosario", region: "Puebla" },
      { word: "Queretaro", meaning: "Ciudad con acueducto colonial", example: "Querétaro tiene el Acueducto", region: "Querétaro" },
      { word: "Zacatecas", meaning: "Ciudad minera colonial", example: "Zacatecas tiene un teleférico", region: "Zacatecas" },
      { word: "Morelia", meaning: "Ciudad colonial con catedral", example: "Morelia es patrimonio mundial", region: "Michoacán" },
    ];

    // Remove duplicates (idempotent)
    const existingWords = await ctx.db.query("words").collect();
    const newNames = new Set(newWords.map(w => w.word.toLowerCase()));
    for (const w of existingWords) {
      if (newNames.has(w.word.toLowerCase())) {
        const lvl = await ctx.db
          .query("levels")
          .filter((q) => q.eq(q.field("wordId"), w._id))
          .first();
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(w._id);
      }
    }

    // Find next available level number
    const allLevels = await ctx.db.query("levels").collect();
    let nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    const inserted = [];
    for (const data of newWords) {
      const wordId = await ctx.db.insert("words", data);
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = 1 + Math.floor((nextLevel - 1) / 5);
      await ctx.db.insert("levels", { levelNumber: nextLevel, wordId, reward: { coins, diamonds } });
      inserted.push({ level: nextLevel, word: data.word });
      nextLevel++;
    }

    return { success: true, total: inserted.length, inserted };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Seed levels 52–56.
// Run once: npx convex run words:seedLevels52to56   (from MexicanarioApp-main)
// ─────────────────────────────────────────────────────────────────────────────
export const seedLevels52to56 = mutation({
  args: {},
  handler: async (ctx) => {
    const newWords = [
      // ── Nivel 52 – Instrumentos mexicanos (Música) ────────────────────────
      { word: "Guitarron",      meaning: "Bajo acústico del mariachi",                  example: "El guitarrón le da el ritmo grave al mariachi",      region: "Jalisco"      },
      { word: "Vihuela",        meaning: "Guitarra pequeña de 5 cuerdas del mariachi",  example: "La vihuela marca el ritmo en el mariachi",           region: "Jalisco"      },
      { word: "Arpa jarocha",   meaning: "Arpa del son jarocho veracruzano",            example: "El arpa jarocha suena en La Bamba",                  region: "Veracruz"     },
      { word: "Marimba",        meaning: "Instrumento de percusión del sureste",        example: "La marimba alegra las fiestas de Chiapas",           region: "Chiapas-Oax." },
      { word: "Tambora",        meaning: "Tambor grande de la banda sinaloense",        example: "La tambora retumba en la banda norteña",             region: "Sinaloa"      },
      { word: "Requinto",       meaning: "Guitarra pequeña del trío romántico",         example: "El requinto suena en los tríos como Los Panchos",    region: "Nacional"     },

      // ── Nivel 53 – Santos y devoción (Religión) ───────────────────────────
      { word: "Virgen de Guadalupe", meaning: "Patrona de México venerada el 12 de diciembre", example: "Millones van a la Basílica el 12 de diciembre", region: "Nacional"   },
      { word: "San Judas Tadeo",     meaning: "Santo de las causas difíciles e imposibles",     example: "Los jóvenes llevan imágenes de San Judas",     region: "CDMX"       },
      { word: "La Santa Muerte",     meaning: "Figura de devoción popular mexicana",            example: "La Santa Muerte tiene altares en todo México", region: "CDMX"       },
      { word: "Cristo Rey",          meaning: "Celebración en el Cerro del Cubilete",           example: "Miles peregrinan a Cristo Rey en Guanajuato",  region: "Guanajuato" },
      { word: "San Miguel Arcangel", meaning: "Arcángel patrono de muchos pueblos",             example: "San Miguel Arcángel es patrono de Michoacán",  region: "Nacional"   },
      { word: "Nino Dios",           meaning: "Figura del niño Jesús en los nacimientos",       example: "El Niño Dios se viste el 24 de diciembre",     region: "Nacional"   },

      // ── Nivel 54 – Héroes nacionales (Historia) ───────────────────────────
      { word: "Benito Juarez",          meaning: "Presidente indígena y gran reformador",          example: "Benito Juárez dijo 'El respeto al derecho ajeno'",  region: "Oaxaca"      },
      { word: "Miguel Hidalgo",         meaning: "Padre de la Independencia de México",            example: "Hidalgo tocó la campana el 16 de septiembre",       region: "Guanajuato"  },
      { word: "Emiliano Zapata",        meaning: "Líder agrario de la Revolución Mexicana",        example: "Zapata gritó '¡Tierra y Libertad!'",                region: "Morelos"     },
      { word: "Sor Juana Ines",         meaning: "Poetisa y monja del Virreinato de México",       example: "Sor Juana Inés fue la primera gran escritora",       region: "CDMX"        },
      { word: "Josefa Ortiz",           meaning: "La Corregidora que avisó del plan de Independencia", example: "La Corregidora arriesgó su vida por México",  region: "Querétaro"   },
      { word: "Jose Maria Morelos",     meaning: "Héroe de la Independencia mexicana",             example: "Morelos fue fusilado en 1815 por la Independencia",  region: "Michoacán"   },

      // ── Nivel 55 – Cine mexicano moderno (Artistas) ───────────────────────
      { word: "Amores Perros",      meaning: "Película mexicana de Alejandro González Iñárritu",  example: "Amores Perros fue premiada en Cannes",             region: "CDMX"    },
      { word: "Y tu mama tambien",  meaning: "Película de Alfonso Cuarón con Bernal y Toledo",   example: "Y tu mamá también fue un fenómeno cultural",       region: "Nacional" },
      { word: "Roma",               meaning: "Película de Alfonso Cuarón ganadora del Oscar",    example: "Roma ganó 3 premios Oscar en 2019",               region: "CDMX"    },
      { word: "Guillermo del Toro", meaning: "Director mexicano de El laberinto del Fauno",      example: "Guillermo del Toro ganó el Oscar por La Forma del Agua", region: "Jalisco" },
      { word: "Inarritu",           meaning: "Director de Birdman y The Revenant",               example: "Iñárritu ganó el Oscar dos años seguidos",         region: "CDMX"    },
      { word: "Alfonso Cuaron",     meaning: "Director mexicano ganador del Oscar",              example: "Alfonso Cuarón dirigió Harry Potter y el prisionero", region: "CDMX"  },

      // ── Nivel 56 – Ropa y accesorios tradicionales (Arte popular) ─────────
      { word: "Sombrero charro",  meaning: "Sombrero ancho del mariachi y charro",      example: "El sombrero charro va bordado en plata",             region: "Jalisco"  },
      { word: "China poblana",    meaning: "Traje femenino típico de Puebla",           example: "La china poblana lleva falda bordada y blusa blanca", region: "Puebla"   },
      { word: "Traje de charro",  meaning: "Vestimenta del charro mexicano",            example: "El traje de charro tiene bordados en plata",         region: "Jalisco"  },
      { word: "Sarape",           meaning: "Manta de lana rayada y muy colorida",       example: "El sarape de Saltillo es el más famoso",             region: "Coahuila" },
      { word: "Quechquemitl",     meaning: "Prenda triangular de comunidades indígenas",example: "El quechquémitl se usa en Hidalgo y Puebla",         region: "Centro"   },
      { word: "Jorongo",          meaning: "Poncho de lana con rayas de colores",       example: "El jorongo abriga en las noches frías del campo",    region: "Nacional" },
    ];

    // Remove duplicates (idempotent)
    const existingWords = await ctx.db.query("words").collect();
    const newNames = new Set(newWords.map(w => w.word.toLowerCase()));
    for (const w of existingWords) {
      if (newNames.has(w.word.toLowerCase())) {
        const lvl = await ctx.db
          .query("levels")
          .filter((q) => q.eq(q.field("wordId"), w._id))
          .first();
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(w._id);
      }
    }

    // Find next available level number
    const allLevels = await ctx.db.query("levels").collect();
    let nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    const inserted = [];
    for (const data of newWords) {
      const wordId = await ctx.db.insert("words", data);
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = 1 + Math.floor((nextLevel - 1) / 5);
      await ctx.db.insert("levels", { levelNumber: nextLevel, wordId, reward: { coins, diamonds } });
      inserted.push({ level: nextLevel, word: data.word });
      nextLevel++;
    }

    return { success: true, total: inserted.length, inserted };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Seed levels 47–51.
// Run once: npx convex run words:seedLevels47to51   (from MexicanarioApp-main)
// ─────────────────────────────────────────────────────────────────────────────
export const seedLevels47to51 = mutation({
  args: {},
  handler: async (ctx) => {
    const newWords = [
      // ── Nivel 47 – Antojitos de feria (Comida) ────────────────────────────
      { word: "Elote asado",        meaning: "Maíz asado con mayonesa, queso y chile",      example: "En la feria comí un elote asado con todo",           region: "Todo México"  },
      { word: "Churro",             meaning: "Masa frita con azúcar y canela",               example: "Los churros del parque siempre están calientitos",   region: "Nacional"     },
      { word: "Algodon de azucar",  meaning: "Dulce esponjoso de azúcar hilada",             example: "El algodón de azúcar se deshace en la boca",         region: "Ferias"       },
      { word: "Nieve de garrafa",   meaning: "Helado artesanal servido en vasito",           example: "Pedí nieve de garrafa de limón con chile",           region: "Todo México"  },
      { word: "Pepino con chile",   meaning: "Pepino fresco con limón, sal y chile piquín", example: "El pepino con chile es el snack de las tardes",       region: "Nacional"     },
      { word: "Raspado",            meaning: "Hielo raspado con jarabe de sabores y fruta",  example: "El raspado de tamarindo estaba buenísimo",           region: "Todo México"  },

      // ── Nivel 48 – Cómics mexicanos (Entretenimiento) ─────────────────────
      { word: "Kaliman",       meaning: "Superhéroe mexicano con turbante blanco",        example: "Kalimán usaba su inteligencia más que la fuerza",    region: "Nacional"     },
      { word: "Memin Pinguin", meaning: "Personaje cómico querido por generaciones",      example: "Memín Pinguín apareció en los años 40",              region: "CDMX"         },
      { word: "La Familia Burron", meaning: "Cómic de vecindad más popular de México",   example: "La Familia Burrón retrataba la vida popular",        region: "Nacional"     },
      { word: "El Payo",       meaning: "Vaquero justiciero del cómic mexicano",          example: "El Payo defendía a los humildes del rancho",         region: "Norte"        },
      { word: "Fantomas",      meaning: "Antihéroe ladrón de cómic mexicano",             example: "Fantomas robaba a los ricos con elegancia",          region: "Nacional"     },
      { word: "Chanoc",        meaning: "Aventurero pescador del cómic mexicano",         example: "Chanoc luchaba contra tiburones en el mar",          region: "Veracruz"     },

      // ── Nivel 49 – Remedios de abuela (Tradición) ─────────────────────────
      { word: "Vicks VapoRub",   meaning: "Ungüento para la tos y el catarro",             example: "La abuela me untó Vicks en el pecho para la gripa",  region: "Nacional"     },
      { word: "Agua de tila",    meaning: "Té relajante para los nervios",                 example: "Tómate un agua de tila para los nervios",            region: "Todo México"  },
      { word: "Sábila",          meaning: "Planta para quemaduras y piel",                 example: "Me puse sábila en la quemadura del sol",             region: "Todo México"  },
      { word: "Limón con sal",   meaning: "Remedio para dolor de garganta o cruda",        example: "Tómate un limón con sal para la cruda",              region: "Nacional"     },
      { word: "Gordolobo",       meaning: "Hierba tradicional para la tos",                example: "El té de gordolobo quita la tos",                    region: "Centro-Norte" },
      { word: "Ruda",            meaning: "Planta usada contra el mal de ojo",             example: "La abuela pasaba la ruda para quitar el mal de ojo", region: "Nacional"     },

      // ── Nivel 50 – Refranes mexicanos (Lenguaje) ──────────────────────────
      { word: "Al que madruga",        meaning: "Refrán sobre el esfuerzo temprano",       example: "Al que madruga, Dios lo ayuda, dijo mi mamá",        region: "Todo México"  },
      { word: "Camarón que se duerme", meaning: "Refrán sobre estar siempre alerta",       example: "Camarón que se duerme, se lo lleva la corriente",    region: "Nacional"     },
      { word: "El que con lobos anda", meaning: "Refrán sobre las malas compañías",        example: "El que con lobos anda, a aullar se enseña",          region: "Nacional"     },
      { word: "Más vale tarde",        meaning: "Refrán sobre que no es tarde para nada",  example: "Más vale tarde que nunca, ¿verdad?",                 region: "Todo México"  },
      { word: "En boca cerrada",       meaning: "Refrán sobre saber callar",               example: "En boca cerrada no entran moscas",                   region: "Nacional"     },
      { word: "No hay mal que dure",   meaning: "Refrán de esperanza ante las dificultades",example: "No hay mal que dure cien años ni cuerpo que lo aguante", region: "Nacional" },

      // ── Nivel 51 – Festivales y ferias (Cultura) ──────────────────────────
      { word: "Guelaguetza",         meaning: "Festival de danzas indígenas en Oaxaca",      example: "La Guelaguetza reúne a comunidades de todo Oaxaca",   region: "Oaxaca"      },
      { word: "Festival Cervantino", meaning: "Festival cultural internacional en Guanajuato",example: "El Festival Cervantino trae artistas del mundo",      region: "Guanajuato"  },
      { word: "Feria de San Marcos", meaning: "La feria más importante de México",           example: "La Feria de San Marcos dura un mes entero",          region: "Aguascalientes" },
      { word: "Carnaval de Veracruz",meaning: "El carnaval más grande y famoso de México",  example: "El Carnaval de Veracruz llena el malecón de música",  region: "Veracruz"    },
      { word: "Dia de Guadalupe",    meaning: "Celebración del 12 de diciembre a la Virgen", example: "Millones peregrinan el 12 de diciembre a la Basílica",region: "Nacional"    },
      { word: "Semana Santa",        meaning: "Semana de Cuaresma con procesiones y tradiciones",example: "En Semana Santa íbamos a la playa o a misa",      region: "Todo México" },
    ];

    // Remove duplicates (idempotent)
    const existingWords = await ctx.db.query("words").collect();
    const newNames = new Set(newWords.map(w => w.word.toLowerCase()));
    for (const w of existingWords) {
      if (newNames.has(w.word.toLowerCase())) {
        const lvl = await ctx.db
          .query("levels")
          .filter((q) => q.eq(q.field("wordId"), w._id))
          .first();
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(w._id);
      }
    }

    // Find next available level number
    const allLevels = await ctx.db.query("levels").collect();
    let nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    const inserted = [];
    for (const data of newWords) {
      const wordId = await ctx.db.insert("words", data);
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = 1 + Math.floor((nextLevel - 1) / 5);
      await ctx.db.insert("levels", { levelNumber: nextLevel, wordId, reward: { coins, diamonds } });
      inserted.push({ level: nextLevel, word: data.word });
      nextLevel++;
    }

    return { success: true, total: inserted.length, inserted };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Seed levels 42–46.
// Run once: npx convex run words:seedLevels42to46   (from MexicanarioApp-main)
// ─────────────────────────────────────────────────────────────────────────────
export const seedLevels42to46 = mutation({
  args: {},
  handler: async (ctx) => {
    const newWords = [
      // ── Nivel 42 – Chiles de México (Comida) ──────────────────────────────
      { word: "Chile habanero",  meaning: "Chile muy picoso del sureste",              example: "El chile habanero me hizo llorar de lo picoso",   region: "Yucatán"     },
      { word: "Chile serrano",   meaning: "Chile verde delgado y picante",             example: "La salsa de chile serrano acompaña todo",        region: "Todo México" },
      { word: "Chile poblano",   meaning: "Chile grande para rajas o rellenos",        example: "Las rajas de chile poblano van con crema",       region: "Puebla"      },
      { word: "Chile chipotle",  meaning: "Chile jalapeño ahumado en adobo",           example: "La salsa chipotle le da sabor ahumado al taco",  region: "Nacional"    },
      { word: "Chile de arbol",  meaning: "Chile rojo seco y muy picante",             example: "La salsa de chile de árbol pica bastante",       region: "Todo México" },
      { word: "Chile ancho",     meaning: "Chile mulato seco de sabor dulzón",         example: "El chile ancho va en moles y adobos",            region: "Nacional"    },

      // ── Nivel 43 – Telenovelas icónicas (Entretenimiento) ─────────────────
      { word: "Rosa Salvaje",              meaning: "Telenovela de Verónica Castro de los 80s",    example: "Rosa Salvaje fue la telenovela del año",         region: "Nacional"    },
      { word: "Cuna de lobos",             meaning: "Telenovela de suspenso de los 80s",           example: "Catalina Creel con su parche fue icónica",       region: "Nacional"    },
      { word: "Los ricos también lloran",  meaning: "Telenovela exportada al mundo entero",        example: "Los ricos también lloran se vio en Rusia",       region: "Nacional"    },
      { word: "La usurpadora",             meaning: "Telenovela de gemelas con Gabriela Spanic",  example: "La usurpadora tenía a dos gemelas idénticas",    region: "Nacional"    },
      { word: "Thalia",                    meaning: "Actriz y cantante icónica de telenovelas",   example: "Thalía actuó en María la del Barrio",            region: "CDMX"        },
      { word: "Veronica Castro",           meaning: "Actriz de la Época Dorada de telenovelas",  example: "Verónica Castro fue la Rosa Salvaje",            region: "CDMX"        },

      // ── Nivel 44 – Grupero y tropical (Música) ────────────────────────────
      { word: "Los Bukis",          meaning: "Grupo emblemático de Marco Antonio Solís",   example: "Los Bukis llenaron el estadio Azteca",         region: "Michoacán"   },
      { word: "Bronco",             meaning: "Grupo norteño que pegó en toda América",     example: "Bronco cantó Que no quede huella",             region: "Nuevo León"  },
      { word: "Los Angeles Azules", meaning: "Cumbia del DF que conquistó el mundo",      example: "Los Ángeles Azules tocaron en el Zócalo",      region: "CDMX"        },
      { word: "Los Yonics",         meaning: "Grupo romántico de los 80 y 90",            example: "Los Yonics sonaban en cada fiesta de quince",  region: "Guadalajara" },
      { word: "Selena",             meaning: "Reina del tex-mex adorada en México",       example: "Selena vendió millones de discos en México",   region: "Frontera"    },
      { word: "Jenni Rivera",       meaning: "La diva de la banda sinaloense",            example: "Jenni Rivera es leyenda del regional mexicano",region: "Sinaloa"     },

      // ── Nivel 45 – La escuela mexicana (Nostalgia escolar) ────────────────
      { word: "Cuaderno Scribe",   meaning: "El cuaderno rayado más famoso de México",         example: "Forré mi cuaderno Scribe con papel contact",       region: "Todo México" },
      { word: "Recreo escolar",    meaning: "El descanso más esperado del día en la escuela",  example: "En el recreo jugábamos y comprábamos en la coope", region: "Nacional"    },
      { word: "Cooperativa",       meaning: "Tienda de la escuela donde comprabas en recreo",  example: "En la cooperativa vendían tortas y paletas",       region: "Nacional"    },
      { word: "Conaliteg",         meaning: "Los libros de texto gratuitos de la SEP",         example: "El Conaliteg nos daban gratis al inicio del año",  region: "Nacional"    },
      { word: "Lonchera",          meaning: "Recipiente para llevar el almuerzo a la escuela", example: "Mi lonchera tenía sándwich y jugo",               region: "Escolar"     },
      { word: "Escolta",           meaning: "Grupo de alumnos que porta la bandera",           example: "Ser parte de la escolta era un honor",            region: "Nacional"    },

      // ── Nivel 46 – Transporte popular (Cultura urbana) ────────────────────
      { word: "Pesero",     meaning: "Microbús de transporte urbano en CDMX",       example: "El pesero siempre va lleno a reventar",         region: "CDMX"        },
      { word: "Metro CDMX", meaning: "Sistema de transporte subterráneo de la capital", example: "El metro es la forma más rápida de cruzar el DF",region: "CDMX"     },
      { word: "Mototaxi",   meaning: "Taxi de tres ruedas muy popular en pueblos",  example: "El mototaxi me dejó en la puerta de la casa",   region: "Sur-Centro"  },
      { word: "Combi",      meaning: "Furgoneta de transporte colectivo",           example: "La combi se llenó en el mercado",               region: "Todo México" },
      { word: "Bicitaxi",   meaning: "Bicicleta con carrito para pasajeros",       example: "El bicitaxi me cobró diez pesos",               region: "Centro"      },
      { word: "Trolebus",   meaning: "Autobús eléctrico clásico de CDMX",          example: "El trolebús recorre Eje Central desde hace décadas", region: "CDMX"   },
    ];

    // Remove duplicates (idempotent)
    const existingWords = await ctx.db.query("words").collect();
    const newNames = new Set(newWords.map(w => w.word.toLowerCase()));
    for (const w of existingWords) {
      if (newNames.has(w.word.toLowerCase())) {
        const lvl = await ctx.db
          .query("levels")
          .filter((q) => q.eq(q.field("wordId"), w._id))
          .first();
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(w._id);
      }
    }

    // Find next available level number
    const allLevels = await ctx.db.query("levels").collect();
    let nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    const inserted = [];
    for (const data of newWords) {
      const wordId = await ctx.db.insert("words", data);
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = 1 + Math.floor((nextLevel - 1) / 5);
      await ctx.db.insert("levels", { levelNumber: nextLevel, wordId, reward: { coins, diamonds } });
      inserted.push({ level: nextLevel, word: data.word });
      nextLevel++;
    }

    return { success: true, total: inserted.length, inserted };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Seed levels 37–41.
// Run once: npx convex run words:seedLevels37to41   (from MexicanarioApp-main)
// ─────────────────────────────────────────────────────────────────────────────
export const seedLevels37to41 = mutation({
  args: {},
  handler: async (ctx) => {
    const newWords = [
      // ── Nivel 37 – Fiestas y tradiciones (Tradiciones) ────────────────────
      { word: "Piñata",               meaning: "Figura de cartón rellena de dulces y fruta",       example: "Dale dale dale a la piñata en la posada",             region: "Todo México"  },
      { word: "Quinceañera",          meaning: "Celebración de los 15 años de una chica",          example: "La quinceañera bailó el vals con su chambelán",        region: "Nacional"     },
      { word: "Posada navideña",      meaning: "Festejo de 9 noches antes de Navidad",             example: "En la posada cantamos y rompimos la piñata",           region: "Todo México"  },
      { word: "Grito de Independencia", meaning: "Celebración del 15 de septiembre",              example: "El presidente dio el Grito desde el Zócalo",           region: "Nacional"     },
      { word: "Kermes",               meaning: "Feria escolar con juegos, comida y rifas",         example: "En la kermes de la escuela gané un juguete",           region: "Infantil"     },
      { word: "Altar de muertos",     meaning: "Ofrenda con fotos, flores y comida del difunto",  example: "Pusimos el altar de muertos con la foto del abuelo",   region: "Nacional"     },

      // ── Nivel 38 – Bebidas tradicionales (Bebidas) ────────────────────────
      { word: "Horchata",        meaning: "Bebida fría de arroz con canela",              example: "Pedí una horchata bien fría en la taquería",         region: "Todo México"  },
      { word: "Agua de jamaica", meaning: "Agua fresca de flor de jamaica",               example: "El agua de jamaica estaba bien ácida",               region: "Nacional"     },
      { word: "Tepache",         meaning: "Bebida fermentada de piña con piloncillo",     example: "El tepache se vende en los mercados",                region: "CDMX"         },
      { word: "Tejuino",         meaning: "Bebida de maíz fermentado con limón y sal",   example: "El tejuino con nieve de limón está buenísimo",       region: "Jalisco"      },
      { word: "Pulque",          meaning: "Bebida fermentada del agave",                 example: "Tomamos pulque en una pulquería del centro",         region: "Hidalgo-CDMX" },
      { word: "Michelada",       meaning: "Cerveza con jugo de limón, sal y chile",      example: "La michelada es perfecta para el calor",             region: "Todo México"  },

      // ── Nivel 39 – Deporte mexicano (Deporte) ─────────────────────────────
      { word: "Charreria",          meaning: "Deporte ecuestre nacional de México",         example: "La charrería es el deporte nacional oficial",        region: "Jalisco"  },
      { word: "Julio Cesar Chavez", meaning: "Campeón mundial de box mexicano",             example: "Julio César Chávez ganó 3 títulos mundiales",        region: "Sinaloa"  },
      { word: "Hugo Sanchez",       meaning: "Futbolista mexicano considerado el mejor",    example: "Hugo Sánchez metió un golazo de chilena en el Real", region: "CDMX"     },
      { word: "Pelota mixteca",     meaning: "Deporte prehispánico de pelota sin manos",   example: "La pelota mixteca se juega en Oaxaca todavía",      region: "Oaxaca"   },
      { word: "Beisbol norteno",    meaning: "Deporte muy popular en el norte de México",  example: "En Sonora el béisbol es más popular que el fútbol",  region: "Norte"    },
      { word: "Ana Guevara",        meaning: "Velocista y medallista olímpica mexicana",   example: "Ana Guevara ganó plata olímpica en Atenas 2004",    region: "Sonora"   },

      // ── Nivel 40 – Lugares y barrios icónicos (Cultura urbana) ────────────
      { word: "Tianguis",   meaning: "Mercado ambulante semanal tradicional",        example: "Fuimos al tianguis del domingo a comprar ropa",   region: "Todo México" },
      { word: "Xochimilco", meaning: "Canales de trajineras en CDMX",               example: "Rentamos una trajinera en Xochimilco",            region: "CDMX"        },
      { word: "Garibaldi",  meaning: "Plaza donde van los mariachis de CDMX",       example: "Le llevamos serenata con mariachi de Garibaldi",  region: "CDMX"        },
      { word: "El Zocalo",  meaning: "Plaza principal y corazón de México",         example: "El Zócalo se llena el 15 de septiembre",          region: "CDMX"        },
      { word: "Tepito",     meaning: "Barrio bravo y mercado popular de CDMX",      example: "En Tepito encuentras de todo",                    region: "CDMX"        },
      { word: "La Merced",  meaning: "Mercado enorme y tradicional del centro",     example: "Compramos frutas y verduras en La Merced",        region: "CDMX"        },

      // ── Nivel 41 – Cocina de abuela (Comida nostálgica) ───────────────────
      { word: "Sopa de fideos",    meaning: "Sopa frita con jitomate y caldo",              example: "La sopa de fideos de la abuela es la mejor",      region: "Todo México" },
      { word: "Arroz rojo",        meaning: "Arroz frito con jitomate y ajo",               example: "El arroz rojo acompañó los frijoles",             region: "Nacional"    },
      { word: "Frijoles de olla",  meaning: "Frijoles cocidos a fuego lento con epazote",  example: "Los frijoles de olla huelen desde la calle",      region: "Todo México" },
      { word: "Caldo de pollo",    meaning: "Caldo reconfortante con verduras y pollo",    example: "Cuando estaba enfermo me daban caldo de pollo",   region: "Nacional"    },
      { word: "Enchiladas verdes", meaning: "Tortillas bañadas en salsa verde con pollo",  example: "Las enchiladas verdes son domingo en casa",       region: "Todo México" },
      { word: "Chiles en nogada",  meaning: "Platillo tricolor símbolo de Independencia",  example: "Los chiles en nogada se comen en septiembre",     region: "Puebla"      },
    ];

    // Remove duplicates (idempotent)
    const existingWords = await ctx.db.query("words").collect();
    const newNames = new Set(newWords.map(w => w.word.toLowerCase()));
    for (const w of existingWords) {
      if (newNames.has(w.word.toLowerCase())) {
        const lvl = await ctx.db
          .query("levels")
          .filter((q) => q.eq(q.field("wordId"), w._id))
          .first();
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(w._id);
      }
    }

    // Find next available level number
    const allLevels = await ctx.db.query("levels").collect();
    let nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    const inserted = [];
    for (const data of newWords) {
      const wordId = await ctx.db.insert("words", data);
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = 1 + Math.floor((nextLevel - 1) / 5);
      await ctx.db.insert("levels", { levelNumber: nextLevel, wordId, reward: { coins, diamonds } });
      inserted.push({ level: nextLevel, word: data.word });
      nextLevel++;
    }

    return { success: true, total: inserted.length, inserted };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Seed levels 32–36.
// Run once: npx convex run words:seedLevels32to36   (from MexicanarioApp-main)
// ─────────────────────────────────────────────────────────────────────────────
export const seedLevels32to36 = mutation({
  args: {},
  handler: async (ctx) => {
    const newWords = [
      // ── Nivel 32 – Personajes de la tele (Entretenimiento) ────────────────
      { word: "Chespirito",        meaning: "Actor y comediante creador del Chavo",           example: "Chespirito hizo reír a generaciones",               region: "CDMX"        },
      { word: "Chabelo",           meaning: "Conductor del programa dominical más longevo",   example: "Chabelo regalaba juguetes cada domingo",             region: "CDMX"        },
      { word: "El Chavo del 8",    meaning: "Personaje de la vecindad más famosa de México",  example: "El Chavo vivía en un barril y era muy inocente",     region: "Todo México"  },
      { word: "La Chilindrina",    meaning: "La niña traviesa de la vecindad",                example: "La Chilindrina siempre le echaba la culpa al Chavo", region: "Todo México"  },
      { word: "Don Ramon",         meaning: "El vecino sin trabajo del Chavo del 8",          example: "Don Ramón nunca pagaba la renta",                    region: "Todo México"  },
      { word: "Viruta y Capulina", meaning: "Dúo cómico del cine mexicano",                  example: "Viruta y Capulina hacían reír al cine entero",       region: "Época de Oro" },

      // ── Nivel 33 – Lucha libre (Deporte) ──────────────────────────────────
      { word: "Lucha libre",   meaning: "Deporte y espectáculo mexicano con máscaras",    example: "La lucha libre llena arenas cada semana",          region: "Todo México" },
      { word: "El Santo",      meaning: "Luchador enmascarado más icónico de México",     example: "El Santo nunca se quitó la máscara en público",    region: "Todo México" },
      { word: "Blue Demon",    meaning: "Leyenda del ring con máscara azul",              example: "Blue Demon fue el eterno rival del Santo",         region: "CDMX"        },
      { word: "Mil Mascaras",  meaning: "Luchador famoso por sus múltiples disfraces",    example: "Mil Máscaras luchó en Japón y Europa",             region: "San Luis Potosí" },
      { word: "Hijo del Santo", meaning: "Luchador heredero de la leyenda del Santo",    example: "El Hijo del Santo siguió el legado de su padre",   region: "Todo México" },
      { word: "Arena Mexico",  meaning: "Catedral de la lucha libre en CDMX",            example: "La Arena México se llena cada viernes",            region: "CDMX"        },

      // ── Nivel 34 – Geografía y naturaleza (Naturaleza) ────────────────────
      { word: "Popocatepetl",    meaning: "Volcán activo más famoso de México",            example: "El Popocatépetl hizo erupción esta mañana",       region: "Puebla-CDMX"  },
      { word: "Cenote",          meaning: "Hoyo natural de agua subterránea",              example: "Nadamos en un cenote en Yucatán",                 region: "Yucatán"      },
      { word: "Barranca del Cobre", meaning: "Cañón más grande que el Grand Canyon",      example: "La Barranca del Cobre está en Chihuahua",         region: "Chihuahua"    },
      { word: "Laguna de Bacalar", meaning: "Lago de los siete colores",                  example: "Bacalar tiene aguas azules increíbles",           region: "Quintana Roo" },
      { word: "Selva Lacandona", meaning: "Selva tropical más grande del sur",            example: "La Selva Lacandona alberga jaguares y guacamayas",region: "Chiapas"      },
      { word: "Iztaccihuatl",    meaning: "Volcán con forma de mujer dormida",            example: "El Iztaccíhuatl y el Popo son pareja legendaria", region: "Puebla-CDMX"  },

      // ── Nivel 35 – Artesanías mexicanas (Arte popular) ────────────────────
      { word: "Alebrijes",   meaning: "Figuras fantásticas de papel maché o madera",  example: "Compré un alebrije de jaguar en Oaxaca",        region: "Oaxaca-CDMX"  },
      { word: "Talavera",    meaning: "Cerámica pintada a mano de Puebla",            example: "La cocina tenía azulejos de talavera",          region: "Puebla"       },
      { word: "Barro negro", meaning: "Cerámica negra brillante de Oaxaca",           example: "El barro negro de San Marcos es único",         region: "Oaxaca"       },
      { word: "Papel picado", meaning: "Decoración de papel de colores perforado",   example: "El papel picado adornaba la fiesta de quince",  region: "Todo México"  },
      { word: "Huipil",      meaning: "Vestido bordado tradicional de comunidades indígenas", example: "La señora llevaba un huipil muy colorido",region: "Sur de México"},
      { word: "Reboso",      meaning: "Manta tejida para cargar o cubrirse",          example: "La abuela siempre cargaba su reboso",           region: "Nacional"     },

      // ── Nivel 36 – Modismos mexicanos (Lenguaje) ──────────────────────────
      { word: "Órale",      meaning: "Expresión de acuerdo, sorpresa o ánimo",   example: "Órale, ya nos vamos",                        region: "Todo México" },
      { word: "Chido",      meaning: "Adjetivo que significa excelente o cool",  example: "Ese carro está muy chido",                   region: "Juvenil"     },
      { word: "Güey",       meaning: "Término coloquial entre amigos",           example: "Güey, ya es tardísimo",                      region: "Todo México" },
      { word: "Nel pastel", meaning: "Forma divertida de decir que no",          example: "¿Vas a venir? Nel pastel, estoy ocupado",    region: "Callejero"   },
      { word: "A toda madre", meaning: "Expresión para algo excelente",          example: "La fiesta estuvo a toda madre",              region: "Todo México" },
      { word: "Qué onda",   meaning: "Saludo informal o pregunta de estado",     example: "¿Qué onda? ¿Cómo estás?",                   region: "Todo México" },
    ];

    // Remove duplicates (idempotent)
    const existingWords = await ctx.db.query("words").collect();
    const newNames = new Set(newWords.map(w => w.word.toLowerCase()));
    for (const w of existingWords) {
      if (newNames.has(w.word.toLowerCase())) {
        const lvl = await ctx.db
          .query("levels")
          .filter((q) => q.eq(q.field("wordId"), w._id))
          .first();
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(w._id);
      }
    }

    // Find next available level number
    const allLevels = await ctx.db.query("levels").collect();
    let nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    const inserted = [];
    for (const data of newWords) {
      const wordId = await ctx.db.insert("words", data);
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = 1 + Math.floor((nextLevel - 1) / 5);
      await ctx.db.insert("levels", { levelNumber: nextLevel, wordId, reward: { coins, diamonds } });
      inserted.push({ level: nextLevel, word: data.word });
      nextLevel++;
    }

    return { success: true, total: inserted.length, inserted };
  },
});

export const seedLevels57to61 = mutation({
  args: {},
  handler: async (ctx) => {
    const newWords = [
      // ── Nivel 57 – Pan dulce (Pan Dulce) ──────────────────────────────────
      { word: "Concha",      meaning: "Pan dulce con costra de azúcar en forma de caracol",              example: "Me comí una concha de chocolate en la mañana",          region: "Todo México"  },
      { word: "Cuernito",    meaning: "Pan dulce en forma de cuerno bañado en azúcar o mantequilla",     example: "El cuernito de la panadería estaba recién horneado",    region: "Todo México"  },
      { word: "Polvorón",    meaning: "Galleta arenosa de manteca que se deshace en la boca",            example: "El polvorón se deshizo apenas lo mordí",                region: "Nacional"     },
      { word: "Garibaldi",   meaning: "Pan redondo cubierto de mermelada de chabacano y chochitos",      example: "El garibaldi es el favorito de los niños en la fiesta", region: "CDMX"         },
      { word: "Cochito",     meaning: "Pan de piloncillo con forma de cochinito, típico del sur",         example: "Los cochitos de Chiapas son famosos en todo el país",   region: "Chiapas"      },
      { word: "Oreja",       meaning: "Pan hojaldrado en forma de oreja bañado en azúcar",               example: "La oreja es crujiente por fuera y suave por dentro",    region: "Todo México"  },

      // ── Nivel 58 – Palabras náhuatl (Náhuatl) ────────────────────────────
      { word: "Copal",       meaning: "Resina aromática sagrada usada en rituales prehispánicos",        example: "El copal se quema en los altares del Día de Muertos",   region: "Prehispánico" },
      { word: "Temazcal",    meaning: "Baño de vapor prehispánico con fines rituales y medicinales",     example: "El temazcal purifica el cuerpo y el espíritu",          region: "Nacional"     },
      { word: "Metate",      meaning: "Piedra plana volcánica para moler granos y semillas",             example: "La abuela molía el maíz en el metate cada mañana",     region: "Prehispánico" },
      { word: "Molcajete",   meaning: "Mortero de piedra volcánica para preparar salsas y guacamole",   example: "La salsa verde en molcajete sabe diferente",            region: "Todo México"  },
      { word: "Petate",      meaning: "Estera tejida de palma usada para dormir o cargar cosas",        example: "Dormía en un petate bajo las estrellas del rancho",     region: "Nacional"     },
      { word: "Huarache",    meaning: "Sandalia de cuero trenzado originaria del México prehispánico",  example: "Los huaraches son cómodos para el calor del verano",    region: "Nacional"     },

      // ── Nivel 59 – Leyendas mexicanas (Leyendas) ──────────────────────────
      { word: "La Llorona",  meaning: "Espíritu de mujer que llora por sus hijos perdidos en el río",   example: "De noche se escucha el llanto de la Llorona en el río", region: "Todo México"  },
      { word: "Nagual",      meaning: "Ser sobrenatural con poder de transformarse en animal",           example: "El nagual del pueblo se convertía en jaguar al anochecer", region: "Prehispánico" },
      { word: "Chaneque",    meaning: "Ser mítico guardián del monte que puede robar el alma",          example: "El chaneque asustó al niño que entró al bosque solo",   region: "Sur México"   },
      { word: "Alux",        meaning: "Duende maya protector de los campos y la naturaleza",            example: "Los mayas dejan ofrendas al alux para proteger su milpa", region: "Yucatán"    },
      { word: "Encanto",     meaning: "Lugar mágico oculto donde se puede quedar atrapada una persona", example: "Se perdió en el monte; dicen que cayó en un encanto",   region: "Nacional"     },
      { word: "Wirikuta",    meaning: "Lugar sagrado huichol donde nació el sol y se busca el peyote",  example: "La peregrinación a Wirikuta es sagrada para los wixáritari", region: "San Luis Potosí" },

      // ── Nivel 60 – Jerga callejera (Jerga) ───────────────────────────────
      { word: "Bato",        meaning: "Tipo, cuate; forma afectiva de referirse a alguien",             example: "Ese bato siempre me ayuda cuando lo necesito",          region: "Callejero"    },
      { word: "Cantón",      meaning: "Casa, vivienda; lugar donde vive alguien",                       example: "Nos quedamos a cenar en el cantón de mi primo",         region: "Callejero"    },
      { word: "Jale",        meaning: "Trabajo, empleo; actividad laboral",                             example: "Consiguió un buen jale en la ciudad",                   region: "Callejero"    },
      { word: "Feria",       meaning: "Dinero, lana; billete o moneda en sentido coloquial",            example: "No traigo feria, ¿me prestas para el camión?",          region: "Callejero"    },
      { word: "Chamba",      meaning: "Trabajo o empleo informal; actividad remunerada",                example: "Encontró chamba de mesero en el centro",                region: "Todo México"  },
      { word: "Palomilla",   meaning: "Grupo de amigos inseparables; bola de cuates de barrio",         example: "Salí con toda la palomilla a la feria del pueblo",      region: "Callejero"    },

      // ── Nivel 61 – Arquitectura colonial (Colonial) ───────────────────────
      { word: "Atrio",       meaning: "Espacio abierto enfrente de una iglesia colonial",               example: "Jugábamos en el atrio de la iglesia los domingos",      region: "Colonial"     },
      { word: "Claustro",    meaning: "Patio interior cuadrado con corredores en conventos coloniales", example: "El claustro del convento está lleno de plantas antiguas", region: "Colonial"   },
      { word: "Campanario",  meaning: "Torre donde se ubican las campanas de una iglesia",              example: "El campanario se escucha desde toda la ciudad",          region: "Colonial"     },
      { word: "Portada",     meaning: "Fachada decorativa principal tallada en piedra de una iglesia",  example: "La portada barroca de la catedral es impresionante",    region: "Colonial"     },
      { word: "Sagrario",    meaning: "Capilla lateral de una catedral donde se guarda el Santísimo",   example: "El sagrario está iluminado todo el día con velas",      region: "Colonial"     },
      { word: "Pilastra",    meaning: "Columna rectangular adosada a un muro en edificios coloniales",  example: "Las pilastras del palacio están talladas con motivos indígenas", region: "Colonial" },
    ];

    // Remove duplicates (idempotent)
    const existingWords = await ctx.db.query("words").collect();
    const newNames = new Set(newWords.map(w => w.word.toLowerCase()));
    for (const w of existingWords) {
      if (newNames.has(w.word.toLowerCase())) {
        const lvl = await ctx.db
          .query("levels")
          .filter((q) => q.eq(q.field("wordId"), w._id))
          .first();
        if (lvl) await ctx.db.delete(lvl._id);
        await ctx.db.delete(w._id);
      }
    }

    // Find next available level number
    const allLevels = await ctx.db.query("levels").collect();
    let nextLevel = allLevels.length > 0
      ? Math.max(...allLevels.map(l => l.levelNumber)) + 1
      : 1;

    const inserted = [];
    for (const data of newWords) {
      const wordId = await ctx.db.insert("words", data);
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = 1 + Math.floor((nextLevel - 1) / 5);
      await ctx.db.insert("levels", { levelNumber: nextLevel, wordId, reward: { coins, diamonds } });
      inserted.push({ level: nextLevel, word: data.word });
      nextLevel++;
    }

    return { success: true, total: inserted.length, inserted };
  },
});

export const seedOriginalWords = mutation({
  handler: async (ctx) => {
    let addedCount = 0;
    for (const item of sampleWords) {
      const cleanWord = item.Palabra.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, "");

      const existing = await ctx.db
        .query("words")
        .filter((q) => q.eq(q.field("word"), cleanWord))
        .first();

      if (!existing) {
        await ctx.db.insert("words", {
          word: cleanWord,
          meaning: item.Significado,
          example: item.Ejemplo,
          region: item.Region,
        });
        addedCount++;
      }
    }
    return `Añadidas ${addedCount} palabras originales.`;
  },
});
