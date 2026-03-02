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

const { width } = Dimensions.get("window");

// ── Winding path — zigzag suave ───────────────────────────────────────────────
const WAVE_X = [
  width * 0.55,   // derecha
  width * 0.32,   // centro-derecha
  width * 0.10,   // izquierda
  width * 0.32,   // centro-derecha
];

// ── Tamaños ───────────────────────────────────────────────────────────────────
const NODE   = 66;   // diámetro nodo normal
const NODE_C = 80;   // diámetro nodo actual
const DEPTH  = 5;    // profundidad 3-D
const ROW_H  = 110;  // altura fija de cada fila (da el espacio vertical)

// ── Build items ───────────────────────────────────────────────────────────────
function buildItems(allLevels) {
  if (!allLevels || allLevels.length === 0) return [];
  const items = [];
  let lastZoneId = null;
  let waveIdx = 0;
  for (const lvl of allLevels) {
    const zone = getZone(lvl.levelNumber);
    if (zone.id !== lastZoneId) {
      items.push({ type: "zone", zone });
      lastZoneId = zone.id;
      waveIdx = 0;
    }
    items.push({ type: "level", level: lvl, zone, waveIdx: waveIdx % WAVE_X.length });
    waveIdx++;
  }
  return items;
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
function DuoNode({ item, currentLevel, openedLevel, setOpenedLevel, navigation }) {
  const { level, zone, waveIdx } = item;
  const n           = level.levelNumber;
  const isCompleted = n < currentLevel;
  const isCurrent   = n === currentLevel;
  const isLocked    = n > currentLevel;
  const isOpen      = openedLevel === n;

  const nodeSize = isCurrent ? NODE_C : NODE;
  const radius   = nodeSize / 2;
  const x        = WAVE_X[waveIdx];

  // Colores
  let faceColor, shadowColor;
  if (!isLocked) {
    faceColor  = zone.color;
    shadowColor = zone.dark;
  } else {
    faceColor  = "#3A3A3A";
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
      navigation.navigate("Gameplay", { reviewLevel: n });
    } else {
      navigation.navigate("Gameplay");
    }
  };

  const icon     = isLocked ? "🔒" : isCompleted ? "⭐" : "▶";
  const iconSize = nodeSize * (isCompleted ? 0.42 : 0.38);

  // Popup: centrar bajo el nodo pero nunca salirse de pantalla
  const POPUP_W   = width * 0.76;
  const MARGIN    = 14;
  const idealLeft = -(POPUP_W / 2 - nodeSize / 2);
  const popupLeft = Math.max(MARGIN - x, Math.min(idealLeft, width - MARGIN - POPUP_W - x));
  // Flecha apunta siempre al centro del nodo (nodeSize/2), compensando el desplazamiento del popup
  const arrowLeft = Math.max(16, Math.min(nodeSize / 2 - 10 - popupLeft, POPUP_W - 36));

  return (
    // Fila con altura fija para que no se encime con la anterior
    <View style={[styles.row, { minHeight: isOpen ? ROW_H + 148 : ROW_H }]}>

      {/* Nodo posicionado horizontalmente según la onda */}
      <View style={[styles.nodeArea, { left: x }]}>

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
              <Text style={{ fontSize: iconSize }}>{icon}</Text>
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
            <View style={[styles.popupCard, { borderColor: isLocked ? "rgba(255,255,255,0.08)" : zone.color + "55" }]}>
              <Text style={styles.popupWord} numberOfLines={1}>
                {isLocked ? `🔒 Nivel ${n}` : level.word}
              </Text>
              {!isLocked && (
                <Text style={styles.popupMeaning} numberOfLines={2}>
                  {level.meaning}
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
                    {isCompleted ? "🔁  REPASAR" : "▶  JUGAR"}
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

// ── MapScreen ─────────────────────────────────────────────────────────────────
export default function MapScreen({ navigation }) {
  const { userId } = useAuth();
  const listRef    = useRef(null);
  const [openedLevel, setOpenedLevel] = useState(null);

  const levelInfo = useQuery(api.users.getCurrentLevel, userId ? { userId } : "skip");
  const allLevels = useQuery(api.levels.getAllLevels);

  const currentLevel    = levelInfo?.level ?? 1;
  const items           = useMemo(() => buildItems(allLevels), [allLevels]);
  const totalLevels     = allLevels?.length ?? 0;
  const completedLevels = Math.max(0, currentLevel - 1);

  useEffect(() => {
    if (!items.length || !listRef.current) return;
    const idx = items.findIndex(
      (it) => it.type === "level" && it.level.levelNumber === currentLevel
    );
    if (idx > 3) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: Math.max(0, idx - 3), animated: true });
      }, 500);
    }
  }, [items, currentLevel]);

  const renderItem = ({ item }) => {
    if (item.type === "zone") return <ZoneBanner zone={item.zone} />;
    return (
      <DuoNode
        item={item}
        currentLevel={currentLevel}
        openedLevel={openedLevel}
        setOpenedLevel={setOpenedLevel}
        navigation={navigation}
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

      {!allLevels ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Cargando el mapa... 🗺️</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(it) =>
            it.type === "zone" ? `z-${it.zone.id}` : `l-${it.level.levelNumber}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          onScrollBeginDrag={() => setOpenedLevel(null)}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>🦅 ¡Sigue avanzando, cuate!</Text>
            </View>
          }
        />
      )}
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
});
