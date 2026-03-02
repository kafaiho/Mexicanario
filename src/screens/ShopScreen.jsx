import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import { notifySuccess } from "../services/haptics";
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
import CoinFlyOverlay from "../components/CoinFlyOverlay";
import useCoinFly from "../hooks/useCoinFly";
import { api } from "../../convex/_generated/api";
import MiniMascot from "../components/MiniMascot";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";

const { width, height } = Dimensions.get("window");

const getCoinPillFallback = () => {
  const topPad = Platform.OS === "ios" ? height * 0.058 : height * 0.04;
  const pillH  = width * 0.075;
  const pillW  = width * 0.22;
  const pillX  = width - width * 0.03 - pillW;
  return { x: pillX, y: topPad, w: pillW, h: pillH };
};
const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD  = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

// ─── Catálogo mexicano ────────────────────────────────────────────────────────

// "Trucos" = power-ups
const TRUCOS = [
  { id: "hint_x5", qty: 10, label: "trucos", icon: "💡", price: 100, currency: "coins" },
  { id: "reveal_x3", qty: 25, label: "trucos", icon: "🔓", price: 200, currency: "coins" },
  { id: "complete_x1", qty: 50, label: "trucos", icon: "⭐", price: 400, currency: "coins" },
];

// "Varos" = packs de monedas (dinero real)
const VAROS = [
  { id: "coins_500", qty: 500, label: "varos", icon: "🪙", price: "$ 4.900", currency: "real" },
  { id: "coins_1200", qty: 1500, label: "varos", icon: "🪙", price: "$ 9.900", currency: "real", badge: "POPULAR" },
  { id: "coins_2000", qty: 4000, label: "varos", icon: "🪙", price: "$ 24.900", currency: "real" },
  { id: "diamonds_100", qty: 9000, label: "varos", icon: "🪙", price: "$ 49.900", currency: "real" },
  { id: "diamonds_300", qty: 20000, label: "varos", icon: "🪙", price: "$ 99.900", currency: "real" },
  { id: "diamonds_800", qty: 60000, label: "varos", icon: "🪙", price: "$ 229.900", currency: "real", badge: "MEJOR VALOR" },
];

// "Fichas" = artículos especiales
const FICHAS = [
  { id: "pet_food_x5", qty: 2, label: "fichas", icon: "🟢", price: 350, currency: "coins" },
  { id: "pet_toy", qty: 4, label: "fichas", icon: "🔵", price: 500, currency: "coins" },
  { id: "pet_candy", qty: 6, label: "fichas", icon: "🟡", price: 750, currency: "coins" },
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

// ─── Bundle / "¡Con todo y chile!" card ──────────────────────────────────────
function BundleCard({ activePass, onBuy }) {
  const [, tick] = useState(0);
  const isActive = activePass && activePass.expiresAt > Date.now();
  const remaining = activePass ? formatPassCountdown(activePass.expiresAt) : "1d 2h 56m";

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={s.bundleCard}>
      <View style={s.bundleTimerRow}>
        <Text style={s.bundleTimerIcon}>ⓘ</Text>
        <Text style={s.bundleTimer}>{isActive ? remaining : "1d 2h 56m"}</Text>
        {!isActive && <View style={s.bundleBadge}><Text style={s.bundleBadgeText}>TIEMPO{"\n"}LIMITADO</Text></View>}
      </View>

      <View style={s.bundleContent}>
        <View style={s.bundleRewards}>
          <View style={s.bundleRewardRow}>
            <Image source={require("../../assets/icons/coin.png")} style={s.bundleRewardIcon} />
            <Text style={s.bundleRewardText}>4000</Text>
          </View>
          <View style={s.bundleRewardRow}>
            <Text style={s.bundleRewardEmoji}>💡</Text>
            <Text style={s.bundleRewardText}>45</Text>
          </View>
          <View style={s.bundleRewardRow}>
            <Text style={s.bundleRewardEmoji}>🃏</Text>
            <Text style={s.bundleRewardText}>2</Text>
          </View>
        </View>
        <Text style={s.bundleChest}>🎁</Text>
      </View>

      {isActive ? (
        <View style={[s.bundleBuyBtn, { backgroundColor: "#27ae60" }]}>
          <Text style={s.bundleBuyText}>✓ ACTIVO</Text>
        </View>
      ) : (
        <TouchableOpacity style={s.bundleBuyBtn} onPress={onBuy}>
          <Text style={s.bundleBuyText}>$ 24.900,00</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Free coins section ───────────────────────────────────────────────────────
function GratisSection({ cooldownMs, onClaim }) {
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
        <Text style={s.gratisAmount}>25</Text>
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
        onPress={() => Alert.alert("Invitar", "¡Invita a tus cuates y gana varos!")}
      >
        <Image source={require("../../assets/icons/coin.png")} style={s.gratisIcon} />
        <Text style={s.gratisAmount}>50</Text>
        <View style={s.gratisBtn}><Text style={s.gratisBtnText}>Cuates</Text></View>
      </TouchableOpacity>

      {/* Card 3: ver anuncio */}
      <TouchableOpacity
        style={s.gratisCard}
        onPress={() => Alert.alert("Anuncio", "Ver anuncio próximamente")}
      >
        <Image source={require("../../assets/icons/coin.png")} style={s.gratisIcon} />
        <Text style={s.gratisAmount}>75</Text>
        <View style={[s.gratisBtn, { backgroundColor: AMBER, borderColor: "#A0541A" }]}>
          <Text style={[s.gratisBtnText, { fontSize: 11, color: "#fff" }]}>📺 Ad</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── 3-column item grid card ──────────────────────────────────────────────────
function ItemCard({ item, onBuy }) {
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
      ) : (
        <View style={s.itemPriceReal}>
          <Text style={s.itemPriceRealText}>{item.price}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ItemRow({ items, onBuy }) {
  return (
    <View style={s.itemRow}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onBuy={onBuy} />
      ))}
    </View>
  );
}

// ─── Main ShopScreen ──────────────────────────────────────────────────────────
export default function ShopScreen({ visible, onClose, hideTopBar = false, autoSinAnuncios = false }) {
  const [buying, setBuying] = useState(false);
  const [shopMascotState, setShopMascotState] = useState("idle");
  const [shopMascotBubble, setShopMascotBubble] = useState(null);
  const { userId } = useAuth();
  const { flyCoins, particles, triggerCoinFly, onCoinArrived } = useCoinFly();

  const shopState = useQuery(api.shop.getShopState, userId ? { userId } : "skip");
  const claimFreeCoins = useMutation(api.shop.claimFreeCoins);
  const buyWithCoins = useMutation(api.shop.buyWithCoins);

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

  async function handleBuyItem(item) {
    if (!userId || buying) return;

    if (item.currency === "real") {
      Alert.alert(
        "Próximamente 🚀",
        "Los varos de verdad estarán disponibles cuando la app llegue a Google Play.\n\n¡Échale ojo al chorro de novedades!",
        [{ text: "¡Órale!" }]
      );
      return;
    }

    setBuying(true);
    try {
      await buyWithCoins({ userId, itemId: item.id });
      notifySuccess(); // vibración al comprar
      setShopMascotState("celebrating");
      setShopMascotBubble("¡Genial!");
      setTimeout(() => { setShopMascotState("idle"); setShopMascotBubble(null); }, 2500);
      Alert.alert("¡A todo dar! ✅", `${item.qty} ${item.label} en tu morral`);
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
        fromX: width / 2,
        fromY: height * 0.65,
        toX: t.x + t.w / 2,
        toY: t.y + t.h / 2,
        coins: r.coinsAdded ?? 25,
      });
    } catch (e) {
      Alert.alert("Espérate", e.message ?? "Error");
    } finally {
      setBuying(false);
    }
  }

  function handleBuyBundle() {
    Alert.alert(
      "¡Con todo y chile! 🌶",
      "Este paquete estará disponible cuando la app llegue a Google Play.",
      [{ text: "¡Ya mero!" }]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <ImageBackground
        source={require("../../assets/images/bg.png")}
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

          {/* Bundle deal */}
          <View style={s.bundleTitleWrap}>
            <View style={s.bundleTitleBg}>
              <Text style={s.bundleTitleText}>¡Con todo y chile!</Text>
            </View>
          </View>
          <BundleCard activePass={activePass} onBuy={handleBuyBundle} />

          {/* Gratis */}
          <SectionBanner title="Gratis" />
          <GratisSection cooldownMs={cooldown} onClaim={handleClaim} />

          {/* Varos (coin packs) */}
          <SectionBanner title="Varos" />
          <ItemRow items={VAROS.slice(0, 3)} onBuy={handleBuyItem} />
          <ItemRow items={VAROS.slice(3, 6)} onBuy={handleBuyItem} />

          {/* Trucos (power-ups) */}
          <SectionBanner title="Trucos" />
          <ItemRow items={TRUCOS} onBuy={handleBuyItem} />

          {/* Fichas (artículos especiales) */}
          <SectionBanner title="Fichas" />
          <ItemRow items={FICHAS} onBuy={handleBuyItem} />

          {/* Sin Anuncios */}
          <SectionBanner title="Sin Anuncios" />
          <View style={s.sinAnunciosCard}>
            <Image source={require("../../assets/icons/ads.png")} style={s.sinAnunciosIcon} />
            <View style={{ flex: 1 }}>
              <Text style={s.sinAnunciosTitle}>Sin Anuncios por 1 mes</Text>
              <Text style={s.sinAnunciosDesc}>
                Disfruta del juego sin interrupciones. Puedes seguir viendo videos para ganar monedas.
              </Text>
              <TouchableOpacity
                style={s.sinAnunciosBtn}
                onPress={() =>
                  Alert.alert(
                    "Suscripcion Sin Anuncios",
                    "Disponible cuando la app este en Google Play.\n\nPrecio: $5.00 USD / mes (al cambio de tu pais)",
                    [{ text: "¡Ya mero!" }]
                  )
                }
              >
                <Text style={s.sinAnunciosBtnText}>$ 5.00 USD / mes</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {buying && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        <CoinFlyOverlay coins={flyCoins} particles={particles} onCoinArrived={onCoinArrived} />
      </ImageBackground>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ACTION_BG     = GOLD;
const ACTION_BORDER = "#C8950A";
const ACTION_TEXT   = "#523600";

const s = StyleSheet.create({
  bg: {
    flex: 1,
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
    top: height * 0.12,
    left: width * 0.035,
    zIndex: 200,
  },
  // Botón cerrar flotante (sobre el TopBar)
  closeBtn: {
    position: "absolute",
    top: height * 0.12,
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
    paddingTop: height * 0.18,
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
});
