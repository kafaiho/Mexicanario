// Lógica pura del ánimo de la mascota (sin React Native, para poder probarla).
// Energía y alegría solo cambian cómo se ve y habla la mascota — NUNCA restan vínculo.

const ENERGIA_DECAY_PER_HOUR = 4;   // 100 → hambre (<25) en ~19 h
const ALEGRIA_DECAY_PER_HOUR = 3;   // 100 → triste (<25) en ~25 h
export const MOOD_LOW = 25;
export const MOOD_HIGH = 70;
const HOUR_MS = 60 * 60 * 1000;

// Comida de la tienda → energía que recupera
export const FOOD_ENERGIA = { taco: 35, tamal: 60, pan_muerto: 100 };

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const decayed = (base, at, perHour, now) =>
  clamp(base - ((now - (at ?? now)) / HOUR_MS) * perHour, 0, 100);

export const getEnergia = (s, now = Date.now()) =>
  decayed(s.energiaBase ?? 80, s.energiaAt, ENERGIA_DECAY_PER_HOUR, now);

export const getAlegria = (s, now = Date.now()) =>
  decayed(s.alegriaBase ?? 80, s.alegriaAt, ALEGRIA_DECAY_PER_HOUR, now);

/**
 * Ánimo actual de la mascota:
 *   'sleepy' | 'hungry' | 'sad' | 'joyful' | 'happy'
 * Prioridad: sueño (de noche e inactiva) > hambre > tristeza > euforia > feliz.
 */
export const getPetMood = (s, now = Date.now()) => {
  const hour = new Date(now).getHours();
  const isNight = hour >= 23 || hour < 6;
  const idleMin = (now - (s.lastInteraction ?? now)) / 60000;
  if (isNight && idleMin > 10) return 'sleepy';
  const energia = getEnergia(s, now);
  const alegria = getAlegria(s, now);
  if (energia < MOOD_LOW) return 'hungry';
  if (alegria < MOOD_LOW) return 'sad';
  if (energia >= MOOD_HIGH && alegria >= MOOD_HIGH) return 'joyful';
  return 'happy';
};

// Suma energía/alegría partiendo del valor actual (ya con decaimiento)
export const withMood = (s, { energia = 0, alegria = 0 }, now = Date.now()) => ({
  ...(energia ? { energiaBase: clamp(getEnergia(s, now) + energia, 0, 100), energiaAt: now } : {}),
  ...(alegria ? { alegriaBase: clamp(getAlegria(s, now) + alegria, 0, 100), alegriaAt: now } : {}),
});

// Si subió de etapa, registra la evolución pendiente. Si ya había una sin ver,
// conserva su etapa de origen para que la ceremonia muestre el salto completo.
export const evolutionPatch = (pending, fromStage, toStage) =>
  toStage > fromStage ? { pendingEvolution: { from: pending?.from ?? fromStage, to: toStage } } : {};
