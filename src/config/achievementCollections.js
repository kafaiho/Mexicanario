const { getCollectionPresentation } = require('./collectionPresentation.js');

const ACHIEVEMENT_COLLECTION_IDS = Object.freeze([
  'cocina-bebidas', 'musica-mexicana', 'historia-personajes', 'mexico-digital',
]);

function getAchievementCollectionDescription(id) {
  return `Completa la colección ${getCollectionPresentation(id).name}`;
}

module.exports = { ACHIEVEMENT_COLLECTION_IDS, getAchievementCollectionDescription };
