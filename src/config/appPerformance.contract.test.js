const assert = require('node:assert/strict');
const fs = require('node:fs');

const appSource = fs.readFileSync('App.jsx', 'utf8');
const wheelSource = fs.readFileSync('src/components/WheelModal.jsx', 'utf8');
const soundSource = fs.readFileSync('src/utils/soundManager.js', 'utf8');
const topBarSource = fs.readFileSync('src/components/TopBar.jsx', 'utf8');
const friendsSource = fs.readFileSync('convex/friends.ts', 'utf8');
const gameplaySource = fs.readFileSync('src/screens/GameplayScreen.jsx', 'utf8');
const mainMenuSource = fs.readFileSync('src/screens/MainMenuScreen.jsx', 'utf8');
const usersSource = fs.readFileSync('convex/users.ts', 'utf8');
const mascotaSource = fs.readFileSync('src/screens/MascotaScreen.jsx', 'utf8');
const floatingMascotSource = fs.readFileSync('src/components/PetCompanion/FloatingMascot.jsx', 'utf8');
const shopContextSource = fs.readFileSync('src/context/ShopContext.jsx', 'utf8');

assert.doesNotMatch(
  appSource,
  /autoFixDatabase/,
  'App no debe ejecutar reparaciones de base de datos durante cada arranque',
);

const preloadBody = soundSource.match(/export async function preloadSounds\(\)\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
assert.ok(preloadBody, 'soundManager debe exponer la precarga inicial');
assert.doesNotMatch(
  preloadBody,
  /Object\.entries\((?:SFX_FILES|PET_SFX_FILES|BGM_FILES)\)/,
  'La precarga inicial no debe recorrer todo el catálogo de audio',
);
assert.match(soundSource, /async function ensureSoundLoaded\(/);
assert.match(soundSource, /async function ensureBgmLoaded\(/);
assert.match(soundSource, /const sound = await ensureSoundLoaded\(name\)/);
assert.match(soundSource, /const nextSound = await ensureBgmLoaded\(trackKey\)/);

assert.match(friendsSource, /export const getTopBarSocialSummary = query\(/);
assert.match(topBarSource, /api\.friends\.getTopBarSocialSummary/);
assert.doesNotMatch(topBarSource, /api\.friends\.getPendingRequests/);
assert.doesNotMatch(topBarSource, /api\.friends\.getMyPendingChallenges/);
assert.doesNotMatch(topBarSource, /api\.friends\.getUnreadFriendNotifications/);

assert.doesNotMatch(gameplaySource, /api\.levels\.getAllLevels/);
assert.doesNotMatch(mainMenuSource, /api\.levels\.getAllLevels/);
// Una sola tienda para toda la app, montada solo mientras está abierta.
assert.match(
  shopContextSource,
  /\{shop\.open\s*&&\s*\(\s*<ShopScreen\b/,
  'La tienda debe desmontarse al cerrarla',
);
for (const [name, source] of [['App', appSource], ['MainMenu', mainMenuSource], ['TopBar', topBarSource], ['Gameplay', gameplaySource], ['Mascota', mascotaSource]]) {
  assert.doesNotMatch(source, /<ShopScreen\b/, `${name} debe abrir la tienda con useShop() en lugar de montar otra copia`);
}
assert.match(appSource, /<ShopProvider>/, 'App debe envolver la navegación con ShopProvider');
assert.match(usersSource, /levelGroups/);
assert.match(usersSource, /totalLevels/);
assert.match(
  mainMenuSource,
  /levelGroups\.length\s*>\s*0[\s\S]*?Array\.from\(\{\s*length:\s*Math\.ceil\(knownTotal\s*\/\s*50\)/,
  'El carrusel debe mostrar niveles aunque el backend todavía no entregue levelGroups',
);

assert.match(topBarSource, /useIsFocused/);
assert.match(topBarSource, /isFocused\s*&&\s*isLinked\s*&&\s*userId/);
assert.match(mascotaSource, /const isFocused = useIsFocused\(\)/);
assert.match(mascotaSource, /<FloatingMascot[\s\S]*?active=\{isFocused\}/);
assert.match(floatingMascotSource, /cancelAnimation\(floatY\)/);


const tickBody = wheelSource.match(/tickRef\.current\s*=\s*setInterval\([\s\S]*?\},\s*1000\s*\)/)?.[0] ?? '';
assert.ok(tickBody, 'WheelModal debe conservar su actualización visual cada segundo');
assert.doesNotMatch(
  tickBody,
  /AsyncStorage\.getItem/,
  'El intervalo de la ruleta no debe leer AsyncStorage cada segundo',
);

console.log('appPerformance: arranque, tienda y ruleta evitan trabajo oculto');
