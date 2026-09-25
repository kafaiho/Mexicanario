import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Reanimated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

// Un solo set de íconos: contorno cuando la pestaña está inactiva, relleno cuando está activa
export const TAB_ICONS = {
  Home: { icon: "home", label: "Inicio" },
  "Colección": { icon: "book", label: "Colección" },
  Mascota: { icon: "paw", label: "Mascota" },
  Logros: { icon: "ribbon", label: "Logros" },
  Liga: { icon: "trophy", label: "Liga" },
  Juegos: { icon: "game-controller", label: "Juegos" },
  Shop: { icon: "storefront", label: "Tienda" },
};

const ACTIVE = "#C8561A";      // naranja barro
const ACTIVE_ICON = "#FFF8EE";
const INACTIVE = "#8F6A48";
const LABEL_ACTIVE = "#5C2E0E";

/**
 * TabBarIcon — ícono + nombre de la pestaña. La activa lleva una píldora de color
 * que aparece con un resorte suave (sin animación si el sistema pide menos movimiento).
 */
function TabBarIcon({ routeName, focused, badge = false }) {
  const cfg = TAB_ICONS[routeName];
  const reduceMotion = useReducedMotion();
  const pill = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    const to = focused ? 1 : 0;
    pill.value = reduceMotion ? to : focused ? withSpring(to, { damping: 12, stiffness: 220 }) : withTiming(to, { duration: 120 });
  }, [focused, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pill.value,
    transform: [{ scaleX: 0.55 + pill.value * 0.45 }],
  }));

  if (!cfg) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.iconSlot}>
        <Reanimated.View style={[styles.pill, pillStyle]} />
        <Ionicons
          name={focused ? cfg.icon : `${cfg.icon}-outline`}
          size={22}
          color={focused ? ACTIVE_ICON : INACTIVE}
        />
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>!</Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.label, focused && styles.labelActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", gap: 3, minWidth: 50 },
  iconSlot: { width: 50, height: 30, alignItems: "center", justifyContent: "center" },
  pill: { ...StyleSheet.absoluteFillObject, borderRadius: 15, backgroundColor: ACTIVE },
  label: { fontSize: 10.5, fontWeight: "600", color: INACTIVE, maxWidth: 58 },
  labelActive: { color: LABEL_ACTIVE, fontWeight: "800" },
  badge: {
    position: "absolute", top: -3, right: 6,
    backgroundColor: "#E74C3C", borderRadius: 8, width: 16, height: 16,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "#F1DDBE",
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "900", lineHeight: 12 },
});

export default React.memo(TabBarIcon);
