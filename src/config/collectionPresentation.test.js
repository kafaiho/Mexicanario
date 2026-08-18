const assert = require('node:assert/strict');
const { getCollectionPresentation, getPlacePresentation, presentPlaceGroup } = require('./collectionPresentation.js');

assert.equal(getCollectionPresentation('juegos-ninez').name, 'Juegos de la Niñez');
assert.equal(getCollectionPresentation('juegos-ninez').icon, '🪀');
assert.equal(getCollectionPresentation('desconocida').name, 'Por clasificar');
assert.equal(getPlacePresentation('monterrey', 'city').kindLabel, 'Ciudad');
assert.equal(getPlacePresentation('huasteca', 'cultural-region').kindLabel, 'Región cultural');
assert.equal(getPlacePresentation('unclassified', 'unclassified').kindLabel, 'Por clasificar');
assert.equal(getPlacePresentation('legacy:jalisco', 'legacy-region', 'Jalisco').kindLabel, 'Región heredada');
assert.deepEqual(
  Object.fromEntries(['name', 'icon', 'kindLabel', 'isLegacyGroup'].map((key) => [key, presentPlaceGroup({ id: 'legacy:jalisco', placeId: 'jalisco', kind: 'legacy-region', legacyName: 'Jalisco', isLegacyGroup: true })[key]])),
  { name: 'Jalisco', icon: '🎺', kindLabel: 'Región heredada', isLegacyGroup: true },
);
assert.equal(presentPlaceGroup({ id: 'sinaloa', placeId: 'sinaloa', kind: 'state', needsReview: false }).needsReview, false);

console.log('collectionPresentation tests passed');
