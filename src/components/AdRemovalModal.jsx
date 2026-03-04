import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RewardedAd, RewardedAdEventType, TestIds } from "react-native-google-mobile-ads";
import { AD_FREE_KEY, ADS_AVAILABLE } from "./AdBanner"; // ADS_AVAILABLE = !IS_MOCKED

// ── REEMPLAZA con tus Unit IDs de Rewarded de AdMob ──────────────────────────
const ANDROID_REWARDED_ID = "ca-app-pub-4368195883573068/2302679645";
const IOS_REWARDED_ID     = "ca-app-pub-4368195883573068/4885590894";

const getRewardedId = () =>
  __DEV__
    ? TestIds.REWARDED
    : Platform.OS === "ios"
    ? IOS_REWARDED_ID
    : ANDROID_REWARDED_ID;

const AD_FREE_DURATION_MS = 10 * 60 * 1000; // 10 minutos

export default function AdRemovalModal({ visible, onClose, onAdFreeActivated }) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const rewardedRef = useRef(null);

  useEffect(() => {
    if (!visible || !ADS_AVAILABLE) return;

    const rewarded = RewardedAd.createForAdRequest(getRewardedId(), {
      requestNonPersonalizedAdsOnly: false,
    });
    rewardedRef.current = rewarded;
    setAdLoaded(false);
    setLoading(true);

    const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdLoaded(true);
      setLoading(false);
    });

    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        const until = Date.now() + AD_FREE_DURATION_MS;
        AsyncStorage.setItem(AD_FREE_KEY, String(until));
        onAdFreeActivated?.();
        onClose();
      }
    );

    rewarded.load();

    return () => {
      unsubLoaded();
      unsubEarned();
    };
  }, [visible]);

  const handleWatchAd = () => {
    if (adLoaded && rewardedRef.current) {
      rewardedRef.current.show();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Sin Anuncios</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.adOption}>
              <Text style={styles.adEmoji}>🎬</Text>
              <Text style={styles.adDuration}>10 minutos sin anuncios</Text>
              <Text style={styles.adDesc}>
                Mira un video corto y disfruta sin interrupciones
              </Text>

              {!ADS_AVAILABLE ? (
                <View style={styles.adButtonDisabledWrap}>
                  <Text style={styles.unavailableText}>
                    Disponible en la versión instalada
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.adButton, !adLoaded && styles.adButtonDisabled]}
                  onPress={handleWatchAd}
                  disabled={!adLoaded}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.adButtonText}>
                      {adLoaded ? "Ver anuncio" : "Cargando..."}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#FFE4B5",
    borderRadius: 20,
    padding: 20,
    width: "82%",
    borderWidth: 4,
    borderColor: "#8B4513",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#8B4513",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    alignItems: "center",
  },
  adOption: {
    backgroundColor: "#F5DEB3",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D2691E",
    width: "100%",
    gap: 8,
  },
  adEmoji: {
    fontSize: 48,
  },
  adDuration: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#8B4513",
    textAlign: "center",
  },
  adDesc: {
    fontSize: 13,
    color: "#9A6030",
    textAlign: "center",
    marginBottom: 4,
  },
  adButton: {
    backgroundColor: "#32CD32",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#228B22",
    minWidth: 140,
    alignItems: "center",
  },
  adButtonDisabled: {
    backgroundColor: "#A0A0A0",
    borderColor: "#707070",
  },
  adButtonDisabledWrap: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#E0C895",
    borderRadius: 12,
    alignItems: "center",
  },
  unavailableText: {
    color: "#8B4513",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
  adButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
