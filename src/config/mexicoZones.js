/**
 * Caminos culturales del mapa de niveles.
 *
 * Los límites son editoriales (v2), no una división de `totalLevels`. La fuente
 * canónica de identidad y rangos es culturalTaxonomy. Los aliases "zone" se
 * conservan para no romper pantallas antiguas; `totalLevels` se ignora a propósito.
 */
import { CULTURAL_PATHS } from "./culturalTaxonomy";

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

/** Resuelve por `pathId` explícito o por posición editorial (v2). */
export function getCulturalPath(pathIdOrEditorialPosition) {
  if (typeof pathIdOrEditorialPosition === "string") {
    return PATH_BY_ID.get(pathIdOrEditorialPosition) ?? null;
  }
  if (!Number.isInteger(pathIdOrEditorialPosition) || pathIdOrEditorialPosition < 1) return null;
  return MEXICO_CULTURAL_PATHS.find(({ levels: [start, end] }) =>
    pathIdOrEditorialPosition >= start && pathIdOrEditorialPosition <= end
  ) ?? null;
}

export function getCulturalPathProgress(editorialPosition, pathId) {
  const path = pathId ? getCulturalPath(pathId) : getCulturalPath(editorialPosition);
  if (!path || !Number.isInteger(editorialPosition)) return 0;
  return Math.max(0, Math.min(editorialPosition - path.levels[0] + 1, path.entryCount));
}

export function isCulturalPathStart(editorialPosition, pathId) {
  const path = pathId ? getCulturalPath(pathId) : getCulturalPath(editorialPosition);
  return Boolean(path && editorialPosition === path.levels[0]);
}

export function getNextCulturalPath(pathIdOrEditorialPosition) {
  const current = getCulturalPath(pathIdOrEditorialPosition);
  if (!current) return null;
  const index = MEXICO_CULTURAL_PATHS.findIndex(({ id }) => id === current.id);
  return MEXICO_CULTURAL_PATHS[index + 1] ?? null;
}

/**
 * Solo anuncia un cambio cuando backend conoce ambos `pathId` consecutivos.
 * Esto evita inferir celebraciones v1 a partir de un número de nivel legado.
 */
export function getCulturalPathTransition(currentPathId, nextPathId, culturalOrderVersion) {
  if (culturalOrderVersion !== 2 || !currentPathId || !nextPathId || currentPathId === nextPathId) return null;
  const completed = getCulturalPath(currentPathId);
  const next = getCulturalPath(nextPathId);
  if (!completed || !next || getNextCulturalPath(completed.id)?.id !== next.id) return null;
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
