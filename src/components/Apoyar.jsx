import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// ← Cambia estas URLs por tus links de PayPal, Ko-fi, etc.
const TIERS = [
  {
    icon: "cafe-outline",
    emoji: "☕",
    label: "Un cafecito",
    amount: "$1 USD",
    url: "https://ko-fi.com/mexicanario",
    color: "#C8860A",
  },
  {
    icon: "fast-food-outline",
    emoji: "🌮",
    label: "Unos taquitos",
    amount: "$3 USD",
    url: "https://ko-fi.com/mexicanario",
    color: "#D36B1E",
  },
  {
    icon: "beer-outline",
    emoji: "🍺",
    label: "Unas chelas",
    amount: "$5 USD",
    url: "https://ko-fi.com/mexicanario",
    color: "#B8540A",
  },
  {
    icon: "trophy-outline",
    emoji: "🏆",
    label: "Eres el mero mero",
    amount: "$10 USD",
    url: "https://ko-fi.com/mexicanario",
    color: "#8B4513",
  },
];

export default function Apoyar({ visible, onClose }) {
  const [loading, setLoading] = useState(null);

  const handleDonate = async (tier) => {
    if (loading !== null) return;
    setLoading(tier.amount);
    try {
      await Linking.openURL(tier.url);
    } catch {
      // silencioso
    } finally {
      setLoading(null);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Apoyar al proyecto</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.heroWrap}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.hero}
              resizeMode="contain"
            />
          </View>

          {/* Copy */}
          <Text style={styles.headline}>¡Gracias por tu apoyo! 🙌</Text>
          <Text style={styles.sub}>
            Tu donación ayuda a mantener el juego gratuito y a seguir añadiendo
            más palabras y funciones chidas.
          </Text>

          {/* Tiers */}
          <View style={styles.tiersWrap}>
            {TIERS.map((tier) => (
              <TouchableOpacity
                key={tier.amount}
                style={[styles.tierBtn, loading === tier.amount && styles.tierBtnDisabled]}
                onPress={() => handleDonate(tier)}
                activeOpacity={0.8}
                disabled={loading !== null}
              >
                <View style={[styles.tierIconWrap, { backgroundColor: tier.color }]}>
                  <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                </View>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierLabel}>{tier.label}</Text>
                  <Text style={styles.tierAmount}>{tier.amount}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(92,58,33,0.4)" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <TouchableOpacity style={styles.footerClose} onPress={onClose}>
            <Text style={styles.footerCloseText}>Ahora no</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFF8ED",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#D36B1E",
    overflow: "hidden",
    paddingBottom: 4,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#5C3A21",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#D36B1E",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Hero ──
  heroWrap: {
    alignItems: "center",
    paddingVertical: 6,
  },
  hero: {
    width: width * 0.22,
    height: width * 0.22,
  },

  // ── Copy ──
  headline: {
    fontSize: 17,
    fontWeight: "900",
    color: "#5C3A21",
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 6,
  },
  sub: {
    fontSize: 12,
    color: "#B38E6A",
    textAlign: "center",
    paddingHorizontal: 28,
    lineHeight: 17,
    marginBottom: 14,
  },

  // ── Tiers ──
  tiersWrap: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tierBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5E6C8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  tierBtnDisabled: {
    opacity: 0.5,
  },
  tierIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tierEmoji: {
    fontSize: 20,
  },
  tierInfo: {
    flex: 1,
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5C3A21",
  },
  tierAmount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B38E6A",
    marginTop: 1,
  },

  // ── Footer ──
  footerClose: {
    alignItems: "center",
    paddingVertical: 14,
  },
  footerCloseText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B38E6A",
  },
});
