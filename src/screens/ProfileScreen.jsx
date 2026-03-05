import { useQuery } from "convex/react";
import React, { useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import AvatarModal from "../components/AvatarModal";
import CountryModal from "../components/CountryModal";
import InviteModal from "../components/InviteModal";
import ProfileModal from "../components/ProfileModal";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";

const { width, height } = Dimensions.get("window");

// ─── Colores base ─────────────────────────────────────────────────────────────
const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD  = "#F8BE17";
const WHEAT = "#FFE4B5";
const DARK  = "#3B1A00";

// ─── Sistema de rangos XP ─────────────────────────────────────────────────────
const XP_RANKS = [
  { min: 0,     max: 499,      title: "Aprendiz",        emoji: "🌱", color: "#7CB87A" },
  { min: 500,   max: 1499,     title: "Conocedor",       emoji: "📚", color: "#4A90D9" },
  { min: 1500,  max: 2999,     title: "Experto",         emoji: "⭐", color: GOLD       },
  { min: 3000,  max: 5999,     title: "Maestro MX",      emoji: "🏆", color: AMBER      },
  { min: 6000,  max: 11999,    title: "Sabio Mexicano",  emoji: "🦅", color: "#C0392B"  },
  { min: 12000, max: Infinity, title: "Leyenda Mexicana",emoji: "👑", color: "#8B008B"  },
];

function getRank(xp = 0) {
  return XP_RANKS.find((r) => xp >= r.min && xp <= r.max) ?? XP_RANKS[0];
}

function getXpProgress(xp = 0) {
  const rank = getRank(xp);
  if (rank.max === Infinity) return 1;
  const range = rank.max - rank.min + 1;
  const within = xp - rank.min;
  return Math.min(within / range, 1);
}

function getNextRankTitle(xp = 0) {
  const idx = XP_RANKS.findIndex((r) => xp >= r.min && xp <= r.max);
  return XP_RANKS[idx + 1]?.title ?? null;
}

// ─── Tarjeta de estadística ───────────────────────────────────────────────────
function StatCard({ emoji, value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value ?? "—"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { userId } = useAuth();
  const userData   = useQuery(api.users.getUser, userId ? { userId } : "skip");

  const [showProfile, setShowProfile] = useState(false);
  const [showAvatar,  setShowAvatar]  = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showInvite,  setShowInvite]  = useState(false);

  // ── Datos reales del usuario ────────────────────────────────────────────────
  const xp           = userData?.xp           ?? 0;
  const level        = userData?.currentLevel  ?? 1;
  const streak       = userData?.playStreak    ?? 0;
  const streakMax    = userData?.playStreakMax  ?? 0;
  const tacos        = userData?.tacos         ?? 0;
  const bestCombo    = userData?.bestCombo     ?? 0;
  const perfectLevels= userData?.perfectLevels ?? 0;
  const name         = userData?.name          ?? "Jugador";

  const rank         = getRank(xp);
  const xpProgress   = getXpProgress(xp);
  const nextRank     = getNextRankTitle(xp);
  const xpToNext     = rank.max === Infinity ? null : rank.max + 1 - xp;

  return (
    <ImageBackground
      source={require("../../assets/images/bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <TopBar />

      <View style={styles.scroll}>

        {/* ── Nombre y rango ── */}
        <View style={styles.heroCard}>
          <Text style={styles.playerName}>{name}</Text>
          <View style={[styles.rankBadge, { backgroundColor: rank.color }]}>
            <Text style={styles.rankText}>{rank.emoji} {rank.title}</Text>
          </View>
        </View>

        {/* ── Barra de XP ── */}
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Experiencia Cultural</Text>
            <Text style={styles.xpValue}>{xp.toLocaleString()} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, {
              width: `${Math.round(xpProgress * 100)}%`,
              backgroundColor: rank.color,
            }]} />
          </View>
          {nextRank ? (
            <Text style={styles.xpHint}>
              {xpToNext} XP para {nextRank}
            </Text>
          ) : (
            <Text style={styles.xpHint}>¡Rango máximo alcanzado! 👑</Text>
          )}
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <StatCard emoji="🌮" value={level}         label="Nivel actual"   />
          <StatCard emoji="🔥" value={streak}        label="Racha actual"   />
          <StatCard emoji="📈" value={streakMax}      label="Racha récord"   />
          <StatCard emoji="✅" value={tacos}          label="Palabras reales" />
          <StatCard emoji="⚡" value={bestCombo}      label="Mejor combo"    />
          <StatCard emoji="💎" value={perfectLevels}  label="Niveles perfectos" />
        </View>

        {/* ── Botones de acción ── */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowProfile(true)}>
            <Text style={styles.actionEmoji}>👤</Text>
            <Text style={styles.actionLabel}>Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAvatar(true)}>
            <Text style={styles.actionEmoji}>🎨</Text>
            <Text style={styles.actionLabel}>Avatar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCountry(true)}>
            <Text style={styles.actionEmoji}>🌎</Text>
            <Text style={styles.actionLabel}>País</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowInvite(true)}>
            <Text style={styles.actionEmoji}>🤝</Text>
            <Text style={styles.actionLabel}>Invitar</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Modales ── */}
      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
      <AvatarModal  visible={showAvatar}  onClose={() => setShowAvatar(false)}  />
      <CountryModal visible={showCountry} onClose={() => setShowCountry(false)} />
      <InviteModal  visible={showInvite}  onClose={() => setShowInvite(false)}  />
    </ImageBackground>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const CARD_RADIUS = width * 0.05;

const styles = StyleSheet.create({
  container: { flex: 1 },

  scroll: {
    flex: 1,
    paddingTop: height * 0.13,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.04,
    gap: height * 0.018,
  },

  // ── Hero ──
  heroCard: {
    alignItems: "center",
    gap: height * 0.01,
  },
  playerName: {
    fontFamily: FONTS.display,
    fontSize: width * 0.08,
    color: GOLD,
    textShadowColor: "#523600",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  rankBadge: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.007,
    borderRadius: width * 0.07,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  rankText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.042,
    color: "#fff",
  },

  // ── XP ──
  xpCard: {
    backgroundColor: WHEAT,
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.3)",
    padding: width * 0.045,
    gap: height * 0.009,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xpLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.038,
    color: BROWN,
  },
  xpValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.038,
    color: DARK,
  },
  xpBarBg: {
    width: "100%",
    height: height * 0.018,
    backgroundColor: "rgba(139,69,19,0.15)",
    borderRadius: width * 0.05,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139,69,19,0.3)",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: width * 0.05,
    minWidth: 4,
  },
  xpHint: {
    fontFamily: FONTS.body ?? FONTS.bodyBold,
    fontSize: width * 0.033,
    color: AMBER,
    textAlign: "right",
  },

  // ── Stats ──
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: width * 0.025,
  },
  statCard: {
    backgroundColor: WHEAT,
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.25)",
    width: (width * 0.9 - width * 0.025 * 2) / 3,
    alignItems: "center",
    paddingVertical: height * 0.016,
    gap: height * 0.005,
  },
  statEmoji: { fontSize: width * 0.065 },
  statValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.055,
    color: DARK,
  },
  statLabel: {
    fontFamily: FONTS.body ?? FONTS.bodyBold,
    fontSize: width * 0.028,
    color: BROWN,
    textAlign: "center",
  },

  // ── Acciones ──
  actionsGrid: {
    flexDirection: "row",
    gap: width * 0.025,
    justifyContent: "center",
  },
  actionBtn: {
    backgroundColor: AMBER,
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
    borderColor: BROWN,
    paddingVertical: height * 0.016,
    alignItems: "center",
    flex: 1,
    gap: height * 0.006,
  },
  actionEmoji: { fontSize: width * 0.07 },
  actionLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.033,
    color: WHEAT,
  },
});
