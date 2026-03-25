import React, { useEffect, useRef, useState } from "react";
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
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FONTS } from "../theme/designTokens";

const { width } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const DARK_BG = "#1A0A00";
const GREEN = "#27AE60";

const SEARCH_TIMEOUT_SECS = 60;

export default function PvPMatchmakingModal({
  visible,
  userId,
  friendInviteId,
  onMatchFound,
  onCancel,
}) {
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [searching, setSearching] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const joinQueue = useMutation(api.pvp.joinQueue);
  const leaveQueue = useMutation(api.pvp.leaveQueue);

  // Queue status (reactive)
  const queueStatus = useQuery(
    api.pvp.getQueueStatus,
    userId && searching ? { userId } : "skip"
  );

  // Spinner animation
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible || !searching) return;
    // Spin
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    // Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    return () => {
      spinAnim.setValue(0);
      pulseAnim.setValue(1);
    };
  }, [visible, searching]);

  // Start search
  const handleStartSearch = () => {
    if (!userId || searching) return;
    setSearching(true);
    setWaitSeconds(0);
    setTimedOut(false);
    joinQueue({ userId, friendInviteId }).then((result) => {
      if (result.status === "matched" && result.matchId) {
        onMatchFound(result.matchId);
      }
    }).catch(console.warn);
  };

  // Watch for match via reactive query
  useEffect(() => {
    if (queueStatus?.status === "matched" && queueStatus?.matchId) {
      onMatchFound(queueStatus.matchId);
    }
  }, [queueStatus?.status, queueStatus?.matchId]);

  // Wait timer + auto-timeout
  useEffect(() => {
    if (!visible || !searching || timedOut) return;
    const interval = setInterval(() => {
      setWaitSeconds((s) => {
        const next = s + 1;
        if (next >= SEARCH_TIMEOUT_SECS) {
          setTimedOut(true);
          setSearching(false);
          leaveQueue({ userId }).catch(() => {});
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, searching, timedOut]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSearching(false);
      setWaitSeconds(0);
      setTimedOut(false);
    }
  }, [visible]);

  const handleCancel = () => {
    if (searching) {
      leaveQueue({ userId }).catch(() => {});
    }
    onCancel();
  };

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* ── Not searching yet — show "Buscar Duelo" button ── */}
          {!searching && !timedOut && (
            <>
              <Text style={styles.readyEmoji}>⚔️</Text>
              <Text style={styles.title}>Duelo PvP</Text>
              <Text style={styles.subtitle}>
                {friendInviteId
                  ? "Reta a tu cuate a un duelo"
                  : "Enfrenta a un rival en tiempo real"}
              </Text>
              <TouchableOpacity style={styles.searchBtn} onPress={handleStartSearch} activeOpacity={0.8}>
                <Text style={styles.searchBtnText}>Buscar Duelo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Searching ── */}
          {searching && !timedOut && (
            <>
              <Animated.View style={[styles.spinnerWrap, { transform: [{ scale: pulseAnim }] }]}>
                <Animated.Text style={[styles.spinnerEmoji, { transform: [{ rotate: spinRotate }] }]}>
                  ⚔️
                </Animated.Text>
              </Animated.View>

              <Text style={styles.title}>Buscando oponente...</Text>
              <Text style={styles.subtitle}>
                {friendInviteId
                  ? "Esperando a tu cuate..."
                  : waitSeconds < 15
                    ? "Buscando rival de nivel similar"
                    : "Ampliando búsqueda..."}
              </Text>

              <Text style={styles.timer}>{waitSeconds}s</Text>

              <View style={styles.dots}>
                {[0, 1, 2].map((i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.dot,
                      { opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.15],
                        outputRange: [i === (waitSeconds % 3) ? 1 : 0.3, i === ((waitSeconds + 1) % 3) ? 1 : 0.3],
                      })},
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Timed out — no opponent found ── */}
          {timedOut && (
            <>
              <Text style={styles.timeoutEmoji}>😔</Text>
              <Text style={styles.title}>Sin rival disponible</Text>
              <Text style={styles.subtitle}>
                No se encontro oponente en {SEARCH_TIMEOUT_SECS}s.{"\n"}Intenta de nuevo mas tarde.
              </Text>
              <TouchableOpacity style={styles.searchBtn} onPress={handleStartSearch} activeOpacity={0.8}>
                <Text style={styles.searchBtnText}>Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={handleCancel} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  card: {
    backgroundColor: "#1E1E2E",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  spinnerWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  spinnerEmoji: { fontSize: 44 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: GOLD,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: "rgba(255,228,181,0.6)",
    textAlign: "center",
    marginBottom: 16,
  },
  timer: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: "rgba(255,228,181,0.4)",
    marginBottom: 12,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cancelText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: "rgba(255,228,181,0.7)",
  },
  readyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  searchBtn: {
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  searchBtnText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: "#1A0A00",
  },
  timeoutEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
});
