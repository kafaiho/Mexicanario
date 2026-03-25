import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";
import JuicyButton from "../components/JuicyButton";
import PvPMatchmakingModal from "../components/PvPMatchmakingModal";
import PvPResultModal from "../components/PvPResultModal";
import { notifyError, notifySuccess, tapMedium } from "../services/haptics";
import { playBGM, playSound, stopBGM } from "../utils/soundManager";
import { compareWordsFlexibly, normalizeWordForDisplay } from "../utils/textUtils";
import { TABLET_MODE } from "../utils/tabletSetup";
import { useKeyboardLayout } from "../hooks/useKeyboardLayout";

const { width, height } = Dimensions.get("window");

// ── Colors ──────────────────────────────────────────────────────────────────
const GOLD = "#F8BE17";
const GREEN = "#27AE60";
const RED = "#C0392B";
const DARK_BG = "#1A0A00";

const PVP_WORDS_COUNT = 5;
const PVP_DURATION_SECS = 90;

const TILE_SCALE = TABLET_MODE ? 1.4 : 1;

// Static keyboard key widths (same formula as useKeyboardLayout)
const _PVP_KB_MARGIN = TABLET_MODE ? 3 : 2;
const _PVP_KB_USABLE = TABLET_MODE
  ? (Math.min(Dimensions.get('screen').width, Dimensions.get('screen').height) - 60)
  : (width - 28);
const _PVP_KB_KEY_W = Math.floor((_PVP_KB_USABLE - 10 * _PVP_KB_MARGIN * 2) / 10);
const _PVP_KB_SPECIAL_W = Math.floor((_PVP_KB_USABLE - 7 * _PVP_KB_KEY_W - 9 * _PVP_KB_MARGIN * 2) / 2);

const KEYBOARD_LAYOUT = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
  ["CLEAR_ALL", "Z", "X", "C", "V", "B", "N", "M", "DELETE_ONE"],
];

// ── LetterTile (same as GameplayScreen, minus isFixed/isWrong) ──────────────
const LetterTile = React.memo(function LetterTile({
  idx, ch, isSelected, isCorrect,
  scaleAnim, boxSize, boxHeight, fontSize, marginH, onSelectBox,
}) {
  return (
    <TouchableOpacity onPress={() => onSelectBox(idx)} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View
          style={[
            styles.letterBox,
            { width: boxSize, height: boxHeight, marginHorizontal: marginH },
            isSelected && styles.letterBoxSelected,
            isCorrect && styles.letterBoxCorrect,
          ]}
        >
          <Text
            style={[
              styles.letterText,
              { fontSize },
              isCorrect && styles.letterTextCorrect,
            ]}
          >
            {ch}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// ═══  PvPScreen  ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

export default function PvPScreen({ navigation, route }) {
  // BGM — minigame track while in PvP
  useEffect(() => { playBGM("minigame"); return () => { stopBGM(); playBGM("menu"); }; }, []);

  // ── Dynamic keyboard + landscape layout ──
  const kb = useKeyboardLayout({ portraitHeight: 340 });

  const { userId } = useAuth();
  const matchId = route?.params?.matchId;
  const friendInviteId = route?.params?.friendInviteId;

  const [showMatchmaking, setShowMatchmaking] = useState(!matchId);
  const [activeMatchId, setActiveMatchId] = useState(matchId || null);
  const [showResult, setShowResult] = useState(false);

  // Game state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guess, setGuess] = useState([]);
  const [selectedBox, setSelectedBox] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [wordStartTime, setWordStartTime] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCorrectWord, setIsCorrectWord] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Mutations
  const submitWord = useMutation(api.pvp.submitWordResult);
  const leaveQueue = useMutation(api.pvp.leaveQueue);
  const abandonMatch = useMutation(api.pvp.abandonMatch);
  const activateMatch = useMutation(api.pvp.activateMatch);
  const checkMatchTimeout = useMutation(api.pvp.checkMatchTimeout);

  // Query match state (reactive)
  const matchState = useQuery(
    api.pvp.getMatchState,
    activeMatchId ? { matchId: activeMatchId } : "skip"
  );

  // Determine which player we are
  const isP1 = matchState?.player1?.id === userId;
  const myProgress = isP1 ? matchState?.player1?.progress ?? 0 : matchState?.player2?.progress ?? 0;
  const oppProgress = isP1 ? matchState?.player2?.progress ?? 0 : matchState?.player1?.progress ?? 0;
  const opponent = isP1 ? matchState?.player2 : matchState?.player1;

  // Current word
  const currentWord = useMemo(() => {
    if (!matchState?.words || currentWordIndex >= matchState.words.length) return null;
    return matchState.words[currentWordIndex];
  }, [matchState?.words, currentWordIndex]);

  const displayWord = useMemo(() => {
    if (!currentWord) return "";
    return normalizeWordForDisplay(currentWord.word);
  }, [currentWord]);

  // ── Animations ──────────────────────────────────────────────────────────────
  const scaleAnims = useMemo(
    () => Array(40).fill(0).map(() => new Animated.Value(1)),
    []
  );
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const bounceAtIndex = useCallback((idx) => {
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 1.18, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnims[idx], { toValue: 1, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [scaleAnims]);

  const celebrate = useCallback(() => {
    const anims = Array.from(displayWord).reduce((acc, ch, i) => {
      if (ch !== " ") {
        acc.push(
          Animated.sequence([
            Animated.timing(scaleAnims[i], { toValue: 1.15, duration: 80, useNativeDriver: true }),
            Animated.spring(scaleAnims[i], { toValue: 1.0, friction: 5, tension: 280, useNativeDriver: true }),
          ])
        );
      }
      return acc;
    }, []);
    Animated.stagger(20, anims).start();
  }, [displayWord, scaleAnims]);

  const shakeRow = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // ── Word segments (multi-word support with dynamic sizing) ────────────────
  const wordSegments = useMemo(() => {
    if (!displayWord) return [];
    const segs = [];
    let cur = { startIdx: 0, letters: "" };
    for (let i = 0; i < displayWord.length; i++) {
      if (displayWord[i] === " ") {
        segs.push(cur);
        cur = { startIdx: i + 1, letters: "" };
      } else {
        cur.letters += displayWord[i];
      }
    }
    segs.push(cur);
    return segs.map((seg) => {
      const wordLength = seg.letters.length;
      let boxSize = Math.round(38 * TILE_SCALE);
      let boxHeight = Math.round(42 * TILE_SCALE);
      let fontSize = Math.round(20 * TILE_SCALE);
      let marginH = Math.round(2 * TILE_SCALE);
      if (wordLength > 7) {
        const scale = Math.max(0.65, 7.5 / wordLength);
        boxSize = Math.floor(38 * TILE_SCALE * scale);
        boxHeight = Math.floor(42 * TILE_SCALE * scale);
        fontSize = Math.floor(20 * TILE_SCALE * scale);
        marginH = Math.max(0.5, Math.floor(2 * TILE_SCALE * scale));
      }
      return { ...seg, boxSize, boxHeight, fontSize, marginH };
    });
  }, [displayWord]);

  // ── Safety net: always unlock input when word index changes ──────────────
  useEffect(() => {
    setIsCorrectWord(false);
    setTransitioning(false);
  }, [currentWordIndex]);

  // ── Init guess when word changes ──────────────────────────────────────────
  useEffect(() => {
    if (displayWord) {
      const initial = Array.from(displayWord).map((ch) => (ch === " " ? " " : ""));
      setGuess(initial);
      const firstEmpty = initial.findIndex((ch) => ch !== " ");
      setSelectedBox(firstEmpty >= 0 ? firstEmpty : 0);
      setAttempts(0);
      setWordStartTime(Date.now());
      setIsCorrectWord(false);
      setTransitioning(false);
      // Reset scale anims
      scaleAnims.forEach((a) => a.setValue(1));
    }
  }, [displayWord]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (matchState?.status === "countdown" && matchState?.startTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((matchState.startTime - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          setGameStarted(true);
          activateMatch({ matchId: activeMatchId }).catch(() => {});
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
    if (matchState?.status === "active") {
      setGameStarted(true);
    }
  }, [matchState?.status, matchState?.startTime]);

  // ── Match timer ───────────────────────────────────────────────────────────
  const [timeRemaining, setTimeRemaining] = useState(PVP_DURATION_SECS);
  const timerPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!gameStarted || !matchState?.startTime || matchState?.status === "finished") return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - matchState.startTime;
      const maxMs = matchState.maxDurationMs || PVP_DURATION_SECS * 1000;
      const remaining = Math.max(0, Math.floor((maxMs - elapsed) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        checkMatchTimeout({ matchId: activeMatchId }).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, matchState?.startTime, matchState?.status]);

  // Timer urgency pulse when <=15s
  useEffect(() => {
    if (timeRemaining <= 15 && timeRemaining > 0 && gameStarted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulse, { toValue: 1.15, duration: 400, useNativeDriver: true }),
          Animated.timing(timerPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      timerPulse.setValue(1);
    }
  }, [timeRemaining <= 15 && gameStarted]);

  // ── Detect match finished ─────────────────────────────────────────────────
  useEffect(() => {
    if (matchState?.status === "finished" || matchState?.status === "abandoned" || matchState?.status === "ghost") {
      setShowResult(true);
    }
  }, [matchState?.status]);

  // ── Opponent progress flash ───────────────────────────────────────────────
  const oppFlash = useRef(new Animated.Value(0)).current;
  const prevOppProgress = useRef(0);
  useEffect(() => {
    if (oppProgress > prevOppProgress.current) {
      tapMedium();
      Animated.sequence([
        Animated.timing(oppFlash, { toValue: 1, duration: 150, useNativeDriver: false }),
        Animated.timing(oppFlash, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();
    }
    prevOppProgress.current = oppProgress;
  }, [oppProgress]);

  const oppBgColor = oppFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,0,0,0)", "rgba(255,0,0,0.15)"],
  });

  // ── Key press handler (plain function — no useCallback, same pattern as GameplayScreen) ──
  const onKeyPressRef = useRef(null);
  const wrongClearTimerRef = useRef(null);

  const onKeyPress = (key) => {
    if (!gameStarted || !displayWord || isCorrectWord || transitioning) return;

    // Cancel pending wrong-answer clear AND immediately clear stale letters
    if (wrongClearTimerRef.current) {
      clearTimeout(wrongClearTimerRef.current);
      wrongClearTimerRef.current = null;
      // Clear old wrong letters so they don't trigger false validations
      const cleared = Array.from(displayWord).map((ch) => (ch === " " ? " " : ""));
      setGuess(cleared);
      const firstEmpty = cleared.findIndex((ch) => ch !== " ");
      setSelectedBox(firstEmpty >= 0 ? firstEmpty : 0);
      return; // consume this keystroke for the clear, next one starts fresh
    }

    if (key === "DELETE_ONE") {
      const newGuess = [...guess];
      const hasLetter =
        newGuess[selectedBox] &&
        newGuess[selectedBox] !== "" &&
        newGuess[selectedBox] !== " ";
      if (hasLetter) {
        newGuess[selectedBox] = "";
        setGuess(newGuess);
      }
      // Move cursor backward to previous non-space
      let prevIdx = selectedBox - 1;
      while (prevIdx >= 0 && displayWord[prevIdx] === " ") prevIdx--;
      if (prevIdx >= 0) setSelectedBox(prevIdx);
      return;
    }

    if (key === "CLEAR_ALL") {
      Animated.stagger(10,
        scaleAnims.slice(0, displayWord.length).map((anim) =>
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.8, duration: 80, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
          ])
        )
      ).start(() => {
        const cleared = Array.from(displayWord).map((ch) => (ch === " " ? " " : ""));
        setGuess(cleared);
        const firstEmpty = cleared.findIndex((ch) => ch !== " ");
        setSelectedBox(firstEmpty >= 0 ? firstEmpty : 0);
      });
      return;
    }

    // ── Letter key ──
    if (selectedBox >= displayWord.length || displayWord[selectedBox] === " ") return;

    const newGuess = [...guess];
    newGuess[selectedBox] = key;
    setGuess(newGuess);

    // Check completion BEFORE bounce — celebrate handles all tiles
    const isComplete = newGuess.every((char, i) => i >= displayWord.length || char !== "");
    if (isComplete && newGuess.length >= displayWord.length) {
      // ── Validate ──
      const guessString = newGuess.join("");
      if (compareWordsFlexibly(guessString, displayWord)) {
        // Correct!
        setIsCorrectWord(true);
        celebrate();
        notifySuccess();
        playSound("correct");

        submitWord({
          matchId: activeMatchId,
          userId,
          wordIndex: currentWordIndex,
          attempts: attempts + 1,
          timeMs: Date.now() - (wordStartTime || Date.now()),
        }).catch(console.warn);

        // Auto-advance after celebration
        setTransitioning(true);
        setTimeout(() => {
          if (currentWordIndex < PVP_WORDS_COUNT - 1) {
            setCurrentWordIndex((i) => i + 1);
          }
          setIsCorrectWord(false);
          setTransitioning(false);
        }, 600);
      } else {
        // Wrong!
        setAttempts((a) => a + 1);
        shakeRow();
        notifyError();
        playSound("wrong");
        wrongClearTimerRef.current = setTimeout(() => {
          setGuess(Array.from(displayWord).map((ch) => (ch === " " ? " " : "")));
          const firstEmpty = displayWord.split("").findIndex((ch) => ch !== " ");
          setSelectedBox(firstEmpty >= 0 ? firstEmpty : 0);
          wrongClearTimerRef.current = null;
        }, 400);
      }
    } else {
      bounceAtIndex(selectedBox);
      // Advance to next empty non-space
      let nextIdx = selectedBox + 1;
      while (nextIdx < displayWord.length && displayWord[nextIdx] === " ") nextIdx++;
      if (nextIdx < displayWord.length) {
        setSelectedBox(nextIdx);
      } else {
        // Wrap to first empty
        const emptyIdx = newGuess.findIndex(
          (ch, i) => i < displayWord.length && ch === "" && displayWord[i] !== " "
        );
        if (emptyIdx !== -1) setSelectedBox(emptyIdx);
      }
    }
  };
  onKeyPressRef.current = onKeyPress;

  // ── Stable key handlers for JuicyButton (prevent re-renders) ──────────────
  const keyHandlers = useMemo(() => {
    const handlers = {};
    KEYBOARD_LAYOUT.flat().forEach((key) => {
      handlers[key] = () => onKeyPressRef.current?.(key);
    });
    return handlers;
  }, []);

  // ── Select box callback ───────────────────────────────────────────────────
  const selectLetterBox = useCallback((idx) => {
    if (displayWord[idx] !== " " && !isCorrectWord) {
      setSelectedBox(idx);
    }
  }, [displayWord, isCorrectWord]);

  // ── Matchmaking callbacks ─────────────────────────────────────────────────
  const handleMatchFound = useCallback((mId) => {
    setActiveMatchId(mId);
    setShowMatchmaking(false);
  }, []);

  const handleCancelQueue = useCallback(() => {
    leaveQueue({ userId }).catch(() => {});
    navigation.goBack();
  }, [userId]);

  // ── Format time ───────────────────────────────────────────────────────────
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ── Dynamic styles (keyboard always at bottom) ──
  const dynamicStyles = useMemo(() => ({
    gameArea: {
      flex: 1,
      paddingTop: 8,
      paddingBottom: kb.kbHeight + 10,
    },
    keyboardContainer: {
      position: 'absolute',
      bottom: TABLET_MODE ? 20 : 0,
      left: TABLET_MODE ? 16 : 0,
      right: TABLET_MODE ? 16 : 0,
      borderRadius: TABLET_MODE ? 20 : 0,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: kb.kbHeight,
      backgroundColor: '#EAECEE',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: TABLET_MODE ? 6 : -3 },
      shadowOpacity: TABLET_MODE ? 0.28 : 0.12,
      shadowRadius: TABLET_MODE ? 14 : 8,
      elevation: 16,
    },
    keyboard: {
      width: '100%',
      paddingVertical: kb.kbPaddingV,
      paddingHorizontal: 14,
    },
    keyboardRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: kb.kbRowMarginB,
    },
    key: {
      width: kb.kbKeyW,
      height: kb.kbKeyH,
      marginHorizontal: kb.kbMargin,
      backgroundColor: 'white',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 3,
    },
    keyText: {
      fontSize: kb.kbFontSize,
      fontWeight: '800',
      color: '#1A5276',
    },
    deleteKey: { width: kb.kbSpecialW, backgroundColor: Platform.OS === "android" ? "#AEB6BF" : "#C8C8D0" },
    clearKey: { width: kb.kbSpecialW, backgroundColor: "#C8C8D0" },
    deleteIcon: { width: kb.kbIconSize, height: kb.kbIconSize, tintColor: '#1A5276' },
    deleteIconText: { fontSize: TABLET_MODE ? 28 : 20, color: '#1A5276' },
    clearIcon: { width: kb.kbIconSize, height: kb.kbIconSize, tintColor: '#C0392B' },
  }), [kb]);

  // ── Pre-computed key styles ───────────────────────────────────────────────
  const keyStylesNormal = useMemo(() => ({
    DELETE_ONE: [dynamicStyles.key, dynamicStyles.deleteKey],
    CLEAR_ALL: [dynamicStyles.key, dynamicStyles.clearKey],
  }), [dynamicStyles.key, dynamicStyles.deleteKey, dynamicStyles.clearKey]);

  if (showMatchmaking) {
    return (
      <PvPMatchmakingModal
        visible={true}
        userId={userId}
        friendInviteId={friendInviteId}
        onMatchFound={handleMatchFound}
        onCancel={handleCancelQueue}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Countdown overlay ── */}
      {!gameStarted && matchState?.status === "countdown" && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown > 0 ? countdown : "¡YA!"}</Text>
        </View>
      )}

      {/* ── Opponent strip ── */}
      <Animated.View style={[styles.oppStrip, { backgroundColor: oppBgColor }]}>
            <View style={styles.oppLeft}>
              <Text style={styles.oppAvatar}>{opponent?.avatar ?? "🌮"}</Text>
              <View>
                <Text style={styles.oppName} numberOfLines={1}>{opponent?.name ?? "Oponente"}</Text>
                <Text style={styles.oppScoreText}>Oponente: {oppProgress}/{PVP_WORDS_COUNT}</Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ scale: timerPulse }] }}>
              <Text style={[styles.timerText, timeRemaining <= 15 && styles.timerUrgent]}>
                {formatTime(timeRemaining)}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* ── Game area ── */}
          <View style={dynamicStyles.gameArea}>
            {/* My progress dots */}
            <View style={styles.myProgressRow}>
              {Array.from({ length: PVP_WORDS_COUNT }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.myProgressDot,
                    i < currentWordIndex && styles.myProgressDotDone,
                    i === currentWordIndex && styles.myProgressDotCurrent,
                  ]}
                />
              ))}
            </View>

            {/* Word counter */}
            <Text style={styles.wordCounter}>Palabra {currentWordIndex + 1} de {PVP_WORDS_COUNT}</Text>

            {/* Hint card */}
            {currentWord && (
              <View style={styles.hintCard}>
                <Text style={styles.hintLabel}>Pista:</Text>
                <Text style={styles.hintText}>{currentWord.meaning}</Text>
                {currentWord.region && (
                  <Text style={styles.hintRegion}>📍 {currentWord.region}</Text>
                )}
              </View>
            )}

            {/* ── Letter tiles (with shake transform) ── */}
            <Animated.View
              style={[
                styles.wordBoxesContainer,
                {
                  transform: [{
                    translateX: shakeAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-10, 10],
                    }),
                  }],
                },
              ]}
            >
              {wordSegments.map((seg, segIdx) => (
                <View key={segIdx} style={styles.wordRow}>
                  {segIdx > 0 && (
                    <View style={styles.wordDivider}>
                      <View style={styles.wordDividerLine} />
                    </View>
                  )}
                  <View style={styles.wordRowBoxes}>
                    {Array.from(seg.letters).map((_, letterIdx) => {
                      const idx = seg.startIdx + letterIdx;
                      const ch = guess[idx] || "";
                      const isSelected = selectedBox === idx && !isCorrectWord;
                      return (
                        <LetterTile
                          key={idx}
                          idx={idx}
                          ch={ch}
                          isSelected={isSelected}
                          isCorrect={isCorrectWord}
                          scaleAnim={scaleAnims[idx]}
                          boxSize={seg.boxSize}
                          boxHeight={seg.boxHeight}
                          fontSize={seg.fontSize}
                          marginH={seg.marginH}
                          onSelectBox={selectLetterBox}
                        />
                      );
                    })}
                  </View>
                </View>
              ))}
            </Animated.View>

            {/* Attempts counter */}
            {attempts > 0 && (
              <Text style={styles.attemptsText}>Intento {attempts + 1}</Text>
            )}
          </View>

        {/* ── Keyboard (absolute bottom) ── */}
        <View style={dynamicStyles.keyboardContainer}>
          <View style={dynamicStyles.keyboard}>
            {KEYBOARD_LAYOUT.map((row, rowIndex) => (
              <View key={rowIndex} style={dynamicStyles.keyboardRow}>
                {row.map((key) => {
                  const isSpecial = key === "DELETE_ONE" || key === "CLEAR_ALL";
                  const keyStyle = keyStylesNormal[key] || dynamicStyles.key;
                  return (
                    <JuicyButton
                      key={key}
                      style={keyStyle}
                      onPress={keyHandlers[key]}
                      intensity={key === "CLEAR_ALL" ? "medium" : "light"}
                      scaleDown={0.88}
                    >
                      {key === "DELETE_ONE" ? (
                        Platform.OS === "android" ? (
                          <Text style={dynamicStyles.deleteIconText}>⌫</Text>
                        ) : (
                          <Image
                            source={require("../../assets/images/delete_one.png")}
                            style={dynamicStyles.deleteIcon}
                          />
                        )
                      ) : key === "CLEAR_ALL" ? (
                        <Image
                          source={require("../../assets/icons/trash.png")}
                          style={dynamicStyles.clearIcon}
                        />
                      ) : (
                        <Text style={dynamicStyles.keyText}>{key}</Text>
                      )}
                    </JuicyButton>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

      {/* ── Result modal ── */}
      <PvPResultModal
        visible={showResult}
        matchState={matchState}
        userId={userId}
        onClose={() => {
          setShowResult(false);
          navigation.goBack();
        }}
        onRematch={() => {
          setShowResult(false);
          setShowMatchmaking(true);
          setActiveMatchId(null);
          setCurrentWordIndex(0);
          setGameStarted(false);
          setCountdown(3);
          setIsCorrectWord(false);
          setTransitioning(false);
          setTimeRemaining(PVP_DURATION_SECS);
        }}
      />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ═══  STYLES  ══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },

  // ── Opponent strip ────────────────────────────────────────────────────────
  oppStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginTop: Platform.OS === "android" ? 40 : 0,
  },
  oppLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  oppAvatar: { fontSize: 28 },
  oppName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: "#FFE4B5",
    maxWidth: width * 0.35,
  },
  oppScoreText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: "rgba(255,228,181,0.6)",
    marginTop: 1,
  },
  timerText: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: GOLD,
    marginLeft: 12,
  },
  timerUrgent: {
    color: RED,
  },

  // ── Countdown ─────────────────────────────────────────────────────────────
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  countdownText: {
    fontFamily: FONTS.display,
    fontSize: 80,
    color: GOLD,
  },

  myProgressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  myProgressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  myProgressDotDone: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  myProgressDotCurrent: {
    borderColor: GOLD,
    borderWidth: 2,
  },
  wordCounter: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: "rgba(255,228,181,0.5)",
    textAlign: "center",
    marginBottom: 6,
  },
  hintCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginVertical: 6,
  },
  hintLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: "rgba(255,228,181,0.5)",
  },
  hintText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: "#FFE4B5",
    marginTop: 2,
  },
  hintRegion: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: "rgba(255,228,181,0.4)",
    marginTop: 4,
  },

  // ── Tile grid ─────────────────────────────────────────────────────────────
  wordBoxesContainer: {
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 10,
  },
  wordRow: {
    alignItems: "center",
    marginBottom: 4,
  },
  wordRowBoxes: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  wordDivider: {
    width: 14,
    height: 52,
    margin: 2,
  },
  wordDividerLine: {},
  letterBox: {
    width: 38,
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  letterBoxSelected: {
    borderColor: GOLD,
    backgroundColor: "rgba(248,190,23,0.12)",
  },
  letterBoxCorrect: {
    backgroundColor: GREEN,
    borderColor: "#196F3D",
  },
  letterText: {
    fontSize: TABLET_MODE ? 28 : 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  letterTextCorrect: {
    color: "white",
  },
  attemptsText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: "rgba(255,228,181,0.5)",
    textAlign: "center",
    marginTop: 6,
  },

  // ── Keyboard (only sub-styles still referenced — main styles are in dynamicStyles) ──
  deleteKey: { width: _PVP_KB_SPECIAL_W, backgroundColor: Platform.OS === "android" ? "#AEB6BF" : "#C8C8D0" },
  clearKey: { width: _PVP_KB_SPECIAL_W, backgroundColor: "#C8C8D0" },
});
