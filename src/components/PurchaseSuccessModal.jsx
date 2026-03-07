import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import usePetStore, { getStage } from "../store/usePetStore";
import { notifySuccess } from "../services/haptics";
import { FONTS } from "../theme/designTokens";
import { playPetSound, playSound } from "../utils/soundManager";
import StageCropped from "./PetCompanion/StageCropped";

const { width, height } = Dimensions.get("window");

const BROWN = "#5B3822";
const WHEAT = "#F5DEB3";
const AMBER = "#F4A460";
const ACTION_BG = "#FFD700";
const ACTION_BORDER = "#C8950A";
const ACTION_TEXT = "#523600";

const MESSAGES = [
    "¡Te rifaste compa! Te quiero un montón. 🥺❤️",
    "¡Qué chulada! Eres el mejor humano del mundo mundial. 🥰🌮",
    "¡Ay güey, qué rico! Prometo portarme bién. 🐶✨",
    "¡Gracias jefecito/a! Mi corazoncito late a mil por hora. 💓",
    "¡Al tiro! Me dejaste la panza llena y el corazón contento. 🌯💕",
    "¡No manches, qué detallazo! Te ganaste el cielo. ☁️😇",
];

const TAP_BUBBLES = [
    "¡Aquí estoy! 💛",
    "¡Órale, qué caricia! 🥰",
    "+Vínculo 💫",
    "¡Chócalas, cuate! 🤝",
    "¡Me encanta cuando me tocas! ✨",
    "¡Somos el mejor equipo! 🌮",
];

export default function PurchaseSuccessModal({ visible, item, onClose }) {
    const scaleAnim   = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const floatAnim   = useRef(new Animated.Value(0)).current;
    const breatheAnim = useRef(new Animated.Value(1)).current;
    const tapScale    = useRef(new Animated.Value(1)).current;
    const breatheLoop = useRef(null);
    const bubbleTimer = useRef(null);

    // Pet from store (same source as StreakModal)
    const vinculo  = usePetStore((s) => s.vinculo);
    const petType  = usePetStore((s) => s.petType);
    const caricia  = usePetStore((s) => s.caricia);
    const stage    = getStage(vinculo);

    const [tapBubble, setTapBubble] = useState(null);

    useEffect(() => {
        if (visible) {
            playSound("celebration");
            // Entry animation
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1, duration: 300,
                    easing: Easing.out(Easing.cubic), useNativeDriver: true,
                }),
            ]).start();
            // Float + breathe loop (same as StreakModal)
            breatheLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(floatAnim,   { toValue: -7,   duration: 1100, useNativeDriver: true }),
                        Animated.timing(breatheAnim, { toValue: 1.06, duration: 1100, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(floatAnim,   { toValue: 0, duration: 1100, useNativeDriver: true }),
                        Animated.timing(breatheAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
                    ]),
                ])
            );
            breatheLoop.current.start();
        } else {
            scaleAnim.setValue(0.5);
            opacityAnim.setValue(0);
            breatheLoop.current?.stop();
            floatAnim.setValue(0);
            breatheAnim.setValue(1);
            tapScale.setValue(1);
            clearTimeout(bubbleTimer.current);
            setTapBubble(null);
        }
    }, [visible]);

    const handleTapMascot = () => {
        playPetSound("happy", petType);
        notifySuccess();
        caricia(); // +vínculo

        // Animación de golpecito
        Animated.sequence([
            Animated.timing(tapScale, { toValue: 1.22, duration: 100, useNativeDriver: true }),
            Animated.timing(tapScale, { toValue: 0.92, duration: 80,  useNativeDriver: true }),
            Animated.timing(tapScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
        ]).start();

        // Burbuja aleatoria
        const msg = TAP_BUBBLES[Math.floor(Math.random() * TAP_BUBBLES.length)];
        setTapBubble(msg);
        clearTimeout(bubbleTimer.current);
        bubbleTimer.current = setTimeout(() => setTapBubble(null), 2000);
    };

    if (!visible || !item) return null;

    const randomMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const isFood   = ["taco", "tamal", "pan_muerto"].includes(item.id);
    const isFreeze = item.id === "streak_freeze" || item.id === "streak_freeze_coins";

    let title     = "¡A TODO DAR! ✅";
    let subtitle  = `${item.qty} ${item.label} en tu morral`;
    let gratitude = "¿Qué onda? ¡Gracias por el detalle!";
    let extraStat = "";

    if (isFood) {
        title     = "¡BARRIGA LLENA! 🌮";
        subtitle  = `Le diste un rico ${item.icon}`;
        gratitude = randomMessage;
        extraStat = `+Vínculo — ¡qué apapacho!`;
    } else if (isFreeze) {
        title     = "¡RACHA BLINDADA! 🛡️";
        subtitle  = "+1 Escudo de Racha activado";
        gratitude = "¡Uff, nos salvamos de empezar de cero! Eres mi héroe. 🦸‍♂️";
        extraStat = "Se usa automático si fallas un día";
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={s.overlay}>
                <Animated.View
                    style={[
                        s.card,
                        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    {/* Confetti Particles (simplified) */}
                    <Text style={s.bgIconLeft}>✨</Text>
                    <Text style={s.bgIconRight}>🎉</Text>

                    {/* Header */}
                    <View style={s.headerWrap}>
                        <Text style={s.headerTitle}>{title}</Text>
                    </View>

                    {/* Subtitle / Item description */}
                    <Text style={s.subtitle}>{subtitle}</Text>
                    {extraStat ? (
                        <View style={s.statBadge}>
                            <Text style={s.statBadgeText}>🔥 {extraStat}</Text>
                        </View>
                    ) : null}

                    {/* Mascota tappable con float + breathe + tap reaction */}
                    <View style={s.mascotContainer}>
                        {tapBubble && (
                            <View style={s.tapBubble}>
                                <Text style={s.tapBubbleText}>{tapBubble}</Text>
                                <View style={s.tapBubbleTail} />
                            </View>
                        )}
                        <TouchableOpacity onPress={handleTapMascot} activeOpacity={0.9}>
                            <Animated.View style={{
                                transform: [
                                    { translateY: floatAnim },
                                    { scale: Animated.multiply(breatheAnim, tapScale) },
                                ],
                            }}>
                                <StageCropped petType={petType} stage={stage} size={110} />
                            </Animated.View>
                        </TouchableOpacity>
                        <Text style={s.tapHint}>👆 Tócame</Text>
                    </View>

                    {/* Chat bubble with Mexican phrasing */}
                    <View style={s.bubble}>
                        <Text style={s.bubbleText}>{gratitude}</Text>
                        {/* Pequeño triangulito de la burbuja */}
                        <View style={s.bubbleTail} />
                    </View>

                    {/* Buy Button */}
                    <TouchableOpacity style={s.btn} onPress={onClose} activeOpacity={0.8}>
                        <Text style={s.btnText}>¡Órale!</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: width * 0.05,
        zIndex: 9999,
    },
    card: {
        backgroundColor: WHEAT,
        borderRadius: width * 0.06,
        borderWidth: 3,
        borderColor: BROWN,
        width: "100%",
        padding: width * 0.05,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
        overflow: "visible",
    },
    bgIconLeft: {
        position: "absolute",
        fontSize: width * 0.1,
        top: width * 0.05,
        left: width * 0.05,
        opacity: 0.6,
    },
    bgIconRight: {
        position: "absolute",
        fontSize: width * 0.1,
        top: width * 0.05,
        right: width * 0.05,
        opacity: 0.6,
    },
    headerWrap: {
        backgroundColor: AMBER,
        paddingHorizontal: width * 0.05,
        paddingVertical: height * 0.01,
        borderRadius: width * 0.05,
        borderWidth: 2,
        borderColor: "#A0541A",
        marginBottom: height * 0.015,
    },
    headerTitle: {
        fontFamily: FONTS.display,
        fontSize: width * 0.06,
        color: "#fff",
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        fontFamily: FONTS.bodyBold,
        fontSize: width * 0.045,
        color: BROWN,
        textAlign: "center",
        marginBottom: height * 0.01,
    },
    statBadge: {
        backgroundColor: "#2ecc71",
        paddingHorizontal: width * 0.04,
        paddingVertical: height * 0.005,
        borderRadius: width * 0.04,
        borderWidth: 1.5,
        borderColor: "#27ae60",
        marginBottom: height * 0.02,
    },
    statBadgeText: {
        fontFamily: FONTS.bodyBold,
        color: "#fff",
        fontSize: width * 0.038,
    },
    mascotContainer: {
        marginVertical: height * 0.01,
        alignItems: "center",
    },
    tapBubble: {
        backgroundColor: BROWN,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 6,
        alignSelf: "center",
        position: "relative",
    },
    tapBubbleText: {
        color: "#FFE4B5",
        fontSize: width * 0.034,
        fontFamily: FONTS.bodyBold,
        textAlign: "center",
    },
    tapBubbleTail: {
        position: "absolute",
        bottom: -7,
        left: "50%",
        marginLeft: -6,
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 7,
        borderStyle: "solid",
        backgroundColor: "transparent",
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: BROWN,
    },
    tapHint: {
        marginTop: 4,
        fontSize: width * 0.028,
        color: BROWN,
        opacity: 0.55,
        fontFamily: FONTS.body,
    },
    bubble: {
        backgroundColor: "#fff",
        padding: width * 0.04,
        borderRadius: width * 0.05,
        borderWidth: 2,
        borderColor: BROWN,
        marginBottom: height * 0.03,
        position: "relative",
        width: "90%",
    },
    bubbleText: {
        fontFamily: FONTS.bodyBold,
        fontSize: width * 0.04,
        color: BROWN,
        textAlign: "center",
    },
    bubbleTail: {
        position: "absolute",
        top: -12,
        left: "50%",
        marginLeft: -8,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 12,
        borderStyle: "solid",
        backgroundColor: "transparent",
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: BROWN,
    },
    btn: {
        backgroundColor: ACTION_BG,
        borderWidth: 2,
        borderColor: ACTION_BORDER,
        borderRadius: width * 0.06,
        paddingVertical: height * 0.018,
        paddingHorizontal: width * 0.1,
        width: "100%",
        alignItems: "center",
    },
    btnText: {
        fontFamily: FONTS.display,
        color: ACTION_TEXT,
        fontSize: width * 0.055,
    },
});
