import { useCallback } from "react";
import useRewardFly from "./useRewardFly";

const coinCountForReward = (coins) => {
  if (coins <= 75)  return 5;
  if (coins <= 250) return 8;
  if (coins <= 700) return 11;
  return 14;
};

export default function useCoinFly() {
  const { items, particles, triggerFly, onArrived } = useRewardFly("coin", coinCountForReward);

  // API histórica: { fromX, fromY, toX, toY, coins, onAllArrived, onLanded? }
  const triggerCoinFly = useCallback(
    ({ coins, ...rest }) => triggerFly({ ...rest, amount: coins }),
    [triggerFly]
  );

  return { flyCoins: items, particles, triggerCoinFly, onCoinArrived: onArrived };
}
