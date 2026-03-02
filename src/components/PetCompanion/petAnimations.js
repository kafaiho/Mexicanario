import { Easing } from 'react-native-reanimated';

// ── Breathing (idle loop) ────────────────────────────────────────────────────
// scale 1.0 → 1.03, period 3.6s (1800ms each way)
export const BREATHING = {
  to: 1.03,
  duration: 1800,
  easing: Easing.inOut(Easing.ease),
};

// ── Parallax oscilación (semi-3D) ────────────────────────────────────────────
// Cada capa oscila con amplitud diferente para crear percepción de profundidad.
// Phase 0/180 simula desfase temporal entre capas.
export const PARALLAX = {
  body:   { amplitude: 2,  period: 4000, phase: 0 },
  wings:  { amplitude: 6,  period: 4000, phase: 180 },   // desfase inverso
  aura:   { amplitude: 10, period: 4200, phase: 90  },   // periodo ligeramente distinto
  shadow: { amplitude: 3,  period: 4000, phase: 0   },
};

// ── Celebrate: spring bounce ─────────────────────────────────────────────────
export const CELEBRATE_SPRING = {
  damping: 4,
  stiffness: 150,
  mass: 0.8,
};
export const CELEBRATE_TRANSLATE_Y = -28;

// ── Squash & Stretch en tap / celebrate ──────────────────────────────────────
export const TAP_SQUASH = {
  scaleX: 1.22,
  scaleY: 0.82,
  duration: 70,
};
export const TAP_STRETCH = {
  scaleX: 0.92,
  scaleY: 1.12,
  duration: 90,
};
export const TAP_SPRING_BACK = { damping: 6, stiffness: 220 };

// ── Sad: droop ───────────────────────────────────────────────────────────────
export const SAD_DROOP = {
  translateY: 8,
  scale: 0.93,
  duration: 400,
  easing: Easing.out(Easing.ease),
};

// ── Shadow derivado del breathing ────────────────────────────────────────────
export const SHADOW_OPACITY_RANGE = [0.12, 0.30]; // [reposo, exhale]
export const SHADOW_SCALEX_RANGE  = [1.06, 0.94]; // escala inversa al cuerpo

// ── Partículas al celebrar ───────────────────────────────────────────────────
export const PARTICLE_COUNT = 8;
export const PARTICLE_DURATION = 700;
export const PARTICLE_SPREAD_RADIUS = 60;
