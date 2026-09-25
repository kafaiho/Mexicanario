import { createMinigameRanking } from "./minigameRanking";

// Ranking de Duelo de Albures (aciertos por partida).
// Mismas funciones de siempre (submitScore, getLeaderboard, getMyBest) más getMyRank;
// la lógica compartida vive en minigameRanking.ts.
export const { submitScore, getLeaderboard, getMyBest, getMyRank } = createMinigameRanking("alburesScores", {
  maxScore: 50,
  defaultAvatar: "🌮",
});
