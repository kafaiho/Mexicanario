import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// ── Authentic Mexican Lotería deck ──────────────────────────────────────────
const LOTERIA_CARDS = [
  { id: 1, name: "El Gallo", emoji: "🐓" },
  { id: 2, name: "El Diablito", emoji: "😈" },
  { id: 3, name: "La Dama", emoji: "👸" },
  { id: 4, name: "El Catrín", emoji: "🎩" },
  { id: 5, name: "El Paraguas", emoji: "☂️" },
  { id: 6, name: "La Sirena", emoji: "🧜‍♀️" },
  { id: 7, name: "La Escalera", emoji: "🪜" },
  { id: 8, name: "La Botella", emoji: "🍾" },
  { id: 9, name: "El Barril", emoji: "🪣" },
  { id: 10, name: "El Árbol", emoji: "🌳" },
  { id: 11, name: "El Melón", emoji: "🍈" },
  { id: 12, name: "El Valiente", emoji: "🗡️" },
  { id: 13, name: "El Gorrito", emoji: "🧢" },
  { id: 14, name: "La Muerte", emoji: "💀" },
  { id: 15, name: "La Pera", emoji: "🍐" },
  { id: 16, name: "La Bandera", emoji: "🇲🇽" },
  { id: 17, name: "El Bandolón", emoji: "🎸" },
  { id: 18, name: "El Violoncello", emoji: "🎻" },
  { id: 19, name: "La Garza", emoji: "🦢" },
  { id: 20, name: "El Pájaro", emoji: "🦜" },
  { id: 21, name: "La Mano", emoji: "✋" },
  { id: 22, name: "La Bota", emoji: "👢" },
  { id: 23, name: "La Luna", emoji: "🌙" },
  { id: 24, name: "El Cotorro", emoji: "🦚" },
  { id: 25, name: "El Borracho", emoji: "🍻" },
  { id: 26, name: "El Negrito", emoji: "🎭" },
  { id: 27, name: "El Corazón", emoji: "❤️" },
  { id: 28, name: "La Sandía", emoji: "🍉" },
  { id: 29, name: "El Tambor", emoji: "🥁" },
  { id: 30, name: "El Camarón", emoji: "🦐" },
  { id: 31, name: "Las Jaras", emoji: "🏹" },
  { id: 32, name: "El Músico", emoji: "🎺" },
  { id: 33, name: "La Araña", emoji: "🕷️" },
  { id: 34, name: "El Soldado", emoji: "💂" },
  { id: 35, name: "La Estrella", emoji: "⭐" },
  { id: 36, name: "El Cazo", emoji: "🫕" },
  { id: 37, name: "El Mundo", emoji: "🌎" },
  { id: 38, name: "El Apache", emoji: "🪶" },
  { id: 39, name: "El Nopal", emoji: "🌵" },
  { id: 40, name: "El Alacrán", emoji: "🦂" },
  { id: 41, name: "La Rosa", emoji: "🌹" },
  { id: 42, name: "La Calavera", emoji: "🩻" },
  { id: 43, name: "La Campana", emoji: "🔔" },
  { id: 44, name: "El Cantarito", emoji: "🏺" },
  { id: 45, name: "El Venado", emoji: "🦌" },
  { id: 46, name: "El Sol", emoji: "☀️" },
  { id: 47, name: "La Corona", emoji: "👑" },
  { id: 48, name: "La Chalupa", emoji: "⛵" },
  { id: 49, name: "El Pino", emoji: "🌲" },
  { id: 50, name: "El Pescado", emoji: "🐟" },
  { id: 51, name: "La Palma", emoji: "🌴" },
  { id: 52, name: "La Maceta", emoji: "🪴" },
  { id: 53, name: "El Arpa", emoji: "🪗" },
  { id: 54, name: "La Rana", emoji: "🐸" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickBoard() {
  // Pick 9 random unique cards for the 3×3 board
  return shuffle(LOTERIA_CARDS).slice(0, 9);
}

function checkWin(marked, board) {
  // marked = Set of board indices (0-8)
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],             // diags
  ];
  return lines.some((line) => line.every((i) => marked.has(i)));
}

// ── Component ────────────────────────────────────────────────────────────────
export default function LoteriaExpress({ visible, onClose }) {
  const [phase, setPhase] = useState("idle"); // idle | playing | win | lose
  const phaseRef = useRef("idle");

  const [board, setBoard] = useState([]);
  const [deck, setDeck] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [marked, setMarked] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(90);

  const timerRef = useRef(null);
  const drawRef = useRef(null);
  const flashAnim = useRef(new Animated.Value(1)).current;

  const setPhaseSync = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (drawRef.current) clearInterval(drawRef.current);
    timerRef.current = null;
    drawRef.current = null;
  }, []);

  const startGame = useCallback(() => {
    const newBoard = pickBoard();
    const remaining = shuffle(
      LOTERIA_CARDS.filter((c) => !newBoard.find((b) => b.id === c.id))
    );
    setBoard(newBoard);
    setDeck(remaining);
    setDrawnCards([]);
    setCurrentCard(null);
    setMarked(new Set());
    setTimeLeft(90);
    setPhaseSync("playing");

    let deckCopy = [...remaining];
    let t = 90;

    // Countdown timer
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        clearTimers();
        setPhaseSync("lose");
      }
    }, 1000);

    // Draw a card every 2.5 seconds
    drawRef.current = setInterval(() => {
      if (phaseRef.current !== "playing") {
        clearTimers();
        return;
      }
      if (deckCopy.length === 0) {
        clearTimers();
        setPhaseSync("lose");
        return;
      }
      const card = deckCopy.shift();
      setCurrentCard(card);
      setDrawnCards((prev) => [card, ...prev]);

      // Flash animation
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.3, duration: 120, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, 2500);
  }, [clearTimers, flashAnim]);

  const handleMark = useCallback(
    (idx) => {
      if (phaseRef.current !== "playing") return;
      const card = board[idx];
      // Only mark if drawn card matches
      if (!currentCard || card.id !== currentCard.id) return;
      setMarked((prev) => {
        const next = new Set(prev);
        next.add(idx);
        if (checkWin(next, board)) {
          clearTimers();
          setPhaseSync("win");
        }
        return next;
      });
    },
    [board, currentCard, clearTimers]
  );

  // Auto-mark drawn cards that exist on board
  useEffect(() => {
    if (!currentCard || phaseRef.current !== "playing") return;
    const idx = board.findIndex((c) => c.id === currentCard.id);
    if (idx !== -1) {
      setMarked((prev) => {
        const next = new Set(prev);
        next.add(idx);
        if (checkWin(next, board)) {
          clearTimers();
          setPhaseSync("win");
        }
        return next;
      });
    }
  }, [currentCard, board, clearTimers]);

  useEffect(() => {
    if (!visible) {
      clearTimers();
      setPhaseSync("idle");
    }
  }, [visible, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const timerColor = timeLeft > 30 ? "#2A81BA" : timeLeft > 10 ? "#F59B40" : "#e74c3c";

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <ImageBackground
        source={require("../../../assets/images/bg.png")}
        style={styles.root}
        resizeMode="cover"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🃏 Lotería Express</Text>
          {phase === "playing" && (
            <Text style={[styles.timer, { color: timerColor }]}>⏱ {timeLeft}s</Text>
          )}
        </View>

        {/* IDLE */}
        {phase === "idle" && (
          <View style={styles.centerBox}>
            <Text style={styles.bigEmoji}>🎴</Text>
            <Text style={styles.infoTitle}>¡Lotería!</Text>
            <Text style={styles.infoText}>
              Se repartirán 9 cartas en tu tablero.{"\n"}
              ¡Tápalas conforme las vayan cantando!{"\n"}
              Completa una línea y grita: ¡Lotería!
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startTxt}>¡Buenas noches, señores!</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PLAYING */}
        {phase === "playing" && (
          <ScrollView contentContainerStyle={styles.gameArea} showsVerticalScrollIndicator={false}>
            {/* Current drawn card */}
            <Animated.View style={[styles.drawnCard, { opacity: flashAnim }]}>
              {currentCard ? (
                <>
                  <Text style={styles.drawnEmoji}>{currentCard.emoji}</Text>
                  <Text style={styles.drawnName}>{currentCard.name}</Text>
                </>
              ) : (
                <Text style={styles.drawnName}>Iniciando…</Text>
              )}
            </Animated.View>

            {/* 3×3 Board */}
            <View style={styles.boardGrid}>
              {board.map((card, idx) => {
                const isMarked = marked.has(idx);
                const isCurrent = currentCard?.id === card.id;
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.boardCell,
                      isMarked && styles.boardCellMarked,
                      isCurrent && !isMarked && styles.boardCellActive,
                    ]}
                    onPress={() => handleMark(idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cellEmoji}>{isMarked ? "✅" : card.emoji}</Text>
                    <Text style={styles.cellName} numberOfLines={1}>
                      {card.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Drawn history */}
            <Text style={styles.historyLabel}>Cantadas: {drawnCards.length}</Text>
            <View style={styles.historyRow}>
              {drawnCards.slice(0, 8).map((c) => (
                <Text key={c.id} style={styles.historyEmoji}>
                  {c.emoji}
                </Text>
              ))}
            </View>
          </ScrollView>
        )}

        {/* WIN */}
        {phase === "win" && (
          <View style={styles.centerBox}>
            <Text style={styles.bigEmoji}>🎉</Text>
            <Text style={styles.resultTitle}>¡Lotería!</Text>
            <Text style={styles.resultSub}>¡Completaste el tablero, mero crack!</Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startTxt}>Jugar de nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeLink} onPress={onClose}>
              <Text style={styles.closeLinkTxt}>Salir</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LOSE */}
        {phase === "lose" && (
          <View style={styles.centerBox}>
            <Text style={styles.bigEmoji}>💀</Text>
            <Text style={styles.resultTitle}>¡Se acabó!</Text>
            <Text style={styles.resultSub}>
              Se te pasaron las cartas.{"\n"}¡Échale más ganas!
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startTxt}>Intentar de nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeLink} onPress={onClose}>
              <Text style={styles.closeLinkTxt}>Salir</Text>
            </TouchableOpacity>
          </View>
        )}
      </ImageBackground>
    </Modal>
  );
}

const CELL = (width - width * 0.08 - 12) / 3;

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#523600",
    paddingTop: height * 0.05,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  closeBtn: { padding: 6 },
  closeTxt: { color: "#FCD11D", fontSize: 20, fontWeight: "bold" },
  title: {
    flex: 1,
    color: "#FCD11D",
    fontSize: width * 0.05,
    fontWeight: "bold",
    textAlign: "center",
  },
  timer: { fontSize: width * 0.045, fontWeight: "bold", minWidth: 60, textAlign: "right" },

  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.06,
  },
  bigEmoji: { fontSize: 80, marginBottom: 12 },
  infoTitle: {
    fontSize: width * 0.07,
    fontWeight: "bold",
    color: "#523600",
    marginBottom: 8,
  },
  infoText: {
    fontSize: width * 0.04,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  startBtn: {
    backgroundColor: "#F59B40",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#523600",
    marginBottom: 12,
  },
  startTxt: { color: "#523600", fontWeight: "bold", fontSize: width * 0.045 },
  closeLink: { marginTop: 8 },
  closeLinkTxt: { color: "#2A81BA", fontSize: width * 0.04, textDecorationLine: "underline" },

  gameArea: { alignItems: "center", paddingBottom: 30 },

  drawnCard: {
    width: width * 0.55,
    height: width * 0.45,
    backgroundColor: "#FCD11D",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#523600",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  drawnEmoji: { fontSize: 56 },
  drawnName: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#523600",
    marginTop: 4,
  },

  boardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: width - width * 0.08,
    gap: 4,
    justifyContent: "center",
  },
  boardCell: {
    width: CELL,
    height: CELL,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ccc",
    padding: 4,
  },
  boardCellMarked: {
    backgroundColor: "#2A81BA",
    borderColor: "#2A81BA",
  },
  boardCellActive: {
    borderColor: "#F59B40",
    borderWidth: 3,
    backgroundColor: "#FFF8E0",
  },
  cellEmoji: { fontSize: width * 0.07 },
  cellName: {
    fontSize: width * 0.028,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 2,
  },

  historyLabel: {
    color: "#523600",
    fontWeight: "bold",
    fontSize: width * 0.038,
    marginTop: 16,
    marginBottom: 6,
  },
  historyRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4 },
  historyEmoji: { fontSize: 22 },

  resultTitle: {
    fontSize: width * 0.09,
    fontWeight: "bold",
    color: "#523600",
    marginBottom: 8,
  },
  resultSub: {
    fontSize: width * 0.042,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
});
