/**
 * Shared level-ordering logic.
 * First STARTER_COUNT levels are easy/basic words (same for everyone).
 * The rest are seeded-shuffled per user for variety.
 *
 * Import this in any Convex query that needs to know which words a user
 * has completed, or in what order words will be served.
 */

import { planDifficultyWaves, type DifficultyRole } from "./difficultyWaves";

export const STARTER_COUNT = 50;

export const EASY_REGIONS = new Set([
  "Todo México", "Nacional", "Infantil", "Tradicional", "Callejero", "Juvenil",
]);

/** True when a word qualifies as a beginner/starter word */
export function isEasyWord(word: string, region: string, difficulty?: number): boolean {
  if (difficulty === 1) return true;
  if (difficulty === 2 || difficulty === 3) return false;
  return word.length <= 8 && EASY_REGIONS.has(region);
}

// ─── Seeded random helpers ────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return (s >>> 0) / 4294967296;
  };
}

export function hashStr(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  const rng = seededRng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Pinned positions ─────────────────────────────────────────────────────────
// Words that must always appear at a specific 1-based position for every user.
// Streamers category removed (IP risk), so no pins currently needed.
const PINNED_POSITIONS: Record<string, number> = {};

function normWord(s: string): string {
  return s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// ─── Main ordering function ───────────────────────────────────────────────────

type LevelDoc = { _id: any; wordId: any; levelNumber: number; reward: any; introducedOrderVersion?: number };
type OrderedLevelDoc = LevelDoc & { position?: number; requestedRole?: DifficultyRole; difficultyRole?: DifficultyRole; difficultyBand?: DifficultyRole; isChallenge?: boolean; deviation?: boolean; originalIndex?: number };
type WordDoc = { _id: any; word: string; region: string; difficulty?: number; category?: string; pack?: string; editorialOrder?: number; pathId?: string; rating?: string; isRetired?: boolean; legacyWord?: string; legacyRegion?: string; legacyDifficulty?: number };

/**
 *   positions 1-STARTER_COUNT → easy words sorted by length (same for all users)
 *   positions STARTER_COUNT+1 → rest, seeded-shuffled per user
 *
 * @param levels   All level documents from DB
 * @param words    All word documents from DB
 * @param userId   String ID of the user (for seeded shuffle). Pass "" for a
 *                 canonical / display order (no shuffle on hard levels).
 * @param orderingVersion 1 preserves historical positions exactly. Existing
 * users must not move to 2 until a dedicated progress migration maps their
 * completed word IDs; version 2 enables editorial order and hides retired words.
 */
export function getOrderedLevels(
  levels: LevelDoc[],
  words: WordDoc[],
  userId: string,
  orderingVersion = 1,
): OrderedLevelDoc[] {
  const currentWordMap = new Map(words.map((w) => [w._id.toString(), w]));
  const wordMap = orderingVersion === 1
    ? new Map(words.map((w) => [w._id.toString(), w.legacyWord ? { ...w, word: w.legacyWord, region: w.legacyRegion ?? w.region, difficulty: w.legacyDifficulty } : w]))
    : currentWordMap;
  const activeLevels = orderingVersion === 2 ? levels.filter((level) => {
    const word = level.wordId ? currentWordMap.get(level.wordId.toString()) : undefined;
    return word && word.isRetired !== true;
  }) : levels.filter((level) => {
    const word = level.wordId ? currentWordMap.get(level.wordId.toString()) : undefined;
    return (level.introducedOrderVersion ?? 1) <= 1 && !(word?.editorialOrder && !word.legacyWord);
  });
  const editorial = orderingVersion === 2 ? activeLevels.filter((level) => {
    const order = wordMap.get(level.wordId.toString())?.editorialOrder;
    return Number.isInteger(order) && (order as number) > 0;
  }).sort((a, b) => {
    const aw = wordMap.get(a.wordId.toString())!;
    const bw = wordMap.get(b.wordId.toString())!;
    return (aw.editorialOrder! - bw.editorialOrder!) || (a.levelNumber - b.levelNumber) || a.wordId.toString().localeCompare(b.wordId.toString());
  }) : [];
  const editorialIds = new Set(editorial.map((level) => level._id.toString()));

  const easyLevels: LevelDoc[] = [];
  const hardLevels: LevelDoc[] = [];

  for (const lvl of activeLevels) {
    if (editorialIds.has(lvl._id.toString())) continue;
    if (!lvl.wordId) continue; // skip levels with missing wordId
    const w = wordMap.get(lvl.wordId.toString());
    if (w && isEasyWord(w.word, w.region, w.difficulty)) {
      easyLevels.push(lvl);
    } else {
      hardLevels.push(lvl);
    }
  }

  // Sort easy words by length: shortest first so players start with simple words
  easyLevels.sort((a, b) => {
    const wa = wordMap.get(a.wordId.toString());
    const wb = wordMap.get(b.wordId.toString());
    return (wa?.word.length ?? 99) - (wb?.word.length ?? 99);
  });

  const seed = hashStr(userId);
  const starterLevels = easyLevels.slice(0, STARTER_COUNT);
  const overflowEasy = userId
    ? shuffleSeeded(easyLevels.slice(STARTER_COUNT), seed + 1)
    : easyLevels.slice(STARTER_COUNT);
  const shuffledHard = userId
    ? shuffleSeeded(hardLevels, seed)
    : hardLevels.sort((a, b) => a.levelNumber - b.levelNumber);

  // Gradual difficulty transition: interleave overflow-easy words into the first
  // TRANSITION_LENGTH hard levels so difficulty ramps smoothly instead of a cliff.
  const TRANSITION_LENGTH = 50;
  const transitionEasy = overflowEasy.slice(0, Math.min(overflowEasy.length, Math.floor(TRANSITION_LENGTH / 2)));
  const remainingEasy  = overflowEasy.slice(transitionEasy.length);

  // Build transition zone: alternate 2 hard → 1 easy
  const transitionHard = shuffledHard.slice(0, TRANSITION_LENGTH);
  const afterTransitionHard = shuffledHard.slice(TRANSITION_LENGTH);
  const transitionZone: LevelDoc[] = [];
  let ei = 0;
  for (let hi = 0; hi < transitionHard.length; hi++) {
    transitionZone.push(transitionHard[hi]);
    // Insert an easy word every 2 hard words
    if ((hi + 1) % 2 === 0 && ei < transitionEasy.length) {
      transitionZone.push(transitionEasy[ei++]);
    }
  }
  // Append any unused transition-easy words
  while (ei < transitionEasy.length) transitionZone.push(transitionEasy[ei++]);

  const result = [...editorial, ...starterLevels, ...transitionZone, ...afterTransitionHard, ...remainingEasy];

  // Pin specific words to fixed positions (sorted by target position to avoid offsets)
  const pins = Object.entries(PINNED_POSITIONS).sort((a, b) => a[1] - b[1]);
  for (const [wordName, targetPos] of pins) {
    const norm = normWord(wordName);
    const currentIdx = result.findIndex((lvl) => {
      const w = wordMap.get(lvl.wordId.toString());
      return w ? normWord(w.word) === norm : false;
    });
    if (currentIdx === -1) continue; // word not in DB yet
    const [pinned] = result.splice(currentIdx, 1);
    result.splice(Math.min(targetPos - 1, result.length), 0, pinned);
  }

  if (orderingVersion !== 2) return result;

  return planDifficultyWaves(result.map((level) => {
    const word = wordMap.get(level.wordId.toString());
    return {
      ...level,
      difficulty: word?.difficulty,
      editorialOrder: word?.editorialOrder,
      pathId: word?.pathId,
      rating: word?.rating,
    };
  }), userId, orderingVersion).map(({ difficulty: _difficulty, editorialOrder: _editorialOrder, pathId: _pathId, rating: _rating, ...level }) => level);
}

/**
 * Returns the Set of wordId strings that a user has already completed,
 * based on their currentLevel and the ordered level list.
 */
export function completedWordIds(
  orderedLevels: LevelDoc[],
  currentLevel: number,
): Set<string> {
  const completed = new Set<string>();
  const count = Math.max(0, currentLevel - 1); // positions 0..count-1 are done
  for (let i = 0; i < count && i < orderedLevels.length; i++) {
    completed.add(orderedLevels[i].wordId.toString());
  }
  return completed;
}
