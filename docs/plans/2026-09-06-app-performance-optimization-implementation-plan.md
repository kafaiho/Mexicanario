# App Performance Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reducir trabajo innecesario de arranque, consultas, almacenamiento, audio y renderizado sin alterar la experiencia de juego.

**Architecture:** La optimización se hará en límites existentes: ciclo de vida de `App`, montaje condicional de modales, gestor de audio, temporizador de ruleta y consultas indexadas de Convex. Cada cambio tendrá una prueba de contrato o comportamiento antes de modificar producción.

**Tech Stack:** Expo SDK 55, React Native 0.83, React 19, Convex, Node test scripts, TypeScript.

---

### Task 1: Reducir trabajo de arranque y modales ocultos

**Files:**
- Modify: `App.jsx`
- Test: `src/config/appPerformance.contract.test.js`
- Modify: `scripts/run-tests.js`

1. Escribir pruebas que exijan ausencia de `autoFixDatabase` y montaje condicional de `ShopScreen`.
2. Ejecutar la prueba y confirmar que falla por el comportamiento actual.
3. Retirar la mutación del arranque y condicionar el montaje de modales pesados.
4. Ejecutar la prueba hasta que pase.

### Task 2: Evitar lecturas repetidas de almacenamiento en la ruleta

**Files:**
- Modify: `src/components/WheelModal.jsx`
- Test: `src/config/appPerformance.contract.test.js`

1. Agregar un contrato que limite `AsyncStorage.getItem` al ingreso del modal.
2. Confirmar el fallo con el intervalo actual.
3. Guardar el vencimiento en una referencia y calcular el restante en memoria.
4. Ejecutar la prueba.

### Task 3: Carga progresiva de audio

**Files:**
- Modify: `src/utils/soundManager.js`
- Modify: `App.jsx`
- Test: `src/config/appPerformance.contract.test.js`

1. Agregar contratos para una precarga inicial reducida y carga bajo demanda.
2. Confirmar el fallo.
3. Separar carga esencial, SFX de juego, mascota y música por clave, evitando instancias duplicadas.
4. Ejecutar pruebas.

### Task 4: Consulta indexada del pase de temporada

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/shop.ts`
- Test: `convex/shopPerformance.test.ts`
- Modify: `scripts/run-tests.js`

1. Escribir una prueba de contrato para el índice y `withIndex`.
2. Confirmar el fallo.
3. Agregar `by_user` y consultar con el índice.
4. Ejecutar la prueba y el typecheck.

### Task 5: Virtualización segura del ranking

**Files:**
- Modify: `src/screens/LeaderboardScreen.jsx`
- Test: `src/config/appPerformance.contract.test.js`

1. Crear un contrato que impida renderizar rankings largos con un `ScrollView` contenedor.
2. Confirmar el fallo.
3. Migrar el contenido activo a `FlatList` o mantener `ScrollView` solo para pestañas pequeñas.
4. Ejecutar pruebas.

### Task 6: Verificación completa

1. Ejecutar `npm test`.
2. Ejecutar `npm run typecheck`.
3. Revisar `git diff --check` y el diff limitado a los archivos de esta optimización.
4. Documentar cualquier optimización pospuesta que requiera migración o medición de producción.
