const { PLACES, normalizeCulturalKey, resolvePlace } = require('./culturalTaxonomy.js');

function darkenHex(hex, factor = 0.72) {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => Math.floor(parseInt(value.slice(offset, offset + 2), 16) * factor));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

const macro = (key, demonym, emoji, color, rawRegions) => ({
  key, demonym, emoji, color, dark: darkenHex(color), rawRegions,
});

// Contrato de presentación histórico: estas doce entradas alimentan las pestañas
// y filtros existentes. PLACES conserva por separado la geografía explícita.
const MACRO_REGIONS = [
  macro('nacional', 'Nacional', '🦅', '#006847', ['Todo México', 'Nacional', 'Infantil', 'Juvenil', 'Escuela', 'Callejero', 'Tradicional', 'Familiar', 'Feria', 'Colonial']),
  macro('cdmx', 'Chilango', '🚇', '#C62828', ['CDMX', 'Ciudad de México', 'Distrito Federal', 'DF']),
  macro('norte', 'Norteño', '🏜️', '#6D4C41', ['Norte', 'Chihuahua', 'Sinaloa', 'Sonora', 'Baja California', 'Baja California Sur', 'Nuevo León', 'Coahuila', 'Tamaulipas', 'Durango', 'Zacatecas', 'Frontera Norte', 'Sierra Madre']),
  macro('jalisco', 'De Occidente', '🎺', '#2E7D32', ['Jalisco', 'Colima', 'Occidente', 'Centro-Occidente']),
  macro('veracruz', 'Veracruzano', '🎺', '#1565C0', ['Veracruz']),
  macro('oaxaca', 'Oaxaqueño', '🍫', '#E65100', ['Oaxaca']),
  macro('centro', 'Del Centro', '🏛️', '#5D4037', ['Centro', 'Estado de México', 'Morelos', 'Hidalgo', 'Puebla', 'Tlaxcala']),
  macro('bajio', 'Del Bajío', '🌾', '#F57F17', ['Bajío', 'Guanajuato', 'Querétaro', 'Aguascalientes', 'San Luis Potosí']),
  macro('sureste', 'Del Sureste', '🌺', '#6A1B9A', ['Yucatán', 'Quintana Roo', 'Campeche', 'Tabasco', 'Sureste']),
  macro('chiapas', 'Chiapaneco', '🦜', '#00695C', ['Chiapas', 'Sur']),
  macro('guerrero', 'Guerrerense', '🎭', '#00838F', ['Guerrero', 'Pacífico', 'Costas']),
  macro('michoacan', 'Michoacano', '🦋', '#6A1B9A', ['Michoacán']),
];

const PLACE_REGIONS = PLACES.map((place) => ({
  key: place.id === 'todo-mexico' ? 'nacional' : place.id,
  id: place.id,
  name: place.name,
  demonym: place.demonym,
  emoji: place.icon,
  color: place.color,
  dark: darkenHex(place.color),
  rawRegions: [place.name, place.id, ...place.aliases],
  kind: place.kind,
}));

const MACRO_BY_RAW = new Map();
for (const meta of MACRO_REGIONS) for (const raw of meta.rawRegions) MACRO_BY_RAW.set(normalizeCulturalKey(raw), meta);
const PLACE_BY_ID = new Map(PLACE_REGIONS.map((meta) => [meta.id, meta]));

function getRegionMeta(rawRegion) {
  return MACRO_BY_RAW.get(normalizeCulturalKey(rawRegion)) || PLACE_BY_ID.get(resolvePlace(rawRegion).id);
}

function getMacroKey(rawRegion) {
  return getRegionMeta(rawRegion).key;
}

function getPlaceKindLabel(kind) {
  return ({
    city: 'Ciudad',
    state: 'Estado',
    'cultural-region': 'Región cultural',
    'legacy-region': 'Región heredada',
    country: 'Todo México',
    unclassified: 'Por clasificar',
  })[kind] || 'Por clasificar';
}

// Nombre conservado para consumidores introducidos durante la migración.
const LEGACY_REGIONS = MACRO_REGIONS;

module.exports = { MACRO_REGIONS, PLACE_REGIONS, LEGACY_REGIONS, getRegionMeta, getMacroKey, getPlaceKindLabel };
