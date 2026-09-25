import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import mobileAds, {
  BannerAd,
  BannerAdSize,
  IS_MOCKED,
  TestIds,
} from "react-native-google-mobile-ads";
import useShopSignals from "../hooks/useShopSignals";

// ── REEMPLAZA con tus Unit IDs de Banner de AdMob ────────────────────────────
// Los encuentras en: AdMob Console → Tu app → Bloques de anuncios → Banner
const ANDROID_BANNER_ID = "ca-app-pub-4368195883573068/7914244761";
const IOS_BANNER_ID     = "ca-app-pub-4368195883573068/6241924651";

const getBannerId = () =>
  __DEV__
    ? TestIds.BANNER
    : Platform.OS === "ios"
    ? IOS_BANNER_ID
    : ANDROID_BANNER_ID;

// IS_MOCKED viene del mock (Expo Go). En build nativo es undefined (falsy).
export const ADS_AVAILABLE = !IS_MOCKED;

// Clave AsyncStorage compartida con AdRemovalModal
export const AD_FREE_KEY = "@mexicanario:adFreeUntil";

/**
 * Banner AdMob. En Expo Go no se muestra nada (mock silencioso).
 * En build nativo muestra el banner real.
 * Se oculta con Mexicanario Plus o cuando el timer "sin anuncios" está activo.
 */
export default function AdBanner({ style }) {
  const [show, setShow] = useState(false);
  const signals = useShopSignals();
  const isPlusActive = !!signals?.mexPlusActive;

  useEffect(() => {
    if (!ADS_AVAILABLE) return;
    AsyncStorage.getItem(AD_FREE_KEY).then((adFreeVal) => {
      const adFreeActive = adFreeVal && Date.now() < parseInt(adFreeVal, 10);
      setShow(!adFreeActive);
    });
  }, []);

  // Mientras carga el estado de Plus no se muestra nada, para no enseñarle un anuncio a quien pagó
  if (!ADS_AVAILABLE || !show || !signals || isPlusActive) return null;

  return (
    <View style={[{ alignItems: "center" }, style]}>
      <BannerAd
        unitId={getBannerId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setShow(false)}
      />
    </View>
  );
}
