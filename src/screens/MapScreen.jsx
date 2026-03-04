import { useQuery } from "convex/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { getZone } from "../config/mexicoZones";
import { tapMedium, notifySuccess } from "../services/haptics";
import { TABLET_MODE } from "../utils/tabletSetup";
import DraggablePet from "../components/PetCompanion/DraggablePet";

const { width } = Dimensions.get("window");

// ── Wave ratios — spread nodes across ~75% of screen width ───────────────────
// Computed dynamically inside MapScreen to support orientation changes.
// Tablet: 3-node diagonal groups (left → center → right, repeating every 3)
// Phone:  2-position clear zigzag (left ↔ right)
const WAVE_RATIOS = TABLET_MODE
  ? [0.08, 0.50, 0.88]
  : [0.12, 0.72];

// ── Tamaños ───────────────────────────────────────────────────────────────────
const NODE   = 66;   // diámetro nodo normal
const NODE_C = 80;   // diámetro nodo actual
const DEPTH  = 5;    // profundidad 3-D
// Larger ROW_H on phone gives diagonal connectors a better angle
const ROW_H  = TABLET_MODE ? 130 : 160;

// ── Pack names for adult zones ────────────────────────────────────────────────
const ADULT_PACK_LABELS = {
  insultos: { name: "Insultos Finos", emoji: "🌶️", color: "#9B1717", dark: "#6B0E0E" },
  suegra:   { name: "Diccionario de la Suegra", emoji: "👵", color: "#6B2FA0", dark: "#421A6B" },
};

// ── Build items ───────────────────────────────────────────────────────────────
function buildItems(allLevels) {
  if (!allLevels || allLevels.length === 0) return [];
  const items = [];
  let lastZoneId = null;
  let lastPackId = null;
  let waveIdx = 0;
  for (let i = 0; i < allLevels.length; i++) {
    const lvl = allLevels[i];
    // displayIndex is the 1-based position in the sorted gameplay order.
    // currentLevel from Convex also uses this same ordering, so we must
    // compare displayIndex (not lvl.levelNumber) against currentLevel.
    const displayIndex = i + 1;

    if (lvl.isAdult) {
      // Adult pack banner — shown once per pack
      if (lvl.packId !== lastPackId) {
        items.push({ type: "adult-zone", packId: lvl.packId });
        lastPackId = lvl.packId;
        waveIdx = 0;
      }
      const packInfo = ADULT_PACK_LABELS[lvl.packId] ?? ADULT_PACK_LABELS.insultos;
      items.push({ type: "level", level: lvl, zone: { color: packInfo.color, dark: packInfo.dark, id: `adult-${lvl.packId}` }, waveIdx: waveIdx % WAVE_RATIOS.length, displayIndex });
      waveIdx++;
    } else {
      const zone = getZone(displayIndex);
      if (zone.id !== lastZoneId) {
        items.push({ type: "zone", zone });
        lastZoneId = zone.id;
        waveIdx = 0;
      }
      items.push({ type: "level", level: lvl, zone, waveIdx: waveIdx % WAVE_RATIOS.length, displayIndex });
      waveIdx++;
    }
  }
  return items;
}

// ── AdultZoneBanner ───────────────────────────────────────────────────────────
function AdultZoneBanner({ packId }) {
  const info = ADULT_PACK_LABELS[packId] ?? ADULT_PACK_LABELS.insultos;
  return (
    <View style={[styles.adultBanner, { borderColor: info.color + "55" }]}>
      <View style={[styles.adultBannerStripe, { backgroundColor: info.color }]} />
      <Text style={styles.adultBannerEmoji}>{info.emoji}</Text>
      <View style={styles.adultBannerTexts}>
        <Text style={[styles.adultBannerTitle, { color: info.color }]}>🔞 {info.name.toUpperCase()}</Text>
        <Text style={styles.adultBannerSub}>Pack de contenido para adultos — desbloquea en la tienda</Text>
      </View>
    </View>
  );
}

// ── ZoneBanner ────────────────────────────────────────────────────────────────
function ZoneBanner({ zone }) {
  return (
    <View style={[styles.zoneBanner, { backgroundColor: zone.color }]}>
      <Text style={styles.zoneBannerEmoji}>{zone.emoji}</Text>
      <View style={styles.zoneBannerTexts}>
        <Text style={styles.zoneBannerName}>{zone.name.toUpperCase()}</Text>
        <Text style={styles.zoneBannerDesc}>{zone.desc}</Text>
      </View>
      <View style={styles.zoneBannerBadge}>
        <Text style={styles.zoneBannerBadgeText}>
          {zone.levels[0]}–{zone.levels[1] === 9999 ? "∞" : zone.levels[1]}
        </Text>
      </View>
    </View>
  );
}

// ── DuoNode ───────────────────────────────────────────────────────────────────
function DuoNode({ item, currentLevel, openedLevel, setOpenedLevel, navigation, screenW, waveX, adultUnlocked, onOpenShop }) {
  const { level, zone, waveIdx, displayIndex } = item;
  // Use displayIndex (position in sorted order) to compare against currentLevel
  const n = displayIndex;

  // ── Adult purchase-lock overrides normal progression logic ────────────────
  const isAdultLevel = !!level.isAdult;
  const isAdultPurchaseLocked = isAdultLevel && !adultUnlocked.includes("content_" + level.packId);

  let isCompleted, isCurrent, isLocked;
  if (isAdultLevel) {
    if (isAdultPurchaseLocked) {
      isCompleted = false;
      isCurrent   = false;
      isLocked    = true;  // purchase-locked, not progression-locked
    } else {
      // Purchased — always playable regardless of progression
      isCompleted = false;
      isCurrent   = false;
      isLocked    = false;
    }
  } else {
    isCompleted = n < currentLevel;
    isCurrent   = n === currentLevel;
    isLocked    = n > currentLevel;
  }

  const isOpen = openedLevel === n;

  const nodeSize = isCurrent ? NODE_C : NODE;
  const radius   = nodeSize / 2;
  const x        = waveX[waveIdx % waveX.length];

  // Colores
  let faceColor, shadowColor;
  if (isAdultPurchaseLocked) {
    faceColor   = "#3D0B5E";
    shadowColor = "#1E0530";
  } else if (!isLocked) {
    faceColor   = zone.color;
    shadowColor = zone.dark;
  } else {
    faceColor   = "#3A3A3A";
    shadowColor = "#1C1C1C";
  }

  // Animación de presión
  const pressY = useRef(new Animated.Value(0)).current;
  const onPressIn = () => {
    tapMedium();
    Animated.spring(pressY, { toValue: DEPTH, speed: 60, bounciness: 0, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(pressY, { toValue: 0, speed: 22, bounciness: 8, useNativeDriver: true }).start();
  };

  const handlePress = () => setOpenedLevel(isOpen ? null : n);

  const handlePlay = () => {
    notifySuccess();
    setOpenedLevel(null);
    if (isCompleted) {
      // reviewLevel uses the DB levelNumber so GameplayScreen can query it
      navigation.navigate("Gameplay", { reviewLevel: level.levelNumber });
    } else {
      navigation.navigate("Gameplay");
    }
  };

  const icon     = isAdultPurchaseLocked ? "🔞" : isLocked ? "🔒" : isCompleted ? "✓" : "▶";
  const iconSize = nodeSize * (isCompleted ? 0.30 : 0.34);

  // Popup: centrar bajo el nodo pero nunca salirse de pantalla
  const POPUP_W   = screenW * (TABLET_MODE ? 0.44 : 0.76);
  const MARGIN    = 14;
  const idealLeft = -(POPUP_W / 2 - nodeSize / 2);
  const popupLeft = Math.max(MARGIN - x, Math.min(idealLeft, screenW - MARGIN - POPUP_W - x));
  // Flecha apunta siempre al centro del nodo (nodeSize/2), compensando el desplazamiento del popup
  const arrowLeft = Math.max(16, Math.min(nodeSize / 2 - 10 - popupLeft, POPUP_W - 36));

  return (
    // Fila con altura fija para que no se encime con la anterior
    <View style={[styles.row, { minHeight: isOpen ? ROW_H + 148 : ROW_H }]}>

      {/* Nodo posicionado horizontalmente según la onda */}
      <View style={[styles.nodeArea, { left: x }]}>

        {/* Línea conectora — arriba del nodo (ocupa el padding de 16px antes del cuerpo) */}
        <View style={{
          position: 'absolute',
          top: -16,
          left: nodeSize / 2 - 2.5,
          width: 5,
          height: 16,
          backgroundColor: isLocked ? 'rgba(255,255,255,0.07)' : zone.color + '70',
          borderRadius: 3,
        }} />

        {/* Línea conectora — abajo del nodo */}
        <View style={{
          position: 'absolute',
          top: nodeSize + DEPTH + 2,
          left: nodeSize / 2 - 2.5,
          width: 5,
          height: ROW_H - 16 - nodeSize - DEPTH - 2,
          backgroundColor: isLocked ? 'rgba(255,255,255,0.07)' : zone.color + '70',
          borderRadius: 3,
        }} />

        {/* Anillo punteado para nivel actual */}
        {isCurrent && (
          <View style={[styles.dashedRing, {
            width: nodeSize + 18,
            height: nodeSize + 18,
            borderRadius: (nodeSize + 18) / 2,
            borderColor: zone.color,
            top: -(9 + DEPTH / 2),
            left: -9,
          }]} />
        )}

        {/* Cuerpo 3-D: sombra + cara */}
        <View style={{ width: nodeSize, height: nodeSize + DEPTH }}>
          {/* Sombra — capa de atrás */}
          <View style={[styles.shadow3d, {
            width: nodeSize,
            height: nodeSize,
            borderRadius: radius,
            backgroundColor: shadowColor,
            top: DEPTH,
          }]} />

          {/* Cara — se anima hacia abajo al presionar */}
          <Animated.View style={[styles.face3d, { transform: [{ translateY: pressY }] }]}>
            <TouchableOpacity
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={handlePress}
              activeOpacity={1}
              style={[styles.nodeFace, {
                width: nodeSize,
                height: nodeSize,
                borderRadius: radius,
                backgroundColor: faceColor,
              }]}
            >
              {/* Brillo top-left */}
              <View style={[styles.nodeShine, {
                width: nodeSize * 0.55,
                height: nodeSize * 0.28,
                borderRadius: radius,
              }]} />
              <Text style={{ fontSize: iconSize, color: '#fff', lineHeight: iconSize * 1.1 }}>{icon}</Text>
              <Text style={{
                fontSize: nodeSize * 0.20,
                color: isLocked ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.90)',
                fontWeight: '900',
                lineHeight: nodeSize * 0.24,
                marginTop: 1,
              }}>{n}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Etiqueta nivel actual */}
        {isCurrent && (
          <Text style={[styles.currentLabel, { color: zone.color }]}>
            Nivel {n}
          </Text>
        )}

        {/* Popup inline */}
        {isOpen && (
          <View style={[styles.popup, { left: popupLeft, width: POPUP_W }]}>
            <View style={[styles.popupArrow, { alignSelf: "flex-start", marginLeft: arrowLeft }]} />
            <View style={[styles.popupCard, { borderColor: isAdultPurchaseLocked ? "#6B2FA055" : isLocked ? "rgba(255,255,255,0.08)" : zone.color + "55" }]}>
              <Text style={styles.popupWord} numberOfLines={1}>
                {isAdultPurchaseLocked
                  ? `🔞 ${ADULT_PACK_LABELS[level.packId]?.name ?? "Pack +18"}`
                  : isLocked ? `🔒 Nivel ${n}` : isCurrent ? `🎮 Nivel ${n}` : level.word}
              </Text>
              {isAdultPurchaseLocked && (
                <Text style={[styles.popupMeaning, { marginBottom: 14 }]}>
                  Desbloquea este pack en la tienda para acceder al contenido +18.
                </Text>
              )}
              {!isAdultPurchaseLocked && !isLocked && !isCurrent && (
                <Text style={styles.popupMeaning} numberOfLines={2}>
                  {level.meaning}
                </Text>
              )}
              {isCurrent && (
                <Text style={[styles.popupMeaning, { marginBottom: 14 }]}>
                  ¡Aquí vas! Continúa donde lo dejaste.
                </Text>
              )}
              {isAdultPurchaseLocked ? (
                <TouchableOpacity
                  onPress={() => { setOpenedLevel(null); onOpenShop(); }}
                  style={[styles.popupBtn, { backgroundColor: "#6B2FA0" }]}
                  activeOpacity={0.82}
                >
                  <Text style={styles.popupBtnText}>🛒  IR A LA TIENDA</Text>
                </TouchableOpacity>
              ) : isLocked ? (
                <View style={styles.popupBtnLocked}>
                  <Text style={styles.popupBtnLockedText}>COMPLETA LOS ANTERIORES</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePlay}
                  style={[styles.popupBtn, { backgroundColor: zone.color }]}
                  activeOpacity={0.82}
                >
                  <Text style={styles.popupBtnText}>
                    {isCompleted ? "🔁  REPASAR" : isCurrent ? "▶  SEGUIR JUGANDO" : "▶  JUGAR"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ── ShopScreen lazy loader (rompe dep circular si aplica) ─────────────────────
let _ShopScreen = null;
const getShopScreen = () => {
  if (!_ShopScreen) _ShopScreen = require("../screens/ShopScreen").default;
  return _ShopScreen;
};

// ── MapScreen ─────────────────────────────────────────────────────────────────
export default function MapScreen({ navigation, route }) {
  const { userId, user } = useAuth();
  const listRef    = useRef(null);
  const [openedLevel, setOpenedLevel] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const scrollToAdultRef = useRef(false);

  const adultUnlocked = user?.adultContentUnlocked ?? [];

  // Scroll to adult zone when shop closes after a pack purchase
  useEffect(() => {
    if (!showShop && scrollToAdultRef.current) {
      scrollToAdultRef.current = false;
      setTimeout(() => {
        if (!listRef.current || !items.length) return;
        const idx = items.findIndex((it) => it.type === "adult-zone");
        if (idx >= 0) listRef.current.scrollToIndex({ index: idx, animated: true });
      }, 500);
    }
  }, [showShop, items]);

  // ── Actual rendered list width (updated via onLayout) ────────────────────
  // Using onLayout is the only reliable way to get the real render width on
  // tablets where Dimensions.get('window') is patched to 550 but the native
  // view may occupy the full screen width.
  const [listW, setListW] = useState(() => Dimensions.get("window").width);
  useEffect(() => {
    const sub = Dimensions.addEventListener("change", () => {
      setOpenedLevel(null); // close popup on rotation; listW updates via onLayout
    });
    return () => sub?.remove();
  }, []);
  const waveX = useMemo(() => WAVE_RATIOS.map((r) => listW * r), [listW]);

  const levelInfo = useQuery(api.users.getCurrentLevel, userId ? { userId } : "skip");
  const allLevels = useQuery(api.levels.getAllLevels, userId ? { userId } : {});

  const currentLevel    = levelInfo?.level ?? 1;
  const items           = useMemo(() => buildItems(allLevels), [allLevels]);
  const totalLevels     = allLevels?.length ?? 0;
  const completedLevels = Math.max(0, currentLevel - 1);

  useEffect(() => {
    if (!items.length || !listRef.current) return;
    // Use displayIndex (position in sorted order) to find current level in map
    const idx = items.findIndex(
      (it) => it.type === "level" && it.displayIndex === currentLevel
    );
    if (idx > 3) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: Math.max(0, idx - 3), animated: true });
      }, 500);
    }
  }, [items, currentLevel]);

  // Scroll to adult zone when navigated here from ShopScreen after an adult pack purchase
  const scrollToAdultParam = route?.params?.scrollToAdult;
  useEffect(() => {
    if (!scrollToAdultParam || !items.length || !listRef.current) return;
    setTimeout(() => {
      const idx = items.findIndex((it) => it.type === "adult-zone");
      if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true });
    }, 600);
  }, [scrollToAdultParam, items]);

  const renderItem = ({ item }) => {
    if (item.type === "zone") return <ZoneBanner zone={item.zone} />;
    if (item.type === "adult-zone") return <AdultZoneBanner packId={item.packId} />;
    return (
      <DuoNode
        item={item}
        currentLevel={currentLevel}
        openedLevel={openedLevel}
        setOpenedLevel={setOpenedLevel}
        navigation={navigation}
        screenW={listW}
        waveX={waveX}
        adultUnlocked={adultUnlocked}
        onOpenShop={() => setShowShop(true)}
      />
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bg.png")}
      style={styles.screen}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🗺️ Tu viaje por México</Text>
        {items.some((it) => it.type === "adult-zone") ? (
          <TouchableOpacity
            style={styles.adultJumpBtn}
            onPress={() => {
              const idx = items.findIndex((it) => it.type === "adult-zone");
              if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true });
            }}
          >
            <Text style={styles.adultJumpText}>🔞</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{completedLevels}</Text>
          <Text style={styles.statLbl}>⭐ Completados</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: "#F59B40" }]}>{currentLevel}</Text>
          <Text style={styles.statLbl}>📍 Actual</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{totalLevels}</Text>
          <Text style={styles.statLbl}>🗺️ Total</Text>
        </View>
      </View>

      {/* Mascota flotante draggable */}
      <DraggablePet scaleFactor={TABLET_MODE ? 0.50 : 0.16} />

      {!allLevels ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Cargando el mapa... 🗺️</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(it) =>
            it.type === "zone" ? `z-${it.zone.id}` : it.type === "adult-zone" ? `az-${it.packId}` : `l-${it.level.levelNumber}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          onScrollBeginDrag={() => setOpenedLevel(null)}
          onLayout={(e) => setListW(e.nativeEvent.layout.width)}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>🦅 ¡Sigue avanzando, cuate!</Text>
            </View>
          }
        />
      )}

      {/* ShopScreen modal — para desbloquear packs adultos */}
      {showShop && (() => {
        const ShopScreen = getShopScreen();
        return (
          <ShopScreen
            visible={showShop}
            onClose={() => setShowShop(false)}
            onAdultPackPurchased={() => { scrollToAdultRef.current = true; }}
          />
        );
      })()}
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,4,1,0.80)" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn:  { width: 70 },
  backText: { color: "#F59B40", fontSize: 15, fontWeight: "700" },
  title:    { color: "#fff", fontSize: 16, fontWeight: "800", textAlign: "center", flex: 1 },
  adultJumpBtn: { width: 70, alignItems: "flex-end" },
  adultJumpText: { fontSize: 22 },

  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    paddingVertical: 10,
  },
  statItem:    { alignItems: "center", flex: 1 },
  statVal:     { fontSize: 20, fontWeight: "900", color: "#fff" },
  statLbl:     { fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: "600", marginTop: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.10)" },

  // Zone banner
  zoneBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 32,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  zoneBannerEmoji:    { fontSize: 30 },
  zoneBannerTexts:    { flex: 1 },
  zoneBannerName:     { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  zoneBannerDesc:     { color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "600", marginTop: 2 },
  zoneBannerBadge:    { backgroundColor: "rgba(0,0,0,0.22)", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  zoneBannerBadgeText:{ color: "#fff", fontSize: 11, fontWeight: "800" },

  // FlatList
  list: { paddingBottom: 60, paddingTop: 6 },

  // ── Node row ──
  // Cada fila tiene altura mínima fija → los nodos no se enciman
  row: {
    position: "relative",   // para que nodeArea se posicione dentro
    width: "100%",
  },

  // Área del nodo — se posiciona horizontalmente con `left`
  nodeArea: {
    position: "absolute",
    top: 16,                // margen vertical dentro de la fila
    alignItems: "center",
  },

  // 3-D shadow (capa trasera)
  shadow3d: {
    position: "absolute",
  },

  // 3-D face (capa delantera)
  face3d: {
    position: "absolute",
    top: 0,
  },

  nodeFace: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  nodeShine: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  // Anillo punteado nivel actual
  dashedRing: {
    position: "absolute",
    borderWidth: 2.5,
    borderStyle: "dashed",
  },

  // Etiqueta "Nivel N" bajo el nodo actual
  currentLabel: {
    marginTop: NODE_C + DEPTH + 8,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // ── Popup ──
  popup: {
    position: "absolute",
    top: NODE_C + DEPTH + 4,
    left: -(width * 0.72 / 2 - NODE_C / 2),   // centra la tarjeta bajo el nodo
    width: width * 0.72,
    zIndex: 50,
  },
  popupArrow: {
    width: 0, height: 0,
    borderLeftWidth: 10,  borderLeftColor:  "transparent",
    borderRightWidth: 10, borderRightColor: "transparent",
    borderBottomWidth: 12,borderBottomColor: "#1C0E04",
    alignSelf: "center",
    marginBottom: -1,
  },
  popupCard: {
    backgroundColor: "#1C0E04",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
  },
  popupWord: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 5,
  },
  popupMeaning: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  popupBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  popupBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  popupBtnLocked: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  popupBtnLockedText: {
    color: "rgba(255,255,255,0.3)",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.8,
  },

  loading:     { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer:      { alignItems: "center", paddingVertical: 32 },
  footerText:  { color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: "600" },

  // Adult zone banner
  adultBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 40,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(60,10,90,0.55)",
    borderWidth: 1.5,
    gap: 12,
    overflow: "hidden",
  },
  adultBannerStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 5,
    height: "100%",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  adultBannerEmoji:  { fontSize: 28, marginLeft: 8 },
  adultBannerTexts:  { flex: 1 },
  adultBannerTitle:  { fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  adultBannerSub:    { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "600", marginTop: 2 },
});
