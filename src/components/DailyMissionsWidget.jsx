import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import { notifySuccess } from "../services/haptics";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CoinFlyOverlay from './CoinFlyOverlay';
import useCoinFly from '../hooks/useCoinFly';
import { api } from "../../convex/_generated/api";
import { COLORS, FONTS } from "../theme/designTokens";

const { width, height } = Dimensions.get('window');

const getCoinPillFallback = () => {
  const topPad = Platform.OS === 'ios' ? height * 0.058 : height * 0.04;
  const pillH  = width * 0.075;
  const pillW  = width * 0.22;
  const pillX  = width - width * 0.03 - pillW;
  return { x: pillX, y: topPad, w: pillW, h: pillH };
};
const CARD_W = width - 24;

// ── Paleta Mexicanometro ───────────────────────────────────────────────────────
const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';
const BURLY = '#DEB887';

// ── Identidad por tipo de misión ─────────────────────────────────────────────
// Gradiente de temperatura: fresco (aprender) → cálido (acción) → fuego (racha)
const TYPE_ACCENT = {
  words:  COLORS.turquesa,  // #00B2A9 — fresco/aprender
  combo:  '#FF922B',        // ámbar-naranja cálido (coherente con la paleta warm)
  streak: COLORS.copal,     // #FF6B35 — fuego/racha
};

// Íconos en el mismo lenguaje cultural de Mexicanometro
const TYPE_EMOJI = {
  words:  '🌮',  // el taco = vocabulario mexicano
  combo:  '⚡',  // relámpago = combo rápido
  streak: '🔥',  // fuego = racha
};

// Estados especiales (listo / reclamado)
const STATE_ACCENT = {
  ready:   COLORS.cempasuchil,  // #FFB800
  claimed: '#27AE60',
};

// Fondos de tarjeta — tints cálidos
const ROW_BG = {
  active:  'rgba(255,228,181,0.10)',
  pending: 'rgba(255,228,181,0.05)',
  ready:   'rgba(248,190,23,0.18)',
  claimed: 'rgba(39,174,96,0.09)',
};

// ── MissionIcon (emoji) ───────────────────────────────────────────────────────

function MissionIcon({ type, state, size, accentColor }) {
  const emoji = state === 'claimed' ? '🏆' : (TYPE_EMOJI[type] ?? '🌮');
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: 'rgba(255,228,181,0.12)',
      borderWidth: 2,
      borderColor: accentColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    }}>
      <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
    </View>
  );
}

// ── AnimatedProgressBar ───────────────────────────────────────────────────────

function AnimatedProgressBar({ fraction, fillColor }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: fraction,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fraction]);

  return (
    <View style={styles.barBg}>
      <Animated.View style={[
        styles.barFill,
        {
          backgroundColor: fillColor,
          width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        },
      ]} />
    </View>
  );
}

// ── ClaimedStamp ──────────────────────────────────────────────────────────────

function ClaimedStamp() {
  return (
    <View style={styles.claimedStamp}>
      <Text style={styles.claimedStampText}>✓ RECLAMADO</Text>
    </View>
  );
}

// ── MissionCard ───────────────────────────────────────────────────────────────

function MissionCard({ mission, onClaim, claiming }) {
  const { id, type, label, target, progress, reward, claimed } = mission;
  const fraction   = Math.min(progress / target, 1);
  const isComplete = fraction >= 1;
  const canClaim   = isComplete && !claimed;

  const state = claimed ? 'claimed' : canClaim ? 'ready' : fraction > 0 ? 'active' : 'pending';

  const accentColor = state === 'claimed' ? STATE_ACCENT.claimed
                    : state === 'ready'   ? STATE_ACCENT.ready
                    : (TYPE_ACCENT[type] ?? COLORS.turquesa);

  const borderColor  = TYPE_ACCENT[type] ?? COLORS.turquesa;
  const barFillColor = state === 'pending' ? `${BURLY}66` : accentColor;

  const pulseAnim     = useRef(new Animated.Value(0)).current;
  const claimAnim     = useRef(new Animated.Value(1)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const [rewardText, setRewardText] = useState('');
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    if (state === 'ready') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(0);
    }
  }, [state]);

  const handleClaim = () => {
    Animated.sequence([
      Animated.timing(claimAnim, { toValue: 0.92, duration: 80,  useNativeDriver: true }),
      Animated.timing(claimAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
      Animated.timing(claimAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start(() => {
      onClaim(id, (result) => {
        if (!result) return;
        const text = `+🪙${result.coinsAwarded}${result.diamondsAwarded > 0 ? ` +💎${result.diamondsAwarded}` : ''}`;
        setRewardText(text);
        setShowReward(true);
        Animated.sequence([
          Animated.timing(rewardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.delay(1200),
          Animated.timing(rewardOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setShowReward(false));
      });
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: ROW_BG[state], borderLeftColor: borderColor }]}>
      {state === 'ready' && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.pulseOverlay, { opacity: pulseAnim }]}
        />
      )}

      <MissionIcon type={type} state={state} size={40} accentColor={accentColor} />

      <View style={styles.cardContent}>
        <Text style={styles.cardLabel} numberOfLines={2}>{label}</Text>
        <AnimatedProgressBar fraction={fraction} fillColor={barFillColor} />
        <View style={styles.cardBottom}>
          {showReward ? (
            <Animated.Text style={[styles.rewardText, { opacity: rewardOpacity }]}>
              {rewardText}
            </Animated.Text>
          ) : claimed ? (
            <ClaimedStamp />
          ) : canClaim ? (
            <Animated.View style={{ transform: [{ scale: claimAnim }] }}>
              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleClaim}
                disabled={claiming}
                activeOpacity={0.85}
              >
                <Text style={styles.claimBtnText}>
                  +🪙{reward.coins}{reward.diamonds > 0 ? ` 💎${reward.diamonds}` : ''}{'  '}RECLAMAR
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Text style={styles.progressText}>
              {Math.min(progress, target)}/{target}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ── PageDots ──────────────────────────────────────────────────────────────────

function PageDots({ missions, activeIndex }) {
  return (
    <View style={styles.dotsRow}>
      {missions.map((m, i) => {
        const isActive = i === activeIndex;
        const dotColor = TYPE_ACCENT[m.type] ?? COLORS.turquesa;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              isActive
                ? { backgroundColor: dotColor, width: 16 }
                : { backgroundColor: 'rgba(222,184,135,0.35)', width: 6 },
            ]}
          />
        );
      })}
    </View>
  );
}

// ── MissionHeader ─────────────────────────────────────────────────────────────

function MissionHeader({ missions }) {
  const claimedCount   = missions.filter(m => m.claimed).length;
  const completedCount = missions.filter(m => m.progress >= m.target).length;

  const segmentColor = (i) => {
    if (i < claimedCount)   return STATE_ACCENT.claimed;
    if (i < completedCount) return STATE_ACCENT.ready;
    return 'rgba(222,184,135,0.3)';   // burlywood cálido para inactivos
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerEmoji}>🎯</Text>
        <Text style={styles.headerTitle}>MISIONES DEL DÍA</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.progressTrack}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.trackSegment, { backgroundColor: segmentColor(i) }]} />
          ))}
        </View>
        <Text style={styles.headerCount}>{claimedCount}/3</Text>
      </View>
    </View>
  );
}

// ── DailyMissionsWidget ───────────────────────────────────────────────────────

export default function DailyMissionsWidget({ userId }) {
  const [claiming, setClaiming] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const { flyCoins, particles, triggerCoinFly, onCoinArrived } = useCoinFly();

  const data           = useQuery(api.dailyMissions.getTodayMissions, userId ? { userId } : 'skip');
  const ensureMissions = useMutation(api.dailyMissions.ensureDailyMissions);
  const claimMission   = useMutation(api.dailyMissions.claimMission);

  useEffect(() => {
    if (userId) ensureMissions({ userId }).catch(() => {});
  }, [userId]);

  const handleClaim = async (missionId, onResult) => {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await claimMission({ userId, missionId });
      notifySuccess();
      if (result?.coinsAwarded > 0) {
        const t = getCoinPillFallback();
        triggerCoinFly({
          fromX: width / 2,
          fromY: height * 0.5,
          toX: t.x + t.w / 2,
          toY: t.y + t.h / 2,
          coins: result.coinsAwarded,
        });
      }
      onResult?.(result);
    } catch (e) {
      // silenciar — el query reactivo actualizará el estado
    } finally {
      setClaiming(false);
    }
  };

  if (!userId || !data) return null;

  const sorted = [...data.missions].sort((a, b) => {
    if (a.claimed !== b.claimed) return a.claimed ? 1 : -1;
    return (b.progress / b.target) - (a.progress / a.target);
  });

  return (
    <>
    <Modal
      visible={flyCoins.length > 0 || particles.length > 0}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <CoinFlyOverlay coins={flyCoins} particles={particles} onCoinArrived={onCoinArrived} />
    </Modal>
    <View style={styles.container}>
      <MissionHeader missions={data.missions} />
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MissionCard
            mission={item}
            onClaim={handleClaim}
            claiming={claiming}
          />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
          setActiveCard(idx);
        }}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: CARD_W, offset: CARD_W * i, index: i })}
      />
      <PageDots missions={sorted} activeIndex={activeCard} />
    </View>
    </>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#5C2A10',              // marrón cálido medio
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(139,69,19,0.7)',
    overflow: 'hidden',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(210,105,30,0.4)',  // separador chocolate
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerEmoji: {
    fontSize: 15,
  },
  headerTitle: {
    fontFamily: FONTS.display,
    color: GOLD,                              // #F8BE17 oro ceremonial
    fontSize: 13,
    letterSpacing: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 4,
  },
  trackSegment: {
    width: 20,
    height: 6,
    borderRadius: 3,
  },
  headerCount: {
    fontFamily: FONTS.display,
    color: AMBER,                             // #D2691E chocolate
    fontSize: 12,
  },

  // ── Card ──
  card: {
    width: CARD_W,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingVertical: 16,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: FONTS.bodyBold,
    color: 'rgba(255,228,181,0.92)',          // trigo cálido en lugar de blanco frío
    fontSize: 15,
    marginBottom: 10,
  },

  // Progress bar
  barBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(222,184,135,0.25)',  // burlywood cálido
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Bottom action row
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Claim button
  claimBtn: {
    backgroundColor: COLORS.cempasuchil,      // #FFB800
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  claimBtnText: {
    fontFamily: FONTS.bodyBold,
    color: '#1C0E06',                          // dark warm brown (mejor contraste que #13131F)
    fontSize: 13,
  },

  // Claimed stamp
  claimedStamp: {
    backgroundColor: 'rgba(39,174,96,0.14)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(39,174,96,0.35)',
  },
  claimedStampText: {
    fontFamily: FONTS.bodyBold,
    color: '#27AE60',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Progress text
  progressText: {
    fontFamily: FONTS.display,
    color: 'rgba(255,228,181,0.55)',           // trigo tenue
    fontSize: 12,
  },

  // Reward inline flash
  rewardText: {
    fontFamily: FONTS.display,
    color: GOLD,                               // #F8BE17
    fontSize: 15,
  },

  // Pulse overlay (estado listo)
  pulseOverlay: {
    backgroundColor: 'rgba(248,190,23,0.08)',  // gold warm glow
    borderRadius: 12,
  },

  // ── Dots ──
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
