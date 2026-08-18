const assert = require('node:assert/strict');
const { getCollectionPresentation, getPlacePresentation, presentPlaceGroup, getDisplayedWordIcon } = require('./collectionPresentation.js');

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
assert.equal(getDisplayedWordIcon({ word: 'Taco', icon: '🫔' }, '📚'), '🫔', 'editorial icon wins');
assert.equal(getDisplayedWordIcon({ word: 'Taco' }, '📚', '🌮'), '🌮', 'legacy word map is the second choice');
assert.equal(getDisplayedWordIcon({ word: 'Desconocidísimo' }, '📚', null), '📚', 'collection icon is the neutral fallback');

console.log('collectionPresentation tests passed');
