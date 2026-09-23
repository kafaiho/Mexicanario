const assert = require('assert');
const { CULTURAL_PATHS, COLLECTIONS, PLACES } = require('./culturalTaxonomy');
const { MEXICO_VIVIDO_WORDS, REMOVED_WORDS, FIRST_FIFTY_CONTEXT_REVIEW, SEMANTIC_CONCEPT_OVERRIDES, createCatalogEntry } = require('../content/mexicoVividoWords');

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

const sharedGeneration = ['actual'];
const adultFixture = createCatalogEntry({
  word: 'fixture adulto', meaning: 'Entrada de prueba para el constructor.',
  example: 'Esta entrada solo comprueba el metadato de clasificación.',
  collectionId: 'albures-picaresca', pathId: 'historias-leyendas', placeId: 'todo-mexico',
  difficulty: 3, generation: sharedGeneration, rating: 'adulto', icon: '😉', order: 9999,
  conceptId: 'fixture-adulto',
});
const secondFixture = createCatalogEntry({ ...adultFixture, word: 'segunda fixture', conceptId: 'segunda-fixture', order: 10000, rating: 'familiar', generation: sharedGeneration });
assert.equal(adultFixture.rating, 'adulto', 'el constructor debe conservar una clasificación adulta explícita');
assert.notEqual(adultFixture.generation, sharedGeneration, 'el constructor debe clonar generaciones de entrada');
assert.notEqual(adultFixture.generation, secondFixture.generation, 'dos entradas no deben compartir el mismo arreglo de generaciones');
assert(Object.isFrozen(adultFixture) && Object.isFrozen(adultFixture.generation), 'entrada y generaciones deben ser inmutables');
assert(Object.isFrozen(MEXICO_VIVIDO_WORDS), 'el catálogo publicado debe ser inmutable');

assert(MEXICO_VIVIDO_WORDS.length >= 200, 'el catálogo debe publicar al menos 200 entradas');
const words = MEXICO_VIVIDO_WORDS.map(({ word }) => normalizePreservingEnye(word));
assert.strictEqual(new Set(words).size, words.length, 'las palabras normalizadas deben ser únicas');
const concepts = MEXICO_VIVIDO_WORDS.map(({ conceptId }) => conceptId);
assert(concepts.every(Boolean), 'cada entrada debe declarar un conceptId editorial');
assert.strictEqual(new Set(concepts).size, concepts.length, 'las equivalencias semánticas conocidas no se duplican');
assert(Object.keys(SEMANTIC_CONCEPT_OVERRIDES).length >= 6, 'debe documentar equivalencias semánticas conocidas');
for (const [variant, conceptId] of Object.entries(SEMANTIC_CONCEPT_OVERRIDES)) {
  assert(variant && conceptId, 'cada equivalencia conocida necesita variante y concepto');
}
for (const entry of MEXICO_VIVIDO_WORDS.filter(({ relatedConceptId }) => relatedConceptId)) {
  const target = MEXICO_VIVIDO_WORDS.find(({ conceptId }) => conceptId === entry.relatedConceptId);
  assert(target, `la relación conceptual de ${entry.word} debe apuntar a una entrada existente`);
  assert.equal(target.relatedConceptId, entry.conceptId, `la relación entre ${entry.word} y ${target.word} debe ser recíproca`);
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
    assert(entry.order > 150 && ['mexico-regional', 'oficios-artesanias', 'historias-leyendas', 'mexico-profundo'].includes(entry.pathId), 'el contenido adulto solo puede aparecer en caminos tardíos');
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
for (const entry of MEXICO_VIVIDO_WORDS.filter(({ collectionId }) => collectionId === 'mexico-digital')) {
  assert(!/\btías?\b/i.test(`${entry.word} ${entry.meaning} ${entry.example}`), `evita estereotipos de género en experiencia digital: ${entry.word}`);
}
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
assert(removed.has('bato'), 'bato debe retirarse del catálogo editorial nuevo');
assert(removed.has('bato loco'), 'bato loco debe retirarse del catálogo editorial nuevo');
const ambiguousLegacyTerms = [
  'wey', 'güey', 'carnal', 'ñero', 'morra / morro', 'morro', 'morra', 'morrita',
  'palomilla', 'naco', 'chaleco',
];
for (const word of ambiguousLegacyTerms) {
  const key = normalizePreservingEnye(word);
  assert(removed.has(key), `${word} debe retirarse del catálogo editorial nuevo`);
  const removal = REMOVED_WORDS.find((item) => normalizePreservingEnye(item.word) === key);
  assert(removal?.legacyPresentation, `${word} necesita una pista segura para cuentas antiguas`);
  assert.notEqual(removal.legacyPresentation.placeId, 'cdmx', `${word} no debe entrar al apartado CDMX`);
  assert(
    !/\b(amigo|cuate)\b/i.test(removal.legacyPresentation.meaning),
    `${word} no debe definirse como sinónimo directo de amigo o cuate`,
  );
}

const cdmxEntries = MEXICO_VIVIDO_WORDS.filter(({ placeId }) => placeId === 'cdmx');
assert(cdmxEntries.length >= 10, 'CDMX necesita suficientes niveles culturales propios');
for (const entry of cdmxEntries) {
  assert(entry.meaning && entry.example && entry.icon, `nivel de CDMX incompleto: ${entry.word}`);
  assert([1, 2, 3].includes(entry.difficulty), `dificultad inválida en CDMX: ${entry.word}`);
  assert(!removed.has(normalizePreservingEnye(entry.word)), `una palabra retirada no puede aparecer en CDMX: ${entry.word}`);
}

console.log(`culturalContent: ${MEXICO_VIVIDO_WORDS.length} entradas y ${REMOVED_WORDS.length} retiradas válidas`);
