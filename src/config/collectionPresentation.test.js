const assert = require('node:assert/strict');
const { getCollectionPresentation, getPlacePresentation } = require('./collectionPresentation.js');

assert.equal(getCollectionPresentation('juegos-ninez').name, 'Juegos de la Niñez');
assert.equal(getCollectionPresentation('juegos-ninez').icon, '🪀');
assert.equal(getCollectionPresentation('desconocida').name, 'Por clasificar');
assert.equal(getPlacePresentation('monterrey', 'city').kindLabel, 'Ciudad');
assert.equal(getPlacePresentation('huasteca', 'cultural-region').kindLabel, 'Región cultural');
assert.equal(getPlacePresentation('unclassified', 'unclassified').kindLabel, 'Por clasificar');

console.log('collectionPresentation tests passed');
