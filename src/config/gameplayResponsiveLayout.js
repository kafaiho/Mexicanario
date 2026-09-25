const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const safeNumber = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const safeInset = (value, dimension) =>
  Number.isFinite(value) ? clamp(value, 0, dimension) : 0;

/**
 * @param {object} options
 * @param {number} [options.topBarHeight] Alto real de la barra superior flotante,
 *   medido desde el borde de la pantalla. Sin él se usa el relleno fijo histórico.
 * @param {{top?: number, bottom?: number}} [options.appliedInsets] Márgenes seguros
 *   que el contenedor ya aplica (el SafeAreaView de React Native solo lo hace en iOS),
 *   para no sumarlos dos veces.
 */
function getGameplayResponsiveLayout({ width, height, insets = {}, topBarHeight, appliedInsets = {} } = {}) {
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
  const sectionGap = mode === "compact" ? 8 : mode === "phone" ? 12 : 16;
  const appliedTop = safeInset(appliedInsets.top, viewportHeight);
  const appliedBottom = safeInset(appliedInsets.bottom, viewportHeight);
  const measuredTopBar = Number.isFinite(topBarHeight) && topBarHeight > 0 ? topBarHeight : null;
  // En vertical el tablero empieza justo debajo de la barra (más un respiro), en vez
  // de un relleno fijo que en iPhone se sumaba al margen del notch.
  const boardTopPadding = isLandscape
    ? clamp(safeHeight * 0.1, 24, 56)
    : measuredTopBar !== null
      ? Math.max(0, measuredTopBar - appliedTop) + sectionGap
      : mode === "compact" ? 76 : 96;
  const boardBottomPadding = Math.max(outerGap, bottomInset - appliedBottom);
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
    sectionGap,
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

/**
 * Tamaño de las casillas de una fila de la respuesta. Parte de un tamaño base según
 * el dispositivo y se encoge solo lo necesario para que la fila quepa en el ancho
 * real del panel, así nunca se parte una palabra en dos renglones.
 *
 * @param {object} options
 * @param {number} options.letters  Letras de la fila (sin espacios).
 * @param {number} [options.segments] Palabras en la fila (entre ellas va medio hueco).
 * @param {object} options.layout   Resultado de getGameplayResponsiveLayout.
 */
function getTileMetrics({ letters, segments = 1, layout }) {
  const count = Math.max(1, Math.floor(safeNumber(letters, 1)));
  const gaps = Math.max(0, Math.floor(safeNumber(segments, 1)) - 1);
  const wide = layout.mode === "tablet" || (layout.isLandscape && layout.safeWidth >= 800);
  const roomyPhone = layout.mode === "phone" && layout.safeWidth >= 400 && layout.safeHeight >= 760;
  const scale = wide ? 1.4 : roomyPhone ? 1.1 : 1;
  const baseBox = Math.round(38 * scale);
  const available = Math.max(0, layout.controlsWidth);
  const fits = (box, margin) => count * (box + margin * 2) + gaps * (box / 2) <= available;

  let marginH = Math.max(1, Math.round(2 * scale));
  let boxSize = baseBox;
  if (!fits(boxSize, marginH)) {
    marginH = boxSize >= 30 ? marginH : 1;
    boxSize = Math.floor((available - count * marginH * 2) / (count + gaps / 2));
    if (boxSize < 30) {
      marginH = 1;
      boxSize = Math.floor((available - count * marginH * 2) / (count + gaps / 2));
    }
  }
  boxSize = Math.max(16, Math.min(baseBox, boxSize));
  return {
    boxSize,
    boxHeight: Math.round(boxSize * 42 / 38),
    fontSize: Math.max(11, Math.round(boxSize * 20 / 38)),
    marginH,
  };
}

module.exports = { clamp, getGameplayResponsiveLayout, getTileMetrics };
