import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "react-native-reanimated";
import useCountUp from "../hooks/useCountUp";
import { notifySuccess, tapHeavy, tapLight, tapMedium } from "../services/haptics";
import { playSound } from "../utils/soundManager";
import ConfettiBurst from "./ConfettiBurst";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FONTS } from "../theme/designTokens";

const { width } = Dimensions.get("window");

const GOLD = "#F8BE17";
const GREEN = "#27AE60";
const RED = "#C0392B";
const AMBER = "#D2691E";

// ELO tier lookup (duplicated from pvp.ts for client use)
const ELO_TIERS = [
  { min: 0, max: 799, name: "Nopal", emoji: "🌵", color: "#4A7C59" },
  { min: 800, max: 999, name: "Obsidiana", emoji: "⬛", color: "#2C2C2C" },
  { min: 1000, max: 1199, name: "Copal", emoji: "💨", color: "#8B7355" },
  { min: 1200, max: 1399, name: "Cenote", emoji: "💧", color: "#2196F3" },
  { min: 1400, max: 1599, name: "Jade", emoji: "💎", color: "#00C853" },
  { min: 1600, max: 1799, name: "Quetzal", emoji: "🦜", color: "#00BFA5" },
  { min: 1800, max: 1999, name: "Jaguar", emoji: "🐆", color: "#D4A017" },
  { min: 2000, max: Infinity, name: "Tonatiuh", emoji: "👑", color: "#FFD700" },
];

function getEloTier(elo) {
  return ELO_TIERS.find((t) => elo >= t.min && elo <= t.max) ?? ELO_TIERS[0];
}

export default function PvPResultModal({
  visible,
  matchState,
  userId,
  onClose,
  onRematch,
}) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  // Ganar = golpe + éxito + confeti; empate = confirmación; perder = toque suave (sin castigo)
  const reduceMotion = useReducedMotion();
  const didWin = !!matchState && matchState.winnerId === userId && matchState.status !== "ghost";
  const didDraw = !!matchState?.isDraw;
  useEffect(() => {
    if (!visible || !matchState) return undefined;
    const t = setTimeout(() => {
      if (didWin) {
        tapHeavy();
        setTimeout(notifySuccess, 140);
        playSound("celebration");
      } else if (didDraw) {
        tapMedium();
      } else {
        tapLight();
      }
    }, 250);
    return () => clearTimeout(t);
  }, [visible, !!matchState]);
  const eloDelta = matchState?.eloChange ?? 0;
  const eloCounted = useCountUp(eloDelta, { active: visible && !!matchState, delay: 450, duration: 800, reduceMotion });

  if (!matchState || !visible) return null;

  const isP1 = matchState.player1?.id === userId;
  const myPlayer = isP1 ? matchState.player1 : matchState.player2;
  const opponent = isP1 ? matchState.player2 : matchState.player1;

  const iWon = matchState.winnerId === userId;
  const isDraw = matchState.isDraw;
  const abandoned = matchState.status === "abandoned";
  const isGhost = matchState.status === "ghost";

  const myScore = isP1 ? matchState.player1?.score : matchState.player2?.score;
  const oppScore = isP1 ? matchState.player2?.score : matchState.player1?.score;

  const eloChange = matchState.eloChange ?? 0;
  const myEloAfter = myPlayer?.elo ?? 1000;
  const myTier = getEloTier(myEloAfter);

  const coinsEarned = isGhost
    ? 0
    : iWon
      ? matchState.rewardCoins
      : isDraw
        ? Math.floor(matchState.rewardCoins / 2)
        : 20;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.card,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}>
          <ConfettiBurst burstKey={visible && didWin ? 1 : 0} count={24} distance={150} style={styles.burstOrigin} />
          {/* Result header */}
          <Text style={styles.resultEmoji}>
            {isGhost ? "👻" : abandoned ? "🚪" : isDraw ? "🤝" : iWon ? "🏆" : "😢"}
          </Text>
          <Text style={[styles.resultTitle, { color: isGhost ? "rgba(255,228,181,0.5)" : isDraw ? GOLD : iWon ? GREEN : RED }]}>
            {isGhost
              ? "Oponente no conectó"
              : abandoned
                ? (iWon ? "¡Oponente abandonó!" : "Abandonaste")
                : isDraw
                  ? "¡Empate!"
                  : iWon
                    ? "¡Victoria!"
                    : "Derrota"}
          </Text>

          {/* Scores comparison */}
          <View style={styles.scoresRow}>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreAvatar}>{myPlayer?.avatar ?? "🌮"}</Text>
              <Text style={styles.scoreName}>Tú</Text>
              <Text style={styles.scoreVal}>{myScore ?? 0}</Text>
              <Text style={styles.scoreLabel}>pts</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreAvatar}>{opponent?.avatar ?? "🌮"}</Text>
              <Text style={styles.scoreName} numberOfLines={1}>{opponent?.name ?? "Rival"}</Text>
              <Text style={styles.scoreVal}>{oppScore ?? 0}</Text>
              <Text style={styles.scoreLabel}>pts</Text>
            </View>
          </View>

          {/* ELO change */}
          <View style={styles.eloRow}>
            <Text style={styles.eloEmoji}>{myTier.emoji}</Text>
            <Text style={styles.eloRating}>
              {/* El rating rueda desde el valor anterior hasta el nuevo */}
              {isDraw ? myEloAfter : iWon ? myEloAfter - eloChange + eloCounted : myEloAfter + eloChange - eloCounted}
            </Text>
            <Text style={[
              styles.eloChange,
              { color: iWon ? GREEN : isDraw ? GOLD : RED },
            ]}>
              {iWon ? `+${eloCounted}` : isDraw ? "±0" : `-${eloCounted}`}
            </Text>
          </View>
          <Text style={[styles.eloTierName, { color: myTier.color }]}>
            {myTier.name}
          </Text>

          {/* Coins earned (hidden for ghost matches) */}
          {coinsEarned > 0 && (
            <View style={styles.coinsRow}>
              <Text style={styles.coinsText}>🪙 +{coinsEarned} monedas</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rematchBtn} onPress={onRematch} activeOpacity={0.85}>
              <Text style={styles.rematchText}>⚔️ Revancha</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exitBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.exitText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#1E1E2E",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  resultEmoji: { fontSize: 56, marginBottom: 8 },
  burstOrigin: { top: 60, left: "50%" },
  resultTitle: {
    fontFamily: FONTS.display,
    fontSize: 28,
    marginBottom: 20,
  },
  scoresRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
  },
  scoreCol: { alignItems: "center", width: width * 0.25 },
  scoreAvatar: { fontSize: 32 },
  scoreName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: "#FFE4B5",
    marginTop: 4,
  },
  scoreVal: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: "#FFFFFF",
    marginTop: 4,
  },
  scoreLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: "rgba(255,228,181,0.5)",
  },
  vs: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: "rgba(255,228,181,0.4)",
  },
  eloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  eloEmoji: { fontSize: 20 },
  eloRating: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: "#FFFFFF",
  },
  eloChange: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  eloTierName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    marginBottom: 16,
  },
  coinsRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  coinsText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: GOLD,
  },
  actions: {
    width: "100%",
    gap: 10,
  },
  rematchBtn: {
    backgroundColor: AMBER,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A0522D",
  },
  rematchText: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: "#FFF",
  },
  exitBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  exitText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: "rgba(255,228,181,0.6)",
  },
});
