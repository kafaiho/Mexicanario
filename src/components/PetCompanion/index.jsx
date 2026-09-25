import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { normalizePetType } from '../../config/petTypes';
import usePetStore, { getStage, SKIN_CONFIG } from '../../store/usePetStore';
import { playPetSound } from '../../utils/soundManager';
import { PARTICLE_DURATION } from './petAnimations';
import Pet3DView from '../Pet3D/Pet3DView';
import { supports3D } from '../Pet3D/petModels';
import { STAGE_SIZES, bodyForMood, getRegionSkin, getStageAssets } from './petAssets';
import PetMoodIndicator from './PetMoodIndicator';
import { usePetMood } from './petMood';
import PetParticles from './PetParticles';
import PetSprite from './PetSprite';

const { height } = Dimensions.get('window');
const KEYBOARD_HEIGHT = Math.min(250, height * 0.37);

/**
 * PetCompanion — orquesta el sprite animado + partículas + store.
 *
 * Props:
 *   reaction  – 'correct' | 'combo' | 'wrong' | null  (driven by GameplayScreen)
 *   reactionKey – cambia en cada evento del juego para repetir la reacción
 *   compact   – boolean (true = flotando sobre teclado, false = pantalla completa)
 *   region    – string (e.g., 'CDMX', 'Norte') for regional accessories
 */
export default function PetCompanion({ reaction = null, reactionKey = 0, compact = false, region = null, reduceMotion = false }) {
  const vinculo = usePetStore((s) => s.vinculo);
  const petType = normalizePetType(usePetStore((s) => s.petType));
  const caricia = usePetStore((s) => s.caricia);
  const isFocused = useIsFocused();

  const stage = getStage(vinculo);
  const { mood } = usePetMood();

  // Resolve assets for this pet type + stage
  const stageAssets = getStageAssets(petType, stage);
  const moodBody = bodyForMood(stageAssets, mood);
  const typeAssets = moodBody === stageAssets.body ? stageAssets : { ...stageAssets, body: moodBody };

  const sizes = STAGE_SIZES[stage] ?? STAGE_SIZES[1];
  const size = compact ? sizes.compact : sizes.full;

  // El traje comprado se ve siempre; si no hay, un detalle de la región de la palabra
  const activeSkin = usePetStore((s) => s.activeSkin);
  const skin = (activeSkin && SKIN_CONFIG[activeSkin]?.emoji) || getRegionSkin(region);

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
    if ((reaction === 'correct' || reaction === 'combo') && !reduceMotion) {
      setParticlesVisible(true);
      const t = setTimeout(() => setParticlesVisible(false), PARTICLE_DURATION + 100);
      return () => clearTimeout(t);
    }
    setParticlesVisible(false);
    return undefined;
  }, [reaction, reactionKey, reduceMotion]);

  // Active reaction: game reaction takes priority, tap fills in otherwise
  const activeReaction = reaction || tapReaction;

  // Tecolote, Monarca y Ayotl en 3D; con movimiento reducido (o el Nahual) queda el sprite 2D
  const use3D = supports3D(petType) && !reduceMotion;
  const sprite = (
    <PetSprite
      assets={typeAssets}
      stage={stage}
      mood={mood}
      reaction={activeReaction}
      reactionKey={reactionKey}
      size={size}
      skin={skin}
      reduceMotion={reduceMotion}
    />
  );

  return (
    <TouchableOpacity
      onPress={handleTap}
      activeOpacity={1}
      style={compact ? styles.compact : styles.full}
    >
      <View style={{ width: size, height: size }}>
        {use3D ? (
          <Pet3DView
            petType={petType}
            stage={stage}
            size={size}
            active={isFocused}
            mood={mood}
            reaction={activeReaction}
            reactionKey={reactionKey}
            fps={30}
            fallback={sprite}
          />
        ) : sprite}
        <PetMoodIndicator mood={mood} size={size} reduceMotion={reduceMotion} />
        {particlesVisible && !reduceMotion && (
          <PetParticles key={reactionKey} stage={stage} count={reaction === 'combo' ? 14 : 8} />
        )}
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
