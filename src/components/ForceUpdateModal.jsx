import React from "react";
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.kafaiho.mexicanario";
const APP_STORE_URL  = "https://apps.apple.com/app/mexicanario/id6738849697";

export default function ForceUpdateModal({ visible, forceUpdate, message, onDismiss }) {
  const storeUrl = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;

  const handleUpdate = () => {
    Linking.openURL(storeUrl).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={forceUpdate ? undefined : onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>¡Nueva versión disponible!</Text>
          <Text style={styles.message}>
            {message || "Hay una nueva versión con mejoras y correcciones. ¡Actualiza para seguir jugando!"}
          </Text>

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} activeOpacity={0.85}>
            <Text style={styles.updateBtnText}>Actualizar ahora</Text>
          </TouchableOpacity>

          {!forceUpdate && (
            <TouchableOpacity style={styles.laterBtn} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={styles.laterBtnText}>Más tarde</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  card: {
    backgroundColor: "#FFF8EE",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#5C2800",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: "#7A4A20",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  updateBtn: {
    backgroundColor: "#D36B1E",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#E6CCB2",
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  updateBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  laterBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  laterBtnText: {
    color: "#B38E6A",
    fontSize: 14,
    fontWeight: "600",
  },
});
