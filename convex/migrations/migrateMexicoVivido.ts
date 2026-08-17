import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
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

export const migrateBatch = internalMutation({
  args: { dryRun: v.boolean(), limit: v.optional(v.number()), cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, Math.floor(args.limit ?? 100)));
    const page = await ctx.db.query("words").paginate({ cursor: args.cursor ?? null, numItems: limit });
    const plan = planMexicoVividoMigration(page.page, MEXICO_VIVIDO_WORDS, REMOVED_WORDS);
    let inserted = 0;
    const details = {
      conflicts: plan.conflicts.slice(0, 20),
      unclassified: plan.unclassified.slice(0, 20).map((word) => ({ _id: word._id, word: word.word })),
    };
    if (!args.dryRun) {
      for (const item of plan.patches) await ctx.db.patch(item._id, item.patch);
      for (const item of plan.retires) await ctx.db.patch(item._id, item.patch);
      // Inserts are delayed until the final page. Prior pages have already canonicalized retained words.
      if (page.isDone) {
        for (const entry of plan.inserts) {
          const matches = await ctx.db.query("words").withIndex("by_normalized_word_key", (q) => q.eq("normalizedWordKey", entry.normalizedWordKey as string)).take(2);
          if (matches.length === 0) {
            await ctx.db.insert("words", entry as any);
            inserted += 1;
          }
        }
      }
    }
    return {
      patched: plan.patches.length,
      inserted: args.dryRun ? plan.inserts.length : inserted,
      retired: plan.retires.length,
      unchanged: plan.unchanged.length,
      conflicts: plan.conflicts.length,
      unclassified: plan.unclassified.length,
      dryRun: args.dryRun,
      continueCursor: page.isDone ? null : page.continueCursor,
      isDone: page.isDone,
      details,
    };
  },
});
