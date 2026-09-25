import { useCallback } from "react";
import useRewardFly from "./useRewardFly";

const diamondCountForReward = (diamonds) => {
    if (diamonds <= 3) return 3;
    if (diamonds <= 10) return 6;
    if (diamonds <= 50) return 9;
    return 12;
};

export default function useDiamondFly() {
    const { items, particles, triggerFly, onArrived } = useRewardFly("diamond", diamondCountForReward);

    // API histórica: { fromX, fromY, toX, toY, diamonds, onAllArrived, onLanded? }
    const triggerDiamondFly = useCallback(
        ({ diamonds, ...rest }) => triggerFly({ ...rest, amount: diamonds }),
        [triggerFly]
    );

    return { flyDiamonds: items, diamondParticles: particles, triggerDiamondFly, onDiamondArrived: onArrived };
}
