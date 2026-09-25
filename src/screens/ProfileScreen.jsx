import { useQuery } from "convex/react";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import AvatarModal from "../components/AvatarModal";
import CountryModal from "../components/CountryModal";
import InviteModal from "../components/InviteModal";
import { DIVISIONS } from "../components/LeagueBadge";
import { getStageAssets } from "../components/PetCompanion/petAssets";
import { normalizePetSlots, normalizePetType, PET_TYPES } from "../config/petTypes";
import ProfileModal from "../components/ProfileModal";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";
import { getCulturalPathProgress, getCulturalSegmentSize, getNextCulturalPath } from "../config/mexicoZones";
import { getCurrentPathPresentation } from "../config/culturalPathSelection";
import EloBadge from "../components/EloBadge";

const { width, height } = Dimensions.get("window");

// ─── Colores base ─────────────────────────────────────────────────────────────
const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD  = "#F8BE17";
const WHEAT = "#FFE4B5";
const DARK  = "#3B1A00";

// ─── Sistema de rangos XP (20 tiers) ──────────────────────────────────────────
import { XP_RANKS, getRank, getXpProgress, getNextRankTitle, getXpToNextRank } from "../config/xpRanks";

// ─── Tarjeta de estadistica ───────────────────────────────────────────────────
function StatCard({ emoji, value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value ?? "—"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Safe ref — api.users.getGlobalRank may not exist until `npx convex dev` regenerates types
const _hasGlobalRank = !!api.users?.getGlobalRank;

// ─── Pantalla de perfil (modal) ───────────────────────────────────────────────
export default function ProfileScreen({ visible, onClose }) {
  const { userId } = useAuth();
  const userData = useQuery(api.users.getUser, userId ? { userId } : "skip");
  // Falls back to getUser (skipped) when getGlobalRank isn't generated yet
  const rankData = useQuery(
    _hasGlobalRank ? api.users.getGlobalRank : api.users.getUser,
    _hasGlobalRank && userId ? { userId } : "skip",
  );

  // Pet slots (all 3 mascots)
  const petSlots = useQuery(api.pet.getPetSlots, userId ? { userId } : "skip");

  // Mini-game bests
  const alburesBest  = useQuery(api.albures.getMyBest,  userId ? { userId } : "skip");
  const loteriaBest  = useQuery(api.loteria.getMyBest,  userId ? { userId } : "skip");
  const taqueroBest  = useQuery(api.taquero.getMyBest,  userId ? { userId } : "skip");
  const nahualBest   = useQuery(api.nahual.getMyBest,   userId ? { userId } : "skip");

  // Total levels (for Viaje de México) & Cuates
  const allLevels    = useQuery(api.levels.getAllLevels, userId ? { userId } : "skip");
  const myFriends    = useQuery(api.friends.getMyFriends, userId ? { userId } : "skip");

  const [showProfile, setShowProfile] = useState(false);
  const [showAvatar,  setShowAvatar]  = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showInvite,  setShowInvite]  = useState(false);

  // ── Datos reales del usuario ────────────────────────────────────────────────
  const xp            = userData?.xp            ?? 0;
  const level         = userData?.currentLevel   ?? 1;
  const streak        = userData?.playStreak     ?? 0;
  const streakMax     = userData?.playStreakMax   ?? 0;
  const tacos         = userData?.tacos          ?? 0;
  const bestCombo     = userData?.bestCombo      ?? 0;
  const perfectLevels = userData?.perfectLevels  ?? 0;
  const name          = userData?.name           ?? "Jugador";
  const username      = userData?.username;
  const avatar        = userData?.avatar         ?? "🧔🏽";
  const petType       = userData?.petType;
  const petStage      = userData?.petStage       ?? 1;
  const petName       = userData?.petName;
  const leagueDiv     = userData?.leagueDivision ?? 1;
  const leagueHighest = userData?.leagueHighestDiv ?? 1;
  const leagueTrophies = userData?.leagueTrophies ?? 0;

  const rank       = getRank(xp);
  const xpProgress = getXpProgress(xp);
  const nextRank   = getNextRankTitle(xp);
  const xpToNext   = rank.max === Infinity ? null : rank.max + 1 - xp;

  // League division info
  const divInfo     = DIVISIONS.find((d) => d.div === leagueDiv) ?? DIVISIONS[0];
  const highDivInfo = DIVISIONS.find((d) => d.div === leagueHighest) ?? DIVISIONS[0];

  // Pet asset
  const petAsset = petType ? getStageAssets(petType, petStage)?.body ?? null : null;

  // Viaje de México: v2 usa metadatos editoriales; v1 conserva etiqueta neutral.
  const totalLevels  = allLevels?.length ?? 0;
  const currentLevelMeta = allLevels?.[Math.min(Math.max(level - 1, 0), Math.max(totalLevels - 1, 0))];
  const currentZone  = totalLevels > 0 ? getCurrentPathPresentation({
    pathId: currentLevelMeta?.pathId,
    culturalOrderVersion: userData?.culturalOrderVersion,
  }) : null;
  const zoneProgress = currentZone && !currentZone.isNeutral
    ? getCulturalPathProgress(currentLevelMeta?.editorialOrder, currentZone.id)
    : Math.min(level, totalLevels);
  const zoneSize     = currentZone && !currentZone.isNeutral
    ? getCulturalSegmentSize(currentLevelMeta?.editorialOrder, currentZone.entryCount)
    : Math.max(totalLevels, 1);
  const zonePct      = zoneSize > 0 ? zoneProgress / zoneSize : 0;
  const nextZone     = currentZone && !currentZone.isNeutral
    ? getNextCulturalPath(currentLevelMeta?.editorialOrder ?? currentZone.id)
    : null;

  // Cuates count
  const cuatesCount = myFriends?.length ?? 0;

  // Percentile badge color
  const pct = rankData?.percentile ?? 100;
  const pctColor = pct <= 10 ? "#27AE60" : pct <= 30 ? "#E67E22" : "#8B4513";

  // Stage labels
  const STAGE_LABELS = ["", "Cria", "Cachorro", "Joven", "Juvenil", "Adulto", "Legendario"];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── A. Hero Card ── */}
            <View style={styles.heroCard}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={() => setShowAvatar(true)}
              >
                <Text style={styles.avatarText}>{avatar}</Text>
              </TouchableOpacity>
              <Text style={styles.playerName}>{username ? `@${username}` : name}</Text>
              <View style={[styles.rankBadge, { backgroundColor: rank.color }]}>
                <Text style={styles.rankText}>
                  {rank.emoji} {rank.title}
                </Text>
              </View>
            </View>

            {/* ── B. World Ranking Card ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ranking Mundial</Text>
              <Text style={styles.scoreNumber}>
                {(rankData?.score ?? 0).toLocaleString()} pts
              </Text>
              <Text style={styles.rankPosition}>
                #{rankData?.globalRank ?? "..."} de{" "}
                {(rankData?.totalPlayers ?? 0).toLocaleString()} jugadores
              </Text>
              <View style={[styles.percentBadge, { backgroundColor: pctColor }]}>
                <Text style={styles.percentText}>Top {pct}%</Text>
              </View>
            </View>

            {/* ── C. XP Progress Card ── */}
            <View style={styles.card}>
              <View style={styles.xpHeader}>
                <Text style={styles.cardTitle}>Experiencia Cultural</Text>
                <Text style={styles.xpValue}>{xp.toLocaleString()} XP</Text>
              </View>
              <View style={styles.xpBarBg}>
                <View
                  style={[
                    styles.xpBarFill,
                    {
                      width: `${Math.round(xpProgress * 100)}%`,
                      backgroundColor: rank.color,
                    },
                  ]}
                />
              </View>
              {nextRank ? (
                <Text style={styles.xpHint}>
                  {xpToNext} XP para {nextRank}
                </Text>
              ) : (
                <Text style={styles.xpHint}>Rango maximo alcanzado!</Text>
              )}
            </View>

            {/* ── D. Stats Grid ── */}
            <View style={styles.statsGrid}>
              <StatCard emoji="🌮" value={level}         label="Nivel actual" />
              <StatCard emoji="🔥" value={streak}        label="Racha actual" />
              <StatCard emoji="📈" value={streakMax}     label="Racha record" />
              <StatCard emoji="✅" value={tacos}         label="Palabras" />
              <StatCard emoji="⚡" value={bestCombo}     label="Mejor combo" />
              <StatCard emoji="💎" value={perfectLevels} label="Niveles perfectos" />
            </View>

            {/* ── D1b. Viaje de México (zona del mapa) ── */}
            {currentZone && (
              <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: currentZone.color }]}>
                <Text style={styles.cardTitle}>Viaje de México</Text>
                <View style={styles.viajeRow}>
                  <Text style={styles.viajeEmoji}>{currentZone.emoji}</Text>
                  <View style={styles.viajeInfo}>
                    <Text style={styles.viajeTitle}>{currentZone.name}</Text>
                    <Text style={styles.viajeDesc}>{currentZone.desc}</Text>
                    <View style={styles.viajeBarBg}>
                      <View style={[styles.viajeBarFill, { width: `${Math.round(zonePct * 100)}%`, backgroundColor: currentZone.color }]} />
                    </View>
                    <Text style={styles.viajeHint}>
                      {currentZone.isNeutral
                        ? "Tu avance conserva el orden original"
                        : nextZone
                        ? `Siguiente: ${nextZone.emoji} ${nextZone.name}`
                        : "¡Último camino del mapa!"}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── D1c. Cuates ── */}
            <View style={styles.card}>
              <View style={styles.cuatesRow}>
                <Text style={styles.cuatesEmoji}>🤝</Text>
                <View style={styles.cuatesInfo}>
                  <Text style={styles.cardTitle}>Cuates</Text>
                  <Text style={styles.cuatesCount}>
                    {cuatesCount} {cuatesCount === 1 ? "amigo" : "amigos"}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── D2. Mini-game Records ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Récords Minijuegos</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard emoji="🌶️" value={alburesBest?.allTime ?? 0} label="Duelo Albures" />
              <StatCard emoji="🎴" value={loteriaBest?.allTime ?? 0} label="Lotería Exprés" />
              <StatCard emoji="🌮" value={taqueroBest?.allTime ?? 0} label="Taquero Rush" />
              <StatCard emoji="👹" value={nahualBest?.allTime ?? 0}  label="Corre Nahual" />
            </View>

            {/* ── E. Mascotas ── */}
            {petSlots?.slots && Object.keys(petSlots.slots).length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Mascotas</Text>
                <View style={styles.petsRow}>
                  {PET_TYPES.map(({ id: type }) => {
                    const slot = normalizePetSlots(petSlots.slots)[type];
                    const isActive = normalizePetType(petSlots.activePetType) === type;
                    const stage = slot?.stage ?? 0;
                    const asset = slot && getStageAssets(type, stage)?.body;
                    const stageProgress = stage / 6;

                    return (
                      <View key={type} style={[styles.petSlotCard, isActive && styles.petSlotActive]}>
                        {slot ? (
                          <>
                            {asset && (
                              <Image source={asset} style={styles.petSlotImage} />
                            )}
                            <Text style={styles.petSlotName} numberOfLines={1}>
                              {slot.name}
                            </Text>
                            <View style={styles.petSlotBarBg}>
                              <View style={[styles.petSlotBarFill, { width: `${Math.round(stageProgress * 100)}%` }]} />
                            </View>
                            <Text style={styles.petSlotStage} numberOfLines={1}>
                              {STAGE_LABELS[stage] ?? `Etapa ${stage}`}
                            </Text>
                            {isActive && (
                              <View style={styles.petActiveBadge}>
                                <Text style={styles.petActiveBadgeText} numberOfLines={1}>Activa</Text>
                              </View>
                            )}
                          </>
                        ) : (
                          <>
                            <Text style={styles.petSlotLock}>🔒</Text>
                            <Text style={styles.petSlotName}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── F. League Badge ── */}
            <View style={styles.leagueRow}>
              <Text style={styles.leagueEmoji}>{divInfo.emoji}</Text>
              <View style={styles.leagueInfo}>
                <Text style={styles.leagueName}>Liga {divInfo.name}</Text>
                <Text style={styles.leagueSub}>
                  Record: {highDivInfo.emoji} {highDivInfo.name}  ·  {leagueTrophies} trofeos
                </Text>
              </View>
            </View>

            {/* ── F2. PvP ELO Badge ── */}
            {(userData?.pvpWins ?? 0) + (userData?.pvpLosses ?? 0) > 0 && (
              <View style={styles.leagueRow}>
                <View style={styles.leagueInfo}>
                  <Text style={[styles.leagueName, { marginBottom: 6 }]}>Duelo PvP</Text>
                  <EloBadge elo={userData?.eloRating ?? 1000} size="md" />
                  <Text style={styles.leagueSub}>
                    {userData?.pvpWins ?? 0}V - {userData?.pvpLosses ?? 0}D - {userData?.pvpDraws ?? 0}E
                    {(userData?.pvpBestStreak ?? 0) > 0 ? `  ·  Mejor racha: ${userData.pvpBestStreak}` : ""}
                  </Text>
                </View>
              </View>
            )}

            {/* ── G. Action Buttons ── */}
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
                <Text style={styles.actionLabel}>Pais</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowInvite(true)}>
                <Text style={styles.actionEmoji}>🤝</Text>
                <Text style={styles.actionLabel}>Invitar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* ── Close button ── */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✖</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sub-modals ── */}
      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
      <AvatarModal  visible={showAvatar}  onClose={() => setShowAvatar(false)}  />
      <CountryModal visible={showCountry} onClose={() => setShowCountry(false)} />
      <InviteModal  visible={showInvite}  onClose={() => setShowInvite(false)}  />
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const CARD_R = width * 0.045;
const PAD = width * 0.05;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30,15,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.92,
    height: height * 0.85,
    backgroundColor: "#FFF5E6",
    borderRadius: width * 0.06,
    borderWidth: 3,
    borderColor: AMBER,
    overflow: "hidden",
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: PAD,
    paddingBottom: PAD + 60,
    gap: height * 0.016,
  },

  // ── Hero ──
  heroCard: {
    alignItems: "center",
    gap: height * 0.008,
    paddingBottom: height * 0.006,
  },
  avatarCircle: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: width * 0.09,
    backgroundColor: WHEAT,
    borderWidth: 3,
    borderColor: GOLD,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: width * 0.09 },
  playerName: {
    fontFamily: FONTS.display,
    fontSize: width * 0.075,
    color: GOLD,
    textShadowColor: "#523600",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  playerUsername: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.036,
    color: AMBER,
    marginTop: -2,
  },
  rankBadge: {
    paddingHorizontal: width * 0.045,
    paddingVertical: height * 0.006,
    borderRadius: width * 0.06,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  rankText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.038,
    color: "#fff",
  },

  // ── Card (generic) ──
  card: {
    backgroundColor: WHEAT,
    borderRadius: CARD_R,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.25)",
    padding: width * 0.04,
    gap: height * 0.007,
  },
  cardTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.038,
    color: BROWN,
  },

  // ── World Ranking ──
  scoreNumber: {
    fontFamily: FONTS.display,
    fontSize: width * 0.065,
    color: DARK,
    textAlign: "center",
  },
  rankPosition: {
    fontFamily: FONTS.body,
    fontSize: width * 0.034,
    color: AMBER,
    textAlign: "center",
  },
  percentBadge: {
    alignSelf: "center",
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.005,
    borderRadius: width * 0.05,
    marginTop: height * 0.004,
  },
  percentText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.034,
    color: "#fff",
  },

  // ── XP ──
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xpValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.036,
    color: DARK,
  },
  xpBarBg: {
    width: "100%",
    height: height * 0.016,
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
    fontSize: width * 0.031,
    color: AMBER,
    textAlign: "right",
  },

  // ── Stats ──
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: width * 0.022,
  },
  statCard: {
    backgroundColor: WHEAT,
    borderRadius: CARD_R,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.25)",
    width: (width * 0.82 - width * 0.022 * 2) / 3,
    alignItems: "center",
    paddingVertical: height * 0.014,
    gap: height * 0.004,
  },
  statEmoji: { fontSize: width * 0.058 },
  statValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.048,
    color: DARK,
  },
  statLabel: {
    fontFamily: FONTS.body ?? FONTS.bodyBold,
    fontSize: width * 0.026,
    color: BROWN,
    textAlign: "center",
  },

  // ── Viaje de México ──
  viajeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.035,
    marginTop: height * 0.005,
  },
  viajeEmoji: { fontSize: width * 0.11 },
  viajeInfo: { flex: 1, gap: height * 0.005 },
  viajeTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.045,
    color: DARK,
  },
  viajeDesc: {
    fontFamily: FONTS.body ?? FONTS.bodyBold,
    fontSize: width * 0.03,
    color: BROWN,
    marginTop: -2,
  },
  viajeBarBg: {
    width: "100%",
    height: height * 0.014,
    backgroundColor: "rgba(139,69,19,0.15)",
    borderRadius: width * 0.05,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139,69,19,0.3)",
  },
  viajeBarFill: {
    height: "100%",
    borderRadius: width * 0.05,
    backgroundColor: "#E67E22",
    minWidth: 4,
  },
  viajeHint: {
    fontFamily: FONTS.body ?? FONTS.bodyBold,
    fontSize: width * 0.03,
    color: AMBER,
  },

  // ── Cuates ──
  cuatesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.035,
  },
  cuatesEmoji: { fontSize: width * 0.09 },
  cuatesInfo: { flex: 1, gap: 2 },
  cuatesCount: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.04,
    color: DARK,
  },

  // ── Mascotas ──
  petsRow: {
    flexDirection: "row",
    gap: width * 0.018,
    marginTop: height * 0.008,
  },
  petSlotCard: {
    flex: 1,
    backgroundColor: "#FFF5E6",
    borderRadius: CARD_R,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.3)",
    alignItems: "center",
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.01,
    gap: height * 0.004,
  },
  petSlotActive: {
    borderColor: GOLD,
    borderWidth: 3,
    backgroundColor: "#FFF8E1",
  },
  petSlotImage: {
    width: width * 0.18,
    height: width * 0.18,
    resizeMode: "contain",
  },
  petSlotName: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.03,
    color: DARK,
    textAlign: "center",
  },
  petSlotBarBg: {
    width: "88%",
    height: height * 0.01,
    backgroundColor: "rgba(139,69,19,0.18)",
    borderRadius: width * 0.05,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139,69,19,0.3)",
  },
  petSlotBarFill: {
    height: "100%",
    borderRadius: width * 0.05,
    backgroundColor: "#6FA95B",
    minWidth: 3,
  },
  petSlotStage: {
    fontFamily: FONTS.body ?? FONTS.bodyBold,
    fontSize: width * 0.028,
    color: BROWN,
  },
  petActiveBadge: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#C8950A",
  },
  petActiveBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.025,
    color: BROWN,
  },
  petSlotLock: {
    fontSize: width * 0.1,
    marginVertical: height * 0.02,
  },

  // ── League ──
  leagueRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHEAT,
    borderRadius: CARD_R,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.25)",
    padding: width * 0.035,
    gap: width * 0.035,
  },
  leagueEmoji: { fontSize: width * 0.1 },
  leagueInfo: { flex: 1, gap: 2 },
  leagueName: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.04,
    color: DARK,
  },
  leagueSub: {
    fontFamily: FONTS.body ?? FONTS.bodyBold,
    fontSize: width * 0.03,
    color: BROWN,
  },

  // ── Actions ──
  actionsGrid: {
    flexDirection: "row",
    gap: width * 0.022,
    justifyContent: "center",
  },
  actionBtn: {
    backgroundColor: AMBER,
    borderRadius: CARD_R,
    borderWidth: 2,
    borderColor: BROWN,
    paddingVertical: height * 0.014,
    alignItems: "center",
    flex: 1,
    gap: height * 0.005,
  },
  actionEmoji: { fontSize: width * 0.06 },
  actionLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.03,
    color: WHEAT,
  },

  // ── Close ──
  closeBtn: {
    position: "absolute",
    bottom: height * 0.015,
    alignSelf: "center",
    width: width * 0.11,
    height: width * 0.11,
    borderRadius: width * 0.055,
    backgroundColor: AMBER,
    borderWidth: 2,
    borderColor: BROWN,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: width * 0.045,
    color: "#fff",
    fontWeight: "bold",
  },
});
