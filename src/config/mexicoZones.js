/**
 * mexicoZones.js
 * 12 zonas temáticas — colores con significado cultural mexicano.
 *
 * color  → color principal del tile (completado / banner)
 * dark   → sombra inferior del tile estilo Mario
 * light  → fondo suave de la etiqueta de nivel
 *
 * Zone bounds are computed dynamically based on totalLevels so all zones
 * scale automatically as new words are added.
 */

export const MEXICO_ZONES = [
  {
    id: 'cdmx',
    name: 'Carreteras de CDMX',
    emoji: '🏙️',
    // Rosa Mexicana — Frida Kahlo, mercados, lucha libre
    color: '#C0185A',
    dark:  '#7A0035',
    light: '#FFE0F0',
    desc: 'La capital nunca duerme',
  },
  {
    id: 'oaxaca',
    name: 'Sabores de Oaxaca',
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
    emoji: '🦅',
    // Oro Azteca — Tenochtitlán, Quetzalcóatl, leyendas
    color: '#B8860B',
    dark:  '#6B4D00',
    light: '#FFF8DC',
    desc: 'Leyendas, mitos y el México eterno',
  },
];

const ZONE_COUNT = MEXICO_ZONES.length;

/**
 * Computes [start, end] (1-based inclusive) for zone at `zoneIndex`.
 * Each zone gets floor(totalLevels/12) levels; remainder distributed to first N zones.
 */
function zoneBounds(zoneIndex, totalLevels) {
  const total = Math.max(totalLevels, 1);
  const base = Math.floor(total / ZONE_COUNT);
  const remainder = total % ZONE_COUNT;
  const start = zoneIndex * base + Math.min(zoneIndex, remainder) + 1;
  const size = base + (zoneIndex < remainder ? 1 : 0);
  return [start, start + size - 1];
}

/**
 * Returns the zone object (with computed `levels: [start, end]`) for a given level number.
 */
export function getZone(level, totalLevels) {
  for (let i = 0; i < ZONE_COUNT; i++) {
    const bounds = zoneBounds(i, totalLevels);
    if (level >= bounds[0] && level <= bounds[1]) {
      return { ...MEXICO_ZONES[i], levels: bounds };
    }
  }
  // Fallback: last zone
  const lastBounds = zoneBounds(ZONE_COUNT - 1, totalLevels);
  return { ...MEXICO_ZONES[ZONE_COUNT - 1], levels: lastBounds };
}

/**
 * Returns how many levels the user has completed within the current zone.
 */
export function getZoneProgress(level, totalLevels) {
  const zone = getZone(level, totalLevels);
  const zoneSize = zone.levels[1] - zone.levels[0] + 1;
  return Math.min(level - zone.levels[0] + 1, zoneSize);
}

/**
 * Returns true when `level` is the FIRST level of a new zone.
 */
export function isZoneStart(level, totalLevels) {
  for (let i = 0; i < ZONE_COUNT; i++) {
    if (zoneBounds(i, totalLevels)[0] === level) return true;
  }
  return false;
}

/**
 * Returns the next zone after the one containing `level`, or null if at the last.
 */
export function getNextZone(level, totalLevels) {
  for (let i = 0; i < ZONE_COUNT; i++) {
    const bounds = zoneBounds(i, totalLevels);
    if (level >= bounds[0] && level <= bounds[1]) {
      if (i < ZONE_COUNT - 1) {
        const nextBounds = zoneBounds(i + 1, totalLevels);
        return { ...MEXICO_ZONES[i + 1], levels: nextBounds };
      }
      return null;
    }
  }
  return null;
}
