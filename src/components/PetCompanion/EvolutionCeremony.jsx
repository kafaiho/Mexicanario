import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import usePetStore from '../../store/usePetStore';
import { STAGE_THEMES } from '../../theme/designTokens';
import { playPetSound } from '../../utils/soundManager';
import { getStageAssets } from './petAssets';
import PetParticles from './PetParticles';

const CHARGE_MS = 1800;
const FLASH_IN_MS = 180;
const SIZE = 200;

const bodyFor = (petType, stage) => getStageAssets(petType, stage)?.body;

/**
 * EvolutionCeremony — se muestra cuando la mascota sube de etapa
 * (usePetStore.pendingEvolution). Solo aparece en la pantalla enfocada
 * donde está montada, para no interrumpir una partida.
 *
 * Secuencia: la forma anterior brilla y tiembla → destello → nueva forma.
 */
export default function EvolutionCeremony() {
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const pending = usePetStore((s) => s.pendingEvolution);
  const petType = usePetStore((s) => s.petType);
  const petName = usePetStore((s) => s.petName);
  const clearPendingEvolution = usePetStore((s) => s.clearPendingEvolution);

  const visible = !!pending && isFocused;
  const [phase, setPhase] = useState('charge'); // 'charge' | 'reveal'
  const timers = useRef([]);

  const shake = useSharedValue(0);
  const charge = useSharedValue(0);   // 0→1 silueta blanca y crecimiento
  const flash = useSharedValue(0);
  const revealScale = useSharedValue(0.3);

  useEffect(() => {
    if (!visible) return undefined;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (reduceMotion) {
      setPhase('reveal');
      revealScale.value = 1;
      playPetSound('happy', petType);
      return undefined;
    }

    setPhase('charge');
    charge.value = 0;
    flash.value = 0;
    revealScale.value = 0.3;
    charge.value = withTiming(1, { duration: CHARGE_MS, easing: Easing.in(Easing.quad) });
    shake.value = withRepeat(
      withSequence(withTiming(-4, { duration: 60 }), withTiming(4, { duration: 60 })),
      Math.round(CHARGE_MS / 120),
      true
    );

    timers.current.push(setTimeout(() => {
      flash.value = withSequence(
        withTiming(1, { duration: FLASH_IN_MS }),
        withTiming(0, { duration: 650, easing: Easing.out(Easing.quad) })
      );
    }, CHARGE_MS));
    timers.current.push(setTimeout(() => {
      setPhase('reveal');
      shake.value = 0;
      revealScale.value = withSpring(1, { damping: 7, stiffness: 120 });
      playPetSound('happy', petType);
    }, CHARGE_MS + FLASH_IN_MS));

    return () => timers.current.forEach(clearTimeout);
  }, [visible, reduceMotion, petType, pending?.to]);

  const oldStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value },
      { scale: 1 + charge.value * 0.15 },
    ],
  }));
  const silhouetteStyle = useAnimatedStyle(() => ({ opacity: charge.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const newStyle = useAnimatedStyle(() => ({ transform: [{ scale: revealScale.value }] }));

  if (!pending) return null;

  const theme = STAGE_THEMES[pending.to] ?? STAGE_THEMES[1];
  const oldBody = bodyFor(petType, pending.from);
  const newBody = bodyFor(petType, pending.to);
  const name = petName || 'Tu mascota';

  const close = () => {
    if (phase !== 'reveal') return;
    clearPendingEvolution();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button"
        accessibilityLabel={`${name} evolucionó a la etapa ${pending.to}, ${theme.name}. Toca para continuar.`}>
        <View style={[styles.glow, { backgroundColor: theme.glow, shadowColor: theme.primary }]} />

        <View style={styles.stageBox}>
          {phase === 'charge' ? (
            <Animated.View style={oldStyle}>
              <Image source={oldBody} style={styles.pet} resizeMode="contain" />
              <Animated.Image
                source={oldBody}
                style={[styles.pet, StyleSheet.absoluteFill, { tintColor: '#FFFFFF' }, silhouetteStyle]}
                resizeMode="contain"
              />
            </Animated.View>
          ) : (
            <Animated.View style={newStyle}>
              <Image source={newBody} style={styles.pet} resizeMode="contain" />
              {!reduceMotion && <PetParticles stage={pending.to} count={16} />}
            </Animated.View>
          )}
        </View>

        {phase === 'charge' ? (
          <Text style={styles.title}>¿Qué está pasando…?</Text>
        ) : (
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(400)} style={styles.textBlock}>
            <Text style={styles.title}>¡{name} evolucionó!</Text>
            <View style={[styles.pill, { borderColor: theme.primary, backgroundColor: theme.glow }]}>
              <Text style={[styles.pillText, { color: theme.primary }]}>
                Etapa {pending.to} · {theme.name}
              </Text>
            </View>
            <View style={[styles.button, { backgroundColor: theme.primary }]}>
              <Text style={styles.buttonText}>¡Órale! 🎉</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,10,18,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glow: {
    position: 'absolute',
    width: SIZE * 1.6,
    height: SIZE * 1.6,
    borderRadius: SIZE,
    shadowOpacity: 0.9,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  stageBox: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pet: { width: SIZE, height: SIZE },
  textBlock: { alignItems: 'center' },
  title: {
    marginTop: 24,
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  pill: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pillText: { fontSize: 15, fontWeight: '700' },
  button: {
    marginTop: 28,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 999,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  flash: { backgroundColor: '#FFFFFF' },
});
