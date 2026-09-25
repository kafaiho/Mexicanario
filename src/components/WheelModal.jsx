import { useQuery } from 'convex/react';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { serverErrorText } from '../utils/serverError';
import useCoinFly from '../hooks/useCoinFly';
import useDiamondFly from '../hooks/useDiamondFly';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { presentMexicanarioPlusPaywall } from '../services/RevenueCatService';
import { hasPermission, scheduleWheelReady } from '../services/notificationService';
import { playSound } from '../utils/soundManager';
import { notifySuccess, tapHeavy, tapLight, tick } from '../services/haptics';
import { REAL_HEIGHT, REAL_WIDTH, TABLET_MODE } from '../utils/tabletSetup';
import CoinFlyOverlay from './CoinFlyOverlay';
import DiamondFlyOverlay from './DiamondFlyOverlay';
import { useUserMutation } from "../hooks/useUserMutation";

const { width, height } = Dimensions.get('window');

// ─── Prize segments ────────────────────────────────────────────────────────────
// 8 segments, 45° each, listed clockwise starting from the TOP of the wheel image.
// El premio lo elige y lo paga el servidor (convex/rewards.ts WHEEL_SEGMENTS, mismo orden).
const SEGMENTS = [
  { label: '💎 3', coins: 0, emoji: '💎', type: 'diamond', diamonds: 3 },
  { label: '60', coins: 60, emoji: '🪙', type: 'coins' },
  { label: '40', coins: 40, emoji: '🪙', type: 'coins' },
  { label: '💎 1', coins: 0, emoji: '💎', type: 'diamond', diamonds: 1 },
  { label: '70', coins: 70, emoji: '🪙', type: 'coins' },
  { label: '30', coins: 30, emoji: '🪙', type: 'coins' },
  { label: '💎 5', coins: 0, emoji: '💎', type: 'diamond', diamonds: 5 },
  { label: '45', coins: 45, emoji: '🪙', type: 'coins' },
];

const NUM_SEGMENTS = SEGMENTS.length;          // 8
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;       // 45°
const SPIN_ROTATIONS = 6;                        // full rotations before landing
const SPIN_MS = 4000;
const MIN_TICK_GAP_MS = 45;                      // al inicio gira muy rápido: no saturar la vibración

/**
 * Momentos (ms) en que la flecha cruza un borde de segmento, para un giro de
 * `deltaDeg` con Easing.out(Easing.cubic): p(t) = 1 - (1 - t)^3  ⇒  t = 1 - (1 - p)^(1/3).
 * Al frenar, los tics se espacian cada vez más (suspenso de tragamonedas).
 */
function segmentTickTimes(startDeg, deltaDeg) {
  const times = [];
  let last = -Infinity;
  const firstBoundary = Math.ceil(startDeg / SEGMENT_ANGLE) * SEGMENT_ANGLE;
  for (let b = firstBoundary; b < startDeg + deltaDeg; b += SEGMENT_ANGLE) {
    const p = (b - startDeg) / deltaDeg;
    const t = (1 - Math.cbrt(1 - p)) * SPIN_MS;
    if (t - last >= MIN_TICK_GAP_MS) {
      times.push(t);
      last = t;
    }
  }
  return times;
}

const getCoinPillFallback = () => {
  const topPad = Platform.OS === 'ios' ? 52 : 36;
  const pillH = 36;
  const pillW = 110;
  const pillX = REAL_WIDTH - 16 - pillW;  // top-right of real screen
  return { x: pillX, y: topPad, w: pillW, h: pillH };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCooldown(ms) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}h ${m}m`;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function WheelModal({ visible, onClose, onOpenShop }) {
  const { userId } = useAuth();
  const spinWheel = useUserMutation(api.rewards.spinWheel);
  const rewardState = useQuery(api.rewards.getRewardState, userId ? { userId } : 'skip');
  const freeReadyAt = rewardState?.wheel?.freeReadyAt ?? 0;
  const adSpinsLeft = rewardState?.wheel?.adSpinsLeft ?? 0;
  const requestingRef = useRef(false);
  const { flyCoins, particles, triggerCoinFly, onCoinArrived } = useCoinFly();
  const { flyDiamonds, diamondParticles, triggerDiamondFly, onDiamondArrived } = useDiamondFly();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const currentDeg = useRef(0); // tracks real current rotation degree

  const { ready: adReady, showAd } = useRewardedAd();
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState(null);   // segment index when done
  const [cooldownMs, setCooldownMs] = useState(0);
  const tickRef = useRef(null);
  const spinTickTimers = useRef([]);
  useEffect(() => () => spinTickTimers.current.forEach(clearTimeout), []);
  const cooldownEndsAtRef = useRef(0);

  // Cuenta regresiva del giro gratis (la hora la guarda el servidor)
  useEffect(() => {
    if (!visible) return undefined;
    cooldownEndsAtRef.current = freeReadyAt;
    const remaining = Math.max(0, freeReadyAt - Date.now());
    setCooldownMs(remaining);
    if (remaining > 0) startTick();
    return () => clearInterval(tickRef.current);
  }, [visible, freeReadyAt]); // eslint-disable-line react-hooks/exhaustive-deps

  function startTick() {
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const remaining = Math.max(0, cooldownEndsAtRef.current - Date.now());
      setCooldownMs(remaining);
      if (remaining <= 0) clearInterval(tickRef.current);
    }, 1000);
  }

  function spin(segmentIndex) {
    if (spinning) return;
    setSpinning(true);
    setPrize(null);

    // Angle where this segment's center ends up at the top
    // Because the wheel rotates clockwise (+deg), the slice that ends up at the top
    // is actually the one going backwards from 360.
    const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.5); // ± half segment
    const targetDelta = SPIN_ROTATIONS * 360 + (360 - segmentIndex * SEGMENT_ANGLE) + jitter;
    const newDeg = currentDeg.current + targetDelta;

    spinAnim.setValue(currentDeg.current);
    playSound('wheel_spin'); // ← sonido de ruleta girando
    tapLight();

    // Tic háptico cada vez que la flecha pasa un segmento; los últimos, más marcados
    spinTickTimers.current.forEach(clearTimeout);
    const ticks = segmentTickTimes(currentDeg.current, targetDelta);
    spinTickTimers.current = ticks.map((t, i) =>
      setTimeout(i >= ticks.length - 3 ? tapLight : tick, t)
    );

    Animated.timing(spinAnim, {
      toValue: newDeg,
      duration: SPIN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async ({ finished }) => {
      if (!finished) return;
      currentDeg.current = newDeg % 360; // normalize
      setSpinning(false);
      setPrize(segmentIndex);
      playSound('celebration'); // ← fanfarria al ganar premio
      tapHeavy();
      setTimeout(notifySuccess, 120);

      // El servidor ya pagó el premio; aquí solo vuelan las monedas
      const seg = SEGMENTS[segmentIndex];
      if (seg.type === 'coins') {
        const t = getCoinPillFallback();
        triggerCoinFly({
          fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
          fromY: TABLET_MODE ? REAL_HEIGHT * 0.45 : height * 0.38,
          toX: t.x + t.w / 2,
          toY: t.y + t.h / 2,
          coins: seg.coins,
        });
      } else if (seg.type === 'diamond') {
        // Fallback assuming diamond pill is near the coin pill, slightly offset
        const t = getCoinPillFallback();
        triggerDiamondFly({
          fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
          fromY: TABLET_MODE ? REAL_HEIGHT * 0.45 : height * 0.38,
          toX: t.x - 50, // Ajuste aproximado asumiendo que diamantes están al lado derecho
          toY: t.y + t.h / 2,
          diamonds: seg.diamonds,
        });
      }
    });
  }

  // Pide el giro al servidor (elige el premio y lleva el cooldown) y anima hasta él
  async function requestSpin(mode) {
    if (spinning || requestingRef.current || !userId) return false;
    requestingRef.current = true;
    try {
      const r = await spinWheel({ userId, mode });
      spin(r.segmentIndex);
      return true;
    } catch (e) {
      Alert.alert('🎡 Ruleta', serverErrorText(e, 'No se pudo girar la ruleta. Intenta de nuevo.'));
      return false;
    } finally {
      requestingRef.current = false;
    }
  }

  async function handleFreeSpin() {
    if (spinning || cooldownMs > 0) return;
    if (!(await requestSpin('free'))) return;
    // Notificar cuando la ruleta esté lista de nuevo
    if (await hasPermission()) scheduleWheelReady().catch(() => { });
  }

  function handleAdSpin() {
    if (spinning || adSpinsLeft <= 0) return;
    const shown = showAd(() => { requestSpin('ad'); });
    if (!shown) {
      Alert.alert('📺 Anuncio no disponible', 'El anuncio aún no cargó. Inténtalo en un momento.', [{ text: 'OK' }]);
    }
  }

  function handleClose() {
    if (spinning) return;
    setPrize(null);
    onClose();
  }

  // spinAnim stores real degree values — map linearly to CSS deg string
  const spinInterpolated = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const wonPrize = prize !== null ? SEGMENTS[prize] : null;
  const canFreeSpin = !spinning && cooldownMs <= 0;
  const cooldownLabel = formatCooldown(cooldownMs);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Close */}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            disabled={spinning}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {/* Wheel */}
          <View style={styles.wheelContainer}>
            {/* Pointer triangle at top */}
            <View style={styles.pointer} />

            <Animated.View style={[styles.wheelImageContainer, { transform: [{ rotate: spinInterpolated }] }]}>
              <Image
                source={require('../../assets/images/wheel.webp')}
                style={styles.wheelImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Prize result */}
          {wonPrize && !spinning && (
            <View style={styles.prizeBox}>
              <Text style={styles.prizeEmoji}>{wonPrize.emoji}</Text>
              <Text style={styles.prizeText}>
                {wonPrize.type === 'coins'
                  ? `+${wonPrize.coins} monedas`
                  : `+${wonPrize.diamonds} diamante${wonPrize.diamonds > 1 ? 's' : ''}`}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttons}>
            {/* Free spin button */}
            <TouchableOpacity
              style={[styles.spinButton, !canFreeSpin && styles.spinButtonDisabled]}
              onPress={handleFreeSpin}
              disabled={!canFreeSpin}
              activeOpacity={canFreeSpin ? 0.8 : 1}
            >
              {canFreeSpin ? (
                <Text style={styles.spinButtonText}>Gratis</Text>
              ) : (
                <Text style={styles.spinButtonText}>
                  {spinning ? 'Girando...' : `⏳ ${cooldownLabel}`}
                </Text>
              )}
            </TouchableOpacity>

            {/* Ad spin button — visible solo cuando hay cooldown y el anuncio está listo */}
            {cooldownMs > 0 && adSpinsLeft > 0 && (
              <TouchableOpacity
                style={[styles.adButton, { backgroundColor: adReady ? '#1a7a3c' : '#555', marginBottom: 8 }]}
                onPress={handleAdSpin}
                disabled={!adReady || spinning}
                activeOpacity={0.8}
              >
                <Text style={styles.adButtonText}>
                  {adReady ? '📺 Ver anuncio — giro extra' : '⏳ Cargando anuncio...'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Mexicanario Plus button */}
            <TouchableOpacity
              style={styles.adButton}
              onPress={() => { onClose(); presentMexicanarioPlusPaywall(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.adButtonText}>⭐ Mexicanario Plus — $4.99 USD/mes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fly overlays */}
        <CoinFlyOverlay coins={flyCoins} particles={particles} onCoinArrived={onCoinArrived} />
        <DiamondFlyOverlay diamonds={flyDiamonds} particles={diamondParticles} onDiamondArrived={onDiamondArrived} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.74)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: width * 0.9,
    alignItems: 'center',
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: (width * 0.1) / 2,
    backgroundColor: '#e64a33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cf3b2d',
    zIndex: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: width * 0.08,
    fontWeight: 'bold',
    lineHeight: width * 0.09,
  },

  wheelContainer: {
    width: width * 0.75,
    height: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  pointer: {
    position: 'absolute',
    top: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F59B40',
    zIndex: 10,
  },
  wheelImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelImage: {
    width: '100%',
    height: '100%',
  },

  // Prize display
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
  },
  prizeEmoji: { fontSize: 28 },
  prizeText: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },

  // Buttons
  buttons: { width: '100%', alignItems: 'center', gap: 10 },
  spinButton: {
    backgroundColor: '#F59B40',
    paddingHorizontal: width * 0.22,
    paddingVertical: height * 0.02,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 40,
  },
  spinButtonDisabled: {
    backgroundColor: '#888',
    borderColor: '#aaa',
  },
  spinButtonText: {
    color: 'white',
    fontSize: width * 0.05,
    fontWeight: 'bold',
  },
  adButton: {
    backgroundColor: '#3a3a8c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  adButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
