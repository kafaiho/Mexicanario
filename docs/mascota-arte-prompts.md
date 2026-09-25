# Arte de la mascota: prompts y cómo agregarlo

Guía para generar el arte nuevo de las mascotas (evoluciones, ánimos y Nahual)
con ChatGPT (imágenes), Gemini, Midjourney o similar, y cómo meterlo en la app.

## Qué falta hoy

| Qué | Estado |
|---|---|
| Ajolote etapas 1, 2, 3, 5 | Bien, pero pequeñas (~200 px) |
| Ajolote etapas 4 y 6 | **Repiten** la imagen de la etapa 3 y la 5 |
| Alebrije 1–6 | Bien, pero pequeñas |
| Xolo 1–5 | Bien, pero pequeñas |
| Xolo 6 | Estilo **realista**, no cuadra con el resto (tierno/caricatura) |
| Ánimos (feliz, hambre, triste, sueño) | **No existen**. Los `N_happy_body.png`, `N_sad_body.png`, etc. son el personaje de ayuda repetido y no se usan |
| Nahual norte, sur y urbano | **No existen** (usan arte de otras mascotas) |

## Reglas para todas las imágenes

- **1024 × 1024 px, PNG con fondo transparente.** Si la herramienta no da fondo
  transparente, pide fondo blanco liso y quítalo después (remove.bg, Photoshop, Canva).
- **Mascota centrada, de cuerpo completo**, con ~10 % de margen alrededor.
  No la cortes en los bordes.
- **Misma vista en todas:** 3/4 de frente, mirando ligeramente a la izquierda.
- **Genera primero la versión "normal"** de cada etapa y úsala como imagen de
  referencia para sus variantes de ánimo, para que se vea igual.
- Escribe los prompts en inglés; las herramientas de imagen lo entienden mejor.

### Bloque de estilo (pégalo al final de TODOS los prompts)

```
Style: cute collectible mobile-game mascot, soft 3D painted illustration,
big glossy expressive eyes, rounded chibi proportions, vibrant Mexican folk-art
colors (magenta, turquoise, marigold orange, lime green), subtle Otomí and
alebrije patterns, soft rim light, clean silhouette, full body, centered,
3/4 view facing slightly left, transparent background, no text, no border,
no shadow on the ground, 1024x1024.
```

## Evoluciones

Las 6 etapas: 1 Huevo místico → 2 Eclosionando → 3 Cachorro → 4 Juvenil →
5 Adulto con alas → 6 Mítico. Cada etapa debe verse **claramente más grande y
más elaborada** que la anterior (más patrones, más brillo, accesorios).

### Ajolote (`assets/mascota/ajolote/`)

1. `A decorated pink axolotl egg with pastel iridescent shell and tiny Otomí flower patterns, glowing softly.`
2. `A baby pink axolotl peeking out of a cracked pastel iridescent egg, shell pieces around, curious happy face.`
3. `A small chubby pink axolotl pup with fluffy frilly gills, tiny legs, happy smile.`
4. **(nueva)** `A juvenile pink axolotl, longer body, bigger magenta gills with turquoise tips, faint Otomí flower markings on its back.`
5. `An adult pink axolotl with small translucent fin-wings, glowing magenta gills, flower markings along its body.`
6. **(nueva)** `A mythical axolotl deity inspired by Xolotl, large luminous fin-wings, golden Aztec jewelry on its gills, floating water droplets and marigold petals around it, radiant aura.`

### Alebrije (`assets/mascota/alebrije/`)

El arte actual ya se ve bien. Solo regenéralo en 1024 px usando cada imagen
actual como referencia: `Same character as the reference image, higher resolution, keep design identical.`

### Xolo (`assets/mascota/xolo/`)

Etapas 1–5: regenéralas en 1024 px con la imagen actual como referencia.
Etapa 6 **(rehacer para que sea tierna)**:

6. `A mythical xoloitzcuintli dog, same cute style as a chibi pup but adult and proud, dark grey hairless skin with glowing turquoise Aztec patterns, golden collar with jade, a small floating Aztec sun medallion, soft fire-like spirit aura.`

## Ánimos

Para cada etapa, genera 4 variantes **usando la imagen normal como referencia**.
Empieza cada prompt con:
`Same character as the reference image, same pose and colors, only change the expression:`

| Ánimo | Archivo | Prompt |
|---|---|---|
| Feliz de la vida | `stageN_joyful.png` | `eyes closed in a big happy smile, rosy cheeks, small sparkles around, bouncing pose.` |
| Hambre | `stageN_hungry.png` | `hungry face, looking up hopefully, drooling slightly, holding its tummy, a tiny taco thought bubble.` |
| Triste / te extraña | `stageN_sad.png` | `sad lonely face, teary eyes, drooping ears/gills, slightly hunched.` |
| Sueño | `stageN_sleepy.png` | `sleepy, half-closed eyes, yawning, curled up a bit, small "Zzz".` |

Para la etapa 1 (huevo), el ánimo se ve en el huevo: grietas con carita, huevo
tambaleándose, etc. Puedes saltarte los ánimos del huevo; la app usa la imagen
normal si falta alguna.

## Nahual (Mexicanario Plus)

Carpetas: `assets/mascota/nahual/norte/`, `.../sur/`, `.../urbano/`,
archivos `stage1.png` … `stage6.png`. Etapa 1 = huevo/espíritu, 6 = forma legendaria.

- **Nahual del Norte:** `A mystical nahual spirit animal, part coyote part jaguar, desert colors (terracotta, sand, sunset orange), Rarámuri patterns, small sombrero-like crest, cactus flowers.`
- **Nahual del Sur:** `A mystical nahual spirit animal, part jaguar part quetzal, jungle colors (emerald, jade, gold), Maya glyph markings, quetzal tail feathers.`
- **Nahual Urbano:** `A mystical nahual spirit animal, part alebrije part street dog, neon graffiti colors (electric purple, cyan, hot pink), lucha libre mask patterns, CDMX metro-inspired details.`

Para cada una, agrega al final la etapa: `stage 1: glowing spirit egg`,
`stage 2: hatching`, `stage 3: pup`, `stage 4: juvenile`,
`stage 5: adult with spirit wings`, `stage 6: legendary form with radiant aura`.

## Cómo meterlo en la app

1. Guarda los PNG con los nombres de arriba en su carpeta.
2. En `src/components/PetCompanion/petAssets.js`:
   - **Evoluciones:** cambia el `require(...)` de la etapa (por ejemplo,
     `4: { body: AJO_S3 }` → `4: { body: require('.../ajolote/stage4.png') }`).
   - **Ánimos:** agrega `moods: { joyful, hungry, sad, sleepy }` a la etapa.
     El ejemplo está en el comentario de arriba de `PET_ASSETS`.
   - **Nahual:** reemplaza las entradas `nahual_norte`, `nahual_sur` y `nahual_urbano`.
3. Reinicia Metro (`npx expo start --clear`).

React Native necesita un `require()` fijo por imagen, así que el paso 2 es
obligatorio: la app no detecta archivos nuevos sola. Si falta el arte de algún
ánimo, se usa la imagen normal de la etapa.
