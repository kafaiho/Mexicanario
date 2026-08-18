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

console.log("culturalLibrary: biblioteca y resumen mantienen progreso v1/v2");
