import { NavigationContext } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";

/**
 * Como useIsFocused, pero no falla fuera de una pantalla (por ejemplo, en la
 * tienda global montada junto al navegador): ahí se considera siempre enfocado.
 */
export default function useIsFocusedSafe() {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => (navigation ? navigation.isFocused() : true));

  useEffect(() => {
    if (!navigation) return undefined;
    setFocused(navigation.isFocused());
    const offFocus = navigation.addListener("focus", () => setFocused(true));
    const offBlur = navigation.addListener("blur", () => setFocused(false));
    return () => { offFocus(); offBlur(); };
  }, [navigation]);

  return focused;
}
