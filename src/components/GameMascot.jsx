import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";
import MascotaEngine from "../mascota/MascotaEngine";
import { tapLight, tapMedium } from "../services/haptics";
import { playSound } from "../utils/soundManager";

// Tap phrases for in-game reactions
const GAME_TAP_PHRASES = [
  "¡Tú puedes!",
  "¡Ánimo! 💪",
  "¡Dale!",
  "¡Órale!",
  "¡Eso! ✨",
  "¡Sí se puede!",
  "¡Vamos!",
  "🔥🔥🔥",
  "¡Échale ganas!",
  "¡A huevo!",
  "¡Chido!",
  "¡Qué crack! 🌟",
  "¡Mátenme! 😂",
  "¡Arriba México!",
  "¡Puro talento!",
];

const STAGE_NAMES = {
  1: "Cría",
  2: "Juvenil",
  3: "Guardián",
  4: "Mítico",
};

/**
 * GameMascot — wraps MascotaEngine (3D) with:
 *   - Temporary state + speech bubble
 *   - Tap-to-interact (reacts with phrase + animation + haptic)
 *   - Draggable (long-press to move, won't collide with keyboard)
 *
 * Props:
 *   mascotaState  – "idle" | "celebrating" | "sad"
 *   height        – 3D canvas height (default 120)
 *   petType       – "ajolote" | "xolo" | "alebrije"
 *   stage         – 1-4
 *   showBubble    – string to display in speech bubble (auto-dismiss 2.5s)
 *   streakDays    – days of consecutive play (drives 3D tier visuals)
 *   boostActive   – trigger burst animation on first word of day
 *   interactive   – enable tap + drag (default true)
 */
export default function GameMascot({
  mascotaState = "idle",
  height = 120,
  petType = "ajolote",
  stage = 1,
  showBubble,
  streakDays = 0,
  boostActive = false,
  interactive = true,
}) {
  // Auto-revert to idle after reaction
  const [activeState, setActiveState] = useState(mascotaState);
  const revertTimer = useRef(null);

  useEffect(() => {
    setActiveState(mascotaState);
    if (mascotaState !== "idle") {
      clearTimeout(revertTimer.current);
      revertTimer.current = setTimeout(() => setActiveState("idle"), 2500);
    }
    return () => clearTimeout(revertTimer.current);
  }, [mascotaState]);

  // Bubble (from props or from tap)
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTimer = useRef(null);

  const showBubbleMsg = useCallback((msg) => {
    clearTimeout(bubbleTimer.current);
    setBubbleText(msg);
    setBubbleVisible(true);
    bubbleOpacity.setValue(0);
    Animated.timing(bubbleOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    bubbleTimer.current = setTimeout(() => {
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setBubbleVisible(false);
        setBubbleText("");
      });
    }, 2000);
  }, [bubbleOpacity]);

  // External bubble from props
  useEffect(() => {
    if (showBubble) {
      showBubbleMsg(showBubble);
    }
  }, [showBubble, showBubbleMsg]);

  // ── Level-up / evolution detection ──
  const prevStageRef = useRef(stage);
  useEffect(() => {
    if (stage > prevStageRef.current) {
      const stageName = STAGE_NAMES[stage] ?? `Nivel ${stage}`;
      showBubbleMsg(`¡Evolucioné! ✨ ${stageName}`);
      setActiveState("streakRecord");
      clearTimeout(revertTimer.current);
      revertTimer.current = setTimeout(() => setActiveState("idle"), 3500);
    }
    prevStageRef.current = stage;
  }, [stage, showBubbleMsg]);

  // ── Tap interaction ──
  const [tapBoost, setTapBoost] = useState(false);
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  const handleTap = useCallback(() => {
    if (!interactive) return;

    const now = Date.now();
    if (now - lastTapRef.current > 2000) tapCountRef.current = 0;
    lastTapRef.current = now;
    tapCountRef.current += 1;

    // Haptic + sound
    if (tapCountRef.current >= 4) {
      tapMedium();
    } else {
      tapLight();
    }
    playSound("click");

    // Random phrase
    const phrase = GAME_TAP_PHRASES[Math.floor(Math.random() * GAME_TAP_PHRASES.length)];
    showBubbleMsg(phrase);

    // Animation
    if (tapCountRef.current >= 4) {
      setActiveState("celebrating");
      setTapBoost(true);
      clearTimeout(revertTimer.current);
      revertTimer.current = setTimeout(() => {
        setActiveState(mascotaState !== "idle" ? mascotaState : "idle");
        setTapBoost(false);
      }, 2500);
    } else {
      setActiveState("happy");
      clearTimeout(revertTimer.current);
      revertTimer.current = setTimeout(() => {
        setActiveState(mascotaState !== "idle" ? mascotaState : "idle");
      }, 1200);
    }
  }, [interactive, mascotaState, showBubbleMsg]);

  // ── Draggable via PanResponder ──
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);
  const dragStartTime = useRef(0);
  const currentOffset = useRef({ x: 0, y: 0 });
  const handleTapRef = useRef(handleTap);
  handleTapRef.current = handleTap;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => {
        return Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5;
      },
      onPanResponderGrant: () => {
        dragStartTime.current = Date.now();
        isDragging.current = false;
        pan.setOffset(currentOffset.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5) {
          isDragging.current = true;
        }
        pan.setValue({ x: gs.dx, y: gs.dy });
      },
      onPanResponderRelease: (_, gs) => {
        currentOffset.current = {
          x: currentOffset.current.x + gs.dx,
          y: currentOffset.current.y + gs.dy,
        };
        pan.flattenOffset();
        if (!isDragging.current && Date.now() - dragStartTime.current < 300) {
          handleTapRef.current();
        }
        isDragging.current = false;
      },
    })
  ).current;

  const resolvedState = activeState === "celebrating" ? "happy" : activeState;

  return (
    <Animated.View
      style={[
        styles.container,
        { height: height + 30 },
        interactive && { transform: pan.getTranslateTransform() },
      ]}
      {...(interactive ? panResponder.panHandlers : {})}
    >
      {/* Bubble */}
      {bubbleVisible && bubbleText ? (
        <Animated.View style={[styles.bubble, { opacity: bubbleOpacity }]}>
          <Text style={styles.bubbleText}>{bubbleText}</Text>
          <View style={styles.bubbleTail} />
        </Animated.View>
      ) : null}

      <MascotaEngine
        petType={petType}
        stage={stage}
        mascotaState={resolvedState}
        height={height}
        streakDays={streakDays}
        boostActive={boostActive || tapBoost}
        onTap={interactive ? handleTap : undefined}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bubble: {
    position: "absolute",
    top: -4,
    backgroundColor: "rgba(0,0,0,0.82)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
    maxWidth: 120,
  },
  bubbleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  bubbleTail: {
    position: "absolute",
    bottom: -5,
    alignSelf: "center",
    left: "45%",
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(0,0,0,0.82)",
  },
});
