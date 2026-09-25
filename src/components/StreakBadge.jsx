import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { petEmoji } from "../config/petTypes";

const { width } = Dimensions.get("window");

// Same pill height as TopBar pills for visual coherence
const PILL_H = width * 0.075;

const getPetStageEmoji = (petType, stage) => petEmoji(petType, stage, "🥚");

// Urgencia creciente conforme se acaba el día sin jugar (aversión a la pérdida):
// 0 = jugó hoy / sin racha, 1 = en riesgo, 2 = en riesgo y quedan ≤4 h.
// El backend cuenta días en UTC (convex/streaks.ts), así que medimos contra
// la medianoche UTC, no contra la hora local.
function useRiskLevel(atRisk) {
  const compute = () => (!atRisk ? 0 : 24 - new Date().getUTCHours() <= 4 ? 2 : 1);
  const [level, setLevel] = useState(compute);
  useEffect(() => {
    setLevel(compute());
    if (!atRisk) return undefined;
    const id = setInterval(() => setLevel(compute()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [atRisk]);
  return level;
}

export default function StreakBadge({ onPress }) {
  const { userId } = useAuth();
  const streakData = useQuery(
    api.streaks.getStreakStatus,
    userId ? { userId } : "skip"
  );
  const petState = useQuery(
    api.pet.getPetState,
    userId ? { userId } : "skip"
  );
  const reduceMotion = useReducedMotion();

  const streak = streakData?.currentStreak ?? 0;
  const isActive = streak > 0;
  const atRisk = isActive && streakData?.playedToday === false;
  const riskLevel = useRiskLevel(atRisk);
  const petEmoji = petState?.hasPet
    ? getPetStageEmoji(petState.petType, petState.stage)
    : null;

  const flame = useRef(new Animated.Value(0)).current;   // flicker loop
  const pop = useRef(new Animated.Value(1)).current;     // bump when the number rises
  const wiggle = useRef(new Animated.Value(0)).current;  // "¡no me dejes!" shake
  const prevStreak = useRef(streak);

  // Llama viva: late suave; en riesgo parpadea (más rápido de noche)
  useEffect(() => {
    flame.setValue(0);
    if (!isActive || reduceMotion) return undefined;
    const half = riskLevel === 2 ? 380 : riskLevel === 1 ? 600 : 900;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flame, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flame, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, riskLevel, reduceMotion]);

  // En riesgo: sacudida corta cada pocos segundos para pedir atención
  useEffect(() => {
    wiggle.setValue(0);
    if (!atRisk || reduceMotion) return undefined;
    const pause = riskLevel === 2 ? 2200 : 4500;
    const shake = (to, d = 60) => Animated.timing(wiggle, { toValue: to, duration: d, useNativeDriver: true });
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(pause),
        shake(1), shake(-1), shake(0.7), shake(-0.7), shake(0, 80),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [atRisk, riskLevel, reduceMotion]);

  // La racha subió: pop con rebote
  useEffect(() => {
    const prev = prevStreak.current;
    prevStreak.current = streak;
    if (streak <= prev || reduceMotion) return;
    pop.setValue(1);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.35, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 3, tension: 180, useNativeDriver: true }),
    ]).start();
  }, [streak, reduceMotion]);

  const flameScale = flame.interpolate({
    inputRange: [0, 1],
    outputRange: atRisk ? [0.85, 1.1] : [1, 1.14],
  });
  const flameOpacity = atRisk
    ? flame.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] })
    : 1;
  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ["-7deg", "7deg"] });

  const a11yLabel = isActive
    ? `Racha de ${streak} ${streak === 1 ? "día" : "días"}${atRisk ? ", juega hoy para no perderla" : ""}`
    : "Sin racha activa";

  return (
    <Animated.View style={{ transform: [{ scale: pop }, { rotate }] }}>
      <TouchableOpacity
        style={[styles.badge, !isActive && styles.badgeInactive, atRisk && styles.badgeAtRisk]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        {petEmoji ? (
          <Text style={styles.petEmoji}>{petEmoji}</Text>
        ) : (
          <Text style={styles.fireEmoji}>🔥</Text>
        )}
        <Text style={[styles.streakText, !isActive && styles.textInactive]}>
          {streak}
        </Text>
        {isActive && (
          <Animated.Text style={[styles.fireSmall, { opacity: flameOpacity, transform: [{ scale: flameScale }] }]}>
            🔥
          </Animated.Text>
        )}
      </TouchableOpacity>
      {riskLevel === 2 && (
        <View style={styles.riskDot} pointerEvents="none">
          <Text style={styles.riskDotText}>!</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    height: PILL_H,
    backgroundColor: "#D36B1E",
    paddingHorizontal: width * 0.018,
    borderRadius: width * 0.038,
    borderWidth: 1.5,
    borderColor: "#E6CCB2",
    gap: width * 0.004,
  },
  badgeInactive: {
    backgroundColor: "rgba(211, 107, 30, 0.4)",
    borderColor: "rgba(230, 204, 178, 0.4)",
  },
  badgeAtRisk: {
    backgroundColor: "#9E5A2A",
    borderColor: "#F8BE17",
  },
  petEmoji: {
    fontSize: width * 0.038,
    includeFontPadding: false,
  },
  fireEmoji: {
    fontSize: width * 0.035,
    includeFontPadding: false,
  },
  fireSmall: {
    fontSize: width * 0.025,
    includeFontPadding: false,
  },
  streakText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.031,
    includeFontPadding: false,
  },
  textInactive: {
    opacity: 0.6,
  },
  riskDot: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E53935",
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  riskDotText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    includeFontPadding: false,
  },
});
