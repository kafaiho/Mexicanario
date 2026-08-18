# Difficulty Waves Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add deterministic 60/25/15 difficulty variation to cultural ordering v2 without changing legacy progress.

**Architecture:** Keep ordering v1 byte-for-byte unchanged. For v2, build the editorial sequence first, divide it into bounded windows, classify candidates relative to the expected difficulty, and select them with a seeded deterministic shuffle derived from user and ordering version.

**Tech Stack:** TypeScript, Convex pure ordering helpers, Node/tsx assertion tests.

---

### Task 1: Specify the wave planner with failing tests

**Files:**
- Create: `convex/difficultyWaves.ts`
- Create: `convex/difficultyWaves.test.ts`
- Modify: `scripts/run-tests.js`

Write fixtures covering alternating 6/3/1 and 6/2/2 templates, challenge positions, deterministic seeds, different-user variation, bounded candidate movement, early safety and exhausted buckets. Run the test first and confirm it fails because the planner is missing.

### Task 2: Implement deterministic difficulty waves

**Files:**
- Modify: `convex/difficultyWaves.ts`

Implement pure helpers for expected difficulty, seeded selection, template choice, challenge preference and stable fallback. Every input item must appear exactly once. Run the dedicated test and the full suite.

### Task 3: Integrate only with cultural order v2

**Files:**
- Modify: `convex/levelOrdering.ts`
- Modify: `convex/levelOrdering.test.ts`

Pass the v2 editorial sequence through the wave planner. Keep v1 on the historical algorithm. Add a before/after v1 regression, same-user determinism, different-user variation, first-50 safety and exact twenty-level ratios where fixtures have sufficient candidates.

### Task 4: Expose difficulty role for UI and audit

**Files:**
- Modify: `convex/levels.ts`
- Modify: `src/screens/MapScreen.jsx`

Return a lightweight role (`expected`, `rest`, `surprise`, `challenge`) when available. The map may show a small accessible challenge marker, but must not disclose answers or rearrange v1. Keep visual changes minimal.

### Task 5: Verify and review

Run:

```bash
npm test
npm run typecheck
node scripts/generate-mexico-vivido-convex-catalog.js --check
git diff --check
```

Then perform specification review followed by code-quality review. Do not deploy or migrate production data.

