import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";
const RED = "#C0392B";
const GREEN = "#27AE60";
const PURPLE = "#8E44AD";

const LOTERIA_CARDS = [
    { id: 1, name: "El Gallo", icon: "🐓" },
    { id: 2, name: "El Catrín", icon: "🎩" },
    { id: 3, name: "La Sirena", icon: "🧜‍♀️" },
    { id: 4, name: "La Calavera", icon: "💀" },
    { id: 5, name: "La Chalupa", icon: "🛶" },
    { id: 6, name: "La Estrella", icon: "⭐" },
    { id: 7, name: "El Diablo", icon: "😈" },
    { id: 8, name: "La Luna", icon: "🌙" },
    { id: 9, name: "El Borracho", icon: "🍺" },
    { id: 10, name: "El Corazón", icon: "❤️" },
    { id: 11, name: "El Sol", icon: "☀️" },
    { id: 12, name: "La Corona", icon: "👑" },
];

const TABS = [
    { key: "daily", label: "🔥 Hoy" },
    { key: "weekly", label: "📅 Semana" },
    { key: "alltime", label: "🏆 Total" },
];

function scoreMsg(n) {
    if (n > 20) return "¡Eres el gritón oficial! 🎤";
    if (n > 10) return "¡Buena racha compa! 👍";
    return "¡Te falta barrio! 👎";
}

export default function LoteriaExpressScreen({ navigation }) {
    const { userId } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [targetCard, setTargetCard] = useState(null);
    const [options, setOptions] = useState([]);
    const [flash, setFlash] = useState(null); // null | "correct" | "wrong"
    const [tab, setTab] = useState("daily");

    const submitScore = useMutation(api.loteria.submitScore);
    const leaderboard = useQuery(api.loteria.getLeaderboard, isGameOver ? { type: tab } : "skip");
    const myBest = useQuery(api.loteria.getMyBest, userId && isGameOver ? { userId } : "skip");

    useEffect(() => {
        let timer;
        if (isPlaying && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (isPlaying && timeLeft === 0) {
            const finalScore = score;
            setIsGameOver(true);
            setIsPlaying(false);
            if (userId && finalScore > 0) submitScore({ userId, score: finalScore }).catch(() => { });
        }
        return () => clearInterval(timer);
    }, [isPlaying, timeLeft]);

    const generateRound = () => {
        const newTarget = LOTERIA_CARDS[Math.floor(Math.random() * LOTERIA_CARDS.length)];
        let newOptions = [newTarget];
        while (newOptions.length < 4) {
            const r = LOTERIA_CARDS[Math.floor(Math.random() * LOTERIA_CARDS.length)];
            if (!newOptions.find((c) => c.id === r.id)) newOptions.push(r);
        }
        setTargetCard(newTarget);
        setOptions(newOptions.sort(() => Math.random() - 0.5));
    };

    const startGame = () => {
        setIsPlaying(true);
        setIsGameOver(false);
        setScore(0);
        setTimeLeft(30);
        setFlash(null);
        generateRound();
    };

    const handleTap = (cardId) => {
        if (!isPlaying || isGameOver || flash) return;
        if (cardId === targetCard.id) {
            setScore((s) => s + 1);
            setFlash("correct");
        } else {
            setTimeLeft((t) => Math.max(0, t - 2));
            setFlash("wrong");
        }
        setTimeout(() => { setFlash(null); generateRound(); }, 350);
    };

    return (
        <ImageBackground source={require("../../assets/images/bg.png")} style={styles.root} resizeMode="cover">
            <View style={styles.darkOverlay} />

            {/* flash feedback overlay */}
            {flash && (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: flash === "correct" ? "rgba(39,174,96,0.25)" : "rgba(192,57,43,0.25)", zIndex: 50 }]} pointerEvents="none" />
            )}

            {/* ── Menú ── */}
            {!isPlaying && !isGameOver && (
                <View style={styles.cardOverlay}>
                    <View style={styles.card}>
                        <Text style={styles.cardBigEmoji}>🃏</Text>
                        <Text style={styles.cardTitle}>¡Lotería Exprés!</Text>
                        <Text style={styles.cardDesc}>
                            Encuentra la carta cantada lo más rápido posible.{"\n"}
                            Errores quitan 2 segundos. ¡30s en el reloj!
                        </Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                            <Text style={styles.startBtnText}>¡Corre y se va con...!</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.backBtnText}>← Volver</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── En juego ── */}
            {isPlaying && targetCard && (
                <View style={StyleSheet.absoluteFillObject}>
                    <View style={styles.hud}>
                        <Text style={styles.hudText}>🃏 {score}</Text>
                        <Text style={[styles.hudText, timeLeft <= 5 && { backgroundColor: "rgba(192,57,43,0.85)" }]}>⏱️ {timeLeft}s</Text>
                        <TouchableOpacity style={styles.exitBtn} onPress={() => { setIsPlaying(false); navigation.goBack(); }}>
                            <Text style={styles.exitBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.gameInner}>
                        <View style={styles.targetBox}>
                            <Text style={styles.targetSub}>¡Corre y se va con...!</Text>
                            <Text style={styles.targetName}>{targetCard.name.toUpperCase()}</Text>
                        </View>

                        <View style={styles.cardsGrid}>
                            {options.map((card, idx) => (
                                <TouchableOpacity key={idx} style={styles.gameCard} onPress={() => handleTap(card.id)}>
                                    <Text style={styles.cardIcon}>{card.icon}</Text>
                                    <Text style={styles.cardName}>{card.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            {/* ── Game over + leaderboard ── */}
            {isGameOver && (
                <View style={styles.cardOverlay}>
                    <View style={styles.card}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingBottom: 8 }}>
                            <Text style={styles.cardBigEmoji}>🎉</Text>
                            <Text style={styles.cardTitle}>¡Lotería!</Text>

                            <View style={styles.resultBox}>
                                <Text style={styles.resultNum}>{score}</Text>
                                <Text style={styles.resultLabel}>cartas 🃏</Text>
                            </View>
                            <Text style={styles.resultMsg}>{scoreMsg(score)}</Text>

                            {myBest && (
                                <View style={styles.myBestRow}>
                                    <View style={styles.myBestItem}><Text style={styles.myBestVal}>{myBest.daily}</Text><Text style={styles.myBestLabel}>🔥 Hoy</Text></View>
                                    <View style={styles.myBestItem}><Text style={styles.myBestVal}>{myBest.weekly}</Text><Text style={styles.myBestLabel}>📅 Semana</Text></View>
                                    <View style={styles.myBestItem}><Text style={styles.myBestVal}>{myBest.allTime}</Text><Text style={styles.myBestLabel}>🏆 Total</Text></View>
                                </View>
                            )}

                            <View style={styles.tabRow}>
                                {TABS.map((t) => (
                                    <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
                                        <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.lbList}>
                                {!leaderboard ? (
                                    <Text style={styles.lbLoading}>Cargando...</Text>
                                ) : leaderboard.length === 0 ? (
                                    <Text style={styles.lbEmpty}>¡Sé el primero en el marcador!</Text>
                                ) : leaderboard.map((entry) => {
                                    const isMe = entry.userId === userId;
                                    return (
                                        <View key={entry.userId} style={[styles.lbRow, isMe && styles.lbRowMe]}>
                                            <Text style={styles.lbRank}>{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}</Text>
                                            <Text style={styles.lbAvatar}>{entry.avatar}</Text>
                                            <Text style={styles.lbName} numberOfLines={1}>{entry.name}</Text>
                                            <Text style={styles.lbScore}>🃏 {entry.score}</Text>
                                        </View>
                                    );
                                })}
                            </View>

                            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                                <Text style={styles.startBtnText}>¡Otra vez, órale!</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                                <Text style={styles.backBtnText}>← Volver</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            )}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8,3,0,0.72)" },

    hud: { position: "absolute", top: 54, left: 18, right: 18, flexDirection: "row", alignItems: "center", gap: 12 },
    hudText: { color: WHEAT, fontWeight: "900", fontSize: width * 0.048, backgroundColor: "rgba(139,69,19,0.7)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
    exitBtn: { marginLeft: "auto", backgroundColor: "rgba(192,57,43,0.9)", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
    exitBtnText: { color: "#fff", fontWeight: "900", fontSize: 17 },

    gameInner: { flex: 1, justifyContent: "center", paddingHorizontal: 16, paddingTop: 100, gap: 20 },
    targetBox: { backgroundColor: "rgba(255,228,181,0.15)", borderRadius: 20, padding: 20, alignItems: "center", borderWidth: 2, borderColor: GOLD },
    targetSub: { color: WHEAT, fontSize: width * 0.038, fontWeight: "600", marginBottom: 6, opacity: 0.7 },
    targetName: { color: GOLD, fontSize: width * 0.075, fontWeight: "900", letterSpacing: 1 },

    cardsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
    gameCard: { width: "48%", aspectRatio: 0.85, backgroundColor: WHEAT, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: AMBER, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
    cardIcon: { fontSize: width * 0.13, marginBottom: 8 },
    cardName: { fontSize: width * 0.038, fontWeight: "800", color: BROWN, textAlign: "center" },

    cardOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingVertical: 20 },
    card: { backgroundColor: WHEAT, borderRadius: 24, borderWidth: 3, borderColor: BROWN, padding: 18, width: "100%", maxWidth: 440, maxHeight: height * 0.88, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 14 },
    cardBigEmoji: { fontSize: width * 0.16, textAlign: "center", marginBottom: 4 },
    cardTitle: { fontSize: width * 0.055, fontWeight: "900", color: BROWN, textAlign: "center", marginBottom: 8 },
    cardDesc: { fontSize: width * 0.036, color: AMBER, textAlign: "center", lineHeight: width * 0.052, marginBottom: 16, fontWeight: "600" },
    startBtn: { backgroundColor: GOLD, borderRadius: 50, paddingVertical: 13, paddingHorizontal: 28, width: "100%", alignItems: "center", marginBottom: 10, borderWidth: 2, borderColor: AMBER },
    startBtnText: { color: BROWN, fontSize: width * 0.046, fontWeight: "900" },
    backBtn: { paddingVertical: 8, paddingHorizontal: 16 },
    backBtnText: { color: AMBER, fontSize: width * 0.036, fontWeight: "700" },

    resultBox: { flexDirection: "row", alignItems: "center", backgroundColor: WHEAT2, borderRadius: 16, borderWidth: 2, borderColor: AMBER, paddingHorizontal: 22, paddingVertical: 10, marginBottom: 10, gap: 10 },
    resultNum: { fontSize: width * 0.13, fontWeight: "900", color: AMBER, lineHeight: width * 0.14 },
    resultLabel: { fontSize: width * 0.038, color: BROWN, fontWeight: "700" },
    resultMsg: { fontSize: width * 0.035, color: AMBER, fontWeight: "700", textAlign: "center", marginBottom: 14 },

    myBestRow: { flexDirection: "row", width: "100%", backgroundColor: WHEAT2, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.3)", marginBottom: 14, overflow: "hidden" },
    myBestItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
    myBestVal: { fontSize: width * 0.062, fontWeight: "900", color: BROWN },
    myBestLabel: { fontSize: width * 0.028, color: AMBER, fontWeight: "700", marginTop: 2 },

    tabRow: { flexDirection: "row", width: "100%", backgroundColor: WHEAT2, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.25)", marginBottom: 10, overflow: "hidden" },
    tabBtn: { flex: 1, paddingVertical: 9, alignItems: "center" },
    tabBtnActive: { backgroundColor: AMBER },
    tabText: { fontSize: width * 0.03, fontWeight: "700", color: AMBER },
    tabTextActive: { color: "#fff" },

    lbList: { width: "100%", marginBottom: 14 },
    lbLoading: { color: AMBER, textAlign: "center", fontSize: width * 0.035, paddingVertical: 12 },
    lbEmpty: { color: AMBER, textAlign: "center", fontSize: width * 0.033, paddingVertical: 12, fontWeight: "600" },
    lbRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, marginBottom: 4, backgroundColor: WHEAT2, borderWidth: 1, borderColor: "rgba(139,69,19,0.15)", gap: 8 },
    lbRowMe: { backgroundColor: "#FFF8DC", borderColor: GOLD, borderWidth: 2 },
    lbRank: { width: 32, textAlign: "center", fontSize: width * 0.035, fontWeight: "900", color: BROWN },
    lbAvatar: { fontSize: width * 0.055 },
    lbName: { flex: 1, fontSize: width * 0.033, fontWeight: "700", color: BROWN },
    lbScore: { fontSize: width * 0.035, fontWeight: "900", color: AMBER },
});
