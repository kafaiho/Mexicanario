# Rediseño cultural «México vivido»

**Fecha:** 2026-08-17  
**Proyecto:** Mexicanario  
**Estado:** Aprobado

## Objetivo

Hacer que Mexicanario se sienta reconocido por mexicanos de distintas edades y regiones. La experiencia combinará memoria infantil, vida cotidiana, identidad local y patrimonio, sin reducir al país a símbolos turísticos ni presentar regionalismos como si fueran universales.

## Principios editoriales

1. **México vivido antes que México de postal.** Dar prioridad a recuerdos, objetos, sonidos, sabores y expresiones de la vida diaria.
2. **Nostalgia intergeneracional.** Representar la infancia de los años ochenta, noventa, dos mil y la actualidad sin depender de marcas comerciales.
3. **Identidad regional precisa.** Cada palabra tendrá una procedencia verificable. Una voz local no se etiquetará como nacional.
4. **Diversidad sin caricatura.** Evitar que una ciudad o estado quede representado por un único cliché.
5. **Aprender jugando.** La dificultad crecerá desde lo familiar y concreto hacia lo regional, histórico, lingüístico y simbólico.
6. **Lenguas originarias con contexto.** Los préstamos y voces indígenas indicarán su lengua y uso, evitando tratarlos como curiosidades exóticas.
7. **Contenido familiar por defecto.** Albures y picaresca tendrán clasificación y desbloqueo apropiados, sin contaminar los primeros niveles.

## Arquitectura del recorrido

El mapa dejará de ser una sucesión arbitraria de ciudades y se convertirá en un viaje cultural progresivo:

1. **Patio y Recreo** — trompo, balero, canicas, resorte, escondidas, rondas y juegos escolares.
2. **Casa de la Abuela** — sobremesa, remedios, cocina, dichos familiares y objetos del hogar.
3. **Calle y Barrio** — pregones, tianguis, transporte, oficios, convivencia y expresiones cotidianas.
4. **Mercado y Antojitos** — ingredientes, utensilios, dulces, panes, bebidas y cocinas regionales.
5. **Feria y Verbena** — lotería, juegos mecánicos, papel picado, posadas, fiestas patronales y celebraciones.
6. **Música que nos Une** — sones, bolero, norteño, banda, mariachi, cumbia, rock y escenas contemporáneas.
7. **México Regional** — hablas, costumbres, paisajes y sabores vinculados correctamente a sus estados.
8. **Oficios y Artesanías** — barro, textiles, laudería, cobre, talavera, palma, madera y técnicas locales.
9. **Historias y Leyendas** — relatos populares, personajes, sitios históricos y memoria comunitaria.
10. **México Profundo** — pueblos originarios, biodiversidad, historia compleja y patrimonio material e inmaterial.

El número final de niveles dependerá del inventario cultural. Se podrán agregar, fusionar o retirar niveles para que cada camino tenga una progresión coherente y suficiente variedad.

## Colecciones

Las colecciones canónicas serán:

- Juegos de la Niñez
- Dulces y Antojitos
- Cocina y Bebidas
- Dichos de Casa
- Escuela Mexicana
- Vida de Barrio
- Tele y Cultura Popular
- Música Mexicana
- Fiestas y Tradiciones
- Naturaleza de México
- Pueblos Originarios y Lenguas
- Oficios y Artesanías
- Regiones y Hablas
- Historia y Personajes
- Lugares de México
- Leyendas y Relatos
- Ciencia, Inventos y Deporte
- México Digital
- Albures y Picaresca

Las categorías existentes se migrarán mediante equivalencias explícitas. La migración será idempotente y conservará el progreso por identificador de palabra siempre que el contenido permanezca.

## Modelo regional

La interfaz distinguirá **ciudad**, **estado**, **región cultural** y **alcance nacional**. No se usarán macrogrupos que borren diferencias importantes.

- CDMX tendrá identidad chilanga y metropolitana.
- Guadalajara se distinguirá de Jalisco y de Occidente cuando el contenido lo requiera.
- Monterrey se distinguirá de Nuevo León y del norte en general.
- Veracruz, Oaxaca, Puebla, Michoacán, Guerrero, Chiapas y los estados de la península conservarán identidad propia.
- La Huasteca se modelará como región cultural multiestatal, no como parte de Guerrero.
- Nayarit no se agrupará automáticamente con Guerrero.
- Yucatán, Campeche, Quintana Roo y Tabasco no aparecerán todos bajo el gentilicio «yucateco».
- Las palabras de uso amplio podrán pertenecer a «Todo México» con notas regionales cuando existan variantes.

La primera entrega priorizará ciudades y estados con suficiente contenido verificado; los grupos vacíos no aparecerán como relleno.

## Auditoría de palabras

Cada entrada se revisará con estos campos:

- grafía y acentuación;
- significado claro y contemporáneo;
- ejemplo natural en español de México;
- colección y camino;
- ciudad, estado, región cultural o alcance nacional;
- dificultad por familiaridad, longitud y contexto requerido;
- generación o época cuando sea relevante;
- sensibilidad, vigencia y clasificación familiar;
- icono u objeto visual relacionado.

Se eliminarán duplicados, definiciones circulares, atribuciones regionales dudosas, ejemplos artificiales y nombres propios sin valor cultural duradero. Las palabras con valor pero datos deficientes se corregirán antes de descartarse.

## Sistema visual e iconografía

Cada icono deberá representar el contenido de forma inmediata y evitar sustitutos genéricos. Ejemplos guía:

- trompo o balero para niñez;
- molinillo, comal o metate para cocina;
- jarrito o vaso de agua fresca para bebidas;
- papel picado para fiestas;
- bocina de pregonero o puesto para barrio;
- jarana para Veracruz;
- talavera para Puebla;
- mariposa monarca para Michoacán;
- barro negro para Oaxaca;
- silla de montar o cerro de la Silla para Nuevo León, según contexto;
- henequén o arco maya para Yucatán;
- sarape o fósil del desierto para Coahuila.

Los emojis existentes podrán funcionar como respaldo, pero los iconos principales compartirán un lenguaje visual inspirado en gráfica popular mexicana, papel amate, rótulos y color regional. No se usará el sombrero como símbolo universal de todo el norte ni el taco como símbolo de cualquier ciudad.

## Componentes y flujo de datos

- Una configuración cultural compartida será la fuente única para caminos, colecciones, regiones, nombres, colores e iconos.
- El servidor normalizará categorías y regiones antes de agrupar palabras.
- El mapa consumirá caminos culturales y sus límites de nivel.
- Colecciones y vistas regionales consumirán la misma taxonomía para evitar discrepancias.
- Las migraciones corregirán datos existentes sin crear duplicados y emitirán un resumen de cambios.
- Las palabras retiradas conservarán una estrategia explícita para no romper niveles ni progreso.

## Manejo de inconsistencias

- Una región desconocida irá a una cola de revisión, no silenciosamente a «Nacional».
- Una categoría desconocida aparecerá como pendiente de clasificación durante desarrollo.
- Los caminos sin palabras suficientes no se publicarán.
- Los iconos ausentes usarán un respaldo neutro y quedarán señalados por una prueba de cobertura.

## Validación

1. Pruebas de taxonomía: cada palabra debe resolver a una colección, un camino y una región válidos.
2. Pruebas de migración: ejecución repetida sin duplicados ni pérdida de progreso.
3. Pruebas de orden: dificultad creciente y ausencia de contenido adulto en los primeros niveles.
4. Pruebas de cobertura: ningún camino o colección publicado puede quedar vacío o sin icono.
5. Pruebas de interfaz: navegación, bloqueos, progreso, detalles de palabra y mapa.
6. Revisión visual en tamaños de pantalla representativos.
7. Informe editorial con palabras agregadas, corregidas, movidas y eliminadas.

## Criterios de aceptación

- Los nombres de caminos describen el contenido que contienen.
- Las colecciones son reconocibles y no se solapan de forma confusa.
- Las atribuciones regionales evitan las agrupaciones erróneas detectadas.
- Los primeros niveles despiertan reconocimiento y nostalgia sin depender de una sola generación.
- Cada icono guarda relación directa con su ciudad, región, camino o colección.
- El progreso existente permanece válido después de las migraciones.
- Las pruebas de contenido y aplicación pasan antes de considerar terminado el rediseño.

