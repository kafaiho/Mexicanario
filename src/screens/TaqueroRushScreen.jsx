import { useQuery } from "convex/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import HomeButton from "../components/HomeButton";
import MinigameScoreboard from "../components/MinigameScoreboard";
import { api } from "../../convex/_generated/api";
import { isNewRecord, shuffle, taqueroPantry, taqueroRecipe, TAQUERO_UNLOCKS } from "../config/minigameLogic";
import { useAuth } from "../context/AuthContext";
import { notifyError, notifySuccess, tapLight } from "../services/haptics";
import { playBGM, playSound, stopBGM } from "../utils/soundManager";
import { useUserMutation } from "../hooks/useUserMutation";

const { width, height } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";
const RED = "#C0392B";
const GREEN = "#27AE60";

const GAME_SECONDS = 30;
const PERFECT_BONUS_MS = 1000; // taco sin errores = +1s

const S_MENU = "menu";
const S_PLAYING = "playing";
const S_OVER = "over";

const INGREDIENT_ICONS = {
    Tortilla: "🫓",
    Carne: "🥩",
    Salsa: "🌶️",
    Limón: "🍋",
    Cebolla: "🧅",
    Cilantro: "🌿",
    Piña: "🍍",
};

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
    const [gameState, setGameState] = useState(S_MENU);
    const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
    const [score, setScore] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [currentRecipe, setCurrentRecipe] = useState(() => taqueroRecipe(0));
    const [buttons, setButtons] = useState(() => shuffle(taqueroPantry(0)));
    const [tacoStack, setTacoStack] = useState([]);
    const [wrongIng, setWrongIng] = useState(null);
    const [unlockMsg, setUnlockMsg] = useState(null);
    const [newRecord, setNewRecord] = useState(false);

    const tacoShake = useRef(new Animated.Value(0)).current;
    const bonusAnim = useRef(new Animated.Value(0)).current;
    const scoreRef = useRef(0);
    const endTimeRef = useRef(0);
    const lockRef = useRef(false);        // bloquea taps mientras se sirve el taco
    const mistakeRef = useRef(false);     // ¿hubo error en el taco actual?
    const stackIdRef = useRef(0);
    const prevBestRef = useRef(null);
    const timeoutsRef = useRef([]);

    const submitScore = useUserMutation(api.taquero.submitScore);
    const myBest = useQuery(api.taquero.getMyBest, userId ? { userId } : "skip");

    const later = (ms, fn) => { timeoutsRef.current.push(setTimeout(fn, ms)); };
    useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

    // Reloj basado en hora de fin: permite sumar segundos de bono sin desfasarse
    useEffect(() => {
        if (gameState !== S_PLAYING) return;
        const timer = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining === 0) {
                clearInterval(timer);
                const finalScore = scoreRef.current;
                const prev = prevBestRef.current;
                setNewRecord(prev !== null && isNewRecord(finalScore, prev));
                setGameState(S_OVER);
                if (userId && finalScore > 0) submitScore({ userId, score: finalScore }).catch(() => { });
            }
        }, 200);
        return () => clearInterval(timer);
    }, [gameState]);

    const startGame = () => {
        tapLight();
        prevBestRef.current = myBest ? myBest.allTime : null;
        scoreRef.current = 0;
        endTimeRef.current = Date.now() + GAME_SECONDS * 1000;
        lockRef.current = false;
        mistakeRef.current = false;
        setScore(0);
        setTimeLeft(GAME_SECONDS);
        setCurrentStep(0);
        setTacoStack([]);
        setWrongIng(null);
        setUnlockMsg(null);
        setNewRecord(false);
        tacoShake.setValue(0);
        setCurrentRecipe(taqueroRecipe(0));
        setButtons(shuffle(taqueroPantry(0)));
        setGameState(S_PLAYING);
    };

    const serveTaco = () => {
        lockRef.current = true;
        const served = scoreRef.current + 1;
        scoreRef.current = served;
        setScore(served); // cuenta al instante, aunque el reloj llegue a cero durante la animación

        playSound("coin");
        notifySuccess();
        if (!mistakeRef.current) {
            endTimeRef.current += PERFECT_BONUS_MS;
            bonusAnim.setValue(0);
            Animated.timing(bonusAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
        }

        const unlock = TAQUERO_UNLOCKS.find((u) => u.at === served);
        if (unlock) {
            setUnlockMsg(`¡Nuevo ingrediente: ${INGREDIENT_ICONS[unlock.ingredient]} ${unlock.ingredient}!`);
            later(1600, () => setUnlockMsg(null));
        }

        Animated.sequence([
            Animated.timing(tacoShake, { toValue: 1.2, duration: 100, useNativeDriver: true }),
            Animated.timing(tacoShake, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start(() => {
            mistakeRef.current = false;
            setTacoStack([]);
            setCurrentStep(0);
            setCurrentRecipe(taqueroRecipe(served));
            setButtons(shuffle(taqueroPantry(served)));
            lockRef.current = false;
        });
    };

    const handleIngredientTap = useCallback((ingredient) => {
        if (gameState !== S_PLAYING || lockRef.current) return;
        if (ingredient === currentRecipe[currentStep]) {
            tapLight();
            const anim = new Animated.Value(0);
            stackIdRef.current += 1;
            setTacoStack((prev) => [...prev, {
                id: stackIdRef.current,
                icon: INGREDIENT_ICONS[ingredient],
                rotate: `${Math.random() * 20 - 10}deg`,
                offsetX: Math.random() * 16 - 8,
                anim,
            }]);
            Animated.spring(anim, { toValue: 1, friction: 5, useNativeDriver: true }).start();

            if (currentStep === currentRecipe.length - 1) serveTaco();
            else setCurrentStep((s) => s + 1);
        } else {
            // Error: se tira el taco y se empieza de nuevo
            lockRef.current = true;
            mistakeRef.current = true;
            playSound("wrong");
            notifyError();
            setWrongIng(ingredient);
            Animated.sequence([
                Animated.timing(tacoShake, { toValue: -1, duration: 50, useNativeDriver: true }),
                Animated.timing(tacoShake, { toValue: 1, duration: 50, useNativeDriver: true }),
                Animated.timing(tacoShake, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start(() => {
                setCurrentStep(0);
                setTacoStack([]);
                setWrongIng(null);
                lockRef.current = false;
            });
        }
    }, [gameState, currentRecipe, currentStep]);

    const threeCols = buttons.length > 4;

    return (
        <ImageBackground source={require("../../assets/images/bg.webp")} style={styles.root} resizeMode="cover">
            <View style={styles.darkOverlay} />

            {/* ── Menú ── */}
            {gameState === S_MENU && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 64 }]}>
                    <View style={styles.card}>
                        <Text style={styles.cardBigEmoji}>🌮</Text>
                        <Text style={styles.cardTitle}>¡Taquero Rush!</Text>
                        <Text style={styles.cardDesc}>
                            Arma los tacos siguiendo la receta en orden. Mientras más sirves, más ingredientes aparecen.
                        </Text>
                        <View style={styles.instructRow}>
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>⏱️</Text>
                                <Text style={styles.instructText}>{GAME_SECONDS} segundos</Text>
                            </View>
                            <View style={styles.instructDivider} />
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>✨</Text>
                                <Text style={styles.instructText}>Sin errores{"\n"}+1s</Text>
                            </View>
                            <View style={styles.instructDivider} />
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>🏆</Text>
                                <Text style={styles.instructText}>Récord{"\n"}{myBest ? myBest.allTime : "–"}</Text>
                            </View>
                        </View>
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
            {gameState === S_PLAYING && (
                <View style={StyleSheet.absoluteFillObject}>
                    <View style={[styles.hud, { top: insets.top + 10 }]}>
                        <Text style={styles.hudText}>🌮 {score}</Text>
                        <View>
                            <Text style={[styles.hudText, timeLeft <= 5 && styles.hudTextDanger]}>⏱️ {timeLeft}s</Text>
                            <Animated.Text
                                pointerEvents="none"
                                style={[styles.bonusText, {
                                    opacity: bonusAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                                    transform: [{ translateY: bonusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 28] }) }],
                                }]}
                            >
                                +1s ✨
                            </Animated.Text>
                        </View>
                        <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()} accessibilityLabel="Salir del juego">
                            <Text style={styles.exitBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.gameInner}>
                        <View style={styles.prepArea}>
                            <Text style={styles.prepTitle}>{unlockMsg || "Preparando taco..."}</Text>

                            <Animated.View style={[
                                styles.tacoStackArea,
                                {
                                    transform: [
                                        { scale: tacoShake.interpolate({ inputRange: [0, 1.2], outputRange: [1, 1.2], extrapolate: "clamp" }) },
                                        { translateX: tacoShake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-10, 0, 10], extrapolate: "clamp" }) },
                                    ],
                                },
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
                                                    ],
                                                },
                                            ]}
                                        >
                                            {item.icon}
                                        </Animated.Text>
                                    ))
                                )}
                            </Animated.View>

                            {/* Receta completa: lo hecho, lo que sigue y lo que falta */}
                            <View style={styles.recipeRow}>
                                {currentRecipe.map((ing, i) => (
                                    <View
                                        key={`${ing}-${i}`}
                                        style={[
                                            styles.recipeStep,
                                            currentStep > i && styles.recipeStepDone,
                                            currentStep === i && styles.recipeStepCurrent,
                                        ]}
                                    >
                                        <Text style={styles.recipeIcon}>{currentStep > i ? "✓" : INGREDIENT_ICONS[ing]}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={styles.nextPrompt}>
                                Siguiente: {currentRecipe[currentStep]} {INGREDIENT_ICONS[currentRecipe[currentStep]]}
                            </Text>
                        </View>

                        <View style={styles.grid}>
                            {buttons.map((ing) => (
                                <TouchableOpacity
                                    key={ing}
                                    style={[
                                        styles.ingBtn,
                                        threeCols && styles.ingBtnSmall,
                                        wrongIng === ing && styles.ingBtnWrong,
                                    ]}
                                    onPressIn={() => handleIngredientTap(ing)}
                                    activeOpacity={0.7}
                                    accessibilityLabel={ing}
                                >
                                    <Text style={[styles.ingIcon, threeCols && styles.ingIconSmall]}>{INGREDIENT_ICONS[ing]}</Text>
                                    <Text style={[styles.ingName, threeCols && styles.ingNameSmall]}>{ing}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            {/* ── Game over + leaderboard ── */}
            {gameState === S_OVER && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 64 }]}>
                    <View style={styles.card}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingBottom: 8 }}>
                            <Text style={styles.cardBigEmoji}>👨‍🍳</Text>
                            <Text style={[styles.cardTitle, { color: AMBER }]}>¡Turno Terminado!</Text>

                            <View style={styles.resultBox}>
                                <Text style={styles.resultNum}>{score}</Text>
                                <Text style={styles.resultLabel}>{score === 1 ? "taco" : "tacos"} 🌮</Text>
                            </View>
                            <Text style={styles.resultMsg}>{scoreMsg(score)}</Text>

                            <MinigameScoreboard
                                game={api.taquero}
                                userId={userId}
                                myBest={myBest}
                                newRecord={newRecord}
                                formatScore={(n) => `🌮 ${n}`}
                            />

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
            {/* Casita para volver al inicio, solo fuera de una partida */}
            {gameState !== S_PLAYING && <HomeButton floating />}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8,3,0,0.72)" },

    hud: {
        position: "absolute", left: 18, right: 18, zIndex: 10,
        flexDirection: "row", alignItems: "center", gap: 12,
    },
    hudText: { color: WHEAT, fontWeight: "900", fontSize: width * 0.048, backgroundColor: "rgba(139,69,19,0.7)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, overflow: "hidden" },
    hudTextDanger: { backgroundColor: "rgba(192,57,43,0.85)" },
    bonusText: { position: "absolute", top: "100%", alignSelf: "center", color: GOLD, fontWeight: "900", fontSize: width * 0.04 },
    exitBtn: { marginLeft: "auto", backgroundColor: "rgba(192,57,43,0.9)", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
    exitBtnText: { color: "#fff", fontWeight: "900", fontSize: 17 },

    gameInner: { flex: 1, justifyContent: "center", paddingHorizontal: 20, paddingTop: 100 },
    prepArea: { backgroundColor: "rgba(255,228,181,0.15)", borderRadius: 20, padding: 20, alignItems: "center", marginBottom: 20, borderWidth: 1.5, borderColor: "rgba(210,105,30,0.4)" },
    prepTitle: { color: WHEAT, fontSize: width * 0.045, fontWeight: "700", marginBottom: 12, textAlign: "center" },
    tacoStackArea: { height: 100, justifyContent: "flex-end", alignItems: "center", marginBottom: 14, width: "100%" },
    emptyPlateText: { color: "rgba(255,228,181,0.5)", fontSize: width * 0.04, fontWeight: "bold", paddingBottom: 10 },
    tacoIngEmoji: { fontSize: width * 0.16, position: "absolute" },

    recipeRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
    recipeStep: { width: width * 0.1, height: width * 0.1, borderRadius: width * 0.05, backgroundColor: "rgba(255,228,181,0.12)", borderWidth: 1.5, borderColor: "rgba(255,228,181,0.3)", justifyContent: "center", alignItems: "center" },
    recipeStepDone: { backgroundColor: GREEN, borderColor: GREEN },
    recipeStepCurrent: { backgroundColor: "rgba(248,190,23,0.3)", borderColor: GOLD, borderWidth: 2.5, transform: [{ scale: 1.12 }] },
    recipeIcon: { fontSize: width * 0.05, color: "#fff", fontWeight: "900" },

    nextPrompt: { color: GOLD, fontSize: width * 0.055, fontWeight: "900" },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
    ingBtn: { width: "46%", backgroundColor: WHEAT, borderRadius: 20, padding: 20, alignItems: "center", borderWidth: 2, borderColor: AMBER },
    ingBtnSmall: { width: "30%", padding: 12, borderRadius: 16 },
    ingBtnWrong: { backgroundColor: "#F5B7B1", borderColor: RED },
    ingIcon: { fontSize: width * 0.1, marginBottom: 6 },
    ingIconSmall: { fontSize: width * 0.08, marginBottom: 4 },
    ingName: { fontSize: width * 0.042, fontWeight: "800", color: BROWN },
    ingNameSmall: { fontSize: width * 0.034 },

    cardOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingVertical: 20 },
    card: { backgroundColor: WHEAT, borderRadius: 24, borderWidth: 3, borderColor: BROWN, padding: 18, width: "100%", maxWidth: 440, maxHeight: height * 0.88, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 14 },
    cardBigEmoji: { fontSize: width * 0.16, textAlign: "center", marginBottom: 4 },
    cardTitle: { fontSize: width * 0.055, fontWeight: "900", color: BROWN, textAlign: "center", marginBottom: 8 },
    cardDesc: { fontSize: width * 0.036, color: AMBER, textAlign: "center", lineHeight: width * 0.052, marginBottom: 16, fontWeight: "600" },

    instructRow: { flexDirection: "row", alignItems: "center", backgroundColor: WHEAT2, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.25)", paddingVertical: 12, paddingHorizontal: 8, marginBottom: 18, width: "100%" },
    instructItem: { flex: 1, alignItems: "center" },
    instructEmoji: { fontSize: width * 0.075, marginBottom: 4 },
    instructText: { fontSize: width * 0.028, color: BROWN, fontWeight: "700", textAlign: "center" },
    instructDivider: { width: 1, height: 40, backgroundColor: "rgba(139,69,19,0.2)" },

    startBtn: { backgroundColor: GOLD, borderRadius: 50, paddingVertical: 13, paddingHorizontal: 28, width: "100%", alignItems: "center", marginBottom: 10, borderWidth: 2, borderColor: AMBER },
    startBtnText: { color: BROWN, fontSize: width * 0.046, fontWeight: "900" },
    backBtn: { paddingVertical: 8, paddingHorizontal: 16, alignSelf: "center" },
    backBtnText: { color: AMBER, fontSize: width * 0.036, fontWeight: "700" },

    resultBox: { flexDirection: "row", alignItems: "center", backgroundColor: WHEAT2, borderRadius: 16, borderWidth: 2, borderColor: AMBER, paddingHorizontal: 22, paddingVertical: 10, marginBottom: 10, gap: 10 },
    resultNum: { fontSize: width * 0.13, fontWeight: "900", color: AMBER, lineHeight: width * 0.14 },
    resultLabel: { fontSize: width * 0.038, color: BROWN, fontWeight: "700" },
    resultMsg: { fontSize: width * 0.035, color: AMBER, fontWeight: "700", textAlign: "center", marginBottom: 14 },
});
