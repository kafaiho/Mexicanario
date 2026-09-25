// ─────────────────────────────────────────────────────────────────────────────
// Individual-image system — one PNG per stage per mascot type.
// PetSprite uses the legacy multi-layer path (assets.body).
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_PET_TYPE, normalizePetType } from '../../config/petTypes';

// ── Tecolote, Monarca y Ayotl ────────────────────────────────────────────────
// Imágenes estáticas renderizadas desde los modelos 3D (src/components/Pet3D).
// Se usan donde no hay animación (tarjetas para compartir, selector, respaldo
// sin 3D). Para regenerarlas: bash scripts/render-pet-sprites.sh
const TEC = [
  require('../../../assets/mascota/tecolote/stage1.png'),
  require('../../../assets/mascota/tecolote/stage2.png'),
  require('../../../assets/mascota/tecolote/stage3.png'),
  require('../../../assets/mascota/tecolote/stage4.png'),
  require('../../../assets/mascota/tecolote/stage5.png'),
  require('../../../assets/mascota/tecolote/stage6.png'),
];
const MON = [
  require('../../../assets/mascota/monarca/stage1.png'),
  require('../../../assets/mascota/monarca/stage2.png'),
  require('../../../assets/mascota/monarca/stage3.png'),
  require('../../../assets/mascota/monarca/stage4.png'),
  require('../../../assets/mascota/monarca/stage5.png'),
  require('../../../assets/mascota/monarca/stage6.png'),
];
const AYO = [
  require('../../../assets/mascota/ayotl/stage1.png'),
  require('../../../assets/mascota/ayotl/stage2.png'),
  require('../../../assets/mascota/ayotl/stage3.png'),
  require('../../../assets/mascota/ayotl/stage4.png'),
  require('../../../assets/mascota/ayotl/stage5.png'),
  require('../../../assets/mascota/ayotl/stage6.png'),
];
const byStage = (list) => ({ 1: { body: list[0] }, 2: { body: list[1] }, 3: { body: list[2] }, 4: { body: list[3] }, 5: { body: list[4] }, 6: { body: list[5] } });

// ── Arte anterior: solo lo usa el Nahual mientras no tenga arte propio ──────
const AJO_S1 = require('../../../assets/mascota/ajolote/stage1.png');
const AJO_S2 = require('../../../assets/mascota/ajolote/stage2.png');
const AJO_S3 = require('../../../assets/mascota/ajolote/stage3.png');
const AJO_S5 = require('../../../assets/mascota/ajolote/stage5.png');
const ALE_S1 = require('../../../assets/mascota/alebrije/stage1.png');
const ALE_S2 = require('../../../assets/mascota/alebrije/stage2.png');
const ALE_S3 = require('../../../assets/mascota/alebrije/stage3.png');
const ALE_S4 = require('../../../assets/mascota/alebrije/stage4.png');
const ALE_S5 = require('../../../assets/mascota/alebrije/stage5.png');
const ALE_S6 = require('../../../assets/mascota/alebrije/stage6.png');
const XOL_S1 = require('../../../assets/mascota/xolo/stage1.png');
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

// PET_ASSETS[type][stage] = { body, moods? }
// PetSprite.jsx uses assets.body via the legacy multi-layer render path.
//
// Imágenes por ánimo (opcional): cuando existan, agrégalas así y la app las usa
// automáticamente; si falta alguna, se usa `body`. Ver docs/mascota-arte-prompts.md
//   3: { body: AJO_S3, moods: {
//        joyful: require('../../../assets/mascota/ajolote/stage3_joyful.png'),
//        hungry: require('../../../assets/mascota/ajolote/stage3_hungry.png'),
//        sad:    require('../../../assets/mascota/ajolote/stage3_sad.png'),
//        sleepy: require('../../../assets/mascota/ajolote/stage3_sleepy.png') } },
// ── Nahual (legendario — Mexicanario Plus) ────────────────────────────────────
// 3 variantes con auras prehispánicas y etapas progresivas
export const PET_ASSETS = {
  tecolote: byStage(TEC),
  monarca: byStage(MON),
  ayotl: byStage(AYO),

  nahual_norte:  { 1: { body: XOL_S1 }, 2: { body: XOL_S3 }, 3: { body: XOL_S4 }, 4: { body: XOL_S5 }, 5: { body: XOL_S6 }, 6: { body: XOL_S6, wings: ALE_S6 } },
  nahual_sur:    { 1: { body: AJO_S1 }, 2: { body: AJO_S2 }, 3: { body: AJO_S3 }, 4: { body: AJO_S5 }, 5: { body: AJO_S5 }, 6: { body: AJO_S5, wings: ALE_S6 } },
  nahual_urbano: { 1: { body: ALE_S1 }, 2: { body: ALE_S2 }, 3: { body: ALE_S3 }, 4: { body: ALE_S4 }, 5: { body: ALE_S5 }, 6: { body: ALE_S6 } },
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
export const FALLBACK_ASSETS = PET_ASSETS[DEFAULT_PET_TYPE];

// Imágenes de una mascota y etapa; acepta tipos anteriores (ajolote, xolo, alebrije)
export function getStageAssets(petType, stage) {
  const typeAssets = PET_ASSETS[normalizePetType(petType)] ?? FALLBACK_ASSETS;
  const s = Math.max(1, Math.min(6, stage || 1));
  return typeAssets[s] ?? typeAssets[1];
}

// Imagen para un ánimo concreto, o la del cuerpo si no hay arte de ese ánimo
export const bodyForMood = (stageAssets, mood) =>
  (mood && stageAssets?.moods?.[mood]) || stageAssets?.body;

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
