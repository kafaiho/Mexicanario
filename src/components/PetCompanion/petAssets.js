// ─────────────────────────────────────────────────────────────────────────────
// SPRITE SHEET SYSTEM
// Cada mascota tiene una sola imagen con todas sus etapas.
// PetSprite recorta la región correcta usando overflow:hidden + offsets.
//
// Coordenadas { x, y, w, h } son en píxeles de la imagen fuente (estimadas).
// Ajusta los valores después del primer render si el recorte no queda centrado.
// ─────────────────────────────────────────────────────────────────────────────

const XOLO_SHEET     = require('../../../assets/mascota/sheets/xolo.png');
const ALEBRIJE_SHEET = require('../../../assets/mascota/sheets/alebrije.png');
const AJOLOTE_SHEET  = require('../../../assets/mascota/sheets/ajolote.png');

// PET_ASSETS[type] = {
//   sheet, sheetWidth, sheetHeight,
//   [stage]: { x, y, w, h }
// }
export const PET_ASSETS = {
  ajolote: {
    sheet: AJOLOTE_SHEET,
    sheetWidth: 650, sheetHeight: 450,
    1: { x: 5,   y: 5,   w: 55,  h: 55  }, // anillo/burbuja azul (top-left)
    2: { x: 430, y: 0,   w: 210, h: 200 }, // bebé en huevo roto (top-right)
    3: { x: 430, y: 0,   w: 210, h: 200 }, // bebé en huevo roto (mismo que 2)
    4: { x: 0,   y: 225, w: 205, h: 225 }, // ajolote pequeño (bottom-left)
    5: { x: 210, y: 215, w: 220, h: 235 }, // ajolote mediano (bottom-center)
    6: { x: 435, y: 200, w: 215, h: 250 }, // ajolote grande + aura (bottom-right)
  },

  alebrije: {
    sheet: ALEBRIJE_SHEET,
    sheetWidth: 640, sheetHeight: 480,
    1: { x: 0,   y: 0,   w: 145, h: 205 }, // huevo decorado (top-left)
    2: { x: 150, y: 0,   w: 155, h: 205 }, // huevo rompiendo (top-2)
    3: { x: 308, y: 0,   w: 155, h: 205 }, // bebé emergiendo (top-3)
    4: { x: 465, y: 0,   w: 175, h: 205 }, // dragón juvenil (top-right)
    5: { x: 200, y: 215, w: 215, h: 265 }, // adulto con alas (bottom-center)
    6: { x: 420, y: 180, w: 220, h: 300 }, // mítico alas extendidas (bottom-right)
  },

  xolo: {
    sheet: XOLO_SHEET,
    sheetWidth: 640, sheetHeight: 420,
    1: { x: 0,   y: 0,   w: 140, h: 190 }, // huevo azteca oscuro (top-left)
    2: { x: 145, y: 0,   w: 150, h: 190 }, // huevo rompiendo + glow (top-2)
    3: { x: 300, y: 0,   w: 155, h: 190 }, // cachorro saliendo del cascarón (top-3)
    4: { x: 460, y: 0,   w: 170, h: 190 }, // xolo pequeño (top-right)
    5: { x: 0,   y: 200, w: 190, h: 220 }, // xolo mediano (bottom-left)
    6: { x: 410, y: 185, w: 225, h: 240 }, // xolo mítico + llama (bottom-right)
  },
};

// Tamaños de display por etapa (dp)
export const STAGE_SIZES = {
  1: { full: 100, compact: 64 },
  2: { full: 110, compact: 70 },
  3: { full: 120, compact: 76 },
  4: { full: 140, compact: 88 },
  5: { full: 160, compact: 100 },
  6: { full: 180, compact: 110 },
};

// Fallback si el petType solicitado no existe
export const FALLBACK_ASSETS = PET_ASSETS.alebrije;
