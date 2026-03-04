import { useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
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
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import AdBanner from "../components/AdBanner";
import { FONTS } from "../theme/designTokens";
import { REAL_WIDTH, TABLET_MODE } from "../utils/tabletSetup";

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD  = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

const { width, height } = Dimensions.get("window");

// Compute TopBar clearance accurately (mirrors TopBar.jsx sizing formula)
const TOP_SAFE   = Platform.OS === "ios" ? Math.max(32, height * 0.058) : Math.max(20, height * 0.04);
const TOP_BAR_H  = TOP_SAFE + width * 0.025 + width * 0.075 + width * 0.025;
const HEADER_TOP = Math.round(TOP_BAR_H + (TABLET_MODE ? 48 : 14));

// On tablet use more columns and real screen width so cards fill the screen evenly
const COL       = TABLET_MODE ? (REAL_WIDTH > 900 ? 5 : 4) : 3;
const SCREEN_W  = TABLET_MODE ? REAL_WIDTH : width;
const GRID_PAD  = TABLET_MODE ? 16 : 12;
const CARD_GAP  = TABLET_MODE ? 12 : 8;
const CARD_W    = (SCREEN_W - GRID_PAD * 2 - CARD_GAP * (COL - 1)) / COL;
// Cap emoji size so large CARD_W (wide tablets/phones) doesn't produce huge icons
const EMOJI_SIZE = Math.min(CARD_W * 0.38, 52);

// ─── 15 categorías canónicas (emoji + dificultad) ────────────────────────────
// Tier 1 — Fácil (verde): Comida, Bebida, Juegos, Modismos, Refranes
// Tier 2 — Medio (naranja): Música, Animales, Plantas, Artistas, Tradiciones, Cultura Popular, Leyendas
// Tier 3 — Difícil (rojo): Historia, Civilizaciones, Monumentos
const CAT_META = {
  // Tier 1 — Fácil
  "Comida":          { emoji: "🌮", diff: 1 },
  "Bebida":          { emoji: "🍹", diff: 1 },
  "Juegos":          { emoji: "🎯", diff: 1 },
  "Modismos":        { emoji: "🤙", diff: 1 },
  "Refranes":        { emoji: "💭", diff: 1 },
  // Tier 2 — Medio
  "Música":          { emoji: "🎶", diff: 2 },
  "Animales":        { emoji: "🦅", diff: 2 },
  "Plantas":         { emoji: "🌿", diff: 2 },
  "Artistas":        { emoji: "🎨", diff: 2 },
  "Tradiciones":     { emoji: "🎉", diff: 2 },
  "Cultura Popular": { emoji: "📺", diff: 2 },
  "Leyendas":        { emoji: "👻", diff: 2 },
  // Tier 3 — Difícil
  "Historia":        { emoji: "📜", diff: 3 },
  "Civilizaciones":  { emoji: "🗿", diff: 3 },
  "Monumentos":      { emoji: "🏛️", diff: 3 },
};

function getCatMeta(name) {
  return CAT_META[name] ?? { emoji: "📖", diff: 2 };
}

const DIFF_COLOR = { 1: "#4CAF50", 2: "#FF9800", 3: "#F44336" };
const DIFF_LABEL = { 1: "Fácil",    2: "Medio",    3: "Difícil"  };

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ColeccionScreen() {
  const { userId } = useAuth();
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('cat'); // 'cat' | 'region'

  const [dims, setDims] = React.useState(() => Dimensions.get('window'));
  React.useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);

  const dynW = dims.width;
  const dynH = dims.height;
  const dynScreenW = TABLET_MODE ? REAL_WIDTH : dynW;
  const dynCol = TABLET_MODE ? (dynScreenW > 900 ? 5 : 4) : 3;
  const dynCardGap = TABLET_MODE ? 12 : 8;
  const dynGridPad = TABLET_MODE ? 16 : 12;
  const dynCardW = (dynScreenW - dynGridPad * 2 - dynCardGap * (dynCol - 1)) / dynCol;
  const dynCardH = Math.min(dynCardW * 1.25, 160);
  const dynEmojiSize = Math.min(dynCardW * 0.38, 48);

  // Dynamic TopBar clearance
  const dynTopSafe = Platform.OS === 'ios' ? Math.max(32, dynH * 0.058) : Math.max(20, dynH * 0.04);
  const dynTopBarH = dynTopSafe + dynW * 0.025 + dynW * 0.075 + dynW * 0.025;
  const dynHeaderTop = Math.round(dynTopBarH + (TABLET_MODE ? 32 : 14));

  const categories = useQuery(
    api.collectionsQuery.getCollectionsWithProgress,
    { userId: userId ?? undefined }
  );

  const regions = useQuery(
    api.collectionsQuery.getRegionsWithProgress,
    { userId: userId ?? undefined }
  );

  const activeData = tab === 'cat' ? categories : regions;
  const isLoading  = activeData === undefined;

  // Pad rows to multiples of dynCol so the last row aligns left
  const paddedData = activeData
    ? [
        ...activeData,
        ...(activeData.length % dynCol !== 0
          ? Array(dynCol - (activeData.length % dynCol)).fill({ _pad: true })
          : []),
      ]
    : [];

  return (
    <ImageBackground
      source={require("../../assets/images/bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <TopBar />

      {/* Header + tab bar */}
      <View style={[styles.header, { marginTop: dynHeaderTop, marginHorizontal: dynScreenW * 0.04 }]}>
        <Text style={styles.headerTitle}>Colección</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'cat' && styles.tabBtnActive]}
            onPress={() => { setSelected(null); setTab('cat'); }}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabTxt, tab === 'cat' && styles.tabTxtActive]}>Categoría</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'region' && styles.tabBtnActive]}
            onPress={() => { setSelected(null); setTab('region'); }}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabTxt, tab === 'region' && styles.tabTxtActive]}>Por Región</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.infoText}>Cargando colecciones…</Text>
        </View>
      ) : !activeData || activeData.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.infoText}>Sin colecciones disponibles</Text>
        </View>
      ) : (
        <FlatList
          data={paddedData}
          numColumns={dynCol}
          key={dynCol}
          keyExtractor={(item, i) => item._pad ? `pad_${i}` : (item.key ?? item.name)}
          contentContainerStyle={[styles.grid, { paddingHorizontal: dynGridPad }]}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={[styles.row, { gap: dynCardGap }]}
          renderItem={({ item }) => {
            if (item._pad) {
              return <View style={[styles.colCard, styles.padCard, { width: dynCardW, height: dynCardH }]} />;
            }

            // ── Region card ──
            if (tab === 'region') {
              const pct = item.total > 0 ? (item.completed / item.total) * 100 : 0;
              return (
                <TouchableOpacity
                  style={[styles.colCard, { width: dynCardW, height: dynCardH }]}
                  activeOpacity={0.75}
                  onPress={() => setSelected(item)}
                >
                  <Text style={[styles.colEmoji, { fontSize: dynEmojiSize }]}>{item.emoji}</Text>
                  <Text style={styles.colName} numberOfLines={1}>{item.demonym}</Text>
                  <Text style={styles.colCount}>{item.completed}/{item.total}</Text>
                  <View style={styles.miniBar}>
                    <View style={[styles.miniFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                  </View>
                  <View style={[styles.diffDot, { backgroundColor: item.color }]}>
                    <Text style={styles.diffDotText}>{Math.round(pct)}%</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            // ── Category card ──
            const meta   = getCatMeta(item.name);
            const diff   = meta.diff;
            const diffBg = DIFF_COLOR[diff];
            const pct    = item.total > 0 ? (item.completed / item.total) * 100 : 0;
            return (
              <TouchableOpacity
                style={[styles.colCard, { width: dynCardW, height: dynCardH }]}
                activeOpacity={0.75}
                onPress={() => setSelected(item)}
              >
                <Text style={[styles.colEmoji, { fontSize: dynEmojiSize }]}>{meta.emoji}</Text>
                <Text style={styles.colName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.colCount}>{item.completed}/{item.total}</Text>
                <View style={styles.miniBar}>
                  <View style={[styles.miniFill, { width: `${pct}%`, backgroundColor: diffBg }]} />
                </View>
                <View style={[styles.diffDot, { backgroundColor: diffBg }]}>
                  <Text style={styles.diffDotText}>{DIFF_LABEL[diff]}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <AdBanner style={{ marginVertical: 4 }} />

      {/* ── Detail Modal ── */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <CategoryModal cat={selected} isRegion={tab === 'region'} onClose={() => setSelected(null)} />
        )}
      </Modal>
    </ImageBackground>
  );
}

// ─── Category / Region detail modal ──────────────────────────────────────────
function CategoryModal({ cat, isRegion, onClose }) {
  // Support both category (name/meta) and region (demonym/emoji/color) shapes
  const meta      = isRegion ? null : getCatMeta(cat.name);
  const diff      = meta?.diff ?? 0;
  const emoji     = isRegion ? cat.emoji : meta.emoji;
  const title     = isRegion ? cat.demonym : cat.name;
  const barColor  = isRegion ? cat.color : DIFF_COLOR[diff];
  const diffLabel = isRegion ? null : DIFF_LABEL[diff];
  const pct       = cat.total > 0 ? (cat.completed / cat.total) * 100 : 0;
  const words     = cat.words ?? [];

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        {/* Modal header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalEmoji}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalSub}>
              {cat.completed}/{cat.total} palabras{diffLabel ? ` · ${diffLabel}` : ` · ${Math.round(pct)}%`}
            </Text>
            <View style={styles.modalBar}>
              <View
                style={[
                  styles.modalBarFill,
                  { width: `${pct}%`, backgroundColor: barColor },
                ]}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Word cards */}
        <ScrollView
          contentContainerStyle={styles.cardsGrid}
          showsVerticalScrollIndicator={false}
        >
          {words.map((w) => (
            <View
              key={`${w.levelNumber}_${w.word}`}
              style={[
                styles.wordCard,
                w.isCompleted ? styles.cardCollected : styles.cardLocked,
              ]}
            >
              {w.isCompleted ? (
                <>
                  <View style={styles.cardEmojiWrap}>
                    <Text style={styles.cardEmoji}>{emoji}</Text>
                  </View>
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardName} numberOfLines={2}>{w.word}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.lockedInner}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={styles.cardNameLocked} numberOfLines={2}>{w.word}</Text>
                  <Text style={styles.levelTag}>Niv.{w.levelNumber}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bg: { flex: 1 },

  header: {
    alignItems: "center",
    marginTop: HEADER_TOP,
    marginBottom: height * 0.015,
    backgroundColor: WHEAT,
    marginHorizontal: SCREEN_W * 0.04,
    borderRadius: 25,
    paddingTop: 8,
    paddingBottom: 10,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.35)",
  },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: Math.min(width * 0.065, 26),
    color: BROWN,
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
    backgroundColor: "rgba(210,105,30,0.08)",
  },
  tabBtnActive: {
    backgroundColor: BROWN,
    borderColor: BROWN,
  },
  tabTxt: {
    fontFamily: FONTS.bodyBold,
    fontSize: Math.min(width * 0.033, 14),
    color: BROWN,
  },
  tabTxtActive: {
    color: WHEAT,
  },

  centered:  { flex: 1, justifyContent: "center", alignItems: "center" },
  infoText:  {
    fontFamily: FONTS.bodyBold,
    color: WHEAT,
    fontSize: 16,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // Grid — use real screen padding so rows fill the actual width
  grid: { paddingHorizontal: GRID_PAD, paddingBottom: 20 },
  row:  { gap: CARD_GAP, marginBottom: TABLET_MODE ? 12 : 10, alignItems: "flex-start" },

  colCard: {
    backgroundColor: WHEAT,
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 12,
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
  },
  padCard:     { backgroundColor: "transparent", borderColor: "transparent" },

  // Vertical card layout (same on all device sizes)
  colEmoji:    { fontSize: EMOJI_SIZE, marginBottom: 4 },
  colName:     { fontFamily: FONTS.bodyBold, fontSize: Math.min(CARD_W * 0.135, 16), color: BROWN, textAlign: "center", marginBottom: 2 },
  colCount:    { fontFamily: FONTS.body, fontSize: Math.min(CARD_W * 0.115, 14), color: "#A0714F", marginBottom: 4 },
  miniBar:     { width: "85%", height: 4, backgroundColor: "rgba(139,69,19,0.18)", borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  miniFill:    { height: "100%", borderRadius: 2 },
  diffDot:     { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  diffDotText: { fontFamily: FONTS.bodyBold, color: "white", fontSize: Math.min(CARD_W * 0.1, 12) },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalBox:     {
    backgroundColor: WHEAT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.82,
    paddingBottom: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(139,69,19,0.35)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(210,105,30,0.3)",
  },
  modalEmoji:    { fontSize: 44, marginRight: 12 },
  modalTitle:    { fontFamily: FONTS.display, fontSize: width * 0.052, color: BROWN },
  modalSub:      { fontFamily: FONTS.body, fontSize: 13, color: "#7A4020", marginTop: 2, marginBottom: 6 },
  modalBar:      { height: 6, backgroundColor: "rgba(139,69,19,0.18)", borderRadius: 3, overflow: "hidden", width: "100%" },
  modalBarFill:  { height: "100%", borderRadius: 3 },
  closeBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: WHEAT2, borderWidth: 1, borderColor: "rgba(139,69,19,0.35)", justifyContent: "center", alignItems: "center", marginLeft: 8 },
  closeTxt:      { fontFamily: FONTS.bodyBold, fontSize: 16, color: BROWN },

  // Word cards
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, justifyContent: "flex-start" },
  wordCard: {
    width: "30%",
    aspectRatio: 3 / 5,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    marginBottom: 10,
    marginRight: "3.33%",
  },
  cardCollected:  { backgroundColor: WHEAT2, borderColor: GOLD },
  cardLocked:     { backgroundColor: "#EDE0CC", borderColor: "rgba(139,69,19,0.3)" },
  cardEmojiWrap:  { flex: 1, justifyContent: "center", alignItems: "center" },
  cardEmoji:      { fontSize: width * 0.09, textAlign: "center" },
  cardTextWrap:   { backgroundColor: "rgba(92,46,0,0.7)", paddingVertical: 4, paddingHorizontal: 3 },
  cardName:       { fontFamily: FONTS.bodyBold, color: WHEAT, fontSize: width * 0.025, textAlign: "center" },
  lockedInner:    { flex: 1, justifyContent: "center", alignItems: "center", padding: 4 },
  lockIcon:       { fontSize: width * 0.065, marginBottom: 4 },
  cardNameLocked: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.025, textAlign: "center", marginBottom: 2 },
  levelTag:       { fontFamily: FONTS.body, color: "#A0714F", fontSize: width * 0.02 },
});
