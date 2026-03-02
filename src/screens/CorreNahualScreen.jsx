import React, { useState, useEffect, useRef } from "react";
import {
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Easing,
} from "react-native";
import TopBar from "../components/TopBar";

const { width, height } = Dimensions.get("window");

export default function CorreNahualScreen({ navigation }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);

    const characterY = useRef(new Animated.Value(0)).current;
    const obstacleX = useRef(new Animated.Value(width)).current;

    // Game dimensions
    const charWidth = 50;
    const charHeight = 60;
    const obsWidth = 40;
    const obsHeight = 50;
    const groundY = height * 0.6; // Ground level

    const startGame = () => {
        setIsPlaying(true);
        setIsGameOver(false);
        setScore(0);
        characterY.setValue(0); // On ground
        obstacleX.setValue(width); // Start off-screen right
        startObstacleAnimation();
    };

    const jump = () => {
        if (!isPlaying || isGameOver) return;

        // Check if already in air (simple prevent double jump)
        if (characterY._value < -10) return;

        Animated.sequence([
            Animated.timing(characterY, {
                toValue: -120, // Jump height
                duration: 300,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(characterY, {
                toValue: 0,
                duration: 300,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
            })
        ]).start();
    };

    const startObstacleAnimation = () => {
        obstacleX.setValue(width);

        Animated.timing(obstacleX, {
            toValue: -100, // Move completely off screen left (increased for wider nahual)
            duration: Math.max(800, 1500 - (score * 50)), // Make slightly faster
            easing: Easing.linear,
            useNativeDriver: true,
        }).start((result) => {
            if (result.finished) {
                setScore(s => s + 1);
            }
        });
    };

    useEffect(() => {
        if (isPlaying && !isGameOver) {
            startObstacleAnimation();
        }
    }, [score, isPlaying, isGameOver]);

    useEffect(() => {
        let collisionInterval;

        if (isPlaying && !isGameOver) {
            collisionInterval = setInterval(() => {
                // Simple AABB Collision detection
                const charCurrentY = characterY._value;
                const obsCurrentX = obstacleX._value;

                // Player collision box
                const playerLeft = playerX + 10;
                const playerRight = playerX + charWidth - 10;

                // Obstacle (Nahual) collision box
                const obsLeft = obsCurrentX + 10;
                const obsRight = obsCurrentX + obsWidth - 10;

                const isCollisionX = (
                    playerRight > obsLeft &&
                    playerLeft < obsRight
                );

                // Y Collision 
                const isCollisionY = (charCurrentY > -obsHeight + 10);

                if (isCollisionX && isCollisionY) {
                    // Collision!
                    setIsGameOver(true);
                    setIsPlaying(false);
                    obstacleX.stopAnimation();
                    characterY.stopAnimation();
                }
            }, 50); // Check frequently
        }

        return () => clearInterval(collisionInterval);
    }, [isPlaying, isGameOver]);

    return (
        <ImageBackground
            source={require("../../assets/images/bg.png")}
            style={styles.container}
            resizeMode="cover"
        >
            <TopBar />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Corre del Nahual</Text>
            </View>

            <TouchableOpacity
                style={styles.gameArea}
                activeOpacity={1}
                onPress={jump}
            >
                {!isPlaying && !isGameOver && (
                    <View style={styles.menuOverlay}>
                        <Text style={styles.menuTitle}>¡Escapa del Nahual!</Text>
                        <Text style={styles.menuText}>Toca la pantalla para saltar y que no te atrape.</Text>
                        <TouchableOpacity style={styles.actionButton} onPress={startGame}>
                            <Text style={styles.actionButtonText}>Empezar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.backButton]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>Volver</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isGameOver && (
                    <View style={styles.menuOverlay}>
                        <Text style={styles.resultTitle}>¡Te alcanzó el Nahual!</Text>
                        <Text style={styles.resultScore}>Esquivaste: {score} veces</Text>
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

                {/* Score and Exit Container */}
                <View style={styles.topHudContainer}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreText}>Puntos: {score}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.exitButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.exitButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Game Render Area */}
                <View style={[styles.groundContainer, { top: groundY }]}>
                    <View style={styles.groundLine} />

                    {/* Player (Character) */}
                    <Animated.View style={[
                        styles.character,
                        { transform: [{ translateY: characterY }] }
                    ]}>
                        <Text style={{ fontSize: 40 }}>🏃🏽</Text>
                    </Animated.View>

                    {/* Obstacle (Nahual) */}
                    <Animated.View style={[
                        styles.obstacle,
                        { transform: [{ translateX: obstacleX }] }
                    ]}>
                        <Text style={{ fontSize: 45 }}>🐺</Text>
                    </Animated.View>
                </View>
            </TouchableOpacity>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        alignItems: "center",
        marginTop: height * 0.12,
        marginBottom: height * 0.01,
        backgroundColor: "#2C3E50",
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
        textShadowColor: "#000",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    gameArea: {
        flex: 1,
    },
    menuOverlay: {
        position: 'absolute',
        top: height * 0.2,
        left: width * 0.1,
        right: width * 0.1,
        backgroundColor: "rgba(255,255,255,0.95)",
        padding: 20,
        borderRadius: 20,
        alignItems: "center",
        zIndex: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    menuTitle: {
        fontSize: width * 0.06,
        fontWeight: "bold",
        color: "#D35400",
        marginBottom: 10,
        textAlign: "center",
    },
    menuText: {
        fontSize: width * 0.04,
        color: "#555",
        marginBottom: 20,
        textAlign: "center",
    },
    resultTitle: {
        fontSize: width * 0.07,
        fontWeight: "bold",
        color: "#C0392B",
        marginBottom: 10,
        textAlign: "center",
    },
    resultScore: {
        fontSize: width * 0.05,
        color: "#333",
        fontWeight: "bold",
        marginBottom: 20,
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
    topHudContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 5,
    },
    scoreContainer: {
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
    },
    scoreText: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
    },
    exitButton: {
        backgroundColor: "rgba(231, 76, 60, 0.9)",
        width: 35,
        height: 35,
        borderRadius: 17.5,
        justifyContent: "center",
        alignItems: "center",
    },
    exitButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    groundContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 100, // Make room for characters above the line
    },
    groundLine: {
        position: 'absolute',
        bottom: -60, // Position line at bottom of container
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: "#8E44AD",
    },
    character: {
        position: 'absolute',
        left: 50, // Fixed X position
        bottom: -60, // Rest on ground
        width: 50,
        height: 60,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    obstacle: {
        position: 'absolute',
        bottom: -60, // Rest on ground
        width: 40,
        height: 50,
        justifyContent: 'flex-end',
        alignItems: 'center',
    }
});
