import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FONTS } from "../theme/designTokens";

const { width, height } = Dimensions.get("window");

const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';

const RANK_MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

const ZONE_ACCENT = {
  promotion: "#27AE60",
  safe:      "#D2A679",
  demotion:  "#C0392B",
};

export default function LeaguePlayerRow({ player, onPress }) {
  const { rank, zone, name, avatar, cxpTotal, isCurrentUser, isActive } = player;

  const accentColor = isCurrentUser ? GOLD : (ZONE_ACCENT[zone] ?? ZONE_ACCENT.safe);
  // Rank 1 gets a warm dark-amber tint; others keep wheat
  const rowBg = rank === 1
    ? "rgba(210,105,30,0.18)"   // subtle amber-brown, text stays readable
    : "#FFE4B5";

  const Wrapper = onPress && !isCurrentUser ? TouchableOpacity : View;
  const wrapperProps = onPress && !isCurrentUser ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Wrapper {...wrapperProps} style={[styles.row, { backgroundColor: rowBg, borderLeftColor: accentColor }]}>

      {/* Rank */}
      <View style={styles.rankCol}>
        {rank <= 3 ? (
          <Text style={styles.medal}>{RANK_MEDALS[rank]}</Text>
        ) : (
          <Text style={[styles.rankText, isCurrentUser && styles.rankTextBold]}>
            {rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatar, isCurrentUser && styles.avatarCurrent]}>
        {isActive && <View style={styles.activeDot} />}
        <Text style={styles.avatarEmoji}>{avatar || "👤"}</Text>
      </View>

      {/* Name + zone pill */}
      <View style={styles.nameCol}>
        <Text
          style={[styles.nameText, isCurrentUser && styles.nameTextBold]}
          numberOfLines={1}
        >
          {isCurrentUser ? `${name} ★` : name}
        </Text>
        {zone === "promotion" && (
          <View style={[styles.zonePill, styles.pillUp]}>
            <Text style={styles.pillUpText}>🔺 Ascenso</Text>
          </View>
        )}
        {zone === "demotion" && (
          <View style={[styles.zonePill, styles.pillDown]}>
            <Text style={styles.pillDownText}>🔻 Descenso</Text>
          </View>
        )}
      </View>

      {/* cXP */}
      <View style={styles.scoreCol}>
        <Text style={[styles.scoreNum, isCurrentUser && styles.scoreNumBold]}>
          {cxpTotal}
        </Text>
        <Text style={styles.scoreLabel}>cXP</Text>
      </View>

    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    paddingVertical: height * 0.013,
    paddingLeft: width * 0.02,
    paddingRight: width * 0.03,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(210,105,30,0.18)",
  },

  rankCol: {
    width: width * 0.10,
    alignItems: "center",
    justifyContent: "center",
  },
  medal: {
    fontSize: width * 0.052,
  },
  rankText: {
    fontFamily: FONTS.display,
    fontSize: width * 0.038,
    color: "#A0714F",
  },
  rankTextBold: {
    color: BROWN,
  },

  avatar: {
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: width * 0.045,
    backgroundColor: "#FFE4B5",
    borderWidth: 1.5,
    borderColor: "#D2A679",
    justifyContent: "center",
    alignItems: "center",
    marginRight: width * 0.025,
  },
  avatarCurrent: {
    borderColor: GOLD,
    borderWidth: 2,
  },
  avatarEmoji: {
    fontSize: width * 0.045,
  },
  activeDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: GOLD,
    borderWidth: 1.5,
    borderColor: "#FFE4B5",
    zIndex: 1,
  },

  nameCol: {
    flex: 1,
    marginRight: width * 0.02,
    justifyContent: "center",
  },
  nameText: {
    fontFamily: FONTS.body,
    fontSize: width * 0.036,
    color: BROWN,
  },
  nameTextBold: {
    fontFamily: FONTS.bodyBold,
    color: '#5C2E00',
  },

  // Zone pills — fondos sólidos (dentro del tableCard, no sobre imagen)
  zonePill: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
    alignSelf: "flex-start",
  },
  pillUp:   { backgroundColor: "#E8F5ED" },
  pillDown: { backgroundColor: "#FDECEC" },
  pillUpText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.024,
    color: "#27AE60",
  },
  pillDownText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.024,
    color: "#C0392B",
  },

  scoreCol: {
    alignItems: "flex-end",
    minWidth: width * 0.18,
  },
  scoreNum: {
    fontFamily: FONTS.display,
    fontSize: width * 0.042,
    color: AMBER,
  },
  scoreNumBold: {
    color: '#B35A00',
  },
  scoreLabel: {
    fontFamily: FONTS.body,
    fontSize: width * 0.022,
    color: "#A0714F",
  },
});
