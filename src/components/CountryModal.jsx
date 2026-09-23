import { useMutation } from "convex/react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
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
const GOLD  = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

const COUNTRIES = [
  { code: "MX", flag: "🇲🇽", name: "México" },
  { code: "US", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "CO", flag: "🇨🇴", name: "Colombia" },
  { code: "AR", flag: "🇦🇷", name: "Argentina" },
  { code: "ES", flag: "🇪🇸", name: "España" },
  { code: "PE", flag: "🇵🇪", name: "Perú" },
  { code: "CL", flag: "🇨🇱", name: "Chile" },
  { code: "VE", flag: "🇻🇪", name: "Venezuela" },
  { code: "GT", flag: "🇬🇹", name: "Guatemala" },
  { code: "EC", flag: "🇪🇨", name: "Ecuador" },
  { code: "CU", flag: "🇨🇺", name: "Cuba" },
  { code: "HN", flag: "🇭🇳", name: "Honduras" },
  { code: "SV", flag: "🇸🇻", name: "El Salvador" },
  { code: "BR", flag: "🇧🇷", name: "Brasil" },
  { code: "CA", flag: "🇨🇦", name: "Canadá" },
];

export default function CountryModal({ visible, onClose }) {
  const { userId, user } = useAuth();
  const updateProfile = useUserMutation(api.users.updateUserProfile);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (visible && user?.country) {
      const idx = COUNTRIES.findIndex((c) => c.code === user.country);
      if (idx >= 0) setSelected(idx);
    }
  }, [visible]);

  async function handleSave() {
    if (selected === null || !userId) return;
    setBusy(true);
    try {
      await updateProfile({ userId, country: COUNTRIES[selected].code });
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
            <Text style={s.title}>Tu país</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            {COUNTRIES.map((c, i) => (
              <TouchableOpacity
                key={c.code}
                style={[s.countryRow, selected === i && s.countrySelected]}
                onPress={() => setSelected(i)}
              >
                <Text style={s.flag}>{c.flag}</Text>
                <Text style={s.countryName}>{c.name}</Text>
                {selected === i && <Text style={s.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>

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
    marginBottom: 14,
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
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHEAT2,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.2)",
    gap: 12,
  },
  countrySelected: {
    borderColor: GOLD,
    backgroundColor: "#FFF8E1",
    borderWidth: 2.5,
  },
  flag: { fontSize: 24 },
  countryName: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: 15,
  },
  check: {
    fontSize: 18,
    color: "#27AE60",
    fontWeight: "bold",
  },
  saveBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C8950A",
    marginTop: 12,
  },
  saveBtnText: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: 17,
  },
});
