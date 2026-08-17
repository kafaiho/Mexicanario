const assert = require('assert');
const { CULTURAL_PATHS, COLLECTIONS, PLACES } = require('./culturalTaxonomy');
const { MEXICO_VIVIDO_WORDS, REMOVED_WORDS, FIRST_FIFTY_CONTEXT_REVIEW, SEMANTIC_CONCEPT_OVERRIDES } = require('../content/mexicoVividoWords');

const normalizePreservingEnye = (value) => value.toLocaleLowerCase('es-MX')
  .replace(/ñ/g, '\u0000').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0000/g, 'ñ').trim();
const ids = (items) => new Set(items.map(({ id }) => id));
const pathIds = ids(CULTURAL_PATHS);
const collectionIds = ids(COLLECTIONS);
const placeIds = ids(PLACES);
const generations = new Set(['tradicional', '80s', '90s', '2000s', 'actual']);
const requiredCollectionMinimums = {
  'tele-cultura-popular': 5,
  'mexico-digital': 5,
  'ciencia-inventos-deporte': 6,
  'albures-picaresca': 4,
};

assert(MEXICO_VIVIDO_WORDS.length >= 200, 'el catálogo debe publicar al menos 200 entradas');
const words = MEXICO_VIVIDO_WORDS.map(({ word }) => normalizePreservingEnye(word));
assert.strictEqual(new Set(words).size, words.length, 'las palabras normalizadas deben ser únicas');
const concepts = MEXICO_VIVIDO_WORDS.map(({ conceptId }) => conceptId);
assert(concepts.every(Boolean), 'cada entrada debe declarar un conceptId editorial');
assert.strictEqual(new Set(concepts).size, concepts.length, 'no debe haber variantes del mismo concepto');
assert(Object.keys(SEMANTIC_CONCEPT_OVERRIDES).length >= 6, 'debe documentar equivalencias semánticas conocidas');
for (const [variant, conceptId] of Object.entries(SEMANTIC_CONCEPT_OVERRIDES)) {
  assert(variant && conceptId, 'cada equivalencia conocida necesita variante y concepto');
}
const orders = MEXICO_VIVIDO_WORDS.map(({ order }) => order);
assert.deepStrictEqual(orders, [...orders].sort((a, b) => a - b), 'el catálogo debe estar ordenado');
assert.strictEqual(new Set(orders).size, orders.length, 'los órdenes deben ser únicos');

for (const entry of MEXICO_VIVIDO_WORDS) {
  assert(entry.word && entry.meaning && entry.example && entry.icon, `metadatos incompletos: ${entry.word}`);
  assert(pathIds.has(entry.pathId), `camino inválido: ${entry.word}`);
  assert(collectionIds.has(entry.collectionId), `colección inválida: ${entry.word}`);
  assert(placeIds.has(entry.placeId) && entry.placeId !== 'unclassified', `lugar inválido: ${entry.word}`);
  assert([1, 2, 3].includes(entry.difficulty), `dificultad inválida: ${entry.word}`);
  assert(Number.isInteger(entry.order) && entry.order > 0, `orden inválido: ${entry.word}`);
  assert(Array.isArray(entry.generation) && entry.generation.length > 0, `generación ausente: ${entry.word}`);
  assert(entry.generation.every((value) => generations.has(value)), `generación inválida: ${entry.word}`);
  assert(['familiar', 'adulto'].includes(entry.rating), `clasificación inválida: ${entry.word}`);
  assert(normalizePreservingEnye(entry.example) !== normalizePreservingEnye(entry.meaning), `ejemplo repetido: ${entry.word}`);
  assert(entry.example.length >= 18 && /[ .,!¿?]/.test(entry.example), `ejemplo sin contexto natural: ${entry.word}`);
  if (entry.rating === 'adulto') {
    assert.strictEqual(entry.collectionId, 'albures-picaresca');
    assert(entry.order > 150 && !['patio-recreo', 'casa-abuela'].includes(entry.pathId));
  }
}

for (const path of CULTURAL_PATHS) {
  assert(MEXICO_VIVIDO_WORDS.filter(({ pathId }) => pathId === path.id).length >= 20, `${path.id} necesita 20 entradas`);
}
for (const collection of COLLECTIONS) {
  assert(MEXICO_VIVIDO_WORDS.some(({ collectionId }) => collectionId === collection.id), `${collection.id} debe estar representada`);
}
for (const [collectionId, minimum] of Object.entries(requiredCollectionMinimums)) {
  assert(MEXICO_VIVIDO_WORDS.filter((entry) => entry.collectionId === collectionId).length >= minimum, `${collectionId} necesita ${minimum} entradas`);
}
assert(MEXICO_VIVIDO_WORDS.filter((entry) => entry.collectionId === 'ciencia-inventos-deporte' && entry.topic === 'deporte').length >= 3, 'ciencia e inventos necesita al menos tres deportes');
for (const entry of MEXICO_VIVIDO_WORDS.slice(0, 50)) {
  assert.strictEqual(entry.rating, 'familiar');
  assert(entry.difficulty <= 2, `inicio demasiado difícil: ${entry.word}`);
}
assert(new Set(MEXICO_VIVIDO_WORDS.slice(0, 50).map(({ collectionId }) => collectionId)).size >= 4, 'el inicio debe cubrir al menos cuatro colecciones');
const firstFifty = new Set(MEXICO_VIVIDO_WORDS.slice(0, 50).map(({ word }) => normalizePreservingEnye(word)));
const reviewedContexts = Object.entries(FIRST_FIFTY_CONTEXT_REVIEW);
assert(reviewedContexts.length >= 40, 'al menos 40 entradas iniciales necesitan revisión contextual explícita');
for (const [word, review] of reviewedContexts) {
  assert(firstFifty.has(normalizePreservingEnye(word)), `la revisión contextual debe pertenecer a las primeras 50: ${word}`);
  assert(review.reason && review.reason.length >= 20, `falta una razón contextual legible: ${word}`);
  assert(review.category, `falta categoría contextual: ${word}`);
}
assert(new Set(reviewedContexts.map(([, review]) => review.category)).size >= 4, 'la revisión debe cubrir al menos cuatro tipos de contexto');

const expectedPaths = {
  'pelota mixteca': 'mexico-profundo', ulama: 'mexico-profundo',
  'juego de pelota mesoamericano': 'mexico-profundo', 'televisión a color': 'mexico-profundo',
  'lucha libre': 'feria-verbena', cibercafé: 'calle-barrio',
};
for (const [word, pathId] of Object.entries(expectedPaths)) {
  assert.strictEqual(MEXICO_VIVIDO_WORDS.find((entry) => entry.word === word)?.pathId, pathId, `${word} pertenece a ${pathId}`);
}

assert(Array.isArray(REMOVED_WORDS) && REMOVED_WORDS.length > 0, 'debe documentar retiradas');
const removed = new Set();
for (const item of REMOVED_WORDS) {
  const key = normalizePreservingEnye(item.word);
  assert(item.word && item.reason, 'cada retirada necesita palabra y motivo');
  assert(!removed.has(key), `retirada duplicada: ${item.word}`);
  assert(!words.includes(key), `una retirada no puede seguir publicada: ${item.word}`);
  removed.add(key);
}

console.log(`culturalContent: ${MEXICO_VIVIDO_WORDS.length} entradas y ${REMOVED_WORDS.length} retiradas válidas`);
