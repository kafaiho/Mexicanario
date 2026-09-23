import { mutation, query, internalMutation } from "./_generated/server";
import { NEW_WORDS } from "./seedWords1000";

/**
 * Migración definitiva: aplica las categorías correctas del seedWords1000
 * y otros seed files a TODAS las palabras en la DB.
 *
 * Paso 1: Correr fixProductionCategories:audit para ver el estado
 * Paso 2: Correr fixProductionCategories:fix para aplicar las categorías
 */

// ── Normalización ────────────────────────────────────────────────────────────
const norm = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['\u2019]/g, "");

// ── Palabras curadas (de seedCuratedLevels.ts) ───────────────────────────────
const CURATED: Array<{ word: string; category: string }> = [
  { word: "Taco", category: "Comida Mexicana" },
  { word: "Wey", category: "Expresiones y Modismos" },
  { word: "Chido", category: "Expresiones y Modismos" },
  { word: "No manches", category: "Expresiones y Modismos" },
  { word: "Órale", category: "Expresiones y Modismos" },
  { word: "Ahorita", category: "Expresiones y Modismos" },
  { word: "Carnal", category: "Expresiones y Modismos" },
  { word: "Chamoy", category: "Comida Mexicana" },
  { word: "Aguacate", category: "Comida Mexicana" },
  { word: "Tamal", category: "Comida Mexicana" },
  { word: "La víbora de la mar", category: "Juegos y Niñez" },
  { word: "La roña", category: "Juegos y Niñez" },
  { word: "Burro castigado", category: "Juegos y Niñez" },
  { word: "Doña Blanca", category: "Juegos y Niñez" },
  { word: "A las escondidas", category: "Juegos y Niñez" },
  { word: "Pedro Infante", category: "Música y Artistas" },
  { word: "Chavela Vargas", category: "Música y Artistas" },
  { word: "José Alfredo Jiménez", category: "Música y Artistas" },
  { word: "Lila Downs", category: "Música y Artistas" },
  { word: "Juan Gabriel", category: "Música y Artistas" },
  { word: "Vicente Fernández", category: "Música y Artistas" },
  { word: "Ocelote", category: "Animales de México" },
  { word: "Tlacuache", category: "Animales de México" },
  { word: "Colibrí", category: "Animales de México" },
  { word: "Murciélago magueyero", category: "Animales de México" },
  { word: "Iguana", category: "Animales de México" },
  { word: "Zorrillo", category: "Animales de México" },
  { word: "Orozco", category: "Música y Artistas" },
  { word: "Siqueiros", category: "Música y Artistas" },
  { word: "Rufino Tamayo", category: "Música y Artistas" },
  { word: "Leonora Carrington", category: "Música y Artistas" },
  { word: "Remedios Varo", category: "Música y Artistas" },
  { word: "Octavio Paz", category: "Música y Artistas" },
  { word: "Monte Albán", category: "Monumentos y Lugares" },
  { word: "Palenque", category: "Monumentos y Lugares" },
  { word: "Uxmal", category: "Monumentos y Lugares" },
  { word: "Calakmul", category: "Monumentos y Lugares" },
  { word: "Paquimé", category: "Monumentos y Lugares" },
  { word: "Mitla", category: "Monumentos y Lugares" },
  // seedCuratedLevels patchCuratedCategories extra
  { word: "Trompo", category: "Juegos y Niñez" },
  { word: "Balero", category: "Juegos y Niñez" },
  { word: "Lotería", category: "Juegos y Niñez" },
  { word: "Canicas", category: "Juegos y Niñez" },
  { word: "Pirinola", category: "Juegos y Niñez" },
  { word: "Serpientes y Escaleras", category: "Juegos y Niñez" },
  { word: "Rayuela", category: "Juegos y Niñez" },
  { word: "Basta", category: "Juegos y Niñez" },
  { word: "Encantados", category: "Juegos y Niñez" },
  { word: "Mariachi", category: "Música y Artistas" },
  { word: "Ranchera", category: "Música y Artistas" },
  { word: "Corrido", category: "Música y Artistas" },
  { word: "Banda", category: "Música y Artistas" },
  { word: "Cumbia mexicana", category: "Música y Artistas" },
  { word: "Son jarocho", category: "Música y Artistas" },
  { word: "Huapango", category: "Música y Artistas" },
  { word: "Bolero", category: "Música y Artistas" },
  { word: "Norteño", category: "Música y Artistas" },
  { word: "Chilena costeña", category: "Música y Artistas" },
  { word: "Jaguar", category: "Animales de México" },
  { word: "Águila real", category: "Animales de México" },
  { word: "Serpiente cascabel", category: "Animales de México" },
  { word: "Cenzontle", category: "Animales de México" },
  { word: "Armadillo", category: "Animales de México" },
  { word: "Ajolote", category: "Animales de México" },
  { word: "Xoloitzcuintle", category: "Animales de México" },
  { word: "Chapulín", category: "Animales de México" },
  { word: "Guacamaya", category: "Animales de México" },
  { word: "Mapache", category: "Animales de México" },
  { word: "Chichén Itzá", category: "Monumentos y Lugares" },
  { word: "Teotihuacán", category: "Monumentos y Lugares" },
  { word: "Diego Rivera", category: "Música y Artistas" },
  { word: "Frida Kahlo", category: "Música y Artistas" },
  { word: "Cantinflas", category: "Música y Artistas" },
  { word: "María Félix", category: "Música y Artistas" },
  { word: "Agave", category: "Flora Mexicana" },
  { word: "Flor de nochebuena", category: "Flora Mexicana" },
  { word: "Flor de dalia", category: "Flora Mexicana" },
  { word: "Flor de cacao", category: "Flora Mexicana" },
  { word: "Flor de vainilla", category: "Flora Mexicana" },
  { word: "Flor de maguey", category: "Flora Mexicana" },
  { word: "Epazote", category: "Flora Mexicana" },
  { word: "Cilantro", category: "Flora Mexicana" },
  { word: "Hierba santa", category: "Flora Mexicana" },
  { word: "Pozole", category: "Comida Mexicana" },
  { word: "Mole", category: "Comida Mexicana" },
  { word: "Tlayuda", category: "Comida Mexicana" },
  { word: "Pan de muerto", category: "Comida Mexicana" },
  { word: "Atole", category: "Comida Mexicana" },
  { word: "Champurrado", category: "Comida Mexicana" },
  { word: "Esquites", category: "Comida Mexicana" },
  { word: "Tostilocos", category: "Comida Mexicana" },
  { word: "Pambazo", category: "Comida Mexicana" },
  { word: "Torta ahogada", category: "Comida Mexicana" },
  { word: "Huarache", category: "Comida Mexicana" },
  { word: "Chilaquiles", category: "Comida Mexicana" },
  { word: "Buñuelo", category: "Comida Mexicana" },
];

// ── Cultura Digital (de seedCulturaDigital*.ts) ──────────────────────────────
const CULTURA_DIGITAL: Array<{ word: string; category: string }> = [
  { word: "Peso Pluma", category: "Música y Artistas" },
  { word: "Feid", category: "Música y Artistas" },
  { word: "El Mariana", category: "Mundo Digital" },
  { word: "Luisito Comunica", category: "Mundo Digital" },
  { word: "Quackity", category: "Mundo Digital" },
  { word: "Ibai Llanos", category: "Mundo Digital" },
  { word: "La Velada", category: "Mundo Digital" },
  { word: "Alana Flores", category: "Mundo Digital" },
  { word: "Grupo Frontera", category: "Música y Artistas" },
  { word: "Banda MS", category: "Música y Artistas" },
  { word: "Carin Leon", category: "Música y Artistas" },
  { word: "Christian Nodal", category: "Música y Artistas" },
  { word: "El Rubius", category: "Mundo Digital" },
  { word: "Auronplay", category: "Mundo Digital" },
  { word: "TheGrefg", category: "Mundo Digital" },
  { word: "Spreen", category: "Mundo Digital" },
  { word: "Rivers", category: "Mundo Digital" },
  { word: "Kenai", category: "Mundo Digital" },
  { word: "Eden Muñoz", category: "Música y Artistas" },
  { word: "Calibre 50", category: "Música y Artistas" },
  { word: "Yahritza y su Esencia", category: "Música y Artistas" },
  { word: "Los Dos Carnales", category: "Música y Artistas" },
  { word: "Xavi", category: "Música y Artistas" },
  { word: "Grupo Sombra", category: "Música y Artistas" },
  { word: "Lupillo Rivera", category: "Música y Artistas" },
];

// ── Palabras de levels.ts (priorityWords + newWords15to18) ───────────────────
// Estas se insertaron en MAYÚSCULAS y SIN category
const LEVELS_WORDS: Array<{ word: string; category: string }> = [
  // Nivel 17 - Dulces mexicanos
  { word: "Alegría", category: "Comida Mexicana" },
  { word: "Cocada", category: "Comida Mexicana" },
  { word: "Palanqueta", category: "Comida Mexicana" },
  { word: "Borrachito", category: "Comida Mexicana" },
  { word: "Glorias", category: "Comida Mexicana" },
  { word: "Mazapán", category: "Comida Mexicana" },
  { word: "Calabaza en tacha", category: "Comida Mexicana" },
  // Nivel 15 - Historia
  { word: "Francisco I Madero", category: "Historia de México" },
  { word: "Venustiano Carranza", category: "Historia de México" },
  { word: "Álvaro Obregón", category: "Historia de México" },
  { word: "Lázaro Cárdenas", category: "Historia de México" },
  { word: "Porfirio Díaz", category: "Historia de México" },
  { word: "Constitución 1917", category: "Historia de México" },
  // Nivel 18 - Juegos de cantos
  { word: "La viborita de la mar", category: "Juegos y Niñez" },
  { word: "El patio de mi casa", category: "Juegos y Niñez" },
  { word: "Las estatuas", category: "Juegos y Niñez" },
  { word: "El avioncito", category: "Juegos y Niñez" },
  { word: "Policías y ladrones", category: "Juegos y Niñez" },
  // Nivel 16 - Plantas
  { word: "Achiote", category: "Flora Mexicana" },
  { word: "Orégano mexicano", category: "Flora Mexicana" },
  { word: "Manzanilla", category: "Flora Mexicana" },
  // Artistas extras
  { word: "Pedro Armendáriz", category: "Música y Artistas" },
  { word: "Dolores del Río", category: "Música y Artistas" },
  { word: "Jorge Negrete", category: "Música y Artistas" },
  { word: "Katy Jurado", category: "Música y Artistas" },
  { word: "Juan Rulfo", category: "Música y Artistas" },
  { word: "Rosario Castellanos", category: "Música y Artistas" },
  { word: "Carlos Fuentes", category: "Música y Artistas" },
  { word: "Elena Poniatowska", category: "Música y Artistas" },
  { word: "José Emilio Pacheco", category: "Música y Artistas" },
  { word: "Guadalupe Nettel", category: "Música y Artistas" },
  // Monumentos extras
  { word: "Soumaya", category: "Monumentos y Lugares" },
  { word: "Biblioteca Vasconcelos", category: "Monumentos y Lugares" },
  { word: "Estadio Azteca", category: "Monumentos y Lugares" },
  { word: "Monumento a la Revolución", category: "Monumentos y Lugares" },
  { word: "Malecón de Mazatlán", category: "Monumentos y Lugares" },
  { word: "Plaza de las tres culturas", category: "Monumentos y Lugares" },
  { word: "Guanajuato", category: "Monumentos y Lugares" },
  { word: "San Miguel de Allende", category: "Monumentos y Lugares" },
  { word: "Puebla", category: "Monumentos y Lugares" },
  { word: "Querétaro", category: "Monumentos y Lugares" },
  { word: "Zacatecas", category: "Monumentos y Lugares" },
  { word: "Morelia", category: "Monumentos y Lugares" },
  // Insectos comestibles → Animales
  { word: "Escamoles", category: "Animales de México" },
  { word: "Chinicuiles", category: "Animales de México" },
  { word: "Jumiles", category: "Animales de México" },
  { word: "Hormiga chicatana", category: "Animales de México" },
  { word: "Chapulín tostado", category: "Animales de México" },
  { word: "Gusano de maguey", category: "Animales de México" },
  { word: "Halcón", category: "Animales de México" },
  { word: "Turix", category: "Animales de México" },
  { word: "Puma", category: "Animales de México" },
  { word: "Cóndor", category: "Animales de México" },
  { word: "Halcón peregrino", category: "Animales de México" },
  { word: "Zorra del desierto", category: "Animales de México" },
  { word: "Berrendo", category: "Animales de México" },
  // Comida extras
  { word: "Cabrito", category: "Comida Mexicana" },
  { word: "Machaca", category: "Comida Mexicana" },
  { word: "Discada", category: "Comida Mexicana" },
  { word: "Asado de puerco", category: "Comida Mexicana" },
  { word: "Menudo norteño", category: "Comida Mexicana" },
  { word: "Gorditas", category: "Comida Mexicana" },
  { word: "Cochinita pibil", category: "Comida Mexicana" },
  { word: "Panucho", category: "Comida Mexicana" },
  { word: "Salbute", category: "Comida Mexicana" },
  { word: "Pescado a la talla", category: "Comida Mexicana" },
  { word: "Tamales chiapanecos", category: "Comida Mexicana" },
  { word: "Mole negro", category: "Comida Mexicana" },
  { word: "Xix", category: "Comida Mexicana" },
  { word: "Pib", category: "Comida Mexicana" },
  // Juegos extras
  { word: "Futbolito", category: "Juegos y Niñez" },
  { word: "Dominó", category: "Juegos y Niñez" },
  { word: "Ajedrez", category: "Juegos y Niñez" },
  { word: "Jenga", category: "Juegos y Niñez" },
  { word: "Uno", category: "Juegos y Niñez" },
  { word: "Lotería moderna", category: "Juegos y Niñez" },
];

// ── Expresiones y jerga (de patchCategories WORD_OVERRIDE) ───────────────────
const SLANG_WORDS: Array<{ word: string; category: string }> = [
  // Slang / jerga → Expresiones
  { word: "Neta", category: "Expresiones y Modismos" },
  { word: "Güey", category: "Expresiones y Modismos" },
  { word: "Güey / Wey", category: "Expresiones y Modismos" },
  { word: "Gey  Wey", category: "Expresiones y Modismos" },
  { word: "Chamba", category: "Expresiones y Modismos" },
  { word: "Platicar", category: "Expresiones y Modismos" },
  { word: "Sale", category: "Expresiones y Modismos" },
  { word: "Lana", category: "Expresiones y Modismos" },
  { word: "Fresa", category: "Expresiones y Modismos" },
  { word: "Naco", category: "Expresiones y Modismos" },
  { word: "Chafa", category: "Expresiones y Modismos" },
  { word: "Gacho", category: "Expresiones y Modismos" },
  { word: "Morra / Morro", category: "Expresiones y Modismos" },
  { word: "Morra  Morro", category: "Expresiones y Modismos" },
  { word: "¡Qué oso!", category: "Expresiones y Modismos" },
  { word: "Chismoso", category: "Expresiones y Modismos" },
  { word: "Tirar paro", category: "Expresiones y Modismos" },
  { word: "Echar la hueva", category: "Expresiones y Modismos" },
  { word: "Hacerse güey", category: "Expresiones y Modismos" },
  { word: "Hacerse gey", category: "Expresiones y Modismos" },
  { word: "Ya valió madre", category: "Expresiones y Modismos" },
  { word: "Pendejo", category: "Expresiones y Modismos" },
  { word: "Cabrón", category: "Expresiones y Modismos" },
  { word: "Vieja", category: "Expresiones y Modismos" },
  { word: "Jaina", category: "Expresiones y Modismos" },
  { word: "Cotorreo", category: "Expresiones y Modismos" },
  { word: "Agüitado", category: "Expresiones y Modismos" },
  { word: "Agitado", category: "Expresiones y Modismos" },
  { word: "Irse de rol", category: "Expresiones y Modismos" },
  { word: "Poner el cuerno", category: "Expresiones y Modismos" },
  { word: "No dar el ancho", category: "Expresiones y Modismos" },
  { word: "Caer gordo", category: "Expresiones y Modismos" },
  { word: "Estar cañón", category: "Expresiones y Modismos" },
  { word: "Echar taco de ojo", category: "Expresiones y Modismos" },
  { word: "A darle que es mole de olla", category: "Expresiones y Modismos" },
  // Regionalismos
  { word: "Chilango", category: "Expresiones y Modismos" },
  { word: "Camión", category: "Expresiones y Modismos" },
  { word: "Micro", category: "Expresiones y Modismos" },
  { word: "Cuate", category: "Expresiones y Modismos" },
  { word: "Neta del planeta", category: "Expresiones y Modismos" },
  { word: "Ándale", category: "Expresiones y Modismos" },
  { word: "Metro", category: "Expresiones y Modismos" },
  { word: "Puchador", category: "Expresiones y Modismos" },
  { word: "Chaleco", category: "Expresiones y Modismos" },
  { word: "Machín", category: "Expresiones y Modismos" },
  { word: "Morrita", category: "Expresiones y Modismos" },
  { word: "Fierro pariente", category: "Expresiones y Modismos" },
  { word: "Andar con madre", category: "Expresiones y Modismos" },
  { word: "Huerco", category: "Expresiones y Modismos" },
  { word: "Troca", category: "Expresiones y Modismos" },
  { word: "Congal", category: "Expresiones y Modismos" },
  { word: "Plebe", category: "Expresiones y Modismos" },
  { word: "A la bestia", category: "Expresiones y Modismos" },
  { word: "Un paro", category: "Expresiones y Modismos" },
  { word: "Choco", category: "Expresiones y Modismos" },
  { word: "Bato", category: "Expresiones y Modismos" },
  { word: "Ñero", category: "Expresiones y Modismos" },
  { word: "Pichar", category: "Expresiones y Modismos" },
  { word: "Me late", category: "Expresiones y Modismos" },
  { word: "Estar padre", category: "Expresiones y Modismos" },
  { word: "Chambear", category: "Expresiones y Modismos" },
  { word: "Echar relajo", category: "Expresiones y Modismos" },
  { word: "Puchis", category: "Expresiones y Modismos" },
  // Yucatán
  { word: "Tuch", category: "Expresiones y Modismos" },
  { word: "Poch", category: "Expresiones y Modismos" },
  { word: "Pacha", category: "Expresiones y Modismos" },
  { word: "Jach", category: "Expresiones y Modismos" },
  { word: "A'huevo", category: "Expresiones y Modismos" },
  { word: "Tuchito", category: "Expresiones y Modismos" },
  // Norte / Barrio
  { word: "Bato loco", category: "Expresiones y Modismos" },
  { word: "Andar bravo", category: "Expresiones y Modismos" },
  { word: "Tirar esquina", category: "Expresiones y Modismos" },
  { word: "Jalón", category: "Expresiones y Modismos" },
  { word: "Troca blindada", category: "Expresiones y Modismos" },
  { word: "Clica", category: "Expresiones y Modismos" },
  { word: "Tirar barrio", category: "Expresiones y Modismos" },
  { word: "Estar en la movida", category: "Expresiones y Modismos" },
  // Internet / Juvenil
  { word: "Cancelado", category: "Expresiones y Modismos" },
  { word: "Funar", category: "Expresiones y Modismos" },
  { word: "Chismecito", category: "Expresiones y Modismos" },
  { word: "Stalkear", category: "Expresiones y Modismos" },
  { word: "Crush", category: "Expresiones y Modismos" },
  { word: "Shippear", category: "Expresiones y Modismos" },
  { word: "Postear", category: "Expresiones y Modismos" },
  { word: "Subirse al tren", category: "Expresiones y Modismos" },
  { word: "Estar viral", category: "Expresiones y Modismos" },
  { word: "Meme", category: "Expresiones y Modismos" },
  // Albures / bebida
  { word: "Chela", category: "Bebidas" },
  { word: "Peda", category: "Expresiones y Modismos" },
  { word: "Crudo", category: "Expresiones y Modismos" },
  { word: "Andar pedo", category: "Expresiones y Modismos" },
  { word: "Armarla de pedo", category: "Expresiones y Modismos" },
  { word: "Estar hasta las chanclas", category: "Expresiones y Modismos" },
  // Historia
  { word: "Olmecas", category: "Historia de México" },
  { word: "Mayas", category: "Historia de México" },
  { word: "Mexicas", category: "Historia de México" },
  { word: "Zapotecas", category: "Historia de México" },
  { word: "Mixtecos", category: "Historia de México" },
  { word: "Toltecas", category: "Historia de México" },
  { word: "Quetzalcóatl", category: "Historia de México" },
  { word: "Tláloc", category: "Historia de México" },
  { word: "Coatlicue", category: "Historia de México" },
  { word: "Huitzilopochtli", category: "Historia de México" },
  { word: "Tezcatlipoca", category: "Historia de México" },
  { word: "Xipe Tótec", category: "Historia de México" },
  { word: "Xochiquétzal", category: "Historia de México" },
  { word: "Piedra del sol", category: "Historia de México" },
  { word: "Tenochtitlan", category: "Historia de México" },
  { word: "La Independencia", category: "Historia de México" },
  { word: "Miguel Hidalgo", category: "Historia de México" },
  { word: "Pancho Villa", category: "Historia de México" },
  { word: "Malinche", category: "Historia de México" },
  { word: "Moctezuma II", category: "Historia de México" },
  { word: "Adelitas", category: "Historia de México" },
];

// ── Palabras restantes (de la auditoría, no en ningún seed) ──────────────────
const REMAINING_WORDS: Array<{ word: string; category: string }> = [
  // Cultura Popular (TV, comedia, telenovelas)
  { word: "Chabelo", category: "Cultura Popular" },
  { word: "El Chavo del 8", category: "Cultura Popular" },
  { word: "La Chilindrina", category: "Cultura Popular" },
  { word: "Don Ramón", category: "Cultura Popular" },
  { word: "Don Ramon", category: "Cultura Popular" },
  { word: "Viruta y Capulina", category: "Cultura Popular" },
  { word: "Rosa Salvaje", category: "Cultura Popular" },
  { word: "Cuna de lobos", category: "Cultura Popular" },
  { word: "Los ricos también lloran", category: "Cultura Popular" },
  { word: "La usurpadora", category: "Cultura Popular" },
  { word: "Thalía", category: "Cultura Popular" },
  { word: "Thalia", category: "Cultura Popular" },
  { word: "Verónica Castro", category: "Cultura Popular" },
  { word: "Veronica Castro", category: "Cultura Popular" },
  { word: "Los Bukis", category: "Música y Artistas" },
  { word: "Rubí", category: "Cultura Popular" },
  { word: "El señor de los cielos", category: "Cultura Popular" },
  { word: "María la del barrio", category: "Cultura Popular" },
  { word: "Rebelde", category: "Cultura Popular" },
  { word: "RBD", category: "Cultura Popular" },
  { word: "Chespirito", category: "Cultura Popular" },

  // Deportes Mexicanos
  { word: "El Santo", category: "Deportes Mexicanos" },
  { word: "Blue Demon", category: "Deportes Mexicanos" },
  { word: "Mil Máscaras", category: "Deportes Mexicanos" },
  { word: "Mil Mascaras", category: "Deportes Mexicanos" },
  { word: "Hijo del Santo", category: "Deportes Mexicanos" },
  { word: "Arena México", category: "Deportes Mexicanos" },
  { word: "Arena Mexico", category: "Deportes Mexicanos" },
  { word: "Charrería", category: "Deportes Mexicanos" },
  { word: "Charreada", category: "Deportes Mexicanos" },
  { word: "Julio César Chávez", category: "Deportes Mexicanos" },
  { word: "Julio Cesar Chavez", category: "Deportes Mexicanos" },
  { word: "Hugo Sánchez", category: "Deportes Mexicanos" },
  { word: "Hugo Sanchez", category: "Deportes Mexicanos" },
  { word: "Pelota mixteca", category: "Deportes Mexicanos" },
  { word: "Béisbol norteño", category: "Deportes Mexicanos" },
  { word: "Beisbol norteño", category: "Deportes Mexicanos" },
  { word: "Beisbol norteno", category: "Deportes Mexicanos" },
  { word: "Ana Guevara", category: "Deportes Mexicanos" },
  { word: "Lucha libre", category: "Deportes Mexicanos" },

  // Artesanías de México
  { word: "Alebrijes", category: "Artesanías de México" },
  { word: "Talavera", category: "Artesanías de México" },
  { word: "Barro negro", category: "Artesanías de México" },
  { word: "Papel picado", category: "Artesanías de México" },
  { word: "Huipil", category: "Artesanías de México" },
  { word: "Rebozo", category: "Artesanías de México" },
  { word: "Reboso", category: "Artesanías de México" },
  { word: "Piñata", category: "Artesanías de México" },
  { word: "Sarape", category: "Artesanías de México" },
  { word: "Sombrero charro", category: "Artesanías de México" },
  { word: "Olla de barro", category: "Artesanías de México" },
  { word: "Cazuela de barro", category: "Artesanías de México" },

  // Monumentos y Lugares
  { word: "Popocatépetl", category: "Monumentos y Lugares" },
  { word: "Popocatepetl", category: "Monumentos y Lugares" },
  { word: "Cenote", category: "Monumentos y Lugares" },
  { word: "Barranca del Cobre", category: "Monumentos y Lugares" },
  { word: "Selva Lacandona", category: "Monumentos y Lugares" },
  { word: "Iztaccíhuatl", category: "Monumentos y Lugares" },
  { word: "Iztaccihuatl", category: "Monumentos y Lugares" },
  { word: "Xochimilco", category: "Monumentos y Lugares" },
  { word: "El Zócalo", category: "Monumentos y Lugares" },
  { word: "El Zocalo", category: "Monumentos y Lugares" },
  { word: "Tepito", category: "Monumentos y Lugares" },
  { word: "La Merced", category: "Monumentos y Lugares" },
  { word: "Nevado de Toluca", category: "Monumentos y Lugares" },
  { word: "Hierve el Agua", category: "Monumentos y Lugares" },
  { word: "Isla Mujeres", category: "Monumentos y Lugares" },
  { word: "Tulum", category: "Monumentos y Lugares" },
  { word: "Tajín", category: "Monumentos y Lugares" },
  { word: "Tajin", category: "Monumentos y Lugares" },

  // Comida extras
  { word: "Arroz rojo", category: "Comida Mexicana" },
  { word: "Frijoles de olla", category: "Comida Mexicana" },
  { word: "Chile serrano", category: "Comida Mexicana" },
  { word: "Chile poblano", category: "Comida Mexicana" },
  { word: "Chile chipotle", category: "Comida Mexicana" },
  { word: "Chile de árbol", category: "Comida Mexicana" },
  { word: "Chile de arbol", category: "Comida Mexicana" },
  { word: "Chile ancho", category: "Comida Mexicana" },
  { word: "Chile habanero", category: "Comida Mexicana" },
  { word: "Chile guajillo", category: "Comida Mexicana" },
  { word: "Salsa verde", category: "Comida Mexicana" },
  { word: "Pico de gallo", category: "Comida Mexicana" },
  { word: "Longaniza", category: "Comida Mexicana" },
  { word: "Papadzul", category: "Comida Mexicana" },
  { word: "Mangonada", category: "Comida Mexicana" },
  { word: "Nieves de garrafa", category: "Comida Mexicana" },
  { word: "Capirotada", category: "Comida Mexicana" },
  { word: "Discada norteña", category: "Comida Mexicana" },
  { word: "Chorizo mexicano", category: "Comida Mexicana" },
  { word: "Marquesita", category: "Comida Mexicana" },
  { word: "Poc chuc", category: "Comida Mexicana" },

  // Tradiciones y Fiestas
  { word: "Día de muertos", category: "Tradiciones y Fiestas" },
  { word: "Posadas", category: "Tradiciones y Fiestas" },
  { word: "Guelaguetza", category: "Tradiciones y Fiestas" },
  { word: "Quinceañera", category: "Tradiciones y Fiestas" },
  { word: "Danza de los voladores", category: "Tradiciones y Fiestas" },
  { word: "Altar de muertos", category: "Tradiciones y Fiestas" },
  { word: "Piñata de posada", category: "Tradiciones y Fiestas" },
  { word: "Rosca de reyes", category: "Tradiciones y Fiestas" },
  { word: "Cempasúchil", category: "Tradiciones y Fiestas" },
  { word: "Serenata", category: "Tradiciones y Fiestas" },
  { word: "Tianguis", category: "Tradiciones y Fiestas" },
  { word: "Día de Reyes", category: "Tradiciones y Fiestas" },
  { word: "Carnaval de Veracruz", category: "Tradiciones y Fiestas" },

  // Expresiones extras
  { word: "Nel pastel", category: "Expresiones y Modismos" },
  { word: "A toda madre", category: "Expresiones y Modismos" },
  { word: "A huevo", category: "Expresiones y Modismos" },
  { word: "AHUEVO", category: "Expresiones y Modismos" },

  // Refranes
  { word: "El que nace pa tamal", category: "Refranes y Dichos" },
  { word: "Hijo de tigre pintito", category: "Refranes y Dichos" },
  { word: "Más vale maña que fuerza", category: "Refranes y Dichos" },
  { word: "Al que madruga Dios le ayuda", category: "Refranes y Dichos" },
  { word: "No hay mal que por bien no venga", category: "Refranes y Dichos" },
  { word: "A caballo dado no se le ve el colmillo", category: "Refranes y Dichos" },
  { word: "Camarón que se duerme", category: "Refranes y Dichos" },
  { word: "El que con lobos anda", category: "Refranes y Dichos" },
  { word: "Agua que no has de beber", category: "Refranes y Dichos" },
  { word: "Al nopal lo van a ver", category: "Refranes y Dichos" },
  { word: "De tal palo tal astilla", category: "Refranes y Dichos" },

  // Leyendas y Mitos
  { word: "La Llorona", category: "Leyendas y Mitos" },
  { word: "El Chupacabras", category: "Leyendas y Mitos" },
  { word: "La Mulata de Córdoba", category: "Leyendas y Mitos" },
  { word: "El Nahual", category: "Leyendas y Mitos" },
  { word: "Nahual", category: "Leyendas y Mitos" },
  { word: "La Pascualita", category: "Leyendas y Mitos" },

  // Albures y Picaresca
  { word: "Albur", category: "Albures y Picaresca" },
  { word: "Doble sentido", category: "Albures y Picaresca" },

  // Vida Cotidiana
  { word: "Pesero", category: "Vida Cotidiana" },
  { word: "Metro CDMX", category: "Vida Cotidiana" },
  { word: "Mototaxi", category: "Vida Cotidiana" },
  { word: "Combi", category: "Vida Cotidiana" },
  { word: "Bicitaxi", category: "Vida Cotidiana" },
  { word: "Trolebús", category: "Vida Cotidiana" },
  { word: "Cuaderno Scribe", category: "Vida Cotidiana" },
  { word: "Recreo escolar", category: "Vida Cotidiana" },
  { word: "Cooperativa", category: "Vida Cotidiana" },
  { word: "Conaliteg", category: "Vida Cotidiana" },
  { word: "Lonchera", category: "Vida Cotidiana" },
  { word: "Escolta", category: "Vida Cotidiana" },

  // Remedios Caseros
  { word: "Vicks VapoRub", category: "Remedios Caseros" },
  { word: "Agua de tila", category: "Remedios Caseros" },
  { word: "Sábila", category: "Remedios Caseros" },
  { word: "Limón con sal", category: "Remedios Caseros" },
  { word: "Gordolobo", category: "Remedios Caseros" },
  { word: "Ruda", category: "Remedios Caseros" },

  // Cómics mexicanos → Cultura Popular
  { word: "Kalimán", category: "Cultura Popular" },
  { word: "Kaliman", category: "Cultura Popular" },
  { word: "Memín Pinguín", category: "Cultura Popular" },
  { word: "Memin Pinguin", category: "Cultura Popular" },
  { word: "La Familia Burrón", category: "Cultura Popular" },
  { word: "La Familia Burron", category: "Cultura Popular" },
  { word: "El Payo", category: "Cultura Popular" },
  { word: "Fantomas", category: "Cultura Popular" },
  { word: "Chanoc", category: "Cultura Popular" },

  // Cine mexicano → Cultura Popular
  { word: "Amores Perros", category: "Cultura Popular" },
  { word: "Y tu mamá también", category: "Cultura Popular" },
  { word: "Y tu mama tambien", category: "Cultura Popular" },
  { word: "Roma", category: "Cultura Popular" },
  { word: "Guillermo del Toro", category: "Cultura Popular" },
  { word: "Iñárritu", category: "Cultura Popular" },
  { word: "Inarritu", category: "Cultura Popular" },
  { word: "Alfonso Cuarón", category: "Cultura Popular" },
  { word: "Alfonso Cuaron", category: "Cultura Popular" },

  // Refranes extras
  { word: "Al que madruga", category: "Refranes y Dichos" },
  { word: "Más vale tarde", category: "Refranes y Dichos" },
  { word: "Mas vale tarde", category: "Refranes y Dichos" },
  { word: "En boca cerrada", category: "Refranes y Dichos" },
  { word: "No hay mal que dure", category: "Refranes y Dichos" },
  { word: "Ahí es donde la puerca tuerce el rabo", category: "Refranes y Dichos" },

  // Tradiciones extras — religión y festivales
  { word: "Festival Cervantino", category: "Tradiciones y Fiestas" },
  { word: "Día de Guadalupe", category: "Tradiciones y Fiestas" },
  { word: "Dia de Guadalupe", category: "Tradiciones y Fiestas" },
  { word: "Virgen de Guadalupe", category: "Tradiciones y Fiestas" },
  { word: "San Judas Tadeo", category: "Tradiciones y Fiestas" },
  { word: "La Santa Muerte", category: "Tradiciones y Fiestas" },
  { word: "Cristo Rey", category: "Tradiciones y Fiestas" },
  { word: "San Miguel Arcángel", category: "Tradiciones y Fiestas" },
  { word: "San Miguel Arcangel", category: "Tradiciones y Fiestas" },
  { word: "Niño Dios", category: "Tradiciones y Fiestas" },
  { word: "Nino Dios", category: "Tradiciones y Fiestas" },

  // Historia extras
  { word: "Sor Juana Inés", category: "Historia de México" },
  { word: "Sor Juana Ines", category: "Historia de México" },
  { word: "Sor Juana Inés de la Cruz", category: "Historia de México" },
  { word: "Josefa Ortiz", category: "Historia de México" },
  { word: "Josefa Ortiz de Domínguez", category: "Historia de México" },

  // Artesanías extras — vestimenta
  { word: "China poblana", category: "Artesanías de México" },
  { word: "Traje de charro", category: "Artesanías de México" },
  { word: "Quechquémitl", category: "Artesanías de México" },
  { word: "Quechquemitl", category: "Artesanías de México" },
  { word: "Jorongo", category: "Artesanías de México" },

  // Comida — pan dulce y antojitos callejeros
  { word: "Churro", category: "Comida Mexicana" },
  { word: "Algodón de azúcar", category: "Comida Mexicana" },
  { word: "Algodon de azucar", category: "Comida Mexicana" },
  { word: "Pepino con chile", category: "Comida Mexicana" },
  { word: "Raspado", category: "Comida Mexicana" },
  { word: "Concha", category: "Comida Mexicana" },
  { word: "Cuernito", category: "Comida Mexicana" },
  { word: "Polvorón", category: "Comida Mexicana" },
  { word: "Polvoron", category: "Comida Mexicana" },
  { word: "Garibaldi", category: "Comida Mexicana" },
  { word: "Cochito", category: "Comida Mexicana" },
  { word: "Oreja", category: "Comida Mexicana" },
  { word: "Elote", category: "Comida Mexicana" },

  // Vida Cotidiana extras
  { word: "Temazcal", category: "Tradiciones y Fiestas" },
  { word: "Metate", category: "Tradiciones y Fiestas" },
  { word: "Molcajete", category: "Comida Mexicana" },
  { word: "Comal", category: "Comida Mexicana" },

  // Últimos 16: streamers, música, deportes, jerga digital
  { word: "Caeli", category: "Mundo Digital" },
  { word: "Roier", category: "Mundo Digital" },
  { word: "Natanael Cano", category: "Música y Artistas" },
  { word: "Junior H", category: "Música y Artistas" },
  { word: "Eslabón Armado", category: "Música y Artistas" },
  { word: "Eslabon Armado", category: "Música y Artistas" },
  { word: "Corrido tumbado", category: "Música y Artistas" },
  { word: "Gabito Ballesteros", category: "Música y Artistas" },
  { word: "Fuerza Regida", category: "Música y Artistas" },
  { word: "Sheeeeesh", category: "Expresiones y Modismos" },
  { word: "Ratio", category: "Expresiones y Modismos" },
  { word: "Chupar rueda", category: "Expresiones y Modismos" },
  { word: "Ghostear", category: "Expresiones y Modismos" },
  { word: "Rafael Márquez", category: "Deportes Mexicanos" },
  { word: "Rafael Marquez", category: "Deportes Mexicanos" },
  { word: "Cuauhtémoc Blanco", category: "Deportes Mexicanos" },
  { word: "Cuauhtemoc Blanco", category: "Deportes Mexicanos" },
  { word: "Jorge Campos", category: "Deportes Mexicanos" },
  { word: "A'huevo", category: "Expresiones y Modismos" },

  // Futbolistas → Deportes
  { word: "Chicharito", category: "Deportes Mexicanos" },
  { word: "Guillermo Ochoa", category: "Deportes Mexicanos" },
  { word: "Andrés Guardado", category: "Deportes Mexicanos" },
  { word: "Andres Guardado", category: "Deportes Mexicanos" },
  { word: "Chucky Lozano", category: "Deportes Mexicanos" },
  { word: "Raúl Jiménez", category: "Deportes Mexicanos" },
  { word: "Raul Jimenez", category: "Deportes Mexicanos" },
  { word: "Santiago Giménez", category: "Deportes Mexicanos" },
  { word: "Santiago Gimenez", category: "Deportes Mexicanos" },
  { word: "Carlos Vela", category: "Deportes Mexicanos" },
  { word: "Memo Ochoa", category: "Deportes Mexicanos" },

  // Streamers → Mundo Digital
  { word: "Juan Guarnizo", category: "Mundo Digital" },
  { word: "Arigameplays", category: "Mundo Digital" },
  { word: "Werevertumorro", category: "Mundo Digital" },
  { word: "Yoss Hoffman", category: "Mundo Digital" },

  // Leyendas y Mitos
  { word: "Nagual", category: "Leyendas y Mitos" },
  { word: "Chaneque", category: "Leyendas y Mitos" },
  { word: "Alux", category: "Leyendas y Mitos" },
  { word: "Encanto", category: "Leyendas y Mitos" },
  { word: "Wirikuta", category: "Leyendas y Mitos" },

  // Arquitectura colonial → Monumentos
  { word: "Atrio", category: "Monumentos y Lugares" },
  { word: "Claustro", category: "Monumentos y Lugares" },
  { word: "Campanario", category: "Monumentos y Lugares" },
  { word: "Portada", category: "Monumentos y Lugares" },
  { word: "Sagrario", category: "Monumentos y Lugares" },
  { word: "Pilastra", category: "Monumentos y Lugares" },

  // Artesanías
  { word: "Petate", category: "Artesanías de México" },

  // Albures y Picaresca
  { word: "Tezos", category: "Albures y Picaresca" },
  { word: "Putiza", category: "Albures y Picaresca" },
  { word: "Chingaquedito", category: "Albures y Picaresca" },
  { word: "Mamadas", category: "Albures y Picaresca" },
  { word: "Cabroneada", category: "Albures y Picaresca" },
  { word: "Buey sin cachos", category: "Albures y Picaresca" },
  { word: "Cagada", category: "Albures y Picaresca" },
  { word: "Chingón", category: "Albures y Picaresca" },
  { word: "Chingona", category: "Albures y Picaresca" },
  { word: "No tener madre", category: "Albures y Picaresca" },
  { word: "Estar de mala leche", category: "Albures y Picaresca" },

  // Expresiones
  { word: "Menso", category: "Expresiones y Modismos" },
  { word: "Tarado", category: "Expresiones y Modismos" },
  { word: "Fregón", category: "Expresiones y Modismos" },
  { word: "Encabronado", category: "Expresiones y Modismos" },
  { word: "Desgraciado", category: "Expresiones y Modismos" },
  { word: "Sangrón", category: "Expresiones y Modismos" },
  { word: "Lambiscón", category: "Expresiones y Modismos" },
  { word: "Mitotero", category: "Expresiones y Modismos" },
  { word: "Desmadre", category: "Expresiones y Modismos" },
  { word: "Pistear", category: "Expresiones y Modismos" },
  { word: "Huevón", category: "Expresiones y Modismos" },
  { word: "Cantón", category: "Expresiones y Modismos" },
  { word: "Feria", category: "Expresiones y Modismos" },
  { word: "Palomilla", category: "Expresiones y Modismos" },

  // Música extra
  { word: "Bronco", category: "Música y Artistas" },
  { word: "Los Ángeles Azules", category: "Música y Artistas" },
  { word: "Los Angeles Azules", category: "Música y Artistas" },
  { word: "Los Yónics", category: "Música y Artistas" },
  { word: "Los Yonics", category: "Música y Artistas" },
  { word: "Selena", category: "Música y Artistas" },
  { word: "Jenni Rivera", category: "Música y Artistas" },
  { word: "Vihuela", category: "Música y Artistas" },
  { word: "Tambora", category: "Música y Artistas" },
  { word: "Caifanes", category: "Música y Artistas" },
  { word: "Maná", category: "Música y Artistas" },
  { word: "Molotov", category: "Música y Artistas" },
  { word: "Café Tacuba", category: "Música y Artistas" },
  { word: "Zoé", category: "Música y Artistas" },
  { word: "El Tri", category: "Música y Artistas" },
  { word: "Natalia Lafourcade", category: "Música y Artistas" },
  { word: "Julieta Venegas", category: "Música y Artistas" },
  { word: "Carlos Rivera", category: "Música y Artistas" },
  { word: "Danna Paola", category: "Música y Artistas" },
  { word: "Belinda", category: "Música y Artistas" },
  { word: "Danzón", category: "Música y Artistas" },
  { word: "Marimba", category: "Música y Artistas" },
  { word: "Guitarrón", category: "Música y Artistas" },
  { word: "Jarabe tapatío", category: "Música y Artistas" },
  { word: "La bamba", category: "Música y Artistas" },
];

// ── Bebidas que deben separarse de Comida ────────────────────────────────────
const BEVERAGE_WORDS = new Set([
  "mezcal", "tequila", "pulque", "horchata", "agua de jamaica", "tepache",
  "tejate", "chela", "pisto", "jamaica", "michelada", "tejuino",
  "champurrado", "atole",
]);

// ── Las 19 categorías canónicas ──────────────────────────────────────────────
const CANONICAL_19 = new Set([
  "Expresiones y Modismos", "Comida Mexicana", "Juegos y Niñez",
  "Bebidas", "Vida Cotidiana", "Refranes y Dichos",
  "Animales de México", "Remedios Caseros", "Flora Mexicana",
  "Tradiciones y Fiestas", "Música y Artistas", "Historia de México",
  "Albures y Picaresca", "Artesanías de México", "Cultura Popular",
  "Deportes Mexicanos", "Monumentos y Lugares", "Leyendas y Mitos",
  "Mundo Digital",
]);

// ── Construir mapa normalizado word → category ──────────────────────────────
function buildCategoryMap(): Map<string, string> {
  const map = new Map<string, string>();

  // 1. seedWords1000 — ~1000 palabras con categorías canónicas
  for (const entry of NEW_WORDS) {
    map.set(norm(entry.word), entry.category);
  }

  // 2. seedCuratedLevels — ~90 palabras
  for (const entry of CURATED) {
    map.set(norm(entry.word), entry.category);
  }

  // 3. Cultura Digital seeds
  for (const entry of CULTURA_DIGITAL) {
    map.set(norm(entry.word), entry.category);
  }

  // 4. Words from levels.ts (priorityWords + newWords15to18)
  for (const entry of LEVELS_WORDS) {
    map.set(norm(entry.word), entry.category);
  }

  // 5. Slang/expressions from patchCategories WORD_OVERRIDE
  for (const entry of SLANG_WORDS) {
    map.set(norm(entry.word), entry.category);
  }

  // 6. Remaining words from audit (not in any seed)
  for (const entry of REMAINING_WORDS) {
    map.set(norm(entry.word), entry.category);
  }

  // 7. Sobrescribir bebidas
  for (const bev of BEVERAGE_WORDS) {
    map.set(norm(bev), "Bebidas");
  }

  return map;
}

// ─── Auditoría: ver estado actual ────────────────────────────────────────────
export const audit = query({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const catMap = buildCategoryMap();

    const currentDist = new Map<string, number>();
    let matchable = 0;
    let unmatched = 0;
    const unmatchedWords: string[] = [];

    for (const w of allWords) {
      const cat = (w as any).category ?? "(sin categoría)";
      currentDist.set(cat, (currentDist.get(cat) ?? 0) + 1);

      if (catMap.has(norm(w.word))) {
        matchable++;
      } else {
        unmatched++;
        if (unmatchedWords.length < 50) unmatchedWords.push(w.word);
      }
    }

    // Proyección de distribución después del fix
    const projectedDist = new Map<string, number>();
    for (const w of allWords) {
      const newCat = catMap.get(norm(w.word)) ?? (w as any).category ?? "Expresiones y Modismos";
      projectedDist.set(newCat, (projectedDist.get(newCat) ?? 0) + 1);
    }

    return {
      totalWords: allWords.length,
      matchable,
      unmatched,
      unmatchedSample: unmatchedWords,
      currentDistribution: Array.from(currentDist.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([cat, n]) => `${cat}: ${n}`),
      projectedDistribution: Array.from(projectedDist.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([cat, n]) => `${cat}: ${n}`),
    };
  },
});

// ─── Fix: aplicar categorías correctas ───────────────────────────────────────
export const fix = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const catMap = buildCategoryMap();

    let updated = 0;
    let skipped = 0;
    const changes = new Map<string, number>();

    for (const w of allWords) {
      const correctCat = catMap.get(norm(w.word));
      if (!correctCat) {
        skipped++;
        continue;
      }

      const currentCat = (w as any).category;
      if (currentCat === correctCat) {
        skipped++;
        continue;
      }

      await ctx.db.patch(w._id, { category: correctCat } as any);
      changes.set(correctCat, (changes.get(correctCat) ?? 0) + 1);
      updated++;
    }

    // ── Word renames ──────────────────────────────────────────────────────────
    const WORD_RENAMES: Record<string, string> = {
      "Posadas navideñas": "Posadas",
      "Mole verde": "Mole",
    };
    // Full word replacements (word + meaning + example + region)
    const WORD_REPLACEMENTS: Record<string, { word: string; meaning: string; example: string; region: string }> = {
      "Eugenia León": { word: "Alejandro Fernández", meaning: "El Potrillo, hijo de Vicente y estrella de la ranchera moderna", example: "Alejandro Fernández cantó Me dediqué a perderte en el Auditorio Nacional", region: "Jalisco" },
      "Velorio mexicano": { word: "Velorio", meaning: "Reunión para despedir al difunto con rezos, tamales y café", example: "El velorio duró toda la noche con tamales y café", region: "Nacional" },
    };
    // Duplicates to delete from production
    const WORDS_TO_DELETE = new Set(["Lotería mexicana", "Stop"]);
    let renamed = 0;
    let deleted = 0;
    for (const w of allWords) {
      if (WORDS_TO_DELETE.has(w.word)) {
        await ctx.db.delete(w._id);
        deleted++;
        continue;
      }
      const newWord = WORD_RENAMES[w.word];
      if (newWord) {
        await ctx.db.patch(w._id, { word: newWord } as any);
        renamed++;
        continue;
      }
      const replacement = WORD_REPLACEMENTS[w.word];
      if (replacement) {
        await ctx.db.patch(w._id, replacement as any);
        renamed++;
      }
    }

    // ASCII-safe keys for return value (Convex no permite acentos en keys)
    const changesList = Array.from(changes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) => `${cat}: ${n}`);

    return { updated, skipped, renamed, deleted, total: allWords.length, changesList };
  },
});
