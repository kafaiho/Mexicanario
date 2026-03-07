import React from 'react';
import { notifySuccess, comboBurst } from '../services/haptics';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import CoinFlyOverlay from './CoinFlyOverlay';
import useCoinFly from '../hooks/useCoinFly';
import { REAL_WIDTH, REAL_HEIGHT, TABLET_MODE } from '../utils/tabletSetup';

const { width, height } = Dimensions.get('window');

const TACOS_PER_REWARD = 12;
const REWARD_COINS = 100;

const getCoinPillFallback = () => {
  const topPad = Platform.OS === 'ios' ? height * 0.058 : height * 0.04;
  const pillH  = 36;
  const pillW  = 110;
  const pillX  = REAL_WIDTH - 16 - pillW;
  return { x: pillX, y: topPad, w: pillW, h: pillH };
};

export default function GiftModel({ visible, onClose }) {
  const { user, userId } = useAuth();
  const claimGift = useMutation(api.shop.claimGiftReward);
  const { flyCoins, particles, triggerCoinFly, onCoinArrived } = useCoinFly();

  if (!visible) return null;

  const tacos = user?.tacos ?? 0;
  const tacosNeeded = Math.max(0, TACOS_PER_REWARD - tacos);
  const canClaim = tacos >= TACOS_PER_REWARD;

  async function handleClaim() {
    if (!canClaim || !userId) return;
    try {
      const result = await claimGift({ userId });
      comboBurst(5);
      const t = getCoinPillFallback();
      triggerCoinFly({
        fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
        fromY: TABLET_MODE ? REAL_HEIGHT * 0.5 : height * 0.52,
        toX: t.x + t.w / 2,
        toY: t.y + t.h / 2,
        coins: result.coinsAwarded ?? REWARD_COINS,
        onAllArrived: () => onClose(),
      });
    } catch (e) {
      onClose();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Gift image */}
          <Image
            source={require('../../assets/images/gift.png')}
            style={s.giftImage}
            resizeMode="contain"
          />

          {/* Message */}
          <Text style={s.message}>
            {canClaim
              ? `¡Tienes ${TACOS_PER_REWARD} 🌮 por canjear!\nReclama tu recompensa:`
              : `¡Consigue ${tacosNeeded} 🌮 mas para reclamar esta recompensa!`}
          </Text>

          {/* Taco progress */}
          <Text style={s.tacoProgress}>
            {Math.min(tacos, TACOS_PER_REWARD)} / {TACOS_PER_REWARD} 🌮
          </Text>

          {/* Reward info */}
          <View style={s.rewardRow}>
            <Image
              source={require('../../assets/icons/coin.png')}
              style={s.rewardIcon}
            />
            <Text style={s.rewardText}>+{REWARD_COINS} monedas</Text>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[s.ctaBtn, !canClaim && s.ctaBtnDisabled]}
            onPress={canClaim ? handleClaim : () => onClose()}
            activeOpacity={0.85}
          >
            <Text style={s.ctaBtnText}>
              {canClaim ? '¡Reclamar!' : '¡Vamos!'}
            </Text>
          </TouchableOpacity>

          {/* Close button */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
      <CoinFlyOverlay coins={flyCoins} particles={particles} onCoinArrived={onCoinArrived} />
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFE4B5',
    borderRadius: width * 0.06,
    width: width * 0.85,
    paddingTop: height * 0.04,
    paddingBottom: height * 0.03,
    paddingHorizontal: width * 0.06,
    alignItems: 'center',
    borderWidth: width * 0.01,
    borderColor: '#8B4513',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  giftImage: {
    width: width * 0.35,
    height: width * 0.35,
    marginBottom: height * 0.02,
  },
  message: {
    fontSize: width * 0.048,
    fontWeight: '800',
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: height * 0.025,
    lineHeight: width * 0.065,
  },
  tacoProgress: {
    fontSize: width * 0.055,
    fontWeight: '900',
    color: '#E05C7A',
    marginBottom: height * 0.015,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.02,
    marginBottom: height * 0.02,
  },
  rewardIcon: {
    width: width * 0.08,
    height: width * 0.08,
    resizeMode: 'contain',
  },
  rewardText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#D2691E',
  },
  ctaBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: width * 0.04,
    paddingVertical: height * 0.022,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnDisabled: {
    backgroundColor: '#4CAF50',
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: width * 0.06,
    fontWeight: '900',
  },
  closeBtn: {
    marginTop: height * 0.015,
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    backgroundColor: '#E05C7A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: width * 0.07,
    fontWeight: 'bold',
    lineHeight: width * 0.08,
  },
});
