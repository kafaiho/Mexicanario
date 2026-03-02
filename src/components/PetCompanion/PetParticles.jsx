import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { STAGE_THEMES } from '../../theme/designTokens';
import { PARTICLE_COUNT, PARTICLE_DURATION, PARTICLE_SPREAD_RADIUS } from './petAnimations';

function Particle({ index, color, total }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(1);
  const scale      = useSharedValue(1);

  useEffect(() => {
    // Evenly distribute particles in a circle, with a little randomness
    const angle    = ((2 * Math.PI) / total) * index + (Math.random() - 0.5) * 0.8;
    const distance = PARTICLE_SPREAD_RADIUS * (0.6 + Math.random() * 0.4);
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 20; // slight upward bias

    translateX.value = withSpring(tx, { damping: 8, stiffness: 80 });
    translateY.value = withSpring(ty, { damping: 8, stiffness: 80 });

    opacity.value = withDelay(
      PARTICLE_DURATION * 0.3,
      withTiming(0, { duration: PARTICLE_DURATION * 0.7 })
    );
    scale.value = withTiming(0, { duration: PARTICLE_DURATION });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

/**
 * PetParticles — burst of colored dots on celebrate.
 * Props:
 *   stage – 1-6 (drives accent color)
 */
export default function PetParticles({ stage = 1 }) {
  const theme = STAGE_THEMES[stage] ?? STAGE_THEMES[1];
  const color = theme.accent;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <Particle key={i} index={i} color={color} total={PARTICLE_COUNT} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
