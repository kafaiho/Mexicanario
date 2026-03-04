import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const BASE_KEY = "@mexicanario:onboarding_v1";

/**
 * Tracks onboarding progress for a given screen (screenKey).
 * Persists completion in AsyncStorage — once done, never shows again.
 *
 * @param {string} screenKey  e.g. "gameplay", "menu"
 * @returns {{ step: number, active: boolean, advance: (total: number) => void, skip: () => void }}
 */
export function useOnboarding(screenKey) {
  const [step, setStep] = useState(null); // null while loading from storage

  useEffect(() => {
    AsyncStorage.getItem(`${BASE_KEY}:${screenKey}`)
      .then(val => setStep(val === "done" ? -1 : 0))
      .catch(() => setStep(-1));
  }, [screenKey]);

  const advance = (total) => {
    setStep(s => {
      const next = (s ?? 0) + 1;
      if (next >= total) {
        AsyncStorage.setItem(`${BASE_KEY}:${screenKey}`, "done").catch(() => {});
        return -1; // -1 = completed
      }
      return next;
    });
  };

  const skip = () => {
    AsyncStorage.setItem(`${BASE_KEY}:${screenKey}`, "done").catch(() => {});
    setStep(-1);
  };

  // active is true only when loaded and on a valid step
  const active = step !== null && step >= 0;

  return { step: step ?? 0, active, advance, skip };
}
