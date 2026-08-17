import assert from "node:assert/strict";
import { normalizeWordKey, planMexicoVividoMigration } from "./migrateMexicoVivido";

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

console.log("migrateMexicoVivido: helpers puros válidos");
