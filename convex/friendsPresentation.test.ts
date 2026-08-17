import assert from "node:assert/strict";
import { buildChallengeWordData } from "./friendsPresentation";

assert.deepEqual(buildChallengeWordData({
  word: "Jarana", meaning: "Instrumento", example: "Sonó la jarana.", region: "Veracruz",
  pathId: "musica-une", placeId: "veracruz", editorialOrder: 120,
}), {
  word: "Jarana", meaning: "Instrumento", example: "Sonó la jarana.", region: "Veracruz",
  pathId: "musica-une", placeId: "veracruz", editorialOrder: 120,
});

console.log("friends: el reto conserva metadatos culturales propios");
