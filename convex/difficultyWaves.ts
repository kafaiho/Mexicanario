export type Difficulty = 1 | 2 | 3;
export type DifficultyRole = "expected" | "rest" | "surprise";

export type DifficultyWaveInput = {
  difficulty?: number;
  editorialOrder?: number;
  pathId?: string;
  rating?: string;
};

export type DifficultyWaveItem<T> = T & {
  position: number;
  requestedRole: DifficultyRole;
  difficultyRole: DifficultyRole;
  difficultyBand: DifficultyRole;
  isChallenge: boolean;
  deviation: boolean;
  originalIndex: number;
};

const TEMPLATE_A: DifficultyRole[] = [
  "expected", "expected", "rest", "expected", "rest",
  "expected", "expected", "rest", "expected", "surprise",
];

const TEMPLATE_B: DifficultyRole[] = [
  "expected", "rest", "expected", "surprise", "expected",
  "expected", "rest", "expected", "expected", "surprise",
];

function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}

function shuffle<T>(items: T[], seed: number): T[] {
  const output = [...items];
  let state = seed >>> 0;
  for (let index = output.length - 1; index > 0; index--) {
    state = Math.imul(1664525, state) + 1013904223;
    const swapIndex = Math.floor(((state >>> 0) / 4294967296) * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function normalizedDifficulty(value?: number): Difficulty {
  return value === 1 || value === 3 ? value : 2;
}

/** Editorial target for the cultural journey: beginner, middle, then 2/3 waves. */
export function expectedDifficulty(editorialPosition: number): Difficulty {
  if (editorialPosition <= 50) return 1;
  return 2;
}

function roleFor(difficulty: Difficulty, expected: Difficulty): DifficultyRole {
  if (difficulty < expected) return "rest";
  if (difficulty > expected) return "surprise";
  return "expected";
}

function desiredDifficulty(role: DifficultyRole, expected: Difficulty): Difficulty {
  if (role === "rest") return Math.max(1, expected - 1) as Difficulty;
  if (role === "surprise") return Math.min(3, expected + 1) as Difficulty;
  return expected;
}

type Indexed<T> = { item: T; originalIndex: number };

function planWindow<T extends DifficultyWaveInput>(
  window: Indexed<T>[],
  userId: string,
  orderingVersion: number,
  windowIndex: number,
  outputOffset: number,
): DifficultyWaveItem<T>[] {
  const slotOffset = outputOffset % 10;
  const template = (windowIndex % 2 === 0 ? TEMPLATE_A : TEMPLATE_B).slice(slotOffset, slotOffset + window.length);
  const seedBase = hash(`${userId}|${orderingVersion}|${windowIndex}`);
  let remaining = shuffle(window, seedBase);

  return template.map((requestedRole, slotIndex) => {
    const editorialPosition = window[slotIndex]?.item.editorialOrder ?? outputOffset + slotIndex + 1;
    const expected = expectedDifficulty(editorialPosition);
    const desired = desiredDifficulty(requestedRole, expected);
    const ranked = remaining
      .map((candidate, index) => ({
        index,
        unsafeEarly: editorialPosition <= 50 && (
          normalizedDifficulty(candidate.item.difficulty) === 3 || candidate.item.rating !== "familiar"
        ),
        distance: Math.abs(normalizedDifficulty(candidate.item.difficulty) - desired),
        tie: hash(`${seedBase}|${slotIndex}|${candidate.originalIndex}`),
      }))
      .sort((a, b) => Number(a.unsafeEarly) - Number(b.unsafeEarly) || a.distance - b.distance || a.tie - b.tie || a.index - b.index);
    const selectedIndex = ranked[0].index;
    const [selected] = remaining.splice(selectedIndex, 1);
    const difficulty = normalizedDifficulty(selected.item.difficulty);
    const actualRole = roleFor(difficulty, expected);
    const position = outputOffset + slotIndex + 1;
    const isChallenge = position % 10 === 0;

    return {
      ...selected.item,
      position,
      requestedRole,
      difficultyRole: actualRole,
      difficultyBand: requestedRole,
      isChallenge,
      deviation: actualRole !== requestedRole,
      originalIndex: selected.originalIndex,
    };
  });
}

/**
 * Applies deterministic 10-level waves without crossing a cultural path boundary.
 * Every item stays inside its original ten-item window, so movement is at most 9.
 */
export function planDifficultyWaves<T extends DifficultyWaveInput>(
  editorialItems: T[],
  userId: string,
  orderingVersion = 2,
): DifficultyWaveItem<T>[] {
  if (orderingVersion !== 2) {
    return editorialItems.map((item, index) => ({
      ...item,
      position: index + 1,
      requestedRole: "expected",
      difficultyRole: "expected",
      difficultyBand: "expected",
      isChallenge: false,
      deviation: false,
      originalIndex: index,
    }));
  }

  const result: DifficultyWaveItem<T>[] = [];
  let runStart = 0;
  while (runStart < editorialItems.length) {
    if (!editorialItems[runStart].pathId) {
      const item = editorialItems[runStart];
      const position = result.length + 1;
      const template = Math.floor((position - 1) / 10) % 2 === 0 ? TEMPLATE_A : TEMPLATE_B;
      const requestedRole = template[(position - 1) % 10];
      const expected = expectedDifficulty(item.editorialOrder ?? position);
      const actualRole = roleFor(normalizedDifficulty(item.difficulty), expected);
      result.push({
        ...item,
        position,
        requestedRole,
        difficultyRole: actualRole,
        difficultyBand: requestedRole,
        isChallenge: position % 10 === 0,
        deviation: actualRole !== requestedRole,
        originalIndex: runStart,
      });
      runStart++;
      continue;
    }
    const pathId = editorialItems[runStart].pathId ?? "__without_path__";
    let runEnd = runStart + 1;
    while (runEnd < editorialItems.length && (editorialItems[runEnd].pathId ?? "__without_path__") === pathId) runEnd++;

    for (let start = runStart; start < runEnd;) {
      const remainingInGlobalWindow = 10 - (result.length % 10);
      const end = Math.min(start + remainingInGlobalWindow, runEnd);
      const indexed = editorialItems.slice(start, end)
        .map((item, offset) => ({ item, originalIndex: start + offset }));
      const globalWindowIndex = Math.floor(result.length / 10);
      result.push(...planWindow(indexed, userId, orderingVersion, globalWindowIndex, result.length));
      start = end;
    }
    runStart = runEnd;
  }
  return result;
}
