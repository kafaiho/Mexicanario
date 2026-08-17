const { PLACES, resolvePlace } = require('./culturalTaxonomy.js');

// Conserva la forma pública anterior, pero usa PLACES como fuente única.
const MACRO_REGIONS = PLACES.map((place) => ({
  key: place.id === 'todo-mexico' ? 'nacional' : place.id,
  id: place.id,
  name: place.name,
  demonym: place.demonym,
  emoji: place.icon,
  color: place.color,
  dark: place.color,
  rawRegions: [place.name, place.id, ...place.aliases],
  kind: place.kind,
}));

const legacy = (key, demonym, emoji, color, rawRegions) => ({
  key, id: `legacy-${key}`, name: demonym, demonym, emoji, color, dark: color,
  rawRegions, kind: 'legacy-region',
});

// Regiones generales históricas de la interfaz. No forman parte de PLACES:
// una etiqueta amplia nunca debe convertirse en un estado o ciudad concreta.
const LEGACY_REGIONS = [
  legacy('norte', 'Norteño', '🏜️', '#6D4C41', ['Norte', 'Chihuahua', 'Sinaloa', 'Sonora', 'Baja California', 'Coahuila', 'Tamaulipas', 'Durango', 'Zacatecas']),
  legacy('centro', 'Del Centro', '🏛️', '#5D4037', ['Centro', 'Estado de México', 'Morelos', 'Hidalgo', 'Tlaxcala']),
  legacy('bajio', 'Del Bajío', '🌾', '#F57F17', ['Bajío', 'Guanajuato', 'Querétaro', 'Aguascalientes', 'San Luis Potosí']),
  legacy('sur', 'Del Sur', '🌿', '#00695C', ['Sur']),
  legacy('pacifico', 'Del Pacífico', '🌊', '#00838F', ['Pacífico', 'Costas']),
];

const META_BY_ID = new Map(MACRO_REGIONS.map((meta) => [meta.id, meta]));
const LEGACY_BY_RAW = new Map();
for (const meta of LEGACY_REGIONS) {
  for (const raw of meta.rawRegions) LEGACY_BY_RAW.set(raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), meta);
}

function legacyMeta(rawRegion) {
  if (typeof rawRegion !== 'string') return undefined;
  return LEGACY_BY_RAW.get(rawRegion.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
}

function getRegionMeta(rawRegion) {
  return legacyMeta(rawRegion) || META_BY_ID.get(resolvePlace(rawRegion).id);
}

function getMacroKey(rawRegion) {
  return getRegionMeta(rawRegion).key;
}

module.exports = { MACRO_REGIONS, LEGACY_REGIONS, getRegionMeta, getMacroKey };
