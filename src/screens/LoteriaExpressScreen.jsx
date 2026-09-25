import { useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import TouchableOpacity from "../components/HapticTouchable"; // vibración ligera al tocar
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeButton from "../components/HomeButton";
import MinigameScoreboard from "../components/MinigameScoreboard";
import { api } from "../../convex/_generated/api";
import {
    isNewRecord,
    LOTERIA_VERSE_FROM,
    loteriaCallsVerse,
    loteriaStreakBonus,
    pickLoteriaRound,
} from "../config/minigameLogic";
import { useAuth } from "../context/AuthContext";
import { useScreenDims } from "../hooks/useScreenDims";
import { notifyError, notifySuccess } from "../services/haptics";
import { playBGM, playSound, stopBGM } from "../utils/soundManager";
import { TABLET_MODE } from "../utils/tabletSetup";
import { useUserMutation } from "../hooks/useUserMutation";

const { width } = Dimensions.get("window");

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";
const RED = "#C0392B";
const GREEN = "#27AE60";

// Cap font multiplier for tablet — use width but clamp the base
const W = TABLET_MODE ? Math.min(width, 420) : width;

const GAME_SECONDS = 30;
const WRONG_PENALTY_MS = 2000;
const CORRECT_PAUSE_MS = 350;
const WRONG_PAUSE_MS = 700; // más largo: para que veas cuál era la buena

// Baraja tradicional con el verso que canta el gritón
const LOTERIA_CARDS = [
    { id: 1, name: "El Gallo", icon: "🐓", verse: "El que le cantó a San Pedro no le volverá a cantar" },
    { id: 2, name: "El Diablito", icon: "😈", verse: "Pórtate bien cuatito, si no te lleva el coloradito" },
    { id: 3, name: "La Dama", icon: "👸", verse: "Puliendo el paso, por toda la calle real" },
    { id: 4, name: "El Catrín", icon: "🎩", verse: "Don Ferruco en la alameda, su bastón quería tirar" },
    { id: 5, name: "El Paraguas", icon: "☂️", verse: "Para el sol y para el agua" },
    { id: 6, name: "La Sirena", icon: "🧜‍♀️", verse: "Con los cantos de sirena, no te vayas a marear" },
    { id: 7, name: "La Escalera", icon: "🪜", verse: "Súbeme paso a pasito, no quieras pegar brinquitos" },
    { id: 8, name: "La Botella", icon: "🍾", verse: "La herramienta del borracho" },
    { id: 9, name: "El Barril", icon: "🛢️", verse: "Tanto bebió el albañil, que quedó como barril" },
    { id: 10, name: "El Árbol", icon: "🌳", verse: "El que a buen árbol se arrima, buena sombra le cobija" },
    { id: 11, name: "El Melón", icon: "🍈", verse: "Me lo das o me lo quitas" },
    { id: 12, name: "El Valiente", icon: "🗡️", verse: "¿Por qué le corres cobarde, trayendo tan buen puñal?" },
    { id: 13, name: "El Gorrito", icon: "🧢", verse: "Ponle su gorrito al nene, no se nos vaya a resfriar" },
    { id: 14, name: "La Muerte", icon: "💀", verse: "La muerte tilica y flaca" },
    { id: 15, name: "La Pera", icon: "🍐", verse: "El que espera, desespera" },
    { id: 16, name: "La Bandera", icon: "🇲🇽", verse: "Verde, blanco y colorado, la bandera del soldado" },
    { id: 17, name: "El Bandolón", icon: "🎸", verse: "Tocando su bandolón, está el mariachi Simón" },
    { id: 18, name: "El Violoncello", icon: "🎻", verse: "Creciendo se fue hasta el cielo, y como no fue violín, tuvo que ser violoncello" },
    { id: 19, name: "La Garza", icon: "🦢", verse: "Al otro lado del río tengo mi banco de arena, donde se sienta mi chata pico de garza morena" },
    { id: 20, name: "El Pájaro", icon: "🦜", verse: "Tú me traes a puros brincos, como pájaro en la rama" },
    { id: 21, name: "La Mano", icon: "✋", verse: "La mano de un criminal" },
    { id: 22, name: "La Bota", icon: "👢", verse: "Una bota igual que la otra" },
    { id: 23, name: "La Luna", icon: "🌙", verse: "El farol de los enamorados" },
    { id: 24, name: "El Cotorro", icon: "🦚", verse: "Cotorro cotorro, saca la pata, y empiézame a platicar" },
    { id: 25, name: "El Borracho", icon: "🍻", verse: "¡Ah, qué borracho tan necio, ya no lo puedo aguantar!" },
    { id: 26, name: "El Negrito", icon: "🎭", verse: "El que se comió el azúcar" },
    { id: 27, name: "El Corazón", icon: "❤️", verse: "No me extrañes corazón, que regreso en el camión" },
    { id: 28, name: "La Sandía", icon: "🍉", verse: "La barriga que Juan tenía, era empacho de sandía" },
    { id: 29, name: "El Tambor", icon: "🥁", verse: "No te arrugues, cuero viejo, que te quiero pa' tambor" },
    { id: 30, name: "El Camarón", icon: "🦐", verse: "Camarón que se duerme, se lo lleva la corriente" },
    { id: 31, name: "Las Jaras", icon: "🏹", verse: "Las jaras del indio Adán, donde pegan, dan" },
    { id: 32, name: "El Músico", icon: "🎺", verse: "El músico trompas de hule, ya no me quiere tocar" },
    { id: 33, name: "La Araña", icon: "🕷️", verse: "Atarántamela a palos, no me la dejes llegar" },
    { id: 34, name: "El Soldado", icon: "💂", verse: "Uno, dos y tres, el soldado p'al cuartel" },
    { id: 35, name: "La Estrella", icon: "⭐", verse: "La guía de los marineros" },
    { id: 36, name: "El Cazo", icon: "🫕", verse: "El caso que te hago es poco" },
    { id: 37, name: "El Mundo", icon: "🌎", verse: "Este mundo es una bola, y nosotros un bolón" },
    { id: 38, name: "El Apache", icon: "🪶", verse: "¡Ah, Chihuahua! Cuánto apache con pantalón y huarache" },
    { id: 39, name: "El Nopal", icon: "🌵", verse: "Al nopal lo van a ver, nomás cuando tiene tunas" },
    { id: 40, name: "El Alacrán", icon: "🦂", verse: "El que con la cola pica, le dan una paliza" },
    { id: 41, name: "La Rosa", icon: "🌹", verse: "Rosita, Rosaura, ven que te quiero ahora" },
    { id: 42, name: "La Calavera", icon: "🩻", verse: "Al pasar por el panteón, me encontré un calaverón" },
    { id: 43, name: "La Campana", icon: "🔔", verse: "Tú con la campana y yo con tu hermana" },
    { id: 44, name: "El Cantarito", icon: "🏺", verse: "Tanto va el cántaro al agua, que se quiebra y te moja las enaguas" },
    { id: 45, name: "El Venado", icon: "🦌", verse: "Saltando va buscando, pero no ve nada" },
    { id: 46, name: "El Sol", icon: "☀️", verse: "La cobija de los pobres" },
    { id: 47, name: "La Corona", icon: "👑", verse: "El sombrero de los reyes" },
    { id: 48, name: "La Chalupa", icon: "⛵", verse: "Rema que rema Lupita, sentada en su chalupita" },
    { id: 49, name: "El Pino", icon: "🌲", verse: "Fresco y oloroso, en todo tiempo hermoso" },
    { id: 50, name: "El Pescado", icon: "🐟", verse: "El que por la boca muere, aunque mudo fuera" },
    { id: 51, name: "La Palma", icon: "🌴", verse: "Palmero, sube a la palma y bájame un coco real" },
    { id: 52, name: "La Maceta", icon: "🪴", verse: "El que nace pa' maceta, no sale del corredor" },
    { id: 53, name: "El Arpa", icon: "🪕", verse: "Arpa vieja de mi suegra, ya no sirves pa' tocar" },
    { id: 54, name: "La Rana", icon: "🐸", verse: "Al ver a la verde rana, qué susto pegó tu hermana" },
];

const S_MENU = "menu";
const S_PLAYING = "playing";
const S_OVER = "over";

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
    const [gameState, setGameState] = useState(S_MENU);
    const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [round, setRound] = useState(null);       // { target, options }
    const [feedback, setFeedback] = useState(null); // { kind: "correct" | "wrong", pickedId }
    const [bonusMsg, setBonusMsg] = useState(null);
    const [newRecord, setNewRecord] = useState(false);

    const scoreRef = useRef(0);
    const endTimeRef = useRef(0);
    const prevBestRef = useRef(null);
    const timeoutsRef = useRef([]);

    // Detect landscape on tablet using shared hook (updates on rotation)
    const screenDims = useScreenDims();
    const isLandscape = TABLET_MODE && screenDims.width > screenDims.height;

    const submitScore = useUserMutation(api.loteria.submitScore);
    const myBest = useQuery(api.loteria.getMyBest, userId ? { userId } : "skip");

    const later = (ms, fn) => { timeoutsRef.current.push(setTimeout(fn, ms)); };
    useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

    // Reloj basado en hora de fin: bonos y castigos solo mueven endTimeRef
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
        prevBestRef.current = myBest ? myBest.allTime : null;
        scoreRef.current = 0;
        endTimeRef.current = Date.now() + GAME_SECONDS * 1000;
        setScore(0);
        setStreak(0);
        setTimeLeft(GAME_SECONDS);
        setFeedback(null);
        setBonusMsg(null);
        setNewRecord(false);
        setRound(pickLoteriaRound(LOTERIA_CARDS, null));
        setGameState(S_PLAYING);
    };

    const handleTap = (cardId) => {
        if (gameState !== S_PLAYING || feedback || !round) return;
        const previousId = round.target.id;
        const correct = cardId === previousId;
        if (correct) {
            scoreRef.current += 1;
            setScore(scoreRef.current);
            const newStreak = streak + 1;
            setStreak(newStreak);
            const bonus = loteriaStreakBonus(newStreak);
            if (bonus > 0) {
                endTimeRef.current += bonus * 1000;
                setBonusMsg(`🔥 Racha de ${newStreak}: +${bonus}s`);
                later(1200, () => setBonusMsg(null));
                playSound("combo");
            } else {
                playSound("correct");
            }
            if (scoreRef.current === LOTERIA_VERSE_FROM) {
                setBonusMsg("🎤 ¡Ahora el gritón canta el verso!");
                later(1600, () => setBonusMsg(null));
            }
            notifySuccess();
        } else {
            endTimeRef.current -= WRONG_PENALTY_MS;
            setStreak(0);
            playSound("wrong");
            notifyError();
        }
        setFeedback({ kind: correct ? "correct" : "wrong", pickedId: cardId });
        later(correct ? CORRECT_PAUSE_MS : WRONG_PAUSE_MS, () => {
            setFeedback(null);
            setRound(pickLoteriaRound(LOTERIA_CARDS, previousId));
        });
    };

    // ── Dynamic card sizing ──
    const cardMaxW = isLandscape ? 160 : undefined;
    const iconSize = isLandscape ? 48 : W * 0.13;
    const cardNameSize = isLandscape ? 14 : W * 0.038;
    const callsVerse = loteriaCallsVerse(score) && !feedback;

    return (
        <ImageBackground source={require("../../assets/images/bg.webp")} style={styles.root} resizeMode="cover">
            <View style={styles.darkOverlay} />

            {feedback && (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: feedback.kind === "correct" ? "rgba(39,174,96,0.25)" : "rgba(192,57,43,0.25)", zIndex: 50 }]} pointerEvents="none" />
            )}

            {/* ── Menú ── */}
            {gameState === S_MENU && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 64 }]}>
                    <View style={[styles.card, isLandscape && styles.cardLandscape]}>
                        <Text style={styles.cardBigEmoji}>🃏</Text>
                        <Text style={styles.cardTitle}>¡Lotería Exprés!</Text>
                        <Text style={styles.cardDesc}>
                            Encuentra la carta cantada lo más rápido posible.{"\n"}
                            Con {LOTERIA_VERSE_FROM} cartas el gritón empieza a cantar solo el verso. ¿Te los sabes?
                        </Text>
                        <View style={styles.instructRow}>
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>❌</Text>
                                <Text style={styles.instructText}>Error{"\n"}−2s</Text>
                            </View>
                            <View style={styles.instructDivider} />
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>🔥</Text>
                                <Text style={styles.instructText}>Racha de 5{"\n"}+2s</Text>
                            </View>
                            <View style={styles.instructDivider} />
                            <View style={styles.instructItem}>
                                <Text style={styles.instructEmoji}>🏆</Text>
                                <Text style={styles.instructText}>Récord{"\n"}{myBest ? myBest.allTime : "–"}</Text>
                            </View>
                        </View>
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
            {gameState === S_PLAYING && round && (
                <View style={StyleSheet.absoluteFillObject}>
                    <View style={[styles.hud, { top: insets.top + 10 }]}>
                        <Text style={styles.hudText}>🃏 {score}</Text>
                        <Text style={[styles.hudText, timeLeft <= 5 && styles.hudTextDanger]}>⏱️ {timeLeft}s</Text>
                        {streak >= 2 && <Text style={styles.hudText}>🔥 {streak}</Text>}
                        <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()} accessibilityLabel="Salir del juego">
                            <Text style={styles.exitBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[
                        styles.gameInner,
                        isLandscape && styles.gameInnerLandscape,
                    ]}>
                        <View style={[styles.targetBox, isLandscape && styles.targetBoxLandscape]}>
                            <Text style={[styles.targetSub, isLandscape && { fontSize: 14 }]}>
                                {bonusMsg || "¡Corre y se va con...!"}
                            </Text>
                            {callsVerse ? (
                                <Text style={[styles.targetVerse, isLandscape && styles.targetVerseLandscape]}>
                                    “{round.target.verse}”
                                </Text>
                            ) : (
                                <Text style={[styles.targetName, isLandscape && styles.targetNameLandscape]}>
                                    {round.target.name.toUpperCase()}
                                </Text>
                            )}
                        </View>

                        <View style={[
                            styles.cardsGrid,
                            isLandscape && styles.cardsGridLandscape,
                        ]}>
                            {round.options.map((card) => {
                                const showRight = feedback && card.id === round.target.id;
                                const showWrong = feedback?.kind === "wrong" && card.id === feedback.pickedId;
                                return (
                                    // onPressIn: la carta responde al tocar, sin esperar a soltar
                                    <TouchableOpacity
                                        key={card.id}
                                        style={[
                                            styles.gameCard,
                                            isLandscape && { width: cardMaxW, aspectRatio: 0.9 },
                                            showRight && styles.gameCardRight,
                                            showWrong && styles.gameCardWrong,
                                        ]}
                                        onPressIn={() => handleTap(card.id)}
                                        activeOpacity={0.8}
                                        accessibilityRole="button"
                                        accessibilityLabel={card.name}
                                    >
                                        <Text style={[styles.cardIcon, { fontSize: iconSize }]}>{card.icon}</Text>
                                        <Text style={[styles.cardName, { fontSize: cardNameSize }]}>{card.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            )}

            {/* ── Game over + leaderboard ── */}
            {gameState === S_OVER && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 64 }]}>
                    <View style={[styles.card, isLandscape && styles.cardLandscape]}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingBottom: 8 }}>
                            <Text style={[styles.cardBigEmoji, isLandscape && { fontSize: 48 }]}>🎉</Text>
                            <Text style={styles.cardTitle}>¡Lotería!</Text>

                            <View style={styles.resultBox}>
                                <Text style={styles.resultNum}>{score}</Text>
                                <Text style={styles.resultLabel}>cartas 🃏</Text>
                            </View>
                            <Text style={styles.resultMsg}>{scoreMsg(score)}</Text>

                            <MinigameScoreboard
                                game={api.loteria}
                                userId={userId}
                                myBest={myBest}
                                newRecord={newRecord}
                                formatScore={(n) => `🃏 ${n}`}
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

    hud: { position: "absolute", left: 18, right: 18, flexDirection: "row", alignItems: "center", gap: 10, zIndex: 10 },
    hudText: { color: WHEAT, fontWeight: "900", fontSize: W * 0.048, backgroundColor: "rgba(139,69,19,0.7)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, overflow: "hidden" },
    hudTextDanger: { backgroundColor: "rgba(192,57,43,0.85)" },
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
    targetBox: { backgroundColor: "rgba(255,228,181,0.15)", borderRadius: 20, padding: 20, alignItems: "center", borderWidth: 2, borderColor: GOLD, minHeight: W * 0.3, justifyContent: "center" },
    targetBoxLandscape: {
        width: "30%",
        padding: 16,
    },
    targetSub: { color: WHEAT, fontSize: W * 0.038, fontWeight: "600", marginBottom: 6, opacity: 0.85, textAlign: "center" },
    targetName: { color: GOLD, fontSize: W * 0.075, fontWeight: "900", letterSpacing: 1, textAlign: "center" },
    targetNameLandscape: { fontSize: 28 },
    targetVerse: { color: GOLD, fontSize: W * 0.046, fontWeight: "800", fontStyle: "italic", textAlign: "center", lineHeight: W * 0.062 },
    targetVerseLandscape: { fontSize: 18, lineHeight: 24 },

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
    gameCardRight: { backgroundColor: "#ABEBC6", borderColor: GREEN, borderWidth: 4 },
    gameCardWrong: { backgroundColor: "#F5B7B1", borderColor: RED, borderWidth: 4 },
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

    instructRow: { flexDirection: "row", alignItems: "center", backgroundColor: WHEAT2, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(139,69,19,0.25)", paddingVertical: 12, paddingHorizontal: 8, marginBottom: 18, width: "100%" },
    instructItem: { flex: 1, alignItems: "center" },
    instructEmoji: { fontSize: W * 0.075, marginBottom: 4 },
    instructText: { fontSize: W * 0.028, color: BROWN, fontWeight: "700", textAlign: "center" },
    instructDivider: { width: 1, height: 40, backgroundColor: "rgba(139,69,19,0.2)" },

    startBtn: { backgroundColor: GOLD, borderRadius: 50, paddingVertical: 13, paddingHorizontal: 28, width: "100%", alignItems: "center", marginBottom: 10, borderWidth: 2, borderColor: AMBER },
    startBtnText: { color: BROWN, fontSize: W * 0.046, fontWeight: "900" },
    backBtn: { paddingVertical: 8, paddingHorizontal: 16, alignSelf: "center" },
    backBtnText: { color: AMBER, fontSize: W * 0.036, fontWeight: "700" },

    resultBox: { flexDirection: "row", alignItems: "center", backgroundColor: WHEAT2, borderRadius: 16, borderWidth: 2, borderColor: AMBER, paddingHorizontal: 22, paddingVertical: 10, marginBottom: 10, gap: 10 },
    resultNum: { fontSize: W * 0.13, fontWeight: "900", color: AMBER, lineHeight: W * 0.14 },
    resultLabel: { fontSize: W * 0.038, color: BROWN, fontWeight: "700" },
    resultMsg: { fontSize: W * 0.035, color: AMBER, fontWeight: "700", textAlign: "center", marginBottom: 14 },
});
