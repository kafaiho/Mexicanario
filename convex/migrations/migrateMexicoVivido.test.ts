import assert from "node:assert/strict";
import { normalizeBatchSize, normalizeWordKey, planFromPages, planMexicoVividoMigration, nextScanRequests, summarizeMigrationPlan } from "./migrateMexicoVivido";

const catalog = [{ word: "Niño héroe", meaning: "nuevo", example: "ejemplo", collectionId: "historia", pathId: "mexico-profundo", placeId: "nacional", difficulty: 1, generation: ["actual"], rating: "familiar", icon: "🇲🇽", order: 7, conceptId: "nino-heroe" }];

assert.equal(normalizeWordKey("  ¡NIÑO—héroe!  "), "niño heroe");
assert.notEqual(normalizeWordKey("niño"), normalizeWordKey("nino"));

const existing = [{ _id: "word-1", word: "Niño héroe", meaning: "viejo", custom: "preservar" }, { _id: "word-2", word: "Rayuela", meaning: "viejo" }];
const plan = planMexicoVividoMigration(existing, catalog, [{ word: "rayuela", reason: "duplicada" }]);
assert.equal(plan.patches.length, 1);
assert.equal(plan.patches[0]._id, "word-1");
assert.equal(plan.patches[0].patch.editorialOrder, 7);
assert.equal((plan.patches[0].patch as any).custom, undefined);
assert.deepEqual(plan.retires.map((x) => x._id), ["word-2"]);
assert.equal(existing[0].meaning, "viejo", "el plan no muta entradas");

const applied = existing.map((word) => {
  const patch = plan.patches.find((item) => item._id === word._id)?.patch;
  const retired = plan.retires.some((item) => item._id === word._id);
  return { ...word, ...patch, ...(retired ? { isRetired: true } : {}) };
});
const second = planMexicoVividoMigration(applied, catalog, [{ word: "rayuela", reason: "duplicada" }]);
assert.equal(second.patches.length, 0);
assert.equal(second.inserts.length, 0);
assert.equal(second.retires.length, 0);
assert.equal(second.unchanged.length, 2);

const duplicate = planMexicoVividoMigration([
  { _id: "a", word: "Trompo" }, { _id: "b", word: " trompo " },
], [{ ...catalog[0], word: "trompo" }], []);
assert.equal(duplicate.conflicts.length, 1);
assert.equal(duplicate.patches.length, 0);

const unknown = planMexicoVividoMigration([{ _id: "x", word: "desconocida" }], catalog, []);
assert.deepEqual(unknown.unclassified.map((x) => x._id), ["x"]);

const global = planFromPages([
  [{ _id: "page-1", word: "Trompo" }, { _id: "present-1", word: "Niño héroe", meaning: "nuevo", example: "ejemplo", collectionId: "historia", pathId: "mexico-profundo", placeId: "nacional", region: "nacional", difficulty: 1, generation: ["actual"], rating: "familiar", icon: "🇲🇽", editorialOrder: 7, conceptId: "nino-heroe", normalizedWordKey: "niño heroe", isRetired: false }],
  [{ _id: "page-2", word: " trompo " }],
], catalog, []);
assert.equal(global.conflicts.length, 1, "duplicados separados por páginas se detectan globalmente");
assert.equal(global.patches.length, 0);
assert.equal(global.inserts.length, 0, "dry-run global no cuenta como ausente una palabra presente en otra página");

assert.equal(normalizeBatchSize(undefined), 100);
assert.equal(normalizeBatchSize(Number.NaN), 100);
assert.equal(normalizeBatchSize(Number.POSITIVE_INFINITY), 100);
assert.equal(normalizeBatchSize(999), 200);
assert.equal(normalizeBatchSize(0), 1);

const split = nextScanRequests({ cursor: null, endCursor: null }, { continueCursor: "end", splitCursor: "mid", pageStatus: "SplitRequired", isDone: false });
assert.deepEqual(split, [
  { cursor: null, endCursor: "mid" },
  { cursor: "mid", endCursor: "end" },
  { cursor: "end", endCursor: null },
]);
assert.deepEqual(nextScanRequests({ cursor: "a", endCursor: null }, { continueCursor: "b", isDone: false }), [{ cursor: "b", endCursor: null }]);

const summary = summarizeMigrationPlan(global, true, 1);
assert.equal(summary.dryRun, true);
assert.equal(summary.conflicts, 1);
assert.equal(summary.details.conflicts.length, 1);
assert.equal(summary.details.truncated, false);

console.log("migrateMexicoVivido: helpers puros válidos");
