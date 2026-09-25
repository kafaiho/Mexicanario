import React from "react";
import RewardFlyOverlay from "./RewardFlyOverlay";

// Wrapper con la API histórica (diamonds / onDiamondArrived) sobre RewardFlyOverlay.
function DiamondFlyOverlay({ diamonds, particles, onDiamondArrived }) {
    return <RewardFlyOverlay items={diamonds} particles={particles} onArrived={onDiamondArrived} zIndex={9999} />;
}

export default React.memo(DiamondFlyOverlay);
