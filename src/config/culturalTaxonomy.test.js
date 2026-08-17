const assert = require('node:assert/strict');

const {
  CULTURAL_PATHS,
  COLLECTIONS,
  PLACES,
  normalizeCulturalKey,
  resolvePlace,
} = require('./culturalTaxonomy.js');

const expectedPathIds = [
  'patio-recreo', 'casa-abuela', 'calle-barrio', 'mercado-antojitos',
  'feria-verbena', 'musica-une', 'mexico-regional', 'oficios-artesanias',
  'historias-leyendas', 'mexico-profundo',
];
const expectedCollectionIds = [
  'juegos-ninez', 'dulces-antojitos', 'cocina-bebidas', 'dichos-casa',
  'escuela-mexicana', 'vida-barrio', 'tele-cultura-popular', 'musica-mexicana',
  'fiestas-tradiciones', 'naturaleza-mexico', 'pueblos-originarios-lenguas',
  'oficios-artesanias', 'regiones-hablas', 'historia-personajes',
  'lugares-mexico', 'leyendas-relatos', 'ciencia-inventos-deporte',
  'mexico-digital', 'albures-picaresca',
];

assert.deepEqual(CULTURAL_PATHS.map(({ id }) => id), expectedPathIds);
assert.deepEqual(COLLECTIONS.map(({ id }) => id), expectedCollectionIds);

for (const record of [...CULTURAL_PATHS, ...COLLECTIONS]) {
  for (const field of ['id', 'name', 'icon', 'color', 'description']) {
    assert.equal(typeof record[field], 'string', `${record.id}.${field} must be a string`);
    assert.ok(record[field].trim(), `${record.id}.${field} must not be empty`);
  }
}

for (const place of PLACES) {
  assert.ok(Array.isArray(place.aliases), `${place.id}.aliases must be an array`);
  assert.equal(resolvePlace(place.id).id, place.id);
  for (const alias of place.aliases) assert.equal(resolvePlace(alias).id, place.id);
}

assert.equal(normalizeCulturalKey('  MÉXICO  '), 'mexico');
assert.equal(resolvePlace('Huasteca').id, 'huasteca');
assert.notEqual(resolvePlace('Nayarit').id, 'guerrero');
assert.notEqual(resolvePlace('Campeche').demonym, 'Yucateco');
assert.notEqual(resolvePlace('Tabasco').demonym, 'Yucateco');
assert.notEqual(resolvePlace('Quintana Roo').demonym, 'Yucateco');
assert.notEqual(resolvePlace('Monterrey').id, resolvePlace('Nuevo León').id);
assert.notEqual(resolvePlace('Guadalajara').id, resolvePlace('Jalisco').id);
assert.equal(resolvePlace('región imaginaria').id, 'unclassified');

console.log('culturalTaxonomy: all assertions passed');
