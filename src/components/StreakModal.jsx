import React, { useEffect, useRef, useState } from "react";
import { notifySuccess, comboBurst } from "../services/haptics";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import PetCompanion from "./PetCompanion";

const { width, height } = Dimensions.get("window");

// ── Goal options ───────────────────────────────────────────────────────────────
const GOALS = [
  { days: 7, diamonds: 35 },
  { days: 14, diamonds: 140 },
  { days: 30, diamonds: 210 },
  { days: 50, diamonds: 350 },
];

const MILESTONES = [
  { days: 7, diamonds: 35, petStage: "Cría 🫧" },
  { days: 14, diamonds: 140, petStage: "Juvenil 🦎" },
  { days: 30, diamonds: 210, petStage: "Guardián ✨" },
  { days: 50, diamonds: 350, petStage: "Mítico 🐉" },
  { days: 100, diamonds: 500 },
  { days: 365, diamonds: 2000 },
];

export default function StreakModal({ visible, onClose }) {
  const { userId } = useAuth();
  const streakData = useQuery(
    api.streaks.getStreakStatus,
    userId ? { userId } : "skip"
  );
  const petState = useQuery(
    api.pet.getPetState,
    userId ? { userId } : "skip"
  );
  const commitGoal = useMutation(api.streaks.commitStreakGoal);
  const claimMilestone = useMutation(api.streaks.claimStreakMilestone);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [claimingMilestone, setClaimingMilestone] = useState(null);
  const fireScale = useRef(new Animated.Value(1)).current;

  // Fire pulse animation
  useEffect(() => {
    if (visible && streakData?.currentStreak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireScale, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fireScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    return () => fireScale.stopAnimation();
  }, [visible, streakData?.currentStreak]);

  const streak = streakData?.currentStreak ?? 0;
  const maxStreak = streakData?.maxStreak ?? 0;
  const weekDays = streakData?.weekDays ?? [];
  const activeGoal = streakData?.goalDays ?? 0;
  const claimedMilestones = streakData?.claimedMilestones ?? [];

  const handleCommitGoal = async () => {
    if (!selectedGoal || !userId) return;
    try {
      await commitGoal({ userId, targetDays: selectedGoal });
      setSelectedGoal(null);
    } catch (e) {
      console.log("Error committing goal:", e);
    }
  };

  const handleClaimMilestone = async (days) => {
    if (!userId) return;
    setClaimingMilestone(days);
    try {
      await claimMilestone({ userId, milestoneDays: days });
      comboBurst(10); // vibración intensa al alcanzar un hito de racha
    } catch (e) {
      console.log("Error claiming milestone:", e);
    }
    setClaimingMilestone(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Mascota + Streak Count ────────────────────── */}
            {petState?.hasPet ? (
              <View style={styles.mascotWrap}>
                <PetCompanion reaction={streak > 0 ? 'correct' : null} />
              </View>
            ) : (
              <Animated.Text
                style={[
                  styles.fireEmoji,
                  { transform: [{ scale: fireScale }] },
                ]}
              >
                🔥
              </Animated.Text>
            )}
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>
              {streak === 1 ? "día de racha" : "días de racha"}
            </Text>
            <Text style={styles.streakSub}>
              ¡Tu mascota evoluciona con tu racha!
            </Text>

            {/* ── Récord ───────────────────────────────────── */}
            {maxStreak > 0 && (
              <Text style={styles.maxStreakText}>
                Récord: {maxStreak} días 🏆
              </Text>
            )}

            {/* ── Weekly Calendar ───────────────────────────── */}
            <View style={styles.weekRow}>
              {weekDays.map((day, i) => (
                <View
                  key={i}
                  style={[
                    styles.dayCircle,
                    day.played && styles.dayPlayed,
                    day.isToday && !day.played && styles.dayToday,
                  ]}
                >
                  {day.played ? (
                    <Text style={styles.dayCheck}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.dayLabel,
                        day.isToday && styles.dayLabelToday,
                      ]}
                    >
                      {day.label}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* ── Streak Goals ──────────────────────────────── */}
            <Text style={styles.sectionTitle}>
              COMPROMÉTETE CON TU META
            </Text>

            <View style={styles.goalsGrid}>
              {GOALS.map((goal) => {
                const isActive = activeGoal === goal.days;
                const isSelected = selectedGoal === goal.days;
                return (
                  <TouchableOpacity
                    key={goal.days}
                    style={[
                      styles.goalCard,
                      isActive && styles.goalCardActive,
                      isSelected && styles.goalCardSelected,
                    ]}
                    onPress={() => setSelectedGoal(goal.days)}
                  >
                    <Text style={styles.goalDays}>{goal.days} días</Text>
                    <Text style={styles.goalReward}>
                      Gana {goal.diamonds} 💎
                    </Text>
                    {isActive && (
                      <Text style={styles.goalActiveBadge}>ACTIVA</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedGoal && selectedGoal !== activeGoal && (
              <TouchableOpacity
                style={styles.commitButton}
                onPress={handleCommitGoal}
              >
                <Text style={styles.commitButtonText}>
                  COMPROMETERME CON MI META
                </Text>
              </TouchableOpacity>
            )}

            {/* ── Milestones ───────────────────────────────── */}
            <Text style={[styles.sectionTitle, { marginTop: height * 0.025 }]}>
              RECOMPENSAS POR RACHA
            </Text>

            {MILESTONES.map((ms) => {
              const isClaimed = claimedMilestones.includes(ms.days);
              const canClaim = streak >= ms.days && !isClaimed;
              const isReached = streak >= ms.days;
              return (
                <View key={ms.days} style={[styles.milestoneRow, isReached && styles.milestoneReached]}>
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneDays}>
                      🔥 {ms.days} días
                    </Text>
                    <Text style={styles.milestoneReward}>
                      {ms.diamonds} 💎
                      {ms.petStage ? `  ·  ${ms.petStage}` : ""}
                    </Text>
                  </View>
                  {isClaimed ? (
                    <Text style={styles.milestoneClaimed}>✅</Text>
                  ) : canClaim ? (
                    <TouchableOpacity
                      style={styles.milestoneClaimBtn}
                      onPress={() => handleClaimMilestone(ms.days)}
                      disabled={claimingMilestone === ms.days}
                    >
                      <Text style={styles.milestoneClaimText}>
                        {claimingMilestone === ms.days
                          ? "..."
                          : "Reclamar"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.milestoneLocked}>🔒</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* ── Close button ────────────────────────────── */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 20, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    backgroundColor: "#FFE4B5",
    borderRadius: width * 0.05,
    borderWidth: 3,
    borderColor: "#8B4513",
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
    paddingBottom: height * 0.015,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: height * 0.01,
  },

  // Mascot in streak modal
  mascotWrap: {
    width: width * 0.4,
    height: 140,
    alignSelf: "center",
    marginBottom: -height * 0.01,
    overflow: 'hidden',
  },

  // Fire + streak
  fireEmoji: {
    fontSize: width * 0.2,
    textAlign: "center",
  },
  streakNumber: {
    fontSize: width * 0.14,
    fontWeight: "900",
    color: "#FF6B35",
    textAlign: "center",
    marginTop: -height * 0.01,
  },
  streakLabel: {
    fontSize: width * 0.055,
    fontWeight: "bold",
    color: "#8B4513",
    textAlign: "center",
  },
  streakSub: {
    fontSize: width * 0.035,
    color: "#A0522D",
    textAlign: "center",
    marginTop: height * 0.005,
    marginBottom: height * 0.01,
  },
  maxStreakText: {
    fontSize: width * 0.032,
    color: "#D2691E",
    textAlign: "center",
    marginBottom: height * 0.015,
  },

  // Weekly calendar
  weekRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: width * 0.02,
    marginVertical: height * 0.02,
  },
  dayCircle: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    backgroundColor: "#F5DEB3",
    borderWidth: 2,
    borderColor: "#D2691E",
    justifyContent: "center",
    alignItems: "center",
  },
  dayPlayed: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
  },
  dayToday: {
    borderColor: "#FF6B35",
    borderWidth: 3,
  },
  dayLabel: {
    fontSize: width * 0.028,
    fontWeight: "bold",
    color: "#8B4513",
  },
  dayLabelToday: {
    color: "#FF6B35",
  },
  dayCheck: {
    fontSize: width * 0.04,
    color: "#fff",
    fontWeight: "bold",
  },

  // Section title
  sectionTitle: {
    fontSize: width * 0.032,
    fontWeight: "bold",
    color: "#8B4513",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: height * 0.012,
  },

  // Goals grid
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: width * 0.025,
  },
  goalCard: {
    width: width * 0.35,
    backgroundColor: "#F5DEB3",
    borderRadius: width * 0.03,
    borderWidth: 2,
    borderColor: "#D2691E",
    padding: width * 0.03,
    alignItems: "center",
  },
  goalCardActive: {
    borderColor: "#FF6B35",
    borderWidth: 3,
    backgroundColor: "#FFDAB9",
  },
  goalCardSelected: {
    borderColor: "#F8BE17",
    borderWidth: 3,
    backgroundColor: "#FFF8DC",
  },
  goalDays: {
    fontSize: width * 0.042,
    fontWeight: "bold",
    color: "#8B4513",
  },
  goalReward: {
    fontSize: width * 0.032,
    color: "#D2691E",
    marginTop: height * 0.003,
  },
  goalActiveBadge: {
    fontSize: width * 0.025,
    fontWeight: "bold",
    color: "#FF6B35",
    marginTop: height * 0.003,
  },

  // Commit button
  commitButton: {
    backgroundColor: "#F8BE17",
    borderRadius: width * 0.06,
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.08,
    marginTop: height * 0.015,
    borderWidth: 2,
    borderColor: "#8B4513",
  },
  commitButtonText: {
    color: "#8B4513",
    fontWeight: "bold",
    fontSize: width * 0.035,
    textAlign: "center",
  },

  // Milestones
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5DEB3",
    borderRadius: width * 0.025,
    borderWidth: 1.5,
    borderColor: "#D2691E",
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.008,
    width: "100%",
  },
  milestoneReached: {
    backgroundColor: "#FFDAB9",
    borderColor: "#FF6B35",
  },
  milestoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.03,
    flexShrink: 1,
  },
  milestoneDays: {
    fontSize: width * 0.035,
    fontWeight: "bold",
    color: "#8B4513",
  },
  milestoneReward: {
    fontSize: width * 0.032,
    color: "#D2691E",
  },
  milestoneClaimed: {
    fontSize: width * 0.05,
  },
  milestoneLocked: {
    fontSize: width * 0.04,
    opacity: 0.5,
  },
  milestoneClaimBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: width * 0.03,
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.04,
  },
  milestoneClaimText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.03,
  },

  // Close
  closeBtn: {
    backgroundColor: "#FF6B35",
    borderRadius: width * 0.06,
    paddingVertical: height * 0.018,
    alignItems: "center",
    marginTop: height * 0.01,
    borderWidth: 2,
    borderColor: "#8B4513",
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
});
