import * as Haptics from "expo-haptics";

// ── Vocabulario háptico de Mexicanario ──────────────────────────────────────
// Todo el juego vibra a través de este módulo para que se sienta consistente
// y para que el interruptor "Vibración" de Ajustes lo apague todo.
//
//   tick()        — el más sutil y nítido: pasos de una secuencia (fichas, bonos)
//   tapLight()    — toque de botón / tecla
//   tapMedium()   — confirmación
//   tapHeavy()    — golpe (momento grande)
//   tension()     — golpe seco y rígido: "¿acerté?" (última letra)
//   notifySuccess / notifyWarning / notifyError — resultados
//   nearMiss()    — "¡casi!": dos pulsos suaves, no castiga
//   comboBurst(n) — ráfaga que crece con el combo

let enabled = true;

export const HAPTICS_PREF_KEY = "pref_haptics";

export function setHapticsEnabled(value) {
  enabled = value !== false;
}

export function isHapticsEnabled() {
  return enabled;
}

async function safe(fn) {
  if (!enabled) return;
  try {
    await fn();
  } catch (_) {
    // Platform doesn't support haptics (e.g. Android emulator)
  }
}

const impact = (style) => safe(() => Haptics.impactAsync(style));
const later = (ms, fn) => setTimeout(fn, ms);

export function tick() {
  safe(() => Haptics.selectionAsync());
}

export function tapLight() {
  impact(Haptics.ImpactFeedbackStyle.Light);
}

export function tapMedium() {
  impact(Haptics.ImpactFeedbackStyle.Medium);
}

export function tapHeavy() {
  impact(Haptics.ImpactFeedbackStyle.Heavy);
}

export function tension() {
  // Rigid no existe en todas las versiones: cae a Heavy
  impact(Haptics.ImpactFeedbackStyle.Rigid ?? Haptics.ImpactFeedbackStyle.Heavy);
}

export function notifySuccess() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function notifyError() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

export function notifyWarning() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

export function nearMiss() {
  impact(Haptics.ImpactFeedbackStyle.Soft ?? Haptics.ImpactFeedbackStyle.Light);
  later(110, () => impact(Haptics.ImpactFeedbackStyle.Soft ?? Haptics.ImpactFeedbackStyle.Light));
}

/**
 * Burst of haptic pulses for combo milestones.
 * @param {number} count - combo count (more = heavier)
 */
export function comboBurst(count) {
  if (count >= 10) {
    tapHeavy();
    later(80, tapHeavy);
    later(160, tapHeavy);
  } else if (count >= 5) {
    tapHeavy();
    later(100, tapMedium);
  } else if (count >= 3) {
    tapMedium();
  }
}
