import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getGameplayResponsiveLayout,
} from '../config/gameplayResponsiveLayout';
import { getKeyboardLayoutMetrics } from '../config/keyboardLayout';

/**
 * Keyboard layout dimensions derived from the live viewport and safe area.
 *
 * @param {object} [opts]
 * @param {number} [opts.portraitHeight] Legacy keyboard-height override (e.g. PvP)
 * @param {number} [opts.portraitKeyH] Legacy key-height override
 */
export function useKeyboardLayout(opts = {}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { portraitHeight, portraitKeyH } = opts;

  const layout = useMemo(
    () => getGameplayResponsiveLayout({ width, height, insets }),
    [width, height, insets.top, insets.right, insets.bottom, insets.left],
  );

  return useMemo(
    () => getKeyboardLayoutMetrics({ layout, portraitHeight, portraitKeyH }),
    [layout, portraitHeight, portraitKeyH],
  );
}
