import { useMutation, useQuery } from "convex/react";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import FloatingMascot from "../components/PetCompanion/FloatingMascot";
import StageCropped from "../components/PetCompanion/StageCropped";
import { useAuth } from "../context/AuthContext";
import { STAGE_THEMES } from "../theme/designTokens";
import usePetStore, { getStage } from "../store/usePetStore";
import { tapLight, tapMedium } from "../services/haptics";
import { playSound } from "../utils/soundManager";

const { width } = Dimensions.get("window");
const MASCOT_SIZE = Math.min(width * 0.82, 340);

// ─── Tap phrases ─────────────────────────────────────────────────────────────
const TAP_PHRASES = [
  "¡Hola! 🦎", "¡Me haces cosquillas!", "¡Otra vez! 😄",
  "¡Ajúa! 🎉", "¡Órale!", "¡Qué onda! 👋",
  "¡Más! ¡Más!", "¡Ay wey! 😆", "¡Estoy feliz!",
  "¡Eso! ✨", "¡No pares! 🔥", "¡Qué chido!",
];

// ─── Pet type definitions ─────────────────────────────────────────────────────
const PET_TYPES = [
  {
    id: "ajolote",
    name: "Ajolote",
    desc: "El más tierno · Crece con calma",
    accent: "#A63C06",
  },
  {
    id: "xolo",
    name: "Xoloitzcuintle",
    desc: "Leal y social · El más equilibrado",
    accent: "#D36B1E",
  },
  {
    id: "alebrije",
    name: "Alebrije",
    desc: "El más majestuoso · Evoluciona rápido",
    accent: "#5C8A40",
  },
];

// ─── Setup Flow (primera vez sin mascota) ─────────────────────────────────────
function SetupScreen({ userId }) {
  const [step, setStep]             = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [name, setName]             = useState("");
  const [loading, setLoading]       = useState(false);
  const choosePet                   = useMutation(api.pet.choosePet);

  const handleHatch = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await choosePet({ userId, petType: selectedType, petName: name.trim() });
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>🥚 Tu compañero te espera</Text>
        <Text style={styles.setupSub}>Elige qué tipo de mascota nacerá</Text>
        {PET_TYPES.map((pt) => (
          <TouchableOpacity
            key={pt.id}
            style={[
              styles.typeCard,
              selectedType === pt.id && { borderColor: pt.accent, borderWidth: 2 },
            ]}
            onPress={() => setSelectedType(pt.id)}
            activeOpacity={0.85}
          >
            {/* Egg preview from sprite sheet (stage 1 = egg) */}
            <View style={styles.typePreview}>
              <StageCropped petType={pt.id} stage={1} size={72} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.typeName, { color: pt.accent }]}>{pt.name}</Text>
              <Text style={styles.typeDesc}>{pt.desc}</Text>
            </View>
            {selectedType === pt.id && (
              <View style={[styles.checkCircle, { backgroundColor: pt.accent }]}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.bigBtn, !selectedType && { opacity: 0.4 }]}
          onPress={() => setStep(1)}
          disabled={!selectedType}
        >
          <Text style={styles.bigBtnText}>Siguiente →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.setupContainer}>
      <View style={styles.eggPreviewLg}>
        <StageCropped petType={selectedType} stage={1} size={160} />
      </View>
      <Text style={styles.setupTitle}>Dale un nombre</Text>
      <Text style={styles.setupSub}>
        Tu {PET_TYPES.find((p) => p.id === selectedType)?.name} necesita uno
      </Text>
      <TextInput
        style={styles.nameInput}
        placeholder="Nombre de tu mascota…"
        placeholderTextColor="#B38E6A"
        value={name}
        onChangeText={setName}
        maxLength={20}
        autoFocus
      />
      <TouchableOpacity
        style={[styles.bigBtn, (!name.trim() || loading) && { opacity: 0.4 }]}
        onPress={handleHatch}
        disabled={!name.trim() || loading}
      >
        <Text style={styles.bigBtnText}>
          {loading ? "Eclosionando…" : "🥚 ¡Eclosionar!"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Stage Dots ───────────────────────────────────────────────────────────────
function StageDots({ currentStage }) {
  return (
    <View style={styles.dotsRow}>
      {[1, 2, 3, 4, 5, 6].map((s) => {
        const theme = STAGE_THEMES[s];
        const active = s === currentStage;
        const past   = s < currentStage;
        return (
          <View key={s} style={styles.dotWrap}>
            <View
              style={[
                styles.dot,
                active && { backgroundColor: theme?.primary ?? "#fff", transform: [{ scale: 1.4 }] },
                past   && { backgroundColor: (theme?.primary ?? "#fff") + "55" },
                !active && !past && styles.dotFuture,
              ]}
            />
            {active && (
              <Text style={[styles.dotLabel, { color: theme?.primary ?? "#fff" }]}>
                {theme?.name?.split(" ")[0]}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MascotaScreen() {
  const { userId } = useAuth();
  const pet         = useQuery(api.pet.getPetState, userId ? { userId } : "skip");
  const streakStatus = useQuery(api.streaks.getStreakStatus, userId ? { userId } : "skip");
  const streakDays  = streakStatus?.currentStreak ?? 0;
  const resetPetMutation = useMutation(api.pet.resetPet);

  // New bond system
  const vinculo   = usePetStore((s) => s.vinculo);
  const caricia   = usePetStore((s) => s.caricia);
  const stage     = getStage(vinculo);
  const theme     = STAGE_THEMES[stage] ?? STAGE_THEMES[1];

  // Tap interaction
  const [tapBubble, setTapBubble] = useState("");
  const tapCountRef  = useRef(0);
  const lastTapRef   = useRef(0);
  const bubbleTimer  = useRef(null);

  const handleResetPet = useCallback(() => {
    Alert.alert(
      "¿Cambiar mascota?",
      "Esto eliminará tu mascota actual y podrás elegir una nueva. No se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            try {
              await resetPetMutation({ userId });
              usePetStore.getState().hydrateFromBackend({ vinculo: 0, petType: "alebrije", petName: "", streak: 0 });
            } catch (e) {
              Alert.alert("Error", "No se pudo reiniciar la mascota. Intenta de nuevo.");
            }
          },
        },
      ]
    );
  }, [userId, resetPetMutation]);

  const handleTapMascot = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current > 2000) tapCountRef.current = 0;
    lastTapRef.current = now;
    tapCountRef.current += 1;

    tapCountRef.current >= 5 ? tapMedium() : tapLight();
    playSound("click");
    caricia(); // +5 vínculo por caricia

    clearTimeout(bubbleTimer.current);
    const phrase = TAP_PHRASES[Math.floor(Math.random() * TAP_PHRASES.length)];
    setTapBubble(phrase);
    bubbleTimer.current = setTimeout(() => setTapBubble(""), 2000);
  }, [caricia]);

  // ── Guards ───────────────────────────────────────────────────────────────
  if (!userId) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>Inicia sesión para ver tu mascota 🦎</Text>
      </SafeAreaView>
    );
  }
  if (pet === undefined) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>Cargando…</Text>
      </SafeAreaView>
    );
  }
  if (!pet?.hasPet) {
    return (
      <ImageBackground source={require("../../assets/images/bg.png")} style={styles.screen} resizeMode="cover">
        <SafeAreaView style={{ flex: 1 }}>
          <SetupScreen userId={userId} />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ImageBackground source={require("../../assets/images/bg.png")} style={styles.screen} resizeMode="cover">
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.coinBadge}>
            <Text style={styles.coinText}>🪙 {pet.coins ?? 0}</Text>
          </View>
          <Text style={styles.headerName}>{pet.petName}</Text>
        </View>

        {/* ── Mascot display ── */}
        <View style={styles.mascotWrap}>
          {/* Glow ring behind mascot */}
          <View style={[styles.glowRing, { borderColor: theme.primary + "60", shadowColor: theme.primary }]} />

          <FloatingMascot
            petType={pet.petType}
            stage={stage}
            size={MASCOT_SIZE}
            onTap={handleTapMascot}
          />

          {/* Tap bubble */}
          {tapBubble ? (
            <View style={styles.tapBubble}>
              <Text style={styles.tapBubbleText}>{tapBubble}</Text>
              <View style={styles.tapBubbleTail} />
            </View>
          ) : null}
        </View>

        <Text style={styles.tapHint}>👆 Tócame</Text>

        {/* ── Pet info ── */}
        <View style={styles.infoBlock}>
          <Text style={styles.petName}>{pet.petName}</Text>
          <View style={[styles.stagePill, { backgroundColor: "rgba(211,107,30,0.15)", borderColor: "#D36B1E" }]}>
            <Text style={[styles.stagePillText, { color: "#D36B1E" }]}>
              Etapa {stage} · {theme.name}
            </Text>
          </View>
        </View>

        {/* ── Stage evolution dots ── */}
        <StageDots currentStage={stage} />

        {/* ── Streak ── */}
        {streakDays > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              🔥 Racha: {streakDays} día{streakDays !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* ── Reset button ── */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetPet}>
          <Text style={styles.resetBtnText}>🔄 Cambiar mascota</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4E2CD" },
  emptyText: { color: "#5C3A21", fontSize: 16, textAlign: "center" },

  // Header
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 8,
  },
  coinBadge: {
    backgroundColor: "#E6CCB2",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(92,58,33,0.25)",
  },
  coinText: { color: "#5C3A21", fontWeight: "bold", fontSize: 14 },
  headerName: { color: "#5C3A21", fontSize: 18, fontWeight: "700" },

  // Mascot
  mascotWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: MASCOT_SIZE + 24,
    height: MASCOT_SIZE * 0.65 + 24,
    borderRadius: 999,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  mascotImage: {
    borderRadius: 16,
  },
  tapBubble: {
    position: "absolute",
    top: 8,
    backgroundColor: "rgba(92,58,33,0.9)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    zIndex: 10,
  },
  tapBubbleText: { color: "#FFE4B5", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  tapBubbleTail: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    left: "46%",
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderTopColor: "rgba(92,58,33,0.9)",
  },
  tapHint: { color: "rgba(92,58,33,0.4)", fontSize: 11, marginBottom: 20 },

  // Info
  infoBlock: { alignItems: "center", marginBottom: 24 },
  petName: { color: "#5C3A21", fontSize: 26, fontWeight: "800", marginBottom: 8, letterSpacing: 0.3 },
  stagePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  stagePillText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.4 },

  // Stage dots
  dotsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  dotWrap: { alignItems: "center", gap: 4 },
  dot: {
    width: 10, height: 10,
    borderRadius: 5,
  },
  dotFuture: { backgroundColor: "rgba(92,58,33,0.2)" },
  dotLabel: { fontSize: 9, fontWeight: "700", textAlign: "center", maxWidth: 52 },

  // Streak
  streakBadge: {
    backgroundColor: "#E6CCB2",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(211,107,30,0.4)",
    marginBottom: 8,
  },
  streakText: { color: "#D36B1E", fontSize: 14, fontWeight: "700" },

  // Reset
  resetBtn: {
    borderWidth: 1,
    borderColor: "rgba(92,58,33,0.3)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  resetBtnText: { color: "#B38E6A", fontSize: 13, fontWeight: "600" },

  // Setup
  setupContainer: { flex: 1, padding: 20, justifyContent: "center" },
  setupTitle: { color: "#5C3A21", fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  setupSub: { color: "#B38E6A", fontSize: 14, textAlign: "center", marginBottom: 28 },
  typeCard: {
    flexDirection: "row",
    backgroundColor: "#FFE4B5",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
    gap: 12,
  },
  typePreview: { borderRadius: 10, overflow: "hidden" },
  typeName: { fontWeight: "800", fontSize: 15, marginBottom: 2 },
  typeDesc: { color: "#B38E6A", fontSize: 12 },
  checkCircle: {
    width: 26, height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  eggPreviewLg: {
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  nameInput: {
    backgroundColor: "#F5DEB3",
    borderRadius: 14,
    padding: 16,
    color: "#5C3A21",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.4)",
  },
  bigBtn: {
    backgroundColor: "#D36B1E",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  bigBtnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
});
