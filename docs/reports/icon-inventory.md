# Inventario de iconografía cultural

**Alcance:** 10 caminos, 19 colecciones y 20 lugares de la taxonomía `México vivido`.
**Implementación final:** un atlas transparente, `assets/images/cultural/collections-atlas.png` (1254×1254, cuadrícula 5×4), aporta 19 celdas distintas y cubre 29 asociaciones canónicas: las 19 colecciones más 10 reutilizaciones semánticas deliberadas para los caminos. Las generaciones de caminos descartadas no se conservan en el repositorio.
**Render actual:** `ColeccionScreen` muestra el atlas en tarjetas canónicas y cabeceras de modal. `MapScreen` muestra el atlas únicamente para caminos culturales v2; el banner neutral heredado conserva emoji. Los lugares siguen usando emoji porque no tienen ni necesitan bitmaps.

## Criterio de decisión

- **reuse:** el objeto principal comunica directamente la colección nueva y la imagen no contiene texto/marca problemática.
- **generate:** falta el concepto o el recurso existente es parcial, genérico, equívoco o contiene texto/marca.
- **emoji-only:** la superficie actual no renderiza bitmap. Se conserva un emoji canónico y no se genera una imagen que la app no utilizará.
- Los atlas finales son PNG RGBA transparentes, sin texto ni marcas, y sus sujetos conservan lectura clara a tamaño de tarjeta.

## Caminos (10)

Cada camino reutiliza una celda única y semánticamente equivalente del atlas limpio. La columna/fila se resuelve mediante mapping estático y el emoji sigue siendo fallback.

| ID / celda final | Emoji | Match inicial | Decisión inicial | Sujeto usado para generar el atlas |
|---|---:|---|---|---|
| `patio-recreo` → `juegos-ninez` r0c0 | 🪀 | exacto | reuse | juegos tradicionales de recreo |
| `casa-abuela` → `dichos-casa` r0c3 | 🏡 | directo | reuse | memoria oral y dichos familiares |
| `calle-barrio` → `vida-barrio` r1c0 | ⚽ | exacto | reuse | vida cotidiana del barrio |
| `mercado-antojitos` → `cocina-bebidas` r0c2 | 🌮 | directo | reuse | cocina, bebidas y mercado |
| `feria-verbena` → `fiestas-tradiciones` r1c3 | 🎡 | exacto | reuse | fiesta popular y tradición |
| `musica-une` → `musica-mexicana` r1c2 | 🎺 | exacto | reuse | música mexicana diversa |
| `mexico-regional` → `regiones-hablas` r2c2 | 🗺️ | exacto | reuse | regiones y voces locales |
| `oficios-artesanias` → `oficios-artesanias` r2c1 | 🧶 | exacto | reuse | manos, oficio y artesanía |
| `historias-leyendas` → `leyendas-relatos` r3c0 | 🕯️ | exacto | reuse | relatos y atmósfera legendaria |
| `mexico-profundo` → `pueblos-originarios-lenguas` r2c0 | 🌽 | directo | reuse | lenguas, raíces y saberes |

## Colecciones (19)

| ID / celda final | Asset legacy evaluado | Match inicial | Decisión inicial | Nota o sujeto usado |
|---|---|---:|---|---|
| `juegos-ninez.webp` | `juegos.webp` | sí | reuse | trompo y carta de lotería; buena lectura pequeña, aunque sin alpha |
| `dulces-antojitos.webp` | ninguno | no | generate | mazapán sin marca, palanqueta, cocada y alegría en canastita |
| `cocina-bebidas.webp` | `comida.webp` / `bebida.webp` | parcial | generate | comal, molinillo, jarrito y agua fresca; no limitarse a tacos |
| `dichos-casa.webp` | `refranes.webp` | sí | reuse | libro de refranes; contiene pseudo-texto ilegible, regeneración posterior recomendable |
| `escuela-mexicana.webp` | ninguno | no | generate | cuaderno, lápiz, sacapuntas y lonchera escolar sin marcas ni bandera |
| `vida-barrio.webp` | `vida_cotidiana.webp` | no | generate | puesto de tianguis, banqueta y balón; la casa genérica actual no expresa barrio |
| `tele-cultura-popular.webp` | `cultura_popular.webp` | sí | reuse | confirmar en QA final ausencia de personajes/marcas reconocibles |
| `musica-mexicana.webp` | `musica.webp` | sí | reuse | instrumento mexicano; comprobar que no reduzca todo a mariachi |
| `fiestas-tradiciones.webp` | `tradiciones.webp` | sí | reuse | papel picado/celebración; apropiado como categoría amplia |
| `naturaleza-mexico.webp` | `animales.webp` + `plantas.webp` | parcial | generate | mariposa monarca, ajolote, nopal y ceiba en una sola composición |
| `pueblos-originarios-lenguas.webp` | ninguno | no | generate | códice abierto, glifos abstractos y burbujas de voz; sin tocados ni caricaturas humanas |
| `oficios-artesanias.webp` | `artesanias.webp` | no | generate | manos de artesano con barro negro y telar; el asset actual es una paleta genérica |
| `regiones-hablas.webp` | `regionalismos.webp` | sí | reuse | usar solo si la revisión final confirma diversidad regional sin clichés |
| `historia-personajes.webp` | `historia.webp` | sí | reuse | pirámide/códice; ampliar épocas en regeneración futura |
| `lugares-mexico.webp` | `monumentos.webp` | sí | reuse | Ángel de la Independencia; semántico, aunque sesgado a CDMX |
| `leyendas-relatos.webp` | `leyendas.webp` | sí | reuse | relato/atmósfera legendaria; revisar ausencia de estereotipo único |
| `ciencia-inventos-deporte.webp` | `deportes.webp` | parcial | generate | microscopio, pelota de hule y engrane/invento; balancear los tres temas |
| `mexico-digital.webp` | `mundo_digital.webp` | no | generate | teléfono con chat y señal; el existente muestra la marca TikTok y texto |
| `albures-picaresca.webp` | `picaresca.webp` | sí | reuse | metáfora visual familiar, sin contenido explícito ni texto |

**Resolución final:** las 19 ilustraciones quedaron reunidas, en el orden de la taxonomía, dentro de `collections-atlas.png`; la celda 20 permanece vacía. Los recursos legacy se conservan sin sobrescribirse, pero ya no determinan la presentación canónica.

## Lugares (20)

La pestaña Lugares no tiene mapping de bitmap y hoy cae correctamente al emoji. Generar 20 imágenes ahora no tendría efecto visible. Acción: **emoji-only** para esta entrega; crear bitmaps solo si se añade un mapping estático y la tarjeta realmente los renderiza.

| ID | Emoji canónico | Acción | Si en el futuro se genera, sujeto prioritario |
|---|---:|---|---|
| `todo-mexico` | 🦅 | emoji-only | águila real en vuelo, sin bandera |
| `cdmx` | 🚇 | emoji-only | letrero geométrico de Metro + silueta urbana, sin logotipos |
| `guadalajara` | 🏛️ | emoji-only | kiosco/arquitectura tapatía, no mariachi duplicado |
| `jalisco` | 🎺 | emoji-only | agave y trompeta como composición estatal |
| `monterrey` | 🏔️ | emoji-only | Cerro de la Silla |
| `nuevo-leon` | ⛰️ | emoji-only | relieve serrano y silla de montar, distinto de la ciudad |
| `veracruz` | 🎺 | emoji-only | jarana jarocha |
| `oaxaca` | 🍫 | emoji-only | barro negro |
| `puebla` | 🏺 | emoji-only | azulejo de talavera |
| `michoacan` | 🦋 | emoji-only | mariposa monarca |
| `guerrero` | 🎭 | emoji-only | máscara de tigre artesanal |
| `chiapas` | 🦜 | emoji-only | textil chiapaneco y guacamaya, sin figura humana caricaturizada |
| `yucatan` | 🌺 | emoji-only | henequén y arco maya |
| `campeche` | 🏰 | emoji-only | baluarte amurallado |
| `quintana-roo` | 🐠 | emoji-only | arrecife y pez tropical |
| `tabasco` | 🍫 | emoji-only | cacao y ceiba |
| `sinaloa` | 🥁 | emoji-only | tambora y costa |
| `nayarit` | 🌊 | emoji-only | costa y chaquira wixárika abstracta, con atribución respetuosa |
| `huasteca` | 🎻 | emoji-only | violín huasteco y río, región multiestatal |
| `unclassified` | 📍 | emoji-only | pin neutro; nunca debe tener asset cultural distintivo |

Si la UI empieza a renderizar imágenes de lugar, la primera prioridad es: CDMX, Guadalajara, Jalisco, Monterrey, Nuevo León, Veracruz, Oaxaca, Puebla, Michoacán, Guerrero, Chiapas, Yucatán, Campeche, Quintana Roo, Tabasco, Nayarit y Huasteca. `todo-mexico` puede seguir con emoji y `unclassified` debe permanecer neutro.

## Cobertura y TDD recomendado

React Native/Metro necesita llamadas `require("../../assets/...")` literales; no se construyen rutas dinámicamente. `culturalAssets.js` exporta mappings explícitos por ID (`CULTURAL_PATH_ASSETS`, `COLLECTION_ASSETS`) y `getCulturalAsset(kind, id)`.

La prueba automatizada creada verifica:

1. importar `CULTURAL_PATHS`, `COLLECTIONS`, `PLACES` y el futuro módulo `culturalAssets`;
2. comprobar que cada camino publicado tiene emoji y clave propia en `CULTURAL_PATH_ASSETS`;
3. comprobar que cada colección publicada tiene emoji y clave propia en `COLLECTION_ASSETS`;
4. comprobar que un ID desconocido retorna `null` para bitmap y un emoji neutro;
5. comprobar que cada clave del mapping corresponde a un ID canónico (sin sobrantes legacy).

El ciclo TDD se observó RED por ausencia de `culturalAssets.js` y GREEN después del mapping. Node valida claves y geometría sin intentar decodificar PNG; `expo export` verifica la resolución real de los `require()` literales.

## Entrega final de bitmaps

- **1 archivo físico transparente:** el atlas limpio de colecciones.
- **19 celdas visuales distintas y 29 asociaciones:** 19 colecciones + 10 caminos con reutilización semántica única.
- **0 bitmaps de lugar:** los 20 lugares conservan emojis canónicos.
- **Estilo aplicado:** ilustración popular mexicana cálida y táctil, composición legible en miniatura, objetos culturales concretos, sin texto, marcas, banderas decorativas ni sombrero/taco como símbolo universal.

## Evidencia responsive

`CulturalAtlasIcon` interpreta `size` como alto. Tanto caminos como colecciones usan celdas 0.8:1: a 58 px un camino mide `58 × 0.8 = 46.4 px`; una colección de 64 px mide `64 × 0.8 = 51.2 px`. El atlas completo se escala a `size × 4` de alto y conserva aspecto 1:1, por lo que el recorte no deforma la imagen.

`docs/reports/cultural-icons-preview.html` reproduce la misma geometría y posiciones CSS en marcos de 320 y 390 px. Es una previsualización aislada, no una captura de la app Expo.
