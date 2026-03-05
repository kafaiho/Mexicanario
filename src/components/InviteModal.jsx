import { useQuery } from "convex/react";
import React, { useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const BROWN  = "#8B4513";
const ORANGE = "#FF6B35";
const AMBER  = "#D2691E";
const GOLD   = "#F8BE17";
const GREEN  = "#2ECC71";

// Milestones shown in the vertical bar (must match backend MILESTONES)
const MILESTONES = [
  { count: 5,  emoji: "🌮", title: "Corredor de Voz",      reward: "+500 🪙 +2 💎" },
  { count: 10, emoji: "🎺", title: "Embajador del Barrio",  reward: "+1,000 🪙 +5 💎" },
  { count: 25, emoji: "🦅", title: "El Mero Influencer",    reward: "+2,000 🪙 +15 💎" },
  { count: 50, emoji: "🏆", title: "Leyenda del Barrio",    reward: "+3,000 🪙 +30 💎" },
];

function getNextMilestone(count) {
  return MILESTONES.find((m) => m.count > count) ?? null;
}

function barPositionForCount(count) {
  const max = MILESTONES[MILESTONES.length - 1].count;
  return Math.min(count / max, 1);
}

export default function InviteModal({ visible, onClose }) {
  const { userId } = useAuth();
  const stats = useQuery(
    api.referrals.getReferralStats,
    userId ? { userId } : "skip"
  );

  const fillAnim = useRef(new Animated.Value(0)).current;
  const count = stats?.referralCount ?? 0;
  const username = stats?.username ?? null;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(fillAnim, {
      toValue: barPositionForCount(count),
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [visible, count]);

  const BAR_HEIGHT = height * 0.42;

  const handleShare = async () => {
    if (!username) {
      onClose();
      return;
    }
    const refLink = `mexicanario://ref?ref=${username}`;
    const message =
      `¡Juega Mexicanario conmigo! 🇲🇽🌮\n` +
      `Aprende el slang mexicano más chido.\n` +
      `Descárgalo y usa mi link para que ambos ganemos monedas:\n${refLink}`;
    try {
      await Share.share({ message, url: refLink });
    } catch {}
  };

  const nextM = getNextMilestone(count);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>

          {/* ── Header ── */}
          <View style={s.header}>
            <Text style={s.title}>Invita y Gana 📣</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* ── Banner cuates actuales ── */}
          <View style={s.rankBanner}>
            <Text style={s.rankEmoji}>
              {count === 0 ? "🤝" : count < 5 ? "🌮" : count < 10 ? "🎺" : count < 25 ? "🦅" : "🏆"}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rankTitle}>
                {count === 1 ? "1 cuate invitado" : `${count} cuates invitados`}
              </Text>
              <Text style={s.rankDesc}>
                {nextM
                  ? `Faltan ${nextM.count - count} para «${nextM.title}»`
                  : "¡Leyenda máxima alcanzada! 👑"}
              </Text>
            </View>
          </View>

          {/* ── Recompensa info ── */}
          <View style={s.rewardRow}>
            <View style={s.rewardPill}>
              <Text style={s.rewardPillText}>Tú ganas: +300 🪙 por cuate</Text>
            </View>
            <View style={[s.rewardPill, { backgroundColor: "#E8F5E9" }]}>
              <Text style={[s.rewardPillText, { color: "#2E7D32" }]}>Tu cuate: +200 🪙</Text>
            </View>
          </View>

          {/* ── Compartir button ── */}
          {username ? (
            <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
              <Text style={s.shareBtnText}>📲 Compartir mi link</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.noUsernameBanner}>
              <Text style={s.noUsernameText}>
                ⚠️ Elige un nombre de usuario en tu Perfil para poder invitar cuates
              </Text>
            </View>
          )}

          {/* ── Milestone bar (Mexicanómetro style) ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
          >
            <View style={[s.meterRow, { minHeight: BAR_HEIGHT }]}>

              {/* Vertical fill bar */}
              <View style={s.barTrack}>
                <Animated.View
                  style={[
                    s.barFill,
                    {
                      height: fillAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
                {/* Current position indicator */}
                <View
                  style={[
                    s.posIndicator,
                    { bottom: `${Math.min(barPositionForCount(count) * 100, 96)}%` },
                  ]}
                >
                  <View style={s.posCircle}>
                    <Text style={s.posText}>{count}</Text>
                  </View>
                </View>
              </View>

              {/* Milestone cards */}
              <View style={s.milestoneList}>
                {[...MILESTONES].reverse().map((m) => {
                  const unlocked = count >= m.count;
                  return (
                    <View key={m.count} style={s.milestoneRow}>
                      <Text style={[s.mLevel, unlocked && s.mLevelUnlocked]}>
                        {m.count}
                      </Text>
                      <View style={[s.dot, unlocked && s.dotUnlocked]} />
                      <View style={[s.card, !unlocked && s.cardLocked]}>
                        {unlocked ? (
                          <>
                            <Text style={s.cardEmoji}>{m.emoji}</Text>
                            <View style={s.cardText}>
                              <Text style={s.cardTitle}>{m.title}</Text>
                              <Text style={s.cardDesc}>{m.reward}</Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <Text style={s.lockIcon}>🔒</Text>
                            <View style={s.cardText}>
                              <Text style={[s.cardTitle, { color: "#B09070" }]}>{m.title}</Text>
                              <Text style={[s.cardDesc, { color: "#C4A882" }]}>{m.reward}</Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#FFE4B5",
    borderRadius: width * 0.05,
    width: width * 0.88,
    maxHeight: height * 0.85,
    paddingBottom: height * 0.02,
    overflow: "hidden",
    borderWidth: width * 0.01,
    borderColor: BROWN,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.022,
    paddingBottom: height * 0.012,
    borderBottomWidth: 2,
    borderBottomColor: "#D2691E55",
  },
  title: { color: BROWN, fontWeight: "bold", fontSize: width * 0.053 },
  closeBtn: {
    width: width * 0.085,
    height: width * 0.085,
    borderRadius: width * 0.0425,
    backgroundColor: ORANGE,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { color: "#fff", fontSize: width * 0.058, fontWeight: "bold", lineHeight: width * 0.068 },
  rankBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.03,
    backgroundColor: "#F5DEB3",
    marginHorizontal: width * 0.04,
    marginTop: height * 0.015,
    borderRadius: width * 0.04,
    padding: width * 0.035,
    borderWidth: 2,
    borderColor: AMBER,
  },
  rankEmoji: { fontSize: width * 0.09 },
  rankTitle: { color: BROWN, fontWeight: "bold", fontSize: width * 0.042 },
  rankDesc:  { color: "#7A4020", fontSize: width * 0.029, marginTop: height * 0.003 },
  rewardRow: {
    flexDirection: "row",
    gap: width * 0.02,
    marginHorizontal: width * 0.04,
    marginTop: height * 0.012,
  },
  rewardPill: {
    flex: 1,
    backgroundColor: "#FFF3CD",
    borderRadius: width * 0.03,
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.02,
    borderWidth: 1.5,
    borderColor: AMBER,
    alignItems: "center",
  },
  rewardPillText: { color: BROWN, fontWeight: "bold", fontSize: width * 0.029 },
  shareBtn: {
    backgroundColor: GREEN,
    marginHorizontal: width * 0.04,
    marginTop: height * 0.014,
    borderRadius: width * 0.04,
    paddingVertical: height * 0.016,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#27AE60",
  },
  shareBtnText: { color: "#fff", fontWeight: "bold", fontSize: width * 0.042 },
  noUsernameBanner: {
    backgroundColor: "#FFF8E1",
    marginHorizontal: width * 0.04,
    marginTop: height * 0.014,
    borderRadius: width * 0.04,
    padding: width * 0.04,
    borderWidth: 1.5,
    borderColor: AMBER,
  },
  noUsernameText: { color: BROWN, fontSize: width * 0.031, textAlign: "center" },
  scroll: { paddingHorizontal: width * 0.04, paddingBottom: height * 0.01, paddingTop: height * 0.014 },
  meterRow: { flexDirection: "row", gap: width * 0.02 },
  barTrack: {
    width: width * 0.025,
    backgroundColor: "#DEB887",
    borderRadius: width * 0.02,
    marginTop: height * 0.012,
    position: "relative",
    overflow: "visible",
  },
  barFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AMBER,
    borderRadius: width * 0.02,
  },
  posIndicator: {
    position: "absolute",
    left: width * -0.058,
    alignItems: "center",
  },
  posCircle: {
    backgroundColor: BROWN,
    borderRadius: width * 0.042,
    minWidth: width * 0.085,
    paddingHorizontal: width * 0.015,
    paddingVertical: height * 0.005,
    alignItems: "center",
  },
  posText: { color: "#fff", fontWeight: "bold", fontSize: width * 0.029 },
  milestoneList: { flex: 1, gap: 0 },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.015,
    marginBottom: height * 0.017,
  },
  mLevel: { color: "#C4A882", fontWeight: "bold", fontSize: width * 0.034, width: width * 0.075, textAlign: "right" },
  mLevelUnlocked: { color: BROWN },
  dot: {
    width: width * 0.037,
    height: width * 0.037,
    borderRadius: width * 0.0185,
    backgroundColor: "#D2A679",
    borderWidth: 2,
    borderColor: "#B8926A",
  },
  dotUnlocked: { backgroundColor: GOLD, borderColor: "#C8950A" },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.025,
    backgroundColor: "#F5DEB3",
    borderRadius: width * 0.037,
    padding: width * 0.025,
    minHeight: height * 0.065,
    borderWidth: 1.5,
    borderColor: "#D2A679",
  },
  cardLocked: { backgroundColor: "#E8C99A", borderColor: "#C4A882" },
  cardEmoji: { fontSize: width * 0.074 },
  cardText:  { flex: 1 },
  cardTitle: { color: BROWN, fontWeight: "bold", fontSize: width * 0.037 },
  cardDesc:  { color: "#7A4020", fontSize: width * 0.029, marginTop: height * 0.001 },
  lockIcon:  { fontSize: width * 0.063 },
});
