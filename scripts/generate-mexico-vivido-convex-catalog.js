const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { MEXICO_VIVIDO_WORDS, REMOVED_WORDS } = require('../shared/mexicoVividoCatalogSource');

const outputPath = path.join(__dirname, '..', 'convex', 'migrations', 'mexicoVividoCatalog.generated.ts');
const payload = { MEXICO_VIVIDO_WORDS, REMOVED_WORDS };
const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
const output = [
  '// GENERATED FILE — do not edit by hand.',
  '// Canonical source: shared/mexicoVividoCatalogSource.js',
  '// Regenerate: node scripts/generate-mexico-vivido-convex-catalog.js',
  `// Source SHA-256: ${hash}`,
  `export const MEXICO_VIVIDO_WORDS = ${JSON.stringify(MEXICO_VIVIDO_WORDS, null, 2)} as const;`,
  `export const REMOVED_WORDS = ${JSON.stringify(REMOVED_WORDS, null, 2)} as const;`,
  '',
].join('\n');

if (process.argv.includes('--check')) {
  const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (existing !== output) {
    console.error('El catálogo Convex está desactualizado. Ejecuta: node scripts/generate-mexico-vivido-convex-catalog.js');
    process.exit(1);
  }
  console.log(`mexicoVividoCatalog generator check: ${MEXICO_VIVIDO_WORDS.length} entradas, sha256 ${hash}`);
} else {
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`Catálogo Convex generado: ${MEXICO_VIVIDO_WORDS.length} entradas, sha256 ${hash}`);
}
