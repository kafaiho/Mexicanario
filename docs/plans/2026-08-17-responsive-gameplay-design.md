# Diseño responsive de la pantalla de juego

**Fecha:** 2026-08-17
**Estado:** Aprobado

## Objetivo

Rediseñar toda la pantalla de juego conservando su identidad colorida y juguetona, pero con una jerarquía más clara, mayor espacio entre elementos y adaptación real a teléfonos pequeños, teléfonos grandes, tablets y orientación horizontal.

## Intención

La pantalla acompaña a una persona que quiere resolver una palabra mexicana con rapidez, sin perder el tono de juego infantil y celebración cultural. Debe sentirse como una bandeja de fichas de recreo: alegre, táctil, clara y ordenada, nunca apretada ni infantilizada en exceso.

## Mundo visual

- Dominio: lotería, fichas de letras, recreo, retos, premios, caminos culturales y juguetes mexicanos.
- Paleta: verde premio, rosa ayuda, azul progreso, naranja reto, blanco cálido, gris papel y azul tinta.
- Firma: una bandeja inferior elevada con cápsulas de poderes y teclado de fichas redondeadas.
- Se evitan: teclado pegado a los bordes, tamaños calculados una sola vez al cargar, tarjetas blancas genéricas y sombras fuertes mezcladas sin sistema.

## Sistema visual

- Unidad de espacio: 4 dp; escala principal 4, 8, 12, 16, 24 y 32.
- Profundidad: sombras suaves y consistentes; una superficie base, tarjeta de pista y bandeja de teclado elevada.
- Radios: 10 para teclas, 16 para tarjetas, 20 para bandejas y cápsulas completas para poderes.
- Tipografía: pesos fuertes en letras y acciones, cuerpo más ligero en pistas y metadatos.
- Áreas táctiles: mínimo 44 × 44 dp cuando el dispositivo lo permita; nunca menos de 36 dp en el teclado compacto.
- Color comunica función: verde revela, rosa filtra, azul completa y naranja comparte; los estados deshabilitados pierden saturación, no legibilidad.

## Arquitectura responsive

Se reemplazan las constantes globales de `Dimensions.get()` por medición reactiva con `useWindowDimensions` y un único modelo de layout.

### Teléfono compacto

- Ancho menor a 360 dp o alto útil menor a 650 dp.
- Separaciones de 8–12 dp.
- Pista y palabra priorizadas; metadatos secundarios se compactan.
- Poderes en una fila con iconos claros y costos legibles.
- Teclado ocupa el ancho útil sin cortar Ñ ni las teclas especiales.

### Teléfono estándar y grande

- Contenido centrado con ancho máximo.
- Separaciones de 12–20 dp.
- Palabra y pista respiran antes de la bandeja inferior.
- Teclas más altas y estados táctiles más visibles.

### Tablet vertical

- Tablero central con ancho máximo aproximado de 680 dp.
- La bandeja no se estira hasta los extremos físicos.
- Mascota y contenido ganan espacio sin inflar desproporcionadamente textos o teclas.

### Horizontal

- Dos columnas: pista, palabra y mascota a la izquierda; poderes y teclado a la derecha.
- La barra superior permanece fuera del flujo de juego.
- Se evita que el teclado consuma toda la altura o tape la palabra.

## Composición

1. Barra superior segura y estable.
2. Contexto cultural o repaso como etiqueta secundaria.
3. Tarjeta de pista con jerarquía de título, pista opcional y categoría.
4. Zona de respuesta flexible que agrupa palabras y adapta fichas según longitud.
5. Espacio de mascota que no invade controles.
6. Bandeja de acciones con cuatro cápsulas.
7. Teclado de tres filas, centrado, con Ñ visible y borrar/limpiar diferenciados por icono y color.

## Interacción y accesibilidad

- Cada poder tendrá etiqueta accesible con acción y costo.
- Cada tecla anunciará letra o acción; limpiar y borrar no dependerán solo del color.
- Estados: normal, presionado, deshabilitado, revelado, correcto y error.
- Movimiento breve y suave: presión de tecla, selección de ficha y celebración; se respetará reducción de movimiento cuando esté disponible.
- Las áreas inferiores respetarán safe-area e indicadores de navegación.

## Implementación propuesta

- Crear un hook puro de layout responsive que reciba ancho, alto, orientación e insets.
- Extraer tokens de pantalla y cálculos de teclado fuera del `StyleSheet` estático.
- Mantener la lógica de juego, recompensas y migración sin cambios.
- Reorganizar el render en regiones semánticas, sin un rediseño de navegación.
- Conservar los colores actuales y mejorar contraste, espaciado y consistencia.

## Verificación

- Pruebas unitarias del modelo de layout para 320 × 568, 360 × 800, 390 × 844, 768 × 1024 y 1024 × 768.
- Ninguna tecla fuera del ancho útil; Ñ y acciones especiales siempre presentes.
- Áreas táctiles y separación dentro de límites definidos.
- Prueba de que horizontal usa dos columnas y vertical una columna.
- Suite existente y TypeScript sin regresiones.
- Revisión visual en al menos 320, 390, tablet vertical y tablet horizontal.
