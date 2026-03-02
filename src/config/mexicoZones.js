/**
 * mexicoZones.js
 * 12 zonas temáticas — colores con significado cultural mexicano.
 *
 * color  → color principal del tile (completado / banner)
 * dark   → sombra inferior del tile estilo Mario
 * light  → fondo suave de la etiqueta de nivel
 */

export const MEXICO_ZONES = [
  {
    id: 'cdmx',
    name: 'Carreteras de CDMX',
    levels: [1, 10],
    emoji: '🏙️',
    // Rosa Mexicana — Frida Kahlo, mercados, lucha libre
    color: '#E4007C',
    dark:  '#8B0048',
    light: '#FFE0F0',
    desc: 'La capital nunca duerme',
  },
  {
    id: 'oaxaca',
    name: 'Sabores de Oaxaca',
    levels: [11, 20],
    emoji: '🫙',
    // Grana Cochinilla — tinte prehispánico de insecto (rojo carmín)
    color: '#9C2542',
    dark:  '#5A0F22',
    light: '#FFE8ED',
    desc: 'Tlayudas, mole negro y mezcal',
  },
  {
    id: 'jalisco',
    name: 'Tierra de Mariachi',
    levels: [21, 30],
    emoji: '🎺',
    // Rojo Tequila — mariachi, jarabe tapatío, bandera
    color: '#C0392B',
    dark:  '#7B1A10',
    light: '#FFEBE9',
    desc: 'De aquí viene el tequila',
  },
  {
    id: 'yucatan',
    name: 'Misterios del Mayab',
    levels: [31, 40],
    emoji: '🌴',
    // Jade Maya — cenotes, jadeíta, pirámides
    color: '#00897B',
    dark:  '#005048',
    light: '#E0F5F2',
    desc: 'Cenotes y pirámides mayas',
  },
  {
    id: 'veracruz',
    name: 'Puerto y Son Jarocho',
    levels: [41, 50],
    emoji: '⚓',
    // Azul Golfo — mar, danzón, jarana veracruzana
    color: '#1565C0',
    dark:  '#0A3A72',
    light: '#E3EFF9',
    desc: 'Bongos, jarana y danzón',
  },
  {
    id: 'sinaloa',
    name: 'El Norte Bravo',
    levels: [51, 60],
    emoji: '🤠',
    // Dorado Norteño — banda, corridos, costas del Pacífico
    color: '#C9A227',
    dark:  '#7A6010',
    light: '#FFF8DC',
    desc: 'Corridos, banda y aguachile',
  },
  {
    id: 'puebla',
    name: 'Mole y Talavera',
    levels: [61, 70],
    emoji: '🎭',
    // Azul Talavera — cerámica, azulejos, chiles en nogada
    color: '#4527A0',
    dark:  '#240D5E',
    light: '#EDE7F6',
    desc: 'Chiles en nogada y azulejos',
  },
  {
    id: 'guerrero',
    name: 'Costa y Tierra Caliente',
    levels: [71, 80],
    emoji: '🌊',
    // Turquesa Pacífico — lacas de Olinalá, Acapulco, máscaras
    color: '#00ACC1',
    dark:  '#006475',
    light: '#E0F7FA',
    desc: 'Acapulco, lacas y calor del sur',
  },
  {
    id: 'chiapas',
    name: 'Selva y Maravillas',
    levels: [81, 90],
    emoji: '🦜',
    // Verde Selva — Lacandona, quetzal, Palenque
    color: '#2E7D32',
    dark:  '#164A18',
    light: '#E8F5E9',
    desc: 'Selva Lacandona y Palenque',
  },
  {
    id: 'coahuila',
    name: 'Desierto y Frontera',
    levels: [91, 100],
    emoji: '🌵',
    // Terracota Desierto — nopal, agave, frontera norteña
    color: '#BF360C',
    dark:  '#731F06',
    light: '#FBE9E7',
    desc: 'Desierto, burritos y norteña bravía',
  },
  {
    id: 'michoacan',
    name: 'Monarcas y Tradición',
    levels: [101, 110],
    emoji: '🦋',
    // Naranja Monarca — mariposas, cobre de Santa Clara, uchepos
    color: '#E65100',
    dark:  '#8A2E00',
    light: '#FFF3E0',
    desc: 'Mariposas monarca, cobre y carnitas',
  },
  {
    id: 'legendario',
    name: 'México Legendario',
    levels: [111, 9999],
    emoji: '🦅',
    // Oro Azteca — Tenochtitlán, Quetzalcóatl, leyendas
    color: '#B8860B',
    dark:  '#6B4D00',
    light: '#FFF8DC',
    desc: 'Leyendas, mitos y el México eterno',
  },
];

/**
 * Returns the zone object for a given level number.
 */
export function getZone(level) {
  return (
    MEXICO_ZONES.find((z) => level >= z.levels[0] && level <= z.levels[1]) ??
    MEXICO_ZONES[0]
  );
}

/**
 * Returns how many levels the user has completed within the current zone.
 */
export function getZoneProgress(level) {
  const zone = getZone(level);
  const zoneSize = zone.levels[1] === 9999 ? 10 : zone.levels[1] - zone.levels[0] + 1;
  return Math.min(level - zone.levels[0] + 1, zoneSize);
}

/**
 * Returns true when `level` is the FIRST level of a new zone.
 */
export function isZoneStart(level) {
  return MEXICO_ZONES.some((z) => z.levels[0] === level);
}

/**
 * Returns the next zone after the one containing `level`, or null if at the last.
 */
export function getNextZone(level) {
  const currentZone = getZone(level);
  const idx = MEXICO_ZONES.indexOf(currentZone);
  return idx < MEXICO_ZONES.length - 1 ? MEXICO_ZONES[idx + 1] : null;
}
