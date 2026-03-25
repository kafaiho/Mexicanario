import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../theme/designTokens";

const { width } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";

/**
 * Motivational toast that slides in from the bottom after solving a word.
 *
 * Props:
 *   visible: boolean
 *   message: string (e.g. "Tu cuate @chalupa tiene 342 XP. Tú llevas 298. ¡Faltan 44!")
 *   onDone: () => void — called after auto-dismiss
 */
export default function FriendToast({ visible, message, onDone }) {
  const slideY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && message) {
      // Slide in
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3.5s
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideY, {
            toValue: 100,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDone?.();
        });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [visible, message]);

  if (!visible || !message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Text style={styles.icon}>🔥</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 140,
    left: width * 0.06,
    right: width * 0.06,
    zIndex: 999,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(82, 54, 0, 0.92)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(248,190,23,0.35)",
  },
  icon: {
    fontSize: width * 0.045,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: width * 0.028,
    color: "#FFE4B5",
    flex: 1,
  },
});
