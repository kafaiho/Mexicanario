import { mutation } from "./_generated/server";

function norm(s: string) {
  return s.toUpperCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
function normLow(s: string) {
  return (s || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ── Listas de palabras conocidas por categoría ────────────────────────────────

const BEBIDA_WORDS = new Set([
  "HORCHATA","AGUA DE JAMAICA","TEPACHE","TEJUINO","PULQUE","MICHELADA",
  "MEZCAL","TEQUILA","ATOLE","CHAMPURRADO","TEJATE","PISTO","CHELA",
  "AGUA DE TAMARINDO","AGUA FRESCA","CAFE DE OLLA","PONCHE",
  "ATOLE DE GUAYABA","COLONCHE","SOTOL","RAICILLA","BACANORA",
  "JARRITO","SIDRAL","SANGRIA","AGUA MINERAL","MINERAGUA",
].map(norm));

const COMIDA_WORDS = new Set([
  // Platillos
  "HORCHATA","SOPA DE FIDEOS","ARROZ ROJO","FRIJOLES DE OLLA","CALDO DE POLLO",
  "ENCHILADAS VERDES","CHILES EN NOGADA","ELOTE ASADO","CHURRO",
  "ALGODON DE AZUCAR","NIEVE DE GARRAFA","PEPINO CON CHILE","RASPADO",
  // Chiles
  "CHILE HABANERO","CHILE SERRANO","CHILE POBLANO","CHILE CHIPOTLE",
  "CHILE DE ARBOL","CHILE ANCHO","CHILE MULATO","CHILE PASILLA",
  "CHILE GUAJILLO","CHILE MORITA","CHILE NEGRO","CHILE MORA",
  "CHILE CASCABEL","CHILE PIQUIN","CHILE MIRASOL","CHILE PUYA",
  // Pan dulce
  "CONCHA","CUERNITO","POLVORON","GARIBALDI","COCHITO","OREJA",
  "BIGOTE","CUBILETE","POLVORINES","MANTECADA","SOLETA",
  "GENDARME","ALAMAR","BESO","PICÓN",
  // Antojitos / Street food
  "ELOTE HERVIDO","TOSTADA","ENFRIJOLADAS","ENMOLADAS","ENTOMATADAS",
  "PAMBAZO","TLAYUDA","GORDITA","SALBUTE","PANUCHO",
].map(norm));

const MUSICOS_WORDS = new Set([
  // Ya en músicos pero por si quedan en expresiones
  "BRONCO","LOS ANGELES AZULES","SELENA","JENNI RIVERA",
  "CHALINO SANCHEZ","GRUPO FIRME","BANDA EL RECODO",
  "LOS YONICS","LOS BUKIS","LOS TIGRES DEL NORTE",
  "ALEJANDRO FERNANDEZ","INTOCABLE","PAQUITA LA DEL BARRIO",
  "RATA DE DOS PATAS","VICENTE FERNANDEZ","JUAN GABRIEL",
  "LILA DOWNS","NATALIA LAFOURCADE","JULIETA VENEGAS",
  "CAIFANES","MANA","MOLOTOV","CAFE TACUBA","ZOE","EL TRI",
  "PANTEÓN ROCOCÓ","DIVISION DEL NORTE","SANTA SABINA",
].map(norm));

const TELENOVELAS_WORDS = new Set([
  "THALIA","VERONICA CASTRO","LUCIA MENDEZ","MARIA SORTE",
  "ANGÉLICA RIVERA","BARBARA MORI","CHRISTIAN BACH",
  "LOS RICOS TAMBIEN LLORAN","CUNA DE LOBOS","ROSA SALVAJE",
  "MARIA LA DEL BARRIO","REBELDE","LA USURPADORA",
  "MUNDO DE FIERAS","CAMILA","ACAPULCO CUERPO Y ALMA",
].map(norm));

const HISTORIA_WORDS = new Set([
  "BENITO JUAREZ","MIGUEL HIDALGO","EMILIANO ZAPATA",
  "SOR JUANA INES","JOSEFA ORTIZ","JOSE MARIA MORELOS",
  "PANCHO VILLA","FRANCISCO I MADERO","LAZARO CARDENAS",
  "ALVARO OBREGON","VENUSTIANO CARRANZA","PORFIRIO DIAZ",
  "CUAUHTEMOC","MOCTEZUMA","HERNÁN CORTÉS","HERNÁN CORTEZ","HERNAN CORTES",
  "LA MALINCHE","MALINCHE","TLATOANI","NEZAHUALCOYOTL",
].map(norm));

const ARTISTAS_WORDS = new Set([
  // Cine
  "AMORES PERROS","Y TU MAMA TAMBIEN","ROMA","GUILLERMO DEL TORO",
  "INARRITU","ALFONSO CUARON","GAEL GARCIA BERNAL",
  "DIEGO LUNA","SALMA HAYEK","DOLORES DEL RIO",
  "PEDRO INFANTE","JORGE NEGRETE","MARIA FELIX","MARIO MORENO",
  "CANTINFLAS","TIN TAN","VIRUTA Y CAPULINA",
  "EL INDIO FERNANDEZ","EMILIO FERNANDEZ",
].map(norm));

const CULTURA_POPULAR_WORDS = new Set([
  // Comics
  "KALIMAN","MEMIN PINGUIN","LA FAMILIA BURRON","EL PAYO","FANTOMAS",
  "CHANOC","BOROLA TACUCHE","HERMELINDA LINDA",
  // Lucha libre (extras no capturados antes)
  "SANTO","EL ENMASCARADO DE PLATA","BLUE PANTHER","NEGRO CASAS",
  "ATLANTIS","TINIEBLAS","EL RAYO DE JALISCO",
  // TV / personajes
  "CHESPIRITO","EL CHAVO DEL 8","EL CHAPULIN COLORADO",
  "LA CHILINDRINA","DON RAMON","CHABELO",
].map(norm));

const TRADICIONES_WORDS = new Set([
  // Instrumentos / danza
  "GUITARRON","VIHUELA","ARPA JAROCHA","MARIMBA","TAMBORA","REQUINTO",
  "JARANA","HARPA GRANDE","PITO DE CARRIZO","TAMBOR DE FRICCIÓN",
  // Vestimenta típica
  "SOMBRERO CHARRO","CHINA POBLANA","TRAJE DE CHARRO","SARAPE","QUECHQUEMITL",
  "JORONGO","HUIPIL","REBOZO","HUARACHE","GUAYABERA","CALZON MANTA",
  // Objetos rituales / prehispánicos
  "COPAL","TEMAZCAL","METATE","MOLCAJETE","PETATE","TEPONAZTLI",
  "HUEHUEHTL","PENACHO","AMATE","PAPEL PICADO","OFRENDA",
  // Festivales
  "GUELAGUETZA","FESTIVAL CERVANTINO","FERIA DE SAN MARCOS",
  "CARNAVAL DE VERACRUZ","DIA DE GUADALUPE","SEMANA SANTA",
  "NOCHE DE MUERTOS","FERIA DE PUEBLA","FESTIVAL DE GLOBOS",
  "QUINCEANERA","POSADAS","AGUINALDO","PASTORELA",
  // Deportes tradicionales
  "CHARREPIA","CHARRERIA","PELOTA MIXTECA","ULAMA",
].map(norm));

const LEYENDAS_WORDS = new Set([
  "LA LLORONA","NAGUAL","CHANEQUE","EL CHARRO NEGRO","LA CIGUANABA",
  "EL CUCUY","CIPITIO","LA LECHUZA","EL SILBÓN","EL CADEJO",
  "EL DESCABEZADO","LA PLANCHADA","EL JINETE SIN CABEZA",
  "TEPEYAC","EL BASILISCO","LA TULIVIEJA",
].map(norm));

const REFRANES_WORDS = new Set([
  "AL QUE MADRUGA","CAMARON QUE SE DUERME","EL QUE CON LOBOS ANDA",
  "MAS VALE TARDE","EN BOCA CERRADA","NO HAY MAL QUE DURE",
  "A CABALLO REGALADO","CADUCIDAD DE LA LECHE","DIME CON QUIEN ANDAS",
  "EL QUE RIE AL ULTIMO","MAS VALE PAJARO EN MANO","OJOS QUE NO VEN",
  "EL QUE NO TRANZA","AL BUEN ENTENDEDOR","CADA QUIEN SU CADA CUAL",
  "EL QUE A HIERRO MATA","NO POR MUCHO MADRUGAR","TANTO VA EL CANTARO",
  "CARAS VEMOS","A PALABRAS NECIAS","EL MUERTO AL POZO",
].map(norm));

const RELIGION_WORDS = new Set([
  "VIRGEN DE GUADALUPE","SAN JUDAS TADEO","LA SANTA MUERTE","CRISTO REY",
  "SAN MIGUEL ARCANGEL","NINO DIOS","SAN PEDRO","SAN PABLO",
  "VIRGEN DE ZAPOPAN","VIRGEN DE SAN JUAN","VIRGEN DE JUQUILA",
  "DIA DE MUERTOS","CATRINA","CALAVERA","OFRENDA",
].map(norm));

// ── Clasificador por patrones de significado ──────────────────────────────────
function classifyByMeaning(meaning: string, word: string): string | null {
  const m = normLow(meaning);
  const w = normLow(word);

  // Bebidas — patrones de significado
  if (/(bebida|beber|agua de|infusion|te de|cerveza con|fermentada del|fermentado de|destilado|licor|mezcal|tequila|aguardiente)/.test(m)) return "Bebidas";

  // Comida Mexicana — platillos, chiles, pan dulce
  if (/(chile .+seco|chile .+picante|chile .+verde|pan dulce|pan de|galleta|postre de|dulce de|helado|nieves|nieve de|raspado|antojito|platillo|guiso de|caldo de|sopa de|arroz|frijoles|enchiladas|tacos de|tamales de|torta de)/.test(m)) return "Comida Mexicana";

  // Refranes y Dichos
  if (/(refran|dicho popular|dicho mexicano|proverbio|frase hecha|dice el refran)/.test(m)) return "Refranes y Dichos";

  // Tradiciones y Fiestas — festivales, vestimenta, instrumentos, danzas rituales
  if (/(festival de|feria de|feria nacional|danza tradicional|baile tradicional|traje tipico|vestimenta tipica|prenda tipica|instrumento de|instrumento musical del mariachi|instrumento de percusion|baño de vapor|ritual|ceremonia prehispanica|piedra .+moler|estera)/.test(m)) return "Tradiciones y Fiestas";

  // Historia de México
  if (/(presidente de mexico|heroe de |lider de la revolucion|padre de la independencia|madre de la independencia|reformador|tlatoani|conquistador|virreina|virrey)/.test(m)) return "Historia de México";

  // Leyendas y Mitos
  if (/(espiritu de|fantasma|ser mitologico|ser sobrenatural|leyenda urbana|leyenda de|criatura mitica|brujo|bruja que)/.test(m)) return "Leyendas y Mitos";

  // Música y Artistas — cine, directores, cantantes y bandas
  if (/(directora? mexicana?|directora? de (cine|pelicula)|pelicula mexicana|ganadora? del oscar|cineasta)/.test(m)) return "Música y Artistas";
  if (/(cantante de|banda de|grupo de|agrupacion de|cumbia|corrido|norteño|ranchera|reina del|rey del|diva de|vocalista de)/.test(m) && !/(deporte|boxeo|beisbol)/.test(m)) return "Música y Artistas";

  // Cultura Popular — telenovelas, cómics, personajes
  if (/(actriz de telenovela|actor de telenovela|epoca dorada de telenovela|iconica de telenovela)/.test(m)) return "Cultura Popular";
  if (/(comic mexicano|personaje de comic|personaje iconico de la television|personaje de television|comediante mexicano|titiritero)/.test(m)) return "Cultura Popular";

  // Mundo Digital — deportes, futbolistas
  if (/(velocista|atletista|boxeador|nadador|clavadista|beisbol|medallista olimpica)/.test(m)) return "Mundo Digital";
  if (/(futbolista|jugador de futbol|portero|delantero|mediocampista|seleccion mexicana de futbol)/.test(m)) return "Mundo Digital";

  return null;
}

function getNewCategory(word: string, meaning: string, currentCat: string): string | null {
  const n = norm(word);
  // Explicit name lists first
  if (BEBIDA_WORDS.has(n))          return "Bebidas";
  if (COMIDA_WORDS.has(n))          return "Comida Mexicana";
  if (REFRANES_WORDS.has(n))        return "Refranes y Dichos";
  if (TRADICIONES_WORDS.has(n))     return "Tradiciones y Fiestas";
  if (HISTORIA_WORDS.has(n))        return "Historia de México";
  if (LEYENDAS_WORDS.has(n))        return "Leyendas y Mitos";
  if (ARTISTAS_WORDS.has(n))        return "Música y Artistas";
  if (MUSICOS_WORDS.has(n))         return "Música y Artistas";
  if (TELENOVELAS_WORDS.has(n))     return "Cultura Popular";
  if (CULTURA_POPULAR_WORDS.has(n)) return "Cultura Popular";
  if (RELIGION_WORDS.has(n))        return "Tradiciones y Fiestas";

  // Pattern-based fallback
  return classifyByMeaning(meaning, word);
}

/**
 * Reclasifica palabras en "Expresiones" hacia categorías semánticamente
 * correctas usando listas y patrones de significado.
 *
 * Ejecutar: reclassify:reclassify
 */
export const reclassify = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const candidates = allWords.filter((w) =>
      (w as any).category === "Expresiones y Modismos" || (w as any).category === "Expresiones"
    );

    const moved: Record<string, number> = {};
    let total = 0;

    for (const w of candidates) {
      const cat = (w as any).category;
      const newCat = getNewCategory(w.word, (w as any).meaning ?? "", cat);
      if (newCat && newCat !== "Expresiones y Modismos" && newCat !== "Expresiones") {
        await ctx.db.patch(w._id, { category: newCat } as any);
        const key = newCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        moved[key] = (moved[key] ?? 0) + 1;
        total++;
      }
    }

    return { moved: total, remaining: candidates.length - total, breakdown: moved };
  },
});

/** Mueve palabras de la categoría "Deportes" a "Mundo Digital" */
export const foldSports = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const sports = allWords.filter((w) => (w as any).category === "Deportes");
    for (const w of sports) await ctx.db.patch(w._id, { category: "Mundo Digital" } as any);
    return { moved: sports.length };
  },
});
