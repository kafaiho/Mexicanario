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

const META_BY_ID = new Map(MACRO_REGIONS.map((meta) => [meta.id, meta]));

function getRegionMeta(rawRegion) {
  return META_BY_ID.get(resolvePlace(rawRegion).id);
}

function getMacroKey(rawRegion) {
  return getRegionMeta(rawRegion).key;
}

module.exports = { MACRO_REGIONS, getRegionMeta, getMacroKey };
