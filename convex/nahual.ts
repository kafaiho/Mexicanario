import { createMinigameRanking } from "./minigameRanking";

// Ranking de Corre Nahual (carrera sin fin, el puntaje crece con la distancia).
// Mismas funciones de siempre (submitScore, getLeaderboard, getMyBest) más getMyRank;
// la lógica compartida vive en minigameRanking.ts.
export const { submitScore, getLeaderboard, getMyBest, getMyRank } = createMinigameRanking("nahualScores", {
  maxScore: 10000,
  defaultAvatar: "🌮",
});
