const record = (id, name, icon, color, description) => ({ id, name, icon, color, description });

const CULTURAL_PATH_DEFINITIONS = [
  record('patio-recreo', 'Patio y Recreo', '🪀', '#E76F51', 'Juegos, escuela y recuerdos de la niñez.'),
  record('casa-abuela', 'Casa de la Abuela', '🏡', '#B56576', 'Sabores, dichos y costumbres compartidas en familia.'),
  record('calle-barrio', 'Calle y Barrio', '⚽', '#457B9D', 'La vida cotidiana, sus personajes y sus voces.'),
  record('mercado-antojitos', 'Mercado y Antojitos', '🌮', '#E9C46A', 'Ingredientes, bebidas y antojos de cada región.'),
  record('feria-verbena', 'Feria y Verbena', '🎡', '#F4A261', 'Fiestas populares, celebraciones y tradiciones.'),
  record('musica-une', 'Música que nos Une', '🎺', '#9B5DE5', 'Ritmos, canciones e instrumentos de México.'),
  record('mexico-regional', 'México Regional', '🗺️', '#2A9D8F', 'Ciudades, estados, hablas y paisajes con identidad propia.'),
  record('oficios-artesanias', 'Oficios y Artesanías', '🧶', '#BC6C25', 'Manos creadoras, técnicas y saberes comunitarios.'),
  record('historias-leyendas', 'Historias y Leyendas', '🕯️', '#6D597A', 'Relatos, personajes y memorias que siguen vivos.'),
  record('mexico-profundo', 'México Profundo', '🌽', '#606C38', 'Lenguas, raíces, conocimiento y diversidad cultural.'),
];

// Tramos del recorrido completo en orden editorial: [pathId, vuelta, niveles].
// Se generan desde el catálogo (ver scripts/generate-mexico-vivido-convex-catalog.js).
const { CULTURAL_SEGMENT_ROWS } = require('./culturalSegments.generated');

// Tamaño de cada camino en la primera vuelta, tomado de los tramos generados para
// que la UI nunca reparta niveles de forma matemática ni se desfase del catálogo.
const CULTURAL_PATH_ENTRY_COUNTS = CULTURAL_PATH_DEFINITIONS.map(({ id }) => (
  CULTURAL_SEGMENT_ROWS.find(([pathId, round]) => pathId === id && round === 1)?.[2] ?? 0
));
let culturalPathStart = 1;
const CULTURAL_PATHS = CULTURAL_PATH_DEFINITIONS.map((path, index) => {
  const entryCount = CULTURAL_PATH_ENTRY_COUNTS[index];
  const editorialStart = culturalPathStart;
  const editorialEnd = editorialStart + entryCount - 1;
  culturalPathStart = editorialEnd + 1;
  return Object.freeze({ ...path, entryCount, editorialStart, editorialEnd });
});

// Tramos como objetos: { pathId, round, start, end, count }.
let segmentStart = 1;
const CULTURAL_SEGMENTS = CULTURAL_SEGMENT_ROWS.map(([pathId, round, count]) => {
  const segment = Object.freeze({ pathId, round, start: segmentStart, end: segmentStart + count - 1, count });
  segmentStart += count;
  return segment;
});

const collectionNames = [
  ['juegos-ninez', 'Juegos de la Niñez', '🪀'], ['dulces-antojitos', 'Dulces y Antojitos', '🍭'],
  ['cocina-bebidas', 'Cocina y Bebidas', '🫔'], ['dichos-casa', 'Dichos de Casa', '💬'],
  ['escuela-mexicana', 'Escuela Mexicana', '✏️'], ['vida-barrio', 'Vida de Barrio', '⚽'],
  ['tele-cultura-popular', 'Tele y Cultura Popular', '📺'], ['musica-mexicana', 'Música Mexicana', '🎺'],
  ['fiestas-tradiciones', 'Fiestas y Tradiciones', '🎊'], ['naturaleza-mexico', 'Naturaleza de México', '🦋'],
  ['pueblos-originarios-lenguas', 'Pueblos Originarios y Lenguas', '🌽'], ['oficios-artesanias', 'Oficios y Artesanías', '🧶'],
  ['regiones-hablas', 'Regiones y Hablas', '🗣️'], ['historia-personajes', 'Historia y Personajes', '📜'],
  ['lugares-mexico', 'Lugares de México', '🗺️'], ['leyendas-relatos', 'Leyendas y Relatos', '🕯️'],
  ['ciencia-inventos-deporte', 'Ciencia, Inventos y Deporte', '🔬'], ['mexico-digital', 'México Digital', '📱'],
  ['albures-picaresca', 'Albures y Picaresca', '😉'],
];
const colors = ['#E76F51', '#F4A261', '#E9C46A', '#B56576', '#457B9D', '#2A9D8F'];
const COLLECTIONS = collectionNames.map(([id, name, icon], i) => record(id, name, icon, colors[i % colors.length], `Palabras y expresiones de ${name.toLocaleLowerCase('es-MX')}.`));

const place = (id, name, kind, demonym, icon, color, aliases = []) => ({ id, name, kind, demonym, icon, color, aliases });
const PLACES = [
  place('todo-mexico', 'Todo México', 'country', 'Mexicano', '🦅', '#006847', ['México', 'Mexico', 'Nacional', 'Todo Mexico']),
  place('cdmx', 'Ciudad de México', 'city', 'Chilango', '🚇', '#C62828', ['CDMX', 'Ciudad de Mexico', 'Distrito Federal', 'DF']),
  place('guadalajara', 'Guadalajara', 'city', 'Tapatío', '🏛️', '#2E7D32', ['Guadalajara, Jalisco']),
  place('jalisco', 'Jalisco', 'state', 'Jalisciense', '🎺', '#388E3C', ['Estado de Jalisco']),
  place('monterrey', 'Monterrey', 'city', 'Regiomontano', '🏔️', '#795548', ['Monterrey, Nuevo León', 'Monterrey, Nuevo Leon']),
  place('nuevo-leon', 'Nuevo León', 'state', 'Neoleonés', '⛰️', '#6D4C41', ['Nuevo Leon']),
  place('veracruz', 'Veracruz', 'state', 'Veracruzano', '🎺', '#1565C0', ['Estado de Veracruz']),
  place('oaxaca', 'Oaxaca', 'state', 'Oaxaqueño', '🍫', '#E65100', ['Estado de Oaxaca']),
  place('puebla', 'Puebla', 'state', 'Poblano', '🏺', '#5D4037', ['Estado de Puebla']),
  place('michoacan', 'Michoacán', 'state', 'Michoacano', '🦋', '#6A1B9A', ['Michoacan']),
  place('guerrero', 'Guerrero', 'state', 'Guerrerense', '🎭', '#00838F', ['Estado de Guerrero']),
  place('chiapas', 'Chiapas', 'state', 'Chiapaneco', '🦜', '#00695C', ['Estado de Chiapas']),
  place('yucatan', 'Yucatán', 'state', 'Yucateco', '🌺', '#7B1FA2', ['Yucatan']),
  place('campeche', 'Campeche', 'state', 'Campechano', '🏰', '#AD1457', ['Estado de Campeche']),
  place('quintana-roo', 'Quintana Roo', 'state', 'Quintanarroense', '🐠', '#00897B', ['Estado de Quintana Roo']),
  place('tabasco', 'Tabasco', 'state', 'Tabasqueño', '🍫', '#558B2F', ['Estado de Tabasco']),
  place('sinaloa', 'Sinaloa', 'state', 'Sinaloense', '🥁', '#0277BD', ['Sinaloa']),
  place('nayarit', 'Nayarit', 'state', 'Nayarita', '🌊', '#0277BD', ['Estado de Nayarit']),
  place('huasteca', 'La Huasteca', 'cultural-region', 'Huasteco', '🎻', '#00838F', ['Huasteca', 'Región Huasteca', 'Region Huasteca']),
  place('sonora', 'Sonora', 'state', 'Sonorense', '🌵', '#D84315', ['Estado de Sonora']),
  place('chihuahua', 'Chihuahua', 'state', 'Chihuahuense', '🏜️', '#A1887F', ['Estado de Chihuahua']),
  place('baja-california', 'Baja California', 'state', 'Bajacaliforniano', '🐋', '#0288D1', ['Estado de Baja California']),
  place('coahuila', 'Coahuila', 'state', 'Coahuilense', '⛰️', '#8D6E63', ['Coahuila de Zaragoza']),
  place('durango', 'Durango', 'state', 'Duranguense', '🎬', '#6D4C41', ['Estado de Durango']),
  place('zacatecas', 'Zacatecas', 'state', 'Zacatecano', '⛏️', '#AD1457', ['Estado de Zacatecas']),
  place('san-luis-potosi', 'San Luis Potosí', 'state', 'Potosino', '🌵', '#EF6C00', ['San Luis Potosi', 'SLP']),
  place('aguascalientes', 'Aguascalientes', 'state', 'Hidrocálido', '🎡', '#C62828', ['Estado de Aguascalientes']),
  place('guanajuato', 'Guanajuato', 'state', 'Guanajuatense', '🏛️', '#F9A825', ['Estado de Guanajuato']),
  place('queretaro', 'Querétaro', 'state', 'Queretano', '🌉', '#5E35B1', ['Queretaro', 'Estado de Querétaro']),
  place('hidalgo', 'Hidalgo', 'state', 'Hidalguense', '🥟', '#2E7D32', ['Estado de Hidalgo']),
  place('estado-de-mexico', 'Estado de México', 'state', 'Mexiquense', '🔺', '#00796B', ['Edomex', 'Estado de Mexico']),
  place('morelos', 'Morelos', 'state', 'Morelense', '🌾', '#7CB342', ['Estado de Morelos']),
  place('tlaxcala', 'Tlaxcala', 'state', 'Tlaxcalteca', '🦅', '#8E24AA', ['Estado de Tlaxcala']),
  place('tamaulipas', 'Tamaulipas', 'state', 'Tamaulipeco', '🦀', '#00838F', ['Estado de Tamaulipas']),
  place('colima', 'Colima', 'state', 'Colimense', '🌋', '#BF360C', ['Estado de Colima']),
  place('baja-california-sur', 'Baja California Sur', 'state', 'Sudcaliforniano', '🐳', '#0277BD', ['BCS', 'Estado de Baja California Sur']),
  place('unclassified', 'Por clasificar', 'unclassified', 'Por clasificar', '📍', '#757575', ['Desconocido', 'Sin región', 'Sin region']),
];

function normalizeCulturalKey(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

const PLACE_BY_KEY = new Map();
for (const item of PLACES) {
  for (const value of [item.id, item.name, ...item.aliases]) {
    const key = normalizeCulturalKey(value);
    const existing = PLACE_BY_KEY.get(key);
    if (existing && existing.id !== item.id) {
      throw new Error(`Cultural place key collision: "${key}" belongs to both "${existing.id}" and "${item.id}"`);
    }
    PLACE_BY_KEY.set(key, item);
  }
}

function resolvePlace(value) {
  return PLACE_BY_KEY.get(normalizeCulturalKey(value)) || PLACE_BY_KEY.get('unclassified');
}

module.exports = { CULTURAL_PATHS, CULTURAL_SEGMENTS, COLLECTIONS, PLACES, normalizeCulturalKey, resolvePlace };
