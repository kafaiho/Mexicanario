import assert from "node:assert/strict";
import { groupCollections, groupPlaces } from "./collectionGrouping";
import { completedWordIds, getOrderedLevels } from "./levelOrdering";

const level = (id: string, wordId: string, levelNumber: number) => ({
  _id: id,
  wordId,
  levelNumber,
  reward: { coins: 0, diamonds: 0 },
});

const words = [
  { _id: "w1", word: "Balero", meaning: "Juguete", region: "Nacional", category: "Juegos", collectionId: "juegos-ninez", pathId: "patio-recreo", placeId: "todo-mexico", icon: "🪀", editorialOrder: 3 },
  { _id: "w2", word: "Caballito", meaning: "Juego", region: "Infantil", category: "Juegos", collectionId: "juegos-ninez", placeId: "sinaloa", editorialOrder: 8 },
  { _id: "w3", word: "Torta ahogada", meaning: "Platillo", region: "Jalisco", category: "Comida" },
  { _id: "w4", word: "Son huasteco", meaning: "Música", region: "Huasteca", category: "Música" },
  { _id: "w5", word: "Xtabay", meaning: "Leyenda", region: "Yucatán", category: "Leyendas", placeId: "misterio", collectionId: "coleccion-rara" },
  { _id: "w6", word: "Bomba", meaning: "Expresión", region: "Campeche", category: "Expresiones", placeId: "campeche", collectionId: "regiones-hablas" },
  { _id: "w7", word: "Pib", meaning: "Comida", region: "Quintana Roo", category: "Comida", placeId: "quintana-roo", collectionId: "cocina-bebidas" },
  { _id: "w8", word: "Pejelagarto", meaning: "Comida", region: "Tabasco", category: "Comida", placeId: "tabasco", collectionId: "cocina-bebidas" },
  { _id: "w9", word: "Cabrito", meaning: "Comida", region: "Nuevo León", category: "Comida", placeId: "monterrey", collectionId: "cocina-bebidas" },
  { _id: "w10", word: "Tapatío", meaning: "De Guadalajara", region: "Jalisco", category: "Regionalismos", placeId: "guadalajara", collectionId: "regiones-hablas" },
  { _id: "w11", word: "Nayarita", meaning: "De Nayarit", region: "Nayarit", category: "Regionalismos", placeId: "nayarit", collectionId: "regiones-hablas" },
  { _id: "w12", word: "Desubicado", meaning: "Revisión", region: "Planeta X", category: "Categoría X" },
  { _id: "w13", word: "Mariachi", meaning: "Música", region: "Jalisco", category: "Música", placeId: "jalisco", collectionId: "musica-mexicana" },
  { _id: "w14", word: "Defeño", meaning: "De la capital", region: "DF", category: "Regionalismos" },
];
const levels = words.map((word, index) => level(`l${index + 1}`, word._id, index + 1));

const collections = groupCollections(levels, words, new Set(["w1", "w3"]), 4);
assert.equal(collections.find((item) => item.id === "juegos-ninez")?.total, 2, "collectionId groups before legacy category");
assert.equal(collections.find((item) => item.id === "juegos-ninez")?.unlockLevel, 1, "unlock is first occurrence in ordered gameplay");
assert.equal(collections.find((item) => item.id === "juegos-ninez")?.name, "Juegos de la Niñez");
assert.equal(collections.find((item) => item.id === "juegos-ninez")?.icon, "🪀");
assert.equal(collections.find((item) => item.id === "juegos-ninez")?.words[0].pathId, "patio-recreo");
assert.equal(collections.find((item) => item.id === "juegos-ninez")?.words[0].icon, "🪀");
assert.equal(collections.find((item) => item.id === "juegos-ninez")?.words[0].collectionId, "juegos-ninez");
assert.equal(collections.find((item) => item.id === "juegos-ninez")?.words[0].placeName, "Todo México");
assert.equal(collections.find((item) => item.id === "cocina-bebidas")?.completed, 1, "legacy category falls back to a canonical collection id");
assert.equal(collections.find((item) => item.id === "unclassified")?.needsReview, true, "unknown collection is reviewable, not silently reassigned");

const places = groupPlaces(levels, words, new Set(["w1"]));
assert.equal(places.find((item) => item.id === "sinaloa")?.isLegacyGroup, false);
assert.equal(places.find((item) => item.id === "sinaloa")?.name, "Sinaloa");
assert.equal(places.find((item) => item.id === "sinaloa")?.key, "sinaloa");
assert.equal(places.find((item) => item.id === "sinaloa")?.isUnclassified, false);
assert.equal(places.find((item) => item.id === "sinaloa")?.words[0].placeKind, "state");
assert.equal(places.find((item) => item.id === "legacy:huasteca")?.kind, "legacy-region", "unmigrated Huasteca remains an independent legacy group");
assert.equal(places.find((item) => item.id === "legacy:cdmx")?.name, "DF", "client-recognized aliases resolve identically on the server");
assert.equal(places.find((item) => item.id === "legacy:jalisco")?.words[0].placeKind, "legacy-region");
assert.equal(places.find((item) => item.id === "legacy:jalisco")?.kind, "legacy-region", "legacy state remains explicit instead of a broad macro-region");
assert.equal(places.find((item) => item.id === "jalisco")?.kind, "state", "canonical and legacy place groups never merge by input order");
assert.equal(places.find((item) => item.id === "campeche")?.kind, "state");
assert.equal(places.find((item) => item.id === "quintana-roo")?.kind, "state");
assert.equal(places.find((item) => item.id === "tabasco")?.kind, "state");
assert.equal(places.find((item) => item.id === "monterrey")?.kind, "city");
assert.equal(places.find((item) => item.id === "guadalajara")?.kind, "city");
assert.equal(places.find((item) => item.id === "nayarit")?.kind, "state");
assert.equal(places.find((item) => item.id === "unclassified")?.needsReview, true, "unknown place is never mapped to Todo México");
assert.ok(places.every((item) => item.total > 0), "empty groups are omitted");

const legacyLevels = [level("legacy-a", "w1", 1), level("legacy-b", "w2", 2)];
const legacyWords = words.slice(0, 2).map(({ editorialOrder: _editorialOrder, ...word }) => word);
const v1 = getOrderedLevels(legacyLevels, legacyWords, "user", 1);
const v2 = getOrderedLevels(legacyLevels, words.slice(0, 2), "user", 2);
assert.deepEqual([...completedWordIds(v1, 2)], [v1[0].wordId], "v1 completion preserves the ordered prefix");
assert.deepEqual([...completedWordIds(v2, 2)], [v2[0].wordId], "v2 completion follows the editorial prefix");

console.log("collectionGrouping tests passed");
