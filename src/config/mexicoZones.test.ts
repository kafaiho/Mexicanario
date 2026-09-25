import assert from "node:assert/strict";
import { MEXICO_VIVIDO_WORDS } from "../content/mexicoVividoWords.js";
import { CULTURAL_PATHS, CULTURAL_SEGMENTS } from "./culturalTaxonomy.js";
import {
  MEXICO_ZONES,
  getCulturalPath,
  getCulturalPathProgress,
  getCulturalSegment,
  getCulturalSegmentSize,
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

// Primera vuelta: cada camino aparece una vez, en el orden de la taxonomía, y sus
// rangos salen del catálogo generado (no de una división matemática).
const firstRound = CULTURAL_SEGMENTS.filter(({ round }) => round === 1);
assert.deepEqual(firstRound.map(({ pathId }) => pathId), CULTURAL_PATHS.map(({ id }) => id));
for (const segment of firstRound) {
  const entries = MEXICO_VIVIDO_WORDS.filter(({ order }) => order >= segment.start && order <= segment.end);
  assert.ok(entries.length > 0 && entries.every(({ pathId }) => pathId === segment.pathId), `${segment.pathId} debe tener contenido publicado`);
  const resolved = getCulturalPath(segment.pathId);
  assert.equal(resolved?.id, segment.pathId);
  assert.deepEqual(resolved?.levels, [segment.start, segment.end]);
  assert.equal(getCulturalPath(segment.start)?.id, segment.pathId);
  assert.equal(getCulturalPath(segment.end)?.id, segment.pathId);
  assert.equal(isCulturalPathStart(segment.start), true);
  assert.equal(getCulturalPathProgress(segment.end), segment.count);
}
assert.deepEqual(MEXICO_ZONES.map(({ levels }) => levels), firstRound.map(({ start, end }) => [start, end]));
assert.ok(new Set(firstRound.map(({ count }) => count)).size > 1, "los tamaños son editoriales, no una división matemática");
assert.ok(
  MEXICO_VIVIDO_WORDS.filter(({ order }) => order <= firstRound.at(-1)!.end).every(({ difficulty }) => difficulty <= 2),
  "la primera vuelta no tiene palabras de dificultad 3",
);

const secondRoundStart = CULTURAL_SEGMENTS.find(({ round }) => round === 2)!;
assert.equal(getNextCulturalPath("patio-recreo")?.id, "casa-abuela");
assert.equal(getNextCulturalPath(firstRound[0].end)?.id, "casa-abuela");
assert.equal(getNextCulturalPath("mexico-profundo")?.id, "patio-recreo", "después del último camino empieza otra vuelta");
assert.equal(getCulturalPath("desconocido"), null);
assert.equal(getCulturalPath(0), null);
assert.equal(getCulturalPath(secondRoundStart.start)?.id, "patio-recreo", "la segunda vuelta empieza otra vez en el patio");
assert.equal(getCulturalPath(MEXICO_VIVIDO_WORDS.length + 1), null);

// Vueltas: los tramos cubren todo el catálogo, en orden y sin huecos.
assert.equal(CULTURAL_SEGMENTS.at(-1)!.end, MEXICO_VIVIDO_WORDS.length);
CULTURAL_SEGMENTS.forEach((segment, index) => {
  assert.equal(segment.start, index === 0 ? 1 : CULTURAL_SEGMENTS[index - 1].end + 1);
  const entries = MEXICO_VIVIDO_WORDS.filter(({ order }) => order >= segment.start && order <= segment.end);
  assert.equal(entries.length, segment.count);
  assert.ok(entries.every(({ pathId }) => pathId === segment.pathId), `tramo ${index + 1} mezcla caminos`);
  assert.equal(getCulturalSegment(segment.start), segment);
  assert.equal(getCulturalPathProgress(segment.end, segment.pathId), segment.count);
  assert.equal(getCulturalSegmentSize(segment.start), segment.count);
  const next = CULTURAL_SEGMENTS[index + 1];
  if (next) {
    assert.notEqual(next.pathId, segment.pathId, "dos tramos seguidos no deben repetir camino");
    assert.equal(getNextCulturalPath(segment.end)?.id, next.pathId);
  }
});
assert.equal(getCulturalPathProgress(secondRoundStart.start, "casa-abuela"), 0, "el progreso solo cuenta en el camino del tramo");

assert.equal(getCulturalPathTransition("patio-recreo", "patio-recreo"), null);
assert.equal(getCulturalPathTransition("patio-recreo", undefined), null);
assert.equal(getCulturalPathTransition(undefined, "casa-abuela"), null);
assert.equal(getCulturalPathTransition("patio-recreo", "casa-abuela", 1), null);
assert.deepEqual(getCulturalPathTransition("patio-recreo", "casa-abuela", 2), {
  completed: getCulturalPath("patio-recreo"),
  next: getCulturalPath("casa-abuela"),
});

// Aliases públicos antiguos conservan semántica, pero ya resuelven caminos editoriales.
const [, , calle, mercado] = firstRound;
assert.equal(getZone(calle.start, 999)?.id, "calle-barrio");
assert.equal(getZone(999, 999)?.id, "mexico-profundo", "el alias legacy conserva un fallback seguro");
assert.equal(isZoneStart(mercado.start, 999), true);
assert.equal(getNextZone(mercado.end, 999)?.id, "feria-verbena");

console.log(`mexicoZones: 10 caminos, ${CULTURAL_SEGMENTS.length} tramos en vueltas y compatibilidad legacy válidos`);
