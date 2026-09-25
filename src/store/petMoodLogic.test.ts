import assert from 'node:assert/strict';
import {
  MOOD_LOW,
  evolutionPatch,
  getEnergia,
  getPetMood,
  withMood,
} from './petMoodLogic';

const HOUR = 60 * 60 * 1000;
// Mediodía local: evita que el ánimo "sleepy" dependa de la hora del test
const noon = new Date(2026, 8, 23, 12, 0, 0).getTime();
const night = new Date(2026, 8, 23, 2, 0, 0).getTime();
const fresh = { energiaBase: 80, energiaAt: noon, alegriaBase: 80, alegriaAt: noon, lastInteraction: noon };

// Energía baja 4 por hora y nunca de 0
assert.equal(getEnergia(fresh, noon + 5 * HOUR), 60);
assert.equal(getEnergia(fresh, noon + 100 * HOUR), 0);

// Recién jugada y con todo arriba de 70 → feliz de la vida
assert.equal(getPetMood(fresh, noon), 'joyful');
// Un día sin jugar → hambre (la energía baja más rápido que la alegría)
assert.equal(getPetMood({ ...fresh, lastInteraction: noon }, noon + 24 * HOUR), 'hungry');
// Con energía pero sin alegría → triste
assert.equal(getPetMood({ ...fresh, alegriaBase: MOOD_LOW - 1 }, noon), 'sad');
// De noche e inactiva → sueño; de noche recién tocada → no
assert.equal(getPetMood({ ...fresh, lastInteraction: night - HOUR }, night), 'sleepy');
assert.notEqual(getPetMood({ ...fresh, lastInteraction: night }, night), 'sleepy');

// Comer parte del valor actual (con decaimiento) y topa en 100
const hungry = { ...fresh, energiaBase: 10 };
assert.equal(withMood(hungry, { energia: 35 }, noon).energiaBase, 45);
assert.equal(withMood(fresh, { energia: 100 }, noon).energiaBase, 100);
// Solo toca lo que se pide
assert.deepEqual(Object.keys(withMood(fresh, { alegria: 5 }, noon)).sort(), ['alegriaAt', 'alegriaBase']);

// Evolución: solo al subir de etapa, y conserva el origen si ya había una pendiente
assert.deepEqual(evolutionPatch(null, 2, 2), {});
assert.deepEqual(evolutionPatch(null, 2, 3), { pendingEvolution: { from: 2, to: 3 } });
assert.deepEqual(evolutionPatch({ from: 2, to: 3 }, 3, 4), { pendingEvolution: { from: 2, to: 4 } });

console.log('petMoodLogic: ánimo, comida y evolución pendiente');
