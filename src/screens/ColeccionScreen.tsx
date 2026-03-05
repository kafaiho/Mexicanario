import { useQuery } from "convex/react";
import React, { useState } from "react";
import { tapMedium } from "../services/haptics";
import {
  ActivityIndicator,
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
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";
import { TABLET_MODE } from "../utils/tabletSetup";

const BROWN  = "#8B4513";
const ORANGE = "#FF6B35";
const AMBER  = "#D2691E";
const GOLD   = "#F8BE17";
const WHEAT  = "#FFE4B5";

// ── Imágenes AI por categoría ─────────────────────────────────────────────────
const CATEGORY_IMAGE_MAP: Record<string, any> = {
  "Expresiones":       require("../../assets/images/collections/expresiones.png"),
  "Picaresca":         require("../../assets/images/collections/picaresca.png"),
  "Tipos Sociales":    require("../../assets/images/collections/tipos_sociales.png"),
  "Verbos del Barrio": require("../../assets/images/collections/verbos_barrio.png"),
  "Comida":            require("../../assets/images/collections/comida.png"),
  "Bebida":            require("../../assets/images/collections/bebida.png"),
  "Animales":          require("../../assets/images/collections/animales.png"),
  "Historia":          require("../../assets/images/collections/historia.png"),
  "Música":            require("../../assets/images/collections/musica.png"),
  "Juegos":            require("../../assets/images/collections/juegos.png"),
  "Tradiciones":       require("../../assets/images/collections/tradiciones.png"),
  "Plantas":           require("../../assets/images/collections/plantas.png"),
  "Monumentos":        require("../../assets/images/collections/monumentos.png"),
  "Artistas":          require("../../assets/images/collections/artistas.png"),
  "Streamers":         require("../../assets/images/collections/streamers.png"),
  "Músicos":           require("../../assets/images/collections/musicos_digital.png"),
  "Futbolistas":       require("../../assets/images/collections/futbolistas.png"),
  "Jerga Digital":     require("../../assets/images/collections/jerga_digital.png"),
  "Regionalismos":     require("../../assets/images/collections/regionalismos.png"),
  "Leyendas":          require("../../assets/images/collections/leyendas.png"),
};
const WHEAT2 = "#F5DEB3";

const { width, height } = Dimensions.get("window");

// Compute TopBar clearance (mirrors TopBar.jsx sizing formula)
const TOP_SAFE   = Platform.OS === "ios" ? Math.max(32, height * 0.058) : Math.max(20, height * 0.04);
const TOP_BAR_H  = TOP_SAFE + width * 0.025 + width * 0.075 + width * 0.025;
const HEADER_TOP = Math.round(TOP_BAR_H + (TABLET_MODE ? 48 : 14));

// Emoji referencial único por palabra mexicana
const WORD_EMOJI_MAP: Record<string, string> = {
  // ── COMIDA ──────────────────────────────────────────────
  "taco": "🌮", "tamal": "🫔", "pozole": "🍲", "mole": "🫕",
  "tlayuda": "🫓", "pan de muerto": "🍞", "buñuelo": "🥞",
  "calabaza en tacha": "🎃", "atole": "☕", "champurrado": "🍫",
  "esquites": "🌽", "tostilocos": "🍟", "pambazo": "🥪",
  "torta ahogada": "🥖", "huarache": "🫓", "chilaquiles": "🍳",
  "alegría": "🍬", "cocada": "🥥", "palanqueta": "🥜",
  "borrachito": "🍭", "glorias": "🍮", "mazapán": "🍡",
  "cabrito": "🐐", "machaca": "🥩", "discada": "🫕",
  "asado de puerco": "🥩", "menudo norteño": "🍲", "gorditas": "🫔",
  "cochinita pibil": "🍖", "panucho": "🌮", "salbute": "🌮",
  "pescado a la talla": "🐟", "tamales chiapanecos": "🫔",
  "mole negro": "🫕", "xix": "🌽", "pib": "🫔",
  // ── BEBIDA ──────────────────────────────────────────────
  "mezcal": "🥃", "tequila": "🍾", "pulque": "🥛",
  "horchata": "🥤", "agua de jamaica": "🌺", "tepache": "🍍",
  "tejate": "🫙", "chela": "🍺", "pisto": "🍶",
  // ── JUEGOS ──────────────────────────────────────────────
  "trompo": "🪀", "balero": "🎯", "lotería": "🃏",
  "canicas": "🔵", "pirinola": "🎲", "serpientes y escaleras": "🐍",
  "rayuela": "🏃", "stop": "✋",
  "encantados": "✨", "la víbora de la mar": "🐍", "la roña": "🤸",
  "burro castigado": "🐴", "doña blanca": "👗", "a las escondidas": "🫣",
  "la viborita de la mar": "🐍", "el patio de mi casa": "🏠",
  "las estatuas": "🗽",
  "el avioncito": "✈️", "policías y ladrones": "👮",
  "futbolito": "⚽", "dominó": "🁢", "ajedrez": "♟️",
  "jenga": "🗼", "uno": "🃏", "lotería moderna": "📱",
  // ── MÚSICA ──────────────────────────────────────────────
  "mariachi": "🎺", "ranchera": "🎵", "corrido": "🎸",
  "banda": "🥁", "cumbia mexicana": "💃", "son jarocho": "🎻",
  "huapango": "🎶", "bolero": "🎤", "norteño": "🪗",
  "chilena costeña": "🏄", "pedro infante": "🎙️",
  "chavela vargas": "🎤", "josé alfredo jiménez": "🎵",
  "lila downs": "🎤", "juan gabriel": "💛", "vicente fernández": "🤠",
  "caifanes": "🎸", "maná": "🎸", "molotov": "🔥",
  "café tacuba": "🎸", "zoé": "🎸", "el tri": "🎸",
  "natalia lafourcade": "🌿", "julieta venegas": "🎹",
  "carlos rivera": "🎙️", "danna paola": "✨", "christian nodal": "🤠",
  "belinda": "🎤",
  // ── ANIMALES ────────────────────────────────────────────
  "jaguar": "🐆", "águila real": "🦅", "serpiente cascabel": "🐍",
  "cenzontle": "🐦", "armadillo": "🛡️", "ajolote": "🦎",
  "xoloitzcuintle": "🐕", "chapulín": "🦗", "guacamaya": "🦜",
  "mapache": "🦝", "ocelote": "🐱", "tlacuache": "🐀",
  "colibrí": "🐦", "murciélago magueyero": "🦇", "iguana": "🦎",
  "zorrillo": "🦨", "escamoles": "🐜", "chinicuiles": "🐛",
  "jumiles": "🪲", "hormiga chicatana": "🐜",
  "chapulín tostado": "🦗", "gusano de maguey": "🐛",
  "puma": "🦁", "cóndor": "🦅", "coyote": "🐺",
  "halcón peregrino": "🦅", "zorra del desierto": "🦊",
  "berrendo": "🦌", "turix": "🪰",
  // ── PLANTAS ─────────────────────────────────────────────
  "agave": "🌵", "flor de nochebuena": "🌺", "flor de dalia": "💐",
  "flor de cacao": "🍫", "flor de vainilla": "🌸",
  "flor de maguey": "🌾", "epazote": "🌿", "cilantro": "🍃",
  "hierba santa": "🪴", "achiote": "🟠", "orégano mexicano": "🌿",
  "manzanilla": "🌼",
  // ── MONUMENTOS ──────────────────────────────────────────
  "monte albán": "🏛️", "palenque": "🏯", "uxmal": "🏺",
  "calakmul": "🌿", "paquimé": "🏚️", "mitla": "🏛️",
  "soumaya": "🎭", "biblioteca vasconcelos": "📚",
  "estadio azteca": "🏟️", "monumento a la revolución": "🗿",
  "malecón de mazatlán": "🌊", "plaza de las tres culturas": "🏛️",
  "guanajuato": "🎭", "san miguel de allende": "🌺",
  "puebla": "🌶️", "querétaro": "🏛️", "zacatecas": "⛏️",
  "morelia": "⛪", "chichén itzá": "🏛️", "teotihuacán": "⛩️",
  // ── ARTISTAS ────────────────────────────────────────────
  "orozco": "🖌️", "siqueiros": "🎨", "rufino tamayo": "🖼️",
  "leonora carrington": "🐱", "remedios varo": "🌌",
  "octavio paz": "📖", "cantinflas": "🎭", "maría félix": "🎬",
  "pedro armendáriz": "🎬", "dolores del río": "🌟",
  "jorge negrete": "🎤", "katy jurado": "⭐",
  "juan rulfo": "✍️", "rosario castellanos": "✍️",
  "carlos fuentes": "📚", "elena poniatowska": "📰",
  "josé emilio pacheco": "📖", "guadalupe nettel": "📝",
  "diego rivera": "🖼️", "frida kahlo": "🌸",
  // ── HISTORIA ────────────────────────────────────────────
  "francisco i madero": "🎩", "venustiano carranza": "⚖️",
  "álvaro obregón": "🎖️", "lázaro cárdenas": "⚡",
  "porfirio díaz": "🎩", "constitución 1917": "📜",
  "olmecas": "🗿", "mayas": "📅", "mexicas": "🦅",
  "zapotecas": "🏺", "mixtecos": "📿", "toltecas": "🏛️",
};

/** Busca el emoji por palabra (ignora mayúsculas y acentos) */
function getWordEmoji(word: string): string | null {
  const normalized = word.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Búsqueda directa primero
  if (WORD_EMOJI_MAP[word.toLowerCase().trim()]) {
    return WORD_EMOJI_MAP[word.toLowerCase().trim()];
  }
  // Búsqueda normalizada (sin acentos)
  for (const [key, emoji] of Object.entries(WORD_EMOJI_MAP)) {
    const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalizedKey === normalized) return emoji;
  }
  return null;
}

export default function ColeccionScreen() {
  const { userId } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showLotteryModal, setShowLotteryModal] = useState(false);
  const [loadingError, setLoadingError] = useState(false);

  // Get user to see currentLevel
  const user = useQuery(api.users.getUser, userId ? { userId: userId } : "skip");
  const currentLevel = user?.currentLevel || 1;

  // Get dynamic collection data based on game levels
  const collectionData = useQuery(api.collectionsQuery.getCollectionData, {});

  const onCardPress = (category) => {
    tapMedium();
    setSelectedCategory(category);
    setShowLotteryModal(true);
  };

  const closeModal = () => {
    setShowLotteryModal(false);
    setSelectedCategory(null);
  };

  const isWordUnlocked = (levelNumber) => {
    return levelNumber < currentLevel;
  };

  React.useEffect(() => {
    let timeoutId;
    if (!collectionData || !user) {
      timeoutId = setTimeout(() => {
        setLoadingError(true);
      }, 8000); // 8 seconds timeout
    } else {
      setLoadingError(false);
    }
    return () => clearTimeout(timeoutId);
  }, [collectionData, user]);

  if (!collectionData || !user) {
    return (
      <ImageBackground source={require("../../assets/images/bg.png")} style={[styles.container, { alignItems: "center", justifyContent: "center" }]} resizeMode="cover">
        {loadingError ? (
          <View style={{ alignItems: 'center', padding: 20, backgroundColor: WHEAT, borderRadius: 20, borderWidth: 2, borderColor: "rgba(139,69,19,0.35)" }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 17, marginBottom: 15, color: BROWN }}>
              La carga está tardando mucho...
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: GOLD, paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: "#C8950A" }}
              onPress={() => setLoadingError(false)}
            >
              <Text style={{ fontFamily: FONTS.bodyBold, color: "#523600", fontSize: 16 }}>
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityIndicator size="large" color={AMBER} />
        )}
      </ImageBackground>
    );
  }

  const CollectionCard = (category: any, index: number) => {
    const totalWords = category.levels.length;
    const unlockedWords = category.levels.filter(
      (lvl: any) => isWordUnlocked(lvl.levelNumber)
    ).length;
    const pct = totalWords > 0 ? unlockedWords / totalWords : 0;
    const img = CATEGORY_IMAGE_MAP[category.name] ?? null;

    return (
      <TouchableOpacity
        key={index}
        style={styles.card}
        onPress={() => onCardPress(category)}
        activeOpacity={0.82}
      >
        {/* Icono cuadrado AI — estilo Mexicanómetro */}
        <View style={styles.iconSquare}>
          {img ? (
            <Image source={img} style={styles.iconImage} resizeMode="cover" />
          ) : (
            <Text style={styles.iconFallback}>{category.icon}</Text>
          )}
        </View>

        {/* Nombre */}
        <Text style={styles.cardTitle} numberOfLines={2}>{category.name}</Text>

        {/* Barra de progreso amber — igual que fill bar del Mexicanómetro */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any }]} />
        </View>
        <Text style={styles.progressText}>{unlockedWords}/{totalWords}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <TopBar navigation={() => { }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Colección</Text>
      </View>

      {/* Collection Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {collectionData.map((category, index) => CollectionCard(category, index))}
        </View>
      </ScrollView>

      {/* Lottery Cards Modal */}
      <Modal
        visible={showLotteryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.overlayBackground} onPress={closeModal} activeOpacity={1} />
          <View style={styles.modalRootContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedCategory?.name}</Text>

              {/* Warm border container for the grid */}
              <View style={styles.innerModalBox}>
                <ScrollView contentContainerStyle={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.lotteryGrid}>
                    {selectedCategory?.levels.map((lvl) => {
                      const unlocked = isWordUnlocked(lvl.levelNumber);

                      // Calculate stars based on word length for visual variety
                      let starsCount = 1;
                      if (lvl.word.length > 6) starsCount = 2;
                      if (lvl.word.length > 9) starsCount = 3;
                      const stars = Array(starsCount).fill(0);

                      if (unlocked) {
                        const bgColor = ["#6FA95B", "#E08F32", "#C0392B", "#D4842E"][lvl.levelNumber % 4];
                        return (
                          <View key={lvl.levelNumber} style={[styles.lotteryCard, styles.collectedCard]}>
                            <View style={styles.starsContainer}>
                              {stars.map((_, i) => <Text key={i} style={styles.yellowStar}>★</Text>)}
                            </View>

                            <View style={[styles.collectedInner, { backgroundColor: bgColor }]}>
                              <Text style={{ fontSize: width * 0.1 }}>
                                {getWordEmoji(lvl.word) ?? selectedCategory?.icon}
                              </Text>
                            </View>

                            <View style={styles.collectedLabelContainer}>
                              <Text style={styles.collectedLabelText} numberOfLines={1} adjustsFontSizeToFit>{lvl.word.toLowerCase()}</Text>
                            </View>
                          </View>
                        );
                      } else {
                        return (
                          <View key={lvl.levelNumber} style={[styles.lotteryCard, styles.uncollectedCard]}>
                            <View style={styles.starsContainer}>
                              {stars.map((_, i) => <Text key={i} style={styles.greyStar}>★</Text>)}
                            </View>

                            <View style={styles.uncollectedInner}>
                              <Text style={styles.uncollectedLabelText} numberOfLines={2} adjustsFontSizeToFit>{lvl.word.toLowerCase()}</Text>
                            </View>
                          </View>
                        );
                      }
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity onPress={closeModal} style={styles.closeButtonAbs}>
              <Text style={styles.closeButtonContentAbs}>✖</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginTop: HEADER_TOP,
    marginBottom: height * 0.01,
    backgroundColor: WHEAT,
    marginHorizontal: width * 0.04,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.35)",
    paddingVertical: 8,
  },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.07,
    color: BROWN,
    textAlign: "center",
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: width * 0.04,
    color: "#7A4020",
    textAlign: "center",
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.05,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  card: {
    width: "31%",
    aspectRatio: 0.72,
    backgroundColor: WHEAT,
    borderRadius: 22,
    paddingTop: width * 0.03,
    paddingBottom: width * 0.02,
    marginBottom: height * 0.02,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
  },
  // ── Icono cuadrado AI (reemplaza círculo con emoji) ─────────────────────────
  iconSquare: {
    width: width * 0.17,
    height: width * 0.17,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.3)",
  },
  iconImage: {
    width: "100%",
    height: "100%",
  },
  iconFallback: {
    fontSize: width * 0.09,
    textAlign: "center",
    lineHeight: width * 0.17,
  },
  // ── Barra de progreso estilo Mexicanómetro fill bar ──────────────────────
  progressTrack: {
    width: "88%",
    height: 5,
    backgroundColor: "rgba(139,69,19,0.18)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: AMBER,
    borderRadius: 3,
  },
  cardTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.035,
    color: BROWN,
    marginBottom: 4,
    textAlign: "center",
  },
  progressText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.027,
    color: AMBER,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  modalRootContainer: {
    width: "90%",
    maxHeight: "75%",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: WHEAT,
    borderRadius: 24,
    padding: 16,
    paddingTop: 20,
    width: "100%",
    flexShrink: 1,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.35)",
  },
  modalTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.055,
    color: BROWN,
    marginBottom: 16,
    textTransform: "capitalize",
  },
  innerModalBox: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.3)",
    borderRadius: 16,
    padding: 12,
    flexShrink: 1,
    backgroundColor: WHEAT2,
  },
  lotteryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    width: "100%",
  },
  lotteryCard: {
    width: "30%",
    aspectRatio: 0.7,
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: "1.66%",
    alignItems: "center",
  },
  collectedCard: {
    backgroundColor: WHEAT,
    padding: 4,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  uncollectedCard: {
    backgroundColor: "#C4A882",
    padding: 6,
  },
  starsContainer: {
    position: "absolute",
    top: -14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  yellowStar: {
    color: GOLD,
    fontSize: 22,
    marginHorizontal: -2,
    textShadowColor: "#C8950A",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  greyStar: {
    color: "rgba(139,69,19,0.3)",
    fontSize: 22,
    marginHorizontal: -2,
  },
  collectedInner: {
    flex: 1,
    width: "100%",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  collectedLabelContainer: {
    backgroundColor: WHEAT2,
    width: "100%",
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  collectedLabelText: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: 10,
    textTransform: "capitalize",
    textAlign: "center",
  },
  uncollectedInner: {
    flex: 1,
    width: "100%",
    borderWidth: 1.5,
    borderColor: "rgba(92,46,0,0.4)",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  uncollectedLabelText: {
    fontFamily: FONTS.bodyBold,
    color: WHEAT,
    fontSize: 11,
    textAlign: "center",
    textTransform: "capitalize",
  },
  closeButtonAbs: {
    position: "absolute",
    bottom: -25,
    backgroundColor: AMBER,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: WHEAT,
    borderBottomWidth: 5,
    borderBottomColor: "#A0541A",
  },
  closeButtonContentAbs: {
    fontFamily: FONTS.bodyBold,
    color: WHEAT,
    fontSize: 20,
  }
});
