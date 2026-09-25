import assert from 'node:assert/strict';
import {
  DEFAULT_PET_TYPE,
  flameStatusFor,
  isLegacyPetType,
  normalizePetName,
  normalizePetSlots,
  normalizePetType,
  petEmoji,
  PET_TYPES,
} from './petTypes.js';
import { flameTierFor, PET3D_TYPES } from '../components/Pet3D/petModels.js';

// Las mascotas anteriores renacen como las nuevas
assert.equal(normalizePetType('ajolote'), 'ayotl');
assert.equal(normalizePetType('xolo'), 'tecolote');
assert.equal(normalizePetType('alebrije'), 'monarca');
assert.equal(normalizePetType('tecolote'), 'tecolote');
assert.equal(normalizePetType('nahual_sur'), 'nahual_sur', 'el Nahual no cambia');
assert.equal(normalizePetType(undefined), DEFAULT_PET_TYPE);
assert.ok(isLegacyPetType('xolo'));
assert.ok(!isLegacyPetType('monarca'));

// El catálogo y los modelos 3D son las mismas tres mascotas
assert.deepEqual(PET_TYPES.map((p) => p.id).sort(), [...PET3D_TYPES].sort());

// Nombres: los elegidos se conservan; los nombres por defecto viejos cambian
assert.equal(normalizePetName('Alebrije', 'alebrije'), 'Monarca');
assert.equal(normalizePetName('Xoloitzcuintle', 'xolo'), 'Tecolote');
assert.equal(normalizePetName('Pancho', 'ajolote'), 'Pancho');
assert.equal(normalizePetName('', 'ayotl'), 'Ayotl');

// Espacios guardados: llaves nuevas, el progreso viaja con la mascota
const slots = normalizePetSlots({
  ajolote: { name: 'Ajolote', stage: 4, vinculo: 900 },
  xolo: { name: 'Firulais', stage: 2, vinculo: 150 },
  nahual_norte: { name: 'Norteño', stage: 1 },
});
assert.deepEqual(Object.keys(slots).sort(), ['ayotl', 'nahual_norte', 'tecolote']);
assert.equal(slots.ayotl.stage, 4);
assert.equal(slots.ayotl.vinculo, 900);
assert.equal(slots.ayotl.name, 'Ayotl');
assert.equal(slots.tecolote.name, 'Firulais');
// Si ya existe el espacio nuevo, gana sobre el viejo
assert.equal(normalizePetSlots({ monarca: { stage: 5 }, alebrije: { stage: 2 } }).monarca.stage, 5);
assert.equal(normalizePetSlots({ alebrije: { stage: 2 }, monarca: { stage: 5 } }).monarca.stage, 5);

// Emojis de insignias
assert.equal(petEmoji('alebrije', 6), '🦋');
assert.equal(petEmoji('xolo', 1), '🥚');
assert.equal(petEmoji('desconocido', 3, '🐾'), '🐾');

// Llama del tonalli (días en UTC, igual que StreakBadge)
const at = (h: number) => new Date(Date.UTC(2026, 8, 25, h, 0, 0));
assert.equal(flameStatusFor({ currentStreak: 0 }, at(12)), 'apagada');
assert.equal(flameStatusFor(undefined, at(12)), 'apagada');
assert.equal(flameStatusFor({ currentStreak: 5, playedToday: true }, at(22)), 'activa');
assert.equal(flameStatusFor({ currentStreak: 5, playedToday: false }, at(12)), 'activa');
assert.equal(flameStatusFor({ currentStreak: 5, playedToday: false }, at(21)), 'riesgo');

// Niveles de la llama
assert.equal(flameTierFor(0).name, 'Brasa');
assert.equal(flameTierFor(7).name, 'Fogata');
assert.equal(flameTierFor(29).name, 'Fogata');
assert.equal(flameTierFor(30).name, 'Llama azul');
assert.equal(flameTierFor(400).name, 'Obsidiana');

console.log('petTypes: conversión de mascotas, nombres, espacios y llama del tonalli');
