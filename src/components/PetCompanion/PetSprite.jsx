import React, { useCallback, useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  cancelAnimation,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  BREATHING,
  CELEBRATE_SPRING,
  CELEBRATE_TRANSLATE_Y,
  PARALLAX,
  SAD_DROOP,
  SHADOW_OPACITY_RANGE,
  SHADOW_SCALEX_RANGE,
  TAP_SPRING_BACK,
  TAP_SQUASH,
  TAP_STRETCH,
} from './petAnimations';

/**
 * PetSprite — renderer multi-capa Reanimated.
 *
 * Layers (back → front):
 *   [shadow] → [aura] → [wings] → [body]
 *
 * Props:
 *   assets   – { body, wings?, aura? } sources
 *   stage    – 1-6
 *   mood     – 'idle' | 'happy' | 'sad' | 'neutral' | 'joyful'
 *   reaction – 'correct' | 'wrong' | null
 *   size     – container size in dp
 *   skin     – text/emoji or image source for regional accessory
 */
export default function PetSprite({ assets, stage, mood, reaction, size, skin, reduceMotion = false }) {
  // ── Shared values ────────────────────────────────────────────────────────
  const breathScale = useSharedValue(1.0);
  const celebrateY = useSharedValue(0);
  const squashX = useSharedValue(1.0);
  const squashY = useSharedValue(1.0);
  const sadY = useSharedValue(0);
  const sadScaleV = useSharedValue(1.0);
  // Parallax per layer (oscillate up/down)
  const bodyParallax = useSharedValue(0);
  const wingsParallax = useSharedValue(0);
  const auraParallax = useSharedValue(0);

  // ── Breathing loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(breathScale);
      breathScale.value = 1;
      return undefined;
    }
    breathScale.value = withRepeat(
      withSequence(
        withTiming(BREATHING.to, { duration: BREATHING.duration, easing: BREATHING.easing }),
        withTiming(1.0, { duration: BREATHING.duration, easing: BREATHING.easing })
      ),
      -1,
      false
    );
  }, [reduceMotion, breathScale]);

  // ── Parallax loops (phase-offset per layer via inverted start) ───────────
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(bodyParallax);
      cancelAnimation(wingsParallax);
      cancelAnimation(auraParallax);
      bodyParallax.value = 0;
      wingsParallax.value = 0;
      auraParallax.value = 0;
      return undefined;
    }
    const { amplitude: bA, period: bP } = PARALLAX.body;
    bodyParallax.value = -bA;
    bodyParallax.value = withRepeat(
      withSequence(
        withTiming(bA, { duration: bP / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(-bA, { duration: bP / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    const { amplitude: wA, period: wP } = PARALLAX.wings;
    wingsParallax.value = wA; // opposite start = ~180° phase
    wingsParallax.value = withRepeat(
      withSequence(
        withTiming(-wA, { duration: wP / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(wA, { duration: wP / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    const { amplitude: aA, period: aP } = PARALLAX.aura;
    auraParallax.value = 0;
    auraParallax.value = withRepeat(
      withSequence(
        withTiming(aA, { duration: aP / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(-aA, { duration: aP / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [reduceMotion, bodyParallax, wingsParallax, auraParallax]);

  // ── Celebrate ────────────────────────────────────────────────────────────
  const triggerCelebrate = useCallback(() => {
    // Clear sad state
    sadY.value = withTiming(0, { duration: 200 });
    sadScaleV.value = withTiming(1.0, { duration: 200 });

    // Spring bounce up then back
    celebrateY.value = withSpring(
      CELEBRATE_TRANSLATE_Y,
      CELEBRATE_SPRING,
      () => { celebrateY.value = withSpring(0, CELEBRATE_SPRING); }
    );

    // Squash then stretch then spring back
    squashX.value = withSequence(
      withTiming(TAP_SQUASH.scaleX, { duration: TAP_SQUASH.duration }),
      withTiming(TAP_STRETCH.scaleX, { duration: TAP_STRETCH.duration }),
      withSpring(1.0, TAP_SPRING_BACK)
    );
    squashY.value = withSequence(
      withTiming(TAP_SQUASH.scaleY, { duration: TAP_SQUASH.duration }),
      withTiming(TAP_STRETCH.scaleY, { duration: TAP_STRETCH.duration }),
      withSpring(1.0, TAP_SPRING_BACK)
    );
  }, []);

  // ── Sad droop ────────────────────────────────────────────────────────────
  const triggerSad = useCallback(() => {
    sadY.value = withTiming(SAD_DROOP.translateY, { duration: SAD_DROOP.duration, easing: SAD_DROOP.easing });
    sadScaleV.value = withTiming(SAD_DROOP.scale, { duration: SAD_DROOP.duration, easing: SAD_DROOP.easing });
    // Auto-recover after 1.5s
    setTimeout(() => {
      sadY.value = withTiming(0, { duration: 400 });
      sadScaleV.value = withTiming(1.0, { duration: 400 });
    }, 1500);
  }, []);

  // ── React to reaction prop ───────────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) return;
    if (reaction === 'correct') triggerCelebrate();
    else if (reaction === 'wrong') triggerSad();
  }, [reaction, reduceMotion, triggerCelebrate, triggerSad]);

  // ── Shadow (derived from breathScale) ────────────────────────────────────
  const shadowOpacity = useDerivedValue(() =>
    interpolate(breathScale.value, [1.0, BREATHING.to], SHADOW_OPACITY_RANGE)
  );
  const shadowScaleX = useDerivedValue(() =>
    interpolate(breathScale.value, [1.0, BREATHING.to], SHADOW_SCALEX_RANGE)
  );

  // ── Animated styles ──────────────────────────────────────────────────────
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity.value,
    transform: [{ scaleX: shadowScaleX.value }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: breathScale.value * squashX.value },
      { scaleY: breathScale.value * squashY.value * sadScaleV.value },
      { translateY: bodyParallax.value + celebrateY.value + sadY.value },
    ],
  }));

  const wingsStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: wingsParallax.value + celebrateY.value * 0.7 },
    ],
  }));

  const auraStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: auraParallax.value + celebrateY.value * 0.4 },
    ],
  }));

  // ── Sprite sheet render (new system) ────────────────────────────────────
  if (assets?.sheet) {
    const crop = assets[stage] ?? assets[1];
    const scale = size / Math.max(crop.w, crop.h);
    const imgW = assets.sheetWidth * scale;
    const imgH = assets.sheetHeight * scale;
    const offX = crop.x * scale;
    const offY = crop.y * scale;

    return (
      <View style={[styles.container, { width: size, height: size }]}>
        {/* Shadow */}
        <Animated.View style={[styles.shadow, shadowStyle]} />

        {/* Cropped sprite: Animated.View handles animations, Image fills it */}
        <View style={{ overflow: 'hidden', width: size, height: size }}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: imgW,
                height: imgH,
                left: -offX,
                top: -offY,
              },
              bodyStyle,
            ]}
          >
            <Image
              source={assets.sheet}
              style={{ width: imgW, height: imgH }}
              resizeMode="stretch"
            />
          </Animated.View>
        </View>

        {/* Accessory/Skin layer for Sprite Sheet */}
        {skin ? (
          <Animated.View style={[styles.layer, { width: size, height: size, alignItems: 'center', justifyContent: 'center' }, bodyStyle]} pointerEvents="none">
            <Text style={{ fontSize: size * 0.35, position: 'absolute', top: size * -0.1, left: size * 0.4 }}>{skin}</Text>
          </Animated.View>
        ) : null}
      </View>
    );
  }

  // ── Legacy multi-layer render (backward compat) ──────────────────────────
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Shadow — scales inverse to breathing for ground contact feeling */}
      <Animated.View style={[styles.shadow, shadowStyle]} />

      {/* Aura layer — stage 6, deepest parallax, behind everything */}
      {assets?.aura ? (
        <Animated.Image
          source={assets.aura}
          style={[styles.layer, { width: size * 1.3, height: size * 1.3 }, auraStyle]}
          resizeMode="contain"
        />
      ) : null}

      {/* Wings layer — stages 5-6, mid parallax */}
      {assets?.wings ? (
        <Animated.Image
          source={assets.wings}
          style={[styles.layer, { width: size, height: size }, wingsStyle]}
          resizeMode="contain"
        />
      ) : null}

      {/* Body layer — primary, breathing + celebrate + squash */}
      <Animated.Image
        source={assets.body}
        style={[styles.layer, { width: size, height: size }, bodyStyle]}
        resizeMode="contain"
      />

      {/* Accessory/Skin layer — animated alongside the body */}
      {skin ? (
        <Animated.View style={[styles.layer, { width: size, height: size, alignItems: 'center', justifyContent: 'center' }, bodyStyle]} pointerEvents="none">
          <Text style={{ fontSize: size * 0.35, position: 'absolute', top: size * -0.1, left: size * 0.4 }}>{skin}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
  },
  shadow: {
    position: 'absolute',
    bottom: 4,
    width: '55%',
    height: 6,
    backgroundColor: '#000',
    borderRadius: 3,
  },
});
