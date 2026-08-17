# Mexico Vivido Cultural Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize Mexicanario's words, levels, collections, cultural paths, regional identities, and icons into an accurate, nostalgic, intergenerational experience while preserving user progress.

**Architecture:** Create one shared cultural taxonomy consumed by the client and mirrored by Convex, validate every word against it, and migrate existing records by stable word ID. Replace the current dynamically divided city zones with editorially assigned cultural paths, then update collections and regional views to use the same names, icons, and grouping rules.

**Tech Stack:** React Native 0.83, Expo 55, JavaScript/TypeScript, Convex, Node-based assertion tests, React Native static image assets.

---

### Task 1: Add a repeatable test command

**Files:**
- Modify: `package.json`
- Create: `scripts/run-tests.js`

**Step 1: Write the failing runner smoke test**

Create `scripts/run-tests.js` with a list of test modules that includes a not-yet-created taxonomy test:

```js
const { spawnSync } = require("node:child_process");

const tests = [
  "src/utils/textUtils.test.js",
  "src/config/culturalTaxonomy.test.js",
  "src/config/culturalContent.test.js",
];

for (const test of tests) {
  const result = spawnSync(process.execPath, [test], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
```

**Step 2: Add the command**

Add to `package.json`:

```json
"test": "node scripts/run-tests.js",
"typecheck": "tsc --noEmit"
```

**Step 3: Run the test to verify it fails**

Run: `npm test`  
Expected: FAIL because `src/config/culturalTaxonomy.test.js` does not exist.

**Step 4: Commit**

```bash
git add package.json scripts/run-tests.js
git commit -m "test: add cultural content test runner"
```

### Task 2: Create the shared cultural taxonomy

**Files:**
- Create: `src/config/culturalTaxonomy.js`
- Create: `src/config/culturalTaxonomy.test.js`
- Modify: `src/config/regionConfig.js`

**Step 1: Write failing taxonomy assertions**

Assert unique IDs, names, icons, nonempty region aliases, and the known corrections:

```js
const assert = require("node:assert/strict");
const { CULTURAL_PATHS, COLLECTIONS, PLACES, resolvePlace } = require("./culturalTaxonomy");

assert.equal(new Set(CULTURAL_PATHS.map(x => x.id)).size, CULTURAL_PATHS.length);
assert.equal(new Set(COLLECTIONS.map(x => x.id)).size, COLLECTIONS.length);
assert.equal(resolvePlace("Huasteca").id, "huasteca");
assert.notEqual(resolvePlace("Nayarit").id, "guerrero");
assert.notEqual(resolvePlace("Campeche").demonym, "Yucateco");
assert.ok([...CULTURAL_PATHS, ...COLLECTIONS, ...PLACES].every(x => x.icon));
```

**Step 2: Run the test to verify it fails**

Run: `node src/config/culturalTaxonomy.test.js`  
Expected: FAIL with module-not-found.

**Step 3: Implement the taxonomy**

Export the 10 approved paths, 19 approved collections, and explicit place records. Each place record must contain `id`, `name`, `kind`, `demonym`, `icon`, `color`, and `aliases`. `resolvePlace` must return an explicit `unclassified` record for unknown values instead of silently returning national.

```js
export function resolvePlace(raw) {
  const normalized = normalizeCulturalKey(raw);
  return PLACE_BY_ALIAS.get(normalized) ?? UNCLASSIFIED_PLACE;
}
```

Include separate entries for CDMX, Guadalajara, Jalisco, Monterrey, Nuevo León, Veracruz, Oaxaca, Puebla, Michoacán, Guerrero, Chiapas, Yucatán, Campeche, Quintana Roo, Tabasco, Nayarit, and the multi-state Huasteca.

**Step 4: Make `regionConfig.js` re-export the shared records**

Preserve the public `getRegionMeta` and `getMacroKey` functions temporarily so existing screens do not break.

**Step 5: Run tests**

Run: `node src/config/culturalTaxonomy.test.js`  
Expected: PASS.

**Step 6: Commit**

```bash
git add src/config/culturalTaxonomy.js src/config/culturalTaxonomy.test.js src/config/regionConfig.js
git commit -m "feat: add shared Mexico vivido taxonomy"
```

### Task 3: Build the audited cultural word catalog

**Files:**
- Create: `src/content/mexicoVividoWords.js`
- Create: `src/config/culturalContent.test.js`
- Reference: `convex/seedWords1000.ts`
- Reference: `convex/seedCuratedLevels.ts`
- Reference: `convex/patchCulturalErrors.ts`

**Step 1: Export the existing word inventory for review**

Use a read-only script or existing source parsing to produce a temporary report containing word, meaning, example, region, category, and difficulty. Do not connect to or mutate production during this step.

**Step 2: Write failing content invariants**

```js
const assert = require("node:assert/strict");
const { MEXICO_VIVIDO_WORDS } = require("../content/mexicoVividoWords");

const keys = MEXICO_VIVIDO_WORDS.map(x => x.word.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase());
assert.equal(new Set(keys).size, keys.length, "duplicate words");
assert.ok(MEXICO_VIVIDO_WORDS.every(x => x.meaning && x.example));
assert.ok(MEXICO_VIVIDO_WORDS.every(x => x.collectionId && x.pathId && x.placeId));
assert.ok(MEXICO_VIVIDO_WORDS.filter(x => x.order <= 50).every(x => x.rating === "familiar"));
```

**Step 3: Run the test to verify it fails**

Run: `node src/config/culturalContent.test.js`  
Expected: FAIL because the catalog does not exist.

**Step 4: Curate the catalog in editorial batches**

For every retained or new entry include:

```js
{
  word: "Balero",
  meaning: "Juguete de madera con una copa y una pieza unidas por un cordón",
  example: "En el recreo practicábamos hasta ensartar el balero de un solo intento",
  collectionId: "juegos-ninez",
  pathId: "patio-recreo",
  placeId: "todo-mexico",
  difficulty: 1,
  generation: ["80s", "90s", "2000s"],
  rating: "familiar",
  icon: "🪀",
  order: 1,
}
```

Cover each path with at least 20 entries before publishing it. Put explicit or adult double-entendre content only in `albures-picaresca` with `rating: "adulto"` and late ordering. Record removals and reasons in a `REMOVED_WORDS` export.

**Step 5: Run tests**

Run: `npm test`  
Expected: PASS, with no duplicate, unclassified, empty, or early-adult entries.

**Step 6: Commit**

```bash
git add src/content/mexicoVividoWords.js src/config/culturalContent.test.js
git commit -m "content: curate Mexico vivido word catalog"
```

### Task 4: Mirror taxonomy and validate it in Convex

**Files:**
- Create: `convex/culturalTaxonomy.ts`
- Create: `convex/culturalValidation.ts`
- Modify: `convex/schema.ts`

**Step 1: Write a pure validation function first**

Add `validateCulturalWord` returning errors for unknown collection, path, place, invalid rating, or missing editorial order.

**Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`  
Expected: FAIL until exports and schema fields exist.

**Step 3: Implement typed constants and optional migration fields**

Add compatible optional fields to words: `collectionId`, `pathId`, `placeId`, `difficulty`, `generation`, `rating`, `icon`, `editorialOrder`, and `sourceNote`. Do not remove legacy `category` or `region` yet.

**Step 4: Add an internal audit query**

Return counts and IDs for invalid words; never patch from the query.

**Step 5: Run typecheck**

Run: `npm run typecheck`  
Expected: PASS.

**Step 6: Commit**

```bash
git add convex/culturalTaxonomy.ts convex/culturalValidation.ts convex/schema.ts
git commit -m "feat: validate cultural metadata in Convex"
```

### Task 5: Add an idempotent, progress-safe migration

**Files:**
- Create: `convex/migrations/migrateMexicoVivido.ts`
- Modify: `convex/levelOrdering.ts`
- Test: `src/config/culturalContent.test.js`

**Step 1: Add migration fixture assertions**

Assert that legacy categories map to approved collection IDs, unknown regions remain unclassified, and the same migration input produces the same patch twice.

**Step 2: Run tests to verify failure**

Run: `npm test`  
Expected: FAIL because migration mappings are absent.

**Step 3: Implement migration actions**

The migration must:

- match existing records by normalized word text;
- patch the existing word document rather than delete/reinsert it;
- preserve `_id` and therefore collected-card and progress references;
- assign new editorial fields and keep legacy fields during rollout;
- mark removals as `isRetired: true` instead of deleting immediately;
- return `{ patched, inserted, retired, unchanged, unclassified, conflicts }`;
- accept a dry-run flag and be idempotent.

**Step 4: Order levels by `editorialOrder`**

Update `getOrderedLevels` to prefer audited order while retaining the old deterministic fallback for unmigrated data.

**Step 5: Run tests and typecheck**

Run: `npm test`  
Expected: PASS.  
Run: `npm run typecheck`  
Expected: PASS.

**Step 6: Commit**

```bash
git add convex/migrations/migrateMexicoVivido.ts convex/levelOrdering.ts src/config/culturalContent.test.js
git commit -m "feat: migrate cultural content without losing progress"
```

### Task 6: Replace city zones with cultural paths

**Files:**
- Modify: `src/config/mexicoZones.js`
- Modify: `src/screens/GameplayScreen.jsx`
- Test: `src/config/culturalTaxonomy.test.js`

**Step 1: Add path-boundary tests**

Test that levels resolve by audited `pathId` or editorial range, all published paths contain content, the first and last level resolve, and transitions return the correct next path.

**Step 2: Run the test to verify it fails**

Run: `node src/config/culturalTaxonomy.test.js`  
Expected: FAIL while the old 12 equal-size city zones remain.

**Step 3: Replace dynamic equal division**

Keep compatibility exports `getZone`, `getNextZone`, and `isZoneStart`, but source their names, colors, icons, and boundaries from cultural paths and audited content counts. Rename user-facing copy from “zona” or city road where appropriate to “camino”.

**Step 4: Update celebrations**

Remove universalizing phrases such as city-specific jokes shown for unrelated words. Choose celebration text by `pathId` and `placeId`, with a neutral Mexican fallback.

**Step 5: Run tests**

Run: `npm test`  
Expected: PASS.

**Step 6: Commit**

```bash
git add src/config/mexicoZones.js src/screens/GameplayScreen.jsx src/config/culturalTaxonomy.test.js
git commit -m "feat: turn level map into cultural paths"
```

### Task 7: Update collections and regional grouping

**Files:**
- Modify: `convex/collectionsQuery.ts`
- Modify: `src/screens/ColeccionScreen.tsx`
- Modify: `src/config/regionConfig.js`

**Step 1: Add grouping tests**

Create pure grouping helpers and assert that Huasteca, Nayarit, Campeche, Quintana Roo, Tabasco, Monterrey, and Guadalajara resolve independently as designed.

**Step 2: Run tests to verify failure**

Run: `npm test`  
Expected: FAIL against the legacy macro-region table.

**Step 3: Group by canonical IDs**

Update collection queries to use `collectionId` and `placeId`, falling back to legacy canonicalization only for unmigrated records. Return `icon`, `description`, `kind`, and display name from the taxonomy.

**Step 4: Update the screen**

Render the new collection names, descriptions, unlock rules, direct icons, and place kind labels (“Ciudad”, “Estado”, “Región cultural”, “Todo México”). Unknown content must show a development-only review badge rather than appearing as national.

**Step 5: Run tests and typecheck**

Run: `npm test`  
Expected: PASS.  
Run: `npm run typecheck`  
Expected: PASS.

**Step 6: Commit**

```bash
git add convex/collectionsQuery.ts src/screens/ColeccionScreen.tsx src/config/regionConfig.js
git commit -m "feat: align collections and places with cultural taxonomy"
```

### Task 8: Replace mismatched icons and add coverage checks

**Files:**
- Create: `assets/images/collections/` approved collection assets
- Create: `assets/images/paths/` approved path assets
- Create: `assets/images/places/` priority place assets
- Modify: `src/screens/ColeccionScreen.tsx`
- Modify: `src/config/culturalTaxonomy.js`
- Test: `src/config/culturalTaxonomy.test.js`

**Step 1: Inventory current images**

List every collection/path/place and its current asset, flagging missing files and semantic mismatches. Do not overwrite unrelated user assets.

**Step 2: Add asset coverage assertions**

Assert every published path and collection has a resolvable static asset and a fallback emoji.

**Step 3: Generate or create the approved icon set**

Use the `imagegen` skill for new bitmap assets. Maintain a transparent-background, bold flat-illustration system influenced by papel amate and Mexican sign painting. Avoid text, flags as decoration, generic sombreros, and city/food mismatches.

**Step 4: Wire explicit static imports**

React Native requires statically analyzable `require()` calls; map every taxonomy ID explicitly instead of constructing paths dynamically.

**Step 5: Run tests and inspect images**

Run: `npm test`  
Expected: PASS with 100% published asset coverage.  
Open the collection and map screens at narrow and standard phone widths; expected: no clipping, pixelation, or misleading icon.

**Step 6: Commit**

```bash
git add assets/images/collections assets/images/paths assets/images/places src/screens/ColeccionScreen.tsx src/config/culturalTaxonomy.js src/config/culturalTaxonomy.test.js
git commit -m "feat: add culturally matched icon system"
```

### Task 9: Dry-run and apply the content migration safely

**Files:**
- Modify: `convex/migrations/migrateMexicoVivido.ts`
- Create: `docs/reports/2026-08-17-cultural-content-audit.md`

**Step 1: Run all local verification**

Run: `npm test`  
Expected: PASS.  
Run: `npm run typecheck`  
Expected: PASS.

**Step 2: Run migration in dry-run mode against development**

Run the Convex development mutation with `dryRun: true`.  
Expected: zero conflicts, zero unintended unclassified entries, stable IDs for retained words.

**Step 3: Review the report manually**

Record totals and explicit tables for added, corrected, moved, retired, and unresolved words. Stop if any collected word would lose its ID.

**Step 4: Apply to development twice**

First run expected: planned patch/insert/retire counts.  
Second run expected: `patched: 0`, `inserted: 0`, `retired: 0`, with all retained content unchanged.

**Step 5: Commit the audit report**

```bash
git add docs/reports/2026-08-17-cultural-content-audit.md convex/migrations/migrateMexicoVivido.ts
git commit -m "docs: record Mexico vivido content migration audit"
```

Production migration requires a separate explicit user approval after development verification.

### Task 10: End-to-end and visual verification

**Files:**
- Modify only files needed to fix verified regressions
- Update: `docs/reports/2026-08-17-cultural-content-audit.md`

**Step 1: Run automated checks**

Run: `npm test`  
Expected: PASS.  
Run: `npm run typecheck`  
Expected: PASS.  
Run: `npx expo export --platform web`  
Expected: successful bundle with no missing assets.

**Step 2: Verify new-user flow**

Confirm the first 50 levels are family-friendly, recognizable, progressively harder, and distributed across nostalgia rather than only slang and food.

**Step 3: Verify returning-user flow**

Confirm current level, completed words, collection counts, rewards, and collected cards remain intact after migration.

**Step 4: Verify cultural surfaces**

Inspect map, gameplay banner, collection cards, region/place tabs, word detail, locked state, and path transition modal. Confirm each icon matches its label and every regional word shows its precise provenance.

**Step 5: Verify representative places**

Sample at least CDMX, Guadalajara/Jalisco, Monterrey/Nuevo León, Veracruz, Oaxaca, Puebla, Michoacán, Guerrero, Chiapas, Yucatán, Campeche, Quintana Roo, Tabasco, Nayarit, and Huasteca.

**Step 6: Request code review**

Use `requesting-code-review` and resolve only evidence-backed findings.

**Step 7: Final verification and commit**

Use `verification-before-completion`, rerun every relevant command, attach results to the audit report, then commit any final fixes.

