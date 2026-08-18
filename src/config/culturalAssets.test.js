const assert = require('node:assert/strict');
const { CULTURAL_PATHS, COLLECTIONS, PLACES } = require('./culturalTaxonomy.js');
const {
  CULTURAL_PATH_ASSETS,
  COLLECTION_ASSETS,
  getCulturalAsset,
} = require('./culturalAssets.js');

function assertAtlasCoverage(records, mapping, expected) {
  assert.deepEqual(Object.keys(mapping).sort(), records.map(({ id }) => id).sort(), 'asset IDs must exactly match taxonomy IDs');
  const coordinates = new Set();
  for (const record of records) {
    assert.ok(record.icon, `${record.id} needs an emoji fallback`);
    const asset = mapping[record.id];
    assert.ok(asset?.source, `${record.id} needs a static atlas source`);
    assert.equal(asset.rows, expected.rows);
    assert.equal(asset.cols, expected.cols);
    assert.equal(asset.atlasAspect, expected.atlasAspect);
    assert.equal(asset.cellAspect, expected.cellAspect);
    assert.ok(asset.row >= 0 && asset.row < asset.rows, `${record.id} row out of bounds`);
    assert.ok(asset.col >= 0 && asset.col < asset.cols, `${record.id} column out of bounds`);
    const coordinate = `${asset.row}:${asset.col}`;
    assert.ok(!coordinates.has(coordinate), `${record.id} duplicates atlas cell ${coordinate}`);
    coordinates.add(coordinate);
    assert.strictEqual(getCulturalAsset(expected.kind, record.id), asset);
  }
}

assertAtlasCoverage(CULTURAL_PATHS, CULTURAL_PATH_ASSETS, {
  kind: 'path', rows: 2, cols: 5, atlasAspect: 1.5, cellAspect: 0.6,
});
assertAtlasCoverage(COLLECTIONS, COLLECTION_ASSETS, {
  kind: 'collection', rows: 4, cols: 5, atlasAspect: 1, cellAspect: 0.8,
});

assert.equal(getCulturalAsset('path', 'unknown'), null);
assert.equal(getCulturalAsset('collection', 'unknown'), null);
assert.equal(getCulturalAsset('place', 'cdmx'), null);
assert.equal(getCulturalAsset('unknown', 'patio-recreo'), null);
assert.ok(PLACES.every(({ icon }) => icon), 'every place needs an emoji fallback');
assert.ok(PLACES.every(({ id }) => getCulturalAsset('place', id) === null), 'places intentionally have no bitmap assets');

console.log('cultural assets cover every published path and collection');
