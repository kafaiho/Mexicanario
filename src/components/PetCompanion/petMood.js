import { useEffect, useState } from 'react';
import usePetStore, { getAlegria, getEnergia, getPetMood } from '../../store/usePetStore';

// ── Configuración visual/textual de cada ánimo ───────────────────────────────
export const MOOD_CONFIG = {
  joyful: {
    label: 'Feliz de la vida',
    emoji: '❤️',
    hint: '¡Está a todo dar! Sigue así.',
    color: '#E4007C',
  },
  happy: {
    label: 'Contento',
    emoji: null,
    hint: 'Acaríciala o juega un nivel para ponerla feliz de la vida.',
    color: '#00B2A9',
  },
  hungry: {
    label: 'Con hambre',
    emoji: '🌮',
    hint: 'Cada palabra que aciertas es una botana. ¡Juega un nivel o dale de comer!',
    color: '#FF6B35',
  },
  sad: {
    label: 'Te extraña',
    emoji: '💧',
    hint: 'Hace rato que no le haces caso. ¡Acaríciala!',
    color: '#4A90D9',
  },
  sleepy: {
    label: 'Con sueño',
    emoji: '💤',
    hint: 'Ya es noche. Tócala para despertarla.',
    color: '#7B2D8B',
  },
};

// Frases al tocarla, según su ánimo (se mezclan con las frases generales)
export const MOOD_PHRASES = {
  joyful: [
    '¡Hoy ando más feliz que niño con piñata! 🪅',
    '¡Qué buena vibra traemos, carnal!',
    '¡Estoy a todo dar! ¿Otra palabrita?',
  ],
  happy: [],
  hungry: [
    '¡Tengo un hambre que ni te cuento! 🌮',
    'Oye… ¿y mi botana? Acierta una palabra y me la das.',
    'Se me antojan unos taquitos, nomás digo 👀',
    'Me ruge la panza más fuerte que un mariachi.',
  ],
  sad: [
    'Pensé que ya te habías olvidado de mí 🥺',
    '¿Dónde andabas? Te estuve esperando…',
    'Un apapacho y se me quita lo triste.',
  ],
  sleepy: [
    'Zzz… ¿eh? ¿Ya es de día? 😴',
    'Cinco minutitos más, porfa…',
    '¿Tú tampoco puedes dormir? Juguemos una.',
  ],
};

// Frases cuando fallas una palabra
export const WRONG_PHRASES = [
  '¡Ay! Casi, casi.',
  '¡No pasa nada, a la otra sale!',
  'Uy, esa estuvo difícil.',
  '¡Tú puedes, no te agüites!',
  'Respira… y otra vez.',
];

// Frases de combo (según qué tan largo es)
export const comboPhrase = (combo) => {
  if (combo >= 10) return `¡x${combo}! ¡Eres leyenda! 🔥🔥🔥`;
  if (combo >= 5) return `¡x${combo} Combo! ¡Nadie te para! 🔥`;
  return `¡x${combo} Combo! ¡Órale!`;
};

// Saludo al volver después de mucho tiempo
export const WELCOME_BACK_PHRASES = [
  '¡Volviste! ¡Te extrañé un montón! 🥹',
  '¡Por fin! Ya te andaba buscando.',
  '¡Qué milagro! ¿Jugamos?',
];

export const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * usePetMood — ánimo actual (se recalcula cada minuto y al cambiar el store).
 * Devuelve { mood, energia, alegria }.
 */
export function usePetMood() {
  const [now, setNow] = useState(Date.now());
  const energiaBase = usePetStore((s) => s.energiaBase);
  const energiaAt = usePetStore((s) => s.energiaAt);
  const alegriaBase = usePetStore((s) => s.alegriaBase);
  const alegriaAt = usePetStore((s) => s.alegriaAt);
  const lastInteraction = usePetStore((s) => s.lastInteraction);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Usa el reloj más reciente (tick o cambio del store)
  const t = Math.max(now, energiaAt ?? 0, alegriaAt ?? 0, lastInteraction ?? 0);
  const s = { energiaBase, energiaAt, alegriaBase, alegriaAt, lastInteraction };
  return {
    mood: getPetMood(s, t),
    energia: Math.round(getEnergia(s, t)),
    alegria: Math.round(getAlegria(s, t)),
  };
}
