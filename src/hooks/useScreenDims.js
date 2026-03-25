import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { TABLET_MODE } from '../utils/tabletSetup';

/**
 * Returns real-time screen dimensions that update on rotation.
 * Uses Dimensions.get('screen') (unpatched) so values reflect actual device size.
 */
export function useScreenDims() {
  const [dims, setDims] = useState(() => Dimensions.get('screen'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ screen }) => {
      setDims(screen);
    });
    return () => sub.remove();
  }, []);
  return dims;
}

/**
 * Returns true when on tablet AND screen is wider than tall (landscape).
 * On phone this always returns false.
 */
export function useIsLandscape() {
  const screen = useScreenDims();
  return TABLET_MODE && screen.width > screen.height;
}
