import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { playBGM, stopBGM } from "../utils/soundManager";

const { width, height } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";
const RED = "#C0392B";
const GREEN = "#27AE60";

// RECIPE es ahora dinámico, generado por taco
const BASE_TOPPINGS = ["Carne", "Salsa", "Limón"];
const ALL_INGREDIENTS = ["Carne", "Limón", "Tortilla", "Salsa"];

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const TABS = [
    { key: "daily", label: "🔥 Hoy" },
    { key: "weekly", label: "📅 Semana" },
    { key: "alltime", label: "🏆 Total" },
];

function scoreMsg(n) {
    if (n > 15) return "¡Eres el Rey del Trompo! 👑";
    if (n > 8) return "¡Nada mal, taquero nivel medio! 👍";
    return "¡Te corrieron de la taquería! 📉";
}

export default function TaqueroRushScreen({ navigation }) {
    // BGM — minigame track
    useEffect(() => { playBGM("minigame"); return () => { stopBGM(); playBGM("menu"); }; }, []);

    const insets = useSafeAreaInsets();
    const { userId } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [tab, setTab] = useState("daily");
    const [shuffledButtons, setShuffledButtons] = useState(() => shuffleArray(ALL_INGREDIENTS));
    const [currentRecipe, setCurrentRecipe] = useState(() => ["Tortilla", ...shuffleArray(BASE_TOPPINGS)]);
    const [tacoStack, setTacoStack] = useState([]);
    const tacoShake = React.useRef(new Animated.Value(0)).current;

    const submitScore = useMutation(api.taquero.submitScore);
    const leaderboard = useQuery(api.taquero.getLeaderboard, isGameOver ? { type: tab } : "skip");
    const myBest = useQuery(api.taquero.getMyBest, userId && isGameOver ? { userId } : "skip");

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

    const startGame = () => {
        setIsPlaying(true);
        setIsGameOver(false);
        setScore(0);
        setTimeLeft(30);
        setCurrentStep(0);
        setTacoStack([]);
        tacoShake.setValue(0);
        setCurrentRecipe(["Tortilla", ...shuffleArray(BASE_TOPPINGS)]);
        setShuffledButtons(shuffleArray(ALL_INGREDIENTS));
    };

    // Pre-allocate pool of Animated.Values to avoid creating new ones per tap
    const animPool = useRef(Array.from({ length: 20 }, () => new Animated.Value(0))).current;
    const animIdx = useRef(0);

    const handleIngredientTap = (ingredient) => {
        if (!isPlaying || isGameOver) return;
        if (ingredient === currentRecipe[currentStep]) {
            // Reuse Animated.Value from pool (no leak)
            const anim = animPool[animIdx.current % animPool.length];
            anim.setValue(0);
            animIdx.current++;

            const newIng = {
                id: Date.now().toString(),
                icon: getIngredientIcon(ingredient),
                rotate: `${Math.random() * 20 - 10}deg`,
                offsetX: Math.random() * 16 - 8,
                anim,
            };

            setTacoStack((prev) => [...prev, newIng]);

            Animated.spring(newIng.anim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();

            if (currentStep === currentRecipe.length - 1) {
                // Taco complete
                setCurrentStep(0);
                setTimeout(() => {
                    // Celebration bounce
                    Animated.sequence([
                        Animated.timing(tacoShake, { toValue: 1.2, duration: 100, useNativeDriver: true }),
                        Animated.timing(tacoShake, { toValue: 0, duration: 100, useNativeDriver: true })
                    ]).start(() => {
                        setScore((s) => s + 1);
                        setTacoStack([]);
                        setCurrentRecipe(["Tortilla", ...shuffleArray(BASE_TOPPINGS)]);
                        setShuffledButtons(shuffleArray(ALL_INGREDIENTS));
                    });
                }, 150);
            } else {
                setCurrentStep((s) => s + 1);
            }
        } else {
            // Regresar a 0 si falla (agitar y limpiar)
            Animated.sequence([
                Animated.timing(tacoShake, { toValue: -1, duration: 50, useNativeDriver: true }),
                Animated.timing(tacoShake, { toValue: 1, duration: 50, useNativeDriver: true }),
                Animated.timing(tacoShake, { toValue: 0, duration: 50, useNativeDriver: true })
            ]).start(() => {
                setCurrentStep(0);
                setTacoStack([]);
            });
        }
    };

    const getIngredientIcon = (ingredient) => {
        switch (ingredient) {
            case "Tortilla": return "🫓";
            case "Carne": return "🥩";
            case "Salsa": return "🌶️";
            case "Limón": return "🍋";
            default: return "";
        }
    };

    return (
        <ImageBackground source={require("../../assets/images/bg.webp")} style={styles.root} resizeMode="cover">
            <View style={styles.darkOverlay} />

            {/* ── Menú ── */}
            {!isPlaying && !isGameOver && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 20 }]}>
                    <View style={styles.card}>
                        <Text style={styles.cardBigEmoji}>🌮</Text>
                        <Text style={styles.cardTitle}>¡Taquero Rush!</Text>
                        <Text style={styles.cardDesc}>
                            Tienes 30 segundos. Sigue la receta en orden.
                        </Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                            <Text style={styles.startBtnText}>¡Ándale, Empezar!</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.backBtnText}>← Volver</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── En juego ── */}
            {isPlaying && (
                <View style={StyleSheet.absoluteFillObject}>
                    <View style={[styles.hud, { top: insets.top + 10 }]}>
                        <Text style={styles.hudText}>🌮 {score}</Text>
                        <Text style={[styles.hudText, timeLeft <= 5 && { color: RED }]}>⏱️ {timeLeft}s</Text>
                        <TouchableOpacity style={styles.exitBtn} onPress={() => { setIsPlaying(false); navigation.goBack(); }}>
                            <Text style={styles.exitBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.gameInner}>
                        <View style={styles.prepArea}>
                            <Text style={styles.prepTitle}>Preparando Taco...</Text>

                            <Animated.View style={[
                                styles.tacoStackArea,
                                {
                                    transform: [
                                        { scale: tacoShake.interpolate({ inputRange: [0, 1.2], outputRange: [1, 1.2], extrapolate: 'clamp' }) },
                                        { translateX: tacoShake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-10, 0, 10], extrapolate: 'clamp' }) }
                                    ]
                                }
                            ]}>
                                {tacoStack.length === 0 ? (
                                    <Text style={styles.emptyPlateText}>¡Echa la tortilla!</Text>
                                ) : (
                                    tacoStack.map((item, index) => (
                                        <Animated.Text
                                            key={item.id}
                                            style={[
                                                styles.tacoIngEmoji,
                                                { zIndex: index, bottom: index * 12 }, // apilar visualmente
                                                {
                                                    transform: [
                                                        { translateY: item.anim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) },
                                                        { translateX: item.offsetX },
                                                        { rotate: item.rotate },
                                                    ]
                                                }
                                            ]}
                                        >
                                            {item.icon}
                                        </Animated.Text>
                                    ))
                                )}
                            </Animated.View>
                            <View style={styles.progressDots}>
                                {currentRecipe.map((_, i) => (
                                    <View key={i} style={[styles.dot,
                                    currentStep > i ? styles.dotDone : currentStep === i ? styles.dotCurrent : null]} />
                                ))}
                            </View>
                            <Text style={styles.nextPrompt}>
                                Siguiente: {currentRecipe[currentStep]} {getIngredientIcon(currentRecipe[currentStep])}
                            </Text>
                        </View>

                        <View style={styles.grid}>
                            {shuffledButtons.map((ing, idx) => (
                                <TouchableOpacity key={idx} style={styles.ingBtn} onPress={() => handleIngredientTap(ing)}>
                                    <Text style={styles.ingIcon}>{getIngredientIcon(ing)}</Text>
                                    <Text style={styles.ingName}>{ing}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            {/* ── Game over + leaderboard ── */}
            {isGameOver && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 20 }]}>
                    <View style={styles.card}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingBottom: 8 }}>
                            <Text style={styles.cardBigEmoji}>👨‍🍳</Text>
                            <Text style={[styles.cardTitle, { color: AMBER }]}>¡Turno Terminado!</Text>

                            <View style={styles.resultBox}>
                                <Text style={styles.resultNum}>{score}</Text>
                                <Text style={styles.resultLabel}>{score === 1 ? "taco" : "tacos"} 🌮</Text>
                            </View>
                            <Text style={styles.resultMsg}>{scoreMsg(score)}</Text>

                            {/* Personal bests */}
                            {myBest && (
                                <View style={styles.myBestRow}>
                                    <View style={styles.myBestItem}><Text style={styles.myBestVal}>{myBest.daily}</Text><Text style={styles.myBestLabel}>🔥 Hoy</Text></View>
                                    <View style={styles.myBestItem}><Text style={styles.myBestVal}>{myBest.weekly}</Text><Text style={styles.myBestLabel}>📅 Semana</Text></View>
                                    <View style={styles.myBestItem}><Text style={styles.myBestVal}>{myBest.allTime}</Text><Text style={styles.myBestLabel}>🏆 Total</Text></View>
                                </View>
                            )}

                            {/* Tabs */}
                            <View style={styles.tabRow}>
                                {TABS.map((t) => (
                                    <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
                                        <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Leaderboard */}
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
                                            <Text style={styles.lbScore}>🌮 {entry.score}</Text>
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

    hud: {
        position: "absolute", left: 18, right: 18,
        flexDirection: "row", alignItems: "center", gap: 12,
    },
    hudText: { color: WHEAT, fontWeight: "900", fontSize: width * 0.048, backgroundColor: "rgba(139,69,19,0.7)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
    exitBtn: { marginLeft: "auto", backgroundColor: "rgba(192,57,43,0.9)", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
    exitBtnText: { color: "#fff", fontWeight: "900", fontSize: 17 },

    gameInner: { flex: 1, justifyContent: "center", paddingHorizontal: 20, paddingTop: 100 },
    prepArea: { backgroundColor: "rgba(255,228,181,0.15)", borderRadius: 20, padding: 20, alignItems: "center", marginBottom: 20, borderWidth: 1.5, borderColor: "rgba(210,105,30,0.4)" },
    prepTitle: { color: WHEAT, fontSize: width * 0.045, fontWeight: "700", marginBottom: 12 },
    tacoStackArea: { height: 100, justifyContent: "flex-end", alignItems: "center", marginBottom: 14, width: "100%" },
    emptyPlateText: { color: "rgba(255,228,181,0.5)", fontSize: width * 0.04, fontWeight: "bold", paddingBottom: 10 },
    tacoIngEmoji: { fontSize: width * 0.16, position: "absolute" },
    nextPrompt: { color: GOLD, fontSize: width * 0.055, fontWeight: "900" },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
    ingBtn: { width: "48%", backgroundColor: WHEAT, borderRadius: 20, padding: 20, alignItems: "center", borderWidth: 2, borderColor: AMBER },
    ingIcon: { fontSize: width * 0.1, marginBottom: 6 },
    ingName: { fontSize: width * 0.042, fontWeight: "800", color: BROWN },

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
