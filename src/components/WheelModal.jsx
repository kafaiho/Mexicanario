import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from 'convex/react';
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
import useCoinFly from '../hooks/useCoinFly';
import useDiamondFly from '../hooks/useDiamondFly';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { presentMexicanarioPlusPaywall } from '../services/RevenueCatService';
import { hasPermission, scheduleWheelReady } from '../services/notificationService';
import { playSound } from '../utils/soundManager';
import { REAL_HEIGHT, REAL_WIDTH, TABLET_MODE } from '../utils/tabletSetup';
import CoinFlyOverlay from './CoinFlyOverlay';
import DiamondFlyOverlay from './DiamondFlyOverlay';
import { useUserMutation } from "../hooks/useUserMutation";

const { width, height } = Dimensions.get('window');

// ─── Prize segments ────────────────────────────────────────────────────────────
// 8 segments, 45° each, listed clockwise starting from the TOP of the wheel image
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
const COOLDOWN_MS = 24 * 60 * 60 * 1000;     // 24 hours
const STORAGE_KEY = 'wheel_last_spin';

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
  const updateCurrency = useUserMutation(api.users.updateUserCurrency);
  const { flyCoins, particles, triggerCoinFly, onCoinArrived } = useCoinFly();
  const { flyDiamonds, diamondParticles, triggerDiamondFly, onDiamondArrived } = useDiamondFly();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const currentDeg = useRef(0); // tracks real current rotation degree

  const { ready: adReady, showAd } = useRewardedAd();
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState(null);   // segment index when done
  const [cooldownMs, setCooldownMs] = useState(0);
  const [adUsedThisSession, setAdUsedThisSession] = useState(false);
  const tickRef = useRef(null);
  const cooldownEndsAtRef = useRef(0);

  // Load cooldown on open
  useEffect(() => {
    if (!visible) return;
    checkCooldown();
    return () => clearInterval(tickRef.current);
  }, [visible]);

  async function checkCooldown() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        cooldownEndsAtRef.current = 0;
        setCooldownMs(0);
        return;
      }
      const last = parseInt(stored, 10);
      cooldownEndsAtRef.current = last + COOLDOWN_MS;
      const remaining = Math.max(0, cooldownEndsAtRef.current - Date.now());
      setCooldownMs(remaining);
      if (remaining > 0) startTick();
    } catch (_) { }
  }

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

    Animated.timing(spinAnim, {
      toValue: newDeg,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async ({ finished }) => {
      if (!finished) return;
      currentDeg.current = newDeg % 360; // normalize
      setSpinning(false);
      setPrize(segmentIndex);
      playSound('celebration'); // ← fanfarria al ganar premio

      // Give reward
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
      try {
        if (seg.type === 'coins') {
          await updateCurrency({ userId, coins: seg.coins, diamonds: 0 });
        } else if (seg.type === 'diamond') {
          await updateCurrency({ userId, coins: 0, diamonds: seg.diamonds });
        }
      } catch (e) {
        console.log('Wheel reward error:', e);
      }
    });
  }

  async function handleFreeSpin() {
    if (spinning || cooldownMs > 0) return;
    const idx = Math.floor(Math.random() * NUM_SEGMENTS);
    spin(idx);
    // Save cooldown
    const spunAt = Date.now();
    cooldownEndsAtRef.current = spunAt + COOLDOWN_MS;
    await AsyncStorage.setItem(STORAGE_KEY, spunAt.toString());
    setCooldownMs(COOLDOWN_MS);
    startTick();
    // Notificar cuando la ruleta esté lista de nuevo
    if (await hasPermission()) scheduleWheelReady().catch(() => { });
  }

  function handleAdSpin() {
    if (spinning || adUsedThisSession) return;
    const idx = Math.floor(Math.random() * NUM_SEGMENTS);
    const shown = showAd(() => {
      setAdUsedThisSession(true);
      spin(idx);
    });
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
            {cooldownMs > 0 && !adUsedThisSession && (
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
