import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Onboarding overlay with Mexicanario visual style.
 * Only shown on first install (controlled by useOnboarding hook).
 *
 * Props:
 *  visible       bool
 *  text          string         — message to display
 *  bubbleStyle   object         — absolute positioning for the speech bubble
 *  handStyle     object         — absolute positioning for the hand emoji
 *  handEmoji     string         — "👆" | "👇" | "👉" | "👈"
 *  handBounceDir "up" | "down"
 *  step          number         — 0-based current step
 *  total         number         — total steps
 *  onNext        func
 *  onSkip        func
 */
export default function OnboardingTooltip({
  visible,
  text,
  bubbleStyle,
  handStyle,
  handEmoji = "👆",
  handBounceDir = "down",
  step = 0,
  total = 1,
  onNext,
  onSkip,
}) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const loopRef    = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: 1, duration: 520, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 520, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
    return () => loopRef.current?.stop();
  }, [visible]);

  if (!visible) return null;

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: handBounceDir === "up" ? [0, -12] : [0, 12],
  });

  const isLast = step >= total - 1;

  return (
    <Animated.View
      style={[styles.overlay, { opacity: fadeAnim }]}
      pointerEvents={visible ? "box-none" : "none"}
    >
      {/* Tap anywhere on dimmed area to advance */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onNext} />

      {/* Animated hand pointer */}
      <Animated.Text
        style={[styles.hand, handStyle, { transform: [{ translateY }] }]}
        pointerEvents="none"
      >
        {handEmoji}
      </Animated.Text>

      {/* Speech bubble — Mexicanario style */}
      <View style={[styles.bubble, bubbleStyle]}>

        {/* Decorative top stripe */}
        <View style={styles.topStripe} />

        {/* Message */}
        <Text style={styles.bubbleText}>{text}</Text>

        {/* Footer: skip · dots · next */}
        <View style={styles.footer}>
          <Pressable onPress={onSkip} hitSlop={10}>
            <Text style={styles.skipText}>Omitir</Text>
          </Pressable>

          <View style={styles.dots}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <Pressable onPress={onNext} style={styles.nextBtn} hitSlop={10}>
            <Text style={styles.nextText}>
              {isLast ? "¡Entendido! ✓" : "Siguiente →"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "rgba(60, 15, 0, 0.60)",
  },

  // Big bouncing hand emoji
  hand: {
    position: "absolute",
    fontSize: 52,
    zIndex: 10000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  // Speech bubble card — warm cream with terracotta border
  bubble: {
    position: "absolute",
    backgroundColor: "#FFF8EC",
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: "#8B4513",
    overflow: "hidden",
    maxWidth: 340,
    shadowColor: "#5C2800",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 16,
    zIndex: 10001,
  },

  // Terracotta accent bar at the top of the bubble
  topStripe: {
    height: 6,
    backgroundColor: "#D36B1E",
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    marginBottom: 14,
  },

  bubbleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5C2800",
    textAlign: "center",
    lineHeight: 23,
    marginHorizontal: 18,
    marginBottom: 16,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  skipText: {
    fontSize: 13,
    color: "#B38E6A",
    fontWeight: "600",
  },

  dots: { flexDirection: "row", gap: 5 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D2B48C",
  },
  dotActive: {
    backgroundColor: "#D36B1E",
    width: 16,
  },

  nextBtn: {
    backgroundColor: "#D36B1E",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  nextText: {
    fontSize: 13,
    color: "white",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
