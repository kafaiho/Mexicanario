const assert = require("node:assert/strict");
const { getGameplayResponsiveLayout } = require("./gameplayResponsiveLayout");

const fixtures = [
  { width: 320, height: 568, expectedMode: "compact", expectedColumns: 1 },
  { width: 360, height: 800, expectedMode: "compact", expectedColumns: 1 },
  { width: 390, height: 844, expectedMode: "phone", expectedColumns: 1 },
  { width: 768, height: 1024, expectedMode: "tablet", expectedColumns: 1 },
  { width: 1024, height: 768, expectedMode: "landscape", expectedColumns: 2 },
];

for (const fixture of fixtures) {
  const layout = getGameplayResponsiveLayout({
    width: fixture.width,
    height: fixture.height,
    insets: { top: 24, right: 8, bottom: 20, left: 8 },
  });
  const availableWidth = fixture.width - 16;

  assert.equal(layout.mode, fixture.expectedMode, `${fixture.width}x${fixture.height}: mode`);
  assert.equal(layout.isLandscape, fixture.width > fixture.height, `${fixture.width}x${fixture.height}: orientation`);
  assert.equal(layout.safeWidth, availableWidth, `${fixture.width}x${fixture.height}: safe width`);
  assert.equal(layout.availableWidth, layout.safeWidth, "availableWidth is the safe-width compatibility alias");
  assert.equal(layout.columns, fixture.expectedColumns, `${fixture.width}x${fixture.height}: columns`);
  assert.ok(layout.keyboardWidth <= availableWidth, `${fixture.width}: keyboard stays inside safe width`);
  assert.ok(layout.controlsWidth <= availableWidth, `${fixture.width}: controls stay inside safe width`);
  assert.ok(
    layout.keyWidth * 10 + layout.keyGap * 10 <= layout.keyboardInnerWidth,
    `${fixture.width}: ten-key row fits`,
  );
  assert.ok(
    layout.keyWidth * 7 + layout.specialWidth * 2 + layout.keyGap * 9 <= layout.keyboardInnerWidth,
    `${fixture.width}: seven keys plus two special keys fit`,
  );
  assert.ok(
    layout.specialWidth >= layout.keyWidth * 1.5,
    `${fixture.width}: destructive controls are easier to target than letter keys`,
  );
  assert.equal(layout.keyboardHorizontalPadding, layout.outerGap, 'keyboard padding follows responsive outer spacing');
  assert.ok(layout.keyHeight >= 36, `${fixture.width}: keys remain tappable`);
  assert.ok(layout.outerGap >= 0 && layout.keyboardPadding >= 0, "published spacing remains non-negative");
  assert.equal(
    layout.keyboardHeight,
    layout.keyboardPadding * 2 + layout.keyHeight * 3 + layout.keyGap * 2,
    `${fixture.width}: keyboard height has one shared formula`,
  );

  if (fixture.expectedMode === "tablet") {
    assert.ok(layout.contentMaxWidth <= 680, "tablet content stays comfortably centered");
  }
}

const sanitized = getGameplayResponsiveLayout({ width: -20, height: NaN, insets: { left: -4, right: 999 } });
assert.ok(Number.isFinite(sanitized.keyboardWidth) && sanitized.keyboardWidth >= 0, "invalid dimensions are safe");

const narrowSafeArea = getGameplayResponsiveLayout({
  width: 320,
  height: 568,
  insets: { left: 64, right: 64, top: 0, bottom: 0 },
});
assert.ok(narrowSafeArea.keyboardWidth <= 192, "large horizontal insets never overflow real safe width");
for (const field of ["contentWidth", "keyboardWidth", "keyboardInnerWidth", "keyWidth", "specialWidth"]) {
  assert.ok(Number.isFinite(narrowSafeArea[field]) && narrowSafeArea[field] >= 0, `${field} remains usable`);
}

const regularHeight = getGameplayResponsiveLayout({ width: 390, height: 700, insets: {} });
const reducedHeight = getGameplayResponsiveLayout({
  width: 390,
  height: 700,
  insets: { top: 140, bottom: 140 },
});
assert.equal(regularHeight.mode, "phone", "full usable height keeps phone mode");
assert.equal(reducedHeight.mode, "compact", "vertical insets can select compact mode by usable height");

const reducedWidth = getGameplayResponsiveLayout({
  width: 390,
  height: 844,
  insets: { left: 32, right: 32 },
});
assert.equal(reducedWidth.safeWidth, 326);
assert.equal(reducedWidth.mode, "compact", "horizontal breakpoints use usable width");
assert.equal(
  getGameplayResponsiveLayout({ width: 360, height: 800, insets: {} }).mode,
  "phone",
  "the 360 safe-width boundary remains phone mode",
);

// ── El tablero empieza justo debajo de la barra superior ─────────────────────
const { getTileMetrics } = require("./gameplayResponsiveLayout");
const iphone = getGameplayResponsiveLayout({
  width: 390, height: 844, insets: { top: 47, bottom: 34 },
  topBarHeight: 88, appliedInsets: { top: 47, bottom: 34 },
});
assert.equal(iphone.boardTopPadding, 88 - 47 + iphone.sectionGap, "iOS: el notch no se suma dos veces arriba");
assert.equal(iphone.boardBottomPadding, iphone.outerGap, "iOS: el indicador de inicio no se suma dos veces abajo");
const android = getGameplayResponsiveLayout({ width: 412, height: 915, insets: {}, topBarHeight: 79 });
assert.equal(android.boardTopPadding, 79 + android.sectionGap, "Android: el tablero arranca bajo la barra");
assert.equal(
  getGameplayResponsiveLayout({ width: 390, height: 844, insets: {} }).boardTopPadding,
  96,
  "sin alto de barra se conserva el relleno histórico",
);
const landscapeWithBar = getGameplayResponsiveLayout({ width: 1024, height: 768, insets: {}, topBarHeight: 80 });
assert.ok(landscapeWithBar.boardTopPadding >= 24 && landscapeWithBar.boardTopPadding <= 56, "horizontal conserva su relleno");

// ── Las casillas de cada fila siempre caben en el ancho real ─────────────────
const tileFixtures = [[320, 568], [360, 740], [390, 844], [412, 915], [448, 998], [768, 1024], [1024, 768], [844, 390]];
for (const [width, height] of tileFixtures) {
  const layout = getGameplayResponsiveLayout({ width, height, insets: {} });
  const base = getTileMetrics({ letters: 3, layout }).boxSize;
  for (let letters = 1; letters <= 14; letters++) {
    for (let segments = 1; segments <= 3 && segments <= letters; segments++) {
      const tile = getTileMetrics({ letters, segments, layout });
      const rowWidth = letters * (tile.boxSize + tile.marginH * 2) + (segments - 1) * (tile.boxSize / 2);
      assert.ok(rowWidth <= layout.controlsWidth, `${width}x${height}: ${letters} letras en ${segments} palabras caben`);
      assert.ok(tile.boxSize <= base, `${width}x${height}: nunca crece más que el tamaño base`);
      assert.ok(tile.boxHeight > tile.boxSize && tile.fontSize >= 11, `${width}x${height}: proporciones legibles`);
    }
  }
}
const roomy = getGameplayResponsiveLayout({ width: 412, height: 915, insets: {} });
const small = getGameplayResponsiveLayout({ width: 320, height: 568, insets: {} });
assert.ok(getTileMetrics({ letters: 5, layout: roomy }).boxSize > getTileMetrics({ letters: 5, layout: small }).boxSize, "los teléfonos amplios usan casillas más grandes");
assert.equal(getTileMetrics({ letters: 5, layout: small }).boxSize, 38, "las palabras cortas conservan su tamaño normal");

console.log("gameplayResponsiveLayout: five responsive fixtures fit safely; board and tiles follow the real screen");
