import { useMutation, useQuery } from "convex/react";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";
import { useUserMutation } from "../hooks/useUserMutation";

const { width, height } = Dimensions.get("window");

const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function DailyMiniWidget() {
  const { userId } = useAuth();
  const miniStatus = useQuery(
    api.league.getDailyMiniStatus,
    userId ? { userId } : "skip"
  );
  const assignMini  = useUserMutation(api.league.assignDailyMiniGroup);
  const claimReward = useUserMutation(api.league.claimDailyMiniReward);

  if (!userId) return null;

  if (!miniStatus || !miniStatus.assigned) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Reto Diario</Text>
        <Text style={styles.subtitle}>Compite contra 4 jugadores hoy</Text>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => assignMini({ userId })}
        >
          <Text style={styles.joinButtonText}>Unirme</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { players, myRank, reward, claimed, myCxp } = miniStatus;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reto Diario</Text>
        <Text style={styles.myScore}>{myCxp} cXP</Text>
      </View>

      {/* Mini leaderboard */}
      {players?.map((p) => (
        <View
          key={p.userId}
          style={[styles.playerRow, p.isCurrentUser && styles.currentUserRow]}
        >
          <Text style={styles.miniRank}>
            {p.rank <= 3 ? RANK_MEDALS[p.rank - 1] : `${p.rank}`}
          </Text>
          <Text style={styles.miniAvatar}>{p.avatar}</Text>
          <Text
            style={[styles.miniName, p.isCurrentUser && styles.miniNameBold]}
            numberOfLines={1}
          >
            {p.isCurrentUser ? "Tú ★" : p.name}
          </Text>
          <Text style={[styles.miniCxp, p.isCurrentUser && styles.miniCxpBold]}>
            {p.cxpToday}
          </Text>
        </View>
      ))}

      {/* Reward */}
      <View style={styles.rewardSection}>
        {claimed ? (
          <Text style={styles.claimedText}>✓ Recompensa reclamada: {reward} monedas</Text>
        ) : (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => claimReward({ userId })}
          >
            <Text style={styles.claimButtonText}>
              Reclamar {reward} 🪙
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFE4B5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(139,69,19,0.35)',
    padding: width * 0.04,
    marginBottom: height * 0.015,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(210,105,30,0.3)',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: width * 0.042,
    color: BROWN,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: width * 0.032,
    color: '#7A4020',
    marginBottom: 12,
  },
  myScore: {
    fontFamily: FONTS.display,
    fontSize: width * 0.035,
    color: AMBER,
  },

  // Player rows
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 2,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  currentUserRow: {
    borderLeftColor: GOLD,
    backgroundColor: 'rgba(248,190,23,0.08)',
  },
  miniRank: {
    width: 30,
    fontFamily: FONTS.display,
    fontSize: width * 0.033,
    textAlign: "center",
    color: BROWN,
  },
  miniAvatar: {
    fontSize: width * 0.035,
    marginRight: 8,
  },
  miniName: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: width * 0.032,
    color: BROWN,
  },
  miniNameBold: {
    fontFamily: FONTS.bodyBold,
    color: '#5C2E00',
  },
  miniCxp: {
    fontFamily: FONTS.display,
    fontSize: width * 0.032,
    color: AMBER,
  },
  miniCxpBold: {
    color: '#B35A00',
  },

  // Reward section
  rewardSection: {
    marginTop: 10,
    alignItems: "center",
  },
  joinButton: {
    backgroundColor: GOLD,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C8950A',
    paddingVertical: 10,
    alignItems: "center",
  },
  joinButtonText: {
    fontFamily: FONTS.bodyBold,
    color: '#523600',
    fontSize: width * 0.038,
  },
  claimButton: {
    backgroundColor: GOLD,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C8950A',
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  claimButtonText: {
    fontFamily: FONTS.bodyBold,
    color: '#523600',
    fontSize: width * 0.032,
  },
  claimedText: {
    fontFamily: FONTS.bodyBold,
    color: '#27AE60',
    fontSize: width * 0.03,
  },
});
