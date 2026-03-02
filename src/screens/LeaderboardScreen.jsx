import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import DailyMiniWidget from "../components/DailyMiniWidget";
import { DIVISIONS } from "../components/LeagueBadge";
import LeagueCountdown from "../components/LeagueCountdown";
import LeaguePlayerRow from "../components/LeaguePlayerRow";
import LeagueResultModal from "../components/LeagueResultModal";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";

const { width, height } = Dimensions.get("window");

const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';
const BURLY = '#DEB887';
const WHEAT = '#FFE4B5';
const WHEAT2 = '#F5DEB3';

const TABS = [
  { key: "liga",      label: "Liga" },
  { key: "mini",      label: "Reto" },
  { key: "historial", label: "Historial" },
];

export default function LeaderboardScreen() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState("liga");
  const [showResult, setShowResult] = useState(false);

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

  if (!leagueStatus) {
    return (
      <ImageBackground
        source={require("../../assets/images/bg.png")}
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
      source={require("../../assets/images/bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <TopBar />

      {/* Header panel — integrated */}
      <View style={styles.headerOuter}>
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
          />
        )}
        {activeTab === "mini" && <MiniTab />}
        {activeTab === "historial" && <HistorialTab history={leagueHistory} />}
      </ScrollView>

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

function renderZonedList(players) {
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
    items.push(<LeaguePlayerRow key={p.userId} player={p} />);
  });
  return items;
}

// ── Liga Tab ──────────────────────────────────────────────────────────────────

function LigaTab({ leagueStatus, userId, joinLeague }) {
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

  // Nudge message
  let nudge = null;
  if (leagueStatus.rank >= 6 && leagueStatus.rank <= 7) {
    const rankAbove = players[4];
    if (rankAbove) {
      const gap = rankAbove.cxpTotal - leagueStatus.cxpTotal;
      if (gap > 0) nudge = `¡Solo te faltan ${gap} cXP para subir!`;
    }
  }

  return (
    <View>
      {/* Daily cap bar */}
      <View style={styles.capBar}>
        <Text style={styles.capText}>
          Hoy: {leagueStatus.cxpToday ?? 0} / 150 cXP
        </Text>
        <View style={styles.capTrack}>
          <View
            style={[
              styles.capFill,
              {
                width: `${Math.min(100, ((leagueStatus.cxpToday ?? 0) / 150) * 100)}%`,
                backgroundColor: divColor,
              },
            ]}
          />
          <View style={[styles.capMarker, { left: "66.6%" }]} />
        </View>
      </View>

      {/* Nudge */}
      {nudge && (
        <View style={styles.nudge}>
          <Text style={styles.nudgeText}>{nudge}</Text>
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
          {renderZonedList(players)}
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
    paddingTop: height * 0.13,
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
});
