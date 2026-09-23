# Documento de Diseño: Optimización de Fluidez & Rediseño de Mascota (60 FPS)

**Fecha**: 22 de Julio de 2026  
**Proyecto**: MexicanarioApp (React Native / Expo SDK 55)

---

## 1. Visión General

El objetivo es lograr que **MexicanarioApp** se sienta ultra-fluida (60 FPS estables) reduciendo la carga en el hilo de JavaScript (JS Thread), al mismo tiempo que elevamos la calidad estética de la Mascota Virtual (Ajolote, Xolo, Alebrije, Nahual) con micro-animaciones expresivas, efectos visuales y optimización de renderizado.

---

## 2. Arquitectura de Rendimiento (Fluidez a 60 FPS)

### 2.1 Animaciones Offloaded al Hilo UI (`react-native-reanimated`)
- **Migración de Animaciones**: Convertir animaciones de `Animated` estándar a `react-native-reanimated 4` en `PetSprite.jsx`, `FloatingMascot.jsx`, `DraggablePet.jsx` y `StageCropped.jsx`.
- **Eliminación de re-renders por frame**: Usar `useSharedValue` y `useAnimatedStyle` para las transformaciones de escala, flotación, parpadeo, pulso y partículas sin gatillar ciclos de `setState` de React.

### 2.2 Memoización y Control de Ciclos de Vida
- Envolver `PetSprite`, `FloatingMascot`, `PetParticles`, `JuicyTabButton` y componentes de barras en `React.memo` con comparadores de props eficientes.
- En `MascotaScreen.jsx`, evitar la recreación de callbacks mediante `useCallback` y `useMemo` para datos de la mascota y niveles.

---

## 3. Rediseño y Mejoras Estéticas de la Mascota

### 3.1 Micro-animaciones Expresivas
- **Respiración Viva (Idling)**: Movimiento sinusoidal suave en el eje Y y escala en Y/X para dar efecto de respiración viva.
- **Interacción y Reacción al Tap**: Reacción con rebote jugoso (`spring`), partículas de corazones/estrellas y frases aleatorias con haptic feedback instantáneo.
- **Efectos de Nivel & Evolución**: Brillo resplandeciente (`LinearGradient` animado o destellos prehispánicos) al alimentar o subir de nivel a la mascota.

### 3.2 Soporte de Nahual & Assets
- Reemplazar el asset genérico de prueba (`help-character.png`) por la visualización mejorada y estilizada con auras de poder para las variantes de Nahual (Norteño 🤠, Sureño 🌿, Urbano 🏙️).

---

## 4. Plan de Verificación

- **Fluidez (FPS)**: Probar animaciones en iOS/Android sin caídas de cuadros durante la flotación y el arrastre de la mascota.
- **Type Checking**: Ejecutar `npx tsc --noEmit` para garantizar cero regresiones de código o tipos.
- **Prueba Funcional**: Probar alimentación, interacción de tap, cambio de accesorios y evolución sin retardos de renderizado.
