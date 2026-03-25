import { useCallback, useEffect, useRef, useState } from "react";

const coinCountForReward = (coins) => {
  if (coins <= 75)  return 5;
  if (coins <= 250) return 8;
  if (coins <= 700) return 11;
  return 14;
};

export default function useCoinFly() {
  const [flyCoins, setFlyCoins] = useState([]);
  const [particles, setParticles] = useState([]);

  // Track how many coins from a "batch" have arrived, keyed by batchId
  const batchRef = useRef({});
  const particleTimersRef = useRef(new Set());

  // Cleanup particle timers on unmount
  useEffect(() => {
    return () => { particleTimersRef.current.forEach(clearTimeout); };
  }, []);

  const triggerCoinFly = useCallback(({ fromX, fromY, toX, toY, coins, onAllArrived }) => {
    const coinCount = coinCountForReward(coins);
    const batchId = `batch_${Date.now()}`;

    batchRef.current[batchId] = { total: coinCount, arrived: 0, onAllArrived };

    const newCoins = Array.from({ length: coinCount }, (_, i) => ({
      id: `${batchId}_${i}`,
      batchId,
      fromX,
      fromY,
      toX,
      toY,
      delay: i * 55,
      cpY: Math.min(fromY, toY) - 130 - Math.random() * 50,
      cpX: (fromX + toX) / 2 + (Math.random() - 0.5) * 70,
      duration: 320 + Math.random() * 80,
    }));

    setFlyCoins((prev) => [...prev, ...newCoins]);
  }, []);

  // Accumulate arrivals and flush in a single setState per frame
  const pendingRemovals = useRef([]);
  const pendingParticles = useRef([]);
  const flushScheduled = useRef(false);

  const flushArrivals = useCallback(() => {
    flushScheduled.current = false;
    if (pendingRemovals.current.length > 0) {
      const ids = new Set(pendingRemovals.current);
      pendingRemovals.current = [];
      setFlyCoins((prev) => prev.filter((c) => !ids.has(c.id)));
    }
    if (pendingParticles.current.length > 0) {
      const newP = [...pendingParticles.current];
      pendingParticles.current = [];
      setParticles((prev) => [...prev, ...newP]);
      const tid = setTimeout(() => {
        particleTimersRef.current.delete(tid);
        const pIds = new Set(newP.map((p) => p.id));
        setParticles((prev) => prev.filter((p) => !pIds.has(p.id)));
      }, 400);
      particleTimersRef.current.add(tid);
    }
  }, []);

  const onCoinArrived = useCallback((id, batchId, x, y) => {
    // Queue removal + particle instead of immediate setState
    pendingRemovals.current.push(id);
    pendingParticles.current.push({ id: `p_${id}`, x, y });

    // Schedule a single flush per frame
    if (!flushScheduled.current) {
      flushScheduled.current = true;
      requestAnimationFrame(flushArrivals);
    }

    // Batch tracking
    const batch = batchRef.current[batchId];
    if (batch) {
      batch.arrived += 1;
      if (batch.arrived >= batch.total) {
        batch.onAllArrived?.();
        delete batchRef.current[batchId];
      }
    }
  }, [flushArrivals]);

  return { flyCoins, particles, triggerCoinFly, onCoinArrived };
}
