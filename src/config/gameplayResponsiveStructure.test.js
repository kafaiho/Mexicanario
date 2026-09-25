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
assert.match(source, /paddingBottom:\s*layout\.boardBottomPadding/);
assert.match(source, /useKeyboardLayout\(\{\s*topBarHeight:\s*TOP_BAR_HEIGHT/, 'the board starts under the real top bar');
assert.match(source, /justifyContent:\s*layout\.isLandscape\s*\?\s*'center'\s*:\s*'flex-start'/, 'portrait clue sits at the top');
assert.match(source, /getTileMetrics\(/, 'tiles are sized to fit the real panel width');
assert.doesNotMatch(source, /keyboardContainer:\s*{[^}]*position:\s*['"]absolute['"]/s);
assert.doesNotMatch(source, /Dimensions\.get\s*\(/, 'orientation-critical dimensions must stay live');
assert.doesNotMatch(source, /_STATIC_KB_|TILE_SCALE/);
assert.doesNotMatch(source, /\btop:\s*height\s*\*/, 'styles must not reference removed static dimensions');

console.log('gameplay responsive structure uses safe semantic regions');
