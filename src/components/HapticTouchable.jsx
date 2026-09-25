import React, { forwardRef } from "react";
import { TouchableOpacity } from "react-native";
import { tapLight } from "../services/haptics";

/**
 * TouchableOpacity con vibración ligera al tocar (respeta Ajustes > Vibración).
 * Solo vibra si el botón hace algo (tiene onPress y no está deshabilitado).
 * Se importa como reemplazo directo: `import TouchableOpacity from "./HapticTouchable"`.
 * `haptic={false}` lo silencia en un botón concreto.
 */
const HapticTouchable = forwardRef(function HapticTouchable({ onPressIn, haptic = true, ...props }, ref) {
  const handlePressIn = (e) => {
    if (haptic && !props.disabled && props.onPress) tapLight();
    onPressIn?.(e);
  };
  return <TouchableOpacity ref={ref} {...props} onPressIn={handlePressIn} />;
});

export default HapticTouchable;
