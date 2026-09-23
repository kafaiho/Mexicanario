/**
 * DailyRewardModal — Sistema de recompensa diaria (7 días)
 *
 * Día 1: 10 varos  · Día 2: 15  · Día 3: 20  · Día 4: 25
 * Día 5: 30 varos  · Día 6: 40  · Día 7: 🪅 Piñata (50-200 aleatorio)
 *
 * Lógica:
 * - Si el usuario no ha reclamado hoy → mostrar modal
 * - Si la última reclamación fue ayer → avanzar día (1-7 en ciclo)
 * - Si pasaron 2+ días sin reclamar → resetear a día 1
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "convex/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { notifySuccess } from "../services/haptics";
import { playSound } from "../utils/soundManager";
import { useUserMutation } from "../hooks/useUserMutation";

const { width } = Dimensions.get("window");
const CARD_W = Math.min(width * 0.88, 380);

const STORAGE_KEY_DATE = "@mexicanario_daily_reward_date";
const STORAGE_KEY_DAY  = "@mexicanario_daily_reward_day";

const DAY_REWARDS = [5, 8, 10, 12, 15, 18, null]; // null = Piñata (día 7)
const DAY_LABELS  = ["Día 1", "Día 2", "Día 3", "Día 4", "Día 5", "Día 6", "🪅 Día 7"];

function getPiñataReward() {
  return Math.floor(Math.random() * 76) + 25; // 25-100
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}
function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Hook to manage daily reward state. Returns { shouldShow, currentDay, claimReward }
 * Call checkDailyReward() on mount (after userId is available).
 */
export function useDailyReward() {
  const [shouldShow, setShouldShow] = useState(false);
  const [currentDay, setCurrentDay] = useState(1); // 1-7
  const [rewardCoins, setRewardCoins] = useState(0);
  const [claimed, setClaimed] = useState(false);

  const { userId } = useAuth();
  const updateCurrency = useUserMutation(api.users.updateUserCurrency);

  const check = useCallback(async () => {
    if (!userId) return;
    try {
      const lastDate = await AsyncStorage.getItem(STORAGE_KEY_DATE);
      const lastDayStr = await AsyncStorage.getItem(STORAGE_KEY_DAY);
      const today = getTodayString();
      const yesterday = getYesterdayString();

      // Already claimed today
      if (lastDate === today) return;

      // First-ever launch: don't show DailyReward — let onboarding run undisturbed.
      // The reward will appear on day 2 when lastDate exists.
      if (!lastDate) {
        await AsyncStorage.setItem(STORAGE_KEY_DATE, today);
        await AsyncStorage.setItem(STORAGE_KEY_DAY, "1");
        return;
      }

      let nextDay = 1;
      if (lastDate === yesterday) {
        // Consecutive day — advance
        nextDay = lastDayStr ? Math.min(parseInt(lastDayStr, 10) % 7 + 1, 7) : 1;
      }
      // else: 2+ days missed → reset to 1

      const coins = DAY_REWARDS[nextDay - 1] ?? getPiñataReward();
      setCurrentDay(nextDay);
      setRewardCoins(coins);
      setShouldShow(true);
    } catch (_) {/* ignore storage errors */}
  }, [userId]);

  const claim = useCallback(async () => {
    if (!userId || claimed) return;
    try {
      const today = getTodayString();
      // Use the already-computed rewardCoins from check() — don't re-roll piñata
      const coinsActual = rewardCoins || (DAY_REWARDS[currentDay - 1] ?? 10);
      await AsyncStorage.setItem(STORAGE_KEY_DATE, today);
      await AsyncStorage.setItem(STORAGE_KEY_DAY, String(currentDay));
      await updateCurrency({ userId, coins: coinsActual, diamonds: 0 });
      setClaimed(true);
      playSound("milestone");
      notifySuccess();
    } catch (_) {/* ignore */}
  }, [userId, currentDay, claimed, updateCurrency]);

  const dismiss = useCallback(() => {
    setShouldShow(false);
    setClaimed(false);
  }, []);

  return { shouldShow, currentDay, rewardCoins, claimed, check, claim, dismiss };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DailyRewardModal({ visible, currentDay, rewardCoins, claimed, onClaim, onDismiss }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const piñataAnim = useRef(new Animated.Value(0)).current;
  const coinsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.7);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (claimed) {
      // Piñata burst animation
      Animated.sequence([
        Animated.timing(piñataAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(piñataAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(piñataAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      Animated.timing(coinsAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } else {
      piñataAnim.setValue(0);
      coinsAnim.setValue(0);
    }
  }, [claimed]);

  const isLastDay = currentDay === 7;

  const claimBtnScale = piñataAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const coinsOpacity = coinsAnim;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🎁</Text>
            <Text style={styles.title}>¡Recompensa Diaria!</Text>
            <Text style={styles.subtitle}>Entra todos los días y acumula varos</Text>
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {DAY_LABELS.map((label, i) => {
              const dayNum = i + 1;
              const isToday = dayNum === currentDay;
              const isPast = dayNum < currentDay;
              const coins = DAY_REWARDS[i];
              return (
                <View
                  key={dayNum}
                  style={[
                    styles.dayCell,
                    isPast && styles.dayCellPast,
                    isToday && styles.dayCellToday,
                    dayNum === 7 && styles.dayCellPiñata,
                  ]}
                >
                  <Text style={styles.dayLabel}>{label}</Text>
                  <Text style={styles.dayCoins}>
                    {dayNum === 7 ? "🪅" : `🪙 ${coins}`}
                  </Text>
                  {isPast && <Text style={styles.checkmark}>✓</Text>}
                </View>
              );
            })}
          </View>

          {/* Reward display */}
          <Animated.View style={[styles.rewardBanner, claimed && { opacity: coinsOpacity }]}>
            {isLastDay ? (
              <Text style={styles.rewardText}>
                {claimed ? `🪅 ¡Piñata! +${rewardCoins} varos` : "🪅 ¡Piñata sorpresa!"}
              </Text>
            ) : (
              <Text style={styles.rewardText}>
                {claimed ? `✅ +${rewardCoins} varos añadidos` : `🪙 +${rewardCoins} varos hoy`}
              </Text>
            )}
          </Animated.View>

          {/* CTA */}
          {!claimed ? (
            <Animated.View style={{ transform: [{ scale: claimBtnScale }] }}>
              <TouchableOpacity style={styles.claimBtn} onPress={onClaim} activeOpacity={0.8}>
                <Text style={styles.claimBtnText}>
                  {isLastDay ? "🪅 ¡Romper la Piñata!" : "🙌 ¡Reclamar recompensa!"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} activeOpacity={0.8}>
              <Text style={styles.dismissBtnText}>¡Órale, gracias! 👊</Text>
            </TouchableOpacity>
          )}

          {/* Streak reminder */}
          {!claimed && (
            <Text style={styles.streakHint}>
              ⚡ No rompas la racha — vuelve mañana por más
            </Text>
          )}
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
    marginBottom: 16,
  },
  emoji: {
    fontSize: 42,
    marginBottom: 4,
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
    transform: [{ scale: 1.08 }],
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
  rewardText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8BE17",
    textAlign: "center",
  },
  claimBtn: {
    backgroundColor: "#D36B1E",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  claimBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFF",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  dismissBtn: {
    backgroundColor: "#7CB87A",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginBottom: 10,
  },
  dismissBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
  },
  streakHint: {
    fontSize: 11,
    color: "#8B5E3C",
    textAlign: "center",
    opacity: 0.8,
    marginTop: 2,
  },
});
