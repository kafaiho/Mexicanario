import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { playSound } from "../utils/soundManager";

const ICONS = {
  coin: require("../../assets/icons/coin.png"),
  diamond: require("../../assets/icons/diamond.png"),
};
const PARTICLE_COLORS = {
  coin: ["#FFD700", "#FFB300", "#FFF3B0"],
  diamond: ["#00E5FF", "#80F7FF", "#B388FF"],
};
const LAUNCH_SOUND = { coin: "coin", diamond: "milestone" };

// Muestras del bezier cuadrático (relativas al punto de explosión) para que el
// arco se vea curvo aunque `interpolate` sea lineal por tramos.
const SAMPLES = [0, 0.2, 0.4, 0.6, 0.8, 1];
const MAGNET_EASING = Easing.bezier(0.45, 0, 0.85, 0.45); // lento al salir, rápido al llegar

function bezierOffsets(sx, sy, cx, cy, tx, ty) {
  const xs = [];
  const ys = [];
  for (const t of SAMPLES) {
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    xs.push(a * sx + b * cx + c * tx - sx);
    ys.push(a * sy + b * cy + c * ty - sy);
  }
  return { xs, ys };
}

// ── Pieza individual ─────────────────────────────────────────────────────────
function FlyingItem({ item, onArrived, isFirst }) {
  const { id, batchId, kind, fromX, fromY, toX, toY, burstX, burstY, cpX, cpY,
    burstDelay, holdDelay, duration, size, spinDir } = item;
  const burst = useRef(new Animated.Value(0)).current;
  const fly = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFirst) playSound(LAUNCH_SOUND[kind], kind === "coin" ? 0.85 : 1);
    const anim = Animated.sequence([
      Animated.delay(burstDelay),
      Animated.timing(burst, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.back(1.8)),
        useNativeDriver: true,
      }),
      Animated.delay(holdDelay),
      Animated.timing(fly, {
        toValue: 1,
        duration,
        easing: MAGNET_EASING,
        useNativeDriver: true,
      }),
    ]);
    anim.start(({ finished }) => {
      if (finished) onArrived(id, batchId, toX, toY);
    });
    return () => anim.stop();
  }, []);

  const style = useMemo(() => {
    const sx = fromX + burstX;
    const sy = fromY + burstY;
    const { xs, ys } = bezierOffsets(sx, sy, cpX, cpY, toX, toY);

    const translateX = Animated.add(
      burst.interpolate({ inputRange: [0, 1], outputRange: [0, burstX] }),
      fly.interpolate({ inputRange: SAMPLES, outputRange: xs })
    );
    const translateY = Animated.add(
      burst.interpolate({ inputRange: [0, 1], outputRange: [0, burstY] }),
      fly.interpolate({ inputRange: SAMPLES, outputRange: ys })
    );
    const opacity = Animated.multiply(
      burst.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1], extrapolate: "clamp" }),
      fly.interpolate({ inputRange: [0, 0.9, 1], outputRange: [1, 1, 0], extrapolate: "clamp" })
    );
    const scale = Animated.multiply(
      burst.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
      fly.interpolate({ inputRange: [0, 0.15, 1], outputRange: [1, 1.12, 0.7], extrapolate: "clamp" })
    );
    // Moneda: se "voltea" (scaleX oscila). Diamante: gira sobre sí mismo.
    const spin = kind === "coin"
      ? { scaleX: fly.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.2, 1, 0.2, 1] }) }
      : { rotate: fly.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${spinDir * 300}deg`] }) };

    return {
      position: "absolute",
      left: fromX - size / 2,
      top: fromY - size / 2,
      width: size,
      height: size,
      opacity,
      transform: [{ translateX }, { translateY }, { scale }, spin],
    };
  }, []);

  return <Animated.Image source={ICONS[kind]} style={style} />;
}

// Con "reducir movimiento": no hay vuelo, pero el contador y el sonido
// siguen avanzando moneda por moneda.
function StillItem({ item, onArrived }) {
  useEffect(() => {
    const t = setTimeout(() => onArrived(item.id, item.batchId, item.toX, item.toY), 60 + item.index * 40);
    return () => clearTimeout(t);
  }, []);
  return null;
}

// ── Chispas al llegar (la última pieza hace una onda más grande) ─────────────
function ImpactParticles({ x, y, big, kind }) {
  const count = big ? 10 : 5;
  const colors = PARTICLE_COLORS[kind] ?? PARTICLE_COLORS.coin;
  const parts = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const dist = (big ? 22 : 14) + Math.random() * (big ? 22 : 16);
      return { anim: new Animated.Value(0), dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, color: colors[i % colors.length] };
    }), []);
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anims = parts.map((p) =>
      Animated.timing(p.anim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    );
    if (big) anims.push(Animated.timing(ring, { toValue: 1, duration: 460, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    Animated.parallel(anims).start();
  }, []);

  return (
    <>
      {big && (
        <Animated.View
          style={{
            position: "absolute",
            left: x - 18,
            top: y - 18,
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 3,
            borderColor: colors[0],
            opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.8] }) }],
          }}
        />
      )}
      {parts.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: x - 3,
            top: y - 3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: p.color,
            opacity: p.anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.8, 0] }),
            transform: [
              { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
              { scale: p.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.6, 1.3, 0.4] }) },
            ],
          }}
        />
      ))}
    </>
  );
}

function RewardFlyOverlay({ items, particles, onArrived, zIndex = 999 }) {
  const reduceMotion = useReducedMotion();
  return (
    <View style={[styles.overlay, { zIndex, elevation: zIndex }]} pointerEvents="none">
      {items.map((item) =>
        reduceMotion
          ? <StillItem key={item.id} item={item} onArrived={onArrived} />
          : <FlyingItem key={item.id} item={item} onArrived={onArrived} isFirst={item.index === 0} />
      )}
      {!reduceMotion && particles.map((p) => (
        <ImpactParticles key={p.id} x={p.x} y={p.y} big={p.big} kind={p.kind} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default React.memo(RewardFlyOverlay);
