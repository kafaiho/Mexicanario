import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tapMedium } from "../services/haptics";
import { playSound } from "../utils/soundManager";

const { width } = Dimensions.get("window");
// Mismo tamaño y estilo que los botones redondos del TopBar
const SIZE = width * 0.075;

/**
 * Regresa a la pantalla de inicio (pestaña Home), venga de donde venga:
 * una pestaña, un minijuego o una pantalla del stack (Gameplay, Map).
 */
export function goHome(navigation) {
  navigation?.navigate("Main", { screen: "Home" });
}

/**
 * HomeButton — casita para volver al inicio.
 *
 * Props:
 *   floating       – se coloca sola arriba a la izquierda, respetando el notch
 *   onBeforeLeave  – p. ej. detener un minijuego antes de salir
 *   onPress        – reemplaza la navegación por defecto (la usa TopBar)
 *   onLongPress, delayLongPress, style, children (insignias)
 */
export default function HomeButton({ floating = false, onBeforeLeave, onPress, onLongPress, delayLongPress, style, iconColor = "#C47A3A", children }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(() => {
    if (onPress) { onPress(); return; }
    tapMedium();
    playSound("click");
    onBeforeLeave?.();
    goHome(navigation);
  }, [navigation, onBeforeLeave, onPress]);

  return (
    <TouchableOpacity
      style={[styles.btn, floating && { position: "absolute", top: insets.top + 10, left: 14, zIndex: 50 }, style]}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      accessibilityRole="button"
      accessibilityLabel="Ir al inicio"
      hitSlop={8}
    >
      <Ionicons name="home" size={20} color={iconColor} />
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: SIZE,
    width: SIZE,
    borderRadius: width * 0.038,
    backgroundColor: "#E6CCB2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(92,58,33,0.25)",
  },
});
