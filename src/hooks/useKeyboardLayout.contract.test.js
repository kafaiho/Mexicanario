const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getGameplayResponsiveLayout } = require('../config/gameplayResponsiveLayout');
const { getKeyboardLayoutMetrics } = require('../config/keyboardLayout');

const hookPath = path.join(__dirname, 'useKeyboardLayout.js');
const source = fs.readFileSync(hookPath, 'utf8');

assert.match(source, /import\s*{[^}]*useWindowDimensions[^}]*}\s*from\s*['"]react-native['"]/s);
assert.match(source, /useSafeAreaInsets/);
assert.match(source, /getGameplayResponsiveLayout/);
assert.match(source, /getKeyboardLayoutMetrics/);
assert.match(source, /const\s*{\s*width\s*,\s*height\s*}\s*=\s*useWindowDimensions\(\)/);
assert.doesNotMatch(source, /PHONE_(?:WIDTH|HEIGHT)/);
assert.doesNotMatch(source, /Dimensions\.get\s*\(/);

const compactLayout = getGameplayResponsiveLayout({
  width: 320,
  height: 568,
  insets: { top: 24, right: 0, bottom: 20, left: 0 },
});
const compact = getKeyboardLayoutMetrics({ layout: compactLayout });
const compactInnerWidth = compactLayout.keyboardWidth - compact.kbPaddingH * 2;

for (const property of [
  'layout', 'kbKeyW', 'kbSpecialW', 'kbKeyH', 'kbHeight', 'keyboardHeight',
  'powerUpHeight', 'kbMargin', 'kbPaddingH', 'kbPaddingV', 'kbRowMarginB',
  'kbFontSize', 'kbIconSize', 'showSpecialLabels', 'showKeyboardHint',
  'keyboardHintHeight', 'specialLabelFontSize',
]) {
  assert.ok(Object.hasOwn(compact, property), `missing ${property} from hook metrics contract`);
}

assert.ok(compact.kbHeight > compact.keyboardHeight, 'Gameplay height includes its power-up row');
assert.ok(compact.kbHeight <= compactLayout.safeHeight, 'compact controls stay inside safe height');
assert.ok(
  compact.kbKeyW * 10 + compact.kbMargin * 20 <= compactInnerWidth,
  'ten-key row fits the consumer padding and per-key margins',
);
assert.ok(
  compact.kbKeyW * 7 + compact.kbSpecialW * 2 + compact.kbMargin * 18 <= compactInnerWidth,
  'mixed row fits the consumer padding and per-key margins',
);
assert.equal(compact.showSpecialLabels, false, 'compact keys use icons without cramped captions');
assert.equal(compact.showKeyboardHint, false, 'compact screens preserve vertical gameplay space');

const landscapeLayout = getGameplayResponsiveLayout({
  width: 1024,
  height: 768,
  insets: { top: 0, right: 20, bottom: 20, left: 20 },
});
const landscape = getKeyboardLayoutMetrics({ layout: landscapeLayout });
assert.ok(landscape.kbKeyW > compact.kbKeyW, 'orientation changes recompute key dimensions');
assert.equal(landscape.showKeyboardHint, false, 'landscape preserves vertical gameplay space');

const phoneLayout = getGameplayResponsiveLayout({ width: 390, height: 844, insets: {} });
const phone = getKeyboardLayoutMetrics({ layout: phoneLayout });
assert.equal(phone.showSpecialLabels, true, 'regular phones can name destructive controls');
assert.equal(phone.showKeyboardHint, true, 'regular phones explain long-press deletion');
assert.ok(phone.keyboardHintHeight > 0, 'visible helper copy reserves its own height');

const overridden = getKeyboardLayoutMetrics({
  layout: compactLayout,
  portraitHeight: 999,
  portraitKeyH: 999,
});
assert.equal(
  overridden.kbHeight,
  compactLayout.controlsAvailableHeight,
  'height override clamps to the board controls area',
);
assert.ok(
  overridden.keyboardHeight + overridden.powerUpHeight <= overridden.kbHeight,
  'clamped key override keeps all control regions inside the container',
);

const shortLandscapeLayout = getGameplayResponsiveLayout({
  width: 640,
  height: 360,
  insets: { top: 0, right: 0, bottom: 24, left: 0 },
});
const shortLandscape = getKeyboardLayoutMetrics({ layout: shortLandscapeLayout });
assert.equal(shortLandscapeLayout.isLandscape, true);
assert.ok(
  shortLandscape.kbHeight <= shortLandscapeLayout.controlsAvailableHeight,
  'short landscape controls fit below the header and safe-area padding',
);

console.log('useKeyboardLayout contract tests passed');
