import { useQuery } from "convex/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
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
import { CULTURAL_PATHS } from "../config/culturalTaxonomy";
const { getCulturalAsset } = require("../config/culturalAssets.js");
const { getChallengePresentation } = require("../config/difficultyPresentation.js");
import { useAuth } from "../context/AuthContext";
import { notifySuccess, tapMedium } from "../services/haptics";
import { TABLET_MODE } from "../utils/tabletSetup";

const { width } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

// ── Camino serpenteante (estilo Duolingo) ──────────────────────────────────────
// Los nodos siguen una curva suave: centro → derecha → centro → izquierda.
// Son proporciones del ancho real de la lista (se recalcula al rotar).
const WAVE_RATIOS = TABLET_MODE
  ? [0.44, 0.56, 0.64, 0.56, 0.44, 0.32, 0.24, 0.32]
  : [0.40, 0.56, 0.66, 0.56, 0.40, 0.24, 0.14, 0.24];

// ── Tamaños ───────────────────────────────────────────────────────────────────
const NODE = 66;   // diámetro nodo normal
const NODE_C = 80;   // diámetro nodo actual
const DEPTH = 5;    // profundidad 3-D
const ROW_H = TABLET_MODE ? 118 : 124;
const ZONE_H = 164; // altura fija del encabezado de camino (incluye márgenes)
const TRAIL_DOTS = 4; // puntitos que unen un nodo con el anterior



// ── ZoneBanner: encabezado de camino tipo «unidad» ─────────────────────────────
function ZoneBanner({ item, currentLevel }) {
  const { zone, round, firstIndex, levelCount } = item;
  const asset = zone.isNeutral ? null : getCulturalAsset('path', zone.id);
  const pathNumber = zone.isNeutral ? null : CULTURAL_PATHS.findIndex(({ id }) => id === zone.id) + 1;
  const done = Math.max(0, Math.min(currentLevel - firstIndex, levelCount));
  const complete = done >= levelCount;
  const kicker = zone.isNeutral
    ? 'TU RECORRIDO'
    : `${round && round > 1 ? `VUELTA ${round} · ` : ''}CAMINO ${pathNumber}`;
  return (
    <View style={styles.zoneWrap}>
      <View
        style={[styles.zoneBanner, { backgroundColor: zone.color, borderBottomColor: zone.dark }]}
        accessible
        accessibilityLabel={`${kicker.toLowerCase()}, ${zone.name}. ${done} de ${levelCount} niveles.`}
      >
        <View style={styles.zoneTop}>
          <View style={styles.zoneBannerTexts}>
            <Text style={styles.zoneKicker}>{kicker}</Text>
            <Text style={styles.zoneBannerName} numberOfLines={1}>{zone.name}</Text>
            <Text style={styles.zoneBannerDesc} numberOfLines={2}>{zone.desc}</Text>
          </View>
          {asset ? (
            <CulturalAtlasIcon asset={asset} size={56} borderRadius={12} decorative style={styles.zoneBannerAtlas} />
          ) : <Text style={styles.zoneBannerEmoji}>{zone.emoji}</Text>}
        </View>
        <View style={styles.zoneProgressRow}>
          <View style={styles.zoneProgressTrack}>
            <View style={[styles.zoneProgressFill, { width: `${levelCount ? (done / levelCount) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.zoneProgressText}>{complete ? '✅ Completo' : `${done}/${levelCount}`}</Text>
        </View>
      </View>
    </View>
  );
}

// ── DuoNode ───────────────────────────────────────────────────────────────────
function DuoNode({ item, prevX, currentLevel, openedLevel, setOpenedLevel, navigation, screenW, waveX, reduceMotion }) {
  const { level, zone, waveIdx, displayIndex } = item;
  // Use displayIndex (position in sorted order) to compare against currentLevel
  const n = displayIndex;

  let isCompleted = n < currentLevel;
  let isCurrent = n === currentLevel;
  let isLocked = n > currentLevel;

  const isOpen = openedLevel === n;

  const nodeSize = isCurrent ? NODE_C : NODE;
  const radius = nodeSize / 2;
  // El nodo se centra en su punto de la curva
  const centerX = waveX[waveIdx % waveX.length];
  const x = centerX - nodeSize / 2;

  // Globo «¡EMPIEZA!» que rebota sobre el nivel actual
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isCurrent || reduceMotion) { bounce.setValue(0); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -6, duration: 600, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isCurrent, reduceMotion, bounce]);

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

  const icon = isLocked ? "🔒" : isCompleted ? "✓" : "★";
  const iconSize = nodeSize * (isCompleted ? 0.30 : 0.34);
  const challenge = getChallengePresentation(level);

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

      {/* Puntitos del camino desde el nodo anterior */}
      {prevX != null && Array.from({ length: TRAIL_DOTS }, (_, i) => {
        const t = (i + 1) / (TRAIL_DOTS + 1);
        const fromY = -ROW_H + 16 + NODE / 2;
        const toY = 16 + nodeSize / 2;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={[styles.trailDot, {
              left: prevX + (centerX - prevX) * t - 4,
              top: fromY + (toY - fromY) * t - 4,
              backgroundColor: isLocked ? 'rgba(255,255,255,0.16)' : zone.color,
            }]}
          />
        );
      })}

      {/* Nodo posicionado horizontalmente según la onda */}
      <View style={[styles.nodeArea, { left: x }]}>

        {/* Globo sobre el nivel actual */}
        {isCurrent && !isOpen && (
          <Animated.View pointerEvents="none" style={[styles.startBubble, { borderColor: zone.color, transform: [{ translateY: bounce }] }]}>
            <Text style={[styles.startBubbleText, { color: zone.color }]}>¡EMPIEZA!</Text>
          </Animated.View>
        )}

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
              accessibilityRole="button"
              accessibilityLabel={challenge.visible ? `Nivel ${n}, ${challenge.label}` : `Nivel ${n}`}
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
              {challenge.visible && <Text style={styles.challengeStar}>{challenge.icon}</Text>}
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
              {challenge.visible && (
                <Text style={styles.challengeLabel}>{challenge.icon} {challenge.label}</Text>
              )}
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

export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { userId, user } = useAuth();
  const listRef = useRef(null);
  const [openedLevel, setOpenedLevel] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduceMotion);
    return () => sub?.remove?.();
  }, []);

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


  const renderItem = ({ item, index }) => {
    if (item.type === "path") return <ZoneBanner item={item} currentLevel={currentLevel} />;
    // Solo se unen con puntitos los nodos seguidos del mismo tramo
    const prev = items[index - 1];
    const prevX = prev?.type === "level" ? waveX[prev.waveIdx % waveX.length] : null;
    return (
      <DuoNode
        item={item}
        prevX={prevX}
        reduceMotion={reduceMotion}
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

      {/* Progreso general */}
      <View style={styles.overallWrap}>
        <Text style={styles.overallTitle}>🇲🇽 México Vivido</Text>
        <View style={styles.overallTrack}>
          <View style={[styles.overallFill, { width: `${totalLevels ? Math.min(100, (completedLevels / totalLevels) * 100) : 0}%` }]} />
        </View>
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

  // Encabezado de camino (tarjeta con borde inferior 3-D)
  zoneWrap: { height: ZONE_H, paddingTop: 22, paddingBottom: 14, paddingHorizontal: 14 },
  zoneBanner: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 5,
    justifyContent: "space-between",
  },
  zoneTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  zoneKicker: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  zoneBannerEmoji: { fontSize: 34 },
  zoneBannerAtlas: { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.45)" },
  zoneBannerTexts: { flex: 1 },
  zoneBannerName: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 1 },
  zoneBannerDesc: { color: "rgba(255,255,255,0.85)", fontSize: 11.5, fontWeight: "600", marginTop: 2, lineHeight: 15 },
  zoneProgressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  zoneProgressTrack: { flex: 1, height: 9, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.22)", overflow: "hidden" },
  zoneProgressFill: { height: "100%", borderRadius: 5, backgroundColor: "#FFD54F" },
  zoneProgressText: { color: "#fff", fontSize: 11, fontWeight: "900", minWidth: 44, textAlign: "right" },

  // Progreso general
  overallWrap: { marginHorizontal: 16, marginTop: 10 },
  overallTitle: { color: "#fff", fontSize: 15, fontWeight: "900", marginBottom: 6 },
  overallTrack: { height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" },
  overallFill: { height: "100%", borderRadius: 5, backgroundColor: "#58CC02" },

  // Puntitos del camino entre nodos
  trailDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, opacity: 0.85 },

  // Globo «¡EMPIEZA!»
  startBubble: {
    position: "absolute",
    top: -40,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 5,
    zIndex: 20,
  },
  startBubbleText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },

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
  challengeStar: {
    position: "absolute",
    top: 3,
    right: 7,
    fontSize: 13,
  },
  challengeLabel: {
    color: AMBER,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginBottom: 6,
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
