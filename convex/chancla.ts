import { createMinigameRanking } from "./minigameRanking";

// Ranking de Esquiva la Chancla (sin fin, 3 vidas; puntos con racha y reflejos).
// Tope holgado: máx. 225 puntos por esquive (x5 racha, bono de reflejos, chancla dorada).
export const { submitScore, getLeaderboard, getMyBest, getMyRank } = createMinigameRanking("chanclaScores", {
  maxScore: 100000,
  defaultAvatar: "🌮",
});
