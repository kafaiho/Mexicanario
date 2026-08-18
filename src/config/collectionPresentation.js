const { COLLECTIONS, PLACES } = require('./culturalTaxonomy.js');
const { getPlaceKindLabel } = require('./regionConfig.js');

const COLLECTION_BY_ID = new Map(COLLECTIONS.map((item) => [item.id, item]));
const PLACE_BY_ID = new Map(PLACES.map((item) => [item.id, item]));
const UNCLASSIFIED_COLLECTION = Object.freeze({
  id: 'unclassified', name: 'Por clasificar', icon: '📚', color: '#757575',
  description: 'Contenido pendiente de revisión editorial.', needsReview: true,
});

function getCollectionPresentation(id) {
  return COLLECTION_BY_ID.get(id) || UNCLASSIFIED_COLLECTION;
}

function getPlacePresentation(id, kind, legacyName) {
  const place = PLACE_BY_ID.get(id);
  if (place) return { ...place, kindLabel: getPlaceKindLabel(kind || place.kind) };
  if (kind === 'legacy-region' && legacyName) {
    return { id, name: legacyName, icon: '📍', color: '#757575', kind, kindLabel: getPlaceKindLabel(kind) };
  }
  return { id: 'unclassified', name: 'Por clasificar', icon: '📍', color: '#757575', kind: 'unclassified', kindLabel: getPlaceKindLabel('unclassified'), needsReview: true };
}

module.exports = { getCollectionPresentation, getPlacePresentation };
