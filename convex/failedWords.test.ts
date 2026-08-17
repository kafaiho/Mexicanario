import assert from "node:assert/strict";
import { buildDueReviewWord } from "./failedWordPresentation";

const record = { _id: "record", wordId: "word", failCount: 2, failedAt: 123 } as any;
const word = {
  word: "Balero", meaning: "Juguete", example: "Jugamos balero.", region: "Nacional",
  pathId: "patio-recreo", placeId: "todo-mexico", editorialOrder: 2,
} as any;
assert.deepEqual(buildDueReviewWord(record, word), {
  recordId: "record", wordId: "word", wordText: "Balero", meaning: "Juguete",
  example: "Jugamos balero.", region: "Nacional", pathId: "patio-recreo",
  placeId: "todo-mexico", editorialOrder: 2, failCount: 2, failedAt: 123,
});

console.log("failedWords: el repaso conserva metadatos culturales propios");
