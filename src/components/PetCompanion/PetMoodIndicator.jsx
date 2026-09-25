import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MOOD_CONFIG } from './petMood';

/**
 * PetMoodIndicator — emoji que flota sobre la mascota según su ánimo
 * (🌮 hambre, 💧 triste, 💤 sueño, ❤️ feliz de la vida).
 * Sube, se desvanece y se repite. Con reduceMotion queda fijo.
 */
function PetMoodIndicator({ mood, size, reduceMotion = false }) {
  const emoji = MOOD_CONFIG[mood]?.emoji;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!emoji || reduceMotion) {
      cancelAnimation(progress);
      progress.value = 0.5;
      return undefined;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
        withDelay(900, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [emoji, reduceMotion, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: reduceMotion ? 1 : p < 0.15 ? p / 0.15 : 1 - Math.max(0, p - 0.6) / 0.4,
      transform: [
        { translateY: -p * size * 0.35 },
        { translateX: Math.sin(p * Math.PI * 2) * size * 0.05 },
        { scale: 0.8 + p * 0.3 },
      ],
    };
  });

  if (!emoji) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { top: -size * 0.05, right: -size * 0.05 }, style]}
    >
      <Text style={{ fontSize: Math.max(14, size * 0.22) }}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 50,
  },
});

export default React.memo(PetMoodIndicator);
