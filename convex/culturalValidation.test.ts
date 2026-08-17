import assert from "node:assert/strict";
import { buildCulturalAudit, buildCulturalAuditPage, validateCulturalWord } from "./culturalValidation.ts";

const validWord = {
  word: "balero",
  collectionId: "juegos-ninez",
  pathId: "patio-recreo",
  placeId: "todo-mexico",
  difficulty: 1,
  generation: ["tradicional", "90s"],
  rating: "familiar",
  icon: "🪀",
  editorialOrder: 1,
};

assert.deepEqual(validateCulturalWord(validWord, { requireCulturalMetadata: true }), []);

const errors = validateCulturalWord({
  ...validWord,
  collectionId: "inventada",
  pathId: "inventado",
  placeId: "unclassified",
  difficulty: 4,
  generation: [],
  rating: "todo-publico",
  icon: " ",
  editorialOrder: 0,
}, { requireCulturalMetadata: true });

for (const fragment of [
  "collectionId desconocido",
  "pathId desconocido",
  "placeId no puede ser unclassified",
  "difficulty debe ser 1, 2 o 3",
  "rating debe ser familiar o adulto",
  "generation debe incluir al menos un valor",
  "icon no puede estar vacío",
  "editorialOrder debe ser un entero positivo",
]) {
  assert.ok(errors.some((error) => error.includes(fragment)), `falta error: ${fragment}`);
}

assert.deepEqual(validateCulturalWord({ word: "registro antiguo" }), []);
assert.deepEqual(validateCulturalWord({ word: "registro antiguo" }, { requireCulturalMetadata: true }), [
  "collectionId desconocido o ausente",
  "pathId desconocido o ausente",
  "placeId desconocido o ausente",
  "difficulty debe ser 1, 2 o 3",
  "rating debe ser familiar o adulto",
  "generation debe incluir al menos un valor",
  "icon no puede estar vacío",
  "editorialOrder debe ser un entero positivo",
]);
assert.deepEqual(validateCulturalWord({ ...validWord, placeId: "unclassified" }, { requireCulturalMetadata: true }), [
  "placeId no puede ser unclassified en contenido publicable",
]);

const validAdult = {
  ...validWord,
  rating: "adulto",
  collectionId: "albures-picaresca",
  pathId: "historias-leyendas",
  editorialOrder: 151,
};
assert.deepEqual(validateCulturalWord(validAdult, { requireCulturalMetadata: true }), []);
assert.ok(validateCulturalWord({ ...validAdult, collectionId: "juegos-ninez" }, { requireCulturalMetadata: true })
  .includes("contenido adulto solo puede pertenecer a albures-picaresca"));
assert.ok(validateCulturalWord({ ...validAdult, pathId: "patio-recreo" }, { requireCulturalMetadata: true })
  .includes("contenido adulto solo puede aparecer en un camino tardío"));
assert.ok(validateCulturalWord({ ...validAdult, editorialOrder: 150 }, { requireCulturalMetadata: true })
  .includes("contenido adulto requiere editorialOrder mayor que 150"));

assert.ok(validateCulturalWord({ ...validWord, generation: ["futuro"] }, { requireCulturalMetadata: true })
  .some((error) => error.includes("generation contiene un valor desconocido")));

const validStoredWord = { _id: "valid-id", ...validWord };
const invalidStoredWord = { _id: "invalid-id", ...validWord, word: "inválida", collectionId: "inventada" };
assert.deepEqual(buildCulturalAudit([
  { _id: "legacy-id", word: "legado" },
  validStoredWord,
  invalidStoredWord,
]), {
  pageTotal: 3,
  audited: 2,
  valid: 1,
  invalid: 1,
  issues: [{
    wordId: "invalid-id",
    word: "inválida",
    errors: ["collectionId desconocido o ausente"],
  }],
  issueCount: 1,
  truncated: false,
});

const cappedAudit = buildCulturalAudit([
  { ...invalidStoredWord, _id: "invalid-1" },
  { ...invalidStoredWord, _id: "invalid-2" },
  { ...invalidStoredWord, _id: "invalid-3" },
], { limit: 2 });
assert.equal(cappedAudit.pageTotal, 3);
assert.equal(cappedAudit.audited, 3);
assert.equal(cappedAudit.valid, 0);
assert.equal(cappedAudit.invalid, 3);
assert.equal(cappedAudit.issueCount, 3);
assert.equal(cappedAudit.issues.length, 2);
assert.equal(cappedAudit.truncated, true);

assert.deepEqual(buildCulturalAuditPage({
  page: [validStoredWord, invalidStoredWord],
  continueCursor: "next-page",
  isDone: false,
  splitCursor: null,
  pageStatus: null,
}), {
  pageTotal: 2,
  audited: 2,
  valid: 1,
  invalid: 1,
  issues: [{
    wordId: "invalid-id",
    word: "inválida",
    errors: ["collectionId desconocido o ausente"],
  }],
  issueCount: 1,
  truncated: false,
  continueCursor: "next-page",
  isDone: false,
  splitCursor: null,
  pageStatus: null,
  auditStatus: "has_more",
});

assert.deepEqual(buildCulturalAuditPage({
  page: [invalidStoredWord],
  continueCursor: "large-page-end",
  isDone: false,
  splitCursor: "large-page-middle",
  pageStatus: "SplitRequired",
}), {
  pageTotal: 1,
  audited: 1,
  valid: 0,
  invalid: 1,
  issues: [{
    wordId: "invalid-id",
    word: "inválida",
    errors: ["collectionId desconocido o ausente"],
  }],
  issueCount: 1,
  truncated: false,
  continueCursor: "large-page-end",
  isDone: false,
  splitCursor: "large-page-middle",
  pageStatus: "SplitRequired",
  auditStatus: "split_required",
});

console.log("culturalValidation: all assertions passed");
