export type Difficulty = 1 | 2 | 3;
export type DifficultyRole = "expected" | "rest" | "surprise";

export type DifficultyWaveInput = {
  word?: string;
  difficulty?: number;
  editorialOrder?: number;
  pathId?: string;
  placeId?: string;
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
const LATE_PATHS = new Set(["mexico-regional", "oficios-artesanias", "historias-leyendas", "mexico-profundo"]);

function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}

function shuffled<T>(items: T[], seed: string): T[] {
  return [...items].sort((a, b) => hash(`${seed}|${JSON.stringify(a)}`) - hash(`${seed}|${JSON.stringify(b)}`));
}

function normalizedDifficulty(value?: number): Difficulty {
  return value === 1 || value === 3 ? value : 2;
}

/**
 * Editorial target: positions 1–50 introduce difficulty 1, 51–130 target 2,
 * and 131+ keep target 2 while difficulty-3 entries receive a late-phase boost.
 */
export function expectedDifficulty(editorialPosition: number): Difficulty {
  return editorialPosition <= 50 ? 1 : 2;
}

/**
 * Composite score used only for relative ranking inside a bounded segment.
 * Explicit difficulty dominates (100-point gaps). Length, multiword, regional
 * context and late cultural paths add modest nuance without overriding it.
 */
export function difficultyScore(item: DifficultyWaveInput, editorialPosition: number): number {
  const difficulty = normalizedDifficulty(item.difficulty);
  const letters = (item.word ?? "").normalize("NFD").replace(/[^a-zA-ZñÑ]/g, "").length;
  const tokens = (item.word ?? "").trim().split(/\s+/).filter(Boolean).length;
  const phase = editorialPosition <= 50 ? 0 : editorialPosition <= 130 ? 25 : 50;
  const explicit = (difficulty - 1) * 100 + (editorialPosition > 130 && difficulty === 3 ? 10 : 0);
  const length = Math.min(letters, 30) / 30 * 12;
  const multiword = Math.min(Math.max(tokens - 1, 0), 3) * 4;
  const regional = item.placeId && item.placeId !== "todo-mexico" ? 6 : 0;
  const lateContext = item.pathId && LATE_PATHS.has(item.pathId) ? 4 : 0;
  return explicit + phase + length + multiword + regional + lateContext;
}

type Indexed<T> = { item: T; originalIndex: number; score: number };

function templateFor(windowIndex: number): DifficultyRole[] {
  return windowIndex % 2 === 0 ? TEMPLATE_A : TEMPLATE_B;
}

function proportionalRoles(template: DifficultyRole[], length: number): DifficultyRole[] {
  const roles = template.slice(0, length);
  if (length === 1 && roles[0] !== "expected") return ["expected"];
  return roles;
}

function planSegment<T extends DifficultyWaveInput>(
  segment: Array<{ item: T; originalIndex: number }>,
  userId: string,
  orderingVersion: number,
  outputOffset: number,
): DifficultyWaveItem<T>[] {
  const windowIndex = Math.floor(outputOffset / 10);
  const slotOffset = outputOffset % 10;
  const roles = proportionalRoles(templateFor(windowIndex).slice(slotOffset, slotOffset + segment.length), segment.length);
  const roleCounts = roles.reduce<Record<DifficultyRole, number>>((counts, role) => {
    counts[role]++;
    return counts;
  }, { rest: 0, expected: 0, surprise: 0 });
  const seed = `${userId}|${orderingVersion}|${windowIndex}|${outputOffset}`;
  const ranked: Indexed<T>[] = segment.map((entry) => ({
    ...entry,
    score: difficultyScore(entry.item, entry.item.editorialOrder ?? entry.originalIndex + 1),
  })).sort((a, b) => a.score - b.score || hash(`${seed}|rank|${a.originalIndex}`) - hash(`${seed}|rank|${b.originalIndex}`));

  const rest = ranked.slice(0, roleCounts.rest);
  const surprise = ranked.slice(ranked.length - roleCounts.surprise);
  const expected = ranked.slice(roleCounts.rest, ranked.length - roleCounts.surprise || ranked.length);
  const pools: Record<DifficultyRole, Indexed<T>[]> = {
    rest: shuffled(rest, `${seed}|rest`),
    expected: shuffled(expected, `${seed}|expected`),
    surprise: shuffled(surprise, `${seed}|surprise`),
  };
  const hasChallengeSlot = roles.some((role, index) => (outputOffset + index + 1) % 10 === 0 && role === "surprise");
  let reservedChallenge: Indexed<T> | undefined;
  if (hasChallengeSlot && pools.surprise.length > 0) {
    const challengeIndex = pools.surprise.reduce((best, candidate, index, items) => candidate.score > items[best].score ? index : best, 0);
    reservedChallenge = pools.surprise.splice(challengeIndex, 1)[0];
  }

  return roles.map((role, slotIndex) => {
    const position = outputOffset + slotIndex + 1;
    let selected: Indexed<T> | undefined;
    if (position % 10 === 0 && role === "surprise") {
      selected = reservedChallenge;
    } else {
      selected = pools[role].shift();
    }
    if (!selected) throw new Error(`Difficulty wave role allocation failed for ${role}`);
    return {
      ...selected.item,
      position,
      requestedRole: role,
      difficultyRole: role,
      difficultyBand: role,
      isChallenge: position % 10 === 0 && role === "surprise",
      deviation: false,
      originalIndex: selected.originalIndex,
    };
  });
}

/** Plans relative 60/25/15 waves without crossing a cultural path or global 10-window. */
export function planDifficultyWaves<T extends DifficultyWaveInput>(editorialItems: T[], userId: string, orderingVersion = 2): DifficultyWaveItem<T>[] {
  if (orderingVersion !== 2) {
    return editorialItems.map((item, index) => ({ ...item, position: index + 1, requestedRole: "expected", difficultyRole: "expected", difficultyBand: "expected", isChallenge: false, deviation: false, originalIndex: index }));
  }

  const result: DifficultyWaveItem<T>[] = [];
  let runStart = 0;
  while (runStart < editorialItems.length) {
    const pathId = editorialItems[runStart].pathId;
    if (!pathId) {
      const item = editorialItems[runStart];
      const position = result.length + 1;
      const requestedRole = templateFor(Math.floor((position - 1) / 10))[(position - 1) % 10];
      const expected = expectedDifficulty(item.editorialOrder ?? position);
      const actual: DifficultyRole = normalizedDifficulty(item.difficulty) < expected ? "rest" : normalizedDifficulty(item.difficulty) > expected ? "surprise" : "expected";
      result.push({ ...item, position, requestedRole, difficultyRole: actual, difficultyBand: actual, isChallenge: position % 10 === 0 && actual === "surprise", deviation: actual !== requestedRole, originalIndex: runStart });
      runStart++;
      continue;
    }
    let runEnd = runStart + 1;
    while (runEnd < editorialItems.length && editorialItems[runEnd].pathId === pathId) runEnd++;
    for (let start = runStart; start < runEnd;) {
      const end = Math.min(start + 10 - (result.length % 10), runEnd);
      const segment = editorialItems.slice(start, end).map((item, offset) => ({ item, originalIndex: start + offset }));
      result.push(...planSegment(segment, userId, orderingVersion, result.length));
      start = end;
    }
    runStart = runEnd;
  }
  return result;
}
