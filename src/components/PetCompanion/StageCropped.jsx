import React from 'react';
import { Image, Text, View } from 'react-native';
import SKIN_CONFIG from '../../constants/skinConfig';
import { bodyForMood, getStageAssets } from './petAssets';

/**
 * StageCropped — shows a static image for the given pet type and stage.
 *
 * Props:
 *   petType    – 'tecolote' | 'monarca' | 'ayotl' | 'nahual_*' (acepta los tipos anteriores)
 *   stage      – 1-6
 *   size       – display width = height in dp
 *   style      – applied to the wrapper View
 *   activeSkin – skin ID string or null/undefined (no skin)
 *   mood       – optional mood; uses mood art when it exists
 */
function StageCropped({ petType, stage, size, style, activeSkin, mood }) {
  const stageAssets = getStageAssets(petType, stage);
  const src         = bodyForMood(stageAssets, mood);

  const skinCfg = activeSkin ? SKIN_CONFIG[activeSkin] : null;

  return (
    <View
      style={[
        { width: size, height: size },
        style,
        skinCfg && {
          borderRadius: size * 0.18,
          borderWidth: 3,
          borderColor: skinCfg.borderColor,
        },
      ]}
    >
      <Image
        source={src}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
      {skinCfg && (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            backgroundColor: skinCfg.bgColor,
            borderRadius: 8,
            paddingHorizontal: 3,
            paddingVertical: 1,
          }}
        >
          <Text style={{ fontSize: Math.max(10, size * 0.16) }}>{skinCfg.emoji}</Text>
        </View>
      )}
    </View>
  );
}

export default React.memo(StageCropped);
