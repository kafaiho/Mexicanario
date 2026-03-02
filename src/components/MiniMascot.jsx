import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { getStreakTier, MINI_STREAK_VISUALS } from "../mascota/streakVisuals";

// Pet emoji map – mirrors MascotaScreen PET_TYPES
const PET_EMOJIS = {
  ajolote:  ["🥚", "🫧", "🦎", "🦎✨", "🐉"],
  xolo:     ["🥚", "🐾", "🐕", "🐕✨", "🦊"],
  alebrije: ["🥚", "🦋", "🎭", "🎭✨", "🦄"],
};

function getPetEmoji(petType, stage) {
  const emojis = PET_EMOJIS[petType];
  if (!emojis) return "🐾";
  return emojis[Math.min(stage, 4)] || "🐾";
}

/**
 * Lightweight 2D mascot using emoji + RN Animated.
 *
 * Props:
 *   size          – overall size (default 32)
 *   mascotaState  – "idle" | "celebrating" | "sad"  (override)
 *   petType       – force pet type (skip query)
 *   stage         – force stage (skip query)
 *   showBubble    – string to show in speech bubble (auto-dismiss 2s)
 *   autoFetch     – if true (default), fetch pet state from backend
 *   streakDays    – optional streak days (if not provided, self-fetches)
 */
export default function MiniMascot({
  size = 32,
  mascotaState: externalState,
  petType: externalType,
  stage: externalStage,
  showBubble,
  autoFetch = true,
  streakDays: externalStreakDays,
}) {
  const { userId } = useAuth();
  const petState = useQuery(
    api.pet.getPetState,
    autoFetch && userId ? { userId } : "skip"
  );
  // Self-fetch streak if not provided
  const shouldFetchStreak = externalStreakDays == null && autoFetch && userId;
  const streakStatus = useQuery(
    api.streaks.getStreakStatus,
    shouldFetchStreak ? { userId } : "skip"
  );

  const petType = externalType || petState?.petType || null;
  const stage = externalStage ?? petState?.stage ?? 1;
  const mascotaState = externalState || "idle";
  const streakDays = externalStreakDays ?? streakStatus?.currentStreak ?? 0;

  const tier = getStreakTier(streakDays);
  const visual = MINI_STREAK_VISUALS[tier];

  // Animations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim;
    if (mascotaState === "celebrating") {
      // Wiggle
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(wiggleAnim, { toValue: 1, duration: 120, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(wiggleAnim, { toValue: -1, duration: 240, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(wiggleAnim, { toValue: 0, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        ])
      );
      anim.start();
    } else if (mascotaState === "sad") {
      // Droop
      Animated.timing(bounceAnim, { toValue: -1, duration: 500, useNativeDriver: true }).start();
    } else {
      // Idle bounce
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      anim.start();
    }
    return () => { if (anim) anim.stop(); };
  }, [mascotaState]);

  // Pulsation animation for higher tiers
  useEffect(() => {
    if (visual.pulsate) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visual.pulsate]);

  // Bubble auto-dismiss
  const [bubbleVisible, setBubbleVisible] = useState(false);
  useEffect(() => {
    if (showBubble) {
      setBubbleVisible(true);
      const t = setTimeout(() => setBubbleVisible(false), 2000);
      return () => clearTimeout(t);
    }
    setBubbleVisible(false);
  }, [showBubble]);

  const emoji = petType ? getPetEmoji(petType, stage) : "🐾";
  const translateY = bounceAnim.interpolate({
    inputRange: [-1, 0],
    outputRange: [size * 0.08, 0],
  });
  const rotate = wiggleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-12deg", "0deg", "12deg"],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Bubble */}
      {bubbleVisible && showBubble ? (
        <View style={[styles.bubble, { bottom: size * 0.85 }]}>
          <Text style={styles.bubbleText}>{showBubble}</Text>
        </View>
      ) : null}

      {/* Fire emoji for tier ≥ 2 */}
      {visual.showFlameEmoji && (
        <Text style={{
          position: "absolute",
          top: -size * 0.2,
          fontSize: size * 0.35,
          textAlign: "center",
          zIndex: 5,
        }}>
          🔥
        </Text>
      )}

      {/* Decorative particle dots for tier ≥ 3 */}
      {visual.particleDots && (
        <>
          <View style={[styles.dot, {
            width: size * 0.1,
            height: size * 0.1,
            borderRadius: size * 0.05,
            backgroundColor: visual.glowColor,
            top: size * 0.1,
            left: -size * 0.08,
          }]} />
          <View style={[styles.dot, {
            width: size * 0.08,
            height: size * 0.08,
            borderRadius: size * 0.04,
            backgroundColor: visual.glowColor,
            bottom: size * 0.15,
            right: -size * 0.06,
          }]} />
          <View style={[styles.dot, {
            width: size * 0.07,
            height: size * 0.07,
            borderRadius: size * 0.035,
            backgroundColor: visual.borderColor,
            top: size * 0.6,
            left: -size * 0.05,
          }]} />
        </>
      )}

      <Animated.Text
        style={{
          fontSize: size * 0.72,
          lineHeight: size,
          textAlign: "center",
          transform: [{ translateY }, { rotate }, { scale: pulseAnim }],
          // Glow effect via text shadow
          textShadowColor: visual.glowColor,
          textShadowRadius: visual.glowRadius,
          textShadowOffset: { width: 0, height: 0 },
          // Border-like ring via background
          ...(visual.borderWidth > 0 && {
            borderRadius: size * 0.5,
            borderWidth: visual.borderWidth,
            borderColor: visual.borderColor,
            overflow: "hidden",
            width: size,
            height: size,
          }),
        }}
      >
        {emoji}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.78)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  bubbleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  dot: {
    position: "absolute",
    opacity: 0.7,
    zIndex: 3,
  },
});
