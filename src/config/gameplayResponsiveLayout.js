const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const safeNumber = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const safeInset = (value, dimension) =>
  Number.isFinite(value) ? clamp(value, 0, dimension) : 0;

function getGameplayResponsiveLayout({ width, height, insets = {} } = {}) {
  const viewportWidth = safeNumber(width, 320);
  const viewportHeight = safeNumber(height, 568);
  const leftInset = safeInset(insets.left, viewportWidth);
  const rightInset = safeInset(insets.right, viewportWidth);
  const topInset = safeInset(insets.top, viewportHeight);
  const bottomInset = safeInset(insets.bottom, viewportHeight);
  const safeWidth = Math.max(0, viewportWidth - leftInset - rightInset);
  const safeHeight = Math.max(0, viewportHeight - topInset - bottomInset);
  const isLandscape = viewportWidth > viewportHeight;

  let mode = "phone";
  if (isLandscape) mode = "landscape";
  else if (safeWidth >= 600) mode = "tablet";
  else if (safeWidth < 360 || safeHeight < 650) mode = "compact";

  const columns = isLandscape ? 2 : 1;
  const outerGap = mode === "compact" ? 8 : mode === "phone" ? 12 : 20;
  const contentMaxWidth = mode === "landscape" ? 960 : mode === "tablet" ? 680 : 520;
  const contentWidth = Math.min(contentMaxWidth, Math.max(0, safeWidth - outerGap * 2));
  const columnGap = mode === "landscape" ? 24 : 0;
  const panelWidth = columns === 2 ? Math.max(0, contentWidth - columnGap) / 2 : contentWidth;

  const keyboardWidth = panelWidth;
  const controlsWidth = panelWidth;
  const keyboardPadding = mode === "compact" ? 4 : mode === "phone" ? 6 : 8;
  const keyboardHorizontalPadding = outerGap;
  const keyboardInnerWidth = Math.max(0, keyboardWidth - keyboardHorizontalPadding * 2);
  const preferredKeyGap = mode === "compact" ? 3 : mode === "phone" ? 4 : 6;
  const keyGap = Math.min(preferredKeyGap, keyboardInnerWidth / 10);
  const tenKeyWidth = (keyboardInnerWidth - keyGap * 10) / 10;
  const keyWidth = Math.max(0, tenKeyWidth);
  const specialWidth = Math.max(
    0,
    (keyboardInnerWidth - keyGap * 9 - keyWidth * 7) / 2,
  );
  const keyHeight = mode === "compact" ? 36 : mode === "phone" ? 44 : 48;
  const keyboardHeight = keyboardPadding * 2 + keyHeight * 3 + keyGap * 2;
  const boardTopPadding = isLandscape
    ? clamp(safeHeight * 0.1, 24, 56)
    : mode === "compact" ? 76 : 96;
  const boardBottomPadding = Math.max(outerGap, bottomInset);
  const controlsAvailableHeight = Math.max(0, safeHeight - boardTopPadding - boardBottomPadding);

  return {
    mode,
    isLandscape,
    viewportWidth,
    viewportHeight,
    columns,
    safeWidth,
    availableWidth: safeWidth,
    outerGap,
    outerPadding: outerGap,
    sectionGap: mode === "compact" ? 8 : mode === "phone" ? 12 : 16,
    contentMaxWidth,
    contentWidth,
    columnGap,
    safeHeight,
    bottomInset,
    boardTopPadding,
    boardBottomPadding,
    controlsAvailableHeight,
    keyboardWidth,
    keyboardHeight,
    keyboardPadding,
    keyboardHorizontalPadding,
    keyboardInnerWidth,
    controlsWidth,
    keyGap,
    keyWidth,
    specialWidth,
    keyHeight,
  };
}

module.exports = { clamp, getGameplayResponsiveLayout };
