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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import DraggablePet from "../components/PetCompanion/DraggablePet";
import CulturalAtlasIcon from "../components/CulturalAtlasIcon";
import { buildCulturalMapItems } from "../config/culturalPathSelection";
const { getCulturalAsset } = require("../config/culturalAssets.js");
import { useAuth } from "../context/AuthContext";
import { notifySuccess, tapMedium } from "../services/haptics";
import { TABLET_MODE } from "../utils/tabletSetup";

const { width } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

// ── Wave ratios — spread nodes across ~75% of screen width ───────────────────
// Computed dynamically inside MapScreen to support orientation changes.
// Tablet: 3-node diagonal groups (left → center → right, repeating every 3)
// Phone:  2-position clear zigzag (left ↔ right)
const WAVE_RATIOS = TABLET_MODE
  ? [0.08, 0.50, 0.88]
  : [0.12, 0.72];

// ── Tamaños ───────────────────────────────────────────────────────────────────
const NODE = 66;   // diámetro nodo normal
const NODE_C = 80;   // diámetro nodo actual
const DEPTH = 5;    // profundidad 3-D
// Larger ROW_H on phone gives diagonal connectors a better angle
const ROW_H = TABLET_MODE ? 130 : 160;



// ── ZoneBanner ────────────────────────────────────────────────────────────────
function ZoneBanner({ zone }) {
  const asset = zone.isNeutral ? null : getCulturalAsset('path', zone.id);
  return (
    <View style={[styles.zoneBanner, { backgroundColor: zone.color }]}>
      {asset ? (
        <CulturalAtlasIcon
          asset={asset}
          size={58}
          borderRadius={9}
          accessibilityLabel={`Ilustración del camino ${zone.name}`}
          style={styles.zoneBannerAtlas}
        />
      ) : <Text style={styles.zoneBannerEmoji}>{zone.emoji}</Text>}
      <View style={styles.zoneBannerTexts}>
        <Text style={styles.zoneBannerName}>{zone.name.toUpperCase()}</Text>
        <Text style={styles.zoneBannerDesc}>{zone.desc}</Text>
      </View>
      {zone.levels && (
        <View style={styles.zoneBannerBadge}>
          <Text style={styles.zoneBannerBadgeText}>
            {zone.levels[0]}–{zone.levels[1]}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── DuoNode ───────────────────────────────────────────────────────────────────
function DuoNode({ item, currentLevel, openedLevel, setOpenedLevel, navigation, screenW, waveX }) {
  const { level, zone, waveIdx, displayIndex } = item;
  // Use displayIndex (position in sorted order) to compare against currentLevel
  const n = displayIndex;

  let isCompleted = n < currentLevel;
  let isCurrent = n === currentLevel;
  let isLocked = n > currentLevel;

  const isOpen = openedLevel === n;

  const nodeSize = isCurrent ? NODE_C : NODE;
  const radius = nodeSize / 2;
  const x = waveX[waveIdx % waveX.length];

  // Colores
  let faceColor, shadowColor;
  if (!isLocked) {
    faceColor = zone.color;
    shadowColor = zone.dark;
  } else {
    faceColor = "#3A3A3A";
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

  const icon = isLocked ? "🔒" : isCompleted ? "✓" : "▶";
  const iconSize = nodeSize * (isCompleted ? 0.30 : 0.34);

  // Popup: centrar bajo el nodo pero nunca salirse de pantalla
  const POPUP_W = screenW * (TABLET_MODE ? 0.44 : 0.76);
  const MARGIN = 14;
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
            <View style={[styles.popupCard, { borderColor: isLocked ? "rgba(139,69,19,0.22)" : zone.color + "88" }]}>
              <Text style={styles.popupWord} numberOfLines={1}>
                {isLocked ? `🔒 Nivel ${n}` : isCurrent ? `🎮 Nivel ${n}` : level.word}
              </Text>
              {!isLocked && !isCurrent && (
                <Text style={styles.popupMeaning} numberOfLines={2}>
                  {level.meaning}
                </Text>
              )}
              {isCurrent && (
                <Text style={[styles.popupMeaning, { marginBottom: 14 }]}>
                  ¡Aquí vas! Continúa donde lo dejaste.
                </Text>
              )}
              {isLocked ? (
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

export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { userId, user } = useAuth();
  const listRef = useRef(null);
  const [openedLevel, setOpenedLevel] = useState(null);
  const [showShop, setShowShop] = useState(false);

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
  const allLevels = useQuery(api.levels.getAllLevels, userId ? { userId } : "skip");

  const currentLevel = levelInfo?.level ?? 1;
  const totalLevels = allLevels?.length ?? 0;
  const culturalOrderVersion = allLevels?.[0]?.culturalOrderVersion;
  const items = useMemo(
    () => buildCulturalMapItems(allLevels, culturalOrderVersion, WAVE_RATIOS.length),
    [allLevels, culturalOrderVersion]
  );
  const completedLevels = Math.max(0, currentLevel - 1);

  // Pre-compute item heights for getItemLayout — zone banners are ~104px, level rows are ROW_H.
  // Without getItemLayout, scrollToIndex fails silently for off-screen items.
  const ZONE_H = 104; // marginTop(32) + paddingVertical(14)*2 + content(~36) + marginBottom(8)
  const itemLayouts = useMemo(() => {
    let offset = 0;
    return items.map((item, index) => {
      const length = item.type === "path" ? ZONE_H : ROW_H;
      const layout = { length, offset, index };
      offset += length;
      return layout;
    });
  }, [items]);

  const getItemLayout = (_data, index) =>
    itemLayouts[index] ?? { length: ROW_H, offset: index * ROW_H, index };

  useEffect(() => {
    if (!items.length || !listRef.current) return;
    const idx = items.findIndex(
      (it) => it.type === "level" && it.displayIndex === currentLevel
    );
    if (idx <= 3) return;
    // Scroll so current node appears roughly centered — show 2 items above it
    const targetIdx = Math.max(0, idx - 2);
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: targetIdx, animated: true, viewPosition: 0 });
    }, 400);
  }, [items, currentLevel]);


  const renderItem = ({ item }) => {
    if (item.type === "path") return <ZoneBanner zone={item.zone} />;
    return (
      <DuoNode
        item={item}
        currentLevel={currentLevel}
        openedLevel={openedLevel}
        setOpenedLevel={setOpenedLevel}
        navigation={navigation}
        screenW={listW}
        waveX={waveX}
      />
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bg.webp")}
      style={styles.screen}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={{ width: 70 }} />
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
          keyExtractor={(it) => it.key}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          initialNumToRender={25}
          maxToRenderPerBatch={15}
          windowSize={15}
          onScrollToIndexFailed={({ index }) => {
            // Fallback: use pre-computed offset if index wasn't measured yet
            const offset = itemLayouts[index]?.offset ?? index * ROW_H;
            listRef.current?.scrollToOffset({ offset: Math.max(0, offset - ROW_H * 2), animated: true });
          }}
          onScrollBeginDrag={() => setOpenedLevel(null)}
          onLayout={(e) => setListW(e.nativeEvent.layout.width)}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>🦅 ¡Sigue explorando, cuate!</Text>
              <Text style={[styles.footerText, { marginTop: 4, fontSize: 11 }]}>
                {totalLevels} niveles en total
              </Text>
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
          />
        );
      })()}
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,4,1,0.80)" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: { width: 70 },
  backText: { color: "#F59B40", fontSize: 15, fontWeight: "700" },
  title: { color: "#fff", fontSize: 16, fontWeight: "800", textAlign: "center", flex: 1 },
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
  statItem: { alignItems: "center", flex: 1 },
  statVal: { fontSize: 20, fontWeight: "900", color: "#fff" },
  statLbl: { fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: "600", marginTop: 1 },
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
  zoneBannerEmoji: { fontSize: 30 },
  zoneBannerAtlas: { borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  zoneBannerTexts: { flex: 1 },
  zoneBannerName: { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  zoneBannerDesc: { color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "600", marginTop: 2 },
  zoneBannerBadge: { backgroundColor: "rgba(0,0,0,0.22)", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  zoneBannerBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

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
    borderLeftWidth: 10, borderLeftColor: "transparent",
    borderRightWidth: 10, borderRightColor: "transparent",
    borderBottomWidth: 12, borderBottomColor: WHEAT,
    alignSelf: "center",
    marginBottom: -1,
  },
  popupCard: {
    backgroundColor: WHEAT,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
  },
  popupWord: {
    color: BROWN,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 5,
  },
  popupMeaning: {
    color: "#7A4020",
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
    backgroundColor: WHEAT2,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139,69,19,0.25)",
  },
  popupBtnLockedText: {
    color: "#C4A882",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.8,
  },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { alignItems: "center", paddingVertical: 32 },
  footerText: { color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: "600" },
});
