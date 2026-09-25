// ─────────────────────────────────────────────────────────────────────────────
// Reconoce cómo toca el jugador a la mascota:
//   'tap'    → un toque corto (la vista decide si fue en la cabeza o el cuerpo)
//   'tickle' → 4 toques rápidos seguidos (cosquillas)
//   'rub'    → frotar de lado a lado (2 cambios de dirección en menos de 1 s)
// Sin React ni three: solo coordenadas y tiempos, para poder probarlo.
// ─────────────────────────────────────────────────────────────────────────────

export const TAP_MAX_MOVE = 10;        // px
export const TAP_MAX_MS = 350;
export const TICKLE_TAPS = 4;
export const TICKLE_WINDOW_MS = 1200;
export const RUB_REVERSALS = 2;
export const RUB_MIN_SEGMENT = 14;     // px por cada pasada
export const RUB_WINDOW_MS = 1000;
export const RUB_REPEAT_MS = 1200;     // frotar sin parar vuelve a contar cada 1.2 s

export function createGestureTracker() {
  let start = null;
  let prevX = 0;
  let dir = 0;
  let pivotX = 0;
  let reversals = [];
  let rubbing = false;
  let lastRubAt = -Infinity;
  let taps = [];

  return {
    get rubbing() { return rubbing; },

    begin(x, y, t) {
      start = { x, y, t };
      prevX = x; dir = 0; pivotX = x;
      reversals = []; rubbing = false;
    },

    /** Devuelve 'rub' cuando reconoce que está frotando; si no, null. */
    move(x, y, t) {
      if (!start) return null;
      const d = x - prevX;
      if (d !== 0) {
        const s = Math.sign(d);
        if (dir === 0) { dir = s; pivotX = prevX; }
        else if (s !== dir) {
          if (Math.abs(prevX - pivotX) >= RUB_MIN_SEGMENT) reversals.push(t);
          pivotX = prevX;
          dir = s;
        }
      }
      prevX = x;
      reversals = reversals.filter((r) => t - r <= RUB_WINDOW_MS);
      if (reversals.length >= RUB_REVERSALS && t - lastRubAt >= (rubbing ? RUB_REPEAT_MS : 0)) {
        rubbing = true;
        lastRubAt = t;
        return 'rub';
      }
      return null;
    },

    /** Devuelve 'tap' | 'tickle' | null al levantar el dedo. */
    end(x, y, t) {
      if (!start) return null;
      const moved = Math.hypot(x - start.x, y - start.y);
      const long = t - start.t > TAP_MAX_MS;
      const wasRub = rubbing;
      start = null;
      if (wasRub || moved > TAP_MAX_MOVE || long) return null;
      taps = taps.filter((tt) => t - tt <= TICKLE_WINDOW_MS);
      taps.push(t);
      if (taps.length >= TICKLE_TAPS) { taps = []; return 'tickle'; }
      return 'tap';
    },

    cancel() { start = null; rubbing = false; },
  };
}
