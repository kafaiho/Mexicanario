import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import AdBanner from "../components/AdBanner";
import DailyMissionsWidget from "../components/DailyMissionsWidget";
import GiftModel from "../components/gift";
import MexicanarioModal from "../components/MexicanarioModal";
import OnboardingTooltip from "../components/OnboardingTooltip";
import SinAnuncios from "../components/SinAnuncios";
import TermsModal from "../components/TermsModal";
import TopBar from "../components/TopBar";
import WheelModal from "../components/WheelModal";
import { getCulturalPathProgress } from "../config/mexicoZones";
import { getCurrentPathPresentation } from "../config/culturalPathSelection";
import { useAuth } from "../context/AuthContext";
import useDevMode from "../hooks/useDevMode";
import { useOnboarding } from "../hooks/useOnboarding";
import { tapMedium } from "../services/haptics";
import { presentMexicanarioPlusPaywall } from "../services/RevenueCatService";
import usePetStore from "../store/usePetStore";
import { playSound } from "../utils/soundManager";
import { REAL_HEIGHT, REAL_WIDTH } from "../utils/tabletSetup";
import ShopScreen from "./ShopScreen";

const { width, height } = Dimensions.get("window");
// Use real screen dimensions for layout-critical values (carousel snap, full-screen containers)
const SCREEN_W = REAL_WIDTH;
const SCREEN_H = REAL_HEIGHT;

const GROUP_SIZE = 50;
// Each slide fills the full real screen width so snapping works correctly on all devices
const ITEM_W = SCREEN_W;
const SIDE_PAD = 0;

const GROUP_EMOJIS = ["🌮", "🎲", "🎵", "🦎", "🎨", "🏯", "🗣️", "🌵", "🥳", "🤠",
  "🫔", "🍹", "🎻", "🦜", "🖌️", "⛏️", "🌄", "🦩", "🎭", "🏔️"];
const GROUP_NAMES = [
  "Sabores mexicanos", "Juego y tradición", "Música y raíces", "Fauna mexicana",
  "Arte y cultura", "Historia viva", "Expresiones del pueblo", "Tierras y regiones",
  "Costumbres y fiestas", "Habla mexicana",
];

function getGroupEmoji(idx) { return GROUP_EMOJIS[idx % GROUP_EMOJIS.length]; }
function getGroupName(idx, firstWord) { return firstWord || GROUP_NAMES[idx % GROUP_NAMES.length]; }

export default function MainMenuScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [showWheel, setShowWheel] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showAds, setShowAds] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [showSinAnuncios, setShowSinAnuncios] = useState(false);
  const [showMexicanario, setShowMexicanario] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [devMsg, setDevMsg] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const devEnabled = __DEV__ && useDevMode((s) => s.enabled);

  // ── Floating icon bounce animations ─────────────────────────────────────────
  const mexicanarioScale = useSharedValue(1);
  const giftScale = useSharedValue(1);
  const wheelScale = useSharedValue(1);
  const adsScale = useSharedValue(1);

  function bounceTap(sv) {
    playSound("click");
    sv.value = withSequence(
      withTiming(1.28, { duration: 70, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 3, stiffness: 260 })
    );
  }

  const mexicanarioAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: mexicanarioScale.value }] }));
  const giftAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: giftScale.value }] }));
  const wheelAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: wheelScale.value }] }));
  const adsAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: adsScale.value }] }));

  const { userId, logout } = useAuth();
  const levelInfo = useQuery(api.users.getCurrentLevel, userId ? { userId } : "skip");
  const allLevels = useQuery(api.levels.getAllLevels, userId ? { userId } : {});

  // Onboarding — shown only on first launch
  const { step: obStep, active: obActive, advance: obAdvance, skip: obSkip } = useOnboarding("menu");
  const TAB_H = Platform.OS === "ios" ? 88 : 64;
  const ONBOARDING_STEPS = [
    {
      text: "¡Bienvenido a Mexicanario! 🇲🇽 Aquí están los grupos de palabras. Desliza para explorar más grupos.",
      bubbleStyle: { top: height * 0.44, left: 30, right: 30 },
      handStyle: { top: height * 0.34, left: width / 2 - 24 },
      handEmoji: "👇",
      handBounceDir: "down",
    },
    {
      text: "¡Toca el botón naranja para empezar a jugar tu siguiente nivel! 🎮🌮",
      bubbleStyle: { top: height * 0.22, left: 30, right: 30 },
      handStyle: { top: height * 0.48, left: width / 2 - 24 },
      handEmoji: "👆",
      handBounceDir: "up",
    },
    {
      text: "¡Este es tu Mexicanómetro! 🌮 Cada palabra que adivinas te da un taco. ¡Acumula tacos para subir de rango y convertirte en el mero mero!",
      bubbleStyle: { top: height * 0.14, left: 30, right: 30 },
      handStyle: { top: height * 0.07, left: width * 0.18 },
      handEmoji: "👆",
      handBounceDir: "up",
    },
    {
      text: "¡Tienes una mascota que te acompañará en tu aventura! 🦎 Cuídala y mírala crecer conforme aprendes más palabras mexicanas.",
      bubbleStyle: { bottom: TAB_H + 80, left: 30, right: 30 },
      handStyle: { bottom: TAB_H + 4, left: width * 0.31 },
      handEmoji: "👇",
      handBounceDir: "down",
    },
  ];

  const giveDevCoins = useMutation(api.devTools.giveDevCoins);
  const resetLevelDev = useMutation(api.devTools.resetLevelDev);
  const switchPetType = useMutation(api.devTools.switchPetType);
  const seed15to18 = useMutation(api.levels.seedLevels15_18);
  const buildLevels = useMutation(api.levels.createLevelsForAllWords);
  const seedOriginal = useMutation(api.words.seedOriginalWords);

  const DEV_PET_TYPES = ["ajolote", "xolo", "alebrije"];
  const [devPetIdx, setDevPetIdx] = useState(0);

  const flatRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const currentLevel = levelInfo?.level || 1;
  const allLevelsData = allLevels || [];
  const totalLevels = allLevelsData.length;

  // ── Groups of 50 ────────────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const result = [];
    for (let i = 0; i < allLevelsData.length; i += GROUP_SIZE) {
      const chunk = allLevelsData.slice(i, i + GROUP_SIZE);
      // Use array position (1-indexed) so it aligns with currentLevel,
      // which is also a sequential counter — not the levelNumber from the DB.
      const groupStart = i + 1;
      const completed = Math.max(0, Math.min(chunk.length, currentLevel - groupStart));
      const isCompleted = completed >= chunk.length;
      const isActive = !isCompleted && groupStart <= currentLevel;
      const isLocked = groupStart > currentLevel;
      result.push({
        idx: result.length, chunk, groupStart,
        firstWord: chunk[0]?.word,
        completedInGroup: completed,
        totalInGroup: chunk.length,
        isCompleted, isActive, isLocked,
      });
    }
    return result;
  }, [allLevelsData, currentLevel]);

  // Auto-scroll to active group
  useEffect(() => {
    if (groups.length > 0 && flatRef.current) {
      const activeGroupIdx = groups.findIndex((g) => g.isActive || g.isLocked);
      const scrollIdx = activeGroupIdx >= 0 ? activeGroupIdx : groups.length - 1;
      setTimeout(() => {
        flatRef.current?.scrollToIndex({ index: scrollIdx, animated: false });
        setActiveIndex(scrollIdx);
      }, 350);
    }
  }, [groups.length]);

  // Auto-retry with exponential backoff when levelInfo fails to load
  const retryCountRef = useRef(0);
  const [retryLabel, setRetryLabel] = useState('');
  useEffect(() => {
    if (levelInfo) {
      setLoadingError(false);
      retryCountRef.current = 0;
      return;
    }
    if (!userId) return;
    // Show error after 8s, then auto-retry with backoff: 4s, 8s, 16s (max)
    const t = setTimeout(() => {
      setLoadingError(true);
      const attempt = retryCountRef.current;
      if (attempt < 4) {
        const delay = Math.min(4000 * Math.pow(2, attempt), 16000);
        retryCountRef.current = attempt + 1;
        setRetryLabel(`Reintentando en ${delay / 1000}s...`);
        const retryT = setTimeout(() => {
          setLoadingError(false); // triggers re-render → Convex retries query
          setRetryLabel('');
        }, delay);
        return () => clearTimeout(retryT);
      }
    }, 8000);
    return () => clearTimeout(t);
  }, [userId, levelInfo, loadingError]);

  if (!levelInfo && userId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ECECEC" }}>
        {loadingError ? (
          <View style={{ alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, marginBottom: 15, color: "#333", fontWeight: "bold" }}>
              La carga está tardando mucho...
            </Text>
            {retryLabel ? (
              <Text style={{ fontSize: 14, color: "#888", marginBottom: 12 }}>{retryLabel}</Text>
            ) : null}
            <TouchableOpacity
              style={{ backgroundColor: "#F59B40", paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20, marginBottom: 12 }}
              onPress={() => { retryCountRef.current = 0; setLoadingError(false); }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityIndicator size="large" color="#0000ff" />
        )}
      </View>
    );
  }

  // ── Card renderer ────────────────────────────────────────────────────────────
  const renderGroup = ({ item, index }) => {
    const { isCompleted, isActive, isLocked, completedInGroup, totalInGroup, idx } = item;
    const emoji = getGroupEmoji(idx);
    const name = getGroupName(idx, item.firstWord);
    const progressFraction = totalInGroup > 0 ? completedInGroup / totalInGroup : 0;

    // Scale + opacity animation: center slides are full-size, neighbours smaller
    const inputRange = [(index - 1) * ITEM_W, index * ITEM_W, (index + 1) * ITEM_W];
    const emojiScale = scrollX.interpolate({ inputRange, outputRange: [0.55, 1, 0.55], extrapolate: "clamp" });
    const contentOp = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: "clamp" });
    const peekOp = scrollX.interpolate({ inputRange, outputRange: [0.8, 0, 0.8], extrapolate: "clamp" });

    const pillBg = isCompleted ? "#A63C06" : isLocked ? "#b0b0b0" : "#A63C06";

    return (
      <View style={styles.slide}>
        {/* ── Centre content ── */}
        {/* Large emoji with oval drop-shadow */}
        <Animated.View style={[styles.emojiWrapper, { transform: [{ scale: emojiScale }] }]}>
          {isLocked && (
            <View style={styles.lockBadge}><Text style={{ fontSize: 28 }}>🔒</Text></View>
          )}
          <Text style={[styles.bigEmoji, isLocked && { opacity: 0.45 }]}>{emoji}</Text>
          {/* Oval shadow beneath emoji */}
          <View style={styles.emojiShadow} />
        </Animated.View>

        {/* Name pill + info — visible only for centre slide */}
        <Animated.View style={[styles.centreContent, { opacity: contentOp }]}>
          <View style={[styles.namePill, { backgroundColor: pillBg }]}>
            <Text style={styles.namePillText} numberOfLines={1}>{name}</Text>
          </View>

          <Text style={styles.subText}>
            {isLocked
              ? `🔒 Bloqueado`
              : `${completedInGroup}/${totalInGroup} palabras`}
          </Text>

          {/* Thin progress bar */}
          {!isLocked && (
            <View style={styles.progressOuter}>
              <View style={[styles.progressInner, { width: `${progressFraction * 100}%` }]} />
            </View>
          )}

          {/* CTA button + Mascota */}
          {!isLocked && (
            <>
              {/* Zone chip — only on active slide */}
              {isActive && (() => {
                const zone = getCurrentPathPresentation(levelInfo);
                const zoneProgress = zone.isNeutral ? null : getCulturalPathProgress(levelInfo?.editorialOrder, zone.id);
                const zoneSize = zone.entryCount;
                return (
                  <TouchableOpacity
                    style={[styles.zoneChip, { backgroundColor: zone.color + "DD" }]}
                    onPress={() => { tapMedium(); navigation.navigate("Map"); }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.zoneChipText}>
                      {zone.emoji} {zone.name}
                      {zoneProgress ? `  ·  ${zoneProgress}/${zoneSize}` : ""}  🗺️
                    </Text>
                  </TouchableOpacity>
                );
              })()}
              <View style={styles.ctaRow}>
                {isCompleted ? (
                  <View style={[styles.ctaBtn, styles.ctaBtnCompleted, { opacity: 0.6 }]}>
                    <Text style={styles.ctaBtnText}>✅ Completado</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.ctaBtn}
                    onPress={() => { tapMedium(); navigation.navigate("Gameplay"); }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ctaBtnText}>{`Nivel ${currentLevel}`}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </Animated.View>

        {/* Peek label — visible only on side slides */}
        <Animated.View style={[styles.peekLabel, { opacity: peekOp, backgroundColor: pillBg }]}>
          <Text style={styles.peekLabelText} numberOfLines={1}>{name}</Text>
        </Animated.View>
      </View>
    );
  };

  // ── Dot indicator ────────────────────────────────────────────────────────────
  const MAX_DOTS = 7;
  const dotCount = Math.min(groups.length, MAX_DOTS);
  const dotStartIdx = Math.max(0, Math.min(activeIndex - Math.floor(MAX_DOTS / 2), groups.length - dotCount));

  return (
    <ImageBackground source={require("../../assets/images/bg.webp")} style={styles.container} resizeMode="cover">
      <TopBar />

      {/* Floating side icons */}
      <View style={styles.leftColumn}>
        <Reanimated.View style={mexicanarioAnimStyle}>
          <TouchableOpacity style={styles.floatBadge} onPress={() => { tapMedium(); bounceTap(mexicanarioScale); setShowMexicanario(true); }}>
            <Image source={require("../../assets/images/venezolario.png")} style={styles.floatIcon} resizeMode="contain" />
          </TouchableOpacity>
        </Reanimated.View>
        <Reanimated.View style={giftAnimStyle}>
          <TouchableOpacity style={styles.floatBadge} onPress={() => { tapMedium(); bounceTap(giftScale); setShowGift(true); }}>
            <Image source={require("../../assets/images/gift.png")} style={styles.floatIcon} resizeMode="contain" />
          </TouchableOpacity>
        </Reanimated.View>
      </View>
      <View style={styles.rightColumn}>
        <Reanimated.View style={wheelAnimStyle}>
          <TouchableOpacity style={styles.floatBadge} onPress={() => { tapMedium(); bounceTap(wheelScale); setShowWheel(true); }}>
            <Image source={require("../../assets/images/wheelPage.webp")} style={styles.floatIcon} resizeMode="contain" />
          </TouchableOpacity>
        </Reanimated.View>
        <Reanimated.View style={adsAnimStyle}>
          <TouchableOpacity style={styles.floatBadge} onPress={() => { tapMedium(); bounceTap(adsScale); presentMexicanarioPlusPaywall(); }}>
            <Image source={require("../../assets/images/ads.png")} style={styles.floatIcon} resizeMode="contain" />
          </TouchableOpacity>
        </Reanimated.View>
      </View>

      {/* Carousel */}
      <View style={styles.carouselArea}>
        {groups.length > 0 ? (
          <>
            <Animated.FlatList
              ref={flatRef}
              data={groups}
              keyExtractor={(item) => String(item.idx)}
              renderItem={renderGroup}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_W}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 0 }}
              getItemLayout={(_, index) => ({ length: ITEM_W, offset: ITEM_W * index, index })}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_W);
                setActiveIndex(idx);
              }}
              scrollEventThrottle={16}
            />
            {/* Dots */}
            <View style={styles.dotsRow}>
              {Array.from({ length: dotCount }).map((_, i) => {
                const realIdx = dotStartIdx + i;
                return <View key={realIdx} style={[styles.dot, realIdx === activeIndex && styles.dotActive]} />;
              })}
            </View>
          </>
        ) : (
          <View style={{ alignItems: "center", gap: 20 }}>
            {allLevels === undefined && (
              <ActivityIndicator size="large" color="#F59B40" />
            )}
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => { tapMedium(); navigation.navigate("Gameplay"); }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>{`Nivel ${currentLevel}`}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: "#1E1E2E", borderWidth: 1.5, borderColor: "#D2691E" }]}
              onPress={() => { tapMedium(); navigation.navigate("PvP"); }}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaBtnText, { color: "#F8BE17" }]}>⚔️ Duelo PvP</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Misiones diarias */}
      <DailyMissionsWidget userId={userId} />

      {/* DEV trigger — solo visible en modo desarrollador */}
      {devEnabled && (
        <TouchableOpacity style={styles.devTrigger} onPress={() => setShowDevPanel(true)}>
          <Text style={styles.devTriggerText}>🔧 Herramientas Dev</Text>
        </TouchableOpacity>
      )}

      {/* DEV panel modal */}
      <Modal
        visible={showDevPanel && devEnabled}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDevPanel(false)}
      >
        <View style={styles.devModalOverlay}>
          <View style={styles.devModalCard}>
            <Text style={styles.devModalTitle}>🔧 Developer Tools</Text>
            <Text style={styles.devModalSubtitle}>Solo visible en Modo Dev (long-press ⚙️)</Text>

            <ScrollView style={{ width: "100%" }} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
              {/* Economía */}
              <Text style={styles.devSectionLabel}>💰 Economía</Text>
              <TouchableOpacity style={[styles.devModalBtn, { backgroundColor: "#f5a623" }]}
                onPress={async () => { if (!userId) return; const r = await giveDevCoins({ userId }); setDevMsg(r.success ? `🪙 ${r.coins} monedas` : "Error"); }}>
                <Text style={styles.devModalBtnText}>🪙 Dar monedas infinitas</Text>
              </TouchableOpacity>

              {/* Progresión */}
              <Text style={styles.devSectionLabel}>📈 Progresión</Text>
              <TouchableOpacity style={[styles.devModalBtn, { backgroundColor: "#27ae60" }]}
                onPress={async () => { if (!userId) return; const r = await resetLevelDev({ userId }); setDevMsg(r.success ? "✅ Nivel → 1" : "Error"); }}>
                <Text style={styles.devModalBtnText}>🔄 Resetear a Nivel 1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.devModalBtn, { backgroundColor: "#8E44AD" }]}
                onPress={async () => { if (!userId) return; setDevMsg("⏳ Cargando seed..."); await seedOriginal(); await seed15to18(); await buildLevels(); setDevMsg("✅ Seed completo"); }}>
                <Text style={styles.devModalBtnText}>🌱 Seed palabras 15-18</Text>
              </TouchableOpacity>


              {/* Mascota */}
              <Text style={styles.devSectionLabel}>🐾 Mascota</Text>
              <TouchableOpacity style={[styles.devModalBtn, { backgroundColor: "#1A6B9A" }]}
                onPress={async () => {
                  if (!userId) return;
                  const next = (devPetIdx + 1) % DEV_PET_TYPES.length;
                  const petType = DEV_PET_TYPES[next];
                  const r = await switchPetType({ userId, petType });
                  if (r.success) { setDevPetIdx(next); usePetStore.getState().setPetType(petType); setDevMsg(`🐾 Mascota → ${petType}`); }
                  else setDevMsg("Error");
                }}>
                <Text style={styles.devModalBtnText}>🐾 Cambiar mascota → {DEV_PET_TYPES[(devPetIdx + 1) % DEV_PET_TYPES.length]}</Text>
              </TouchableOpacity>
            </ScrollView>

            {devMsg ? <Text style={styles.devModalMsg}>{devMsg}</Text> : null}

            <TouchableOpacity style={styles.devModalClose} onPress={() => { setShowDevPanel(false); setDevMsg(""); }}>
              <Text style={styles.devModalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Banner AdMob */}
      <AdBanner style={{ marginBottom: Math.max(4, insets.bottom) }} />

      {/* Modals */}
      <WheelModal visible={showWheel} onClose={() => setShowWheel(false)} onOpenShop={() => { setShowShop(true); setShowAds(true); }} />
      <ShopScreen visible={showShop} onClose={() => { setShowShop(false); setShowAds(false); }} autoSinAnuncios={showAds} />
      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <GiftModel visible={showGift} onClose={() => setShowGift(false)} />
      <SinAnuncios visible={showSinAnuncios} onClose={() => setShowSinAnuncios(false)} />
      <MexicanarioModal visible={showMexicanario} onClose={() => setShowMexicanario(false)} />

      {/* Onboarding tutorial — shown only on first launch */}
      {obActive && (() => {
        const s = ONBOARDING_STEPS[obStep];
        return (
          <OnboardingTooltip
            visible={obActive}
            text={s.text}
            bubbleStyle={s.bubbleStyle}
            handStyle={s.handStyle}
            handEmoji={s.handEmoji}
            handBounceDir={s.handBounceDir}
            step={obStep}
            total={ONBOARDING_STEPS.length}
            onNext={() => obAdvance(ONBOARDING_STEPS.length)}
            onSkip={obSkip}
          />
        );
      })()}
    </ImageBackground>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#7FAAB8" },

  // Side icons — large, two columns, anchored high (use real screen dims for positioning)
  leftColumn: { position: "absolute", top: SCREEN_H * 0.14, left: SCREEN_W * 0.03, gap: SCREEN_H * 0.07, zIndex: 50 },
  rightColumn: { position: "absolute", top: SCREEN_H * 0.14, right: SCREEN_W * 0.03, gap: SCREEN_H * 0.07, zIndex: 50 },
  floatBadge: { width: width * 0.16, height: width * 0.16, justifyContent: "center", alignItems: "center" },
  floatIcon: { width: "100%", height: "100%" },

  // Carousel area: starts after TopBar, takes middle of screen
  carouselArea: { marginTop: SCREEN_H * 0.14, height: SCREEN_H * 0.47 },

  // Each slide = full real screen width, vertically centered
  slide: {
    width: ITEM_W,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // Emoji floats with a big size + oval shadow beneath
  emojiWrapper: {
    alignItems: "center",
    marginBottom: 4,
    position: "relative",
  },
  bigEmoji: { fontSize: 100, lineHeight: 110 },
  // Oval shadow — blurred ellipse below the emoji
  emojiShadow: {
    width: 110,
    height: 22,
    borderRadius: 55,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginTop: -8,
  },

  lockBadge: { position: "absolute", top: 0, right: -10, zIndex: 10 },

  // Centre slide info
  centreContent: { alignItems: "center", width: "100%", paddingHorizontal: 40 },

  namePill: {
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderRadius: 40,
    marginBottom: 8,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  namePillText: { color: "white", fontWeight: "800", fontSize: 17, textAlign: "center" },

  subText: { color: "white", fontSize: 13, fontWeight: "600", marginBottom: 10, textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  progressOuter: { width: "60%", height: 8, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 999, overflow: "hidden", marginBottom: 18 },
  progressInner: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "white", borderRadius: 999 },

  zoneChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  zoneChipText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  ctaRow: {
    alignItems: "center",
  },
  ctaBtn: {
    backgroundColor: "#D36B1E",
    paddingHorizontal: width * 0.18,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#E6CCB2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaBtnCompleted: { backgroundColor: "#D36B1E" },
  ctaBtnText: { color: "white", fontSize: 18, fontWeight: "800" },

  // Side-slide peek pill (faded)
  peekLabel: {
    position: "absolute",
    bottom: SCREEN_H * 0.15,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: "40%",
  },
  peekLabelText: { color: "white", fontSize: 12, fontWeight: "700", textAlign: "center" },

  // Dots
  dotsRow: { flexDirection: "row", justifyContent: "center", marginTop: 10, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.38)" },
  dotActive: { width: 16, backgroundColor: "white" },

  // DEV panel
  // Dev trigger button (replaces floating pills)
  devTrigger: { alignSelf: "center", marginBottom: 6, backgroundColor: "#222", paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#555" },
  devTriggerText: { color: "#aaa", fontSize: 12, fontWeight: "700" },

  // Dev modal
  devModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", padding: 24 },
  devModalCard: { backgroundColor: "#1a1a2e", borderRadius: 20, padding: 22, width: "100%", maxWidth: 400, alignItems: "center", gap: 10 },
  devModalTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  devModalSubtitle: { color: "#888", fontSize: 11, textAlign: "center", marginTop: -6 },
  devSectionLabel: { color: "#f5a623", fontWeight: "800", fontSize: 12, alignSelf: "flex-start", marginTop: 4 },
  devModalBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, width: "100%" },
  devModalBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  devModalMsg: { color: "#2ecc71", fontWeight: "700", fontSize: 13, textAlign: "center" },
  devModalClose: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 30, backgroundColor: "#333", borderRadius: 14 },
  devModalCloseText: { color: "#ccc", fontWeight: "700", fontSize: 14 },
});
