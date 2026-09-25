// ── Lógica pura de los minijuegos (testeable, sin React) ────────────────────

/** Fisher-Yates: baraja sin sesgo (sort(() => Math.random() - 0.5) sí lo tiene). */
function shuffle(arr, rand = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** ¿El puntaje supera el récord previo? (0 nunca es récord). */
function isNewRecord(score, previousBest) {
  return score > 0 && score > (previousBest || 0);
}

// ── Duelo de Albures ────────────────────────────────────────────────────────

/** Baraja las opciones de una pregunta y recalcula el índice correcto. */
function shuffleQuestionOptions(question, rand = Math.random) {
  const order = shuffle(question.options.map((_, i) => i), rand);
  return {
    ...question,
    options: order.map((i) => question.options[i]),
    answer: order.indexOf(question.answer),
  };
}

/** N preguntas distintas, cada una con sus opciones barajadas. */
function pickQuiz(allQuestions, count, rand = Math.random) {
  return shuffle(allQuestions, rand)
    .slice(0, count)
    .map((q) => shuffleQuestionOptions(q, rand));
}

// ── Taquero Rush ────────────────────────────────────────────────────────────

const TAQUERO_BASE_TOPPINGS = ["Carne", "Salsa", "Limón"];
// Ingredientes que se desbloquean conforme sirves tacos
const TAQUERO_UNLOCKS = [
  { at: 3, ingredient: "Cebolla" },
  { at: 6, ingredient: "Cilantro" },
  { at: 10, ingredient: "Piña" },
];

/** Ingredientes disponibles (botones) después de servir `tacosServed` tacos. */
function taqueroPantry(tacosServed) {
  const unlocked = TAQUERO_UNLOCKS.filter((u) => tacosServed >= u.at).map((u) => u.ingredient);
  return ["Tortilla", ...TAQUERO_BASE_TOPPINGS, ...unlocked];
}

/** Receta: siempre empieza con tortilla; los toppings crecen de 3 a 5. */
function taqueroRecipe(tacosServed, rand = Math.random) {
  const toppings = taqueroPantry(tacosServed).slice(1);
  const length = tacosServed >= 10 ? 5 : tacosServed >= 5 ? 4 : 3;
  return ["Tortilla", ...shuffle(toppings, rand).slice(0, length)];
}

// ── Lotería Exprés ──────────────────────────────────────────────────────────

/** Ronda: carta cantada (nunca la misma que la anterior) + 4 opciones barajadas. */
function pickLoteriaRound(cards, previousId, rand = Math.random) {
  const pool = cards.filter((c) => c.id !== previousId);
  const target = pool[Math.floor(rand() * pool.length)];
  const decoys = shuffle(cards.filter((c) => c.id !== target.id), rand).slice(0, 3);
  return { target, options: shuffle([target, ...decoys], rand) };
}

/** Segundos extra por racha: +2s cada 5 aciertos seguidos. */
function loteriaStreakBonus(streak) {
  return streak > 0 && streak % 5 === 0 ? 2 : 0;
}

/** A partir de cierto puntaje el gritón canta el verso en vez del nombre. */
const LOTERIA_VERSE_FROM = 8;
function loteriaCallsVerse(score) {
  return score >= LOTERIA_VERSE_FROM;
}

// ── Corre del Nahual ────────────────────────────────────────────────────────

const NAHUAL_SPEED_INITIAL = 1700;
const NAHUAL_SPEED_MIN = 650;
const NAHUAL_SPEED_STEP = 35;
const NAHUAL_OBSTACLES = ["🌵", "🌵", "🪨", "👹"];

/** Siguiente obstáculo: velocidad, pausa aleatoria previa y tipo. */
function nextNahualObstacle(score, rand = Math.random) {
  const duration = Math.max(NAHUAL_SPEED_MIN, NAHUAL_SPEED_INITIAL - score * NAHUAL_SPEED_STEP);
  // La pausa se acorta con la velocidad para que no se vuelva lento
  const maxGap = Math.round(duration * 0.45);
  return {
    duration,
    delay: Math.round(rand() * maxGap),
    icon: NAHUAL_OBSTACLES[Math.floor(rand() * NAHUAL_OBSTACLES.length)],
  };
}

// ── Esquiva la Chancla ──────────────────────────────────────────────────────
// Go/No-Go: agáchate solo cuando la chancla sale de verdad; los amagos castigan
// la impulsividad. Cada DODGES_PER_LEVEL esquives sube el nivel.

const CHANCLA_LIVES = 3;
const CHANCLA_DODGES_PER_LEVEL = 8;
const CHANCLA_MAX_MULTIPLIER = 5;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Nivel (1..) según los esquives acumulados. */
function chanclaLevel(dodges) {
  return 1 + Math.floor(dodges / CHANCLA_DODGES_PER_LEVEL);
}

/** Parámetros del turno: la ventana para agacharte se cierra y los amagos aumentan. */
function chanclaDifficulty(dodges) {
  const t = Math.min(1, dodges / 60); // llega al máximo a los 60 esquives
  return {
    window: Math.round(lerp(1000, 380, t)),
    calmMin: Math.round(lerp(700, 350, t)),
    calmMax: Math.round(lerp(1500, 900, t)),
    windupMin: Math.round(lerp(700, 400, t)),
    windupMax: Math.round(lerp(1500, 1300, t)),
    fakeChance: lerp(0.15, 0.4, t),
    goldenChance: 0.08,
  };
}

/** Planea un turno completo: calma → amenaza → (amago | chanclazo). */
function planChanclaTurn(dodges, rand = Math.random) {
  const d = chanclaDifficulty(dodges);
  const isFake = rand() < d.fakeChance;
  return {
    calm: Math.round(lerp(d.calmMin, d.calmMax, rand())),
    windup: Math.round(lerp(d.windupMin, d.windupMax, rand())),
    isFake,
    isGolden: !isFake && rand() < d.goldenChance,
    window: d.window,
  };
}

/** Multiplicador por racha: x1, y +1 cada 5 esquives seguidos (tope x5). */
function chanclaMultiplier(combo) {
  return Math.min(CHANCLA_MAX_MULTIPLIER, 1 + Math.floor(combo / 5));
}

/**
 * Puntos por un esquive. `combo` es la racha contando este esquive.
 * Reflejos rápidos suman bono; esquivar en el último 20% de la ventana es "¡por un pelito!".
 */
function chanclaDodgeScore({ reactionMs, window, combo, golden = false }) {
  const speedBonus = reactionMs < 250 ? 5 : reactionMs < 400 ? 2 : 0;
  const multiplier = chanclaMultiplier(combo);
  const points = (10 + speedBonus) * multiplier * (golden ? 3 : 1);
  return {
    points,
    multiplier,
    fast: reactionMs < 250,
    nearMiss: reactionMs >= window * 0.8,
  };
}

module.exports = {
  shuffle,
  isNewRecord,
  shuffleQuestionOptions,
  pickQuiz,
  TAQUERO_UNLOCKS,
  taqueroPantry,
  taqueroRecipe,
  pickLoteriaRound,
  loteriaStreakBonus,
  LOTERIA_VERSE_FROM,
  loteriaCallsVerse,
  NAHUAL_SPEED_MIN,
  nextNahualObstacle,
  CHANCLA_LIVES,
  CHANCLA_DODGES_PER_LEVEL,
  chanclaLevel,
  chanclaDifficulty,
  planChanclaTurn,
  chanclaMultiplier,
  chanclaDodgeScore,
};
