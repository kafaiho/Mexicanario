import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

const COLORS = ["#F8BE17", "#FF6B35", "#E0559A", "#4CAF50", "#29B6F6", "#FFF3B0"];

/**
 * Ráfaga de confeti (o emojis, p. ej. dulces de piñata) que sale de un punto,
 * sube y cae con "gravedad". Se dispara cada vez que cambia `burstKey` (> 0).
 * Colócalo con `style` ({ left, top } absolutos) dentro del contenedor.
 */
export default function ConfettiBurst({ burstKey, style, count = 22, emojis = null, distance = 150 }) {
  const reduceMotion = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35;
      const dist = distance * (0.6 + Math.random() * 0.6);
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist * 0.8 - distance * 0.45,
        fall: 70 + Math.random() * 70,
        spin: (Math.random() < 0.5 ? -1 : 1) * (300 + Math.random() * 420),
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 5,
        emoji: emojis ? emojis[i % emojis.length] : null,
      };
    }),
    [burstKey, count, distance]
  );

  useEffect(() => {
    if (!burstKey || reduceMotion) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 1300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [burstKey, reduceMotion]);

  if (!burstKey || reduceMotion) return null;

  return (
    <View pointerEvents="none" style={[styles.origin, style]}>
      {pieces.map((p, i) => {
        const pieceStyle = {
          position: "absolute",
          opacity: anim.interpolate({ inputRange: [0, 0.05, 0.75, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
            { translateY: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.dy, p.dy + p.fall] }) },
            { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin}deg`] }) },
          ],
        };
        return p.emoji ? (
          <Animated.Text key={i} style={[pieceStyle, styles.emoji]}>{p.emoji}</Animated.Text>
        ) : (
          <Animated.View
            key={i}
            style={[pieceStyle, { width: p.w, height: p.w * 1.6, borderRadius: 2, backgroundColor: p.color }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: {
    position: "absolute",
    width: 0,
    height: 0,
    overflow: "visible",
  },
  emoji: {
    fontSize: 22,
    marginLeft: -11,
    marginTop: -14,
  },
});
