import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const APP_URL = "https://mexicanario.app"; // ← cambia por tu link real de App Store / Play Store
const SHARE_MESSAGE =
  "¡Juega Mexicanario conmigo! 🌮🔥\n" +
  "El juego de palabras mexicanas más divertido.\n" +
  "¿Cuántas palabras conoces? ¡Descúbrelo!\n\n" +
  APP_URL;

const REDES = [
  { icon: "logo-whatsapp",  label: "WhatsApp",  color: "#25D366" },
  { icon: "logo-facebook",  label: "Facebook",  color: "#1877F2" },
  { icon: "logo-twitter",   label: "Twitter/X", color: "#1DA1F2" },
  { icon: "logo-instagram", label: "Instagram", color: "#E1306C" },
  { icon: "copy-outline",   label: "Copiar",    color: "#D36B1E" },
];

export default function Invitar({ visible, onClose }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await Share.share(
        {
          message: SHARE_MESSAGE,
          url: APP_URL,     // iOS only — opens URL in share sheet
          title: "¡Juega Mexicanario!",
        },
        {
          dialogTitle: "Invitar amigos a Mexicanario",
          subject: "¡Te invito a jugar Mexicanario!",
        }
      );
    } catch (e) {
      // usuario canceló o error — silencioso
    } finally {
      setSharing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Invitar amigos</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Logo / ilustración */}
          <View style={styles.heroWrap}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.hero}
              resizeMode="contain"
            />
          </View>

          {/* Copy del mensaje */}
          <Text style={styles.headline}>¡Comparte el sabor! 🌮</Text>
          <Text style={styles.sub}>
            Invita a tus cuates a descubrir cuántas palabras mexicanas conocen.
          </Text>

          {/* Íconos de redes (decorativos — el botón abre el share nativo) */}
          <View style={styles.redesRow}>
            {REDES.map(({ icon, label, color }) => (
              <View key={label} style={styles.redItem}>
                <View style={[styles.redCircle, { backgroundColor: color }]}>
                  <Ionicons name={icon} size={20} color="#fff" />
                </View>
                <Text style={styles.redLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Botón principal — abre el share sheet nativo del SO */}
          <TouchableOpacity
            style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
            onPress={handleShare}
            activeOpacity={0.82}
            disabled={sharing}
          >
            <Ionicons name="share-social-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.shareBtnText}>
              {sharing ? "Abriendo..." : "Compartir ahora"}
            </Text>
          </TouchableOpacity>

          {/* Footer dismiss */}
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
    paddingVertical: 8,
  },
  hero: {
    width: width * 0.28,
    height: width * 0.28,
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
    fontSize: 13,
    color: "#B38E6A",
    textAlign: "center",
    paddingHorizontal: 28,
    lineHeight: 18,
    marginBottom: 18,
  },

  // ── Redes ──
  redesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  redItem: {
    alignItems: "center",
    gap: 5,
  },
  redCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  redLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#B38E6A",
  },

  // ── Share button ──
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D36B1E",
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 4,
  },
  shareBtnDisabled: {
    opacity: 0.6,
  },
  shareBtnText: {
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
