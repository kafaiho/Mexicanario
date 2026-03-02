import React, { useState } from "react";
import {
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import TopBar from "../components/TopBar";

const { width, height } = Dimensions.get("window");

const questions = [
    {
        question: "Si alguien te dice 'No sacudan la cuna...', la respuesta clásica es:",
        options: [
            "Que despiertan al niño",
            "Que se cae el bebé",
            "Que me mareo",
            "Que se rompe"
        ],
        answer: 0,
        explanation: "Clásico albur: 'No sacudan la cuna, que despiertan al niño'."
    },
    {
        question: "Completa la frase: 'Huele a traste...'",
        options: [
            "Lavado",
            "Viejo",
            "Sucio",
            "Que no has lavado"
        ],
        answer: 3,
        explanation: "'Huele a traste... que no has lavado' (trasteque / trasero)."
    },
    {
        question: "Si te dicen 'Préstame a tu hermana...', tú respondes:",
        options: [
            "No tengo hermana",
            "Préstame la tuya",
            "Mejor te presto otra cosa",
            "Respeta por favor"
        ],
        answer: 1,
        explanation: "El contra albur básico es devolverla."
    },
    {
        question: "¿Qué fruta es la más alburera?",
        options: [
            "El plátano",
            "El mamey",
            "La papaya",
            "El chile"
        ],
        answer: 1,
        explanation: "El mamey es rey en los albures mexicanos."
    },
    {
        question: "Si te gritan '¡Aguas!', significa:",
        options: [
            "Que te van a mojar",
            "Que tienes sed",
            "¡Cuidado!",
            "Va a llover"
        ],
        answer: 2,
        explanation: "Grito tradicional para advertir peligro o que estés atento."
    }
];

export default function DueloAlburesScreen({ navigation }) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    const handleAnswer = (selectedIndex) => {
        if (selectedIndex === questions[currentQuestion].answer) {
            setScore(score + 1);
        }

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResult(true);
        }
    };

    const restartGame = () => {
        setCurrentQuestion(0);
        setScore(0);
        setShowResult(false);
    };

    return (
        <ImageBackground
            source={require("../../assets/images/bg.png")}
            style={styles.container}
            resizeMode="cover"
        >
            <TopBar />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Duelo de Albures</Text>
            </View>

            <View style={styles.gameContainer}>
                {showResult ? (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>¡Duelo Terminado!</Text>
                        <Text style={styles.resultScore}>
                            Puntuación: {score} de {questions.length}
                        </Text>
                        <Text style={styles.resultText}>
                            {score === questions.length ? "¡Eres el maestro del albur! 🌮" :
                                score > questions.length / 2 ? "¡Ah, medio te defiendes! 🌶️" :
                                    "Te falta barrio, compa. 🌵"}
                        </Text>

                        <TouchableOpacity style={styles.actionButton} onPress={restartGame}>
                            <Text style={styles.actionButtonText}>Jugar de nuevo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.backButton]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>Volver a Juegos</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.questionCard}>
                        <View style={styles.questionHeader}>
                            <Text style={styles.questionProgress}>
                                Pregunta {currentQuestion + 1} de {questions.length}
                            </Text>
                            <TouchableOpacity
                                style={styles.exitButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.exitButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.questionText}>
                            {questions[currentQuestion].question}
                        </Text>

                        <View style={styles.optionsContainer}>
                            {questions[currentQuestion].options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.optionButton}
                                    onPress={() => handleAnswer(index)}
                                >
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: "center",
        marginTop: height * 0.12,
        marginBottom: height * 0.01,
        backgroundColor: "#E74C3C",
        marginHorizontal: width * 0.04,
        borderRadius: 25,
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: width * 0.07,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        textShadowColor: "#8B0000",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    gameContainer: {
        flex: 1,
        padding: width * 0.05,
        justifyContent: "center",
    },
    questionCard: {
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 20,
        padding: width * 0.05,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    questionProgress: {
        fontSize: width * 0.04,
        color: "#888",
        fontWeight: "600",
    },
    exitButton: {
        backgroundColor: "#E74C3C",
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    exitButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    questionText: {
        fontSize: width * 0.06,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: height * 0.03,
    },
    optionsContainer: {
        width: "100%",
    },
    optionButton: {
        backgroundColor: "#FCD11D",
        paddingVertical: height * 0.02,
        paddingHorizontal: width * 0.04,
        borderRadius: 15,
        marginBottom: height * 0.015,
        borderWidth: 2,
        borderColor: "#E6B800",
    },
    optionText: {
        fontSize: width * 0.045,
        color: "#523600",
        fontWeight: "bold",
        textAlign: "center",
    },
    resultCard: {
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 20,
        padding: width * 0.06,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    resultTitle: {
        fontSize: width * 0.08,
        fontWeight: "bold",
        color: "#D35400",
        marginBottom: 10,
    },
    resultScore: {
        fontSize: width * 0.06,
        color: "#333",
        marginBottom: 15,
        fontWeight: "600",
    },
    resultText: {
        fontSize: width * 0.05,
        color: "#666",
        textAlign: "center",
        marginBottom: height * 0.04,
        fontStyle: "italic",
    },
    actionButton: {
        backgroundColor: "#2ECC71",
        paddingVertical: height * 0.02,
        paddingHorizontal: width * 0.08,
        borderRadius: 25,
        width: "100%",
        marginBottom: 15,
        borderWidth: 2,
        borderColor: "#27AE60",
    },
    actionButtonText: {
        color: "white",
        fontSize: width * 0.05,
        fontWeight: "bold",
        textAlign: "center",
    },
    backButton: {
        backgroundColor: "#95A5A6",
        borderColor: "#7F8C8D",
    },
    backButtonText: {
        color: "white",
    }
});
