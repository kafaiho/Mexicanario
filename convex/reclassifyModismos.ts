import { mutation, query } from "./_generated/server";

// ── Helpers ──────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normLow(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ══════════════════════════════════════════════════════════════════════════════
// 4 CATEGORÍAS NUEVAS
// ══════════════════════════════════════════════════════════════════════════════

const VIDA_COTIDIANA_WORDS = new Set(
  [
    "PESERO",
    "METRO CDMX",
    "MOTOTAXI",
    "COMBI",
    "BICITAXI",
    "TROLEBÚS",
    "CAMIÓN",
    "MICRO",
    "CUADERNO SCRIBE",
    "RECREO ESCOLAR",
    "COOPERATIVA",
    "CONALITEG",
    "LONCHERA",
    "ESCOLTA",
    "TIANGUIS",
    "MOLCAJETE",
    "METATE",
    "PETATE",
  ].map(norm)
);

const REMEDIOS_CASEROS_WORDS = new Set(
  [
    "VICKS VAPORUB",
    "AGUA DE TILA",
    "SÁBILA",
    "LIMÓN CON SAL",
    "GORDOLOBO",
    "RUDA",
    "TEMAZCAL",
    "COPAL",
  ].map(norm)
);

const ARTESANIAS_WORDS = new Set(
  [
    "ALEBRIJES",
    "TALAVERA",
    "BARRO NEGRO",
    "PAPEL PICADO",
    "HUIPIL",
    "REBOZO",
    "SARAPE",
    "SOMBRERO CHARRO",
    "CHINA POBLANA",
    "TRAJE DE CHARRO",
    "QUECHQUÉMITL",
    "JORONGO",
    "PIÑATA",
    "REBOSO",
  ].map(norm)
);

const DEPORTES_MEXICANOS_WORDS = new Set(
  [
    "LUCHA LIBRE",
    "EL SANTO",
    "BLUE DEMON",
    "MIL MÁSCARAS",
    "HIJO DEL SANTO",
    "ARENA MÉXICO",
    "CHARRERÍA",
    "PELOTA MIXTECA",
    "JULIO CÉSAR CHÁVEZ",
    "ANA GUEVARA",
    "BÉISBOL NORTEÑO",
    "HUGO SÁNCHEZ",
  ].map(norm)
);

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORÍAS EXISTENTES — listas expandidas de palabras a reclasificar
// ══════════════════════════════════════════════════════════════════════════════

const COMIDA_WORDS = new Set(
  [
    // Ingredientes y platillos principales
    "AGUACATE",
    "SALSA",
    "ADOBO MEXICANO",
    "SALBUT",
    "PANUCHOS",
    "RELLENO NEGRO",
    "ENCHILADAS POTOSINAS",
    "MOLE VERDE",
    "ENTOMATADA",
    "ENMOLADA",
    "PICADA VERACRUZANA",
    "TOSTADA DE TINGA",
    "FLAUTAS DE POLLO",
    "GORDITA DE CHICHARRÓN",
    "CHALUPA POBLANA",
    "SOPA DE LIMA",
    "CALDO TLALPEÑO",
    "MIXIOTE",
    "HUARACHE DE NOPAL",
    "TAMAL OAXAQUEÑO",
    "CAMARONES A LA DIABLA",
    "CEVICHE DE CAMARÓN",
    "TAMALES DE RAJAS",
    "MOLE VERDE",
    "CACAO",
    "VAINILLA",
    "MACHETES OAXAQUEÑOS",
    "MOLOTES",
    "PIPIÁN ROJO",
    "CHILEATOLE",
    "TACO DE CANASTA",
    "ENFRIJOLADA",
    "QUESILLO",
    "CABALLITO",
    "SOPE",
    "CARNITAS",
    "BIRRIA",
    "BARBACOA",
    "MENUDO",
    "FLAUTAS",
    "QUESADILLA",
    "GUACAMOLE",
    "TOSTADA",
    "ENCHILADAS VERDES",
    "PIPIÁN",
    "CALDO DE RES",
    "GORDITA",
    "HUITLACOCHE",
    "TASAJO",
    "CECINA",
    "RAJAS CON CREMA",
    "MARQUESITA",
    "POC CHUC",
    "CHORIZO MEXICANO",
    "DISCADA NORTEÑA",
    "SALSA VERDE",
    "PICO DE GALLO",
    "LONGANIZA",
    "PAPADZUL",
    "COCHINITA PIBIL",
    "PANUCHO",
    "SALBUTE",
    "PAMBAZO",
    "TLAYUDA",
    "ENFRIJOLADAS",
    "ENMOLADAS",
    "ENTOMATADAS",
    // Chiles
    "CHILE HABANERO",
    "CHILE SERRANO",
    "CHILE POBLANO",
    "CHILE CHIPOTLE",
    "CHILE DE ÁRBOL",
    "CHILE ANCHO",
    "CHILE MULATO",
    "CHILE PASILLA",
    "CHILE GUAJILLO",
    "CHILE MORITA",
    "CHILE NEGRO",
    "CHILE MORA",
    "CHILE CASCABEL",
    "CHILE PIQUÍN",
    "CHILE MIRASOL",
    "CHILE PUYA",
    // Pan dulce
    "CONCHA",
    "CUERNITO",
    "POLVORÓN",
    "GARIBALDI",
    "COCHITO",
    "OREJA",
    "BIGOTE",
    "CUBILETE",
    "POLVORINES",
    "MANTECADA",
    "SOLETA",
    "GENDARME",
    "ALAMAR",
    "BESO",
    "PICÓN",
    // Street food y dulces
    "ELOTE ASADO",
    "ELOTE HERVIDO",
    "CHURRO",
    "ALGODÓN DE AZÚCAR",
    "NIEVE DE GARRAFA",
    "PEPINO CON CHILE",
    "RASPADO",
    "MANGONADA",
    "NIEVES DE GARRAFA",
    "CAPIROTADA",
    "SOPA DE FIDEOS",
    "ARROZ ROJO",
    "FRIJOLES DE OLLA",
    "CALDO DE POLLO",
    "CHILES EN NOGADA",
    "MOLE NEGRO",
    "PAN DE MUERTO",
    "BUÑUELO",
    "CALABAZA EN TACHA",
    "ESQUITES",
    "TOSTILOCOS",
    "TORTA AHOGADA",
    "HUARACHE",
    "CHILAQUILES",
    "ALEGRÍA",
    "COCADA",
    "PALANQUETA",
    "BORRACHITO",
    "GLORIAS",
    "MAZAPÁN",
    "CABRITO",
    "MACHACA",
    "DISCADA",
    "ASADO DE PUERCO",
    "MENUDO NORTEÑO",
    "GORDITAS",
    // Ronda 7 — sampleUnmatched prod
    "MACHACA NORTEÑA",
    "CARNITAS MICHOACANAS",
    "GORDITAS DE MAÍZ AZUL",
    "TOSTADAS DE CEVICHE",
    "PAPAS CON CHILE",
    "PESCADO A LA TALLA",
    "TAMALES CHIAPANECOS",
    "XIX",
    "PIB",
    "TAMAL",
    "POZOLE",
    "MOLE",
    "TACO",
  ].map(norm)
);

const BEBIDAS_WORDS = new Set(
  [
    "HORCHATA",
    "TEPACHE",
    "PULQUE",
    "MICHELADA",
    "CHELA",
    "MEZCAL",
    "TEQUILA",
    "ATOLE",
    "CHAMPURRADO",
    "TEJATE",
    "PISTO",
    "AGUA DE JAMAICA",
    "TEJUINO",
    "JAMAICA",
    "AGUA DE TAMARINDO",
    "AGUA FRESCA",
    "CAFÉ DE OLLA",
    "PONCHE",
    "ATOLE DE GUAYABA",
    "COLONCHE",
    "SOTOL",
    "RAICILLA",
    "BACANORA",
    "JARRITO",
    "SIDRAL",
    "SANGRÍA",
    "AGUA MINERAL",
    "MINERAGUA",
  ].map(norm)
);

const TRADICIONES_WORDS = new Set(
  [
    "GUELAGUETZA",
    "DANZA DE LOS VOLADORES",
    "VIRGEN DE GUADALUPE",
    "QUINCEAÑERA",
    "ALTAR DE MUERTOS",
    "PIÑATA DE POSADA",
    "ROSCA DE REYES",
    "CEMPASÚCHIL",
    "SERENATA",
    "DÍA DE REYES",
    "CARNAVAL DE VERACRUZ",
    "POSADAS NAVIDEÑAS",
    "DÍA DE MUERTOS",
    "CATRINA",
    "CALAVERA",
    "OFRENDA",
    "FESTIVAL CERVANTINO",
    "FERIA DE SAN MARCOS",
    "DÍA DE GUADALUPE",
    "SEMANA SANTA",
    "NOCHE DE MUERTOS",
    "FERIA DE PUEBLA",
    "FESTIVAL DE GLOBOS",
    "POSADAS",
    "AGUINALDO",
    "PASTORELA",
    "SAN JUDAS TADEO",
    "LA SANTA MUERTE",
    "CRISTO REY",
    "SAN MIGUEL ARCÁNGEL",
    "NIÑO DIOS",
    "SAN PEDRO",
    "SAN PABLO",
    "VIRGEN DE ZAPOPAN",
    "VIRGEN DE SAN JUAN",
    "VIRGEN DE JUQUILA",
    // Instrumentos musicales tradicionales
    "GUITARRÓN",
    "VIHUELA",
    "ARPA JAROCHA",
    "MARIMBA",
    "TAMBORA",
    "REQUINTO",
    "JARANA",
    "HARPA GRANDE",
    "PITO DE CARRIZO",
    "TAMBOR DE FRICCIÓN",
    "TEPONAZTLI",
    "HUEHUEHTL",
    "PENACHO",
    "AMATE",
    "GUAYABERA",
    "CALZÓN MANTA",
    "HUARACHE",
    "QUEMA DE JUDAS",
    "MAÑANITAS",
    "PEREGRINACIÓN GUADALUPANA",
    "VELORIO MEXICANO",
    "XANTOLO POTOSINO",
    "MAYORDOMÍA",
    "DANZA DEL VENADO",
    "CALENDA OAXAQUEÑA",
    "NOCHE DE MUERTOS EN PÁTZCUARO",
    "DANZA DE LOS VIEJITOS",
    "CONCHEROS",
    "DANZA DE LA PLUMA",
    "MOJIGANGAS",
    "ALEBRIJE PROCESIONAL",
    "CARNAVAL DE MAZATLÁN",
    "VALS DE QUINCEAÑERA",
    "COHETES DE FERIA",
    "NOCHE DE RÁBANOS",
    "MANDA",
    "PEDIDA DE MANO",
    "CRUZ DE MAYO",
    "VELACIÓN",
    "FIESTA DE XANTOLO",
    "BAUTIZO CATÓLICO",
    "DÍA DE LA SANTA CRUZ",
    "TAMALADA NAVIDEÑA",
    "FIESTA PATRONAL",
    "PIÑATA DE SIETE PICOS",
    "ALTAR DE DÍA DE MUERTOS",
    "CORRIDA DE TOROS",
    "CONVITE",
    "NOVENARIO",
    "TEQUIO COMUNITARIO",
    "PAPEL PICADO DE ALTAR",
    "CALAVERA LITERARIA",
    "CALAVERITA",
    "ALFOMBRA DE ASERRÍN",
    "PROCESIÓN DE SILENCIO",
    "CANDELARIA",
    "QUEMA DE CASTILLO",
    "POSADA NAVIDEÑA",
    // Ronda 7 — sampleUnmatched prod
    "VELA ISTMEÑA",
    "DANZA DE MOROS Y CRISTIANOS",
    "SEMANA SANTA EN TAXCO",
    "FERIA INTERNACIONAL DEL LIBRO DE GUADALAJARA",
    "DÍA DEL NIÑO",
    "DESFILE DEL 20 DE NOVIEMBRE",
    "FIESTA DE LA VENDIMIA",
    "DÍA DE LA MADRE",
  ].map(norm)
);

const MUSICA_ARTISTAS_WORDS = new Set(
  [
    "LOS BUKIS",
    "SELENA",
    "JENNI RIVERA",
    "CHALINO SÁNCHEZ",
    "GRUPO FIRME",
    "BANDA EL RECODO",
    "LOS YONICS",
    "LOS TIGRES DEL NORTE",
    "ALEJANDRO FERNÁNDEZ",
    "INTOCABLE",
    "PAQUITA LA DEL BARRIO",
    "RATA DE DOS PATAS",
    "VICENTE FERNÁNDEZ",
    "JUAN GABRIEL",
    "LILA DOWNS",
    "NATALIA LAFOURCADE",
    "JULIETA VENEGAS",
    "CAIFANES",
    "MANÁ",
    "MOLOTOV",
    "CAFÉ TACUBA",
    "ZOÉ",
    "EL TRI",
    "PANTEÓN ROCOCÓ",
    "DIVISIÓN DEL NORTE",
    "SANTA SABINA",
    "BRONCO",
    "LOS ÁNGELES AZULES",
    // Canciones y géneros musicales
    "DANZÓN",
    "JARABE TAPATÍO",
    "LA BAMBA",
    "BÉSAME MUCHO",
    "CIELITO LINDO",
    "TROVA YUCATECA",
    "TAMBORA SINALOENSE",
    "SON JAROCHO",
    "HUAPANGO",
    "CUMBIA MEXICANA",
    "CHILENA COSTEÑA",
    "RANCHERA",
    "CORRIDO",
    "NORTEÑO",
    "BOLERO",
    "MARIACHI",
    "BANDA",
    // Cine
    "AMORES PERROS",
    "Y TU MAMÁ TAMBIÉN",
    "ROMA",
    "GUILLERMO DEL TORO",
    "IÑÁRRITU",
    "ALFONSO CUARÓN",
    "GAEL GARCÍA BERNAL",
    "DIEGO LUNA",
    "SALMA HAYEK",
    "DOLORES DEL RÍO",
    "PEDRO INFANTE",
    "JORGE NEGRETE",
    "MARÍA FÉLIX",
    "MARIO MORENO",
    "CANTINFLAS",
    "TIN TAN",
    "VIRUTA Y CAPULINA",
    "EL INDIO FERNÁNDEZ",
    "EMILIO FERNÁNDEZ",
    "FRIDA KAHLO",
    "DIEGO RIVERA",
    // Artistas plásticos
    "OROZCO",
    "SIQUEIROS",
    "RUFINO TAMAYO",
    "LEONORA CARRINGTON",
    "REMEDIOS VARO",
    // Escritores
    "OCTAVIO PAZ",
    "JUAN RULFO",
    "ROSARIO CASTELLANOS",
    "CARLOS FUENTES",
    "ELENA PONIATOWSKA",
    "JOSÉ EMILIO PACHECO",
    "GUADALUPE NETTEL",
    "KATY JURADO",
    "PEDRO ARMENDÁRIZ",
    "CARLOS MONSIVÁIS",
    "SILVIA PINAL",
    "BAJO SEXTO",
    "VIHUELA DE MARIACHI",
    "TRÍOS ROMÁNTICOS",
    "ZAPATEADO",
    "CANCIÓN MIXTECA",
    "ASTRID HADAD",
    "VERSADA",
    "DUETO HUASTECO",
    "MARIMBA CHIAPANECA",
    "MÚSICA DE TARIMA",
    "FRANCISCO TOLEDO",
    "GABRIEL OROZCO",
    "DAMIÁN ORTEGA",
    "IGNACIO LÓPEZ TARSO",
    "FLAUTA DE BARRO",
    "PITO DE BARRO",
    "SERGIO PITOL",
    "ERNESTO ALONSO",
    "JORGE SALINAS",
    "GABRIEL FIGUEROA",
    "TINA MODOTTI",
    "BANDA DE VIENTO",
    "FANDANGO VERACRUZANO",
    "CANCIÓN DE CUNA",
    "VILLANCICO MEXICANO",
    "TOCADA NORTEÑA",
    "POLCA NORTEÑA",
    "MÚSICA GRUPERA",
    "CORRIDO NORTEÑO",
    "CANTO CARDENCHE",
    "MÚSICA TROPICAL MEXICANA",
    "NORTEÑA DE ACORDEÓN",
    "CANCIÓN RANCHERA",
    "TEPONAZTLE",
    "MAMBO MEXICANO",
    "QUEBRADITA",
    "ROCKABILLY MEXICANO",
    "SKA MEXICANO",
    "ONDA CHICANA",
    "CUARTETO DE CUERDAS POBLANO",
    "PUNTA GUATEMALTECA",
    "ZAPATEADO JAROCHO",
    "SINFONÍA INDIA",
    "JOSÉ GUADALUPE POSADA",
    "OFELIA MEDINA",
    // Ronda 7 — sampleUnmatched prod
    "BALADA ROMÁNTICA MEXICANA",
    "RAP EN NÁHUATL",
    "ELECTRÓNICA MEXICA",
    "CONTRADANZA YUCATECA",
    "PIREKUA",
    "MÚSICA PURÉPECHA",
    "PASODOBLE CHARRO",
    "JOAQUÍN PARDAVÉ",
    "SARA GARCÍA",
  ].map(norm)
);

const MONUMENTOS_WORDS = new Set(
  [
    "CHICHÉN ITZÁ",
    "POPOCATÉPETL",
    "XOCHIMILCO",
    "ZÓCALO",
    "TEOTIHUACÁN",
    "MONTE ALBÁN",
    "PALENQUE",
    "UXMAL",
    "CALAKMUL",
    "PAQUIMÉ",
    "MITLA",
    "SOUMAYA",
    "BIBLIOTECA VASCONCELOS",
    "ESTADIO AZTECA",
    "MONUMENTO A LA REVOLUCIÓN",
    "MALECÓN DE MAZATLÁN",
    "PLAZA DE LAS TRES CULTURAS",
    "GUANAJUATO",
    "SAN MIGUEL DE ALLENDE",
    "PUEBLA",
    "QUERÉTARO",
    "ZACATECAS",
    "MORELIA",
    "BELLAS ARTES",
    "ÁNGEL DE LA INDEPENDENCIA",
    "CASTILLO DE CHAPULTEPEC",
    "PALACIO NACIONAL",
    "CENOTE SAGRADO",
    "TAJÍN",
    "TULUM",
    "ISLA MUJERES",
    "CABO SAN LUCAS",
    "OAXACA",
    "TAXCO",
    "LA VENTA",
    "BONAMPAK",
    "TEMPLO MAYOR",
    "PALACIO DE BELLAS ARTES",
    "CATEDRAL METROPOLITANA",
    "TULA",
    "XOCHICALCO",
    "CHOLULA",
    "HOSPICIO CABAÑAS",
    "TORRE LATINOAMERICANA",
    "YAXCHILÁN",
    "TONINÁ",
    "EK BALAM",
    "COBÁ",
    "KOHUNLICH",
    "ACUEDUCTO DE QUERÉTARO",
    "FUERTE DE SAN JUAN DE ULÚA",
    "BIBLIOTECA PALAFOXIANA",
    "PARROQUIA DE SAN MIGUEL DE ALLENDE",
    "MUSEO FRIDA KAHLO",
    "ZONA LACUSTRE DE XOCHIMILCO",
    "CENOTE",
    "BARRANCA DEL COBRE",
    "LAGUNA DE BACALAR",
    "SELVA LACANDONA",
    "IZTACCÍHUATL",
    "EL ZÓCALO",
    "TEPITO",
    "LA MERCED",
    "WIRIKUTA",
    "EL PEDREGAL DE SAN ÁNGEL",
    "GUACHIMONTONES",
    "CAÑÓN DEL SUMIDERO",
    "MONASTERIO DE YANHUITLÁN",
    "EXPIATORIO DE GUADALAJARA",
    "PALACIO DE GOBIERNO DE JALISCO",
    "ACUEDUCTO DE MORELIA",
    "PIRÁMIDE DE CHOLULA",
    "EX CONVENTO DE ACTOPAN",
    "ZONA ARQUEOLÓGICA DE MITLA",
    "ZONA ARQUEOLÓGICA DE PAQUIMÉ",
    "CUMBRES DE MONTERREY",
    "MINA EL EDÉN",
    "EX HACIENDA DE CHAUTLA",
    "EX CONVENTO DE ACOLMAN",
    "PIRÁMIDE DE CUICUILCO",
    "ACUEDUCTO DEL PADRE TEMBLEQUE",
    "CAPILLA DEL ROSARIO",
    "CLAUSTRO",
    "CAMPANARIO",
    "SAGRARIO",
    "PALACIO MUNICIPAL DE OAXACA",
    "HACIENDA DE GOGORRÓN",
    "FARO DE COMERCIO",
    "CONVENTO DE LA SANTA CRUZ",
    "BALNEARIO DE COMANJILLA",
    "IGLESIA DE SAN JUAN CHAMULA",
    "ARCO DE LA INDEPENDENCIA DE QUERÉTARO",
    "PUENTE BALUARTE",
    "MUSEO SOUMAYA",
    "CENTRO HISTÓRICO DE OAXACA",
    "MALECÓN DE LA PAZ",
    "FUERTE DE SAN FELIPE DE BACALAR",
    // Ronda 7 — sampleUnmatched prod
    "RESERVA SIAN KA'AN",
    "LAGO DE CHAPALA",
    "CATEDRAL DE ZACATECAS",
    "GRUTAS DE CACAHUAMILPA",
    "PALACIO DE MINERÍA",
    "HACIENDA DE JARAL DE BERRIO",
    "RESERVA EL PINACATE",
    "BAHÍA DE LOS ÁNGELES",
  ].map(norm)
);

const HISTORIA_WORDS = new Set(
  [
    "BENITO JUÁREZ",
    "EMILIANO ZAPATA",
    "CUAUHTÉMOC",
    "LA INDEPENDENCIA",
    "MIGUEL HIDALGO",
    "PANCHO VILLA",
    "FRANCISCO I MADERO",
    "LÁZARO CÁRDENAS",
    "ÁLVARO OBREGÓN",
    "VENUSTIANO CARRANZA",
    "PORFIRIO DÍAZ",
    "MOCTEZUMA",
    "MOCTEZUMA II",
    "HERNÁN CORTÉS",
    "LA MALINCHE",
    "MALINCHE",
    "TLATOANI",
    "NEZAHUALCÓYOTL",
    "SOR JUANA INÉS",
    "JOSEFA ORTIZ",
    "JOSÉ MARÍA MORELOS",
    "TENOCHTITLAN",
    "HUITZILOPOCHTLI",
    "QUETZALCÓATL",
    "TLÁLOC",
    "PIEDRA DEL SOL",
    "ADELITAS",
    "CONSTITUCIÓN 1917",
    "CONSTITUCIÓN DE 1917",
    "LA NOCHE TRISTE",
    "JOSEFA ORTIZ DE DOMÍNGUEZ",
    "GRITO DE INDEPENDENCIA",
    "PLAN DE IGUALA",
    "BATALLA DE PUEBLA",
    "AGUSTÍN DE ITURBIDE",
    "MAXIMILIANO DE HABSBURGO",
    "EL PORFIRIATO",
    "TRIPLE ALIANZA",
    "LEYES DE REFORMA",
    "REFORMA AGRARIA",
    "SISMO DE 1985",
    "JOSÉ VASCONCELOS",
    "COATLICUE",
    "TLATELOLCO",
    "MOVIMIENTO ESTUDIANTIL DEL 68",
    "EZLN 1994",
    "SUBCOMANDANTE MARCOS",
    "SOLDADERAS",
    "ZAPATISMO",
    "VILLISMO",
    "TIERRA Y LIBERTAD",
    "PLAN DE AYALA",
    "INQUISICIÓN MEXICANA",
    "VIRREINATO DE NUEVA ESPAÑA",
    "TRATADO DE GUADALUPE",
    "DOS DE OCTUBRE",
    "INTERVENCIÓN FRANCESA",
    "EJÉRCITO LIBERADOR DEL SUR",
    "GUERRA CRISTERA",
    "CONSTITUCIÓN DE 1824",
    "BATALLA DE CELAYA",
    "GRITO DE DOLORES",
    "INDEPENDENCIA DE MÉXICO",
    "REVOLUCIÓN MEXICANA",
    "FRANCISCO I. MADERO",
    "VICTORIANO HUERTA",
    "EXPROPIACIÓN PETROLERA",
    "TRATADO DE LIBRE COMERCIO",
    "TERREMOTO DEL 85",
    "PUEBLO MAZAHUA",
    "GUERRA DE REFORMA",
    "TRATADO DE BUCARELI",
    "MATANZA DE ACTEAL",
    "DECENA TRÁGICA",
    "OLMECAS",
    "MAYAS",
    "MEXICAS",
    "ZAPOTECAS",
    "MIXTECOS",
    "TOLTECAS",
    // Ronda 7 — sampleUnmatched prod
    "MATRÍCULA DE TRIBUTOS",
    "FUNDACIÓN DE TENOCHTITLÁN",
    "CONQUISTA ESPIRITUAL",
    "LEY LERDO",
    "REBELIÓN DE LOS CORAS",
    "PRIMER IMPERIO MEXICANO",
    "REPÚBLICA RESTAURADA",
    "PORFIRIATO",
    "REPARTO AGRARIO CARDENISTA",
  ].map(norm)
);

const ANIMALES_WORDS = new Set(
  [
    "QUETZAL",
    "MARIPOSA MONARCA",
    "VAQUITA MARINA",
    "JAGUAR",
    "ÁGUILA REAL",
    "SERPIENTE CASCABEL",
    "CENZONTLE",
    "ARMADILLO",
    "AJOLOTE",
    "XOLOITZCUINTLE",
    "CHAPULÍN",
    "GUACAMAYA",
    "MAPACHE",
    "OCELOTE",
    "TLACUACHE",
    "COLIBRÍ",
    "MURCIÉLAGO MAGUEYERO",
    "IGUANA",
    "ZORRILLO",
    "ESCAMOLES",
    "CHINICUILES",
    "JUMILES",
    "HORMIGA CHICATANA",
    "CHAPULÍN TOSTADO",
    "GUSANO DE MAGUEY",
    "PUMA",
    "CÓNDOR",
    "COYOTE",
    "HALCÓN PEREGRINO",
    "ZORRA DEL DESIERTO",
    "BERRENDO",
    "TURIX",
    "TECOLOTE",
    "TAPIR MEXICANO",
    "MONO ARAÑA",
    "CACOMIXTLE",
    "ALACRÁN",
    "MANATÍ",
    "LUCIÉRNAGA",
    "BOA CONSTRICTOR",
    "TORTUGA CAGUAMA",
    "MONO AULLADOR",
    "MANTA RAYA",
    "LINCE MEXICANO",
    "FLAMENCO AMERICANO",
    "TARÁNTULA MEXICANA",
    "LECHUZA",
    "TEJÓN MEXICANO",
    "TEPEZCUINTLE",
    "GRULLA BLANCA",
    "PEZ BLANCO DE PÁTZCUARO",
    "PELÍCANO CAFÉ",
    "ACOCIL",
    "TORTUGA LAÚD",
    "JABALÍ DE COLLAR",
    "GORRIÓN MEXICANO",
    "GRANA COCHINILLA",
    "ESCARABAJO DE CUERNO",
    "CÓNDOR CALIFORNIANO",
    "MOSCO PINTO",
    "CUERVO",
    "CORALILLO",
    "CHACHALACA",
    "LORO CABEZA AMARILLA",
    "NUTRIA DE RÍO",
    "VENADO COLA BLANCA",
    "TEJÓN REAL",
    "CODORNIZ MOCTEZUMA",
    "TEMAZATE",
    "MURCIÉLAGO PESCADOR",
    "GALLINA DE MONTE",
    "TUCÁN PICO IRIS",
    "PATO REAL",
    "GARZA BLANCA",
    "PELÍCANO BLANCO",
    "PEZ VELA",
    "PERRITO DE LAS PRADERAS",
    "IGUANA VERDE",
    "COCODRILO DE RÍO",
    "TIBURÓN BALLENA",
    "MANATÍ DEL CARIBE",
    "VÍBORA DE CASCABEL",
    "COATÍ",
    "GUAJOLOTE",
    "TEJÓN",
    "ZOPILOTE",
    "HUEHUENTÓN",
    "MURCIÉLAGO NECTARÍVORO",
    "BORREGO CIMARRÓN",
    "SARAGUATO",
    // Ronda 7 — sampleUnmatched prod
    "GATO MONTÉS",
    "COTORRA SERRANA",
    "TORO DE LIDIA",
    "BAGRE DE RÍO",
    "TORTUGA DE CAREY",
    "ROBALO VERACRUZANO",
  ].map(norm)
);

const FLORA_WORDS = new Set(
  [
    "NOPAL",
    "MAGUEY",
    "CEIBA SAGRADA",
    "AGAVE",
    "FLOR DE NOCHEBUENA",
    "FLOR DE DALIA",
    "FLOR DE CACAO",
    "FLOR DE VAINILLA",
    "FLOR DE MAGUEY",
    "EPAZOTE",
    "CILANTRO",
    "HIERBA SANTA",
    "ACHIOTE",
    "ORÉGANO MEXICANO",
    "MANZANILLA",
    "MEZQUITE",
    "CHICOZAPOTE",
    "PITAYA",
    "TEJOCOTE",
    "CHAYA",
    "PEYOTE",
    "ÁRBOL DEL TULE",
    "BIZNAGA",
    "CAPULÍN MEXICANO",
    "CAPULÍN",
    "GUANÁBANA",
    "NANCE",
    "OCOTE",
    "HUIZACHE",
    "COLORÍN",
    "PALMA REAL",
    "ZAPOTE NEGRO",
    "LECHUGUILLA",
    "CEDRO ROJO",
    "POCHOTE",
    "VERDOLAGA",
    "QUELITE",
    "QUINTONIL",
    "CAOBA MEXICANA",
    "GUAYACÁN",
    "PALO FIERRO",
    "MAGUEY CENIZO",
    "ZAPOTE BLANCO",
    "CHACAH",
    "MAGUEY PULQUERO",
    "PIRÚL",
    "ÁRBOL DE HULE",
    "NOPAL TUNERO",
    "PALMA DE COCO",
    "MUSGO DE ENCINO",
    "NANCHE",
    "TEPEGUAJE",
    "CAOBA",
    "RAMÓN",
    "CUACHALALATE",
    "TULE",
    "TASISTE",
    "FLOR DE IZOTE",
    "BONETE",
    "SALVIA MEXICANA",
    "ACAHUAL",
    "IZOTE",
    "GUAMÚCHIL",
    "TEPEHUAJE",
    "CHACA ROJA",
    "JACARANDA",
    "LAUREL DE INDIA",
    "PLATANILLO",
    "PITAHAYA",
    "XOCONOSTLE",
    "CHICALOTE",
    "TORONJIL",
    "GUAYABO",
    // Ronda 7 — sampleUnmatched prod
    "SEMILLA DE CHÍA",
    "ARRAYÁN",
    "CACHANILLA",
    "JOBO",
  ].map(norm)
);

const JUEGOS_WORDS = new Set(
  [
    "PAPALOTE",
    "YOYO",
    "MATATENA",
    "LOTERÍA",
    "TROMPO",
    "BALERO",
    "CANICAS",
    "PIRINOLA",
    "SERPIENTES Y ESCALERAS",
    "RAYUELA",
    "STOP",
    "ENCANTADOS",
    "LA VÍBORA DE LA MAR",
    "LA ROÑA",
    "BURRO CASTIGADO",
    "DOÑA BLANCA",
    "A LAS ESCONDIDAS",
    "EL PATIO DE MI CASA",
    "LAS ESTATUAS",
    "EL AVIONCITO",
    "POLICÍAS Y LADRONES",
    "FUTBOLITO",
    "DOMINÓ",
    "AJEDREZ",
    "JENGA",
    "UNO",
    "LOTERÍA MODERNA",
    "CONQUIÁN",
    "BRINCAR LA CUERDA",
    "QUEMADOS",
    "KERMÉS",
    "EL AVIÓN",
    "CARRERA DE SACOS",
    "TAZOS",
    "ROMPECABEZAS",
    "AVIONCITO DE PAPEL",
    "SAN SERAFÍN",
    "LAS ESTATUAS DE MARFIL",
    "EL FLORÓN",
    "MATARILE",
    "CABALLITO DE MADERA",
    "TIRO AL BLANCO",
    "JUEGO DE ARGOLLAS",
    "DAMAS CHINAS",
    "BARAJA ESPAÑOLA",
    "CONCURSO DE PIÑATA",
    "JUEGO DE NAIPES",
    "FERIA DE LA ESCUELA",
    "JUEGO DE TALLA",
    "AJEDREZ AZTECA",
    "EL TELÉFONO DESCOMPUESTO",
    "MEMORAMA",
    "EL CARTERO",
    "ZANCOS",
    "LA COLA DEL DIABLO",
    "VOLIBOL PLAYERO",
    "CHAPAS",
    "CINTURÓN ESCONDIDO",
    "CASCARITA",
    "EL LOBO",
    "PALO ENCEBADO",
    "CORRIDA DE CINTAS",
    "EL LAZARILLO",
    "AVIONCITO",
    "RONDA INFANTIL",
    "EL REY MANDA",
    "TUMBA LA LATA",
    "LOTERÍA MEXICANA",
    "EL BOTE PATEADO",
    "AJEDREZ CALLEJERO",
    "CARRERA DE COSTALES",
    "JUEGO DEL PAÑUELO",
    "KERMÉS ESCOLAR",
    "ESTATUAS DE MARFIL",
    "ROÑA",
    "SIETE PECADOS",
    "VEINTIUNO",
    "EL GATO",
    "LA ROÑA DE AGUA",
    "SALTAR LA CUERDA",
    "MATA GENTE",
    "PULPO",
    // Ronda 7 — sampleUnmatched prod
    "CRUCIGRAMA",
    "SOPA DE LETRAS",
    "LABERINTO DE PAPEL",
    "TANGRAM",
    "TURISTA",
    "METRAS",
    "BINGO POPULAR",
    "JUEGO DE MANOS",
  ].map(norm)
);

const CULTURA_POPULAR_WORDS = new Set(
  [
    "CHESPIRITO",
    "EL CHAVO DEL 8",
    "EL CHAPULÍN COLORADO",
    "LA CHILINDRINA",
    "DON RAMÓN",
    "CHABELO",
    "KALIMÁN",
    "MEMÍN PINGUÍN",
    "LA FAMILIA BURRÓN",
    "EL PAYO",
    "FANTOMAS",
    "CHANOC",
    "BOROLA TACUCHE",
    "HERMELINDA LINDA",
    // Telenovelas
    "THALÍA",
    "VERÓNICA CASTRO",
    "LUCÍA MÉNDEZ",
    "MARÍA SORTÉ",
    "ANGÉLICA RIVERA",
    "BÁRBARA MORI",
    "CHRISTIAN BACH",
    "LOS RICOS TAMBIÉN LLORAN",
    "CUNA DE LOBOS",
    "ROSA SALVAJE",
    "MARÍA LA DEL BARRIO",
    "REBELDE",
    "LA USURPADORA",
    "MUNDO DE FIERAS",
    "CAMILA",
    "ACAPULCO CUERPO Y ALMA",
  ].map(norm)
);

const ALBURES_WORDS = new Set(
  [
    "PUTIZA",
    "FREGÓN",
    "ENCABRONADO",
    "CHINGAQUEDITO",
    "CHINGAR",
    "MÉNDIGO",
    "CABRÓN",
    "NO MAMES",
    "PINCHE",
    "PENDEJO",
    "CULERO",
    "VERGA",
    "CHINGADERA",
    "MADRAZO",
    "MADRIZA",
    "EL REY DE LA MONTAÑA",
    "LA CARRETILLA",
  ].map(norm)
);

const MUNDO_DIGITAL_WORDS = new Set(
  [
    "CANCELADO",
    "FUNAR",
    "STALKEAR",
    "CRUSH",
    "MEME",
    "TROLEAR",
    "SHIPPEAR",
    "GHOSTEAR",
    "BAITEAR",
    "HATER",
    "INFLUENCER",
    "TIKTOKER",
    "POSTEAR",
    "SUBIRSE AL TREN",
    "ESTAR VIRAL",
  ].map(norm)
);

const REFRANES_WORDS = new Set(
  [
    "AL QUE MADRUGA",
    "CAMARÓN QUE SE DUERME",
    "EL QUE CON LOBOS ANDA",
    "MÁS VALE TARDE",
    "EN BOCA CERRADA",
    "NO HAY MAL QUE DURE",
    "A CABALLO REGALADO",
    "DIME CON QUIÉN ANDAS",
    "EL QUE RÍE AL ÚLTIMO",
    "MÁS VALE PÁJARO EN MANO",
    "OJOS QUE NO VEN",
    "EL QUE NO TRANZA",
    "AL BUEN ENTENDEDOR",
    "CADA QUIEN SU CADA CUAL",
    "EL QUE A HIERRO MATA",
    "NO POR MUCHO MADRUGAR",
    "TANTO VA EL CÁNTARO",
    "CARAS VEMOS",
    "A PALABRAS NECIAS",
    "EL MUERTO AL POZO",
    // Ronda 7 — sampleUnmatched prod
    "MANDAR AL DIABLO",
    "TENER EL SARTÉN POR EL MANGO",
    "ESTAR EN LAS ÚLTIMAS",
    "COSTAR UN OJO DE LA CARA",
    "NO DAR PIE CON BOLA",
  ].map(norm)
);

const LEYENDAS_WORDS = new Set(
  [
    "LA LLORONA",
    "NAGUAL",
    "CHANEQUE",
    "ALUX",
    "EL CHARRO NEGRO",
    "LA CIGUANABA",
    "EL CUCUY",
    "CIPITÍO",
    "EL SILBÓN",
    "EL CADEJO",
    "EL DESCABEZADO",
    "LA PLANCHADA",
    "EL JINETE SIN CABEZA",
    "TEPEYAC",
    "EL BASILISCO",
    "LA TULIVIEJA",
  ].map(norm)
);

// ── Clasificador por patrones de significado ─────────────────────────────────

function classifyByMeaning(meaning: string, _word: string): string | null {
  const m = normLow(meaning);

  // Vida Cotidiana — transporte, escuela, objetos cotidianos
  if (
    /(transporte publico|camion urbano|autobus urbano|microbus|bicicleta taxi|trolebus|utiles escolares|recreo|escolta escolar|cooperativa escolar|libro de texto gratuito|lonchera)/.test(
      m
    )
  )
    return "Vida Cotidiana";

  // Remedios Caseros
  if (
    /(remedio casero|medicina tradicional|remedio de la abuela|ungüento|pomada para|hierba medicinal|planta medicinal|curar con)/.test(
      m
    )
  )
    return "Remedios Caseros";

  // Artesanías de México
  if (
    /(artesania|artesano|ceramica .+ (oaxaca|puebla|jalisco|michoacan)|barro .+ (negro|pintado)|talavera|alebrije|bordado|tejido a mano|telar de cintura)/.test(
      m
    )
  )
    return "Artesanías de México";

  // Deportes Mexicanos — lucha libre, charrería, deportes
  if (
    /(luchador mexicano|lucha libre|mascara de|ring de|arena de lucha|charrer|charro que|jinete|beisbol .+ (norte|sonora|sinaloa)|boxeador mexicano|atletismo mexicano|pelota (mixteca|purepecha|mesoamericana))/.test(
      m
    )
  )
    return "Deportes Mexicanos";

  // Bebidas
  if (
    /(bebida|beber|agua de |infusion|te de |cerveza con|fermentada del|fermentado de|destilado|licor de|mezcal|tequila|aguardiente|se toma|se bebe|preparada con)/.test(
      m
    )
  )
    return "Bebidas";

  // Comida Mexicana
  if (
    /(chile .+seco|chile .+picante|chile .+verde|pan dulce|pan de |galleta|postre de|dulce de|helado|nieves|nieve de|raspado|antojito|platillo|guiso de|caldo de|sopa de|arroz|frijoles|enchiladas|tacos de|tamales de|torta de|salsa .+mexican|fruta .+mexico|ingrediente|cocina mexicana|se prepara con|se cocina|comida tipica|receta)/.test(
      m
    )
  )
    return "Comida Mexicana";

  // Refranes y Dichos
  if (
    /(refran|dicho popular|dicho mexicano|proverbio|frase hecha|dice el refran)/.test(
      m
    )
  )
    return "Refranes y Dichos";

  // Tradiciones y Fiestas
  if (
    /(festival de|feria de|feria nacional|danza tradicional|baile tradicional|traje tipico|vestimenta tipica|prenda tipica|instrumento de|instrumento musical del mariachi|instrumento de percusion|ritual|ceremonia prehispanica|piedra .+moler|estera|santo patrono|virgen de|patron de|fiesta patronal)/.test(
      m
    )
  )
    return "Tradiciones y Fiestas";

  // Historia de México
  if (
    /(presidente de mexico|heroe de |lider de la revolucion|padre de la independencia|madre de la independencia|reformador|tlatoani|conquistador|virreina|virrey|civilizacion prehispanica|cultura prehispanica|pueblo mesoamericano|batalla de|plan de .+(iguala|ayutla|guadalupe)|grito de|tratado de|constitucion de|guerra de|reforma .+mexico|independencia .+mexico|revolucion .+mexico|epoca colonial|insurgente|caudillo)/.test(
      m
    )
  )
    return "Historia de México";

  // Leyendas y Mitos
  if (
    /(espiritu de|fantasma|ser mitologico|ser sobrenatural|leyenda urbana|leyenda de|criatura mitica|brujo|bruja que)/.test(
      m
    )
  )
    return "Leyendas y Mitos";

  // Música y Artistas
  if (
    /(directora? mexicana?|directora? de (cine|pelicula)|pelicula mexicana|ganadora? del oscar|cineasta|pintor|pintora|muralista|escultor|escritor|novelista|poeta|compositor|cancion mexicana|cancion emblematica|genero musical|baile .+mexicano|danza .+mexicana|ritmo .+mexicano|musica .+mexicana|estilo musical)/.test(
      m
    )
  )
    return "Música y Artistas";
  if (
    /(cantante de|banda de|grupo de|agrupacion de|cumbia|corrido|norteno|ranchera|reina del|rey del|diva de|vocalista de|interprete de|bolero|son |danzon|trova|huapango|mariachi)/.test(
      m
    ) &&
    !/(deporte|boxeo|beisbol)/.test(m)
  )
    return "Música y Artistas";

  // Cultura Popular — telenovelas, cómics, personajes
  if (
    /(actriz de telenovela|actor de telenovela|epoca dorada de telenovela|iconica de telenovela)/.test(
      m
    )
  )
    return "Cultura Popular";
  if (
    /(comic mexicano|personaje de comic|personaje iconico de la television|personaje de television|comediante mexicano|titiritero)/.test(
      m
    )
  )
    return "Cultura Popular";

  // Animales de México
  if (
    /(animal .+(mexicano|endemico|mexico)|ave .+(mexicana|mexico)|reptil .+mexico|anfibio|insecto .+comestible|mamifero .+mexico|especie .+peligro|tortuga .+(marina|mexico)|pez .+(mexicano|mexico|dulce)|mono .+mexico|crustaceo|primate|roedor .+mexico|felino .+mexico|aguila|halcon|buho|lechuza|tecolote|grulla|pelicano|jabali)/.test(
      m
    )
  )
    return "Animales de México";

  // Flora Mexicana
  if (
    /(planta .+(mexicana|mexico)|flor .+(mexicana|mexico)|arbol .+(mexicano|sagrado|mexico)|cactus|cacto|suculenta .+mexico|fruto .+tropical|fruta .+mexico|arbusto|madera .+mexico|resina|copal)/.test(
      m
    )
  )
    return "Flora Mexicana";

  // Monumentos y Lugares
  if (
    /(zona arqueologica|sitio arqueologico|piramide de|templo de|museo de|museo nacional|palacio de|monumento .+(historico|nacional)|playa .+mexico|ciudad colonial|pueblo magico|catedral de|basilica de|edificio historico|centro historico|ruinas de|fuerte de|castillo de)/.test(
      m
    )
  )
    return "Monumentos y Lugares";

  // Mundo Digital
  if (
    /(red social|redes sociales|internet|youtuber|influencer|streamer|videojuego|gamer|meme|viral|tendencia digital)/.test(
      m
    )
  )
    return "Mundo Digital";

  // Albures y Picaresca
  if (
    /(albur|picardia|doble sentido|groserias?|vulgar|obscen|insulto mexicano|palabra altisonante)/.test(
      m
    )
  )
    return "Albures y Picaresca";

  // Juegos y Niñez
  if (
    /(juego infantil|juego de ninos|juego tradicional|juego de mesa|juguete|jugar en la calle|ronda infantil|cancion infantil|juego de patio|juego de feria|se juega con)/.test(
      m
    )
  )
    return "Juegos y Niñez";

  return null;
}

// ── Clasificador principal ───────────────────────────────────────────────────

function getNewCategory(
  word: string,
  meaning: string,
  _currentCat: string
): string | null {
  const n = norm(word);

  // 4 categorías nuevas primero
  if (VIDA_COTIDIANA_WORDS.has(n)) return "Vida Cotidiana";
  if (REMEDIOS_CASEROS_WORDS.has(n)) return "Remedios Caseros";
  if (ARTESANIAS_WORDS.has(n)) return "Artesanías de México";
  if (DEPORTES_MEXICANOS_WORDS.has(n)) return "Deportes Mexicanos";

  // Categorías existentes
  if (BEBIDAS_WORDS.has(n)) return "Bebidas";
  if (COMIDA_WORDS.has(n)) return "Comida Mexicana";
  if (REFRANES_WORDS.has(n)) return "Refranes y Dichos";
  if (TRADICIONES_WORDS.has(n)) return "Tradiciones y Fiestas";
  if (HISTORIA_WORDS.has(n)) return "Historia de México";
  if (LEYENDAS_WORDS.has(n)) return "Leyendas y Mitos";
  if (MUSICA_ARTISTAS_WORDS.has(n)) return "Música y Artistas";
  if (CULTURA_POPULAR_WORDS.has(n)) return "Cultura Popular";
  if (MONUMENTOS_WORDS.has(n)) return "Monumentos y Lugares";
  if (ANIMALES_WORDS.has(n)) return "Animales de México";
  if (FLORA_WORDS.has(n)) return "Flora Mexicana";
  if (JUEGOS_WORDS.has(n)) return "Juegos y Niñez";
  if (ALBURES_WORDS.has(n)) return "Albures y Picaresca";
  if (MUNDO_DIGITAL_WORDS.has(n)) return "Mundo Digital";

  // Fallback por significado
  return classifyByMeaning(meaning, word);
}

// ── Mapa de nombres viejos → canónicos ───────────────────────────────────────

const OLD_TO_CANONICAL: Record<string, string> = {
  "Modismos":    "Expresiones y Modismos",
  "Expresiones": "Expresiones y Modismos",
  "Comida":      "Comida Mexicana",
  "Juegos":      "Juegos y Niñez",
  "Bebida":      "Bebidas",
  "Animales":    "Animales de México",
  "Plantas":     "Flora Mexicana",
  "Música":      "Música y Artistas",
  "Artistas":    "Música y Artistas",
  "Monumentos":  "Monumentos y Lugares",
  "Historia":    "Historia de México",
  "Albures":     "Albures y Picaresca",
  "Leyendas":    "Leyendas y Mitos",
  "Digital":     "Mundo Digital",
  "Refranes":    "Refranes y Dichos",
  "Tradiciones": "Tradiciones y Fiestas",
  "Jerga":       "Expresiones y Modismos",
};

// Nombres que cuentan como "Modismos" (fuente de reclasificación)
const MODISMO_NAMES = new Set([
  "Modismos",
  "Expresiones",
  "Expresiones y Modismos",
  "Jerga",
]);

// ══════════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * TODO-EN-UNO: Reclasifica modismos + renombra categorias viejas.
 * Una sola mutación, una sola transacción.
 *
 * Ejecutar: reclassifyModismos:migrateAll
 */
export const migrateAll = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();

    const moved: Record<string, number> = {};
    const renamed: Record<string, number> = {};
    let movedCount = 0;
    let renamedCount = 0;
    const sampleUnmatched: string[] = [];

    // PASO 1: Reclasificar palabras de Modismos a categorias correctas
    for (const w of allWords) {
      const cat = (w as any).category ?? "";
      if (!MODISMO_NAMES.has(cat)) continue;

      const newCat = getNewCategory(w.word, (w as any).meaning ?? "", cat);
      if (newCat && !MODISMO_NAMES.has(newCat)) {
        await ctx.db.patch(w._id, { category: newCat } as any);
        const key = newCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        moved[key] = (moved[key] ?? 0) + 1;
        movedCount++;
      } else {
        // No match — rename to canonical and track sample
        const canonical = OLD_TO_CANONICAL[cat];
        if (canonical && canonical !== cat) {
          await ctx.db.patch(w._id, { category: canonical } as any);
          renamedCount++;
        }
        if (sampleUnmatched.length < 200) {
          sampleUnmatched.push(w.word);
        }
      }
    }

    // PASO 2: Renombrar otras categorias viejas (no-modismos)
    for (const w of allWords) {
      const cat = (w as any).category ?? "";
      if (MODISMO_NAMES.has(cat)) continue; // ya procesado arriba
      const canonical = OLD_TO_CANONICAL[cat];
      if (canonical && canonical !== cat) {
        await ctx.db.patch(w._id, { category: canonical } as any);
        const key = cat.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        renamed[key] = (renamed[key] ?? 0) + 1;
        renamedCount++;
      }
    }

    return {
      movedFromModismos: movedCount,
      renamedOldCategories: renamedCount,
      breakdown: moved,
      renamedBreakdown: renamed,
      sampleUnmatched,
    };
  },
});

/**
 * Query de auditoria: muestra cuantas palabras hay en cada categoria.
 */
export const auditCategories = query({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const counts: Record<string, number> = {};

    for (const w of allWords) {
      const cat = (w as any).category || "Expresiones y Modismos";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    return {
      totalWords: allWords.length,
      totalCategories: sorted.length,
      categories: sorted,
    };
  },
});

/**
 * Elimina palabras duplicadas. Mantiene la que tiene nivel asignado.
 * Si ninguna tiene nivel, mantiene la primera.
 *
 * Ejecutar: reclassifyModismos:removeDuplicates
 */
export const removeDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const allLevels = await ctx.db.query("levels").collect();

    // IDs de words que tienen un level apuntando
    const wordIdsWithLevel = new Set(allLevels.map((l) => l.wordId.toString()));

    // Agrupar por palabra normalizada
    const groups = new Map<string, typeof allWords>();
    for (const w of allWords) {
      const key = norm(w.word);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(w);
    }

    // Mapa wordId → levels que apuntan a él
    const levelsByWord = new Map<string, typeof allLevels>();
    for (const l of allLevels) {
      const wid = l.wordId.toString();
      if (!levelsByWord.has(wid)) levelsByWord.set(wid, []);
      levelsByWord.get(wid)!.push(l);
    }

    let deletedWords = 0;
    let deletedLevels = 0;
    const samples: string[] = [];

    for (const [key, entries] of groups) {
      if (entries.length <= 1) continue;

      // Mantener la primera copia, borrar el resto
      const keep = entries[0];

      for (let i = 1; i < entries.length; i++) {
        const dup = entries[i];
        // Borrar los niveles que apuntan a esta copia duplicada
        const dupLevels = levelsByWord.get(dup._id.toString()) ?? [];
        for (const lvl of dupLevels) {
          await ctx.db.delete(lvl._id);
          deletedLevels++;
        }
        // Borrar la palabra duplicada
        await ctx.db.delete(dup._id);
        deletedWords++;
      }

      if (samples.length < 20) {
        samples.push(`${key}: kept 1, removed ${entries.length - 1}`);
      }
    }

    return { deletedWords, deletedLevels, samples };
  },
});

/**
 * Detecta palabras duplicadas en la tabla words.
 */
export const findDuplicates = query({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const seen = new Map<string, Array<{ id: string; category: string }>>();

    for (const w of allWords) {
      const key = norm(w.word);
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push({
        id: w._id.toString(),
        category: (w as any).category ?? "",
      });
    }

    const duplicates: Array<{ word: string; count: number; entries: Array<{ id: string; category: string }> }> = [];
    for (const [key, entries] of seen) {
      if (entries.length > 1) {
        duplicates.push({ word: key, count: entries.length, entries });
      }
    }

    return {
      totalWords: allWords.length,
      uniqueWords: seen.size,
      duplicateCount: duplicates.length,
      duplicates: duplicates.slice(0, 50),
    };
  },
});
