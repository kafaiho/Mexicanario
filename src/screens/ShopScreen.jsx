import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
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
  getStorePrices,
  presentMexicanarioPlusPaywall,
  purchaseProduct,
  restorePurchases
} from "../services/RevenueCatService";
import SKIN_CONFIG from "../constants/skinConfig";
import { FONTS } from "../theme/designTokens";
import { REAL_WIDTH, TABLET_MODE } from "../utils/tabletSetup";
import { useUserAction, useUserMutation } from "../hooks/useUserMutation";
import { serverErrorText } from "../utils/serverError";
import usePetStore, { getStage } from "../store/usePetStore";
import useEquipSkin from "../hooks/useEquipSkin";
import { useReducedMotion } from "react-native-reanimated";
import Pet3DView from "../components/Pet3D/Pet3DView";
import { supports3D } from "../components/Pet3D/petModels";
import StageCropped from "../components/PetCompanion/StageCropped";
import { normalizePetType } from "../config/petTypes";

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

// Packs con dinero real. id y qty deben coincidir con IAP_ITEMS en convex/shop.ts
// (lo verifica convex/iapCatalogParity.test.ts). El precio sale de la tienda del
// teléfono (Google Play / App Store) en la moneda del jugador.
const DIAMANTES = [
  { id: "diamonds_100", qty: 100, label: "diamantes", icon: "💎", currency: "real" },
  { id: "diamonds_300", qty: 300, label: "diamantes", icon: "💎", currency: "real", badge: "POPULAR" },
  { id: "diamonds_800", qty: 800, label: "diamantes", icon: "💎", currency: "real", badge: "MEJOR VALOR" },
];

// "Varos" = packs de monedas (dinero real)
const VAROS = [
  { id: "coins_500", qty: 500, label: "varos", icon: "🪙", currency: "real" },
  { id: "coins_1200", qty: 1200, label: "varos", icon: "🪙", currency: "real", badge: "POPULAR" },
  { id: "coins_2000", qty: 2000, label: "varos", icon: "🪙", currency: "real", badge: "MEJOR VALOR" },
];
// Pase Mexica: paquete del mes (IAP pass_mexica). coins/diamonds = IAP_ITEMS en convex/shop.ts
const PASE_MEXICA = {
  id: "pass_mexica", label: "Pase Mexica", qty: 1, icon: "🏛️", currency: "real",
  coins: 1200, diamonds: 17,
};
const REAL_ITEM_IDS = [...VAROS, ...DIAMANTES, PASE_MEXICA].map((item) => item.id);

// Trucos para el juego (COIN_ITEMS en convex/shop.ts). El juego gasta primero estos.
const TRUCOS = [
  { id: "hint_x5", qty: 5, label: "pistas de letra", icon: "💡", price: "100", currency: "coins", badge: "AHORRA 25", inventoryKey: "hints" },
  { id: "synonym_x5", qty: 5, label: "pistas de frase", icon: "💬", price: "120", currency: "coins", badge: "AHORRA 30", inventoryKey: "synonyms" },
];

// Trajes para la mascota (precios de COIN_ITEMS en convex/shop.ts)
const TRAJES = [
  { id: "skin_mariachi", price: 1500 },
  { id: "skin_charro", price: 2000 },
  { id: "skin_lucha", price: 2500 },
  { id: "skin_catrina", price: 3500 },
  { id: "skin_azteca", price: 5000 },
].map((skin) => ({ ...skin, qty: 1, currency: "coins", icon: SKIN_CONFIG[skin.id].emoji, label: SKIN_CONFIG[skin.id].label }));

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

// El paquete destacado es el Pase Mexica (PASE_MEXICA), un producto real de la tienda.

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
const ItemCard = React.memo(function ItemCard({ item, onBuy, storePrice }) {
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
          <Text style={s.itemPriceRealText}>{storePrice ?? "Comprar"}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const ItemRow = React.memo(function ItemRow({ items, onBuy, prices }) {
  return (
    <View style={s.itemRow}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onBuy={onBuy} storePrice={prices?.[item.id]} />
      ))}
    </View>
  );
});

// ─── Traje de mascota ─────────────────────────────────────────────────────────
// Tocar una tarjeta pone el traje en el probador; ahí se compra o se lo pone.
function SkinCard({ skin, owned, equipped, selected, onSelect }) {
  const cfg = SKIN_CONFIG[skin.id];
  return (
    <TouchableOpacity
      style={[
        s.skinCard,
        { borderColor: cfg.borderColor },
        owned && { backgroundColor: cfg.bgColor + "33" },
        selected && { borderWidth: 3, transform: [{ scale: 1.04 }] },
      ]}
      onPress={() => onSelect(skin)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Probarle a tu mascota el traje ${skin.label}${owned ? (equipped ? ", puesto" : ", ya es tuyo") : `, cuesta ${skin.price} varos`}`}
    >
      {equipped && (
        <View style={s.skinBadge}><Text style={s.skinBadgeText}>PUESTO</Text></View>
      )}
      <Text style={s.skinIcon}>{cfg.emoji}</Text>
      <Text style={s.skinLabel}>{skin.label}</Text>
      {owned ? (
        <Text style={s.skinPrice}>{equipped ? "✓ Puesto" : "✓ Tuyo"}</Text>
      ) : (
        <View style={s.skinPriceRow}>
          <Image source={require("../../assets/icons/coin.png")} style={s.itemCoinIcon} />
          <Text style={s.skinPrice}>{skin.price.toLocaleString()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Probador: tu mascota en 3D con el traje ──────────────────────────────────
const FITTING_SIZE = Math.min(width * 0.5, 230);

function SkinFittingRoom({ skin, owned, equipped, onBuy, onEquip }) {
  const cfg = SKIN_CONFIG[skin.id];
  const petType = normalizePetType(usePetStore((st) => st.petType));
  const stage = getStage(usePetStore((st) => st.vinculo));
  const reduceMotion = useReducedMotion();
  const still = <StageCropped petType={petType} stage={stage} size={FITTING_SIZE * 0.8} activeSkin={skin.id} />;
  return (
    <View style={[s.fittingCard, { borderColor: cfg.borderColor }]}>
      <View style={[s.fittingStage, { backgroundColor: cfg.bgColor + "26" }]}>
        {supports3D(petType) ? (
          <Pet3DView
            petType={petType}
            stage={stage}
            size={FITTING_SIZE}
            outfit={skin.id}
            interactive
            reduceMotion={reduceMotion}
            mood="joyful"
            fps={30}
            fallback={still}
          />
        ) : still}
        <Text style={s.fittingHint}>↔ Gírala con el dedo</Text>
      </View>
      <Text style={s.fittingTitle}>{cfg.emoji} {skin.label}</Text>
      <Text style={s.fittingDesc}>{cfg.desc}</Text>
      {owned ? (
        <TouchableOpacity
          style={[s.fittingBtn, equipped && s.fittingBtnGhost]}
          onPress={() => onEquip(equipped ? null : skin.id)}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={[s.fittingBtnText, equipped && s.fittingBtnGhostText]}>{equipped ? "Quitárselo" : "Ponérselo"}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.fittingBtn} onPress={() => onBuy(skin)} activeOpacity={0.85} accessibilityRole="button">
          <Image source={require("../../assets/icons/coin.png")} style={s.itemCoinIcon} />
          <Text style={s.fittingBtnText}>Comprar · {skin.price.toLocaleString()}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main ShopScreen ──────────────────────────────────────────────────────────
/**
 * Tienda. Se abre desde cualquier parte con useShop().openShop(sección):
 * "varos" | "diamantes" | "racha" | "trajes" | "plus" (ver ShopContext).
 */
export default function ShopScreen({ visible, onClose, hideTopBar = false, initialSection = null, sectionRequest = 0 }) {
  const [buying, setBuying] = useState(false);
  const [shopMascotState, setShopMascotState] = useState("idle");
  const [shopMascotBubble, setShopMascotBubble] = useState(null);
  const [successItem, setSuccessItem] = useState(null);
  const [cuatesVisible, setCuatesVisible] = useState(false);
  const [prices, setPrices] = useState({});
  const activeSkin = usePetStore((st) => st.activeSkin);
  const setActiveSkin = useEquipSkin();
  const [previewSkinId, setPreviewSkinId] = useState(null);
  const previewSkin = TRAJES.find((t) => t.id === (previewSkinId ?? activeSkin)) ?? TRAJES[0];

  // Desplazarse a una sección (al abrir desde otro lado o al faltar saldo)
  const scrollRef = useRef(null);
  const sectionY = useRef({});
  const pendingSection = useRef(initialSection);
  const scrollToSection = (key) => {
    const y = sectionY.current[key];
    if (y == null) { pendingSection.current = key; return; }
    pendingSection.current = null;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  };
  const onSectionLayout = (key) => (e) => {
    sectionY.current[key] = e.nativeEvent.layout.y;
    if (pendingSection.current === key) setTimeout(() => scrollToSection(key), 250);
  };

  // Si ya estaba abierta y piden otra sección, desplazarse a ella
  useEffect(() => {
    if (initialSection) scrollToSection(initialSection);
  }, [sectionRequest]);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    getStorePrices(REAL_ITEM_IDS).then((p) => { if (alive) setPrices(p); });
    return () => { alive = false; };
  }, [visible]);

  const { userId } = useAuth();
  const { flyCoins, particles, triggerCoinFly, onCoinArrived } = useCoinFly();
  const { flyDiamonds, diamondParticles, triggerDiamondFly, onDiamondArrived } = useDiamondFly();

  const shopState = useQuery(api.shop.getShopState, userId ? { userId } : "skip");
  const claimFreeCoins = useUserMutation(api.shop.claimFreeCoins);
  const buyWithCoins = useUserMutation(api.shop.buyWithCoins);
  const applyIAPPurchase = useUserAction(api.shop.applyIAPPurchase);
  const claimPendingPurchases = useUserAction(api.shop.claimPendingIAPPurchases);
  const verifyMexPlus = useUserAction(api.shop.verifyMexPlusEntitlement);
  const claimPlusMonthlyReward = useUserMutation(api.shop.claimPlusMonthlyReward);
  const buyPetFood = useUserMutation(api.pet.buyPetFood);
  const buyStreakFreeze = useUserMutation(api.streaks.buyStreakFreeze);
  const claimAdReward = useUserMutation(api.rewards.claimAdReward);

  const { ready: adReady, available: adAvailable, showAd } = useRewardedAd();

  // Compras cobradas por Google Play que no alcanzaron a llegar (app cerrada,
  // sin red, pago en efectivo que se confirmó después): se acreditan al abrir.
  useEffect(() => {
    if (!visible || !userId) return undefined;
    let alive = true;
    recoverPendingPurchases().then((r) => {
      if (alive && r) Alert.alert("¡Llegó tu compra! 🎉", r);
    });
    return () => { alive = false; };
  }, [visible, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  const cooldown = shopState?.freeCooldownRemaining ?? 0;
  const activePass = shopState?.activePass ?? null;

  // Monedas y diamantes volando hacia el marcador
  function celebrateGrant({ coinsGranted = 0, diamondsGranted = 0 }) {
    const fromX = TABLET_MODE ? REAL_WIDTH / 2 : width / 2;
    if (coinsGranted > 0) {
      const c = getCoinPillFallback();
      triggerCoinFly({ fromX, fromY: height * 0.6, toX: c.x + c.w / 2, toY: c.y + c.h / 2, coins: coinsGranted });
    }
    if (diamondsGranted > 0) {
      const d = getDiamondPillFallback();
      triggerDiamondFly({ fromX, fromY: height * 0.6, toX: d.x + d.w / 2, toY: d.y + d.h / 2, diamonds: diamondsGranted });
    }
  }

  /** Acredita compras pendientes; devuelve el texto a mostrar o null si no había. */
  async function recoverPendingPurchases() {
    if (!userId) return null;
    try {
      const r = await claimPendingPurchases({ userId });
      if (!r?.granted?.length) return null;
      notifySuccess();
      celebrateGrant(r);
      const parts = [];
      if (r.coinsGranted) parts.push(`${r.coinsGranted.toLocaleString()} varos`);
      if (r.diamondsGranted) parts.push(`${r.diamondsGranted.toLocaleString()} diamantes`);
      return `Acreditamos tu compra pendiente: ${parts.join(" y ")}.`;
    } catch {
      return null;
    }
  }

  // RevenueCat puede tardar unos segundos en ver la compra que Google Play acaba de cobrar
  async function applyPurchaseWithRetry(itemId, transactionId) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await applyIAPPurchase({ userId, itemId, transactionId });
      } catch (e) {
        if (attempt >= 2 || !/PURCHASE_NOT_VERIFIED/.test(serverErrorText(e, ""))) throw e;
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }

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
      const { entitlement } = await restorePurchases();

      // Sync Plus entitlement if it was restored
      if (userId && entitlement.active) {
        await verifyMexPlus({ userId });
      }
      const recovered = await recoverPendingPurchases();

      if (entitlement.active || recovered) {
        const msgs = [];
        if (entitlement.active) msgs.push("⭐ Mexicanario Plus está activo en tu cuenta.");
        if (recovered) msgs.push(recovered);
        Alert.alert("✅ Compras restauradas", msgs.join("\n\n"), [{ text: "¡Qué chido!" }]);
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
            const r = await applyPurchaseWithRetry(item.id, transactionId);
            notifySuccess();
            celebrateGrant(r);
            setSuccessItem(item);
          } catch (e) {
            // Google Play ya cobró: la compra queda registrada en RevenueCat y se
            // acredita sola al volver a abrir la tienda (recoverPendingPurchases).
            const code = serverErrorText(e, "");
            if (/PURCHASE_NOT_VERIFIED|PAYMENTS_UNAVAILABLE|PAYMENTS_NOT_CONFIGURED/.test(code) || !code) {
              Alert.alert(
                "Compra recibida ✅",
                "Google Play confirmó tu pago, pero tu recompensa tarda un poco en llegar. Se acredita sola en unos minutos; si no, cierra y vuelve a abrir la tienda."
              );
            } else {
              Alert.alert("¡Aguas!", code);
            }
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
          const res = await buyPetFood({ userId, foodType: item.id });
          if (res && res.success === false) throw new Error(res.error || "No se pudo comprar");
          usePetStore.getState().alimentar(item.id, res?.bondIncrease ?? 0); // energía + vínculo
        }
      }

      notifySuccess(); // vibración al comprar
      if (item.id.startsWith("skin_")) {
        usePetStore.getState().setActiveSkin(item.id); // el servidor ya lo dejó puesto
        Alert.alert("¡Qué elegancia! " + item.icon, `Tu mascota ya trae puesto el traje de ${item.label}.`);
        return;
      }
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
      const msg = serverErrorText(e, "");
      if (/Monedas insuficientes/i.test(msg)) {
        Alert.alert("Te faltan varos 🪙", "Consigue más varos gratis o en paquete.", [
          { text: "Ahorita no", style: "cancel" },
          { text: "Conseguir varos", onPress: () => scrollToSection("varos") },
        ]);
      } else if (/Diamantes insuficientes/i.test(msg)) {
        Alert.alert("Te faltan diamantes 💎", "Consigue diamantes para comprar esto.", [
          { text: "Ahorita no", style: "cancel" },
          { text: "Ver diamantes", onPress: () => scrollToSection("diamantes") },
        ]);
      } else {
        Alert.alert("¡Aguas!", msg || "No se pudo comprar. Intenta de nuevo.");
      }
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
      Alert.alert("Espérate", serverErrorText(e, "No se pudo reclamar. Intenta de nuevo."));
    } finally {
      setBuying(false);
    }
  }

  // 40 varos por anuncio: los paga el servidor, con tope diario
  async function payAdReward() {
    if (!userId) return;
    try {
      const r = await claimAdReward({ userId });
      notifySuccess();
      celebrateGrant(r);
    } catch (e) {
      Alert.alert("Anuncios", serverErrorText(e, "No se pudo dar el premio del anuncio."));
    }
  }

  function handleWatchAd() {
    const shown = showAd(payAdReward);
    // En Expo Go (__DEV__ sin módulo nativo) no hay anuncios: premio directo
    if (!shown && __DEV__) payAdReward();
    else if (!shown) Alert.alert("📺 Anuncio no disponible", "El anuncio aún no carga. Inténtalo en un momento.");
  }

  // Regalo mensual de Mexicanario Plus
  async function handleClaimPlusReward() {
    if (!userId || buying) return;
    setBuying(true);
    try {
      const r = await claimPlusMonthlyReward({ userId });
      notifySuccess();
      const c = getCoinPillFallback();
      triggerCoinFly({
        fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
        fromY: height * 0.6,
        toX: c.x + c.w / 2,
        toY: c.y + c.h / 2,
        coins: r.coinsAwarded,
      });
      const d = getDiamondPillFallback();
      triggerDiamondFly({
        fromX: TABLET_MODE ? REAL_WIDTH / 2 : width / 2,
        fromY: height * 0.6,
        toX: d.x + d.w / 2,
        toY: d.y + d.h / 2,
        diamonds: r.diamondsAwarded,
      });
    } catch (e) {
      Alert.alert("Regalo Plus", String(e?.data ?? e?.message ?? "No se pudo reclamar"));
    } finally {
      setBuying(false);
    }
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
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Tienda */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Tienda</Text>
          </View>

          {/* Pase Mexica — paquete destacado del mes */}
          <TouchableOpacity
            style={s.paseCard}
            activeOpacity={0.9}
            disabled={!!activePass}
            onPress={() => handleBuyItem(PASE_MEXICA)}
            accessibilityRole="button"
            accessibilityLabel={`Pase Mexica: ${PASE_MEXICA.coins} varos y ${PASE_MEXICA.diamonds} diamantes${prices[PASE_MEXICA.id] ? ` por ${prices[PASE_MEXICA.id]}` : ""}`}
          >
            <View style={s.paseTag}><Text style={s.paseTagText}>🏛️ PASE DEL MES</Text></View>
            <Text style={s.paseTitle}>Pase Mexica</Text>
            <View style={s.paseRewards}>
              <View style={s.paseReward}>
                <Image source={require("../../assets/icons/coin.png")} style={s.paseRewardIcon} />
                <Text style={s.paseRewardText}>{PASE_MEXICA.coins.toLocaleString()}</Text>
              </View>
              <Text style={s.pasePlus}>+</Text>
              <View style={s.paseReward}>
                <Image source={require("../../assets/icons/diamond.png")} style={s.paseRewardIcon} />
                <Text style={s.paseRewardText}>{PASE_MEXICA.diamonds}</Text>
              </View>
            </View>
            {activePass ? (
              <Text style={s.paseActive}>✅ Ya lo tienes · se renueva en {formatPassCountdown(activePass.expiresAt)}</Text>
            ) : (
              <View style={s.paseBtn}>
                <Text style={s.paseBtnText}>{prices[PASE_MEXICA.id] ?? "Comprar"}</Text>
              </View>
            )}
          </TouchableOpacity>

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
          <View onLayout={onSectionLayout("varos")}>
            <SectionBanner title="Varos" />
          </View>
          <ItemRow items={VAROS} onBuy={handleBuyItem} prices={prices} />

          {/* Diamantes */}
          <View onLayout={onSectionLayout("diamantes")}>
            <SectionBanner title="Diamantes" />
          </View>
          <ItemRow items={DIAMANTES} onBuy={handleBuyItem} prices={prices} />

          {/* Trucos para el juego */}
          <View onLayout={onSectionLayout("trucos")}>
            <SectionBanner title="Trucos 💡" />
          </View>
          <ItemRow items={TRUCOS} onBuy={handleBuyItem} />
          <Text style={s.trucosOwned}>
            En tu morral: 💡 {shopState?.powerups?.hints ?? 0} de letra · 💬 {shopState?.powerups?.synonyms ?? 0} de frase.
            El juego las usa antes de cobrarte varos.
          </Text>

          {/* Trajes para la mascota */}
          <View onLayout={onSectionLayout("trajes")}>
            <SectionBanner title="Trajes para tu mascota 🎭" />
          </View>
          <SkinFittingRoom
            skin={previewSkin}
            owned={(shopState?.purchasedSkins ?? []).includes(previewSkin.id)}
            equipped={activeSkin === previewSkin.id}
            onBuy={handleBuyItem}
            onEquip={setActiveSkin}
          />
          <View style={s.skinsGrid}>
            {TRAJES.map((skin) => {
              const owned = (shopState?.purchasedSkins ?? []).includes(skin.id);
              return (
                <SkinCard
                  key={skin.id}
                  skin={skin}
                  owned={owned}
                  equipped={owned && activeSkin === skin.id}
                  selected={previewSkin.id === skin.id}
                  onSelect={(sk) => setPreviewSkinId(sk.id)}
                />
              );
            })}
          </View>

          {/* Protector de Racha */}
          <View onLayout={onSectionLayout("racha")}>
            <SectionBanner title="Proteger Racha 🛡️" />
          </View>
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
          <View onLayout={onSectionLayout("plus")}>
            <SectionBanner title="Mexicanario Plus ⭐" />
          </View>
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
                  <Text style={s.plusRowDesc}>Reclama tu regalo aquí cada mes</Text>
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

            {/* CTA: suscribirse, o reclamar el regalo del mes si ya es Plus */}
            {shopState?.mexPlusActive ? (
              <>
                <Text style={s.plusActiveText}>
                  ⭐ Eres Plus hasta el {new Date(shopState.mexPlusExpiresAt).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
                </Text>
                {shopState.plusRewardAvailable ? (
                  <TouchableOpacity style={s.plusBtn} activeOpacity={0.85} onPress={handleClaimPlusReward}>
                    <Text style={s.plusBtnText}>🎁 Reclamar regalo del mes — 🪙500 💎50</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={s.plusDisclaimer}>✅ Ya reclamaste el regalo de este mes. ¡Vuelve el próximo!</Text>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={s.plusBtn}
                  activeOpacity={0.85}
                  onPress={handleSubscribePlus}
                >
                  <Text style={s.plusBtnText}>Suscribirme a Plus</Text>
                </TouchableOpacity>
                <Text style={s.plusDisclaimer}>Cancela cuando quieras · Sin permanencia</Text>
              </>
            )}
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
  plusActiveText: {
    fontFamily: FONTS.bodyBold,
    color: "#5C2800",
    fontSize: width * 0.035,
    textAlign: "center",
    marginBottom: 10,
  },

  // Pase Mexica (paquete destacado)
  paseCard: {
    backgroundColor: "#6A1B9A",
    borderRadius: width * 0.05,
    borderWidth: 2,
    borderColor: GOLD,
    borderBottomWidth: 6,
    borderBottomColor: "#4A148C",
    padding: width * 0.04,
    marginBottom: height * 0.02,
    alignItems: "center",
  },
  paseTag: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  paseTagText: { fontFamily: FONTS.bodyBold, color: ACTION_TEXT, fontSize: width * 0.028, letterSpacing: 0.6 },
  paseTitle: { fontFamily: FONTS.display, color: "#fff", fontSize: width * 0.07, marginBottom: 8 },
  paseRewards: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  paseReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  paseRewardIcon: { width: width * 0.06, height: width * 0.06, resizeMode: "contain" },
  paseRewardText: { fontFamily: FONTS.display, color: "#fff", fontSize: width * 0.05 },
  pasePlus: { fontFamily: FONTS.display, color: GOLD, fontSize: width * 0.05 },
  paseBtn: {
    backgroundColor: ACTION_BG,
    borderRadius: 14,
    borderBottomWidth: 4,
    borderBottomColor: ACTION_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  paseBtnText: { fontFamily: FONTS.bodyBold, color: ACTION_TEXT, fontSize: width * 0.042 },
  paseActive: { fontFamily: FONTS.bodyBold, color: "#E1BEE7", fontSize: width * 0.032, textAlign: "center" },

  trucosOwned: {
    fontFamily: FONTS.body,
    color: "#5C2800",
    fontSize: width * 0.03,
    textAlign: "center",
    marginTop: -4,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFEAAC",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skinPrice: { fontFamily: FONTS.bodyBold, fontSize: width * 0.028, color: "#8B4513" },
  fittingCard: {
    backgroundColor: "#FFF8EC",
    borderRadius: 18,
    borderWidth: 2,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  fittingStage: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingTop: 6,
    paddingBottom: 4,
    minHeight: FITTING_SIZE + 26,
  },
  fittingHint: { fontFamily: FONTS.body, fontSize: width * 0.026, color: "#9A6030", marginTop: 2 },
  fittingTitle: { fontFamily: FONTS.display, fontSize: width * 0.05, color: "#5C2800", marginTop: 8 },
  fittingDesc: { fontFamily: FONTS.body, fontSize: width * 0.031, color: "#8B5E3C", textAlign: "center", marginTop: 2, marginBottom: 10 },
  fittingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ACTION_BG,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: ACTION_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 26,
  },
  fittingBtnText: { fontFamily: FONTS.bodyBold, color: ACTION_TEXT, fontSize: width * 0.04 },
  fittingBtnGhost: { backgroundColor: "transparent", borderColor: "#A0714F" },
  fittingBtnGhostText: { color: "#7A4020" },

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
