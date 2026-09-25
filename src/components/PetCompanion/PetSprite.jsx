import React, { useCallback, useEffect, useRef } from 'react';
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
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  BREATHING,
  CELEBRATE_SPRING,
  CELEBRATE_TRANSLATE_Y,
  PARALLAX,
  MOOD_POSE,
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
 *   mood     – 'joyful' | 'happy' | 'hungry' | 'sad' | 'sleepy' (ver petMood.js)
 *   reaction – 'correct' | 'combo' | 'wrong' | null
 *   reactionKey – cambia en cada evento para repetir la misma reacción
 *   size     – container size in dp
 *   skin     – text/emoji or image source for regional accessory
 */
function PetSprite({ assets, stage, mood, reaction, reactionKey = 0, size, skin, reduceMotion = false }) {
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;
  // ── Shared values ────────────────────────────────────────────────────────
  const breathScale = useSharedValue(1.0);
  const celebrateY = useSharedValue(0);
  const squashX = useSharedValue(1.0);
  const squashY = useSharedValue(1.0);
  const sadY = useSharedValue(0);
  const sadScaleV = useSharedValue(1.0);
  const spin = useSharedValue(0);
  // Postura según ánimo (persistente, no una reacción)
  const pose = MOOD_POSE[mood] ?? MOOD_POSE.happy;
  const moodY = useSharedValue(0);
  const moodScale = useSharedValue(1.0);
  const moodOpacity = useSharedValue(1.0);
  const moodHop = useSharedValue(0);
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
    const duration = BREATHING.duration * pose.breath;
    breathScale.value = withRepeat(
      withSequence(
        withTiming(BREATHING.to, { duration, easing: BREATHING.easing }),
        withTiming(1.0, { duration, easing: BREATHING.easing })
      ),
      -1,
      false
    );
  }, [reduceMotion, breathScale, pose.breath]);

  // ── Postura de ánimo: encogida si tiene hambre/triste/sueño, brincos si está feliz ──
  useEffect(() => {
    const animate = (sv, to) => {
      if (reduceMotion) sv.value = to;
      else sv.value = withTiming(to, { duration: 600, easing: Easing.inOut(Easing.ease) });
    };
    animate(moodY, pose.y * size);
    animate(moodScale, pose.scale);
    animate(moodOpacity, pose.opacity);

    cancelAnimation(moodHop);
    moodHop.value = 0;
    if (pose.hop && !reduceMotion) {
      moodHop.value = withRepeat(
        withSequence(
          withDelay(2600, withTiming(-size * 0.12, { duration: 160, easing: Easing.out(Easing.quad) })),
          withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }),
          withTiming(-size * 0.06, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
    }
    return () => cancelAnimation(moodHop);
  }, [mood, size, reduceMotion, pose, moodY, moodScale, moodOpacity, moodHop]);

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

  // ── Combo: salto más alto + giro completo ─────────────────────────────────
  const triggerCombo = useCallback(() => {
    triggerCelebrate();
    celebrateY.value = withSequence(
      withTiming(CELEBRATE_TRANSLATE_Y * 1.8, { duration: 220, easing: Easing.out(Easing.quad) }),
      withSpring(0, CELEBRATE_SPRING)
    );
    spin.value = 0;
    spin.value = withTiming(360, { duration: 520, easing: Easing.inOut(Easing.cubic) }, () => {
      spin.value = 0;
    });
  }, [triggerCelebrate]);

  // ── Sad droop ────────────────────────────────────────────────────────────
  const triggerSad = useCallback(() => {
    sadY.value = withTiming(SAD_DROOP.translateY, { duration: SAD_DROOP.duration, easing: SAD_DROOP.easing });
    sadScaleV.value = withTiming(SAD_DROOP.scale, { duration: SAD_DROOP.duration, easing: SAD_DROOP.easing });
    // Auto-recover after 1.5s
    setTimeout(() => {
      if (reduceMotionRef.current) {
        sadY.value = 0;
        sadScaleV.value = 1;
      } else {
        sadY.value = withTiming(0, { duration: 400 });
        sadScaleV.value = withTiming(1.0, { duration: 400 });
      }
    }, 1500);
  }, []);

  // ── React to reaction prop ───────────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(celebrateY);
      cancelAnimation(squashX);
      cancelAnimation(squashY);
      cancelAnimation(sadY);
      cancelAnimation(sadScaleV);
      cancelAnimation(spin);
      spin.value = 0;
      celebrateY.value = 0;
      squashX.value = 1;
      squashY.value = 1;
      sadY.value = 0;
      sadScaleV.value = 1;
      return undefined;
    }
    if (reaction === 'combo') triggerCombo();
    else if (reaction === 'correct') triggerCelebrate();
    else if (reaction === 'wrong') triggerSad();
    return undefined;
  }, [reaction, reactionKey, reduceMotion, triggerCelebrate, triggerCombo, triggerSad]);

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
    opacity: moodOpacity.value,
    transform: [
      { translateY: bodyParallax.value + celebrateY.value + sadY.value + moodY.value + moodHop.value },
      { rotate: `${spin.value}deg` },
      { scaleX: breathScale.value * squashX.value * moodScale.value },
      { scaleY: breathScale.value * squashY.value * sadScaleV.value * moodScale.value },
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

export default React.memo(PetSprite);
