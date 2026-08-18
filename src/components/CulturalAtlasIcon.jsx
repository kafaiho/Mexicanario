import React from 'react';
import { Image, View } from 'react-native';

export default function CulturalAtlasIcon({
  asset,
  size,
  borderRadius = 12,
  accessibilityLabel = undefined,
  decorative = false,
  style = undefined,
}) {
  if (!asset || !Number.isFinite(size) || size <= 0) return null;

  const width = size * asset.cellAspect;
  const atlasHeight = size * asset.rows;
  const atlasWidth = atlasHeight * asset.atlasAspect;
  const source = typeof asset.source === 'function' ? asset.source() : asset.source;

  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={[{ width, height: size, overflow: 'hidden', borderRadius }, style]}
    >
      <Image
        source={source}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          width: atlasWidth,
          height: atlasHeight,
          left: -asset.col * width,
          top: -asset.row * size,
        }}
      />
    </View>
  );
}
