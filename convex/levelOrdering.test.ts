import assert from "node:assert/strict";
import { completedWordIds, getOrderedLevels } from "./levelOrdering";

const level = (id: string, levelNumber: number) => ({ _id: `l-${id}`, wordId: id, levelNumber, reward: { coins: 1, diamonds: 0 } });
const words = [
  { _id: "legacy-b", word: "Sol", region: "Nacional" },
  { _id: "legacy-a", word: "Pan", region: "Nacional" },
  { _id: "retired", word: "Rayuela", region: "Nacional", editorialOrder: 1, isRetired: true, legacyWord: "Rayuela", legacyRegion: "Nacional" },
  { _id: "ordered-b", word: "Balero", region: "Nacional", editorialOrder: 2, legacyWord: "Balero", legacyRegion: "Nacional" },
  { _id: "ordered-a", word: "Trompo", region: "Nacional", editorialOrder: 1, legacyWord: "Trompo", legacyRegion: "Nacional" },
];
const levels = words.map((word, index) => level(word._id, index + 1));
const legacy = getOrderedLevels(levels, words, "");
assert.deepEqual(legacy.map((item) => item.wordId), ["legacy-b", "legacy-a", "ordered-b", "ordered-a", "retired"], "v1 reproduce el orden histórico exacto");
assert.ok(legacy.some((item) => item.wordId === "retired"), "v1 conserva retiradas para no reinterpretar currentLevel");
assert.deepEqual([...completedWordIds(legacy, 4)], ["legacy-b", "legacy-a", "ordered-b"]);
assert.ok(legacy.every((item) => !("difficultyRole" in item)), "v1 no cambia ni agrega metadatos");

const ordered = getOrderedLevels(levels, words, "", 2);
assert.deepEqual(ordered.slice(0, 2).map((item) => item.wordId), ["ordered-a", "ordered-b"]);
assert.ok(!ordered.some((item) => item.wordId === "retired"));
assert.deepEqual(ordered.slice(2).map((item) => item.wordId), ["legacy-b", "legacy-a"], "empates legacy conservan orden determinista previo");
assert.deepEqual([...completedWordIds(ordered, 3)], ["ordered-a", "ordered-b"], "los ids completados siguen siendo wordId estables");

const ties = getOrderedLevels(
  [level("z", 2), level("a", 1)],
  [{ _id: "z", word: "Zeta", region: "Nacional", editorialOrder: 3 }, { _id: "a", word: "Alfa", region: "Nacional", editorialOrder: 3 }],
  "",
  2,
);
assert.deepEqual(ties.map((item) => item.wordId), ["a", "z"]);
console.log("levelOrdering: orden editorial y legado válidos");

const historicalWords = [
  { _id: "old-a", word: "Sol", region: "Nacional" },
  { _id: "old-b", word: "Ferrocarril", region: "Norte", difficulty: 3 },
];
const historicalLevels = [level("old-a", 1), level("old-b", 2)];
const before = getOrderedLevels(historicalLevels, historicalWords, "returning");
const beforeIds = before.map((item) => item.wordId);
const beforeDone = [...completedWordIds(before, 2)];
const migratedWords = [
  { _id: "old-a", word: "Transformada", region: "Sur", difficulty: 3, isRetired: true, editorialOrder: 2, legacyWord: "Sol", legacyRegion: "Nacional" },
  { _id: "old-b", word: "Tren", region: "Nacional", difficulty: 1, editorialOrder: 3, legacyWord: "Ferrocarril", legacyRegion: "Norte", legacyDifficulty: 3 },
  { _id: "new", word: "Pan", region: "Nacional", difficulty: 1, editorialOrder: 1 },
];
const migratedLevels = [...historicalLevels, { ...level("new", 3), introducedOrderVersion: 2 }];
const afterV1 = getOrderedLevels(migratedLevels, migratedWords, "returning", 1);
assert.deepEqual(afterV1.map((item) => item.wordId), beforeIds);
assert.deepEqual([...completedWordIds(afterV1, 2)], beforeDone);
const afterV2 = getOrderedLevels(migratedLevels, migratedWords, "returning", 2);
assert.deepEqual(afterV2.map((item) => item.wordId), ["new", "old-b"]);

const waveWords = Array.from({ length: 20 }, (_, index) => ({
  _id: `wave-${index}`,
  word: `Palabra ${index}`,
  region: "Todo México",
  difficulty: ([2, 2, 1, 2, 1, 2, 2, 1, 2, 3, 2, 1, 2, 3, 2, 2, 1, 2, 2, 3] as const)[index],
  editorialOrder: 51 + index,
  pathId: "mercado-antojitos",
  rating: "familiar",
}));
const waveLevels = waveWords.map((word, index) => level(word._id, index + 1));
const waveOrdered = getOrderedLevels(waveLevels, waveWords, "persona", 2);
assert.deepEqual(waveOrdered.filter((item) => item.isChallenge).map((item) => item.position), [10, 20]);
assert.ok(waveOrdered.filter((item) => item.isChallenge).every((item) => item.difficultyBand === "surprise"));
assert.equal(new Set(waveOrdered.map((item) => item.wordId)).size, 20);
