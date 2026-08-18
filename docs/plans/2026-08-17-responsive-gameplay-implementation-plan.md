# Responsive Gameplay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the complete gameplay screen as a colorful, spacious and orientation-aware interface that works from compact phones through landscape tablets without changing game logic.

**Architecture:** Introduce a pure responsive layout model driven by live window dimensions and safe-area insets. Make `useKeyboardLayout` delegate to that model, then reorganize `GameplayScreen` into semantic content and control regions that switch between one-column portrait and two-column landscape layouts. Keep Convex queries, rewards, word validation, pet state and progression untouched.

**Tech Stack:** React Native, Expo 55, React hooks, `react-native-safe-area-context`, Node assertion tests, existing `JuicyButton` and design tokens.

---

### Task 1: Create the responsive gameplay layout model

**Files:**
- Create: `src/config/gameplayResponsiveLayout.js`
- Create: `src/config/gameplayResponsiveLayout.test.js`
- Modify: `scripts/run-tests.js`

**Step 1: Write the failing test**

Cover these fixtures:

```js
const fixtures = [
  { width: 320, height: 568, expectedMode: 'compact' },
  { width: 360, height: 800, expectedMode: 'phone' },
  { width: 390, height: 844, expectedMode: 'phone' },
  { width: 768, height: 1024, expectedMode: 'tablet' },
  { width: 1024, height: 768, expectedMode: 'landscape' },
];
```

For every fixture assert:

- `mode` matches.
- `keyboardWidth <= availableWidth`.
- ten regular keys plus margins fit the first row.
- two special keys plus seven regular keys fit the third row.
- key height is at least 36 dp.
- portrait uses one column; landscape uses two.
- `contentMaxWidth <= 680` in tablet portrait.

Register the test in `scripts/run-tests.js`.

**Step 2: Run the test to verify it fails**

Run:

```bash
node src/config/gameplayResponsiveLayout.test.js
```

Expected: FAIL because `getGameplayResponsiveLayout` does not exist.

**Step 3: Implement the pure model**

Create:

```js
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function getGameplayResponsiveLayout({ width, height, insets = {} }) {
  const safeWidth = Math.max(280, width - (insets.left || 0) - (insets.right || 0));
  const safeHeight = Math.max(420, height - (insets.top || 0) - (insets.bottom || 0));
  const landscape = safeWidth > safeHeight && safeWidth >= 700;
  const tablet = !landscape && safeWidth >= 600;
  const compact = safeWidth < 360 || safeHeight < 650;
  const mode = landscape ? 'landscape' : tablet ? 'tablet' : compact ? 'compact' : 'phone';
  const outerGap = compact ? 8 : tablet ? 24 : 12;
  const contentMaxWidth = tablet ? 680 : safeWidth;
  const controlsWidth = landscape
    ? Math.min(560, Math.floor(safeWidth * 0.52))
    : Math.min(contentMaxWidth, safeWidth - outerGap * 2);
  const keyGap = compact ? 2 : tablet ? 4 : 3;
  const keyboardPadding = compact ? 8 : 12;
  const keyboardInnerWidth = controlsWidth - keyboardPadding * 2;
  const keyWidth = Math.floor((keyboardInnerWidth - keyGap * 18) / 10);
  const specialWidth = Math.floor((keyboardInnerWidth - keyWidth * 7 - keyGap * 16) / 2);

  return {
    mode,
    isLandscape: landscape,
    columns: landscape ? 2 : 1,
    safeWidth,
    safeHeight,
    outerGap,
    contentMaxWidth,
    controlsWidth,
    keyboardPadding,
    keyGap,
    keyWidth,
    specialWidth,
    keyHeight: clamp(compact ? 42 : tablet ? 58 : 50, 36, 64),
    keyboardHeight: compact ? 224 : tablet ? 300 : 260,
    sectionGap: compact ? 8 : tablet ? 20 : 12,
  };
}

module.exports = { getGameplayResponsiveLayout };
```

Tune calculations only as required by the fixtures; do not add device-name branches.

**Step 4: Run the test to verify it passes**

Run:

```bash
node src/config/gameplayResponsiveLayout.test.js
npm test
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/config/gameplayResponsiveLayout.js src/config/gameplayResponsiveLayout.test.js scripts/run-tests.js
git commit -m "test: define responsive gameplay layout model"
```

### Task 2: Make the keyboard react to every window size

**Files:**
- Modify: `src/hooks/useKeyboardLayout.js`
- Create: `src/hooks/useKeyboardLayout.contract.test.js`
- Modify: `scripts/run-tests.js`

**Step 1: Write the failing contract test**

Read the hook source and assert it:

- imports `useWindowDimensions`.
- calls `getGameplayResponsiveLayout`.
- does not cache `PHONE_WIDTH` or `PHONE_HEIGHT` at module load.
- returns `layout`, `kbKeyW`, `kbSpecialW`, `kbKeyH`, `kbHeight`, gaps and font/icon sizes.

**Step 2: Run the test to verify it fails**

Run:

```bash
node src/hooks/useKeyboardLayout.contract.test.js
```

Expected: FAIL on the static `Dimensions.get` constants.

**Step 3: Refactor the hook**

Use:

```js
const { width, height } = useWindowDimensions();
const insets = useSafeAreaInsets();
const layout = useMemo(
  () => getGameplayResponsiveLayout({ width, height, insets }),
  [width, height, insets.top, insets.right, insets.bottom, insets.left],
);
```

Map the pure model to the existing keyboard property names so other consumers do not break. Preserve `portraitHeight` and `portraitKeyH` overrides by clamping them inside available height.

**Step 4: Verify**

```bash
node src/hooks/useKeyboardLayout.contract.test.js
npm test
npm run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/useKeyboardLayout.js src/hooks/useKeyboardLayout.contract.test.js scripts/run-tests.js
git commit -m "refactor: make keyboard layout fully responsive"
```

### Task 3: Recompose GameplayScreen into responsive regions

**Files:**
- Modify: `src/screens/GameplayScreen.jsx`
- Create: `src/config/gameplayResponsiveStructure.test.js`
- Modify: `scripts/run-tests.js`

**Step 1: Write the failing structure test**

Assert the screen:

- consumes `kb.layout` instead of module-level `width` for layout-critical styles.
- contains `gameplayBoard`, `clueRegion`, `answerRegion` and `controlsRegion` styles.
- switches `flexDirection` using `layout.isLandscape`.
- includes bottom safe-area padding.
- removes absolute full-width keyboard placement on phones and tablets.

**Step 2: Run the test to verify it fails**

```bash
node src/config/gameplayResponsiveStructure.test.js
```

Expected: FAIL because the semantic regions do not exist.

**Step 3: Implement the responsive shell**

Within the existing `SafeAreaView`, retain overlays, TopBar and all modals. Replace the current content/absolute-keyboard relationship with:

```jsx
<View style={[responsiveStyles.gameplayBoard, layout.isLandscape && responsiveStyles.gameplayBoardLandscape]}>
  <View style={responsiveStyles.contentRegion}>
    <View style={responsiveStyles.clueRegion}>{/* existing clue and hint */}</View>
    <View style={responsiveStyles.answerRegion}>{/* categories and letter boxes */}</View>
  </View>
  <View style={responsiveStyles.controlsRegion}>
    {/* existing power-up row and keyboard */}
  </View>
</View>
```

Use `maxWidth`, `alignSelf: 'center'`, safe-area padding and `layout.sectionGap`. In portrait, allow content to flex while controls remain at the bottom without covering it. In landscape, keep both regions visible side by side. Do not modify event handlers, queries, rewards or answer logic.

**Step 4: Verify**

```bash
node src/config/gameplayResponsiveStructure.test.js
npm test
npm run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/screens/GameplayScreen.jsx src/config/gameplayResponsiveStructure.test.js scripts/run-tests.js
git commit -m "feat: add responsive gameplay composition"
```

### Task 4: Polish the colorful control system and accessibility

**Files:**
- Modify: `src/screens/GameplayScreen.jsx`
- Create: `src/config/gameplayControlsPresentation.test.js`
- Modify: `scripts/run-tests.js`

**Step 1: Write failing presentation tests**

Assert:

- all four power-ups have `accessibilityRole="button"` and descriptive labels including cost where relevant.
- letter keys expose their letter through `accessibilityLabel`.
- clear and delete expose distinct Spanish action labels.
- the controls region uses the approved green, pink, blue and orange roles.
- pressed/disabled states remain distinguishable without color alone.

**Step 2: Run RED**

```bash
node src/config/gameplayControlsPresentation.test.js
```

Expected: FAIL on missing accessibility metadata.

**Step 3: Implement the visual polish**

- Keep the four approved colors.
- Use one soft shadow recipe across clue card, tray, powers and keys.
- Give the tray warm gray `#EEF1F3`, key faces `#FFFFFF`, key ink `#154B6D` and restrained borders.
- Use symmetric padding based on `layout.outerGap`.
- Keep pills equal width but cap their maximum width on tablets.
- Add `hitSlop` where compact keys cannot reach 44 dp visually.
- Preserve `JuicyButton` press feedback; do not add continuous animation.

**Step 4: Verify GREEN**

```bash
node src/config/gameplayControlsPresentation.test.js
npm test
npm run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/screens/GameplayScreen.jsx src/config/gameplayControlsPresentation.test.js scripts/run-tests.js
git commit -m "style: polish playful gameplay controls"
```

### Task 5: Validate representative devices and integration safety

**Files:**
- Create: `docs/reports/responsive-gameplay-qa.md`
- Modify only if a verified defect is found: responsive files from Tasks 1–4

**Step 1: Run automated verification**

```bash
npm test
npm run typecheck
node scripts/generate-mexico-vivido-convex-catalog.js --check
git diff --check
```

Expected: all feature checks PASS. If `git diff --check` reports pre-existing whitespace in unrelated local files, document it and verify the feature diff separately.

**Step 2: Export Android JavaScript bundle**

```bash
npx expo export --platform android
```

Expected: export succeeds without unresolved modules.

**Step 3: Perform visual QA**

Review at:

- 320 × 568 compact portrait.
- 390 × 844 standard portrait.
- 768 × 1024 tablet portrait.
- 1024 × 768 tablet landscape.

Record whether clue, answer, mascot, powers, Ñ, clear and delete remain visible and do not overlap. Confirm keyboard reacts after orientation change without restarting.

**Step 4: Document limitations**

Write exact tested dimensions, device/emulator source and any limitation of Expo Go. Do not claim native purchase validation from Expo Go.

**Step 5: Commit**

```bash
git add docs/reports/responsive-gameplay-qa.md
git commit -m "docs: record responsive gameplay QA"
```

### Task 6: Review and integrate without losing local work

**Files:**
- Review all files changed by Tasks 1–5.

**Step 1: Compare against the approved design**

Check every acceptance point in `docs/plans/2026-08-17-responsive-gameplay-design.md`.

**Step 2: Request specification review**

Review compact/phone/tablet/landscape behavior, safe areas, keyboard fit, logic preservation and accessibility.

**Step 3: Request code-quality review**

Review render cost, hook ordering, orientation updates, style allocation and compatibility with existing local `GameplayScreen` edits.

**Step 4: Re-run all verification after fixes**

```bash
npm test
npm run typecheck
npx expo export --platform android
git diff --check <base>..HEAD
```

**Step 5: Integrate carefully**

Because the main workspace contains user-owned uncommitted changes, never overwrite or blanket-stash them. Compare the `GameplayScreen` diff, preserve the existing memoized `LetterTile` press handler, and resolve only overlapping responsive regions with explicit review.
