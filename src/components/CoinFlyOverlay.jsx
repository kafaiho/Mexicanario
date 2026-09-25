import React from "react";
import RewardFlyOverlay from "./RewardFlyOverlay";

// Wrapper con la API histórica (coins / onCoinArrived) sobre RewardFlyOverlay.
function CoinFlyOverlay({ coins, particles, onCoinArrived }) {
  return <RewardFlyOverlay items={coins} particles={particles} onArrived={onCoinArrived} zIndex={999} />;
}

export default React.memo(CoinFlyOverlay);
