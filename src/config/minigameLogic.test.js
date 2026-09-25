const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  shuffle,
  isNewRecord,
  shuffleQuestionOptions,
  pickQuiz,
  taqueroPantry,
  taqueroRecipe,
  pickLoteriaRound,
  loteriaStreakBonus,
  loteriaCallsVerse,
  NAHUAL_SPEED_MIN,
  nextNahualObstacle,
} = require('./minigameLogic.js');

// Generador determinista para las pruebas
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

// shuffle conserva los elementos
assert.deepEqual([...shuffle([1, 2, 3, 4, 5], seeded(1))].sort(), [1, 2, 3, 4, 5]);

assert.equal(isNewRecord(5, 4), true);
assert.equal(isNewRecord(4, 4), false, 'empatar no es récord');
assert.equal(isNewRecord(0, undefined), false, 'cero nunca es récord');
assert.equal(isNewRecord(1, undefined), true, 'primer puntaje es récord');

// ── Duelo: la respuesta correcta sigue apuntando al mismo texto ──
const q = { question: '¿?', options: ['A', 'B', 'C', 'D'], answer: 1 };
const positions = new Set();
for (let seed = 1; seed < 60; seed++) {
  const s = shuffleQuestionOptions(q, seeded(seed));
  assert.equal(s.options[s.answer], 'B');
  assert.deepEqual([...s.options].sort(), ['A', 'B', 'C', 'D']);
  positions.add(s.answer);
}
assert.equal(positions.size, 4, 'la respuesta correcta debe caer en cualquier posición');
assert.equal(q.options[1], 'B', 'no muta la pregunta original');

const bank = Array.from({ length: 20 }, (_, i) => ({ question: `q${i}`, options: ['a', 'b', 'c', 'd'], answer: 0 }));
const quiz = pickQuiz(bank, 5, seeded(7));
assert.equal(quiz.length, 5);
assert.equal(new Set(quiz.map((x) => x.question)).size, 5, 'sin preguntas repetidas');

// El banco real de Duelo: cada pregunta con 4 opciones y respuesta válida
const dueloSource = fs.readFileSync('src/screens/DueloAlburesScreen.jsx', 'utf8');
const answers = [...dueloSource.matchAll(/options: \[([^\]]*)\], answer: (\d)/g)];
assert.ok(answers.length >= 50, 'banco de preguntas de Duelo encontrado');
for (const [, opts, ans] of answers) {
  const count = opts.split('", "').length;
  assert.equal(count, 4, `pregunta con ${count} opciones`);
  assert.ok(Number(ans) < count);
}

// ── Taquero: dificultad progresiva ──
assert.deepEqual(taqueroPantry(0), ['Tortilla', 'Carne', 'Salsa', 'Limón']);
assert.equal(taqueroPantry(3).length, 5);
assert.equal(taqueroPantry(10).length, 7);
for (const served of [0, 4, 5, 9, 10, 25]) {
  const recipe = taqueroRecipe(served, seeded(served + 3));
  assert.equal(recipe[0], 'Tortilla', 'la tortilla siempre va primero');
  assert.equal(new Set(recipe).size, recipe.length, 'sin ingredientes repetidos');
  const pantry = taqueroPantry(served);
  assert.ok(recipe.every((i) => pantry.includes(i)), 'solo ingredientes desbloqueados');
}
assert.equal(taqueroRecipe(0, seeded(1)).length, 4);
assert.equal(taqueroRecipe(5, seeded(1)).length, 5);
assert.equal(taqueroRecipe(10, seeded(1)).length, 6);

// ── Lotería: nunca repite la carta anterior, 4 opciones únicas con la correcta ──
const cards = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
let prev = null;
for (let seed = 1; seed < 80; seed++) {
  const { target, options } = pickLoteriaRound(cards, prev, seeded(seed));
  assert.notEqual(target.id, prev);
  assert.equal(options.length, 4);
  assert.equal(new Set(options.map((c) => c.id)).size, 4);
  assert.ok(options.some((c) => c.id === target.id));
  prev = target.id;
}
assert.equal(loteriaStreakBonus(5), 2);
assert.equal(loteriaStreakBonus(10), 2);
assert.equal(loteriaStreakBonus(4), 0);
assert.equal(loteriaStreakBonus(0), 0);
assert.equal(loteriaCallsVerse(0), false);
assert.equal(loteriaCallsVerse(8), true);

// Cada carta de Lotería Exprés trae su verso
const loteriaSource = fs.readFileSync('src/screens/LoteriaExpressScreen.jsx', 'utf8');
const cardLines = loteriaSource.match(/\{ id: \d+, name: .*\}/g) || [];
assert.equal(cardLines.length, 54, 'baraja completa de 54 cartas');
assert.ok(cardLines.every((line) => /verse: "/.test(line)), 'todas las cartas tienen verso');

// ── Nahual: se acelera sin pasar el mínimo, la pausa se acorta ──
const slow = nextNahualObstacle(0, () => 0.99);
const fast = nextNahualObstacle(500, () => 0.99);
assert.equal(fast.duration, NAHUAL_SPEED_MIN);
assert.ok(slow.duration > fast.duration);
assert.ok(slow.delay > fast.delay);
assert.equal(nextNahualObstacle(3, () => 0).delay, 0);
assert.ok(typeof slow.icon === 'string' && slow.icon.length > 0);

// ── Chancla: se pone más difícil, puntos con racha y reflejos ──
const {
  chanclaLevel,
  chanclaDifficulty,
  planChanclaTurn,
  chanclaMultiplier,
  chanclaDodgeScore,
} = require('./minigameLogic.js');

assert.equal(chanclaLevel(0), 1);
assert.equal(chanclaLevel(8), 2);
const easy = chanclaDifficulty(0);
const hard = chanclaDifficulty(500);
assert.equal(easy.window, 1000);
assert.equal(hard.window, 380, 'la ventana tiene piso');
assert.ok(hard.fakeChance > easy.fakeChance, 'más amagos con el tiempo');
assert.ok(hard.calmMax < easy.calmMax);

for (let seed = 1; seed < 50; seed++) {
  const turn = planChanclaTurn(seed, seeded(seed));
  const d = chanclaDifficulty(seed);
  assert.ok(turn.calm >= d.calmMin && turn.calm <= d.calmMax);
  assert.ok(turn.windup >= d.windupMin && turn.windup <= d.windupMax);
  assert.ok(!(turn.isFake && turn.isGolden), 'un amago nunca es chancla dorada');
}
assert.equal(planChanclaTurn(0, () => 0).isFake, true);
assert.equal(planChanclaTurn(0, () => 0.99).isFake, false);

assert.equal(chanclaMultiplier(1), 1);
assert.equal(chanclaMultiplier(5), 2);
assert.equal(chanclaMultiplier(100), 5, 'multiplicador con tope');

const slowDodge = chanclaDodgeScore({ reactionMs: 600, window: 1000, combo: 1 });
assert.equal(slowDodge.points, 10);
assert.equal(slowDodge.fast, false);
assert.equal(slowDodge.nearMiss, false);
const fastDodge = chanclaDodgeScore({ reactionMs: 200, window: 1000, combo: 5 });
assert.equal(fastDodge.points, 15 * 2);
assert.equal(fastDodge.fast, true);
assert.equal(chanclaDodgeScore({ reactionMs: 850, window: 1000, combo: 1 }).nearMiss, true);
assert.equal(chanclaDodgeScore({ reactionMs: 600, window: 1000, combo: 1, golden: true }).points, 30);
const best = chanclaDodgeScore({ reactionMs: 100, window: 380, combo: 99, golden: true });
assert.ok(Number.isInteger(best.points) && best.points <= 225, 'el tope por esquive cabe en maxScore');

// ── Cada juego de la pantalla Juegos tiene ruta y ranking ──
const juegosSource = fs.readFileSync('src/screens/JuegosScreen.jsx', 'utf8');
const appSource = fs.readFileSync('App.jsx', 'utf8');
const gameIds = [...juegosSource.matchAll(/^\s{4}id: "(\w+)",/gm)].map((m) => m[1]);
assert.equal(gameIds[0], 'EsquivaChancla', 'el juego nuevo va primero');
assert.equal(gameIds.length, 5);
for (const id of gameIds) {
  assert.ok(appSource.includes(`name="${id}"`), `${id} debe estar registrado en App.jsx`);
}
for (const mod of ['chancla', 'loteria', 'taquero', 'albures', 'nahual']) {
  assert.ok(juegosSource.includes(`api.${mod}.getMyBest`), `Juegos muestra el récord de ${mod}`);
  assert.ok(fs.existsSync(`convex/${mod}.ts`), `convex/${mod}.ts existe`);
}
assert.ok(/chanclaScores: defineTable/.test(fs.readFileSync('convex/schema.ts', 'utf8')), 'tabla chanclaScores en el esquema');

console.log('minigameLogic tests passed');
