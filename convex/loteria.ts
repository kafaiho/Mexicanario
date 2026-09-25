import { createMinigameRanking } from "./minigameRanking";

// Ranking de Lotería Express (30 segundos, con bonos por racha).
// Mismas funciones de siempre (submitScore, getLeaderboard, getMyBest) más getMyRank;
// la lógica compartida vive en minigameRanking.ts.
export const { submitScore, getLeaderboard, getMyBest, getMyRank } = createMinigameRanking("loteriaScores", {
  maxScore: 500,
  defaultAvatar: "🌮",
});
