import React from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FONTS } from "../theme/designTokens";

const { width, height } = Dimensions.get("window");

const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';

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

export default function LeagueResultModal({ visible, onClose, outcome, oldDivision, newDivision, rank, cxpTotal }) {
  if (!visible) return null;

  const isPromotion = outcome === "promoted";
  const isDemotion  = outcome === "demoted";
  const newInfo = DIVISIONS[(newDivision ?? 1) - 1] || DIVISIONS[0];
  const oldInfo = DIVISIONS[(oldDivision ?? 1) - 1] || DIVISIONS[0];

  const title = isPromotion
    ? "¡Ascendiste!"
    : isDemotion
    ? "Descendiste"
    : "Semana completada";

  const subtitle = isPromotion
    ? `De ${oldInfo.name} a ${newInfo.name}`
    : isDemotion
    ? `De ${oldInfo.name} a ${newInfo.name}`
    : `Te mantuviste en ${newInfo.name}`;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Big emoji */}
          <Text style={styles.bigEmoji}>
            {isPromotion ? "🎊" : isDemotion ? "😔" : "🤝"}
          </Text>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Division badge */}
          <View
            style={[
              styles.divBadge,
              { borderColor: newInfo.color },
            ]}
          >
            <Text style={styles.divEmoji}>{newInfo.emoji}</Text>
            <Text style={styles.divName}>
              Liga {newInfo.name}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rank ?? "-"}</Text>
              <Text style={styles.statLabel}>Posición</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{cxpTotal ?? 0}</Text>
              <Text style={styles.statLabel}>cXP total</Text>
            </View>
          </View>

          {/* Motivational message */}
          <Text style={styles.message}>
            {isPromotion
              ? "¡Felicidades! Sigue así para llegar más alto."
              : isDemotion
              ? "¡No te rindas! Esta semana será diferente."
              : "¡Buen trabajo! Sigue compitiendo."}
          </Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>
              {isPromotion ? "¡Vamos!" : "Continuar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: width * 0.85,
    backgroundColor: "#FFE4B5",
    borderRadius: width * 0.05,
    padding: width * 0.06,
    alignItems: "center",
    borderWidth: width * 0.01,
    borderColor: BROWN,
  },
  bigEmoji: {
    fontSize: width * 0.15,
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: width * 0.06,
    color: BROWN,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: width * 0.035,
    color: "#7A4020",
    marginBottom: 16,
  },
  divBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5DEB3",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    marginBottom: 16,
    gap: 8,
  },
  divEmoji: {
    fontSize: width * 0.06,
  },
  divName: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.04,
    color: BROWN,
  },
  statsRow: {
    flexDirection: "row",
    gap: width * 0.08,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    backgroundColor: "#F5DEB3",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D2A679",
    minWidth: width * 0.22,
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: width * 0.05,
    color: BROWN,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: width * 0.028,
    color: "#A0714F",
    marginTop: 2,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: width * 0.032,
    color: "#7A4020",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: width * 0.048,
  },
  button: {
    backgroundColor: GOLD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#C8950A",
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  buttonText: {
    fontFamily: FONTS.bodyBold,
    color: "#523600",
    fontSize: width * 0.04,
  },
});
