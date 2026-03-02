import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
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
import { useAuth } from "../context/AuthContext";
import Calificar from "./Calificar";
import DisconnectModal from "./DisconnectModal";
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
import ShopScreen from "../screens/ShopScreen";
import { tapMedium } from "../services/haptics";

const { width, height } = Dimensions.get("window");

// ── Responsive sizing: todo relativo a width ────────────────────────────────
const S = {
  // Safe area top (notch / status bar)
  topPad: Platform.OS === "ios" ? height * 0.058 : height * 0.04,
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
  const coinPillRef = useRef(null);
  const bounceScale = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    measureCoinPill: () => {
      if (!coinPillRef.current) return Promise.resolve(null);
      return new Promise((resolve) => {
        let settled = false;
        coinPillRef.current.measureInWindow((x, y, w, h) => {
          settled = true;
          resolve(h > 0 ? { x, y, w, h } : null);
        });
        // Safety: if callback never fires, resolve null after 300ms
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
  const [showDisconnect, setShowDisconnect] = useState(false);
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

  const { user } = useAuth();

  const coinPillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounceScale.value }],
  }));

  const fmt = (num) => {
    if (num === undefined || num === null) return "0";
    if (num >= 10000) return (num / 1000).toFixed(0) + "k";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const handleLeftButtonPress = () => {
    tapMedium();
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
          {/* Settings / Home */}
          <TouchableOpacity style={styles.circleBtn} onPress={handleLeftButtonPress}>
            <Ionicons
              name={showHomeButton ? "home" : "settings"}
              size={20}
              color="#C47A3A"
            />
          </TouchableOpacity>

          {/* Streak */}
          <StreakBadge onPress={() => setShowStreak(true)} />

          {/* Tacos */}
          <TouchableOpacity style={styles.pill} onPress={() => { tapMedium(); setShowMexicanario(true); }}>
            <Text style={styles.pillText}>{fmt(user?.tacos || 0)}</Text>
            <Image source={require("../../assets/images/bis.png")} style={styles.tacoIcon} />
          </TouchableOpacity>
        </View>

        {/* ── RIGHT ── */}
        <View style={styles.row}>
          {/* Diamonds */}
          <TouchableOpacity style={styles.pill} onPress={() => { tapMedium(); setShowShop(true); }}>
            <Image source={require("../../assets/icons/plus.png")} style={styles.plusIcon} />
            <Text style={styles.pillText}>{fmt(user?.diamonds || 0)}</Text>
            <Image source={require("../../assets/icons/diamond.png")} style={styles.pillIcon} />
          </TouchableOpacity>

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
        onDisconnect={() => { setShowSettings(false); setShowDisconnect(true); }}
        onInvitar={() => { setShowSettings(false); setShowInvitar(true); }}
        onPolíticadePrivacidad={() => { setShowSettings(false); setShowPolíticadePrivacidad(true); }}
        onTerminosdeservio={() => { setShowSettings(false); setShowTerminosdeservio(true); }}
        onPrivacy={() => { setShowSettings(false); setShowPrivacy(true); }}
        onCalificar={() => { setShowSettings(false); setShowCalificar(true); }}
        onSupport={() => { setShowSettings(false); setShowSupport(true); }}
        onPerfill={() => { setShowSettings(false); setShowPerfil(true); }}
        onApoyar={() => { setShowSettings(false); setShowApoyar(true); }}
      />
      <DisconnectModal visible={showDisconnect} onClose={() => setShowDisconnect(false)} />
      <Perfil visible={showPerfil} onClose={() => setShowPerfil(false)} />
      <Apoyar visible={showApoyar} onClose={() => setShowApoyar(false)} />
      <Invitar visible={showInvitar} onClose={() => setShowInvitar(false)} />
      <Calificar visible={showCalificar} onClose={() => setShowCalificar(false)} />
      <PolíticadePrivacidad visible={showPolíticadePrivacidad} onClose={() => setShowPolíticadePrivacidad(false)} />
      <Terminosdeservio visible={showTerminosdeservio} onClose={() => setShowTerminosdeservio(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <SupportModal visible={showSupport} onClose={() => setShowSupport(false)} />
      <Mexicanometro visible={showMexicanario} onClose={() => setShowMexicanario(false)} />
      <ShopScreen visible={showShop} onClose={() => setShowShop(false)} />
      <StreakModal visible={showStreak} onClose={() => setShowStreak(false)} />
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
