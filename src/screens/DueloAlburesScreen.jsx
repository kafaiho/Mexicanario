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
import { playBGM, stopBGM } from "../utils/soundManager";
import { useUserMutation } from "../hooks/useUserMutation";

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
    // ── Expansión: 40 preguntas adicionales ──────────────────────────────────
    { question: "¿Qué significa 'hacerse pato'?", options: ["Nadar en un lago", "Hacerse el desentendido", "Caminar raro", "Tener hambre"], answer: 1, explanation: "Hacerse pato = fingir que no sabe o no entiende para evadir responsabilidad." },
    { question: "¿Qué quiere decir 'dar el gatazo'?", options: ["Regalar un gato", "Aparentar más de lo que es", "Correr rápido", "Ser presumido"], answer: 1, explanation: "Dar el gatazo = lucir bien o aparentar más de lo que realmente es." },
    { question: "Completa: 'El que nace pa' maceta...'", options: ["Del corredor no pasa", "Siempre florece", "Nunca se rompe", "Se queda en el patio"], answer: 0, explanation: "Refrán mexicano: 'El que nace pa' maceta, del corredor no pasa'." },
    { question: "¿Qué significa 'echar la hueva'?", options: ["Cocinar huevos", "Flojear o no hacer nada", "Lanzar algo", "Estar dormido"], answer: 1, explanation: "Echar la hueva = estar de flojo, no hacer nada productivo." },
    { question: "Si dicen 'ya chole', significa:", options: ["Ya comí", "Ya basta, ya estuvo", "Ya llegué", "Ya me voy"], answer: 1, explanation: "Ya chole = ya basta, ya estuvo bueno. Expresión de hartazgo." },
    { question: "¿Qué significa 'dar atole con el dedo'?", options: ["Dar de comer", "Engañar o hacer tonto a alguien", "Compartir comida", "Ayudar a alguien"], answer: 1, explanation: "Dar atole con el dedo = engañar a alguien haciéndole creer algo que no es." },
    { question: "¿Qué quiere decir 'no tener madre'?", options: ["Ser huérfano", "Ser descarado o no tener vergüenza", "Ser muy pobre", "No tener familia"], answer: 1, explanation: "No tener madre = ser muy atrevido, descarado. También se usa como halago: '¡Está de no mame(s)!'" },
    { question: "¿Qué significa 'chingar'?", options: ["Cantar", "Molestar, fastidiar o estorbar", "Bailar", "Cocinar"], answer: 1, explanation: "Chingar es la palabra más versátil del español mexicano: molestar, romper, golpear, etc." },
    { question: "¿Qué quiere decir 'andar de buitre'?", options: ["Volar alto", "Estar al acecho esperando algo", "Tener hambre", "Estar enfermo"], answer: 1, explanation: "Andar de buitre = rondar esperando aprovecharse de una situación o persona." },
    { question: "¿Qué significa 'sacar el cobre'?", options: ["Encontrar monedas", "Revelar la verdadera naturaleza", "Ir a la mina", "Ganar dinero"], answer: 1, explanation: "Sacar el cobre = mostrar lo que realmente eres, generalmente algo negativo." },
    { question: "Si dicen 'se le chispoteó', significa:", options: ["Se quemó", "Se le escapó algo sin querer", "Se enojó", "Se alegró"], answer: 1, explanation: "Se le chispoteó = dijo o hizo algo sin querer, un desliz involuntario." },
    { question: "¿Qué significa 'ir de cacería'?", options: ["Ir al bosque", "Salir a buscar pareja", "Ir de compras", "Ir a trabajar"], answer: 1, explanation: "Ir de cacería = salir con la intención de ligar o conquistar a alguien." },
    { question: "¿Qué quiere decir 'ponerse las pilas'?", options: ["Cargar el celular", "Ponerse activo y trabajar duro", "Comprar baterías", "Hacer ejercicio"], answer: 1, explanation: "Ponerse las pilas = activarse, poner atención y esfuerzo." },
    { question: "¿Qué significa 'mamar gallo'?", options: ["Criar gallinas", "Perder el tiempo o burlarse", "Cantar fuerte", "Trabajar duro"], answer: 1, explanation: "Mamar gallo = perder el tiempo, burlarse o no tomarse algo en serio." },
    { question: "Completa: 'Más vale pájaro en mano...'", options: ["Que ver un ave volar", "Que ciento volando", "Que dos en el nido", "Que ninguno en la jaula"], answer: 1, explanation: "Refrán clásico: más vale lo seguro que lo incierto." },
    { question: "¿Qué significa 'tirar la onda'?", options: ["Lanzar una piedra al agua", "Coquetear o mostrar interés", "Hacer ondas de radio", "Surfear"], answer: 1, explanation: "Tirar la onda = coquetear, mostrar interés romántico de manera sutil." },
    { question: "¿Qué quiere decir 'estar crudo'?", options: ["Estar sin cocinar", "Tener resaca o cruda", "Estar sin bañar", "Estar enojado"], answer: 1, explanation: "Estar crudo = tener resaca después de beber alcohol en exceso." },
    { question: "¿Qué significa 'tener colmillo'?", options: ["Tener dientes grandes", "Ser experimentado y astuto", "Ser vampiro", "Comer mucho"], answer: 1, explanation: "Tener colmillo = tener experiencia y astucia, no ser fácil de engañar." },
    { question: "¿Qué quiere decir 'hacerse de la vista gorda'?", options: ["Engordar los ojos", "Ignorar algo a propósito", "Ver mal", "Necesitar lentes"], answer: 1, explanation: "Hacerse de la vista gorda = fingir que no vio algo, ignorar a propósito." },
    { question: "¿Qué significa 'dar el avión'?", options: ["Regalar un boleto", "Ignorar a alguien dándole por su lado", "Pilotar una nave", "Estar en las nubes"], answer: 1, explanation: "Dar el avión = hacerle creer a alguien que le prestas atención sin realmente hacerlo." },
    { question: "¿Qué quiere decir 'tener mucha lana'?", options: ["Criar ovejas", "Tener mucho dinero", "Tener mucho pelo", "Tener calor"], answer: 1, explanation: "Tener lana = tener dinero. Lana es sinónimo coloquial de dinero en México." },
    { question: "¿Qué significa 'echarle crema a los tacos'?", options: ["Cocinar bien", "Exagerar o presumir de más", "Ser buen cocinero", "Tener buen gusto"], answer: 1, explanation: "Echarle crema a sus tacos = exagerar los logros o cualidades propias." },
    { question: "¿Qué quiere decir 'ser muy codo'?", options: ["Tener brazos fuertes", "Ser tacaño o avaro", "Ser fuerte", "Ser flexible"], answer: 1, explanation: "Ser codo = ser tacaño, no querer gastar dinero." },
    { question: "¿Qué significa 'agarrar la onda'?", options: ["Surfear", "Entender la situación o el chiste", "Escuchar música", "Tomar el autobús"], answer: 1, explanation: "Agarrar la onda = entender, captar la idea o la situación." },
    { question: "¿Qué quiere decir 'ir al cine a ver qué tranza'?", options: ["Ver películas", "Ir a ver qué pasa o qué hay", "Comprar palomitas", "Ir al teatro"], answer: 1, explanation: "Qué tranza = qué onda, qué pasa. Saludo informal o pregunta de situación." },
    { question: "¿Qué significa 'echar un taco de ojo'?", options: ["Comer tacos con los ojos", "Mirar algo o alguien con gusto", "Llorar de hambre", "Parpadear rápido"], answer: 1, explanation: "Echar un taco de ojo = admirar visualmente algo o alguien atractivo." },
    { question: "¿Qué quiere decir 'no manches'?", options: ["No ensucies", "Expresión de sorpresa o incredulidad", "No pintes", "No toques"], answer: 1, explanation: "No manches = exclamación de sorpresa. Versión suavizada de una expresión más fuerte." },
    { question: "¿Qué significa 'chido'?", options: ["Frío", "Genial, cool, padre", "Raro", "Feo"], answer: 1, explanation: "Chido = algo bueno, genial, cool. De uso muy extendido entre jóvenes mexicanos." },
    { question: "¿Qué quiere decir 'la neta'?", options: ["La meta", "La verdad", "La neta de pescar", "El destino"], answer: 1, explanation: "La neta = la verdad, lo auténtico. 'La neta del planeta' = la verdad absoluta." },
    { question: "¿Qué significa 'echarse un coyotito'?", options: ["Adoptar un animal", "Tomar una siesta rápida", "Correr en el campo", "Aullar de noche"], answer: 1, explanation: "Echarse un coyotito = tomar una siesta breve, dormitar un rato." },
    { question: "¿Qué quiere decir 'tener sangre de atole'?", options: ["Ser dulce", "Ser pasivo, no reaccionar ante nada", "Tener frío", "Estar enfermo"], answer: 1, explanation: "Tener sangre de atole = ser demasiado tranquilo, no alterarse por nada." },
    { question: "¿Qué significa 'estar en la lona'?", options: ["Acampar", "Estar sin dinero o en mala situación", "Hacer ejercicio", "Dormir en el suelo"], answer: 1, explanation: "Estar en la lona = estar arruinado económicamente, sin recursos." },
    { question: "¿Qué quiere decir 'salir con su domingo siete'?", options: ["Ir a misa", "Salir con algo inesperado, un embarazo", "Ganar la lotería", "Ir de compras"], answer: 1, explanation: "Salir con su domingo siete = resultar con un embarazo inesperado o una sorpresa desagradable." },
    { question: "¿Qué significa 'caerle gordo a alguien'?", options: ["Engordar", "No caerle bien, resultarle molesto", "Caerse encima", "Ser pesado"], answer: 1, explanation: "Caerle gordo = no agradarle a alguien, resultar antipático." },
    { question: "¿Qué quiere decir 'estar hasta las manitas'?", options: ["Tener las manos llenas", "Estar muy borracho", "Aplaudir mucho", "Estar cansado"], answer: 1, explanation: "Estar hasta las manitas = estar muy borracho, ebrio al extremo." },
    { question: "¿Qué significa 'cantinflear'?", options: ["Cantar bonito", "Hablar mucho sin decir nada", "Actuar en películas", "Bailar chistoso"], answer: 1, explanation: "Cantinflear = hablar mucho sin decir nada concreto. Viene del comediante Cantinflas." },
    { question: "¿Qué quiere decir 'no seas rajón'?", options: ["No cortes nada", "No te eches para atrás", "No seas violento", "No seas flojo"], answer: 1, explanation: "Rajón = quien se raja, se echa para atrás. 'No seas rajón' = cumple tu palabra." },
    { question: "¿Qué significa 'vale madres'?", options: ["Es muy valioso", "No importa nada", "Es para madres", "Es caro"], answer: 1, explanation: "Vale madres = no importa, no tiene valor, da igual. Muy coloquial y directo." },
    { question: "¿Qué quiere decir 'hacer de chivo los tamales'?", options: ["Cocinar mal", "Engañar a la pareja, ser infiel", "Criar animales", "Hacer comida"], answer: 1, explanation: "Hacer de chivo los tamales = ponerle los cuernos a alguien, ser infiel." },
    { question: "¿Qué significa 'ya merito'?", options: ["Ya mero, casi", "Ya pasó", "Ya no importa", "Ya comí"], answer: 0, explanation: "Ya merito = ya casi, falta poquito. Expresión de cercanía temporal." },
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
    // BGM — minigame track
    useEffect(() => { playBGM("minigame"); return () => { stopBGM(); playBGM("menu"); }; }, []);

    const insets = useSafeAreaInsets();
    const { userId } = useAuth();
    const [questions, setQuestions] = useState(() => pickRandomQuestions());
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [lastAnswer, setLastAnswer] = useState(null); // null | "correct" | "wrong"
    const [tab, setTab] = useState("daily");

    const submitScore = useUserMutation(api.albures.submitScore);
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
        <ImageBackground source={require("../../assets/images/bg.webp")} style={styles.root} resizeMode="cover">
            <View style={styles.darkOverlay} />

            {/* ── Quiz en progreso ── */}
            {!showResult && (
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 20 }]}>
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
                <View style={[styles.cardOverlay, { paddingTop: insets.top + 20 }]}>
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
