const assert = require('node:assert/strict');

const {
  CULTURAL_PATHS,
  COLLECTIONS,
  PLACES,
  normalizeCulturalKey,
  resolvePlace,
} = require('./culturalTaxonomy.js');
const { getRegionMeta, getMacroKey, LEGACY_REGIONS } = require('./regionConfig.js');

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

for (const records of [CULTURAL_PATHS, COLLECTIONS, PLACES]) {
  assert.equal(new Set(records.map(({ id }) => id)).size, records.length, 'IDs must be unique');
  assert.equal(new Set(records.map(({ name }) => name)).size, records.length, 'names must be unique');
}

for (const record of [...CULTURAL_PATHS, ...COLLECTIONS]) {
  for (const field of ['id', 'name', 'icon', 'color', 'description']) {
    assert.equal(typeof record[field], 'string', `${record.id}.${field} must be a string`);
    assert.ok(record[field].trim(), `${record.id}.${field} must not be empty`);
  }
}

for (const place of PLACES) {
  assert.ok(Array.isArray(place.aliases) && place.aliases.length > 0, `${place.id}.aliases must not be empty`);
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
assert.notEqual(resolvePlace('cdmx').icon, '🌮');

const legacyGroups = {
  nacional: ['Infantil', 'Juvenil', 'Escuela', 'Callejero', 'Tradicional', 'Familiar', 'Feria', 'Colonial'],
  norte: ['Norte', 'Chihuahua', 'Sinaloa', 'Sonora', 'Baja California', 'Baja California Sur', 'Coahuila', 'Tamaulipas', 'Durango', 'Zacatecas', 'Frontera Norte', 'Sierra Madre'],
  centro: ['Centro', 'Estado de México', 'Morelos', 'Hidalgo', 'Tlaxcala'],
  bajio: ['Bajío', 'Guanajuato', 'Querétaro', 'Aguascalientes', 'San Luis Potosí'],
  occidente: ['Occidente', 'Centro-Occidente'],
  sureste: ['Sureste'],
  sur: ['Sur'],
  pacifico: ['Pacífico', 'Costas'],
};
assert.ok(Array.isArray(LEGACY_REGIONS));
for (const [key, rawRegions] of Object.entries(legacyGroups)) {
  for (const raw of rawRegions) {
    assert.equal(getMacroKey(raw), key, `${raw} must preserve its legacy group`);
    assert.equal(getRegionMeta(raw).key, key);
    assert.equal(resolvePlace(raw).id, 'unclassified', `${raw} must not become an explicit place`);
  }
}

console.log('culturalTaxonomy: all assertions passed');
