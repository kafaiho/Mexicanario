# Diseño del teclado responsive de Mexicanario

## Intención

El teclado debe sentirse como una pieza del juego: alegre, táctil y mexicana, sin competir con la palabra que se está resolviendo. La acción cotidiana es escribir y borrar; las pistas son secundarias y limpiar toda la respuesta es destructivo.

## Dirección aprobada

- Superficie marfil azulada con elevación suave, compatible con el tablero actual.
- Letras en azul tinta sobre teclas blancas.
- Acento discreto inspirado en papel picado, construido con formas simples y sin imágenes pesadas.
- `BORRAR` en turquesa y con mayor anchura que una letra.
- `LIMPIAR` en coral, separado visualmente de borrar.
- Verde, rosa, azul y naranja se mantienen para los cuatro poderes.
- La fila inferior conserva `LIMPIAR Z X C V B N M BORRAR`.

## Comportamiento responsive

- Compacto: iconos sin etiquetas visibles y sin texto de ayuda; se conservan etiquetas de accesibilidad.
- Teléfono y tableta vertical: icono más etiqueta corta, además de la indicación “Mantén borrar para borrar rápido”.
- Horizontal: panel en la columna de controles, sin texto auxiliar para proteger la altura del juego.
- El ancho especial se calcula con el espacio sobrante real de la tercera fila; ninguna tecla usa dimensiones fijas independientes de la pantalla.
- El panel respeta safe areas y mantiene el ancho máximo ya definido para teléfono, tableta y horizontal.

## Estados

- Letra normal: superficie clara y sombra suave.
- Letra deshabilitada por pista: contraste reducido y borde visible.
- Borrar: turquesa, icono de retroceso y pulsación larga.
- Limpiar: coral, icono de papelera y respuesta háptica media.
- Reducir movimiento: cambio de escala inmediato, sin rebote.

## Validación

Se comprobarán 320×568, 360×800, 390×844, 768×1024 y 1024×768. Las pruebas cubrirán ajuste de filas, anchura de teclas especiales, variantes de etiquetas y las regresiones ya corregidas de pista y borrado.
