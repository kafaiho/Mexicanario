const assert = require("node:assert/strict");
const { getGameplayResponsiveLayout } = require("./gameplayResponsiveLayout");

const fixtures = [
  { width: 320, height: 568, expectedMode: "compact", expectedColumns: 1 },
  { width: 360, height: 800, expectedMode: "phone", expectedColumns: 1 },
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
  assert.equal(layout.columns, fixture.expectedColumns, `${fixture.width}x${fixture.height}: columns`);
  assert.ok(layout.keyboardWidth <= availableWidth, `${fixture.width}: keyboard stays inside safe width`);
  assert.ok(layout.controlsWidth <= availableWidth, `${fixture.width}: controls stay inside safe width`);
  assert.ok(
    layout.keyWidth * 10 + layout.keyGap * 9 <= layout.keyboardInnerWidth,
    `${fixture.width}: ten-key row fits`,
  );
  assert.ok(
    layout.keyWidth * 7 + layout.specialWidth * 2 + layout.keyGap * 8 <= layout.keyboardInnerWidth,
    `${fixture.width}: seven keys plus two special keys fit`,
  );
  assert.ok(layout.keyHeight >= 36, `${fixture.width}: keys remain tappable`);

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

console.log("gameplayResponsiveLayout: five responsive fixtures fit safely");
