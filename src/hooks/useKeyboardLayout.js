import { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import { TABLET_MODE } from '../utils/tabletSetup';

// Phone values are static — never change
const PHONE_WIDTH = Dimensions.get('window').width;
const PHONE_HEIGHT = Dimensions.get('window').height;

/**
 * Keyboard layout dimensions — orientation-aware on tablet.
 *
 * @param {object} [opts]
 * @param {number} [opts.portraitHeight]  Override keyboard height (e.g. 340 for PvP)
 * @param {number} [opts.portraitKeyH]   Override key height
 */
export function useKeyboardLayout(opts = {}) {
  // Track real screen dims for tablet orientation changes
  const [screenDims, setScreenDims] = useState(() => Dimensions.get('screen'));

  useEffect(() => {
    if (!TABLET_MODE) return;
    const sub = Dimensions.addEventListener('change', ({ screen }) => {
      setScreenDims(screen);
    });
    return () => sub.remove();
  }, []);

  return useMemo(() => {
    if (!TABLET_MODE) {
      // ── Phone ──
      const kbMargin = 2;
      const kbUsable = PHONE_WIDTH - 28;
      const keyW = Math.floor((kbUsable - 10 * kbMargin * 2) / 10);
      const specialW = Math.floor((kbUsable - 7 * keyW - 9 * kbMargin * 2) / 2);
      const kbHeight = Math.min(opts.portraitHeight ?? 264, PHONE_HEIGHT * 0.39);
      return {
        kbHeight,
        kbKeyH: opts.portraitKeyH ?? 54,
        kbKeyW: keyW,
        kbSpecialW: specialW,
        kbMargin,
        kbPaddingV: opts.portraitHeight ? 10 : 4,
        kbRowMarginB: 7,
        kbFontSize: 18,
        kbIconSize: 22,
      };
    }

    // ── Tablet — orientation-aware ──
    const isLandscape = screenDims.width > screenDims.height;
    const currentW = screenDims.width;

    const kbMargin = 3;
    // Container: left:16 + right:16 = 32. Keyboard paddingH: 14×2 = 28. Total = 60.
    const kbUsable = currentW - 60;
    const keyW = Math.floor((kbUsable - 10 * kbMargin * 2) / 10);
    const specialW = Math.floor((kbUsable - 7 * keyW - 9 * kbMargin * 2) / 2);

    if (isLandscape) {
      // Landscape: more horizontal space, use taller keys
      return {
        kbHeight: opts.portraitHeight ?? 420,
        kbKeyH: opts.portraitKeyH ?? 84,
        kbKeyW: keyW,
        kbSpecialW: specialW,
        kbMargin,
        kbPaddingV: opts.portraitHeight ? 14 : 8,
        kbRowMarginB: 10,
        kbFontSize: 24,
        kbIconSize: 32,
      };
    }

    // Portrait: shorter keys to free vertical space for game content
    return {
      kbHeight: opts.portraitHeight ?? 310,
      kbKeyH: opts.portraitKeyH ?? 58,
      kbKeyW: keyW,
      kbSpecialW: specialW,
      kbMargin,
      kbPaddingV: opts.portraitHeight ? 12 : 6,
      kbRowMarginB: 7,
      kbFontSize: 22,
      kbIconSize: 28,
    };
  }, [screenDims, opts.portraitHeight, opts.portraitKeyH]);
}
