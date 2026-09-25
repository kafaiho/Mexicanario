import { useEffect, useState } from "react";

// Cuenta de 0 a `target` cuando `active` es true (ease-out). Con reduceMotion
// muestra el valor final de inmediato.
export default function useCountUp(target, { active = true, duration = 700, delay = 0, reduceMotion = false } = {}) {
  const [value, setValue] = useState(active && !reduceMotion ? 0 : target);

  useEffect(() => {
    if (!active) { setValue(0); return undefined; }
    if (reduceMotion || !target) { setValue(target); return undefined; }
    let raf = null;
    setValue(0);
    const timer = setTimeout(() => {
      const start = Date.now();
      const step = () => {
        const t = Math.min(1, (Date.now() - start) / duration);
        setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
        raf = t < 1 ? requestAnimationFrame(step) : null;
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, active, duration, delay, reduceMotion]);

  return value;
}
