import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * useDevMode — persisted developer mode toggle.
 *
 * Activate: long-press the ⚙️ settings button in TopBar (2 seconds).
 * Deactivate: long-press again.
 *
 * When active:
 *  - Dev panel in MainMenuScreen (🪙 ∞, 🔄 N1, 🌱 15-18, 🐾 Mascota)
 *  - 🔧 Nivel button in GameplayScreen
 */
const useDevMode = create(
  persist(
    (set, get) => ({
      enabled: false,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
    }),
    {
      name: 'dev-mode-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useDevMode;
