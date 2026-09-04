import React, { useRef, useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Pressable } from "react-native";
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
const JuicyButton = React.memo(function JuicyButton({
  onPress,
  onPressIn: onPressInProp,
  onPressOut: onPressOutProp,
  style,
  children,
  intensity = "light",
  sound = "click",
  disabled = false,
  scaleDown = 0.92,
  ...pressableProps
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const handlePressIn = useCallback(() => {
    // 1. Animación: compresión rápida
    if (reduceMotion) scaleAnim.setValue(scaleDown);
    else Animated.spring(scaleAnim, {
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
  }, [scaleDown, intensity, sound, scaleAnim, onPressInProp, reduceMotion]);

  const handlePressOut = useCallback(() => {
    // Rebote elástico al soltar — el "jugo"
    if (reduceMotion) scaleAnim.setValue(1);
    else Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 28,       // velocidad del rebote
      bounciness: 12,  // elasticidad visible pero no exagerada
      useNativeDriver: true,
    }).start();

    if (onPressOutProp) onPressOutProp();
  }, [scaleAnim, onPressOutProp, reduceMotion]);

  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      onPress();
    }
  }, [disabled, onPress]);

  return (
    <Pressable
      {...pressableProps}
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
});

export default JuicyButton;
