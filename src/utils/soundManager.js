import { Audio } from "expo-av";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SoundManager â€” SFX + Background Music (BGM) + Pet Sounds
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ SFX files (short, one-shot) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SFX_FILES = {
  correct: require("../../assets/sounds/correct.mp3"),
  wrong: require("../../assets/sounds/combo_break.mp3"), // combo_break usado como wrong
  combo: require("../../assets/sounds/combo.mp3"),
  combo_break: require("../../assets/sounds/combo_break.mp3"),
  streak: require("../../assets/sounds/streak.mp3"),
  celebration: require("../../assets/sounds/celebration.mp3"),
  milestone: require("../../assets/sounds/milestone.mp3"),
  click: require("../../assets/sounds/click.mp3"),
  wheel_spin: require("../../assets/sounds/wheel_spin.mp3"),
  coin: require("../../assets/sounds/coin.mp3"),
};

// â”€â”€ Pet sound files â€” per tipo de mascota â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cada mascota tiene su propio sonido Ãºnico.
// playPetSound(event, petType) elige el archivo correcto.
const PET_SFX_FILES = {
  pet_ajolote: require("../../assets/sounds/pet_ajolote.mp3"),
  pet_alebrije: require("../../assets/sounds/pet_alebrije.mp3"),
  pet_xolo: require("../../assets/sounds/pet_xolo.mp3"),
  pet_sad: require("../../assets/sounds/pet_sad.mp3"),
  pet_levelup: require("../../assets/sounds/pet_levelup.mp3"),
};

// â”€â”€ BGM tracks â€” ACTIVADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BGM_FILES = {
  menu: require("../../assets/sounds/bgm_menu.mp3"),
  gameplay: require("../../assets/sounds/bgm_gameplay.mp3"),
};

// â”€â”€ Internal state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const loadedSfx = {};
const loadedPetSfx = {};
const loadedBgm = {};

let sfxEnabled = true;  // short SFX on/off
let musicEnabled = true;  // BGM on/off

let currentBgmKey = null;  // which track is playing
let currentBgmSound = null; // the Sound object for the current BGM

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Preload â€” call once at app start
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function preloadSounds() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (_) { }

  // Load SFX
  for (const [key, file] of Object.entries(SFX_FILES)) {
    try {
      const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: false, volume: 1.0 });
      loadedSfx[key] = sound;
    } catch (e) {
      if (__DEV__) console.log(`[SoundManager] SFX "${key}" missing:`, e.message);
    }
  }

  // Load Pet SFX
  for (const [key, file] of Object.entries(PET_SFX_FILES)) {
    try {
      const vol = key === "pet_xolo" ? 0.35 : 1.0;
      const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: false, volume: vol });
      loadedPetSfx[key] = sound;
    } catch (e) {
      if (__DEV__) console.log(`[SoundManager] PetSFX "${key}" missing:`, e.message);
    }
  }

  // Load BGM (preloaded but NOT played yet)
  for (const [key, file] of Object.entries(BGM_FILES)) {
    try {
      const { sound } = await Audio.Sound.createAsync(file, {
        shouldPlay: false,
        isLooping: true,
        volume: 0.35, // subtle background level
      });
      loadedBgm[key] = sound;
    } catch (e) {
      if (__DEV__) console.log(`[SoundManager] BGM "${key}" missing:`, e.message);
    }
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SFX â€” short one-shot sounds
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function playSound(name) {
  if (!sfxEnabled) return;
  const sound = loadedSfx[name] ?? loadedPetSfx[name];
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (_) { }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Pet sounds â€” helpers for common pet events
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playPetSound(event, petType) {
  // event: 'happy' | 'sad' | 'levelup'
  // petType: 'ajolote' | 'alebrije' | 'xolo' | 'nahual_norte' | 'nahual_sur' | 'nahual_urbano'
  if (event === "sad") {
    playSound("pet_sad");
  } else if (event === "levelup") {
    playSound("pet_levelup");
  } else if (event === "happy" && petType) {
    // Nahual variants map to base pet sounds (no dedicated files)
    const NAHUAL_SOUND_MAP = {
      nahual_norte: "pet_xolo",
      nahual_sur: "pet_ajolote",
      nahual_urbano: "pet_alebrije",
    };
    const soundKey = NAHUAL_SOUND_MAP[petType] ?? `pet_${petType}`;
    playSound(soundKey);
  } else {
    playSound("pet_alebrije");
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BGM â€” looping background music
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Play a BGM track by key (e.g. "menu", "gameplay").
 * Stops the previous track gracefully before starting the new one.
 */
export async function playBGM(trackKey) {
  if (!musicEnabled) return;
  if (currentBgmKey === trackKey) return; // already playing this track

  // Stop current track
  await stopBGM();

  const sound = loadedBgm[trackKey];
  if (!sound) return; // file not loaded yet â€” graceful skip

  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
    currentBgmKey = trackKey;
    currentBgmSound = sound;
  } catch (_) { }
}

/** Pause the currently playing BGM (keeps position). */
export async function pauseBGM() {
  if (!currentBgmSound) return;
  try { await currentBgmSound.pauseAsync(); } catch (_) { }
}

/** Stop and reset the currently playing BGM. */
export async function stopBGM() {
  if (!currentBgmSound) return;
  try {
    await currentBgmSound.stopAsync();
    await currentBgmSound.setPositionAsync(0);
  } catch (_) { }
  currentBgmSound = null;
  currentBgmKey = null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Settings toggles â€” called from SettingsModal
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** SFX (effects) on/off */
export function setSoundEnabled(enabled) {
  sfxEnabled = enabled;
}
export function isSoundEnabled() {
  return sfxEnabled;
}

/** BGM (music) on/off â€” also starts/stops current track */
export async function setMusicEnabled(enabled) {
  musicEnabled = enabled;
  if (!enabled) {
    await pauseBGM();
  } else if (currentBgmKey) {
    // Resume the last track
    try { await currentBgmSound?.playAsync(); } catch (_) { }
  }
}
export function isMusicEnabled() {
  return musicEnabled;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cleanup â€” call when the app is backgrounded or unmounted
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function unloadSounds() {
  await stopBGM();
  for (const sound of [...Object.values(loadedSfx), ...Object.values(loadedPetSfx), ...Object.values(loadedBgm)]) {
    try { await sound.unloadAsync(); } catch (_) { }
  }
}
