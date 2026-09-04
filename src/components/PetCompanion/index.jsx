import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import usePetStore, { getMood, getStage } from '../../store/usePetStore';
import { playPetSound } from '../../utils/soundManager';
import { PARTICLE_DURATION } from './petAnimations';
import { FALLBACK_ASSETS, PET_ASSETS, STAGE_SIZES, getRegionSkin } from './petAssets';
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
 *   region    – string (e.g., 'CDMX', 'Norte') for regional accessories
 */
export default function PetCompanion({ reaction = null, compact = false, region = null, reduceMotion = false }) {
  const vinculo = usePetStore((s) => s.vinculo);
  const petType = usePetStore((s) => s.petType);
  const caricia = usePetStore((s) => s.caricia);

  const stage = getStage(vinculo);
  const mood = getMood(vinculo);

  // Resolve assets for this pet type + stage
  const typeAssets = (PET_ASSETS[petType] ?? FALLBACK_ASSETS)[stage] ?? (FALLBACK_ASSETS[stage] ?? FALLBACK_ASSETS[1]);

  const sizes = STAGE_SIZES[stage] ?? STAGE_SIZES[1];
  const size = compact ? sizes.compact : sizes.full;

  const skin = getRegionSkin(region);

  // Tap reaction — triggers celebrate animation on the sprite
  const [tapReaction, setTapReaction] = useState(null);
  const tapTimerRef = useRef(null);

  const handleTap = useCallback(() => {
    caricia(); // +5 vínculo
    playPetSound("happy", petType);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (!reduceMotion) {
      setTapReaction('correct');
      tapTimerRef.current = setTimeout(() => setTapReaction(null), 100);
    }
  }, [caricia, petType, reduceMotion]);

  // Particles burst on correct answer (game) or tap
  const [particlesVisible, setParticlesVisible] = useState(false);
  useEffect(() => {
    if (reaction === 'correct' && !reduceMotion) {
      setParticlesVisible(true);
      const t = setTimeout(() => setParticlesVisible(false), PARTICLE_DURATION + 100);
      return () => clearTimeout(t);
    }
  }, [reaction, reduceMotion]);

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
          skin={skin}
          reduceMotion={reduceMotion}
        />
        {particlesVisible && !reduceMotion && <PetParticles stage={stage} />}
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
