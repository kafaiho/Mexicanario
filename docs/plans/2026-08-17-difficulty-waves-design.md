# Diseño de dificultad «Oleaje mexicano»

**Fecha:** 2026-08-17
**Estado:** Aprobado

## Objetivo

Combinar una progresión cultural comprensible con variación suficiente para que los niveles no se sientan mecánicos. El recorrido debe volverse más exigente con el tiempo, pero incluir descansos y sorpresas sin cambiar al cerrar la aplicación.

## Distribución

En ventanas de diez niveles se buscará la siguiente mezcla:

- 60 % de niveles con la dificultad esperada para el tramo;
- 25 % ligeramente más fáciles;
- 15 % más difíciles;
- el nivel 10 de cada ventana funciona como reto cultural especial.

Como diez posiciones no permiten representar exactamente 60/25/15, se alternarán dos plantillas deterministas:

- plantilla A: 6 esperados, 3 descansos y 1 sorpresa;
- plantilla B: 6 esperados, 2 descansos y 2 sorpresas.

Al alternarlas, dos ventanas producen 60 % esperado, 25 % descanso y 15 % sorpresa.

## Dificultad base

La dificultad esperada crecerá por posición editorial:

- introducción: dificultad 1;
- desarrollo: mezcla principal de dificultades 1 y 2;
- recorrido regional e histórico: dificultad 2;
- cierre: mezcla de dificultades 2 y 3.

La selección utilizará el campo editorial `difficulty` del catálogo. Longitud de palabra, número de palabras y necesidad de contexto funcionarán como desempates, no como sustitutos de la clasificación editorial.

## Aleatoriedad estable

La variación será pseudoaleatoria y determinista, derivada de `userId`, versión de orden y número de ventana. El mismo usuario recibirá siempre el mismo recorrido mientras no cambie la versión editorial. Dos usuarios podrán recibir variaciones distintas sin que el progreso se desplace entre sesiones.

## Reglas de seguridad

- El orden v1 de usuarios existentes permanece exactamente congelado.
- Solo el recorrido cultural v2 usa el oleaje.
- Los primeros 50 niveles permanecen familiares y con dificultad máxima 2.
- El contenido con clasificación adulta nunca entra en ventanas tempranas.
- Una sorpresa difícil solo puede adelantarse dentro de una distancia limitada; no arrastra contenido del cierre al inicio.
- Las palabras retiradas quedan fuera de v2.
- Cada palabra aparece una sola vez.
- Si no hay candidato para una posición, se usa el candidato válido más cercano y se registra la desviación en pruebas o auditoría.

## Retos culturales

Cada décima posición debe preferir una palabra de dificultad superior, una voz regional bien contextualizada o un concepto que combine varias pistas culturales. El reto sigue respetando clasificación familiar, límites de tramo y disponibilidad real del catálogo.

## Validación

- Proporción 60/25/15 exacta en cada bloque de veinte posiciones cuando existan candidatos suficientes.
- Determinismo para el mismo usuario y variación entre usuarios.
- Ausencia de duplicados y pérdida de niveles.
- Progreso v1 idéntico antes y después.
- Primeros 50 niveles familiares y sin dificultad 3.
- Reto cultural en cada posición múltiplo de diez.
- Fallback estable cuando un grupo de dificultad se agota.
