// Keep literal require calls: Metro must discover both atlas files at bundle time.
const collectionAtlasSource = () => require('../../assets/images/cultural/collections-atlas.png');

const atlasCell = (source, row, col, rows, cols, atlasAspect, cellAspect) =>
  Object.freeze({ source, row, col, rows, cols, atlasAspect, cellAspect });

const collectionCell = (index) => atlasCell(collectionAtlasSource, Math.floor(index / 5), index % 5, 4, 5, 1, 0.8);

const COLLECTION_IDS = [
  'juegos-ninez', 'dulces-antojitos', 'cocina-bebidas', 'dichos-casa', 'escuela-mexicana',
  'vida-barrio', 'tele-cultura-popular', 'musica-mexicana', 'fiestas-tradiciones', 'naturaleza-mexico',
  'pueblos-originarios-lenguas', 'oficios-artesanias', 'regiones-hablas', 'historia-personajes', 'lugares-mexico',
  'leyendas-relatos', 'ciencia-inventos-deporte', 'mexico-digital', 'albures-picaresca',
];

const COLLECTION_ASSETS = Object.freeze(Object.fromEntries(COLLECTION_IDS.map((id, index) => [id, collectionCell(index)])));
const CULTURAL_PATH_ASSETS = Object.freeze({
  'patio-recreo': COLLECTION_ASSETS['juegos-ninez'],
  'casa-abuela': COLLECTION_ASSETS['dichos-casa'],
  'calle-barrio': COLLECTION_ASSETS['vida-barrio'],
  'mercado-antojitos': COLLECTION_ASSETS['cocina-bebidas'],
  'feria-verbena': COLLECTION_ASSETS['fiestas-tradiciones'],
  'musica-une': COLLECTION_ASSETS['musica-mexicana'],
  'mexico-regional': COLLECTION_ASSETS['regiones-hablas'],
  'oficios-artesanias': COLLECTION_ASSETS['oficios-artesanias'],
  'historias-leyendas': COLLECTION_ASSETS['leyendas-relatos'],
  'mexico-profundo': COLLECTION_ASSETS['pueblos-originarios-lenguas'],
});

function getCulturalAsset(kind, id) {
  if (kind === 'collection') return COLLECTION_ASSETS[id] || null;
  if (kind === 'path') return CULTURAL_PATH_ASSETS[id] || null;
  return null;
}

module.exports = { COLLECTION_ASSETS, CULTURAL_PATH_ASSETS, getCulturalAsset };
