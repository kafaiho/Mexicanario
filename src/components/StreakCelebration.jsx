/**
 * StreakCelebration — pantalla de "¡tu racha subió!" (tras la primera palabra del día).
 *
 * Secuencia (≈2.2 s, se puede adelantar tocando):
 *   1. La llama entra con resorte y brasas subiendo.
 *   2. El número se voltea del día anterior al nuevo (golpe háptico + sonido).
 *   3. Se llenan los días del ciclo semanal; el de hoy "revienta".
 *   4. Premio del día: monedas, o piñata que tiembla y revienta (premio variable).
 *   5. Barra hacia el próximo hito (efecto gradiente de meta) + adelanto de mañana.
 * Al cerrar, devuelve la posición del premio para que las monedas vuelen al contador.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import {
  getDailyStreakReward,
  getNextMilestoneProgress,
  getStreakCycleDay,
  getStreakPhrase,
} from "../config/streakRewards";
import { notifySuccess, tapHeavy, tapLight, comboBurst } from "../services/haptics";
import { playSound } from "../utils/soundManager";

const EMBER_COUNT = 9;
const CONFETTI_COUNT = 22;
const CONFETTI_COLORS = ["#F8BE17", "#FF6B35", "#E0559A", "#4CAF50", "#29B6F6", "#FFF3B0"];

// Tiempos de la secuencia (ms)
const T = { flip: 450, text: 750, dots: 950, reward: 1450, progress: 1900, cta: 2100 };

export default function StreakCelebration({ visible, data, onClose }) {
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const contentW = Math.min(width - 32, 380);

  const streak = data?.streak ?? 0;
  const prevStreak = Math.max(0, streak - 1);
  const coins = data?.coins ?? 0;
  const isPinata = !!data?.isPinata;
  const milestone = data?.milestone ?? null;
  const cycleDay = getStreakCycleDay(streak);
  const next = getNextMilestoneProgress(streak);
  const tomorrow = getDailyStreakReward(streak + 1);

  const enter = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const flip = useRef(new Animated.Value(0)).current;
  const textIn = useRef(new Animated.Value(0)).current;
  const reward = useRef(new Animated.Value(0)).current;
  const pinataShake = useRef(new Animated.Value(0)).current;
  const pinataBurst = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const cta = useRef(new Animated.Value(0)).current;
  const confetti = useRef(new Animated.Value(0)).current;
  const dots = useMemo(() => Array.from({ length: 7 }, () => new Animated.Value(0)), []);
  const embers = useMemo(
    () => Array.from({ length: EMBER_COUNT }, (_, i) => ({
      v: new Animated.Value(0),
      x: (i / (EMBER_COUNT - 1) - 0.5) * 110 + (Math.random() - 0.5) * 16,
      rise: 70 + Math.random() * 60,
      size: 4 + Math.random() * 4,
      delay: Math.random() * 900,
    })),
    []
  );
  const confettiPieces = useMemo(
    () => Array.from({ length: CONFETTI_COUNT }, (_, i) => {
      const angle = (i / CONFETTI_COUNT) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 110 + Math.random() * 90;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 40,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360),
        w: 6 + Math.random() * 5,
      };
    }),
    []
  );

  const [ctaReady, setCtaReady] = useState(false);
  const [pinataOpen, setPinataOpen] = useState(!isPinata);
  const timersRef = useRef([]);
  const loopsRef = useRef([]);
  const rewardRef = useRef(null);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };
  const at = (ms, fn) => timersRef.current.push(setTimeout(fn, ms));

  const timing = (v, toValue, duration, easing = Easing.out(Easing.cubic), native = true) =>
    Animated.timing(v, { toValue, duration, easing, useNativeDriver: native });

  const showFinalState = () => {
    clearTimers();
    [enter, flip, textIn, reward, progress, cta].forEach((v) => { v.stopAnimation(); v.setValue(1); });
    dots.forEach((d) => d.setValue(1));
    pinataShake.setValue(0);
    pinataBurst.setValue(1);
    setPinataOpen(true);
    setCtaReady(true);
  };

  useEffect(() => {
    if (!visible || !data) return undefined;

    // Reset
    [enter, glow, flip, textIn, reward, pinataShake, pinataBurst, progress, cta, confetti]
      .forEach((v) => v.setValue(0));
    dots.forEach((d) => d.setValue(0));
    embers.forEach((e) => e.v.setValue(0));
    setCtaReady(false);
    setPinataOpen(!isPinata);

    if (reduceMotion) {
      showFinalState();
      playSound("streak");
      notifySuccess();
      return clearTimers;
    }

    // 1. Llama + resplandor + brasas
    Animated.spring(enter, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }).start();
    const glowLoop = Animated.loop(Animated.sequence([
      timing(glow, 1, 1100, Easing.inOut(Easing.sin)),
      timing(glow, 0, 1100, Easing.inOut(Easing.sin)),
    ]));
    glowLoop.start();
    const emberLoops = embers.map((e) => {
      const loop = Animated.loop(Animated.sequence([
        Animated.delay(e.delay),
        timing(e.v, 1, 1500, Easing.out(Easing.quad)),
        timing(e.v, 0, 0),
      ]));
      loop.start();
      return loop;
    });
    loopsRef.current = [glowLoop, ...emberLoops];

    // 2. Volteo del número
    at(T.flip, () => {
      timing(flip, 1, 420, Easing.out(Easing.back(1.6))).start();
      playSound("streak");
      tapHeavy();
    });

    // 3. Texto + días del ciclo
    at(T.text, () => timing(textIn, 1, 350).start());
    at(T.dots, () => {
      Animated.stagger(70, dots.map((d, i) =>
        i < cycleDay
          ? Animated.spring(d, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true })
          : timing(d, 1, 200)
      )).start();
    });
    at(T.dots + 70 * Math.max(0, cycleDay - 1) + 120, () => tapLight());

    // 4. Premio (con suspenso si es piñata)
    at(T.reward, () => {
      Animated.spring(reward, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
      if (isPinata) {
        Animated.sequence([
          ...[1, -1, 1, -1, 1, -1].map((to, i) => timing(pinataShake, to * (0.6 + i * 0.1), 90, Easing.inOut(Easing.quad))),
          timing(pinataShake, 0, 90),
        ]).start();
        [0, 180, 360, 540].forEach((d) => at(T.reward + d, tapLight));
        at(T.reward + 700, () => {
          setPinataOpen(true);
          timing(pinataBurst, 1, 420, Easing.out(Easing.back(2))).start();
          timing(confetti, 1, 1100, Easing.out(Easing.quad)).start();
          playSound("celebration");
          comboBurst(10);
        });
      } else {
        playSound("coin", 1.2);
        notifySuccess();
      }
    });

    // 5. Progreso al siguiente hito / hito alcanzado
    const extra = isPinata ? 700 : 0;
    at(T.progress + extra, () => {
      timing(progress, 1, 700, Easing.out(Easing.cubic), false).start();
      if (milestone) {
        timing(confetti, 1, 1100, Easing.out(Easing.quad)).start();
        playSound("milestone");
        comboBurst(10);
      }
    });
    at(T.cta + extra, () => {
      setCtaReady(true);
      Animated.spring(cta, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    });

    return () => {
      clearTimers();
      loopsRef.current.forEach((l) => l.stop());
      loopsRef.current = [];
    };
  }, [visible, data, reduceMotion]);

  const handleClose = () => {
    tapLight();
    const finish = (point) => onClose?.(point ?? null);
    if (!rewardRef.current || !coins) { finish(null); return; }
    let done = false;
    rewardRef.current.measureInWindow((x, y, w, h) => {
      done = true;
      finish(h > 0 ? { x: x + w / 2, y: y + h / 2 } : null);
    });
    setTimeout(() => { if (!done) finish(null); }, 250);
  };

  if (!data) return null;

  // ── Interpolaciones ──
  const flameScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const flameBoost = flip.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.22, 1], extrapolate: "clamp" });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });
  const glowOpacity = Animated.multiply(enter, glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] }));
  const oldY = flip.interpolate({ inputRange: [0, 1], outputRange: [0, -56] });
  const oldOpacity = flip.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: "clamp" });
  const newY = flip.interpolate({ inputRange: [0, 1], outputRange: [56, 0] });
  const newOpacity = flip.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1], extrapolate: "clamp" });
  const fadeUp = (v) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });
  const beforePct = `${Math.round((next?.progressBefore ?? 0) * 100)}%`;
  const afterPct = `${Math.round((next?.progress ?? 1) * 100)}%`;
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [beforePct, afterPct] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={ctaReady ? undefined : showFinalState}>
        {/* Confeti (hito o piñata) */}
        <View style={styles.confettiLayer} pointerEvents="none">
          {confettiPieces.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                width: p.w,
                height: p.w * 1.6,
                borderRadius: 2,
                backgroundColor: p.color,
                opacity: confetti.interpolate({ inputRange: [0, 0.05, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: confetti.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                  { translateY: confetti.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, p.dy, p.dy + 60] }) },
                  { rotate: confetti.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin}deg`] }) },
                ],
              }}
            />
          ))}
        </View>

        <View style={[styles.content, { width: contentW }]}>
          {data.shieldSaved && (
            <Animated.View style={[styles.shieldBanner, fadeUp(textIn)]}>
              <Text style={styles.shieldText}>🛡️ ¡Tu escudo salvó tu racha!</Text>
            </Animated.View>
          )}

          {/* Llama */}
          <View style={styles.flameArea}>
            <Animated.View style={[styles.glowOuter, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
            <Animated.View style={[styles.glowInner, { opacity: enter, transform: [{ scale: glowScale }] }]} />
            {embers.map((e, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  bottom: 30,
                  left: 90 + e.x,
                  width: e.size,
                  height: e.size,
                  borderRadius: e.size / 2,
                  backgroundColor: i % 2 ? "#FFB300" : "#FF6B35",
                  opacity: e.v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                  transform: [{ translateY: e.v.interpolate({ inputRange: [0, 1], outputRange: [0, -e.rise] }) }],
                }}
              />
            ))}
            <Animated.Text style={[styles.flame, { opacity: enter, transform: [{ scale: Animated.multiply(flameScale, flameBoost) }] }]}>
              🔥
            </Animated.Text>
          </View>

          {/* Número que se voltea */}
          <View style={styles.numberBox}>
            <Animated.Text style={[styles.number, { opacity: oldOpacity, transform: [{ translateY: oldY }] }]}>
              {prevStreak}
            </Animated.Text>
            <Animated.Text style={[styles.number, styles.numberNew, { opacity: newOpacity, transform: [{ translateY: newY }] }]}>
              {streak}
            </Animated.Text>
          </View>

          <Animated.View style={fadeUp(textIn)}>
            <Text style={styles.label}>{streak === 1 ? "¡día de racha!" : "¡días de racha!"}</Text>
            <Text style={styles.phrase}>{getStreakPhrase(streak)}</Text>
          </Animated.View>

          {/* Ciclo semanal (7 días → piñata) */}
          <View style={styles.dotsRow}>
            {dots.map((d, i) => {
              const filled = i < cycleDay;
              const isToday = i === cycleDay - 1;
              const isPinataDay = i === 6;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    filled && styles.dotFilled,
                    isToday && styles.dotToday,
                    {
                      opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
                      transform: [{ scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.6, isToday ? 1.18 : 1] }) }],
                    },
                  ]}
                >
                  <Text style={[styles.dotText, filled && styles.dotTextFilled]}>
                    {isPinataDay ? "🪅" : filled ? "✓" : `${i + 1}`}
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          {/* Premio del día */}
          {coins > 0 && (
            <Animated.View
              style={[
                styles.rewardChip,
                isPinata && styles.rewardChipPinata,
                {
                  opacity: reward,
                  transform: [{ scale: reward.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                },
              ]}
            >
              {!pinataOpen ? (
                <Animated.Text
                  style={[styles.pinata, {
                    transform: [{ rotate: pinataShake.interpolate({ inputRange: [-1, 1], outputRange: ["-18deg", "18deg"] }) }],
                  }]}
                >
                  🪅
                </Animated.Text>
              ) : (
                <Animated.View
                  ref={rewardRef}
                  collapsable={false}
                  style={[styles.rewardInner, isPinata && {
                    transform: [{ scale: pinataBurst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
                  }]}
                >
                  <Text style={styles.rewardText}>
                    {isPinata ? "¡Piñata! " : "Premio del día "}+{coins} 🪙
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* Hito alcanzado o progreso hacia el siguiente */}
          {milestone ? (
            <Animated.View style={[styles.milestoneBanner, fadeUp(progress)]}>
              <Text style={styles.milestoneTitle}>🏆 ¡Hito de {milestone.days} días!</Text>
              <Text style={styles.milestoneSub}>Reclama +{milestone.diamonds} 💎 en tu racha</Text>
            </Animated.View>
          ) : next ? (
            <View style={styles.progressBlock}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: barWidth }]} />
              </View>
              <Text style={styles.progressText}>
                {next.daysLeft === 1 ? "¡Solo falta 1 día" : `Faltan ${next.daysLeft} días`} para tu hito de {next.milestone.days} · +{next.milestone.diamonds} 💎
              </Text>
            </View>
          ) : null}

          {/* Adelanto de mañana (anticipación) */}
          <Animated.Text style={[styles.tomorrow, { opacity: textIn }]}>
            {tomorrow.isPinata ? "Mañana: 🪅 ¡Piñata sorpresa!" : `Mañana: +${tomorrow.coins} 🪙 si regresas`}
          </Animated.Text>

          <Animated.View style={{ opacity: cta, transform: [{ scale: cta.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
            <TouchableOpacity
              style={styles.cta}
              onPress={handleClose}
              disabled={!ctaReady}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>¡Sígale! 🔥</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26, 8, 0, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  confettiLayer: {
    position: "absolute",
    top: "38%",
    left: "50%",
  },
  content: {
    alignItems: "center",
  },
  shieldBanner: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderColor: "#7CB87A",
    borderWidth: 1.5,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 6,
  },
  shieldText: { color: "#C8F2C6", fontWeight: "800", fontSize: 14 },
  flameArea: {
    width: 180,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  glowOuter: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#FF6B35",
  },
  glowInner: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(248, 190, 23, 0.35)",
  },
  flame: {
    fontSize: 96,
    lineHeight: 118,
    textAlign: "center",
  },
  numberBox: {
    height: 84,
    alignSelf: "stretch",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    position: "absolute",
    fontSize: 72,
    lineHeight: 84,
    fontWeight: "900",
    color: "#FFE4B5",
    textAlign: "center",
  },
  numberNew: {
    color: "#FFB300",
    textShadowColor: "rgba(255, 107, 53, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  label: {
    color: "#FFE4B5",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  phrase: {
    color: "#F5D6B0",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "rgba(255, 228, 181, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotFilled: {
    backgroundColor: "#FF6B35",
    borderColor: "#FFB300",
  },
  dotToday: {
    borderColor: "#FFF3B0",
    borderWidth: 3,
  },
  dotText: { color: "rgba(255, 228, 181, 0.6)", fontSize: 13, fontWeight: "800" },
  dotTextFilled: { color: "#fff" },
  rewardChip: {
    marginTop: 18,
    minHeight: 48,
    minWidth: 180,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#5C2800",
    borderWidth: 2,
    borderColor: "#F8BE17",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardChipPinata: {
    borderColor: "#E0559A",
    backgroundColor: "#4A1030",
  },
  rewardInner: { paddingVertical: 10 },
  rewardText: { color: "#F8BE17", fontSize: 18, fontWeight: "900", textAlign: "center" },
  pinata: { fontSize: 34, lineHeight: 44 },
  milestoneBanner: {
    marginTop: 16,
    backgroundColor: "rgba(248, 190, 23, 0.16)",
    borderColor: "#F8BE17",
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  milestoneTitle: { color: "#FFE066", fontSize: 18, fontWeight: "900" },
  milestoneSub: { color: "#FFE4B5", fontSize: 13, fontWeight: "700", marginTop: 2 },
  progressBlock: {
    marginTop: 18,
    alignSelf: "stretch",
    alignItems: "center",
  },
  progressTrack: {
    alignSelf: "stretch",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#FFB300",
  },
  progressText: {
    color: "#F5D6B0",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  tomorrow: {
    color: "#FFB300",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center",
  },
  cta: {
    marginTop: 22,
    backgroundColor: "#FF6B35",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFB300",
    paddingHorizontal: 44,
    paddingVertical: 14,
  },
  ctaText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
});
