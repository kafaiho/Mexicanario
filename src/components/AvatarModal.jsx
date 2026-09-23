import { useMutation } from "convex/react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";
import { useUserMutation } from "../hooks/useUserMutation";

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD  = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

const AVATARS = [
  "🧔🏽", "👨🏽", "👩🏽", "🧑🏽",
  "🌮", "🌯", "🌶️", "🦅",
  "🐺", "🎸", "⚽", "🏆",
  "🇲🇽", "💀", "🌵", "🎭",
];

export default function AvatarModal({ visible, onClose }) {
  const { userId } = useAuth();
  const updateProfile = useUserMutation(api.users.updateUserProfile);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (selected === null || !userId) return;
    setBusy(true);
    try {
      await updateProfile({ userId, avatar: AVATARS[selected] });
      onClose();
    } catch (e) {
      if (__DEV__) console.warn(e);
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    setSelected(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <View style={s.header}>
            <Text style={s.title}>Elige tu avatar</Text>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={s.grid}>
            {AVATARS.map((av, i) => (
              <TouchableOpacity
                key={i}
                style={[s.avatarOption, selected === i && s.avatarSelected]}
                onPress={() => setSelected(i)}
              >
                <Text style={s.avatarEmoji}>{av}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.saveBtn, selected === null && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={selected === null || busy}
          >
            {busy
              ? <ActivityIndicator color={BROWN} />
              : <Text style={s.saveBtnText}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: WHEAT,
    borderRadius: 20,
    padding: 20,
    width: "85%",
    borderWidth: 3,
    borderColor: BROWN,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(210,105,30,0.3)",
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: BROWN,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e64a33",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 19,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: WHEAT2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "rgba(139,69,19,0.25)",
  },
  avatarSelected: {
    borderColor: GOLD,
    backgroundColor: "#FFF8E1",
    borderWidth: 3,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  saveBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C8950A",
  },
  saveBtnText: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: 17,
  },
});
