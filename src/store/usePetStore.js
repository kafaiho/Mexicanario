import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import SKIN_CONFIG from '../constants/skinConfig';
import { STAGE_THRESHOLDS, VINCULO_MAX } from '../theme/designTokens';

export { SKIN_CONFIG };

// Derive stage from vinculo (1-6)
export const getStage = (vinculo) => {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (vinculo >= STAGE_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

// Derive mood for animation frame selection
export const getMood = (vinculo) => {
  const ratio = vinculo / VINCULO_MAX;
  if (ratio < 0.1) return 'sad';
  if (ratio < 0.4) return 'neutral';
  if (ratio < 0.7) return 'happy';
  return 'joyful';
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const usePetStore = create(
  persist(
    (set, get) => ({
      // ── State ───────────────────────────────────────────────────────────
      vinculo: 0,                   // NUNCA mostrar en UI directamente
      streak: 0,
      petType: 'alebrije',          // 'alebrije' | 'xolo' | 'ajolote'
      petName: 'Alebrije',
      activeSkin: null,             // skin ID activo o null
      lastInteraction: Date.now(),
      lastDecayCheck: Date.now(),
      lastTapDate: null,            // 'YYYY-MM-DD' string for daily tap tracking
      tapsTodayCount: 0,            // taps used today

      // ── Actions ─────────────────────────────────────────────────────────
      // +2 por acierto (antes +15 — ralentizado intencionalmente)
      acierto: () =>
        set((s) => ({
          vinculo: clamp(s.vinculo + 2, 0, VINCULO_MAX),
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
          if (tapsToday >= 10) return {}; // límite diario alcanzado
          return {
            vinculo: clamp(s.vinculo + 2, 0, VINCULO_MAX),
            lastInteraction: Date.now(),
            lastTapDate: today,
            tapsTodayCount: tapsToday + 1,
          };
        }),

      // +(streak * 2) al completar racha
      streakBonus: (days) =>
        set((s) => ({
          vinculo: clamp(s.vinculo + days * 2, 0, VINCULO_MAX),
          streak: days,
        })),

      // -1/hora por inactividad — desactivado por petición del usuario
      decay: () => {
        // Decay logic removed to not punish casual players
      },

      // Sync desde Convex al iniciar sesión
      hydrateFromBackend: ({ vinculo, petType, petName, streak }) =>
        set({ vinculo, petType, petName, streak }),

      setPetType: (petType) => set({ petType }),
      setPetName: (petName) => set({ petName }),
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
      }),
    }
  )
);

export default usePetStore;
