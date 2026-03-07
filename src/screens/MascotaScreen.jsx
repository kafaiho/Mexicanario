import { useMutation, useQuery } from "convex/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../convex/_generated/api";
import FloatingMascot from "../components/PetCompanion/FloatingMascot";
import StageCropped from "../components/PetCompanion/StageCropped";
import PurchaseSuccessModal from "../components/PurchaseSuccessModal";
import StreakModal from "../components/StreakModal";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { notifySuccess, tapLight, tapMedium } from "../services/haptics";
import usePetStore, { getStage, SKIN_CONFIG } from "../store/usePetStore";
import { STAGE_THEMES } from "../theme/designTokens";
import { playPetSound } from "../utils/soundManager";
import ShopScreen from "./ShopScreen";

const { width, height } = Dimensions.get("window");
const MASCOT_SIZE = Math.min(width * 0.42, 180);

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

// ─── Nahual variants (Mexicanario Plus exclusive) ─────────────────────────────
const NAHUAL_VARIANTS = [
  {
    id: "nahual_norte",
    name: "Nahual Norteño",
    variant: "Norteño",
    desc: "Del norte bravo · Fiel como la tierra",
    accent: "#7B4F2E",
    emoji: "🤠",
  },
  {
    id: "nahual_sur",
    name: "Nahual Sureño",
    variant: "Sureño",
    desc: "Del sur profundo · Lleno de magia",
    accent: "#1A6B4A",
    emoji: "🌿",
  },
  {
    id: "nahual_urbano",
    name: "Nahual Urbano",
    variant: "Urbano",
    desc: "Del barrio chido · Nació en el concreto",
    accent: "#3A2A8C",
    emoji: "🏙️",
  },
];

// "Fichas" = artículos especiales (comprados con diamantes)
const FICHAS = [
  { id: "taco", qty: "+5", label: "vínculo", icon: "🌮", price: 10, currency: "diamonds" },
  { id: "tamal", qty: "+15", label: "vínculo", icon: "🫔", price: 25, currency: "diamonds" },
  { id: "pan_muerto", qty: "+35", label: "vínculo", icon: "🥖", price: 50, currency: "diamonds" },
  { id: "streak_freeze", qty: "+1", label: "escudo de racha", icon: "🛡️", price: 150, currency: "diamonds" },
];

// ─── Setup Flow (primera vez sin mascota) ─────────────────────────────────────
function SetupScreen({ userId }) {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const choosePet = useMutation(api.pet.choosePet);

  const handleHatch = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await choosePet({ userId, petType: selectedType, petName: name.trim() });
      // Sync local store immediately so all UI shows the chosen pet type
      usePetStore.getState().setPetType(selectedType);
      usePetStore.getState().setPetName(name.trim());
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
        const past = s < currentStage;
        return (
          <View key={s} style={styles.dotWrap}>
            <View
              style={[
                styles.dot,
                active && { backgroundColor: theme?.primary ?? "#fff", transform: [{ scale: 1.4 }] },
                past && { backgroundColor: (theme?.primary ?? "#fff") + "55" },
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
  const pet = useQuery(api.pet.getPetState, userId ? { userId } : "skip");
  const streakStatus = useQuery(api.streaks.getStreakStatus, userId ? { userId } : "skip");
  const streakDays = streakStatus?.currentStreak ?? 0;
  const resetPetMutation = useMutation(api.pet.resetPet);
  const switchActivePetMutation = useMutation(api.pet.switchActivePet);
  const buyPetFood = useMutation(api.pet.buyPetFood);
  const buyStreakFreeze = useMutation(api.streaks.buyStreakFreeze);
  const petSlotsData = useQuery(api.pet.getPetSlots, userId ? { userId } : "skip");
  const shopState    = useQuery(api.shop.getShopState, userId ? { userId } : "skip");

  // New bond system
  const vinculo      = usePetStore((s) => s.vinculo);
  const caricia      = usePetStore((s) => s.caricia);
  const activeSkin   = usePetStore((s) => s.activeSkin);
  const setActiveSkin = usePetStore((s) => s.setActiveSkin);
  const stage = getStage(vinculo);
  const theme = STAGE_THEMES[stage] ?? STAGE_THEMES[1];

  // Sync petType from Convex → local store so all screens show the right pet
  useEffect(() => {
    if (pet?.petType && pet.petType !== usePetStore.getState().petType) {
      usePetStore.getState().setPetType(pet.petType);
    }
    if (pet?.petName && pet.petName !== usePetStore.getState().petName) {
      usePetStore.getState().setPetName(pet.petName);
    }
  }, [pet?.petType, pet?.petName]);

  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [buyingFicha, setBuyingFicha] = useState(false);
  const [successItem, setSuccessItem] = useState(null);
  const [switchTarget, setSwitchTarget] = useState(null); // petType string or null

  // Tap interaction
  const [tapBubble, setTapBubble] = useState("");
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const bubbleTimer = useRef(null);

  const handleResetPet = useCallback(() => {
    Alert.alert(
      "¿Borrar mascota?",
      "Esto eliminará TODA la mascota y su progreso. ¿Seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
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

  const handleSwitchPet = useCallback((newPetType) => {
    if (newPetType === pet?.petType) return;
    setSwitchTarget(newPetType);
  }, [pet?.petType]);

  const [switchLoading, setSwitchLoading] = useState(false);

  const confirmSwitchPet = useCallback(async () => {
    if (!switchTarget) return;
    setSwitchLoading(true);
    try {
      const currentVinculo = usePetStore.getState().vinculo;
      const r = await switchActivePetMutation({ userId, newPetType: switchTarget, currentVinculo });
      if (r.success) {
        usePetStore.getState().hydrateFromBackend({
          vinculo: r.vinculo ?? 0,
          petType: switchTarget,
          petName: r.petName ?? switchTarget,
          streak: usePetStore.getState().streak,
        });
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo cambiar la mascota. Intenta de nuevo.");
    } finally {
      setSwitchLoading(false);
      setSwitchTarget(null);
    }
  }, [switchTarget, userId, switchActivePetMutation]);

  const handleBuyFicha = async (item) => {
    if (buyingFicha || !userId) return;
    setBuyingFicha(true);
    try {
      if (item.id === "streak_freeze") {
        await buyStreakFreeze({ userId });
      } else {
        await buyPetFood({ userId, foodType: item.id });
      }
      notifySuccess();
      setSuccessItem(item);
    } catch (e) {
      if (e.message && e.message.includes("Diamantes insuficientes")) {
        // Redirigir a la tienda general
        Alert.alert(
          "Faltan diamantes 💎",
          "Gana diamantes en la ruleta o visita la tienda global.",
          [
            { text: "Cerrar", style: "cancel" },
            { text: "Ir a la tienda", onPress: () => setShowShop(true) },
          ]
        );
      } else {
        Alert.alert("¡Aguas!", e.message ?? "No se pudo comprar");
      }
    } finally {
      setBuyingFicha(false);
    }
  };

  const handleTapMascot = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current > 2000) tapCountRef.current = 0;
    lastTapRef.current = now;
    tapCountRef.current += 1;

    tapCountRef.current >= 5 ? tapMedium() : tapLight();
    playPetSound("happy", usePetStore.getState().petType);
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
      <TopBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet name under TopBar */}
        <Text style={styles.headerName}>{pet.petName}</Text>

        {/* ── Mascot display ── */}
        <View style={styles.mascotWrap}>
          {/* Glow ring behind mascot */}
          <View style={[styles.glowRing, { borderColor: theme.primary + "60", shadowColor: theme.primary }]} />

          <FloatingMascot
            petType={pet.petType}
            stage={stage}
            size={MASCOT_SIZE}
            onTap={handleTapMascot}
            activeSkin={activeSkin}
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

        {/* ── Streak (tappable → opens StreakModal) ── */}
        <TouchableOpacity
          style={styles.streakBadge}
          onPress={() => setShowStreakModal(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.streakText}>
            🔥 Racha: {streakDays} día{streakDays !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.streakChevron}>›</Text>
        </TouchableOpacity>

        <StreakModal visible={showStreakModal} onClose={() => setShowStreakModal(false)} />

        {/* ── Tienda de Mascota ── */}
        <View style={styles.shopSection}>
          <Text style={styles.shopTitle}>🏪 Tiendita de la Mascota</Text>
          <Text style={styles.shopSub}>Compra comidita o salva tu racha con tus diamantes.</Text>
          <View style={styles.itemRow}>
            {FICHAS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => handleBuyFicha(item)} activeOpacity={0.85}>
                <Text style={styles.itemEmoji}>{item.icon}</Text>
                <Text style={styles.itemQty}>{item.qty}</Text>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <View style={styles.itemPriceCoins}>
                  <Image source={require("../../assets/icons/diamond.png")} style={styles.itemCoinIcon} />
                  <Text style={styles.itemPriceCoinsText}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Skins equipadas ── */}
        {(() => {
          const ownedSkins = shopState?.purchasedSkins ?? [];
          if (ownedSkins.length === 0) return null;
          return (
            <View style={styles.shopSection}>
              <Text style={styles.shopTitle}>🎭 Skins</Text>
              <Text style={styles.shopSub}>Toca una skin para equiparla a tu mascota.</Text>
              <View style={[styles.itemRow, { flexWrap: 'wrap' }]}>
                {/* Opción "sin skin" */}
                <TouchableOpacity
                  style={[styles.skinSelectCard, !activeSkin && styles.skinSelectCardActive]}
                  onPress={() => setActiveSkin(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.skinSelectEmoji}>✖️</Text>
                  <Text style={styles.skinSelectLabel}>Sin skin</Text>
                  {!activeSkin && <View style={styles.skinEquippedBadge}><Text style={styles.skinEquippedText}>Equipada</Text></View>}
                </TouchableOpacity>
                {ownedSkins.map((skinId) => {
                  const cfg = SKIN_CONFIG[skinId];
                  if (!cfg) return null;
                  const equipped = activeSkin === skinId;
                  return (
                    <TouchableOpacity
                      key={skinId}
                      style={[
                        styles.skinSelectCard,
                        equipped && { borderColor: cfg.borderColor, borderWidth: 2.5, backgroundColor: cfg.bgColor + '22' },
                      ]}
                      onPress={() => setActiveSkin(equipped ? null : skinId)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.skinSelectEmoji}>{cfg.emoji}</Text>
                      <Text style={styles.skinSelectLabel}>{cfg.label}</Text>
                      {equipped && (
                        <View style={[styles.skinEquippedBadge, { backgroundColor: cfg.bgColor }]}>
                          <Text style={styles.skinEquippedText}>Equipada</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* ── Tus Mascotas (switcher) ── */}
        <View style={styles.switcherSection}>
          <Text style={styles.switcherTitle}>🐾 Tus Mascotas</Text>
          <Text style={styles.switcherSub}>Puedes tener 3 mascotas. Cada una guarda su propio progreso.</Text>
          <View style={styles.switcherRow}>
            {PET_TYPES.map((pt) => {
              const isActive = pet?.petType === pt.id;
              const slotInfo = petSlotsData?.slots?.[pt.id];
              const slotStage = slotInfo?.stage ?? 1;
              const slotName = slotInfo?.name ?? pt.name;
              return (
                <TouchableOpacity
                  key={pt.id}
                  style={[
                    styles.slotCard,
                    isActive && { borderColor: pt.accent, borderWidth: 2.5, backgroundColor: "#FFF8EE" },
                  ]}
                  onPress={() => handleSwitchPet(pt.id)}
                  activeOpacity={isActive ? 1 : 0.75}
                >
                  <StageCropped petType={pt.id} stage={slotStage} size={52} showSkin={false} />
                  <Text style={[styles.slotName, { color: pt.accent }]} numberOfLines={1}>{slotName}</Text>
                  <View style={[styles.slotStageBadge, { backgroundColor: pt.accent + "22" }]}>
                    <Text style={[styles.slotStageText, { color: pt.accent }]}>
                      {slotInfo ? `Etapa ${slotStage}` : "¡Nuevo!"}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: pt.accent }]}>
                      <Text style={styles.activeBadgeText}>Activa</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Nahual Legendario (Mexicanario Plus) ── */}
        <View style={styles.nahualOuterWrap}>
          <LinearGradient
            colors={["#2D0B6B", "#150733", "#1C0A45"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nahualSection}
          >
            {/* Corner stars */}
            <Text style={styles.nahualStarL}>✦</Text>
            <Text style={styles.nahualStarR}>✦</Text>

            {/* Header */}
            <View style={styles.nahualHeaderRow}>
              <Text style={styles.nahualTitle}>🦅 NAHUAL LEGENDARIO</Text>
              <LinearGradient
                colors={["#F9D342", "#D4860A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.plusPill}
              >
                <Text style={styles.plusPillText}>⭐ PLUS</Text>
              </LinearGradient>
            </View>

            {/* Gold divider */}
            <View style={styles.nahualDivider} />

            <Text style={styles.nahualSub}>
              Mascota exclusiva · 3 variantes regionales de México
            </Text>

            {pet?.mexPlusActive ? (
              <View style={styles.nahualRow}>
                {NAHUAL_VARIANTS.map((nv) => {
                  const isActive = pet?.petType === nv.id;
                  const slotInfo = petSlotsData?.slots?.[nv.id];
                  const slotStage = slotInfo?.stage ?? 1;
                  const slotName = slotInfo?.name ?? nv.variant;
                  return (
                    <TouchableOpacity
                      key={nv.id}
                      style={[
                        styles.nahualCard,
                        isActive && { borderColor: "#F9D342", borderWidth: 2.5 },
                      ]}
                      onPress={() => handleSwitchPet(nv.id)}
                      activeOpacity={isActive ? 1 : 0.75}
                    >
                      <View style={[styles.nahualCardStrip, { backgroundColor: nv.accent }]} />
                      <Text style={styles.nahualVariantEmoji}>{nv.emoji}</Text>
                      <StageCropped petType={nv.id} stage={slotStage} size={52} />
                      <Text style={[styles.slotName, { color: "#EDE0FF" }]} numberOfLines={1}>{slotName}</Text>
                      <View style={[styles.slotStageBadge, { backgroundColor: nv.accent + "33" }]}>
                        <Text style={[styles.slotStageText, { color: "#C4A8FF" }]}>
                          {slotInfo ? `Etapa ${slotStage}` : "¡Nuevo!"}
                        </Text>
                      </View>
                      {isActive && (
                        <LinearGradient
                          colors={["#F9D342", "#D4860A"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.activeBadge}
                        >
                          <Text style={styles.activeBadgeText}>Activa</Text>
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* Not a Plus subscriber — show locked preview */
              <View style={styles.nahualLockedBox}>
                {/* Exclusive banner */}
                <View style={styles.nahualExclusiveBanner}>
                  <Text style={styles.nahualExclusiveText}>✨ MASCOTA EXCLUSIVA ✨</Text>
                </View>

                <View style={styles.nahualLockedPreview}>
                  {NAHUAL_VARIANTS.map((nv) => (
                    <View key={nv.id} style={styles.nahualLockedCard}>
                      <View style={[styles.nahualCardStrip, { backgroundColor: nv.accent + "AA" }]} />
                      <Text style={styles.nahualVariantEmoji}>{nv.emoji}</Text>
                      <Text style={styles.nahualLockedVariant}>{nv.variant}</Text>
                      <View style={styles.lockOverlay}>
                        <Text style={styles.lockOverlayIcon}>🔒</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <Text style={styles.nahualLockedMsg}>
                  Desbloquea al Nahual y sus 3 variantes con Mexicanario Plus
                </Text>

                <TouchableOpacity onPress={() => setShowShop(true)} activeOpacity={0.85}>
                  <LinearGradient
                    colors={["#F9D342", "#E8920D", "#C27A09"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.nahualPlusBtn}
                  >
                    <Text style={styles.nahualPlusBtnText}>⭐ Hazte Plus — $4.99/mes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Custom switch-pet confirmation modal (Mexicanómetro style) ── */}
      {switchTarget && (() => {
        const targetPet = PET_TYPES.find(p => p.id === switchTarget)
          ?? NAHUAL_VARIANTS.find(p => p.id === switchTarget);
        const slotInfo = petSlotsData?.slots?.[switchTarget];
        const slotStage = slotInfo?.stage ?? 1;
        const slotName = slotInfo?.name ?? targetPet?.name ?? switchTarget;
        return (
          <Modal visible transparent animationType="fade" onRequestClose={() => setSwitchTarget(null)}>
            <View style={styles.switchModalOverlay}>
              <ImageBackground
                source={require("../../assets/images/bg.png")}
                style={styles.switchModalCard}
                imageStyle={{ borderRadius: 22 }}
                resizeMode="cover"
              >
                {/* Header */}
                <View style={styles.switchModalHeader}>
                  <Text style={styles.switchModalTitle}>🐾 Cambiar Mascota</Text>
                  <TouchableOpacity onPress={() => setSwitchTarget(null)} style={styles.switchModalClose}>
                    <Text style={styles.switchModalCloseText}>×</Text>
                  </TouchableOpacity>
                </View>

                {/* Pet preview */}
                <View style={styles.switchModalPreview}>
                  <StageCropped petType={switchTarget} stage={slotStage} size={110} />
                </View>

                <Text style={styles.switchModalPetName}>{slotName}</Text>
                <View style={[styles.switchModalStagePill, { backgroundColor: targetPet?.accent + "22", borderColor: targetPet?.accent }]}>
                  <Text style={[styles.switchModalStageText, { color: targetPet?.accent }]}>
                    {slotInfo ? `Etapa ${slotStage}` : "¡Nueva mascota!"}
                  </Text>
                </View>

                <Text style={styles.switchModalBody}>
                  Tu mascota actual quedará guardada con todo su progreso. Puedes regresar cuando quieras.
                </Text>

                {/* Buttons */}
                <TouchableOpacity
                  style={[styles.switchModalBtnConfirm, { backgroundColor: targetPet?.accent ?? "#D36B1E" }, switchLoading && { opacity: 0.6 }]}
                  onPress={confirmSwitchPet}
                  disabled={switchLoading}
                >
                  <Text style={styles.switchModalBtnText}>
                    {switchLoading ? "Cambiando…" : `¡Cambiar a ${targetPet?.name}!`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.switchModalBtnCancel} onPress={() => setSwitchTarget(null)}>
                  <Text style={styles.switchModalBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </ImageBackground>
            </View>
          </Modal>
        );
      })()}

      <PurchaseSuccessModal visible={!!successItem} item={successItem} onClose={() => setSuccessItem(null)} />
      {showShop && <ShopScreen visible={showShop} onClose={() => setShowShop(false)} autoSinAnuncios={false} />}
    </ImageBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#7FAAB8" },
  scroll: { paddingHorizontal: 16, paddingTop: height * 0.16, alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4E2CD" },
  emptyText: { color: "#5C3A21", fontSize: 16, textAlign: "center" },

  // Pet name heading below TopBar
  headerName: {
    color: "#5C3A21",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },

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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streakText: { color: "#D36B1E", fontSize: 14, fontWeight: "700" },
  streakChevron: { color: "#D36B1E", fontSize: 18, fontWeight: "700", marginLeft: 2 },

  // Reset (kept for destructive action via handleResetPet if needed)
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

  // Pet switcher
  switcherSection: {
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
    backgroundColor: "rgba(244,226,205,0.85)",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  switcherTitle: {
    color: "#5C3A21",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  switcherSub: {
    color: "#B38E6A",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  switcherRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    width: "100%",
  },
  slotCard: {
    flex: 1,
    backgroundColor: "#FFE4B5",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.25)",
    padding: 10,
    alignItems: "center",
    gap: 5,
    position: "relative",
  },
  slotName: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  slotStageBadge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  slotStageText: {
    fontSize: 10,
    fontWeight: "700",
  },
  activeBadge: {
    position: "absolute",
    top: -8,
    right: -6,
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },

  // Switch-pet modal (Mexicanómetro style)
  switchModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  switchModalCard: {
    width: width * 0.84,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#8B4513",
    padding: 22,
    alignItems: "center",
    overflow: "hidden",
  },
  switchModalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchModalTitle: {
    color: "#8B4513",
    fontSize: 17,
    fontWeight: "800",
  },
  switchModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  switchModalCloseText: { color: "#fff", fontSize: 20, fontWeight: "bold", lineHeight: 22 },
  switchModalPreview: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
  },
  switchModalPetName: {
    color: "#5C3A21",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  switchModalStagePill: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  switchModalStageText: { fontSize: 12, fontWeight: "700" },
  switchModalBody: {
    color: "#7A4020",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  switchModalBtnConfirm: {
    width: "100%",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  switchModalBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  switchModalBtnCancel: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  switchModalBtnCancelText: { color: "#B38E6A", fontSize: 13, fontWeight: "600" },

  // ── Shop Section ──
  shopSection: { marginTop: 24, paddingHorizontal: 16, paddingVertical: 16, width: "100%", maxWidth: 500, backgroundColor: "rgba(244,226,205,0.85)", borderRadius: 18 },
  shopTitle: { color: "#5C3A21", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  shopSub: { color: "#A0541A", fontSize: 14, marginBottom: 16 },
  itemRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  itemCard: {
    width: "48%",
    backgroundColor: "#FFE4B5",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#8B4513",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  itemEmoji: { fontSize: 32, marginBottom: 4 },
  itemQty: { color: "#5C3A21", fontSize: 16, fontWeight: "900", marginBottom: 2 },
  itemLabel: { color: "#8B4513", fontSize: 11, fontWeight: "600", textTransform: "uppercase", marginBottom: 8 },
  itemPriceCoins: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  itemCoinIcon: { width: 14, height: 14, marginRight: 4, resizeMode: "contain" },
  itemPriceCoinsText: { color: "#333", fontSize: 13, fontWeight: "700" },

  // Skin selector
  skinSelectCard: {
    width: "30%",
    backgroundColor: "#FFE4B5",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#C4A47A",
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  skinSelectCardActive: {
    borderColor: "#8B4513",
    backgroundColor: "#FFF0D0",
  },
  skinSelectEmoji: { fontSize: 26, marginBottom: 3 },
  skinSelectLabel: { color: "#5C3A21", fontSize: 10, fontWeight: "700", textAlign: "center" },
  skinEquippedBadge: {
    position: "absolute",
    top: -7,
    right: -4,
    backgroundColor: "#8B4513",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  skinEquippedText: { color: "#fff", fontSize: 7, fontWeight: "900" },

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

  // ── Nahual Legendario section ─────────────────────────────────────────────
  nahualOuterWrap: {
    width: "100%",
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#7B3FE4",
    // shadow glow (iOS)
    shadowColor: "#9C50FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  nahualSection: {
    width: "100%",
    alignItems: "center",
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
  },
  nahualStarL: {
    position: "absolute",
    top: 12,
    left: 14,
    color: "#F9D342",
    fontSize: 16,
    opacity: 0.7,
  },
  nahualStarR: {
    position: "absolute",
    top: 12,
    right: 14,
    color: "#F9D342",
    fontSize: 16,
    opacity: 0.7,
  },
  nahualHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  nahualTitle: {
    color: "#F0DCFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  plusPill: {
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  plusPillText: {
    color: "#1A0A00",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  nahualDivider: {
    width: "60%",
    height: 1.5,
    backgroundColor: "#F9D342",
    opacity: 0.45,
    borderRadius: 99,
    marginBottom: 10,
  },
  nahualSub: {
    color: "#C4A8FF",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  nahualRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    width: "100%",
  },
  nahualCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(196,168,255,0.3)",
    paddingBottom: 10,
    alignItems: "center",
    gap: 4,
    position: "relative",
    overflow: "hidden",
  },
  nahualCardStrip: {
    width: "100%",
    height: 5,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginBottom: 6,
  },
  nahualVariantEmoji: { fontSize: 22 },
  // Exclusive banner (locked state)
  nahualExclusiveBanner: {
    backgroundColor: "rgba(249,211,66,0.12)",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(249,211,66,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  nahualExclusiveText: {
    color: "#F9D342",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  // Locked state
  nahualLockedBox: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  nahualLockedPreview: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  nahualLockedCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(156,111,222,0.3)",
    paddingBottom: 10,
    alignItems: "center",
    gap: 4,
    position: "relative",
    overflow: "hidden",
  },
  nahualLockedVariant: {
    color: "#B89AD4",
    fontSize: 11,
    fontWeight: "700",
  },
  lockOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(10,5,20,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  lockOverlayIcon: { fontSize: 26 },
  nahualLockedMsg: {
    color: "#C4A8FF",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 8,
    lineHeight: 19,
  },
  nahualPlusBtn: {
    borderRadius: 30,
    paddingHorizontal: 30,
    paddingVertical: 13,
  },
  nahualPlusBtnText: {
    color: "#1A0A00",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
