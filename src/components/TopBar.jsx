import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
  useSharedValue,
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
// ShopScreen loaded on-demand to break the TopBar ↔ ShopScreen circular dep
let _ShopScreen = null;
const getShopScreen = () => {
  if (!_ShopScreen) _ShopScreen = require("../screens/ShopScreen").default;
  return _ShopScreen;
};
import CuatesModal from "./CuatesModal";
import FriendsModal from "./FriendsModal";
import { tapMedium, comboBurst } from "../services/haptics";
import { playSound } from "../utils/soundManager";
import useDevMode from "../hooks/useDevMode";

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

const TopBar = forwardRef(function TopBar({ navigation, showHomeButton = false }, ref) {
  const coinPillRef    = useRef(null);
  const diamondPillRef = useRef(null);
  const bounceScale    = useSharedValue(1);

  // ── Animaciones de botones izquierdos ────────────────────────────────────
  const settingsScale  = useSharedValue(1);
  const settingsRotate = useSharedValue(0);
  const cuatesScale    = useSharedValue(1);
  const tacosScale     = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    measureCoinPill: () => {
      if (!coinPillRef.current) return Promise.resolve(null);
      return new Promise((resolve) => {
        let settled = false;
        coinPillRef.current.measureInWindow((x, y, w, h) => {
          settled = true;
          resolve(h > 0 ? { x, y, w, h } : null);
        });
        setTimeout(() => { if (!settled) resolve(null); }, 300);
      });
    },
    measureDiamondPill: () => {
      if (!diamondPillRef.current) return Promise.resolve(null);
      return new Promise((resolve) => {
        let settled = false;
        diamondPillRef.current.measureInWindow((x, y, w, h) => {
          settled = true;
          resolve(h > 0 ? { x, y, w, h } : null);
        });
        setTimeout(() => { if (!settled) resolve(null); }, 300);
      });
    },
    triggerBounce: () => {
      bounceScale.value = withSequence(
        withTiming(1.28, { duration: 80, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 4, stiffness: 260 })
      );
    },
  }));
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
  const [showShop, setShowShop] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showFriends,       setShowFriends]       = useState(false);
  const [showCuates,        setShowCuates]        = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  const { user, userId } = useAuth();

  // Solicitudes de amistad pendientes → badge en botón de cuates
  const isLinked = !!(user?.email || user?.googleId || user?.appleId);
  const pendingRequests = useQuery(
    api.friends.getPendingRequests,
    isLinked && userId ? { userId } : "skip"
  );
  const pendingCount = pendingRequests?.length ?? 0;

  // Retos pendientes de cuates → badge extra
  const pendingChallenges = useQuery(
    api.friends.getMyPendingChallenges,
    isLinked && userId ? { userId } : "skip"
  );
  const challengeCount = pendingChallenges?.length ?? 0;
  const totalBadge = pendingCount + challengeCount;

  // Notificaciones de cuates no leídas (aceptaciones, nuevas solicitudes)
  const unreadNotifs = useQuery(
    api.friends.getUnreadFriendNotifications,
    isLinked && userId ? { userId } : "skip"
  );
  const markRead = useMutation(api.friends.markFriendNotificationsRead);
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
    if (showHomeButton && navigation) {
      navigation.navigate("Main");
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
              onLongPress={handleDevToggle}
              delayLongPress={1000}
            >
              <Ionicons
                name={showHomeButton ? "home" : "settings"}
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
            <TouchableOpacity style={styles.pill} onPress={() => { tapMedium(); setShowShop(true); }}>
              <Image source={require("../../assets/icons/plus.png")} style={styles.plusIcon} />
              <Text style={styles.pillText}>{fmt(user?.diamonds || 0)}</Text>
              <Image source={require("../../assets/icons/diamond.png")} style={styles.pillIcon} />
            </TouchableOpacity>
          </View>

          {/* Coins — outer View for reliable measureInWindow, inner Reanimated.View for bounce */}
          <View ref={coinPillRef} collapsable={false}>
            <Reanimated.View style={coinPillAnimStyle}>
              <TouchableOpacity style={styles.pill} onPress={() => { tapMedium(); setShowShop(true); }}>
                <Image source={require("../../assets/icons/plus.png")} style={styles.plusIcon} />
                <Text style={styles.pillText}>{fmt(user?.coins || 0)}</Text>
                <Image source={require("../../assets/icons/coin.png")} style={styles.pillIcon} />
              </TouchableOpacity>
            </Reanimated.View>
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
      {showShop && (() => { const ShopScreen = getShopScreen(); return <ShopScreen visible={showShop} onClose={() => setShowShop(false)} />; })()}
      <StreakModal visible={showStreak} onClose={() => setShowStreak(false)} />
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
});

export default TopBar;

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
