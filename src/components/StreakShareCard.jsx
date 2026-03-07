import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import StageCropped from "./PetCompanion/StageCropped";

/**
 * StreakShareCard — 350×500 card rendered offscreen for ViewShot capture.
 *
 * Props:
 *   streak     – current streak number
 *   petType    – pet type string
 *   stage      – pet stage 1-6
 *   activeSkin – skin ID or null
 */
const StreakShareCard = forwardRef(function StreakShareCard(
  { streak, petType, stage, activeSkin, style },
  ref
) {
  return (
    <View ref={ref} style={[styles.card, style]} collapsable={false}>
      {/* Background layers */}
      <View style={styles.bgDark} />
      <View style={styles.bgAccent} />

      {/* Decorative dots pattern */}
      <View style={styles.dotPatternTL} />
      <View style={styles.dotPatternBR} />

      {/* Content */}
      <View style={styles.content}>
        {/* Top label */}
        <Text style={styles.topLabel}>MEXICANARIO 🇲🇽</Text>

        {/* Main row: big streak + mascot side by side */}
        <View style={styles.mainRow}>
          <View style={styles.streakBlock}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>
              {streak === 1 ? "día de" : "días de"}
            </Text>
            <Text style={styles.streakLabel2}>racha</Text>
          </View>

          {petType ? (
            <StageCropped
              petType={petType}
              stage={stage ?? 1}
              size={100}
              activeSkin={activeSkin}
            />
          ) : (
            <Text style={styles.petFallback}>🦎</Text>
          )}
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>aprendiendo México</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Footer */}
        <Text style={styles.footer}>Mexicanario · mexicanario.app</Text>
      </View>
    </View>
  );
});

export default StreakShareCard;

const CARD_W = 350;
const CARD_H = 500;

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 24,
    overflow: "hidden",
  },

  bgDark: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1A0A00",
  },
  bgAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_H * 0.45,
    backgroundColor: "#5C1F00",
    borderTopLeftRadius: 80,
    borderTopRightRadius: 40,
  },

  // Decorative circles
  dotPatternTL: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 20,
    borderColor: "rgba(211,107,30,0.12)",
  },
  dotPatternBR: {
    position: "absolute",
    bottom: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 24,
    borderColor: "rgba(245,166,35,0.1)",
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },

  topLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },

  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    width: "100%",
  },

  streakBlock: {
    alignItems: "center",
  },
  fireEmoji: {
    fontSize: 44,
  },
  streakNumber: {
    color: "#FF6B35",
    fontSize: 88,
    fontWeight: "900",
    lineHeight: 96,
    textShadowColor: "rgba(255,107,53,0.4)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  streakLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  streakLabel2: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },

  petFallback: {
    fontSize: 80,
  },

  subtitle: {
    color: "rgba(255,228,181,0.85)",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  divider: {
    width: 80,
    height: 2,
    backgroundColor: "rgba(211,107,30,0.6)",
    borderRadius: 1,
  },

  footer: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
