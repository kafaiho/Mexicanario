const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenPath = path.join(__dirname, '../screens/GameplayScreen.jsx');
const source = fs.readFileSync(screenPath, 'utf8');

for (const region of ['gameplayBoard', 'clueRegion', 'answerRegion', 'controlsRegion']) {
  assert.match(source, new RegExp(`\\b${region}\\b`), `missing responsive region: ${region}`);
}

assert.match(source, /kb\.layout/);
assert.match(source, /layout\.isLandscape/);
assert.match(source, /flexDirection:\s*layout\.isLandscape\s*\?\s*['"]row['"]\s*:\s*['"]column['"]/);
assert.match(source, /paddingBottom:\s*Math\.max\([^)]*bottom/);
assert.doesNotMatch(source, /keyboardContainer:\s*{[^}]*position:\s*['"]absolute['"]/s);

console.log('gameplay responsive structure uses safe semantic regions');
