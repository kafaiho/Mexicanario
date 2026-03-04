// ─────────────────────────────────────────────────────────────────────────────
// Individual-image system — one PNG per stage per mascot type.
// PetSprite uses the legacy multi-layer path (assets.body).
// ─────────────────────────────────────────────────────────────────────────────

// ── Ajolote (axolotl) ────────────────────────────────────────────────────────
// 4 unique images: stage1 (hatching), stage2 (baby), stage3-4 (juvenile), stage5-6 (adult)
const AJO_S1 = require('../../../assets/mascota/ajolote/stage1.png');
const AJO_S2 = require('../../../assets/mascota/ajolote/stage2.png');
const AJO_S3 = require('../../../assets/mascota/ajolote/stage3.png');
const AJO_S5 = require('../../../assets/mascota/ajolote/stage5.png');

// ── Alebrije (dragon) ────────────────────────────────────────────────────────
// 6 unique images: egg → cracking → hatching → small → medium → adult with wings
const ALE_S1 = require('../../../assets/mascota/alebrije/stage1.png');
const ALE_S2 = require('../../../assets/mascota/alebrije/stage2.png');
const ALE_S3 = require('../../../assets/mascota/alebrije/stage3.png');
const ALE_S4 = require('../../../assets/mascota/alebrije/stage4.png');
const ALE_S5 = require('../../../assets/mascota/alebrije/stage5.png');
const ALE_S6 = require('../../../assets/mascota/alebrije/stage6.png');

// ── Xolo (xoloitzcuintli) ────────────────────────────────────────────────────
// 6 unique images: aztec egg → cracking → pup hatching → sparkle pup → medium → adult
const XOL_S1 = require('../../../assets/mascota/xolo/stage1.png');
const XOL_S2 = require('../../../assets/mascota/xolo/stage2.png');
const XOL_S3 = require('../../../assets/mascota/xolo/stage3.png');
const XOL_S4 = require('../../../assets/mascota/xolo/stage4.png');
const XOL_S5 = require('../../../assets/mascota/xolo/stage5.png');
const XOL_S6 = require('../../../assets/mascota/xolo/stage6.png');

// ── Nahual (legendario — Mexicanario Plus) ────────────────────────────────────
// 3 variantes: norteña, sureña, urbana — 6 stages cada una
// TEST SPRITE: usando help-character.png para todas las variantes y stages.
// Reemplaza NAH_TEST con imágenes reales cuando el arte esté listo:
//   assets/mascota/nahual/norte/stage{1-6}.png
//   assets/mascota/nahual/sur/stage{1-6}.png
//   assets/mascota/nahual/urbano/stage{1-6}.png
const NAH_TEST = require('../../../assets/images/help-character.png');

// PET_ASSETS[type][stage] = { body }
// PetSprite.jsx uses assets.body via the legacy multi-layer render path.
export const PET_ASSETS = {
  ajolote: {
    1: { body: AJO_S1 },
    2: { body: AJO_S2 },
    3: { body: AJO_S3 },
    4: { body: AJO_S3 }, // juvenile (same image)
    5: { body: AJO_S5 },
    6: { body: AJO_S5 }, // adult (same image)
  },

  alebrije: {
    1: { body: ALE_S1 },
    2: { body: ALE_S2 },
    3: { body: ALE_S3 },
    4: { body: ALE_S4 },
    5: { body: ALE_S5 },
    6: { body: ALE_S6 },
  },

  xolo: {
    1: { body: XOL_S1 },
    2: { body: XOL_S2 },
    3: { body: XOL_S3 },
    4: { body: XOL_S4 },
    5: { body: XOL_S5 },
    6: { body: XOL_S6 },
  },

  // ── Nahual (Mexicanario Plus exclusive) — test sprite ────────────────────
  nahual_norte:  { 1: { body: NAH_TEST }, 2: { body: NAH_TEST }, 3: { body: NAH_TEST }, 4: { body: NAH_TEST }, 5: { body: NAH_TEST }, 6: { body: NAH_TEST } },
  nahual_sur:    { 1: { body: NAH_TEST }, 2: { body: NAH_TEST }, 3: { body: NAH_TEST }, 4: { body: NAH_TEST }, 5: { body: NAH_TEST }, 6: { body: NAH_TEST } },
  nahual_urbano: { 1: { body: NAH_TEST }, 2: { body: NAH_TEST }, 3: { body: NAH_TEST }, 4: { body: NAH_TEST }, 5: { body: NAH_TEST }, 6: { body: NAH_TEST } },
};

// Display sizes per stage (dp)
export const STAGE_SIZES = {
  1: { full: 100, compact: 64 },
  2: { full: 110, compact: 70 },
  3: { full: 120, compact: 76 },
  4: { full: 140, compact: 88 },
  5: { full: 160, compact: 100 },
  6: { full: 180, compact: 110 },
};

// Fallback if petType is unknown
export const FALLBACK_ASSETS = PET_ASSETS.alebrije;

// ── Regional Skins / Accessories ─────────────────────────────────────────────
// Maps region names to emoji placeholders or image assets.
export const REGION_SKINS = {
  "CDMX": "👔", // Godín
  "Ciudad de México": "👔",
  "Norte": "🤠", // Sombrero
  "Jalisco": "🎺", // Mariachi
  "Puebla": "🌶️",
  "Oaxaca": "🏺",
  "Sinaloa": "🌊",
  "Veracruz": "⚓",
  "Yucatán": "🌴",
  "Guerrero": "🏖️",
  "Chiapas": "🌿",
  "Michoacán": "🦋",
  "Tradicional": "🪅",
  "default": null,
};

export const getRegionSkin = (region) => {
  if (!region) return REGION_SKINS["default"];
  if (REGION_SKINS[region]) return REGION_SKINS[region];
  const key = Object.keys(REGION_SKINS).find(k =>
    k !== "default" && region.toLowerCase().includes(k.toLowerCase())
  );
  return REGION_SKINS[key] || REGION_SKINS["default"];
};
