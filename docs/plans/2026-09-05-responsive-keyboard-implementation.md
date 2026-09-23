# Responsive Mexicanario Keyboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the approved keyboard concept into a safe responsive React Native control without changing the established letter, hint, or deletion behavior.

**Architecture:** Extend the existing pure layout model with third-row and presentation metrics, then render those metrics in `GameplayScreen`. Keep keyboard behavior in the existing pure helper so visual work cannot regress input logic.

**Tech Stack:** React Native, Expo, React hooks, Node assert tests, `@expo/vector-icons`.

---

### Task 1: Responsive keyboard metrics

**Files:**
- Modify: `src/config/gameplayResponsiveLayout.js`
- Modify: `src/config/keyboardLayout.js`
- Test: `src/config/gameplayResponsiveLayout.test.js`

1. Add failing assertions for third-row fit, larger special controls, helper visibility, and non-negative height.
2. Run the focused layout test and confirm the new assertions fail.
3. Calculate special-key width from the remaining third-row space and publish compact/landscape presentation flags.
4. Run the focused test and confirm it passes.

### Task 2: Approved visual presentation

**Files:**
- Modify: `src/screens/GameplayScreen.jsx`
- Test: `src/config/gameplayControlsPresentation.test.js`

1. Add failing source-contract assertions for vector icons, adaptive labels, helper copy, semantic colors, and decorative accent accessibility.
2. Run the focused presentation test and confirm failure.
3. Implement the panel accent, helper text, vector special-key icons, adaptive captions, and responsive styles.
4. Run the focused presentation test and confirm it passes.

### Task 3: Regression and package verification

**Files:**
- Verify: `src/utils/gameplayKeyboard.test.js`
- Verify: `scripts/run-tests.js`

1. Run the keyboard behavior test.
2. Run `npm test`.
3. Run `npm run typecheck`.
4. Export Android to a temporary directory with `npx expo export --platform android`.
5. Inspect the final diff for conflicts, formatting errors, and unrelated staged files.
