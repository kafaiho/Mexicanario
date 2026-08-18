const { spawnSync } = require('node:child_process');

const testModules = [
  'src/utils/textUtils.test.js',
  'src/config/culturalTaxonomy.test.js',
  'src/config/culturalAssets.test.js',
  'src/config/culturalContent.test.js',
  'src/config/regionConfig.test.js',
  'src/config/collectionPresentation.test.js',
  'src/config/achievementProgress.test.js',
  'src/config/achievementCollections.test.js',
];

const typescriptTestModules = [
  'convex/culturalValidation.test.ts',
  'convex/migrations/migrateMexicoVivido.test.ts',
  'convex/migrations/mexicoVividoCatalogParity.test.ts',
  'convex/levelOrdering.test.ts',
  'convex/levelWrites.test.ts',
  'src/config/mexicoZones.test.ts',
  'src/config/culturalPresentation.test.ts',
  'src/config/culturalPathSelection.test.ts',
  'convex/failedWords.test.ts',
  'convex/friendsPresentation.test.ts',
  'convex/collectionGrouping.test.ts',
  'convex/culturalTaxonomyParity.test.ts',
  'convex/collectionLegacyAliases.test.ts',
  'convex/culturalLibrary.test.ts',
];

const catalogCheck = spawnSync(process.execPath, ['scripts/generate-mexico-vivido-convex-catalog.js', '--check'], {
  stdio: 'inherit',
});
if (catalogCheck.status !== 0) process.exit(catalogCheck.status ?? 1);

for (const testModule of testModules) {
  const result = spawnSync(process.execPath, [testModule], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const testModule of typescriptTestModules) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', testModule], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
