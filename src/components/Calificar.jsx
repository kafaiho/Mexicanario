import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// ← Cambia por tus IDs reales de App Store / Play Store
const STORE_URL =
  Platform.OS === "ios"
    ? "https://apps.apple.com/app/idXXXXXXXXX" // ← App Store ID
    : "market://details?id=com.mexicanario.app"; // ← Bundle ID Android

const STARS = [1, 2, 3, 4, 5];

export default function Calificar({ visible, onClose }) {
  const [selected, setSelected] = useState(0);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (sent) return;
    setSent(true);
    try {
      await Linking.openURL(STORE_URL);
    } catch {
      // silencioso
    }
    onClose();
  };

  const handleClose = () => {
    setSelected(0);
    setSent(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Calificar la app</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
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
          <Text style={styles.headline}>¿Te está gustando? ⭐</Text>
          <Text style={styles.sub}>
            Tu calificación nos ayuda muchísimo a seguir mejorando el juego.
            ¡Vale un chingo!
          </Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {STARS.map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setSelected(star)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={star <= selected ? "star" : "star-outline"}
                  size={44}
                  color={star <= selected ? "#D36B1E" : "rgba(211,107,30,0.35)"}
                />
              </TouchableOpacity>
            ))}
          </View>

          {selected > 0 && (
            <Text style={styles.ratingLabel}>
              {selected === 5
                ? "¡Órale, gracias! 🙌"
                : selected >= 3
                ? "¡Qué bueno! Seguimos mejorando."
                : "Gracias por la honestidad. Vamos a mejorar."}
            </Text>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.sendBtn, (!selected || sent) && styles.sendBtnDisabled]}
            onPress={handleSend}
            activeOpacity={0.82}
            disabled={!selected || sent}
          >
            <Ionicons
              name="star-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.sendBtnText}>
              {sent ? "Abriendo tienda..." : "Calificar ahora"}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <TouchableOpacity style={styles.footerClose} onPress={handleClose}>
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
    marginBottom: 18,
  },

  // ── Stars ──
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D36B1E",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },

  // ── Send button ──
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D36B1E",
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 4,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
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
