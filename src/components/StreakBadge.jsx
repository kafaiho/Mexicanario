import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

// Same pill height as TopBar pills for visual coherence
const PILL_H = width * 0.075;

// Pet stage emojis — matches MascotaScreen PET_TYPES
const STAGE_EMOJIS = {
  ajolote:  ["🥚", "🫧", "🦎", "🦎", "🐉"],
  xolo:     ["🥚", "🐾", "🐕", "🐕", "🦊"],
  alebrije: ["🥚", "🦋", "🎭", "🎭", "🦄"],
};

function getPetStageEmoji(petType, stage) {
  const emojis = STAGE_EMOJIS[petType];
  if (!emojis) return "🥚";
  return emojis[Math.min(stage, 4)] || "🥚";
}

export default function StreakBadge({ onPress }) {
  const { userId } = useAuth();
  const streakData = useQuery(
    api.streaks.getStreakStatus,
    userId ? { userId } : "skip"
  );
  const petState = useQuery(
    api.pet.getPetState,
    userId ? { userId } : "skip"
  );

  const streak = streakData?.currentStreak ?? 0;
  const isActive = streak > 0;
  const petEmoji = petState?.hasPet
    ? getPetStageEmoji(petState.petType, petState.stage)
    : null;

  return (
    <TouchableOpacity
      style={[styles.badge, !isActive && styles.badgeInactive]}
      onPress={onPress}
    >
      {petEmoji ? (
        <Text style={styles.petEmoji}>{petEmoji}</Text>
      ) : (
        <Text style={styles.fireEmoji}>🔥</Text>
      )}
      <Text style={[styles.streakText, !isActive && styles.textInactive]}>
        {streak}
      </Text>
      {isActive && <Text style={styles.fireSmall}>🔥</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    height: PILL_H,
    backgroundColor: "#D36B1E",
    paddingHorizontal: width * 0.018,
    borderRadius: width * 0.038,
    borderWidth: 1.5,
    borderColor: "#E6CCB2",
    gap: width * 0.004,
  },
  badgeInactive: {
    backgroundColor: "rgba(211, 107, 30, 0.4)",
    borderColor: "rgba(230, 204, 178, 0.4)",
  },
  petEmoji: {
    fontSize: width * 0.038,
    includeFontPadding: false,
  },
  fireEmoji: {
    fontSize: width * 0.035,
    includeFontPadding: false,
  },
  fireSmall: {
    fontSize: width * 0.025,
    includeFontPadding: false,
  },
  streakText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.031,
    includeFontPadding: false,
  },
  textInactive: {
    opacity: 0.6,
  },
});
