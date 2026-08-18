import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clamp,
  getGameplayResponsiveLayout,
} from '../config/gameplayResponsiveLayout';

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

  return useMemo(() => {
    const kbPaddingV = portraitHeight ? layout.keyboardPadding : Math.max(4, layout.keyboardPadding - 2);
    const minimumKeyboardHeight = kbPaddingV * 2 + 36 * 3 + layout.keyGap * 2;
    const kbHeight = portraitHeight
      ? clamp(portraitHeight, Math.min(minimumKeyboardHeight, layout.safeHeight), layout.safeHeight)
      : Math.min(layout.keyboardHeight, layout.safeHeight);
    const maximumKeyHeight = Math.max(
      36,
      Math.floor((kbHeight - kbPaddingV * 2 - layout.keyGap * 2) / 3),
    );
    const kbKeyH = portraitKeyH
      ? clamp(portraitKeyH, 36, maximumKeyHeight)
      : Math.min(layout.keyHeight, maximumKeyHeight);
    const tabletScale = layout.mode === 'tablet' || layout.mode === 'landscape';

    return {
      layout,
      kbHeight,
      kbKeyH,
      kbKeyW: layout.keyWidth,
      kbSpecialW: layout.specialWidth,
      kbMargin: layout.keyGap / 2,
      kbPaddingV,
      kbRowMarginB: layout.keyGap,
      kbFontSize: tabletScale ? 22 : layout.mode === 'compact' ? 16 : 18,
      kbIconSize: tabletScale ? 28 : layout.mode === 'compact' ? 20 : 22,
    };
  }, [layout, portraitHeight, portraitKeyH]);
}
