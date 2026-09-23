import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import CoinFlyOverlay from "../components/CoinFlyOverlay";
import CuatesModal from "../components/CuatesModal";
import DiamondFlyOverlay from "../components/DiamondFlyOverlay";
import DynamicBundleCard from "../components/DynamicBundleCard";
import MiniMascot from "../components/MiniMascot";
import PurchaseSuccessModal from "../components/PurchaseSuccessModal";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import useCoinFly from "../hooks/useCoinFly";
import useDiamondFly from "../hooks/useDiamondFly";
import { useRewardedAd } from "../hooks/useRewardedAd";
import { notifySuccess } from "../services/haptics";
import {
  PAYWALL_RESULT,
  presentMexicanarioPlusPaywall,
  purchaseProduct,
  restorePurchases
} from "../services/RevenueCatService";
import { FONTS } from "../theme/designTokens";
import { REAL_WIDTH, TABLET_MODE } from "../utils/tabletSetup";
import { useUserAction, useUserMutation } from "../hooks/useUserMutation";

const { width, height } = Dimensions.get("window");


const getCoinPillFallback = () => {
  const topPad = Platform.OS === "ios" ? height * 0.058 : height * 0.04;
  const pillH = 36;
  const pillW = 110;
  const pillX = REAL_WIDTH - 16 - pillW;
  return { x: pillX, y: topPad, w: pillW, h: pillH };
};

const getDiamondPillFallback = () => {
  const coin = getCoinPillFallback();
  return { x: coin.x - coin.w - 8, y: coin.y, w: coin.w, h: coin.h };
};
const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

// ─── Catálogo mexicano ────────────────────────────────────────────────────────

// "Diamantes" = packs de diamantes (dinero real) — IDs deben coincidir con IAP_ITEMS en convex/shop.ts
const DIAMANTES = [
  { id: "diamonds_100", qty: 100, label: "diamantes", icon: "💎", price: "$ 4.900", currency: "real" },
  { id: "diamonds_300", qty: 300, label: "diamantes", icon: "💎", price: "$ 11.900", currency: "real", badge: "POPULAR" },
  { id: "diamonds_800", qty: 800, label: "diamantes", icon: "💎", price: "$ 24.900", currency: "real", badge: "MEJOR VALOR" },
];

// "Varos" = packs de monedas (dinero real)
const VAROS = [
  { id: "coins_500", qty: 500, label: "varos", icon: "🪙", price: "$ 0.99 USD", currency: "real" },
  { id: "coins_1200", qty: 1500, label: "varos", icon: "🪙", price: "$ 1.99 USD", currency: "real", badge: "POPULAR" },
  { id: "coins_2000", qty: 4000, label: "varos", icon: "🪙", price: "$ 4.99 USD", currency: "real" },
  { id: "coins_9000", qty: 9000, label: "varos", icon: "🪙", price: "$ 9.99 USD", currency: "real" },
  { id: "coins_20000", qty: 20000, label: "varos", icon: "🪙", price: "$ 19.99 USD", currency: "real" },
  { id: "coins_60000", qty: 60000, label: "varos", icon: "🪙", price: "$ 49.99 USD", currency: "real", badge: "MEJOR VALOR" },
];

// ─── Artículos en monedas (tienda interna) ────────────────────────────────────

// Protección de racha
const PROTECTORES = [
  {
    id: "streak_freeze_coins", qty: 1, label: "Escudo de Racha", icon: "🛡️", price: "400", currency: "coins",
    badge: "ACUMULABLE", desc: "Protege tu racha si pierdes un día · Se pueden apilar"
  },
];



// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCooldown(ms) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatPassCountdown(expiresAt) {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expirado";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${d}d ${h}h ${m}m`;
}

// ─── Section header banner ────────────────────────────────────────────────────
function SectionBanner({ title }) {
  return (
    <View style={s.bannerWrap}>
      <View style={s.bannerLine} />
      <View style={s.banner}>
        <Text style={s.bannerText}>{title}</Text>
      </View>
      <View style={s.bannerLine} />
    </View>
  );
}

// BundleCard estático removido (Usando DynamicBundleCard)

// ─── Free coins section ───────────────────────────────────────────────────────
function GratisSection({ cooldownMs, onClaim, onWatchAd, adReady, adAvailable, onPressCuates }) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const id = setInterval(() => tick((n) => n + 1), 1_000);
    return () => clearInterval(id);
  }, [cooldownMs]);

  const ready = cooldownMs <= 0;

  return (
    <View style={s.gratisRow}>
      {/* Card 1: gratis con cooldown */}
      <TouchableOpacity
        style={s.gratisCard}
        onPress={ready ? onClaim : undefined}
        activeOpacity={ready ? 0.75 : 1}
      >
        <Image source={require("../../assets/icons/coin.png")} style={s.gratisIcon} />
        <Text style={s.gratisAmount}>15</Text>
        {ready ? (
          <View style={s.gratisBtn}><Text style={s.gratisBtnText}>Gratis</Text></View>
        ) : (
          <View style={[s.gratisBtn, s.gratisBtnWait]}>
            <Text style={s.gratisBtnTextWait}>ⓘ {formatCooldown(cooldownMs)}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Card 2: invitar cuates */}
      <TouchableOpacity
        style={s.gratisCard}
        onPress={onPressCuates}
      >
        <Image source={require("../../assets/icons/coin.png")} style={s.gratisIcon} />
        <Text style={s.gratisAmount}>50</Text>
        <View style={s.gratisBtn}><Text style={s.gratisBtnText}>Cuates</Text></View>
      </TouchableOpacity>

      {/* Card 3: ver anuncio */}
      <TouchableOpacity
        style={[s.gratisCard, (!adAvailable || !adReady) && { opacity: 0.65 }]}
        onPress={onWatchAd}
        activeOpacity={0.75}
        disabled={adAvailable && !adReady}
      >
        <Image source={require("../../assets/icons/coin.png")} style={s.gratisIcon} />
        <Text style={s.gratisAmount}>40</Text>
        <View style={[s.gratisBtn, { backgroundColor: AMBER, borderColor: "#A0541A" }]}>
          <Text style={[s.gratisBtnText, { fontSize: 11, color: "#fff" }]}>
            {adAvailable && !adReady ? "⏳" : "📺 Ad"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── 3-column item grid card ──────────────────────────────────────────────────
const ItemCard = React.memo(function ItemCard({ item, onBuy }) {
  return (
    <TouchableOpacity style={s.itemCard} onPress={() => onBuy(item)} activeOpacity={0.85}>
      {item.badge && (
        <View style={s.itemBadgeWrap}>
          <Text style={s.itemBadgeText}>{item.badge}</Text>
        </View>
      )}
      <Text style={s.itemEmoji}>{item.icon}</Text>
      <Text style={s.itemQty}>{item.qty.toLocaleString()}</Text>
      <Text style={s.itemLabel}>{item.label}</Text>
      {item.currency === "coins" ? (
        <View style={s.itemPriceCoins}>
          <Image source={require("../../assets/icons/coin.png")} style={s.itemCoinIcon} />
          <Text style={s.itemPriceCoinsText}>{item.price}</Text>
        </View>
      ) : item.currency === "diamonds" ? (
        <View style={s.itemPriceCoins}>
          <Image source={require("../../assets/icons/diamond.png")} style={[s.itemCoinIcon, { tintColor: undefined }]} />
          <Text style={s.itemPriceCoinsText}>{item.price}</Text>
        </View>
      ) : (
        <View style={s.itemPriceReal}>
          <Text style={s.itemPriceRealText}>{item.price}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const ItemRow = React.memo(function ItemRow({ items, onBuy }) {
  return (
    <View style={s.itemRow}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onBuy={onBuy} />
      ))}
    </View>
  );
});

// ─── Main ShopScreen ──────────────────────────────────────────────────────────
export default function ShopScreen({ visible, onClose, hideTopBar = false, autoSinAnuncios = false }) {
  const navigation = useNavigation();
  const [buying, setBuying] = useState(false);
  const [shopMascotState, setShopMascotState] = useState("idle");
  const [shopMascotBubble, setShopMascotBubble] = useState(null);
  const [successItem, setSuccessItem] = useState(null);
  const [cuatesVisible, setCuatesVisible] = useState(false);

  const { userId } = useAuth();
  const { flyCoins, particles, triggerCoinFly, onCoinArrived } = useCoinFly();
  const { flyDiamonds, diamondParticles, triggerDiamondFly, onDiamondArrived } = useDiamondFly();

  const shopState = useQuery(api.shop.getShopState, userId ? { userId } : "skip");
  const claimFreeCoins = useUserMutation(api.shop.claimFreeCoins);
  const buyWithCoins = useUserMutation(api.shop.buyWithCoins);
  const applyIAPPurchase = useUserAction(api.shop.applyIAPPurchase);
  const verifyMexPlus = useUserAction(api.shop.verifyMexPlusEntitlement);
  const buyPetFood = useUserMutation(api.pet.buyPetFood);
  const buyStreakFreeze = useUserMutation(api.streaks.buyStreakFreeze);
  const updateUserCurrency = useUserMutation(api.users.updateUserCurrency);

  const { ready: adReady, available: adAvailable, showAd } = useRewardedAd();

  // Auto-trigger the Sin Anuncios subscription dialog when opened from the ads button
  useEffect(() => {
    if (!visible || !autoSinAnuncios) return;
    const t = setTimeout(() => {
      Alert.alert(
        "🚫📺 Sin Anuncios por 1 mes",
        "Disfruta de Mexicanario sin interrupciones.\n\nPrecio: $5.00 USD / mes (al cambio de tu país)\n\nDisponible cuando la app esté en Google Play.",
        [{ text: "¡Ya mero!" }]
      );
    }, 300);
    return () => clearTimeout(t);
  }, [visible, autoSinAnuncios]);

  if (!visible) return null;

  const cooldown = shopState?.freeCooldownRemaining ?? 0;
  const activePass = shopState?.activePass ?? null;

  // ── Mexicanario Plus — subscribe via RevenueCat Paywall ─────────────────────
  async function handleSubscribePlus() {
    if (!userId) {
      Alert.alert("¡Espérate!", "Necesitas iniciar sesión para suscribirte.", [{ text: "Entendido" }]);
      return;
    }
    setBuying(true);
    try {
      const { result } = await presentMexicanarioPlusPaywall();

      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        // The backend confirms the entitlement with RevenueCat before enabling Plus
        await verifyMexPlus({ userId });
        notifySuccess();
        const verb = result === PAYWALL_RESULT.PURCHASED ? "activada" : "restaurada";
        Alert.alert(
          "⭐ ¡Mexicanario Plus " + verb + "!",
          "Ya tienes acceso a todos los beneficios Premium.",
          [{ text: "¡Excelente!" }]
        );
      } else if (result === PAYWALL_RESULT.NOT_PRESENTED) {
        // User already had an active subscription
        Alert.alert("⭐ Ya eres Plus", "Tu suscripción Mexicanario Plus ya está activa.", [{ text: "¡Genial!" }]);
      } else if (result === PAYWALL_RESULT.ERROR) {
        Alert.alert("Error", "No pudimos procesar tu suscripción. Inténtalo de nuevo.", [{ text: "Entendido" }]);
      }
      // CANCELLED: user closed the paywall — no alert needed
    } finally {
      setBuying(false);
    }
  }

  // ── Restore Purchases — required by Apple ────────────────────────────────────
  async function handleRestorePurchases() {
    setBuying(true);
    try {
      const { restored, entitlement, activeEntitlements } = await restorePurchases();

      // Sync Plus entitlement if it was restored
      if (userId && entitlement.active) {
        await verifyMexPlus({ userId });
      }

      if (restored) {
        const plusMsg = entitlement.active ? "¡Mexicanario Plus restaurado! " : "";
        Alert.alert(
          "✅ Compras restauradas",
          plusMsg + `Entitlements activos: ${activeEntitlements.join(", ")}`,
          [{ text: "¡Qué chido!" }]
        );
      } else {
        Alert.alert(
          "Sin compras previas",
          "No encontramos compras anteriores en tu cuenta de tienda.",
          [{ text: "Entendido" }]
        );
      }
    } catch (_) {
      Alert.alert(
        "Restaurar Compras",
        "Inicia sesión con el mismo Apple ID o Google Account que usaste al comprar.",
        [{ text: "Entendido" }]
      );
    } finally {
      setBuying(false);
    }
  }

  async function handleBuyItem(item) {
    if (!userId) {
      Alert.alert("¡Espérate!", "Necesitas iniciar sesión para comprar.", [{ text: "Entendido" }]);
      return;
    }
    if (buying) return;

    if (item.currency === "real") {
      setBuying(true);
      purchaseProduct(
        item.id,
        async (transactionId) => {
          try {
            const r = await applyIAPPurchase({ userId, itemId: item.id, transactionId });
            notifySuccess();
            const t = getDiamondPillFallback();
            const diamonds = r.diamondsGranted ?? 0;
            if (diamonds > 0) {
              triggerDiamondFly({
                fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
                fromY: height * 0.6,
                toX: t.x + t.w / 2,
                toY: t.y + t.h / 2,
                diamonds,
              });
            }
            setSuccessItem(item);
          } catch (e) {
            Alert.alert("¡Aguas!", e.message ?? "No se pudo procesar la compra");
          } finally {
            setBuying(false);
          }
        },
        (errorMsg) => {
          setBuying(false);
          Alert.alert("¡Aguas!", errorMsg);
        }
      );
      return;
    }


    setBuying(true);
    try {
      if (item.currency === "coins") {
        await buyWithCoins({ userId, itemId: item.id });
      } else if (item.currency === "diamonds") {
        if (item.id === "streak_freeze") {
          await buyStreakFreeze({ userId });
        } else {
          await buyPetFood({ userId, foodType: item.id });
        }
      }

      notifySuccess(); // vibración al comprar
      const showModal = item.currency === "diamonds" || item.id === "streak_freeze_coins";
      if (showModal) {
        setSuccessItem(item);
      } else {
        setShopMascotState("celebrating");
        setShopMascotBubble("¡Genial!");
        setTimeout(() => { setShopMascotState("idle"); setShopMascotBubble(null); }, 2500);
        Alert.alert("¡A todo dar! ✅", `${item.qty} ${item.label} en tu morral`);
      }
    } catch (e) {
      setShopMascotState("sad");
      setShopMascotBubble("Ay...");
      setTimeout(() => { setShopMascotState("idle"); setShopMascotBubble(null); }, 2500);
      Alert.alert("¡Aguas!", e.message ?? "No se pudo comprar");
    } finally {
      setBuying(false);
    }
  }

  async function handleClaim() {
    if (!userId || buying) return;
    setBuying(true);
    try {
      const r = await claimFreeCoins({ userId });
      notifySuccess();
      const t = getCoinPillFallback();
      triggerCoinFly({
        fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
        fromY: height * 0.65,
        toX: t.x + t.w / 2,
        toY: t.y + t.h / 2,
        coins: r.coinsAdded ?? 15,
      });
    } catch (e) {
      Alert.alert("Espérate", e.message ?? "Error");
    } finally {
      setBuying(false);
    }
  }

  function handleWatchAd() {
    const shown = showAd(async () => {
      if (!userId) return;
      try {
        await updateUserCurrency({ userId, coins: 40 });
        notifySuccess();
        const t = getCoinPillFallback();
        triggerCoinFly({
          fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
          fromY: height * 0.65,
          toX: t.x + t.w / 2,
          toY: t.y + t.h / 2,
          coins: 40,
        });
      } catch { }
    });

    // En Expo Go (__DEV__ sin módulo nativo) dar monedas directamente
    if (!shown && __DEV__ && userId) {
      updateUserCurrency({ userId, coins: 40 }).then(() => {
        notifySuccess();
        const t = getCoinPillFallback();
        triggerCoinFly({
          fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
          fromY: height * 0.65,
          toX: t.x + t.w / 2,
          toY: t.y + t.h / 2,
          coins: 40,
        });
      });
    }
  }

  function handleBuyDynamicBundle(bundle) {
    Alert.alert(
      "¡Paquete " + bundle.title + "!",
      "Este paquete estará disponible mediante RevenueCat cuando la app llegue a producción.\n\nContiene " + bundle.rewards.map(r => r.qty + " " + (r.id === "coins" ? "Monedas" : r.id === "diamonds" ? "Diamantes" : "Trucos")).join(", ") + ".",
      [{ text: "¡Ya mero!" }]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <ImageBackground
        source={require("../../assets/images/bg.webp")}
        style={s.bg}
        resizeMode="cover"
      >
        {/* TopBar original — muestra íconos de settings, tacos y perfil + monedas */}
        {!hideTopBar && <TopBar showHomeButton={false} />}

        {/* Botón cerrar flotante encima del TopBar */}
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeBtnText}>×</Text>
        </TouchableOpacity>

        {/* Floating mascota */}
        <View style={s.shopMascotWrap}>
          <MiniMascot
            size={40}
            mascotaState={shopMascotState}
            showBubble={shopMascotBubble}
          />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Tienda */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Tienda</Text>
          </View>

          {/* Bundle rotativo dinámico */}
          <DynamicBundleCard onBuy={handleBuyDynamicBundle} />

          {/* Gratis */}
          <SectionBanner title="Gratis" />
          <GratisSection
            cooldownMs={cooldown}
            onClaim={handleClaim}
            onWatchAd={handleWatchAd}
            adReady={adReady}
            adAvailable={adAvailable}
            onPressCuates={() => setCuatesVisible(true)}
          />

          {/* Varos (coin packs) */}
          <SectionBanner title="Varos" />
          <ItemRow items={VAROS.slice(0, 3)} onBuy={handleBuyItem} />
          <ItemRow items={VAROS.slice(3, 6)} onBuy={handleBuyItem} />

          {/* Diamantes */}
          <SectionBanner title="Diamantes" />
          <ItemRow items={DIAMANTES} onBuy={handleBuyItem} />

          {/* Protector de Racha */}
          <SectionBanner title="Proteger Racha 🛡️" />
          <View style={s.protectorCard}>
            <View style={s.protectorIconWrap}>
              <Text style={s.protectorIcon}>🛡️</Text>
              {(shopState?.streakFreezeCount ?? 0) > 0 && (
                <View style={s.freezeBadge}>
                  <Text style={s.freezeBadgeText}>{shopState.streakFreezeCount}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.protectorTitleRow}>
                <Text style={s.protectorTitle}>Escudo de Racha</Text>
              </View>
              {(shopState?.streakFreezeCount ?? 0) > 0 ? (
                <View style={s.freezeCountRow}>
                  <Text style={s.freezeCountText}>
                    🛡️ Tienes {shopState.streakFreezeCount} escudo{shopState.streakFreezeCount !== 1 ? "s" : ""} activo{shopState.streakFreezeCount !== 1 ? "s" : ""}
                  </Text>
                </View>
              ) : (
                <Text style={s.protectorDesc}>Sin escudos — si fallas un día perderás tu racha.</Text>
              )}
              <Text style={s.protectorDesc}>Cada escudo protege un día faltado. Se usa automáticamente.</Text>
              <TouchableOpacity
                style={s.protectorBtn}
                onPress={() => handleBuyItem(PROTECTORES[0])}
              >
                <Text style={s.protectorBtnText}>🪙 400 varos — +1 escudo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mexicanario Plus */}
          <SectionBanner title="Mexicanario Plus ⭐" />
          <View style={s.plusCard}>
            {/* Header */}
            <View style={s.plusHeader}>
              <Text style={s.plusBadge}>⭐ LEGENDARIO</Text>
              <Text style={s.plusTitle}>Mexicanario Plus</Text>
              <Text style={s.plusSubtitle}>Todo lo que necesitas para dominar los modismos</Text>
            </View>

            {/* Benefits list */}
            <View style={s.plusBenefits}>
              <View style={s.plusRow}>
                <Text style={s.plusRowIcon}>🚫📺</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.plusRowTitle}>Sin Anuncios</Text>
                  <Text style={s.plusRowDesc}>Juega sin interrupciones</Text>
                </View>
              </View>
              <View style={s.plusRow}>
                <Text style={s.plusRowIcon}>🦝</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.plusRowTitle}>Nahual Legendario</Text>
                  <Text style={s.plusRowDesc}>Mascota exclusiva · 3 variantes (Norteño, Sureño, Urbano)</Text>
                </View>
              </View>
              <View style={s.plusRow}>
                <Text style={s.plusRowIcon}>🪙</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.plusRowTitle}>500 monedas al mes</Text>
                  <Text style={s.plusRowDesc}>Entregadas al activar cada mes</Text>
                </View>
              </View>
              <View style={s.plusRow}>
                <Text style={s.plusRowIcon}>💎</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.plusRowTitle}>50 diamantes al mes</Text>
                  <Text style={s.plusRowDesc}>Úsalos en la tienda o para tu mascota</Text>
                </View>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={s.plusBtn}
              activeOpacity={0.85}
              onPress={handleSubscribePlus}
            >
              <Text style={s.plusBtnText}>Suscribirme — $4.99 USD / mes</Text>
            </TouchableOpacity>
            <Text style={s.plusDisclaimer}>Cancela cuando quieras · Sin permanencia</Text>
          </View>

          {/* Restaurar Compras — requerido por Apple */}
          <TouchableOpacity style={s.restoreBtn} onPress={handleRestorePurchases}>
            <Text style={s.restoreBtnText}>🔁 Restaurar Compras</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {buying && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        <CoinFlyOverlay coins={flyCoins} particles={particles} onCoinArrived={onCoinArrived} />
        <DiamondFlyOverlay diamonds={flyDiamonds} particles={diamondParticles} onDiamondArrived={onDiamondArrived} />

        {/* Animated Custom modal for diamond purchases */}
        <PurchaseSuccessModal
          visible={!!successItem}
          item={successItem}
          onClose={() => setSuccessItem(null)}
        />

        {/* Modal de cuates */}
        <CuatesModal
          visible={cuatesVisible}
          onClose={() => setCuatesVisible(false)}
        />
      </ImageBackground>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ACTION_BG = GOLD;
const ACTION_BORDER = "#C8950A";
const ACTION_TEXT = "#523600";

// Accurate TopBar clearance (mirrors TopBar.jsx formula)
const TOP_SAFE_INSET = Platform.OS === "ios" ? height * 0.058 : height * 0.04;
const TOP_BAR_H = TOP_SAFE_INSET + width * 0.025 + width * 0.075 + width * 0.025;
const CLOSE_BTN_TOP = Math.round(TOP_BAR_H + 8);
const SCROLL_PAD_TOP = CLOSE_BTN_TOP + Math.round(width * 0.1) + 14;

const s = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#7FAAB8",
  },

  // Header Tienda — estilo Mexicanómetro
  header: {
    alignItems: "center",
    marginBottom: height * 0.02,
    backgroundColor: WHEAT,
    marginHorizontal: width * 0.04,
    borderRadius: width * 0.05,
    borderWidth: 2,
    borderColor: BROWN,
    paddingVertical: height * 0.014,
  },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.075,
    color: BROWN,
    textAlign: "center",
  },

  // Floating mascot (top-left)
  shopMascotWrap: {
    position: "absolute",
    top: CLOSE_BTN_TOP,
    left: width * 0.035,
    zIndex: 200,
  },
  // Botón cerrar flotante (sobre el TopBar)
  closeBtn: {
    position: "absolute",
    top: CLOSE_BTN_TOP,
    right: width * 0.035,
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    backgroundColor: "#e64a33",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
    borderWidth: 2,
    borderColor: "#cf3b2d",
  },
  closeBtnText: {
    color: "#fff",
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.08,
    lineHeight: width * 0.09,
  },

  scroll: {
    paddingTop: SCROLL_PAD_TOP,
    paddingHorizontal: width * 0.035,
    paddingBottom: height * 0.025,
  },

  // Bundle title
  bundleTitleWrap: { alignItems: "center", marginBottom: height * 0.008 },
  bundleTitleBg: {
    backgroundColor: ACTION_BG,
    borderRadius: width * 0.06,
    paddingHorizontal: width * 0.07,
    paddingVertical: height * 0.01,
    borderWidth: 2,
    borderColor: ACTION_BORDER,
  },
  bundleTitleText: { fontFamily: FONTS.bodyBold, color: ACTION_TEXT, fontSize: width * 0.045 },

  // Bundle card — mismo estilo que las cards del Mexicanómetro
  bundleCard: {
    backgroundColor: WHEAT2,
    borderRadius: width * 0.045,
    padding: width * 0.035,
    marginBottom: height * 0.017,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.45)",
  },
  bundleTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.012,
    gap: width * 0.015,
  },
  bundleTimerIcon: { color: AMBER, fontSize: width * 0.037 },
  bundleTimer: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.037, flex: 1 },
  bundleBadge: {
    backgroundColor: AMBER,
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.003,
  },
  bundleBadgeText: { fontFamily: FONTS.bodyBold, color: "#fff", fontSize: width * 0.024, textAlign: "center" },
  bundleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: height * 0.015,
  },
  bundleRewards: { gap: height * 0.008 },
  bundleRewardRow: { flexDirection: "row", alignItems: "center", gap: width * 0.02 },
  bundleRewardIcon: { width: width * 0.058, height: width * 0.058, resizeMode: "contain" },
  bundleRewardEmoji: { fontSize: width * 0.053 },
  bundleRewardText: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.042 },
  bundleChest: { fontSize: width * 0.19 },
  bundleBuyBtn: {
    backgroundColor: ACTION_BG,
    borderRadius: width * 0.06,
    paddingVertical: height * 0.015,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: ACTION_BORDER,
  },
  bundleBuyText: { fontFamily: FONTS.bodyBold, color: ACTION_TEXT, fontSize: width * 0.042 },

  // Section banners — estilo Mexicanómetro (fondo cálido, borde marrón)
  bannerWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: height * 0.015,
    gap: width * 0.02,
  },
  bannerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: BROWN,
    opacity: 0.25,
  },
  banner: {
    backgroundColor: WHEAT,
    borderRadius: width * 0.05,
    paddingHorizontal: width * 0.058,
    paddingVertical: height * 0.009,
    borderWidth: 1.5,
    borderColor: BROWN,
  },
  bannerText: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.038 },

  // Gratis section
  gratisRow: {
    flexDirection: "row",
    gap: width * 0.025,
    marginBottom: height * 0.005,
  },
  gratisCard: {
    flex: 1,
    backgroundColor: WHEAT,
    borderRadius: width * 0.04,
    alignItems: "center",
    padding: width * 0.03,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
  },
  gratisIcon: { width: width * 0.115, height: width * 0.115, resizeMode: "contain", marginBottom: height * 0.005 },
  gratisAmount: { fontFamily: FONTS.display, color: BROWN, fontSize: width * 0.053, marginBottom: height * 0.01 },
  gratisBtn: {
    backgroundColor: ACTION_BG,
    borderRadius: width * 0.05,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    width: "100%",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: ACTION_BORDER,
  },
  gratisBtnWait: { backgroundColor: "#A0714F", borderColor: "#7A5235" },
  gratisBtnText: { fontFamily: FONTS.bodyBold, color: ACTION_TEXT, fontSize: width * 0.034 },
  gratisBtnTextWait: { fontFamily: FONTS.bodyBold, color: WHEAT, fontSize: width * 0.029 },

  // Item grid
  itemRow: {
    flexDirection: "row",
    gap: width * 0.025,
    marginBottom: height * 0.012,
  },
  itemCard: {
    flex: 1,
    backgroundColor: WHEAT,
    borderRadius: width * 0.04,
    alignItems: "center",
    paddingVertical: height * 0.017,
    paddingHorizontal: width * 0.015,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
    position: "relative",
  },
  itemBadgeWrap: {
    position: "absolute",
    top: width * -0.015,
    right: width * -0.015,
    backgroundColor: AMBER,
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.015,
    paddingVertical: height * 0.004,
    zIndex: 1,
  },
  itemBadgeText: { fontFamily: FONTS.bodyBold, color: "#fff", fontSize: width * 0.024 },
  itemEmoji: { fontSize: width * 0.095, marginBottom: height * 0.005 },
  itemQty: { fontFamily: FONTS.display, color: BROWN, fontSize: width * 0.048, marginBottom: height * 0.003 },
  itemLabel: { fontFamily: FONTS.body, color: "#A0714F", fontSize: width * 0.029, marginBottom: height * 0.01 },
  itemPriceCoins: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACTION_BG,
    borderRadius: width * 0.05,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.006,
    gap: width * 0.01,
    borderWidth: 1.5,
    borderColor: ACTION_BORDER,
  },
  itemCoinIcon: { width: width * 0.042, height: width * 0.042, resizeMode: "contain" },
  itemPriceCoinsText: { fontFamily: FONTS.bodyBold, color: ACTION_TEXT, fontSize: width * 0.034 },
  itemPriceReal: {
    backgroundColor: ACTION_BG,
    borderRadius: width * 0.05,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.008,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: ACTION_BORDER,
  },
  itemPriceRealText: { fontFamily: FONTS.bodyBold, color: ACTION_TEXT, fontSize: width * 0.032 },

  // Sin Anuncios
  // ── Mexicanario Plus ──────────────────────────────────────────────────────
  plusCard: {
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.025,
    borderRadius: width * 0.05,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: GOLD,
    backgroundColor: WHEAT,
  },
  plusHeader: {
    backgroundColor: AMBER,
    paddingVertical: height * 0.018,
    paddingHorizontal: 18,
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(139,69,19,0.4)",
  },
  plusBadge: {
    color: WHEAT,
    fontSize: width * 0.028,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 2,
    marginBottom: 4,
    opacity: 0.9,
  },
  plusTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.065,
    color: WHEAT,
    marginBottom: 4,
  },
  plusSubtitle: {
    fontFamily: FONTS.body,
    fontSize: width * 0.03,
    color: "rgba(255,228,181,0.85)",
    textAlign: "center",
  },
  plusBenefits: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  plusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: WHEAT2,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(139,69,19,0.22)",
  },
  plusRowIcon: { fontSize: 24, lineHeight: 28 },
  plusRowTitle: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.036,
    marginBottom: 2,
  },
  plusRowDesc: {
    fontFamily: FONTS.body,
    color: "#7A4020",
    fontSize: width * 0.029,
  },
  plusBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: height * 0.018,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: ACTION_BORDER,
  },
  plusBtnText: {
    fontFamily: FONTS.bodyBold,
    color: ACTION_TEXT,
    fontSize: width * 0.04,
  },
  plusDisclaimer: {
    fontFamily: FONTS.body,
    color: "#9A6030",
    fontSize: width * 0.027,
    textAlign: "center",
    marginBottom: 14,
  },

  sinAnunciosCard: {
    backgroundColor: WHEAT,
    borderRadius: width * 0.04,
    padding: width * 0.04,
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.035,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
  },
  sinAnunciosIcon: { width: width * 0.14, height: width * 0.14, resizeMode: "contain" },
  sinAnunciosTitle: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.042, marginBottom: height * 0.003 },
  sinAnunciosDesc: { fontFamily: FONTS.body, color: "#7A4020", fontSize: width * 0.032, marginBottom: height * 0.012 },
  sinAnunciosBtn: {
    backgroundColor: ACTION_BG,
    borderRadius: width * 0.05,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.045,
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: ACTION_BORDER,
  },
  sinAnunciosBtnText: { fontFamily: FONTS.bodyBold, color: ACTION_TEXT, fontSize: width * 0.037 },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Restaurar Compras — Apple-required
  restoreBtn: {
    alignItems: "center",
    paddingVertical: height * 0.018,
    marginTop: height * 0.008,
  },
  restoreBtnText: {
    fontFamily: FONTS.body,
    color: "#A0714F",
    fontSize: width * 0.033,
    textDecorationLine: "underline",
  },

  // ── Protector de Racha ──────────────────────────────────────────────────────
  protectorIconWrap: {
    position: "relative",
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  freezeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#D36B1E",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  freezeBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
  },
  freezeCountRow: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#7CB87A",
  },
  freezeCountText: {
    fontFamily: FONTS.bodyBold,
    color: "#2E7D32",
    fontSize: width * 0.033,
  },
  protectorCard: {
    flexDirection: "row",
    backgroundColor: "#FFF8EC",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F8BE17",
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
    gap: 12,
    shadowColor: "#5C2800",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  protectorIcon: { fontSize: 36 },
  protectorTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  protectorTitle: { fontFamily: FONTS.bodyBold, fontSize: width * 0.042, color: "#5C2800" },
  protectorDesc: { fontFamily: FONTS.body, fontSize: width * 0.03, color: "#8B5E3C", marginBottom: 8 },
  protectorBtn: {
    backgroundColor: "#D36B1E",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  protectorBtnText: { fontFamily: FONTS.bodyBold, color: "#FFF", fontSize: width * 0.037 },
  badgeNew: {
    backgroundColor: "#E74C3C",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: "#FFF", fontSize: 9, fontWeight: "900" },

  // ── Skins Premium ───────────────────────────────────────────────────────────
  skinsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  skinCard: {
    width: (width - width * 0.07 - 30) / 3,
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D4A574",
    padding: 10,
    alignItems: "center",
    shadowColor: "#5C2800",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  skinBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#8B4513",
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  skinBadgeText: { color: "#F8BE17", fontSize: 7, fontWeight: "900" },
  skinIcon: { fontSize: 28, marginBottom: 4 },
  skinLabel: { fontFamily: FONTS.bodyBold, fontSize: width * 0.028, color: "#5C2800", textAlign: "center", marginBottom: 6 },
  skinPriceRow: {
    backgroundColor: "#FFEAAC",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skinPrice: { fontFamily: FONTS.bodyBold, fontSize: width * 0.028, color: "#8B4513" },

  // ── Contenido +18 ──────────────────────────────────────────────────────────
  adultBanner: {
    backgroundColor: "#3D0010",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    alignItems: "center",
  },
  adultBannerText: { fontFamily: FONTS.bodyBold, color: "#FF8FAB", fontSize: width * 0.032 },
  adultCard: {
    flexDirection: "row",
    backgroundColor: "#1A0008",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#8B0032",
    padding: 14,
    marginBottom: 10,
    alignItems: "center",
    gap: 12,
  },
  adultIcon: { fontSize: 32 },
  adultLabel: { fontFamily: FONTS.bodyBold, fontSize: width * 0.04, color: "#FF8FAB", marginBottom: 3 },
  adultDesc: { fontFamily: FONTS.body, fontSize: width * 0.029, color: "#CC6688" },
  adultPricePill: {
    backgroundColor: "#8B0032",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  adultPriceText: { fontFamily: FONTS.bodyBold, color: "#FFD6E7", fontSize: width * 0.032 },
});
