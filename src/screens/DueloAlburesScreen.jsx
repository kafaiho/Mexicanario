import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
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

const ALL_QUESTIONS = [
    { question: "Si alguien te dice 'No sacudan la cuna...', la respuesta clásica es:", options: ["Que despiertan al niño", "Que se cae el bebé", "Que me mareo", "Que se rompe"], answer: 0, explanation: "Clásico albur: 'No sacudan la cuna, que despiertan al niño'." },
    { question: "Completa la frase: 'Huele a traste...'", options: ["Lavado", "Viejo", "Sucio", "Que no has lavado"], answer: 3, explanation: "'Huele a traste... que no has lavado' (trasteque / trasero)." },
    { question: "Si te dicen 'Préstame a tu hermana...', tú respondes:", options: ["No tengo hermana", "Préstame la tuya", "Mejor te presto otra cosa", "Respeta por favor"], answer: 1, explanation: "El contra albur básico es devolverla." },
    { question: "¿Qué fruta es la más alburera?", options: ["El plátano", "El mamey", "La papaya", "El chile"], answer: 2, explanation: "La papaya es LA fruta alburera por excelencia en México, tan directa que en Cuba la llaman 'fruta bomba' para evitarla." },
    { question: "Si te gritan '¡Aguas!', significa:", options: ["Que te van a mojar", "Que tienes sed", "¡Cuidado!", "Va a llover"], answer: 2, explanation: "Grito tradicional para advertir peligro o que estés atento." },
    { question: "¿Qué significa 'estar en el quinto patio'?", options: ["Estar muy lejos", "Estar en el patio trasero", "Estar de fiesta", "Estar escondido"], answer: 0, explanation: "Estar en el quinto patio = estar muy lejos o en un lugar lejísimos." },
    { question: "¿Qué quiere decir 'me cae el veinte'?", options: ["Caerse una moneda", "Entender algo de repente", "Recibir un billete", "Perder algo valioso"], answer: 1, explanation: "Viene de las cabinas telefónicas antiguas donde la llamada conectaba al caer el veinte." },
    { question: "Si alguien dice '¡No hay pedo!', quiere decir:", options: ["Hay mal olor", "No hay problema", "No hay nadie", "No hay dinero"], answer: 1, explanation: "Es la expresión mexicana clásica para decir que todo está bien, sin problema." },
    { question: "¿Qué significa 'echar un ojo'?", options: ["Tirar un ojo", "Vigilar o revisar algo", "Guiñar el ojo", "Llorar"], answer: 1, explanation: "Echar un ojo = dar una revisada rápida o vigilar." },
    { question: "¿Qué quiere decir 'traer al perro muerto'?", options: ["Tener mala suerte", "Deber dinero", "Estar muy cansado", "Traer malas noticias"], answer: 1, explanation: "Traer al perro muerto = llegar sin pagar o deber dinero a alguien." },
    { question: "Cuando dicen 'se armó el mitote', significa:", options: ["Hubo un baile", "Se formó un escándalo o pleito", "Llegó mucha gente", "Se cocinó comida"], answer: 1, explanation: "Mitote viene del náhuatl y significa alboroto, escándalo o desorden." },
    { question: "¿Qué significa 'estar de a cuatro'?", options: ["Estar en cuatro patas", "Estar muy borracho", "Estar en apuros", "Estar en el suelo"], answer: 0, explanation: "Estar de a cuatro = estar en cuatro patas, apoyado en manos y rodillas. El favorito del albur mexicano." },
    { question: "¿Qué quiere decir 'ponerse trucha'?", options: ["Oler a pescado", "Ponerse alerta", "Nadar rápido", "Enojarse"], answer: 1, explanation: "Ponerse trucha = estar listo y atento, no dormirse." },
    { question: "Si te dicen '¡Qué gacho!', significa:", options: ["¡Qué bonito!", "¡Qué cosa tan mala!", "¡Qué gracioso!", "¡Qué raro!"], answer: 1, explanation: "Gacho = algo feo, malo o decepcionante. '¡Qué gacho te hicieron!' es queja clásica." },
    { question: "¿Qué es un 'chisme de molcajete'?", options: ["Algo que se guarda mucho", "Un rumor muy sabroso y jugoso", "Una receta antigua", "Un secreto familiar"], answer: 1, explanation: "Chisme de molcajete = chisme bien condimentado, jugoso y que se muele bien entre vecinas." },
    { question: "¿Qué significa 'andar de nalgas'?", options: ["Caerse seguido", "Tener mala suerte o estar mal", "Caminar chistoso", "Estar en el suelo"], answer: 1, explanation: "Andar de nalgas = tener muy mala suerte o estar pasándola muy mal." },
    { question: "¿Qué quiere decir 'echar carrilla'?", options: ["Lanzar una carretilla", "Burlarse o hacerle broma a alguien", "Correr muy rápido", "Trabajar duro"], answer: 1, explanation: "Echar carrilla = hacerle burla o bromas pesadas a alguien, norma en cuates." },
    { question: "¿Qué significa 'estar pedo'?", options: ["Oler mal", "Estar borracho", "Estar dormido", "Estar de mal humor"], answer: 1, explanation: "Estar pedo = estar ebrio. De uso muy extendido en el habla coloquial mexicana." },
    { question: "¿Qué quiere decir 'a huevo'?", options: ["Con mucha mayonesa", "Obligatorio o con fuerza", "De forma equivocada", "Con mucha hambre"], answer: 1, explanation: "A huevo = obligatoriamente, sin opciones, o para afirmar con énfasis total." },
    { question: "¿Qué significa 'traer la canica'?", options: ["Jugar canicas", "Estar loco o chiflado", "Traer algo redondo", "Estar en problemas"], answer: 1, explanation: "Traer la canica = estar loco o tener ideas alocadas. También 'se le fue la canica'." },
];

const QUESTIONS_PER_GAME = 5;

function pickRandomQuestions() {
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, QUESTIONS_PER_GAME);
}

const TABS = [
    { key: "daily", label: "🔥 Hoy" },
    { key: "weekly", label: "📅 Semana" },
    { key: "alltime", label: "🏆 Total" },
];

function scoreMsg(n, total) {
    if (n === total) return "¡Eres el maestro del albur! 🌮";
    if (n > total / 2) return "¡Ah, medio te defiendes! 🌶️";
    return "Te falta barrio, compa. 🌵";
}

export default function DueloAlburesScreen({ navigation }) {
    const { userId } = useAuth();
    const [questions, setQuestions] = useState(() => pickRandomQuestions());
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [lastAnswer, setLastAnswer] = useState(null); // null | "correct" | "wrong"
    const [tab, setTab] = useState("daily");

    const submitScore = useMutation(api.albures.submitScore);
    const leaderboard = useQuery(api.albures.getLeaderboard, showResult ? { type: tab } : "skip");
    const myBest = useQuery(api.albures.getMyBest, userId && showResult ? { userId } : "skip");

    const handleAnswer = (selectedIndex) => {
        const correct = selectedIndex === questions[currentQuestion].answer;
        const newScore = correct ? score + 1 : score;
        setLastAnswer(correct ? "correct" : "wrong");

        setTimeout(() => {
            setLastAnswer(null);
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
                setScore(newScore);
            } else {
                setScore(newScore);
                setShowResult(true);
                if (userId && newScore > 0) submitScore({ userId, score: newScore }).catch(() => { });
            }
        }, 600);
    };

    const restartGame = () => {
        setQuestions(pickRandomQuestions());
        setCurrentQuestion(0);
        setScore(0);
        setShowResult(false);
        setLastAnswer(null);
    };

    return (
        <ImageBackground source={require("../../assets/images/bg.png")} style={styles.root} resizeMode="cover">
            <View style={styles.darkOverlay} />

            {/* ── Quiz en progreso ── */}
            {!showResult && (
                <View style={styles.cardOverlay}>
                    <View style={styles.card}>
                        <View style={styles.questionHeader}>
                            <Text style={styles.questionProgress}>Pregunta {currentQuestion + 1} de {questions.length}</Text>
                            <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>✅ {score}</Text></View>
                            <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
                                <Text style={styles.exitBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.questionText}>{questions[currentQuestion].question}</Text>

                        <View style={styles.optionsContainer}>
                            {questions[currentQuestion].options.map((option, index) => {
                                let bg = GOLD;
                                let border = AMBER;
                                if (lastAnswer && index === questions[currentQuestion].answer) { bg = GREEN; border = GREEN; }
                                else if (lastAnswer === "wrong" && index !== questions[currentQuestion].answer) { bg = WHEAT2; border = "rgba(139,69,19,0.2)"; }
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.optionButton, { backgroundColor: bg, borderColor: border }]}
                                        onPress={() => handleAnswer(index)}
                                        disabled={!!lastAnswer}
                                    >
                                        <Text style={styles.optionText}>{option}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {lastAnswer && (
                            <Text style={[styles.explanationText, { color: lastAnswer === "correct" ? GREEN : RED }]}>
                                {lastAnswer === "correct" ? "✅ " : "❌ "}{questions[currentQuestion].explanation}
                            </Text>
                        )}

                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.backBtnText}>← Volver</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── Resultado + leaderboard ── */}
            {showResult && (
                <View style={styles.cardOverlay}>
                    <View style={styles.card}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingBottom: 8 }}>
                            <Text style={styles.cardBigEmoji}>💬</Text>
                            <Text style={styles.cardTitle}>¡Duelo Terminado!</Text>

                            <View style={styles.resultBox}>
                                <Text style={styles.resultNum}>{score}</Text>
                                <Text style={styles.resultLabel}>de {questions.length} ✅</Text>
                            </View>
                            <Text style={styles.resultMsg}>{scoreMsg(score, questions.length)}</Text>

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
                                            <Text style={styles.lbScore}>{entry.score}/{QUESTIONS_PER_GAME} ✅</Text>
                                        </View>
                                    );
                                })}
                            </View>

                            <TouchableOpacity style={styles.startBtn} onPress={restartGame}>
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

    cardOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingVertical: 20 },
    card: { backgroundColor: WHEAT, borderRadius: 24, borderWidth: 3, borderColor: BROWN, padding: 18, width: "100%", maxWidth: 440, maxHeight: height * 0.88, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 14 },
    cardBigEmoji: { fontSize: width * 0.16, textAlign: "center", marginBottom: 4 },
    cardTitle: { fontSize: width * 0.055, fontWeight: "900", color: BROWN, textAlign: "center", marginBottom: 8 },

    questionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8 },
    questionProgress: { flex: 1, fontSize: width * 0.035, color: AMBER, fontWeight: "700" },
    scoreBadge: { backgroundColor: "rgba(39,174,96,0.15)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: GREEN },
    scoreBadgeText: { fontSize: width * 0.033, fontWeight: "800", color: GREEN },
    exitBtn: { backgroundColor: "rgba(192,57,43,0.9)", width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
    exitBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },

    questionText: { fontSize: width * 0.05, fontWeight: "800", color: BROWN, textAlign: "center", marginBottom: 18, lineHeight: width * 0.065 },
    optionsContainer: { width: "100%", gap: 10 },
    optionButton: { paddingVertical: height * 0.018, paddingHorizontal: width * 0.04, borderRadius: 14, borderWidth: 2, alignItems: "center" },
    optionText: { fontSize: width * 0.042, color: BROWN, fontWeight: "800", textAlign: "center" },
    explanationText: { fontSize: width * 0.033, fontWeight: "700", textAlign: "center", marginTop: 12, lineHeight: width * 0.048 },

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
