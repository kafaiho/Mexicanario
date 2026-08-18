import assert from "node:assert/strict";
import { buildCulturalMapItems, getCurrentPathPresentation } from "./culturalPathSelection.js";
import { MEXICO_VIVIDO_WORDS } from "../content/mexicoVividoWords.js";

const shuffledLegacy = [
  { levelNumber: 91, pathId: "historias-leyendas" },
  { levelNumber: 3, pathId: "patio-recreo" },
  { levelNumber: 44, pathId: "historias-leyendas" },
  { levelNumber: 8 },
];
const items = buildCulturalMapItems(shuffledLegacy, 1);
assert.equal(new Set(items.map(({ key }) => key)).size, items.length, "cada banner repetido necesita key estable y única");
assert.ok(items.every(({ key }) => typeof key === "string" && key.length > 0));
const levels = items.filter(({ type }) => type === "level");
assert.ok(levels.every(({ path, zone }) => path === null && zone.isNeutral));
const legacyBanners = items.filter(({ type }) => type === "path");
assert.equal(legacyBanners.length, 1);
assert.equal(legacyBanners[0].zone.name, "Tu recorrido");
assert.equal(legacyBanners[0].zone.levels, null);

const editorialLevels = MEXICO_VIVIDO_WORDS.map((word, index) => ({
  levelNumber: index + 1,
  pathId: word.pathId,
  editorialOrder: word.order,
}));
const editorialItems = buildCulturalMapItems(editorialLevels, 2);
const editorialBanners = editorialItems.filter(({ type }) => type === "path");
assert.equal(editorialBanners.length, 10);
assert.deepEqual(editorialBanners.map(({ zone }) => zone.levels), [
  [1, 20], [21, 40], [41, 65], [66, 85], [86, 106],
  [107, 126], [127, 146], [147, 166], [167, 186], [187, 206],
]);

assert.equal(getCurrentPathPresentation({ pathId: "patio-recreo", culturalOrderVersion: 2 }).id, "patio-recreo");
assert.equal(getCurrentPathPresentation({ pathId: "patio-recreo", culturalOrderVersion: 1 }).isNeutral, true);
assert.equal(getCurrentPathPresentation({ culturalOrderVersion: 2 }).isNeutral, true);

console.log("culturalPathSelection: mapa explícito y fallback legacy neutral válidos");
