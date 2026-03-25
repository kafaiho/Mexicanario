import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useCombo — manages combo game logic and UI visibility as separate concerns.
 *
 * gameState:  comboCount, maxCombo  (the actual combo chain — never cleared by UI)
 * uiState:    comboVisible          (banner display — independent from game logic)
 *
 * Usage:
 *   const { comboCount, maxCombo, comboVisible, incrementCombo, resetCombo, dismissCombo } = useCombo();
 *
 *   incrementCombo()  — perfect answer, no mistakes
 *   resetCombo()      — combo broken (had wrong attempts)
 *   dismissCombo()    — user started typing next word (hides banner, keeps count)
 */
export function useCombo() {
  const [comboCount, setComboCount] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [comboVisible, setComboVisible] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Perfect answer with no wrong attempts → show banner for 700ms then auto-hide
  const incrementCombo = useCallback(() => {
    setComboCount((prev) => {
      const next = prev + 1;
      setMaxCombo((m) => Math.max(m, next));
      return next;
    });
    setComboVisible(true);
    clearTimer();
    timerRef.current = setTimeout(() => setComboVisible(false), 700);
  }, [clearTimer]);

  // Combo broken by wrong attempt → reduce count (grace: pass target value, default 0)
  const resetCombo = useCallback((target = 0) => {
    setComboCount(target);
    setComboVisible(false);
    clearTimer();
  }, [clearTimer]);

  // User starts typing next word → fast-dismiss banner, keep comboCount intact
  const dismissCombo = useCallback(() => {
    setComboVisible(false);
    clearTimer();
  }, [clearTimer]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => () => clearTimer(), [clearTimer]);

  return { comboCount, maxCombo, comboVisible, incrementCombo, resetCombo, dismissCombo };
}
