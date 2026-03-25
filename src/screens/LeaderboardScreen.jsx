import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import DailyMiniWidget from "../components/DailyMiniWidget";
import { DIVISIONS } from "../components/LeagueBadge";
import LeagueCountdown from "../components/LeagueCountdown";
import LeaguePlayerRow from "../components/LeaguePlayerRow";
import LeagueResultModal from "../components/LeagueResultModal";
import TopBar from "../components/TopBar";
import AdBanner from "../components/AdBanner";
import { getEloTier } from "../components/EloBadge";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";
import { scheduleLeagueDrama, hasPermission } from "../services/notificationService";
import { TABLET_MODE } from "../utils/tabletSetup";

const { width, height } = Dimensions.get("window");

const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';
const BURLY = '#DEB887';
const WHEAT = '#FFE4B5';
const WHEAT2 = '#F5DEB3';

const TABS = [
  { key: "liga",      label: "Liga" },
  { key: "global",    label: "Global" },
  { key: "cuates",    label: "Cuates" },
  { key: "pvp",       label: "PvP" },
  { key: "juegos",    label: "Juegos" },
  { key: "mini",      label: "Reto" },
  { key: "historial", label: "Historial" },
];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  // TopBar uses its own topPad (~32px Android) regardless of insets, so we must clear it
  const topBarPad = Math.max(20, height * 0.04);
  const HEADER_TOP = Math.round(
    Math.max(insets.top, topBarPad) + width * 0.075 + width * 0.025 + (TABLET_MODE ? 36 : 18)
  );
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState("liga");
  const [showResult, setShowResult] = useState(false);
  const [busyFriendId, setBusyFriendId] = useState(null);

  const addFriendM = useMutation(api.friends.addFriend);
  const myFriends = useQuery(api.friends.getMyFriends, userId ? { userId } : "skip");
  const friendIds = new Set((myFriends ?? []).map((f) => String(f.friendId)));

  async function handleAddFriend(friendId) {
    setBusyFriendId(String(friendId));
    try {
      const res = await addFriendM({ userId, friendId });
      if (res?.status === "auto_accepted" || res?.status === "accepted") {
        Alert.alert("¡Órale!", "¡Ya son cuates! 🤝");
      } else if (res?.status !== "already_friends") {
        Alert.alert("Solicitud enviada", "Cuando la acepte, serán cuates. 🌮");
      }
    } catch (e) {
      Alert.alert("¡Aguas!", e.message ?? "No se pudo agregar");
    } finally {
      setBusyFriendId(null);
    }
  }

  const leagueStatus = useQuery(
    api.league.getLeagueStatus,
    userId ? { userId } : "skip"
  );
  const leagueHistory = useQuery(
    api.league.getLeagueHistory,
    userId ? { userId, limit: 10 } : "skip"
  );
  const joinLeague = useMutation(api.league.joinLeague);

  useEffect(() => {
    if (userId && leagueStatus && !leagueStatus.joined) {
      joinLeague({ userId }).catch(() => {});
    }
  }, [userId, leagueStatus?.joined]);

  useEffect(() => {
    if (leagueStatus?.outcome && leagueStatus.outcome !== "stayed") {
      setShowResult(true);
    }
  }, [leagueStatus?.outcome]);

  // Programar drama de liga el domingo cuando el usuario abre la pantalla
  useEffect(() => {
    if (!leagueStatus?.joined || !leagueStatus?.rank) return;
    const divisionIndex = (leagueStatus.division ?? 1) - 1;
    const divInfo       = DIVISIONS[divisionIndex] ?? DIVISIONS[0];
    hasPermission().then(granted => {
      if (granted) scheduleLeagueDrama(leagueStatus.rank, divInfo.name).catch(() => {});
    });
  }, [leagueStatus?.rank, leagueStatus?.joined]);

  if (!leagueStatus) {
    return (
      <ImageBackground
        source={require("../../assets/images/bg.webp")}
        style={styles.container}
        resizeMode="cover"
      >
        <TopBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AMBER} />
          <Text style={styles.loadingText}>Cargando ligas...</Text>
        </View>
      </ImageBackground>
    );
  }

  // Division info from DIVISIONS array
  const divisionIndex = (leagueStatus.division ?? 1) - 1;
  const divInfo = DIVISIONS[divisionIndex] ?? DIVISIONS[0];

  return (
    <ImageBackground
      source={require("../../assets/images/bg.webp")}
      style={styles.container}
      resizeMode="cover"
    >
      <TopBar />

      {/* Header panel — integrated */}
      <View style={[styles.headerOuter, { paddingTop: HEADER_TOP }]}>
        <View style={styles.headerPanel}>
          {/* Row 1: division emoji+name | countdown */}
          <View style={styles.hdrTopRow}>
            <View style={styles.hdrDivInfo}>
              <Text style={styles.hdrDivEmoji}>{divInfo.emoji}</Text>
              <Text style={styles.hdrDivName}>Liga {divInfo.name}</Text>
            </View>
            {leagueStatus.joined && (
              <LeagueCountdown timeLeftMs={leagueStatus.timeLeftMs ?? 0} />
            )}
          </View>

          {/* Separator */}
          <View style={styles.hdrSep} />

          {/* Row 2: rank · cXP */}
          {leagueStatus.joined ? (
            <View style={styles.hdrStatsRow}>
              <Text style={styles.hdrStatVal}>#{leagueStatus.rank ?? "-"}</Text>
              <Text style={styles.hdrDot}> · </Text>
              <Text style={styles.hdrCxpVal}>{leagueStatus.cxpTotal ?? 0} cXP</Text>
            </View>
          ) : (
            <Text style={styles.hdrJoinHint}>¡Únete para competir!</Text>
          )}

          {/* Zone hint */}
          {leagueStatus.zone === "promotion" && (
            <Text style={styles.zoneHintUp}>🔺 Zona de ascenso</Text>
          )}
          {leagueStatus.zone === "demotion" && (
            <Text style={styles.zoneHintDown}>🔻 Zona de descenso</Text>
          )}
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "liga" && (
          <LigaTab
            leagueStatus={leagueStatus}
            userId={userId}
            joinLeague={joinLeague}
            friendIds={friendIds}
            onAddFriend={handleAddFriend}
            busyFriendId={busyFriendId}
          />
        )}
        {activeTab === "global" && (
          <GlobalTab
            userId={userId}
            friendIds={friendIds}
            onAddFriend={handleAddFriend}
            busyFriendId={busyFriendId}
          />
        )}
        {activeTab === "cuates" && (
          <CuatesTab userId={userId} />
        )}
        {activeTab === "pvp" && <PvPTab userId={userId} />}
        {activeTab === "juegos" && <JuegosTab userId={userId} />}
        {activeTab === "mini" && <MiniTab />}
        {activeTab === "historial" && <HistorialTab history={leagueHistory} />}
      </ScrollView>

      <AdBanner style={{ marginBottom: 4 }} />

      <LeagueResultModal
        visible={showResult}
        onClose={() => setShowResult(false)}
        outcome={leagueStatus.outcome}
        oldDivision={
          leagueStatus.outcome === "promoted"
            ? (leagueStatus.division ?? 1) - 1
            : leagueStatus.outcome === "demoted"
            ? (leagueStatus.division ?? 1) + 1
            : leagueStatus.division
        }
        newDivision={leagueStatus.division}
        rank={leagueStatus.rank}
        cxpTotal={leagueStatus.cxpTotal}
      />
    </ImageBackground>
  );
}

// ── Zone header — solid color strip inside the table card ─────────────────────

function ZoneHeader({ type }) {
  const isPromo = type === "promotion";
  const color   = isPromo ? "#27AE60" : "#C0392B";
  const bg      = isPromo ? "#EDF7F0" : "#FDECEA";
  return (
    <View
      style={[
        styles.zoneStrip,
        { backgroundColor: bg, borderTopColor: color + "44", borderBottomColor: color + "44" },
      ]}
    >
      <View style={[styles.zoneStripBar, { backgroundColor: color }]} />
      <Text style={[styles.zoneStripText, { color }]}>
        {isPromo ? "🔺 ZONA DE ASCENSO" : "🔻 ZONA DE DESCENSO"}
      </Text>
    </View>
  );
}

function renderZonedList(players, onPressPlayer) {
  const items = [];
  let lastZone = null;
  players.forEach((p) => {
    const zone = p.zone ?? "safe";
    if (zone !== lastZone) {
      if (zone === "promotion") items.push(<ZoneHeader key="hdr-promo" type="promotion" />);
      if (zone === "demotion")  items.push(<ZoneHeader key="hdr-demo"  type="demotion" />);
      if (lastZone !== null) {
        items.push(<View key={`sep-${lastZone}-${zone}`} style={styles.zoneSep} />);
      }
      lastZone = zone;
    }
    items.push(
      <LeaguePlayerRow
        key={p.userId}
        player={p}
        onPress={onPressPlayer ? () => onPressPlayer(p) : undefined}
      />
    );
  });
  return items;
}

// ── Liga Tab ──────────────────────────────────────────────────────────────────

function LigaTab({ leagueStatus, userId, joinLeague, friendIds, onAddFriend, busyFriendId }) {
  if (!leagueStatus.joined) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🌮</Text>
        <Text style={styles.emptyTitle}>Ligas Competitivas</Text>
        <Text style={styles.emptyText}>
          Compite cada semana contra 30 jugadores. Gana cXP completando
          palabras y asciende de división.
        </Text>
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={() => userId && joinLeague({ userId })}
        >
          <Text style={styles.joinBtnText}>Unirme a la Liga</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const players  = leagueStatus.players ?? [];
  const divColor = leagueStatus.divisionInfo?.color ?? GOLD;
  const myCxp    = leagueStatus.cxpTotal ?? 0;
  const myZone   = leagueStatus.zone ?? "safe";

  // Nudge message — psychology: near-miss for promotion, loss aversion for demotion
  let nudge = null;
  const promoCount = leagueStatus.promoCount ?? 5;
  const promoMin   = leagueStatus.promoMinCXP ?? 200;
  const safeMin    = leagueStatus.safeMinCXP ?? 50;
  const promoBoundary = leagueStatus.promoBoundaryCxp ?? 0;
  const safeBoundary  = leagueStatus.safeBoundaryCxp ?? 0;

  if (myZone === "demotion") {
    // Loss aversion: highlight threat of demotion
    const gapToSafe = safeBoundary - myCxp;
    if (gapToSafe > 0) {
      nudge = { type: "danger", text: `⚠️ Zona de descenso — faltan ${gapToSafe} cXP para estar seguro` };
    } else if (myCxp < safeMin) {
      nudge = { type: "danger", text: `⚠️ Necesitas al menos ${safeMin} cXP esta semana para no bajar` };
    }
  } else if (myZone === "promotion") {
    if (myCxp < promoMin) {
      // In promo zone by rank but not enough XP
      const gap = promoMin - myCxp;
      nudge = { type: "info", text: `🔺 ¡Faltan ${gap} cXP para confirmar tu ascenso!` };
    } else {
      nudge = { type: "success", text: `🔺 ¡Vas a ascender! Mantén tu posición` };
    }
  } else {
    // Safe zone — near-miss nudge toward promotion
    const gap = promoBoundary - myCxp;
    if (gap > 0 && gap <= 80) {
      nudge = { type: "info", text: `🔺 ¡Solo ${gap} cXP para zona de ascenso!` };
    }
  }

  const DAILY_CAP = 200;

  return (
    <View>
      {/* Daily cap bar */}
      <View style={styles.capBar}>
        <Text style={styles.capText}>
          Hoy: {leagueStatus.cxpToday ?? 0} / {DAILY_CAP} cXP
        </Text>
        <View style={styles.capTrack}>
          <View
            style={[
              styles.capFill,
              {
                width: `${Math.min(100, ((leagueStatus.cxpToday ?? 0) / DAILY_CAP) * 100)}%`,
                backgroundColor: divColor,
              },
            ]}
          />
          {/* Soft cap marker at 75% (150/200) */}
          <View style={[styles.capMarker, { left: "75%" }]} />
        </View>
      </View>

      {/* Nudge — psychology: danger for demotion (loss aversion), success for promotion */}
      {nudge && (
        <View style={[
          styles.nudge,
          nudge.type === "danger"  && { backgroundColor: "#FDECEA", borderLeftColor: "#C0392B" },
          nudge.type === "success" && { backgroundColor: "#EDF7F0", borderLeftColor: "#27AE60" },
          nudge.type === "info"    && { backgroundColor: "#EBF5FB", borderLeftColor: "#2980B9" },
        ]}>
          <Text style={[
            styles.nudgeText,
            nudge.type === "danger"  && { color: "#C0392B" },
            nudge.type === "success" && { color: "#27AE60" },
            nudge.type === "info"    && { color: "#2980B9" },
          ]}>{nudge.text}</Text>
        </View>
      )}

      {/* Table card — unified player list */}
      {players.length > 0 && (
        <View style={styles.tableCard}>
          {/* Column headers */}
          <View style={styles.colHeader}>
            <Text style={[styles.colHdrText, { width: width * 0.10, textAlign: "center" }]}>#</Text>
            <View style={{ width: width * 0.09, marginRight: width * 0.025 }} />
            <Text style={[styles.colHdrText, { flex: 1 }]}>JUGADOR</Text>
            <Text style={[styles.colHdrText, { minWidth: width * 0.18, textAlign: "right" }]}>cXP</Text>
          </View>
          <View style={styles.colHdrSep} />
          {renderZonedList(players, (p) => {
            if (p.isCurrentUser) return;
            const id = p.userId;
            if (friendIds.has(String(id))) {
              Alert.alert("Ya es tu cuate", `${p.name} ya está en tu lista de cuates.`);
              return;
            }
            Alert.alert(
              "Agregar cuate",
              `¿Quieres agregar a ${p.name} como cuate?`,
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Agregar", onPress: () => onAddFriend(id) },
              ]
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Global Tab (with sub-tabs: Siempre | Semanal | Mensual) ─────────────────

const GLOBAL_SUB_TABS = [
  { key: "alltime", label: "Siempre" },
  { key: "weekly",  label: "Semanal" },
  { key: "monthly", label: "Mensual" },
  { key: "country", label: "Mi País" },
];

function getWeekIdCST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const cst = new Date(utc + (-6 * 60 * 60 * 1000));
  const jan4 = new Date(cst.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((cst.getTime() - jan4.getTime()) / 86400000) + 4;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${cst.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function getMonthIdCST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const cst = new Date(utc + (-6 * 60 * 60 * 1000));
  return `${cst.getFullYear()}-${String(cst.getMonth() + 1).padStart(2, "0")}`;
}

function GlobalTab({ userId, friendIds, onAddFriend, busyFriendId }) {
  const [subTab, setSubTab] = useState("alltime");

  const isCountry = subTab === "country";
  const periodType = subTab;
  const periodId = subTab === "alltime"
    ? "alltime"
    : subTab === "weekly"
      ? getWeekIdCST()
      : subTab === "monthly"
        ? getMonthIdCST()
        : "alltime"; // country tab doesn't use period

  // User data for country tab
  const userData = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const userCountry = userData?.country ?? "MX";

  const globalData = useQuery(
    api.users.getGlobalLeaderboard,
    userId && !isCountry ? { userId, periodType, periodId } : "skip"
  );

  const countryData = useQuery(
    api.rankings.getCountryLeaderboard,
    userId && isCountry ? { country: userCountry, userId } : "skip"
  );

  const activeData = isCountry
    ? countryData
      ? { leaderboard: countryData.leaderboard, totalPlayers: countryData.totalPlayers, myRank: countryData.myRank, myEntry: countryData.myEntry }
      : null
    : globalData;

  const MEDAL = ["🥇", "🥈", "🥉"];
  const scoreLabel = subTab === "alltime" ? "PUNTOS" : isCountry ? "PUNTOS" : "XP";

  return (
    <View>
      {/* Sub-tab row */}
      <View style={styles.subTabRow}>
        {GLOBAL_SUB_TABS.map((st) => (
          <TouchableOpacity
            key={st.key}
            style={[styles.subTab, subTab === st.key && styles.subTabActive]}
            onPress={() => setSubTab(st.key)}
          >
            <Text style={[styles.subTabText, subTab === st.key && styles.subTabTextActive]}>
              {st.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!activeData ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={AMBER} />
        </View>
      ) : (
        <>
          {/* Country label */}
          {isCountry && (
            <View style={{ alignItems: "center", marginTop: 8 }}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: width * 0.035, color: AMBER }}>
                🌎 Ranking de {userCountry}
              </Text>
            </View>
          )}

          {/* My rank card */}
          {activeData.myRank && activeData.myEntry && (
            <View style={styles.globalMyCard}>
              <Text style={styles.globalMyLabel}>Tu posición</Text>
              <View style={styles.globalMyRow}>
                <Text style={styles.globalMyRank}>#{activeData.myRank}</Text>
                <Text style={styles.globalMyDot}> · </Text>
                <Text style={styles.globalMyScore}>{activeData.myEntry.score.toLocaleString()} pts</Text>
              </View>
              <Text style={styles.globalMyTotal}>
                de {activeData.totalPlayers.toLocaleString()} jugadores
              </Text>
            </View>
          )}

          {/* Leaderboard table */}
          <View style={styles.tableCard}>
            <View style={styles.colHeader}>
              <Text style={[styles.colHdrText, { width: width * 0.10, textAlign: "center" }]}>#</Text>
              <View style={{ width: width * 0.09, marginRight: width * 0.025 }} />
              <Text style={[styles.colHdrText, { flex: 1 }]}>JUGADOR</Text>
              <Text style={[styles.colHdrText, { minWidth: width * 0.18, textAlign: "right" }]}>{scoreLabel}</Text>
            </View>
            <View style={styles.colHdrSep} />
            {activeData.leaderboard.map((player, idx) => {
              const isMe = player.userId === userId;
              const RowComp = isMe ? View : TouchableOpacity;
              const rowProps = isMe ? {} : {
                activeOpacity: 0.7,
                onPress: () => {
                  if (friendIds.has(String(player.userId))) {
                    Alert.alert("Ya es tu cuate", `${player.name} ya está en tu lista de cuates.`);
                    return;
                  }
                  Alert.alert(
                    "Agregar cuate",
                    `¿Quieres agregar a ${player.name} como cuate?`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Agregar", onPress: () => onAddFriend(player.userId) },
                    ]
                  );
                },
              };
              return (
                <RowComp
                  key={player.userId}
                  {...rowProps}
                  style={[
                    styles.globalRow,
                    isMe && styles.globalRowMe,
                    idx < activeData.leaderboard.length - 1 && styles.globalRowBorder,
                  ]}
                >
                  <Text style={[styles.globalRankText, isMe && { color: AMBER }]}>
                    {idx < 3 ? MEDAL[idx] : `${idx + 1}`}
                  </Text>
                  <View style={styles.globalAvatar}>
                    <Text style={styles.globalAvatarText}>{player.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.globalName, isMe && { color: AMBER }]} numberOfLines={1}>
                      {player.name}
                    </Text>
                    <Text style={styles.globalLevel}>Nivel {player.level}</Text>
                  </View>
                  <Text style={[styles.globalScore, isMe && { color: AMBER }]}>
                    {player.score.toLocaleString()}
                  </Text>
                </RowComp>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

// ── Cuates Tab (weekly friend leaderboard) ──────────────────────────────────

function CuatesTab({ userId }) {
  const navigation = useNavigation();
  const [period, setPeriod] = useState("weekly");

  const friendsData = useQuery(
    api.friends.getFriendsLeaderboard,
    userId ? { userId, period } : "skip"
  );
  const pendingRequests = useQuery(
    api.friends.getPendingRequests,
    userId ? { userId } : "skip"
  );

  const acceptM = useMutation(api.friends.acceptFriendRequest);
  const declineM = useMutation(api.friends.declineFriendRequest);

  const MEDAL = ["🥇", "🥈", "🥉"];
  const isWeekly = period === "weekly";

  return (
    <View>
      {/* Period toggle */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTab, period === "weekly" && styles.subTabActive]}
          onPress={() => setPeriod("weekly")}
        >
          <Text style={[styles.subTabText, period === "weekly" && styles.subTabTextActive]}>
            Semanal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, period === "alltime" && styles.subTabActive]}
          onPress={() => setPeriod("alltime")}
        >
          <Text style={[styles.subTabText, period === "alltime" && styles.subTabTextActive]}>
            Siempre
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pending friend requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <View style={[styles.tableCard, { marginBottom: 10 }]}>
          <View style={{ padding: 10 }}>
            <Text style={[styles.colHdrText, { marginBottom: 8 }]}>
              SOLICITUDES PENDIENTES ({pendingRequests.length})
            </Text>
          </View>
          {pendingRequests.map((req) => (
            <View key={req.requesterId} style={[styles.globalRow, styles.globalRowBorder]}>
              <View style={styles.globalAvatar}>
                <Text style={styles.globalAvatarText}>{req.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.globalName} numberOfLines={1}>
                  {req.username ?? req.name}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.subTab, styles.subTabActive, { paddingHorizontal: 12, paddingVertical: 6 }]}
                onPress={() => acceptM({ userId, requesterId: req.requesterId }).catch(() => {})}
              >
                <Text style={styles.subTabTextActive}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingHorizontal: 8, paddingVertical: 6 }}
                onPress={() => declineM({ userId, requesterId: req.requesterId }).catch(() => {})}
              >
                <Text style={{ color: "#C0392B", fontFamily: FONTS.bodyBold, fontSize: width * 0.028 }}>
                  Rechazar
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {!friendsData ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={AMBER} />
        </View>
      ) : friendsData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🤝</Text>
          <Text style={styles.emptyTitle}>Sin cuates</Text>
          <Text style={styles.emptyText}>
            Agrega cuates desde el leaderboard Global o desde tu perfil para competir.
          </Text>
        </View>
      ) : (
        <View style={styles.tableCard}>
          <View style={styles.colHeader}>
            <Text style={[styles.colHdrText, { width: width * 0.10, textAlign: "center" }]}>#</Text>
            <View style={{ width: width * 0.09, marginRight: width * 0.025 }} />
            <Text style={[styles.colHdrText, { flex: 1 }]}>CUATE</Text>
            <Text style={[styles.colHdrText, { minWidth: width * 0.18, textAlign: "right" }]}>
              {isWeekly ? "XP" : "TACOS"}
            </Text>
          </View>
          <View style={styles.colHdrSep} />
          {friendsData.map((player, idx) => {
            const isMe = player.isSelf;
            const score = isWeekly ? (player.xpThisWeek ?? 0) : (player.tacos ?? 0);
            return (
              <View
                key={player.userId}
                style={[
                  styles.globalRow,
                  isMe && styles.globalRowMe,
                  idx < friendsData.length - 1 && styles.globalRowBorder,
                ]}
              >
                <Text style={[styles.globalRankText, isMe && { color: AMBER }]}>
                  {idx < 3 ? MEDAL[idx] : `${idx + 1}`}
                </Text>
                <View style={styles.globalAvatar}>
                  <Text style={styles.globalAvatarText}>{player.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.globalName, isMe && { color: AMBER }]} numberOfLines={1}>
                    {isMe ? "Tú" : (player.username ?? player.name)}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    {isWeekly && player.wordsThisWeek > 0 && (
                      <Text style={styles.globalLevel}>
                        {player.wordsThisWeek} palabras
                      </Text>
                    )}
                    {player.eloRating != null && (() => {
                      const tier = getEloTier(player.eloRating);
                      return (
                        <Text style={[styles.globalLevel, { color: tier.color }]}>
                          {tier.emoji} {tier.name} ({player.eloRating})
                        </Text>
                      );
                    })()}
                  </View>
                </View>
                <Text style={[styles.globalScore, isMe && { color: AMBER }]}>
                  {score.toLocaleString()}
                </Text>
                {!isMe && (
                  <TouchableOpacity
                    style={styles.cuatesChallengeBtn}
                    onPress={() => navigation.navigate("PvP", { friendInviteId: player.userId })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cuatesChallengeBtnText}>Retar</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Mini Tab ──────────────────────────────────────────────────────────────────

function MiniTab() {
  return (
    <View>
      <DailyMiniWidget />
      <View style={styles.miniInfo}>
        <Text style={styles.miniInfoTitle}>¿Cómo funciona?</Text>
        <Text style={styles.miniInfoText}>
          Cada día compites contra 3-5 jugadores de tu nivel. Gana cXP
          completando palabras para subir en el ranking diario.
        </Text>
        <View style={styles.rewardList}>
          <Text style={styles.rewardItem}>🥇 1° lugar: 25 monedas</Text>
          <Text style={styles.rewardItem}>🥈 2° lugar: 15 monedas</Text>
          <Text style={styles.rewardItem}>🥉 3° lugar: 10 monedas</Text>
          <Text style={styles.rewardItem}>🎮 Participación: 5 monedas</Text>
        </View>
      </View>
    </View>
  );
}

// ── Historial Tab ─────────────────────────────────────────────────────────────

// ── PvP Leaderboard Tab ─────────────────────────────────────────────────────
function PvPTab({ userId }) {
  const navigation = useNavigation();
  const pvpLeaderboard = useQuery(api.pvp.getPvpLeaderboard, { limit: 50 });
  const pvpStats = useQuery(api.pvp.getPvpStats, userId ? { userId } : "skip");

  return (
    <View>
      {/* ── Big "Buscar Partida" button ── */}
      <TouchableOpacity
        style={styles.pvpSearchBtn}
        onPress={() => navigation.navigate("PvP")}
        activeOpacity={0.8}
      >
        <Text style={styles.pvpSearchBtnEmoji}>⚔️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.pvpSearchBtnTitle}>Buscar Partida</Text>
          <Text style={styles.pvpSearchBtnSub}>Duelo aleatorio contra otro jugador</Text>
        </View>
        <Text style={styles.pvpSearchBtnArrow}>›</Text>
      </TouchableOpacity>

      {/* My PvP stats */}
      {pvpStats && (
        <View style={styles.pvpMyStats}>
          <Text style={styles.pvpMyStatsTitle}>Tu ranking PvP</Text>
          <View style={styles.pvpMyStatsRow}>
            <Text style={{ fontSize: 18 }}>{pvpStats.tier.emoji}</Text>
            <Text style={[styles.pvpMyElo, { color: pvpStats.tier.color }]}>{pvpStats.eloRating}</Text>
            <Text style={styles.pvpMyRecord}>
              {pvpStats.pvpWins}V-{pvpStats.pvpLosses}D-{pvpStats.pvpDraws}E
            </Text>
          </View>
        </View>
      )}

      {!pvpLeaderboard ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : pvpLeaderboard.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⚔️</Text>
          <Text style={styles.emptyTitle}>Sin duelos PvP</Text>
          <Text style={styles.emptyText}>
            Juega duelos PvP para aparecer en el ranking.
          </Text>
        </View>
      ) : (
        /* Leaderboard */
        <View style={styles.tableCard}>
          <View style={styles.colHeader}>
            <Text style={[styles.colHdrText, { width: 36, textAlign: "center" }]}>#</Text>
            <View style={{ width: width * 0.06 + 10 }} />
            <Text style={[styles.colHdrText, { flex: 1 }]}>JUGADOR</Text>
            <Text style={[styles.colHdrText, { textAlign: "right" }]}>ELO</Text>
          </View>
          <View style={styles.colHdrSep} />
          {pvpLeaderboard.map((p, idx) => {
            const isMe = String(p.userId) === String(userId);
            return (
              <View
                key={String(p.userId)}
                style={[
                  styles.pvpRow,
                  isMe && styles.pvpRowMe,
                  idx < pvpLeaderboard.length - 1 && styles.globalRowBorder,
                ]}
              >
                <Text style={styles.pvpRank}>
                  {p.rank <= 3
                    ? ["🥇", "🥈", "🥉"][p.rank - 1]
                    : `#${p.rank}`}
                </Text>
                <Text style={styles.pvpAvatar}>{p.avatar}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pvpName, isMe && { color: AMBER }]}>{p.name}</Text>
                  <Text style={styles.pvpRecord}>{p.wins}V-{p.losses}D</Text>
                </View>
                <View style={styles.pvpEloCol}>
                  <Text style={{ fontSize: 14 }}>{p.tier.emoji}</Text>
                  <Text style={[styles.pvpElo, { color: p.tier.color }]}>{p.elo}</Text>
                </View>
                {!isMe && (
                  <TouchableOpacity
                    style={styles.pvpChallengeBtn}
                    onPress={() => navigation.navigate("PvP", { friendInviteId: p.userId })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pvpChallengeBtnText}>Retar</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Mini-Games Leaderboard Tab ──────────────────────────────────────────────
const GAME_TYPES = [
  { key: "nahual",   label: "Nahual",   table: "nahualScores" },
  { key: "taquero",  label: "Taquero",  table: "taqueroScores" },
  { key: "albures",  label: "Albures",  table: "alburesScores" },
  { key: "loteria",  label: "Lotería",  table: "loteriaScores" },
];

function JuegosTab({ userId }) {
  const [selectedGame, setSelectedGame] = useState("nahual");

  // We use the existing rankings query based on game type
  // For now, show a placeholder that connects to existing score tables
  return (
    <View>
      {/* Game sub-tabs */}
      <View style={styles.subTabRow}>
        {GAME_TYPES.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[styles.subTab, selectedGame === g.key && styles.subTabActive]}
            onPress={() => setSelectedGame(g.key)}
          >
            <Text style={[styles.subTabText, selectedGame === g.key && styles.subTabTextActive]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <MiniGameLeaderboard gameType={selectedGame} userId={userId} />
    </View>
  );
}

function MiniGameLeaderboard({ gameType, userId }) {
  // Map game type to the correct score table query
  const scoreQueries = {
    nahual: api.users.getGlobalLeaderboard,
    taquero: api.users.getGlobalLeaderboard,
    albures: api.users.getGlobalLeaderboard,
    loteria: api.users.getGlobalLeaderboard,
  };

  // For now, show a coming soon state for mini-game specific leaderboards
  // This can be expanded with dedicated queries per game type
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>
        {gameType === "nahual" ? "🐉" : gameType === "taquero" ? "🌮" : gameType === "albures" ? "🎭" : "🎴"}
      </Text>
      <Text style={styles.emptyTitle}>
        Top {GAME_TYPES.find((g) => g.key === gameType)?.label ?? "Juego"}
      </Text>
      <Text style={styles.emptyText}>
        Los rankings de mini-juegos se actualizan cada 30 minutos.
      </Text>
    </View>
  );
}

function HistorialTab({ history }) {
  if (!history || history.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🗿</Text>
        <Text style={styles.emptyTitle}>Sin historial</Text>
        <Text style={styles.emptyText}>
          Participa en la liga semanal para ver tu historial aquí.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {history.map((entry) => {
        const divIdx  = (entry.division ?? 1) - 1;
        const divInfo = DIVISIONS[divIdx] ?? DIVISIONS[0];
        const isUp    = entry.outcome === "promoted";
        const isDown  = entry.outcome === "demoted";
        return (
          <View key={entry.weekId} style={styles.historyRow}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyEmoji}>{divInfo.emoji}</Text>
              <View>
                <Text style={styles.historyWeek}>{entry.weekId}</Text>
                <Text style={styles.historyDiv}>Liga {divInfo.name}</Text>
              </View>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyCxp}>{entry.cxpTotal} cXP</Text>
              <Text
                style={[
                  styles.historyOutcome,
                  isUp   && { color: "#27AE60" },
                  isDown && { color: "#C0392B" },
                ]}
              >
                {isUp ? "🔺 Ascenso" : isDown ? "🔻 Descenso" : `#${entry.rank ?? "-"}`}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    fontFamily: FONTS.bodyBold,
    color: WHEAT,
    marginTop: 12,
    fontSize: width * 0.04,
  },

  // ── Header ──
  headerOuter: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerPanel: {
    backgroundColor: WHEAT,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(210,105,30,0.45)",
    padding: 14,
    alignItems: "center",
  },
  hdrTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  hdrDivInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  hdrDivEmoji: { fontSize: width * 0.075 },
  hdrDivName: {
    fontFamily: FONTS.display,
    color: BROWN,
    fontSize: width * 0.042,
    flexShrink: 1,
  },
  hdrSep: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(210,105,30,0.3)",
    marginVertical: 10,
  },
  hdrStatsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  hdrStatVal: {
    fontFamily: FONTS.display,
    fontSize: width * 0.055,
    color: BROWN,
  },
  hdrDot: { color: "#A0714F", fontSize: width * 0.04 },
  hdrCxpVal: {
    fontFamily: FONTS.display,
    fontSize: width * 0.055,
    color: AMBER,
  },
  hdrJoinHint: {
    fontFamily: FONTS.body,
    color: "#A0714F",
    fontSize: width * 0.033,
  },
  zoneHintUp: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.03,
    color: "#27AE60",
    marginTop: 6,
  },
  zoneHintDown: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.03,
    color: "#C0392B",
    marginTop: 6,
  },

  // ── Tabs ──
  tabRow: {
    flexDirection: "row",
    backgroundColor: WHEAT,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(210,105,30,0.4)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: height * 0.013,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: AMBER },
  tabText: {
    fontFamily: FONTS.bodyBold,
    color: "#A0714F",
    fontSize: width * 0.035,
  },
  tabTextActive: { color: BROWN },

  content: { flex: 1 },
  contentInner: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.015,
    paddingBottom: height * 0.05,
  },

  // ── Sub-tabs (within Global/Cuates) ──
  subTabRow: {
    flexDirection: "row",
    backgroundColor: WHEAT2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D2A679",
    padding: 3,
    marginBottom: 10,
    gap: 3,
  },
  subTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  subTabActive: {
    backgroundColor: AMBER,
  },
  subTabText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.03,
    color: "#A0714F",
  },
  subTabTextActive: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.03,
    color: "#FFF",
  },

  // ── Cap bar ──
  capBar: {
    backgroundColor: WHEAT2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D2A679",
    padding: 12,
    marginBottom: 10,
  },
  capText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.03,
    color: BROWN,
    marginBottom: 6,
  },
  capTrack: {
    height: 8,
    backgroundColor: BURLY,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  capFill:   { height: "100%", borderRadius: 4 },
  capMarker: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: AMBER,
  },

  // ── Nudge ──
  nudge: {
    backgroundColor: "rgba(255,228,181,0.45)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: AMBER,
  },
  nudgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.03,
    color: BROWN,
  },

  // ── Table card ──
  tableCard: {
    backgroundColor: WHEAT,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.35)",
    overflow: "hidden",
    marginBottom: 12,
  },
  colHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  colHdrText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.025,
    color: "#A0714F",
    letterSpacing: 1,
  },
  colHdrSep: {
    height: 1,
    backgroundColor: "rgba(210,105,30,0.35)",
  },

  // ── Zone strip (inside card) ──
  zoneStrip: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 7,
  },
  zoneStripBar: {
    width: 4,
    alignSelf: "stretch",
  },
  zoneStripText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.027,
    letterSpacing: 1,
    paddingHorizontal: 10,
  },

  // ── Zone separator (1px line between zones) ──
  zoneSep: {
    height: 1,
    backgroundColor: "rgba(210,105,30,0.25)",
  },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    paddingTop: height * 0.05,
  },
  emptyEmoji: { fontSize: width * 0.15, marginBottom: 12 },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.05,
    color: WHEAT,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: width * 0.035,
    color: "rgba(255,228,181,0.85)",
    textAlign: "center",
    lineHeight: width * 0.05,
    paddingHorizontal: width * 0.06,
    marginBottom: 20,
  },

  // ── Join button ──
  joinBtn: {
    backgroundColor: GOLD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#C8950A",
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  joinBtnText: {
    fontFamily: FONTS.bodyBold,
    color: "#523600",
    fontSize: width * 0.04,
  },

  // ── Mini info ──
  miniInfo: {
    backgroundColor: WHEAT,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D2A679",
    padding: width * 0.04,
    marginTop: 4,
  },
  miniInfoTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.038,
    color: BROWN,
    marginBottom: 8,
  },
  miniInfoText: {
    fontFamily: FONTS.body,
    fontSize: width * 0.032,
    color: "#7A4020",
    lineHeight: width * 0.048,
    marginBottom: 12,
  },
  rewardList: { gap: 6 },
  rewardItem: {
    fontFamily: FONTS.body,
    fontSize: width * 0.032,
    color: BROWN,
  },

  // ── Global ──
  globalMyCard: {
    backgroundColor: WHEAT,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(210,105,30,0.45)",
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    gap: 4,
  },
  globalMyLabel: {
    fontFamily: FONTS.body,
    fontSize: width * 0.03,
    color: "#A0714F",
  },
  globalMyRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  globalMyRank: {
    fontFamily: FONTS.display,
    fontSize: width * 0.07,
    color: BROWN,
  },
  globalMyDot: { color: "#A0714F", fontSize: width * 0.04 },
  globalMyScore: {
    fontFamily: FONTS.display,
    fontSize: width * 0.055,
    color: AMBER,
  },
  globalMyTotal: {
    fontFamily: FONTS.body,
    fontSize: width * 0.03,
    color: "#A0714F",
  },
  globalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  globalRowMe: {
    backgroundColor: "rgba(248,190,23,0.12)",
  },
  globalRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(210,105,30,0.15)",
  },
  globalRankText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.04,
    color: BROWN,
    width: width * 0.08,
    textAlign: "center",
  },
  globalAvatar: {
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: width * 0.045,
    backgroundColor: "#FFF5E6",
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  globalAvatarText: { fontSize: width * 0.045 },
  globalName: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.034,
    color: BROWN,
  },
  globalLevel: {
    fontFamily: FONTS.body,
    fontSize: width * 0.026,
    color: "#A0714F",
  },
  globalScore: {
    fontFamily: FONTS.display,
    fontSize: width * 0.038,
    color: BROWN,
    minWidth: width * 0.16,
    textAlign: "right",
  },

  // ── History ──
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: WHEAT2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D2A679",
    padding: width * 0.035,
    marginBottom: 8,
  },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyEmoji: { fontSize: width * 0.06 },
  historyWeek: {
    fontFamily: FONTS.body,
    fontSize: width * 0.03,
    color: "#A0714F",
  },
  historyDiv: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.035,
    color: BROWN,
  },
  historyRight: { alignItems: "flex-end" },
  historyCxp: {
    fontFamily: FONTS.display,
    fontSize: width * 0.035,
    color: AMBER,
  },
  historyOutcome: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.028,
    color: "#A0714F",
  },

  // ── PvP Tab ──
  pvpMyStats: {
    backgroundColor: WHEAT,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(139,69,19,0.35)",
  },
  pvpMyStatsTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.032,
    color: BROWN,
    marginBottom: 6,
  },
  pvpMyStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pvpMyElo: {
    fontFamily: FONTS.display,
    fontSize: width * 0.05,
  },
  pvpMyRecord: {
    fontFamily: FONTS.body,
    fontSize: width * 0.03,
    color: BROWN,
  },
  pvpRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  pvpRowMe: {
    backgroundColor: "rgba(248,190,23,0.12)",
  },
  pvpRank: {
    fontFamily: FONTS.display,
    fontSize: width * 0.035,
    color: BROWN,
    width: 36,
    textAlign: "center",
  },
  pvpAvatar: { fontSize: width * 0.06 },
  pvpName: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.033,
    color: BROWN,
  },
  pvpRecord: {
    fontFamily: FONTS.body,
    fontSize: width * 0.024,
    color: "#A0714F",
  },
  pvpEloCol: {
    alignItems: "center",
    gap: 2,
  },
  pvpElo: {
    fontFamily: FONTS.display,
    fontSize: width * 0.035,
  },
  pvpSearchBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GOLD,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#C8950A",
  },
  pvpSearchBtnEmoji: {
    fontSize: 28,
  },
  pvpSearchBtnTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.045,
    color: "#523600",
  },
  pvpSearchBtnSub: {
    fontFamily: FONTS.body,
    fontSize: width * 0.028,
    color: "#7A5A00",
    marginTop: 1,
  },
  pvpSearchBtnArrow: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: "#523600",
  },
  pvpChallengeBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  pvpChallengeBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.028,
    color: "#523600",
  },
  cuatesChallengeBtn: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  cuatesChallengeBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.025,
    color: "#523600",
  },

  // ── Mini-Games Tab ──
  subTabRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(139,69,19,0.06)",
    alignItems: "center",
  },
  subTabActive: {
    backgroundColor: AMBER,
  },
  subTabText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.028,
    color: BROWN,
  },
  subTabTextActive: {
    color: "#FFF",
  },
});
