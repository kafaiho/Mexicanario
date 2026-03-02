import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../theme/designTokens";

const { width } = Dimensions.get("window");

const BROWN = '#8B4513';

const DIVISIONS = [
  { div: 1,  name: "Obsidiana",        emoji: "⚫", color: "#2C2C2C" },
  { div: 2,  name: "Nopal",            emoji: "🌵", color: "#4A7C59" },
  { div: 3,  name: "Copal",            emoji: "🕯️", color: "#8B7355" },
  { div: 4,  name: "Cenote",           emoji: "💧", color: "#2196F3" },
  { div: 5,  name: "Cempasúchil",      emoji: "🌻", color: "#FF9800" },
  { div: 6,  name: "Jade",             emoji: "💚", color: "#00C853" },
  { div: 7,  name: "Quetzal",          emoji: "🦜", color: "#00BFA5" },
  { div: 8,  name: "Obsidiana Solar",  emoji: "☀️", color: "#FF6D00" },
  { div: 9,  name: "Jaguar",           emoji: "🐆", color: "#D4A017" },
  { div: 10, name: "Tonatiuh",         emoji: "🔱", color: "#FFD700" },
];

export { DIVISIONS };

export default function LeagueBadge({ division, size = "medium" }) {
  const info = DIVISIONS[(division ?? 1) - 1] || DIVISIONS[0];
  const isSmall = size === "small";
  const badgeSize = isSmall ? width * 0.08 : width * 0.14;
  const fontSize = isSmall ? width * 0.04 : width * 0.07;
  const labelSize = isSmall ? width * 0.025 : width * 0.03;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: '#FFE4B5',
            borderColor: info.color,
          },
        ]}
      >
        <Text style={{ fontSize }}>{info.emoji}</Text>
      </View>
      {!isSmall && (
        <Text style={[styles.label, { fontSize: labelSize }]}>
          Liga {info.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  badge: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    marginTop: 5,
  },
});
