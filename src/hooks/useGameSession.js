import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useGameSession(userId) {
  // Get current session and level
  const currentSession = useQuery(api.gameSessions.getCurrentSession, userId ? { userId } : "skip");
  const levelInfo = useQuery(api.levels.getCurrentLevel, userId ? { userId } : "skip");
  
  // Mutations
  const startSession = useMutation(api.gameSessions.startGameSession);
  const updateSession = useMutation(api.gameSessions.updateGameSession);

  const startNewGame = async () => {
    try {
      // Wait for level info to be available
      if (!levelInfo) {
        return null;
      }

      // If we're in default level mode and no userId, just return the level info
      if (levelInfo.isDefaultLevel && !userId) {
        return {
          sessionId: null,
          word: levelInfo.word,
          mexican_word: levelInfo.mexican_word,
          definition: levelInfo.definition,
          isDefaultLevel: true,
        };
      }

      // Start a new game session if we have a userId
      if (userId) {
        const sessionId = await startSession({ userId });

        // Update session with active status
        await updateSession({
          sessionId,
          status: "active",
        });

        return {
          sessionId,
          word: levelInfo.word,
          mexican_word: levelInfo.mexican_word,
          definition: levelInfo.definition,
          isDefaultLevel: false,
        };
      }

      return null;
    } catch (error) {
      if (__DEV__) console.error("Error in startNewGame:", error);
      throw error;
    }
  };

  const endGame = async (sessionId) => {
    try {
      if (!sessionId) return; // Skip if no session (default level mode)

      await updateSession({
        sessionId,
        status: "completed",
      });
    } catch (error) {
      if (__DEV__) console.error("Error ending game:", error);
      throw error;
    }
  };

  return {
    currentSession,
    startNewGame,
    endGame,
    currentLevel: levelInfo,
  };
}