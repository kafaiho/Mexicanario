import { useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity as RNTouchableOpacity,
    View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConfettiBurst from "../components/ConfettiBurst";
import TouchableOpacity from "../components/HapticTouchable"; // vibración ligera al tocar
import HomeButton from "../components/HomeButton";
import MinigameScoreboard from "../components/MinigameScoreboard";
import { api } from "../../convex/_generated/api";
import {
    CHANCLA_LIVES,
    chanclaDodgeScore,
    chanclaLevel,
    isNewRecord,
    planChanclaTurn,
} from "../config/minigameLogic";
import { useAuth } from "../context/AuthContext";
import { comboBurst, nearMiss, notifyError, tapLight, tension } from "../services/haptics";
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

const S_MENU = "menu";
const S_PLAYING = "playing";
const S_OVER = "over";

// Fases de un turno
const P_CALM = "calm";
const P_WINDUP = "windup";
const P_FAKE = "fake";
const P_THROW = "throw";
const P_RESULT = "result";

const RESIST_POINTS = 5;   // aguantarte en un amago también suma
const RESULT_PAUSE = 650;
const HIT_PAUSE = 950;

const MOM_Y = height * 0.25;
const PLAYER_Y = height * 0.54;
const MOM_SIZE = Math.round(width * 0.26);
const PLAYER_SIZE = Math.round(width * 0.22);

// La que avienta la chancla cambia conforme subes de nivel
const MOMS = [
    { from: 1, icon: "👩🏽", name: "Tu jefa" },
    { from: 4, icon: "👵🏽", name: "La abuela" },
    { from: 7, icon: "👩🏽‍🦱", name: "La tía Chona" },
];

const WINDUP_PHRASES = ["¡Uno...!", "¡Ahorita vas a ver!", "¿Quieres que vaya para allá?", "¡Te lo advierto!", "¡Cuento hasta tres!", "¡A mí no me hables así!", "¿Otra vez tú?", "¡Ya te dije!"];
const FAKE_PHRASES = ["...dos y medio 😒", "¡Nomás porque hay visitas!", "¡Al rato en la casa!", "¡Me la vas a pagar!", "Ahorita no... pero ya verás", "¡Dos y tres cuartos!"];
const THROW_PHRASES = ["¡¡AHÍ TE VA!!", "¡Tómala!", "¡CHANCLAZO!", "¡Te lo dije!"];
const HIT_PHRASES = ["¡PAAAS! 💥", "¡En toda la nuca!", "¡Te cayó la chancla!", "¡Ay, amá!"];
const FALSE_PHRASES = ["¡Caíste en el amago!", "¡Te agachaste de más!", "¡Ni te la aventó!"];
const DODGE_PHRASES = ["¡Esquivada!", "¡Uf!", "¡Ni te tocó!", "¡Eres de hule!"];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const momForLevel = (level) => [...MOMS].reverse().find((m) => level >= m.from);
const fmt = (n) => n.toLocaleString("es-MX");

function scoreMsg(dodges) {
    if (dodges >= 40) return "¡Eres inalcanzable, ni la abuela te toca! 🥷";
    if (dodges >= 20) return "¡Reflejos de gato callejero! 🐈";
    if (dodges >= 10) return "¡Nada mal, ya casi no te pegan! 💪";
    return "¡Te comiste todos los chanclazos! 🩴";
}

export default function EsquivaChanclaScreen({ navigation }) {
    // BGM — minigame track
    useEffect(() => { playBGM("minigame"); return () => { stopBGM(); playBGM("menu"); }; }, []);

    const insets = useSafeAreaInsets();
    const reduceMotion = useReducedMotion();
    const { userId } = useAuth();

    const [gameState, setGameState] = useState(S_MENU);
    const [phase, setPhase] = useState(P_CALM);
    const [phrase, setPhrase] = useState(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(CHANCLA_LIVES);
    const [combo, setCombo] = useState(0);
    const [level, setLevel] = useState(1);
    const [golden, setGolden] = useState(false);
    const [hurt, setHurt] = useState(false);
    const [pop, setPop] = useState(null);         // { text, color, key }
    const [banner, setBanner] = useState(null);
    const [stats, setStats] = useState(null);     // resumen de la partida
    const [newRecord, setNewRecord] = useState(false);
    const [confettiKey, setConfettiKey] = useState(0);

    // Refs: el motor del juego corre con timers, no con renders
    const phaseRef = useRef(P_CALM);
    const livesRef = useRef(CHANCLA_LIVES);
    const scoreRef = useRef(0);
    const comboRef = useRef(0);
    const dodgesRef = useRef(0);
    const turnRef = useRef(null);
    const throwStartRef = useRef(0);
    const timersRef = useRef([]);
    const prevBestRef = useRef(null);
    const runStatsRef = useRef({ bestReaction: null, bestCombo: 0, fakesResisted: 0 });

    const chanclaAnim = useRef(new Animated.Value(0)).current; // 0 = en la mano, 1 = llegó a ti
    const wiggle = useRef(new Animated.Value(0)).current;
    const duck = useRef(new Animated.Value(0)).current;
    const shake = useRef(new Animated.Value(0)).current;
    const popAnim = useRef(new Animated.Value(0)).current;
    const wiggleLoop = useRef(null);
    const flightRef = useRef(null);

    const submitScore = useUserMutation(api.chancla.submitScore);
    const myBest = useQuery(api.chancla.getMyBest, userId ? { userId } : "skip");

    // ── Timers ─────────────────────────────────────────────────────────────
    const schedule = (ms, fn) => { timersRef.current.push(setTimeout(fn, ms)); };
    const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
    useEffect(() => () => {
        clearTimers();
        wiggleLoop.current?.stop();
        flightRef.current?.stop();
    }, []);

    // Las pestañas de juego no se desmontan: al salir se cancela la partida en curso
    useEffect(() => navigation.addListener("blur", () => {
        clearTimers();
        wiggleLoop.current?.stop();
        flightRef.current?.stop();
        setGameState((s) => (s === S_PLAYING ? S_MENU : s));
    }), [navigation]);

    const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

    const showPop = (text, color = GOLD) => {
        setPop({ text, color, key: Date.now() });
        popAnim.setValue(0);
        Animated.timing(popAnim, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    };

    const showBanner = (text, ms = 1400) => {
        setBanner(text);
        schedule(ms, () => setBanner(null));
    };

    const startWiggle = () => {
        if (reduceMotion) return;
        wiggle.setValue(0);
        wiggleLoop.current = Animated.loop(Animated.sequence([
            Animated.timing(wiggle, { toValue: 1, duration: 110, useNativeDriver: true }),
            Animated.timing(wiggle, { toValue: -1, duration: 110, useNativeDriver: true }),
        ]));
        wiggleLoop.current.start();
    };
    const stopWiggle = () => { wiggleLoop.current?.stop(); wiggle.setValue(0); };

    const shakeScreen = () => {
        if (reduceMotion) return;
        Animated.sequence([
            Animated.timing(shake, { toValue: 12, duration: 50, useNativeDriver: true }),
            Animated.timing(shake, { toValue: -12, duration: 50, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    // ── Turnos ─────────────────────────────────────────────────────────────
    const nextTurn = () => {
        const turn = planChanclaTurn(dodgesRef.current);
        turnRef.current = turn;
        setGolden(false);
        setHurt(false);
        setPhrase(null);
        chanclaAnim.setValue(0);
        duck.setValue(0);
        setPhaseBoth(P_CALM);

        schedule(turn.calm, () => {
            setPhaseBoth(P_WINDUP);
            setPhrase(pick(WINDUP_PHRASES));
            tension();
            startWiggle();
            schedule(turn.windup, () => (turn.isFake ? doFake() : doThrow(turn)));
        });
    };

    const doFake = () => {
        stopWiggle();
        setPhaseBoth(P_FAKE);
        setPhrase(pick(FAKE_PHRASES));
        schedule(700, () => {
            // Aguantarse también es un logro: suma y mantiene la racha
            runStatsRef.current.fakesResisted += 1;
            scoreRef.current += RESIST_POINTS;
            setScore(scoreRef.current);
            showPop(`+${RESIST_POINTS} 🧘 ¡Ni te moviste!`, WHEAT);
            schedule(350, nextTurn);
        });
    };

    const doThrow = (turn) => {
        stopWiggle();
        setGolden(turn.isGolden);
        setPhrase(turn.isGolden ? "✨ ¡CHANCLA DORADA! ✨" : pick(THROW_PHRASES));
        setPhaseBoth(P_THROW);
        throwStartRef.current = Date.now();
        flightRef.current = Animated.timing(chanclaAnim, {
            toValue: 1,
            duration: turn.window,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
        });
        flightRef.current.start();
        schedule(turn.window, () => loseLife(pick(HIT_PHRASES)));
    };

    const loseLife = (message) => {
        clearTimers();
        stopWiggle();
        flightRef.current?.stop();
        setPhaseBoth(P_RESULT);
        setHurt(true);
        setPhrase(message);
        comboRef.current = 0;
        setCombo(0);
        livesRef.current -= 1;
        setLives(livesRef.current);
        playSound("wrong");
        notifyError();
        shakeScreen();
        if (livesRef.current <= 0) schedule(HIT_PAUSE, finishGame);
        else schedule(HIT_PAUSE, nextTurn);
    };

    const dodge = () => {
        clearTimers();
        flightRef.current?.stop();
        setPhaseBoth(P_RESULT);

        const turn = turnRef.current;
        const reactionMs = Date.now() - throwStartRef.current;
        comboRef.current += 1;
        dodgesRef.current += 1;
        const { points, multiplier, fast, nearMiss: close } = chanclaDodgeScore({
            reactionMs, window: turn.window, combo: comboRef.current, golden: turn.isGolden,
        });
        scoreRef.current += points;
        setScore(scoreRef.current);
        setCombo(comboRef.current);

        const run = runStatsRef.current;
        run.bestCombo = Math.max(run.bestCombo, comboRef.current);
        run.bestReaction = run.bestReaction === null ? reactionMs : Math.min(run.bestReaction, reactionMs);

        // La chancla pasa de largo por arriba mientras te agachas
        Animated.parallel([
            Animated.timing(duck, { toValue: 1, duration: 90, useNativeDriver: true }),
            Animated.timing(chanclaAnim, { toValue: 1.4, duration: 220, useNativeDriver: true }),
        ]).start();

        if (turn.isGolden) { playSound("coin"); showPop(`+${points} ✨ ¡DORADA x3!`, GOLD); }
        else if (close) { nearMiss(); showPop(`+${points} 😱 ¡Por un pelito!`, "#FFB347"); }
        else if (fast) { playSound("correct"); showPop(`+${points} ⚡ ${reactionMs} ms ¡Reflejos de gato!`, GOLD); }
        else { playSound("correct"); showPop(`+${points} ${pick(DODGE_PHRASES)}`, WHEAT); }
        if (!turn.isGolden && !close) tapLight();

        if (comboRef.current % 5 === 0) {
            playSound("combo");
            comboBurst(comboRef.current);
            showBanner(`🔥 ¡Racha de ${comboRef.current}! Puntos x${multiplier}`);
        }
        const newLevel = chanclaLevel(dodgesRef.current);
        if (newLevel !== chanclaLevel(dodgesRef.current - 1)) {
            setLevel(newLevel);
            playSound("milestone");
            const mom = momForLevel(newLevel);
            const prevMom = momForLevel(newLevel - 1);
            showBanner(mom !== prevMom ? `😤 ¡Nivel ${newLevel}! Llegó ${mom.name.toLowerCase()}` : `😤 ¡Nivel ${newLevel}! Se está enojando más`, 1800);
        }
        schedule(RESULT_PAUSE, nextTurn);
    };

    // El botón responde al tocar (onPressIn): cada milisegundo cuenta
    const handleDuck = () => {
        if (gameState !== S_PLAYING) return;
        const p = phaseRef.current;
        if (p === P_THROW) dodge();
        else if (p === P_CALM || p === P_WINDUP || p === P_FAKE) {
            showPop("😒 Ni te la aventó", "#FF8A80");
            loseLife(pick(FALSE_PHRASES));
        }
    };

    const startGame = () => {
        clearTimers();
        prevBestRef.current = myBest ? myBest.allTime : null;
        livesRef.current = CHANCLA_LIVES;
        scoreRef.current = 0;
        comboRef.current = 0;
        dodgesRef.current = 0;
        runStatsRef.current = { bestReaction: null, bestCombo: 0, fakesResisted: 0 };
        setLives(CHANCLA_LIVES);
        setScore(0);
        setCombo(0);
        setLevel(1);
        setPop(null);
        setBanner(null);
        setStats(null);
        setNewRecord(false);
        setHurt(false);
        setGolden(false);
        setPhrase(null);
        setPhaseBoth(P_RESULT); // los toques no cuentan hasta que arranca el primer turno
        setGameState(S_PLAYING);
        showBanner("🩴 ¡Agáchate solo cuando la avienta!", 1600);
        schedule(600, nextTurn);
    };

    const finishGame = () => {
        clearTimers();
        const finalScore = scoreRef.current;
        const prev = prevBestRef.current;
        const record = prev !== null && isNewRecord(finalScore, prev);
        setNewRecord(record);
        setStats({ ...runStatsRef.current, dodges: dodgesRef.current, prevBest: prev });
        setGameState(S_OVER);
        if (record) { playSound("celebration"); setConfettiKey((k) => k + 1); }
        if (userId && finalScore > 0) submitScore({ userId, score: finalScore }).catch(() => { });
    };

    // ── Render ─────────────────────────────────────────────────────────────
    const mom = momForLevel(level);
    const multiplier = Math.min(5, 1 + Math.floor(combo / 5));
    const missingForRecord = stats && stats.prevBest !== null && !newRecord ? stats.prevBest - score : null;

    // Vuela hacia ti (0→1) y, si te agachaste, pasa de largo (1→1.4)
    const inFlight = phase === P_THROW || (phase === P_RESULT && !hurt);
    const chanclaStyle = inFlight
        ? {
            transform: [
                { translateX: chanclaAnim.interpolate({ inputRange: [0, 1, 1.4], outputRange: [MOM_SIZE * 0.35, 0, -width * 0.2] }) },
                { translateY: chanclaAnim.interpolate({ inputRange: [0, 1, 1.4], outputRange: [0, PLAYER_Y - MOM_Y - PLAYER_SIZE * 0.3, PLAYER_Y - MOM_Y + height * 0.25] }) },
                { rotate: chanclaAnim.interpolate({ inputRange: [0, 1.4], outputRange: ["0deg", "1260deg"] }) },
                { scale: chanclaAnim.interpolate({ inputRange: [0, 1, 1.4], outputRange: [0.7, 2.3, 2.6] }) },
            ],
            opacity: chanclaAnim.interpolate({ inputRange: [0, 1, 1.4], outputRange: [1, 1, 0] }),
        }
        : {
            // En la mano: levantada y temblando cuando amenaza
            transform: [
                { translateX: MOM_SIZE * 0.45 },
                { translateY: phase === P_WINDUP ? -MOM_SIZE * 0.45 : 0 },
                { rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ["-25deg", "25deg"] }) },
                { scale: phase === P_WINDUP ? 1.15 : 0.8 },
            ],
            opacity: phase === P_RESULT && hurt ? 0 : 1,
        };

    return (
        <ImageBackground source={require("../../assets/images/bg.webp")} style={styles.root} resizeMode="cover">
            <View style={[styles.darkOverlay, phase === P_WINDUP && gameState === S_PLAYING && styles.darkOverlayTense]} />

            {/* ── En juego ── */}
            {gameState === S_PLAYING && (
                <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateX: shake }] }]}>
                    <View style={[styles.hud, { top: insets.top + 10 }]}>
                        <Text style={styles.hudText}>⭐ {fmt(score)}</Text>
                        <Text style={styles.hudLives}>
                            {Array.from({ length: CHANCLA_LIVES }, (_, i) => (i < lives ? "❤️" : "🖤")).join("")}
                        </Text>
                        <RNTouchableOpacity style={styles.exitBtn} onPress={() => { clearTimers(); navigation.goBack(); }} accessibilityLabel="Salir del juego">
                            <Text style={styles.exitBtnText}>✕</Text>
                        </RNTouchableOpacity>
                    </View>
                    <View style={[styles.subHud, { top: insets.top + 56 }]}>
                        <Text style={styles.levelText}>Nivel {level} · {mom.name}</Text>
                        {combo >= 2 && <Text style={styles.comboText}>🔥 {combo} · x{multiplier}</Text>}
                    </View>

                    {/* La jefa y su globo de diálogo */}
                    {phrase && (
                        <View style={[styles.bubble, { top: MOM_Y - MOM_SIZE * 0.7 }, golden && styles.bubbleGolden, hurt && styles.bubbleHurt]}>
                            <Text style={[styles.bubbleText, hurt && { color: "#fff" }]}>{phrase}</Text>
                        </View>
                    )}
                    <View style={[styles.momWrap, { top: MOM_Y }]}>
                        <Text style={styles.mom}>{mom.icon}</Text>
                    </View>

                    {golden && phase === P_THROW && <View style={[styles.goldenGlow, { top: MOM_Y }]} />}
                    <Animated.Text style={[styles.chancla, { top: MOM_Y + MOM_SIZE * 0.2 }, chanclaStyle]}>🩴</Animated.Text>

                    {/* Tú */}
                    <Animated.View style={[styles.playerWrap, {
                        top: PLAYER_Y,
                        transform: [
                            { translateY: duck.interpolate({ inputRange: [0, 1], outputRange: [0, PLAYER_SIZE * 0.35] }) },
                            { scaleY: duck.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) },
                        ],
                    }]}>
                        <Text style={styles.player}>{hurt ? "😵" : phase === P_THROW ? "😨" : "🧒🏽"}</Text>
                        {hurt && <Text style={styles.impact}>💥</Text>}
                    </Animated.View>

                    {/* Texto flotante de puntos */}
                    {pop && (
                        <Animated.Text
                            key={pop.key}
                            pointerEvents="none"
                            style={[styles.pop, { color: pop.color, top: PLAYER_Y - 50 }, {
                                opacity: popAnim.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                                transform: [
                                    { translateY: popAnim.interpolate({ inputRange: [0, 1], outputRange: [10, -50] }) },
                                    { scale: popAnim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.6, 1.1, 1] }) },
                                ],
                            }]}
                        >
                            {pop.text}
                        </Animated.Text>
                    )}

                    {banner && (
                        <View style={[styles.banner, { top: PLAYER_Y - 110 }]} pointerEvents="none">
                            <Text style={styles.bannerText}>{banner}</Text>
                        </View>
                    )}

                    <RNTouchableOpacity
                        // La barra de pestañas ya cubre el área segura de abajo
                        style={[styles.duckBtn, phase === P_THROW && styles.duckBtnHot]}
                        onPressIn={handleDuck}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel="Agáchate"
                    >
                        <Text style={styles.duckBtnText}>🙇 ¡AGÁCHATE!</Text>
                    </RNTouchableOpacity>
                </Animated.View>
            )}

            {/* ── Menú ── */}
            {gameState === S_MENU && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 64 }]}>
                    <View style={styles.card}>
                        <Text style={styles.cardBigEmoji}>🩴</Text>
                        <Text style={styles.cardTitle}>¡Esquiva la Chancla!</Text>
                        <Text style={styles.cardDesc}>
                            Tu jefa trae la chancla en la mano. Agáchate <Text style={styles.bold}>solo</Text> cuando la avienta de verdad... ¡y no caigas en los amagos!
                        </Text>
                        <View style={styles.instructRow}>
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>🙇</Text>
                                <Text style={styles.instructText}>Agáchate{"\n"}a tiempo</Text>
                            </View>
                            <View style={styles.instructDivider} />
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>😒</Text>
                                <Text style={styles.instructText}>Aguanta{"\n"}los amagos</Text>
                            </View>
                            <View style={styles.instructDivider} />
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>❤️</Text>
                                <Text style={styles.instructText}>{CHANCLA_LIVES} vidas</Text>
                            </View>
                            <View style={styles.instructDivider} />
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>🏆</Text>
                                <Text style={styles.instructText}>Récord{"\n"}{myBest ? fmt(myBest.allTime) : "–"}</Text>
                            </View>
                        </View>
                        <Text style={styles.tipText}>✨ Si sale la chancla dorada, vale el triple</Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                            <Text style={styles.startBtnText}>¡Ya voy, amá!</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.backBtnText}>← Volver</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── Resultado + ranking ── */}
            {gameState === S_OVER && stats && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 64 }]}>
                    <View style={styles.card}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingBottom: 8 }}>
                            <Text style={styles.cardBigEmoji}>{newRecord ? "🏆" : "🩴"}</Text>
                            <Text style={[styles.cardTitle, !newRecord && { color: RED }]}>
                                {newRecord ? "¡Nuevo récord!" : "¡Te alcanzó la chancla!"}
                            </Text>

                            <View style={styles.resultBox}>
                                <Text style={styles.resultNum}>{fmt(score)}</Text>
                                <Text style={styles.resultLabel}>puntos ⭐</Text>
                            </View>
                            <Text style={styles.resultMsg}>{scoreMsg(stats.dodges)}</Text>

                            {missingForRecord !== null && missingForRecord > 0 && (
                                <View style={styles.almostBox}>
                                    <Text style={styles.almostText}>😤 Te faltaron {fmt(missingForRecord)} puntos para tu récord</Text>
                                </View>
                            )}

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}><Text style={styles.statVal}>{stats.dodges}</Text><Text style={styles.statLabel}>🙇 Esquives</Text></View>
                                <View style={styles.statItem}><Text style={styles.statVal}>{stats.bestReaction !== null ? `${stats.bestReaction}` : "–"}</Text><Text style={styles.statLabel}>⚡ Mejor ms</Text></View>
                                <View style={styles.statItem}><Text style={styles.statVal}>{stats.bestCombo}</Text><Text style={styles.statLabel}>🔥 Racha</Text></View>
                                <View style={styles.statItem}><Text style={styles.statVal}>{stats.fakesResisted}</Text><Text style={styles.statLabel}>🧘 Amagos</Text></View>
                            </View>

                            <MinigameScoreboard
                                game={api.chancla}
                                userId={userId}
                                myBest={myBest}
                                newRecord={newRecord}
                                formatScore={(n) => `⭐ ${fmt(n)}`}
                            />

                            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                                <Text style={styles.startBtnText}>{missingForRecord > 0 ? "¡Otra y lo rompo! 💪" : "¡Otra vez, órale!"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                                <Text style={styles.backBtnText}>← Volver</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                    <ConfettiBurst burstKey={confettiKey} style={{ left: width / 2, top: height * 0.3 }} count={28} emojis={["🩴", "⭐", "🎉"]} />
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
    darkOverlayTense: { backgroundColor: "rgba(40,0,0,0.8)" },

    hud: { position: "absolute", left: 18, right: 18, flexDirection: "row", alignItems: "center", gap: 10, zIndex: 10 },
    hudText: { color: WHEAT, fontWeight: "900", fontSize: width * 0.048, backgroundColor: "rgba(139,69,19,0.7)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, overflow: "hidden" },
    hudLives: { fontSize: width * 0.05, letterSpacing: 2 },
    exitBtn: { marginLeft: "auto", backgroundColor: "rgba(192,57,43,0.9)", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
    exitBtnText: { color: "#fff", fontWeight: "900", fontSize: 17 },
    subHud: { position: "absolute", left: 18, right: 18, flexDirection: "row", alignItems: "center", gap: 10 },
    levelText: { color: WHEAT, fontWeight: "700", fontSize: width * 0.034, opacity: 0.85 },
    comboText: { color: GOLD, fontWeight: "900", fontSize: width * 0.038 },

    bubble: { position: "absolute", alignSelf: "center", maxWidth: width * 0.8, backgroundColor: WHEAT, borderRadius: 18, borderWidth: 2, borderColor: BROWN, paddingHorizontal: 14, paddingVertical: 8 },
    bubbleGolden: { backgroundColor: GOLD, borderColor: AMBER },
    bubbleHurt: { backgroundColor: RED, borderColor: "#7B241C" },
    bubbleText: { color: BROWN, fontWeight: "900", fontSize: width * 0.042, textAlign: "center" },

    momWrap: { position: "absolute", alignSelf: "center", width: MOM_SIZE * 1.3, height: MOM_SIZE * 1.3, borderRadius: MOM_SIZE, backgroundColor: "rgba(255,228,181,0.12)", borderWidth: 2, borderColor: "rgba(255,228,181,0.25)", justifyContent: "center", alignItems: "center" },
    mom: { fontSize: MOM_SIZE * 0.9, lineHeight: MOM_SIZE * 1.1 },
    goldenGlow: { position: "absolute", alignSelf: "center", width: MOM_SIZE * 1.6, height: MOM_SIZE * 1.6, borderRadius: MOM_SIZE, backgroundColor: "rgba(248,190,23,0.25)" },
    chancla: { position: "absolute", alignSelf: "center", fontSize: width * 0.1 },

    playerWrap: { position: "absolute", alignSelf: "center", alignItems: "center" },
    player: { fontSize: PLAYER_SIZE, lineHeight: PLAYER_SIZE * 1.2 },
    impact: { position: "absolute", top: -PLAYER_SIZE * 0.25, fontSize: PLAYER_SIZE * 0.6 },

    pop: { position: "absolute", alignSelf: "center", fontWeight: "900", fontSize: width * 0.05, textAlign: "center", textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    banner: { position: "absolute", alignSelf: "center", backgroundColor: "rgba(139,69,19,0.92)", borderRadius: 16, borderWidth: 2, borderColor: GOLD, paddingHorizontal: 16, paddingVertical: 8, maxWidth: width * 0.9 },
    bannerText: { color: GOLD, fontWeight: "900", fontSize: width * 0.04, textAlign: "center" },

    duckBtn: { position: "absolute", left: 24, right: 24, bottom: 16, height: height * 0.11, borderRadius: 28, backgroundColor: AMBER, borderWidth: 3, borderColor: BROWN, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10 },
    duckBtnHot: { backgroundColor: RED, borderColor: GOLD },
    duckBtnText: { color: "#fff", fontWeight: "900", fontSize: width * 0.065, letterSpacing: 1, textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },

    cardOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingVertical: 20 },
    card: { backgroundColor: WHEAT, borderRadius: 24, borderWidth: 3, borderColor: BROWN, padding: 18, width: "100%", maxWidth: 440, maxHeight: height * 0.88, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 14 },
    cardBigEmoji: { fontSize: width * 0.16, textAlign: "center", marginBottom: 4 },
    cardTitle: { fontSize: width * 0.055, fontWeight: "900", color: BROWN, textAlign: "center", marginBottom: 8 },
    cardDesc: { fontSize: width * 0.036, color: AMBER, textAlign: "center", lineHeight: width * 0.052, marginBottom: 16, fontWeight: "600" },
    bold: { fontWeight: "900", color: BROWN },
    tipText: { fontSize: width * 0.032, color: BROWN, fontWeight: "700", textAlign: "center", marginBottom: 14 },

    instructRow: { flexDirection: "row", alignItems: "center", backgroundColor: WHEAT2, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.25)", paddingVertical: 12, paddingHorizontal: 6, marginBottom: 12, width: "100%" },
    instructItem: { flex: 1, alignItems: "center" },
    instructEmoji: { fontSize: width * 0.07, marginBottom: 4 },
    instructText: { fontSize: width * 0.026, color: BROWN, fontWeight: "700", textAlign: "center" },
    instructDivider: { width: 1, height: 40, backgroundColor: "rgba(139,69,19,0.2)" },

    startBtn: { backgroundColor: GOLD, borderRadius: 50, paddingVertical: 13, paddingHorizontal: 28, width: "100%", alignItems: "center", marginBottom: 10, borderWidth: 2, borderColor: AMBER },
    startBtnText: { color: BROWN, fontSize: width * 0.046, fontWeight: "900" },
    backBtn: { paddingVertical: 8, paddingHorizontal: 16, alignSelf: "center" },
    backBtnText: { color: AMBER, fontSize: width * 0.036, fontWeight: "700" },

    resultBox: { flexDirection: "row", alignItems: "center", backgroundColor: WHEAT2, borderRadius: 16, borderWidth: 2, borderColor: AMBER, paddingHorizontal: 22, paddingVertical: 10, marginBottom: 10, gap: 10 },
    resultNum: { fontSize: width * 0.11, fontWeight: "900", color: AMBER, lineHeight: width * 0.13 },
    resultLabel: { fontSize: width * 0.038, color: BROWN, fontWeight: "700" },
    resultMsg: { fontSize: width * 0.035, color: AMBER, fontWeight: "700", textAlign: "center", marginBottom: 12 },
    almostBox: { backgroundColor: "rgba(192,57,43,0.12)", borderRadius: 12, borderWidth: 1.5, borderColor: RED, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 },
    almostText: { color: RED, fontWeight: "800", fontSize: width * 0.033, textAlign: "center" },

    statsRow: { flexDirection: "row", width: "100%", backgroundColor: WHEAT2, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.3)", marginBottom: 14 },
    statItem: { flex: 1, alignItems: "center", paddingVertical: 8 },
    statVal: { fontSize: width * 0.05, fontWeight: "900", color: GREEN },
    statLabel: { fontSize: width * 0.025, color: AMBER, fontWeight: "700", marginTop: 2 },
});
