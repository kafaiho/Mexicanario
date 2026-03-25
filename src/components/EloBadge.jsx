import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../theme/designTokens";

const ELO_TIERS = [
  { min: 0, max: 799, name: "Nopal", emoji: "🌵", color: "#4A7C59" },
  { min: 800, max: 999, name: "Obsidiana", emoji: "⬛", color: "#2C2C2C" },
  { min: 1000, max: 1199, name: "Copal", emoji: "💨", color: "#8B7355" },
  { min: 1200, max: 1399, name: "Cenote", emoji: "💧", color: "#2196F3" },
  { min: 1400, max: 1599, name: "Jade", emoji: "💎", color: "#00C853" },
  { min: 1600, max: 1799, name: "Quetzal", emoji: "🦜", color: "#00BFA5" },
  { min: 1800, max: 1999, name: "Jaguar", emoji: "🐆", color: "#D4A017" },
  { min: 2000, max: Infinity, name: "Tonatiuh", emoji: "👑", color: "#FFD700" },
];

export function getEloTier(elo) {
  return ELO_TIERS.find((t) => elo >= t.min && elo <= t.max) ?? ELO_TIERS[0];
}

export { ELO_TIERS };

/**
 * EloBadge — pill showing ELO rating with tier emoji and color.
 *
 * Props:
 *   elo: number — the ELO rating (default 1000)
 *   size: "sm" | "md" | "lg" (default "md")
 *   showName: boolean — whether to show tier name (default true)
 */
export default function EloBadge({ elo = 1000, size = "md", showName = true }) {
  const tier = getEloTier(elo);

  const sizes = {
    sm: { fontSize: 11, emojiSize: 12, paddingH: 8, paddingV: 3, gap: 3 },
    md: { fontSize: 14, emojiSize: 15, paddingH: 12, paddingV: 5, gap: 5 },
    lg: { fontSize: 18, emojiSize: 20, paddingH: 16, paddingV: 7, gap: 6 },
  };
  const s = sizes[size] ?? sizes.md;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: tier.color + "22",
          borderColor: tier.color + "55",
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          gap: s.gap,
        },
      ]}
    >
      <Text style={{ fontSize: s.emojiSize }}>{tier.emoji}</Text>
      <Text style={[styles.rating, { fontSize: s.fontSize, color: tier.color }]}>
        {elo}
      </Text>
      {showName && (
        <Text style={[styles.tierName, { fontSize: s.fontSize - 2, color: tier.color + "CC" }]}>
          {tier.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
  },
  rating: {
    fontFamily: FONTS.display,
  },
  tierName: {
    fontFamily: FONTS.body,
  },
});
