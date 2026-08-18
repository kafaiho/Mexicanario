const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const hookPath = path.join(__dirname, 'useKeyboardLayout.js');
const source = fs.readFileSync(hookPath, 'utf8');

assert.match(source, /import\s*{[^}]*useWindowDimensions[^}]*}\s*from\s*['"]react-native['"]/s);
assert.match(source, /useSafeAreaInsets/);
assert.match(source, /getGameplayResponsiveLayout/);
assert.match(source, /const\s*{\s*width\s*,\s*height\s*}\s*=\s*useWindowDimensions\(\)/);
assert.doesNotMatch(source, /PHONE_(?:WIDTH|HEIGHT)/);
assert.doesNotMatch(source, /Dimensions\.get\s*\(/);

for (const property of [
  'layout',
  'kbKeyW',
  'kbSpecialW',
  'kbKeyH',
  'kbHeight',
  'kbMargin',
  'kbPaddingV',
  'kbRowMarginB',
  'kbFontSize',
  'kbIconSize',
]) {
  assert.match(source, new RegExp(`\\b${property}\\b`), `missing ${property} from hook contract`);
}

console.log('useKeyboardLayout contract tests passed');
