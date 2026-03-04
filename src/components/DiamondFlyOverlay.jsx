import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { playSound } from "../utils/soundManager";

// ── Single flying diamond
function DiamondFly({ diamond, onDiamondArrived, isFirst }) {
    const { id, batchId, fromX, fromY, toX, toY, cpX, cpY, delay, duration } = diamond;
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const start = () => {
            // Usar sonido de milestone o un sonido que sirva para diamantes
            if (isFirst) playSound("milestone");
            Animated.timing(progress, {
                toValue: 1,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) onDiamondArrived(id, batchId, toX, toY);
            });
        };
        if (delay > 0) {
            const timer = setTimeout(start, delay);
            return () => clearTimeout(timer);
        }
        start();
    }, []);

    const midX = 0.25 * fromX + 0.5 * cpX + 0.25 * toX - fromX;
    const midY = 0.25 * fromY + 0.5 * cpY + 0.25 * toY - fromY;

    const translateX = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, midX, toX - fromX],
        extrapolate: "clamp",
    });

    const translateY = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, midY, toY - fromY],
        extrapolate: "clamp",
    });

    const opacity = progress.interpolate({
        inputRange: [0, 0.06, 0.88, 1],
        outputRange: [0, 1, 1, 0],
        extrapolate: "clamp",
    });

    const scale = progress.interpolate({
        inputRange: [0, 0.08, 0.88, 1],
        outputRange: [0.8, 1.0, 1.0, 1.12],
        extrapolate: "clamp",
    });

    return (
        <Animated.Image
            source={require("../../assets/icons/diamond.png")}
            style={{
                position: "absolute",
                left: fromX - 12,
                top: fromY - 12,
                width: 26,
                height: 26,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
            }}
        />
    );
}

// ── Impact particle burst (blue/cyan for diamonds)
function ImpactParticles({ x, y }) {
    const particles = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 14 + Math.random() * 16;
            return {
                anim: new Animated.Value(0),
                dx: Math.cos(angle) * dist,
                dy: Math.sin(angle) * dist,
            };
        }), []);

    useEffect(() => {
        Animated.stagger(
            18,
            particles.map((p) =>
                Animated.timing(p.anim, {
                    toValue: 1,
                    duration: 380,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                })
            )
        ).start();
    }, []);

    return (
        <>
            {particles.map((p, i) => (
                <Animated.View
                    key={i}
                    style={{
                        position: "absolute",
                        left: x - 3,
                        top: y - 3,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#00E5FF", // Cyan color for diamonds
                        opacity: p.anim.interpolate({
                            inputRange: [0, 0.6, 1],
                            outputRange: [1, 0.8, 0],
                        }),
                        transform: [
                            { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                            { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
                            { scale: p.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.6, 1.2, 0.4] }) },
                        ],
                    }}
                />
            ))}
        </>
    );
}

// ── Main overlay
export default function DiamondFlyOverlay({ diamonds, particles, onDiamondArrived }) {
    return (
        <View style={styles.overlay} pointerEvents="none">
            {diamonds.map((diamond, idx) => (
                <DiamondFly key={diamond.id} diamond={diamond} onDiamondArrived={onDiamondArrived} isFirst={idx === 0} />
            ))}
            {particles.map((p) => (
                <ImpactParticles key={p.id} x={p.x} y={p.y} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
    },
});
