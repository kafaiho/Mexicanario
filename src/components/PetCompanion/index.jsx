import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import usePetStore, { getMood, getStage } from '../../store/usePetStore';
import { FALLBACK_ASSETS, PET_ASSETS, STAGE_SIZES } from './petAssets';
import { PARTICLE_DURATION } from './petAnimations';
import PetParticles from './PetParticles';
import PetSprite from './PetSprite';

const { height } = Dimensions.get('window');
const KEYBOARD_HEIGHT = Math.min(250, height * 0.37);

/**
 * PetCompanion — orquesta el sprite animado + partículas + store.
 *
 * Props:
 *   reaction  – 'correct' | 'wrong' | null  (driven by GameplayScreen)
 *   compact   – boolean (true = flotando sobre teclado, false = pantalla completa)
 */
export default function PetCompanion({ reaction = null, compact = false }) {
  const vinculo = usePetStore((s) => s.vinculo);
  const petType = usePetStore((s) => s.petType);
  const caricia = usePetStore((s) => s.caricia);

  const stage = getStage(vinculo);
  const mood  = getMood(vinculo);

  // Resolve sprite sheet assets for this pet type
  const typeAssets = PET_ASSETS[petType] ?? FALLBACK_ASSETS;

  const sizes = STAGE_SIZES[stage] ?? STAGE_SIZES[1];
  const size  = compact ? sizes.compact : sizes.full;

  // Tap reaction — triggers celebrate animation on the sprite
  const [tapReaction, setTapReaction] = useState(null);
  const tapTimerRef = useRef(null);

  const handleTap = useCallback(() => {
    caricia(); // +5 vínculo
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    setTapReaction('correct');
    tapTimerRef.current = setTimeout(() => setTapReaction(null), 100);
  }, [caricia]);

  // Particles burst on correct answer (game) or tap
  const [particlesVisible, setParticlesVisible] = useState(false);
  useEffect(() => {
    if (reaction === 'correct') {
      setParticlesVisible(true);
      const t = setTimeout(() => setParticlesVisible(false), PARTICLE_DURATION + 100);
      return () => clearTimeout(t);
    }
  }, [reaction]);

  // Active reaction: game reaction takes priority, tap fills in otherwise
  const activeReaction = reaction || tapReaction;

  return (
    <TouchableOpacity
      onPress={handleTap}
      activeOpacity={1}
      style={compact ? styles.compact : styles.full}
    >
      <View style={{ width: size, height: size }}>
        <PetSprite
          assets={typeAssets}
          stage={stage}
          mood={mood}
          reaction={activeReaction}
          size={size}
        />
        {particlesVisible && <PetParticles stage={stage} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  compact: {
    position: 'absolute',
    bottom: KEYBOARD_HEIGHT + 8,
    right: 12,
    zIndex: 10,
  },
  full: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
