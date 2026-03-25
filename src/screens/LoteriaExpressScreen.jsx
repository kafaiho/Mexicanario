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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { useScreenDims } from "../hooks/useScreenDims";
import { playBGM, stopBGM } from "../utils/soundManager";
import { TABLET_MODE } from "../utils/tabletSetup";

const { width } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";
const RED = "#C0392B";
const GREEN = "#27AE60";
const PURPLE = "#8E44AD";

// Cap font multiplier for tablet — use width but clamp the base
const W = TABLET_MODE ? Math.min(width, 420) : width;

const LOTERIA_CARDS = [
    { id: 1, name: "El Gallo", icon: "🐓" },
    { id: 2, name: "El Diablito", icon: "😈" },
    { id: 3, name: "La Dama", icon: "👸" },
    { id: 4, name: "El Catrín", icon: "🎩" },
    { id: 5, name: "El Paraguas", icon: "☂️" },
    { id: 6, name: "La Sirena", icon: "🧜‍♀️" },
    { id: 7, name: "La Escalera", icon: "🪜" },
    { id: 8, name: "La Botella", icon: "🍾" },
    { id: 9, name: "El Barril", icon: "🪣" },
    { id: 10, name: "El Árbol", icon: "🌳" },
    { id: 11, name: "El Melón", icon: "🍈" },
    { id: 12, name: "El Valiente", icon: "🗡️" },
    { id: 13, name: "El Gorrito", icon: "🧢" },
    { id: 14, name: "La Muerte", icon: "💀" },
    { id: 15, name: "La Pera", icon: "🍐" },
    { id: 16, name: "La Bandera", icon: "🇲🇽" },
    { id: 17, name: "El Bandolón", icon: "🎸" },
    { id: 18, name: "El Violoncello", icon: "🎻" },
    { id: 19, name: "La Garza", icon: "🦢" },
    { id: 20, name: "El Pájaro", icon: "🦜" },
    { id: 21, name: "La Mano", icon: "✋" },
    { id: 22, name: "La Bota", icon: "👢" },
    { id: 23, name: "La Luna", icon: "🌙" },
    { id: 24, name: "El Cotorro", icon: "🦚" },
    { id: 25, name: "El Borracho", icon: "🍻" },
    { id: 26, name: "El Negrito", icon: "🎭" },
    { id: 27, name: "El Corazón", icon: "❤️" },
    { id: 28, name: "La Sandía", icon: "🍉" },
    { id: 29, name: "El Tambor", icon: "🥁" },
    { id: 30, name: "El Camarón", icon: "🦐" },
    { id: 31, name: "Las Jaras", icon: "🏹" },
    { id: 32, name: "El Músico", icon: "🎺" },
    { id: 33, name: "La Araña", icon: "🕷️" },
    { id: 34, name: "El Soldado", icon: "💂" },
    { id: 35, name: "La Estrella", icon: "⭐" },
    { id: 36, name: "El Cazo", icon: "🫕" },
    { id: 37, name: "El Mundo", icon: "🌎" },
    { id: 38, name: "El Apache", icon: "🪶" },
    { id: 39, name: "El Nopal", icon: "🌵" },
    { id: 40, name: "El Alacrán", icon: "🦂" },
    { id: 41, name: "La Rosa", icon: "🌹" },
    { id: 42, name: "La Calavera", icon: "🩻" },
    { id: 43, name: "La Campana", icon: "🔔" },
    { id: 44, name: "El Cantarito", icon: "🏺" },
    { id: 45, name: "El Venado", icon: "🦌" },
    { id: 46, name: "El Sol", icon: "☀️" },
    { id: 47, name: "La Corona", icon: "👑" },
    { id: 48, name: "La Chalupa", icon: "⛵" },
    { id: 49, name: "El Pino", icon: "🌲" },
    { id: 50, name: "El Pescado", icon: "🐟" },
    { id: 51, name: "La Palma", icon: "🌴" },
    { id: 52, name: "La Maceta", icon: "🪴" },
    { id: 53, name: "El Arpa", icon: "🪗" },
    { id: 54, name: "La Rana", icon: "🐸" },
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
    // BGM — minigame track
    useEffect(() => { playBGM("minigame"); return () => { stopBGM(); playBGM("menu"); }; }, []);

    const insets = useSafeAreaInsets();
    const { userId } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [targetCard, setTargetCard] = useState(null);
    const [options, setOptions] = useState([]);
    const [flash, setFlash] = useState(null);
    const [tab, setTab] = useState("daily");

    // Detect landscape on tablet using shared hook (updates on rotation)
    const screenDims = useScreenDims();
    const isLandscape = TABLET_MODE && screenDims.width > screenDims.height;

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

    // ── Dynamic card sizing ──
    const cardMaxW = isLandscape ? 160 : undefined;
    const iconSize = isLandscape ? 48 : W * 0.13;
    const cardNameSize = isLandscape ? 14 : W * 0.038;

    return (
        <ImageBackground source={require("../../assets/images/bg.webp")} style={styles.root} resizeMode="cover">
            <View style={styles.darkOverlay} />

            {flash && (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: flash === "correct" ? "rgba(39,174,96,0.25)" : "rgba(192,57,43,0.25)", zIndex: 50 }]} pointerEvents="none" />
            )}

            {/* ── Menú ── */}
            {!isPlaying && !isGameOver && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 20 }]}>
                    <View style={[styles.card, isLandscape && styles.cardLandscape]}>
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
                    <View style={[styles.hud, { top: insets.top + 10 }]}>
                        <Text style={styles.hudText}>🃏 {score}</Text>
                        <Text style={[styles.hudText, timeLeft <= 5 && { backgroundColor: "rgba(192,57,43,0.85)" }]}>⏱️ {timeLeft}s</Text>
                        <TouchableOpacity style={styles.exitBtn} onPress={() => { setIsPlaying(false); navigation.goBack(); }}>
                            <Text style={styles.exitBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[
                        styles.gameInner,
                        isLandscape && styles.gameInnerLandscape,
                    ]}>
                        <View style={[styles.targetBox, isLandscape && styles.targetBoxLandscape]}>
                            <Text style={[styles.targetSub, isLandscape && { fontSize: 14 }]}>¡Corre y se va con...!</Text>
                            <Text style={[styles.targetName, isLandscape && styles.targetNameLandscape]}>{targetCard.name.toUpperCase()}</Text>
                        </View>

                        <View style={[
                            styles.cardsGrid,
                            isLandscape && styles.cardsGridLandscape,
                        ]}>
                            {options.map((card, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.gameCard,
                                        isLandscape && { width: cardMaxW, aspectRatio: 0.9 },
                                    ]}
                                    onPress={() => handleTap(card.id)}
                                >
                                    <Text style={[styles.cardIcon, { fontSize: iconSize }]}>{card.icon}</Text>
                                    <Text style={[styles.cardName, { fontSize: cardNameSize }]}>{card.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            {/* ── Game over + leaderboard ── */}
            {isGameOver && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 20 }]}>
                    <View style={[styles.card, isLandscape && styles.cardLandscape]}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingBottom: 8 }}>
                            <Text style={[styles.cardBigEmoji, isLandscape && { fontSize: 48 }]}>🎉</Text>
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

    hud: { position: "absolute", left: 18, right: 18, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 10 },
    hudText: { color: WHEAT, fontWeight: "900", fontSize: W * 0.048, backgroundColor: "rgba(139,69,19,0.7)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
    exitBtn: { marginLeft: "auto", backgroundColor: "rgba(192,57,43,0.9)", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
    exitBtnText: { color: "#fff", fontWeight: "900", fontSize: 17 },

    // ── Game area ──
    gameInner: { flex: 1, justifyContent: "center", paddingHorizontal: 16, paddingTop: 100, gap: 20 },
    gameInnerLandscape: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 70,
        paddingHorizontal: 40,
        gap: 30,
    },
    targetBox: { backgroundColor: "rgba(255,228,181,0.15)", borderRadius: 20, padding: 20, alignItems: "center", borderWidth: 2, borderColor: GOLD },
    targetBoxLandscape: {
        width: '30%',
        padding: 16,
    },
    targetSub: { color: WHEAT, fontSize: W * 0.038, fontWeight: "600", marginBottom: 6, opacity: 0.7 },
    targetName: { color: GOLD, fontSize: W * 0.075, fontWeight: "900", letterSpacing: 1 },
    targetNameLandscape: { fontSize: 28 },

    cardsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
    cardsGridLandscape: {
        flex: 1,
        flexWrap: "nowrap",
        justifyContent: "center",
        gap: 14,
    },
    gameCard: {
        width: "48%",
        aspectRatio: 0.85,
        backgroundColor: WHEAT,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: AMBER,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    cardIcon: { fontSize: W * 0.13, marginBottom: 8 },
    cardName: { fontSize: W * 0.038, fontWeight: "800", color: BROWN, textAlign: "center" },

    // ── Overlays (menu, game over) ──
    cardOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingVertical: 20, zIndex: 20 },
    card: {
        backgroundColor: WHEAT,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: BROWN,
        padding: 18,
        width: "100%",
        maxWidth: 440,
        maxHeight: "88%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 14,
    },
    cardLandscape: {
        maxWidth: 480,
        maxHeight: "94%",
    },
    cardBigEmoji: { fontSize: W * 0.16, textAlign: "center", marginBottom: 4 },
    cardTitle: { fontSize: W * 0.055, fontWeight: "900", color: BROWN, textAlign: "center", marginBottom: 8 },
    cardDesc: { fontSize: W * 0.036, color: AMBER, textAlign: "center", lineHeight: W * 0.052, marginBottom: 16, fontWeight: "600" },
    startBtn: { backgroundColor: GOLD, borderRadius: 50, paddingVertical: 13, paddingHorizontal: 28, width: "100%", alignItems: "center", marginBottom: 10, borderWidth: 2, borderColor: AMBER },
    startBtnText: { color: BROWN, fontSize: W * 0.046, fontWeight: "900" },
    backBtn: { paddingVertical: 8, paddingHorizontal: 16 },
    backBtnText: { color: AMBER, fontSize: W * 0.036, fontWeight: "700" },

    resultBox: { flexDirection: "row", alignItems: "center", backgroundColor: WHEAT2, borderRadius: 16, borderWidth: 2, borderColor: AMBER, paddingHorizontal: 22, paddingVertical: 10, marginBottom: 10, gap: 10 },
    resultNum: { fontSize: W * 0.13, fontWeight: "900", color: AMBER, lineHeight: W * 0.14 },
    resultLabel: { fontSize: W * 0.038, color: BROWN, fontWeight: "700" },
    resultMsg: { fontSize: W * 0.035, color: AMBER, fontWeight: "700", textAlign: "center", marginBottom: 14 },

    myBestRow: { flexDirection: "row", width: "100%", backgroundColor: WHEAT2, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.3)", marginBottom: 14, overflow: "hidden" },
    myBestItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
    myBestVal: { fontSize: W * 0.062, fontWeight: "900", color: BROWN },
    myBestLabel: { fontSize: W * 0.028, color: AMBER, fontWeight: "700", marginTop: 2 },

    tabRow: { flexDirection: "row", width: "100%", backgroundColor: WHEAT2, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.25)", marginBottom: 10, overflow: "hidden" },
    tabBtn: { flex: 1, paddingVertical: 9, alignItems: "center" },
    tabBtnActive: { backgroundColor: AMBER },
    tabText: { fontSize: W * 0.03, fontWeight: "700", color: AMBER },
    tabTextActive: { color: "#fff" },

    lbList: { width: "100%", marginBottom: 14 },
    lbLoading: { color: AMBER, textAlign: "center", fontSize: W * 0.035, paddingVertical: 12 },
    lbEmpty: { color: AMBER, textAlign: "center", fontSize: W * 0.033, paddingVertical: 12, fontWeight: "600" },
    lbRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, marginBottom: 4, backgroundColor: WHEAT2, borderWidth: 1, borderColor: "rgba(139,69,19,0.15)", gap: 8 },
    lbRowMe: { backgroundColor: "#FFF8DC", borderColor: GOLD, borderWidth: 2 },
    lbRank: { width: 32, textAlign: "center", fontSize: W * 0.035, fontWeight: "900", color: BROWN },
    lbAvatar: { fontSize: W * 0.055 },
    lbName: { flex: 1, fontSize: W * 0.033, fontWeight: "700", color: BROWN },
    lbScore: { fontSize: W * 0.035, fontWeight: "900", color: AMBER },
});
