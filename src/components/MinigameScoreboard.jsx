import { useQuery } from "convex/react";
import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { tick } from "../services/haptics";
import { TABLET_MODE } from "../utils/tabletSetup";

const { width } = Dimensions.get("window");
const W = TABLET_MODE ? Math.min(width, 420) : width;

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT2 = "#F5DEB3";

const TABS = [
  { key: "daily", label: "🔥 Hoy" },
  { key: "weekly", label: "📅 Semana" },
  { key: "alltime", label: "🏆 Total" },
];

function rankLabel(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

/**
 * MinigameScoreboard — récords personales + marcador (Hoy/Semana/Total)
 * compartido por los minijuegos.
 *
 * Props:
 *   game        – módulo de Convex con getLeaderboard (p. ej. api.taquero)
 *   userId      – para resaltar tu fila
 *   myBest      – resultado de game.getMyBest ({ daily, weekly, allTime })
 *   formatScore – (score) => texto de la columna de puntaje
 *   newRecord   – muestra la insignia de "¡Nuevo récord!"
 */
export default function MinigameScoreboard({ game, userId, myBest, formatScore, newRecord = false }) {
  const [tab, setTab] = useState("daily");
  const leaderboard = useQuery(game.getLeaderboard, { type: tab });
  // Tu lugar aunque no salgas en el top 20 («Vas #57 de 312»).
  const myRanks = useQuery(game.getMyRank ?? game.getLeaderboard, game.getMyRank && userId ? { userId } : "skip");
  const myRank = myRanks?.[tab] ?? null;
  const shownInList = !!leaderboard?.some((entry) => entry.userId === userId);

  return (
    <View style={styles.root}>
      {newRecord && (
        <View style={styles.recordBadge}>
          <Text style={styles.recordText}>🏆 ¡Nuevo récord personal!</Text>
        </View>
      )}

      {myBest && (
        <View style={styles.myBestRow}>
          <View style={styles.myBestItem}><Text style={styles.myBestVal}>{myBest.daily}</Text><Text style={styles.myBestLabel}>🔥 Hoy</Text></View>
          <View style={styles.myBestItem}><Text style={styles.myBestVal}>{myBest.weekly}</Text><Text style={styles.myBestLabel}>📅 Semana</Text></View>
          <View style={styles.myBestItem}><Text style={styles.myBestVal}>{myBest.allTime}</Text><Text style={styles.myBestLabel}>🏆 Total</Text></View>
        </View>
      )}

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => { tick(); setTab(t.key); }}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.lbList}>
        {!leaderboard ? (
          <Text style={styles.lbLoading}>Cargando...</Text>
        ) : leaderboard.length === 0 ? (
          <Text style={styles.lbEmpty}>¡Sé el primero en el marcador!</Text>
        ) : leaderboard.map((entry) => {
          const isMe = entry.userId === userId;
          return (
            <View key={entry.userId} style={[styles.lbRow, isMe && styles.lbRowMe]}>
              <Text style={styles.lbRank}>{rankLabel(entry.rank)}</Text>
              <Text style={styles.lbAvatar}>{entry.avatar}</Text>
              <Text style={styles.lbName} numberOfLines={1}>{entry.name}</Text>
              <Text style={styles.lbScore}>{formatScore(entry.score)}</Text>
            </View>
          );
        })}
        {myRank && !shownInList && (
          <View style={[styles.lbRow, styles.lbRowMe, styles.myRankRow]}>
            <Text style={styles.lbRank}>#{myRank.rank}</Text>
            <Text style={styles.lbName} numberOfLines={1}>
              Tú · de {myRank.capped ? `${myRank.players}+` : myRank.players} jugadores
            </Text>
            <Text style={styles.lbScore}>{formatScore(myRank.score)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },

  recordBadge: { alignSelf: "center", backgroundColor: GOLD, borderRadius: 20, borderWidth: 2, borderColor: AMBER, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 12 },
  recordText: { color: BROWN, fontWeight: "900", fontSize: W * 0.034 },

  myBestRow: { flexDirection: "row", width: "100%", backgroundColor: WHEAT2, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.3)", marginBottom: 14, overflow: "hidden" },
  myBestItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  myBestVal: { fontSize: W * 0.062, fontWeight: "900", color: BROWN },
  myBestLabel: { fontSize: W * 0.028, color: AMBER, fontWeight: "700", marginTop: 2 },

  tabRow: { flexDirection: "row", width: "100%", backgroundColor: WHEAT2, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.25)", marginBottom: 10, overflow: "hidden" },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: "center" },
  tabBtnActive: { backgroundColor: AMBER },
  tabText: { fontSize: W * 0.03, fontWeight: "700", color: AMBER },
  tabTextActive: { color: "#fff" },

  lbList: { width: "100%", marginBottom: 14 },
  lbLoading: { color: AMBER, textAlign: "center", fontSize: W * 0.035, paddingVertical: 12 },
  lbEmpty: { color: AMBER, textAlign: "center", fontSize: W * 0.033, paddingVertical: 12, fontWeight: "600" },
  lbRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, marginBottom: 4, backgroundColor: WHEAT2, borderWidth: 1, borderColor: "rgba(139,69,19,0.15)", gap: 8 },
  lbRowMe: { backgroundColor: "#FFF8DC", borderColor: GOLD, borderWidth: 2 },
  myRankRow: { marginTop: 6 },
  lbRank: { width: 32, textAlign: "center", fontSize: W * 0.035, fontWeight: "900", color: BROWN },
  lbAvatar: { fontSize: W * 0.055 },
  lbName: { flex: 1, fontSize: W * 0.033, fontWeight: "700", color: BROWN },
  lbScore: { fontSize: W * 0.035, fontWeight: "900", color: AMBER },
});
