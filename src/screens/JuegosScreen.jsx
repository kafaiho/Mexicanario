import React from "react";
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TopBar from "../components/TopBar";
import { tapMedium } from "../services/haptics";

const { width, height } = Dimensions.get("window");

// ── Palette (Mexicanómetro tokens) ──────────────────────────────────────────
const BROWN  = "#8B4513";
const AMBER  = "#D2691E";
const ORANGE = "#FF6B35";
const GOLD   = "#F8BE17";

const games = [
  {
    id: "DueloAlbures",
    name: "Duelo de Albures",
    icon: "🌶️",
    description: "Pon a prueba tu barrio y agilidad mental",
    tag: "NUEVO",
  },
  {
    id: "CorreNahual",
    name: "Corre del Nahual",
    icon: "🐺",
    description: "Esquiva los nopales antes de que te atrape",
    tag: null,
  },
  {
    id: "TaqueroRush",
    name: "Taquero Rush",
    icon: "🌮",
    description: "Prepara la mayor cantidad de tacos en 30s",
    tag: null,
  },
  {
    id: "LoteriaExpress",
    name: "Lotería Exprés",
    icon: "🃏",
    description: "Identifica la carta cantada rápidamente",
    tag: null,
  },
];

export default function JuegosScreen({ navigation }) {
  const handlePlayGame = (gameId) => {
    tapMedium();
    switch (gameId) {
      case "DueloAlbures":
      case "CorreNahual":
      case "TaqueroRush":
      case "LoteriaExpress":
        navigation.navigate(gameId);
        break;
      default:
        break;
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <TopBar navigation={navigation} />

      {/* ── Section title ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎮 Juegos</Text>
        <Text style={styles.sectionSub}>¿Pa' qué juego eres bueno?</Text>
      </View>

      {/* ── Games list ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {games.map((game) => (
          <View key={game.id} style={styles.card}>
            {/* Icon bubble */}
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{game.icon}</Text>
            </View>

            {/* Info */}
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
            </View>

            {/* Play button */}
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => handlePlayGame(game.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.playBtnText}>Jugar</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Coming soon */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonEmoji}>🔒</Text>
          <Text style={styles.comingSoonText}>¡Nuevos juegos próximamente!</Text>
        </View>
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
    marginTop: height * 0.13,
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

  // ── Icon bubble ──
  iconWrap: {
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: width * 0.065,
    backgroundColor: "#FFE4B5",
    borderWidth: 2,
    borderColor: AMBER,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: width * 0.062,
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
    backgroundColor: ORANGE,
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
    fontSize: width * 0.032,
    color: "#7A4020",
    marginTop: 3,
    lineHeight: width * 0.042,
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
