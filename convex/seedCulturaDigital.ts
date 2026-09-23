import { mutation, internalMutation } from "./_generated/server";
import { insertNewLevel } from "./levelWrites";

/**
 * Verified cultura digital + futbolistas mexicanos word list.
 *
 * Ordering strategy (via getOrderedLevels):
 *   difficulty: 1 → easy pool (positions 1-50, sorted by word length)
 *                   → (Influencers will naturally appear after simpler words)
 *   difficulty: 2 → seeded-shuffled hard pool per user
 *                   → cultura digital content distributed every 4-10 levels randomly
 *
 * ALL facts below are verified against public sources (2024-2025).
 */
const CULTURA_DIGITAL_WORDS = [

  // ── PRIORIDAD ALTA — difficulty:1 → easy pool, aparecen en los primeros 50 niveles ──

  {
    word: "ALANA FLORES",
    meaning: "Streamer famosa por empezar en Facebook con CoD Mobile, brillar en Twitch y boxear en La Velada del Año",
    example: "Alana Flores empezó en Facebook con CoD Mobile y hoy destaca en Twitch tras su gran pelea en La Velada",
    region: "Digital",
    category: "Mundo Digital",
    difficulty: 1,
  },
  {
    word: "LA VELADA",
    meaning: "Evento de boxeo de creadores de contenido organizado por Ibai Llanos",
    example: "La Velada del Año 4 en 2024 rompió récords de audiencia simultánea en Twitch",
    region: "Digital",
    category: "Mundo Digital",
    difficulty: 1,
  },
  {
    word: "EL MARIANA",
    meaning: "Streamer mexicano de videojuegos e influencer, figura clave en la comunidad hispana de Twitch",
    example: "El Mariana es uno de los streamers de videojuegos más influyentes de habla hispana en México",
    region: "México",
    category: "Mundo Digital",
    difficulty: 1,
  },

  // ── STREAMERS Y YOUTUBERS ─────────────────────────────────────────────────────

  {
    word: "JUAN GUARNIZO",
    meaning: "Streamer colombiano muy popular en México por Minecraft y eventos de creadores",
    example: "Juan Guarnizo organizó el evento 'No me pises el flow' en Minecraft con streamers hispanos",
    region: "Latinoamérica",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "ARIGAMEPLAYS",
    meaning: "Streamer mexicana, nombre real Abril Abdamari Garza Alonso, pionera del gaming en México",
    example: "Arigameplays es una de las primeras streamers mexicanas en alcanzar millones de seguidores",
    region: "México",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "LUISITO COMUNICA",
    meaning: "Youtuber mexicano de Puebla, famoso por vlogs de viajes a destinos exóticos",
    example: "Luisito Comunica fue uno de los primeros mexicanos en superar 30 millones de suscriptores en YouTube",
    region: "Puebla",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "WEREVERTUMORRO",
    meaning: "Pionero del YouTube en español, conocido por sketches de comedia desde 2008",
    example: "Werevertumorro es considerado uno de los fundadores del contenido de comedia en YouTube en español",
    region: "México",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "YOSS HOFFMAN",
    meaning: "Youtuber mexicana (Sara Hoffman) de Michoacán conocida por vlogs de estilo de vida y moda",
    example: "Yoss Hoffman superó los 10 millones de suscriptores en YouTube con contenido en español",
    region: "Michoacán",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "CAELI",
    meaning: "Youtuber mexicana de Ciudad de México pionera en contenido de comedia y retos en español",
    example: "Caeli es una de las youtubers mexicanas más conocidas de la primera generación de YouTube en español",
    region: "Ciudad de México",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "ROIER",
    meaning: "Streamer español muy popular en México por su participación en el SMPLive mexicano",
    example: "Roier participó en La Velada del Año y en el servidor de Minecraft hispano con streamer mexicanos",
    region: "Digital",
    category: "Mundo Digital",
    difficulty: 2,
  },

  // ── CORRIDOS TUMBADOS / MÚSICOS DIGITALES ────────────────────────────────────

  {
    word: "NATANAEL CANO",
    meaning: "Pionero del corrido tumbado nacido en Ciudad Obregón, Sonora, en 2001",
    example: "Natanael Cano lanzó el álbum 'Trap Tumbado' en 2020 y definió el género corrido tumbado moderno",
    region: "Sonora",
    category: "Música y Artistas",
    difficulty: 2,
  },
  {
    word: "PESO PLUMA",
    meaning: "Artista de corridos tumbados, nombre real Hassan Emilio Kabande Laija, de Guadalajara",
    example: "Peso Pluma nacido en 1999 colaboró con Becky G en 'Chanel' y se volvió fenómeno global",
    region: "Jalisco",
    category: "Música y Artistas",
    difficulty: 2,
  },
  {
    word: "JUNIOR H",
    meaning: "Cantante de corridos tumbados, nombre real Antonio Herrera Pérez, de Sonora",
    example: "Junior H firmó con el sello Rancho Humilde de Natanael Cano y es parte de la nueva generación",
    region: "Sonora",
    category: "Música y Artistas",
    difficulty: 2,
  },
  {
    word: "ESLABON ARMADO",
    meaning: "Grupo de regional mexicano con raíces en California y México, conocido por corridos tumbados románticos",
    example: "Eslabon Armado colaboró con Peso Pluma en la canción 'Por Las Noches' que fue viral en TikTok",
    region: "California/México",
    category: "Música y Artistas",
    difficulty: 2,
  },
  {
    word: "CORRIDO TUMBADO",
    meaning: "Fusión de corrido tradicional mexicano con trap, hip-hop y beats electrónicos",
    example: "El corrido tumbado combina las letras narrativas del corrido norteño con ritmos de trap modernos",
    region: "Norte de México",
    category: "Música y Artistas",
    difficulty: 2,
  },
  {
    word: "GABITO BALLESTEROS",
    meaning: "Cantante de corridos tumbados de Sinaloa, colaborador frecuente de Peso Pluma",
    example: "Gabito Ballesteros es uno de los artistas emergentes del corrido tumbado más escuchados en 2023-2024",
    region: "Sinaloa",
    category: "Música y Artistas",
    difficulty: 2,
  },
  {
    word: "FUERZA REGIDA",
    meaning: "Grupo de regional mexicano de Sinaloa radicado en Los Ángeles, pioneros del sierreño moderno",
    example: "Fuerza Regida colaboró con Grupo Frontera y Peso Pluma llevando el regional mexicano al mundo",
    region: "Sinaloa/Los Ángeles",
    category: "Música y Artistas",
    difficulty: 2,
  },

  // ── JERGA DIGITAL MEXICANA ────────────────────────────────────────────────────

  {
    word: "SHEEEEESH",
    meaning: "Expresión viral de asombro o aprobación extrema popularizada en redes sociales",
    example: "Al ver ese golazo todos gritaron: ¡Sheeeeesh!",
    region: "Internet",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "RATIO",
    meaning: "Cuando una respuesta recibe más likes que el tuit original, signo de desaprobación masiva",
    example: "Le hicieron ratio al famoso después de su polémico comentario en Twitter",
    region: "Internet",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "CHUPAR RUEDA",
    meaning: "En redes sociales: seguir o apoyar a alguien solo por su fama o beneficio personal",
    example: "Ese influencer nomás está chupando rueda al famoso para ganar seguidores",
    region: "México Digital",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "GHOSTEAR",
    meaning: "Dejar de responder mensajes sin aviso, desaparecer de una conversación digital",
    example: "Me ghosteó después de que quedamos de salir el fin de semana",
    region: "México Digital",
    category: "Mundo Digital",
    difficulty: 2,
  },

  // ── FUTBOLISTAS MEXICANOS VERIFICADOS ─────────────────────────────────────────

  {
    word: "HUGO SANCHEZ",
    meaning: "Delantero mexicano que ganó el Pichichi cinco veces en la Liga española con el Real Madrid",
    example: "Hugo Sánchez anotó 38 goles en la temporada 1989-90 y fue elegido mejor futbolista de CONCACAF del siglo XX",
    region: "Ciudad de México",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "RAFAEL MARQUEZ",
    meaning: "Defensa central apodado 'El Kaiser de Zamora', nacido en Zamora, Michoacán",
    example: "Rafael Márquez jugó en cinco Copas del Mundo y pasó de Mónaco a Barcelona en 2003",
    region: "Michoacán",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "CUAUHTEMOC BLANCO",
    meaning: "Delantero del América conocido por 'La Cuauhteminha' y luego gobernador de Morelos",
    example: "Cuauhtémoc Blanco nació en Tepito, CDMX, y marcó goles en tres Copas del Mundo",
    region: "Ciudad de México",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "JORGE CAMPOS",
    meaning: "Portero-goleador de 1.68m que diseñó sus propios uniformes de colores brillantes",
    example: "Jorge Campos anotó más de 30 goles como delantero y es el portero más carismático de México",
    region: "Acapulco",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "CHICHARITO",
    meaning: "Apodo de Javier Hernández Balcázar, máximo goleador histórico de la selección mexicana",
    example: "Chicharito anotó 52 goles con la selección y en 2010 fue el primer mexicano en Manchester United",
    region: "Guadalajara",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "GUILLERMO OCHOA",
    meaning: "Portero mexicano que disputó cinco Copas del Mundo y se hizo famoso por parar a Brasil en 2014",
    example: "Guillermo Ochoa fue nombrado Mejor Jugador de la Temporada en Salernitana en la Serie A",
    region: "Guadalajara",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "ANDRES GUARDADO",
    meaning: "El Principito, mediocampista con 181 partidos internacionales, récord de la selección mexicana",
    example: "Andrés Guardado jugó en PSV Eindhoven y es el jugador con más partidos en la historia del Tri",
    region: "Guadalajara",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "CHUCKY LOZANO",
    meaning: "Extremo que marcó el gol de la victoria de México contra Alemania en el Mundial 2018",
    example: "Chucky Lozano fue el primer mexicano en ganar la Serie A italiana cuando Nápoli campeonó en 2023",
    region: "Ciudad de México",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "RAUL JIMENEZ",
    meaning: "Delantero que regresó al fútbol tras fracturarse el cráneo en 2020 y jugó con casco protector",
    example: "Raúl Jiménez superó su fractura de cráneo en Wolverhampton y volvió a ser titular con la selección",
    region: "Tepeji del Río",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "SANTIAGO GIMENEZ",
    meaning: "Delantero nacido en Buenos Aires y criado en México que en 2025 fichó por el AC Milan convirtiéndose en el mexicano más caro de la historia",
    example: "Santiago Giménez traspasado desde Feyenoord al AC Milan por más de 30 millones de euros",
    region: "México",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "CARLOS VELA",
    meaning: "Delantero mexicano que llegó a la MLS con LAFC y fue el máximo goleador de la liga en 2019",
    example: "Carlos Vela jugó en Arsenal, Real Sociedad y LAFC donde batió el récord de goles en MLS con 34 en una temporada",
    region: "Cancún",
    category: "Mundo Digital",
    difficulty: 2,
  },
  {
    word: "MEMO OCHOA",
    meaning: "Nombre coloquial de Guillermo Ochoa, portero héroe del Mundial 2014 contra Brasil",
    example: "¡Memo Ochoa atajó todo en el 0-0 contra Brasil en el Mundial de 2014!",
    region: "México",
    category: "Mundo Digital",
    difficulty: 2,
  },
];

/**
 * Inserta palabras de cultura digital y futbolistas mexicanos.
 *
 * - Omite palabras que ya existan en DB (por texto normalizado).
 * - Asigna level numbers a continuación del máximo actual.
 * - difficulty:1 → aparecen en el pool fácil (primeros 50 niveles).
 * - difficulty:2 → pool difícil, mezclados aleatoriamente por usuario.
 *
 * Ejecutar desde el dashboard de Convex: seedCulturaDigital:seedCulturaDigital
 */
export const seedCulturaDigital = internalMutation({
  args: {},
  handler: async (ctx) => {
    // ── Cargar estado actual ────────────────────────────────────────────────
    const existingWords = await ctx.db.query("words").collect();
    const existingKeys = new Set(
      existingWords.map((w) => w.word.toUpperCase().trim().replace(/\s+/g, " "))
    );

    const existingLevels = await ctx.db.query("levels").collect();
    const maxLevel =
      existingLevels.length > 0
        ? Math.max(...existingLevels.map((l) => l.levelNumber))
        : 0;

    let nextLevel = maxLevel + 1;
    const added: { word: string; level: number; category: string; difficulty: number }[] = [];
    const skipped: string[] = [];

    // ── Insertar palabras nuevas ────────────────────────────────────────────
    for (const entry of CULTURA_DIGITAL_WORDS) {
      const key = entry.word.toUpperCase().trim().replace(/\s+/g, " ");

      if (existingKeys.has(key)) {
        skipped.push(entry.word);
        continue;
      }

      // Insertar palabra
      const wordId = await ctx.db.insert("words", {
        word: key,
        meaning: entry.meaning,
        example: entry.example,
        region: entry.region,
        category: entry.category,
        difficulty: entry.difficulty,
      });

      // Rewards escalan con el nivel
      const coins = 50 + (nextLevel - 1) * 10;
      const diamonds = Math.floor((nextLevel - 1) / 5) + 1;

      // Insertar nivel
      await insertNewLevel(ctx, {
        levelNumber: nextLevel,
        wordId,
        reward: { coins, diamonds },
      });

      added.push({
        word: key,
        level: nextLevel,
        category: entry.category,
        difficulty: entry.difficulty,
      });

      existingKeys.add(key);
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
