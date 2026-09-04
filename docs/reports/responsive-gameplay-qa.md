# QA del gameplay responsive — 2026-09-04

## Alcance validado

Se verificó el modelo responsive, el contrato del teclado, la composición de la pantalla, accesibilidad y la exportación Android. Las consultas Convex, recompensas, validación de palabras, progreso y estado de mascota no se modificaron.

| Ventana | Modo | Columnas | Resultado matemático |
| --- | --- | ---: | --- |
| 320 × 568 | compact | 1 | Teclado dentro del ancho seguro; filas de 10 y 7+2 caben; tecla de 36 dp más hitSlop. |
| 390 × 844 | phone | 1 | Contenido y controles apilados; teclado de 220 dp dentro del área útil. |
| 768 × 1024 | tablet | 1 | Contenido limitado a 680 dp; teclas y cápsulas con límites máximos. |
| 1024 × 768 | landscape | 2 | Pista/respuesta y controles en columnas; teclado de 254 dp dentro del área útil. |
| 640 × 360, inset inferior 24 | landscape corto | 2 | El control se limita a `controlsAvailableHeight`; no rebasa el tablero. |

Las pruebas incluyen insets laterales extremos, insets verticales, cambio de orientación, fila con Ñ y las acciones separadas de borrar una letra y borrar toda la palabra.

## Accesibilidad

- Los cuatro poderes tienen rol y nombre descriptivo; los que gastan monedas anuncian su costo.
- Cada letra se anuncia individualmente, incluida Ñ.
- Borrar una letra y borrar toda la palabra tienen nombres distintos.
- El estado deshabilitado usa opacidad y borde, no solo color.
- El modo de reducción de movimiento detiene rebotes de teclas, fichas y el movimiento continuo de la mascota.

## Verificación ejecutada

- `npm test`: aprobado.
- `npm run typecheck`: aprobado.
- Generador cultural `--check`: 206 entradas, aprobado.
- `npx expo export --platform android`: aprobado; 1,871 módulos empaquetados.
- `git diff --check`: aprobado.

## Limitación de QA visual

No había emulador Android, dispositivo conectado ni `adb` disponible en este entorno. Por ello no se afirma una inspección visual nativa píxel por píxel. La ausencia de desbordamientos se comprobó mediante el modelo matemático y pruebas de estructura. Antes de publicar, conviene abrir el juego en Expo Go en al menos un teléfono pequeño y una tableta, rotar cada dispositivo y confirmar visualmente pista, respuesta, mascota, poderes, Ñ, limpiar y borrar.

Expo Go se utilizó únicamente como contexto de desarrollo; esta validación no cubre compras nativas.
