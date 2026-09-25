import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import SKIN_CONFIG from '../constants/skinConfig';
import { DEFAULT_PET_TYPE, defaultPetName, isLegacyPetType, normalizePetName, normalizePetType } from '../config/petTypes';
import { STAGE_THRESHOLDS, VINCULO_MAX } from '../theme/designTokens';
import { FOOD_ENERGIA, evolutionPatch, withMood } from './petMoodLogic';

export { getAlegria, getEnergia, getPetMood, MOOD_HIGH, MOOD_LOW } from './petMoodLogic';

export { SKIN_CONFIG };

// Derive stage from vinculo (1-6)
export const getStage = (vinculo) => {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (vinculo >= STAGE_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Convierte un tipo anterior (ajolote, xolo, alebrije) y, la primera vez,
// deja pendiente el aviso de que la mascota renació como la nueva.
const withPetType = (s, rawType, rawName) => {
  const petType = normalizePetType(rawType);
  const patch = { petType, petName: normalizePetName(rawName ?? s.petName, petType) };
  if (isLegacyPetType(rawType) && !s.rebirthShown && !s.pendingRebirth) {
    patch.pendingRebirth = { from: rawType, to: petType };
  }
  return patch;
};

// Suma vínculo y detecta si la mascota subió de etapa (→ ceremonia de evolución)
const withVinculo = (s, amount) => {
  const vinculo = clamp(s.vinculo + amount, 0, VINCULO_MAX);
  return { vinculo, ...evolutionPatch(s.pendingEvolution, getStage(s.vinculo), getStage(vinculo)) };
};

const usePetStore = create(
  persist(
    (set, get) => ({
      // ── State ───────────────────────────────────────────────────────────
      vinculo: 0,                   // NUNCA mostrar en UI directamente
      streak: 0,
      petType: DEFAULT_PET_TYPE,    // 'tecolote' | 'monarca' | 'ayotl' | 'nahual_*'
      petName: defaultPetName(DEFAULT_PET_TYPE),
      activeSkin: null,             // skin ID activo o null
      lastInteraction: Date.now(),
      lastDecayCheck: Date.now(),
      lastTapDate: null,            // 'YYYY-MM-DD' string for daily tap tracking
      tapsTodayCount: 0,            // taps used today
      energiaBase: 80,              // 0-100, baja con el tiempo, sube al acertar/comer
      energiaAt: Date.now(),
      alegriaBase: 80,              // 0-100, baja con el tiempo, sube con caricias/aciertos
      alegriaAt: Date.now(),
      pendingEvolution: null,       // { from, to } → muestra EvolutionCeremony
      pendingRebirth: null,         // { from, to } → muestra PetRebirthNotice (una sola vez)
      rebirthShown: false,

      // ── Actions ─────────────────────────────────────────────────────────
      // +2 por acierto (antes +15 — ralentizado intencionalmente)
      acierto: () =>
        set((s) => ({
          ...withVinculo(s, 2),
          ...withMood(s, { energia: 6, alegria: 3 }),
          lastInteraction: Date.now(),
        })),

      // Errores no afectan el vínculo
      error: () => { },

      // +2 por caricia, máximo 10 taps diarios
      caricia: () =>
        set((s) => {
          const today = new Date().toISOString().slice(0, 10);
          const isNewDay = s.lastTapDate !== today;
          const tapsToday = isNewDay ? 0 : s.tapsTodayCount;
          // Límite diario: sigue alegrándose, pero ya no suma vínculo
          if (tapsToday >= 10) return { ...withMood(s, { alegria: 4 }), lastInteraction: Date.now() };
          return {
            ...withVinculo(s, 2),
            ...withMood(s, { alegria: 8 }),
            lastInteraction: Date.now(),
            lastTapDate: today,
            tapsTodayCount: tapsToday + 1,
          };
        }),

      // +(streak * 2) al completar racha
      streakBonus: (days) =>
        set((s) => ({
          ...withVinculo(s, days * 2),
          streak: days,
        })),

      // Comida comprada: recupera energía y suma el vínculo que confirmó el servidor
      // (el vínculo de la app es el que decide la evolución)
      alimentar: (foodType, bondIncrease = 0) =>
        set((s) => ({
          ...(bondIncrease > 0 ? withVinculo(s, bondIncrease) : {}),
          ...withMood(s, { energia: FOOD_ENERGIA[foodType] ?? 35, alegria: 10 }),
          lastInteraction: Date.now(),
        })),

      clearPendingEvolution: () => set({ pendingEvolution: null }),
      clearPendingRebirth: () => set({ pendingRebirth: null, rebirthShown: true }),

      // -1/hora por inactividad — desactivado por petición del usuario
      decay: () => {
        // Decay logic removed to not punish casual players
      },

      // Sync desde Convex al iniciar sesión
      // Al cambiar de mascota se descarta la evolución pendiente de la anterior
      hydrateFromBackend: ({ vinculo, petType, petName, streak }) =>
        set((s) => {
          const typePatch = withPetType(s, petType, petName);
          return {
            vinculo, streak, ...typePatch,
            ...(s.petType !== typePatch.petType ? { pendingEvolution: null } : {}),
          };
        }),

      setPetType: (petType) => set((s) => withPetType(s, petType, s.petName)),
      setPetName: (petName) => set((s) => ({ petName: normalizePetName(petName, s.petType) })),
      setActiveSkin: (activeSkin) => set({ activeSkin }),
    }),
    {
      name: 'pet-bond-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistir datos necesarios; NO exponer vinculo en UI
      partialize: (state) => ({
        vinculo: state.vinculo,
        streak: state.streak,
        petType: state.petType,
        petName: state.petName,
        activeSkin: state.activeSkin,
        lastInteraction: state.lastInteraction,
        lastDecayCheck: state.lastDecayCheck,
        lastTapDate: state.lastTapDate,
        tapsTodayCount: state.tapsTodayCount,
        energiaBase: state.energiaBase,
        energiaAt: state.energiaAt,
        alegriaBase: state.alegriaBase,
        alegriaAt: state.alegriaAt,
        pendingEvolution: state.pendingEvolution,
        pendingRebirth: state.pendingRebirth,
        rebirthShown: state.rebirthShown,
      }),
      // v1 (sep 2026): ajolote/xolo/alebrije → ayotl/tecolote/monarca, conservando el progreso.
      // El aviso de "renació" no se decide aquí: el tipo local por defecto era 'alebrije'
      // aun sin mascota. Lo activa withPetType cuando el servidor confirma un tipo anterior.
      version: 1,
      migrate: (persisted, version) => {
        if (!persisted || version >= 1) return persisted;
        const petType = normalizePetType(persisted.petType);
        return {
          ...persisted,
          petType,
          petName: normalizePetName(persisted.petName, petType),
          pendingRebirth: null,
          rebirthShown: false,
        };
      },
    }
  )
);

export default usePetStore;
