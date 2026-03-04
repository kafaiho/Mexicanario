/**
 * Shared level-ordering logic.
 * First STARTER_COUNT levels are easy/basic words (same for everyone).
 * The rest are seeded-shuffled per user for variety.
 *
 * Import this in any Convex query that needs to know which words a user
 * has completed, or in what order words will be served.
 */

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

// ─── Main ordering function ───────────────────────────────────────────────────

type LevelDoc = { _id: any; wordId: any; levelNumber: number; reward: any };
type WordDoc  = { _id: any; word: string; region: string; difficulty?: number; category?: string; pack?: string };

/**
 * Returns levels in gameplay order:
 *   positions 1-STARTER_COUNT → easy words sorted by length (same for all users)
 *   positions STARTER_COUNT+1 → rest, seeded-shuffled per user
 *   positions at the END      → adult words: insultos first, then suegra (always last)
 *
 * @param levels   All level documents from DB
 * @param words    All word documents from DB
 * @param userId   String ID of the user (for seeded shuffle). Pass "" for a
 *                 canonical / display order (no shuffle on hard levels).
 */
export function getOrderedLevels(
  levels: LevelDoc[],
  words: WordDoc[],
  userId: string,
): LevelDoc[] {
  const wordMap = new Map(words.map((w) => [w._id.toString(), w]));

  const easyLevels: LevelDoc[]    = [];
  const hardLevels: LevelDoc[]    = [];
  const insultoLevels: LevelDoc[] = [];
  const suegrasLevels: LevelDoc[] = [];

  for (const lvl of levels) {
    const w = wordMap.get(lvl.wordId.toString());
    if (w?.category === "adulto") {
      // Adult levels always go last, separated by pack
      if (w.pack === "suegra") {
        suegrasLevels.push(lvl);
      } else {
        insultoLevels.push(lvl);
      }
    } else if (w && isEasyWord(w.word, w.region, w.difficulty)) {
      easyLevels.push(lvl);
    } else {
      hardLevels.push(lvl);
    }
  }

  // Shortest word first = easiest to type
  easyLevels.sort((a, b) => {
    const wa = wordMap.get(a.wordId.toString());
    const wb = wordMap.get(b.wordId.toString());
    return (wa?.word.length ?? 99) - (wb?.word.length ?? 99);
  });

  const seed = hashStr(userId);
  const starterLevels = easyLevels.slice(0, STARTER_COUNT);
  const overflowEasy  = userId
    ? shuffleSeeded(easyLevels.slice(STARTER_COUNT), seed + 1)
    : easyLevels.slice(STARTER_COUNT);
  const shuffledHard  = userId
    ? shuffleSeeded(hardLevels, seed)
    : hardLevels.sort((a, b) => a.levelNumber - b.levelNumber);

  // Adult levels always come at the end: insultos first, then suegra
  return [...starterLevels, ...shuffledHard, ...overflowEasy, ...insultoLevels, ...suegrasLevels];
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
