import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  IS_MOCKED,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

// ── REEMPLAZA con tu Unit ID de Rewarded de AdMob ────────────────────────────
const ANDROID_REWARDED_ID = "ca-app-pub-4368195883573068/2302679645";
const IOS_REWARDED_ID     = "ca-app-pub-4368195883573068/4885590894";

const REWARDED_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.OS === "ios"
  ? IOS_REWARDED_ID
  : ANDROID_REWARDED_ID;

/**
 * Gestiona el ciclo de vida de un RewardedAd.
 *
 * @returns {{
 *   ready: boolean,        // Ad cargado y listo para mostrarse
 *   available: boolean,    // Módulo nativo disponible (false en Expo Go)
 *   showAd: (onReward: () => void) => boolean
 * }}
 */
export function useRewardedAd() {
  const [ready, setReady] = useState(false);
  const adRef       = useRef(null);
  const onRewardRef = useRef(null);
  const cleanupRef  = useRef(null);

  const loadAd = () => {
    // Limpiar listeners anteriores
    cleanupRef.current?.();

    if (IS_MOCKED) return;

    const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;
    setReady(false);

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setReady(true);
    });

    const unsubEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        onRewardRef.current?.();
        onRewardRef.current = null;
        // Pre-cargar el siguiente anuncio
        setTimeout(loadAd, 500);
      }
    );

    const unsubError = ad.addAdEventListener(RewardedAdEventType.ERROR, () => {
      setReady(false);
      setTimeout(loadAd, 5000); // reintentar en 5 segundos
    });

    cleanupRef.current = () => {
      unsubLoaded();
      unsubEarned();
      unsubError();
    };

    ad.load();
  };

  useEffect(() => {
    loadAd();
    return () => cleanupRef.current?.();
  }, []);

  /**
   * Muestra el anuncio si está listo.
   * @param {() => void} onReward  Callback ejecutado cuando el usuario gana la recompensa.
   * @returns {boolean}  true si el anuncio pudo mostrarse.
   */
  const showAd = (onReward) => {
    if (IS_MOCKED || !ready || !adRef.current) return false;
    onRewardRef.current = onReward;
    adRef.current.show();
    setReady(false); // evitar doble press
    return true;
  };

  return { ready, available: !IS_MOCKED, showAd };
}
