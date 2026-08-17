import assert from "node:assert/strict";
import { validateCulturalWord } from "./culturalValidation.ts";

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
assert.ok(validateCulturalWord({ word: "registro antiguo" }, { requireCulturalMetadata: true }).length >= 8);

for (const invalidAdult of [
  { ...validWord, rating: "adulto", collectionId: "juegos-ninez", pathId: "historias-leyendas", editorialOrder: 151 },
  { ...validWord, rating: "adulto", collectionId: "albures-picaresca", pathId: "patio-recreo", editorialOrder: 151 },
  { ...validWord, rating: "adulto", collectionId: "albures-picaresca", pathId: "historias-leyendas", editorialOrder: 150 },
]) {
  assert.ok(validateCulturalWord(invalidAdult, { requireCulturalMetadata: true }).some((error) => error.includes("contenido adulto")));
}

assert.ok(validateCulturalWord({ ...validWord, generation: ["futuro"] }, { requireCulturalMetadata: true })
  .some((error) => error.includes("generation contiene un valor desconocido")));

console.log("culturalValidation: all assertions passed");
