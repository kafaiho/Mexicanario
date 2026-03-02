import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import StageCropped from './StageCropped';

/**
 * FloatingMascot — animated wrapper over StageCropped.
 *
 * Animations:
 *   - Idle float: gentle translateY -10 → 0 loop (1400ms each way)
 *   - Tap bounce: scale 0.9 → spring 1.0
 *   - Dynamic shadow: scaleX + opacity inversely tied to float height
 *
 * Props:
 *   petType – 'alebrije' | 'xolo' | 'ajolote'
 *   stage   – 1-6
 *   size    – display width in dp
 *   onTap   – callback fired after internal bounce starts
 */
export default function FloatingMascot({ petType, stage, size, onTap }) {
  const floatAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const floatLoopRef = useRef(null);

  // ── Idle float loop ──────────────────────────────────────────────────────
  useEffect(() => {
    floatLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoopRef.current.start();
    return () => floatLoopRef.current?.stop();
  }, []);

  // ── Tap bounce ───────────────────────────────────────────────────────────
  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onTap?.();
  }, [onTap]);

  // ── Shadow (inversely tied to float position) ────────────────────────────
  const shadowOpacity = floatAnim.interpolate({
    inputRange: [-10, 0],
    outputRange: [0.08, 0.25],
  });
  const shadowScaleX = floatAnim.interpolate({
    inputRange: [-10, 0],
    outputRange: [0.8, 1.1],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={1}
      style={{ alignItems: 'center' }}
    >
      {/* Mascot with float + bounce */}
      <Animated.View
        style={{
          transform: [
            { translateY: floatAnim },
            { scale: scaleAnim },
          ],
        }}
      >
        <StageCropped petType={petType} stage={stage} size={size} />
      </Animated.View>

      {/* Dynamic ground shadow */}
      <Animated.View
        style={[
          styles.shadow,
          { width: size * 0.55 },
          {
            opacity: shadowOpacity,
            transform: [{ scaleX: shadowScaleX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
    marginTop: -4,
  },
});
