import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../theme/designTokens";

const { width } = Dimensions.get("window");

const BROWN = '#8B4513';

function formatTime(ms) {
  if (ms <= 0) return "Finalizó";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function LeagueCountdown({ timeLeftMs, compact = false }) {
  const [remaining, setRemaining] = useState(timeLeftMs);

  useEffect(() => {
    setRemaining(timeLeftMs);
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftMs]);

  const isUrgent = remaining < 24 * 60 * 60 * 1000; // < 24h

  if (compact) {
    return (
      <Text style={[styles.compactText, isUrgent && styles.urgentText]}>
        {isUrgent ? "⏰" : "⏳"} {formatTime(remaining)}
      </Text>
    );
  }

  return (
    <View style={[styles.container, isUrgent && styles.urgentContainer]}>
      <Text style={styles.label}>Termina en</Text>
      <Text style={[styles.timeText, isUrgent && styles.urgentText]}>
        {isUrgent ? "⏰" : "⏳"} {formatTime(remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,228,181,0.35)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(210,105,30,0.35)",
    paddingHorizontal: width * 0.03,
    paddingVertical: 6,
    gap: 6,
  },
  urgentContainer: {
    backgroundColor: "rgba(192,57,43,0.12)",
    borderColor: "rgba(192,57,43,0.4)",
  },
  label: {
    fontFamily: FONTS.body,
    color: BROWN,
    fontSize: width * 0.028,
  },
  timeText: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.032,
  },
  urgentText: {
    color: "#C0392B",
  },
  compactText: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.028,
  },
});
