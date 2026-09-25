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
  useReducedMotion,
} from 'react-native-reanimated';
import { normalizePetType } from '../../config/petTypes';
import Pet3DView from '../Pet3D/Pet3DView';
import { supports3D } from '../Pet3D/petModels';
import StageCropped from './StageCropped';
import PetParticles from './PetParticles';
import PetMoodIndicator from './PetMoodIndicator';
import { MOOD_POSE } from './petAnimations';

/**
 * FloatingMascot — mascota de la pantalla Mascota.
 * Tecolote, Monarca y Ayotl se dibujan en 3D (giran con el dedo, reaccionan al
 * tocarlas y llevan la llama de la racha). El Nahual sigue en 2D con Reanimated:
 * respiración, squash & stretch, partículas y sombra.
 */
function FloatingMascot({
  petType, stage = 1, size = 160, onTap, activeSkin, active = true, mood = 'happy',
  showFlame = false, streakDays = 0, streakStatus = 'activa',
}) {
  const type = normalizePetType(petType);
  const use3D = supports3D(type);
  const reduceMotion = useReducedMotion();
  const [tapKey, setTapKey] = useState(0);
  const pose = MOOD_POSE[mood] ?? MOOD_POSE.happy;
  const floatY = useSharedValue(0);
  const squashX = useSharedValue(1);
  const squashY = useSharedValue(1);
  const rotateVal = useSharedValue(0);
  const [burstKey, setBurstKey] = useState(0);

  // ── 60 FPS Idle float loop + gentle breathing/sway (UI thread) ───────────
  useEffect(() => {
    if (!active || use3D) {
      cancelAnimation(floatY);
      cancelAnimation(rotateVal);
      floatY.value = 0;
      rotateVal.value = 0;
      return;
    }
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500 * pose.breath, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1500 * pose.breath, easing: Easing.inOut(Easing.cubic) })
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
  }, [active, use3D, pose.breath]);

  // ── Tap bounce with squash, stretch & wobble ───────────────────────────────
  const handlePress = useCallback(() => {
    // Trigger particle burst
    setBurstKey((k) => k + 1);
    setTapKey((k) => k + 1);

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

  const staticPet = (
    <StageCropped petType={type} stage={stage} size={size} activeSkin={activeSkin} mood={mood} />
  );

  if (use3D) {
    return (
      <Pressable onPress={handlePress} style={styles.container} accessibilityRole="button" accessibilityLabel="Acariciar a tu mascota">
        {burstKey > 0 ? <PetParticles key={burstKey} stage={stage} count={9} /> : null}
        <Pet3DView
          petType={type}
          stage={stage}
          size={size}
          active={active}
          reduceMotion={reduceMotion}
          interactive
          mood={mood}
          reaction={tapKey ? 'tap' : null}
          reactionKey={tapKey}
          showFlame={showFlame}
          streakDays={streakDays}
          streakStatus={streakStatus}
          fallback={staticPet}
        />
        <PetMoodIndicator mood={mood} size={size} reduceMotion={!active} />
      </Pressable>
    );
  }

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
        {/* Postura de ánimo: encogida y más apagada si tiene hambre/triste/sueño */}
        <View style={{ opacity: pose.opacity, transform: [{ translateY: pose.y * size }, { scale: pose.scale }] }}>
          {staticPet}
        </View>
        <PetMoodIndicator mood={mood} size={size} reduceMotion={!active} />
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
