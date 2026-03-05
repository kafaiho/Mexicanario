import { mutation } from "./_generated/server";

/**
 * Expande las categorías de Cultura Digital con 19 palabras adicionales.
 * Streamers: +8 | Músicos: +11
 *
 * Ejecutar desde Convex Dashboard: seedCulturaDigitalV2:seedCulturaDigitalV2
 */
const NEW_ENTRIES = [
  // ── STREAMERS adicionales ──────────────────────────────────────────────────
  {
    word: "EL RUBIUS",
    meaning: "Youtuber hispano (Rubén Doblas) muy popular en México, conocido por Minecraft y reacciones",
    example: "El Rubius fue uno de los primeros youtubers en llegar a 40 millones de suscriptores en español",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "AURONPLAY",
    meaning: "Streamer español (Raúl Álvarez) muy seguido en México, conocido por reacciones y polémicas",
    example: "Auronplay es uno de los streamers con más horas vistas en Twitch de habla hispana",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "THEGREFG",
    meaning: "Streamer español (David Cánovas) famoso en México por Fortnite y su skin oficial en el juego",
    example: "TheGrefg batió el récord de Twitch con 2.4 millones de espectadores al revelar su skin de Fortnite",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "SPREEN",
    meaning: "Streamer argentino (Agustín Esperon) conocido por eventos de Minecraft y popularidad en México",
    example: "Spreen participó en el servidor de Minecraft hispano con millones de espectadores en vivo",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "QUACKITY",
    meaning: "Streamer mexicano (Alexis) creador de servidores de Minecraft como Las Nevadas con millones de fans",
    example: "Quackity es uno de los streamers mexicanos con mayor proyección internacional en Twitch y YouTube",
    region: "México", category: "Streamers", difficulty: 2,
  },
  {
    word: "IBAI LLANOS",
    meaning: "Streamer vasco muy popular en México, organizador de La Velada del Año y Kings League",
    example: "Ibai Llanos organizó La Velada del Año 4 en 2024 rompiendo récords mundiales en Twitch",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "RIVERS",
    meaning: "Streamer mexicano de Twitch conocido en la escena hispana de gaming",
    example: "Rivers es uno de los streamers mexicanos más activos en la comunidad hispanohablante de Twitch",
    region: "México", category: "Streamers", difficulty: 2,
  },
  {
    word: "KENAI",
    meaning: "Streamer mexicano de Twitch conocido por Among Us y contenido de gaming de terror",
    example: "Kenai es uno de los streamers mexicanos más activos en el ámbito del gaming de horror",
    region: "México", category: "Streamers", difficulty: 2,
  },

  // ── MÚSICOS adicionales ────────────────────────────────────────────────────
  {
    word: "CARIN LEON",
    meaning: "Cantante de regional mexicano de Sonora, uno de los más escuchados en 2023-2024",
    example: "Carín León colaboró con Peso Pluma y ganó el Latin Grammy al Mejor Álbum de Regional en 2023",
    region: "Sonora", category: "Músicos", difficulty: 2,
  },
  {
    word: "GRUPO FRONTERA",
    meaning: "Agrupación de música norteña de Texas con raíces mexicanas, viral en TikTok",
    example: "Grupo Frontera colaboró con Bad Bunny en 'Un x100to' que llegó al número 1 en Billboard Hot 100",
    region: "Texas/México", category: "Músicos", difficulty: 2,
  },
  {
    word: "EDEN MUNOZ",
    meaning: "Cantante y compositor sinaloense, ex vocalista de Calibre 50 y exitoso solista",
    example: "Edén Muñoz escribió éxitos para Maluma y Becky G antes de triunfar como solista en regional mexicano",
    region: "Sinaloa", category: "Músicos", difficulty: 2,
  },
  {
    word: "BANDA MS",
    meaning: "Banda sinaloense de Mazatlán, una de las más populares del regional mexicano moderno",
    example: "Banda MS es considerada una de las bandas de sinaloense más exitosas con ventas mundiales",
    region: "Sinaloa", category: "Músicos", difficulty: 2,
  },
  {
    word: "CALIBRE 50",
    meaning: "Agrupación de regional mexicano de Sinaloa conocida por corridos y norteño romántico",
    example: "Calibre 50 ganó el Latin Grammy al Mejor Álbum de Música Norteña en 2014",
    region: "Sinaloa", category: "Músicos", difficulty: 2,
  },
  {
    word: "CHRISTIAN NODAL",
    meaning: "Cantante sonorense creador del 'mariacheño' (fusión mariachi-norteño), figura del regional moderno",
    example: "Christian Nodal lanzó 'Botella tras botella' con Gera MXM consolidando el género mariacheño",
    region: "Sonora", category: "Músicos", difficulty: 2,
  },
  {
    word: "YAHRITZA Y SU ESENCIA",
    meaning: "Agrupación norteña liderada por Yahritza Martínez, viral en TikTok por su estilo melódico",
    example: "Yahritza y Su Esencia se volvió viral con su versión de 'Obsessed' de Mariah Carey en TikTok",
    region: "Washington/México", category: "Músicos", difficulty: 2,
  },
  {
    word: "LOS DOS CARNALES",
    meaning: "Dúo de regional mexicano de Sonora conocido por corridos románticos y más de 10M de fans",
    example: "Los Dos Carnales tienen más de 10 millones de seguidores en YouTube con sus corridos norteños",
    region: "Sonora", category: "Músicos", difficulty: 2,
  },
  {
    word: "XAVI",
    meaning: "Cantante de corridos tumbados y trap mexicano, conocido mundialmente por 'La Diabla'",
    example: "Xavi lanzó 'La Diabla' en 2023, una de las canciones más escuchadas del corrido tumbado ese año",
    region: "México", category: "Músicos", difficulty: 2,
  },
  {
    word: "GRUPO SOMBRA",
    meaning: "Agrupación de cumbia norteña de Jalisco muy popular en redes sociales por sus covers virales",
    example: "Grupo Sombra se volvió viral en TikTok con covers de canciones pop en estilo cumbia norteña",
    region: "Jalisco", category: "Músicos", difficulty: 2,
  },
  {
    word: "LUPILLO RIVERA",
    meaning: "Cantante de regional mexicano de Baja California, apodado 'El Toro del Corrido', hermano de Jenni Rivera",
    example: "Lupillo Rivera es conocido como 'El Toro del Corrido' y tiene décadas de trayectoria en el norteño",
    region: "Baja California", category: "Músicos", difficulty: 2,
  },
];

export const seedCulturaDigitalV2 = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("words").collect();
    const existingKeys = new Set(
      existing.map((w) => w.word.toUpperCase().trim().replace(/\s+/g, " "))
    );

    const allLevels = await ctx.db.query("levels").collect();
    const maxLevel = allLevels.length > 0
      ? Math.max(...allLevels.map((l) => l.levelNumber))
      : 0;

    let nextLevel = maxLevel + 1;
    const added: string[] = [];
    const skipped: string[] = [];

    for (const entry of NEW_ENTRIES) {
      const key = entry.word.toUpperCase().trim().replace(/\s+/g, " ");
      if (existingKeys.has(key)) { skipped.push(key); continue; }

      const wordId = await ctx.db.insert("words", {
        word: key,
        meaning: entry.meaning,
        example: entry.example,
        region: entry.region,
        category: entry.category,
        difficulty: entry.difficulty,
      });

      await ctx.db.insert("levels", {
        levelNumber: nextLevel,
        wordId,
        reward: {
          coins: 50 + (nextLevel - 1) * 10,
          diamonds: Math.floor((nextLevel - 1) / 5) + 1,
        },
      });

      existingKeys.add(key);
      added.push(key);
      nextLevel++;
    }

    return { added: added.length, skipped: skipped.length, addedWords: added };
  },
});
