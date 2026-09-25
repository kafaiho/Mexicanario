import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import AdBanner from "../components/AdBanner";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { tapMedium } from "../services/haptics";
import { TABLET_MODE } from "../utils/tabletSetup";

const { width, height } = Dimensions.get("window");

// ── Palette (Mexicanómetro tokens) ──────────────────────────────────────────
const BROWN = "#8B4513";
const AMBER = "#D2691E";
const ORANGE = "#FF6B35";

const ICON_SIZE = Math.round(width * 0.17);

/**
 * Orden pensado para enganchar: primero lo nuevo y rápido (reflejos, partidas
 * cortas), luego lo más querido y familiar (la lotería), comida, humor y al final
 * el corredor sin fin.
 */
const games = [
  {
    id: "EsquivaChancla",
    name: "¡Esquiva la Chancla!",
    description: "Agáchate solo cuando la avienta de verdad. ¡Cuidado con los amagos!",
    tag: "NUEVO",
    chips: ["⚡ Reflejos", "❤️ 3 vidas"],
    icon: { colors: ["#FF6B35", "#B03A2E"], main: "🩴", accent: "💨" },
    featured: true,
  },
  {
    id: "LoteriaExpress",
    name: "Lotería Exprés",
    description: "Encuentra la carta que canta el gritón... ¿te sabes los versos?",
    tag: "FAVORITO",
    chips: ["⏱️ 30 s", "🎤 Versos"],
    icon: { colors: ["#9B59B6", "#5B2C6F"], loteria: { num: 1, name: "EL GALLO", main: "🐓" } },
  },
  {
    id: "TaqueroRush",
    name: "Taquero Rush",
    description: "Arma tacos contra reloj; cada vez salen más ingredientes",
    chips: ["⏱️ 30 s", "🔥 Rapidez"],
    icon: { colors: ["#F8BE17", "#D2691E"], main: "🌮", accent: "🔥" },
  },
  {
    id: "DueloAlbures",
    name: "Duelo de Albures",
    description: "¿Qué tanto barrio tienes? Frases, dichos y doble sentido",
    chips: ["💬 5 preguntas", "🧠 Barrio"],
    icon: { colors: ["#2ECC71", "#1E8449"], main: "🌶️", accent: "💬" },
  },
  {
    id: "CorreNahual",
    name: "Corre del Nahual",
    description: "Salta nopales, piedras y al Nahual. ¿Hasta dónde llegas?",
    chips: ["♾️ Sin fin", "👆 Un toque"],
    icon: { colors: ["#34495E", "#141E30"], main: "🐺", accent: "🌕", accentTop: true },
  },
];

/** Icono de cada juego: mosaico con degradado, emoji principal y un acento. */
function GameIcon({ icon, size = ICON_SIZE }) {
  const radius = size * 0.28;
  return (
    <LinearGradient
      colors={icon.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.iconTile, { width: size, height: size, borderRadius: radius }]}
    >
      <View style={[styles.iconShine, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]} />
      {icon.loteria ? (
        // Mini carta de lotería
        <View style={[styles.loteriaCard, { width: size * 0.62, height: size * 0.8 }]}>
          <Text style={[styles.loteriaNum, { fontSize: size * 0.11 }]}>{icon.loteria.num}</Text>
          <Text style={{ fontSize: size * 0.34 }}>{icon.loteria.main}</Text>
          <Text style={[styles.loteriaName, { fontSize: size * 0.085 }]} numberOfLines={1}>{icon.loteria.name}</Text>
        </View>
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{icon.main}</Text>
      )}
      {icon.accent && (
        <Text
          style={[
            styles.iconAccent,
            { fontSize: size * 0.26 },
            icon.accentTop ? { top: size * 0.04, left: size * 0.06 } : { bottom: size * 0.02, right: size * 0.04 },
          ]}
        >
          {icon.accent}
        </Text>
      )}
    </LinearGradient>
  );
}

function RecordBadge({ best }) {
  if (!best) return null;
  return (
    <Text style={styles.recordText}>
      {best.allTime > 0 ? `🏆 Tu récord: ${best.allTime.toLocaleString("es-MX")}` : "🏆 ¡Aún sin récord!"}
    </Text>
  );
}

export default function JuegosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  // TopBar uses its own topPad (~32px Android) regardless of insets, so we must clear it
  const topBarPad = Math.max(20, height * 0.04);
  const HEADER_TOP = Math.round(
    Math.max(insets.top, topBarPad) + width * 0.075 + width * 0.025 + (TABLET_MODE ? 36 : 18)
  );
  const { userId } = useAuth();
  const args = userId ? { userId } : "skip";

  // Récord de cada juego: ver tu marca invita a superarla
  const bests = {
    EsquivaChancla: useQuery(api.chancla.getMyBest, args),
    LoteriaExpress: useQuery(api.loteria.getMyBest, args),
    TaqueroRush: useQuery(api.taquero.getMyBest, args),
    DueloAlbures: useQuery(api.albures.getMyBest, args),
    CorreNahual: useQuery(api.nahual.getMyBest, args),
  };

  // El botón del juego destacado "late" para llamar la atención
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduceMotion) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.07, duration: 550, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);

  const handlePlayGame = (gameId) => {
    tapMedium();
    navigation.navigate(gameId);
  };

  const [featured, ...rest] = games;

  return (
    <ImageBackground
      source={require("../../assets/images/bg.webp")}
      style={styles.container}
      resizeMode="cover"
    >
      <TopBar navigation={navigation} />

      {/* ── Section title ── */}
      <View style={[styles.sectionHeader, { marginTop: HEADER_TOP }]}>
        <Text style={styles.sectionTitle}>🎮 Juegos</Text>
        <Text style={styles.sectionSub}>¿Pa' qué juego eres bueno?</Text>
      </View>

      {/* ── Games list ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Destacado */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => handlePlayGame(featured.id)} accessibilityRole="button" accessibilityLabel={`Jugar ${featured.name}`}>
          <LinearGradient colors={["#FFE4B5", "#FFD08A"]} style={styles.featuredCard}>
            <View style={styles.featuredTag}>
              <Text style={styles.featuredTagText}>🔥 {featured.tag} · ¡PRUÉBALO!</Text>
            </View>
            <View style={styles.featuredRow}>
              <GameIcon icon={featured.icon} size={Math.round(width * 0.22)} />
              <View style={styles.info}>
                <Text style={styles.featuredName}>{featured.name}</Text>
                <Text style={styles.gameDesc}>{featured.description}</Text>
                <View style={styles.chipsRow}>
                  {featured.chips.map((c) => <Text key={c} style={styles.chip}>{c}</Text>)}
                </View>
              </View>
            </View>
            <View style={styles.featuredFooter}>
              <RecordBadge best={bests[featured.id]} />
              <Animated.View style={[styles.playBtn, styles.featuredPlayBtn, { transform: [{ scale: pulse }] }]}>
                <Text style={styles.playBtnText}>¡Jugar!</Text>
              </Animated.View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {rest.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => handlePlayGame(game.id)}
            accessibilityRole="button"
            accessibilityLabel={`Jugar ${game.name}`}
          >
            <GameIcon icon={game.icon} />

            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.gameName}>{game.name}</Text>
                {game.tag && (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{game.tag}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.gameDesc}>{game.description}</Text>
              <View style={styles.chipsRow}>
                {game.chips.map((c) => <Text key={c} style={styles.chip}>{c}</Text>)}
              </View>
              <RecordBadge best={bests[game.id]} />
            </View>

            <View style={styles.playBtn}>
              <Text style={styles.playBtnText}>Jugar</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Coming soon */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonEmoji}>🔒</Text>
          <Text style={styles.comingSoonText}>¡Nuevos juegos próximamente!</Text>
        </View>

        <AdBanner style={{ marginVertical: 8 }} />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Section header ──
  sectionHeader: {
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.015,
    backgroundColor: "#FFE4B5",
    borderRadius: width * 0.04,
    borderWidth: 2,
    borderColor: BROWN,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.014,
  },
  sectionTitle: {
    fontSize: width * 0.062,
    fontWeight: "bold",
    color: BROWN,
  },
  sectionSub: {
    fontSize: width * 0.032,
    color: "#9A6030",
    marginTop: 2,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.06,
    gap: height * 0.014,
  },

  // ── Icono ──
  iconTile: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  iconShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  iconAccent: {
    position: "absolute",
  },
  loteriaCard: {
    backgroundColor: "#FFFDF5",
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#2C3E50",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
    transform: [{ rotate: "-6deg" }],
  },
  loteriaNum: {
    alignSelf: "flex-start",
    marginLeft: 3,
    fontWeight: "900",
    color: "#2C3E50",
  },
  loteriaName: {
    fontWeight: "900",
    color: "#2C3E50",
    letterSpacing: 0.3,
  },

  // ── Destacado ──
  featuredCard: {
    borderRadius: width * 0.045,
    borderWidth: 2.5,
    borderColor: ORANGE,
    padding: width * 0.035,
    gap: width * 0.025,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  featuredTag: {
    alignSelf: "flex-start",
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredTagText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: width * 0.027,
    letterSpacing: 0.5,
  },
  featuredRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.035,
  },
  featuredName: {
    fontSize: width * 0.05,
    fontWeight: "900",
    color: BROWN,
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredPlayBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: width * 0.07,
  },

  // ── Game card ──
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5DEB3",
    borderRadius: width * 0.037,
    borderWidth: 1.5,
    borderColor: "#D2A679",
    padding: width * 0.032,
    gap: width * 0.03,
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Info ──
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  gameName: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    color: BROWN,
  },
  tagBadge: {
    backgroundColor: "#8E44AD",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tagText: {
    fontSize: width * 0.025,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  gameDesc: {
    fontSize: width * 0.031,
    color: "#7A4020",
    marginTop: 3,
    lineHeight: width * 0.042,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 5,
  },
  chip: {
    fontSize: width * 0.026,
    fontWeight: "700",
    color: BROWN,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: "hidden",
  },
  recordText: {
    fontSize: width * 0.029,
    fontWeight: "800",
    color: AMBER,
    marginTop: 5,
  },

  // ── Play button ──
  playBtn: {
    backgroundColor: AMBER,
    paddingHorizontal: width * 0.045,
    paddingVertical: height * 0.011,
    borderRadius: width * 0.05,
    borderWidth: 1.5,
    borderColor: BROWN,
  },
  playBtnText: {
    color: "#fff",
    fontSize: width * 0.036,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // ── Coming soon ──
  comingSoonCard: {
    backgroundColor: "#FFE4B5",
    borderRadius: width * 0.037,
    paddingVertical: height * 0.025,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D2A679",
    borderStyle: "dashed",
    gap: 6,
  },
  comingSoonEmoji: {
    fontSize: width * 0.07,
  },
  comingSoonText: {
    fontSize: width * 0.038,
    fontWeight: "bold",
    color: "#9A6030",
    textAlign: "center",
    fontStyle: "italic",
  },

});
