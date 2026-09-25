import { useCallback, useEffect, useRef, useState } from "react";
import { tapLight, tapMedium } from "../services/haptics";
import { playSound } from "../utils/soundManager";

// ── Reward fly (monedas / diamantes) ────────────────────────────────────────
// Cada pieza hace: explosión en abanico desde el origen → pausa breve →
// vuelo "magnético" (acelera al final) hacia el contador. Las llegadas
// escalonadas disparan un "tin" cada vez más agudo + vibración ligera, y
// `onLanded(fraction)` permite que el contador suba en sincronía.

const KIND_CONFIG = {
  coin: {
    stagger: 45,
    lift: [60, 120],
    burstRadius: [34, 78],
    duration: [380, 460],
    size: [22, 30],
    landSound: "coin",
    baseRate: 1,
    rateStep: 0.05,
  },
  diamond: {
    stagger: 80,
    lift: [80, 140],
    burstRadius: [30, 64],
    duration: [460, 560],
    size: [24, 30],
    landSound: "coin",
    baseRate: 1.35,
    rateStep: 0.06,
  },
};

const rand = ([min, max]) => min + Math.random() * (max - min);

export default function useRewardFly(kind, countForAmount) {
  const cfg = KIND_CONFIG[kind];
  const [items, setItems] = useState([]);
  const [particles, setParticles] = useState([]);

  const batchRef = useRef({});
  const particleTimersRef = useRef(new Set());

  useEffect(() => {
    return () => { particleTimersRef.current.forEach(clearTimeout); };
  }, []);

  const triggerFly = useCallback(({ fromX, fromY, toX, toY, amount, onAllArrived, onLanded }) => {
    const count = countForAmount(amount);
    const batchId = `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    batchRef.current[batchId] = { total: count, arrived: 0, onAllArrived, onLanded };

    // Abanico uniforme con jitter: se ve como explosión, no como fila
    const angleOffset = Math.random() * Math.PI * 2;
    const newItems = Array.from({ length: count }, (_, i) => {
      const angle = angleOffset + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const r = rand(cfg.burstRadius);
      const burstX = Math.cos(angle) * r;
      const burstY = Math.sin(angle) * r * 0.8 - 12; // ligeramente hacia arriba
      const startX = fromX + burstX;
      const startY = fromY + burstY;
      return {
        id: `${batchId}_${i}`,
        batchId,
        kind,
        index: i,
        fromX,
        fromY,
        toX,
        toY,
        burstX,
        burstY,
        cpX: (startX + toX) / 2 + (Math.random() - 0.5) * 90,
        cpY: Math.min(startY, toY) - rand(cfg.lift),
        burstDelay: Math.random() * 60,
        holdDelay: 110 + i * cfg.stagger,
        duration: rand(cfg.duration),
        size: rand(cfg.size),
        spinDir: Math.random() < 0.5 ? -1 : 1,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
  }, [kind, countForAmount, cfg]);

  // Acumula llegadas y hace un solo setState por frame
  const pendingRemovals = useRef([]);
  const pendingParticles = useRef([]);
  const flushScheduled = useRef(false);

  const flushArrivals = useCallback(() => {
    flushScheduled.current = false;
    if (pendingRemovals.current.length > 0) {
      const ids = new Set(pendingRemovals.current);
      pendingRemovals.current = [];
      setItems((prev) => prev.filter((c) => !ids.has(c.id)));
    }
    if (pendingParticles.current.length > 0) {
      const newP = [...pendingParticles.current];
      pendingParticles.current = [];
      setParticles((prev) => [...prev, ...newP]);
      const tid = setTimeout(() => {
        particleTimersRef.current.delete(tid);
        const pIds = new Set(newP.map((p) => p.id));
        setParticles((prev) => prev.filter((p) => !pIds.has(p.id)));
      }, 520);
      particleTimersRef.current.add(tid);
    }
  }, []);

  const onArrived = useCallback((id, batchId, x, y) => {
    const batch = batchRef.current[batchId];
    const arrivedIndex = batch ? batch.arrived : 0;
    const isLast = batch ? arrivedIndex + 1 >= batch.total : false;

    pendingRemovals.current.push(id);
    pendingParticles.current.push({ id: `p_${id}`, x, y, big: isLast, kind });
    if (!flushScheduled.current) {
      flushScheduled.current = true;
      requestAnimationFrame(flushArrivals);
    }

    // Tono ascendente: cada moneda suena un poco más aguda (efecto "tragamonedas")
    playSound(cfg.landSound, Math.min(2, cfg.baseRate + arrivedIndex * cfg.rateStep));
    if (isLast) tapMedium();
    else if (arrivedIndex % 2 === 0) tapLight();

    if (batch) {
      batch.arrived += 1;
      batch.onLanded?.(batch.arrived / batch.total);
      if (batch.arrived >= batch.total) {
        batch.onAllArrived?.();
        delete batchRef.current[batchId];
      }
    }
  }, [flushArrivals, kind, cfg]);

  return { items, particles, triggerFly, onArrived };
}
