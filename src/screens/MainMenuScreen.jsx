import { useQuery, useMutation } from "convex/react";
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import GiftModel from "../components/gift";
import MexicanarioModal from "../components/MexicanarioModal";
import SinAnuncios from "../components/SinAnuncios";
import TermsModal from "../components/TermsModal";
import DailyMissionsWidget from "../components/DailyMissionsWidget";
import MiniMascot from "../components/MiniMascot";
import TopBar from "../components/TopBar";
import WheelModal from "../components/WheelModal";
import ShopScreen from "./ShopScreen";
import { useAuth } from "../context/AuthContext";
import { getZone, getZoneProgress } from "../config/mexicoZones";
import { tapMedium } from "../services/haptics";

const { width, height } = Dimensions.get("window");

const GROUP_SIZE = 50;
// Each slide takes the full width — the adjacent cards peek in via opacity/scale only
const ITEM_W = width;
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
  const [showWheel, setShowWheel] = useState(false);
  const [showShop,  setShowShop]  = useState(false);
  const [showAds,   setShowAds]   = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [showSinAnuncios, setShowSinAnuncios] = useState(false);
  const [showMexicanario, setShowMexicanario] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [devMsg, setDevMsg] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const { userId, logout } = useAuth();
  const levelInfo = useQuery(api.users.getCurrentLevel, userId ? { userId } : "skip");
  const allLevels = useQuery(api.levels.getAllLevels, {});

  const giveDevCoins = useMutation(api.devTools.giveDevCoins);
  const resetLevelDev = useMutation(api.devTools.resetLevelDev);
  const seed15to18 = useMutation(api.levels.seedLevels15_18);
  const buildLevels = useMutation(api.levels.createLevelsForAllWords);
  const seedOriginal = useMutation(api.words.seedOriginalWords);

  const flatRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const currentLevel = levelInfo?.level || 1;
  const allLevelsData = allLevels || [];

  // ── Groups of 50 ────────────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const result = [];
    for (let i = 0; i < allLevelsData.length; i += GROUP_SIZE) {
      const chunk = allLevelsData.slice(i, i + GROUP_SIZE);
      const groupStart = chunk[0]?.levelNumber ?? i * GROUP_SIZE + 1;
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

  useEffect(() => {
    let t;
    if (userId && !levelInfo) t = setTimeout(() => setLoadingError(true), 8000);
    else if (levelInfo) setLoadingError(false);
    return () => clearTimeout(t);
  }, [userId, levelInfo]);

  if (!levelInfo && userId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ECECEC" }}>
        {loadingError ? (
          <View style={{ alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, marginBottom: 15, color: "#333", fontWeight: "bold" }}>
              La carga está tardando mucho...
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: "#F59B40", paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20, marginBottom: 12 }}
              onPress={() => setLoadingError(false)}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>Reintentar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: "#cc0000", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 16 }}
              onPress={logout}
            >
              <Text style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>🔄 Resetear sesión</Text>
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
                const zone = getZone(currentLevel);
                const zoneProgress = getZoneProgress(currentLevel);
                const zoneSize = zone.levels[1] === 9999 ? 10 : zone.levels[1] - zone.levels[0] + 1;
                return (
                  <TouchableOpacity
                    style={[styles.zoneChip, { backgroundColor: zone.color + "DD" }]}
                    onPress={() => { tapMedium(); navigation.navigate("Map"); }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.zoneChipText}>
                      {zone.emoji} {zone.name}  ·  {zoneProgress}/{zoneSize}  🗺️
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
    <ImageBackground source={require("../../assets/images/bg.png")} style={styles.container} resizeMode="cover">
      <TopBar />

      {/* Floating side icons */}
      <View style={styles.leftColumn}>
        <TouchableOpacity style={styles.floatBadge} onPress={() => { tapMedium(); setShowMexicanario(true); }}>
          <Image source={require("../../assets/images/venezolario.png")} style={styles.floatIcon} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatBadge} onPress={() => { tapMedium(); setShowGift(true); }}>
          <Image source={require("../../assets/images/gift.png")} style={styles.floatIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>
      <View style={styles.rightColumn}>
        <TouchableOpacity style={styles.floatBadge} onPress={() => { tapMedium(); setShowWheel(true); }}>
          <Image source={require("../../assets/images/wheelPage.png")} style={styles.floatIcon} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatBadge} onPress={() => { tapMedium(); setShowShop(true); setShowAds(true); }}>
          <Image source={require("../../assets/images/ads.png")} style={styles.floatIcon} resizeMode="contain" />
        </TouchableOpacity>
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
          <ActivityIndicator size="large" color="#F59B40" />
        )}
      </View>

      {/* Misiones diarias */}
      <DailyMissionsWidget userId={userId} />

      {/* DEV panel — solo visible en modo desarrollo */}
      {__DEV__ && (
        <View style={styles.devPanel}>
          {[
            { label: "🪙 ∞", color: "#f5a623", action: async () => { const r = await giveDevCoins({ userId }); setDevMsg(r.success ? `🪙${r.coins}` : "Error"); } },
            { label: "🔄 N1", color: "#27ae60", action: async () => { const r = await resetLevelDev({ userId }); setDevMsg(r.success ? "N1 ✅" : "Error"); } },
            { label: "🌱 15-18", color: "#8E44AD", action: async () => { setDevMsg("..."); await seedOriginal(); await seed15to18(); await buildLevels(); setDevMsg("✅ Seed Ok"); } },
          ].map(({ label, color, action }) => (
            <TouchableOpacity
              key={label}
              style={[styles.devBtn, { backgroundColor: color }]}
              onPress={async () => { if (!userId) return; await action(); setTimeout(() => setDevMsg(""), 3000); }}
            >
              <Text style={styles.devBtnText}>{label}</Text>
            </TouchableOpacity>
          ))}
          {devMsg ? <Text style={styles.devMsg}>{devMsg}</Text> : null}
        </View>
      )}

      {/* Modals */}
      <WheelModal visible={showWheel} onClose={() => setShowWheel(false)} onOpenShop={() => { setShowShop(true); setShowAds(true); }} />
      <ShopScreen  visible={showShop}  onClose={() => { setShowShop(false); setShowAds(false); }} autoSinAnuncios={showAds} />
      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <GiftModel visible={showGift} onClose={() => setShowGift(false)} />
      <SinAnuncios visible={showSinAnuncios} onClose={() => setShowSinAnuncios(false)} />
      <MexicanarioModal visible={showMexicanario} onClose={() => setShowMexicanario(false)} />
    </ImageBackground>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Side icons — large, two columns, anchored high
  leftColumn: { position: "absolute", top: height * 0.16, left: width * 0.03, gap: height * 0.07, zIndex: 50 },
  rightColumn: { position: "absolute", top: height * 0.16, right: width * 0.03, gap: height * 0.07, zIndex: 50 },
  floatBadge: { width: width * 0.16, height: width * 0.16, justifyContent: "center", alignItems: "center" },
  floatIcon: { width: "100%", height: "100%" },

  // Carousel area: starts after TopBar, takes middle of screen
  carouselArea: { marginTop: height * 0.17, height: height * 0.48 },

  // Each slide = full width, vertically centered
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
  bigEmoji: { fontSize: 120, lineHeight: 130 },
  // Oval shadow — blurred ellipse below the emoji
  emojiShadow: {
    width: 110,
    height: 22,
    borderRadius: 55,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginTop: -8,
    // shift shadow to the right like in the reference
    transform: [{ translateX: 10 }],
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
    bottom: height * 0.15,
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
  devPanel: { flexDirection: "row", gap: 8, justifyContent: "center", flexWrap: "wrap", paddingHorizontal: 12, marginBottom: 8 },
  devBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  devBtnText: { color: "#fff", fontWeight: "bold", fontSize: 11 },
  devMsg: { color: "#fff", backgroundColor: "#333", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, fontSize: 11 },
});