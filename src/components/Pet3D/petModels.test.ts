import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPetController, PET3D_TYPES } from './petModels.js';
import { buildOutfit, OUTFIT_IDS } from './petOutfits.js';

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

// Trajes 3D: cada traje se pone en las 18 etapas, no encoge a la mascota,
// deja la llama arriba del sombrero y se puede quitar y cambiar.
const heightOf = (pet: any) => new THREE.Box3().setFromObject(pet.scene).max.y;
for (const petType of PET3D_TYPES) {
  for (let stage = 1; stage <= 6; stage++) {
    const plain = createPetController({ petType, stage, showShadow: false });
    plain.update(0.016);
    const plainTop = heightOf(plain);
    plain.dispose();
    for (const outfit of OUTFIT_IDS) {
      const pet = createPetController({ petType, stage, showFlame: true, outfit, showShadow: false });
      pet.setSize(300, 300);
      pet.react('combo');
      for (let i = 0; i < 10; i++) pet.update(0.05);
      let found = false;
      pet.scene.traverse((o: any) => {
        if (o.userData.outfit === outfit) found = true;
        assert.ok(Number.isFinite(o.position.x + o.position.y + o.position.z), `${petType} ${stage} ${outfit}: posición inválida`);
      });
      assert.ok(found, `${petType} ${stage}: no se puso ${outfit}`);
      assert.ok(heightOf(pet) >= plainTop - 0.05, `${petType} ${stage} ${outfit}: la escena se encogió`);
      pet.setOutfit(null);
      let still = false;
      pet.scene.traverse((o: any) => { if (o.userData.outfit) still = true; });
      assert.ok(!still, `${petType} ${stage}: el traje no se quitó`);
      pet.setOutfit('skin_azteca');
      pet.update(0.016);
      pet.dispose();
    }
  }
}
assert.ok(!buildOutfit('skin_inexistente', { c: [0, 0, 0], r: 1 }), 'traje desconocido → nada');

// Interacción: la mirada sigue al dedo, las caricias y la pista no rompen nada,
// y tocar el centro de la mascota cae en ella (cabeza o cuerpo), no en el vacío.
for (const petType of PET3D_TYPES) {
  for (let stage = 1; stage <= 6; stage++) {
    const pet = createPetController({ petType, stage });
    pet.setSize(300, 300);
    pet.update(0.016);
    assert.equal(pet.zoneAt(0.98, 0.98), null, `${petType} ${stage}: la esquina está vacía`);
    let hitSomething = false;
    for (const y of [-0.3, -0.1, 0.1, 0.3]) if (pet.zoneAt(0, y)) hitSomething = true;
    assert.ok(hitSomething, `${petType} ${stage}: tocar el centro no cae en la mascota`);
    pet.lookAt(0.8, 0.6);
    for (let i = 0; i < 10; i++) pet.update(0.05);
    for (const kind of ['rub', 'headpat', 'tickle']) {
      pet.pet(kind);
      for (let i = 0; i < 30; i++) pet.update(0.05);
    }
    pet.react('hint');
    pet.lookAt(null);
    for (let i = 0; i < 60; i++) pet.update(0.05);
    pet.scene.traverse((o: any) => {
      assert.ok(Number.isFinite(o.position.x + o.position.y + o.position.z + o.rotation.x + o.rotation.y), `${petType} ${stage}: interacción inválida`);
    });
    pet.dispose();
  }
}
// En el tecolote juvenil, la parte alta es cabeza y la de abajo cuerpo
{
  const owl = createPetController({ petType: 'tecolote', stage: 4 });
  owl.setSize(300, 300);
  owl.update(0.016);
  const zones = [0.4, 0.2, 0, -0.2, -0.4].map((y) => owl.zoneAt(0, y)).filter(Boolean);
  assert.ok(zones.includes('head') && zones.includes('body'), `tecolote: zonas ${zones.join(',')}`);
  owl.dispose();
}

console.log(`petModels: 18 mascotas 3D se construyen, reaccionan y liberan; ${OUTFIT_IDS.length} trajes en cada etapa`);
