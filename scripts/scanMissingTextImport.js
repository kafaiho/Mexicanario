const fs = require('fs');
const path = require('path');

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git', 'android', 'ios', '.expo'].includes(entry.name)) {
      results.push(...walk(full));
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const root = path.join(__dirname, '..');
const files = walk(root);

const bad = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  // Check if file uses <Text in JSX
  const usesText = /<Text[\s>\/]/.test(src);
  if (!usesText) continue;

  // Check if Text is imported from react-native
  const rnImport = src.match(/import\s+\{([^}]+)\}\s+from\s+['"]react-native['"]/);
  if (!rnImport) {
    bad.push({ file, reason: 'No react-native import at all' });
    continue;
  }

  const imports = rnImport[1].split(',').map(s => s.trim().replace(/\s+as\s+\w+/, ''));
  if (!imports.includes('Text')) {
    bad.push({ file, reason: `react-native imports: ${imports.join(', ')}` });
  }
}

if (bad.length === 0) {
  console.log('All JSX files with <Text> correctly import Text from react-native.');
} else {
  console.log(`Found ${bad.length} file(s) missing Text import:\n`);
  for (const { file, reason } of bad) {
    const rel = path.relative(root, file);
    console.log(`  ${rel}\n    → ${reason}\n`);
  }
}
