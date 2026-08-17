import assert from "node:assert/strict";
import { completedWordIds, getOrderedLevels } from "./levelOrdering";

const level = (id: string, levelNumber: number) => ({ _id: `l-${id}`, wordId: id, levelNumber, reward: { coins: 1, diamonds: 0 } });
const words = [
  { _id: "legacy-b", word: "Sol", region: "Nacional" },
  { _id: "legacy-a", word: "Pan", region: "Nacional" },
  { _id: "retired", word: "Rayuela", region: "Nacional", editorialOrder: 1, isRetired: true },
  { _id: "ordered-b", word: "Balero", region: "Nacional", editorialOrder: 2 },
  { _id: "ordered-a", word: "Trompo", region: "Nacional", editorialOrder: 1 },
];
const levels = words.map((word, index) => level(word._id, index + 1));
const legacy = getOrderedLevels(levels, words, "");
assert.deepEqual(legacy.map((item) => item.wordId), ["legacy-b", "legacy-a", "ordered-b", "ordered-a", "retired"], "v1 reproduce el orden histórico exacto");
assert.ok(legacy.some((item) => item.wordId === "retired"), "v1 conserva retiradas para no reinterpretar currentLevel");
assert.deepEqual([...completedWordIds(legacy, 4)], ["legacy-b", "legacy-a", "ordered-b"]);

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
