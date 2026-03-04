import { useCallback, useRef, useState } from "react";

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
      delay: i * 130,
      cpY: Math.min(fromY, toY) - 130 - Math.random() * 50,
      cpX: (fromX + toX) / 2 + (Math.random() - 0.5) * 70,
      duration: 1100 + Math.random() * 400,
    }));

    setFlyCoins((prev) => [...prev, ...newCoins]);
  }, []);

  const onCoinArrived = useCallback((id, batchId, x, y) => {
    // Remove coin
    setFlyCoins((prev) => prev.filter((c) => c.id !== id));

    // Particle burst at impact point
    const pId = `p_${Date.now()}_${Math.random()}`;
    setParticles((prev) => [...prev, { id: pId, x, y }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== pId));
    }, 500);

    // Batch tracking
    const batch = batchRef.current[batchId];
    if (batch) {
      batch.arrived += 1;
      if (batch.arrived >= batch.total) {
        batch.onAllArrived?.();
        delete batchRef.current[batchId];
      }
    }
  }, []);

  return { flyCoins, particles, triggerCoinFly, onCoinArrived };
}
