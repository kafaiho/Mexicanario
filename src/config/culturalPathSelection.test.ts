import assert from "node:assert/strict";
import { buildCulturalMapItems, getCurrentPathPresentation } from "./culturalPathSelection.js";

const shuffledLegacy = [
  { levelNumber: 91, pathId: "historias-leyendas" },
  { levelNumber: 3, pathId: "patio-recreo" },
  { levelNumber: 44, pathId: "historias-leyendas" },
  { levelNumber: 8 },
];
const items = buildCulturalMapItems(shuffledLegacy);
assert.equal(new Set(items.map(({ key }) => key)).size, items.length, "cada banner repetido necesita key estable y única");
assert.ok(items.every(({ key }) => typeof key === "string" && key.length > 0));
const levels = items.filter(({ type }) => type === "level");
assert.deepEqual(levels.map(({ path }) => path?.id ?? null), [
  "historias-leyendas", "patio-recreo", "historias-leyendas", null,
]);
assert.equal(levels[0].path.id, shuffledLegacy[0].pathId);
assert.equal(levels[1].path.id, shuffledLegacy[1].pathId);
assert.equal(levels[3].zone.isNeutral, true, "un nivel sin pathId no debe inferirse por posición");
assert.deepEqual(items.filter(({ type }) => type === "path").map(({ path }) => path?.id ?? null), [
  "historias-leyendas", "patio-recreo", "historias-leyendas", null,
]);

assert.equal(getCurrentPathPresentation({ pathId: "patio-recreo", culturalOrderVersion: 2 }).id, "patio-recreo");
assert.equal(getCurrentPathPresentation({ pathId: "patio-recreo", culturalOrderVersion: 1 }).isNeutral, true);
assert.equal(getCurrentPathPresentation({ culturalOrderVersion: 2 }).isNeutral, true);

console.log("culturalPathSelection: mapa explícito y fallback legacy neutral válidos");
