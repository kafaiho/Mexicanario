import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const usersSource = readFileSync(join(here, "users.ts"), "utf8");
const levelsSource = readFileSync(join(here, "levels.ts"), "utf8");
const orderingSource = readFileSync(join(here, "levelOrdering.ts"), "utf8");
const gameplaySource = readFileSync(join(here, "../src/screens/GameplayScreen.jsx"), "utf8");

for (const field of ["difficultyRole", "difficultyBand", "isChallenge", "difficultyDeviation"]) {
  assert.match(usersSource, new RegExp(`${field}: levelConfig\\.`), `users.getCurrentLevel debe exponer ${field}`);
}

assert.match(levelsSource, /getLevelByNumber[\s\S]*userId: v\.optional\(v\.id\("users"\)\)/);
assert.match(levelsSource, /difficultyRole: null[\s\S]*difficultyBand: null[\s\S]*isChallenge: false[\s\S]*difficultyDeviation: null/);
assert.match(levelsSource, /getOrderedLevels\([\s\S]*orderedLevel[\s\S]*difficultyRole: orderedLevel\.difficultyRole/);
assert.match(gameplaySource, /getLevelByNumber,[\s\S]*\{ levelNumber: reviewLevelParam, userId \}/);
assert.match(orderingSource, /word: word\?\.word[\s\S]*placeId: word\?\.placeId/, "el planificador recibe los factores de puntuación contextuales");

console.log("difficulty metadata contract: juego, mapa y repaso comparten contexto v2");
