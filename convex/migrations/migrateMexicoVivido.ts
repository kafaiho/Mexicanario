import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { MEXICO_VIVIDO_WORDS, REMOVED_WORDS } from "./mexicoVividoCatalog.generated";

/**
 * Run Phase A until isDone (respecting splitCursor/pageStatus), then run Phase B
 * from cursor 0 until isDone. If Phase B returns keys_not_ready, restart Phase A;
 * a writer inserted a legacy row without normalizedWordKey.
 */

type ExistingWord = { _id: any; word: string; [key: string]: unknown };
type CatalogWord = (typeof MEXICO_VIVIDO_WORDS)[number] | Record<string, unknown> & { word: string };
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

type RetainOperation = { kind: "retain"; entry: CatalogWord };
type RemoveOperation = { kind: "remove"; entry: RemovedWord };
type CatalogOperation = RetainOperation | RemoveOperation;

const CATALOG_OPERATIONS: readonly CatalogOperation[] = [
  ...MEXICO_VIVIDO_WORDS.map((entry) => ({ kind: "retain" as const, entry })),
  ...REMOVED_WORDS.map((entry) => ({ kind: "remove" as const, entry })),
];

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

export const backfillNormalizedKeysBatch = internalMutation({
  args: { paginationOpts: paginationOptsValidator, dryRun: v.boolean() },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("words").paginate({
      cursor: args.paginationOpts.cursor,
      endCursor: args.paginationOpts.endCursor,
      numItems: normalizeBackfillLimit(args.paginationOpts.numItems),
    } as any);
    const plan = planBackfillPage(page.page);
    if (!args.dryRun) {
      for (const item of plan.patches) await ctx.db.patch(item._id, { normalizedWordKey: item.normalizedWordKey });
    }
    return {
      status: "ok" as const,
      patched: plan.patches.length,
      unchanged: plan.unchanged,
      dryRun: args.dryRun,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      splitCursor: page.splitCursor ?? null,
      pageStatus: page.pageStatus ?? null,
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
        patched: 0, inserted: 0, retired: 0, unchanged: 0, conflicts: 0, details: [],
      };
    }
    const counts = { patched: 0, inserted: 0, retired: 0, unchanged: 0, conflicts: 0 };
    const details: Array<{ word: string; result: string }> = [];
    for (const operation of sliced.operations) {
      const key = normalizeWordKey(operation.entry.word);
      const matches = await ctx.db.query("words")
        .withIndex("by_normalized_word_key", (q) => q.eq("normalizedWordKey", key))
        .take(3);
      const decision = catalogOperationDecision(operation, matches);
      if (decision.kind === "conflict") counts.conflicts += 1;
      else if (decision.kind === "unchanged") counts.unchanged += 1;
      else if (decision.kind === "patch") {
        counts.patched += 1;
        if (!args.dryRun) await ctx.db.patch(decision._id, decision.patch);
      } else if (decision.kind === "insert") {
        counts.inserted += 1;
        if (!args.dryRun) await ctx.db.insert("words", decision.document as any);
      } else if (decision.kind === "retire") {
        counts.retired += 1;
        if (!args.dryRun) await ctx.db.patch(decision._id, { isRetired: true });
      }
      if (details.length < 20 && decision.kind !== "unchanged") details.push({ word: operation.entry.word, result: decision.kind });
    }
    return { status: "ok" as const, dryRun: args.dryRun, cursor: sliced.cursor, nextCursor: sliced.nextCursor, isDone: sliced.isDone, ...counts, details };
  },
});
