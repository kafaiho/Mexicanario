import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";

const { width } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";
const GREEN = "#27AE60";
const RED = "#C0392B";

/**
 * ChallengesModal — shows pending challenges and history.
 *
 * Props:
 *   visible: boolean
 *   onClose: () => void
 *   onPlayChallenge: (challenge) => void — navigate to gameplay for this word
 */
export default function ChallengesModal({ visible, onClose, onPlayChallenge }) {
  const { userId } = useAuth();
  const [tab, setTab] = useState("pending"); // "pending" | "history"

  const pendingChallenges = useQuery(
    api.friends.getMyPendingChallenges,
    userId ? { userId } : "skip"
  );

  const challengeHistory = useQuery(
    api.friends.getChallengeHistory,
    userId && tab === "history" ? { userId } : "skip"
  );

  const TABS = [
    { key: "pending", label: "Pendientes" },
    { key: "history", label: "Historial" },
  ];

  const pendingCount = pendingChallenges?.length ?? 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Retos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, tab === t.key && styles.tabActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                  {t.label}
                  {t.key === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {tab === "pending" && (
              <PendingTab
                challenges={pendingChallenges}
                onPlay={onPlayChallenge}
              />
            )}
            {tab === "history" && (
              <HistoryTab
                history={challengeHistory}
                userId={userId}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Pending Challenges Tab ────────────────────────────────────────────────
function PendingTab({ challenges, onPlay }) {
  if (!challenges) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={AMBER} />
      </View>
    );
  }

  if (challenges.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>⚔️</Text>
        <Text style={styles.emptyTitle}>Sin retos pendientes</Text>
        <Text style={styles.emptyDesc}>
          Reta a tus cuates desde su perfil para competir.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {challenges.map((c) => {
        const timeLeft = Math.max(0, c.expiresAt - Date.now());
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        return (
          <View key={c.challengeId} style={styles.challengeCard}>
            <View style={styles.challengeRow}>
              <View style={styles.challengeAvatar}>
                <Text style={styles.challengeAvatarText}>{c.challengerAvatar}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.challengerName}>{c.challengerName}</Text>
                <Text style={styles.challengeWord}>te reta con: "{c.word}"</Text>
                <Text style={styles.challengeTimer}>
                  ⏱ {hoursLeft}h {minsLeft}m restantes
                </Text>
              </View>
              <View style={styles.challengeBetCol}>
                <Text style={styles.challengeBetLabel}>Apuesta</Text>
                <Text style={styles.challengeBetAmount}>🪙 {c.betCoins}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.acceptBtn}
              activeOpacity={0.8}
              onPress={() => onPlay?.(c)}
            >
              <Text style={styles.acceptBtnText}>Aceptar Reto</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────
function HistoryTab({ history, userId }) {
  if (!history) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={AMBER} />
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📜</Text>
        <Text style={styles.emptyTitle}>Sin historial</Text>
        <Text style={styles.emptyDesc}>
          Tus retos completados aparecerán aquí.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {history.map((h) => {
        const statusIcon = h.status === "expired"
          ? "⏰"
          : h.iWon
            ? "🏆"
            : "😢";
        const statusText = h.status === "expired"
          ? "Expirado"
          : h.iWon
            ? "¡Ganaste!"
            : "Perdiste";
        const statusColor = h.status === "expired"
          ? "#888"
          : h.iWon
            ? GREEN
            : RED;

        return (
          <View key={h.challengeId} style={styles.historyCard}>
            <View style={styles.challengeRow}>
              <View style={styles.challengeAvatar}>
                <Text style={styles.challengeAvatarText}>{h.opponentAvatar}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.challengerName}>
                  {h.iWasChallenger ? "Retaste a " : "Te retó "}{h.opponentName}
                </Text>
                <Text style={styles.challengeWord}>Palabra: "{h.word}"</Text>
              </View>
              <View style={styles.resultCol}>
                <Text style={{ fontSize: width * 0.06 }}>{statusIcon}</Text>
                <Text style={[styles.resultText, { color: statusColor }]}>
                  {statusText}
                </Text>
                {h.status === "completed" && (
                  <Text style={styles.rewardText}>
                    {h.iWon ? `+${h.betCoins * 2}` : `-${h.betCoins}`} 🪙
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: WHEAT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(210,105,30,0.2)",
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: width * 0.055,
    color: BROWN,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(139,69,19,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 18,
    color: BROWN,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(139,69,19,0.08)",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: AMBER,
  },
  tabText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.033,
    color: BROWN,
  },
  tabTextActive: {
    color: "#FFF",
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 30,
  },
  emptyEmoji: {
    fontSize: width * 0.12,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.045,
    color: BROWN,
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: FONTS.body,
    fontSize: width * 0.032,
    color: "#A0714F",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  challengeCard: {
    backgroundColor: "#FFF5E6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "rgba(210,105,30,0.25)",
  },
  challengeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  challengeAvatar: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    backgroundColor: WHEAT,
    borderWidth: 2,
    borderColor: AMBER,
    justifyContent: "center",
    alignItems: "center",
  },
  challengeAvatarText: {
    fontSize: width * 0.055,
  },
  challengerName: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.034,
    color: BROWN,
  },
  challengeWord: {
    fontFamily: FONTS.body,
    fontSize: width * 0.028,
    color: "#A0714F",
    marginTop: 2,
  },
  challengeTimer: {
    fontFamily: FONTS.body,
    fontSize: width * 0.025,
    color: RED,
    marginTop: 3,
  },
  challengeBetCol: {
    alignItems: "center",
    marginLeft: 8,
  },
  challengeBetLabel: {
    fontFamily: FONTS.body,
    fontSize: width * 0.022,
    color: "#A0714F",
  },
  challengeBetAmount: {
    fontFamily: FONTS.display,
    fontSize: width * 0.035,
    color: GOLD,
  },
  acceptBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1E8449",
  },
  acceptBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.036,
    color: "#FFF",
  },
  historyCard: {
    backgroundColor: "#FFF5E6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(210,105,30,0.15)",
  },
  resultCol: {
    alignItems: "center",
    marginLeft: 8,
  },
  resultText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.026,
    marginTop: 2,
  },
  rewardText: {
    fontFamily: FONTS.display,
    fontSize: width * 0.025,
    color: GOLD,
    marginTop: 2,
  },
});
