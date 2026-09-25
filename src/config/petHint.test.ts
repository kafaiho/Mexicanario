import assert from 'node:assert/strict';
import { keyForLetter, nextHintTarget, PET_HINT_IDLE_MS, shouldOfferPetHint } from './petHint.js';

// Teclas: sin acentos, la Ñ se conserva
assert.equal(keyForLetter('é'), 'E');
assert.equal(keyForLetter('ñ'), 'Ñ');
assert.equal(keyForLetter('Ü'), 'U');
assert.equal(keyForLetter(''), null);

// La casilla seleccionada manda si le falta su letra
assert.deepEqual(nextHintTarget({ word: 'TACO', guess: ['T', '', '', ''], selectedIndex: 2 }), { index: 2, key: 'C' });
// Si la seleccionada ya está bien, la primera que falte
assert.deepEqual(nextHintTarget({ word: 'TACO', guess: ['T', '', 'C', ''], selectedIndex: 2 }), { index: 1, key: 'A' });
// Letras equivocadas cuentan como faltantes; espacios y letras fijas no
assert.deepEqual(nextHintTarget({ word: 'LA ONDA', guess: ['L', 'A', ' ', 'X'], fixedLetters: [4], selectedIndex: -1 }), { index: 3, key: 'O' });
assert.deepEqual(nextHintTarget({ word: 'ÑOÑO', guess: ['Ñ', '', '', ''], selectedIndex: 1 }), { index: 1, key: 'O' });
assert.deepEqual(nextHintTarget({ word: 'MÉXICO', guess: ['M'], selectedIndex: 1 }), { index: 1, key: 'E' });
// Palabra completa y correcta: no hay pista
assert.equal(nextHintTarget({ word: 'SOL', guess: ['S', 'O', 'L'] }), null);

// Cuándo aparece
const t0 = 1_000_000;
assert.equal(shouldOfferPetHint({ now: t0 + 5000, lastInputAt: t0 }), false);
assert.equal(shouldOfferPetHint({ now: t0 + PET_HINT_IDLE_MS, lastInputAt: t0 }), true);
assert.equal(shouldOfferPetHint({ now: t0 + 1000, lastInputAt: t0, wrongTries: 2 }), true);
assert.equal(shouldOfferPetHint({ now: t0 + PET_HINT_IDLE_MS, lastInputAt: t0, used: true }), false, 'una vez por palabra');
assert.equal(shouldOfferPetHint({ now: t0 + PET_HINT_IDLE_MS, lastInputAt: t0, solved: true }), false);

console.log('petHint: la mascota señala la tecla que sigue, una vez por palabra');
