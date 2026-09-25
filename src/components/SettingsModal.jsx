import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { presentCustomerCenter } from "../services/RevenueCatService";
import { setMusicEnabled, setSoundEnabled } from "../utils/soundManager";
import { HAPTICS_PREF_KEY, setHapticsEnabled, tapMedium } from "../services/haptics";
import AccountDeletionModal from "./AccountDeletionModal";

const { height } = Dimensions.get("window");

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#FFF8ED",
  border: "#D36B1E",
  title: "#5C3A21",
  closeBtn: "#D36B1E",
  toggleOn: "#D36B1E",
  toggleOff: "rgba(139,69,19,0.18)",
  toggleLabel: "#B38E6A",
  itemBg: "#F5E6C8",
  itemText: "#5C3A21",
  divider: "rgba(92,58,33,0.12)",
  overlay: "rgba(0,0,0,0.55)",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function ToggleBtn({ icon, label, value, onToggle }) {
  return (
    <TouchableOpacity style={styles.toggleBtn} onPress={() => onToggle(!value)} activeOpacity={0.8}>
      <View style={[styles.toggleCircle, { backgroundColor: value ? C.toggleOn : C.toggleOff }]}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={[styles.toggleLabel, { color: value ? C.toggleOn : C.toggleLabel }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={20} color={C.itemText} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="rgba(92,58,33,0.35)" />
    </TouchableOpacity>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsModal({
  visible,
  onClose,
  onTerminosdeservio,
  onApoyar,
  onCalificar,
  onPrivacy,
  onSupport,
  onPoliticadePrivacidad,
  onPerfill,
  onAvatar,
  onInvitar,
}) {
  const { logout, user } = useAuth();
  const [musicOn, setMusicOn] = useState(true);
  const [soundFx, setSoundFx] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que quieres salir de tu cuenta? Se creará una nueva sesión.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);
              await logout();
              onClose();
            } catch (e) {
              Alert.alert("Error", "No se pudo cerrar sesión. Intenta de nuevo.");
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // Load persisted preferences when modal opens
  useEffect(() => {
    if (!visible) return;
    AsyncStorage.multiGet(["pref_music", "pref_sound", "pref_notif", HAPTICS_PREF_KEY]).then((pairs) => {
      pairs.forEach(([key, val]) => {
        if (val === null) return;
        const bool = val === "true";
        if (key === "pref_music") { setMusicOn(bool); setMusicEnabled(bool); }
        if (key === "pref_sound") { setSoundFx(bool); setSoundEnabled(bool); }
        if (key === "pref_notif") setNotifEnabled(bool);
        if (key === HAPTICS_PREF_KEY) { setHapticsOn(bool); setHapticsEnabled(bool); }
      });
    });
  }, [visible]);

  const handleMusicToggle = async (val) => {
    setMusicOn(val);
    AsyncStorage.setItem("pref_music", String(val));
    await setMusicEnabled(val); // immediately pauses/resumes BGM
  };

  const handleSoundToggle = (val) => {
    setSoundFx(val);
    AsyncStorage.setItem("pref_sound", String(val));
    setSoundEnabled(val); // immediately silences/restores all playSound() calls
  };

  const handleHapticsToggle = (val) => {
    setHapticsOn(val);
    AsyncStorage.setItem(HAPTICS_PREF_KEY, String(val));
    setHapticsEnabled(val); // immediately silences/restores every vibration
    if (val) tapMedium(); // confirma que volvió la vibración
  };

  const handleNotifToggle = (val) => {
    setNotifEnabled(val);
    AsyncStorage.setItem("pref_notif", String(val));
    // expo-notifications scheduling reads this flag
  };

  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>⚙️ Ajustes</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Toggle row ── */}
          <View style={styles.toggleRow}>
            <ToggleBtn icon="musical-notes" label="Música" value={musicOn} onToggle={handleMusicToggle} />
            <ToggleBtn icon="volume-high" label="Sonido" value={soundFx} onToggle={handleSoundToggle} />
            <ToggleBtn icon="phone-portrait" label="Vibración" value={hapticsOn} onToggle={handleHapticsToggle} />
            <ToggleBtn icon="notifications" label="Avisos" value={notifEnabled} onToggle={handleNotifToggle} />
          </View>

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Menu list ── */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <MenuItem icon="star-outline" label="Mexicanario Plus ⭐" onPress={presentCustomerCenter} />
            <MenuItem icon="person-outline" label="Perfil" onPress={onPerfill} />
            <MenuItem icon="people-outline" label="Invitar" onPress={onInvitar} />
            <MenuItem icon="cafe-outline" label="Apoyar" onPress={onApoyar} />
            <MenuItem icon="star-outline" label="Calificar" onPress={onCalificar} />
            <MenuItem icon="document-text-outline" label="Términos de Servicio" onPress={onTerminosdeservio} />
            <MenuItem icon="shield-outline" label="Política de Privacidad" onPress={onPrivacy} />
            <MenuItem icon="mail-outline" label="Contactar" onPress={onSupport} />

            {/* ── Zona peligrosa ── */}
            <View style={styles.dangerDivider} />

            {user?.email && (
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut} activeOpacity={0.75}>
                <Ionicons name="log-out-outline" size={20} color="#C0392B" />
                <Text style={styles.logoutLabel}>{loggingOut ? "Saliendo..." : "Cerrar sesión"}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteModal(true)} activeOpacity={0.75}>
              <Ionicons name="trash-outline" size={20} color="#999" />
              <Text style={styles.deleteLabel}>Eliminar Cuenta</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── Footer dismiss ── */}
          <TouchableOpacity style={styles.footerClose} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.footerCloseText}>Cerrar</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Account Deletion — Apple required */}
      <AccountDeletionModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    maxHeight: height * 0.82,
    backgroundColor: C.bg,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: C.border,
    overflow: "hidden",
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
    color: C.title,
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.closeBtn,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Toggles ──
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  toggleBtn: {
    alignItems: "center",
    gap: 6,
  },
  toggleCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: C.divider,
    marginHorizontal: 12,
  },

  // ── Menu list ──
  list: {
    flexShrink: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.itemBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuIconWrap: {
    width: 28,
    alignItems: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: C.itemText,
  },

  // ── Danger zone ──
  dangerDivider: {
    height: 1,
    backgroundColor: "rgba(192,57,43,0.15)",
    marginVertical: 6,
    marginHorizontal: 4,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(192,57,43,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(192,57,43,0.18)",
  },
  logoutLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#C0392B",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  deleteLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },

  // ── Footer ──
  footerClose: {
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  footerCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.toggleLabel,
    letterSpacing: 0.5,
  },
});
