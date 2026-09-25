import { useMutation, useQuery } from "convex/react";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import StreakShareCard from "./StreakShareCard";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { comboBurst, notifySuccess, tapLight } from "../services/haptics";
import usePetStore, { getStage } from "../store/usePetStore";
import { playPetSound, playSound } from "../utils/soundManager";
import { TABLET_MODE } from "../utils/tabletSetup";
import StageCropped from "./PetCompanion/StageCropped";
import Pet3DView from "./Pet3D/Pet3DView";
import { flameStatusFor, normalizePetType } from "../config/petTypes";
import { useUserMutation } from "../hooks/useUserMutation";
import { STREAK_MILESTONES, getStreakPhrase } from "../config/streakRewards";
import { useReducedMotion } from "react-native-reanimated";
import useCountUp from "../hooks/useCountUp";
import useDiamondFly from "../hooks/useDiamondFly";
import { REAL_WIDTH } from "../utils/tabletSetup";
import ConfettiBurst from "./ConfettiBurst";
import DiamondFlyOverlay from "./DiamondFlyOverlay";

const { width, height } = Dimensions.get("window");

// ── Goal options ───────────────────────────────────────────────────────────────
const GOALS = [
  { days: 7, diamonds: 35 },
  { days: 14, diamonds: 140 },
  { days: 30, diamonds: 210 },
  { days: 50, diamonds: 350 },
];

const MILESTONES = STREAK_MILESTONES;

// Pill de diamantes del TopBar cuando no nos pasan cómo medirlo (p. ej. MascotaScreen)
const getDiamondPillFallback = () => {
  const topPad = Platform.OS === "ios" ? 52 : 36;
  return { x: REAL_WIDTH - 16 - 110 - 10 - 90, y: topPad, w: 90, h: 36 };
};

/**
 * @param diamondSink opcional (lo pasa TopBar): { measure, hold, reveal, release }
 *   para que los 💎 de un hito vuelen al pill y el número suba en sincronía.
 */
export default function StreakModal({ visible, onClose, diamondSink = null }) {
  const { userId } = useAuth();
  const streakData = useQuery(
    api.streaks.getStreakStatus,
    userId ? { userId } : "skip"
  );
  const petState = useQuery(
    api.pet.getPetState,
    userId ? { userId } : "skip"
  );
  const commitGoal = useUserMutation(api.streaks.commitStreakGoal);
  const claimMilestone = useUserMutation(api.streaks.claimStreakMilestone);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [claimingMilestone, setClaimingMilestone] = useState(null);
  const [tapBubble, setTapBubble] = useState(null);    // { msg, tapsLeft }
  const fireScale = useRef(new Animated.Value(1)).current;
  const mascotScale = useRef(new Animated.Value(1)).current;
  const streakShareRef = useRef(null);
  const mascotFloat = useRef(new Animated.Value(0)).current;  // breathing Y
  const mascotBreathe = useRef(new Animated.Value(1)).current; // breathing scale
  const bubbleTimer = useRef(null);
  const breatheLoop = useRef(null);

  // Compute card dimensions from actual overlay layout (avoids Dimensions patching issues)
  const [overlaySize, setOverlaySize] = useState({ w: width, h: height });
  const cardW = TABLET_MODE ? Math.min(overlaySize.w * 0.68, 560) : overlaySize.w * 0.9;
  // 7 circles that always fit inside the card (40px card padding + 16px weekRow padding)
  const daySize = Math.min(Math.floor((cardW - 56) / 7) - 4, 48);
  const cardH = TABLET_MODE
    ? Math.min(overlaySize.h * 0.92, overlaySize.w * 0.88)
    : overlaySize.h * 0.85;

  const reduceMotion = useReducedMotion();

  // Fire pulse animation
  useEffect(() => {
    if (visible && streakData?.currentStreak > 0 && !reduceMotion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireScale, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(fireScale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
    return () => fireScale.stopAnimation();
  }, [visible, streakData?.currentStreak, reduceMotion]);

  // Mascot breathing/floating animation
  useEffect(() => {
    if (!visible) {
      breatheLoop.current?.stop();
      mascotFloat.setValue(0);
      mascotBreathe.setValue(1);
      return;
    }
    breatheLoop.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(mascotFloat, { toValue: -6, duration: 1100, useNativeDriver: true }),
          Animated.timing(mascotBreathe, { toValue: 1.04, duration: 1100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(mascotFloat, { toValue: 0, duration: 1100, useNativeDriver: true }),
          Animated.timing(mascotBreathe, { toValue: 1, duration: 1100, useNativeDriver: true }),
        ]),
      ])
    );
    breatheLoop.current.start();
    return () => breatheLoop.current?.stop();
  }, [visible]);

  // Always read petType from Convex (source of truth); fall back to local store
  const vinculo = usePetStore((s) => s.vinculo);
  const activeSkin = usePetStore((s) => s.activeSkin);
  const storedPetType = usePetStore((s) => s.petType);
  const caricia = usePetStore((s) => s.caricia);
  const tapsTodayCount = usePetStore((s) => s.tapsTodayCount);
  const lastTapDate = usePetStore((s) => s.lastTapDate);
  const petType = normalizePetType(petState?.petType ?? storedPetType);
  const [mascotTapKey, setMascotTapKey] = useState(0);
  const stage = getStage(vinculo);

  // How many taps remain today (max 10)
  const today = new Date().toISOString().slice(0, 10);
  const tapsToday = lastTapDate === today ? tapsTodayCount : 0;
  const tapsLeft = Math.max(0, 10 - tapsToday);

  const streak = streakData?.currentStreak ?? 0;
  const maxStreak = streakData?.maxStreak ?? 0;
  const weekDays = streakData?.weekDays ?? [];
  const activeGoal = streakData?.goalDays ?? 0;
  const claimedMilestones = streakData?.claimedMilestones ?? [];
  const freezeCount = streakData?.streakFreezeCount ?? 0;

  // ── Entrada: el número cuenta desde 0 y los días aparecen uno tras otro ──
  const streakShown = useCountUp(streak, { active: visible, delay: 250, duration: 900, reduceMotion });
  const dayAnims = useMemo(() => Array.from({ length: 7 }, () => new Animated.Value(0)), []);
  useEffect(() => {
    if (!visible || weekDays.length === 0) return undefined;
    if (reduceMotion) { dayAnims.forEach((a) => a.setValue(1)); return undefined; }
    dayAnims.forEach((a) => a.setValue(0));
    const anim = Animated.sequence([
      Animated.delay(350),
      Animated.stagger(70, dayAnims.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true })
      )),
    ]);
    anim.start();
    return () => anim.stop();
  }, [visible, weekDays.length, reduceMotion]);

  // Botón "Reclamar" late mientras haya un hito sin cobrar (anticipación)
  const hasClaimable = MILESTONES.some((ms) => streak >= ms.days && !claimedMilestones.includes(ms.days));
  const claimPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    claimPulse.setValue(0);
    if (!visible || !hasClaimable || reduceMotion) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(claimPulse, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(claimPulse, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [visible, hasClaimable, reduceMotion]);
  const claimScale = claimPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  // ── Cobro de hito: confeti + diamantes volando al contador ──
  const milestoneRefs = useRef({});
  const [burst, setBurst] = useState({ key: 0, x: 0, y: 0 });
  const { flyDiamonds, diamondParticles, triggerDiamondFly, onDiamondArrived } = useDiamondFly();

  const celebrateMilestone = async (days, amount) => {
    const node = milestoneRefs.current[days];
    const src = await new Promise((res) => {
      const fallback = { x: overlaySize.w / 2, y: overlaySize.h / 2 };
      if (!node) { res(fallback); return; }
      let done = false;
      node.measureInWindow((x, y, w, h) => {
        done = true;
        res(h > 0 ? { x: x + w - 50, y: y + h / 2 } : fallback);
      });
      setTimeout(() => { if (!done) res(fallback); }, 250);
    });
    setBurst((b) => ({ key: b.key + 1, x: src.x, y: src.y }));
    if (!amount) return;
    const measured = await diamondSink?.measure?.();
    const target = measured && measured.h > 0 ? measured : getDiamondPillFallback();
    const holdId = diamondSink?.hold?.(amount) ?? null;
    triggerDiamondFly({
      fromX: src.x,
      fromY: src.y,
      toX: target.x + target.w / 2,
      toY: target.y + target.h / 2,
      diamonds: amount,
      onLanded: holdId ? (f) => diamondSink?.reveal?.(holdId, f) : undefined,
      onAllArrived: holdId ? () => diamondSink?.release?.(holdId) : undefined,
    });
  };

  // ── Greeting message based on streak ──────────────────────────────────────
  const greetMsg = petState?.hasPet ? getStreakPhrase(streak) : null;

  const handleTapMascot = () => {
    setMascotTapKey((k) => k + 1);
    if (!petState?.hasPet) return;
    tapsLeft > 0 ? notifySuccess() : tapLight();
    playPetSound("happy", petType);
    caricia(); // +2 vínculo si hay taps disponibles

    Animated.sequence([
      Animated.timing(mascotScale, { toValue: 1.18, duration: 100, useNativeDriver: true }),
      Animated.timing(mascotScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(mascotScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    clearTimeout(bubbleTimer.current);
    const newTapsLeft = Math.max(0, tapsLeft - 1);
    if (tapsLeft > 0) {
      setTapBubble({ msg: "+Vínculo 💛", tapsLeft: newTapsLeft });
    } else {
      setTapBubble({ msg: "¡Límite diario! 🥰", tapsLeft: 0 });
    }
    bubbleTimer.current = setTimeout(() => setTapBubble(null), 2000);
  };

  const handleCommitGoal = async () => {
    if (!selectedGoal || !userId) return;
    notifySuccess();
    try {
      await commitGoal({ userId, targetDays: selectedGoal });
      setSelectedGoal(null);
    } catch (e) {
      console.log("Error committing goal:", e);
    }
  };

  const handleClaimMilestone = async (days) => {
    if (!userId) return;
    setClaimingMilestone(days);
    try {
      const result = await claimMilestone({ userId, milestoneDays: days });
      comboBurst(10); // vibración intensa al alcanzar un hito de racha
      playSound("milestone");
      const fallbackAmount = MILESTONES.find((m) => m.days === days)?.diamonds ?? 0;
      celebrateMilestone(days, result?.diamondsAwarded ?? fallbackAmount);
    } catch (e) {
      console.log("Error claiming milestone:", e);
    }
    setClaimingMilestone(null);
  };

  const handleShareStreak = async () => {
    try {
      const uri = await captureRef(streakShareRef, { format: "png", quality: 0.92 });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "¡Comparte tu racha!" });
    } catch (e) {
      try {
        await Share.share({
          message: `¡Llevo ${streak} días aprendiendo mexicanismos en Mexicanario! 🔥🇲🇽 mexicanario.app`,
        });
      } catch (err) {
        console.error("Share streak error:", err);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={styles.overlay}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          setOverlaySize({ w, h });
        }}
      >
        <View style={[styles.card, { width: cardW, maxHeight: cardH }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Mascota + Streak Count ────────────────────── */}
            {petState?.hasPet ? (
              <View style={styles.mascotArea}>
                {/* Tap bubble */}
                {tapBubble && (
                  <View style={styles.tapBubble}>
                    <Text style={styles.tapBubbleText}>{tapBubble.msg}</Text>
                    {tapBubble.tapsLeft > 0 && (
                      <Text style={styles.tapBubbleSub}>{tapBubble.tapsLeft} taps restantes hoy</Text>
                    )}
                    <View style={styles.tapBubbleTail} />
                  </View>
                )}
                <TouchableOpacity onPress={handleTapMascot} activeOpacity={0.85}>
                  <Animated.View style={[
                    styles.mascotWrap,
                    {
                      transform: [
                        { translateY: mascotFloat },
                        { scale: Animated.multiply(mascotScale, mascotBreathe) },
                      ]
                    },
                  ]}>
                    <Pet3DView
                      petType={petType}
                      stage={stage}
                      size={130}
                      active={visible}
                      reduceMotion={reduceMotion}
                      showFlame
                      streakDays={streak}
                      streakStatus={flameStatusFor(streakData)}
                      reaction={mascotTapKey ? "tap" : null}
                      reactionKey={mascotTapKey}
                      fallback={<StageCropped petType={petType} stage={stage} size={120} />}
                    />
                  </Animated.View>
                </TouchableOpacity>
                {/* Daily tap hint */}
                <View style={styles.tapHintPill}>
                  <Text style={styles.tapHintText}>
                    👆 Tócame · {tapsLeft > 0 ? `${tapsLeft} taps hoy = +Vínculo` : "¡Vuelve mañana! 🌟"}
                  </Text>
                </View>
              </View>
            ) : (
              <Animated.Text
                style={[
                  styles.fireEmoji,
                  { transform: [{ scale: fireScale }] },
                ]}
              >
                🔥
              </Animated.Text>
            )}
            <View style={styles.streakRow}>
              <Text style={styles.streakNumber}>{streakShown}</Text>
              {petState?.hasPet && streak > 0 && (
                <Animated.Text style={[styles.streakFlame, { transform: [{ scale: fireScale }] }]}>🔥</Animated.Text>
              )}
            </View>
            <Text style={styles.streakLabel}>
              {streak === 1 ? "día de racha" : "días de racha"}
            </Text>
            <Text style={styles.streakSub}>
              ¡Tu mascota evoluciona con tu racha!
            </Text>

            {/* ── Share streak button ── */}
            <TouchableOpacity style={styles.shareStreakBtn} onPress={handleShareStreak}>
              <Text style={styles.shareStreakBtnText}>📤 Compartir racha</Text>
            </TouchableOpacity>

            {/* ── Greeting from mascot ── */}
            {greetMsg && (
              <View style={styles.greetBubble}>
                <Text style={styles.greetText}>{greetMsg}</Text>
              </View>
            )}

            {/* ── Récord ───────────────────────────────────── */}
            {maxStreak > 0 && (
              <Text style={styles.maxStreakText}>
                Récord: {maxStreak} días 🏆
              </Text>
            )}

            {/* ── Escudos de Racha ──────────────────────────── */}
            <View style={styles.freezeRow}>
              {freezeCount > 0 ? (
                <View style={styles.freezePill}>
                  <Text style={styles.freezePillIcon}>🛡️</Text>
                  <Text style={styles.freezePillText}>
                    {freezeCount} escudo{freezeCount !== 1 ? "s" : ""} de racha
                  </Text>
                </View>
              ) : (
                <View style={styles.freezePillEmpty}>
                  <Text style={styles.freezePillEmptyText}>
                    🛡️ Sin escudos — compra en la Tienda
                  </Text>
                </View>
              )}
            </View>

            {/* ── Weekly Calendar ───────────────────────────── */}
            <View style={styles.weekRow}>
              {weekDays.map((day, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.dayCircle,
                    { width: daySize, height: daySize, borderRadius: daySize / 2 },
                    day.played && styles.dayPlayed,
                    day.isToday && !day.played && styles.dayToday,
                    dayAnims[i] && {
                      opacity: dayAnims[i],
                      transform: [{
                        scale: dayAnims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [day.played ? 0.3 : 0.7, 1],
                        }),
                      }],
                    },
                  ]}
                >
                  {day.played ? (
                    <Text style={[styles.dayCheck, { fontSize: daySize * 0.38 }]}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.dayLabel,
                        { fontSize: daySize * 0.32 },
                        day.isToday && styles.dayLabelToday,
                      ]}
                    >
                      {day.label}
                    </Text>
                  )}
                </Animated.View>
              ))}
            </View>

            {/* ── Streak Goals ──────────────────────────────── */}
            <Text style={styles.sectionTitle}>
              COMPROMÉTETE CON TU META
            </Text>

            <View style={styles.goalsGrid}>
              {GOALS.map((goal) => {
                const isActive = activeGoal === goal.days;
                const isSelected = selectedGoal === goal.days;
                return (
                  <TouchableOpacity
                    key={goal.days}
                    style={[
                      styles.goalCard,
                      isActive && styles.goalCardActive,
                      isSelected && styles.goalCardSelected,
                    ]}
                    onPress={() => { tapLight(); setSelectedGoal(goal.days); }}
                  >
                    <Text style={styles.goalDays}>{goal.days} días</Text>
                    <Text style={styles.goalReward}>
                      Gana {goal.diamonds} 💎
                    </Text>
                    {isActive && (
                      <Text style={styles.goalActiveBadge}>ACTIVA</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedGoal && selectedGoal !== activeGoal && (
              <TouchableOpacity
                style={styles.commitButton}
                onPress={handleCommitGoal}
              >
                <Text style={styles.commitButtonText}>
                  COMPROMETERME CON MI META
                </Text>
              </TouchableOpacity>
            )}

            {/* ── Milestones ───────────────────────────────── */}
            <Text style={[styles.sectionTitle, { marginTop: height * 0.025 }]}>
              RECOMPENSAS POR RACHA
            </Text>

            {MILESTONES.map((ms) => {
              const isClaimed = claimedMilestones.includes(ms.days);
              const canClaim = streak >= ms.days && !isClaimed;
              const isReached = streak >= ms.days;
              return (
                <View
                  key={ms.days}
                  ref={(node) => { milestoneRefs.current[ms.days] = node; }}
                  collapsable={false}
                  style={[styles.milestoneRow, isReached && styles.milestoneReached]}
                >
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneDays}>
                      🔥 {ms.days} días
                    </Text>
                    <Text style={styles.milestoneReward}>
                      {ms.diamonds} 💎
                      {ms.petStage ? `  ·  ${ms.petStage}` : ""}
                    </Text>
                  </View>
                  {isClaimed ? (
                    <Text style={styles.milestoneClaimed}>✅</Text>
                  ) : canClaim ? (
                    <Animated.View style={{ transform: [{ scale: claimScale }] }}>
                      <TouchableOpacity
                        style={styles.milestoneClaimBtn}
                        onPress={() => handleClaimMilestone(ms.days)}
                        disabled={claimingMilestone === ms.days}
                      >
                        <Text style={styles.milestoneClaimText}>
                          {claimingMilestone === ms.days
                            ? "..."
                            : "Reclamar 💎"}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ) : (
                    <Text style={styles.milestoneLocked}>🔒</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* ── Close button ────────────────────────────── */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => { tapLight(); onClose(); }}>
            <Text style={styles.closeBtnText}>Continuar</Text>
          </TouchableOpacity>
        </View>

        {/* Confeti al cobrar un hito */}
        <ConfettiBurst burstKey={burst.key} style={{ left: burst.x, top: burst.y }} count={24} distance={140} />
      </View>

      <DiamondFlyOverlay diamonds={flyDiamonds} particles={diamondParticles} onDiamondArrived={onDiamondArrived} />

      {/* StreakShareCard — rendered offscreen for image capture, never visible to user */}
      <StreakShareCard
        ref={streakShareRef}
        streak={streak}
        petType={petType}
        stage={stage}
        activeSkin={activeSkin}
        style={{ position: "absolute", left: -9999, top: 0 }}
      />
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 20, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFE4B5",
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#8B4513",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: height * 0.01,
  },

  // Mascot in streak modal
  mascotArea: {
    alignItems: "center",
    marginBottom: 4,
    position: "relative",
  },
  mascotWrap: {
    width: 130,
    height: 130,
    alignSelf: "center",
  },
  tapBubble: {
    position: "absolute",
    top: -52,
    alignSelf: "center",
    backgroundColor: "rgba(92,46,0,0.92)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    zIndex: 10,
    minWidth: 120,
  },
  tapBubbleText: {
    color: "#FFE4B5",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  tapBubbleSub: {
    color: "#FFDAB9",
    fontSize: 10,
    textAlign: "center",
    marginTop: 1,
  },
  tapBubbleTail: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderTopColor: "rgba(92,46,0,0.92)",
  },
  tapHintPill: {
    backgroundColor: "rgba(211,107,30,0.15)",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(211,107,30,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
  },
  tapHintText: {
    color: "#D36B1E",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  // Fire + streak
  fireEmoji: {
    fontSize: width * 0.2,
    textAlign: "center",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  streakFlame: {
    fontSize: width * 0.09,
    marginTop: -height * 0.01,
  },
  streakNumber: {
    fontSize: width * 0.14,
    fontWeight: "900",
    color: "#FF6B35",
    textAlign: "center",
    marginTop: -height * 0.01,
  },
  streakLabel: {
    fontSize: width * 0.055,
    fontWeight: "bold",
    color: "#8B4513",
    textAlign: "center",
  },
  streakSub: {
    fontSize: width * 0.035,
    color: "#A0522D",
    textAlign: "center",
    marginTop: height * 0.005,
    marginBottom: height * 0.01,
  },
  greetBubble: {
    backgroundColor: "rgba(92,46,0,0.12)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(211,107,30,0.35)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: 4,
  },
  greetText: {
    color: "#7A3E10",
    fontSize: width * 0.036,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: width * 0.052,
  },
  maxStreakText: {
    fontSize: width * 0.032,
    color: "#D2691E",
    textAlign: "center",
    marginBottom: height * 0.01,
  },

  // Escudos de racha
  freezeRow: {
    alignSelf: "stretch",
    alignItems: "center",
    marginBottom: height * 0.012,
  },
  freezePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "#7CB87A",
  },
  freezePillIcon: { fontSize: 16 },
  freezePillText: {
    fontSize: width * 0.034,
    fontWeight: "700",
    color: "#2E7D32",
  },
  freezePillEmpty: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "#FFCC80",
  },
  freezePillEmptyText: {
    fontSize: width * 0.03,
    color: "#E65100",
    fontWeight: "600",
  },

  // Weekly calendar
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingHorizontal: 8,
    marginVertical: height * 0.02,
  },
  dayCircle: {
    // size set via inline style (daySize) so it always fits the card width
    aspectRatio: 1,
    backgroundColor: "#F5DEB3",
    borderWidth: 2,
    borderColor: "#D2691E",
    justifyContent: "center",
    alignItems: "center",
  },
  dayPlayed: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
  },
  dayToday: {
    borderColor: "#FF6B35",
    borderWidth: 3,
  },
  dayLabel: {
    fontSize: width * 0.028,
    fontWeight: "bold",
    color: "#8B4513",
  },
  dayLabelToday: {
    color: "#FF6B35",
  },
  dayCheck: {
    fontSize: width * 0.04,
    color: "#fff",
    fontWeight: "bold",
  },

  // Section title
  sectionTitle: {
    fontSize: width * 0.032,
    fontWeight: "bold",
    color: "#8B4513",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: height * 0.012,
  },

  // Goals grid
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: width * 0.025,
  },
  goalCard: {
    width: width * 0.35,
    backgroundColor: "#F5DEB3",
    borderRadius: width * 0.03,
    borderWidth: 2,
    borderColor: "#D2691E",
    padding: width * 0.03,
    alignItems: "center",
  },
  goalCardActive: {
    borderColor: "#FF6B35",
    borderWidth: 3,
    backgroundColor: "#FFDAB9",
  },
  goalCardSelected: {
    borderColor: "#F8BE17",
    borderWidth: 3,
    backgroundColor: "#FFF8DC",
  },
  goalDays: {
    fontSize: width * 0.042,
    fontWeight: "bold",
    color: "#8B4513",
  },
  goalReward: {
    fontSize: width * 0.032,
    color: "#D2691E",
    marginTop: height * 0.003,
  },
  goalActiveBadge: {
    fontSize: width * 0.025,
    fontWeight: "bold",
    color: "#FF6B35",
    marginTop: height * 0.003,
  },

  // Commit button
  commitButton: {
    backgroundColor: "#F8BE17",
    borderRadius: width * 0.06,
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.08,
    marginTop: height * 0.015,
    borderWidth: 2,
    borderColor: "#8B4513",
  },
  commitButtonText: {
    color: "#8B4513",
    fontWeight: "bold",
    fontSize: width * 0.035,
    textAlign: "center",
  },

  // Milestones
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5DEB3",
    borderRadius: width * 0.025,
    borderWidth: 1.5,
    borderColor: "#D2691E",
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.008,
    width: "100%",
  },
  milestoneReached: {
    backgroundColor: "#FFDAB9",
    borderColor: "#FF6B35",
  },
  milestoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.03,
    flexShrink: 1,
  },
  milestoneDays: {
    fontSize: width * 0.035,
    fontWeight: "bold",
    color: "#8B4513",
  },
  milestoneReward: {
    fontSize: width * 0.032,
    color: "#D2691E",
  },
  milestoneClaimed: {
    fontSize: width * 0.05,
  },
  milestoneLocked: {
    fontSize: width * 0.04,
    opacity: 0.5,
  },
  milestoneClaimBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: width * 0.03,
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.04,
  },
  milestoneClaimText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.03,
  },

  // Share streak button
  shareStreakBtn: {
    backgroundColor: "rgba(211,107,30,0.15)",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#D36B1E",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8,
  },
  shareStreakBtnText: {
    color: "#D36B1E",
    fontSize: width * 0.036,
    fontWeight: "700",
    textAlign: "center",
  },

  // Close
  closeBtn: {
    backgroundColor: "#FF6B35",
    borderRadius: width * 0.06,
    paddingVertical: height * 0.018,
    alignItems: "center",
    marginTop: height * 0.01,
    borderWidth: 2,
    borderColor: "#8B4513",
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
});
