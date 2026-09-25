/**
 * DailyRewardModal — "¡Tu premio de hoy!" (vista previa del premio diario unificado)
 *
 * Solo hay un premio diario y lo paga el servidor: recordDailyPlay lo entrega
 * al acertar la primera palabra del día (ciclo de 7 días: 10·15·20·25·30·35
 * varos y piñata de 50-200 el día 7; ver convex/streakMath.ts). Al abrir la app
 * este modal muestra lo que te espera y te manda a jugar para cobrarlo; el cobro
 * se celebra en StreakCelebration.
 *
 * Se muestra una vez al día, solo si todavía no has jugado hoy.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "convex/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { api } from "../../convex/_generated/api";
import { getDailyStreakReward } from "../config/streakRewards";
import { useAuth } from "../context/AuthContext";
import { tapLight, tapMedium } from "../services/haptics";

const { width } = Dimensions.get("window");
const CARD_W = Math.min(width * 0.88, 380);

const STORAGE_KEY_SEEN = "@mexicanario_daily_preview_date";
// Clave del sistema anterior (cobro local): solo sirve para saber que no es la primera vez
const LEGACY_KEY_DATE = "@mexicanario_daily_reward_date";

const CYCLE = [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, ...getDailyStreakReward(day) }));

function getLocalDayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Decide si mostrar la vista previa del premio de hoy.
 * Returns { shouldShow, status, dismiss }
 */
export function useDailyReward() {
  const { userId } = useAuth();
  const status = useQuery(api.streaks.getStreakStatus, userId ? { userId } : "skip");
  const [shouldShow, setShouldShow] = useState(false);
  const checkedRef = useRef(false);
  const hasStatus = status !== undefined;

  useEffect(() => {
    if (!userId || !hasStatus || checkedRef.current) return undefined;
    checkedRef.current = true;
    // Pequeña pausa para que la app termine de cargar visualmente
    const timer = setTimeout(async () => {
      try {
        if (!status || status.playedToday || !status.todayReward) return;
        const today = getLocalDayString();
        const [seen, legacy] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_SEEN),
          AsyncStorage.getItem(LEGACY_KEY_DATE),
        ]);
        if (seen === today) return;
        await AsyncStorage.setItem(STORAGE_KEY_SEEN, today);
        // Primera vez que abre la app: no interrumpir el onboarding
        if (!seen && !legacy) return;
        setShouldShow(true);
      } catch (_) {/* ignore storage errors */}
    }, 1200);
    return () => clearTimeout(timer);
  }, [userId, hasStatus]);

  const dismiss = useCallback(() => setShouldShow(false), []);

  return { shouldShow, status, dismiss };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DailyRewardModal({ visible, status, onPlay, onDismiss }) {
  const reduceMotion = useReducedMotion();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const idleLoop = useRef(new Animated.Value(0)).current; // bob del encabezado + pulso del día de hoy

  useEffect(() => {
    if (!visible) return undefined;
    idleLoop.setValue(0);
    if (reduceMotion) { scaleAnim.setValue(1); return undefined; }
    scaleAnim.setValue(0.7);
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(idleLoop, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(idleLoop, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [visible, reduceMotion]);

  const reward = status?.todayReward;
  if (!reward) return null;

  const currentStreak = status?.currentStreak ?? 0;
  const { cycleDay, isPinata, coins, pinataRange, nextStreak } = reward;
  const daysToPinata = 7 - cycleDay;

  const subtitle = reward.streakWillReset
    ? "¡Nueva racha! Empieza hoy y vuelve a subir 🔥"
    : currentStreak > 0
      ? `Juega hoy y tu racha sube a ${nextStreak} 🔥`
      : "Acierta tu primera palabra del día y cóbralo";

  const headerBob = idleLoop.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const headerSwing = idleLoop.interpolate({ inputRange: [0, 1], outputRange: ["-6deg", "6deg"] });
  const todayPulse = idleLoop.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1.16] });

  const handlePlay = () => { tapMedium(); onPlay?.(); };
  const handleLater = () => { tapLight(); onDismiss?.(); };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Animated.Text
              style={[
                styles.emoji,
                isPinata && styles.emojiPinata,
                { transform: [{ translateY: isPinata ? 0 : headerBob }, { rotate: isPinata ? headerSwing : "0deg" }] },
              ]}
            >
              {isPinata ? "🪅" : "🎁"}
            </Animated.Text>
            <Text style={styles.title}>¡Tu premio de hoy!</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {reward.shieldsWillSave && (
            <View style={styles.shieldPill}>
              <Text style={styles.shieldText}>🛡️ Tus escudos protegieron tu racha</Text>
            </View>
          )}

          {/* Ciclo de 7 días */}
          <View style={styles.grid}>
            {CYCLE.map(({ day, coins: dayCoins, isPinata: dayIsPinata }) => {
              const isToday = day === cycleDay;
              const isPast = day < cycleDay;
              return (
                <Animated.View
                  key={day}
                  style={[
                    styles.dayCell,
                    isPast && styles.dayCellPast,
                    dayIsPinata && styles.dayCellPiñata,
                    isToday && styles.dayCellToday,
                    isToday && { transform: [{ scale: todayPulse }] },
                  ]}
                >
                  <Text style={styles.dayLabel}>{dayIsPinata ? "🪅 Día 7" : `Día ${day}`}</Text>
                  <Text style={styles.dayCoins}>{dayIsPinata ? "🪅" : `🪙 ${dayCoins}`}</Text>
                  {isPast && <Text style={styles.checkmark}>✓</Text>}
                </Animated.View>
              );
            })}
          </View>

          {/* Premio de hoy */}
          <View style={[styles.rewardBanner, isPinata && styles.rewardBannerPinata]}>
            <Text style={styles.rewardText}>
              {isPinata
                ? `🪅 ¡Hoy toca piñata! ${pinataRange[0]}–${pinataRange[1]} varos`
                : `🪙 +${coins} varos te esperan`}
            </Text>
          </View>

          <TouchableOpacity style={styles.playBtn} onPress={handlePlay} activeOpacity={0.8} accessibilityRole="button">
            <Text style={styles.playBtnText}>🎮 ¡Jugar y cobrar!</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLater} hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }} accessibilityRole="button">
            <Text style={styles.laterText}>Más tarde</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            {daysToPinata > 0
              ? `Se cobra al acertar tu primera palabra · faltan ${daysToPinata} ${daysToPinata === 1 ? "día" : "días"} para la 🪅`
              : "Se cobra al acertar tu primera palabra del día"}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30,10,0,0.82)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_W,
    backgroundColor: "#FFF8EC",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    shadowColor: "#5C2800",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 20,
    borderWidth: 2.5,
    borderColor: "#F8BE17",
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  emoji: {
    fontSize: 42,
    lineHeight: 52,
    marginBottom: 4,
  },
  emojiPinata: {
    fontSize: 54,
    lineHeight: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#5C2800",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#8B5E3C",
    marginTop: 3,
    textAlign: "center",
  },
  shieldPill: {
    backgroundColor: "#E8F5E9",
    borderColor: "#7CB87A",
    borderWidth: 1.5,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  shieldText: { color: "#2E7D32", fontSize: 12, fontWeight: "800" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  dayCell: {
    width: (CARD_W - 44 - 6 * 8) / 7,
    minWidth: 40,
    aspectRatio: 0.78,
    backgroundColor: "#F5E8C8",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D4A574",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  dayCellPast: {
    backgroundColor: "#D4E8C0",
    borderColor: "#7CB87A",
    opacity: 0.85,
  },
  dayCellToday: {
    backgroundColor: "#FFEAAC",
    borderColor: "#F8BE17",
    borderWidth: 2.5,
  },
  dayCellPiñata: {
    backgroundColor: "#FFCCE0",
    borderColor: "#E0559A",
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#5C2800",
    textAlign: "center",
  },
  dayCoins: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8B4513",
    textAlign: "center",
    marginTop: 2,
  },
  checkmark: {
    position: "absolute",
    top: 2,
    right: 4,
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "900",
  },
  rewardBanner: {
    backgroundColor: "#5C2800",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 14,
    width: "100%",
    alignItems: "center",
  },
  rewardBannerPinata: {
    backgroundColor: "#4A1030",
    borderWidth: 2,
    borderColor: "#E0559A",
  },
  rewardText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8BE17",
    textAlign: "center",
  },
  playBtn: {
    backgroundColor: "#D36B1E",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  playBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFF",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  laterText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B5E3C",
    paddingVertical: 4,
  },
  hint: {
    fontSize: 11,
    color: "#8B5E3C",
    textAlign: "center",
    opacity: 0.8,
    marginTop: 6,
  },
});
