import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import StageCropped from "./PetCompanion/StageCropped";

/**
 * VictoryShareCard — 350×620 card rendered offscreen for ViewShot capture.
 * Rendered at position: absolute, left: -9999 so it is never visible to the user.
 *
 * Props:
 *   word       – guessed word
 *   example    – example sentence (truncated to 80 chars)
 *   region     – region string
 *   comboCount – max combo (badge shown if >= 3)
 *   petType    – pet type string ("ajolote" | "xolo" | "alebrije" | ...)
 *   stage      – pet stage 1-6
 *   activeSkin – skin ID or null
 *   style      – extra style (e.g. position: absolute, left: -9999)
 */
const VictoryShareCard = forwardRef(function VictoryShareCard(
  { word, example, region, comboCount, petType, stage, activeSkin, style },
  ref
) {
  const exampleTruncated = example
    ? example.length > 80
      ? example.slice(0, 77) + "..."
      : example
    : null;

  const wordDisplay = word
    ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    : "";

  return (
    <View ref={ref} style={[styles.card, style]} collapsable={false}>
      {/* Gradient layers via stacked Views */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientMid} />
      <View style={styles.gradientBot} />

      {/* Content overlay */}
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.header}>MEXICANARIO 🇲🇽</Text>
        <View style={styles.headerDivider} />

        {/* Pet + word */}
        <View style={styles.centerBlock}>
          {petType ? (
            <StageCropped
              petType={petType}
              stage={stage ?? 1}
              size={110}
              activeSkin={activeSkin}
            />
          ) : (
            <Text style={styles.petFallback}>🦎</Text>
          )}
          <Text style={styles.wordText}>{wordDisplay}</Text>

          {/* Combo badge */}
          {comboCount >= 3 && (
            <View style={styles.comboBadge}>
              <Text style={styles.comboBadgeText}>🔥 x{comboCount} COMBO</Text>
            </View>
          )}
        </View>

        {/* Example */}
        {exampleTruncated ? (
          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>Ejemplo de uso:</Text>
            <Text style={styles.exampleText}>"{exampleTruncated}"</Text>
          </View>
        ) : null}

        {/* Region pill */}
        {region ? (
          <View style={styles.regionPill}>
            <Text style={styles.regionText}>📍 {region}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footerBlock}>
          <Text style={styles.footerQuestion}>
            ¿Cuántas palabras mexicanas conoces?
          </Text>
          <Text style={styles.footerBrand}>@mexicanario.app</Text>
        </View>
      </View>
    </View>
  );
});

export default VictoryShareCard;

const CARD_W = 350;
const CARD_H = 620;

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 24,
    overflow: "hidden",
  },

  // Background gradient simulation via 3 stacked layers
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CARD_H * 0.38,
    backgroundColor: "#8B1A1A",
  },
  gradientMid: {
    position: "absolute",
    top: CARD_H * 0.38,
    left: 0,
    right: 0,
    height: CARD_H * 0.34,
    backgroundColor: "#D36B1E",
  },
  gradientBot: {
    position: "absolute",
    top: CARD_H * 0.72,
    left: 0,
    right: 0,
    height: CARD_H * 0.28,
    backgroundColor: "#F5A623",
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    justifyContent: "space-between",
  },

  header: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerDivider: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 2,
    marginTop: 8,
  },

  centerBlock: {
    alignItems: "center",
    gap: 10,
  },
  petFallback: {
    fontSize: 90,
  },
  wordText: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  comboBadge: {
    backgroundColor: "rgba(255,80,0,0.9)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  comboBadgeText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },

  exampleBox: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,255,255,0.5)",
  },
  exampleLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  exampleText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 19,
  },

  regionPill: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  regionText: {
    color: "#FFE4B5",
    fontSize: 12,
    fontWeight: "700",
  },

  footerBlock: {
    alignItems: "center",
    gap: 4,
  },
  footerQuestion: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  footerBrand: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
