import { useQuery } from "convex/react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeButton from "../components/HomeButton";
import MinigameScoreboard from "../components/MinigameScoreboard";
import { api } from "../../convex/_generated/api";
import { isNewRecord, nextNahualObstacle } from "../config/minigameLogic";
import { useAuth } from "../context/AuthContext";
import { notifyError, notifySuccess, tapLight } from "../services/haptics";
import { playBGM, playSound, stopBGM } from "../utils/soundManager";
import { useUserMutation } from "../hooks/useUserMutation";

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
// Si tocas justo antes de aterrizar, el salto se encola en vez de perderse
const JUMP_BUFFER_H = JUMP_H * 0.35;
// Suelo que se desplaza: un nopal cada GROUND_EVERY puntitos
const GROUND_SEG    = 36;
const GROUND_EVERY  = 4;
const GROUND_PERIOD = GROUND_SEG * GROUND_EVERY;
const GROUND_ITEMS  = Array.from(
  { length: Math.ceil(width / GROUND_SEG) + GROUND_EVERY * 2 },
  (_, i) => (i % GROUND_EVERY === 0 ? "🌵" : "·"),
);

const S_MENU    = "menu";
const S_PLAYING = "playing";
const S_OVER    = "over";

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
  // BGM — minigame track
  useEffect(() => { playBGM("minigame"); return () => { stopBGM(); playBGM("menu"); }; }, []);

  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const [gameState,    setGameState]    = useState(S_MENU);
  const [displayScore, setDisplayScore] = useState(0);
  const [obstacleIcon, setObstacleIcon] = useState("🌵");
  const [newRecord,    setNewRecord]    = useState(false);

  // Convex
  const submitScore = useUserMutation(api.nahual.submitScore);
  const myBest = useQuery(api.nahual.getMyBest, userId ? { userId } : "skip");

  // ── Refs ──────────────────────────────────────────────────────────────────
  const scoreRef       = useRef(0);
  const isPlayingRef   = useRef(false);
  const isJumpingRef   = useRef(false);
  const jumpQueuedRef  = useRef(false);
  const obsAnimRef     = useRef(null);
  const groundLoopRef  = useRef(null);
  const collisionRaf   = useRef(null);
  const prevBestRef    = useRef(null);

  // ── Animated values ───────────────────────────────────────────────────────
  const charY      = useRef(new Animated.Value(0)).current;
  const obsX       = useRef(new Animated.Value(width + 50)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;
  const shakeX     = useRef(new Animated.Value(0)).current;
  const groundX    = useRef(new Animated.Value(0)).current;

  // Real-time values updated by native listener for 60 FPS collision detection
  const charYVal = useRef(0);
  const obsXVal = useRef(width + 50);

  useEffect(() => {
    const subY = charY.addListener(({ value }) => { charYVal.current = value; });
    const subX = obsX.addListener(({ value }) => { obsXVal.current = value; });
    return () => {
      charY.removeListener(subY);
      obsX.removeListener(subX);
    };
  }, []);

  // ── Lanzar obstáculo ──────────────────────────────────────────────────────
  const launchObstacle = useCallback(() => {
    obsX.setValue(width + 50);
    obsXVal.current = width + 50;
    // Pausa aleatoria + tipo variado: el ritmo ya no es predecible
    const { duration, delay, icon } = nextNahualObstacle(scoreRef.current);
    setObstacleIcon(icon);
    obsAnimRef.current = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(obsX, {
        toValue: -OBS_SIZE - 30,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
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
    if (!isPlayingRef.current) return;
    if (isJumpingRef.current) {
      // Ya cayendo y cerca del suelo → encola el siguiente salto
      if (charYVal.current > -JUMP_BUFFER_H) jumpQueuedRef.current = true;
      return;
    }
    isJumpingRef.current = true;
    jumpQueuedRef.current = false;
    tapLight();
    playSound("click");
    Animated.sequence([
      Animated.timing(charY, {
        toValue: -JUMP_H,
        duration: JUMP_DUR,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(charY, {
        toValue: 0,
        duration: JUMP_DUR,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      isJumpingRef.current = false;
      if (finished && jumpQueuedRef.current) jump();
    });
  }, []);

  // ── Game over ─────────────────────────────────────────────────────────────
  const triggerGameOver = useCallback(() => {
    isPlayingRef.current = false;
    jumpQueuedRef.current = false;
    obsAnimRef.current?.stop();
    groundLoopRef.current?.stop();
    charY.stopAnimation();
    cancelAnimationFrame(collisionRaf.current);
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
    const prev = prevBestRef.current;
    setNewRecord(prev !== null && isNewRecord(finalScore, prev));
    setGameState(S_OVER);

    // Subir puntuación al leaderboard
    if (userId && finalScore > 0) {
      submitScore({ userId, score: finalScore }).catch(() => {});
    }
  }, [userId]);

  // ── Iniciar juego ─────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    prevBestRef.current = myBest ? myBest.allTime : null;
    scoreRef.current = 0;
    isPlayingRef.current = true;
    isJumpingRef.current = false;
    jumpQueuedRef.current = false;
    setDisplayScore(0);
    setNewRecord(false);
    setGameState(S_PLAYING);
    charY.setValue(0);
    charYVal.current = 0;
    obsX.setValue(width + 50);
    obsXVal.current = width + 50;
    shakeX.setValue(0);
    groundX.setValue(0);
    groundLoopRef.current = Animated.loop(
      Animated.timing(groundX, {
        toValue: -GROUND_PERIOD,
        duration: GROUND_EVERY * 320,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    groundLoopRef.current.start();
    launchObstacle();
  }, [myBest]);

  // ── Colisiones (rAF synced con display refresh) ──────────────────────────
  useEffect(() => {
    if (gameState !== S_PLAYING) {
      cancelAnimationFrame(collisionRaf.current);
      return;
    }
    const checkCollision = () => {
      if (!isPlayingRef.current) return;
      const cy = charYVal.current;
      const ox = obsXVal.current;

      const pLeft  = PLAYER_X + PLAYER_SIZE * 0.15;
      const pRight = PLAYER_X + PLAYER_SIZE * 0.85;
      const oLeft  = ox + OBS_SIZE * 0.15;
      const oRight = ox + OBS_SIZE * 0.85;

      const hitX = pRight > oLeft && pLeft < oRight;
      const hitY = cy > -(OBS_SIZE * 0.55);

      if (hitX && hitY) { triggerGameOver(); return; }
      collisionRaf.current = requestAnimationFrame(checkCollision);
    };
    collisionRaf.current = requestAnimationFrame(checkCollision);
    return () => cancelAnimationFrame(collisionRaf.current);
  }, [gameState]);

  // Cleanup al desmontar
  useEffect(() => () => {
    isPlayingRef.current = false;
    obsAnimRef.current?.stop();
    groundLoopRef.current?.stop();
    cancelAnimationFrame(collisionRaf.current);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ImageBackground
      source={require("../../assets/images/bg.webp")}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.darkOverlay} />

      {/* Área de juego */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        activeOpacity={1}
        onPressIn={jump}
      >
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { transform: [{ translateX: shakeX }] }]}
        >
          <View style={styles.ground} />
          <Animated.View style={[styles.groundRow, { transform: [{ translateX: groundX }] }]}>
            {GROUND_ITEMS.map((item, i) => (
              <Text key={i} style={styles.groundItem}>{item}</Text>
            ))}
          </Animated.View>

          {/* Jugador */}
          <Animated.View style={[
            styles.character,
            // El emoji de corredor mira a la izquierda: lo volteamos hacia los obstáculos
            { left: PLAYER_X, top: GROUND_Y - PLAYER_SIZE, transform: [{ translateY: charY }, { scaleX: -1 }] },
          ]}>
            <Text style={{ fontSize: PLAYER_SIZE * 0.92, lineHeight: PLAYER_SIZE }}>🏃🏽</Text>
          </Animated.View>

          {/* Nahual */}
          <Animated.View style={[
            styles.obstacle,
            { top: GROUND_Y - OBS_SIZE, transform: [{ translateX: obsX }] },
          ]}>
            <Text style={{ fontSize: OBS_SIZE * 0.92, lineHeight: OBS_SIZE }}>{obstacleIcon}</Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      {/* HUD en juego */}
      {gameState === S_PLAYING && (
        <>
          <Animated.View style={[styles.scorePill, { top: insets.top + 12 }, { transform: [{ scale: scoreScale }] }]}>
            <Text style={styles.scorePillText}>🌮 {displayScore}</Text>
          </Animated.View>
          <TouchableOpacity
            style={[styles.exitBtn, { top: insets.top + 12 }]}
            onPress={() => { isPlayingRef.current = false; obsAnimRef.current?.stop(); groundLoopRef.current?.stop(); navigation.goBack(); }}
            accessibilityLabel="Salir del juego"
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
        <View style={[styles.cardOverlay, { paddingTop: insets.top + 64 }]}>
          <View style={styles.card}>
            <Text style={styles.cardBigEmoji}>👹</Text>
            <Text style={styles.cardTitle}>¡Corre del Nahual!</Text>
            <Text style={styles.cardDesc}>
              El Nahual te persigue por el desierto. ¡Salta los nopales, las piedras y hasta al mismo Nahual!
            </Text>

            <View style={styles.instructRow}>
              <View style={styles.instructItem}>
                <Text style={styles.instructEmoji}>👆</Text>
                <Text style={styles.instructText}>Toca para{"\n"}saltar</Text>
              </View>
              <View style={styles.instructDivider} />
              <View style={styles.instructItem}>
                <Text style={styles.instructEmoji}>🌵</Text>
                <Text style={styles.instructText}>Esquiva{"\n"}obstáculos</Text>
              </View>
              <View style={styles.instructDivider} />
              <View style={styles.instructItem}>
                <Text style={styles.instructEmoji}>🏆</Text>
                <Text style={styles.instructText}>Récord{"\n"}{myBest ? myBest.allTime : "–"}</Text>
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
        <View style={[styles.cardOverlay, { paddingTop: insets.top + 64 }]}>
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

              <MinigameScoreboard
                game={api.nahual}
                userId={userId}
                myBest={myBest}
                newRecord={newRecord}
                formatScore={(n) => `🌮 ${n}`}
              />

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
        {/* Casita para volver al inicio, solo fuera de una partida */}
        {(gameState === S_MENU || gameState === S_OVER) && <HomeButton floating />}
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
  groundRow: {
    position: "absolute",
    top: GROUND_Y + 6,
    left: 0,
    flexDirection: "row",
  },
  groundItem: {
    width: GROUND_SEG,
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
  },

  character: { position: "absolute" },
  obstacle:  { position: "absolute" },

  // HUD
  scorePill: {
    position: "absolute",
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
});
