import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { MEXICO_VIVIDO_WORDS, REMOVED_WORDS } from "./mexicoVividoCatalog.generated";
import { insertNewLevel } from "../levelWrites";

/**
 * Run Phase A until isDone (respecting splitCursor/pageStatus), then run Phase B
 * from cursor 0 until isDone. If Phase B returns keys_not_ready, restart Phase A;
 * a writer inserted a legacy row without normalizedWordKey.
 * previewMexicoVividoMigration is mandatory preflight: catalog batches intentionally
 * report unclassified:null because their indexed reads never scan unrelated words.
 */

type ExistingWord = { _id: any; word: string; [key: string]: unknown };
type CatalogWord = Record<string, unknown> & { word: string };
type RemovedWord = { word: string; reason?: string };

const PATCH_FIELDS = ["word", "meaning", "example", "collectionId", "pathId", "placeId", "difficulty", "generation", "rating", "icon", "sourceNote", "relatedConceptId", "conceptId"] as const;

/** Accent-insensitive key which deliberately keeps Ñ distinct from N. */
export function normalizeWordKey(value: string): string {
  const enye = "\u0000";
  return value.toLocaleLowerCase("es-MX")
    .replace(/ñ/g, enye)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(enye, "ñ")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function catalogPatch(entry: CatalogWord) {
  const patch: Record<string, unknown> = {};
  for (const field of PATCH_FIELDS) {
    if (entry[field] !== undefined) patch[field] = entry[field];
  }
  patch.region = entry.placeId;
  patch.editorialOrder = entry.order;
  patch.normalizedWordKey = normalizeWordKey(entry.word);
  patch.isRetired = false;
  return patch;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function planMexicoVividoMigration(
  existingWords: readonly ExistingWord[],
  catalog: readonly CatalogWord[],
  removed: readonly RemovedWord[],
) {
  const patches: Array<{ _id: any; patch: Record<string, unknown> }> = [];
  const inserts: Array<Record<string, unknown>> = [];
  const retires: Array<{ _id: any; patch: { isRetired: true } }> = [];
  const unchanged: ExistingWord[] = [];
  const conflicts: Array<{ key: string; ids: any[] }> = [];
  const unclassified: ExistingWord[] = [];
  const byKey = new Map<string, ExistingWord[]>();
  for (const word of existingWords) {
    const key = normalizeWordKey(word.word);
    byKey.set(key, [...(byKey.get(key) ?? []), word]);
  }
  const retainedKeys = new Set(catalog.map((entry) => normalizeWordKey(entry.word)));
  const removedKeys = new Set(removed.map((entry) => normalizeWordKey(entry.word)));
  const conflictKeys = new Set<string>();
  for (const [key, docs] of byKey) {
    if (docs.length > 1) {
      conflicts.push({ key, ids: docs.map((doc) => doc._id) });
      conflictKeys.add(key);
    }
  }
  for (const entry of catalog) {
    const key = normalizeWordKey(entry.word);
    if (conflictKeys.has(key)) continue;
    const existing = byKey.get(key)?.[0];
    const desired = catalogPatch(entry);
    if (!existing) {
      inserts.push(desired);
      continue;
    }
    const patch = Object.fromEntries(Object.entries(desired).filter(([field, value]) => !sameValue(existing[field], value)));
    if (Object.keys(patch).length) patches.push({ _id: existing._id, patch });
    else unchanged.push(existing);
  }
  for (const word of existingWords) {
    const key = normalizeWordKey(word.word);
    if (conflictKeys.has(key) || retainedKeys.has(key)) continue;
    if (removedKeys.has(key)) {
      if (word.isRetired === true) unchanged.push(word);
      else retires.push({ _id: word._id, patch: { isRetired: true } });
    } else unclassified.push(word);
  }
  return { patches, inserts, retires, unchanged, conflicts, unclassified };
}

export function normalizeBackfillLimit(value?: number): number {
  if (value === undefined || !Number.isFinite(value)) return 100;
  return Math.max(1, Math.min(200, Math.floor(value)));
}

export function normalizeCatalogBatchSize(value?: number): number {
  if (value === undefined || !Number.isFinite(value)) return 25;
  return Math.max(1, Math.min(50, Math.floor(value)));
}

export function planBackfillPage(words: readonly ExistingWord[]) {
  const patches = words.flatMap((word) => {
    const normalizedWordKey = normalizeWordKey(word.word);
    return word.normalizedWordKey === normalizedWordKey ? [] : [{ _id: word._id, normalizedWordKey }];
  });
  return { patches, unchanged: words.length - patches.length };
}

type BackfillPage = {
  page: ExistingWord[];
  continueCursor: string;
  isDone: boolean;
  splitCursor?: string | null;
  pageStatus?: "SplitRecommended" | "SplitRequired" | null;
};

export function planBackfillResult(page: BackfillPage, dryRun: boolean, endCursor?: string | null) {
  const metadata = {
    dryRun,
    continueCursor: page.continueCursor,
    isDone: page.isDone,
    splitCursor: page.splitCursor ?? null,
    pageStatus: page.pageStatus ?? null,
    endCursor: endCursor ?? null,
  };
  if (page.pageStatus === "SplitRequired") {
    return { status: "split_required" as const, patched: 0, unchanged: 0, operations: [], ...metadata };
  }
  const plan = planBackfillPage(page.page);
  return { status: "ok" as const, patched: plan.patches.length, unchanged: plan.unchanged, operations: plan.patches, ...metadata };
}

type RetainOperation = { kind: "retain"; entry: CatalogWord };
type RemoveOperation = { kind: "remove"; entry: RemovedWord };
type CatalogOperation = RetainOperation | RemoveOperation;

const CATALOG_OPERATIONS: readonly CatalogOperation[] = [
  ...MEXICO_VIVIDO_WORDS.map((entry) => ({ kind: "retain" as const, entry })),
  ...REMOVED_WORDS.map((entry) => ({ kind: "remove" as const, entry })),
];
const CATALOG_OPERATION_KEYS = new Set(
  CATALOG_OPERATIONS.map((operation) => normalizeWordKey(operation.entry.word)),
);

function legacySnapshot(word: ExistingWord): Record<string, unknown> {
  if (word.legacyWord !== undefined) return {};
  return {
    legacyWord: word.word,
    ...(word.region === undefined ? {} : { legacyRegion: word.region }),
    ...(word.difficulty === undefined ? {} : { legacyDifficulty: word.difficulty }),
  };
}

export function planUnclassifiedRetirementPage(
  words: readonly ExistingWord[],
  operationKeys: ReadonlySet<string> = CATALOG_OPERATION_KEYS,
) {
  const operations: Array<{ _id: any; patch: Record<string, unknown> }> = [];
  let alreadyRetired = 0;
  let known = 0;
  for (const word of words) {
    if (operationKeys.has(normalizeWordKey(word.word))) {
      known += 1;
      continue;
    }
    if (word.isRetired === true) {
      alreadyRetired += 1;
      continue;
    }
    operations.push({ _id: word._id, patch: { isRetired: true, ...legacySnapshot(word) } });
  }
  return { operations, retired: operations.length, alreadyRetired, known };
}

export function sliceCatalogOperations<T>(operations: readonly T[], cursor: number, batchSize: number) {
  const safeCursor = Number.isFinite(cursor) ? Math.max(0, Math.min(operations.length, Math.floor(cursor))) : 0;
  const size = normalizeCatalogBatchSize(batchSize);
  const batch = operations.slice(safeCursor, safeCursor + size);
  const nextCursor = safeCursor + batch.length;
  return { operations: batch, cursor: safeCursor, nextCursor, isDone: nextCursor >= operations.length };
}

export function hasMissingNormalizedKeys(word: unknown): boolean {
  return word !== undefined && word !== null;
}

export function catalogOperationDecision(operation: CatalogOperation, matches: readonly ExistingWord[]) {
  if (matches.length >= 2) return { kind: "conflict" as const };
  const existing = matches[0];
  if (operation.kind === "remove") {
    if (!existing || existing.isRetired === true) return { kind: "unchanged" as const };
    return { kind: "retire" as const, _id: existing._id };
  }
  const desired = catalogPatch(operation.entry);
  if (!existing) return { kind: "insert" as const, document: desired };
  const patch = Object.fromEntries(Object.entries(desired).filter(([field, value]) => !sameValue(existing[field], value)));
  if (!Object.keys(patch).length) return { kind: "unchanged" as const };
  return { kind: "patch" as const, _id: existing._id, patch };
}

export function needsLevelRepair(decision: string, hasLevel: boolean): boolean {
  return !hasLevel && (decision === "patch" || decision === "unchanged");
}

async function allocateLevelNumber(ctx: any): Promise<number> {
  const key = "mexico_vivido_level_allocator";
  const state = await ctx.db.query("migrationState").withIndex("by_key", (q: any) => q.eq("key", key)).unique();
  if (state) {
    let allocated = state.nextLevelNumber;
    while (await ctx.db.query("levels").withIndex("by_level_number", (q: any) => q.eq("levelNumber", allocated)).first()) allocated += 1;
    await ctx.db.patch(state._id, { nextLevelNumber: allocated + 1 });
    return allocated;
  }
  const highest = await ctx.db.query("levels").withIndex("by_level_number").order("desc").first();
  const allocated = (highest?.levelNumber ?? 0) + 1;
  await ctx.db.insert("migrationState", { key, nextLevelNumber: allocated + 1 });
  return allocated;
}

async function insertLevelForWord(ctx: any, wordId: any) {
  const levelNumber = await allocateLevelNumber(ctx);
  // Repairs are v2-only: exposing an orphan in v1 would shift returning users.
  await insertNewLevel(ctx, { levelNumber, wordId, reward: { coins: 2, diamonds: 0 } });
}

type PreviewInventoryEntry = { count: number; docs: ExistingWord[] };
export type PreviewInventory = {
  byKey: Map<string, PreviewInventoryEntry>;
  unclassifiedCount: number;
  retiredUnclassifiedCount: number;
  unclassifiedSamples: Array<{ _id: any; word: string; normalizedKey: string }>;
  unclassifiedTruncated: boolean;
  sampleLimit: number;
};

export function createPreviewInventory(sampleLimit = 50): PreviewInventory {
  return { byKey: new Map(), unclassifiedCount: 0, retiredUnclassifiedCount: 0, unclassifiedSamples: [], unclassifiedTruncated: false, sampleLimit: Math.max(0, Math.floor(sampleLimit)) };
}

function compactPreviewWord(word: ExistingWord, normalizedWordKey: string): ExistingWord {
  const compact: ExistingWord = { _id: word._id, word: word.word, normalizedWordKey };
  for (const field of [...PATCH_FIELDS, "editorialOrder", "region", "isRetired"] as const) {
    if (word[field] !== undefined) (compact as Record<string, unknown>)[field] = word[field];
  }
  return compact;
}

export function accumulatePreviewInventory(
  inventory: PreviewInventory,
  words: readonly ExistingWord[],
  operationKeys: ReadonlySet<string>,
) {
  for (const word of words) {
    const key = normalizeWordKey(word.word);
    if (!operationKeys.has(key)) {
      if (word.isRetired === true) {
        inventory.retiredUnclassifiedCount += 1;
        continue;
      }
      inventory.unclassifiedCount += 1;
      if (inventory.unclassifiedSamples.length < inventory.sampleLimit) inventory.unclassifiedSamples.push({ _id: word._id, word: word.word, normalizedKey: key });
      else inventory.unclassifiedTruncated = true;
      continue;
    }
    const entry = inventory.byKey.get(key) ?? { count: 0, docs: [] };
    entry.count += 1;
    if (entry.docs.length < 2) entry.docs.push(compactPreviewWord(word, key));
    inventory.byKey.set(key, entry);
  }
  return inventory;
}

export function accumulatePreviewPage(
  inventory: PreviewInventory,
  page: BackfillPage,
  operationKeys: ReadonlySet<string>,
) {
  if (page.pageStatus === "SplitRequired") return false;
  accumulatePreviewInventory(inventory, page.page, operationKeys);
  return true;
}

export function planFromPreviewInventory(inventory: PreviewInventory, operations: readonly CatalogOperation[]) {
  const counts = { patched: 0, inserted: 0, retired: 0, unchanged: 0, conflicts: 0 };
  const details: Array<{ word: string; result: string; ids?: any[] }> = [];
  for (const operation of operations) {
    const key = normalizeWordKey(operation.entry.word);
    const found = inventory.byKey.get(key);
    const matches = found?.docs ?? [];
    const decision = found && found.count >= 2 ? { kind: "conflict" as const } : catalogOperationDecision(operation, matches);
    if (decision.kind === "conflict") counts.conflicts += 1;
    else if (decision.kind === "patch") counts.patched += 1;
    else if (decision.kind === "insert") counts.inserted += 1;
    else if (decision.kind === "retire") counts.retired += 1;
    else counts.unchanged += 1;
    if (details.length < 20 && decision.kind !== "unchanged") {
      details.push({ word: operation.entry.word, result: decision.kind, ...(decision.kind === "conflict" ? { ids: matches.map((word) => word._id) } : {}) });
    }
  }
  return { ...counts, details, detailsTruncated: operations.length > details.length + counts.unchanged };
}

export const backfillNormalizedKeysBatch = internalMutation({
  args: { paginationOpts: paginationOptsValidator, dryRun: v.boolean() },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("words").paginate({
      cursor: args.paginationOpts.cursor,
      endCursor: args.paginationOpts.endCursor,
      numItems: normalizeBackfillLimit(args.paginationOpts.numItems),
    } as any);
    const plan = planBackfillResult(page, args.dryRun, args.paginationOpts.endCursor);
    if (!args.dryRun && plan.status === "ok") {
      for (const item of plan.operations) await ctx.db.patch(item._id, { normalizedWordKey: item.normalizedWordKey });
    }
    return {
      status: plan.status,
      patched: plan.patched,
      unchanged: plan.unchanged,
      dryRun: plan.dryRun,
      continueCursor: plan.continueCursor,
      isDone: plan.isDone,
      splitCursor: plan.splitCursor,
      pageStatus: plan.pageStatus,
      endCursor: plan.endCursor,
    };
  },
});

export const retireUnclassifiedBatch = internalMutation({
  args: { paginationOpts: paginationOptsValidator, dryRun: v.boolean() },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("words").paginate({
      cursor: args.paginationOpts.cursor,
      endCursor: args.paginationOpts.endCursor,
      numItems: normalizeCatalogBatchSize(args.paginationOpts.numItems),
    } as any);
    const metadata = {
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      splitCursor: page.splitCursor ?? null,
      pageStatus: page.pageStatus ?? null,
    };
    if (page.pageStatus === "SplitRequired") {
      return { status: "split_required" as const, retired: 0, alreadyRetired: 0, known: 0, writes: 0, ...metadata };
    }
    const plan = planUnclassifiedRetirementPage(page.page);
    if (!args.dryRun) {
      for (const operation of plan.operations) await ctx.db.patch(operation._id, operation.patch);
    }
    return {
      status: "ok" as const,
      retired: plan.retired,
      alreadyRetired: plan.alreadyRetired,
      known: plan.known,
      writes: args.dryRun ? 0 : plan.retired,
      ...metadata,
    };
  },
});

export const retireUnclassifiedLegacy = internalAction({
  args: { dryRun: v.boolean(), pageSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const queue: PreviewRequest[] = [{ cursor: null, endCursor: null }];
    const totals = { retired: 0, alreadyRetired: 0, known: 0, writes: 0, pages: 0 };
    while (queue.length) {
      const request = queue.shift()!;
      const result: BackfillPage & { retired: number; alreadyRetired: number; known: number; writes: number } = await ctx.runMutation(
        (internal as any).migrations.migrateMexicoVivido.retireUnclassifiedBatch,
        { paginationOpts: { cursor: request.cursor, endCursor: request.endCursor, numItems: normalizeCatalogBatchSize(args.pageSize) }, dryRun: args.dryRun },
      );
      if (result.pageStatus === "SplitRequired") {
        queue.unshift(...nextPreviewRanges(request, result));
        continue;
      }
      totals.retired += result.retired;
      totals.alreadyRetired += result.alreadyRetired;
      totals.known += result.known;
      totals.writes += result.writes;
      totals.pages += 1;
      queue.unshift(...nextPreviewRanges(request, result));
    }
    return { status: "ok" as const, dryRun: args.dryRun, ...totals };
  },
});

export const scanWordsForPreview = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => await ctx.db.query("words").paginate({
    cursor: args.paginationOpts.cursor,
    endCursor: args.paginationOpts.endCursor,
    numItems: normalizeBackfillLimit(args.paginationOpts.numItems),
  } as any),
});

type PreviewRequest = { cursor: string | null; endCursor: string | null };

export function nextPreviewRanges(request: PreviewRequest, page: Pick<BackfillPage, "pageStatus" | "splitCursor" | "continueCursor" | "isDone">): PreviewRequest[] {
  if (page.pageStatus === "SplitRequired") {
    if (!page.splitCursor) throw new Error("SplitRequired sin splitCursor");
    return [{ cursor: request.cursor, endCursor: page.splitCursor }, { cursor: page.splitCursor, endCursor: request.endCursor }];
  }
  return page.isDone ? [] : [{ cursor: page.continueCursor, endCursor: request.endCursor }];
}

export const previewMexicoVividoMigration = internalAction({
  args: { pageSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const pageSize = normalizeBackfillLimit(args.pageSize);
    const operationKeys = CATALOG_OPERATION_KEYS;
    const inventory = createPreviewInventory();
    const queue: PreviewRequest[] = [{ cursor: null, endCursor: null }];
    while (queue.length) {
      const request = queue.shift()!;
      const page: BackfillPage = await ctx.runQuery((internal as any).migrations.migrateMexicoVivido.scanWordsForPreview, {
        paginationOpts: { cursor: request.cursor, endCursor: request.endCursor, numItems: pageSize },
      });
      if (page.pageStatus === "SplitRequired") { queue.unshift(...nextPreviewRanges(request, page)); continue; }
      accumulatePreviewPage(inventory, page, operationKeys);
      queue.unshift(...nextPreviewRanges(request, page));
    }
    return {
      status: "ok" as const,
      ...planFromPreviewInventory(inventory, CATALOG_OPERATIONS),
      unclassified: inventory.unclassifiedCount,
      retiredUnclassified: inventory.retiredUnclassifiedCount,
      unclassifiedSamples: inventory.unclassifiedSamples,
      unclassifiedTruncated: inventory.unclassifiedTruncated,
      dryRun: true,
      writes: 0,
      snapshotConsistent: false,
      note: "Las consultas paginadas no comparten una transacción; escrituras administrativas concurrentes pueden cambiar el resultado.",
      inventoryKeys: inventory.byKey.size,
      maximumInventoryKeys: operationKeys.size,
    };
  },
});

export const migrateCatalogBatch = internalMutation({
  args: { dryRun: v.boolean(), cursor: v.optional(v.number()), batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // This indexed range read shares the write transaction. A concurrent legacy
    // insert without a key conflicts with it; rerun Phase A before retrying.
    const missing = await ctx.db.query("words")
      .withIndex("by_normalized_word_key", (q) => q.eq("normalizedWordKey", undefined))
      .first();
    const sliced = sliceCatalogOperations(CATALOG_OPERATIONS, args.cursor ?? 0, normalizeCatalogBatchSize(args.batchSize));
    if (hasMissingNormalizedKeys(missing)) {
      return {
        status: "keys_not_ready" as const, dryRun: args.dryRun,
        cursor: sliced.cursor, nextCursor: sliced.cursor, isDone: false,
        patched: 0, inserted: 0, retired: 0, unchanged: 0, conflicts: 0, levelRepairs: 0,
        unclassified: null, requiresPreviewForUnclassified: true, details: [],
      };
    }
    const counts = { patched: 0, inserted: 0, retired: 0, unchanged: 0, conflicts: 0, levelRepairs: 0 };
    const details: Array<{ word: string; result: string }> = [];
    for (const operation of sliced.operations) {
      const key = normalizeWordKey(operation.entry.word);
      const matches = await ctx.db.query("words")
        .withIndex("by_normalized_word_key", (q) => q.eq("normalizedWordKey", key))
        .take(3);
      const decision = catalogOperationDecision(operation, matches);
      const existing = matches.length === 1 ? matches[0] : null;
      const legacySnapshot = existing && existing.legacyWord === undefined ? {
        legacyWord: existing.word,
        legacyRegion: existing.region,
        ...(existing.difficulty === undefined ? {} : { legacyDifficulty: existing.difficulty }),
      } : {};
      let orphanWordId: any = null;
      let matchedLevel: any = null;
      if (operation.kind === "retain" && matches.length === 1 && decision.kind !== "conflict") {
        matchedLevel = await ctx.db.query("levels").withIndex("by_word", (q) => q.eq("wordId", matches[0]._id)).first();
        if (needsLevelRepair(decision.kind, Boolean(matchedLevel))) {
          counts.levelRepairs += 1;
          orphanWordId = matches[0]._id;
        }
      }
      const snapshotNeeded = existing && existing.legacyWord === undefined && (!matchedLevel || (matchedLevel.introducedOrderVersion ?? 1) <= 1);
      if (decision.kind === "conflict") counts.conflicts += 1;
      else if (decision.kind === "unchanged" && snapshotNeeded) {
        counts.patched += 1;
        if (!args.dryRun) await ctx.db.patch(existing._id, legacySnapshot);
      }
      else if (decision.kind === "unchanged") counts.unchanged += 1;
      else if (decision.kind === "patch") {
        counts.patched += 1;
        if (!args.dryRun) await ctx.db.patch(decision._id, { ...decision.patch, ...legacySnapshot });
      } else if (decision.kind === "insert") {
        counts.inserted += 1;
        if (!args.dryRun) {
          const wordId = await ctx.db.insert("words", decision.document as any);
          await insertLevelForWord(ctx, wordId);
        }
      } else if (decision.kind === "retire") {
        counts.retired += 1;
        if (!args.dryRun) await ctx.db.patch(decision._id, { isRetired: true, ...legacySnapshot });
      }
      if (!args.dryRun && orphanWordId) await insertLevelForWord(ctx, orphanWordId);
      if (details.length < 20 && decision.kind !== "unchanged") details.push({ word: operation.entry.word, result: decision.kind });
    }
    return {
      status: "ok" as const, dryRun: args.dryRun, cursor: sliced.cursor, nextCursor: sliced.nextCursor, isDone: sliced.isDone,
      ...counts, unclassified: null, requiresPreviewForUnclassified: true, details,
    };
  },
});
