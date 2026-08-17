import { getCulturalPath } from "./mexicoZones";

export const NEUTRAL_CULTURAL_PATH = Object.freeze({
  id: null,
  name: "Tu recorrido",
  icon: "🗺️",
  emoji: "🗺️",
  color: "#6B7280",
  dark: "#374151",
  light: "#E5E7EB",
  description: "Palabras de tu recorrido personal.",
  desc: "Palabras de tu recorrido personal.",
  levels: null,
  isNeutral: true,
});

export function getExplicitPath(pathId) {
  return pathId ? getCulturalPath(pathId) : null;
}

export function buildCulturalMapItems(allLevels, waveSize = 2) {
  if (!Array.isArray(allLevels) || allLevels.length === 0) return [];
  const items = [];
  let lastPathKey;
  let waveIdx = 0;
  allLevels.forEach((level, index) => {
    const path = getExplicitPath(level.pathId);
    const zone = path ?? NEUTRAL_CULTURAL_PATH;
    const pathKey = path?.id ?? "__neutral__";
    if (pathKey !== lastPathKey) {
      items.push({ type: "path", key: `path-${index}-${pathKey}`, path, zone });
      lastPathKey = pathKey;
      waveIdx = 0;
    }
    items.push({ type: "level", key: `level-${index}-${level.levelNumber ?? index + 1}`, level, path, zone, waveIdx: waveIdx % waveSize, displayIndex: index + 1 });
    waveIdx += 1;
  });
  return items;
}

export function getCurrentPathPresentation({ pathId, culturalOrderVersion } = {}) {
  if (culturalOrderVersion !== 2) return NEUTRAL_CULTURAL_PATH;
  return getExplicitPath(pathId) ?? NEUTRAL_CULTURAL_PATH;
}
