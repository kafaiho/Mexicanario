import { useMutation, useQuery } from "convex/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { notifyError, notifySuccess, tapLight } from "../services/haptics";
import { playSound } from "../utils/soundManager";

const { width, height } = Dimensions.get("window");

// ── Colores (alineados con Mexicanometro) ─────────────────────────────────────
const BROWN  = "#8B4513";
const AMBER  = "#D2691E";
const GOLD   = "#F8BE17";
const WHEAT  = "#FFE4B5";
const WHEAT2 = "#F5DEB3";
const RED    = "#C0392B";
const GREEN  = "#27AE60";

// ── Constantes del juego ──────────────────────────────────────────────────────
const GROUND_Y      = height * 0.66;
const PLAYER_X      = width * 0.15;
const PLAYER_SIZE   = Math.round(width * 0.14);
const OBS_SIZE      = Math.round(width * 0.15);
const JUMP_H        = height * 0.22;
const JUMP_DUR      = 310;
const SPEED_INITIAL = 1700;
const SPEED_MIN     = 650;
const SPEED_STEP    = 35;

const S_MENU    = "menu";
const S_PLAYING = "playing";
const S_OVER    = "over";

const TABS = [
  { key: "daily",   label: "🔥 Hoy" },
  { key: "weekly",  label: "📅 Semana" },
  { key: "alltime", label: "🏆 Total" },
];

function scoreEmoji(n) {
  if (n >= 25) return "🌵";
  if (n >= 15) return "🦅";
  if (n >= 10) return "🌶️";
  if (n >= 5)  return "🌮";
  return "🤙";
}

function scoreMsg(n) {
  if (n >= 25) return "¡Eres una leyenda, cuate! 🔥";
  if (n >= 15) return "¡Eso estuvo de pelos! 💪";
  if (n >= 10) return "¡Qué chido, sigue así! 🎉";
  if (n >= 5)  return "¡Ya le agarraste el ritmo!";
  return "¡No te rajes, inténtalo otra vez!";
}

export default function CorreNahualScreen({ navigation }) {
  const { userId } = useAuth();
  const [gameState,    setGameState]    = useState(S_MENU);
  const [displayScore, setDisplayScore] = useState(0);
  const [tab,          setTab]          = useState("daily");

  // Convex
  const submitScore = useMutation(api.nahual.submitScore);
  const leaderboard = useQuery(
    api.nahual.getLeaderboard,
    gameState === S_OVER ? { type: tab } : "skip"
  );
  const myBest = useQuery(
    api.nahual.getMyBest,
    userId && gameState === S_OVER ? { userId } : "skip"
  );

  // ── Refs ──────────────────────────────────────────────────────────────────
  const scoreRef       = useRef(0);
  const isPlayingRef   = useRef(false);
  const isJumpingRef   = useRef(false);
  const obsAnimRef     = useRef(null);
  const collisionTimer = useRef(null);

  // ── Animated values ───────────────────────────────────────────────────────
  const charY      = useRef(new Animated.Value(0)).current;
  const obsX       = useRef(new Animated.Value(width + 50)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;
  const shakeX     = useRef(new Animated.Value(0)).current;

  // ── Lanzar obstáculo ──────────────────────────────────────────────────────
  const launchObstacle = useCallback(() => {
    obsX.setValue(width + 50);
    const speed = Math.max(SPEED_MIN, SPEED_INITIAL - scoreRef.current * SPEED_STEP);
    obsAnimRef.current = Animated.timing(obsX, {
      toValue: -OBS_SIZE - 30,
      duration: speed,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    obsAnimRef.current.start(({ finished }) => {
      if (finished && isPlayingRef.current) {
        scoreRef.current += 1;
        setDisplayScore(scoreRef.current);
        playSound("correct");
        notifySuccess();
        Animated.sequence([
          Animated.timing(scoreScale, { toValue: 1.5, duration: 80, useNativeDriver: true }),
          Animated.spring(scoreScale, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();
        launchObstacle();
      }
    });
  }, []);

  // ── Salto ─────────────────────────────────────────────────────────────────
  const jump = useCallback(() => {
    if (!isPlayingRef.current || isJumpingRef.current) return;
    isJumpingRef.current = true;
    tapLight();
    playSound("click");
    Animated.sequence([
      Animated.timing(charY, {
        toValue: -JUMP_H,
        duration: JUMP_DUR,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(charY, {
        toValue: 0,
        duration: JUMP_DUR,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => { isJumpingRef.current = false; });
  }, []);

  // ── Game over ─────────────────────────────────────────────────────────────
  const triggerGameOver = useCallback(() => {
    isPlayingRef.current = false;
    obsAnimRef.current?.stop();
    charY.stopAnimation();
    clearInterval(collisionTimer.current);
    playSound("wrong");
    notifyError();

    // Sacudida de pantalla
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 14, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -14, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();

    const finalScore = scoreRef.current;
    setGameState(S_OVER);

    // Subir puntuación al leaderboard
    if (userId && finalScore > 0) {
      submitScore({ userId, score: finalScore }).catch(() => {});
    }
  }, [userId]);

  // ── Iniciar juego ─────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    scoreRef.current = 0;
    isPlayingRef.current = true;
    isJumpingRef.current = false;
    setDisplayScore(0);
    setGameState(S_PLAYING);
    charY.setValue(0);
    obsX.setValue(width + 50);
    shakeX.setValue(0);
    launchObstacle();
  }, []);

  // ── Colisiones ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== S_PLAYING) {
      clearInterval(collisionTimer.current);
      return;
    }
    collisionTimer.current = setInterval(() => {
      if (!isPlayingRef.current) return;
      const cy = charY._value;
      const ox = obsX._value;

      const pLeft  = PLAYER_X + PLAYER_SIZE * 0.15;
      const pRight = PLAYER_X + PLAYER_SIZE * 0.85;
      const oLeft  = ox + OBS_SIZE * 0.15;
      const oRight = ox + OBS_SIZE * 0.85;

      const hitX = pRight > oLeft && pLeft < oRight;
      const hitY = cy > -(OBS_SIZE * 0.55);

      if (hitX && hitY) triggerGameOver();
    }, 16);
    return () => clearInterval(collisionTimer.current);
  }, [gameState]);

  // Cleanup al desmontar
  useEffect(() => () => {
    isPlayingRef.current = false;
    obsAnimRef.current?.stop();
    clearInterval(collisionTimer.current);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ImageBackground
      source={require("../../assets/images/bg.png")}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.darkOverlay} />

      {/* Área de juego */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        activeOpacity={1}
        onPress={jump}
      >
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { transform: [{ translateX: shakeX }] }]}
        >
          <View style={styles.ground} />
          <Text style={styles.groundCactus} numberOfLines={1}>
            {"🌵 · · · 🌵 · · · 🌵 · · · 🌵 · · · 🌵 · · · 🌵"}
          </Text>

          {/* Jugador */}
          <Animated.View style={[
            styles.character,
            { left: PLAYER_X, top: GROUND_Y - PLAYER_SIZE, transform: [{ translateY: charY }] },
          ]}>
            <Text style={{ fontSize: PLAYER_SIZE * 0.92, lineHeight: PLAYER_SIZE }}>🏃🏽</Text>
          </Animated.View>

          {/* Nahual */}
          <Animated.View style={[
            styles.obstacle,
            { top: GROUND_Y - OBS_SIZE, transform: [{ translateX: obsX }] },
          ]}>
            <Text style={{ fontSize: OBS_SIZE * 0.92, lineHeight: OBS_SIZE }}>👹</Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      {/* HUD en juego */}
      {gameState === S_PLAYING && (
        <>
          <Animated.View style={[styles.scorePill, { transform: [{ scale: scoreScale }] }]}>
            <Text style={styles.scorePillText}>🌮 {displayScore}</Text>
          </Animated.View>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => { isPlayingRef.current = false; obsAnimRef.current?.stop(); navigation.goBack(); }}
          >
            <Text style={styles.exitBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>👆 Toca para saltar</Text>
          </View>
        </>
      )}

      {/* ── Tarjeta menú ──────────────────────────────────────────── */}
      {gameState === S_MENU && (
        <View style={styles.cardOverlay}>
          <View style={styles.card}>
            <Text style={styles.cardBigEmoji}>👹</Text>
            <Text style={styles.cardTitle}>¡Corre del Nahual!</Text>
            <Text style={styles.cardDesc}>
              El Nahual viene a atraparte. ¡Salta sobre él antes de que te alcance, cuate!
            </Text>

            <View style={styles.instructRow}>
              <View style={styles.instructItem}>
                <Text style={styles.instructEmoji}>👆</Text>
                <Text style={styles.instructText}>Toca para{"\n"}saltar</Text>
              </View>
              <View style={styles.instructDivider} />
              <View style={styles.instructItem}>
                <Text style={styles.instructEmoji}>👹</Text>
                <Text style={styles.instructText}>Esquiva{"\n"}al Nahual</Text>
              </View>
              <View style={styles.instructDivider} />
              <View style={styles.instructItem}>
                <Text style={styles.instructEmoji}>🌮</Text>
                <Text style={styles.instructText}>¡Suma{"\n"}puntos!</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>¡Ándale, Empezar!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>← Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Game over con leaderboard ─────────────────────────────── */}
      {gameState === S_OVER && (
        <View style={styles.cardOverlay}>
          <View style={styles.card}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center", paddingBottom: 8 }}
            >
              {/* Resultado */}
              <Text style={styles.cardBigEmoji}>💀</Text>
              <Text style={[styles.cardTitle, { color: RED }]}>¡Te cachó el Nahual!</Text>

              <View style={styles.resultBox}>
                <Text style={styles.resultNum}>{displayScore}</Text>
                <Text style={styles.resultLabel}>{displayScore === 1 ? "esquive" : "esquives"}</Text>
                <Text style={styles.resultEmoji}>{scoreEmoji(displayScore)}</Text>
              </View>
              <Text style={styles.resultMsg}>{scoreMsg(displayScore)}</Text>

              {/* Récords personales */}
              {myBest && (
                <View style={styles.myBestRow}>
                  <View style={styles.myBestItem}>
                    <Text style={styles.myBestVal}>{myBest.daily}</Text>
                    <Text style={styles.myBestLabel}>🔥 Hoy</Text>
                  </View>
                  <View style={styles.myBestItem}>
                    <Text style={styles.myBestVal}>{myBest.weekly}</Text>
                    <Text style={styles.myBestLabel}>📅 Semana</Text>
                  </View>
                  <View style={styles.myBestItem}>
                    <Text style={styles.myBestVal}>{myBest.allTime}</Text>
                    <Text style={styles.myBestLabel}>🏆 Total</Text>
                  </View>
                </View>
              )}

              {/* Tabs de leaderboard */}
              <View style={styles.tabRow}>
                {TABS.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                    onPress={() => setTab(t.key)}
                  >
                    <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Lista del leaderboard */}
              <View style={styles.lbList}>
                {!leaderboard ? (
                  <Text style={styles.lbLoading}>Cargando...</Text>
                ) : leaderboard.length === 0 ? (
                  <Text style={styles.lbEmpty}>¡Sé el primero en el marcador!</Text>
                ) : (
                  leaderboard.map((entry) => {
                    const isMe = entry.userId === userId;
                    return (
                      <View
                        key={entry.userId}
                        style={[styles.lbRow, isMe && styles.lbRowMe]}
                      >
                        <Text style={styles.lbRank}>
                          {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                        </Text>
                        <Text style={styles.lbAvatar}>{entry.avatar}</Text>
                        <Text style={styles.lbName} numberOfLines={1}>{entry.name}</Text>
                        <Text style={styles.lbScore}>🌮 {entry.score}</Text>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Botones */}
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>¡Otra vez, órale!</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backBtnText}>← Volver</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex: 1 },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8,3,0,0.72)" },

  ground: {
    position: "absolute",
    left: 0, right: 0,
    top: GROUND_Y,
    height: 4,
    backgroundColor: AMBER,
    opacity: 0.85,
  },
  groundCactus: {
    position: "absolute",
    top: GROUND_Y + 6,
    left: 0, right: 0,
    fontSize: 14,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 2,
    textAlign: "center",
  },

  character: { position: "absolute" },
  obstacle:  { position: "absolute" },

  // HUD
  scorePill: {
    position: "absolute",
    top: 54,
    left: 18,
    backgroundColor: WHEAT,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: AMBER,
  },
  scorePillText: { color: BROWN, fontWeight: "900", fontSize: width * 0.048 },
  exitBtn: {
    position: "absolute",
    top: 54,
    right: 18,
    backgroundColor: "rgba(192,57,43,0.9)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: RED,
  },
  exitBtnText: { color: "#fff", fontWeight: "900", fontSize: 17 },
  tapHint: {
    position: "absolute",
    bottom: height * 0.06,
    alignSelf: "center",
    backgroundColor: "rgba(139,69,19,0.55)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tapHintText: { color: WHEAT, fontWeight: "700", fontSize: 14 },

  // Card overlay
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  card: {
    backgroundColor: WHEAT,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: BROWN,
    padding: 18,
    width: "100%",
    maxWidth: 440,
    maxHeight: height * 0.88,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 14,
  },
  cardBigEmoji: { fontSize: width * 0.16, textAlign: "center", marginBottom: 4 },
  cardTitle: {
    fontSize: width * 0.055,
    fontWeight: "900",
    color: BROWN,
    textAlign: "center",
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: width * 0.036,
    color: AMBER,
    textAlign: "center",
    lineHeight: width * 0.052,
    marginBottom: 16,
    fontWeight: "600",
  },

  // Instrucciones
  instructRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHEAT2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.25)",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 18,
    width: "100%",
  },
  instructItem:    { flex: 1, alignItems: "center" },
  instructEmoji:   { fontSize: width * 0.085, marginBottom: 4 },
  instructText:    { fontSize: width * 0.028, color: BROWN, fontWeight: "700", textAlign: "center", lineHeight: width * 0.04 },
  instructDivider: { width: 1, height: 40, backgroundColor: "rgba(139,69,19,0.2)" },

  // Botones
  startBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 13,
    paddingHorizontal: 28,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: AMBER,
  },
  startBtnText: { color: BROWN, fontSize: width * 0.046, fontWeight: "900", letterSpacing: 0.5 },
  backBtn:      { paddingVertical: 8, paddingHorizontal: 16 },
  backBtnText:  { color: AMBER, fontSize: width * 0.036, fontWeight: "700" },

  // Game over: resultado
  resultBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHEAT2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: AMBER,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 10,
  },
  resultNum:   { fontSize: width * 0.13, fontWeight: "900", color: AMBER, lineHeight: width * 0.14 },
  resultLabel: { fontSize: width * 0.038, color: BROWN, fontWeight: "700" },
  resultEmoji: { fontSize: width * 0.09 },
  resultMsg:   { fontSize: width * 0.035, color: AMBER, fontWeight: "700", textAlign: "center", marginBottom: 14 },

  // Récords personales
  myBestRow: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: WHEAT2,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.3)",
    marginBottom: 14,
    overflow: "hidden",
  },
  myBestItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  myBestVal:  { fontSize: width * 0.062, fontWeight: "900", color: BROWN },
  myBestLabel:{ fontSize: width * 0.028, color: AMBER, fontWeight: "700", marginTop: 2 },

  // Leaderboard tabs
  tabRow: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: WHEAT2,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.25)",
    marginBottom: 10,
    overflow: "hidden",
  },
  tabBtn:       { flex: 1, paddingVertical: 9, alignItems: "center" },
  tabBtnActive: { backgroundColor: AMBER },
  tabText:      { fontSize: width * 0.03, fontWeight: "700", color: AMBER },
  tabTextActive:{ color: "#fff" },

  // Lista leaderboard
  lbList:    { width: "100%", marginBottom: 14 },
  lbLoading: { color: AMBER, textAlign: "center", fontSize: width * 0.035, paddingVertical: 12 },
  lbEmpty:   { color: AMBER, textAlign: "center", fontSize: width * 0.033, paddingVertical: 12, fontWeight: "600" },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: WHEAT2,
    borderWidth: 1,
    borderColor: "rgba(139,69,19,0.15)",
    gap: 8,
  },
  lbRowMe: {
    backgroundColor: "#FFF8DC",
    borderColor: GOLD,
    borderWidth: 2,
  },
  lbRank:   { width: 32, textAlign: "center", fontSize: width * 0.035, fontWeight: "900", color: BROWN },
  lbAvatar: { fontSize: width * 0.055 },
  lbName:   { flex: 1, fontSize: width * 0.033, fontWeight: "700", color: BROWN },
  lbScore:  { fontSize: width * 0.035, fontWeight: "900", color: AMBER },
});
