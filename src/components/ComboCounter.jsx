import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

/**
 * Floating combo counter overlay for gameplay.
 * Shows "🔥 xN Combo!" with bounce animation.
 * Props:
 *   comboCount: number (0 = hidden)
 */
export default function ComboCounter({ comboCount }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (comboCount >= 2) {
      // Bounce in
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(1);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();

      // Fade out after 2 seconds
      const timer = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      opacityAnim.setValue(0);
    }
  }, [comboCount]);

  if (comboCount < 2) return null;

  // Visual tiers
  let color = "#FF6B35"; // orange (2-4)
  let label = "";
  if (comboCount >= 10) {
    color = "#F8BE17"; // gold
    label = " 2x";
  } else if (comboCount >= 5) {
    color = "#E05C7A"; // pink-red
    label = " 1.5x";
  } else if (comboCount >= 3) {
    color = "#FF6B35"; // orange
    label = " 1.25x";
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={[styles.comboText, { color }]}>
          🔥 x{comboCount} Combo!
        </Text>
        {label ? (
          <Text style={[styles.multiplierText, { color }]}>{label} Monedas</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: height * 0.13,
    alignSelf: "center",
    zIndex: 200,
  },
  badge: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderRadius: width * 0.04,
    borderWidth: 2,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.008,
    alignItems: "center",
  },
  comboText: {
    fontSize: width * 0.05,
    fontWeight: "900",
  },
  multiplierText: {
    fontSize: width * 0.03,
    fontWeight: "bold",
    marginTop: -2,
  },
});
