import assert from "node:assert/strict";
import { MEXICO_VIVIDO_WORDS } from "../content/mexicoVividoWords.js";
import { CULTURAL_PATHS } from "./culturalTaxonomy.js";
import {
  MEXICO_ZONES,
  getCulturalPath,
  getCulturalPathProgress,
  getNextCulturalPath,
  getCulturalPathTransition,
  getNextZone,
  getZone,
  isCulturalPathStart,
  isZoneStart,
} from "./mexicoZones.js";

assert.equal(MEXICO_ZONES.length, 10);
assert.deepEqual(
  MEXICO_ZONES.map(({ id, name, color, emoji }) => ({ id, name, color, icon: emoji })),
  CULTURAL_PATHS.map(({ id, name, color, icon }) => ({ id, name, color, icon })),
  "el mapa debe usar nombres, colores e iconos de la taxonomía canónica",
);

for (const path of CULTURAL_PATHS) {
  const entries = MEXICO_VIVIDO_WORDS.filter(({ pathId }) => pathId === path.id);
  assert.ok(entries.length >= 20, `${path.id} debe tener contenido publicado`);
  const first = entries[0];
  const last = entries.at(-1)!;
  const resolved = getCulturalPath(path.id);
  assert.equal(resolved?.id, path.id);
  assert.deepEqual(resolved?.levels, [first.order, last.order]);
  assert.equal(getCulturalPath(first.order)?.id, path.id);
  assert.equal(getCulturalPath(last.order)?.id, path.id);
  assert.equal(isCulturalPathStart(first.order), true);
  assert.equal(getCulturalPathProgress(last.order), entries.length);
}

assert.deepEqual(MEXICO_ZONES.map(({ levels }) => levels), [
  [1, 20], [21, 40], [41, 65], [66, 85], [86, 106],
  [107, 126], [127, 146], [147, 166], [167, 186], [187, 206],
]);
assert.notEqual(MEXICO_ZONES[2].levels[1] - MEXICO_ZONES[2].levels[0], MEXICO_ZONES[0].levels[1] - MEXICO_ZONES[0].levels[0]);

assert.equal(getNextCulturalPath("patio-recreo")?.id, "casa-abuela");
assert.equal(getNextCulturalPath(20)?.id, "casa-abuela");
assert.equal(getNextCulturalPath("mexico-profundo"), null);
assert.equal(getCulturalPath("desconocido"), null);
assert.equal(getCulturalPath(0), null);
assert.equal(getCulturalPath(207), null);

assert.equal(getCulturalPathTransition("patio-recreo", "patio-recreo"), null);
assert.equal(getCulturalPathTransition("patio-recreo", undefined), null);
assert.equal(getCulturalPathTransition(undefined, "casa-abuela"), null);
assert.equal(getCulturalPathTransition("patio-recreo", "casa-abuela", 1), null);
assert.equal(getCulturalPathTransition("patio-recreo", "mexico-profundo", 2), null);
assert.deepEqual(getCulturalPathTransition("patio-recreo", "casa-abuela", 2), {
  completed: getCulturalPath("patio-recreo"),
  next: getCulturalPath("casa-abuela"),
});

// Aliases públicos antiguos conservan semántica, pero ya resuelven caminos editoriales.
assert.equal(getZone(41, 999)?.id, "calle-barrio");
assert.equal(getZone(999, 999)?.id, "mexico-profundo", "el alias legacy conserva un fallback seguro");
assert.equal(isZoneStart(66, 999), true);
assert.equal(getNextZone(85, 999)?.id, "feria-verbena");

console.log("mexicoZones: 10 caminos editoriales y compatibilidad legacy válidos");
