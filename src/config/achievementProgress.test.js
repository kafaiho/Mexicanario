const assert = require('node:assert/strict');
const { sumPlaceProgress } = require('./achievementProgress.js');

const groups = [
  { id: 'monterrey', completed: 2, total: 3 },
  { id: 'nuevo-leon', completed: 4, total: 5 },
  { id: 'sinaloa', completed: 1, total: 2 },
  { id: 'legacy:sinaloa', placeId: 'sinaloa', completed: 3, total: 4 },
  { id: 'jalisco', completed: 9, total: 9 },
];
assert.deepEqual(sumPlaceProgress(groups, ['monterrey', 'nuevo-leon', 'sinaloa']), { completed: 10, total: 14 });
assert.deepEqual(sumPlaceProgress(groups, ['veracruz']), { completed: 0, total: 0 });

console.log('achievementProgress tests passed');
