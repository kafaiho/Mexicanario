const { clamp } = require('./gameplayResponsiveLayout');

function getKeyboardLayoutMetrics({ layout, portraitHeight, portraitKeyH } = {}) {
  if (!layout) throw new TypeError('layout is required');

  const kbPaddingH = layout.keyboardHorizontalPadding;
  const kbPaddingV = portraitHeight
    ? layout.mode === 'tablet' || layout.mode === 'landscape' ? 12 : 10
    : layout.keyboardPadding;
  const kbMargin = layout.keyGap / 2;
  const kbRowMarginB = layout.keyGap;
  const availableHeight = layout.controlsAvailableHeight ?? layout.safeHeight;
  const powerUpHeight = availableHeight < 260
    ? 60
    : layout.mode === 'tablet' || layout.mode === 'landscape' ? 76 : 64;
  const minimumKeyboardHeight = kbPaddingV * 2 + 36 * 3 + kbRowMarginB * 3;
  const minimumControlsHeight = powerUpHeight + minimumKeyboardHeight;
  const desiredHeight = portraitHeight
    ?? powerUpHeight + kbPaddingV * 2 + layout.keyHeight * 3 + kbRowMarginB * 3;
  const kbHeight = clamp(
    desiredHeight,
    Math.min(minimumControlsHeight, availableHeight),
    availableHeight,
  );
  const maximumKeyHeight = Math.max(
    0,
    Math.floor((kbHeight - powerUpHeight - kbPaddingV * 2 - kbRowMarginB * 3) / 3),
  );
  const desiredKeyHeight = portraitKeyH ?? layout.keyHeight;
  const kbKeyH = Math.min(desiredKeyHeight, maximumKeyHeight);
  const keyboardHeight = kbPaddingV * 2 + kbKeyH * 3 + kbRowMarginB * 3;
  const tabletScale = layout.mode === 'tablet' || layout.mode === 'landscape';

  return {
    layout,
    kbHeight,
    keyboardHeight,
    powerUpHeight,
    kbKeyH,
    kbKeyW: layout.keyWidth,
    kbSpecialW: layout.specialWidth,
    kbMargin,
    kbPaddingH,
    kbPaddingV,
    kbRowMarginB,
    kbFontSize: tabletScale ? 22 : layout.mode === 'compact' ? 16 : 18,
    kbIconSize: tabletScale ? 28 : layout.mode === 'compact' ? 20 : 22,
  };
}

module.exports = { getKeyboardLayoutMetrics };
