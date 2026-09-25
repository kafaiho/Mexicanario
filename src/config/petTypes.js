// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de mascotas y conversión de las mascotas anteriores.
//
// En sep 2026 el Ajolote, el Xolo y el Alebrije se reemplazaron por tres
// mascotas 3D que nacen de un huevo real. Los jugadores conservan su progreso:
//   ajolote → ayotl (las dos acuáticas)
//   xolo    → tecolote
//   alebrije → monarca (las dos coloridas y cambiantes)
// El servidor puede seguir guardando el tipo anterior; la app lo convierte al leer.
// Las variantes del Nahual (Plus) no cambian.
// ─────────────────────────────────────────────────────────────────────────────

export const PET_TYPES = [
  {
    id: 'monarca',
    name: 'Monarca',
    article: 'una',
    word: 'papalotl',
    desc: 'La que más cambia · Huevo, oruga, crisálida y mariposa',
    accent: '#C85A12',
    emojis: ['🥚', '🥚', '🐛', '🐛', '🦋'],
  },
  {
    id: 'tecolote',
    name: 'Tecolote',
    article: 'un',
    word: 'tecolotl',
    desc: 'El sabio de las palabras · Crece leyendo contigo',
    accent: '#4B3C98',
    emojis: ['🥚', '🥚', '🐣', '🦉', '🦉'],
  },
  {
    id: 'ayotl',
    name: 'Ayotl',
    article: 'una',
    word: 'tortuga golfina',
    desc: 'Lenta pero segura · La mascota de la constancia',
    accent: '#0E7F80',
    emojis: ['🥚', '🥚', '🐣', '🐢', '🐢'],
  },
];

export const DEFAULT_PET_TYPE = 'monarca';

export const LEGACY_PET_TYPES = {
  ajolote: 'ayotl',
  xolo: 'tecolote',
  alebrije: 'monarca',
};

// Nombres por defecto de las mascotas anteriores: si el jugador nunca le cambió
// el nombre, ahora se llama como la mascota nueva.
const LEGACY_DEFAULT_NAMES = {
  ayotl: ['Ajolote'],
  tecolote: ['Xolo', 'Xoloitzcuintle'],
  monarca: ['Alebrije'],
};

export const isLegacyPetType = (type) => !!type && Object.prototype.hasOwnProperty.call(LEGACY_PET_TYPES, type);

/** Tipo actual para cualquier tipo guardado (anterior, nuevo o Nahual). */
export function normalizePetType(type) {
  if (!type) return DEFAULT_PET_TYPE;
  return LEGACY_PET_TYPES[type] ?? type;
}

export const getPetTypeInfo = (type) => PET_TYPES.find((p) => p.id === normalizePetType(type));

export const defaultPetName = (type) => getPetTypeInfo(type)?.name ?? 'Tu mascota';

/** Nombre a mostrar: conserva los nombres elegidos, cambia los nombres por defecto viejos. */
export function normalizePetName(name, type) {
  const current = normalizePetType(type);
  if (!name || !name.trim()) return defaultPetName(current);
  if ((LEGACY_DEFAULT_NAMES[current] ?? []).includes(name.trim())) return defaultPetName(current);
  return name;
}

/**
 * Espacios guardados por mascota ({ ajolote: {...}, xolo: {...} }) con llaves nuevas.
 * Si existen la llave vieja y la nueva, gana la nueva.
 */
export function normalizePetSlots(slots) {
  const out = {};
  Object.entries(slots ?? {}).forEach(([type, slot]) => {
    const key = normalizePetType(type);
    if (!out[key] || !isLegacyPetType(type)) {
      out[key] = slot ? { ...slot, name: normalizePetName(slot.name, key) } : slot;
    }
  });
  return out;
}

/** Emoji de la mascota según su etapa (para insignias pequeñas). */
export function petEmoji(type, stage, fallback = '🐾') {
  const info = getPetTypeInfo(type);
  if (!info) return fallback;
  return info.emojis[Math.min(stage ?? 1, 4)] ?? fallback;
}

/**
 * Estado de la llama del tonalli a partir de getStreakStatus.
 * Los días del servidor cuentan en UTC, igual que StreakBadge.
 *   'apagada' → sin racha · 'riesgo' → no ha jugado y quedan ≤ 4 h · 'activa'
 */
export function flameStatusFor(streakStatus, now = new Date()) {
  const days = streakStatus?.currentStreak ?? 0;
  if (days <= 0) return 'apagada';
  if (!streakStatus?.playedToday && 24 - now.getUTCHours() <= 4) return 'riesgo';
  return 'activa';
}
