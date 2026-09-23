import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { STAGE_THEMES } from '../../theme/designTokens';

const PARTICLE_SYMBOLS = ['✨', '💖', '⭐', '🌟', '💫', '🧡'];

function Particle({ index, color, symbol, total }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.4);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const angle = ((2 * Math.PI) / total) * index + (Math.random() - 0.5) * 0.9;
    const distance = 55 + Math.random() * 45;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 25; // upward bias

    translateX.value = withSpring(tx, { damping: 9, stiffness: 90 });
    translateY.value = withSpring(ty, { damping: 9, stiffness: 90 });
    rotate.value = withTiming((Math.random() - 0.5) * 60, { duration: 800 });
    scale.value = withSpring(1 + Math.random() * 0.3, { damping: 6, stiffness: 120 });

    opacity.value = withDelay(
      350,
      withTiming(0, { duration: 450 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  if (symbol) {
    return (
      <Animated.View style={[styles.symbolContainer, style]}>
        <Text style={styles.symbolText}>{symbol}</Text>
      </Animated.View>
    );
  }

  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

/**
 * PetParticles — 60 FPS burst of luminous orbs & sparkles on pet tap/feed.
 */
function PetParticles({ stage = 1, count = 8 }) {
  const theme = STAGE_THEMES[stage] ?? STAGE_THEMES[1];
  const color = theme.primary || '#FFB800';

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => {
        const isSymbol = i % 2 === 0;
        const symbol = isSymbol ? PARTICLE_SYMBOLS[i % PARTICLE_SYMBOLS.length] : null;
        return (
          <Particle
            key={i}
            index={i}
            color={color}
            symbol={symbol}
            total={count}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  symbolContainer: {
    position: 'absolute',
  },
  symbolText: {
    fontSize: 18,
  },
});

export default React.memo(PetParticles);
