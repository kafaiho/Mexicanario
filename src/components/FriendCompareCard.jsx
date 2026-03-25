import { useQuery } from "convex/react";
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { FONTS } from "../theme/designTokens";
import { getRank } from "../config/xpRanks";

const { width } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";

/**
 * Side-by-side comparison card between current user and a friend.
 *
 * Props:
 *   userId: Id<"users">     — current user
 *   friendId: Id<"users">   — friend to compare with
 *   onChallenge?: () => void — called when "Retar" is pressed (optional)
 */
export default function FriendCompareCard({ userId, friendId, onChallenge }) {
  const myProfile = useQuery(
    api.friends.getUserProfile,
    userId ? { targetId: userId } : "skip"
  );
  const friendProfile = useQuery(
    api.friends.getUserProfile,
    friendId ? { targetId: friendId } : "skip"
  );

  // Weekly scores
  const myWeekly = useQuery(
    api.friends.getFriendsLeaderboard,
    userId ? { userId, period: "weekly" } : "skip"
  );

  if (!myProfile || !friendProfile) return null;

  // Extract weekly stats
  const myWeeklyEntry = myWeekly?.find((e) => e.isSelf);
  const friendWeeklyEntry = myWeekly?.find(
    (e) => String(e.userId) === String(friendId)
  );

  const myXpWeek = myWeeklyEntry?.xpThisWeek ?? 0;
  const friendXpWeek = friendWeeklyEntry?.xpThisWeek ?? 0;
  const myWordsWeek = myWeeklyEntry?.wordsThisWeek ?? 0;
  const friendWordsWeek = friendWeeklyEntry?.wordsThisWeek ?? 0;
  const myCombo = myProfile.bestCombo ?? 0;
  const friendCombo = friendProfile.bestCombo ?? 0;

  const myRank = getRank(myProfile.xp);
  const friendRank = getRank(friendProfile.xp);

  const stats = [
    {
      label: "XP Semanal",
      mine: myXpWeek,
      theirs: friendXpWeek,
    },
    {
      label: "Palabras Sem.",
      mine: myWordsWeek,
      theirs: friendWordsWeek,
    },
    {
      label: "Mejor Combo",
      mine: myCombo,
      theirs: friendCombo,
    },
    {
      label: "XP Total",
      mine: myProfile.xp ?? 0,
      theirs: friendProfile.xp ?? 0,
    },
    {
      label: "Tacos",
      mine: myProfile.tacos ?? 0,
      theirs: friendProfile.tacos ?? 0,
    },
  ];

  return (
    <View style={styles.card}>
      {/* Header: avatars + names */}
      <View style={styles.headerRow}>
        <View style={styles.playerCol}>
          <View style={[styles.avatar, { borderColor: myRank.color }]}>
            <Text style={styles.avatarText}>{myProfile.avatar}</Text>
          </View>
          <Text style={styles.playerName} numberOfLines={1}>Tú</Text>
          <Text style={[styles.rankBadge, { color: myRank.color }]}>
            {myRank.emoji} {myRank.title}
          </Text>
        </View>

        <Text style={styles.vsText}>VS</Text>

        <View style={styles.playerCol}>
          <View style={[styles.avatar, { borderColor: friendRank.color }]}>
            <Text style={styles.avatarText}>{friendProfile.avatar}</Text>
          </View>
          <Text style={styles.playerName} numberOfLines={1}>
            {friendProfile.username ?? friendProfile.name}
          </Text>
          <Text style={[styles.rankBadge, { color: friendRank.color }]}>
            {friendRank.emoji} {friendRank.title}
          </Text>
        </View>
      </View>

      {/* Stats rows */}
      {stats.map((stat) => {
        const iWin = stat.mine > stat.theirs;
        const theyWin = stat.theirs > stat.mine;
        return (
          <View key={stat.label} style={styles.statRow}>
            <Text
              style={[
                styles.statValue,
                styles.statLeft,
                iWin && styles.statWin,
              ]}
            >
              {stat.mine.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text
              style={[
                styles.statValue,
                styles.statRight,
                theyWin && styles.statWin,
              ]}
            >
              {stat.theirs.toLocaleString()}
            </Text>
          </View>
        );
      })}

      {/* Challenge button */}
      {onChallenge && (
        <TouchableOpacity style={styles.challengeBtn} onPress={onChallenge} activeOpacity={0.8}>
          <Text style={styles.challengeBtnText}>Retar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WHEAT,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(210,105,30,0.4)",
    padding: 16,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  playerCol: {
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: width * 0.065,
    backgroundColor: "#FFF5E6",
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  avatarText: { fontSize: width * 0.06 },
  playerName: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.032,
    color: BROWN,
    maxWidth: width * 0.28,
    textAlign: "center",
  },
  rankBadge: {
    fontFamily: FONTS.body,
    fontSize: width * 0.024,
    marginTop: 2,
    textAlign: "center",
  },
  vsText: {
    fontFamily: FONTS.display,
    fontSize: width * 0.05,
    color: AMBER,
    marginHorizontal: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(210,105,30,0.15)",
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: width * 0.038,
    color: BROWN,
    width: width * 0.2,
  },
  statLeft: { textAlign: "right", paddingRight: 12 },
  statRight: { textAlign: "left", paddingLeft: 12 },
  statWin: { color: "#27AE60" },
  statLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.027,
    color: "#A0714F",
    flex: 1,
    textAlign: "center",
  },
  challengeBtn: {
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: "#C8950A",
  },
  challengeBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.038,
    color: "#523600",
  },
});
