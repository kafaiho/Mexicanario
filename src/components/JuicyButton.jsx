import React, { useCallback } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { tapLight, tapMedium } from "../services/haptics";
import { playSound } from "../utils/soundManager";

/**
 * JuicyButton — botón Reanimated con respuesta multisensorial.
 * La transformación se ejecuta en el hilo de UI para mantener una pulsación fluida.
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
  reduceMotion = false,
  ...pressableProps
}) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = reduceMotion
      ? scaleDown
      : withTiming(scaleDown, { duration: 60 });

    if (intensity === "medium") {
      tapMedium();
    } else {
      tapLight();
    }

    if (sound) {
      playSound(sound);
    }

    if (onPressInProp) onPressInProp();
  }, [scale, scaleDown, intensity, sound, onPressInProp, reduceMotion]);

  const handlePressOut = useCallback(() => {
    scale.value = reduceMotion
      ? 1
      : withSpring(1, { damping: 4, stiffness: 280 });
    if (onPressOutProp) onPressOutProp();
  }, [scale, onPressOutProp, reduceMotion]);

  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      onPress();
    }
  }, [disabled, onPress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      {...pressableProps}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View style={[style, animStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
});

export default JuicyButton;
