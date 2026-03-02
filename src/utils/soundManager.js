import { Audio } from "expo-av";

// ── Sound file map ─────────────────────────────────────────────────────────────
// Each key maps to a require() for an mp3 in assets/sounds/
// If a sound file doesn't exist yet, it will be skipped gracefully.

const SOUND_FILES = {
  correct: require("../../assets/sounds/correct.mp3"),
  wrong: require("../../assets/sounds/wrong.mp3"),
  combo: require("../../assets/sounds/combo.mp3"),
  combo_break: require("../../assets/sounds/combo_break.mp3"),
  streak: require("../../assets/sounds/streak.mp3"),
  celebration: require("../../assets/sounds/celebration.mp3"),
  milestone: require("../../assets/sounds/milestone.mp3"),
  click: require("../../assets/sounds/click.mp3"),
};

const loaded = {};
let soundEnabled = true;

// ── Preload all sounds at app start ────────────────────────────────────────────
export async function preloadSounds() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (e) {
    // silent
  }

  for (const [key, file] of Object.entries(SOUND_FILES)) {
    try {
      const { sound } = await Audio.Sound.createAsync(file, {
        shouldPlay: false,
        volume: 1.0,
      });
      loaded[key] = sound;
    } catch (e) {
      // Sound file missing or invalid — skip
      console.log(`[SoundManager] Could not load "${key}":`, e.message);
    }
  }
}

// ── Play a sound by name ───────────────────────────────────────────────────────
export async function playSound(name) {
  if (!soundEnabled) return;
  const sound = loaded[name];
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (e) {
    // silent — don't crash the app for a sound error
  }
}

// ── Unload all sounds (cleanup) ────────────────────────────────────────────────
export async function unloadSounds() {
  for (const sound of Object.values(loaded)) {
    try {
      await sound.unloadAsync();
    } catch (e) {
      // silent
    }
  }
}

// ── Toggle sound on/off ────────────────────────────────────────────────────────
export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}
