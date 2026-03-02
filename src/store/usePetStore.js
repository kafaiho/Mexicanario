import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STAGE_THRESHOLDS, VINCULO_MAX } from '../theme/designTokens';

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
      lastInteraction: Date.now(),
      lastDecayCheck: Date.now(),

      // ── Actions ─────────────────────────────────────────────────────────
      // +15 por acierto
      acierto: () =>
        set((s) => ({
          vinculo: clamp(s.vinculo + 15, 0, VINCULO_MAX),
          lastInteraction: Date.now(),
        })),

      // -3 por error
      error: () =>
        set((s) => ({ vinculo: clamp(s.vinculo - 3, 0, VINCULO_MAX) })),

      // +5 por caricia (tap directo sobre mascota)
      caricia: () =>
        set((s) => ({
          vinculo: clamp(s.vinculo + 5, 0, VINCULO_MAX),
          lastInteraction: Date.now(),
        })),

      // +(streak * 2) al completar racha
      streakBonus: (days) =>
        set((s) => ({
          vinculo: clamp(s.vinculo + days * 2, 0, VINCULO_MAX),
          streak: days,
        })),

      // -1/hora por inactividad — llamar periódicamente
      decay: () => {
        const now = Date.now();
        const horasInactivo = (now - get().lastDecayCheck) / 3_600_000;
        const decayAmount = Math.floor(horasInactivo) * 1;
        if (decayAmount > 0) {
          set((s) => ({
            vinculo: clamp(s.vinculo - decayAmount, 0, VINCULO_MAX),
            lastDecayCheck: now,
          }));
        }
      },

      // Sync desde Convex al iniciar sesión
      hydrateFromBackend: ({ vinculo, petType, petName, streak }) =>
        set({ vinculo, petType, petName, streak }),

      setPetType: (petType) => set({ petType }),
      setPetName: (petName) => set({ petName }),
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
        lastInteraction: state.lastInteraction,
        lastDecayCheck: state.lastDecayCheck,
      }),
    }
  )
);

export default usePetStore;
