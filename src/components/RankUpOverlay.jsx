import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { FONTS } from "../theme/designTokens";
import { notifySuccess, tapHeavy, tapLight, tapMedium, tick } from "../services/haptics";
import { playSound } from "../utils/soundManager";
import ConfettiBurst from "./ConfettiBurst";

const { width, height } = Dimensions.get("window");

const BROWN = "#8B4513";
const GOLD = "#F8BE17";

/**
 * Rank-up celebration overlay.
 *
 * Props:
 *   visible: boolean
 *   oldRank: { title, emoji, color }
 *   newRank: { title, emoji, color }
 *   onDismiss: () => void
 */
export default function RankUpOverlay({ visible, oldRank, newRank, onDismiss }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const oldScale = useRef(new Animated.Value(1)).current;
  const oldOpacity = useRef(new Animated.Value(1)).current;
  const newScale = useRef(new Animated.Value(0.3)).current;
  const newOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const [burstKey, setBurstKey] = useState(0);

  // Escalera háptica mientras el rango viejo se va (tensión) → golpe + éxito al
  // aparecer el nuevo, sincronizado con la secuencia de abajo (300 + 400 ms).
  useEffect(() => {
    if (!visible) return undefined;
    const timers = [
      setTimeout(tick, 320),
      setTimeout(tapLight, 480),
      setTimeout(tapMedium, 620),
      setTimeout(() => {
        tapHeavy();
        setTimeout(notifySuccess, 140);
        playSound("milestone");
        setBurstKey((k) => k + 1);
        if (!reduceMotion) {
          ring.setValue(0);
          Animated.timing(ring, { toValue: 1, duration: 700, useNativeDriver: true }).start();
        }
      }, 720),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible, reduceMotion]);

  useEffect(() => {
    if (!visible) return;

    // Reset
    fadeAnim.setValue(0);
    oldScale.setValue(1);
    oldOpacity.setValue(1);
    newScale.setValue(0.3);
    newOpacity.setValue(0);
    titleOpacity.setValue(0);
    titleSlide.setValue(30);
    btnOpacity.setValue(0);

    // Sequence: backdrop → old emoji out → new emoji in → title → button
    Animated.sequence([
      // 1. Fade in backdrop
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 2. Old emoji fades out + shrinks
      Animated.parallel([
        Animated.timing(oldOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(oldScale, {
          toValue: 0.5,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 3. New emoji scales in with bounce
      Animated.parallel([
        Animated.timing(newOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(newScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      // 4. Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 5. Button fades in
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  if (!visible || !oldRank || !newRank) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        {/* Old emoji (fading out) */}
        <Animated.Text
          style={[
            styles.emoji,
            {
              opacity: oldOpacity,
              transform: [{ scale: oldScale }],
              position: "absolute",
            },
          ]}
        >
          {oldRank.emoji}
        </Animated.Text>

        {/* Aro de luz + confeti al aparecer el rango nuevo */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderColor: newRank.color || GOLD,
              opacity: ring.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.9, 0] }),
              transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.2] }) }],
            },
          ]}
        />
        <ConfettiBurst burstKey={burstKey} count={26} distance={170} style={styles.burstOrigin} />

        {/* New emoji (scaling in) */}
        <Animated.Text
          style={[
            styles.emoji,
            {
              opacity: newOpacity,
              transform: [{ scale: newScale }],
            },
          ]}
        >
          {newRank.emoji}
        </Animated.Text>

        {/* Title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleSlide }],
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text style={styles.upLabel}>SUBISTE DE RANGO</Text>
          <Text style={[styles.rankTitle, { color: newRank.color }]}>
            {newRank.title}
          </Text>
        </Animated.View>

        {/* Continue button */}
        <Animated.View style={{ opacity: btnOpacity, marginTop: 40 }}>
          <TouchableOpacity style={styles.continueBtn} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={styles.continueBtnText}>Continuar</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 8, 0, 0.88)",
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: width * 0.25,
  },
  ring: {
    position: "absolute",
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: width * 0.16,
    borderWidth: 4,
  },
  burstOrigin: {
    top: "50%",
    left: "50%",
  },
  upLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.035,
    color: "rgba(255,228,181,0.7)",
    letterSpacing: 3,
  },
  rankTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.07,
    marginTop: 8,
    textAlign: "center",
  },
  continueBtn: {
    backgroundColor: GOLD,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderWidth: 1.5,
    borderColor: "#C8950A",
  },
  continueBtnText: {
    fontFamily: FONTS.bodyBold,
    color: "#523600",
    fontSize: width * 0.042,
  },
});
