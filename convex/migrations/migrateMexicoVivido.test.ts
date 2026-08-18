import assert from "node:assert/strict";
import { accumulatePreviewInventory, accumulatePreviewPage, catalogOperationDecision, createPreviewInventory, hasMissingNormalizedKeys, needsLevelRepair, nextPreviewRanges, normalizeBackfillLimit, normalizeCatalogBatchSize, normalizeWordKey, planBackfillPage, planBackfillResult, planFromPreviewInventory, planMexicoVividoMigration, planUnclassifiedRetirementPage, sliceCatalogOperations } from "./migrateMexicoVivido";

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
const incomplete = planBackfillResult({
  page: [{ _id: "incomplete", word: "Trompo" }],
  pageStatus: "SplitRequired", splitCursor: "middle", continueCursor: "end", isDone: false,
}, false, "start");
assert.equal(incomplete.status, "split_required");
assert.equal(incomplete.patched, 0);
assert.equal(incomplete.unchanged, 0);
assert.deepEqual(incomplete.operations, []);
assert.equal(incomplete.splitCursor, "middle");
assert.equal(incomplete.continueCursor, "end");
assert.equal(incomplete.endCursor, "start");

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

const previewOperations = [
  { kind: "retain" as const, entry: catalog[0] },
  { kind: "retain" as const, entry: { ...catalog[0], word: "ausente", order: 8 } },
  { kind: "remove" as const, entry: { word: "rayuela" } },
];
const previewKeys = new Set(previewOperations.map((op) => normalizeWordKey(op.entry.word)));
const inventory = createPreviewInventory(2);
assert.equal(accumulatePreviewPage(inventory, {
  page: [{ _id: "discarded", word: "Niño héroe" }], pageStatus: "SplitRequired",
  splitCursor: "mid", continueCursor: "end", isDone: false,
}, previewKeys), false);
assert.equal(inventory.byKey.size, 0, "el preview descarta por completo páginas incompletas");
  accumulatePreviewInventory(inventory, [{ ...applied[0], _id: "p1" }], previewKeys);
accumulatePreviewInventory(inventory, [{ _id: "p2", word: "Rayuela", normalizedWordKey: "rayuela", isRetired: false }], previewKeys);
const preview = planFromPreviewInventory(inventory, previewOperations);
assert.equal(preview.inserted, 1, "solo la clave realmente ausente se inserta");
assert.equal(preview.unchanged, 1, "una palabra retenida vista en otra página no es falso insert");
assert.equal(preview.retired, 1);
accumulatePreviewInventory(inventory, [{ _id: "p3", word: "Niño héroe", normalizedWordKey: "niño heroe" }], previewKeys);
const duplicatePreview = planFromPreviewInventory(inventory, previewOperations);
assert.equal(duplicatePreview.conflicts, 1, "duplicados entre páginas son conflicto");
accumulatePreviewInventory(inventory, [{ _id: "u1", word: "extra uno" }, { _id: "u2", word: "extra dos" }], previewKeys);
accumulatePreviewInventory(inventory, [{ _id: "u3", word: "extra tres" }], previewKeys);
assert.equal(inventory.unclassifiedCount, 3);
assert.equal(inventory.unclassifiedSamples.length, 2);
assert.equal(inventory.unclassifiedTruncated, true);
assert.ok(inventory.byKey.size <= previewKeys.size, "el inventario nunca supera las claves operativas");

const retirement = planUnclassifiedRetirementPage([
  { _id: "active", word: "Extra activa", region: "Norte", difficulty: 3 },
  { _id: "retired", word: "Extra retirada", isRetired: true },
  { _id: "known", word: "Niño héroe" },
], previewKeys);
assert.deepEqual(retirement.operations, [{
  _id: "active",
  patch: { isRetired: true, legacyWord: "Extra activa", legacyRegion: "Norte", legacyDifficulty: 3 },
}]);
assert.equal(retirement.retired, 1);
assert.equal(retirement.alreadyRetired, 1);
assert.equal(retirement.known, 1);
const retirementSecondPass = planUnclassifiedRetirementPage([
  { _id: "active", word: "Extra activa", region: "Norte", difficulty: 3, isRetired: true, legacyWord: "Extra activa", legacyRegion: "Norte", legacyDifficulty: 3 },
], previewKeys);
assert.equal(retirementSecondPass.operations.length, 0, "el retiro masivo es idempotente");

const postRetirementInventory = createPreviewInventory();
accumulatePreviewInventory(postRetirementInventory, [{ _id: "old", word: "Extra retirada", isRetired: true }], previewKeys);
assert.equal(postRetirementInventory.unclassifiedCount, 0, "el preview final ignora legado ya retirado");
assert.equal(postRetirementInventory.retiredUnclassifiedCount, 1);

assert.deepEqual(nextPreviewRanges({ cursor: null, endCursor: null }, {
  pageStatus: "SplitRequired", splitCursor: "mid", continueCursor: "partial", isDone: false,
}), [{ cursor: null, endCursor: "mid" }, { cursor: "mid", endCursor: null }], "split raíz conserva el extremo abierto");
assert.deepEqual(nextPreviewRanges({ cursor: "mid", endCursor: "root-end" }, {
  pageStatus: "SplitRequired", splitCursor: "nested", continueCursor: "partial-2", isDone: false,
}), [{ cursor: "mid", endCursor: "nested" }, { cursor: "nested", endCursor: "root-end" }], "split anidado conserva el extremo original");
assert.deepEqual(nextPreviewRanges({ cursor: "nested", endCursor: "root-end" }, {
  pageStatus: null, splitCursor: null, continueCursor: "next", isDone: false,
}), [{ cursor: "next", endCursor: "root-end" }]);
assert.equal(needsLevelRepair("insert", false), false, "una inserción crea palabra y nivel atómicamente");
assert.equal(needsLevelRepair("patch", false), true, "palabra huérfana requiere reparación");
assert.equal(needsLevelRepair("unchanged", false), true);
assert.equal(needsLevelRepair("conflict", false), false, "conflictos no crean niveles");
assert.equal(needsLevelRepair("unchanged", true), false, "segunda pasada no duplica nivel");

console.log("migrateMexicoVivido: helpers puros válidos");
