import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

// Combo tiers — visual label/color/multiplier
function getTier(combo) {
  if (combo >= 10) return { color: "#FFD700", label: "LEGENDARIO!", multiplier: "2x", crown: true };
  if (combo >= 5)  return { color: "#FF4500", label: "¡IMPARABLE!", multiplier: "1.5x", crown: false };
  if (combo >= 3)  return { color: "#FF6B35", label: "¡ÓRALE!",     multiplier: "1.25x", crown: false };
  return                   { color: "#FF6B35", label: "",            multiplier: "",      crown: false };
}

// Animation intensity by combo level
function getIntensity(combo) {
  if (combo >= 6) return 3;
  if (combo >= 4) return 2;
  return 1;
}

// Per-intensity animation parameters
const INTENSITY_PARAMS = {
  1: { peakScale: 1.35, friction: 5, tension: 180, floatAmplitude: 4, floatPeriod: 1100 },
  2: { peakScale: 1.50, friction: 4, tension: 200, floatAmplitude: 6, floatPeriod: 800  },
  3: { peakScale: 1.65, friction: 3, tension: 220, floatAmplitude: 7, floatPeriod: 650  },
};

// Fire particle config
const NUM_PARTICLES = 8;
const PARTICLE_COLORS = ["#FF6B35", "#FF4500", "#FFD700", "#FF8C00", "#FF0000", "#FFA500", "#FFCC00", "#FF3300"];

/**
 * EnhancedComboCounter — combo banner with elastic pop, idle float, and intensity-based glow.
 *
 * Props:
 *   comboCount: number   — current combo (determines tier, intensity, and label)
 *   visible:    boolean  — controlled by useCombo hook; drives show/hide animation
 *
 * Animation layers:
 *   1. Entry spring-in (scale 0.2→1, fade in) — on first appearance only
 *   2. Pop bump (quick scale spike + spring back) — on every increment + entry
 *   3. Float loop (continuous Y oscillation) — while visible, speed/amplitude by intensity
 *   4. Glow ring pulse — only for combo x6+
 *   5. Screen flash + fire particles — unchanged from original
 */
function EnhancedComboCounter({ comboCount, visible }) {
  // Existing animated values
  const scaleAnim   = useRef(new Animated.Value(0.2)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flashAnim   = useRef(new Animated.Value(0)).current;

  // New animated values
  const floatAnim   = useRef(new Animated.Value(0)).current;
  const bumpScale   = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Loop handles and increment tracker
  const floatLoopRef = useRef(null);
  const glowLoopRef  = useRef(null);
  const prevComboRef = useRef(null);

  // Particle animations — stable across renders
  const particles = useMemo(() =>
    Array.from({ length: NUM_PARTICLES }).map(() => ({
      y:       new Animated.Value(0),
      x:       new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale:   new Animated.Value(0),
    })),
    []
  );

  useEffect(() => {
    if (visible && comboCount >= 2) {
      const isIncrement = prevComboRef.current !== null && comboCount > prevComboRef.current;
      prevComboRef.current = comboCount;

      const intensity = getIntensity(comboCount);
      const { peakScale, friction, tension, floatAmplitude, floatPeriod } = INTENSITY_PARAMS[intensity];

      // ── Entry spring-in (first appearance only, not on subsequent increments) ─
      if (!isIncrement) {
        scaleAnim.stopAnimation();
        opacityAnim.stopAnimation();
        scaleAnim.setValue(0.2);

        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 140,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        // ── Fire particles (entry only) ──────────────────────────────────────────
        particles.forEach((p, i) => {
          const delay  = i * 40;
          const angle  = (Math.PI * 2 * i) / NUM_PARTICLES;
          const spread = 20 + Math.random() * 30;

          p.y.setValue(0);
          p.x.setValue(0);
          p.opacity.setValue(0);
          p.scale.setValue(0);

          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(p.y, {
                toValue: -(40 + Math.random() * 50),
                duration: 600 + Math.random() * 300,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(p.x, {
                toValue: Math.cos(angle) * spread,
                duration: 600 + Math.random() * 300,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(p.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
              ]),
              Animated.sequence([
                Animated.timing(p.scale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
                Animated.timing(p.scale, { toValue: 0,   duration: 500, useNativeDriver: true }),
              ]),
            ]),
          ]).start();
        });
      }

      // ── Pop bump (elastic spike on every appearance + every increment) ────────
      bumpScale.stopAnimation();
      bumpScale.setValue(1);
      Animated.sequence([
        Animated.timing(bumpScale, {
          toValue: peakScale,
          duration: 60,
          easing: Easing.out(Easing.back(3)),
          useNativeDriver: true,
        }),
        Animated.spring(bumpScale, {
          toValue: 1,
          friction,
          tension,
          useNativeDriver: true,
        }),
      ]).start();

      // ── Float loop (restart to apply updated speed when tier changes) ─────────
      floatLoopRef.current?.stop();
      floatAnim.setValue(0);
      floatLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -floatAmplitude,
            duration: floatPeriod,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: floatAmplitude,
            duration: floatPeriod,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      floatLoopRef.current.start();

      // ── Screen flash for large combos (unchanged) ─────────────────────────────
      if (comboCount >= 5) {
        const flashOpacity = comboCount >= 10 ? 1 : 0.5;
        const flashDuration = comboCount >= 10 ? 150 : 100;
        flashAnim.setValue(flashOpacity);
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: flashDuration,
          useNativeDriver: true,
        }).start();
      }

      // ── Glow ring pulse (tier 3: x6+) ────────────────────────────────────────
      glowLoopRef.current?.stop();
      if (comboCount >= 6) {
        glowLoopRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.35, duration: 600, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.10, duration: 600, useNativeDriver: true }),
          ])
        );
        glowLoopRef.current.start();
      } else {
        glowOpacity.setValue(0);
      }

    } else {
      // ── Animate OUT ───────────────────────────────────────────────────────────
      floatLoopRef.current?.stop();
      glowLoopRef.current?.stop();
      floatAnim.setValue(0);
      glowOpacity.setValue(0);
      prevComboRef.current = null;

      opacityAnim.stopAnimation();
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      scaleAnim.setValue(0.2); // reset for next entry animation
    }
  }, [visible, comboCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep out of the DOM when no active combo
  if (comboCount < 2) return null;

  const tier = getTier(comboCount);

  return (
    <>
      {/* Screen flash overlay */}
      <Animated.View
        style={[
          styles.flash,
          {
            opacity: flashAnim,
            backgroundColor: comboCount >= 10 ? "#FFD700" : "#FF6B35",
          },
        ]}
        pointerEvents="none"
      />

      {/* Outer layer: entry spring-in + fade */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        pointerEvents="none"
      >
        {/* Glow ring — only for x6+ combos, behind content */}
        {comboCount >= 6 && (
          <Animated.View
            style={[
              styles.glowRing,
              { opacity: glowOpacity, backgroundColor: tier.color },
            ]}
          />
        )}

        {/* Inner layer: idle float + pop bump */}
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ translateY: floatAnim }, { scale: bumpScale }],
          }}
        >
          {/* Fire particles */}
          {particles.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                width: 8 + (i % 3) * 3,
                height: 8 + (i % 3) * 3,
                borderRadius: 10,
                backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
                opacity: p.opacity,
                transform: [
                  { translateY: p.y },
                  { translateX: p.x },
                  { scale: p.scale },
                ],
              }}
            />
          ))}

          {/* Crown for 10+ */}
          {tier.crown && <Text style={styles.crown}>👑</Text>}

          {/* Combo number */}
          <Text style={[styles.comboNumber, { color: tier.color }]}>
            🔥 x{comboCount}
          </Text>

          {/* Motivational text */}
          {tier.label ? (
            <Text style={[styles.label, { color: tier.color }]}>{tier.label}</Text>
          ) : null}

          {/* Multiplier badge */}
          {tier.multiplier ? (
            <View style={[styles.multiplierBadge, { borderColor: tier.color }]}>
              <Text style={[styles.multiplierText, { color: tier.color }]}>
                {tier.multiplier} Monedas
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 500,
  },
  container: {
    position: "absolute",
    top: height * 0.38,
    alignSelf: "center",
    zIndex: 200,
    alignItems: "center",
  },
  glowRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    alignSelf: "center",
  },
  crown: {
    fontSize: 24,
    marginBottom: -6,
  },
  comboNumber: {
    fontSize: width * 0.12,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  label: {
    fontSize: width * 0.05,
    fontWeight: "900",
    marginTop: -4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  multiplierBadge: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  multiplierText: {
    fontSize: width * 0.03,
    fontWeight: "bold",
  },
});

export default React.memo(EnhancedComboCounter);
