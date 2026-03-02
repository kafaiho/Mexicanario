import React, { useState, useEffect } from "react";
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

export default function LoteriaExpressScreen({ navigation }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);

    const [targetCard, setTargetCard] = useState(null);
    const [options, setOptions] = useState([]);

    useEffect(() => {
        let timer;
        if (isPlaying && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (isPlaying && timeLeft === 0) {
            setIsGameOver(true);
            setIsPlaying(false);
        }
        return () => clearInterval(timer);
    }, [isPlaying, timeLeft]);

    const generateRound = () => {
        // Pick a random target
        const newTarget = LOTERIA_CARDS[Math.floor(Math.random() * LOTERIA_CARDS.length)];

        // Pick 3 other random cards for options (ensure no duplicates)
        let newOptions = [newTarget];
        while (newOptions.length < 4) {
            const randomCard = LOTERIA_CARDS[Math.floor(Math.random() * LOTERIA_CARDS.length)];
            if (!newOptions.find(c => c.id === randomCard.id)) {
                newOptions.push(randomCard);
            }
        }

        // Shuffle options
        newOptions = newOptions.sort(() => Math.random() - 0.5);

        setTargetCard(newTarget);
        setOptions(newOptions);
    };

    const startGame = () => {
        setIsPlaying(true);
        setIsGameOver(false);
        setScore(0);
        setTimeLeft(30);
        generateRound();
    };

    const handleTap = (cardId) => {
        if (!isPlaying || isGameOver) return;

        if (cardId === targetCard.id) {
            setScore(s => s + 1);
        } else {
            // Penalty
            setTimeLeft(t => Math.max(0, t - 2));
        }
        generateRound();
    };

    return (
        <ImageBackground
            source={require("../../assets/images/bg.png")}
            style={styles.container}
            resizeMode="cover"
        >
            <TopBar />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lotería Exprés</Text>
            </View>

            <View style={styles.gameArea}>
                {!isPlaying && !isGameOver && (
                    <View style={styles.menuOverlay}>
                        <Text style={styles.menuTitle}>¡Lotería Exprés!</Text>
                        <Text style={styles.menuText}>
                            Encuentra la carta cantada lo más rápido posible.
                            {"\n"}Errores quitan 2 segundos.
                        </Text>
                        <TouchableOpacity style={styles.actionButton} onPress={startGame}>
                            <Text style={styles.actionButtonText}>¡Corre y se va con...!</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.backButton]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>Volver a Juegos</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isGameOver && (
                    <View style={styles.menuOverlay}>
                        <Text style={styles.resultTitle}>¡Lotería!</Text>
                        <Text style={styles.resultScore}>Adivinaste: {score} cartas</Text>
                        <Text style={styles.menuText}>
                            {score > 20 ? "¡Eres el gritón oficial! 🎤" :
                                score > 10 ? "Buena racha compa. 👍" :
                                    "Te falta barrio. 👎"}
                        </Text>
                        <TouchableOpacity style={styles.actionButton} onPress={startGame}>
                            <Text style={styles.actionButtonText}>Jugar de nuevo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.backButton]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>Volver</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isPlaying && targetCard && (
                    <View style={styles.activeGameArea}>
                        <View style={styles.statsBar}>
                            <Text style={styles.statsText}>🎯 Puntos: {score}</Text>
                            <Text style={[styles.statsText, timeLeft <= 5 && { color: "red" }]}>
                                ⏱️ {timeLeft}s
                            </Text>

                            <TouchableOpacity
                                style={styles.exitButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.exitButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.targetCardContainer}>
                            <Text style={styles.targetSubtitle}>¡Corre y se va con...!</Text>
                            <Text style={styles.targetTitle}>{targetCard.name.toUpperCase()}</Text>
                        </View>

                        <View style={styles.cardsGrid}>
                            {options.map((card, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.gameCard}
                                    onPress={() => handleTap(card.id)}
                                >
                                    <Text style={styles.cardIcon}>{card.icon}</Text>
                                    <Text style={styles.cardName}>{card.name}</Text>
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
    container: { flex: 1 },
    header: {
        alignItems: "center",
        marginTop: height * 0.12,
        marginBottom: height * 0.01,
        backgroundColor: "#F1C40F",
        marginHorizontal: width * 0.04,
        borderRadius: 25,
        paddingVertical: 10,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: width * 0.07,
        fontWeight: "bold",
        color: "#2C3E50",
        textAlign: "center",
    },
    gameArea: {
        flex: 1,
        padding: width * 0.05,
        justifyContent: "center",
    },
    activeGameArea: {
        flex: 1,
        justifyContent: "flex-start",
    },
    menuOverlay: {
        backgroundColor: "rgba(255,255,255,0.95)",
        padding: 20,
        borderRadius: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    menuTitle: {
        fontSize: width * 0.08,
        fontWeight: "bold",
        color: "#8E44AD",
        marginBottom: 10,
        textAlign: "center",
    },
    menuText: {
        fontSize: width * 0.045,
        color: "#444",
        marginBottom: 20,
        textAlign: "center",
        lineHeight: 24,
    },
    resultTitle: {
        fontSize: width * 0.08,
        fontWeight: "bold",
        color: "#27AE60",
        marginBottom: 10,
        textAlign: "center",
    },
    resultScore: {
        fontSize: width * 0.06,
        color: "#333",
        fontWeight: "bold",
        marginBottom: 15,
    },
    actionButton: {
        backgroundColor: "#9B59B6",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: "100%",
        marginBottom: 15,
    },
    actionButtonText: {
        color: "white",
        fontSize: width * 0.045,
        fontWeight: "bold",
        textAlign: "center",
    },
    backButton: {
        backgroundColor: "#7F8C8D",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: "100%",
        marginBottom: 15,
    },
    backButtonText: {
        color: "white",
        fontSize: width * 0.045,
        fontWeight: "bold",
        textAlign: "center",
    },
    statsBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: 15,
        borderRadius: 15,
        marginBottom: height * 0.05,
    },
    statsText: {
        fontSize: width * 0.05,
        fontWeight: "bold",
        color: "#333",
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
    targetCardContainer: {
        backgroundColor: "#FFF",
        padding: 20,
        borderRadius: 15,
        alignItems: "center",
        marginBottom: height * 0.05,
        borderWidth: 3,
        borderColor: "#F1C40F",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    targetSubtitle: {
        fontSize: width * 0.04,
        color: "#888",
        marginBottom: 5,
        fontWeight: "bold",
    },
    targetTitle: {
        fontSize: width * 0.08,
        fontWeight: "bold",
        color: "#2C3E50",
    },
    cardsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    gameCard: {
        width: "48%",
        aspectRatio: 0.8,
        backgroundColor: "#FFF",
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
        borderWidth: 2,
        borderColor: "#E0E0E0",
    },
    cardIcon: {
        fontSize: width * 0.15,
        marginBottom: 10,
    },
    cardName: {
        fontSize: width * 0.04,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
    }
});
