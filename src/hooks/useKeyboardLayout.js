import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
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
 * @param {number} [opts.topBarHeight] Alto real de la barra superior flotante
 * @param {boolean} [opts.insideSafeAreaView] La pantalla usa el SafeAreaView de React
 *   Native, que ya aplica los márgenes seguros en iOS (no en Android)
 */
export function useKeyboardLayout(opts = {}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { portraitHeight, portraitKeyH, topBarHeight, insideSafeAreaView = false } = opts;
  const appliesInsets = insideSafeAreaView && Platform.OS === 'ios';

  const layout = useMemo(
    () => getGameplayResponsiveLayout({
      width,
      height,
      insets,
      topBarHeight,
      appliedInsets: appliesInsets ? { top: insets.top, bottom: insets.bottom } : undefined,
    }),
    [width, height, insets.top, insets.right, insets.bottom, insets.left, topBarHeight, appliesInsets],
  );

  return useMemo(
    () => getKeyboardLayoutMetrics({ layout, portraitHeight, portraitKeyH }),
    [layout, portraitHeight, portraitKeyH],
  );
}
