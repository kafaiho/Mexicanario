import { useQuery } from "convex/react";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { tapMedium } from "../services/haptics";
import { FONTS } from "../theme/designTokens";
import { TABLET_MODE } from "../utils/tabletSetup";
import { normalizeText } from "../utils/textUtils";
const { getCollectionPresentation, presentPlaceGroup, getDisplayedWordIcon } = require("../config/collectionPresentation.js");

const BROWN = "#8B4513";
const ORANGE = "#FF6B35";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";

// ── Imágenes AI por colección ─────────────────────────────────────────────────
// Mapea tanto nombres canónicos como cortos para máxima compatibilidad
const _IMG = {
  expresiones:    require("../../assets/images/collections/expresiones.webp"),
  comida:         require("../../assets/images/collections/comida.webp"),
  juegos:         require("../../assets/images/collections/juegos.webp"),
  bebida:         require("../../assets/images/collections/bebida.webp"),
  refranes:       require("../../assets/images/collections/refranes.webp"),
  animales:       require("../../assets/images/collections/animales.webp"),
  plantas:        require("../../assets/images/collections/plantas.webp"),
  tradiciones:    require("../../assets/images/collections/tradiciones.webp"),
  musica:         require("../../assets/images/collections/musica.webp"),
  historia:       require("../../assets/images/collections/historia.webp"),
  picaresca:      require("../../assets/images/collections/picaresca.webp"),
  cultura:        require("../../assets/images/collections/cultura_popular.webp"),
  monumentos:     require("../../assets/images/collections/monumentos.webp"),
  leyendas:       require("../../assets/images/collections/leyendas.webp"),
  digital:        require("../../assets/images/collections/mundo_digital.webp"),
  vida:           require("../../assets/images/collections/vida_cotidiana.webp"),
  remedios:       require("../../assets/images/collections/remedios.webp"),
  artesanias:     require("../../assets/images/collections/artesanias.webp"),
  deportes:       require("../../assets/images/collections/deportes.webp"),
};
const CATEGORY_IMAGE_MAP: Record<string, any> = {
  // Nombres canónicos completos
  "Expresiones y Modismos": _IMG.expresiones,
  "Comida Mexicana":        _IMG.comida,
  "Juegos y Niñez":         _IMG.juegos,
  "Bebidas":                _IMG.bebida,
  "Refranes y Dichos":      _IMG.refranes,
  "Animales de México":     _IMG.animales,
  "Flora Mexicana":         _IMG.plantas,
  "Tradiciones y Fiestas":  _IMG.tradiciones,
  "Música y Artistas":      _IMG.musica,
  "Historia de México":     _IMG.historia,
  "Albures y Picaresca":    _IMG.picaresca,
  "Cultura Popular":        _IMG.cultura,
  "Monumentos y Lugares":   _IMG.monumentos,
  "Leyendas y Mitos":       _IMG.leyendas,
  "Mundo Digital":          _IMG.digital,
  // Nombres cortos (compatibilidad con DB antigua)
  "Modismos":    _IMG.expresiones,
  "Comida":      _IMG.comida,
  "Juegos":      _IMG.juegos,
  "Bebida":      _IMG.bebida,
  "Refranes":    _IMG.refranes,
  "Animales":    _IMG.animales,
  "Plantas":     _IMG.plantas,
  "Tradiciones": _IMG.tradiciones,
  "Música":      _IMG.musica,
  "Artistas":    _IMG.musica,
  "Historia":    _IMG.historia,
  "Albures":     _IMG.picaresca,
  "Monumentos":  _IMG.monumentos,
  "Leyendas":    _IMG.leyendas,
  "Digital":     _IMG.digital,
  "Jerga":       _IMG.expresiones,
  // 4 categorías nuevas
  "Vida Cotidiana":       _IMG.vida,
  "Remedios Caseros":     _IMG.remedios,
  "Artesanías de México": _IMG.artesanias,
  "Deportes Mexicanos":   _IMG.deportes,
};
const WHEAT2 = "#F5DEB3";

const { width, height } = Dimensions.get("window");

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
  // ── COMIDA (nuevas) ───────────────────────────────────────
  "sope": "🫓", "carnitas": "🍖", "birria": "🍲", "barbacoa": "🥩",
  "menudo": "🍲", "flautas": "🌮", "quesadilla": "🧀", "guacamole": "🥑",
  "tostada": "🫓", "enchiladas verdes": "🌶️", "pipián": "🫕",
  "caldo de res": "🍲", "gordita": "🫔", "huitlacoche": "🍄",
  "tasajo": "🥩", "cecina": "🥩", "rajas con crema": "🌶️",
  "marquesita": "🧇", "poc chuc": "🍖", "chorizo mexicano": "🌭",
  "mangonada": "🥭", "nieves de garrafa": "🍦", "capirotada": "🍞",
  "discada norteña": "🫕", "salsa verde": "🌶️", "pico de gallo": "🍅",
  "longaniza": "🌭", "papadzul": "🫔",
  // ── BEBIDA (nuevas) ───────────────────────────────────────
  "jamaica": "🌺", "michelada": "🍺", "tejuino": "🍋",
  // ── JUEGOS (nuevas) ───────────────────────────────────────
  "papalote": "🪁", "yoyo": "🪀", "matatena": "🪨", "conquián": "🃏",
  "brincar la cuerda": "🪢", "quemados": "🏐", "kermés": "🎪",
  "el avión": "🏃", "carrera de sacos": "🏃", "tazos": "💿",
  "rompecabezas": "🧩", "avioncito de papel": "✈️",
  // ── ANIMALES (nuevas) ─────────────────────────────────────
  "quetzal": "🦜", "mariposa monarca": "🦋", "tecolote": "🦉",
  "tapir mexicano": "🦏", "mono araña": "🐒", "cacomixtle": "🦝",
  "alacrán": "🦂", "manatí": "🐳", "luciérnaga": "🪲",
  "boa constrictor": "🐍", "tortuga caguama": "🐢",
  "mono aullador": "🙈", "manta raya": "🐟", "lince mexicano": "🐱",
  "flamenco americano": "🦩", "tarántula mexicana": "🕷️",
  "lechuza": "🦉", "tejón mexicano": "🦡",
  // ── PLANTAS (nuevas) ──────────────────────────────────────
  "nopal": "🌵", "maguey": "🌵", "ceiba sagrada": "🌳",
  "mezquite": "🌳", "copal": "🪔", "chicozapote": "🍈",
  "pitaya": "🐉", "tejocote": "🍎", "chaya": "🥬",
  "peyote": "🌵", "árbol del tule": "🌳", "biznaga": "🌵",
  // ── TRADICIONES (nuevas) ──────────────────────────────────
  "día de muertos": "💀", "posadas": "🌟", "guelaguetza": "💃",
  "quinceañera": "👗", "danza de los voladores": "🪂",
  "altar de muertos": "🕯️", "piñata de posada": "🪅",
  "rosca de reyes": "🍩", "cempasúchil": "🌼", "serenata": "🎶",
  "tianguis": "🛒", "día de reyes": "👑", "carnaval de veracruz": "🎭",
  // ── HISTORIA (nuevas) ─────────────────────────────────────
  "tenochtitlan": "🏛️", "cuauhtémoc": "🦅", "benito juárez": "⚖️",
  "emiliano zapata": "🌾", "la independencia": "🗽",
  "miguel hidalgo": "🔔", "pancho villa": "🐎",
  "huitzilopochtli": "☀️", "malinche": "🗣️", "quetzalcóatl": "🐍",
  "tlaloc": "🌧️", "piedra del sol": "🗿", "moctezuma ii": "👑",
  "adelitas": "💪",
  // ── MUNDO DIGITAL ─────────────────────────────────────────
  "peso pluma": "🎤", "el mariana": "📱", "quackity": "🎮",
  "ibai llanos": "📺", "la velada": "🥊", "grupo frontera": "🪗",
  "banda ms": "🎵", "carin leon": "🤠",
  // ── VIDA COTIDIANA ──────────────────────────────────────────
  "pesero": "🚌", "metro cdmx": "🚇", "mototaxi": "🛺",
  "combi": "🚐", "bicitaxi": "🚲", "trolebús": "🚎",
  "camión": "🚌", "micro": "🚐", "cuaderno scribe": "📓",
  "recreo escolar": "⏰", "cooperativa": "🏪", "conaliteg": "📚",
  "lonchera": "🍱", "escolta": "🇲🇽",
  // ── REMEDIOS CASEROS ────────────────────────────────────────
  "vicks vaporub": "💊", "agua de tila": "🍵", "sábila": "🌿",
  "limón con sal": "🍋", "gordolobo": "🌾", "ruda": "🪴",
  // ── ARTESANÍAS DE MÉXICO ────────────────────────────────────
  "alebrijes": "🎨", "talavera": "🏺", "barro negro": "⚫",
  "piñata": "🪅",
  // ── DEPORTES MEXICANOS ──────────────────────────────────────
  "lucha libre": "🤼", "el santo": "🦸", "blue demon": "😈",
  "mil máscaras": "🎭", "hijo del santo": "🦸", "arena méxico": "🏟️",
  "charrería": "🐎", "pelota mixteca": "🏐",
  "julio césar chávez": "🥊", "ana guevara": "🏃", "béisbol norteño": "⚾",
};

/** Busca el emoji por palabra (ignora mayúsculas y acentos) */
function getWordEmoji(word: string): string | null {
  const normalized = normalizeText(word.trim());
  // Búsqueda directa primero
  if (WORD_EMOJI_MAP[word.toLowerCase().trim()]) {
    return WORD_EMOJI_MAP[word.toLowerCase().trim()];
  }
  // Búsqueda normalizada (sin acentos)
  for (const [key, emoji] of Object.entries(WORD_EMOJI_MAP)) {
    const normalizedKey = normalizeText(key);
    if (normalizedKey === normalized) return emoji;
  }
  return null;
}

// ── Memoized card to avoid re-render on every scroll ──────────────────────────
const CollectionCard = React.memo(function CollectionCard({ category, index, onPress }: any) {
  const totalWords = category.total ?? category.words?.length ?? 0;
  const unlockedWords = category.completed ?? 0;
  const pct = totalWords > 0 ? unlockedWords / totalWords : 0;
  const img = CATEGORY_IMAGE_MAP[category.name] ?? null;
  const isLocked = category.isUnlocked === false;

  return (
    <TouchableOpacity
      key={index}
      style={[styles.card, isLocked && styles.cardLocked]}
      onPress={() => !isLocked && onPress(category)}
      activeOpacity={isLocked ? 1 : 0.82}
      disabled={isLocked}
    >
      <View style={[styles.iconSquare, isLocked && { borderColor: "rgba(139,69,19,0.15)" }]}>
        {img ? (
          <Image source={img} style={[styles.iconImage, isLocked && { opacity: 0.4 }]} resizeMode="cover" />
        ) : (
          <Text style={[styles.iconFallback, isLocked && { opacity: 0.4 }]}>{category.icon}</Text>
        )}
      </View>
      <Text style={[styles.cardTitle, isLocked && { color: "#A0714F" }]} numberOfLines={2}>{category.name}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>{category.description}</Text>
      {__DEV__ && category.needsReview ? <Text style={styles.reviewText}>Por clasificar</Text> : null}
      {isLocked ? (
        <Text style={styles.lockText}>{"🔒 Nivel " + (category.unlockLevel ?? "?")}</Text>
      ) : (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{unlockedWords}/{totalWords}</Text>
        </>
      )}
    </TouchableOpacity>
  );
});

export default function ColeccionScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  // TopBar uses its own topPad (~32px Android) regardless of insets, so we must clear it
  const topBarPad = Math.max(20, height * 0.04);
  const HEADER_TOP = Math.round(
    Math.max(insets.top, topBarPad) + width * 0.075 + width * 0.025 + (TABLET_MODE ? 48 : 18)
  );
  const { userId } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showLotteryModal, setShowLotteryModal] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'places'>('collections');

  // Get user to see currentLevel
  const user = useQuery(api.users.getUser, userId ? { userId: userId } : "skip");

  // Get collection data with progress tied to the level ordering system
  const culturalLibrary = useQuery(
    api.collectionsQuery.getCulturalLibraryWithProgress,
    userId ? { userId } : "skip",
  );
  const collectionData = culturalLibrary?.collections;
  const placeData = culturalLibrary?.places;
  const presentedCollections = useMemo(() => (collectionData ?? []).map((group: any) => ({
    ...group,
    ...getCollectionPresentation(group.id),
    needsReview: Boolean(group.needsReview || getCollectionPresentation(group.id).needsReview),
  })), [collectionData]);
  const presentedPlaces = useMemo(() => (placeData ?? []).map((group: any) => {
    const presented = presentPlaceGroup(group);
    return { ...presented, description: presented.kindLabel, isUnlocked: true };
  }), [placeData]);

  const onCardPress = (category) => {
    tapMedium();
    setSelectedCategory(category);
    setShowLotteryModal(true);
  };

  const closeModal = () => {
    setShowLotteryModal(false);
    setSelectedCategory(null);
  };

  const isWordUnlocked = (lvl: any) => {
    return !!lvl.isCompleted;
  };

  // ── Datos aplanados para FlatList (header | row de hasta 3 cards) ─────────
  const flatModalData = useMemo(() => {
    if (!selectedCategory) return [];
    const words = [...(selectedCategory.words ?? selectedCategory.levels ?? [])]
      .filter((w: any) => w?.word)
      .sort((a: any, b: any) =>
        (a.word ?? '').localeCompare(b.word ?? '', 'es', { sensitivity: 'base' })
      );

    const result: Array<{ type: 'header'; letter: string; id: string } | { type: 'row'; words: any[]; id: string }> = [];
    let currentLetter = '';
    let rowBuffer: any[] = [];

    const flushRow = () => {
      if (rowBuffer.length > 0) {
        result.push({ type: 'row', words: [...rowBuffer], id: `row-${result.length}` });
        rowBuffer = [];
      }
    };

    for (const lvl of words) {
      const raw = lvl.word[0]?.toUpperCase() ?? '#';
      const letter = raw === 'Ñ' ? 'Ñ' : raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (letter !== currentLetter) {
        flushRow();
        currentLetter = letter;
        result.push({ type: 'header', letter, id: `hdr-${letter}` });
      }
      rowBuffer.push(lvl);
      if (rowBuffer.length === 3) flushRow();
    }
    flushRow();
    return result;
  }, [selectedCategory]);

  // ── Indicador de letra flotante mientras scrolleas ────────────────────────
  const letterYPositions = useRef<Record<string, number>>({});
  const [currentScrollLetter, setCurrentScrollLetter] = useState('');
  const letterFadeAnim = useRef(new Animated.Value(0)).current;
  const fadeTimerRef = useRef<any>(null);

  React.useEffect(() => {
    if (!showLotteryModal) {
      setCurrentScrollLetter('');
      letterYPositions.current = {};
      letterFadeAnim.setValue(0);
    }
  }, [showLotteryModal]);

  const handleModalScroll = (e: any) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const positions = letterYPositions.current;
    const letters = Object.keys(positions).sort();
    let current = letters[0] ?? '';
    for (const letter of letters) {
      if (positions[letter] <= scrollY + 20) current = letter;
    }
    if (current && current !== currentScrollLetter) {
      setCurrentScrollLetter(current);
      letterFadeAnim.setValue(1);
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        Animated.timing(letterFadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
      }, 900);
    }
  };

  React.useEffect(() => {
    let timeoutId;
    if (!collectionData || !placeData || !user) {
      timeoutId = setTimeout(() => {
        setLoadingError(true);
      }, 8000); // 8 seconds timeout
    } else {
      setLoadingError(false);
    }
    return () => clearTimeout(timeoutId);
  }, [collectionData, placeData, user]);

  if (!collectionData || !placeData || !user) {
    return (
      <ImageBackground source={require("../../assets/images/bg.webp")} style={[styles.container, { alignItems: "center", justifyContent: "center" }]} resizeMode="cover">
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


  return (
    <ImageBackground
      source={require("../../assets/images/bg.webp")}
      style={styles.container}
      resizeMode="cover"
    >
      <TopBar navigation={navigation} />

      {/* Header */}
      <View style={[styles.header, { marginTop: HEADER_TOP }]}>
        <Text style={styles.headerTitle}>México vivido</Text>
      </View>

      <View style={styles.tabs} accessibilityLabel="Secciones de la biblioteca cultural">
        <Pressable accessibilityRole="tab" accessibilityLabel="Mostrar colecciones culturales" accessibilityState={{ selected: activeTab === 'collections' }} style={[styles.tab, activeTab === 'collections' && styles.tabActive]} onPress={() => setActiveTab('collections')}>
          <Text style={[styles.tabText, activeTab === 'collections' && styles.tabTextActive]}>Colecciones</Text>
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityLabel="Mostrar lugares de México" accessibilityState={{ selected: activeTab === 'places' }} style={[styles.tab, activeTab === 'places' && styles.tabActive]} onPress={() => setActiveTab('places')}>
          <Text style={[styles.tabText, activeTab === 'places' && styles.tabTextActive]}>Lugares</Text>
        </Pressable>
      </View>

      {/* Collection Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {(activeTab === 'collections' ? presentedCollections : presentedPlaces).map((category: any, index: number) => (
            <CollectionCard key={category.id} category={category} index={index} onPress={onCardPress} />
          ))}
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
                {/* Burbuja flotante de letra actual */}
                {currentScrollLetter ? (
                  <Animated.View style={[styles.floatingLetterBadge, { opacity: letterFadeAnim }]}>
                    <Text style={styles.floatingLetterText}>{currentScrollLetter}</Text>
                  </Animated.View>
                ) : null}

                <FlatList
                  data={flatModalData}
                  keyExtractor={(item: any) => item.id}
                  initialNumToRender={12}
                  maxToRenderPerBatch={8}
                  windowSize={5}
                  removeClippedSubviews={true}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleModalScroll}
                  scrollEventThrottle={16}
                  renderItem={({ item }: any) => {
                    if (item.type === 'header') {
                      return (
                        <View
                          onLayout={(e) => { letterYPositions.current[item.letter] = e.nativeEvent.layout.y; }}
                        >
                          <View style={styles.letterHeader}>
                            <Text style={styles.letterHeaderText}>{item.letter}</Text>
                            <View style={styles.letterHeaderLine} />
                          </View>
                        </View>
                      );
                    }
                    // Row of up to 3 word cards
                    return (
                      <View style={styles.lotteryGrid}>
                        {item.words.map((lvl: any) => {
                          if (!lvl?.word) return null;
                          const unlocked = isWordUnlocked(lvl);
                          let starsCount = 1;
                          if (lvl.word.length > 6) starsCount = 2;
                          if (lvl.word.length > 9) starsCount = 3;
                          const stars = Array(starsCount).fill(0);

                          if (unlocked) {
                            const bgColor = ["#6FA95B", "#E08F32", "#C0392B", "#D4842E"][lvl.levelNumber % 4];
                            return (
                              <View key={`${lvl.levelNumber}-${lvl.word}`} style={[styles.lotteryCard, styles.collectedCard]}>
                                <View style={styles.starsContainer}>
                                  {stars.map((_: any, i: number) => <Text key={i} style={styles.yellowStar}>★</Text>)}
                                </View>
                                <View style={[styles.collectedInner, { backgroundColor: bgColor }]}>
                                  <Text style={{ fontSize: width * 0.1 }}>
                                    {getDisplayedWordIcon(lvl, selectedCategory?.icon, getWordEmoji(lvl.word))}
                                  </Text>
                                </View>
                                <View style={styles.collectedLabelContainer}>
                                  <Text style={styles.collectedLabelText} numberOfLines={1} adjustsFontSizeToFit>{lvl.word.toLowerCase()}</Text>
                                </View>
                              </View>
                            );
                          } else {
                            const dots = lvl.word.replace(/\s+/g, ' ').trim().split('').map(
                              (c: string) => c === ' ' ? '  ' : '·'
                            ).join(' ');
                            return (
                              <View key={`${lvl.levelNumber}-${lvl.word}`} style={[styles.lotteryCard, styles.uncollectedCard]}>
                                <View style={styles.starsContainer}>
                                  {stars.map((_: any, i: number) => <Text key={i} style={styles.greyStar}>★</Text>)}
                                </View>
                                <View style={styles.uncollectedInner}>
                                  <Text style={styles.lockIcon}>🔒</Text>
                                  <Text style={styles.dotsText} numberOfLines={2} adjustsFontSizeToFit>{dots}</Text>
                                </View>
                              </View>
                            );
                          }
                        })}
                      </View>
                    );
                  }}
                />
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
  cardLocked: {
    opacity: 0.55,
    backgroundColor: "#E8D5B8",
  },
  lockText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.027,
    color: "#A0714F",
    marginTop: 4,
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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: width * 0.04,
    marginBottom: 10,
    padding: 4,
    borderRadius: 18,
    backgroundColor: 'rgba(255,228,181,0.9)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
  },
  tabActive: {
    backgroundColor: AMBER,
  },
  tabText: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.035,
  },
  tabTextActive: {
    color: WHEAT,
  },
  cardDescription: {
    fontFamily: FONTS.body,
    fontSize: width * 0.023,
    color: "#7A4020",
    textAlign: "center",
    paddingHorizontal: 3,
    marginBottom: 2,
  },
  reviewText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.021,
    color: "#8A5A00",
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
  lockIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  dotsText: {
    fontFamily: FONTS.bodyBold,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 1,
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
  },
  // ── Indicador de letra ──────────────────────────────────────────────────
  letterHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
    marginTop: 10,
    marginBottom: 6,
  },
  letterHeaderText: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: BROWN,
    marginRight: 8,
    minWidth: 22,
  },
  letterHeaderLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(139,69,19,0.25)',
    borderRadius: 1,
  },
  floatingLetterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139,69,19,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  floatingLetterText: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: WHEAT,
  },
});
