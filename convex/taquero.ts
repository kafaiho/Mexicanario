import { createMinigameRanking } from "./minigameRanking";

// Ranking de Taquero Rush (tacos servidos contra reloj).
// Mismas funciones de siempre (submitScore, getLeaderboard, getMyBest) más getMyRank;
// la lógica compartida vive en minigameRanking.ts.
export const { submitScore, getLeaderboard, getMyBest, getMyRank } = createMinigameRanking("taqueroScores", {
  maxScore: 500,
  defaultAvatar: "🌮",
});
