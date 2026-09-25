import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
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
import { api } from "../../convex/_generated/api";
import useCoinFly from '../hooks/useCoinFly';
import { notifySuccess } from "../services/haptics";
import { COLORS, FONTS } from "../theme/designTokens";
import { REAL_HEIGHT, REAL_WIDTH, TABLET_MODE } from "../utils/tabletSetup";
import CoinFlyOverlay from './CoinFlyOverlay';
import { useUserMutation } from "../hooks/useUserMutation";

const { width, height } = Dimensions.get('window');

const getCoinPillFallback = () => {
  const topPad = Platform.OS === 'ios' ? height * 0.058 : height * 0.04;
  const pillH = 36;
  const pillW = 110;
  const pillX = REAL_WIDTH - 16 - pillW;
  return { x: pillX, y: topPad, w: pillW, h: pillH };
};
const CARD_W = Math.min(REAL_WIDTH - 24, 680);

// ── Paleta Mexicanometro ───────────────────────────────────────────────────────
const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD = '#F8BE17';
const BURLY = '#DEB887';

// ── Identidad por tipo de misión ─────────────────────────────────────────────
// Gradiente de temperatura: fresco (aprender) → cálido (acción) → fuego (racha)
const TYPE_ACCENT = {
  words: COLORS.turquesa,  // #00B2A9 — fresco/aprender
  combo: '#FF922B',        // ámbar-naranja cálido (coherente con la paleta warm)
  streak: COLORS.copal,     // #FF6B35 — fuego/racha
};

// Íconos en el mismo lenguaje cultural de Mexicanometro
const TYPE_EMOJI = {
  words: '🌮',  // el taco = vocabulario mexicano
  combo: '⚡',  // relámpago = combo rápido
  streak: '🔥',  // fuego = racha
};

// Estados especiales (listo / reclamado)
const STATE_ACCENT = {
  ready: COLORS.cempasuchil,  // #FFB800
  claimed: '#27AE60',
};

// Fondos de tarjeta — tints cálidos
const ROW_BG = {
  active: 'rgba(255,228,181,0.10)',
  pending: 'rgba(255,228,181,0.05)',
  ready: 'rgba(248,190,23,0.18)',
  claimed: 'rgba(39,174,96,0.09)',
};

// ── MissionMedal: medallón 3-D (mismo lenguaje que los nodos del mapa) ────────

function MissionMedal({ type, state, accentColor, reduceMotion }) {
  const emoji = state === 'claimed' ? '🏆' : (TYPE_EMOJI[type] ?? '🌮');
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'ready' || reduceMotion) { bob.setValue(0); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: -3, duration: 450, useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [state, reduceMotion, bob]);

  return (
    <Animated.View style={[styles.medal, { borderColor: accentColor, borderBottomColor: shade(accentColor), transform: [{ translateY: bob }] }]}>
      <Text style={styles.medalEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

// Oscurece un color #RRGGBB para el borde inferior 3-D
function shade(hex, factor = 0.65) {
  const v = hex.replace('#', '');
  if (v.length !== 6) return hex;
  return '#' + [0, 2, 4].map((i) => Math.floor(parseInt(v.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')).join('');
}

// Tiempo hasta que se renuevan (medianoche UTC, igual que el servidor)
function useResetCountdown() {
  const calc = () => {
    const now = new Date();
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    const mins = Math.max(0, Math.round((next - now.getTime()) / 60000));
    const h = Math.floor(mins / 60);
    return h > 0 ? `${h} h ${mins % 60} min` : `${mins} min`;
  };
  const [text, setText] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setText(calc()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return text;
}

// ── AnimatedProgressBar ───────────────────────────────────────────────────────

function AnimatedProgressBar({ fraction, fillColor, label }) {
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
      <View style={styles.barShine} pointerEvents="none" />
      {label ? <Text style={styles.barLabel}>{label}</Text> : null}
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

function MissionCard({ mission, onClaim, claiming, reduceMotion }) {
  const { id, type, label, target, progress, reward, claimed } = mission;
  const fraction = Math.min(progress / target, 1);
  const isComplete = fraction >= 1;
  const canClaim = isComplete && !claimed;

  const state = claimed ? 'claimed' : canClaim ? 'ready' : fraction > 0 ? 'active' : 'pending';

  const accentColor = state === 'claimed' ? STATE_ACCENT.claimed
    : state === 'ready' ? STATE_ACCENT.ready
      : (TYPE_ACCENT[type] ?? COLORS.turquesa);

  const borderColor = TYPE_ACCENT[type] ?? COLORS.turquesa;
  const barFillColor = state === 'pending' ? `${BURLY}66` : accentColor;

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const claimAnim = useRef(new Animated.Value(1)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const [rewardText, setRewardText] = useState('');
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    if (state === 'ready' && !reduceMotion) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(0);
    }
  }, [state, reduceMotion]);

  const handleClaim = () => {
    Animated.sequence([
      Animated.timing(claimAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(claimAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
      Animated.timing(claimAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
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

  const rewardChip = `🪙 ${reward.coins}${reward.diamonds > 0 ? `  💎 ${reward.diamonds}` : ''}`;

  return (
    <View style={styles.cardSlot}>
      <View
        style={[styles.card, { backgroundColor: ROW_BG[state], borderColor: `${borderColor}88`, opacity: claimed ? 0.8 : 1 }]}
        accessible
        accessibilityLabel={`${label}. ${claimed ? 'Reclamada' : canClaim ? 'Lista para reclamar' : `${Math.min(progress, target)} de ${target}`}. Premio ${reward.coins} monedas${reward.diamonds ? ` y ${reward.diamonds} diamantes` : ''}.`}
      >
        {state === 'ready' && (
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, styles.pulseOverlay, { opacity: pulseAnim }]}
          />
        )}

        <MissionMedal type={type} state={state} accentColor={accentColor} reduceMotion={reduceMotion} />

        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel} numberOfLines={1}>{label}</Text>
            {!claimed && <Text style={styles.rewardChip}>{rewardChip}</Text>}
          </View>

          {canClaim || showReward ? null : (
            <AnimatedProgressBar
              fraction={fraction}
              fillColor={barFillColor}
              label={claimed ? null : `${Math.min(progress, target)}/${target}`}
            />
          )}

          <View style={styles.cardBottom}>
            {showReward ? (
              <Animated.Text style={[styles.rewardText, { opacity: rewardOpacity }]}>
                {rewardText}
              </Animated.Text>
            ) : claimed ? (
              <ClaimedStamp />
            ) : canClaim ? (
              <Animated.View style={{ transform: [{ scale: claimAnim }], alignSelf: 'stretch' }}>
                <TouchableOpacity
                  style={styles.claimBtn}
                  onPress={handleClaim}
                  disabled={claiming}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Reclamar ${reward.coins} monedas`}
                >
                  <Text style={styles.claimBtnText}>¡RECLAMAR {rewardChip}!</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

// ── PageDots: cada punto muestra el estado de su misión ───────────────────────

function PageDots({ missions, activeIndex }) {
  return (
    <View style={styles.dotsRow}>
      {missions.map((m, i) => {
        const isActive = i === activeIndex;
        const dotColor = m.claimed ? STATE_ACCENT.claimed
          : m.progress >= m.target ? STATE_ACCENT.ready
            : (TYPE_ACCENT[m.type] ?? COLORS.turquesa);
        return (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: isActive ? dotColor : `${dotColor}55`, width: isActive ? 18 : 7 },
            ]}
          />
        );
      })}
    </View>
  );
}

// ── MissionHeader ─────────────────────────────────────────────────────────────

function MissionHeader({ missions }) {
  const resetIn = useResetCountdown();
  const claimedCount = missions.filter(m => m.claimed).length;
  const completedCount = missions.filter(m => m.progress >= m.target).length;

  const segmentColor = (i) => {
    if (i < claimedCount) return STATE_ACCENT.claimed;
    if (i < completedCount) return STATE_ACCENT.ready;
    return 'rgba(222,184,135,0.3)';   // burlywood cálido para inactivos
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerEmoji}>🎯</Text>
        <View>
          <Text style={styles.headerTitle}>MISIONES DEL DÍA</Text>
          <Text style={styles.headerSub}>⏳ Nuevas en {resetIn}</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.progressTrack}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.trackSegment, { backgroundColor: segmentColor(i) }]} />
          ))}
        </View>
        <Text style={styles.headerCount}>{claimedCount === 3 ? '🏆' : `${claimedCount}/3`}</Text>
      </View>
    </View>
  );
}

// ── DailyMissionsWidget ───────────────────────────────────────────────────────

export default function DailyMissionsWidget({ userId }) {
  const [claiming, setClaiming] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);
  const { flyCoins, particles, triggerCoinFly, onCoinArrived } = useCoinFly();

  const data = useQuery(api.dailyMissions.getTodayMissions, userId ? { userId } : 'skip');
  const ensureMissions = useUserMutation(api.dailyMissions.ensureDailyMissions);
  const claimMission = useUserMutation(api.dailyMissions.claimMission);

  useEffect(() => {
    if (userId) ensureMissions({ userId }).catch(() => { });
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
          fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
          fromY: TABLET_MODE ? REAL_HEIGHT * 0.5 : height * 0.5,
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
              reduceMotion={reduceMotion}
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
    width: CARD_W,
    alignSelf: 'center',
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
    paddingBottom: 6,
    marginBottom: 2,
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

  headerSub: {
    fontFamily: FONTS.bodyBold,
    color: 'rgba(255,228,181,0.6)',
    fontSize: 10,
    marginTop: 1,
  },

  // ── Card ──
  cardSlot: {
    width: CARD_W,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: 'hidden',
    minHeight: 76,
  },
  medal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,228,181,0.14)',
    borderWidth: 2.5,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medalEmoji: { fontSize: 24 },
  cardContent: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 7,
  },
  cardLabel: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    color: '#FFE4B5',
    fontSize: 15,
  },
  rewardChip: {
    fontFamily: FONTS.display,
    color: GOLD,
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  // Progress bar (gruesa, con conteo encima)
  barBg: {
    width: '100%',
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
  },
  barShine: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  barLabel: {
    fontFamily: FONTS.display,
    color: '#FFF8E7',
    fontSize: 11,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Bottom action row
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Botón reclamar con relieve (como los botones del juego)
  claimBtn: {
    backgroundColor: COLORS.cempasuchil,
    borderRadius: 12,
    borderBottomWidth: 4,
    borderBottomColor: '#B7791F',
    paddingVertical: 8,
    alignItems: 'center',
  },
  claimBtnText: {
    fontFamily: FONTS.display,
    color: '#1C0E06',
    fontSize: 14,
    letterSpacing: 0.5,
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

  // Reward inline flash
  rewardText: {
    fontFamily: FONTS.display,
    color: GOLD,
    fontSize: 17,
  },

  // Pulse overlay (estado listo)
  pulseOverlay: {
    backgroundColor: 'rgba(248,190,23,0.10)',
    borderRadius: 12,
  },

  // ── Dots ──
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
    gap: 5,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
});
