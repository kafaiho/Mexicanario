const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../screens/GameplayScreen.jsx'), 'utf8');
const juicySource = fs.readFileSync(path.join(__dirname, '../components/JuicyButton.jsx'), 'utf8');
const petSource = fs.readFileSync(path.join(__dirname, '../components/PetCompanion/DraggablePet.jsx'), 'utf8');
const petCompanionSource = fs.readFileSync(path.join(__dirname, '../components/PetCompanion/index.jsx'), 'utf8');
const petSpriteSource = fs.readFileSync(path.join(__dirname, '../components/PetCompanion/PetSprite.jsx'), 'utf8');

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
for (const prop of ['accessibilityRole', 'accessibilityLabel', 'accessibilityState', 'hitSlop']) {
  assert.match(juicySource, new RegExp(`\\{\\.\\.\\.pressableProps\\}|${prop}=\\{${prop}\\}`), `JuicyButton must forward ${prop}`);
}

for (const color of ['#43A047', '#D81B60', '#1976D2', '#F57C00']) {
  assert.ok(source.includes(color), `missing playful control color ${color}`);
}

assert.match(source, /keyDimmed:[^}]*opacity/s);
assert.match(source, /keyDimmed:[^}]*borderWidth/s);
for (const token of ['#EEF1F3', '#FFFFFF', '#154B6D']) {
  assert.ok(source.includes(token), `missing approved surface token ${token}`);
}
assert.match(source, /maxWidth:\s*layout\.isLandscape\s*\?\s*160\s*:\s*layout\.mode === 'tablet'\s*\?\s*140/);
assert.match(source, /AccessibilityInfo/);
assert.match(juicySource, /reduceMotion\s*=\s*false/);
assert.doesNotMatch(juicySource, /AccessibilityInfo/, 'each key must not create its own native motion listener');
assert.match(source, /reduceMotion=\{reduceMotionEnabled\}/);
assert.match(source, /import\s*\{\s*Ionicons\s*\}\s*from\s*["']@expo\/vector-icons["']/);
assert.ok(source.includes('Mantén borrar para borrar rápido'), 'missing long-press keyboard guidance');
assert.match(source, /kb\.showKeyboardHint/);
assert.match(source, /kb\.showSpecialLabels/);
assert.match(source, /name="backspace-outline"/);
assert.match(source, /name="trash-outline"/);
assert.ok(source.includes('BORRAR') && source.includes('LIMPIAR'), 'special keys need clear captions when space allows');
assert.ok(source.includes('#16A6B6'), 'backspace uses the approved turquoise action color');
assert.ok(source.includes('#E85D4A'), 'clear-all uses the approved coral destructive color');
assert.match(source, /styles\.keyboardAccent/);
assert.match(source, /pointerEvents="none"/);
assert.match(source, /<DraggablePet[\s\S]*?reduceMotion=\{reduceMotionEnabled\}/);
assert.match(petSource, /if \(reduceMotion\)[\s\S]*?floatAnim\.setValue\(0\)/);
assert.match(petSource, /reduceMotionRef\.current\s*=\s*reduceMotion/);
assert.match(petSource, /if \(!reduceMotionRef\.current\)[\s\S]*?Animated\.sequence/);
assert.doesNotMatch(petSource, /\[currentWord, petType, reduceMotion\]/, 'motion changes must not cancel the pending word bubble');
assert.match(petSource, /reduceMotion=\{reduceMotion\}/);
assert.match(petCompanionSource, /<PetSprite[\s\S]*?reduceMotion=\{reduceMotion\}/);
assert.match(petSpriteSource, /if \(reduceMotion\)[\s\S]*?cancelAnimation\(breathScale\)/);
assert.match(petSpriteSource, /if \(reduceMotion\) \{[\s\S]*?return undefined;[\s\S]*?reaction === 'correct'/);
assert.match(petCompanionSource, /setParticlesVisible\(false\)/);
for (const animatedValue of ['celebrateY', 'squashX', 'squashY', 'sadY', 'sadScaleV']) {
  assert.match(petSpriteSource, new RegExp(`cancelAnimation\\(${animatedValue}\\)`), `reduce motion must cancel ${animatedValue}`);
}

console.log('gameplay controls are playful and accessible');
