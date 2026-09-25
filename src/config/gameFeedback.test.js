const assert = require('node:assert/strict');
const { countLetterMisses, isNearMiss, computeXpBreakdown } = require('./gameFeedback.js');

assert.equal(countLetterMisses('CHAMBA', 'CHAMBA'), 0);
assert.equal(countLetterMisses('CHAMBO', 'CHAMBA'), 1);
assert.equal(countLetterMisses('chamba', 'CHAMBA'), 0, 'ignora mayúsculas');
assert.equal(countLetterMisses('QUE ONDA', 'QUE ONDA'), 0, 'ignora espacios');
assert.equal(isNearMiss('CHAMBO', 'CHAMBA'), true);
assert.equal(isNearMiss('CHOMBO', 'CHAMBA'), false, 'dos letras mal no es casi');
assert.equal(isNearMiss('WEX', 'WEY'), false, 'palabras cortas no cuentan');

// Misma fórmula que el cálculo original
const min = computeXpBreakdown({ isPerfect: false });
assert.equal(min.total, 10);
assert.deepEqual(min.parts.map((p) => p.key), ['base']);

const max = computeXpBreakdown({ isPerfect: true, combo: 12, streak: 40, completedLevels: 25, timeSeconds: 8 });
assert.equal(max.total, 10 + 15 + 20 + 10 + 10 + 5);
assert.deepEqual(max.parts.map((p) => p.key), ['base', 'perfect', 'combo', 'streak', 'session', 'speed']);

const mid = computeXpBreakdown({ isPerfect: true, combo: 3, streak: 2, completedLevels: 12, timeSeconds: 25 });
assert.equal(mid.total, 10 + 15 + 6 + 5 + 1);

// Moneda dorada: azar + protección de mala racha
const { rollGoldenCoin, GOLDEN_PITY } = require('./gameFeedback.js');
assert.equal(rollGoldenCoin(0, () => 0.05), true, 'sale con probabilidad baja');
assert.equal(rollGoldenCoin(0, () => 0.5), false);
assert.equal(rollGoldenCoin(GOLDEN_PITY - 1, () => 0.99), true, 'garantizada tras la racha de mala suerte');
assert.equal(rollGoldenCoin(GOLDEN_PITY - 2, () => 0.99), false);

console.log('gameFeedback tests passed');
