// Keep literal require calls: Metro must discover both atlas files at bundle time.
const collectionAtlasSource = () => require('../../assets/images/cultural/collections-atlas.png');
const pathAtlasSource = () => require('../../assets/images/cultural/paths-atlas.png');

const atlasCell = (source, row, col, rows, cols, atlasAspect, cellAspect) =>
  Object.freeze({ source, row, col, rows, cols, atlasAspect, cellAspect });

const collectionCell = (index) => atlasCell(collectionAtlasSource, Math.floor(index / 5), index % 5, 4, 5, 1, 0.8);
const pathCell = (index) => atlasCell(pathAtlasSource, Math.floor(index / 5), index % 5, 2, 5, 1.5, 0.6);

const COLLECTION_IDS = [
  'juegos-ninez', 'dulces-antojitos', 'cocina-bebidas', 'dichos-casa', 'escuela-mexicana',
  'vida-barrio', 'tele-cultura-popular', 'musica-mexicana', 'fiestas-tradiciones', 'naturaleza-mexico',
  'pueblos-originarios-lenguas', 'oficios-artesanias', 'regiones-hablas', 'historia-personajes', 'lugares-mexico',
  'leyendas-relatos', 'ciencia-inventos-deporte', 'mexico-digital', 'albures-picaresca',
];

const PATH_IDS = [
  'patio-recreo', 'casa-abuela', 'calle-barrio', 'mercado-antojitos', 'feria-verbena',
  'musica-une', 'mexico-regional', 'oficios-artesanias', 'historias-leyendas', 'mexico-profundo',
];

const COLLECTION_ASSETS = Object.freeze(Object.fromEntries(COLLECTION_IDS.map((id, index) => [id, collectionCell(index)])));
const CULTURAL_PATH_ASSETS = Object.freeze(Object.fromEntries(PATH_IDS.map((id, index) => [id, pathCell(index)])));

function getCulturalAsset(kind, id) {
  if (kind === 'collection') return COLLECTION_ASSETS[id] || null;
  if (kind === 'path') return CULTURAL_PATH_ASSETS[id] || null;
  return null;
}

module.exports = { COLLECTION_ASSETS, CULTURAL_PATH_ASSETS, getCulturalAsset };
