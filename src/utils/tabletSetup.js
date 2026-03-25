/**
 * Tablet responsive setup.
 *
 * En iPhone (390dp), los valores como `width * 0.062` dan ~24px de fuente.
 * En iPad Pro 11" (834dp), ese mismo cálculo da ~52px — el doble de grande.
 *
 * Solución: parchear Dimensions.get('window') para que devuelva un ancho efectivo
 * de máximo 550dp (≈ 1.4× iPhone). Los fondos y contenedores flex siguen usando
 * el tamaño real nativo; sólo los cálculos JS de tamaño de fuente/padding se ven
 * afectados.
 *
 * Dimensions.get('screen') NO se parchea → se puede usar para layout crítico
 * (carruseles, snap intervals, posicionamiento absoluto).
 *
 * Importar como PRIMER módulo en index.js.
 */
import { Dimensions } from "react-native";

const MAX_EFFECTIVE_WIDTH = 550; // ≈ 1.4× iPhone 14 Pro — escala cómoda para tablet

const realScreen = Dimensions.get("screen");

export const TABLET_MODE = realScreen.width > MAX_EFFECTIVE_WIDTH;
// Use getters so these always return current screen dims (rotation-safe)
export const getRealDims = () => Dimensions.get("screen");
export const REAL_WIDTH   = realScreen.width;
export const REAL_HEIGHT  = realScreen.height;

if (TABLET_MODE) {
  const originalGet = Dimensions.get.bind(Dimensions);
  Dimensions.get = (dim) => {
    if (dim === "window") {
      // Recompute from current screen dims on every call — rotation-safe.
      const current = originalGet("screen");
      // Always scale relative to the shorter (portrait-width) dimension
      // so patched height stays reasonable even in landscape.
      const shorter = Math.min(current.width, current.height);
      const ratio = MAX_EFFECTIVE_WIDTH / shorter;
      return {
        ...current,
        width:  MAX_EFFECTIVE_WIDTH,
        height: Math.round(current.height * ratio),
      };
    }
    return originalGet(dim); // 'screen' devuelve dimensiones reales
  };
}
