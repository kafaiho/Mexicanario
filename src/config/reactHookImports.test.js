const assert = require('node:assert/strict');
const fs = require('node:fs');

const screens = [
  'src/screens/MainMenuScreen.jsx',
  'src/screens/TaqueroRushScreen.jsx',
];

for (const screen of screens) {
  const source = fs.readFileSync(screen, 'utf8');
  const reactImport = source.match(/import React,\s*\{([^}]*)\}\s*from ["']react["']/s);
  assert.ok(reactImport, `${screen} debe declarar sus hooks de React`);

  if (/\buseCallback\s*\(/.test(source)) {
    const hooks = reactImport[1].split(',').map((hook) => hook.trim());
    assert.ok(hooks.includes('useCallback'), `${screen} usa useCallback pero no lo importa`);
  }
}

const mainMenuSource = fs.readFileSync('src/screens/MainMenuScreen.jsx', 'utf8');
const loadingReturn = mainMenuSource.indexOf('if (!levelInfo && userId)');
const conditionalRenderHook = mainMenuSource.indexOf('const renderGroup = useCallback');
assert.ok(
  conditionalRenderHook === -1 || conditionalRenderHook < loadingReturn,
  'MainMenuScreen no debe declarar useCallback después de su retorno de carga condicional',
);

console.log('reactHookImports: useCallback está importado donde se utiliza');
