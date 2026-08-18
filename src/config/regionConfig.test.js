const assert = require('node:assert/strict');
const { getPlaceKindLabel, getRegionMeta } = require('./regionConfig.js');

assert.equal(getPlaceKindLabel('city'), 'Ciudad');
assert.equal(getPlaceKindLabel('state'), 'Estado');
assert.equal(getPlaceKindLabel('cultural-region'), 'Región cultural');
assert.equal(getPlaceKindLabel('country'), 'Todo México');
assert.equal(getPlaceKindLabel('unclassified'), 'Por clasificar');
assert.equal(getRegionMeta('Planeta X').id, 'unclassified');

console.log('regionConfig tests passed');
