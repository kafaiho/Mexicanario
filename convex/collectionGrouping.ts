export type CollectionWord = {
  _id: any;
  word: string;
  meaning: string;
  region?: string;
  category?: string;
  collectionId?: string;
  placeId?: string;
  legacyRegion?: string;
};

export type CollectionLevel = { wordId: any; levelNumber: number };

export const COLLECTION_IDS = [
  "juegos-ninez", "dulces-antojitos", "cocina-bebidas", "dichos-casa",
  "escuela-mexicana", "vida-barrio", "tele-cultura-popular", "musica-mexicana",
  "fiestas-tradiciones", "naturaleza-mexico", "pueblos-originarios-lenguas",
  "oficios-artesanias", "regiones-hablas", "historia-personajes", "lugares-mexico",
  "leyendas-relatos", "ciencia-inventos-deporte", "mexico-digital", "albures-picaresca",
] as const;

const COLLECTION_SET = new Set<string>(COLLECTION_IDS);
const LEGACY_COLLECTIONS: Record<string, string> = {
  Juegos: "juegos-ninez", "Juegos y Niñez": "juegos-ninez",
  Dulces: "dulces-antojitos",
  Comida: "cocina-bebidas", Gastronomia: "cocina-bebidas", "Comida Mexicana": "cocina-bebidas", Bebida: "cocina-bebidas", Bebidas: "cocina-bebidas",
  Refranes: "dichos-casa", "Refranes y Dichos": "dichos-casa",
  Escuela: "escuela-mexicana",
  Modismos: "vida-barrio", Expresiones: "vida-barrio", Jerga: "vida-barrio", Slang: "vida-barrio", Popular: "vida-barrio", "Tipos Sociales": "vida-barrio", "Verbos del Barrio": "vida-barrio", "Vida Cotidiana": "vida-barrio",
  Telenovelas: "tele-cultura-popular", "Cultura Popular": "tele-cultura-popular",
  Música: "musica-mexicana", Musica: "musica-mexicana", Artistas: "musica-mexicana", Músicos: "musica-mexicana", "Música y Artistas": "musica-mexicana", "Corridos Tumbados": "musica-mexicana",
  Tradiciones: "fiestas-tradiciones", "Tradiciones y Fiestas": "fiestas-tradiciones",
  Animales: "naturaleza-mexico", "Animales de México": "naturaleza-mexico", Plantas: "naturaleza-mexico", Flora: "naturaleza-mexico", "Flora Mexicana": "naturaleza-mexico", "Remedios Caseros": "naturaleza-mexico",
  "Artesanías de México": "oficios-artesanias",
  Regionalismos: "regiones-hablas",
  Historia: "historia-personajes", Civilizaciones: "historia-personajes", "Historia de México": "historia-personajes",
  Monumentos: "lugares-mexico", "Monumentos y Lugares": "lugares-mexico",
  Leyendas: "leyendas-relatos", "Leyendas y Mitos": "leyendas-relatos",
  Deportes: "ciencia-inventos-deporte", "Deportes Mexicanos": "ciencia-inventos-deporte", Futbolistas: "ciencia-inventos-deporte",
  Digital: "mexico-digital", Streamers: "mexico-digital", "Jerga Digital": "mexico-digital", "Cultura Digital": "mexico-digital", "Mundo Digital": "mexico-digital",
  Albures: "albures-picaresca", Picaresca: "albures-picaresca", "Albures y Picaresca": "albures-picaresca",
};

type PlaceKind = "country" | "city" | "state" | "cultural-region" | "legacy-region" | "unclassified";
const PLACE_KIND: Record<string, PlaceKind> = {
  "todo-mexico": "country", cdmx: "city", guadalajara: "city", jalisco: "state",
  monterrey: "city", "nuevo-leon": "state", veracruz: "state", oaxaca: "state",
  puebla: "state", michoacan: "state", guerrero: "state", chiapas: "state",
  yucatan: "state", campeche: "state", "quintana-roo": "state", tabasco: "state",
  sinaloa: "state", nayarit: "state", huasteca: "cultural-region", unclassified: "unclassified",
};
const LEGACY_PLACE: Record<string, string> = {
  "Todo México": "todo-mexico", Nacional: "todo-mexico", México: "todo-mexico",
  CDMX: "cdmx", "Ciudad de México": "cdmx", Jalisco: "jalisco", Guadalajara: "guadalajara",
  Monterrey: "monterrey", "Nuevo León": "nuevo-leon", Veracruz: "veracruz", Oaxaca: "oaxaca",
  Puebla: "puebla", Michoacán: "michoacan", Guerrero: "guerrero", Chiapas: "chiapas",
  Yucatán: "yucatan", Campeche: "campeche", "Quintana Roo": "quintana-roo", Tabasco: "tabasco",
  Sinaloa: "sinaloa", Nayarit: "nayarit", Huasteca: "huasteca", "La Huasteca": "huasteca",
};

function wordMap(words: CollectionWord[]) {
  return new Map(words.map((word) => [word._id.toString(), word]));
}

function collectionFor(word: CollectionWord) {
  if (word.collectionId) return COLLECTION_SET.has(word.collectionId) ? word.collectionId : "unclassified";
  return word.category ? LEGACY_COLLECTIONS[word.category] ?? "unclassified" : "unclassified";
}

export function groupCollections(levels: CollectionLevel[], words: CollectionWord[], completed: Set<string>, currentLevel: number) {
  const byWord = wordMap(words);
  const groups = new Map<string, any>();
  levels.forEach((level, position) => {
    const word = byWord.get(level.wordId.toString());
    if (!word) return;
    const id = collectionFor(word);
    let group = groups.get(id);
    if (!group) {
      group = { id, total: 0, completed: 0, unlockLevel: position + 1, isUnlocked: currentLevel >= position + 1, needsReview: id === "unclassified", words: [] };
      groups.set(id, group);
    }
    const isCompleted = completed.has(word._id.toString());
    group.words.push({ levelNumber: level.levelNumber, word: word.word, meaning: word.meaning, placeId: word.placeId, region: word.region, legacyRegion: word.legacyRegion, isCompleted });
    group.total++;
    if (isCompleted) group.completed++;
  });
  return [...groups.values()].sort((a, b) => Number(b.isUnlocked) - Number(a.isUnlocked) || (b.completed / b.total) - (a.completed / a.total) || a.unlockLevel - b.unlockLevel || a.id.localeCompare(b.id));
}

export function groupPlaces(levels: CollectionLevel[], words: CollectionWord[], completed: Set<string>) {
  const byWord = wordMap(words);
  const groups = new Map<string, any>();
  for (const level of levels) {
    const word = byWord.get(level.wordId.toString());
    if (!word) continue;
    const canonical = !!word.placeId;
    const resolvedId = canonical && PLACE_KIND[word.placeId!] ? word.placeId! : canonical ? "unclassified" : LEGACY_PLACE[word.region ?? ""] ?? "unclassified";
    const isLegacy = !canonical && resolvedId !== "unclassified";
    const id = isLegacy ? `legacy:${resolvedId}` : resolvedId;
    const baseKind = PLACE_KIND[resolvedId] ?? "unclassified";
    const kind = isLegacy ? "legacy-region" : baseKind;
    let group = groups.get(id);
    if (!group) {
      group = { id, placeId: resolvedId, kind, isLegacyGroup: isLegacy, needsReview: resolvedId === "unclassified", legacyName: !canonical ? word.region : undefined, total: 0, completed: 0, words: [] };
      groups.set(id, group);
    }
    const isCompleted = completed.has(word._id.toString());
    group.words.push({ levelNumber: level.levelNumber, word: word.word, meaning: word.meaning, placeId: canonical ? word.placeId : undefined, region: word.region, legacyRegion: word.legacyRegion, isCompleted });
    group.total++;
    if (isCompleted) group.completed++;
  }
  return [...groups.values()].sort((a, b) => (b.completed / b.total) - (a.completed / a.total) || a.id.localeCompare(b.id));
}
