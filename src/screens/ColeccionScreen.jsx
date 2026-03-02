import { useQuery } from "convex/react";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { FONTS } from "../theme/designTokens";

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD  = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

const { width, height } = Dimensions.get("window");
const COL    = 3;
const CARD_W = (width - 32 - 8 * (COL - 1)) / COL;

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

  const categories = useQuery(
    api.collectionsQuery.getCollectionsWithProgress,
    { userId: userId ?? undefined }
  );

  const isLoading = categories === undefined;

  // Pad rows to multiples of 3
  const paddedData = categories
    ? [
        ...categories,
        ...(categories.length % 3 !== 0
          ? Array(3 - (categories.length % 3)).fill({ _pad: true })
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Colección</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.infoText}>Cargando colecciones…</Text>
        </View>
      ) : !categories || categories.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.infoText}>Sin colecciones disponibles</Text>
        </View>
      ) : (
        <FlatList
          data={paddedData}
          numColumns={3}
          keyExtractor={(item, i) => item._pad ? `pad_${i}` : item.name}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            if (item._pad) {
              return <View style={[styles.colCard, styles.padCard]} />;
            }
            const meta = getCatMeta(item.name);
            const diff = meta.diff;
            const pct  = item.total > 0 ? (item.completed / item.total) * 100 : 0;
            return (
              <TouchableOpacity
                style={styles.colCard}
                activeOpacity={0.75}
                onPress={() => setSelected(item)}
              >
                <Text style={styles.colEmoji}>{meta.emoji}</Text>
                <Text style={styles.colName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.colCount}>{item.completed}/{item.total}</Text>
                <View style={styles.miniBar}>
                  <View
                    style={[
                      styles.miniFill,
                      { width: `${pct}%`, backgroundColor: DIFF_COLOR[diff] },
                    ]}
                  />
                </View>
                <View style={[styles.diffDot, { backgroundColor: DIFF_COLOR[diff] }]}>
                  <Text style={styles.diffDotText}>{DIFF_LABEL[diff]}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── Detail Modal ── */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <CategoryModal cat={selected} onClose={() => setSelected(null)} />
        )}
      </Modal>
    </ImageBackground>
  );
}

// ─── Category detail modal ────────────────────────────────────────────────────
function CategoryModal({ cat, onClose }) {
  const meta  = getCatMeta(cat.name);
  const diff  = meta.diff;
  const pct   = cat.total > 0 ? (cat.completed / cat.total) * 100 : 0;
  const words = cat.words ?? [];

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        {/* Modal header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalEmoji}>{meta.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>{cat.name}</Text>
            <Text style={styles.modalSub}>
              {cat.completed}/{cat.total} palabras · {DIFF_LABEL[diff]}
            </Text>
            <View style={styles.modalBar}>
              <View
                style={[
                  styles.modalBarFill,
                  { width: `${pct}%`, backgroundColor: DIFF_COLOR[diff] },
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
                    <Text style={styles.cardEmoji}>{meta.emoji}</Text>
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
    marginTop: height * 0.12,
    marginBottom: height * 0.015,
    backgroundColor: WHEAT,
    marginHorizontal: width * 0.04,
    borderRadius: 25,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.35)",
  },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.065,
    color: BROWN,
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

  // Grid
  grid: { paddingHorizontal: 12, paddingBottom: 20 },
  row:  { justifyContent: "space-between", marginBottom: 10 },

  colCard: {
    width: CARD_W,
    backgroundColor: WHEAT,
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
    minHeight: CARD_W * 1.3,
    justifyContent: "center",
  },
  padCard:     { backgroundColor: "transparent", borderColor: "transparent" },
  colEmoji:    { fontSize: CARD_W * 0.38, marginBottom: 4 },
  colName:     { fontFamily: FONTS.bodyBold, fontSize: CARD_W * 0.135, color: BROWN, textAlign: "center", marginBottom: 2 },
  colCount:    { fontFamily: FONTS.body, fontSize: CARD_W * 0.115, color: "#A0714F", marginBottom: 4 },
  miniBar:     { width: "85%", height: 4, backgroundColor: "rgba(139,69,19,0.18)", borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  miniFill:    { height: "100%", borderRadius: 2 },
  diffDot:     { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  diffDotText: { fontFamily: FONTS.bodyBold, color: "white", fontSize: CARD_W * 0.1 },

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
