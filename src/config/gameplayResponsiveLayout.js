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
  const availableWidth = Math.max(0, viewportWidth - leftInset - rightInset);
  const safeHeight = Math.max(0, viewportHeight - topInset - bottomInset);
  const isLandscape = viewportWidth > viewportHeight;

  let mode = "phone";
  if (isLandscape) mode = "landscape";
  else if (viewportWidth >= 600) mode = "tablet";
  else if (viewportWidth < 340 || safeHeight < 650) mode = "compact";

  const columns = isLandscape ? 2 : 1;
  const outerPadding = mode === "compact" ? 8 : mode === "phone" ? 12 : 20;
  const contentMaxWidth = mode === "landscape" ? 960 : mode === "tablet" ? 680 : 520;
  const contentWidth = Math.min(contentMaxWidth, Math.max(0, availableWidth - outerPadding * 2));
  const columnGap = mode === "landscape" ? 24 : 0;
  const panelWidth = columns === 2 ? Math.max(0, contentWidth - columnGap) / 2 : contentWidth;

  const keyboardWidth = panelWidth;
  const controlsWidth = panelWidth;
  const keyboardInnerWidth = keyboardWidth;
  const preferredKeyGap = mode === "compact" ? 3 : mode === "phone" ? 4 : 6;
  const keyGap = Math.min(preferredKeyGap, keyboardInnerWidth / 9);
  const tenKeyWidth = (keyboardInnerWidth - keyGap * 9) / 10;
  const mixedRowKeyWidth = (keyboardInnerWidth - keyGap * 8) / 9.5;
  const keyWidth = Math.max(0, Math.min(tenKeyWidth, mixedRowKeyWidth));
  const specialWidth = keyWidth * 1.25;
  const keyHeight = mode === "compact" ? 36 : mode === "phone" ? 44 : 48;

  return {
    mode,
    columns,
    outerPadding,
    sectionGap: mode === "compact" ? 8 : mode === "phone" ? 12 : 16,
    contentMaxWidth,
    contentWidth,
    columnGap,
    safeHeight,
    keyboardWidth,
    keyboardInnerWidth,
    controlsWidth,
    keyGap,
    keyWidth,
    specialWidth,
    keyHeight,
  };
}

module.exports = { clamp, getGameplayResponsiveLayout };
