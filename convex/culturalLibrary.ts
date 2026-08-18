import { groupCulturalLibrary } from "./collectionGrouping";
import { completedWordIds, getOrderedLevels } from "./levelOrdering";

export function buildCulturalLibrary(levels: any[], words: any[], userId: string, currentLevel: number, culturalOrderVersion: number) {
  const ordered = getOrderedLevels(levels, words, userId, culturalOrderVersion);
  const completed = completedWordIds(ordered, currentLevel);
  return { ...groupCulturalLibrary(ordered, words, completed, currentLevel, true), culturalOrderVersion };
}

export function buildCulturalProgressSummary(levels: any[], words: any[], userId: string, currentLevel: number, culturalOrderVersion: number) {
  const ordered = getOrderedLevels(levels, words, userId, culturalOrderVersion);
  const completed = completedWordIds(ordered, currentLevel);
  return { ...groupCulturalLibrary(ordered, words, completed, currentLevel, false), culturalOrderVersion };
}
