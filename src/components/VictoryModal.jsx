import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Speech from "expo-speech";
import { useReducedMotion } from "react-native-reanimated";
import useCountUp from "../hooks/useCountUp";

const CONFETTI_COUNT = 10;
const REWARD_DELAY = 450; // ms tras abrir: entran los pills de recompensa
const CONFETTI_COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF922B", "#CC5DE8", "#F06595", "#74C0FC"];

/**
 * VictoryModal — shown when the user completes a level.
 *
 * Props:
 *   visible           boolean
 *   onContinue        () => void  — "Continuar" button
 *   onHome            () => void  — home icon
 *   onShare           () => void  — share icon
 *   isMapReview       boolean
 *   isReviewMode      boolean
 *   petHasPet         boolean
 *   maxCombo          number
 *   victoryPhrase     string
 *   word              string      — the guessed word (display-ready)
 *   example           string | null
 *   region            string | null
 *   zoneCompleted     {name, emoji, color} | null
 *   zoneCompletedNext {name, emoji} | null
 *   levelCurrent      number
 *   totalLevels       number
 *   diamonds          number
 *   victoryCoins      number
 *   victoryCoinParticles  array
 *   onCoinArrived     () => void
 *   coinSourceRef     ref — se asigna al pill de monedas (origen del vuelo al TopBar)
 *   diamondSourceRef  ref — se asigna al pill de diamantes
 *   isLastLevel       boolean
 */
export default function VictoryModal({
  visible,
  onContinue,
  onHome,
  onShare,
  isMapReview,
  isReviewMode,
  petHasPet,
  maxCombo,
  victoryPhrase,
  word,
  example,
  region,
  zoneCompleted,
  zoneCompletedNext,
  levelCurrent,
  totalLevels,
  diamonds = 0,
  coins = 0,
  isLastLevel,
  flyOverlay = null,
  onChallengeFriend = null,
  isChallengeMode = false,
  challengeResult = null,
  coinSourceRef = null,
  diamondSourceRef = null,
}) {
  const reduceMotion = useReducedMotion();
  // Recompensas: entran una por una y el número cuenta desde 0
  const pillAnims = useMemo(() => [0, 1, 2].map(() => new Animated.Value(0)), []);
  const coinsShown = useCountUp(coins, { active: visible, delay: REWARD_DELAY + 150, duration: 600, reduceMotion });
  const diamondsShown = useCountUp(diamonds, { active: visible, delay: REWARD_DELAY + 300, duration: 600, reduceMotion });

  useEffect(() => {
    if (!visible) return undefined;
    if (reduceMotion) { pillAnims.forEach((a) => a.setValue(1)); return undefined; }
    pillAnims.forEach((a) => a.setValue(0));
    const anim = Animated.sequence([
      Animated.delay(REWARD_DELAY),
      Animated.stagger(150, pillAnims.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true })
      )),
    ]);
    anim.start();
    return () => anim.stop();
  }, [visible, reduceMotion]);

  const pillStyle = (a) => ({
    opacity: a,
    transform: [
      { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
      { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  });
  const confettiAnims = useMemo(
    () =>
      Array(CONFETTI_COUNT)
        .fill(0)
        .map(() => ({
          y: new Animated.Value(0),
          x: new Animated.Value(0),
          opacity: new Animated.Value(0),
          rotation: new Animated.Value(0),
          scale: new Animated.Value(0),
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 8 + Math.random() * 10,
          endY: 180 + Math.random() * 120,
          endX: (Math.random() - 0.5) * 300,
        })),
    []
  );

  const launchConfetti = () => {
    confettiAnims.forEach((p, i) => {
      p.y.setValue(0);
      p.x.setValue(0);
      p.opacity.setValue(0);
      p.rotation.setValue(0);
      p.scale.setValue(0);
      const delay = i * 40;
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.spring(p.scale, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: -p.endY, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.x, { toValue: p.endX, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.rotation, { toValue: 6, duration: 900, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(600),
            Animated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });
  };

  useEffect(() => {
    if (visible) {
      setTimeout(() => launchConfetti(), 100);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.min((levelCurrent ?? 1) / (totalLevels || 50), 1);
  const deg = pct * 360;

  const displayWord = word
    ? word.charAt(0) + word.slice(1).toLowerCase()
    : "";

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onContinue}>
      {flyOverlay}
      <View style={s.overlay}>

        {/* Confetti burst */}
        <View style={s.confettiContainer} pointerEvents="none">
          {confettiAnims.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateY: p.y },
                  { translateX: p.x },
                  { scale: p.scale },
                  {
                    rotate: p.rotation.interpolate({
                      inputRange: [0, 6],
                      outputRange: ["0deg", "1080deg"],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>

        {/* Main content */}
        <View style={s.content}>

          <View style={s.iconWrap}>
            <Text style={s.iconEmoji}>{petHasPet ? "🎉" : "🎁"}</Text>
          </View>

          {maxCombo >= 3 && (
            <Text style={s.comboInfo}>🔥 ¡Combo máximo: x{maxCombo}!</Text>
          )}

          <Text style={s.celebration}>{victoryPhrase}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={s.phrase}>{displayWord ? `¡${displayWord}!` : ""}</Text>
            {!!word && (
              <TouchableOpacity
                onPress={() => Speech.speak(word, { language: "es-MX", rate: 0.85 })}
                style={s.speakBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: 20 }}>🔊</Text>
              </TouchableOpacity>
            )}
          </View>

          {isReviewMode && (
            <View style={s.reviewBanner}>
              <Text style={s.reviewText}>🧠 ¡Aprendiste de tu error!</Text>
            </View>
          )}

          {zoneCompleted && (
            <View style={[s.zoneBanner, { borderColor: zoneCompleted.color }]}>
              <Text style={s.zoneTitle}>
                🎊 ¡Completaste el camino {zoneCompleted.name}! {zoneCompleted.emoji}
              </Text>
              {zoneCompletedNext && (
                <Text style={s.zoneNext}>
                  Siguiente camino: {zoneCompletedNext.emoji} {zoneCompletedNext.name}
                </Text>
              )}
            </View>
          )}

          {(example || region) ? (
            <View style={s.infoCard}>
              {example ? (
                <>
                  <Text style={s.exampleLabel}>Ejemplo de uso:</Text>
                  <Text style={s.example}>"{example}"</Text>
                </>
              ) : null}
              {region ? (
                <View style={s.regionRow}>
                  <Text style={s.regionDot}>📍</Text>
                  <Text style={s.regionLabel}>{region}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Challenge result */}
          {isChallengeMode && challengeResult?.sent && (
            <View style={s.challengeResultCard}>
              <Text style={s.challengeResultTitle}>⚔️ ¡Reto enviado a {challengeResult.friendName}!</Text>
              <Text style={s.challengeStatVal}>
                Tu marca: {challengeResult.attempts} {challengeResult.attempts === 1 ? "intento" : "intentos"} · {Math.round(challengeResult.timeMs / 1000)} s
              </Text>
              <Text style={[s.challengeReward, { color: "#F8BE17" }]}>
                Tiene 24 h para superarte. Si gana tu cuate, se lleva las 100 monedas.
              </Text>
            </View>
          )}
          {isChallengeMode && challengeResult?.error && (
            <View style={s.challengeResultCard}>
              <Text style={s.challengeResultTitle}>⚠️ No se pudo guardar el reto</Text>
              <Text style={s.challengeStatVal}>{challengeResult.error}</Text>
            </View>
          )}

          {isChallengeMode && challengeResult && !challengeResult.sent && !challengeResult.error && (
            <View style={s.challengeResultCard}>
              <Text style={s.challengeResultTitle}>
                {challengeResult.isWinner ? "🏆 ¡Ganaste el reto!" : "😢 Perdiste el reto"}
              </Text>
              <View style={s.challengeStatsRow}>
                <View style={s.challengeStatCol}>
                  <Text style={s.challengeStatLabel}>Tú</Text>
                  <Text style={s.challengeStatVal}>{challengeResult.challengedAttempts} intentos</Text>
                </View>
                <Text style={s.challengeVs}>VS</Text>
                <View style={s.challengeStatCol}>
                  <Text style={s.challengeStatLabel}>Rival</Text>
                  <Text style={s.challengeStatVal}>{challengeResult.challengerAttempts} intentos</Text>
                </View>
              </View>
              <Text style={[s.challengeReward, { color: challengeResult.isWinner ? "#6BCB77" : "#FF6B6B" }]}>
                {challengeResult.isWinner ? `+${challengeResult.reward}` : `-50`} monedas
              </Text>
            </View>
          )}

          {/* Endgame celebration */}
          {isLastLevel && !isMapReview && !isChallengeMode && (
            <View style={s.endgameBanner}>
              <Text style={s.endgameEmoji}>🏆🇲🇽🏆</Text>
              <Text style={s.endgameTitle}>¡Completaste el Mexicanario!</Text>
              <Text style={s.endgameSubtitle}>Dominaste todas las palabras. Eres un verdadero conocedor de México.</Text>
            </View>
          )}

          {/* Progress ring */}
          <View style={s.ringWrap}>
            <View style={s.ringOuter}>
              <View style={[s.half, s.halfLeft]}>
                <View
                  style={[
                    s.halfInner,
                    { transform: [{ rotate: `${deg <= 180 ? deg : 180}deg` }] },
                    { backgroundColor: "#E9967A" },
                  ]}
                />
              </View>
              {deg > 180 && (
                <View style={[s.half, s.halfRight]}>
                  <View
                    style={[
                      s.halfInner,
                      { transform: [{ rotate: `${deg - 180}deg` }] },
                      { backgroundColor: "#E9967A" },
                    ]}
                  />
                </View>
              )}
              <View style={s.ringInner}>
                <Text style={s.ringGift}>🎁</Text>
              </View>
            </View>
            <Text style={s.ringLabel}>{levelCurrent}/{totalLevels}</Text>
          </View>

          {/* Rewards row */}
          <View style={s.rewardRow}>
            <Animated.View style={[s.rewardPill, pillStyle(pillAnims[0])]}>
              <Text style={{ fontSize: 16 }}>🐾</Text>
              <Text style={s.rewardText}>+Vínculo</Text>
            </Animated.View>
            {coins > 0 && (
              <View ref={coinSourceRef} collapsable={false}>
                <Animated.View style={[s.rewardPill, s.rewardPillGold, pillStyle(pillAnims[1])]}>
                  <Image source={require("../../assets/icons/coin.png")} style={s.rewardIcon} />
                  <Text style={[s.rewardText, s.rewardTextGold]}>+{coinsShown}</Text>
                </Animated.View>
              </View>
            )}
            <View ref={diamondSourceRef} collapsable={false}>
              <Animated.View style={[s.rewardPill, pillStyle(pillAnims[2])]}>
                <Image source={require("../../assets/icons/diamond.png")} style={s.rewardIcon} />
                <Text style={s.rewardText}>+{diamondsShown}</Text>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Bottom actions */}
        <View style={s.bottomActions}>
          <TouchableOpacity style={s.continueBtn} onPress={onContinue} activeOpacity={0.85}>
            <Text style={s.continueBtnText}>
              {isMapReview
                ? "🗺️ Volver al mapa"
                : isLastLevel
                ? "Volver al menú 🏠"
                : "Continuar"}
            </Text>
          </TouchableOpacity>

          <View style={s.secondaryBtns}>
            <TouchableOpacity style={s.circleBtn} onPress={onHome}>
              <Text style={s.circleBtnIcon}>🏠</Text>
            </TouchableOpacity>
            {!isChallengeMode && onChallengeFriend && (
              <TouchableOpacity style={s.circleBtn} onPress={onChallengeFriend}>
                <Text style={s.circleBtnIcon}>⚔️</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.circleBtn} onPress={onShare}>
              <Text style={s.circleBtnIcon}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  endgameBanner: {
    backgroundColor: "rgba(248,190,23,0.15)",
    borderWidth: 1.5,
    borderColor: "#F8BE17",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
    width: "100%",
  },
  endgameEmoji: { fontSize: 28, marginBottom: 4 },
  endgameTitle: { fontSize: 18, fontWeight: "bold", color: "#F8BE17", textAlign: "center", marginBottom: 4 },
  endgameSubtitle: { fontSize: 13, color: "#FFE4B5", textAlign: "center", lineHeight: 18 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,10,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  iconEmoji: { fontSize: 48 },
  comboInfo: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FF6B35",
    textAlign: "center",
  },
  celebration: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFE4B5",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  phrase: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
  },
  speakBtn: {
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  reviewBanner: {
    backgroundColor: "rgba(100,200,100,0.15)",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(100,200,100,0.4)",
  },
  reviewText: { color: "#90EE90", fontSize: 13, fontWeight: "700" },
  zoneBanner: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    alignItems: "center",
    width: "100%",
  },
  zoneTitle: { color: "#FFE4B5", fontWeight: "900", fontSize: 13, textAlign: "center" },
  zoneNext: { color: "rgba(255,228,181,0.6)", fontSize: 11, marginTop: 2, textAlign: "center" },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: "100%",
    gap: 4,
  },
  exampleLabel: { color: "rgba(255,228,181,0.6)", fontSize: 11, fontWeight: "700" },
  example: { color: "#FFE4B5", fontSize: 13, fontStyle: "italic" },
  regionRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  regionDot: { fontSize: 12 },
  regionLabel: { color: "rgba(255,228,181,0.7)", fontSize: 12 },

  // Challenge result
  challengeResultCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  challengeResultTitle: { color: "#FFE4B5", fontWeight: "900", fontSize: 16, marginBottom: 8 },
  challengeStatsRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  challengeStatCol: { alignItems: "center" },
  challengeStatLabel: { color: "rgba(255,228,181,0.6)", fontSize: 11, fontWeight: "600" },
  challengeStatVal: { color: "#FFE4B5", fontSize: 14, fontWeight: "700", marginTop: 2 },
  challengeVs: { color: "#FF6B35", fontWeight: "900", fontSize: 16 },
  challengeReward: { fontWeight: "900", fontSize: 15, marginTop: 8 },

  // Progress ring
  ringWrap: { alignItems: "center", gap: 6 },
  ringOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  half: {
    position: "absolute",
    width: "50%",
    height: "100%",
    overflow: "hidden",
  },
  halfLeft: { left: 0 },
  halfRight: { right: 0, transform: [{ scaleX: -1 }] },
  halfInner: {
    width: "100%",
    height: "100%",
    borderRadius: 9999,
    transformOrigin: "right center",
  },
  ringInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(26,10,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  ringGift: { fontSize: 24 },
  ringLabel: { color: "rgba(255,228,181,0.7)", fontSize: 12, fontWeight: "700" },

  // Rewards
  rewardRow: { flexDirection: "row", gap: 12 },
  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  rewardText: { color: "#FFE4B5", fontWeight: "700", fontSize: 14, minWidth: 28 },
  rewardPillGold: {
    backgroundColor: "rgba(248,190,23,0.18)",
    borderWidth: 1,
    borderColor: "rgba(248,190,23,0.6)",
  },
  rewardTextGold: { color: "#FFD54F", fontWeight: "900" },
  rewardIcon: { width: 18, height: 18, resizeMode: "contain" },

  // Buttons
  bottomActions: { width: "100%", marginTop: 16, gap: 12 },
  continueBtn: {
    backgroundColor: "#D36B1E",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    shadowColor: "#D36B1E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  continueBtnText: { color: "#fff", fontWeight: "900", fontSize: 17, letterSpacing: 0.5 },
  secondaryBtns: { flexDirection: "row", justifyContent: "center", gap: 20 },
  circleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  circleBtnIcon: { fontSize: 22 },
});
