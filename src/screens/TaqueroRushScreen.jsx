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

const RECIPE = ["Tortilla", "Carne", "Salsa", "Limón"];

export default function TaqueroRushScreen({ navigation }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);

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

    const startGame = () => {
        setIsPlaying(true);
        setIsGameOver(false);
        setScore(0);
        setTimeLeft(30);
        setCurrentStep(0);
    };

    const handleIngredientTap = (ingredient) => {
        if (!isPlaying || isGameOver) return;

        if (ingredient === RECIPE[currentStep]) {
            // Correct ingredient
            if (currentStep === RECIPE.length - 1) {
                // Taco completed!
                setScore((s) => s + 1);
                setCurrentStep(0);
            } else {
                // Next step
                setCurrentStep((s) => s + 1);
            }
        } else {
            // Wrong ingredient - reset current taco!
            setCurrentStep(0);
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
        <ImageBackground
            source={require("../../assets/images/bg.png")}
            style={styles.container}
            resizeMode="cover"
        >
            <TopBar />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Taquero Rush</Text>
            </View>

            <View style={styles.gameArea}>
                {!isPlaying && !isGameOver && (
                    <View style={styles.menuOverlay}>
                        <Text style={styles.menuTitle}>¡Prepara Tacos!</Text>
                        <Text style={styles.menuText}>
                            Tienes 30 segundos. Toca los ingredientes en orden:
                            {"\n"}Tortilla ➡️ Carne ➡️ Salsa ➡️ Limón
                        </Text>
                        <TouchableOpacity style={styles.actionButton} onPress={startGame}>
                            <Text style={styles.actionButtonText}>Empezar Turno</Text>
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
                        <Text style={styles.resultTitle}>¡Turno Terminado!</Text>
                        <Text style={styles.resultScore}>Preparaste: {score} Tacos 🌮</Text>
                        <Text style={styles.menuText}>
                            {score > 15 ? "¡Eres el Rey del Trompo! 👑" :
                                score > 8 ? "Nada mal, taquero nivel medio. 👍" :
                                    "Te corrieron de la taquería. 📉"}
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

                {isPlaying && (
                    <View style={styles.activeGameArea}>
                        <View style={styles.statsBar}>
                            <Text style={styles.statsText}>🌮 Tacos: {score}</Text>
                            <Text style={styles.statsText}>⏱️ {timeLeft}s</Text>

                            <TouchableOpacity
                                style={styles.exitButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.exitButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tacoPrepArea}>
                            <Text style={styles.prepTitle}>Preparando Taco...</Text>
                            <View style={styles.progressDots}>
                                {RECIPE.map((ing, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.dot,
                                            currentStep > i ? styles.dotCompleted :
                                                currentStep === i ? styles.dotCurrent : null
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={styles.nextIngredientPrompt}>
                                Siguiente: {RECIPE[currentStep]} {getIngredientIcon(RECIPE[currentStep])}
                            </Text>
                        </View>

                        <View style={styles.ingredientsGrid}>
                            {["Carne", "Limón", "Tortilla", "Salsa"].map((ingredient, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.ingredientButton}
                                    onPress={() => handleIngredientTap(ingredient)}
                                >
                                    <Text style={styles.ingredientIcon}>{getIngredientIcon(ingredient)}</Text>
                                    <Text style={styles.ingredientName}>{ingredient}</Text>
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
        backgroundColor: "#D35400",
        marginHorizontal: width * 0.04,
        borderRadius: 25,
        paddingVertical: 10,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: width * 0.07,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
    },
    gameArea: {
        flex: 1,
        padding: width * 0.05,
        justifyContent: "center",
    },
    activeGameArea: {
        flex: 1,
        justifyContent: "space-between",
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
        color: "#E67E22",
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
        fontSize: width * 0.07,
        fontWeight: "bold",
        color: "#C0392B",
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
        backgroundColor: "#F39C12",
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
        marginBottom: 20,
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
    tacoPrepArea: {
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: 20,
        borderRadius: 20,
        alignItems: "center",
        marginBottom: 20,
    },
    prepTitle: {
        fontSize: width * 0.05,
        color: "#666",
        marginBottom: 10,
        fontWeight: "bold",
    },
    progressDots: {
        flexDirection: "row",
        marginBottom: 15,
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#CCC",
        marginHorizontal: 5,
    },
    dotCompleted: { backgroundColor: "#27AE60" },
    dotCurrent: { backgroundColor: "#F39C12", borderWidth: 2, borderColor: "#D35400" },
    nextIngredientPrompt: {
        fontSize: width * 0.06,
        fontWeight: "bold",
        color: "#D35400",
    },
    ingredientsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    ingredientButton: {
        width: "48%",
        backgroundColor: "#FFF",
        padding: 20,
        borderRadius: 20,
        alignItems: "center",
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
        borderWidth: 2,
        borderColor: "#F0F0F0",
    },
    ingredientIcon: {
        fontSize: width * 0.1,
        marginBottom: 5,
    },
    ingredientName: {
        fontSize: width * 0.045,
        fontWeight: "bold",
        color: "#333",
    }
});
