import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  AdEventType,
  InterstitialAd,
  IS_MOCKED,
  TestIds,
} from "react-native-google-mobile-ads";

// ── REEMPLAZA con tu Unit ID de Interstitial de AdMob ────────────────────────
// TODO: Replace with real Ad Unit IDs from AdMob console
const ANDROID_INTERSTITIAL_ID = "ca-app-pub-4368195883573068/XXXXXXXXXX";
const IOS_INTERSTITIAL_ID     = "ca-app-pub-4368195883573068/XXXXXXXXXX";

const isProdIdReady = (id) => !id.includes("XXXXXXXXXX");

const INTERSTITIAL_ID = __DEV__ || !isProdIdReady(Platform.OS === "ios" ? IOS_INTERSTITIAL_ID : ANDROID_INTERSTITIAL_ID)
  ? TestIds.INTERSTITIAL
  : Platform.OS === "ios"
  ? IOS_INTERSTITIAL_ID
  : ANDROID_INTERSTITIAL_ID;

/**
 * Gestiona el ciclo de vida de un InterstitialAd.
 *
 * @returns {{
 *   ready: boolean,        // Ad cargado y listo para mostrarse
 *   available: boolean,    // Módulo nativo disponible (false en Expo Go)
 *   showAd: () => boolean
 * }}
 */
export function useInterstitialAd() {
  const [ready, setReady] = useState(false);
  const adRef      = useRef(null);
  const cleanupRef = useRef(null);

  const loadAd = () => {
    cleanupRef.current?.();

    if (IS_MOCKED) return;

    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;
    setReady(false);

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setReady(true);
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setTimeout(loadAd, 500);
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      setReady(false);
      setTimeout(loadAd, 5000);
    });

    cleanupRef.current = () => {
      unsubLoaded();
      unsubClosed();
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
   * @returns {boolean}  true si el anuncio pudo mostrarse.
   */
  const showAd = () => {
    if (IS_MOCKED || !ready || !adRef.current) return false;
    adRef.current.show();
    setReady(false);
    return true;
  };

  return { ready, available: !IS_MOCKED, showAd };
}
