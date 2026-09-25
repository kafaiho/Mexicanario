const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { MEXICO_VIVIDO_WORDS, PATH_SEGMENTS, REMOVED_WORDS } = require('../shared/mexicoVividoCatalogSource');

const outputPath = path.join(__dirname, '..', 'convex', 'migrations', 'mexicoVividoCatalog.generated.ts');
const segmentsPath = path.join(__dirname, '..', 'src', 'config', 'culturalSegments.generated.js');
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

// Tramos del recorrido para la app, sin cargar todo el catálogo en el bundle.
const segmentsOutput = [
  '// GENERATED FILE — do not edit by hand.',
  '// Canonical source: shared/mexicoVividoCatalogSource.js (PATH_SEGMENTS)',
  '// Regenerate: node scripts/generate-mexico-vivido-convex-catalog.js',
  '// [pathId, vuelta, niveles] en el orden editorial del recorrido v2.',
  `module.exports = { CULTURAL_SEGMENT_ROWS: ${JSON.stringify(PATH_SEGMENTS)} };`,
  '',
].join('\n');

const readNormalized = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '');

if (process.argv.includes('--check')) {
  if (readNormalized(outputPath) !== output || readNormalized(segmentsPath) !== segmentsOutput) {
    console.error('El catálogo Convex está desactualizado. Ejecuta: node scripts/generate-mexico-vivido-convex-catalog.js');
    process.exit(1);
  }
  console.log(`mexicoVividoCatalog generator check: ${MEXICO_VIVIDO_WORDS.length} entradas, sha256 ${hash}`);
} else {
  fs.writeFileSync(outputPath, output, 'utf8');
  fs.writeFileSync(segmentsPath, segmentsOutput, 'utf8');
  console.log(`Catálogo Convex generado: ${MEXICO_VIVIDO_WORDS.length} entradas, sha256 ${hash}`);
}
