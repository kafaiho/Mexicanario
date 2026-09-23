# CDMX Level Cultural Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Correct the legacy `bato` clue without moving existing progress and enforce that the CDMX section only contains culturally aligned, fully described levels.

**Architecture:** Keep `shared/mexicoVividoCatalogSource.js` as the single editorial source and extend its removal metadata with an optional v1 compatibility presentation. The existing Convex migration will apply that presentation while retiring the entry for v2, preserving the legacy level record and numeric progress. Catalog tests will encode the CDMX and retired-term invariants.

**Tech Stack:** JavaScript catalog source, TypeScript Convex migrations, Node `assert` tests, repository test runner.

---

### Task 1: Encode the cultural regression

**Files:**
- Modify: `src/config/culturalContent.test.js`
- Modify: `convex/migrations/migrateMexicoVivido.test.ts`

**Step 1: Write the failing catalog test**

Assert that `REMOVED_WORDS` contains normalized keys for `bato` and `bato loco`; assert that no retired key exists among active catalog words; and assert every `placeId === "cdmx"` entry has a valid meaning, example, icon, and difficulty from 1 to 3.

**Step 2: Run the focused test to verify it fails**

Run: `node src/config/culturalContent.test.js`

Expected: FAIL because `bato` and `bato loco` are not explicitly listed in `REMOVED_WORDS`.

**Step 3: Write the failing migration test**

Add a removed-word fixture with a v1 compatibility presentation and assert that the migration decision produces a retire operation carrying the corrected meaning, example, region, collection, place, icon, and difficulty metadata.

**Step 4: Run the focused migration test to verify it fails**

Run the repository command that executes `convex/migrations/migrateMexicoVivido.test.ts`.

Expected: FAIL because removal decisions currently contain only the record id.

### Task 2: Add explicit removal and legacy-safe presentation

**Files:**
- Modify: `shared/mexicoVividoCatalogSource.js`
- Modify: `convex/migrations/migrateMexicoVivido.ts`
- Modify: `convex/migrations/mexicoVividoCatalog.generated.ts` (generated)

**Step 1: Add removal metadata**

Add `bato` and `bato loco` to `REMOVED_WORDS`. Give `bato` the v1 compatibility presentation: meaning “Muchacho u hombre, en lenguaje popular”, a natural example, region “Noroeste y occidente”, `collectionId: "regiones-hablas"`, `placeId: "sinaloa"`, a person icon, and difficulty 2. Give `bato loco` an equivalent non-CDMX retirement treatment without presenting it as a synonym for friend.

**Step 2: Apply compatibility metadata in retirement planning**

Extend the removed-word type and retirement decision so a removal can carry a compatibility patch. When applying it, preserve `legacyWord`, use the corrected legacy region/difficulty, and patch the shared meaning/example fields before marking the record retired. Keep the operation idempotent.

**Step 3: Regenerate the Convex catalog**

Run: `node scripts/generate-mexico-vivido-convex-catalog.js`

Expected: generated TypeScript catalog includes both removals and the same source hash reported by `--check`.

**Step 4: Run focused tests**

Run the two focused tests from Task 1.

Expected: PASS.

### Task 3: Verify CDMX grouping and difficulty invariants

**Files:**
- Modify: `convex/collectionGrouping.test.ts`
- Modify: `src/config/culturalContent.test.js`

**Step 1: Write a failing grouping test if coverage is absent**

Create fixtures for a canonical CDMX word, a legacy CDMX alias, and a retired northwestern word. Assert that only the canonical fixture enters the `cdmx` group and that the others remain separate or hidden according to the active ordering version.

**Step 2: Run the focused test and confirm the expected failure**

Run the repository command for `convex/collectionGrouping.test.ts`.

Expected: FAIL only if the current grouping violates the approved rule. If the behavior already passes, keep the regression assertion and do not change production grouping code.

**Step 3: Verify difficulty coverage**

Assert CDMX entries use difficulty 1–3 and that the global order continues through `planDifficultyWaves`, which supplies deterministic variation per user without crossing cultural paths.

**Step 4: Run focused catalog, grouping, ordering, and difficulty tests**

Expected: PASS with no new warnings.

### Task 4: Full verification

**Files:**
- Verify only

**Step 1: Check generated catalog parity**

Run: `node scripts/generate-mexico-vivido-convex-catalog.js --check`

Expected: PASS and report the full entry count plus SHA-256.

**Step 2: Run the full automated suite**

Run: `npm test`

Expected: exit code 0 with zero failed tests.

**Step 3: Review the exact diff**

Run: `git diff -- shared/mexicoVividoCatalogSource.js convex/migrations/migrateMexicoVivido.ts convex/migrations/mexicoVividoCatalog.generated.ts src/config/culturalContent.test.js convex/migrations/migrateMexicoVivido.test.ts convex/collectionGrouping.test.ts`

Expected: only the approved cultural correction, compatibility migration, generated output, and tests are present.

