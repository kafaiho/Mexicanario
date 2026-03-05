import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { comboBurst } from "../services/haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { ACHIEVEMENT_ICONS } from "../components/AchievementIcons";
import CoinFlyOverlay from "../components/CoinFlyOverlay";
import TopBar from "../components/TopBar";
import AdBanner from "../components/AdBanner";
import { useAuth } from "../context/AuthContext";
import useCoinFly from "../hooks/useCoinFly";
import { FONTS } from "../theme/designTokens";
import { TABLET_MODE } from "../utils/tabletSetup";

const { width, height } = Dimensions.get("window");
const STORAGE_KEY = "mx_claimed_achievements";

// Compute TopBar clearance (mirrors TopBar.jsx sizing formula)
const TOP_SAFE   = Platform.OS === "ios" ? Math.max(32, height * 0.058) : Math.max(20, height * 0.04);
const TOP_BAR_H  = TOP_SAFE + width * 0.025 + width * 0.075 + width * 0.025;
const HEADER_TOP = Math.round(TOP_BAR_H + (TABLET_MODE ? 32 : 14));

// ── Paleta Mexicanometro ──────────────────────────────────────────────────────
const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD  = "#F8BE17";
const BURLY = "#DEB887";

// ── Orden de categorías ───────────────────────────────────────────────────────
const CATEGORY_ORDER = [
  "Primeros Pasos",
  "Racha Diaria",
  "Colecciones",
  "Nivel Experto",
  "Combos",
  "Perfección",
  "Por Categoría",
  "Social",
];

export default function AchievementsScreen() {
  const { userId } = useAuth();
  const [claimedIds, setClaimedIds] = useState(new Set());
  const [claiming, setClaiming] = useState(null);

  const updateCurrency = useMutation(api.users.updateUserCurrency);

  // ── Real user data from Convex ──────────────────────────────────────────────
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const collections = useQuery(
    api.collectionsQuery.getCollectionsWithProgress,
    userId ? { userId } : "skip"
  );

  // ── Coin animation ─────────────────────────────────────────────────────────
  const topBarRef = useRef(null);
  const buttonRefs = useRef({});
  const glowAnims = useRef({});
  const checkScales = useRef({});
  const { flyCoins, particles, triggerCoinFly, onCoinArrived } = useCoinFly();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setClaimedIds(new Set(JSON.parse(val)));
    });
  }, []);

  // ── Compute achievements from real user data ────────────────────────────────
  const achievementsData = useMemo(() => {
    const tacos       = user?.tacos ?? 0;
    const streak      = Math.max(user?.playStreakMax ?? 0, user?.playStreak ?? 0);
    const bestCombo   = user?.bestCombo ?? 0;
    const currentLvl  = user?.currentLevel ?? 1;
    const perfectLvls = user?.perfectLevels ?? 0;

    // Collections: count fully-completed categories and total solved words
    const completedCats = (collections ?? []).filter(
      (c) => c.total > 0 && c.completed >= c.total
    ).length;
    const comidaDone   = (collections ?? []).find((c) => c.name === "Comida")?.completed ?? 0;
    const comidaTotal  = (collections ?? []).find((c) => c.name === "Comida")?.total ?? 1;
    const musicaDone   = (collections ?? []).find((c) => c.name === "Música")?.completed ?? 0;
    const musicaTotal  = (collections ?? []).find((c) => c.name === "Música")?.total ?? 1;
    const historiaDone = (collections ?? []).find((c) => c.name === "Historia")?.completed ?? 0;
    const historiaTotal= (collections ?? []).find((c) => c.name === "Historia")?.total ?? 1;

    const mk = (current, target) => ({
      current: Math.min(current, target),
      target,
      completed: current >= target,
    });

    return [
      // ── PRIMEROS PASOS ────────────────────────────────────────────────────
      {
        id: "primer_taco",
        category: "Primeros Pasos",
        icon: "🌮",
        name: "¡Órale, ándale!",
        description: "Resuelve tu primera palabra mexicana",
        ...mk(tacos, 1),
        reward: { coins: 25, diamonds: 0 },
      },
      {
        id: "diez_palabras",
        category: "Primeros Pasos",
        icon: "🌶️",
        name: "Ya va picando",
        description: "Resuelve 10 palabras",
        ...mk(tacos, 10),
        reward: { coins: 50, diamonds: 0 },
      },
      {
        id: "cincuenta_palabras",
        category: "Primeros Pasos",
        icon: "🏙️",
        name: "Chilango de corazón",
        description: "Resuelve 50 palabras",
        ...mk(tacos, 50),
        reward: { coins: 150, diamonds: 1 },
      },
      {
        id: "cien_palabras",
        category: "Primeros Pasos",
        icon: "🦅",
        name: "Mero mero mexicano",
        description: "Resuelve 100 palabras",
        ...mk(tacos, 100),
        reward: { coins: 300, diamonds: 2 },
      },
      {
        id: "doscientas_palabras",
        category: "Primeros Pasos",
        icon: "🇲🇽",
        name: "Neta del mexica",
        description: "Resuelve 200 palabras mexicanas",
        ...mk(tacos, 200),
        reward: { coins: 500, diamonds: 4 },
      },
      // ── RACHA DIARIA ──────────────────────────────────────────────────────
      {
        id: "racha_3",
        category: "Racha Diaria",
        icon: "🌅",
        name: "Madrugador",
        description: "Juega 3 días seguidos",
        ...mk(streak, 3),
        reward: { coins: 75, diamonds: 1 },
      },
      {
        id: "racha_7",
        category: "Racha Diaria",
        icon: "🔥",
        name: "¡Ni pa' qué parar!",
        description: "Juega 7 días seguidos",
        ...mk(streak, 7),
        reward: { coins: 200, diamonds: 2 },
      },
      {
        id: "racha_14",
        category: "Racha Diaria",
        icon: "🌵",
        name: "¡Más duro que un nopal!",
        description: "Juega 14 días seguidos",
        ...mk(streak, 14),
        reward: { coins: 350, diamonds: 3 },
      },
      {
        id: "racha_30",
        category: "Racha Diaria",
        icon: "🦎",
        name: "Constante como el ajolote",
        description: "Juega 30 días seguidos",
        ...mk(streak, 30),
        reward: { coins: 500, diamonds: 5 },
      },
      // ── COLECCIONES ───────────────────────────────────────────────────────
      {
        id: "primera_coleccion",
        category: "Colecciones",
        icon: "🏆",
        name: "Echado pa' lante",
        description: "Completa tu primera colección del álbum",
        ...mk(completedCats, 1),
        reward: { coins: 200, diamonds: 2 },
      },
      {
        id: "cincuenta_cartas",
        category: "Colecciones",
        icon: "🃏",
        name: "El rey del álbum",
        description: "Desbloquea 50 cartas en la colección",
        ...mk(tacos, 50),
        reward: { coins: 400, diamonds: 3 },
      },
      {
        id: "cien_cartas",
        category: "Colecciones",
        icon: "🎴",
        name: "El rey del mazo",
        description: "Desbloquea 100 cartas de colección",
        ...mk(tacos, 100),
        reward: { coins: 600, diamonds: 5 },
      },
      {
        id: "cinco_colecciones",
        category: "Colecciones",
        icon: "📚",
        name: "Catálogo de lo bueno",
        description: "Completa 5 colecciones del álbum",
        ...mk(completedCats, 5),
        reward: { coins: 500, diamonds: 5 },
      },
      // ── NIVEL EXPERTO ─────────────────────────────────────────────────────
      {
        id: "nivel_perfecto",
        category: "Nivel Experto",
        icon: "🫕",
        name: "¡Le atinaste al mole!",
        description: "Completa 1 nivel sin cometer errores",
        ...mk(perfectLvls, 1),
        reward: { coins: 150, diamonds: 2 },
      },
      {
        id: "nivel_50",
        category: "Nivel Experto",
        icon: "⭐",
        name: "De pelos el dato",
        description: "Llega al nivel 50",
        ...mk(currentLvl, 50),
        reward: { coins: 600, diamonds: 5 },
      },
      {
        id: "nivel_100",
        category: "Nivel Experto",
        icon: "🗿",
        name: "El gran mexica",
        description: "Llega al nivel 100",
        ...mk(currentLvl, 100),
        reward: { coins: 1000, diamonds: 10 },
      },
      // ── COMBOS ────────────────────────────────────────────────────────────
      {
        id: "combo_3",
        category: "Combos",
        icon: "🌶️",
        name: "¡Picoso!",
        description: "Logra un combo de 3 respuestas perfectas",
        ...mk(bestCombo, 3),
        reward: { coins: 75, diamonds: 1 },
      },
      {
        id: "combo_5",
        category: "Combos",
        icon: "⚡",
        name: "¡Que se las dan todas!",
        description: "Logra un combo de 5 respuestas perfectas",
        ...mk(bestCombo, 5),
        reward: { coins: 200, diamonds: 2 },
      },
      {
        id: "combo_10",
        category: "Combos",
        icon: "💥",
        name: "¡Chingón total!",
        description: "Logra un combo de 10 respuestas perfectas",
        ...mk(bestCombo, 10),
        reward: { coins: 400, diamonds: 4 },
      },
      // ── PERFECCIÓN ────────────────────────────────────────────────────────
      {
        id: "tres_perfectos",
        category: "Perfección",
        icon: "🎯",
        name: "Tres al hilo sin falla",
        description: "Completa 3 niveles sin cometer errores",
        ...mk(perfectLvls, 3),
        reward: { coins: 250, diamonds: 3 },
      },
      {
        id: "diez_perfectos",
        category: "Perfección",
        icon: "🏹",
        name: "Puntería de charro",
        description: "Completa 10 niveles sin cometer errores",
        ...mk(perfectLvls, 10),
        reward: { coins: 700, diamonds: 6 },
      },
      // ── POR CATEGORÍA ─────────────────────────────────────────────────────
      {
        id: "foodie_mx",
        category: "Por Categoría",
        icon: "🌮",
        name: "Al pastor, como siempre",
        description: "Completa la colección de Comida",
        current: comidaDone,
        target: comidaTotal,
        completed: comidaTotal > 0 && comidaDone >= comidaTotal,
        reward: { coins: 120, diamonds: 1 },
      },
      {
        id: "mariachi_fan",
        category: "Por Categoría",
        icon: "🎺",
        name: "Corazón de mariachi",
        description: "Completa la colección de Música",
        current: musicaDone,
        target: musicaTotal,
        completed: musicaTotal > 0 && musicaDone >= musicaTotal,
        reward: { coins: 120, diamonds: 1 },
      },
      {
        id: "historia_viva",
        category: "Por Categoría",
        icon: "📜",
        name: "Historia viva",
        description: "Completa la colección de Historia",
        current: historiaDone,
        target: historiaTotal,
        completed: historiaTotal > 0 && historiaDone >= historiaTotal,
        reward: { coins: 150, diamonds: 1 },
      },
      // ── SOCIAL ────────────────────────────────────────────────────────────
      {
        id: "invitar_3",
        category: "Social",
        icon: "📢",
        name: "De boca en boca",
        description: "Invita a 3 cuates a jugar",
        current: 0, target: 3, completed: false,
        reward: { coins: 200, diamonds: 2 },
      },
      {
        id: "invitar_10",
        category: "Social",
        icon: "👥",
        name: "Jalando parejo",
        description: "Invita a 10 cuates a jugar",
        current: 0, target: 10, completed: false,
        reward: { coins: 500, diamonds: 5 },
      },
    ];
  }, [user, collections]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const triggerBadgeAnimations = (achievementId) => {
    // Glow flash on icon circle
    if (!glowAnims.current[achievementId]) {
      glowAnims.current[achievementId] = new Animated.Value(0);
    }
    const glow = glowAnims.current[achievementId];
    glow.setValue(0);
    Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 500, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Check badge spring-in
    if (!checkScales.current[achievementId]) {
      checkScales.current[achievementId] = new Animated.Value(0);
    }
    const check = checkScales.current[achievementId];
    check.setValue(0);
    Animated.spring(check, {
      toValue: 1,
      friction: 4,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  // Fallback target: calculate coin pill position from screen constants
  const getFallbackTarget = () => {
    const sw = width;
    const sh = height;
    const topPad = Platform.OS === "ios" ? sh * 0.058 : sh * 0.04;
    const pillH = sw * 0.075;
    // Coin pill is the last element on the right, after diamonds pill + gap
    const pillW = sw * 0.22;
    const pillX = sw - sw * 0.03 - pillW;
    return { x: pillX, y: topPad, w: pillW, h: pillH };
  };

  const handleClaimAchievement = async (achievement) => {
    if (!userId || claimedIds.has(achievement.id) || claiming) return;
    setClaiming(achievement.id);

    // ── Measure source (button) ────────────────────────────────────────────
    const btnRef = buttonRefs.current[achievement.id];
    let sourcePos = null;
    if (btnRef) {
      await new Promise((resolve) => {
        let done = false;
        btnRef.measureInWindow((x, y, w, h) => {
          done = true;
          sourcePos = { x: x + w / 2, y: y + h / 2 };
          resolve();
        });
        setTimeout(() => { if (!done) resolve(); }, 300);
      });
    }

    // ── Measure target (coin pill) with fallback ──────────────────────────
    let measured = await topBarRef.current?.measureCoinPill();
    const targetPos = (measured && measured.h > 0) ? measured : getFallbackTarget();

    // Fallback source: center of screen if button measurement failed
    if (!sourcePos) {
      sourcePos = { x: width / 2, y: height * 0.6 };
    }

    // ── Launch coin animation immediately (don't await backend) ───────────
    triggerCoinFly({
      fromX: sourcePos.x,
      fromY: sourcePos.y,
      toX: targetPos.x + targetPos.w / 2,
      toY: targetPos.y + targetPos.h / 2,
      coins: achievement.reward.coins || 25,
      onAllArrived: () => topBarRef.current?.triggerBounce(),
    });

    try {
      await updateCurrency({
        userId,
        coins: achievement.reward.coins || 0,
        diamonds: achievement.reward.diamonds > 0 ? achievement.reward.diamonds : undefined,
      });
      const next = new Set(claimedIds);
      next.add(achievement.id);
      setClaimedIds(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      comboBurst(5);
      triggerBadgeAnimations(achievement.id);
    } catch (e) {
      // Animation already played; silently ignore backend error
    } finally {
      setClaiming(null);
    }
  };

  // ── Render de tarjeta ──────────────────────────────────────────────────────

  const renderAchievement = (achievement) => {
    const isClaimed   = claimedIds.has(achievement.id) || achievement.claimed;
    const isCompleted = achievement.completed;
    const pct         = Math.min((achievement.current / achievement.target) * 100, 100);
    const IconComponent = ACHIEVEMENT_ICONS[achievement.id];

    // Lazy-init animated values for this achievement
    if (!glowAnims.current[achievement.id]) {
      glowAnims.current[achievement.id] = new Animated.Value(0);
    }
    if (!checkScales.current[achievement.id]) {
      checkScales.current[achievement.id] = new Animated.Value(isClaimed ? 1 : 0);
    }
    const glowAnim = glowAnims.current[achievement.id];
    const checkScale = checkScales.current[achievement.id];

    const renderStatus = () => {
      if (isClaimed) {
        return (
          <View style={styles.statusContainer}>
            <Animated.View style={[styles.claimedPill, { transform: [{ scale: checkScale }] }]}>
              <Text style={styles.claimedPillText}>✓ Reclamado</Text>
            </Animated.View>
          </View>
        );
      }
      if (isCompleted) {
        return (
          <View style={styles.statusContainer}>
            <TouchableOpacity
              ref={(r) => { buttonRefs.current[achievement.id] = r; }}
              style={[styles.claimBtn, claiming === achievement.id && styles.claimBtnDisabled]}
              onPress={() => handleClaimAchievement(achievement)}
              disabled={!!claiming}
              activeOpacity={0.8}
            >
              <Text style={styles.claimBtnText}>
                {claiming === achievement.id ? "..." : "Reclamar"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={styles.statusContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressFraction}>
            {achievement.current}/{achievement.target}
          </Text>
        </View>
      );
    };

    const isLocked = !isCompleted && !isClaimed;

    return (
      <View
        key={achievement.id}
        style={[styles.card, isLocked && styles.cardLocked]}
      >
        {/* Ícono */}
        <View style={styles.iconCircle}>
          {IconComponent
            ? <IconComponent size={width * 0.075} />
            : <Text style={styles.iconEmoji}>{achievement.icon ?? "🏆"}</Text>
          }
          {/* Gold glow overlay on claim */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: 999, backgroundColor: GOLD, opacity: glowAnim },
            ]}
          />
        </View>

        {/* Contenido */}
        <View style={styles.cardContent}>
          <Text style={[styles.achievementName, isLocked && styles.achievementNameLocked]}>
            {achievement.name}
          </Text>
          <Text style={[styles.achievementDesc, isLocked && styles.achievementDescLocked]}>
            {achievement.description}
          </Text>
          <View style={styles.rewardRow}>
            {achievement.reward.coins > 0 && (
              <View style={styles.rewardPill}>
                <Text style={styles.rewardPillText}>🪙 {achievement.reward.coins}</Text>
              </View>
            )}
            {achievement.reward.diamonds > 0 && (
              <View style={styles.rewardPill}>
                <Text style={styles.rewardPillText}>💎 {achievement.reward.diamonds}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Estado */}
        {renderStatus()}
      </View>
    );
  };

  // ── Agrupado por categoría ─────────────────────────────────────────────────

  const grouped = {};
  achievementsData.forEach((a) => {
    const cat = a.category || "Otros";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  });

  return (
    <ImageBackground
      source={require("../../assets/images/bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <TopBar ref={topBarRef} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🏆</Text>
          <Text style={styles.headerTitle}>LOGROS</Text>
          <Text style={styles.headerSubtitle}>
            {claimedIds.size} / {achievementsData.length} reclamados
          </Text>
        </View>

        {/* Categorías */}
        {CATEGORY_ORDER.map((cat) => {
          if (!grouped[cat]) return null;
          return (
            <View key={cat}>
              <Text style={styles.categoryHeader}>{cat.toUpperCase()}</Text>
              {grouped[cat].map(renderAchievement)}
            </View>
          );
        })}
      </ScrollView>

      <AdBanner style={{ marginVertical: 4 }} />

      {/* Coin fly animation overlay — rendered above everything */}
      <CoinFlyOverlay
        coins={flyCoins}
        particles={particles}
        onCoinArrived={onCoinArrived}
      />
    </ImageBackground>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.06,
  },

  // ── Header ──
  header: {
    alignItems: "center",
    marginTop: HEADER_TOP,
    marginBottom: height * 0.005,
    backgroundColor: "#FFE4B5",
    marginHorizontal: width * 0.02,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#D2691E55",
  },
  headerEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.065,
    color: BROWN,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: width * 0.035,
    color: AMBER,
    marginTop: 4,
  },

  // ── Category header ──
  categoryHeader: {
    fontFamily: FONTS.display,
    fontSize: 13,
    color: BROWN,
    letterSpacing: 1.8,
    marginTop: 22,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#D2691E55",
  },

  // ── Card ──
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5DEB3",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D2A679",
    padding: 12,
    marginBottom: 10,
  },
  cardLocked: {
    backgroundColor: "#E8C99A",
    borderColor: "#C4A882",
    opacity: 0.82,
  },

  // ── Icon ──
  iconCircle: {
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: width * 0.065,
    backgroundColor: "#FFE4B5",
    borderWidth: 2,
    borderColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: width * 0.07,
  },

  // ── Card content ──
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  achievementName: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.038,
    color: BROWN,
    marginBottom: 2,
  },
  achievementNameLocked: {
    color: "#A0714F",
  },
  achievementDesc: {
    fontFamily: FONTS.body,
    fontSize: width * 0.032,
    color: "#7A4020",
    marginBottom: 6,
  },
  achievementDescLocked: {
    color: "#B08050",
  },
  rewardRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
  },
  rewardPill: {
    backgroundColor: "rgba(210,105,30,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(210,105,30,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rewardPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.028,
    color: BROWN,
  },

  // ── Status ──
  statusContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    flexShrink: 0,
  },

  // Progreso (en curso)
  progressBarBg: {
    width: "100%",
    height: 7,
    backgroundColor: BURLY,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 5,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: AMBER,
    borderRadius: 4,
  },
  progressFraction: {
    fontFamily: FONTS.display,
    fontSize: width * 0.029,
    color: BROWN,
  },

  // Botón Reclamar
  claimBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#C8950A",
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center",
    width: "100%",
  },
  claimBtnDisabled: {
    backgroundColor: BURLY,
    borderColor: "#C4A882",
  },
  claimBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.031,
    color: "#523600",
  },

  // Reclamado — compact inline pill
  claimedPill: {
    backgroundColor: "rgba(39,174,96,0.15)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(39,174,96,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    width: "100%",
  },
  claimedPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.028,
    color: "#27AE60",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
