import Constants from "expo-constants";
import { normalizePetType } from "../config/petTypes";

const isExpoGo = Constants.appOwnership === "expo";
let Audio = null;
if (!isExpoGo) {
  Audio = require("expo-av").Audio;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SoundManager â€” SFX + Background Music (BGM) + Pet Sounds
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ SFX files (short, one-shot) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SFX_FILES = {
  correct: require("../../assets/sounds/correct.mp3"),
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
  menu: require("../../assets/sounds/bgm_menu.mp3"),         // fiesta_arcade — menú principal
  gameplay: require("../../assets/sounds/bgm_gameplay.mp3"),  // fiesta_digital — gameplay principal
  victory: require("../../assets/sounds/bgm_victory.mp3"),    // el_triunfo_radiante — victoria/celebración
  minigame: require("../../assets/sounds/bgm_minigame.mp3"),  // countdown_conga — minijuegos/PvP
};

// â”€â”€ Internal state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const loadedSfx = {};
const loadedPetSfx = {};
const loadedBgm = {};
const loadingSounds = new Map();
const loadingBgm = new Map();

let sfxEnabled = true;  // short SFX on/off
let musicEnabled = true;  // BGM on/off

let currentBgmKey = null;  // which track is playing
let currentBgmSound = null; // the Sound object for the current BGM
let bgmStatusCallback = null; // onPlaybackStatusUpdate reference for cleanup

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Preload â€” call once at app start
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function ensureSoundLoaded(name) {
  if (!Audio) return null;
  const key = name === "wrong" ? "combo_break" : name;
  const bucket = SFX_FILES[key] ? loadedSfx : loadedPetSfx;
  const file = SFX_FILES[key] ?? PET_SFX_FILES[key];
  if (!file) return null;
  if (bucket[key]) return bucket[key];
  if (loadingSounds.has(key)) return loadingSounds.get(key);

  const loadPromise = Audio.Sound.createAsync(file, {
    shouldPlay: false,
    volume: key === "pet_xolo" ? 0.35 : 1.0,
  }).then(({ sound }) => {
    bucket[key] = sound;
    return sound;
  }).catch((e) => {
    if (__DEV__) console.log(`[SoundManager] SFX "${key}" missing:`, e.message);
    return null;
  }).finally(() => loadingSounds.delete(key));

  loadingSounds.set(key, loadPromise);
  return loadPromise;
}

async function ensureBgmLoaded(key) {
  if (!Audio || !BGM_FILES[key]) return null;
  if (loadedBgm[key]) return loadedBgm[key];
  if (loadingBgm.has(key)) return loadingBgm.get(key);

  const loadPromise = Audio.Sound.createAsync(BGM_FILES[key], {
    shouldPlay: false,
    isLooping: true,
    volume: 0.35,
  }).then(({ sound }) => {
    loadedBgm[key] = sound;
    return sound;
  }).catch((e) => {
    if (__DEV__) console.log(`[SoundManager] BGM "${key}" missing:`, e.message);
    return null;
  }).finally(() => loadingBgm.delete(key));

  loadingBgm.set(key, loadPromise);
  return loadPromise;
}

export async function preloadSounds() {
  if (!Audio) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (_) { }

  // Only the first interaction and menu music are needed at startup.
  // Every other effect/track is loaded the first time it is requested.
  await Promise.all([ensureSoundLoaded("click"), ensureBgmLoaded("menu")]);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SFX â€” short one-shot sounds
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const _lastPlay = {};
const _THROTTLE = 35; // ms — prevents echo from overlapping async calls

// rate > 1 sube el tono (sin corrección de pitch) — usado para el "tin-tin-tin"
// ascendente de las monedas al llegar al contador.
export async function playSound(name, rate = 1) {
  if (!Audio || !sfxEnabled) return;

  // Throttle: skip if same sound played <35ms ago (prevents echo)
  const now = Date.now();
  if (now - (_lastPlay[name] ?? 0) < _THROTTLE) return;
  _lastPlay[name] = now;

  try {
    const sound = await ensureSoundLoaded(name);
    if (!sound) return;
    // replayAsync = atomic stop + play from 0 (single native bridge call)
    await sound.replayAsync({ shouldPlay: true, positionMillis: 0, rate, shouldCorrectPitch: false });
  } catch (_) { }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Pet sounds â€” helpers for common pet events
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playPetSound(event, petType) {
  if (!Audio) return;
  // event: 'happy' | 'sad' | 'levelup'
  // petType: 'tecolote' | 'monarca' | 'ayotl' | 'nahual_*' (acepta los tipos anteriores)
  if (event === "sad") {
    playSound("pet_sad");
  } else if (event === "levelup") {
    playSound("pet_levelup");
  } else if (event === "happy" && petType) {
    // Sin archivos propios todavía: cada mascota usa el sonido de la mascota a la que reemplazó
    const PET_SOUND_MAP = {
      tecolote: "pet_xolo",
      monarca: "pet_alebrije",
      ayotl: "pet_ajolote",
      nahual_norte: "pet_xolo",
      nahual_sur: "pet_ajolote",
      nahual_urbano: "pet_alebrije",
    };
    playSound(PET_SOUND_MAP[normalizePetType(petType)] ?? "pet_alebrije");
  } else {
    playSound("pet_alebrije");
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BGM â€” looping background music
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BGM_VOLUME = 0.35;
const FADE_MS = 600; // crossfade duration
const FADE_STEPS = 12;

/** Fade a sound's volume from `from` to `to` over `ms` milliseconds */
async function fadeVolume(sound, from, to, ms) {
  const steps = FADE_STEPS;
  const stepMs = ms / steps;
  const delta = (to - from) / steps;
  for (let i = 1; i <= steps; i++) {
    try { await sound.setVolumeAsync(from + delta * i); } catch (_) { break; }
    await new Promise(r => setTimeout(r, stepMs));
  }
}

/** Loop handler — no-op now that native isLooping:true handles gapless repeat.
 *  Kept as stub so callers don't break. */
function attachLoopHandler(sound) {
  // Native isLooping handles seamless repeat — no manual handler needed
  return null;
}

/**
 * Play a BGM track by key (e.g. “menu”, “gameplay”).
 * Crossfades from the previous track to the new one.
 */
export async function playBGM(trackKey) {
  if (!Audio || !musicEnabled) return;
  if (currentBgmKey === trackKey) return; // already playing this track

  const nextSound = await ensureBgmLoaded(trackKey);
  if (!nextSound) return;

  // Crossfade: fade out old, fade in new simultaneously
  const oldSound = currentBgmSound;
  if (oldSound) {
    // Detach old loop handler
    oldSound.setOnPlaybackStatusUpdate(null);
    // Fade out old in background (don't await — let new track start immediately)
    fadeVolume(oldSound, BGM_VOLUME, 0, FADE_MS).then(() => {
      oldSound.stopAsync().catch(() => {});
      oldSound.setPositionAsync(0).catch(() => {});
    });
  }

  try {
    await nextSound.setPositionAsync(0);
    await nextSound.setVolumeAsync(0);
    await nextSound.playAsync();
    currentBgmKey = trackKey;
    currentBgmSound = nextSound;
    bgmStatusCallback = attachLoopHandler(nextSound);
    // Fade in new track
    await fadeVolume(nextSound, 0, BGM_VOLUME, FADE_MS);
  } catch (_) { }
}

/** Pause the currently playing BGM with gentle fade. */
export async function pauseBGM() {
  if (!currentBgmSound) return;
  try {
    await fadeVolume(currentBgmSound, BGM_VOLUME, 0, 300);
    await currentBgmSound.pauseAsync();
  } catch (_) { }
}

/** Stop and reset the currently playing BGM with fade-out. */
export async function stopBGM() {
  if (!currentBgmSound) return;
  try {
    currentBgmSound.setOnPlaybackStatusUpdate(null);
    await fadeVolume(currentBgmSound, BGM_VOLUME, 0, 300);
    await currentBgmSound.stopAsync();
    await currentBgmSound.setPositionAsync(0);
  } catch (_) { }
  bgmStatusCallback = null;
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
  } else if (currentBgmKey && currentBgmSound) {
    // Resume the last track with fade-in
    try {
      await currentBgmSound.setVolumeAsync(0);
      await currentBgmSound.playAsync();
      attachLoopHandler(currentBgmSound);
      fadeVolume(currentBgmSound, 0, BGM_VOLUME, 400);
    } catch (_) { }
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
  for (const key of Object.keys(loadedSfx)) delete loadedSfx[key];
  for (const key of Object.keys(loadedPetSfx)) delete loadedPetSfx[key];
  for (const key of Object.keys(loadedBgm)) delete loadedBgm[key];
}
