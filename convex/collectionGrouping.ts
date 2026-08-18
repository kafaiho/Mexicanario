import { CULTURAL_COLLECTIONS, CULTURAL_COLLECTION_IDS, CULTURAL_PLACES } from "./culturalTaxonomy";

export type CollectionWord = {
  _id: any;
  word: string;
  meaning: string;
  region?: string;
  category?: string;
  collectionId?: string;
  pathId?: string;
  placeId?: string;
  icon?: string;
  legacyRegion?: string;
};

export type CollectionLevel = { wordId: any; levelNumber: number };

export const COLLECTION_IDS = CULTURAL_COLLECTION_IDS;

const COLLECTION_SET = new Set<string>(COLLECTION_IDS);
const COLLECTION_META = new Map(CULTURAL_COLLECTIONS.map((item) => [item.id, item]));
const PLACE_META = new Map(CULTURAL_PLACES.map((item) => [item.id, item]));
const UNCLASSIFIED_COLLECTION = { id: "unclassified", name: "Por clasificar", icon: "📚", color: "#757575", description: "Contenido pendiente de revisión editorial." };
const LEGACY_COLLECTIONS: Record<string, string> = {
  Juegos: "juegos-ninez", "Juegos y Niñez": "juegos-ninez",
  Dulces: "dulces-antojitos",
  Comida: "cocina-bebidas", Gastronomia: "cocina-bebidas", "Comida Mexicana": "cocina-bebidas", Bebida: "cocina-bebidas", Bebidas: "cocina-bebidas",
  Refranes: "dichos-casa", "Refranes y Dichos": "dichos-casa",
  Escuela: "escuela-mexicana",
  // El antiguo contenedor mezclaba habla cotidiana y modismos; editorialmente
  // pertenece a Vida de Barrio, mientras cada entrada migrada manda por collectionId.
  Modismos: "vida-barrio", Expresiones: "vida-barrio", Jerga: "vida-barrio", Slang: "vida-barrio", Popular: "vida-barrio", "Tipos Sociales": "vida-barrio", "Verbos del Barrio": "vida-barrio", "Vida Cotidiana": "vida-barrio", "Expresiones y Modismos": "vida-barrio",
  // Bucket histórico mixto: queda en cultura popular solo como compatibilidad;
  // deporte y demás entradas ya migradas prevalecen mediante collectionId.
  Telenovelas: "tele-cultura-popular", "Cultura Popular": "tele-cultura-popular", "Cultura Popular y Deportes": "tele-cultura-popular",
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
  Tacos: "cocina-bebidas",
};

/** Inventario auditado de categorías históricas de seeds, parches y migraciones. */
export const KNOWN_LEGACY_COLLECTION_NAMES = Object.freeze(Object.keys(LEGACY_COLLECTIONS));

export function resolveLegacyCollectionName(name: string | undefined): string {
  return name ? LEGACY_COLLECTIONS[name] ?? "unclassified" : "unclassified";
}

type PlaceKind = "country" | "city" | "state" | "cultural-region" | "legacy-region" | "unclassified";
const PLACE_KIND = Object.fromEntries(CULTURAL_PLACES.map((item) => [item.id, item.kind])) as Record<string, PlaceKind>;
function normalizePlaceKey(value: string) {
  return value.trim().toLocaleLowerCase("es-MX").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}
const PLACE_BY_LEGACY_KEY = new Map<string, string>();
for (const place of CULTURAL_PLACES) {
  for (const value of [place.id, place.name, ...place.aliases]) PLACE_BY_LEGACY_KEY.set(normalizePlaceKey(value), place.id);
}

function wordMap(words: CollectionWord[]) {
  return new Map(words.map((word) => [word._id.toString(), word]));
}

function collectionFor(word: CollectionWord) {
  if (word.collectionId) return COLLECTION_SET.has(word.collectionId) ? word.collectionId : "unclassified";
  return resolveLegacyCollectionName(word.category);
}

function resolvedPlace(word: CollectionWord) {
  if (word.placeId) return PLACE_META.has(word.placeId) ? word.placeId : "unclassified";
  return PLACE_BY_LEGACY_KEY.get(normalizePlaceKey(word.region ?? "")) ?? "unclassified";
}

function payload(level: CollectionLevel, word: CollectionWord, completed: Set<string>, collectionId: string, placeKindOverride?: PlaceKind) {
  const placeId = resolvedPlace(word);
  const place = PLACE_META.get(placeId) ?? PLACE_META.get("unclassified")!;
  return {
    levelNumber: level.levelNumber,
    word: word.word,
    meaning: word.meaning,
    collectionId,
    pathId: word.pathId ?? "unclassified",
    placeId,
    icon: word.icon ?? "",
    placeName: place.name,
    placeKind: placeKindOverride ?? place.kind,
    legacyRegion: word.legacyRegion ?? (!word.placeId ? word.region ?? "" : ""),
    region: word.region ?? "",
    isCompleted: completed.has(word._id.toString()),
  };
}

export function groupCulturalLibrary(levels: CollectionLevel[], words: CollectionWord[], completed: Set<string>, currentLevel: number, includeWords = true) {
  const byWord = wordMap(words);
  const collectionGroups = new Map<string, any>();
  const placeGroups = new Map<string, any>();
  levels.forEach((level, position) => {
    const word = byWord.get(level.wordId.toString());
    if (!word) return;
    const collectionId = collectionFor(word);
    let collectionGroup = collectionGroups.get(collectionId);
    if (!collectionGroup) {
      const meta = COLLECTION_META.get(collectionId) ?? UNCLASSIFIED_COLLECTION;
      collectionGroup = { ...meta, id: collectionId, total: 0, completed: 0, unlockLevel: position + 1, isUnlocked: currentLevel >= position + 1, needsReview: collectionId === "unclassified", ...(includeWords ? { words: [] } : {}) };
      collectionGroups.set(collectionId, collectionGroup);
    }
    const isCompleted = completed.has(word._id.toString());
    if (includeWords) collectionGroup.words.push(payload(level, word, completed, collectionId));
    collectionGroup.total++;
    if (isCompleted) collectionGroup.completed++;

    const canonical = !!word.placeId;
    const resolvedId = resolvedPlace(word);
    const isLegacy = !canonical && resolvedId !== "unclassified";
    const placeGroupId = isLegacy ? `legacy:${resolvedId}` : resolvedId;
    const baseKind = PLACE_KIND[resolvedId] ?? "unclassified";
    const kind = isLegacy ? "legacy-region" : baseKind;
    let placeGroup = placeGroups.get(placeGroupId);
    if (!placeGroup) {
      const meta = PLACE_META.get(resolvedId) ?? PLACE_META.get("unclassified")!;
      placeGroup = { key: placeGroupId, id: placeGroupId, placeId: resolvedId, name: isLegacy ? word.region ?? meta.name : meta.name, demonym: meta.demonym, icon: meta.icon, color: meta.color, kind, isLegacyGroup: isLegacy, isUnclassified: resolvedId === "unclassified", needsReview: resolvedId === "unclassified", legacyName: !canonical ? word.region ?? "" : "", total: 0, completed: 0, ...(includeWords ? { words: [] } : {}) };
      placeGroups.set(placeGroupId, placeGroup);
    }
    if (includeWords) placeGroup.words.push(payload(level, word, completed, collectionId, kind));
    placeGroup.total++;
    if (isCompleted) placeGroup.completed++;
  });
  const collections = [...collectionGroups.values()].sort((a, b) => Number(b.isUnlocked) - Number(a.isUnlocked) || (b.completed / b.total) - (a.completed / a.total) || a.unlockLevel - b.unlockLevel || a.id.localeCompare(b.id));
  const places = [...placeGroups.values()].sort((a, b) => (b.completed / b.total) - (a.completed / a.total) || a.id.localeCompare(b.id));
  return { collections, places };
}

export function groupCollections(levels: CollectionLevel[], words: CollectionWord[], completed: Set<string>, currentLevel: number) {
  return groupCulturalLibrary(levels, words, completed, currentLevel).collections;
}

export function groupPlaces(levels: CollectionLevel[], words: CollectionWord[], completed: Set<string>) {
  return groupCulturalLibrary(levels, words, completed, 1).places;
}
