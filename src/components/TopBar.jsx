import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { NavigationContext, NavigationRouteContext } from "@react-navigation/native";
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Calificar from "./Calificar";
import PrivacyModal from "./PrivacyModal";
import SettingsModal from "./SettingsModal";
import SupportModal from "./SupportModal";

import Apoyar from "./Apoyar";
import Invitar from "./Invitar";
import Mexicanometro from "./Mexicanometro";
import Perfil from "./Perfil";
import PolíticadePrivacidad from "./PoliticadePrivacidad";
import StreakBadge from "./StreakBadge";
import StreakModal from "./StreakModal";
import Terminosdeservio from "./Terminosdeservio";
import CuatesModal from "./CuatesModal";
import FriendsModal from "./FriendsModal";
import { goHome } from "./HomeButton";
import { tapMedium, comboBurst } from "../services/haptics";
import { playSound } from "../utils/soundManager";
import useDevMode from "../hooks/useDevMode";
import useIsFocusedSafe from "../hooks/useIsFocusedSafe";
import { useShop } from "../context/ShopContext";
import { useUserMutation } from "../hooks/useUserMutation";
import useRollingCounter from "../hooks/useRollingCounter";

// ProfileScreen loaded on-demand (same pattern as ShopScreen)
let _ProfileScreen = null;
const getProfileScreen = () => {
  if (!_ProfileScreen) _ProfileScreen = require("../screens/ProfileScreen").default;
  return _ProfileScreen;
};

const { width, height } = Dimensions.get("window");

// ── Responsive sizing: todo relativo a width ────────────────────────────────
const S = {
  // Safe area top (notch / status bar).
  // In iPad landscape the patched height is ~384px → height*0.058 ≈ 22px which is
  // too close to the system status bar. Clamp to a minimum of 32px on iOS.
  topPad: Platform.OS === "ios" ? Math.max(32, height * 0.058) : Math.max(20, height * 0.04),
  barH: width * 0.025,           // vertical padding inside bar
  padH: width * 0.03,            // horizontal padding
  gap: width * 0.018,            // gap between elements
  // Circle button (same dimensions as pill — kept for reference, style uses pill values)
  circle: width * 0.082,
  circleRad: width * 0.041,
  circleIconPad: width * 0.016,
  // Pill
  pillH: width * 0.075,
  pillPadH: width * 0.018,
  pillRad: width * 0.038,
  pillBorder: 1.5,
  pillIcon: width * 0.04,
  pillPlus: width * 0.028,
  pillFont: width * 0.031,
  // Taco pill (same shape)
  tacoIcon: width * 0.042,
};

// Alto real de la barra (desde el borde superior de la pantalla). Las pantallas que
// dibujan debajo la usan para no dejar huecos ni encimarse.
export const TOP_BAR_HEIGHT = Math.ceil(S.topPad + S.pillH + S.barH);

// "+N" que aparece bajo el pill mientras las monedas/diamantes van llegando
function GainLabel({ gain, color }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  useEffect(() => {
    if (!gain) return;
    if (!gain.done) {
      opacity.value = withTiming(1, { duration: 160 });
      translateY.value = withSpring(0, { damping: 8, stiffness: 220 });
    } else {
      opacity.value = withDelay(350, withTiming(0, { duration: 380 }));
      translateY.value = withDelay(350, withTiming(-12, { duration: 380 }));
    }
  }, [gain?.key, gain?.done]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!gain) return null;
  return (
    <Reanimated.Text pointerEvents="none" style={[styles.gainLabel, { color }, animStyle]}>
      {gain.text}
    </Reanimated.Text>
  );
}

/**
 * Botón izquierdo: en la pantalla de inicio abre Ajustes; en cualquier otra
 * sección es la casita para volver al inicio. `showHomeButton` lo fuerza.
 * @param {{ navigation?: any, showHomeButton?: boolean }} props
 * @param {React.ForwardedRef<any>} ref
 */
function TopBar({ navigation: navigationProp, showHomeButton }, ref) {
  // Si la pantalla no la pasa, usar la navegación de la pantalla donde está la barra
  // (FriendsModal la necesita para abrir el juego al retar o aceptar un reto).
  const screenNavigation = useContext(NavigationContext);
  const navigation = navigationProp ?? screenNavigation;
  const route = useContext(NavigationRouteContext);
  const showHome = showHomeButton ?? (!!route && route.name !== "Home");
  const coinPillRef    = useRef(null);
  const diamondPillRef = useRef(null);
  const bounceScale    = useSharedValue(1);
  const diamondScale   = useSharedValue(1);
  const reduceMotion   = useReducedMotion();
  const [coinGain, setCoinGain]       = useState(null);
  const [diamondGain, setDiamondGain] = useState(null);

  // ── Animaciones de botones izquierdos ────────────────────────────────────
  const settingsScale  = useSharedValue(1);
  const settingsRotate = useSharedValue(0);
  const cuatesScale    = useSharedValue(1);
  const tacosScale     = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    measureCoinPill: () => measurePill(coinPillRef),
    measureDiamondPill: () => measurePill(diamondPillRef),
    triggerBounce: () => bigBounce(bounceScale),

    // ── Contador sincronizado con el vuelo de monedas ──
    // holdCoins(total) → id; revealCoins(id, fraction) por cada moneda que llega;
    // releaseCoins(id) al final (rebote grande + el "+N" se desvanece).
    holdCoins: (total, opts) => {
      const id = coinCounter.hold(total, opts);
      if (id) setCoinGain({ key: id, text: `+${Math.round(total)}`, done: false });
      return id;
    },
    revealCoins: (id, fraction) => {
      coinCounter.reveal(id, fraction);
      smallBump(bounceScale);
    },
    releaseCoins: (id) => {
      coinCounter.release(id);
      bigBounce(bounceScale);
      setCoinGain((g) => (g && g.key === id ? { ...g, done: true } : g));
    },
    holdDiamonds,
    revealDiamonds,
    releaseDiamonds,
  }));

  function measurePill(pillRef) {
    if (!pillRef.current) return Promise.resolve(null);
    return new Promise((resolve) => {
      let settled = false;
      pillRef.current.measureInWindow((x, y, w, h) => {
        settled = true;
        resolve(h > 0 ? { x, y, w, h } : null);
      });
      setTimeout(() => { if (!settled) resolve(null); }, 300);
    });
  }

  function holdDiamonds(total, opts) {
    const id = diamondCounter.hold(total, opts);
    if (id) setDiamondGain({ key: id, text: `+${Math.round(total)}`, done: false });
    return id;
  }

  function revealDiamonds(id, fraction) {
    diamondCounter.reveal(id, fraction);
    smallBump(diamondScale);
  }

  function releaseDiamonds(id) {
    diamondCounter.release(id);
    bigBounce(diamondScale);
    setDiamondGain((g) => (g && g.key === id ? { ...g, done: true } : g));
  }

  function bigBounce(sv) {
    if (reduceMotion) return;
    sv.value = withSequence(
      withTiming(1.28, { duration: 80, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 4, stiffness: 260 })
    );
  }

  function smallBump(sv) {
    if (reduceMotion) return;
    sv.value = withSequence(
      withTiming(1.12, { duration: 45, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) })
    );
  }
  const [showSettings, setShowSettings] = useState(false);

  const [showInvitar, setShowInvitar] = useState(false);
  const [showApoyar, setShowApoyar] = useState(false);
  const [showCalificar, setShowCalificar] = useState(false);
  const [showPolíticadePrivacidad, setShowPolíticadePrivacidad] =
    useState(false);
  const [showTerminosdeservio, setShowTerminosdeservio] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const [showMexicanario, setShowMexicanario] = useState(false);
  const { openShop } = useShop();
  const [showStreak, setShowStreak] = useState(false);
  const [showFriends,       setShowFriends]       = useState(false);
  const [showCuates,        setShowCuates]        = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  const { user, userId } = useAuth();
  const coinCounter    = useRollingCounter(user?.coins || 0, { ready: !!user, reduceMotion });
  const diamondCounter = useRollingCounter(user?.diamonds || 0, { ready: !!user, reduceMotion });
  const isFocused = useIsFocusedSafe();

  // Un solo resumen reactivo alimenta badge y avisos de cuates.
  const isLinked = !!(user?.email || user?.hasEmail || user?.googleId || user?.appleId);
  const socialSummary = useQuery(
    api.friends.getTopBarSocialSummary,
    isFocused && isLinked && userId ? { userId } : "skip"
  );
  const pendingCount = socialSummary?.pendingRequestCount ?? 0;
  const challengeCount = socialSummary?.pendingChallengeCount ?? 0;
  const totalBadge = pendingCount + challengeCount;

  const unreadNotifs = socialSummary?.unreadNotifications;
  const markRead = useUserMutation(api.friends.markFriendNotificationsRead);
  const shownNotifsRef = useRef(new Set());

  useEffect(() => {
    if (!unreadNotifs || unreadNotifs.length === 0 || !userId) return;
    // Only show alerts for notifications we haven't shown yet in this session
    const newNotifs = unreadNotifs.filter((n) => !shownNotifsRef.current.has(n._id));
    if (newNotifs.length === 0) return;

    newNotifs.forEach((n) => shownNotifsRef.current.add(n._id));

    // Build a summary message
    const accepted = newNotifs.filter((n) => n.type === "accepted");
    const requests = newNotifs.filter((n) => n.type === "request");

    if (accepted.length > 0) {
      const names = accepted.map((n) => n.fromUsername ? `@${n.fromUsername}` : n.fromName).join(", ");
      Alert.alert("¡Ya son cuates! 🤝", `${names} aceptó tu solicitud de amistad.`);
    }
    if (requests.length > 0) {
      const names = requests.map((n) => n.fromUsername ? `@${n.fromUsername}` : n.fromName).join(", ");
      Alert.alert(
        "Nueva solicitud 📩",
        `${names} quiere ser tu cuate.`,
        [
          { text: "Ver después", style: "cancel" },
          { text: "Ver solicitudes", onPress: () => setShowFriends(true) },
        ]
      );
    }

    // Mark all as read
    markRead({ userId }).catch(() => {});
  }, [unreadNotifs]);

  const devEnabled = useDevMode((s) => s.enabled);
  const devToggle  = useDevMode((s) => s.toggle);
  const [devToast, setDevToast] = useState(null);
  const devToastTimer = React.useRef(null);

  const handleDevToggle = () => {
    devToggle();
    comboBurst(devEnabled ? 3 : 8);
    const msg = devEnabled ? "🔧 Modo Dev OFF" : "🔧 Modo Dev ON";
    setDevToast(msg);
    clearTimeout(devToastTimer.current);
    devToastTimer.current = setTimeout(() => setDevToast(null), 2200);
  };

  const coinPillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounceScale.value }],
  }));
  const diamondPillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: diamondScale.value }],
  }));

  const settingsAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: settingsScale.value },
      { rotate: `${settingsRotate.value}deg` },
    ],
  }));
  const cuatesAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cuatesScale.value }],
  }));
  const tacosAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tacosScale.value }],
  }));

  function animateSettings() {
    playSound("click");
    settingsRotate.value = withTiming(settingsRotate.value + 180, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    settingsScale.value = withSequence(
      withTiming(1.22, { duration: 80, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 4, stiffness: 280 })
    );
  }

  function animateCuates() {
    playSound("click");
    cuatesScale.value = withSequence(
      withTiming(1.3, { duration: 70, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 3, stiffness: 260 })
    );
  }

  function animateTacos() {
    playSound("click");
    tacosScale.value = withSequence(
      withTiming(1.25, { duration: 70, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 4, stiffness: 270 })
    );
  }

  const fmt = (num) => {
    if (num === undefined || num === null) return "0";
    if (num >= 100000) return Math.round(num / 1000) + "k";
    return num.toString();
  };

  const handleLeftButtonPress = () => {
    tapMedium();
    animateSettings();
    if (showHome && navigation) {
      goHome(navigation);
    } else {
      setShowSettings(true);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* ── LEFT ── */}
        <View style={styles.row}>
          {/* Settings / Home — long press (2s) = toggle dev mode */}
          <Reanimated.View style={settingsAnimStyle}>
            <TouchableOpacity
              style={[styles.circleBtn, devEnabled && styles.circleBtnDev]}
              onPress={handleLeftButtonPress}
              accessibilityRole="button"
              accessibilityLabel={showHome ? "Ir al inicio" : "Ajustes"}
              onLongPress={handleDevToggle}
              delayLongPress={1000}
            >
              <Ionicons
                name={showHome ? "home" : "settings"}
                size={20}
                color={devEnabled ? "#fff" : "#C47A3A"}
              />
              {devEnabled && (
                <View style={styles.devBadge}>
                  <Text style={styles.devBadgeText}>DEV</Text>
                </View>
              )}
            </TouchableOpacity>
          </Reanimated.View>

          {/* Cuates — siempre visible; abre FriendsModal si tiene cuenta vinculada */}
          <Reanimated.View style={cuatesAnimStyle}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => {
                tapMedium();
                animateCuates();
                if (isLinked) setShowFriends(true);
                else setShowCuates(true);
              }}
            >
              <Ionicons name="people" size={18} color="#C47A3A" />
              {totalBadge > 0 && (
                <View style={[styles.cuatesBadge, challengeCount > 0 && { backgroundColor: "#E74C3C" }]}>
                  <Text style={styles.cuatesBadgeText}>{totalBadge > 9 ? "9+" : totalBadge}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Reanimated.View>

          {/* Streak */}
          <StreakBadge onPress={() => setShowStreak(true)} />

          {/* Tacos */}
          <Reanimated.View style={tacosAnimStyle}>
            <TouchableOpacity style={styles.pill} onPress={() => { tapMedium(); animateTacos(); setShowMexicanario(true); }}>
              <Text style={styles.pillText}>{fmt(user?.tacos || 0)}</Text>
              <Image source={require("../../assets/images/bis.png")} style={styles.tacoIcon} />
            </TouchableOpacity>
          </Reanimated.View>
        </View>

        {/* ── RIGHT ── */}
        <View style={styles.row}>
          {/* Diamonds */}
          <View ref={diamondPillRef} collapsable={false}>
            <Reanimated.View style={diamondPillAnimStyle}>
              <TouchableOpacity
                style={[styles.pill, diamondCounter.counting && styles.pillCounting]}
                onPress={() => { tapMedium(); openShop("diamantes"); }}
              >
                <Image source={require("../../assets/icons/plus.png")} style={styles.plusIcon} />
                <Text style={[styles.pillText, diamondCounter.counting && styles.pillTextCounting]}>{fmt(diamondCounter.value)}</Text>
                <Image source={require("../../assets/icons/diamond.png")} style={styles.pillIcon} />
              </TouchableOpacity>
            </Reanimated.View>
            <GainLabel gain={diamondGain} color="#0D8FB0" />
          </View>

          {/* Coins — outer View for reliable measureInWindow, inner Reanimated.View for bounce */}
          <View ref={coinPillRef} collapsable={false}>
            <Reanimated.View style={coinPillAnimStyle}>
              <TouchableOpacity
                style={[styles.pill, coinCounter.counting && styles.pillCounting]}
                onPress={() => { tapMedium(); openShop("varos"); }}
              >
                <Image source={require("../../assets/icons/plus.png")} style={styles.plusIcon} />
                <Text style={[styles.pillText, coinCounter.counting && styles.pillTextCounting]}>{fmt(coinCounter.value)}</Text>
                <Image source={require("../../assets/icons/coin.png")} style={styles.pillIcon} />
              </TouchableOpacity>
            </Reanimated.View>
            <GainLabel gain={coinGain} color="#B8620E" />
          </View>
        </View>
      </View>

      {/* ── Modals ── */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}

        onInvitar={() => { setShowSettings(false); setShowInvitar(true); }}
        onPolíticadePrivacidad={() => { setShowSettings(false); setShowPolíticadePrivacidad(true); }}
        onTerminosdeservio={() => { setShowSettings(false); setShowTerminosdeservio(true); }}
        onPrivacy={() => { setShowSettings(false); setShowPrivacy(true); }}
        onCalificar={() => { setShowSettings(false); setShowCalificar(true); }}
        onSupport={() => { setShowSettings(false); setShowSupport(true); }}
        onPerfill={() => { setShowSettings(false); setShowPerfil(true); }}
        onApoyar={() => { setShowSettings(false); setShowApoyar(true); }}
      />
      <Perfil visible={showPerfil} onClose={() => setShowPerfil(false)} />
      <Apoyar visible={showApoyar} onClose={() => setShowApoyar(false)} />
      <Invitar visible={showInvitar} onClose={() => setShowInvitar(false)} />
      <Calificar visible={showCalificar} onClose={() => setShowCalificar(false)} />
      <PolíticadePrivacidad visible={showPolíticadePrivacidad} onClose={() => setShowPolíticadePrivacidad(false)} />
      <Terminosdeservio visible={showTerminosdeservio} onClose={() => setShowTerminosdeservio(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <SupportModal visible={showSupport} onClose={() => setShowSupport(false)} />
      <Mexicanometro visible={showMexicanario} onClose={() => setShowMexicanario(false)} />
      <StreakModal
        visible={showStreak}
        onClose={() => setShowStreak(false)}
        diamondSink={{
          measure: () => measurePill(diamondPillRef),
          hold: holdDiamonds,
          reveal: revealDiamonds,
          release: releaseDiamonds,
        }}
      />
      <FriendsModal visible={showFriends} onClose={() => setShowFriends(false)} onOpenProfile={() => { setShowFriends(false); setShowProfileScreen(true); }} navigation={navigation} />
      <CuatesModal  visible={showCuates}  onClose={() => setShowCuates(false)} onOpenProfile={() => { setShowCuates(false); setShowProfileScreen(true); }} />
      {showProfileScreen && (() => { const PS = getProfileScreen(); return <PS visible={showProfileScreen} onClose={() => setShowProfileScreen(false)} />; })()}

      {/* Dev mode toast */}
      {devToast && (
        <View style={styles.devToast} pointerEvents="none">
          <Text style={styles.devToastText}>{devToast}</Text>
        </View>
      )}
    </>
  );
}

const ForwardedTopBar = React.memo(forwardRef(TopBar));

export default ForwardedTopBar;
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: S.padH,
    paddingTop: S.topPad,
    paddingBottom: S.barH,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.gap,
  },

  // ── Circle button (settings / home) — misma altura y estilo que pill ──
  circleBtn: {
    height: S.pillH,
    width: S.pillH,
    borderRadius: S.pillRad,
    backgroundColor: "#E6CCB2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: S.pillBorder,
    borderColor: "rgba(92,58,33,0.25)",
  },
  circleBtnDev: {
    backgroundColor: "#E67E22",
    borderColor: "#c0651a",
  },
  cuatesBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#C0392B",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#E6CCB2",
  },
  cuatesBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 13,
  },
  devBadge: {
    position: "absolute",
    top: -5,
    right: -6,
    backgroundColor: "#c0392b",
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  devBadgeText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  devToast: {
    position: "absolute",
    top: S.topPad + S.pillH + 10,
    alignSelf: "center",
    left: "25%",
    right: "25%",
    backgroundColor: "rgba(40,40,40,0.92)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    zIndex: 9999,
  },
  devToastText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Pill (coins, diamonds, tacos) ──
  pill: {
    flexDirection: "row",
    alignItems: "center",
    height: S.pillH,
    backgroundColor: "#E6CCB2",
    paddingHorizontal: S.pillPadH,
    borderRadius: S.pillRad,
    borderWidth: S.pillBorder,
    borderColor: "rgba(92,58,33,0.25)",
    gap: width * 0.006,
  },
  pillText: {
    color: "#5C3A21",
    fontWeight: "bold",
    fontSize: S.pillFont,
    includeFontPadding: false,
  },
  pillCounting: {
    borderColor: "#F8BE17",
    backgroundColor: "#FFF1C9",
  },
  pillTextCounting: {
    color: "#B8620E",
  },
  gainLabel: {
    position: "absolute",
    top: S.pillH + 2,
    right: S.pillPadH,
    fontSize: S.pillFont * 1.05,
    fontWeight: "900",
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pillIcon: {
    width: S.pillIcon,
    height: S.pillIcon,
    resizeMode: "contain",
  },
  plusIcon: {
    width: S.pillPlus,
    height: S.pillPlus,
    resizeMode: "contain",
    opacity: 0.7,
  },
  tacoIcon: {
    width: S.tacoIcon,
    height: S.tacoIcon,
    resizeMode: "contain",
  },
});
