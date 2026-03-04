import React, { useRef, useCallback } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { tapLight, tapMedium } from "../services/haptics";
import { playSound } from "../utils/soundManager";

/**
 * JuicyButton — Botón con retroalimentación multisensorial tipo Duolingo.
 *
 * Dispara en paralelo al presionar:
 *   1. Spring animation (scale 0.92 → 1.0 con rebote elástico)
 *   2. Sonido "click" instantáneo
 *   3. Haptic Light Impact (~6ms)
 *
 * Props:
 *   onPress    — callback al tocar
 *   style      — estilos del contenedor
 *   children   — contenido del botón
 *   intensity  — "light" (default) | "medium" | "heavy"
 *   sound      — nombre del sonido (default "click")
 *   disabled   — desactiva interacción
 *   scaleDown  — escala al presionar (default 0.92)
 */
export default function JuicyButton({
  onPress,
  onPressIn: onPressInProp,
  onPressOut: onPressOutProp,
  style,
  children,
  intensity = "light",
  sound = "click",
  disabled = false,
  scaleDown = 0.92,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    // 1. Animación: compresión rápida
    Animated.spring(scaleAnim, {
      toValue: scaleDown,
      speed: 50,      // muy rápido — sin lag perceptible
      bounciness: 0,  // sin rebote en la bajada
      useNativeDriver: true,
    }).start();

    // 2. Háptico instantáneo (fire-and-forget, ~6ms en iOS)
    if (intensity === "medium") {
      tapMedium();
    } else {
      tapLight();
    }

    // 3. Sonido instantáneo (precargado en memoria, ~2ms)
    if (sound) {
      playSound(sound);
    }

    if (onPressInProp) onPressInProp();
  }, [scaleDown, intensity, sound, scaleAnim, onPressInProp]);

  const handlePressOut = useCallback(() => {
    // Rebote elástico al soltar — el "jugo"
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 28,       // velocidad del rebote
      bounciness: 12,  // elasticidad visible pero no exagerada
      useNativeDriver: true,
    }).start();

    if (onPressOutProp) onPressOutProp();
  }, [scaleAnim, onPressOutProp]);

  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      onPress();
    }
  }, [disabled, onPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [{ opacity: disabled ? 0.5 : 1 }]}
    >
      <Animated.View
        style={[
          style,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
