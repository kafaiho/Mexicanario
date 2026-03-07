import { useMutation } from "convex/react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";

const BROWN = "#8B4513";
const GOLD  = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

export default function ProfileModal({ visible, onClose }) {
  const { userId, user } = useAuth();
  const updateProfile = useMutation(api.users.updateUserProfile);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  // Pre-fill with current name when modal opens
  React.useEffect(() => {
    if (visible && user?.name) setName(user.name);
  }, [visible]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || !userId) return;
    setBusy(true);
    try {
      await updateProfile({ userId, name: trimmed });
      onClose();
    } catch (e) {
      if (__DEV__) console.warn(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <View style={s.header}>
            <Text style={s.title}>Editar nombre</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Tu nombre visible:</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Juan Carlos"
            placeholderTextColor="#A0714F"
            maxLength={30}
            autoFocus
          />

          <TouchableOpacity
            style={[s.saveBtn, !name.trim() && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={!name.trim() || busy}
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
  label: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: WHEAT2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: BROWN,
    marginBottom: 16,
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
