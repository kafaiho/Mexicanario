import { useCallback, useRef, useState } from "react";

const diamondCountForReward = (diamonds) => {
    if (diamonds <= 3) return 3;
    if (diamonds <= 10) return 6;
    if (diamonds <= 50) return 9;
    return 12;
};

export default function useDiamondFly() {
    const [flyDiamonds, setFlyDiamonds] = useState([]);
    const [diamondParticles, setDiamondParticles] = useState([]);

    // Track how many diamonds from a "batch" have arrived, keyed by batchId
    const batchRef = useRef({});

    const triggerDiamondFly = useCallback(({ fromX, fromY, toX, toY, diamonds, onAllArrived }) => {
        const diamondCount = diamondCountForReward(diamonds);
        const batchId = `batch_d_${Date.now()}`;

        batchRef.current[batchId] = { total: diamondCount, arrived: 0, onAllArrived };

        const newDiamonds = Array.from({ length: diamondCount }, (_, i) => ({
            id: `${batchId}_${i}`,
            batchId,
            fromX,
            fromY,
            toX,
            toY,
            delay: i * 150, // Ligeramente más pausado que las monedas
            cpY: Math.min(fromY, toY) - 150 - Math.random() * 60,
            cpX: (fromX + toX) / 2 + (Math.random() - 0.5) * 80,
            duration: 1200 + Math.random() * 400,
        }));

        setFlyDiamonds((prev) => [...prev, ...newDiamonds]);
    }, []);

    const onDiamondArrived = useCallback((id, batchId, x, y) => {
        // Remove diamond
        setFlyDiamonds((prev) => prev.filter((d) => d.id !== id));

        // Particle burst at impact point
        const pId = `p_d_${Date.now()}_${Math.random()}`;
        setDiamondParticles((prev) => [...prev, { id: pId, x, y }]);
        setTimeout(() => {
            setDiamondParticles((prev) => prev.filter((p) => p.id !== pId));
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

    return { flyDiamonds, diamondParticles, triggerDiamondFly, onDiamondArrived };
}
