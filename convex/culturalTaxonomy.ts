/**
 * Server-side identifiers used to validate persisted cultural metadata.
 * The client taxonomy remains the presentation source for names, icons, colors,
 * descriptions, aliases, and other visual metadata.
 */
export const CULTURAL_PATH_IDS = [
  "patio-recreo", "casa-abuela", "calle-barrio", "mercado-antojitos",
  "feria-verbena", "musica-une", "mexico-regional", "oficios-artesanias",
  "historias-leyendas", "mexico-profundo",
] as const;

export const CULTURAL_COLLECTION_IDS = [
  "juegos-ninez", "dulces-antojitos", "cocina-bebidas", "dichos-casa",
  "escuela-mexicana", "vida-barrio", "tele-cultura-popular", "musica-mexicana",
  "fiestas-tradiciones", "naturaleza-mexico", "pueblos-originarios-lenguas",
  "oficios-artesanias", "regiones-hablas", "historia-personajes",
  "lugares-mexico", "leyendas-relatos", "ciencia-inventos-deporte",
  "mexico-digital", "albures-picaresca",
] as const;

export const CULTURAL_PLACE_IDS = [
  "todo-mexico", "cdmx", "guadalajara", "jalisco", "monterrey", "nuevo-leon",
  "veracruz", "oaxaca", "puebla", "michoacan", "guerrero", "chiapas",
  "yucatan", "campeche", "quintana-roo", "tabasco", "sinaloa", "nayarit",
  "huasteca", "unclassified",
] as const;

const collection = (id: string, name: string, icon: string, color: string) => ({
  id, name, icon, color, description: `Palabras y expresiones de ${name.toLocaleLowerCase("es-MX")}.`,
});
const collectionRows = [
  ["juegos-ninez", "Juegos de la Niñez", "🪀"], ["dulces-antojitos", "Dulces y Antojitos", "🍭"],
  ["cocina-bebidas", "Cocina y Bebidas", "🫔"], ["dichos-casa", "Dichos de Casa", "💬"],
  ["escuela-mexicana", "Escuela Mexicana", "✏️"], ["vida-barrio", "Vida de Barrio", "⚽"],
  ["tele-cultura-popular", "Tele y Cultura Popular", "📺"], ["musica-mexicana", "Música Mexicana", "🎺"],
  ["fiestas-tradiciones", "Fiestas y Tradiciones", "🎊"], ["naturaleza-mexico", "Naturaleza de México", "🦋"],
  ["pueblos-originarios-lenguas", "Pueblos Originarios y Lenguas", "🌽"], ["oficios-artesanias", "Oficios y Artesanías", "🧶"],
  ["regiones-hablas", "Regiones y Hablas", "🗣️"], ["historia-personajes", "Historia y Personajes", "📜"],
  ["lugares-mexico", "Lugares de México", "🗺️"], ["leyendas-relatos", "Leyendas y Relatos", "🕯️"],
  ["ciencia-inventos-deporte", "Ciencia, Inventos y Deporte", "🔬"], ["mexico-digital", "México Digital", "📱"],
  ["albures-picaresca", "Albures y Picaresca", "😉"],
] as const;
const collectionColors = ["#E76F51", "#F4A261", "#E9C46A", "#B56576", "#457B9D", "#2A9D8F"];
export const CULTURAL_COLLECTIONS = collectionRows.map(([id, name, icon], index) => collection(id, name, icon, collectionColors[index % collectionColors.length]));

const place = (id: string, name: string, kind: string, demonym: string, icon: string, color: string, aliases: readonly string[] = []) => ({ id, name, kind, demonym, icon, color, aliases });
export const CULTURAL_PLACES = [
  place("todo-mexico", "Todo México", "country", "Mexicano", "🦅", "#006847", ["México", "Mexico", "Nacional", "Todo Mexico"]),
  place("cdmx", "Ciudad de México", "city", "Chilango", "🚇", "#C62828", ["CDMX", "Ciudad de Mexico", "Distrito Federal", "DF"]),
  place("guadalajara", "Guadalajara", "city", "Tapatío", "🏛️", "#2E7D32", ["Guadalajara, Jalisco"]),
  place("jalisco", "Jalisco", "state", "Jalisciense", "🎺", "#388E3C", ["Estado de Jalisco"]),
  place("monterrey", "Monterrey", "city", "Regiomontano", "🏔️", "#795548", ["Monterrey, Nuevo León", "Monterrey, Nuevo Leon"]),
  place("nuevo-leon", "Nuevo León", "state", "Neoleonés", "⛰️", "#6D4C41", ["Nuevo Leon"]),
  place("veracruz", "Veracruz", "state", "Veracruzano", "🎺", "#1565C0", ["Estado de Veracruz"]),
  place("oaxaca", "Oaxaca", "state", "Oaxaqueño", "🍫", "#E65100", ["Estado de Oaxaca"]),
  place("puebla", "Puebla", "state", "Poblano", "🏺", "#5D4037", ["Estado de Puebla"]),
  place("michoacan", "Michoacán", "state", "Michoacano", "🦋", "#6A1B9A", ["Michoacan"]),
  place("guerrero", "Guerrero", "state", "Guerrerense", "🎭", "#00838F", ["Estado de Guerrero"]),
  place("chiapas", "Chiapas", "state", "Chiapaneco", "🦜", "#00695C", ["Estado de Chiapas"]),
  place("yucatan", "Yucatán", "state", "Yucateco", "🌺", "#7B1FA2", ["Yucatan"]),
  place("campeche", "Campeche", "state", "Campechano", "🏰", "#AD1457", ["Estado de Campeche"]),
  place("quintana-roo", "Quintana Roo", "state", "Quintanarroense", "🐠", "#00897B", ["Estado de Quintana Roo"]),
  place("tabasco", "Tabasco", "state", "Tabasqueño", "🍫", "#558B2F", ["Estado de Tabasco"]),
  place("sinaloa", "Sinaloa", "state", "Sinaloense", "🥁", "#0277BD", ["Sinaloa"]),
  place("nayarit", "Nayarit", "state", "Nayarita", "🌊", "#0277BD", ["Estado de Nayarit"]),
  place("huasteca", "La Huasteca", "cultural-region", "Huasteco", "🎻", "#00838F", ["Huasteca", "Región Huasteca", "Region Huasteca"]),
  place("unclassified", "Por clasificar", "unclassified", "Por clasificar", "📍", "#757575", ["Desconocido", "Sin región", "Sin region"]),
] as const;

export const CULTURAL_RATINGS = ["familiar", "adulto"] as const;
export const CULTURAL_GENERATIONS = ["tradicional", "80s", "90s", "2000s", "actual"] as const;

export type CulturalPathId = typeof CULTURAL_PATH_IDS[number];
export type CulturalCollectionId = typeof CULTURAL_COLLECTION_IDS[number];
export type CulturalPlaceId = typeof CULTURAL_PLACE_IDS[number];
export type CulturalRating = typeof CULTURAL_RATINGS[number];
export type CulturalGeneration = typeof CULTURAL_GENERATIONS[number];
