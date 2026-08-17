import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { MEXICO_VIVIDO_WORDS, REMOVED_WORDS } from "./mexicoVividoCatalog.generated";

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

export function planFromPages(
  pages: readonly (readonly ExistingWord[])[],
  catalog: readonly CatalogWord[],
  removed: readonly RemovedWord[],
) {
  return planMexicoVividoMigration(pages.flat(), catalog, removed);
}

export function normalizeBatchSize(value?: number): number {
  if (value === undefined || !Number.isFinite(value)) return 100;
  return Math.max(1, Math.min(200, Math.floor(value)));
}

type ScanRequest = { cursor: string | null; endCursor: string | null };
type ScanResult = { continueCursor: string; isDone: boolean; splitCursor?: string | null; pageStatus?: "SplitRecommended" | "SplitRequired" | null };

export function nextScanRequests(request: ScanRequest, result: ScanResult): ScanRequest[] {
  if (result.pageStatus === "SplitRequired" && result.splitCursor) {
    const ranges: ScanRequest[] = [
      { cursor: request.cursor, endCursor: result.splitCursor },
      { cursor: result.splitCursor, endCursor: result.continueCursor },
    ];
    if (!request.endCursor && !result.isDone) ranges.push({ cursor: result.continueCursor, endCursor: null });
    return ranges;
  }
  if (!result.isDone && !request.endCursor) return [{ cursor: result.continueCursor, endCursor: null }];
  return [];
}

export function summarizeMigrationPlan(plan: ReturnType<typeof planMexicoVividoMigration>, dryRun: boolean, detailLimit = 20) {
  const conflicts = plan.conflicts.slice(0, detailLimit);
  const unclassified = plan.unclassified.slice(0, detailLimit).map((word) => ({ _id: word._id, word: word.word }));
  return {
    patched: plan.patches.length,
    inserted: plan.inserts.length,
    retired: plan.retires.length,
    unchanged: plan.unchanged.length,
    conflicts: plan.conflicts.length,
    unclassified: plan.unclassified.length,
    dryRun,
    details: { conflicts, unclassified, truncated: conflicts.length < plan.conflicts.length || unclassified.length < plan.unclassified.length },
  };
}

export const scanWordsPage = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db.query("words").paginate({
      cursor: args.paginationOpts.cursor,
      endCursor: args.paginationOpts.endCursor,
      numItems: normalizeBatchSize(args.paginationOpts.numItems),
    } as any);
  },
});

export const applyMigrationBatch = internalMutation({
  args: { operations: v.array(v.any()) },
  handler: async (ctx, args) => {
    const result = { patched: 0, inserted: 0, retired: 0, unchanged: 0, skipped: 0 };
    const retainedKeys = new Set(MEXICO_VIVIDO_WORDS.map((entry) => normalizeWordKey(entry.word)));
    const removedKeys = new Set(REMOVED_WORDS.map((entry) => normalizeWordKey(entry.word)));
    for (const operation of args.operations) {
      if (operation.kind === "patch") {
        const current: any = await ctx.db.get(operation._id);
        if (!current || normalizeWordKey(current.word) !== normalizeWordKey(operation.patch.word)) { result.skipped += 1; continue; }
        const patch = Object.fromEntries(Object.entries(operation.patch).filter(([field, value]) => !sameValue((current as any)[field], value)));
        if (Object.keys(patch).length === 0) result.unchanged += 1;
        else { await ctx.db.patch(operation._id, patch); result.patched += 1; }
      } else if (operation.kind === "retire") {
        const current: any = await ctx.db.get(operation._id);
        if (!current) { result.skipped += 1; continue; }
        const key = normalizeWordKey(current.word);
        if (!removedKeys.has(key) || retainedKeys.has(key)) { result.skipped += 1; continue; }
        if (current.isRetired === true) result.unchanged += 1;
        else { await ctx.db.patch(operation._id, { isRetired: true }); result.retired += 1; }
      } else if (operation.kind === "insert") {
        const desired = operation.document;
        const normalizedMatches = await ctx.db.query("words").withIndex("by_normalized_word_key", (q) => q.eq("normalizedWordKey", desired.normalizedWordKey)).take(2);
        const exactMatches = await ctx.db.query("words").withIndex("by_word", (q) => q.eq("word", desired.word)).take(2);
        if (normalizedMatches.length || exactMatches.length) result.unchanged += 1;
        else { await ctx.db.insert("words", desired); result.inserted += 1; }
      }
    }
    return result;
  },
});

export const migrateMexicoVivido = internalAction({
  args: { dryRun: v.boolean(), batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const batchSize = normalizeBatchSize(args.batchSize);
    const requests: ScanRequest[] = [{ cursor: null, endCursor: null }];
    const pages: ExistingWord[][] = [];
    while (requests.length) {
      const request = requests.shift()!;
      const page: any = await ctx.runQuery((internal as any).migrations.migrateMexicoVivido.scanWordsPage, {
        paginationOpts: { cursor: request.cursor, endCursor: request.endCursor, numItems: batchSize },
      });
      if (page.pageStatus !== "SplitRequired") pages.push(page.page);
      requests.unshift(...nextScanRequests(request, page));
    }
    const plan = planFromPages(pages, MEXICO_VIVIDO_WORDS, REMOVED_WORDS);
    const summary = summarizeMigrationPlan(plan, args.dryRun);
    if (args.dryRun) return { ...summary, applied: null };
    const operations = [
      ...plan.patches.map((item) => ({ kind: "patch", ...item })),
      ...plan.inserts.map((document) => ({ kind: "insert", document })),
      ...plan.retires.map((item) => ({ kind: "retire", ...item })),
    ];
    const applied = { patched: 0, inserted: 0, retired: 0, unchanged: 0, skipped: 0 };
    for (let index = 0; index < operations.length; index += batchSize) {
      const batch: any = await ctx.runMutation((internal as any).migrations.migrateMexicoVivido.applyMigrationBatch, {
        operations: operations.slice(index, index + batchSize),
      });
      for (const key of Object.keys(applied) as (keyof typeof applied)[]) applied[key] += batch[key];
    }
    return { ...summary, applied };
  },
});
