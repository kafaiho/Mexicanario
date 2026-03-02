import React from 'react';
import { Image, View } from 'react-native';
import { FALLBACK_ASSETS, PET_ASSETS } from './petAssets';

/**
 * StageCropped — muestra el sprite estático de la etapa indicada.
 * Usa el mismo sistema de sprite sheet que PetSprite (sin animaciones Reanimated).
 *
 * Props:
 *   petType  – 'alebrije' | 'xolo' | 'ajolote'
 *   stage    – 1-6
 *   size     – display width = height en dp
 *   style    – aplicado al View wrapper
 */
export default function StageCropped({ petType, stage, size, style }) {
  const s          = Math.max(1, Math.min(6, stage));
  const typeAssets = PET_ASSETS[petType] ?? FALLBACK_ASSETS;
  const crop       = typeAssets[s] ?? typeAssets[1];
  const scale      = size / Math.max(crop.w, crop.h);
  const imgW       = typeAssets.sheetWidth * scale;
  const imgH       = typeAssets.sheetHeight * scale;
  const offX       = crop.x * scale;
  const offY       = crop.y * scale;

  return (
    <View style={[{ width: size, height: size, overflow: 'hidden' }, style]}>
      <Image
        source={typeAssets.sheet}
        style={{ position: 'absolute', width: imgW, height: imgH, left: -offX, top: -offY }}
        resizeMode="stretch"
      />
    </View>
  );
}
