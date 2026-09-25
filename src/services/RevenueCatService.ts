/**
 * RevenueCatService.ts
 *
 * Full RevenueCat integration for Mexicanario:
 *   - SDK initialization (platform-aware)
 *   - Entitlement checking ("Mexicanario Pro")
 *   - RevenueCatUI Paywall presentation
 *   - Customer Center for self-serve subscription management
 *   - Restore purchases (required by Apple)
 *   - Consumable purchases (coins, diamonds)
 *   - Real-time customerInfo listener for subscription renewals
 *
 * Requirements:
 *   npx expo install react-native-purchases react-native-purchases-ui
 *   Requires a native dev build — does NOT run in Expo Go.
 *   In Expo Go: all functions degrade gracefully with no-ops.
 */

import { Alert, Platform } from "react-native";

// ─── API Keys ─────────────────────────────────────────────────────────────────
// Get your API keys from: RevenueCat Dashboard → Project → API Keys
// Use separate keys for iOS and Android (same test key for sandbox testing).
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY || "REPLACE_WITH_IOS_PRODUCTION_KEY";
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY || "goog_mnBCWqnSmPrDNzBwdDHxKFRMRAk";

const API_KEY =
  Platform.OS === "ios" ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;

// ─── Identifiers ──────────────────────────────────────────────────────────────
/**
 * Entitlement identifier — must match exactly what's configured in the
 * RevenueCat dashboard under Project → Entitlements.
 */
export const ENTITLEMENT_PLUS = "Mexicanario Pro";

/**
 * RevenueCat product identifiers → internal item IDs.
 * Must match the product IDs created in Google Play Console / App Store Connect.
 */
export const RC_PRODUCT_IDS: Record<string, string> = {
  coins_500: "mx_coins_500",
  coins_1200: "mx_coins_1200",
  coins_2000: "mx_coins_2000",
  diamonds_100: "mx_diamond_100", // Fixed to match console
  diamonds_300: "300diamanteseste", // Fixed to match console
  diamonds_800: "800diamantes", // Fixed to match console
  pass_mexica: "mx_season_pass",
  // Subscription & consumable product IDs (match your store listings)
  monthly: "monthly",
  consumable: "consumable",
};

/** What each consumable IAP grants (mirrored in convex/shop.ts IAP_ITEMS). */
export const IAP_GRANTS: Record<string, { coins?: number; diamonds?: number }> = {
  coins_500: { coins: 500 },
  coins_1200: { coins: 1200 },
  coins_2000: { coins: 2000 },
  diamonds_100: { diamonds: 100 },
  diamonds_300: { diamonds: 300 },
  diamonds_800: { diamonds: 800 },
  pass_mexica: { coins: 1200, diamonds: 17 },
};

// ─── SDK lazy-load ────────────────────────────────────────────────────────────
// Dynamic require lets the app run in Expo Go without crashing.
// Both modules require a native development build to function.

let Purchases: any = null;
let RevenueCatUI: any = null;

// PAYWALL_RESULT string enum — initialize with string values so comparisons
// work even if the module isn't loaded (avoids undefined === undefined traps).
export const PAYWALL_RESULT = {
  PURCHASED: "PURCHASED",
  RESTORED: "RESTORED",
  CANCELLED: "CANCELLED",
  NOT_PRESENTED: "NOT_PRESENTED",
  ERROR: "ERROR",
} as const;

export type PaywallResultValue = typeof PAYWALL_RESULT[keyof typeof PAYWALL_RESULT];

let LOG_LEVEL: any = { VERBOSE: "VERBOSE", ERROR: "ERROR" };

try {
  const mod = require("react-native-purchases");
  Purchases = mod.default ?? mod.Purchases ?? mod;
  if (mod.LOG_LEVEL) LOG_LEVEL = mod.LOG_LEVEL;
} catch (_) {
  // Not available — Expo Go or web build
}

try {
  const uiMod = require("react-native-purchases-ui");
  // react-native-purchases-ui exports RevenueCatUI as default
  RevenueCatUI = uiMod.default ?? uiMod;
} catch (_) {
  // Not available — Expo Go or web build
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isConfigured(): boolean {
  return !!Purchases && !!API_KEY && !API_KEY.startsWith("REPLACE");
}

function extractExpiresAt(entitlement: any): number | null {
  if (!entitlement?.expirationDate) return null;
  const ts = new Date(entitlement.expirationDate).getTime();
  return isNaN(ts) ? null : ts;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type MexPlusEntitlement = {
  /** Whether the "Mexicanario Pro" entitlement is currently active. */
  active: boolean;
  /** Epoch ms when the entitlement expires. null if not active or no expiry. */
  expiresAt: number | null;
};

export type PaywallOutcome = {
  result: PaywallResultValue;
  entitlement: MexPlusEntitlement;
};

// ─── Initialization ───────────────────────────────────────────────────────────
/**
 * Configure the RevenueCat SDK. Call once at app startup.
 * No-op in Expo Go or if the API key is not yet set.
 */
let markConfigured: () => void = () => { };
const configured = new Promise<void>((resolve) => { markConfigured = resolve; });

export async function initRevenueCat(): Promise<void> {
  if (!Purchases) {
    if (__DEV__) console.log("[RevenueCat] SDK not available (Expo Go or web)");
    return;
  }
  if (!API_KEY || API_KEY.startsWith("REPLACE")) {
    if (__DEV__) console.warn("[RevenueCat] API key not set — running without payments");
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
  await Purchases.configure({ apiKey: API_KEY });
  markConfigured();
}

/**
 * Use the Convex userId as the RevenueCat app user id, so the backend can verify
 * this player's purchases and entitlements with RevenueCat's REST API.
 * Anonymous purchases made before this call are merged into the identified user.
 */
export async function identifyRevenueCatUser(userId: string): Promise<void> {
  if (!isConfigured() || !userId) return;
  try {
    await configured;
    const current = await Purchases.getAppUserID?.();
    if (current !== userId) await Purchases.logIn(userId);
  } catch (e) {
    if (__DEV__) console.warn("[RevenueCat] logIn error:", e);
  }
}

// ─── Entitlement Checking ─────────────────────────────────────────────────────
/**
 * Fetch the current user's "Mexicanario Pro" entitlement status from RevenueCat.
 * Always returns a safe default if the SDK is unavailable.
 */
export async function checkMexicanarioProEntitlement(): Promise<MexPlusEntitlement> {
  if (!isConfigured()) return { active: false, expiresAt: null };
  try {
    const info = await Purchases.getCustomerInfo();
    const entitlement = info?.entitlements?.active?.[ENTITLEMENT_PLUS];
    if (!entitlement) return { active: false, expiresAt: null };
    return { active: true, expiresAt: extractExpiresAt(entitlement) };
  } catch (e) {
    if (__DEV__) console.warn("[RevenueCat] checkEntitlement error:", e);
    return { active: false, expiresAt: null };
  }
}

/**
 * Subscribe to real-time customerInfo updates.
 * Fires on purchase, restore, renewal, and subscription lapse.
 * Returns an unsubscribe function — call it in your useEffect cleanup.
 *
 * Usage:
 *   useEffect(() => {
 *     const unsub = addCustomerInfoListener(({ active, expiresAt }) => {
 *       // sync to your backend
 *     });
 *     return unsub;
 *   }, []);
 */
export function addCustomerInfoListener(
  callback: (entitlement: MexPlusEntitlement) => void
): () => void {
  if (!isConfigured() || !Purchases.addCustomerInfoUpdateListener) return () => { };

  const handler = (info: any) => {
    const entitlement = info?.entitlements?.active?.[ENTITLEMENT_PLUS];
    callback({
      active: !!entitlement,
      expiresAt: entitlement ? extractExpiresAt(entitlement) : null,
    });
  };

  Purchases.addCustomerInfoUpdateListener(handler);

  return () => {
    if (Purchases?.removeCustomerInfoUpdateListener) {
      Purchases.removeCustomerInfoUpdateListener(handler);
    }
  };
}

// ─── Paywall (RevenueCatUI) ────────────────────────────────────────────────────
/**
 * Present the Mexicanario Plus paywall configured in the RevenueCat dashboard.
 *
 * Uses `presentPaywallIfNeeded` — the paywall is only shown if the user does
 * NOT already have the "Mexicanario Pro" entitlement active (result will be
 * NOT_PRESENTED if they're already subscribed).
 *
 * After purchase or restore, fetches the updated entitlement so you can
 * immediately sync it to your backend.
 */
export async function presentMexicanarioPlusPaywall(): Promise<PaywallOutcome> {
  const noActive: MexPlusEntitlement = { active: false, expiresAt: null };

  if (!RevenueCatUI) {
    Alert.alert(
      "⭐ Mexicanario Plus",
      "Las suscripciones estarán disponibles cuando la app se publique en las tiendas.\n\nPrecio: $4.99 USD / mes",
      [{ text: "¡Ya mero!" }]
    );
    return { result: PAYWALL_RESULT.ERROR, entitlement: noActive };
  }

  try {
    const raw: string = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_PLUS,
    });

    const result = (Object.values(PAYWALL_RESULT).includes(raw as any)
      ? raw
      : PAYWALL_RESULT.ERROR) as PaywallResultValue;

    // Fetch fresh entitlement after any successful interaction
    const shouldFetch =
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED ||
      result === PAYWALL_RESULT.NOT_PRESENTED; // already active

    const entitlement = shouldFetch
      ? await checkMexicanarioProEntitlement()
      : noActive;

    return { result, entitlement };
  } catch (e: any) {
    if (__DEV__) console.warn("[RevenueCat] presentPaywall error:", e);
    return { result: PAYWALL_RESULT.ERROR, entitlement: noActive };
  }
}

// ─── Customer Center ──────────────────────────────────────────────────────────
/**
 * Present the RevenueCat Customer Center — lets users cancel, restore,
 * request refunds, and manage their Mexicanario Plus subscription.
 *
 * Requirements:
 *   - RevenueCat Pro or Enterprise plan
 *   - react-native-purchases-ui >= 8.7.0
 *
 * Falls back to native OS instructions if the Customer Center is unavailable.
 */
export async function presentCustomerCenter(): Promise<void> {
  if (!RevenueCatUI?.presentCustomerCenter) {
    const msg = Platform.OS === "ios"
      ? "Ve a Ajustes → Tu nombre → Suscripciones para gestionar tu Mexicanario Plus."
      : "Ve a Google Play → Perfil → Pagos y suscripciones para gestionar tu Mexicanario Plus.";
    Alert.alert("Gestionar suscripción", msg, [{ text: "Entendido" }]);
    return;
  }

  try {
    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: ({ customerInfo }: any) => {
          if (__DEV__) console.log("[RevenueCat] CustomerCenter restore:", customerInfo?.originalAppUserId);
        },
        onRestoreFailed: ({ error }: any) => {
          if (__DEV__) console.warn("[RevenueCat] CustomerCenter restore failed:", error);
        },
      },
    });
  } catch (e) {
    if (__DEV__) console.warn("[RevenueCat] presentCustomerCenter error:", e);
  }
}

// ─── Restore Purchases ────────────────────────────────────────────────────────
/**
 * Restore previous purchases — required by Apple App Store guidelines.
 * Returns the updated entitlement so you can sync it to your backend.
 */
export async function restorePurchases(): Promise<{
  restored: boolean;
  entitlement: MexPlusEntitlement;
  activeEntitlements: string[];
}> {
  const fallback = { restored: false, entitlement: { active: false, expiresAt: null }, activeEntitlements: [] };
  if (!isConfigured()) return fallback;

  try {
    const info = await Purchases.restorePurchases();
    const activeEntitlements = Object.keys(info?.entitlements?.active ?? {});
    const entitlement = info?.entitlements?.active?.[ENTITLEMENT_PLUS];
    return {
      restored: activeEntitlements.length > 0,
      entitlement: {
        active: !!entitlement,
        expiresAt: entitlement ? extractExpiresAt(entitlement) : null,
      },
      activeEntitlements,
    };
  } catch (e: any) {
    if (__DEV__) console.warn("[RevenueCat] restorePurchases error:", e);
    throw e; // let the caller show the error
  }
}

// ─── Consumable Purchases ─────────────────────────────────────────────────────
/**
 * Purchase a consumable product (coins / diamonds packs).
 * Finds the product in the current offering by product ID, then calls
 * purchasePackage and invokes onSuccess with the receipt token.
 */
/**
 * Precios reales de la tienda (Google Play / App Store) ya formateados en la
 * moneda del jugador, por itemId. Devuelve {} si RevenueCat no está disponible.
 */
export async function getStorePrices(itemIds: string[]): Promise<Record<string, string>> {
  if (!isConfigured()) return {};
  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const prices: Record<string, string> = {};
    for (const itemId of itemIds) {
      const pkg = packages.find((p: any) => p.product.identifier === RC_PRODUCT_IDS[itemId]);
      if (pkg?.product?.priceString) prices[itemId] = pkg.product.priceString;
    }
    return prices;
  } catch {
    return {};
  }
}

export async function purchaseProduct(
  itemId: string,
  onSuccess: (transactionId: string) => Promise<void>,
  onError: (msg: string) => void
): Promise<void> {
  if (!isConfigured()) {
    onError("Los pagos reales estarán disponibles cuando la app se publique en las tiendas.");
    return;
  }

  const rcId = RC_PRODUCT_IDS[itemId];
  if (!rcId) {
    onError("Producto no encontrado");
    return;
  }

  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const pkg = packages.find((p: any) => p.product.identifier === rcId);
    if (!pkg) {
      onError("Producto no disponible en la tienda");
      return;
    }

    const { transaction } = await Purchases.purchasePackage(pkg);
    // The backend verifies this store transaction with RevenueCat before crediting it.
    await onSuccess(transaction?.transactionIdentifier ?? "");
  } catch (e: any) {
    if (!e.userCancelled) onError(e.message ?? "Error al procesar el pago");
  }
}
