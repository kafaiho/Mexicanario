import assert from "node:assert/strict";
import { MEXICO_VIVIDO_WORDS } from "./migrations/mexicoVividoCatalog.generated";
import { difficultyScore, expectedDifficulty, planDifficultyWaves } from "./difficultyWaves";

const catalog = MEXICO_VIVIDO_WORDS.map((entry) => ({
  id: entry.conceptId,
  word: entry.word,
  difficulty: entry.difficulty,
  rating: entry.rating,
  pathId: entry.pathId,
  placeId: entry.placeId,
  editorialOrder: entry.order,
}));

assert.equal(expectedDifficulty(50), 1);
assert.equal(expectedDifficulty(51), 2);
assert.equal(expectedDifficulty(131), 2);
assert.ok(
  difficultyScore({ word: "sol", difficulty: 3, placeId: "todo-mexico" }, 80)
    > difficultyScore({ word: "expresión muy larga", difficulty: 2, placeId: "oaxaca" }, 80),
  "la dificultad editorial explícita debe dominar los factores contextuales",
);
assert.equal(
  difficultyScore({ word: "mole", difficulty: 2, placeId: "todo-mexico", pathId: "patio-recreo" }, 40),
  difficultyScore({ word: "mole", difficulty: 2, placeId: "oaxaca", pathId: "mexico-profundo" }, 180),
  "la región, el camino y la posición no deben hacer una palabra más difícil",
);

const planned = planDifficultyWaves(catalog, "persona-real", 2);
const placeVariant = catalog.slice(0, 10).map((item, index) => ({ ...item, placeId: index % 2 ? "oaxaca" : "todo-mexico" }));
const placeVariantChanged = placeVariant.map((item) => ({ ...item, placeId: item.placeId === "oaxaca" ? "todo-mexico" : "oaxaca" }));
const rolesById = (items: ReturnType<typeof planDifficultyWaves<typeof placeVariant[number]>>) => new Map(items.map((item) => [item.id, item.difficultyRole]));
assert.deepEqual(rolesById(planDifficultyWaves(placeVariant, "region-neutral", 2)), rolesById(planDifficultyWaves(placeVariantChanged, "region-neutral", 2)));
const counts = planned.reduce<Record<string, number>>((result, item) => {
  result[item.difficultyRole] = (result[item.difficultyRole] ?? 0) + 1;
  return result;
}, {});
assert.deepEqual(counts, { expected: 124, rest: 52, surprise: 30 });
assert.equal(planned.filter((item) => item.deviation).length, 0, "el catálogo real no necesita fallback");

const challenges = planned.filter((item) => item.isChallenge);
assert.deepEqual(challenges.map((item) => item.position), Array.from({ length: 20 }, (_, index) => (index + 1) * 10));
assert.ok(challenges.every((item) => item.difficultyRole === "surprise" && item.difficultyBand === "surprise"));
for (const challenge of challenges) {
  const blockStart = Math.floor((challenge.position - 1) / 10) * 10;
  const comparable = planned.slice(blockStart, blockStart + 10).filter((item) => item.pathId === challenge.pathId);
  assert.ok(comparable.every((item) => difficultyScore(challenge, challenge.editorialOrder) >= difficultyScore(item, item.editorialOrder)));
}

assert.ok(planned.slice(0, 50).every((item) => item.difficulty !== 3 && item.rating === "familiar"));
const averageDifficulty = (items: typeof planned) => items.reduce((sum, item) => sum + item.difficulty, 0) / items.length;
const averageLinguistic = (items: typeof planned) => items.reduce((sum, item) => sum + difficultyScore({ ...item, difficulty: 1 }, 1), 0) / items.length;
const difficultyAverages = [planned.slice(0, 50), planned.slice(50, 130), planned.slice(130)].map(averageDifficulty);
const linguisticAverages = [planned.slice(0, 50), planned.slice(50, 130), planned.slice(130)].map(averageLinguistic);
assert.ok(difficultyAverages[0] <= difficultyAverages[1] && difficultyAverages[1] <= difficultyAverages[2], difficultyAverages.join(" <= "));
assert.ok(linguisticAverages.every(Number.isFinite), "la complejidad lingüística cruda debe quedar diagnosticada por tramo");

const same = planDifficultyWaves(catalog, "persona-real", 2);
const another = planDifficultyWaves(catalog, "otra-persona", 2);
assert.deepEqual(planned, same);
assert.notDeepEqual(planned.map((item) => item.id), another.map((item) => item.id));
assert.deepEqual(planned.map((item) => item.difficultyRole), another.map((item) => item.difficultyRole));

const originalIndex = new Map(catalog.map((item, index) => [item.id, index]));
assert.ok(planned.every((item, index) => Math.abs(index - originalIndex.get(item.id)!) <= 9));
assert.equal(new Set(planned.map((item) => item.id)).size, catalog.length);
assert.deepEqual([...new Set(planned.map((item) => item.pathId))], [...new Set(catalog.map((item) => item.pathId))]);

const partial = planDifficultyWaves(catalog.slice(0, 13), "parcial", 2);
assert.equal(partial.length, 13);
assert.equal(new Set(partial.map((item) => item.id)).size, 13);
assert.ok(partial.every((item) => item.difficultyRole === item.difficultyBand));
assert.ok(partial.filter((item) => item.isChallenge).every((item) => item.difficultyRole === "surprise"));

console.log(`difficultyWaves real: ${counts.expected}/${counts.rest}/${counts.surprise}, ${challenges.length} retos, ${planned.filter((item) => item.deviation).length} desviaciones; dificultad ${difficultyAverages.map((value) => value.toFixed(2)).join("/")}; lingüística ${linguisticAverages.map((value) => value.toFixed(2)).join("/")}`);
