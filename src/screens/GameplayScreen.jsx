import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import * as Sharing from "expo-sharing";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AccessibilityInfo,
  Alert,
  Animated,
  BackHandler,
  Easing,
  Image,
  ImageBackground,
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
import { captureRef } from "react-native-view-shot";
import { api } from "../../convex/_generated/api";
import AdRemovalModal from "../components/AdRemovalModal";
import CoinFlyOverlay from "../components/CoinFlyOverlay";
import DiamondFlyOverlay from "../components/DiamondFlyOverlay";
import CuatesModal from "../components/CuatesModal";
import DictionaryModal from "../components/DictionaryModal";
import EnhancedComboCounter from "../components/EnhancedComboCounter";
import JuicyButton from "../components/JuicyButton";
import MexicanarioModal from "../components/MexicanarioModal";
import OnboardingTooltip from "../components/OnboardingTooltip";
import DraggablePet from "../components/PetCompanion/DraggablePet";
import StageCropped from "../components/PetCompanion/StageCropped";
import SupportModal from "../components/SupportModal";
import TermsModal from "../components/TermsModal";
import RankUpOverlay from "../components/RankUpOverlay";
import FriendToast from "../components/FriendToast";
import TopBar from "../components/TopBar";
import { getRank, getRankIndex, didRankUp } from "../config/xpRanks";
import VictoryModal from "../components/VictoryModal";
import VictoryShareCard from "../components/VictoryShareCard";
import WheelModal from "../components/WheelModal";
import { getCulturalPathTransition } from "../config/mexicoZones";
import { getCulturalEmojis, getCulturalVictoryPhrase } from "../config/culturalPresentation";
import { useAuth } from "../context/AuthContext";
import useCoinFly from "../hooks/useCoinFly";
import useDiamondFly from "../hooks/useDiamondFly";
import { useCombo } from "../hooks/useCombo";
import useDevMode from "../hooks/useDevMode";
import { useInterstitialAd } from "../hooks/useInterstitialAd";
import { useOnboarding } from "../hooks/useOnboarding";
import { useRewardedAd } from "../hooks/useRewardedAd";
import { comboBurst, notifyError, notifySuccess, notifyWarning } from "../services/haptics";
import { hasPermission, requestPermission, rescheduleAfterPlay } from "../services/notificationService";
import usePetStore from "../store/usePetStore";
import { playBGM, playSound, stopBGM } from "../utils/soundManager";
import { TABLET_MODE } from "../utils/tabletSetup";
import { useKeyboardLayout } from "../hooks/useKeyboardLayout";
import { compareWordsFlexibly, normalizeWordForDisplay } from "../utils/textUtils";
import ShopScreen from "./ShopScreen";


const SOFT_GAME_SHADOW = {
  shadowColor: '#153A52',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.14,
  shadowRadius: 6,
  elevation: 5,
};

const MASCOTA_CHEER_KEY = "@mexicanario:mascota_cheer_date";

// Keyboard layout
const KEYBOARD_LAYOUT = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
  ["CLEAR_ALL", "Z", "X", "C", "V", "B", "N", "M", "DELETE_ONE"],
];

/** Mensajes aleatorios de celebración cuando el jugador adivina la palabra */
const WIN_PHRASES_PERFECT = [
  "¡Órale, qué crack!",
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
  "¡Bien hecho, lo adivinaste!",
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

/** Genera un mensaje sarcástico/gracioso alusivo a la palabra que se completó con el poder ⭐ */
const getVerificarMascotMessage = (word, meaning) => {
  const w = (word || "").replace(/ /g, "").toUpperCase();
  const m = (meaning || "").toLowerCase();
  const len = w.length;

  // Mensajes con la palabra incluida (más dopaminéticos)
  const wordSpecific = [
    `⭐ "${word}" ya era — ¡te la sabías y te hiciste!`,
    `⭐ ¡Ándale! "${word}" en el bote 🫙`,
    `⭐ "${word}"... como si no supieras, jaja`,
    `⭐ ¡A ver si la usas esta semana! "${word}" 😏`,
    `⭐ "${word}" — de nada, mi rey 👑`,
    `⭐ Pa' que sepas: "${word}" existe y es de acá 🇲🇽`,
    `⭐ ¡Anotado! "${word}" desbloqueada 🔓`,
    `⭐ "${word}" al carrito, yo invito 🛒`,
    `⭐ ¡Con dinero todo se puede, hasta "${word}"! 💸`,
    `⭐ "${word}" ¿la usabas o ni la conocías? 👀`,
  ];

  // Mensajes por longitud de palabra
  const shortWordPhrases = [
    `⭐ ¡Tan cortita y no la adivinabas! 🤏`,
    `⭐ ${len} letras... ¿en serio? 😂`,
    `⭐ Era chiquita pero mató, jaja 🐭`,
    `⭐ Con ${len} letritas — ¡uff, difícil! 😤`,
  ];

  const longWordPhrases = [
    `⭐ Esa sí venía pesada, no te culpo 🧠`,
    `⭐ ${len} letras... normal que necesitaras ayuda 😅`,
    `⭐ Era un trabalenguas de nivel épico 🎙️`,
    `⭐ Hasta yo sudé con esa 💦`,
  ];

  // Mensajes por contenido semántico
  const foodPhrases = [
    `⭐ Con esa palabra seguro me entra el hambre 🌮`,
    `⭐ Qué buena, hasta se me antojó algo 🍜`,
    `⭐ Palabra de comida = palabra sagrada 😤🇲🇽`,
  ];

  const drinkPhrases = [
    `⭐ ¡Salud! Por "${word}" 🥂`,
    `⭐ Esta palabra sabe a fiesta 🎉`,
  ];

  const insultPhrases = [
    `⭐ Eso sí que es vocabulario mexicano 😂`,
    `⭐ Mis abuelos estarían orgullosos 👴🏽`,
    `⭐ De las palabras que te dan carácter 💪`,
  ];

  const moneyPhrases = [
    `⭐ Bien gastados los pesitos, ¿no? 😜`,
    `⭐ ¡Inversión inteligente! 📈`,
    `⭐ El conocimiento no es gratis... pero casi 🧾`,
  ];

  // Pool de mensajes generales sarcásticos
  const generalPhrases = [
    `⭐ Así se hace cuando uno no sabe 😌`,
    `⭐ Pa' eso estamos, para tapar hoyos 🕳️`,
    `⭐ Yo le entro... ¡porque tú no pudiste! 😄`,
    `⭐ ¿Qué habrías hecho sin mí? 🦅`,
    `⭐ El poder ⭐ nunca falla, igual que yo 😎`,
    `⭐ Sin comentarios... pero toma tu victoria 🏅`,
    `⭐ No me agradezcas, solo es mi trabajo 🎩`,
    `⭐ Eso se llama delegar inteligentemente 🤝`,
    `⭐ ¡Ta' bueno! Aunque trampa, pero bueno 😆`,
    `⭐ La próxima la adivinas solo, ¿verdad? 😏`,
    `⭐ Nivel completado por obra y gracia de mis poderes ✨`,
    `⭐ Ahora ya la puedes presumir — tú la "adivinaste" 😂`,
    `⭐ El que paga manda, y ya pagaste 💰`,
    `⭐ Misión cumplida... a medias, pero cumplida 😅`,
    `⭐ Oye, al menos sabes cuándo pedir ayuda 👍`,
  ];

  // Selección inteligente basada en contexto
  const roll = Math.random();

  // 40% de probabilidad: mensaje con la palabra específica
  if (roll < 0.40) {
    return pickRandom(wordSpecific);
  }

  // 15%: basado en longitud
  if (roll < 0.55) {
    if (len <= 4) return pickRandom(shortWordPhrases);
    if (len >= 9) return pickRandom(longWordPhrases);
  }

  // 15%: basado en semántica del significado
  if (roll < 0.70) {
    const foodWords = ["comida", "comer", "taco", "torta", "atole", "nixtamal", "pozole", "enchilada", "tamale", "guiso", "sopa"];
    const drinkWords = ["beber", "bebida", "pulque", "mezcal", "tepache", "cerveza", "agua"];
    const insultWords = ["insulto", "groser", "malo", "enfado", "enojo", "burla", "albur", "maldic"];
    const moneyWords = ["dinero", "plata", "lana", "pago", "varo", "billete", "trampa"];
    if (foodWords.some(fw => m.includes(fw))) return pickRandom(foodPhrases);
    if (drinkWords.some(dw => m.includes(dw))) return pickRandom(drinkPhrases);
    if (insultWords.some(iw => m.includes(iw))) return pickRandom(insultPhrases);
    if (moneyWords.some(mw => m.includes(mw))) return pickRandom(moneyPhrases);
  }

  // Fallback: mensaje general sarcástico
  return pickRandom(generalPhrases);
};

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

// Memoized tile — only re-renders when THIS tile's data changes
const LetterTile = React.memo(function LetterTile({
  idx, ch, isFixed, isWrong, isSelected, isCorrect,
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
});

class PetErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(e) { console.warn('[PetErrorBoundary] mascota crash:', e?.message); }
  render() { return this.state.crashed ? null : this.props.children; }
}

export default function GameplayScreen({ navigation, route }) {
  // ── Mounted guard — prevents setState in async callbacks after unmount ──
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // ── Dynamic keyboard layout ──
  const kb = useKeyboardLayout();
  const layout = kb.layout;
  const compactKeyHitSlop = kb.kbKeyH < 44 || kb.kbKeyW < 44
    ? { top: 4, right: 2, bottom: 4, left: 2 }
    : undefined;
  const coinCenterX = layout.viewportWidth / 2;
  const coinCenterY = layout.viewportHeight / 2;
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotionEnabled);
    return () => subscription.remove();
  }, []);

  // UI state — consolidated modal state (only one modal open at a time, prevents re-render cascade)
  const [openModal, setOpenModal] = useState(null);
  const showDictionary    = openModal === 'dictionary';
  const showMexicanario   = openModal === 'mexicanario';
  const showWheel         = openModal === 'wheel';
  const showTerms         = openModal === 'terms';
  const showSupport       = openModal === 'support';
  const showAdRemoval     = openModal === 'adRemoval';
  const showAuthPrompt    = openModal === 'authPrompt';
  const showRegisterLure  = openModal === 'registerLure';
  const showCuatesReg     = openModal === 'cuatesReg';
  const showCoinsModal    = openModal === 'coinsModal';
  const showShop          = openModal === 'shop';
  const showExitPrompt    = openModal === 'exitPrompt';
  const promptedLevelsRef = useRef(new Set());
  const [pendingAction, setPendingAction] = useState(null); // which power-up was attempted when coins ran out

  // Android Back Button Handler — uses refs to avoid re-subscribing on every state change
  const backHandlerStateRef = useRef({ isCorrect: false, showLevelUp: false, openModal: null, showDevModal: false });
  useEffect(() => {
    backHandlerStateRef.current = { isCorrect, showLevelUp, openModal, showDevModal };
  });
  useEffect(() => {
    const backAction = () => {
      const s = backHandlerStateRef.current;
      if (s.isCorrect || s.showLevelUp || s.openModal || s.showDevModal) {
        return false; // let default behavior happen (e.g., close modal)
      }
      setOpenModal('exitPrompt');
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  // Refs para coin fly
  const topBarRef = useRef(null);
  const victoryRewardRef = useRef(null);
  const victoryShareRef = useRef(null);

  // Coin fly — dos instancias: una para la pantalla principal, otra para el modal de victoria
  const { flyCoins: mainCoins, particles: mainCoinParticles, triggerCoinFly: triggerMainCoin, onCoinArrived: onMainCoinArrived } = useCoinFly();
  const { flyCoins: victoryCoins, particles: victoryCoinParticles, triggerCoinFly: triggerVictoryCoin, onCoinArrived: onVictoryCoinArrived } = useCoinFly();
  // Diamond fly — para el modal de victoria
  const { flyDiamonds: victoryDiamonds, diamondParticles: victoryDiamondParticles, triggerDiamondFly: triggerVictoryDiamond, onDiamondArrived: onVictoryDiamondArrived } = useDiamondFly();

  // Posición fallback del pill de monedas (igual que AchievementsScreen)
  const getCoinPillFallback = () => {
    // Use the live viewport so rotation keeps the fallback in the top-right corner.
    // regardless of the tablet Dimensions patch
    const topPad = Platform.OS === "ios" ? 52 : 36;
    const pillH = 36;
    const pillW = 110;
    const pillX = layout.viewportWidth - 16 - pillW;
    return { x: pillX, y: topPad, w: pillW, h: pillH };
  };

  const getCoinPillTarget = async () => {
    const measured = await topBarRef.current?.measureCoinPill();
    return (measured && measured.h > 0) ? measured : getCoinPillFallback();
  };

  const getDiamondPillFallback = () => {
    const topPad = Platform.OS === "ios" ? 52 : 36;
    const coinPillLeft = layout.viewportWidth - 16 - 110;
    return { x: coinPillLeft - 10 - 90, y: topPad, w: 90, h: 36 };
  };

  const getDiamondPillTarget = async () => {
    const measured = await topBarRef.current?.measureDiamondPill();
    return (measured && measured.h > 0) ? measured : getDiamondPillFallback();
  };

  // Rewarded ad para el modal de monedas
  const { ready: adReady, available: adAvailable, showAd } = useRewardedAd();

  // Interstitial ad — shown every 5 completed levels
  const { showAd: showInterstitial } = useInterstitialAd();
  const completedLevelsRef = useRef(0);

  // Onboarding — shown only on first launch
  const { step: obStep, active: obActive, advance: obAdvance, skip: obSkip } = useOnboarding("gameplay");
  const ONBOARDING_STEPS = useMemo(() => [
    {
      text: "¡Toca las letras del teclado para adivinar la palabra mexicana! 🎹",
      bubbleStyle: { bottom: kb.kbHeight + 30, left: 20, right: 20 },
      handStyle: { bottom: kb.kbHeight + 10, left: layout.viewportWidth / 2 - 24 },
      handEmoji: "👇",
      handBounceDir: "down",
    },
    {
      text: "¡Así se llena la cuadrícula! Cuando completes la palabra presiona ✓ para confirmar 🏆",
      bubbleStyle: { top: layout.viewportHeight * 0.22, left: 20, right: 20 },
      handStyle: { top: layout.viewportHeight * 0.5, left: layout.viewportWidth / 2 - 24 },
      handEmoji: "👆",
      handBounceDir: "up",
    },
  ], [kb.kbHeight, layout.viewportWidth, layout.viewportHeight]);

  // Proactive rewarded ad offer (shown on 3rd wrong attempt)
  const [showRewardedOffer, setShowRewardedOffer] = useState(false);
  // Rank-up overlay state
  const [showRankUp, setShowRankUp] = useState(false);
  const [rankUpOld, setRankUpOld] = useState(null);
  const [rankUpNew, setRankUpNew] = useState(null);
  // Motivational friend toast
  const [friendToastMsg, setFriendToastMsg] = useState(null);
  const [showFriendToast, setShowFriendToast] = useState(false);

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
  const [wordPathId, setWordPathId] = useState(null);
  const [wordPlaceId, setWordPlaceId] = useState(null);
  // Victory snapshot — frozen copy of current-level data shown in the modal
  // (needed because completeLevelMutation increments the level immediately,
  //  causing levelInfo to update reactively before the modal closes)
  const [victorySnap, setVictorySnap] = useState({ word: "", example: "", region: "", level: 1, pathId: null, placeId: null });
  const victoryWord = victorySnap.word;
  const victoryExample = victorySnap.example;
  const victoryRegion = victorySnap.region;
  const victoryLevel = victorySnap.level;

  // Review mode — failed word scheduled for re-review
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewWordId, setReviewWordId] = useState(null);
  const hasRecordedFailRef = useRef(false);   // prevent duplicate recordFail calls per word
  const mascotaCheerDateRef = useRef(null);    // date string of last cheer bubble (daily limit)

  // Challenge mode — playing a friend challenge word
  const challengeModeParam = route?.params?.challengeMode ?? false;
  const challengeIdParam = route?.params?.challengeId ?? null;
  const challengeWordParam = route?.params?.challengeWord ?? null;
  const [isChallengeMode, setIsChallengeMode] = useState(!!challengeModeParam);
  const [challengeStartTime, setChallengeStartTime] = useState(null);
  const [challengeResult, setChallengeResult] = useState(null);
  const respondToChallengeMut = useMutation(api.friends.respondToChallenge);
  const { userId, user } = useAuth();

  // Map repaso mode — replaying a completed level from the map (no progress change)
  const reviewLevelParam = route?.params?.reviewLevel ?? null;
  const [isMapReview, setIsMapReview] = useState(!!reviewLevelParam);
  const mapReviewData = useQuery(
    api.levels.getLevelByNumber,
    reviewLevelParam && userId ? { levelNumber: reviewLevelParam, userId } : "skip"
  );

  // Cultural path completion — only set from exact consecutive backend metadata.
  const [zoneCompleted, setZoneCompleted] = useState(null);
  const [zoneCompletedNext, setZoneCompletedNext] = useState(null);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0);
  const categoryEmojis = useMemo(
    () => getCulturalEmojis(wordPlaceId || wordRegion),
    [wordPlaceId, wordRegion]
  );

  // Hint costs (no free/inventory system — always charged)
  const HINT_COST = 25;       // A — revela 1 letra
  const BORRAR_COST = 75;     // 🔓 — revela 3 letras
  const VERIFICAR_COST = 200; // ⭐ — completa todo
  const SYNONYM_COST = 30;    // ❓ — muestra definición
  const [fixedLetters, setFixedLetters] = useState([]); // indices filled by hints (locked)
  const [showSynonym, setShowSynonym] = useState(false); // whether the synonym hint is visible
  const [revealedKeys, setRevealedKeys] = useState(null); // null=inactive, Set<string>=keyboard filter active (🔓 hint)

  // Auth and game hooks
  const levelInfo = useQuery(api.users.getCurrentLevel, userId ? { userId } : "skip");
  const updateUserCurrency = useMutation(api.users.updateUserCurrency);
  const completeLevelMutation = useMutation(api.levels.completeLevel);
  const addXp = useMutation(api.users.addXp);
  const claimShareReward = useMutation(api.users.claimShareReward);
  const gainPetXp = useMutation(api.pet.gainPetXp);
  const allLevels = useQuery(api.levels.getAllLevels);
  const jumpToLevelMutation = useMutation(api.devTools.jumpToLevel);
  const usePowerupMutation = useMutation(api.shop.usePowerup);
  const claimFreeCoins = useMutation(api.shop.claimFreeCoins);
  const recordDailyPlay = useMutation(api.streaks.recordDailyPlay);
  const recordBestCombo = useMutation(api.streaks.recordBestCombo);
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

  // Friends weekly leaderboard (for motivational toast)
  const friendsWeekly = useQuery(
    api.friends.getFriendsLeaderboard,
    userId ? { userId, period: "weekly" } : "skip"
  );

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
  const wrongClearTimerRef = useRef(null); // cancel wrong-answer clear if user types early

  // Stable per-key onPress handlers — created once (use ref so onKeyPress never goes stale).
  // Allows React.memo on JuicyButton to skip re-renders when onPress didn't change.
  const keyHandlers = useMemo(() => {
    const map = {};
    KEYBOARD_LAYOUT.flat().forEach((k) => {
      map[k] = () => onKeyPressRef.current?.(k);
    });
    return map;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Load last mascot cheer date from storage (daily limit)
  useEffect(() => {
    AsyncStorage.getItem(MASCOTA_CHEER_KEY).then((v) => {
      if (v) mascotaCheerDateRef.current = v;
    });
  }, []);

  // Cleanup all timers on unmount — prevents setState on unmounted component
  useEffect(() => {
    return () => {
      clearTimeout(mascotaTimer.current);
      clearTimeout(wrongClearTimerRef.current);
      clearTimeout(deleteHoldTimerRef.current);
      clearInterval(deleteRepeatRef.current);
    };
  }, []);

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

  // Disparar coin fly y diamond fly cuando se abre el modal de victoria
  useEffect(() => {
    if (!showLevelUp) return;
    const hasCoins = levelUpReward?.coins > 0;
    const hasDiamonds = levelUpReward?.diamonds > 0;
    if (!hasCoins && !hasDiamonds) return;
    const timer = setTimeout(async () => {
      // Medir fuente: el pill de recompensa dentro del modal
      let srcX = coinCenterX;
      let srcY = coinCenterY * 1.36;
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
      if (hasCoins) {
        const target = await getCoinPillTarget();
        triggerVictoryCoin({
          fromX: srcX, fromY: srcY,
          toX: target.x + target.w / 2,
          toY: target.y + target.h / 2,
          coins: levelUpReward.coins,
          onAllArrived: () => topBarRef.current?.triggerBounce(),
        });
      }
      if (hasDiamonds) {
        const target = await getDiamondPillTarget();
        triggerVictoryDiamond({
          fromX: srcX, fromY: srcY,
          toX: target.x + target.w / 2,
          toY: target.y + target.h / 2,
          diamonds: levelUpReward.diamonds,
        });
      }
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
  const wordSegments = useMemo(() => {
    const tileScale = layout.mode === 'tablet' || (layout.isLandscape && layout.safeWidth >= 800)
      ? 1.4
      : 1;
    const segs = [];
    let cur = { startIdx: 0, letters: "" };
    for (let i = 0; i < mexicanWord.length; i++) {
      if (mexicanWord[i] === " ") {
        segs.push(cur);
        cur = { startIdx: i + 1, letters: "" };
      } else {
        cur.letters += mexicanWord[i];
      }
    }
    segs.push(cur);
    return segs.map((seg) => {
      const wordLength = seg.letters.length;
      let boxSize = Math.round(38 * tileScale);
      let boxHeight = Math.round(42 * tileScale);
      let fontSize = Math.round(20 * tileScale);
      let marginH = Math.round(2 * tileScale);
      if (wordLength > 7) {
        const scale = Math.max(0.65, 7.5 / wordLength);
        boxSize = Math.floor(38 * tileScale * scale);
        boxHeight = Math.floor(42 * tileScale * scale);
        fontSize = Math.floor(20 * tileScale * scale);
        marginH = Math.max(0.5, Math.floor(2 * tileScale * scale));
      }
      return { ...seg, boxSize, boxHeight, fontSize, marginH };
    });
  }, [mexicanWord, layout.mode, layout.isLandscape, layout.safeWidth]);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  // Prevents the levelInfo useEffect from calling initGame() while the
  // victory modal is open (Convex updates levelInfo reactively as soon as
  // completeLevelMutation runs, which used to wipe showLevelUp before it showed).
  const skipNextInitRef = useRef(false);
  const usedPowerupRef = useRef(false);    // true if any hint powerup was used this round
  const lastInputTimeRef = useRef(Date.now()); // timestamp of last keypress (for guide gaze)


  // ─── AsyncStorage persistence ─────────────────────────────────────────────
  const SAVE_KEY = (levelNum) => `@mexicanario_save_level_${levelNum}`;

  const saveProgress = useCallback(async (levelNum, guessArr, fixed, synonym, boxIdx, revealed) => {
    try {
      await AsyncStorage.setItem(SAVE_KEY(levelNum), JSON.stringify({
        guess: guessArr,
        fixedLetters: fixed,
        showSynonym: synonym,
        selectedBoxIndex: boxIdx,
        revealedKeys: revealed ? [...revealed] : null,
      }));
    } catch (_) { }
  }, []);

  const clearProgress = useCallback(async (levelNum) => {
    try { await AsyncStorage.removeItem(SAVE_KEY(levelNum)); } catch (_) { }
  }, []);

  // Save whenever guess or revealedKeys changes
  useEffect(() => {
    if (mexicanWord && !isCorrect && levelInfo?.level) {
      saveProgress(levelInfo.level, guess, fixedLetters, showSynonym, selectedBoxIndex, revealedKeys);
    }
  }, [guess, revealedKeys]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setWordPathId(null);
    setWordPlaceId(null);
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
    setShowRewardedOffer(false);
    setOpenModal(null);
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
        setWordPathId(mapReviewData.pathId || null);
        setWordPlaceId(mapReviewData.placeId || null);
        const initial = Array.from(wordUp).map((ch) => (ch === " " ? " " : ""));
        setGuess(initial);
        const firstNonSpace = initial.findIndex((ch) => ch !== " ");
        setSelectedBoxIndex(firstNonSpace >= 0 ? firstNonSpace : 0);
        setIsLoading(false);
        return;
      }

      // ── Challenge mode: play a specific word from a friend challenge ──
      if (isChallengeMode && challengeWordParam) {
        const wordUp = normalizeWordForDisplay(challengeWordParam.word);
        setMexicanWord(wordUp);
        setOriginalWord(challengeWordParam.word.toUpperCase());
        setRegularWord(challengeWordParam.meaning?.toUpperCase() || "");
        setWordMeaning(challengeWordParam.meaning || "");
        setWordExample(challengeWordParam.example || "");
        setWordRegion(challengeWordParam.region || "");
        setWordPathId(challengeWordParam.pathId || null);
        setWordPlaceId(challengeWordParam.placeId || null);
        const initial = Array.from(wordUp).map((ch) => (ch === " " ? " " : ""));
        setGuess(initial);
        const firstNonSpace = initial.findIndex((ch) => ch !== " ");
        setSelectedBoxIndex(firstNonSpace >= 0 ? firstNonSpace : 0);
        setChallengeStartTime(Date.now());
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
        setWordPathId(activeReview.pathId || null);
        setWordPlaceId(activeReview.placeId || null);
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
          setWordPathId(levelInfo.pathId || null);
          setWordPlaceId(levelInfo.placeId || null);

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
                  // Restore keyboard reveal if user paid for it
                  if (Array.isArray(saved.revealedKeys)) {
                    setRevealedKeys(new Set(saved.revealedKeys));
                    usedPowerupRef.current = true;
                  }
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
          setOpenModal('authPrompt');
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
    if (!reviewLevelParam && !isChallengeMode && levelInfo && !skipNextInitRef.current) {
      initGame();
    }
  }, [levelInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Retos y repasos fallidos traen su propia palabra y no deben esperar al nivel normal.
  useEffect(() => {
    if (isChallengeMode && challengeWordParam && !skipNextInitRef.current) initGame();
  }, [isChallengeMode, challengeWordParam]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!reviewLevelParam && !isChallengeMode && reviewWord && !skipNextInitRef.current) initGame();
  }, [reviewWord]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setTimeout(() => setOpenModal('registerLure'), 800);
    }
  }, [levelInfo?.level]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Animations ─────────────────────────────────────────────────────────────
  const bounceAtIndex = (idx) => {
    if (reduceMotionEnabled) return;
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 1.18, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnims[idx], { toValue: 1, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const shakeRow = () => {
    if (reduceMotionEnabled) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const celebrate = () => {
    if (reduceMotionEnabled) return;
    // Stagger(20ms) instead of parallel — distributes native animation starts over time,
    // reducing the JS→native burst that causes jank on Android.
    // Tiles all turn green simultaneously (isCorrect state); the scale wave is decoration.
    const anims = Array.from(mexicanWord).reduce((acc, ch, i) => {
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
  };

  // ─── Rewards ─────────────────────────────────────────────────────────────────
  // Small base + slow growth: 3 coins at lvl1, +1 every 25 levels
  const calculateReward = () => {
    const baseReward = levelInfo?.reward || { coins: 3, diamonds: 1 };
    const levelPos = levelInfo?.level || 1;
    const coins = 3 + Math.floor((levelPos - 1) / 25);
    return { coins, diamonds: baseReward.diamonds };
  };

  // ─── Validation ───────────────────────────────────────────────────────────────
  const validateWhenFull = async (nextGuess) => {
    // Onboarding: auto-advance step 1 before tile animations run
    if (obActive && obStep === 1) { obAdvance(ONBOARDING_STEPS.length); }
    const guessString = Array.isArray(nextGuess) ? nextGuess.join("") : nextGuess;
    if (guessString.length === mexicanWord.length) {
      const isCorrectFlexible = compareWordsFlexibly(guessString, mexicanWord);
      if (isCorrectFlexible) {
        setIsCorrect(true);
        setWrongLetters([]);
        celebrate();
        // Diferir TTS para no bloquear el JS thread durante la animación de tiles
        setTimeout(() => Speech.speak(mexicanWord, { language: "es-MX", rate: 0.85 }), 300);

        // Resolve review word if we're in review mode
        if (isReviewMode && reviewWordId) {
          resolveWordMutation({ userId, wordId: reviewWordId }).catch(() => { });
        }

        // Cultural path transition: never infer from legacy level numbers.
        let didCompleteZone = false;
        if (!isReviewMode && !isMapReview && !isChallengeMode && levelInfo?.level) {
          const transition = getCulturalPathTransition(
            levelInfo.pathId,
            levelInfo.nextPathId,
            levelInfo.culturalOrderVersion
          );
          if (transition) {
            didCompleteZone = true;
            setZoneCompleted(transition.completed);
            setZoneCompletedNext(transition.next);
          }
        }

        // ── Map repaso mode: no combo, no rewards, simple feedback ──
        if (isMapReview) {
          playSound("correct");
          notifySuccess();
          triggerMascota("celebrating", "¡Repasado!");
          setVictorySnap({
            word: originalWord || mexicanWord,
            example: wordExample,
            region: wordRegion,
            level: reviewLevelParam || 1,
            pathId: mapReviewData?.pathId,
            placeId: mapReviewData?.placeId,
          });
          setLevelUpReward({ coins: 0, diamonds: 0 });
          setTimeout(() => {
            setShowLevelUp(true);
            playSound("celebration");
          }, 500);
          return;
        }

        // ── Challenge mode: submit result, no level advance ──
        if (isChallengeMode && challengeIdParam) {
          playSound("correct");
          // celebrate() already called above at line 1041 — don't double-call
          notifySuccess();
          triggerMascota("celebrating", "¡Reto completado!");
          const elapsedMs = Date.now() - (challengeStartTime || Date.now());
          try {
            const result = await respondToChallengeMut({
              challengeId: challengeIdParam,
              userId,
              attempts: attempts + 1, // attempts is 0-based errors, send total
              timeMs: elapsedMs,
            });
            setChallengeResult(result);
          } catch (e) {
            console.warn("Challenge respond error:", e);
          }
          setVictorySnap({
            word: originalWord || mexicanWord,
            example: wordExample,
            region: wordRegion,
            level: levelInfo?.level || 1,
            pathId: challengeWordParam?.pathId,
            placeId: challengeWordParam?.placeId,
          });
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
            const today = new Date().toISOString().slice(0, 10);
            const cheerBubble = mascotaCheerDateRef.current !== today
              ? (mascotaCheerDateRef.current = today,
                AsyncStorage.setItem(MASCOTA_CHEER_KEY, today),
                pickRandom(WIN_PHRASES_PERFECT))
              : null;
            triggerMascota("celebrating", cheerBubble);
          }
          bondAcierto(); // +15 vínculo por acierto
        } else {
          // Had wrong attempts — combo grace: lose 1 instead of full reset
          newCombo = Math.max(0, comboCount - 1);
          if (comboCount > 0) {
            playSound("combo_break");
            notifyWarning();
          } else {
            playSound("correct");
            notifySuccess();
          }
          resetCombo(newCombo); // reduce combo by 1 (grace system)
          const today = new Date().toISOString().slice(0, 10);
          const cheerBubble = mascotaCheerDateRef.current !== today
            ? (mascotaCheerDateRef.current = today,
              AsyncStorage.setItem(MASCOTA_CHEER_KEY, today),
              pickRandom(WIN_PHRASES_ATTEMPTS))
            : null;
          triggerMascota("celebrating", cheerBubble);
          bondAcierto(); // +15 vínculo incluso con intentos previos
        }

        // Clear saved progress for this level — it's done!
        if (levelInfo?.level) clearProgress(levelInfo.level);
        if (!userId) {
          setOpenModal('authPrompt');
          return;
        }
        // Snapshot current-level data NOW before mutation overwrites Convex reactive values
        const snapWord = originalWord || mexicanWord;
        const snapExample = wordExample;
        const snapRegion = wordRegion;
        const snapLevel = levelInfo?.level || 1;
        const snapPathId = wordPathId;
        const snapPlaceId = wordPlaceId;
        // Block levelInfo useEffect from resetting game while victory modal is open
        skipNextInitRef.current = true;
        // Calculate reward synchronously (needs levelInfo before mutation runs)
        // Powerup used → coins still earned (user already paid the cost); diamonds skipped (perfect-only bonus)
        const baseReward = calculateReward();
        const reward = usedPowerupRef.current
          ? { coins: baseReward.coins, diamonds: 0 }
          : baseReward;
        const displayReward = (!usedPowerupRef.current && didCompleteZone)
          ? { ...reward, coins: reward.coins + 100 }
          : reward;

        // Batch all victory state updates in a single setTimeout — one re-render
        // instead of 5 immediate + 1 delayed. Keeps JS thread free for animations.
        const victoryDelay = attempts === 0 ? 1350 : 500;
        setTimeout(() => {
          setVictorySnap({ word: snapWord, example: snapExample, region: snapRegion, level: snapLevel, pathId: snapPathId, placeId: snapPlaceId });
          setLevelUpReward(displayReward);
          setShowLevelUp(true);
          playSound("celebration");
        }, victoryDelay);

        // Fire level completion immediately — InteractionManager.runAfterInteractions
        // can silently fail on Android if celebrate() animation callbacks don't settle.
        completeLevelMutation({
          userId,
          levelNumber: levelInfo.level,
          isPerfect: !isMapReview && attempts === 0 && !usedPowerupRef.current,
        })
          .then((levelResult) => {
            if (levelResult.success) {
              completedLevelsRef.current += 1;
              const totalCoins = displayReward.coins; // includes zone bonus; 0 if powerup used
              if (totalCoins > 0 || displayReward.diamonds > 0) {
                updateUserCurrency({ userId, coins: totalCoins, diamonds: displayReward.diamonds }).catch(() => { });
              }
              gainPetXp({ userId }).catch(() => { });
              // XP cultural: base + bonos por combo, racha, sesión y velocidad
              const isPerfectLevel = !isMapReview && attempts === 0 && !usedPowerupRef.current;
              let xpAmount = 10; // base
              if (isPerfectLevel) xpAmount += 15; // perfecto
              if (newCombo >= 3) xpAmount += Math.min(newCombo * 2, 20); // combo: +6 a +20
              const streak = user?.playStreak ?? 0;
              if (streak >= 3) xpAmount += Math.min(streak, 10); // racha: +3 a +10
              if (completedLevelsRef.current >= 10) xpAmount += 5; // sesión larga: +5
              if (completedLevelsRef.current >= 20) xpAmount += 5; // sesión muy larga: +10 total
              // Speed bonus
              const timeSeconds = (Date.now() - wordStartTime) / 1000;
              if (timeSeconds <= 10) xpAmount += 5;
              else if (timeSeconds <= 20) xpAmount += 3;
              else if (timeSeconds <= 30) xpAmount += 1;
              // Track old XP for rank-up detection
              const currentXp = user?.xp ?? 0;
              addXp({ userId, amount: xpAmount })
                .then((result) => {
                  if (!mountedRef.current) return;
                  if (result && didRankUp(result.oldXp, result.newXp)) {
                    setRankUpOld(getRank(result.oldXp));
                    setRankUpNew(getRank(result.newXp));
                    // Delay to let victory modal show first
                    setTimeout(() => { if (mountedRef.current) setShowRankUp(true); }, 2500);
                  }
                  // Motivational friend toast (~20% chance)
                  if (Math.random() < 0.2 && friendsWeekly?.length > 1) {
                    const me = friendsWeekly.find((e) => e.isSelf);
                    const ahead = friendsWeekly.filter(
                      (e) => !e.isSelf && e.xpThisWeek > (me?.xpThisWeek ?? 0)
                    );
                    if (ahead.length > 0) {
                      const rival = ahead[ahead.length - 1]; // closest rival
                      const diff = rival.xpThisWeek - (me?.xpThisWeek ?? 0);
                      const name = rival.username ? `@${rival.username}` : rival.name;
                      setFriendToastMsg(
                        `${name} tiene ${rival.xpThisWeek} XP esta semana. Tú llevas ${me?.xpThisWeek ?? 0}. ¡Faltan ${diff}!`
                      );
                      setTimeout(() => { if (mountedRef.current) setShowFriendToast(true); }, 2000);
                    }
                  }
                })
                .catch(() => { });
              recordLeagueCXP({ userId, attempts, comboCount: newCombo }).catch(() => { });
              if (newCombo > 0) recordBestCombo({ userId, sessionMaxCombo: newCombo }).catch(() => { });
              recordDailyPlay({ userId })
                .then(async (streakResult) => {
                  if (!mountedRef.current) return;
                  if (!streakResult.alreadyRecorded && streakResult.isNewStreak) {
                    setIsFirstWordToday(true);
                    setStreakCount(streakResult.streak);
                    setBoostActive(true);
                    setTimeout(() => { if (mountedRef.current) setBoostActive(false); }, 1500);
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
      } else {
        setIsCorrect(false);
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        shakeRow();
        playSound("wrong");
        notifyError();
        triggerMascota("sad", "¡Ay!");
        if (!isMapReview) bondError(); // -3 vínculo por error
        if (nextAttempts === 3 && adReady && !isMapReview) {
          setShowRewardedOffer(true);
        }

        // Record this word as failed (only once per word session, never in map repaso)
        if (!isMapReview && !hasRecordedFailRef.current && userId) {
          hasRecordedFailRef.current = true;
          const failWordId = isReviewMode ? reviewWordId : levelInfo?.wordId;
          if (failWordId) {
            recordFailMutation({ userId, wordId: failWordId, wordText: mexicanWord }).catch(() => { });
          }
        }
        wrongClearTimerRef.current = setTimeout(() => {
          wrongClearTimerRef.current = null;
          setGuess((prev) => {
            const newGuess = [...prev];
            for (let i = 0; i < newGuess.length; i++) {
              // Preserve spaces (multi-word answers) and fixed letters
              if (mexicanWord[i] !== " " && !fixedLetters.includes(i)) newGuess[i] = "";
            }
            return newGuess;
          });
          setWrongLetters([]);
          for (let i = 0; i < mexicanWord.length; i++) {
            if (mexicanWord[i] !== " " && !fixedLetters.includes(i)) { setSelectedBoxIndex(i); break; }
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
    // Cancel pending wrong-answer clear AND immediately clear stale letters
    if (wrongClearTimerRef.current) {
      clearTimeout(wrongClearTimerRef.current);
      wrongClearTimerRef.current = null;
      // Clear old wrong letters (preserve spaces + fixed/hint letters)
      setGuess((prev) => {
        const cleared = [...prev];
        for (let i = 0; i < cleared.length; i++) {
          if (mexicanWord[i] !== " " && !fixedLetters.includes(i)) cleared[i] = "";
        }
        return cleared;
      });
      const firstEmpty = nextTypableIndex(0, mexicanWord);
      setSelectedBoxIndex(firstEmpty);
      return; // consume this keystroke for the clear, next one starts fresh
    }
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
        if (reduceMotionEnabled) {
          setGuess((prev) => prev.map((letter, index) =>
            mexicanWord[index] === " " || fixedLetters.includes(index) ? letter : ""
          ));
          setWrongLetters([]);
          setSelectedBoxIndex(nextTypableIndex(0, mexicanWord));
          return;
        }
        Animated.stagger(10,
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
    // Onboarding: auto-advance step 0 on first keypress
    if (obActive && obStep === 0) { obAdvance(ONBOARDING_STEPS.length); }
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
      // Check completion BEFORE bounceAtIndex — celebrate() inside validateWhenFull
      // handles ALL tiles including the last one. Calling both causes animation conflict.
      const isComplete = newGuess.every((char, i) => i >= mexicanWord.length || char !== "");
      if (isComplete && newGuess.length >= mexicanWord.length) {
        validateWhenFull(newGuess.join(""));
      } else {
        bounceAtIndex(selectedBoxIndex);
        // Advance to next typable slot (skip spaces & fixed letters)
        let next = selectedBoxIndex + 1;
        while (next < mexicanWord.length && (mexicanWord[next] === " " || fixedLetters.includes(next))) next++;
        if (next < mexicanWord.length) {
          setSelectedBoxIndex(next);
        } else {
          // No slot ahead — wrap around to first empty typable slot
          const emptyIdx = newGuess.findIndex(
            (ch, i) => i < mexicanWord.length && ch === "" && mexicanWord[i] !== " " && !fixedLetters.includes(i)
          );
          if (emptyIdx !== -1) setSelectedBoxIndex(emptyIdx);
        }
      }
    }
  };
  onKeyPressRef.current = onKeyPress; // keep ref fresh every render for long-press repeat

  const selectLetterBox = useCallback((index) => {
    // Can't select a space or a fixed letter position
    if (index >= 0 && index < mexicanWord.length && mexicanWord[index] !== " " && !fixedLetters.includes(index)) {
      setSelectedBoxIndex(index);
    }
  }, [mexicanWord, fixedLetters]);

  // ─── Power-ups ───────────────────────────────────────────────────────────────
  const checkCoins = (cost, actionKey) => {
    if (!userId || !user) { setOpenModal('authPrompt'); return false; }
    if ((user.coins || 0) < cost) {
      setPendingAction(actionKey);
      setOpenModal('coinsModal');
      return false;
    }
    return true;
  };

  // Show synonym / example hint – uses inventory first, then costs SYNONYM_COST coins
  const handleShowSynonym = async () => {
    if (isLoading || !mexicanWord || isCorrect) return;
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
    if (isLoading || !mexicanWord || isCorrect) return;
    // Cancel any pending wrong-answer clear so hint letter isn't wiped
    if (wrongClearTimerRef.current) {
      clearTimeout(wrongClearTimerRef.current);
      wrongClearTimerRef.current = null;
    }
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
      // Check completion — read guess via ref to avoid side-effect inside setState
      setTimeout(() => {
        setGuess((prev) => {
          const isComplete =
            prev.length >= mexicanWord.length &&
            Array.from({ length: mexicanWord.length }).every((_, idx) => prev[idx] && prev[idx] !== "");
          if (isComplete) {
            // Defer validation outside setState to avoid side-effect in updater
            requestAnimationFrame(() => validateWhenFull(prev.join("")));
          }
          return prev;
        });
      }, 50);
    }, 220);
  };

  // Revelar letras correctas en el teclado (🔓) – 75🪙
  const handleBorrar = () => {
    if (isLoading || !mexicanWord || isCorrect) return;
    if (revealedKeys !== null) {
      Alert.alert("Teclado ya revelado", "¡Ya puedes ver las letras correctas en el teclado!");
      return;
    }
    if (!checkCoins(BORRAR_COST, "borrar")) return;
    // Cancel any pending wrong-answer clear so it doesn't wipe user input
    if (wrongClearTimerRef.current) {
      clearTimeout(wrongClearTimerRef.current);
      wrongClearTimerRef.current = null;
    }
    // Clear wrong letters from previous attempt so tiles are fresh
    setGuess((prev) => {
      const cleared = [...prev];
      for (let i = 0; i < cleared.length; i++) {
        if (mexicanWord[i] !== " " && !fixedLetters.includes(i)) cleared[i] = "";
      }
      return cleared;
    });
    setWrongLetters([]);
    setSelectedBoxIndex(nextTypableIndex(0, mexicanWord));
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
    if (isLoading || !mexicanWord || isCorrect) return;
    if (!checkCoins(VERIFICAR_COST, "verificar")) return;
    // Cancel any pending wrong-answer clear so completed word isn't wiped
    if (wrongClearTimerRef.current) {
      clearTimeout(wrongClearTimerRef.current);
      wrongClearTimerRef.current = null;
    }
    usedPowerupRef.current = true;
    updateUserCurrency({ userId, coins: -VERIFICAR_COST, diamonds: 0 }).catch(() => { });
    const allIndices = Array.from({ length: mexicanWord.length }, (_, i) => i).filter(i => mexicanWord[i] !== " ");
    setWrongLetters([]);
    // Mascota rellena la palabra letra a letra (typewriter rápido 80ms)
    triggerMascota("celebrating", getVerificarMascotMessage(mexicanWord, wordMeaning));
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
      // celebrate() is already called inside validateWhenFull on correct — don't double-call
      const fullGuess = Array.from({ length: mexicanWord.length }).map((_, i) => mexicanWord[i]);
      validateWhenFull(fullGuess.join(""));
    }, fillDuration);
  };

  // Share — captures VictoryShareCard as PNG; falls back to text if capture fails
  const handleShare = async () => {
    try {
      const uri = await captureRef(victoryShareRef, { format: "png", quality: 0.92 });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "¡Comparte tu victoria!" });
    } catch (e) {
      try {
        await Share.share({
          message: `¡Adiviné "${victoryWord || mexicanWord}" en Mexicanario! 🇲🇽 ¿Cuántas palabras mexicanas conoces? mexicanario.app`,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }
  };

  // Retar a un amigo — comparte la pregunta sin revelar la respuesta
  const handleShareChallenge = async () => {
    const blanks = "_ ".repeat(mexicanWord.replace(/ /g, "").length).trim();
    const censoredExample = wordExample
      ? buildCensoredExample(wordExample, mexicanWord)
      : null;
    const currentLevel = reviewLevelParam || levelInfo?.level || victoryLevel || 1;
    const webLink = `https://mexicanario.app`;
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
      webLink,
    ].filter(Boolean).join("\n");

    try {
      await Share.share({ message: lines, title: "¿Adivinas esta palabra?" });
    } catch (error) {
      console.error("Share challenge error:", error);
    }
  };

  // ── Dynamic styles (keyboard always at bottom) ─────────────────────────────
  const dynamicStyles = useMemo(() => ({
    gameplayBoard: {
      flex: 1,
      flexDirection: layout.isLandscape ? 'row' : 'column',
      gap: layout.sectionGap,
      width: '100%',
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
      paddingTop: layout.boardTopPadding,
      paddingHorizontal: layout.outerGap,
      paddingBottom: layout.boardBottomPadding,
    },
    devButton: {
      top: layout.boardTopPadding + 8,
    },
    contentRegion: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: layout.sectionGap,
    },
    clueRegion: {
      gap: layout.sectionGap,
    },
    answerRegion: {
      flexShrink: 1,
      gap: layout.sectionGap,
      justifyContent: 'center',
    },
    controlsRegion: {
      width: layout.isLandscape ? layout.controlsWidth : '100%',
      maxWidth: layout.controlsWidth,
      alignSelf: 'center',
      justifyContent: 'flex-end',
    },
    keyboardContainer: {
      width: '100%',
      borderRadius: 20,
      height: kb.kbHeight,
      backgroundColor: '#EEF1F3',
      ...SOFT_GAME_SHADOW,
    },
    powerUpRow: {
      paddingTop: Math.max(6, layout.outerGap / 2),
      paddingHorizontal: layout.outerGap,
      marginBottom: Math.max(4, layout.sectionGap / 2),
    },
    powerUpButton: {
      maxWidth: layout.isLandscape ? 160 : layout.mode === 'tablet' ? 140 : 110,
    },
    keyboard: {
      width: '100%',
      paddingVertical: kb.kbPaddingV,
      paddingHorizontal: layout.outerGap,
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
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      ...SOFT_GAME_SHADOW,
    },
    keyText: {
      fontSize: kb.kbFontSize,
      fontWeight: '800',
      color: '#154B6D',
    },
    deleteKey: { width: kb.kbSpecialW, backgroundColor: Platform.OS === "android" ? "#AEB6BF" : "#C8C8D0" },
    clearKey: { width: kb.kbSpecialW, backgroundColor: "#C8C8D0" },
    deleteIcon: { width: kb.kbIconSize, height: kb.kbIconSize, tintColor: '#1A5276' },
    deleteIconText: { fontSize: TABLET_MODE ? 28 : 20, color: '#1A5276' },
    clearIcon: { width: kb.kbIconSize, height: kb.kbIconSize, tintColor: '#C0392B' },
  }), [kb, layout]);

  // Pre-computed keyboard key styles — dynamic for orientation
  const dynKeyStylesNormal = useMemo(() => ({
    DELETE_ONE: [dynamicStyles.key, dynamicStyles.deleteKey],
    CLEAR_ALL: [dynamicStyles.key, dynamicStyles.clearKey],
  }), [dynamicStyles.key, dynamicStyles.deleteKey, dynamicStyles.clearKey]);
  const dynKeyStylesDimmed = useMemo(() => ({
    DELETE_ONE: [dynamicStyles.key, dynamicStyles.deleteKey, styles.keyDimmed],
    CLEAR_ALL: [dynamicStyles.key, dynamicStyles.clearKey, styles.keyDimmed],
    _default: [dynamicStyles.key, styles.keyDimmed],
  }), [dynamicStyles.key, dynamicStyles.deleteKey, dynamicStyles.clearKey]);

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading || (!levelInfo && !mexicanWord)) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#1A5276" />
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <ImageBackground
      source={require("../../assets/images/bg.webp")}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Enhanced combo counter overlay */}
        <EnhancedComboCounter comboCount={comboCount} visible={comboVisible} />

        {/* Mascota — draggable, above keyboard (hidden during victory) */}
        {petState?.hasPet && !showLevelUp && (
          <PetErrorBoundary>
            <DraggablePet
              scaleFactor={TABLET_MODE ? 0.65 : 0.26}
              region={wordRegion || null}
              currentWord={mexicanWord || null}
              gameBubble={mascotaBubble}
              reduceMotion={reduceMotionEnabled}
              reaction={
                mascotaReaction === 'celebrating' ? 'correct'
                  : mascotaReaction === 'sad' ? 'wrong'
                    : null
              }
            />
          </PetErrorBoundary>
        )}

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

            {/* DEV: botón saltar nivel — solo visible en modo desarrollador */}
            {devEnabled && (
              <TouchableOpacity
                style={[styles.devBtn, dynamicStyles.devButton]}
                onPress={() => { setDevLevelInput(""); setShowDevModal(true); }}
              >
                <Text style={styles.devBtnText}>🔧 Nivel</Text>
              </TouchableOpacity>
            )}

            {/* Game Content */}
            <View style={dynamicStyles.gameplayBoard}>
              <View style={dynamicStyles.contentRegion}>
                <View style={dynamicStyles.clueRegion}>

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
                </View>

                <View style={dynamicStyles.answerRegion}>
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
                    const ch = (isCorrect && originalWord) ? (originalWord[idx] || guess[idx] || "") : (guess[idx] || "");
                    const isFixed = fixedLetters.includes(idx);
                    const isWrong = wrongLetters.includes(idx);
                    const isSelected = selectedBoxIndex === idx && !isFixed;
                    return (
                      <LetterTile
                        key={idx}
                        idx={idx}
                        ch={ch}
                        isFixed={isFixed}
                        isWrong={isWrong}
                        isSelected={isSelected}
                        isCorrect={isCorrect}
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
                </View>
              </View>

          {/* ── Keyboard (absolute bottom) ── */}
              <View style={dynamicStyles.controlsRegion}>
          <View style={dynamicStyles.keyboardContainer}>

            {/* Power-up row */}
            <View style={[styles.powerUpRow, dynamicStyles.powerUpRow]}>
              {/* Revelar 1 letra (A) – 25🪙 */}
              <TouchableOpacity
                style={[styles.powerUpBtn, dynamicStyles.powerUpButton, styles.powerUpReveal]}
                onPress={handleReveal}
                accessibilityRole="button"
                accessibilityLabel={`Revelar una letra por ${HINT_COST} monedas`}
              >
                <Text style={styles.powerUpBtnLabel}>A</Text>
                <View style={styles.powerUpCost}>
                  <Text style={styles.powerUpCostText}>🪙{HINT_COST}</Text>
                </View>
              </TouchableOpacity>

              {/* Revelar 3 letras (🔓) – 75🪙 */}
              <TouchableOpacity
                style={[styles.powerUpBtn, dynamicStyles.powerUpButton, styles.powerUpBorrar]}
                onPress={handleBorrar}
                accessibilityRole="button"
                accessibilityLabel={`Revelar tres letras por ${BORRAR_COST} monedas`}
              >
                <Text style={styles.powerUpBtnEmoji}>🔓</Text>
                <View style={styles.powerUpCost}>
                  <Text style={styles.powerUpCostText}>🪙{BORRAR_COST}</Text>
                </View>
              </TouchableOpacity>

              {/* Completar todo (⭐) – 200🪙 */}
              <TouchableOpacity
                style={[styles.powerUpBtn, dynamicStyles.powerUpButton, styles.powerUpVerificar]}
                onPress={handleVerificar}
                accessibilityRole="button"
                accessibilityLabel={`Completar palabra por ${VERIFICAR_COST} monedas`}
              >
                <Text style={styles.powerUpBtnEmoji}>⭐</Text>
                <View style={styles.powerUpCost}>
                  <Text style={styles.powerUpCostText}>🪙{VERIFICAR_COST}</Text>
                </View>
              </TouchableOpacity>

              {/* Retar amigo (!) – comparte la pregunta sin revelar la respuesta */}
              <TouchableOpacity
                style={[styles.powerUpBtn, dynamicStyles.powerUpButton, styles.powerUpChallenge]}
                onPress={handleShareChallenge}
                accessibilityRole="button"
                accessibilityLabel="Retar a una amistad"
              >
                <Text style={styles.powerUpBtnLabel}>!</Text>
              </TouchableOpacity>
            </View>

            {/* Keyboard — JuicyButton for multisensory feedback */}
            <View style={dynamicStyles.keyboard}>
              {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                <View key={rowIndex} style={dynamicStyles.keyboardRow}>
                  {row.map((key) => {
                    const isSpecial = key === "DELETE_ONE" || key === "CLEAR_ALL";
                    const isDimmed = revealedKeys !== null && !isSpecial && !revealedKeys.has(key);
                    const keyStyle = isDimmed
                      ? dynKeyStylesDimmed[key] || dynKeyStylesDimmed._default
                      : dynKeyStylesNormal[key] || dynamicStyles.key;
                    return (
                      <JuicyButton
                        key={key}
                        style={keyStyle}
                        disabled={isDimmed}
                        onPress={keyHandlers[key]}
                        onPressIn={key === "DELETE_ONE" ? startDeleteRepeat : undefined}
                        onPressOut={key === "DELETE_ONE" ? stopDeleteRepeat : undefined}
                        intensity={key === "CLEAR_ALL" ? "medium" : "light"}
                        scaleDown={0.88}
                        accessibilityRole="button"
                        accessibilityLabel={isSpecial ? key === "CLEAR_ALL" ? "Borrar toda la palabra" : "Borrar una letra" : `Letra ${key}`}
                        accessibilityState={{ disabled: isDimmed }}
                        hitSlop={compactKeyHitSlop}
                        reduceMotion={reduceMotionEnabled}
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
              </View>
            </View>

        {/* ── Modals ── */}
        {showDictionary && <DictionaryModal
          visible
          onClose={() => setOpenModal(null)}
          wordData={{
            word: mexicanWord,
            meaning: wordMeaning || "Significado no disponible",
            mexican_word: mexicanWord,
            example: wordExample || "Ejemplo no disponible",
            region: wordRegion || "Región no disponible",
          }}
        />}
        {showMexicanario && <MexicanarioModal visible onClose={() => setOpenModal(null)} />}
        {showWheel && <WheelModal visible onClose={() => setOpenModal(null)} onOpenShop={() => { setOpenModal('shop'); }} />}
        {showTerms && <TermsModal visible onClose={() => setOpenModal(null)} />}
        {showSupport && <SupportModal visible onClose={() => setOpenModal(null)} />}
        {showAdRemoval && <AdRemovalModal visible onClose={() => setOpenModal(null)} />}

        {/* Rank-up celebration */}
        <RankUpOverlay
          visible={showRankUp}
          oldRank={rankUpOld}
          newRank={rankUpNew}
          onDismiss={() => setShowRankUp(false)}
        />

        {/* Motivational friend toast */}
        <FriendToast
          visible={showFriendToast}
          message={friendToastMsg}
          onDone={() => { setShowFriendToast(false); setFriendToastMsg(null); }}
        />

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
              <Text style={styles.regTagline}>¡No cuesta nada y ganas un montón! 🌶️</Text>
              <TouchableOpacity
                style={styles.regBtn}
                onPress={() => { setOpenModal('registerLure'); }}
              >
                <Text style={styles.regBtnText}>¡Quiero mis varos! 🌮</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.regDismiss} onPress={() => setOpenModal(null)}>
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
                onPress={() => { setOpenModal('cuatesReg'); }}
              >
                <Text style={styles.regBtnText}>¡Registrarme y cobrar! 🎁</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.regDismiss} onPress={() => setOpenModal(null)}>
                <Text style={{ color: "#A0714F", fontSize: 13 }}>Quizás después</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Exit Game Confirmation Modal (Android Back Button) */}
        <Modal visible={showExitPrompt} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>¿Deseas salir?</Text>
              <Text style={styles.modalText}>
                Si sales ahora perderás tu progreso en esta palabra.
              </Text>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => {
                  setOpenModal(null);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalBtnText}>Sí, salir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginTop: 15, paddingVertical: 10, width: "100%", alignItems: "center" }}
                onPress={() => setOpenModal(null)}
              >
                <Text style={{ color: "#1A5276", fontWeight: "bold", fontSize: 16 }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* CuatesModal abierto desde los avisos */}
        {showCuatesReg && <CuatesModal visible onClose={() => setOpenModal(null)} />}

        {/* Coins Insufficient Modal */}
        <Modal visible={showCoinsModal} transparent animationType="slide">
          <View style={styles.coinsModalOverlay}>
            <View style={styles.coinsModalCard}>
              <Text style={styles.coinsModalTitle}>Monedas</Text>

              <View style={styles.coinsOptionsRow}>
                {/* Gratis */}
                {(() => {
                  const cooldownMs = shopState?.freeCooldownRemaining ?? 0;
                  const onCooldown = cooldownMs > 0;
                  const hoursLeft = Math.ceil(cooldownMs / (1000 * 60 * 60));
                  return (
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
                        style={[styles.coinsOptionBtn, { backgroundColor: onCooldown ? "#8A8A8A" : "#4CAF50" }]}
                        disabled={onCooldown}
                        onPress={async () => {
                          if (!userId) return;
                          try {
                            await claimFreeCoins({ userId });
                          } catch {
                            return; // cooldown activo
                          }
                          setOpenModal(null);
                          setPendingAction(null);
                          const target = await getCoinPillTarget();
                          triggerMainCoin({
                            fromX: coinCenterX,
                            fromY: coinCenterY,
                            toX: target.x + target.w / 2,
                            toY: target.y + target.h / 2,
                            coins: 25,
                            onAllArrived: () => topBarRef.current?.triggerBounce(),
                          });
                        }}
                      >
                        <Text style={styles.coinsOptionBtnText}>
                          {onCooldown ? `${hoursLeft}h` : "Gratis"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}

                {/* Cuates — compartir con un amigo, 1 vez al día */}
                <View style={styles.coinsOption}>
                  <Image
                    source={require("../../assets/images/coin.png")}
                    style={[styles.coinsOptionImage, { marginTop: 20 }]}
                  />
                  <Text style={styles.coinsOptionAmount}>50</Text>
                  <TouchableOpacity
                    style={[styles.coinsOptionBtn, { backgroundColor: "#4CAF50" }]}
                    onPress={async () => {
                      if (!userId) return;
                      try {
                        const result = await Share.share({
                          message:
                            "¡Juega Mexicanario y aprende palabras mexicanas! 🇲🇽🌮\nhttps://mexicanario.com",
                          title: "Mexicanario",
                        });
                        if (result.action === Share.sharedAction) {
                          const claim = await claimShareReward({ userId });
                          if (claim.alreadyClaimed) {
                            Alert.alert("Ya compartiste hoy", "Vuelve mañana para ganar más monedas 🌮");
                            return;
                          }
                          setOpenModal(null);
                          setPendingAction(null);
                          const target = await getCoinPillTarget();
                          triggerMainCoin({
                            fromX: coinCenterX,
                            fromY: coinCenterY,
                            toX: target.x + target.w / 2,
                            toY: target.y + target.h / 2,
                            coins: 50,
                            onAllArrived: () => topBarRef.current?.triggerBounce(),
                          });
                        }
                      } catch (e) {
                        console.error("Share error:", e);
                      }
                    }}
                  >
                    <Text style={styles.coinsOptionBtnText}>Cuates</Text>
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
                          await updateUserCurrency({ userId, coins: 40 });
                        }
                        setOpenModal(null);
                        setPendingAction(null);
                        const target = await getCoinPillTarget();
                        triggerMainCoin({
                          fromX: coinCenterX,
                          fromY: coinCenterY,
                          toX: target.x + target.w / 2,
                          toY: target.y + target.h / 2,
                          coins: 40,
                          onAllArrived: () => topBarRef.current?.triggerBounce(),
                        });
                      });
                      if (!shown) {
                        // Ad no disponible en Expo Go — dar monedas directamente en dev
                        if (__DEV__ && userId) {
                          updateUserCurrency({ userId, coins: 40 }).then(async () => {
                            setOpenModal(null);
                            setPendingAction(null);
                            const target = await getCoinPillTarget();
                            triggerMainCoin({
                              fromX: coinCenterX, fromY: coinCenterY,
                              toX: target.x + target.w / 2,
                              toY: target.y + target.h / 2,
                              coins: 40,
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
                onPress={() => { setPendingAction(null); setOpenModal('shop'); }}
              >
                <Text style={styles.coinsShopBtnText}>🛒 Ir a la Tienda</Text>
              </TouchableOpacity>

              {/* Close X */}
              <TouchableOpacity style={styles.coinsModalClose} onPress={() => { setOpenModal(null); setPendingAction(null); }}>
                <Text style={styles.coinsModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {showShop && <ShopScreen visible onClose={() => setOpenModal(null)} />}

        {/* Victory screen — extracted to VictoryModal component */}
        {showLevelUp && <VictoryModal
          visible
          onContinue={() => {
            setShowLevelUp(false);
            if (isChallengeMode) { navigation.navigate("MainMenu"); return; }
            if (isMapReview) { navigation.navigate("Map"); return; }
            if (completedLevelsRef.current % 5 === 0 && completedLevelsRef.current > 0) { showInterstitial(); }
            skipNextInitRef.current = false;
            initGame();
          }}
          onHome={() => { setShowLevelUp(false); navigation.navigate("MainMenu"); }}
          onShare={handleShare}
          isMapReview={isMapReview}
          isReviewMode={isReviewMode}
          isLastLevel={levelInfo?.isLastLevel}
          petHasPet={petState?.hasPet}
          maxCombo={maxCombo}
          victoryPhrase={isChallengeMode
            ? (challengeResult?.isWinner ? "¡Ganaste el reto!" : "Reto completado")
            : getCulturalVictoryPhrase(
                victoryLevel,
                victorySnap.pathId ?? ((isReviewMode || isMapReview) ? undefined : levelInfo?.pathId),
                victorySnap.placeId ?? ((isReviewMode || isMapReview) ? undefined : levelInfo?.placeId)
              )}
          word={victoryWord || mexicanWord}
          example={victoryExample}
          region={victoryRegion}
          zoneCompleted={zoneCompleted}
          zoneCompletedNext={zoneCompletedNext}
          levelCurrent={levelInfo?.level || 1}
          totalLevels={totalLevels}
          diamonds={levelUpReward?.diamonds || 0}
          coins={levelUpReward?.coins || 0}
          isChallengeMode={isChallengeMode}
          challengeResult={challengeResult}
          flyOverlay={
            <>
              <CoinFlyOverlay coins={victoryCoins} particles={victoryCoinParticles} onCoinArrived={onVictoryCoinArrived} />
              <DiamondFlyOverlay diamonds={victoryDiamonds} particles={victoryDiamondParticles} onDiamondArrived={onVictoryDiamondArrived} />
            </>
          }
        />}


      </SafeAreaView>

      {/* Rewarded ad proactive offer — shown on 3rd wrong attempt */}
      <Modal visible={showRewardedOffer && !showLevelUp} transparent animationType="slide">
        <TouchableOpacity
          style={styles.rewardedOfferOverlay}
          activeOpacity={1}
          onPress={() => setShowRewardedOffer(false)}
        >
          <View style={styles.rewardedOfferCard} onStartShouldSetResponder={() => true}>
            <StageCropped petType={petState?.petType ?? "ajolote"} stage={petState?.stage ?? 1} size={90} />
            <Text style={styles.rewardedOfferTitle}>
              Tu {petState?.petName || "mascota"} quiere ayudarte 🥺
            </Text>
            <Text style={styles.rewardedOfferSub}>
              ¡Mira 30 segundos y gana 75 monedas!
            </Text>
            <TouchableOpacity
              style={styles.rewardedOfferBtn}
              onPress={() => {
                setShowRewardedOffer(false);
                showAd(() => updateUserCurrency({ userId, coins: 40, diamonds: 0 }).catch(() => { }));
              }}
            >
              <Text style={styles.rewardedOfferBtnText}>Ver video 📺 +40 🪙</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRewardedOffer(false)} style={{ marginTop: 12 }}>
              <Text style={styles.rewardedOfferDismiss}>No gracias</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main coin fly — shown when no modal is open (ad reward flow) */}
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

      {/* VictoryShareCard — rendered offscreen for image capture, never visible to user */}
      <VictoryShareCard
        ref={victoryShareRef}
        word={victoryWord}
        example={victoryExample}
        region={victoryRegion}
        comboCount={maxCombo}
        petType={petState?.petType}
        stage={petState?.stage ?? 1}
        style={{ position: "absolute", left: -9999, top: 0 }}
      />

    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  devBtn: {
    position: "absolute",
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

  // ── Clue Card ──────────────────────────────────────────────────────────────
  clueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    ...SOFT_GAME_SHADOW,
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
    width: "100%",
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

  // ── Power-up row ────────────────────────────────────────────────────────────
  powerUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
    ...SOFT_GAME_SHADOW,
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

  // ── Keyboard (only sub-styles still referenced — main styles are in dynamicStyles) ──
  keyDimmed: {
    backgroundColor: "#D0D0D8",
    opacity: 0.32,
    borderWidth: 2,
    borderColor: "#8A949C",
  },

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

  // ── Rewarded offer bottom sheet ──────────────────────────────────────────
  rewardedOfferOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  rewardedOfferCard: {
    backgroundColor: "#1A0A00",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  rewardedOfferTitle: {
    color: "#FFE4B5",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
  },
  rewardedOfferSub: {
    color: "rgba(255,228,181,0.7)",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  rewardedOfferBtn: {
    backgroundColor: "#D36B1E",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  rewardedOfferBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  rewardedOfferDismiss: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
});


