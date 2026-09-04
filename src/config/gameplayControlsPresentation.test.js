const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../screens/GameplayScreen.jsx'), 'utf8');

for (const label of [
  'Revelar una letra por ${HINT_COST} monedas',
  'Revelar tres letras por ${BORRAR_COST} monedas',
  'Completar palabra por ${VERIFICAR_COST} monedas',
  'Retar a una amistad',
]) {
  assert.ok(source.includes(label), `missing accessible power label: ${label}`);
}

assert.match(source, /accessibilityRole="button"/);
assert.match(source, /accessibilityLabel=\{isSpecial\s*\?\s*key === "CLEAR_ALL"\s*\?\s*"Borrar toda la palabra"\s*:\s*"Borrar una letra"\s*:\s*`Letra \$\{key\}`\}/s);
assert.match(source, /accessibilityState=\{\{ disabled: isDimmed \}\}/);
assert.match(source, /hitSlop=\{compactKeyHitSlop\}/);

for (const color of ['#43A047', '#D81B60', '#1976D2', '#F57C00']) {
  assert.ok(source.includes(color), `missing playful control color ${color}`);
}

assert.match(source, /keyDimmed:[^}]*opacity/s);
assert.match(source, /keyDimmed:[^}]*borderWidth/s);

console.log('gameplay controls are playful and accessible');
