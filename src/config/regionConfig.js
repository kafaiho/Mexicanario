// ─── Clasificación regional de México ─────────────────────────────────────────
// Agrupa las ~52 strings de región de la base de datos en macro-regiones
// con demónimos coloquiales, emoji y color.
// ─────────────────────────────────────────────────────────────────────────────

export const MACRO_REGIONS = [
  {
    key: 'nacional',
    demonym: 'Nacional',
    emoji: '🦅',
    color: '#006847',
    dark: '#004D33',
    rawRegions: [
      'Todo México', 'Nacional', 'Infantil', 'Juvenil', 'Escuela',
      'Callejero', 'Tradicional', 'Familiar', 'Feria', 'Colonial',
    ],
  },
  {
    key: 'cdmx',
    demonym: 'Chilango',
    emoji: '🌮',
    color: '#C62828',
    dark: '#8B0000',
    rawRegions: ['CDMX'],
  },
  {
    key: 'norte',
    demonym: 'Norteño',
    emoji: '🤠',
    color: '#6D4C41',
    dark: '#4E342E',
    rawRegions: [
      'Norte', 'Chihuahua', 'Sinaloa', 'Sonora',
      'Baja California', 'Baja California Sur', 'Nuevo León',
      'Coahuila', 'Tamaulipas', 'Durango', 'Zacatecas',
      'Frontera Norte', 'Sierra Madre',
    ],
  },
  {
    key: 'jalisco',
    demonym: 'Tapatío',
    emoji: '🌵',
    color: '#2E7D32',
    dark: '#1B5E20',
    rawRegions: ['Jalisco', 'Occidente', 'Centro-Occidente'],
  },
  {
    key: 'veracruz',
    demonym: 'Jarocho',
    emoji: '🎺',
    color: '#1565C0',
    dark: '#0D47A1',
    rawRegions: ['Veracruz'],
  },
  {
    key: 'oaxaca',
    demonym: 'Oaxaqueño',
    emoji: '🍫',
    color: '#E65100',
    dark: '#BF360C',
    rawRegions: ['Oaxaca'],
  },
  {
    key: 'centro',
    demonym: 'Del Centro',
    emoji: '🏛️',
    color: '#5D4037',
    dark: '#3E2723',
    rawRegions: [
      'Centro', 'Estado de México', 'Morelos', 'Hidalgo',
      'Puebla', 'Tlaxcala', 'Bajío',
    ],
  },
  {
    key: 'bajio',
    demonym: 'Bajío',
    emoji: '🌾',
    color: '#F57F17',
    dark: '#E65100',
    rawRegions: ['Guanajuato', 'Querétaro', 'Aguascalientes', 'San Luis Potosí'],
  },
  {
    key: 'sureste',
    demonym: 'Yucateco',
    emoji: '🌺',
    color: '#6A1B9A',
    dark: '#4A148C',
    rawRegions: ['Yucatán', 'Quintana Roo', 'Campeche', 'Tabasco', 'Sureste'],
  },
  {
    key: 'chiapas',
    demonym: 'Chiapaneco',
    emoji: '🌿',
    color: '#00695C',
    dark: '#004D40',
    rawRegions: ['Chiapas', 'Sur'],
  },
  {
    key: 'guerrero',
    demonym: 'Guerrerense',
    emoji: '🏖️',
    color: '#00838F',
    dark: '#006064',
    rawRegions: ['Guerrero', 'Pacífico', 'Costas', 'Nayarit', 'Huasteca'],
  },
  {
    key: 'michoacan',
    demonym: 'Michoacano',
    emoji: '🦋',
    color: '#6A1B9A',
    dark: '#4A148C',
    rawRegions: ['Michoacán'],
  },
];

// Lookup: raw region string → macro-region key
const RAW_TO_KEY = {};
for (const macro of MACRO_REGIONS) {
  for (const raw of macro.rawRegions) {
    RAW_TO_KEY[raw] = macro.key;
  }
}

// Lookup: key → meta object
const KEY_TO_META = Object.fromEntries(MACRO_REGIONS.map(m => [m.key, m]));

/**
 * Returns macro-region meta for any raw region string.
 * Falls back to 'nacional' for unknown strings.
 */
export function getRegionMeta(rawRegion) {
  const key = RAW_TO_KEY[rawRegion] ?? 'nacional';
  return KEY_TO_META[key];
}

/**
 * Returns a sorted list of macro-region keys that contain the given raw regions.
 * Used for the region tab in ColeccionScreen.
 */
export function getMacroKey(rawRegion) {
  return RAW_TO_KEY[rawRegion] ?? 'nacional';
}
