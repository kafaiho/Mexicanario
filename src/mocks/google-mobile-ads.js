/**
 * Mock de react-native-google-mobile-ads para Expo Go (desarrollo).
 * En builds nativos (eas build) Metro usa el módulo real.
 * Exporta IS_MOCKED = true para que los componentes sepan que los anuncios no están disponibles.
 */

// Stubs que no hacen nada
function BannerAd() { return null; }

const BannerAdSize = {
  BANNER: "BANNER",
  LARGE_BANNER: "LARGE_BANNER",
  MEDIUM_RECTANGLE: "MEDIUM_RECTANGLE",
  FULL_BANNER: "FULL_BANNER",
  LEADERBOARD: "LEADERBOARD",
  ADAPTIVE_BANNER: "ADAPTIVE_BANNER",
  ANCHORED_ADAPTIVE_BANNER: "ANCHORED_ADAPTIVE_BANNER",
};

const TestIds = {
  BANNER:        "ca-app-pub-3940256099942544/6300978111",
  INTERSTITIAL:  "ca-app-pub-3940256099942544/1033173712",
  REWARDED:      "ca-app-pub-3940256099942544/5224354917",
};

class RewardedAd {
  static createForAdRequest() { return new RewardedAd(); }
  addAdEventListener()        { return () => {}; }
  load()                      {}
  show()                      {}
}

const RewardedAdEventType = {
  LOADED:        "loaded",
  EARNED_REWARD: "earned_reward",
  ERROR:         "error",
};

function mobileAds() {
  return {
    initialize:               () => Promise.resolve([]),
    setRequestConfiguration:  () => Promise.resolve(),
  };
}

export const IS_MOCKED = true;

export default mobileAds;
export { BannerAd, BannerAdSize, TestIds, RewardedAd, RewardedAdEventType };
