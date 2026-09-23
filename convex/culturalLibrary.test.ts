import assert from "node:assert/strict";
import { buildCulturalLibrary, buildCulturalProgressSummary } from "./culturalLibrary";

const levels = [
  { _id: "l1", wordId: "w1", levelNumber: 1, reward: { coins: 0, diamonds: 0 } },
  { _id: "l2", wordId: "w2", levelNumber: 2, reward: { coins: 0, diamonds: 0 }, introducedOrderVersion: 2 },
];
const words = [
  { _id: "w1", word: "Balero renovado", legacyWord: "Balero", meaning: "Juego", region: "Todo México", legacyRegion: "Nacional", category: "Juegos", collectionId: "juegos-ninez", placeId: "todo-mexico", editorialOrder: 2 },
  { _id: "w2", word: "Trompo", meaning: "Juego", region: "Todo México", category: "Juegos", collectionId: "juegos-ninez", placeId: "todo-mexico", editorialOrder: 1 },
];

for (const version of [1, 2]) {
  const library = buildCulturalLibrary(levels, words, "user", 2, version);
  const summary = buildCulturalProgressSummary(levels, words, "user", 2, version);
  assert.equal(library.culturalOrderVersion, version);
  assert.equal(library.collections[0].completed, 1);
  assert.equal(library.places[0].completed, 1);
  assert.equal(library.collections[0].unlockLevel, 1);
  assert.equal(summary.collections[0].completed, library.collections[0].completed);
  assert.equal(summary.places[0].completed, library.places[0].completed);
  assert.equal("words" in summary.collections[0], false, "summary never returns collection words");
  assert.equal("words" in summary.places[0], false, "summary never returns place words");
}

const regionalLevels = [
  { _id: "cdmx-level", wordId: "cdmx-word", levelNumber: 1, reward: { coins: 0, diamonds: 0 } },
  { _id: "bato-level", wordId: "bato-word", levelNumber: 2, reward: { coins: 0, diamonds: 0 } },
];
const regionalWords = [
  {
    _id: "cdmx-word", word: "Vecindad", legacyWord: "Vecindad", meaning: "Vivienda colectiva",
    region: "cdmx", legacyRegion: "CDMX", collectionId: "vida-barrio", placeId: "cdmx",
    pathId: "calle-barrio", icon: "🏘️", difficulty: 2, editorialOrder: 52,
  },
  {
    _id: "bato-word", word: "Bato", legacyWord: "Bato", meaning: "Muchacho u hombre, en lenguaje popular.",
    region: "Noroeste y occidente", legacyRegion: "Noroeste y occidente", collectionId: "regiones-hablas",
    placeId: "sinaloa", pathId: "mexico-regional", icon: "🧢", difficulty: 2,
    legacyDifficulty: 2, isRetired: true,
  },
];
const legacyRegionalLibrary = buildCulturalLibrary(regionalLevels, regionalWords, "legacy-user", 1, 1);
const editorialRegionalLibrary = buildCulturalLibrary(regionalLevels, regionalWords, "editorial-user", 1, 2);
assert.deepEqual(
  legacyRegionalLibrary.places.find((place: any) => place.id === "cdmx")?.words.map((word: any) => word.word),
  ["Vecindad"],
  "el apartado CDMX no incorpora regionalismos retirados",
);
assert.equal(
  legacyRegionalLibrary.places.find((place: any) => place.id === "sinaloa")?.words[0].word,
  "Bato",
  "la compatibilidad v1 conserva el nivel corregido fuera de CDMX",
);
assert.equal(
  editorialRegionalLibrary.places.some((place: any) => place.words.some((word: any) => word.word === "Bato")),
  false,
  "el orden editorial v2 oculta bato retirado",
);

console.log("culturalLibrary: biblioteca y resumen mantienen progreso v1/v2");
