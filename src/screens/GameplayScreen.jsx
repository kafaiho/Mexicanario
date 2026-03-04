import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  InteractionManager,
  Modal,
  Platform,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { api } from "../../convex/_generated/api";
import AdRemovalModal from "../components/AdRemovalModal";
import CoinFlyOverlay from "../components/CoinFlyOverlay";
import CuatesModal from "../components/CuatesModal";
import DictionaryModal from "../components/DictionaryModal";
import EnhancedComboCounter from "../components/EnhancedComboCounter";
import JuicyButton from "../components/JuicyButton";
import MexicanarioModal from "../components/MexicanarioModal";
import OnboardingTooltip from "../components/OnboardingTooltip";
import DraggablePet from "../components/PetCompanion/DraggablePet";
import SupportModal from "../components/SupportModal";
import TermsModal from "../components/TermsModal";
import TopBar from "../components/TopBar";
import VenezolanometroModal from "../components/VenezolanometroModal";
import WheelModal from "../components/WheelModal";
import { getNextZone, getZone, isZoneStart } from "../config/mexicoZones";
import { useAuth } from "../context/AuthContext";
import useCoinFly from "../hooks/useCoinFly";
import { useCombo } from "../hooks/useCombo";
import useDevMode from "../hooks/useDevMode";
import { useOnboarding } from "../hooks/useOnboarding";
import { useRewardedAd } from "../hooks/useRewardedAd";
import { comboBurst, notifyError, notifySuccess, notifyWarning } from "../services/haptics";
import { hasPermission, requestPermission, rescheduleAfterPlay } from "../services/notificationService";
import usePetStore from "../store/usePetStore";
import { playBGM, playSound, stopBGM } from "../utils/soundManager";
import { REAL_HEIGHT, REAL_WIDTH, TABLET_MODE } from "../utils/tabletSetup";
import { compareWordsFlexibly, normalizeWordForDisplay } from "../utils/textUtils";
import ShopScreen from "./ShopScreen";

const { width, height } = Dimensions.get("window");
// Real screen center (unpatched) — used for coin fly origin on tablet
const COIN_CENTER_X = TABLET_MODE ? REAL_WIDTH / 2 : width / 2;
const COIN_CENTER_Y = TABLET_MODE ? REAL_HEIGHT / 2 : height / 2;
// On tablet use a fixed value — the patched height in landscape (~384px) would give
// only 142px via the formula, which is far too small for 3 keyboard rows.
const KEYBOARD_HEIGHT = TABLET_MODE ? 284 : Math.min(264, height * 0.39);

// On tablet, tiles are bigger so they fill more of the larger screen
const TILE_SCALE = TABLET_MODE ? 1.4 : 1;

// Keyboard layout
const KEYBOARD_LAYOUT = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
  ["CLEAR_ALL", "Z", "X", "C", "V", "B", "N", "M", "DELETE_ONE"],
];

// Region-aware emoji sets
const REGION_EMOJIS = {
  "CDMX": ["🏙️", "🌮", "🚇"],
  "Ciudad de México": ["🏙️", "🌮", "🚇"],
  "Jalisco": ["🤠", "🎺", "🌵"],
  "Oaxaca": ["🏺", "🦋", "🌽"],
  "Puebla": ["🌶️", "⛪", "🍫"],
  "Norte": ["🌵", "🤠", "🐂"],
  "Sinaloa": ["🎵", "🌊", "🌶️"],
  "Veracruz": ["⚓", "🌊", "💃"],
  "Yucatán": ["🏛️", "🦜", "🌴"],
  "Guerrero": ["🏖️", "🐢", "🌺"],
  "Chiapas": ["🌿", "🏯", "🦜"],
  "Michoacán": ["🦋", "🏔️", "🫙"],
  "Nacional": ["🇲🇽", "🌮", "🎶"],
  "Todo México": ["🇲🇽", "🌵", "🎉"],
  "Tradicional": ["🏺", "🎊", "🪅"],
  "Infantil": ["🧸", "🎈", "🪀"],
  "Juvenil": ["🎮", "🎧", "✏️"],
  "Callejero": ["🛤️", "🎨", "🚲"],
  "default": ["🇲🇽", "🌮", "🌵"],
};

function getRegionEmojis(region) {
  if (!region) return REGION_EMOJIS["default"];
  // Try exact match first
  if (REGION_EMOJIS[region]) return REGION_EMOJIS[region];
  // Try partial match (e.g. "Norte de México" → "Norte")
  const key = Object.keys(REGION_EMOJIS).find(k =>
    k !== "default" && region.toLowerCase().includes(k.toLowerCase())
  );
  return REGION_EMOJIS[key] || REGION_EMOJIS["default"];
}

// Frases de victoria que rotan por nivel
const VICTORY_PHRASES = [
  "¡Pasaron la arena por la zaranda!",
  "¡Órale, qué chido!",
  "¡Le entraste con todo el rollo!",
  "¡A todo dar, campeón!",
  "¡Qué bárbaro, lo lograste!",
  "¡Fierro, ya lo tenías!",
  "¡Neta que la armaste!",
  "¡Le echaste muchas ganas!",
  "¡Eso es, mero mero!",
  "¡Bien hecho, gran mexica!",
  "¡La neta del planeta!",
  "¡No manches, qué listo!",
  "¡Más chilango que el metro!",
  "¡Órale, ya la hiciste!",
  "¡A darle que es mole de olla!",
  "¡Sale y vale, campeón!",
  "¡Eso mero, así se hace!",
  "¡Chido, le atinaste!",
  "¡Tú sí sabes!",
  "¡Le cayó el veinte!",
];

/** Devuelve la frase de victoria correspondiente al nivel */
const getVictoryPhrase = (level) =>
  VICTORY_PHRASES[(level - 1) % VICTORY_PHRASES.length] || VICTORY_PHRASES[0];

/** Mensajes aleatorios de celebración cuando el jugador adivina la palabra */
const WIN_PHRASES_PERFECT = [
  "¡Órale, qué chingón!",
  "¡A la primera! ¡Eres un crack!",
  "¡Sin dudar ni tantito!",
  "¡Puro nivel, compa!",
  "¡Ahí está la neta!",
  "¡Tú ya sabes de qué se trata!",
  "¡Chido, chido, chido!",
  "¡Eso, eso, esoooo!",
  "¡Qué monstruo estás hecho!",
  "¡Eres bien chilo, manito!",
  "¡Échale, ya las traes!",
  "¡Bien cabrón, lo adivinaste!",
  "¡Le entendiste de volada!",
  "¡Ni quien le haga al tiro como tú!",
  "¡La rompiste, campeón!",
];

const WIN_PHRASES_ATTEMPTS = [
  "¡Bien, aunque costó un poquito!",
  "¡Pos ahí quedó, ya estuvo!",
  "¡Con chiste pero llegaste!",
  "¡Al final lo lograste, eso es lo que importa!",
  "¡Le batallaste pero pa' delante!",
  "¡No te rajaste, bien hecho!",
  "¡Difícil, pero tú pudiste!",
  "¡Te la rifaste aunque no fue fácil!",
  "¡Qué rollo, pero lo sacaste!",
  "¡Con trabajos, pero ahí está!",
  "¡La neta me asustaste, pero lo lograste!",
  "¡Ora sí, poco a poco se llega!",
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Frases de "La Mirada del Guía" — mascota insinúa que use el teclado o la pista */
const GAZE_PHRASES = [
  "👁️ Psst... mira bien el teclado 👇",
  "👇 La respuesta está ahí abajito...",
  "🔑 Solo digo... hay letras esperándote.",
  "👀 Oye, ese teclado no se usa solo, ¿eh?",
  "💡 Si quieres ayuda, la A te espera 👇",
  "🤫 Yo que tú le daba un ojito al teclado.",
  "👁️ ...¿ya viste qué letras hay disponibles?",
  "⌨️ El teclado y yo tenemos algo que decirte.",
  "🧩 Pista gratis: empieza a teclear, algo saldrá.",
  "👀 Aquí entre nos... prueba con la primera letra.",
  "🕵️ Estoy mirando el teclado. Tú también deberías.",
  "💭 A veces la respuesta está frente a ti. Literalmente.",
  "👇 ¿Ves esos botones de abajo? Son tus amigos.",
  "🎯 La letra que buscas está en el teclado. Sorpresa.",
  "🦮 Un guía nunca dice la respuesta. Solo señala 👇",
];

/** Censura la palabra mexicana en el ejemplo de uso para usarla como pista */
const buildCensoredExample = (example, mexicanWord) => {
  if (!example || !mexicanWord) return example || "";
  const stars = "★".repeat(Math.min(mexicanWord.replace(/ /g, "").length, 6));
  const regex = new RegExp(mexicanWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return example.replace(regex, stars);
};

export default function GameplayScreen({ navigation, route }) {
  // UI state
  const [showDictionary, setShowDictionary] = useState(false);
  const [showMexicanario, setShowMexicanario] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showVenezolanometro, setShowVenezolanometro] = useState(false);
  const [showAdRemoval, setShowAdRemoval] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showRegisterLure, setShowRegisterLure] = useState(false);
  const [showCuatesReg, setShowCuatesReg] = useState(false);
  const promptedLevelsRef = useRef(new Set());
  const [showCoinsModal, setShowCoinsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // which power-up was attempted when coins ran out
  const [showShop, setShowShop] = useState(false);

  // Refs para coin fly
  const topBarRef = useRef(null);
  const victoryRewardRef = useRef(null);

  // Coin fly — dos instancias: una para la pantalla principal, otra para el modal de victoria
  const { flyCoins: mainCoins, particles: mainCoinParticles, triggerCoinFly: triggerMainCoin, onCoinArrived: onMainCoinArrived } = useCoinFly();
  const { flyCoins: victoryCoins, particles: victoryCoinParticles, triggerCoinFly: triggerVictoryCoin, onCoinArrived: onVictoryCoinArrived } = useCoinFly();

  // Posición fallback del pill de monedas (igual que AchievementsScreen)
  const getCoinPillFallback = () => {
    // Use REAL_WIDTH so the fallback target is in the correct top-right corner
    // regardless of the tablet Dimensions patch
    const topPad = Platform.OS === "ios" ? 52 : 36;
    const pillH = 36;
    const pillW = 110;
    const pillX = REAL_WIDTH - 16 - pillW;
    return { x: pillX, y: topPad, w: pillW, h: pillH };
  };

  const getCoinPillTarget = async () => {
    const measured = await topBarRef.current?.measureCoinPill();
    return (measured && measured.h > 0) ? measured : getCoinPillFallback();
  };

  // Rewarded ad para el modal de monedas
  const { ready: adReady, available: adAvailable, showAd } = useRewardedAd();

  // Onboarding — shown only on first launch
  const { step: obStep, active: obActive, advance: obAdvance, skip: obSkip } = useOnboarding("gameplay");
  const ONBOARDING_STEPS = [
    {
      text: "Aquí aparece la pista. ¡Lee la definición para adivinar la palabra mexicana! 📖",
      bubbleStyle: { top: height * 0.26, left: 20, right: 20 },
      handStyle: { top: height * 0.17, left: width / 2 - 24 },
      handEmoji: "👇",
      handBounceDir: "down",
    },
    {
      text: "Las casillas se llenarán con las letras que escribas. ¡Intenta adivinar la palabra! ⬜",
      bubbleStyle: { top: height * 0.2, left: 20, right: 20 },
      handStyle: { top: height * 0.5, left: width / 2 - 24 },
      handEmoji: "👆",
      handBounceDir: "up",
    },
    {
      text: "Toca las letras del teclado para deletrear tu respuesta 🎹",
      bubbleStyle: { bottom: KEYBOARD_HEIGHT + 20, left: 20, right: 20 },
      handStyle: { bottom: KEYBOARD_HEIGHT + 10, left: width / 2 - 24 },
      handEmoji: "👇",
      handBounceDir: "down",
    },
    {
      text: "¿Te atascas? Estos botones de ayuda revelan letras o completan la palabra 💡",
      bubbleStyle: { bottom: KEYBOARD_HEIGHT + 110, left: 20, right: 20 },
      handStyle: { bottom: KEYBOARD_HEIGHT + 52, left: 30 },
      handEmoji: "👇",
      handBounceDir: "down",
    },
  ];

  // Combo & streak state (game logic + UI visibility decoupled)
  const { comboCount, maxCombo, comboVisible, incrementCombo, resetCombo, dismissCombo } = useCombo();
  const [wordStartTime, setWordStartTime] = useState(Date.now());
  const [isFirstWordToday, setIsFirstWordToday] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Game state
  const [guess, setGuess] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongLetters, setWrongLetters] = useState([]); // indices that were marked wrong by Verificar
  const [attempts, setAttempts] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpReward, setLevelUpReward] = useState(null);
  const [totalLevels, setTotalLevels] = useState(50); // default, updated from backend
  const [mexicanWord, setMexicanWord] = useState("");        // normalized (no accents) — for tile display
  const [originalWord, setOriginalWord] = useState("");      // original with accents — for victory display
  const [regularWord, setRegularWord] = useState("");
  const [wordMeaning, setWordMeaning] = useState("");
  const [wordExample, setWordExample] = useState("");
  const [wordRegion, setWordRegion] = useState("");
  // Victory snapshot — frozen copy of current-level data shown in the modal
  // (needed because completeLevelMutation increments the level immediately,
  //  causing levelInfo to update reactively before the modal closes)
  const [victoryWord, setVictoryWord] = useState("");
  const [victoryExample, setVictoryExample] = useState("");
  const [victoryRegion, setVictoryRegion] = useState("");
  const [victoryLevel, setVictoryLevel] = useState(1);

  // Review mode — failed word scheduled for re-review
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewWordId, setReviewWordId] = useState(null);
  const hasRecordedFailRef = useRef(false);   // prevent duplicate recordFail calls per word

  // Map repaso mode — replaying a completed level from the map (no progress change)
  const reviewLevelParam = route?.params?.reviewLevel ?? null;
  const [isMapReview, setIsMapReview] = useState(!!reviewLevelParam);
  const mapReviewData = useQuery(
    api.levels.getLevelByNumber,
    reviewLevelParam ? { levelNumber: reviewLevelParam } : "skip"
  );

  // Zone completion — set when user clears the last level of a zone
  const [zoneCompleted, setZoneCompleted] = useState(null);
  const [zoneCompletedNext, setZoneCompletedNext] = useState(null);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0);
  const categoryEmojis = useMemo(() => getRegionEmojis(wordRegion), [wordRegion]);

  // Hint costs (no free/inventory system — always charged)
  const HINT_COST = 25;       // A — revela 1 letra
  const BORRAR_COST = 75;     // 🔓 — revela 3 letras
  const VERIFICAR_COST = 200; // ⭐ — completa todo
  const SYNONYM_COST = 30;    // ❓ — muestra definición
  const [fixedLetters, setFixedLetters] = useState([]); // indices filled by hints (locked)
  const [showSynonym, setShowSynonym] = useState(false); // whether the synonym hint is visible
  const [revealedKeys, setRevealedKeys] = useState(null); // null=inactive, Set<string>=keyboard filter active (🔓 hint)

  // Auth and game hooks
  const { userId, user } = useAuth();
  const levelInfo = useQuery(api.users.getCurrentLevel, userId ? { userId } : "skip");
  const updateUserCurrency = useMutation(api.users.updateUserCurrency);
  const completeLevelMutation = useMutation(api.levels.completeLevel);
  const gainPetXp = useMutation(api.pet.gainPetXp);
  const allLevels = useQuery(api.levels.getAllLevels);
  const jumpToLevelMutation = useMutation(api.devTools.jumpToLevel);
  const usePowerupMutation = useMutation(api.shop.usePowerup);
  const recordDailyPlay = useMutation(api.streaks.recordDailyPlay);
  const recordLeagueCXP = useMutation(api.league.recordLeagueCXP);
  const shopState = useQuery(api.shop.getShopState, userId ? { userId } : "skip");
  const powerupInventory = shopState?.powerups ?? {};
  const petState = useQuery(api.pet.getPetState, userId ? { userId } : "skip");

  // Failed word review system
  const reviewWord = useQuery(api.failedWords.getDueWord, userId ? { userId } : "skip");
  const reviewWordRef = useRef(null);
  useEffect(() => { reviewWordRef.current = reviewWord ?? null; }, [reviewWord]);
  const recordFailMutation = useMutation(api.failedWords.recordFail);
  const resolveWordMutation = useMutation(api.failedWords.resolveWord);

  // Streak query — drives mascot tier visuals
  const streakStatus = useQuery(api.streaks.getStreakStatus, userId ? { userId } : "skip");
  const streakDays = streakStatus?.currentStreak ?? 0;
  const [boostActive, setBoostActive] = useState(false);

  // Mascota state for GameMascot reactions
  const [mascotaReaction, setMascotaReaction] = useState("idle");
  const [mascotaBubble, setMascotaBubble] = useState(null);
  const mascotaH = 100 + ((petState?.stage ?? 1) - 1) * 12;
  const mascotaW = (petState?.stage ?? 1) >= 3 ? 120 : 100;
  const mascotaTimer = useRef(null);
  const { acierto: bondAcierto, error: bondError } = usePetStore();

  // Long-press repeat delete
  const deleteRepeatRef = useRef(null);
  const deleteHoldTimerRef = useRef(null);
  const onKeyPressRef = useRef(null); // kept updated below, avoids stale closure in interval
  const startDeleteRepeat = useCallback(() => {
    deleteHoldTimerRef.current = setTimeout(() => {
      deleteRepeatRef.current = setInterval(() => {
        onKeyPressRef.current?.('DELETE_ONE');
      }, 80);
    }, 350);
  }, []);
  const stopDeleteRepeat = useCallback(() => {
    clearTimeout(deleteHoldTimerRef.current);
    clearInterval(deleteRepeatRef.current);
    deleteRepeatRef.current = null;
    deleteHoldTimerRef.current = null;
  }, []);

  // Sync petType from Convex → local store so DraggablePet shows the chosen pet
  useEffect(() => {
    if (petState?.petType) {
      const stored = usePetStore.getState().petType;
      if (petState.petType !== stored) usePetStore.getState().setPetType(petState.petType);
    }
  }, [petState?.petType]);

  const triggerMascota = (state, bubble) => {
    setMascotaReaction(state);
    if (bubble) setMascotaBubble(bubble);
    clearTimeout(mascotaTimer.current);
    mascotaTimer.current = setTimeout(() => {
      setMascotaReaction("idle");
      setMascotaBubble(null);
    }, 2500);
  };

  // Cambiar BGM a gameplay al entrar, volver a menu al salir
  useEffect(() => {
    playBGM("gameplay");
    return () => {
      stopBGM();
      playBGM("menu");
    };
  }, []);

  // Dev: saltar a nivel
  const [showDevModal, setShowDevModal] = useState(false);
  const [devLevelInput, setDevLevelInput] = useState("");
  const devEnabled = useDevMode((s) => s.enabled);

  // Update totalLevels when allLevels loads
  useEffect(() => {
    if (allLevels && allLevels.length > 0) {
      setTotalLevels(allLevels.length);
    }
  }, [allLevels]);

  // Disparar coin fly cuando se abre el modal de victoria
  useEffect(() => {
    if (!showLevelUp || !(levelUpReward?.coins > 0)) return;
    const timer = setTimeout(async () => {
      // Medir fuente: el pill de recompensa dentro del modal
      let srcX = COIN_CENTER_X;
      let srcY = COIN_CENTER_Y * 1.36;
      if (victoryRewardRef.current) {
        await new Promise((res) => {
          let done = false;
          victoryRewardRef.current.measureInWindow((x, y, w, h) => {
            done = true;
            if (h > 0) { srcX = x + w / 2; srcY = y + h / 2; }
            res();
          });
          setTimeout(() => { if (!done) res(); }, 300);
        });
      }
      // Medir destino: pill de monedas en TopBar (con fallback)
      const target = await getCoinPillTarget();
      triggerVictoryCoin({
        fromX: srcX,
        fromY: srcY,
        toX: target.x + target.w / 2,
        toY: target.y + target.h / 2,
        coins: levelUpReward.coins,
        onAllArrived: () => topBarRef.current?.triggerBounce(),
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [showLevelUp]);

  // ─── Animations ─────────────────────────────────────────────────────────────
  const scaleAnims = useMemo(
    () =>
      Array(40)  // 40 is enough for the longest words in the game
        .fill(0)
        .map(() => new Animated.Value(1)),
    []
  );
  const shakeAnim = useRef(new Animated.Value(0)).current;
  // Prevents the levelInfo useEffect from calling initGame() while the
  // victory modal is open (Convex updates levelInfo reactively as soon as
  // completeLevelMutation runs, which used to wipe showLevelUp before it showed).
  const skipNextInitRef = useRef(false);
  const usedPowerupRef = useRef(false);    // true if any hint powerup was used this round
  const lastInputTimeRef = useRef(Date.now()); // timestamp of last keypress (for guide gaze)

  // ─── Confetti particles ──────────────────────────────────────────────────────
  const CONFETTI_COUNT = 10;
  const CONFETTI_COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF922B", "#CC5DE8", "#F06595", "#74C0FC"];
  const confettiAnims = useMemo(
    () => Array(CONFETTI_COUNT).fill(0).map(() => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 10,
      startX: (Math.random() - 0.5) * 260,
      endY: 180 + Math.random() * 120,
      endX: (Math.random() - 0.5) * 300,
    })),
    []
  );

  const launchConfetti = () => {
    confettiAnims.forEach((p, i) => {
      p.y.setValue(0);
      p.x.setValue(0);
      p.opacity.setValue(0);
      p.rotation.setValue(0);
      p.scale.setValue(0);
      const delay = i * 40;
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.spring(p.scale, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: -p.endY, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.x, { toValue: p.endX, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.rotation, { toValue: 6, duration: 900, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(600),
            Animated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });
  };

  useEffect(() => {
    if (showLevelUp) {
      setTimeout(() => launchConfetti(), 100);
    }
  }, [showLevelUp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── AsyncStorage persistence ─────────────────────────────────────────────
  const SAVE_KEY = (levelNum) => `@mexicanario_save_level_${levelNum}`;

  const saveProgress = useCallback(async (levelNum, guessArr, fixed, synonym, boxIdx) => {
    try {
      await AsyncStorage.setItem(SAVE_KEY(levelNum), JSON.stringify({
        guess: guessArr,
        fixedLetters: fixed,
        showSynonym: synonym,
        selectedBoxIndex: boxIdx,
      }));
    } catch (_) { }
  }, []);

  const clearProgress = useCallback(async (levelNum) => {
    try { await AsyncStorage.removeItem(SAVE_KEY(levelNum)); } catch (_) { }
  }, []);

  // Save whenever guess changes (debounced via useEffect)
  useEffect(() => {
    if (mexicanWord && !isCorrect && levelInfo?.level) {
      saveProgress(levelInfo.level, guess, fixedLetters, showSynonym, selectedBoxIndex);
    }
  }, [guess]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isLoading, setIsLoading] = useState(true);

  const resetGameState = () => {
    setGuess([]);
    setIsCorrect(false);
    setAttempts(0);
    setShowLevelUp(false);
    setLevelUpReward(null);
    setMexicanWord("");
    setRegularWord("");
    setWordMeaning("");
    setWordExample("");
    setWordRegion("");
    setSelectedBoxIndex(0);
    setFixedLetters([]);
    setWrongLetters([]);
    setShowSynonym(false);
    setRevealedKeys(null);
    setWordStartTime(Date.now());
    setIsFirstWordToday(false);
    setIsReviewMode(false);
    setReviewWordId(null);
    setZoneCompleted(null);
    setZoneCompletedNext(null);
    hasRecordedFailRef.current = false;
    usedPowerupRef.current = false;
    lastInputTimeRef.current = Date.now();
  };

  const initGame = async () => {
    try {
      setIsLoading(true);
      resetGameState();

      // ── Map repaso mode: replay a completed level without changing progress ──
      if (reviewLevelParam && mapReviewData) {
        const wordUp = normalizeWordForDisplay(mapReviewData.word);
        setIsMapReview(true);
        setMexicanWord(wordUp);
        setOriginalWord(mapReviewData.word.toUpperCase());
        setRegularWord(mapReviewData.meaning.toUpperCase());
        setWordMeaning(mapReviewData.meaning);
        setWordExample(mapReviewData.example);
        setWordRegion(mapReviewData.region);
        const initial = Array.from(wordUp).map((ch) => (ch === " " ? " " : ""));
        setGuess(initial);
        const firstNonSpace = initial.findIndex((ch) => ch !== " ");
        setSelectedBoxIndex(firstNonSpace >= 0 ? firstNonSpace : 0);
        setIsLoading(false);
        return;
      }

      // ── Review mode: serve a due failed word before the next level ──
      const activeReview = reviewWordRef.current;
      if (activeReview) {
        const wordUp = normalizeWordForDisplay(activeReview.wordText);
        setIsReviewMode(true);
        setReviewWordId(activeReview.wordId);
        setMexicanWord(wordUp);
        setOriginalWord(activeReview.wordText.toUpperCase());
        setRegularWord(activeReview.meaning?.toUpperCase() || "");
        setWordMeaning(activeReview.meaning || "");
        setWordExample(activeReview.example || "");
        setWordRegion(activeReview.region || "");
        const initial = Array.from(wordUp).map((ch) => (ch === " " ? " " : ""));
        setGuess(initial);
        const firstNonSpace = initial.findIndex((ch) => ch !== " ");
        setSelectedBoxIndex(firstNonSpace >= 0 ? firstNonSpace : 0);
        setIsLoading(false);
        return;
      }

      if (levelInfo) {
        if (levelInfo.word) {
          // ── Auto-skip words that are too long for the tile layout ──
          const _segs = levelInfo.word.trim().split(/\s+/);
          const _letters = levelInfo.word.replace(/\s/g, "").length;
          if (_segs.length > 3 || _letters > 18) {
            completeLevelMutation({ userId, levelNumber: levelInfo.level }).catch(() => { });
            setIsLoading(false);
            return;
          }

          const wordUp = normalizeWordForDisplay(levelInfo.word);
          setMexicanWord(wordUp);
          setOriginalWord(levelInfo.word.toUpperCase());
          setRegularWord(levelInfo.meaning.toUpperCase());
          setWordMeaning(levelInfo.meaning || "");
          setWordExample(levelInfo.example || "");
          setWordRegion(levelInfo.region || "");

          // Try to restore a saved session for this level
          let restored = false;
          try {
            const raw = await AsyncStorage.getItem(`@mexicanario_save_level_${levelInfo.level}`);
            if (raw) {
              const saved = JSON.parse(raw);

              // Validate the saved guess matches the word length
              if (Array.isArray(saved.guess) && saved.guess.length === wordUp.length) {
                // BUG FIX: Intentionally ignore the save if it is already fully completed
                // This happens when local cache remembers a level we passed a long time ago
                // and auto-completes it when we reach it again (e.g after a DB reset).
                const savedString = saved.guess.join("");
                if (savedString === wordUp) {
                  // Ignore and clear this stale completed state
                  await AsyncStorage.removeItem(`@mexicanario_save_level_${levelInfo.level}`);
                } else {
                  setGuess(saved.guess);
                  setFixedLetters(saved.fixedLetters || []);
                  setShowSynonym(saved.showSynonym || false);
                  setSelectedBoxIndex(saved.selectedBoxIndex ?? 0);
                  restored = true;
                }
              }
            }
          } catch (_) { }

          if (!restored) {
            // Fresh start: pre-fill space positions
            const initial = Array.from(wordUp).map((ch) => (ch === " " ? " " : ""));
            setGuess(initial);
            const firstNonSpace = initial.findIndex((ch) => ch !== " ");
            setSelectedBoxIndex(firstNonSpace >= 0 ? firstNonSpace : 0);
          }
        } else {
          Alert.alert("Error", "Hubo un problema cargando la palabra. Intenta de nuevo.");
        }
        if (levelInfo.isDefaultLevel) {
          setShowAuthPrompt(true);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Hubo un problema iniciando el juego. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reviewLevelParam && mapReviewData) {
      initGame();
    }
  }, [mapReviewData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!reviewLevelParam && levelInfo && !skipNextInitRef.current) {
      initGame();
    }
  }, [levelInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Aviso de registro al pasar niveles clave (solo usuarios sin cuenta) ────
  const REGISTER_PROMPT_LEVELS = [5, 15, 30];
  useEffect(() => {
    if (!levelInfo?.level) return;
    const isUnregistered = !user?.email && !user?.googleId && !user?.appleId;
    if (!isUnregistered) return;
    const lvl = levelInfo.level;
    if (REGISTER_PROMPT_LEVELS.includes(lvl) && !promptedLevelsRef.current.has(lvl)) {
      promptedLevelsRef.current.add(lvl);
      // pequeño delay para que el jugador vea la pantalla antes del aviso
      setTimeout(() => setShowRegisterLure(true), 800);
    }
  }, [levelInfo?.level]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Animations ─────────────────────────────────────────────────────────────
  const bounceAtIndex = (idx) => {
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 1.25, duration: 90, useNativeDriver: true }),
      Animated.timing(scaleAnims[idx], { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();
  };

  const shakeRow = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const celebrate = () => {
    // Parallel (not stagger) so all tiles pulse together — prevents tile 0 from
    // appearing enlarged/protruding relative to the others when green is applied.
    // Scale 1→1.08→1 over 400ms total per tile, only on actual characters.
    const anims = Array.from(mexicanWord).reduce((acc, ch, i) => {
      if (ch !== " ") {
        acc.push(
          Animated.sequence([
            Animated.timing(scaleAnims[i], { toValue: 1.08, duration: 200, useNativeDriver: true }),
            Animated.timing(scaleAnims[i], { toValue: 1.0, duration: 200, useNativeDriver: true }),
          ])
        );
      }
      return acc;
    }, []);
    Animated.parallel(anims).start();
  };

  // ─── Rewards ─────────────────────────────────────────────────────────────────
  const getComboMultiplier = (combo) => {
    if (combo >= 10) return 2;
    if (combo >= 5) return 1.5;
    if (combo >= 3) return 1.25;
    return 1;
  };

  const calculateReward = (currentCombo) => {
    const baseReward = levelInfo?.reward || { coins: 0, diamonds: 1 };
    return {
      coins: 0, // No more coins for just beating levels
      diamonds: baseReward.diamonds,
    };
  };

  // ─── Validation ───────────────────────────────────────────────────────────────
  const validateWhenFull = async (nextGuess) => {
    const guessString = Array.isArray(nextGuess) ? nextGuess.join("") : nextGuess;
    if (guessString.length === mexicanWord.length) {
      const isCorrectFlexible = compareWordsFlexibly(guessString, mexicanWord);
      if (isCorrectFlexible) {
        setIsCorrect(true);
        setWrongLetters([]);
        celebrate();
        // Pronunciar la palabra al adivinarse correctamente
        Speech.speak(mexicanWord, { language: "es-MX", rate: 0.85 });

        // Resolve review word if we're in review mode
        if (isReviewMode && reviewWordId) {
          resolveWordMutation({ userId, wordId: reviewWordId }).catch(() => { });
        }

        // Zone completion check (normal mode only, not review)
        let didCompleteZone = false;
        if (!isReviewMode && levelInfo?.level) {
          const nextLevel = levelInfo.level + 1;
          if (isZoneStart(nextLevel)) {
            didCompleteZone = true;
            setZoneCompleted(getZone(levelInfo.level));
            setZoneCompletedNext(getNextZone(levelInfo.level));
          }
        }

        // ── Map repaso mode: no combo, no rewards, simple feedback ──
        if (isMapReview) {
          playSound("correct");
          notifySuccess();
          triggerMascota("celebrating", "¡Repasado!");
          const snapWord = originalWord || mexicanWord;
          const snapExample = wordExample;
          const snapRegion = wordRegion;
          const snapLevel = reviewLevelParam || 1;
          setVictoryWord(snapWord);
          setVictoryExample(snapExample);
          setVictoryRegion(snapRegion);
          setVictoryLevel(snapLevel);
          setLevelUpReward({ coins: 0, diamonds: 0 });
          setTimeout(() => {
            setShowLevelUp(true);
            playSound("celebration");
          }, 500);
          return;
        }

        // ── Combo logic ──
        // newCombo is kept as a local var for synchronous use in calculateReward/recordLeagueCXP.
        // State updates happen async via the hook.
        let newCombo;
        if (attempts === 0) {
          // Perfect answer — increase combo
          newCombo = comboCount + 1;
          incrementCombo(); // updates comboCount + maxCombo + shows banner for 1000ms
          playSound(newCombo >= 3 ? "combo" : "correct");
          if (newCombo >= 3) {
            comboBurst(newCombo);
            triggerMascota("celebrating", `x${newCombo} Combo!`);
          } else {
            notifySuccess();
            triggerMascota("celebrating", pickRandom(WIN_PHRASES_PERFECT));
          }
          bondAcierto(); // +15 vínculo por acierto
        } else {
          // Had wrong attempts — break combo
          newCombo = 0;
          if (comboCount > 0) {
            playSound("combo_break");
            notifyWarning();
          } else {
            playSound("correct");
            notifySuccess();
          }
          resetCombo(); // resets comboCount to 0 and hides banner
          triggerMascota("celebrating", pickRandom(WIN_PHRASES_ATTEMPTS));
          bondAcierto(); // +15 vínculo incluso con intentos previos
        }

        // Clear saved progress for this level — it's done!
        if (levelInfo?.level) clearProgress(levelInfo.level);
        if (!userId) {
          setShowAuthPrompt(true);
          return;
        }
        // Snapshot current-level data NOW, before the mutation increments the level
        // and Convex reactively overwrites mexicanWord / wordExample / wordRegion.
        const snapWord = originalWord || mexicanWord;
        const snapExample = wordExample;
        const snapRegion = wordRegion;
        const snapLevel = levelInfo?.level || 1;
        setVictoryWord(snapWord);
        setVictoryExample(snapExample);
        setVictoryRegion(snapRegion);
        setVictoryLevel(snapLevel);
        // Block the levelInfo useEffect from resetting the game while the
        // victory modal is open (Convex updates levelInfo reactively immediately
        // after the mutation, which would call initGame() too early).
        skipNextInitRef.current = true;
        // If player used any hint powerup, no coin reward (fair play)
        const reward = usedPowerupRef.current
          ? { coins: 0, diamonds: 0 }
          : calculateReward(newCombo);
        // Add zone bonus to displayed reward (actual award happens in InteractionManager)
        const displayReward = (!usedPowerupRef.current && didCompleteZone)
          ? { ...reward, coins: reward.coins + 100 }
          : reward;

        // Delay victory modal — combo: 700ms banner + 150ms fade + 500ms legibility = 1350ms
        //                         no-combo: 500ms legibility (no banner to wait for)
        setLevelUpReward(displayReward);
        const victoryDelay = attempts === 0 ? 1350 : 500;
        setTimeout(() => {
          setShowLevelUp(true);
          playSound("celebration");
        }, victoryDelay);

        // Defer all backend work until animations settle
        InteractionManager.runAfterInteractions(() => {
          completeLevelMutation({ userId, levelNumber: levelInfo.level })
            .then((levelResult) => {
              if (levelResult.success) {
                const totalCoins = reward.coins; // already 0 if powerup was used
                if (totalCoins > 0 || reward.diamonds > 0) {
                  updateUserCurrency({ userId, coins: totalCoins, diamonds: reward.diamonds }).catch(() => { });
                }
                gainPetXp({ userId }).catch(() => { });
                recordLeagueCXP({ userId, attempts, comboCount: newCombo }).catch(() => { });
                recordDailyPlay({ userId })
                  .then(async (streakResult) => {
                    if (!streakResult.alreadyRecorded && streakResult.isNewStreak) {
                      setIsFirstWordToday(true);
                      setStreakCount(streakResult.streak);
                      setBoostActive(true);
                      setTimeout(() => setBoostActive(false), 1500);
                      playSound("streak");
                    }
                    // Request notification permission at streak >= 3 (high-momentum moment)
                    const currentStreak = streakResult.streak ?? 0;
                    const granted = await hasPermission();
                    if (!granted && currentStreak >= 3) {
                      await requestPermission();
                    }
                    // Re-schedule reminders with the updated streak
                    if (await hasPermission()) {
                      rescheduleAfterPlay({
                        streakDays: currentStreak,
                        petName: petState?.petName ?? '',
                        petType: petState?.petType ?? 'ajolote',
                      }).catch(() => { });
                    }
                  })
                  .catch(() => { });
              }
            })
            .catch(() => { });
        });
      } else {
        setIsCorrect(false);
        setAttempts(attempts + 1);
        shakeRow();
        playSound("wrong");
        notifyError();
        triggerMascota("sad", "¡Ay!");
        if (!isMapReview) bondError(); // -3 vínculo por error

        // Record this word as failed (only once per word session, never in map repaso)
        if (!isMapReview && !hasRecordedFailRef.current && userId) {
          hasRecordedFailRef.current = true;
          const failWordId = isReviewMode ? reviewWordId : levelInfo?.wordId;
          if (failWordId) {
            recordFailMutation({ userId, wordId: failWordId, wordText: mexicanWord }).catch(() => { });
          }
        }
        setTimeout(() => {
          setGuess((prev) => {
            const newGuess = [...prev];
            for (let i = 0; i < newGuess.length; i++) {
              if (!fixedLetters.includes(i)) newGuess[i] = "";
            }
            return newGuess;
          });
          setWrongLetters([]);
          for (let i = 0; i < mexicanWord.length; i++) {
            if (!fixedLetters.includes(i)) { setSelectedBoxIndex(i); break; }
          }
        }, 400);
      }
    }
  };

  // ─── Keyboard ─────────────────────────────────────────────────────────────────
  // Helper: next non-space, non-fixed index after `from`
  const nextTypableIndex = (from, word) => {
    for (let i = from; i < word.length; i++) {
      if (word[i] !== " " && !fixedLetters.includes(i)) return i;
    }
    return from; // stay in place if nothing found
  };

  const onKeyPress = (key) => {
    lastInputTimeRef.current = Date.now(); // reset guide gaze timer
    // Dismiss combo banner on first keypress of the next word (non-blocking, keeps comboCount)
    dismissCombo();
    // Haptic + sound + animation handled by JuicyButton
    if (key === "DELETE_ONE") {
      if (guess.length > 0) {
        const newGuess = [...guess];
        const hasLetter =
          newGuess[selectedBoxIndex] &&
          newGuess[selectedBoxIndex] !== "" &&
          newGuess[selectedBoxIndex] !== " " &&
          !fixedLetters.includes(selectedBoxIndex);
        if (hasLetter) {
          newGuess[selectedBoxIndex] = "";
          setGuess(newGuess);
          setWrongLetters((prev) => prev.filter((i) => i !== selectedBoxIndex));
        }
        // Move cursor backward to previous typable slot (real backspace behavior)
        let prevIdx = selectedBoxIndex - 1;
        while (prevIdx >= 0 && (mexicanWord[prevIdx] === " " || fixedLetters.includes(prevIdx))) prevIdx--;
        if (prevIdx >= 0) setSelectedBoxIndex(prevIdx);
      }
      return;
    }
    if (key === "CLEAR_ALL") {
      if (guess.length > 0) {
        Animated.parallel(
          scaleAnims.map((anim) =>
            Animated.sequence([
              Animated.timing(anim, { toValue: 0.8, duration: 80, useNativeDriver: true }),
              Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
            ])
          )
        ).start(() => {
          setGuess((prev) => {
            const newGuess = [...prev];
            for (let i = 0; i < newGuess.length; i++) {
              // Keep spaces and fixed letters
              if (mexicanWord[i] !== " " && !fixedLetters.includes(i)) newGuess[i] = "";
            }
            return newGuess;
          });
          setWrongLetters([]);
          const first = nextTypableIndex(0, mexicanWord);
          setSelectedBoxIndex(first);
        });
      }
      return;
    }
    if (isCorrect) return;
    if (
      selectedBoxIndex < mexicanWord.length &&
      mexicanWord[selectedBoxIndex] !== " " &&
      !fixedLetters.includes(selectedBoxIndex)
    ) {
      const newGuess = [...guess];
      while (newGuess.length <= selectedBoxIndex) newGuess.push("");
      newGuess[selectedBoxIndex] = key;
      setGuess(newGuess);
      setWrongLetters((prev) => prev.filter((i) => i !== selectedBoxIndex));
      bounceAtIndex(selectedBoxIndex);
      // Advance to next typable slot (skip spaces)
      let next = selectedBoxIndex + 1;
      while (next < mexicanWord.length && (mexicanWord[next] === " " || fixedLetters.includes(next))) next++;
      if (next < mexicanWord.length) setSelectedBoxIndex(next);
      // Check completion (all non-space slots filled)
      const isComplete = newGuess.every((char, i) => i >= mexicanWord.length || char !== "");
      if (isComplete && newGuess.length >= mexicanWord.length) {
        validateWhenFull(newGuess.join(""));
      }
    }
  };
  onKeyPressRef.current = onKeyPress; // keep ref fresh every render for long-press repeat

  const selectLetterBox = (index) => {
    // Can't select a space or a fixed letter position
    if (index >= 0 && index < mexicanWord.length && mexicanWord[index] !== " " && !fixedLetters.includes(index)) {
      setSelectedBoxIndex(index);
    }
  };

  // ─── Power-ups ───────────────────────────────────────────────────────────────
  const checkCoins = (cost, actionKey) => {
    if (!userId || !user) { setShowAuthPrompt(true); return false; }
    if ((user.coins || 0) < cost) {
      setPendingAction(actionKey);
      setShowCoinsModal(true);
      return false;
    }
    return true;
  };

  // Show synonym / example hint – uses inventory first, then costs SYNONYM_COST coins
  const handleShowSynonym = async () => {
    if (isLoading || !levelInfo || isCorrect) return;
    if (showSynonym) return; // already revealed
    if (!wordExample && !wordMeaning) {
      Alert.alert("Sin pista", "No hay pista adicional disponible para esta palabra.");
      return;
    }
    try {
      if ((powerupInventory.synonyms ?? 0) > 0) {
        await usePowerupMutation({ userId, powerupType: "synonyms" });
      } else {
        if (!checkCoins(SYNONYM_COST, "synonym")) return;
        await updateUserCurrency({ userId, coins: -SYNONYM_COST, diamonds: 0 });
      }
      setShowSynonym(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo aplicar la pista. Intenta de nuevo.");
    }
  };

  // Revelar letra (A) – siempre gratis, sin monedas
  const handleReveal = () => {
    if (isLoading || !levelInfo || isCorrect) return;
    const emptyIndices = [];
    for (let i = 0; i < mexicanWord.length; i++) {
      if (!fixedLetters.includes(i) && (guess[i] === undefined || guess[i] === "" || guess[i] !== mexicanWord[i])) {
        emptyIndices.push(i);
      }
    }
    if (emptyIndices.length === 0) return;
    if (!checkCoins(HINT_COST, "reveal")) return;
    usedPowerupRef.current = true;
    updateUserCurrency({ userId, coins: -HINT_COST, diamonds: 0 }).catch(() => { });
    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const correctLetter = mexicanWord[randomIndex];
    // Mascota "elige" la letra — pequeño delay para dar sensación de búsqueda
    triggerMascota("celebrating", "✍️ ¡Aquí está!");
    setTimeout(() => {
      setFixedLetters((prev) => [...prev, randomIndex]);
      setGuess((prev) => {
        const newGuess = [...prev];
        while (newGuess.length <= randomIndex) newGuess.push("");
        newGuess[randomIndex] = correctLetter;
        return newGuess;
      });
      bounceAtIndex(randomIndex);
      // Check completion
      setTimeout(() => {
        setGuess((prev) => {
          const isComplete =
            prev.length >= mexicanWord.length &&
            Array.from({ length: mexicanWord.length }).every((_, idx) => prev[idx] && prev[idx] !== "");
          if (isComplete) validateWhenFull(prev.join(""));
          return prev;
        });
      }, 50);
    }, 220);
  };

  // Revelar letras correctas en el teclado (🔓) – 75🪙
  const handleBorrar = () => {
    if (isLoading || !levelInfo || isCorrect) return;
    if (revealedKeys !== null) {
      Alert.alert("Teclado ya revelado", "¡Ya puedes ver las letras correctas en el teclado!");
      return;
    }
    if (!checkCoins(BORRAR_COST, "borrar")) return;
    usedPowerupRef.current = true;
    updateUserCurrency({ userId, coins: -BORRAR_COST, diamonds: 0 }).catch(() => { });
    triggerMascota("celebrating", "🔑 ¡Mira las letras correctas!");
    // Letras únicas de la palabra (mayúsculas, sin espacios)
    const wordLetters = [...new Set([...mexicanWord.toUpperCase()].filter(c => c !== " "))];
    const shuffled = [...wordLetters].sort(() => Math.random() - 0.5);
    // Empieza con set vacío (oscurece todo el teclado), luego aparecen letra por letra
    setRevealedKeys(new Set());
    shuffled.forEach((letter, i) => {
      setTimeout(() => {
        setRevealedKeys(prev => new Set([...(prev || []), letter]));
      }, i * 180 + 80);
    });
  };

  // Completar palabra (⭐) – 200🪙, completa todas las letras
  const handleVerificar = () => {
    if (isLoading || !levelInfo || isCorrect) return;
    if (!checkCoins(VERIFICAR_COST, "verificar")) return;
    usedPowerupRef.current = true;
    updateUserCurrency({ userId, coins: -VERIFICAR_COST, diamonds: 0 }).catch(() => { });
    const allIndices = Array.from({ length: mexicanWord.length }, (_, i) => i).filter(i => mexicanWord[i] !== " ");
    setWrongLetters([]);
    // Mascota rellena la palabra letra a letra (typewriter rápido 80ms)
    triggerMascota("celebrating", "⭐ ¡Yo le entro!");
    allIndices.forEach((idx, i) => {
      setTimeout(() => {
        setGuess((prev) => {
          const newGuess = [...prev];
          newGuess[idx] = mexicanWord[idx];
          return newGuess;
        });
        setFixedLetters((prev) => [...prev, idx]);
        bounceAtIndex(idx);
      }, i * 80);
    });
    // Después de que todas las letras aparecen: celebrate + validar
    const fillDuration = allIndices.length * 80 + 120;
    setTimeout(() => {
      celebrate();
      const fullGuess = Array.from({ length: mexicanWord.length }).map((_, i) => mexicanWord[i]);
      validateWhenFull(fullGuess.join(""));
    }, fillDuration);
  };

  // Share
  const handleShare = async () => {
    try {
      await Share.share({
        message: "Estoy jugando Mexicanario 🇲🇽 ¿Me ayudas? Descárgalo ya!",
        title: "Mexicanario",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  // Retar a un amigo — comparte la pregunta sin revelar la respuesta
  const handleShareChallenge = async () => {
    const blanks = "_ ".repeat(mexicanWord.replace(/ /g, "").length).trim();
    const censoredExample = wordExample
      ? buildCensoredExample(wordExample, mexicanWord)
      : null;
    const lines = [
      `🇲🇽 ¡A ver si sabes!`,
      ``,
      `Adivina esta palabra mexicana:`,
      `👉 ${regularWord}`,
      blanks,
      ``,
      censoredExample ? `Pista: "${censoredExample}"` : null,
      wordRegion ? `Región: ${wordRegion}` : null,
      ``,
      `Descarga Mexicanario y juega conmigo 👇`,
      `https://mexicanario.app`,
    ].filter(Boolean).join("\n");

    try {
      await Share.share({ message: lines, title: "¿Adivinas esta palabra?" });
    } catch (error) {
      console.error("Share challenge error:", error);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading || !levelInfo) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#1A5276" />
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <ImageBackground
      source={require("../../assets/images/bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* TopBar */}
        <TopBar ref={topBarRef} showHomeButton={true} navigation={navigation} />

        {/* Review badge */}
        {isReviewMode && (
          <View style={styles.zoneBadgeRow}>
            <View style={styles.reviewBadge}>
              <Text style={styles.reviewBadgeText}>📚 Repaso</Text>
            </View>
          </View>
        )}

        {/* Enhanced combo counter overlay */}
        <EnhancedComboCounter comboCount={comboCount} visible={comboVisible} />

        {/* Mascota — draggable, above keyboard (hidden during victory) */}
        {petState?.hasPet && !showLevelUp && (
          <DraggablePet
            scaleFactor={TABLET_MODE ? 0.82 : 0.44}
            region={wordRegion || null}
            currentWord={mexicanWord || null}
            gameBubble={mascotaBubble}
            reaction={
              mascotaReaction === 'celebrating' ? 'correct'
                : mascotaReaction === 'sad' ? 'wrong'
                  : null
            }
          />
        )}

        {/* DEV: botón saltar nivel — solo visible en modo desarrollador */}
        {devEnabled && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={() => { setDevLevelInput(""); setShowDevModal(true); }}
          >
            <Text style={styles.devBtnText}>🔧 Nivel</Text>
          </TouchableOpacity>
        )}

        {/* Game Content */}
        <View style={styles.gameContent}>

          {/* ── Clue Card ── */}
          <View style={styles.clueCard}>
            {/* Main clue: the Spanish word/phrase to translate */}
            <Text style={styles.clueTitle}>{regularWord}</Text>
          </View>

          {/* ── Synonym / Hint reveal ── */}
          {showSynonym ? (
            <View style={styles.synonymBanner}>
              <Text style={styles.synonymBannerIcon}>💡</Text>
              <Text style={styles.synonymBannerText}>
                {wordExample
                  ? buildCensoredExample(wordExample, mexicanWord)
                  : wordMeaning}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.synonymBtn}
              onPress={handleShowSynonym}
              disabled={isCorrect}
            >
              <Text style={styles.synonymBtnIcon}>💡</Text>
              <Text style={styles.synonymBtnText}>Pista de frase</Text>
              <View style={styles.synonymBtnCost}>
                <Text style={styles.synonymBtnCostText}>🪙 {SYNONYM_COST}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Category icons row ── */}
          <View style={styles.categoryRow}>
            {categoryEmojis.map((emoji, i) => (
              <Text key={i} style={styles.categoryEmoji}>{emoji}</Text>
            ))}
          </View>

          {/* ── Letter Boxes — grouped by word ── */}
          <Animated.View
            style={[
              styles.wordBoxesContainer,
              {
                transform: [
                  {
                    translateX: shakeAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-10, 10],
                    }),
                  },
                ],
              },
            ]}
          >
            {(() => {
              // Split the word into segments separated by spaces
              // Each segment is { letters: string, startIdx: number }
              const segments = [];
              let cur = { startIdx: 0, letters: "" };
              for (let i = 0; i < mexicanWord.length; i++) {
                if (mexicanWord[i] === " ") {
                  segments.push(cur);
                  cur = { startIdx: i + 1, letters: "" };
                } else {
                  cur.letters += mexicanWord[i];
                }
              }
              segments.push(cur);

              return segments.map((seg, segIdx) => {
                // Dynamic scaling logic to ensure the word fits on one line
                const wordLength = seg.letters.length;
                // Base sizes — scaled up on tablet so tiles fill more screen space
                let boxSize = Math.round(38 * TILE_SCALE);
                let boxHeight = Math.round(42 * TILE_SCALE);
                let fontSize = Math.round(20 * TILE_SCALE);
                let marginH = Math.round(2 * TILE_SCALE);

                if (wordLength > 7) {
                  // If it's longer than 7 letters, we compress it
                  const scale = Math.max(0.65, 7.5 / wordLength);
                  boxSize = Math.floor(38 * TILE_SCALE * scale);
                  boxHeight = Math.floor(42 * TILE_SCALE * scale);
                  fontSize = Math.floor(20 * TILE_SCALE * scale);
                  marginH = Math.max(0.5, Math.floor(2 * TILE_SCALE * scale));
                }

                return (
                  <View key={segIdx} style={styles.wordRow}>
                    {/* Divider between words */}
                    {segIdx > 0 && (
                      <View style={styles.wordDivider}>
                        <View style={styles.wordDividerLine} />
                      </View>
                    )}

                    {/* Letter boxes for this word */}
                    <View style={styles.wordRowBoxes}>
                      {Array.from(seg.letters).map((_, letterIdx) => {
                        const idx = seg.startIdx + letterIdx;
                        const ch = (isCorrect && originalWord) ? (originalWord[idx] || guess[idx] || "") : (guess[idx] || "");
                        const isFixed = fixedLetters.includes(idx);
                        const isWrong = wrongLetters.includes(idx);
                        const isSelected = selectedBoxIndex === idx && !isFixed;
                        const animatedStyle = { transform: [{ scale: scaleAnims[idx] }] };

                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => selectLetterBox(idx)}
                            activeOpacity={0.7}
                          >
                            <Animated.View style={animatedStyle}>
                              <View
                                style={[
                                  styles.letterBox,
                                  { width: boxSize, height: boxHeight, marginHorizontal: marginH },
                                  isSelected && styles.letterBoxSelected,
                                  isCorrect && styles.letterBoxCorrect,
                                  isFixed && styles.letterBoxFixed,
                                  isWrong && styles.letterBoxWrong,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.letterText,
                                    { fontSize },
                                    isCorrect && styles.letterTextCorrect,
                                    isFixed && styles.letterTextFixed,
                                    isWrong && styles.letterTextWrong,
                                  ]}
                                >
                                  {ch}
                                </Text>
                              </View>
                            </Animated.View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              });
            })()}
          </Animated.View>
        </View>

        {/* ── Keyboard area ── */}
        <View style={styles.keyboardContainer}>

          {/* Power-up row */}
          <View style={styles.powerUpRow}>
            {/* Revelar 1 letra (A) – 25🪙 */}
            <TouchableOpacity style={[styles.powerUpBtn, styles.powerUpReveal]} onPress={handleReveal}>
              <Text style={styles.powerUpBtnLabel}>A</Text>
              <View style={styles.powerUpCost}>
                <Text style={styles.powerUpCostText}>🪙{HINT_COST}</Text>
              </View>
            </TouchableOpacity>

            {/* Revelar 3 letras (🔓) – 75🪙 */}
            <TouchableOpacity style={[styles.powerUpBtn, styles.powerUpBorrar]} onPress={handleBorrar}>
              <Text style={styles.powerUpBtnEmoji}>🔓</Text>
              <View style={styles.powerUpCost}>
                <Text style={styles.powerUpCostText}>🪙{BORRAR_COST}</Text>
              </View>
            </TouchableOpacity>

            {/* Completar todo (⭐) – 200🪙 */}
            <TouchableOpacity style={[styles.powerUpBtn, styles.powerUpVerificar]} onPress={handleVerificar}>
              <Text style={styles.powerUpBtnEmoji}>⭐</Text>
              <View style={styles.powerUpCost}>
                <Text style={styles.powerUpCostText}>🪙{VERIFICAR_COST}</Text>
              </View>
            </TouchableOpacity>

            {/* Retar amigo (!) – comparte la pregunta sin revelar la respuesta */}
            <TouchableOpacity
              style={[styles.powerUpBtn, styles.powerUpChallenge]}
              onPress={handleShareChallenge}
            >
              <Text style={styles.powerUpBtnLabel}>!</Text>
            </TouchableOpacity>
          </View>

          {/* Keyboard — JuicyButton for multisensory feedback */}
          <View style={styles.keyboard}>
            {KEYBOARD_LAYOUT.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keyboardRow}>
                {row.map((key) => {
                  const isSpecial = key === "DELETE_ONE" || key === "CLEAR_ALL";
                  const isDimmed = revealedKeys !== null && !isSpecial && !revealedKeys.has(key);
                  return (
                  <JuicyButton
                    key={key}
                    style={[
                      styles.key,
                      key === "DELETE_ONE" && styles.deleteKey,
                      key === "CLEAR_ALL" && styles.clearKey,
                      isDimmed && styles.keyDimmed,
                    ]}
                    disabled={isDimmed}
                    onPress={() => onKeyPress(key)}
                    onPressIn={key === "DELETE_ONE" ? startDeleteRepeat : undefined}
                    onPressOut={key === "DELETE_ONE" ? stopDeleteRepeat : undefined}
                    intensity={key === "CLEAR_ALL" ? "medium" : "light"}
                    scaleDown={0.88}
                  >
                    {key === "DELETE_ONE" ? (
                      <Image
                        source={require("../../assets/images/delete_one.png")}
                        style={styles.deleteIcon}
                      />
                    ) : key === "CLEAR_ALL" ? (
                      <Image
                        source={require("../../assets/icons/trash.png")}
                        style={styles.clearIcon}
                      />
                    ) : (
                      <Text style={styles.keyText}>{key}</Text>
                    )}
                  </JuicyButton>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* ── Modals ── */}
        <DictionaryModal
          visible={showDictionary}
          onClose={() => setShowDictionary(false)}
          wordData={{
            word: mexicanWord,
            meaning: wordMeaning || "Significado no disponible",
            mexican_word: mexicanWord,
            example: wordExample || "Ejemplo no disponible",
            region: wordRegion || "Región no disponible",
          }}
        />
        <MexicanarioModal visible={showMexicanario} onClose={() => setShowMexicanario(false)} />
        <WheelModal visible={showWheel} onClose={() => setShowWheel(false)} onOpenShop={() => { setShowWheel(false); setShowShop(true); }} />
        <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
        <SupportModal visible={showSupport} onClose={() => setShowSupport(false)} />
        <VenezolanometroModal visible={showVenezolanometro} onClose={() => setShowVenezolanometro(false)} />
        <AdRemovalModal visible={showAdRemoval} onClose={() => setShowAdRemoval(false)} />

        {/* DEV: Saltar a nivel */}
        <Modal visible={showDevModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>🔧 Ir al nivel</Text>
              <Text style={styles.modalText}>Escribe el número de nivel al que quieres saltar:</Text>
              <TextInput
                style={styles.devInput}
                keyboardType="number-pad"
                placeholder="Ej: 32"
                value={devLevelInput}
                onChangeText={setDevLevelInput}
                maxLength={4}
              />
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={async () => {
                  const target = parseInt(devLevelInput, 10);
                  if (!target || target < 1) {
                    Alert.alert("Error", "Escribe un número de nivel válido.");
                    return;
                  }
                  if (!userId) {
                    Alert.alert("Error", "Debes estar logueado.");
                    return;
                  }
                  try {
                    const result = await jumpToLevelMutation({ userId, targetLevel: target });
                    if (result.success) {
                      setShowDevModal(false);
                      skipNextInitRef.current = false;
                    } else {
                      Alert.alert("Error", result.error || "No se pudo saltar al nivel.");
                    }
                  } catch (e) {
                    Alert.alert("Error", "Fallo al saltar de nivel.");
                  }
                }}
              >
                <Text style={styles.modalBtnText}>Ir al nivel {devLevelInput || "—"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginTop: 12 }}
                onPress={() => setShowDevModal(false)}
              >
                <Text style={{ color: "#888", textAlign: "center" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Auth Prompt (triggered by isDefaultLevel / no userId) */}
        <Modal visible={showAuthPrompt} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.regCard}>
              <Text style={styles.regEmoji}>🎁</Text>
              <Text style={styles.regTitle}>¡Regístrate y gana varos!</Text>
              <Text style={styles.regSubtitle}>Crea tu cuenta gratis y recibe al instante:</Text>
              <View style={styles.regRewardRow}>
                <View style={styles.regRewardItem}>
                  <Text style={styles.regRewardEmoji}>🪙</Text>
                  <Text style={styles.regRewardAmount}>+500</Text>
                  <Text style={styles.regRewardLabel}>Varos</Text>
                </View>
                <View style={styles.regDivider} />
                <View style={styles.regRewardItem}>
                  <Text style={styles.regRewardEmoji}>💎</Text>
                  <Text style={styles.regRewardAmount}>+5</Text>
                  <Text style={styles.regRewardLabel}>Diamantes</Text>
                </View>
              </View>
              <Text style={styles.regTagline}>¡No cuesta nada y ganas un chingo! 🌶️</Text>
              <TouchableOpacity
                style={styles.regBtn}
                onPress={() => { setShowAuthPrompt(false); setShowRegisterLure(true); }}
              >
                <Text style={styles.regBtnText}>¡Quiero mis varos! 🌮</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.regDismiss} onPress={() => setShowAuthPrompt(false)}>
                <Text style={{ color: "#A0714F", fontSize: 13 }}>Ahora no</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Register Lure — aviso por nivel (niveles 5, 15, 30) */}
        <Modal visible={showRegisterLure} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.regCard}>
              <Text style={styles.regEmoji}>🎉</Text>
              <Text style={styles.regTitle}>¡Vas muy chido, cuate!</Text>
              <Text style={styles.regSubtitle}>Regístrate gratis y te regalamos:</Text>
              <View style={styles.regRewardRow}>
                <View style={styles.regRewardItem}>
                  <Text style={styles.regRewardEmoji}>🪙</Text>
                  <Text style={styles.regRewardAmount}>+500</Text>
                  <Text style={styles.regRewardLabel}>Varos</Text>
                </View>
                <View style={styles.regDivider} />
                <View style={styles.regRewardItem}>
                  <Text style={styles.regRewardEmoji}>💎</Text>
                  <Text style={styles.regRewardAmount}>+5</Text>
                  <Text style={styles.regRewardLabel}>Diamantes</Text>
                </View>
              </View>
              <Text style={styles.regTagline}>¡Solo esta vez, no la cagues! 🌶️</Text>
              <TouchableOpacity
                style={styles.regBtn}
                onPress={() => { setShowRegisterLure(false); setShowCuatesReg(true); }}
              >
                <Text style={styles.regBtnText}>¡Registrarme y cobrar! 🎁</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.regDismiss} onPress={() => setShowRegisterLure(false)}>
                <Text style={{ color: "#A0714F", fontSize: 13 }}>Quizás después</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* CuatesModal abierto desde los avisos */}
        <CuatesModal visible={showCuatesReg} onClose={() => setShowCuatesReg(false)} />

        {/* Coins Insufficient Modal */}
        <Modal visible={showCoinsModal} transparent animationType="slide">
          <View style={styles.coinsModalOverlay}>
            <View style={styles.coinsModalCard}>
              <Text style={styles.coinsModalTitle}>Monedas</Text>

              <View style={styles.coinsOptionsRow}>
                {/* Gratis */}
                <View style={styles.coinsOption}>
                  <View style={styles.coinsOptionBadge}>
                    <Text style={styles.coinsOptionBadgeText}>GRATIS</Text>
                  </View>
                  <Image
                    source={require("../../assets/images/coin.png")}
                    style={styles.coinsOptionImage}
                  />
                  <Text style={styles.coinsOptionAmount}>25</Text>
                  <TouchableOpacity
                    style={[styles.coinsOptionBtn, { backgroundColor: "#4CAF50" }]}
                    onPress={async () => {
                      if (userId) {
                        await updateUserCurrency({ userId, coins: 25 });
                      }
                      setShowCoinsModal(false);
                      setPendingAction(null);
                      // Coin fly en pantalla principal (modal ya cerrado)
                      const target = await getCoinPillTarget();
                      triggerMainCoin({
                        fromX: COIN_CENTER_X,
                        fromY: COIN_CENTER_Y,
                        toX: target.x + target.w / 2,
                        toY: target.y + target.h / 2,
                        coins: 25,
                        onAllArrived: () => topBarRef.current?.triggerBounce(),
                      });
                    }}
                  >
                    <Text style={styles.coinsOptionBtnText}>Gratis</Text>
                  </TouchableOpacity>
                </View>

                {/* Panas (use earned coins) */}
                <View style={styles.coinsOption}>
                  <Image
                    source={require("../../assets/images/coin.png")}
                    style={[styles.coinsOptionImage, { marginTop: 20 }]}
                  />
                  <Text style={styles.coinsOptionAmount}>50</Text>
                  <TouchableOpacity
                    style={[styles.coinsOptionBtn, { backgroundColor: "#4CAF50" }]}
                    onPress={async () => {
                      if (userId) {
                        await updateUserCurrency({ userId, coins: 50 });
                      }
                      setShowCoinsModal(false);
                      setPendingAction(null);
                      // Coin fly en pantalla principal (modal ya cerrado)
                      const target = await getCoinPillTarget();
                      triggerMainCoin({
                        fromX: COIN_CENTER_X,
                        fromY: COIN_CENTER_Y,
                        toX: target.x + target.w / 2,
                        toY: target.y + target.h / 2,
                        coins: 50,
                        onAllArrived: () => topBarRef.current?.triggerBounce(),
                      });
                    }}
                  >
                    <Text style={styles.coinsOptionBtnText}>Panas</Text>
                  </TouchableOpacity>
                </View>

                {/* Ad — ver video y ganar 75 monedas */}
                <View style={styles.coinsOption}>
                  <Image
                    source={require("../../assets/images/coin.png")}
                    style={[styles.coinsOptionImage, { marginTop: 20 }]}
                  />
                  <Text style={styles.coinsOptionAmount}>75</Text>
                  <TouchableOpacity
                    style={[
                      styles.coinsOptionBtn,
                      { backgroundColor: adAvailable && adReady ? "#1565C0" : "#8A8A8A" },
                    ]}
                    disabled={!adAvailable || !adReady}
                    onPress={() => {
                      const shown = showAd(async () => {
                        if (userId) {
                          await updateUserCurrency({ userId, coins: 75 });
                        }
                        setShowCoinsModal(false);
                        setPendingAction(null);
                        const target = await getCoinPillTarget();
                        triggerMainCoin({
                          fromX: COIN_CENTER_X,
                          fromY: COIN_CENTER_Y,
                          toX: target.x + target.w / 2,
                          toY: target.y + target.h / 2,
                          coins: 75,
                          onAllArrived: () => topBarRef.current?.triggerBounce(),
                        });
                      });
                      if (!shown) {
                        // Ad no disponible en Expo Go — dar monedas directamente en dev
                        if (__DEV__ && userId) {
                          updateUserCurrency({ userId, coins: 75 }).then(async () => {
                            setShowCoinsModal(false);
                            setPendingAction(null);
                            const target = await getCoinPillTarget();
                            triggerMainCoin({
                              fromX: COIN_CENTER_X, fromY: COIN_CENTER_Y,
                              toX: target.x + target.w / 2,
                              toY: target.y + target.h / 2,
                              coins: 75,
                              onAllArrived: () => topBarRef.current?.triggerBounce(),
                            });
                          });
                        }
                      }
                    }}
                  >
                    <Text style={styles.coinsOptionBtnText}>
                      {!adAvailable ? "📺 Ad" : adReady ? "📺 Ver Ad" : "⏳"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Ir a la Tienda */}
              <TouchableOpacity
                style={styles.coinsShopBtn}
                onPress={() => { setShowCoinsModal(false); setPendingAction(null); setShowShop(true); }}
              >
                <Text style={styles.coinsShopBtnText}>🛒 Ir a la Tienda</Text>
              </TouchableOpacity>

              {/* Close X */}
              <TouchableOpacity style={styles.coinsModalClose} onPress={() => { setShowCoinsModal(false); setPendingAction(null); }}>
                <Text style={styles.coinsModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <ShopScreen visible={showShop} onClose={() => setShowShop(false)} />

        {/* ══════════════════════════════════════════════════════════
             VICTORY SCREEN — full dark overlay
             ══════════════════════════════════════════════════════════ */}
        <Modal visible={showLevelUp} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.victoryOverlay}>

            {/* ── Confetti burst (behind everything) ── */}
            <View style={styles.confettiContainer} pointerEvents="none">
              {confettiAnims.map((p, i) => (
                <Animated.View
                  key={i}
                  style={{
                    position: "absolute",
                    width: p.size,
                    height: p.size,
                    borderRadius: p.size / 2,
                    backgroundColor: p.color,
                    opacity: p.opacity,
                    transform: [
                      { translateY: p.y },
                      { translateX: p.x },
                      { scale: p.scale },
                      { rotate: p.rotation.interpolate({ inputRange: [0, 6], outputRange: ["0deg", "1080deg"] }) },
                    ],
                  }}
                />
              ))}
            </View>

            {/* ── Main content ── */}
            <View style={styles.victoryContent}>

              {/* ── Trophy / mascot area (emoji for perf — avoids 2nd 3D canvas) ── */}
              <View style={styles.victoryIconWrap}>
                <Text style={styles.victoryIconEmoji}>
                  {petState?.hasPet ? "🎉" : "🎁"}
                </Text>
              </View>

              {/* ── Combo info in victory modal ── */}
              {maxCombo >= 3 && (
                <Text style={styles.victoryComboInfo}>
                  🔥 ¡Combo máximo: x{maxCombo}!
                </Text>
              )}

              {/* ── Celebration phrase (rotates by level) ── */}
              <Text style={styles.victoryCelebration}>{getVictoryPhrase(victoryLevel)}</Text>

              {/* ── Guessed word (frozen snapshot) + botón de pronunciación ── */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.victoryPhrase}>
                  {victoryWord
                    ? `¡${victoryWord.charAt(0) + victoryWord.slice(1).toLowerCase()}!`
                    : `¡${mexicanWord.charAt(0) + mexicanWord.slice(1).toLowerCase()}!`}
                </Text>
                <TouchableOpacity
                  onPress={() => Speech.speak(victoryWord || mexicanWord, { language: "es-MX", rate: 0.85 })}
                  style={{ padding: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 20 }}>🔊</Text>
                </TouchableOpacity>
              </View>

              {/* ── Review mode: "Aprendiste de tu error" ── */}
              {isReviewMode && (
                <View style={styles.reviewVictoryBanner}>
                  <Text style={styles.reviewVictoryText}>🧠 ¡Aprendiste de tu error!</Text>
                </View>
              )}

              {/* ── Zone completion banner ── */}
              {zoneCompleted && (
                <View style={[styles.zoneCompletedBanner, { borderColor: zoneCompleted.color }]}>
                  <Text style={styles.zoneCompletedTitle}>
                    🎊 ¡Conquistaste {zoneCompleted.name}! {zoneCompleted.emoji}
                  </Text>
                  {zoneCompletedNext && (
                    <Text style={styles.zoneCompletedNext}>
                      Siguiente destino: {zoneCompletedNext.emoji} {zoneCompletedNext.name}
                    </Text>
                  )}
                </View>
              )}

              {/* ── Info pill: example + region (frozen snapshot) ── */}
              {(victoryExample || victoryRegion) ? (
                <View style={styles.victoryInfoCard}>
                  {victoryExample ? (
                    <>
                      <Text style={styles.victoryExampleLabel}>Ejemplo de uso:</Text>
                      <Text style={styles.victoryExample}>"{victoryExample}"</Text>
                    </>
                  ) : null}
                  {victoryRegion ? (
                    <View style={styles.victoryRegionRow}>
                      <Text style={styles.victoryRegionDot}>📍</Text>
                      <Text style={styles.victoryRegionLabel}>{victoryRegion}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* ── Progress ring  (nivel X / total) ── */}
              <View style={styles.progressRingWrap}>
                {/* Outer ring background */}
                <View style={styles.progressRingOuter}>
                  {/* Filled arc — simple approach: colored left half + rotate right half */}
                  {(() => {
                    const current = levelInfo?.level || 1;
                    const total = totalLevels || 50;
                    const pct = Math.min(current / total, 1);
                    const deg = pct * 360;
                    return (
                      <>
                        {/* Left half (always teal) */}
                        <View style={[styles.progressHalf, styles.progressHalfLeft]}>
                          <View
                            style={[
                              styles.progressHalfInner,
                              { transform: [{ rotate: `${deg <= 180 ? deg : 180}deg` }] },
                              { backgroundColor: "#E9967A" },
                            ]}
                          />
                        </View>
                        {/* Right half — only visible if > 50% */}
                        {deg > 180 && (
                          <View style={[styles.progressHalf, styles.progressHalfRight]}>
                            <View
                              style={[
                                styles.progressHalfInner,
                                { transform: [{ rotate: `${deg - 180}deg` }] },
                                { backgroundColor: "#E9967A" },
                              ]}
                            />
                          </View>
                        )}
                      </>
                    );
                  })()}

                  {/* Inner circle (gift icon) */}
                  <View style={styles.progressRingInner}>
                    <Text style={styles.progressRingGift}>🎁</Text>
                  </View>
                </View>

                {/* Counter label */}
                <Text style={styles.progressLabel}>
                  {levelInfo?.level || 1}/{totalLevels}
                </Text>
              </View>

              {/* ── Rewards row ── */}
              <View style={styles.victoryRewardRow}>
                <View style={styles.victoryRewardPill}>
                  <Text style={{ fontSize: 16 }}>🐾</Text>
                  <Text style={styles.victoryRewardText}>+Vínculo</Text>
                </View>
                <View style={styles.victoryRewardPill}>
                  <Image source={require("../../assets/icons/diamond.png")} style={styles.victoryRewardIcon} />
                  <Text style={styles.victoryRewardText}>+{levelUpReward?.diamonds || 0}</Text>
                </View>
              </View>
            </View>

            {/* ── Bottom actions ── */}
            <View style={styles.victoryBottomActions}>
              <TouchableOpacity
                style={styles.victoryContinueBtn}
                onPress={() => {
                  setShowLevelUp(false);
                  if (isMapReview) {
                    // Return to map after a repaso — no progress change
                    navigation.navigate("Map");
                    return;
                  }
                  skipNextInitRef.current = false; // allow initGame() again
                  initGame();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.victoryContinueText}>
                  {isMapReview ? "🗺️ Volver al mapa" : levelInfo?.isLastLevel ? "Reiniciar desde el inicio 🔄" : "Continuar"}
                </Text>
              </TouchableOpacity>

              <View style={styles.victorySecondaryBtns}>
                <TouchableOpacity
                  style={styles.victoryCircleBtn}
                  onPress={() => { setShowLevelUp(false); navigation.navigate("MainMenu"); }}
                >
                  <Text style={styles.victoryCircleBtnIcon}>🏠</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.victoryCircleBtn} onPress={handleShare}>
                  <Text style={styles.victoryCircleBtnIcon}>📤</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Coin fly overlay dentro del modal de victoria */}
            <CoinFlyOverlay coins={victoryCoins} particles={victoryCoinParticles} onCoinArrived={onVictoryCoinArrived} />

          </View>
        </Modal>

      </SafeAreaView>

      {/* Coin fly overlay — fuera de SafeAreaView para usar coordenadas absolutas de pantalla */}
      <CoinFlyOverlay coins={mainCoins} particles={mainCoinParticles} onCoinArrived={onMainCoinArrived} />

      {/* Onboarding tutorial — shown only on first play */}
      {obActive && !showLevelUp && (() => {
        const s = ONBOARDING_STEPS[obStep];
        return (
          <OnboardingTooltip
            visible={obActive}
            text={s.text}
            bubbleStyle={s.bubbleStyle}
            handStyle={s.handStyle}
            handEmoji={s.handEmoji}
            handBounceDir={s.handBounceDir}
            step={obStep}
            total={ONBOARDING_STEPS.length}
            onNext={() => obAdvance(ONBOARDING_STEPS.length)}
            onSkip={obSkip}
          />
        );
      })()}

    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  devBtn: {
    position: "absolute",
    top: height * 0.13,
    right: 12,
    zIndex: 999,
    backgroundColor: "#E67E22",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 10,
  },
  devBtnText: { fontSize: 14, fontWeight: "bold", color: "white" },
  devInput: {
    borderWidth: 1.5,
    borderColor: "#1A5276",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A5276",
    textAlign: "center",
    width: "100%",
    marginBottom: 16,
  },

  // Game layout
  gameContent: {
    flex: 1,
    paddingTop: 104,
    paddingHorizontal: 16,
    paddingBottom: KEYBOARD_HEIGHT + 10,
  },

  // ── Clue Card ──────────────────────────────────────────────────────────────
  clueCard: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
    alignItems: "center",
  },
  clueTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A5276",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  clueSynonym: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A5276",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },

  // ── Category Emojis ─────────────────────────────────────────────────────────
  categoryRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryEmoji: {
    fontSize: 28,
    marginHorizontal: 5,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A5276",
    justifyContent: "center",
    alignItems: "center",
  },
  infoButtonText: {
    fontSize: 16,
  },

  // ── Letter Boxes ────────────────────────────────────────────────────────────
  wordBoxesContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 8,
  },
  wordContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  // Shown in place of a letter box where the word has a space
  // Word grouping styles
  wordRow: {
    width: "100%",
    alignItems: "center",
    marginBottom: 0,
  },
  wordRowBoxes: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  wordDivider: {
    width: "100%",
    alignItems: "center",
    marginVertical: 4,
  },
  wordDividerLine: {
    width: 60,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  letterSpacerGap: {
    width: 14,
    height: 52,
    margin: 2,
  },

  letterBox: {
    width: 38,
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D5D8DC",
    backgroundColor: "#F2F3F4",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  letterBoxFirst: {
    backgroundColor: "#1A5276",
    borderColor: "#154360",
  },
  letterBoxSelected: {
    borderColor: "#1A5276",
    backgroundColor: "#D6EAF8",
  },
  letterBoxCorrect: {
    backgroundColor: "#27AE60",
    borderColor: "#196F3D",
  },
  letterBoxFixed: {
    backgroundColor: "#FFF3CD",
    borderColor: "#F59B40",
  },
  letterBoxWrong: {
    backgroundColor: "#FADBD8",
    borderColor: "#E74C3C",
  },
  letterText: {
    fontSize: TABLET_MODE ? 28 : 20,
    fontWeight: "800",
    color: "#1A5276",
  },
  letterTextCorrect: {
    color: "white",
  },
  letterTextFixed: {
    color: "#B7770D",
  },
  letterTextWrong: {
    color: "#C0392B",
  },

  // ── Keyboard container ──────────────────────────────────────────────────────
  keyboardContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: KEYBOARD_HEIGHT,
    backgroundColor: "#EAECEE",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
  },

  // ── Power-up row ────────────────────────────────────────────────────────────
  powerUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
  },
  powerUpBtn: {
    borderRadius: 100,        // full pill — no square edges
    paddingTop: 9,
    paddingBottom: 20,        // room for the badge inside
    paddingHorizontal: 4,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 1,
    marginHorizontal: 3,
    position: "relative",
    // bottom-edge depth — game button look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 6,
  },
  powerUpReveal: { backgroundColor: "#43A047" },
  powerUpBorrar: { backgroundColor: "#D81B60" },
  powerUpVerificar: { backgroundColor: "#1976D2" },
  powerUpInfo: { backgroundColor: "#78909C" },
  powerUpChallenge: { backgroundColor: "#F57C00" },
  powerUpBtnLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "white",
    letterSpacing: 0.5,
  },
  powerUpBtnEmoji: {
    fontSize: 16,
  },
  powerUpCost: {
    position: "absolute",
    bottom: 5,
    backgroundColor: "rgba(0,0,0,0.32)",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  powerUpCostText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },

  // ── Keyboard ────────────────────────────────────────────────────────────────
  keyboard: {
    width: "100%",
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 7,
  },
  key: {
    width: TABLET_MODE ? 42 : 32,
    height: TABLET_MODE ? 56 : 54,
    marginHorizontal: TABLET_MODE ? 2 : 2,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: TABLET_MODE ? 3 : 2.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  deleteKey: { width: TABLET_MODE ? 64 : 52, backgroundColor: "#C8C8D0" },
  clearKey:  { width: TABLET_MODE ? 64 : 52, backgroundColor: "#C8C8D0" },
  keyDimmed: { backgroundColor: "#D0D0D8", opacity: 0.25 },
  keyText: {
    fontSize: TABLET_MODE ? 21 : 18,
    fontWeight: "800",
    color: "#1A5276",
  },
  deleteIcon: { width: TABLET_MODE ? 28 : 22, height: TABLET_MODE ? 28 : 22, tintColor: "#1A5276" },
  clearIcon: { width: TABLET_MODE ? 28 : 22, height: TABLET_MODE ? 28 : 22, tintColor: "#C0392B" },

  // ── Modals ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 24,
    width: "82%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A5276",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
    color: "#555",
    marginBottom: 18,
    lineHeight: 22,
  },
  modalBtnPrimary: {
    backgroundColor: "#1A5276",
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  modalBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // ── Registro modales (Auth Prompt + Register Lure) ──────────────────────────
  regCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#8B4513",
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    width: "86%",
    alignItems: "center",
    shadowColor: "#5C2800",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 18,
  },
  regEmoji: {
    fontSize: 52,
    textAlign: "center",
    marginBottom: 6,
  },
  regTitle: {
    fontSize: 22,
    fontFamily: "Fredoka-Bold",
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 6,
  },
  regSubtitle: {
    fontSize: 14,
    color: "#A0714F",
    textAlign: "center",
    marginBottom: 16,
  },
  regRewardRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFE4B5",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.3)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 0,
    marginBottom: 14,
    width: "100%",
  },
  regRewardItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  regRewardEmoji: {
    fontSize: 34,
  },
  regRewardAmount: {
    fontSize: 26,
    fontWeight: "900",
    color: "#C8950A",
    lineHeight: 30,
  },
  regRewardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A0714F",
    letterSpacing: 0.5,
  },
  regDivider: {
    width: 1.5,
    height: 52,
    backgroundColor: "rgba(139,69,19,0.25)",
    marginHorizontal: 8,
  },
  regTagline: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#D2691E",
    textAlign: "center",
    marginBottom: 16,
  },
  regBtn: {
    backgroundColor: "#F8BE17",
    borderWidth: 2,
    borderColor: "#C8950A",
    borderRadius: 50,
    paddingVertical: 13,
    paddingHorizontal: 28,
    width: "100%",
    alignItems: "center",
    marginBottom: 4,
  },
  regBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#8B4513",
  },
  regDismiss: {
    paddingVertical: 10,
    alignItems: "center",
  },

  // Coins Modal
  coinsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  coinsModalCard: {
    backgroundColor: "#F4F6F7",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  coinsModalTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A5276",
    marginBottom: 20,
  },
  coinsOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
    marginBottom: 20,
  },
  coinsOption: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  coinsOptionBadge: {
    backgroundColor: "#E91E63",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  coinsOptionBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "900",
  },
  coinsOptionImage: {
    width: 52,
    height: 52,
    resizeMode: "contain",
  },
  coinsOptionAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A5276",
    marginVertical: 6,
  },
  coinsOptionBtn: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "100%",
    alignItems: "center",
  },
  coinsOptionBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  coinsShopBtn: {
    backgroundColor: "#C0392B",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 10,
  },
  coinsShopBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  coinsModalClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
  },
  coinsModalCloseText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  // Level up extras
  trophyIcon: { width: 64, height: 64, marginBottom: 12 },

  // Win reveal styles
  winWordText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A5276",
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: "center",
  },
  winDefinitionBox: {
    backgroundColor: "#EBF5FB",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1A5276",
  },
  winDefinitionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1A5276",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  winDefinitionText: {
    fontSize: 15,
    color: "#2C3E50",
    lineHeight: 22,
  },
  winExampleBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignSelf: "stretch",
    borderLeftWidth: 4,
    borderLeftColor: "#F59B40",
  },
  winExampleLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B7770D",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  winExampleText: {
    fontSize: 15,
    color: "#7D4E00",
    lineHeight: 22,
    fontStyle: "italic",
  },
  winRegionBadge: {
    backgroundColor: "#D5F5E3",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  winRegionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E8449",
  },

  rewardRow: {

    flexDirection: "row",
    marginVertical: 14,
  },
  rewardItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 12 },
  rewardIcon: { width: 30, height: 30, marginRight: 6 },
  rewardText: { fontSize: 20, fontWeight: "bold", color: "#1A5276" },
  levelUpActions: { width: "100%" },
  shareBtn: {
    borderWidth: 2,
    borderColor: "#1A5276",
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
  },
  shareBtnText: {
    color: "#1A5276",
    fontWeight: "bold",
    fontSize: 15,
  },

  // ── Synonym hint button & banner ──────────────────────────────────────────
  synonymBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: 22,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "#F59B40",
    marginBottom: 8,
  },
  synonymBtnIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  synonymBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B7770D",
    marginRight: 8,
  },
  synonymBtnCost: {
    backgroundColor: "#F59B40",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  synonymBtnCostText: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
  },
  synonymBanner: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59B40",
  },
  synonymBannerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  synonymBannerText: {
    fontSize: 14,
    color: "#7D4E00",
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },

  // ══════════════════════════════════════════════════════════
  // Victory Screen Styles
  // ══════════════════════════════════════════════════════════
  victoryOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 20, 0.92)",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 28,
  },
  confettiContainer: {
    position: "absolute",
    top: "35%",
    left: "50%",
    width: 0,
    height: 0,
    zIndex: 10,
  },
  victoryContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  victoryIconWrap: {
    marginBottom: 8,
  },
  victoryIconEmoji: {
    fontSize: 64,
  },
  victoryCelebration: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6BCB77",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  victoryPhrase: {
    fontSize: 30,
    fontWeight: "900",
    color: "white",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 18,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  victoryExampleLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  victoryInfoCard: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  victoryExample: {
    fontSize: 15,
    color: "rgba(255,255,255,0.90)",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  victoryRegionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  victoryRegionDot: {
    fontSize: 14,
    marginRight: 4,
  },
  victoryRegionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6BCB77",
    letterSpacing: 0.5,
  },

  // ── Progress ring ──────────────────────────────────────────────────────────
  progressRingWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  progressRingOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#2C2C3E",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  progressHalf: {
    position: "absolute",
    width: 55,
    height: 110,
    top: 0,
    overflow: "hidden",
  },
  progressHalfLeft: {
    left: 0,
  },
  progressHalfRight: {
    right: 0,
  },
  progressHalfInner: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    top: 0,
    transformOrigin: "55px 55px",
  },
  progressRingInner: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  progressRingGift: {
    fontSize: 36,
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "white",
    letterSpacing: 1,
  },

  // ── Rewards ────────────────────────────────────────────────────────────────
  victoryRewardRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  victoryRewardPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  victoryRewardIcon: {
    width: 24,
    height: 24,
    marginRight: 6,
  },
  victoryRewardText: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
  },

  // ── Bottom action buttons ──────────────────────────────────────────────────
  victoryBottomActions: {
    width: "100%",
    alignItems: "center",
  },
  victoryContinueBtn: {
    backgroundColor: "#FFD93D",
    borderRadius: 50,
    paddingVertical: 16,
    width: "85%",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#FFD93D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  victoryContinueText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  victorySecondaryBtns: {
    flexDirection: "row",
    gap: 20,
  },
  victoryCircleBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  victoryCircleBtnIcon: {
    fontSize: 22,
  },
  // ── GameMascot wrapper ──
  gameMascotWrap: {
    position: "absolute",
    bottom: KEYBOARD_HEIGHT + 10,
    right: 8,
    width: 100,
    height: 120,
    zIndex: 150,
  },
  // ── Victory combo info ──
  victoryComboInfo: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FF6B35",
    textAlign: "center",
    marginBottom: 4,
  },

  // ── Zone badge row (below TopBar in gameplay) ──
  zoneBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  zoneBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zoneBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  reviewBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#1565C0CC",
  },
  reviewBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // ── Review victory banner (in modal) ──
  reviewVictoryBanner: {
    backgroundColor: "#1565C022",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1565C0",
  },
  reviewVictoryText: { color: "#64B5F6", fontSize: 14, fontWeight: "700", textAlign: "center" },

  // ── Zone completion banner (in victory modal) ──
  zoneCompletedBanner: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  zoneCompletedTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  zoneCompletedNext: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    textAlign: "center",
  },
});

