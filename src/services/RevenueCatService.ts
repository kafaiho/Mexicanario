/**
 * RevenueCatService.ts
 *
 * Wrapper around react-native-purchases (RevenueCat SDK).
 *
 * SETUP STEPS before enabling:
 * 1. npm install react-native-purchases
 * 2. npx expo run:android   (needs native build — not compatible with Expo Go)
 * 3. Set REVENUECAT_API_KEY below (from RevenueCat dashboard > App Settings)
 * 4. Create products in Google Play Console with the IDs listed in PRODUCT_IDS
 * 5. Link Google Play products to RevenueCat offerings
 *
 * Once installed, uncomment the Purchases imports below and remove the MOCK section.
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const REVENUECAT_API_KEY = "REPLACE_WITH_YOUR_REVENUECAT_ANDROID_API_KEY";

/** Map of our internal itemId → RevenueCat product ID (set in Google Play Console) */
export const RC_PRODUCT_IDS: Record<string, string> = {
  coins_500:    "mx_coins_500",
  coins_1200:   "mx_coins_1200",
  coins_2000:   "mx_coins_2000",
  diamonds_100: "mx_diamonds_100",
  diamonds_300: "mx_diamonds_300",
  diamonds_800: "mx_diamonds_800",
  pass_mexica:  "mx_season_pass",
};

/** What each IAP gives the user (mirrored in convex/shop.ts IAP_ITEMS) */
export const IAP_GRANTS: Record<string, { coins?: number; diamonds?: number }> = {
  coins_500:    { coins: 500   },
  coins_1200:   { coins: 1200  },
  coins_2000:   { coins: 2000  },
  diamonds_100: { diamonds: 100 },
  diamonds_300: { diamonds: 300 },
  diamonds_800: { diamonds: 800 },
  pass_mexica:  { coins: 1200, diamonds: 17 },
};

// ─── SDK (react-native-purchases is installed — needs npx expo run:android) ───
// Safe dynamic import — gracefully degrades in Expo Go (no native module)

let Purchases: any = null;
let LOG_LEVEL: any = { VERBOSE: "VERBOSE", ERROR: "ERROR" };

try {
  const mod = require("react-native-purchases");
  Purchases = mod.default ?? mod.Purchases ?? mod;
  if (mod.LOG_LEVEL) LOG_LEVEL = mod.LOG_LEVEL;
} catch (_) {
  // Not available in Expo Go — native build required
}

export async function initRevenueCat() {
  if (!Purchases) {
    console.log("[RevenueCat] Native module not available (Expo Go)");
    return;
  }
  if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.startsWith("REPLACE")) {
    console.warn("[RevenueCat] API key not set — running in mock mode");
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
  await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
}

export async function purchaseProduct(
  itemId: string,
  onSuccess: (receiptToken: string) => Promise<void>,
  onError: (msg: string) => void
) {
  if (!Purchases || !REVENUECAT_API_KEY || REVENUECAT_API_KEY.startsWith("REPLACE")) {
    onError("Los pagos reales estarán disponibles cuando la app se publique en Google Play.");
    return;
  }

  const rcId = RC_PRODUCT_IDS[itemId];
  if (!rcId) { onError("Producto no encontrado"); return; }

  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const pkg = packages.find((p) => p.product.identifier === rcId);
    if (!pkg) { onError("Producto no disponible en la tienda"); return; }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const token = customerInfo.originalAppUserId;
    await onSuccess(token);
  } catch (e: any) {
    if (!e.userCancelled) onError(e.message ?? "Error en el pago");
  }
}
