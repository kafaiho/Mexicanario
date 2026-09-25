import assert from 'node:assert/strict';
import { createPetController, PET3D_TYPES } from './petModels.js';

// Cada mascota y etapa se construye, anima, reacciona y libera sin errores,
// con todos los estados de la llama y del ánimo.
for (const petType of PET3D_TYPES) {
  for (let stage = 1; stage <= 6; stage++) {
    const pet = createPetController({ petType, stage, showFlame: true });
    pet.setSize(300, 300);
    for (const [days, status] of [[0, 'apagada'], [3, 'activa'], [45, 'riesgo'], [400, 'activa']] as const) {
      pet.setStreak(days, status);
      pet.update(0.016);
    }
    for (const mood of ['joyful', 'sad', 'sleepy', 'happy']) {
      pet.setMood(mood);
      pet.update(0.016);
    }
    for (const kind of ['tap', 'correct', 'combo', 'wrong']) {
      pet.react(kind);
      for (let i = 0; i < 20; i++) pet.update(0.05);
    }
    // La cámara encuadra algo con tamaño y todo queda en números finitos
    assert.ok(Number.isFinite(pet.camera.position.z) && pet.camera.position.z > 0, `${petType} ${stage}: cámara`);
    pet.scene.traverse((o) => {
      assert.ok(Number.isFinite(o.position.x + o.position.y + o.position.z), `${petType} ${stage}: posición inválida`);
    });
    pet.setPet(petType, stage === 6 ? 1 : stage + 1);   // evolucionar reconstruye el modelo
    pet.update(0.016);
    pet.dispose();
  }
}

console.log('petModels: 18 mascotas 3D se construyen, reaccionan y liberan');
