import assert from "node:assert/strict";
import { buildCulturalMapItems, getCurrentPathPresentation } from "./culturalPathSelection.js";
import { MEXICO_VIVIDO_WORDS } from "../content/mexicoVividoWords.js";
import { CULTURAL_SEGMENTS } from "./culturalTaxonomy.js";

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
assert.equal(editorialBanners.length, CULTURAL_SEGMENTS.length, "un encabezado por tramo (camino + vuelta)");
assert.deepEqual(
  editorialBanners.map(({ zone, round, firstIndex, levelCount }) => [zone.id, round, firstIndex, firstIndex + levelCount - 1]),
  CULTURAL_SEGMENTS.map(({ pathId, round, start, end }) => [pathId, round, start, end]),
);
assert.deepEqual(
  editorialBanners.slice(0, 10).map(({ zone }) => zone.levels),
  CULTURAL_SEGMENTS.filter(({ round }) => round === 1).map(({ start, end }) => [start, end]),
);
assert.ok(editorialBanners.slice(10).every(({ round }) => round >= 2), "las ampliaciones son vueltas posteriores");

assert.equal(getCurrentPathPresentation({ pathId: "patio-recreo", culturalOrderVersion: 2 }).id, "patio-recreo");
assert.equal(getCurrentPathPresentation({ pathId: "patio-recreo", culturalOrderVersion: 1 }).isNeutral, true);
assert.equal(getCurrentPathPresentation({ culturalOrderVersion: 2 }).isNeutral, true);

console.log("culturalPathSelection: mapa explícito y fallback legacy neutral válidos");
