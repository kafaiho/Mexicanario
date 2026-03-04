import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import useDynamicBundle from "../hooks/useDynamicBundle";
import { FONTS } from "../theme/designTokens";

const { width, height } = Dimensions.get("window");

const BROWN = "#5B3822";
const WHEAT = "#F5DEB3";
const AMBER = "#F4A460";
const RED_TAG = "#E74C3C";

export default function DynamicBundleCard({ onBuy }) {
    const { bundle, timeLeftStr } = useDynamicBundle();

    return (
        <View style={s.container}>
            {/* Etiqueta superior flotante */}
            <View style={s.topTagWrap}>
                <View style={s.topTag}>
                    <Text style={s.topTagText}>¡Bueno, bonito y barato!</Text>
                </View>
            </View>

            {/* Main Card con fondo cielo natural */}
            <LinearGradient colors={["#56CCF2", "#2F80ED"]} style={s.card}>

                {/* Nubes de fondo simuladas con círculos */}
                <View style={s.cloud1} />
                <View style={s.cloud2} />
                <View style={s.cloud3} />

                {/* Decoración: Papel Picado */}
                <View style={s.papelPicadoContainer}>
                    {[...Array(6)].map((_, i) => (
                        <View key={i} style={[s.papelPicado, { backgroundColor: ['#E74C3C', '#2ECC71', '#F1C40F', '#9B59B6', '#E67E22', '#3498DB'][i % 6] }]}>
                            <View style={s.papelHole} />
                            <View style={s.papelCutout} />
                        </View>
                    ))}
                </View>

                {/* Zona del césped inferior */}
                <View style={s.grassContainer}>
                    <View style={s.grassHill}>
                        {/* Decoración: Cactus */}
                        <Text style={s.cactusLeft}>🌵</Text>
                        <Text style={s.cactusRight}>🌵</Text>
                    </View>
                </View>

                {/* --- CABECERA (Timer y Título del Bundle) --- */}
                <View style={s.headerRow}>
                    <View style={s.timerBubble}>
                        <Text style={s.timerIcon}>⏰</Text>
                        <Text style={s.timerText}>{timeLeftStr}</Text>
                    </View>
                </View>
                <Text style={s.bundleTitle}>{bundle.title}</Text>

                {/* Etiqueta roja dentada de "TIEMPO LIMITADO" (esquina superior derecha) */}
                <View style={s.limitedTag}>
                    <Text style={s.limitedTagText}>TIEMPO{"\n"}LIMITADO</Text>
                </View>

                {/* --- CONTENIDO CENTRAL --- */}
                <View style={s.contentRow}>
                    {/* Columna Izquierda: Recompensas en píldoras */}
                    <View style={s.rewardsCol}>
                        {bundle.rewards.map((rew, idx) => (
                            <View key={idx} style={s.rewardPill}>
                                <Text style={s.rewardEmoji}>{rew.icon}</Text>
                                <Text style={s.rewardQty}>{rew.qty.toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Columna Derecha: Ilustración Principal (Cofre / Regalo) */}
                    <View style={s.illustrationCol}>
                        <Image
                            source={require("../../assets/images/gift.png")}
                            style={s.illustrationImg}
                        />
                    </View>
                </View>

                {/* --- BOTÓN DE COMPRA EN EL PASTO --- */}
                <View style={s.btnWrap}>
                    <TouchableOpacity
                        style={s.buyBtn}
                        onPress={() => onBuy(bundle)}
                        activeOpacity={0.8}
                    >
                        <Text style={s.buyBtnText}>{bundle.priceText}</Text>
                    </TouchableOpacity>
                </View>

            </LinearGradient>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        width: "100%",
        marginTop: height * 0.02,
        marginBottom: height * 0.015,
    },

    // Etiqueta superior amarilla
    topTagWrap: {
        alignItems: "center",
        zIndex: 10,
        marginBottom: -12, // Se superpone a la tarjeta principal
    },
    topTag: {
        backgroundColor: "#F1C40F", // Amarillo vivo
        paddingHorizontal: width * 0.06,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#D4AC0D",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    topTagText: {
        fontFamily: FONTS.display,
        color: "#fff",
        fontSize: width * 0.05,
        textShadowColor: "rgba(0,0,0,0.2)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },

    // Tarjeta principal (Cielo azul)
    card: {
        borderRadius: width * 0.05,
        borderWidth: 3, // Borde para definirla mejor en la tienda
        borderColor: "#2980B9",
        overflow: "hidden",
        paddingTop: 24,
        paddingBottom: 16,
        position: "relative",
    },

    /* Formas del fondo (Nubes) */
    cloud1: { position: "absolute", width: 100, height: 40, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 50, top: 20, left: -20 },
    cloud2: { position: "absolute", width: 120, height: 50, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 60, top: 60, right: -30 },
    cloud3: { position: "absolute", width: 80, height: 30, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 40, top: 120, left: "30%" },

    /* Césped (Hillish bottom) */
    grassContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
        zIndex: 1,
    },
    grassHill: {
        width: "150%",
        height: 500,          // altura fija — el radio 800 hace el arco
        backgroundColor: "#2ECC71",
        position: "absolute",
        bottom: -420,         // fijo: siempre deja ~80px del arco visible al fondo del card
        left: "-25%",
        borderRadius: 800,
        borderTopWidth: 4,
        borderTopColor: "#27AE60",
        overflow: "hidden",
    },

    /* Detalles Mexicanos */
    papelPicadoContainer: {
        position: "absolute",
        top: -5,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 10,
        zIndex: 2,
    },
    papelPicado: {
        width: 35,
        height: 30,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: "2deg" }],
    },
    papelHole: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#56CCF2", // Mismo azul que el cielo detrás para simular un hueco
    },
    papelCutout: {
        position: 'absolute',
        bottom: -4,
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: "#56CCF2",
    },
    cactusLeft: {
        position: "absolute",
        top: 50,
        left: "30%",
        fontSize: 40,
        opacity: 0.85,
        transform: [{ rotate: "-10deg" }],
    },
    cactusRight: {
        position: "absolute",
        top: 80,
        left: "70%",
        fontSize: 55,
        opacity: 0.85,
        transform: [{ rotate: "5deg" }, { scaleX: -1 }],
    },

    // Cabecera central (Timer)
    headerRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 4,
        zIndex: 5,
    },
    timerBubble: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(241, 196, 15, 0.9)", // Amarillo translucido
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
    },
    timerIcon: { fontSize: 13 },
    timerText: {
        fontFamily: FONTS.bodyBold,
        color: "#fff",
        fontSize: 14,
    },
    bundleTitle: {
        fontFamily: FONTS.display,
        color: "#fff",
        fontSize: width * 0.045,
        textAlign: "center",
        marginBottom: 12,
        zIndex: 5,
        textShadowColor: "rgba(0,0,0,0.4)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },

    // Sello de "TIEMPO LIMITADO" (Star shaped look via rotation)
    limitedTag: {
        position: "absolute",
        top: 15,
        right: 10,
        backgroundColor: RED_TAG,
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: "center",
        alignItems: "center",
        transform: [{ rotate: "15deg" }],
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        borderWidth: 1.5,
        borderColor: "#fff",
    },
    limitedTagText: {
        fontFamily: FONTS.bodyBold,
        color: "#fff",
        fontSize: 9,
        textAlign: "center",
        lineHeight: 11,
    },

    // Content (Píldoras vs Imagen)
    contentRow: {
        flexDirection: "row",
        paddingHorizontal: width * 0.05,
        zIndex: 5,
        marginBottom: height * 0.02,
        alignItems: "center",
    },
    rewardsCol: {
        flex: 1.2,
        justifyContent: "center",
        gap: height * 0.012,
    },
    rewardPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: width * 0.05,
        paddingVertical: height * 0.01,
        paddingHorizontal: width * 0.04,
        alignSelf: "flex-start",
        shadowColor: "#E67E22",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        borderWidth: 2,
        borderColor: "#F39C12",
    },
    rewardEmoji: {
        fontSize: Math.min(width * 0.07, 36),
        marginRight: width * 0.02
    },
    rewardQty: {
        fontFamily: FONTS.display,
        color: "#D35400",
        fontSize: Math.min(width * 0.055, 28),
    },

    illustrationCol: {
        flex: 1,
        alignItems: "flex-end",
        justifyContent: "flex-end",
    },
    illustrationImg: {
        width: width * 0.35,
        height: width * 0.35,
        resizeMode: "contain",
    },

    // Botón final
    btnWrap: {
        alignItems: "center",
        zIndex: 5,
        marginTop: 10,
    },
    buyBtn: {
        backgroundColor: "#F1C40F", // Amarillo vivo
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: "#D4AC0D",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        minWidth: "60%",
    },
    buyBtnText: {
        fontFamily: FONTS.display,
        color: "#523600",
        fontSize: 22,
        textAlign: "center",
    },
});
