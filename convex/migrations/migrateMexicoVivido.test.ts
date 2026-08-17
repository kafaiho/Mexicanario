import assert from "node:assert/strict";
import { catalogOperationDecision, hasMissingNormalizedKeys, normalizeBackfillLimit, normalizeCatalogBatchSize, normalizeWordKey, planBackfillPage, planMexicoVividoMigration, sliceCatalogOperations } from "./migrateMexicoVivido";

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

const backfillOne = planBackfillPage([{ _id: "a", word: "Trompo" }, { _id: "b", word: " trompo ", normalizedWordKey: "bad" }]);
const backfillTwo = planBackfillPage([{ _id: "c", word: "Niño" }, { _id: "d", word: "Sol", normalizedWordKey: "sol" }]);
assert.equal(backfillOne.patches.length, 2, "ambos duplicados reciben la clave, sin escoger ganador");
assert.deepEqual(backfillOne.patches.map((item) => item.normalizedWordKey), ["trompo", "trompo"]);
assert.equal(backfillTwo.patches.length, 1);
assert.equal(backfillTwo.unchanged, 1);

assert.equal(normalizeBackfillLimit(undefined), 100);
assert.equal(normalizeBackfillLimit(Number.NaN), 100);
assert.equal(normalizeBackfillLimit(Number.POSITIVE_INFINITY), 100);
assert.equal(normalizeBackfillLimit(999), 200);
assert.equal(normalizeCatalogBatchSize(undefined), 25);
assert.equal(normalizeCatalogBatchSize(Number.NaN), 25);
assert.equal(normalizeCatalogBatchSize(999), 50);
assert.equal(normalizeCatalogBatchSize(0), 1);

const operations = [{ kind: "retain", entry: catalog[0] }, { kind: "remove", entry: { word: "rayuela" } }] as const;
const firstBatch = sliceCatalogOperations(operations, 0, 1);
const secondBatch = sliceCatalogOperations(operations, firstBatch.nextCursor, 1);
assert.deepEqual(firstBatch.operations.map((op) => op.kind), ["retain"]);
assert.deepEqual(secondBatch.operations.map((op) => op.kind), ["remove"]);
assert.equal(firstBatch.operations.length + secondBatch.operations.length, 2, "dry-runs paginados no duplican operaciones");
assert.equal(secondBatch.isDone, true);

assert.equal(catalogOperationDecision(operations[0], []).kind, "insert");
assert.equal(catalogOperationDecision(operations[0], [{ _id: "a", word: "niño héroe" }, { _id: "b", word: "niño héroe" }]).kind, "conflict");
assert.equal(catalogOperationDecision(operations[0], [applied[0]]).kind, "unchanged", "la segunda pasada del catálogo produce cero escrituras");
assert.equal(catalogOperationDecision(operations[1], [{ _id: "a", word: "rayuela", isRetired: false }]).kind, "retire");
assert.equal(catalogOperationDecision(operations[1], [{ _id: "a", word: "rayuela", isRetired: true }]).kind, "unchanged");
assert.equal(hasMissingNormalizedKeys(undefined), false);
assert.equal(hasMissingNormalizedKeys({ _id: "legacy" }), true);

console.log("migrateMexicoVivido: helpers puros válidos");
