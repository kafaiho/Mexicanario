import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import StageCropped from './StageCropped';
import PetParticles from './PetParticles';

/**
 * FloatingMascot — 60 FPS Reanimated mascot companion with live breathing,
 * squash & stretch physics, particle burst, and dynamic shadow.
 */
function FloatingMascot({ petType, stage = 1, size = 160, onTap, activeSkin, active = true }) {
  const floatY = useSharedValue(0);
  const squashX = useSharedValue(1);
  const squashY = useSharedValue(1);
  const rotateVal = useSharedValue(0);
  const [burstKey, setBurstKey] = useState(0);

  // ── 60 FPS Idle float loop + gentle breathing/sway (UI thread) ───────────
  useEffect(() => {
    if (!active) {
      cancelAnimation(floatY);
      cancelAnimation(rotateVal);
      floatY.value = 0;
      rotateVal.value = 0;
      return;
    }
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      false
    );

    rotateVal.value = withRepeat(
      withSequence(
        withTiming(-2.2, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(2.2, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(floatY);
      cancelAnimation(rotateVal);
    };
  }, [active]);

  // ── Tap bounce with squash, stretch & wobble ───────────────────────────────
  const handlePress = useCallback(() => {
    // Trigger particle burst
    setBurstKey((k) => k + 1);

    // Squash down
    squashX.value = withSequence(
      withTiming(1.18, { duration: 70 }),
      withTiming(0.88, { duration: 90 }),
      withSpring(1, { damping: 4, stiffness: 220 })
    );

    squashY.value = withSequence(
      withTiming(0.82, { duration: 70 }),
      withTiming(1.16, { duration: 90 }),
      withSpring(1, { damping: 4, stiffness: 220 })
    );

    // Playful rotation kick
    const kickDir = Math.random() > 0.5 ? 8 : -8;
    rotateVal.value = withSequence(
      withTiming(kickDir, { duration: 90 }),
      withSpring(0, { damping: 5, stiffness: 200 })
    );

    onTap?.();
  }, [onTap]);

  // ── Animated styles ──────────────────────────────────────────────────────
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scaleX: squashX.value },
      { scaleY: squashY.value },
      { rotate: `${rotateVal.value}deg` },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(floatY.value, [-12, 0], [0.09, 0.28]);
    const scaleX = interpolate(floatY.value, [-12, 0], [0.78, 1.12]);
    return {
      opacity,
      transform: [{ scaleX }],
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      style={styles.container}
    >
      {/* Particle burst emitter */}
      {burstKey > 0 ? (
        <PetParticles key={burstKey} stage={stage} count={9} />
      ) : null}

      {/* Mascot with float + squash/stretch + sway */}
      <Animated.View style={mascotStyle}>
        <StageCropped petType={petType} stage={stage} size={size} activeSkin={activeSkin} />
      </Animated.View>

      {/* Dynamic ground shadow */}
      <Animated.View
        style={[
          styles.shadow,
          { width: size * 0.55 },
          shadowStyle,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    height: 11,
    borderRadius: 6,
    backgroundColor: '#3D2005',
    marginTop: -4,
  },
});

export default React.memo(FloatingMascot);
