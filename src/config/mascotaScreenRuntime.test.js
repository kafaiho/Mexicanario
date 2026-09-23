const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../screens/MascotaScreen.jsx'), 'utf8');

assert.match(
  source,
  /import\s*\{[^}]*STAGE_THRESHOLDS[^}]*VINCULO_MAX[^}]*\}\s*from\s*["']\.\.\/theme\/designTokens["']/s,
  'MascotaScreen must import the evolution constants used by BondProgressBar',
);

assert.match(source, /STAGE_THRESHOLDS\[stage - 1\]/);
assert.match(source, /STAGE_THRESHOLDS\[stage\]\s*\?\?\s*VINCULO_MAX/);

console.log('mascotaScreenRuntime: evolution progress dependencies are imported');
