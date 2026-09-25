/**
 * Caminos culturales del mapa de niveles.
 *
 * Los límites son editoriales (v2), no una división de `totalLevels`. La fuente
 * canónica de identidad y rangos es culturalTaxonomy. Los aliases "zone" se
 * conservan para no romper pantallas antiguas; `totalLevels` se ignora a propósito.
 */
import { CULTURAL_PATHS, CULTURAL_SEGMENTS } from "./culturalTaxonomy";

const withMapPresentation = (path) => ({
  ...path,
  emoji: path.icon,
  desc: path.description,
  dark: path.color,
  light: `${path.color}22`,
  levels: [path.editorialStart, path.editorialEnd],
});

export const MEXICO_ZONES = CULTURAL_PATHS.map(withMapPresentation);
export const MEXICO_CULTURAL_PATHS = MEXICO_ZONES;

const PATH_BY_ID = new Map(MEXICO_CULTURAL_PATHS.map((path) => [path.id, path]));

/** Tramo (camino + vuelta) que contiene una posición editorial v2. */
export function getCulturalSegment(editorialPosition) {
  if (!Number.isInteger(editorialPosition) || editorialPosition < 1) return null;
  return CULTURAL_SEGMENTS.find(({ start, end }) => editorialPosition >= start && editorialPosition <= end) ?? null;
}

/** Resuelve por `pathId` explícito o por posición editorial (v2). */
export function getCulturalPath(pathIdOrEditorialPosition) {
  if (typeof pathIdOrEditorialPosition === "string") {
    return PATH_BY_ID.get(pathIdOrEditorialPosition) ?? null;
  }
  const segment = getCulturalSegment(pathIdOrEditorialPosition);
  return segment ? PATH_BY_ID.get(segment.pathId) ?? null : null;
}

/** Niveles completados dentro del tramo actual (camino + vuelta). */
export function getCulturalPathProgress(editorialPosition, pathId) {
  const segment = getCulturalSegment(editorialPosition);
  if (!segment || (pathId && segment.pathId !== pathId)) return 0;
  return Math.max(0, Math.min(editorialPosition - segment.start + 1, segment.count));
}

/** Tamaño del tramo actual; `fallback` cuando la posición no es editorial. */
export function getCulturalSegmentSize(editorialPosition, fallback = 0) {
  return getCulturalSegment(editorialPosition)?.count ?? fallback;
}

export function isCulturalPathStart(editorialPosition, pathId) {
  const segment = getCulturalSegment(editorialPosition);
  return Boolean(segment && (!pathId || segment.pathId === pathId) && editorialPosition === segment.start);
}

/**
 * Siguiente camino. Con una posición editorial usa el tramo real que sigue
 * (las vueltas tardías pueden saltarse caminos); con un id, el orden del mapa en ciclo.
 */
export function getNextCulturalPath(pathIdOrEditorialPosition) {
  if (typeof pathIdOrEditorialPosition === "number") {
    const segment = getCulturalSegment(pathIdOrEditorialPosition);
    if (!segment) return null;
    const next = CULTURAL_SEGMENTS[CULTURAL_SEGMENTS.indexOf(segment) + 1];
    return next ? PATH_BY_ID.get(next.pathId) ?? null : null;
  }
  const current = getCulturalPath(pathIdOrEditorialPosition);
  if (!current) return null;
  const index = MEXICO_CULTURAL_PATHS.findIndex(({ id }) => id === current.id);
  return MEXICO_CULTURAL_PATHS[(index + 1) % MEXICO_CULTURAL_PATHS.length];
}

/**
 * Solo anuncia un cambio cuando backend conoce ambos `pathId` consecutivos.
 * Esto evita inferir celebraciones v1 a partir de un número de nivel legado.
 */
export function getCulturalPathTransition(currentPathId, nextPathId, culturalOrderVersion) {
  if (culturalOrderVersion !== 2 || !currentPathId || !nextPathId || currentPathId === nextPathId) return null;
  const completed = getCulturalPath(currentPathId);
  const next = getCulturalPath(nextPathId);
  if (!completed || !next) return null;
  return { completed, next };
}

/** @deprecated Usa getCulturalPath. `totalLevels` no altera el catálogo editorial. */
export function getZone(level, _totalLevels) {
  return getCulturalPath(level) ?? MEXICO_CULTURAL_PATHS[MEXICO_CULTURAL_PATHS.length - 1];
}
/** @deprecated Usa getCulturalPathProgress. */
export function getZoneProgress(level, _totalLevels) {
  const path = getZone(level);
  return Math.max(0, Math.min(level - path.levels[0] + 1, path.entryCount));
}
/** @deprecated Usa isCulturalPathStart. */
export function isZoneStart(level, _totalLevels) { return isCulturalPathStart(level); }
/** @deprecated Usa getNextCulturalPath. */
export function getNextZone(level, _totalLevels) { return getNextCulturalPath(level); }
