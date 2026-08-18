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

function presentPlaceGroup(group) {
  const presentation = getPlacePresentation(group.placeId || group.id, group.kind, group.legacyName);
  return {
    ...group,
    ...presentation,
    id: group.id,
    placeId: group.placeId || presentation.id,
    name: group.isLegacyGroup && group.legacyName ? group.legacyName : presentation.name,
    kind: group.kind || presentation.kind,
    kindLabel: getPlaceKindLabel(group.kind || presentation.kind),
    needsReview: Boolean(group.needsReview || presentation.needsReview),
  };
}

function getDisplayedWordIcon(wordPayload, collectionIcon, legacyIcon) {
  return wordPayload?.icon || legacyIcon || collectionIcon || '📚';
}

module.exports = { getCollectionPresentation, getPlacePresentation, presentPlaceGroup, getDisplayedWordIcon };
