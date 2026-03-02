import * as Haptics from "expo-haptics";

async function safe(fn) {
  try {
    await fn();
  } catch (_) {
    // Platform doesn't support haptics (e.g. Android emulator)
  }
}

export function tapLight() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function tapMedium() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function tapHeavy() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
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

/**
 * Burst of haptic pulses for combo milestones.
 * @param {number} count - combo count (more = heavier)
 */
export function comboBurst(count) {
  if (count >= 10) {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    setTimeout(() => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)), 80);
    setTimeout(() => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)), 160);
  } else if (count >= 5) {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    setTimeout(() => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)), 100);
  } else if (count >= 3) {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  }
}
