import { useCallback, useEffect, useRef, useState } from "react";

// ── Contador rodante para los pills de monedas / diamantes ──────────────────
// - Cambios normales de `target`: el número "rueda" hasta el nuevo valor.
//   Los aumentos esperan un momento por si una animación de vuelo los reclama.
// - hold(total): reserva `total` del valor ya actualizado en el backend; el
//   pill lo muestra descontado hasta que las piezas llegan.
// - reveal(id, fraction): la pieza que aterriza suma su parte (sube en sincronía).
// - release(id): termina la reserva y rueda al valor real.
// Llama hold() DESPUÉS de que la mutación resolvió (target ya incluye el premio).

const SETTLE_DELAY_MS = 900;
const DEFAULT_HOLD_MS = 4000;

export default function useRollingCounter(target, { ready = true, reduceMotion = false } = {}) {
  const [value, setValue] = useState(target);
  const [counting, setCounting] = useState(false);
  const valueRef = useRef(target);
  const targetRef = useRef(target);
  const holdsRef = useRef(new Map());
  const initializedRef = useRef(ready);
  const rafRef = useRef(null);
  const settleTimerRef = useRef(null);
  const reduceRef = useRef(reduceMotion);
  reduceRef.current = reduceMotion;
  targetRef.current = target;

  const show = useCallback((v) => {
    if (v !== valueRef.current) {
      valueRef.current = v;
      setValue(v);
    }
  }, []);

  const pendingAmount = () => {
    let pending = 0;
    holdsRef.current.forEach((h) => { pending += h.total - h.revealed; });
    return pending;
  };
  const displayTarget = () => Math.max(0, targetRef.current - pendingAmount());

  const stopRoll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const rollTo = useCallback((to, duration) => {
    stopRoll();
    const from = valueRef.current;
    if (from === to) return;
    if (reduceRef.current || duration <= 0) { show(to); return; }
    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      show(Math.round(from + (to - from) * eased));
      rafRef.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    rafRef.current = requestAnimationFrame(step);
  }, [show]);

  useEffect(() => {
    if (!ready) return;
    if (!initializedRef.current) {
      // Primer valor real (usuario recién cargado): sin animación
      initializedRef.current = true;
      stopRoll();
      show(target);
      return;
    }
    clearTimeout(settleTimerRef.current);
    const to = displayTarget();
    if (to < valueRef.current) { rollTo(to, 350); return; }
    settleTimerRef.current = setTimeout(() => rollTo(displayTarget(), 650), SETTLE_DELAY_MS);
  }, [target, ready, rollTo, show]);

  const release = useCallback((id) => {
    const hold = holdsRef.current.get(id);
    if (!hold) return;
    clearTimeout(hold.timer);
    holdsRef.current.delete(id);
    if (holdsRef.current.size === 0) setCounting(false);
    rollTo(displayTarget(), 300);
  }, [rollTo]);

  const hold = useCallback((total, { holdMs = DEFAULT_HOLD_MS } = {}) => {
    const amount = Math.max(0, Math.round(total || 0));
    if (!amount) return null;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    clearTimeout(settleTimerRef.current);
    stopRoll();
    // Red de seguridad: si el vuelo nunca termina, no dejes el pill descontado
    const timer = setTimeout(() => release(id), holdMs);
    holdsRef.current.set(id, { total: amount, revealed: 0, timer });
    setCounting(true);
    show(displayTarget());
    return id;
  }, [release, show]);

  const reveal = useCallback((id, fraction) => {
    const h = holdsRef.current.get(id);
    if (!h) return;
    h.revealed = Math.min(h.total, Math.round(h.total * fraction));
    stopRoll();
    show(displayTarget());
  }, [show]);

  useEffect(() => () => {
    stopRoll();
    clearTimeout(settleTimerRef.current);
    holdsRef.current.forEach((h) => clearTimeout(h.timer));
  }, []);

  return { value, counting, hold, reveal, release };
}
