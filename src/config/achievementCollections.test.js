const assert = require('node:assert/strict');
const { ACHIEVEMENT_COLLECTION_IDS, getAchievementCollectionDescription } = require('./achievementCollections.js');

assert.deepEqual(ACHIEVEMENT_COLLECTION_IDS, ['cocina-bebidas', 'musica-mexicana', 'historia-personajes', 'mexico-digital']);
const descriptions = ACHIEVEMENT_COLLECTION_IDS.map(getAchievementCollectionDescription);
for (const approved of ['Cocina y Bebidas', 'Música Mexicana', 'Historia y Personajes', 'México Digital']) {
  assert.ok(descriptions.some((text) => text.includes(approved)), `uses approved taxonomy name: ${approved}`);
}
for (const retired of ['Comida Mexicana', 'Música y Artistas', 'Historia de México', 'Mundo Digital']) {
  assert.ok(descriptions.every((text) => !text.includes(retired)), `retired name absent: ${retired}`);
}

console.log('achievement collections use approved taxonomy names');
