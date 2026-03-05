# Colecciones Redesign — Design Doc
**Fecha:** 2026-03-05
**Estado:** Aprobado

---

## Objetivo

1. Dividir "Modismos" (110 palabras, categoría más grande) en 4 subcategorías temáticas.
2. Revisar y expandir categorías de Cultura Digital (Streamers, Músicos).
3. Reemplazar círculos de emoji por iconos cuadrados ilustrados con IA por categoría.
4. Mantener diseño visual estilo Mexicanómetro: paleta warm wheat/amber/brown, tarjetas con barra de progreso.

---

## Paleta de diseño (Mexicanómetro style)

```
BROWN  = '#8B4513'
ORANGE = '#FF6B35'
AMBER  = '#D2691E'
GOLD   = '#F8BE17'
WHEAT  = '#FFE4B5'
WHEAT2 = '#F5DEB3'
```

Tarjetas: fondo `#FFE4B5`, borde `rgba(139,69,19,0.35)`, borderRadius 22.
Barra de progreso horizontal amber en la parte inferior de cada tarjeta (mismo estilo que fill bar del Mexicanómetro).

---

## Reclasificación de Modismos

Nueva mutation `convex/patchModismos.ts` — lee todas las palabras con `category = "Modismos"` y aplica el mapping por palabra.

| Categoría nueva | Emoji | Descripción | Aprox. palabras |
|---|---|---|---|
| Expresiones | 🗣️ | Interjecciones, afirmaciones, saludos: Órale, Sale, Simón, Nel, Ándale, Chido, Güey, Neta, Cuate | ~35 |
| Picaresca | 🌶️ | Vocabulario picante/albures suaves: Chingón, Desmadre, Pistear, Peda, Mala leche, Huevón, A huevo | ~30 |
| Tipos Sociales | 🎭 | Arquetipos: Fresa, Naco, Gandalla, Morro, Morra, Godín, Mirrey, Cholo | ~25 |
| Verbos del Barrio | 🏙️ | Verbos coloquiales: Cotorrear, Apapachar, Chambear, Jalar, Rolar, Madrear | ~20 |

**Regla de clasificación:**
- Región "Juvenil" + es una interjección/expresión corta → **Expresiones**
- Contiene palabras explícitas o doble sentido → **Picaresca**
- Describe un tipo de persona (sustantivo social) → **Tipos Sociales**
- Es un verbo coloquial de acción → **Verbos del Barrio**
- Default si no aplica → **Expresiones**

---

## Expansión Cultura Digital

Nuevo seed `convex/seedCulturaDigitalV2.ts`:

### Streamers (agregar ~12)
- Rubius (El Rubius), Auronplay, TheGrefg, Rivers, Spreen, Ari Gameplays (ya tiene), Quackity, Lilypichu MX, Silithur, Kenai, xQc (en MX), Ibai Llanos

### Músicos (agregar ~13)
- Carín León, Grupo Frontera, Bad Bunny (en MX), Xavi, Grupo Sombra, Lenin Ramírez, Los Dos Carnales, Edén Muñoz, Calibre 50, Banda MS, Lupillo Rivera, Christian Nodal, Yahritza y Su Esencia

---

## Imágenes AI por categoría

Directorio: `assets/images/collections/`
Formato: PNG 512×512, fondo transparente, estilo **ilustración mexicana flat art / papel amate**.

| Archivo | Categoría | Prompt |
|---|---|---|
| `expresiones.png` | Expresiones | Boca mexicana con bocadillo de diálogo colorido, motivos otomí, fondo transparente, flat art |
| `picaresca.png` | Picaresca | Chile jalapeño con sombrero charro y cara traviesa, Día de Muertos palette, flat art |
| `tipos_sociales.png` | Tipos Sociales | 4 siluetas de arquetipos mexicanos (fresa, naco, godín, morro), papel picado style |
| `verbos_barrio.png` | Verbos del Barrio | Calle de barrio mexicano colorida con grafiti y talavera, flat art |
| `comida.png` | Comida | Tacos al pastor con salsa verde, tomate, cebolla, ilustración vibrante flat |
| `bebida.png` | Bebida | Copa de mezcal con maguey azul, gotas, warm palette |
| `animales.png` | Animales | Ajolote y águila real mexicana, colores vibrantes, flat art |
| `historia.png` | Historia | Pirámide azteca con sol de piedra y serpiente emplumada |
| `musica.png` | Música | Guitarrón con sombrero y notas musicales, festivo |
| `juegos.png` | Juegos | Pirinola + carta de lotería "El Catrín", colores talavera |
| `tradiciones.png` | Tradiciones | Ofrenda Día de Muertos con flores de cempasúchil |
| `plantas.png` | Plantas | Agave azul + flor de nochebuena + cacao |
| `monumentos.png` | Monumentos | Ángel de la Independencia CDMX con cielo vibrante |
| `artistas.png` | Artistas | Paleta de pintor estilo mural Diego Rivera + Frida Kahlo |
| `streamers.png` | Streamers | Pantalla de streaming con chat en vivo, colores neón + bandera MX |
| `musicos_digital.png` | Músicos | Guitarra eléctrica estilo corrido tumbado, luces neón |
| `futbolistas.png` | Futbolistas | Balón de fútbol + playera verde selección mexicana + gol |
| `jerga_digital.png` | Jerga Digital | Teléfono con memes, emojis y TikTok vibes |
| `regionalismos.png` | Regionalismos | Mapa de México con colores por región |
| `leyendas.png` | Leyendas | La Llorona en laguna nocturna, estilo papel amate |

---

## Cambios de código

### `convex/patchModismos.ts` (nuevo)
Mutation que itera todas las palabras con `category === "Modismos"` y aplica el mapping de reclasificación. Idempotente.

### `convex/seedCulturaDigitalV2.ts` (nuevo)
Seed de ~25 palabras adicionales para Streamers y Músicos.

### `convex/collectionsQuery.ts` (modificar)
Agregar al mapa `categoryIcon()` las 4 nuevas categorías:
```ts
"Expresiones":     "🗣️",
"Picaresca":       "🌶️",
"Tipos Sociales":  "🎭",
"Verbos del Barrio": "🏙️",
```

### `src/screens/ColeccionScreen.tsx` (modificar)
- Agregar `CATEGORY_IMAGE_MAP: Record<string, any>` con `require()` de cada PNG
- Actualizar `CollectionCard`:
  - Reemplazar círculo de emoji por `<Image source={img} style={s.cardImage} />` (64×64 rounded)
  - Agregar barra de progreso horizontal amber debajo del nombre (estilo Mexicanómetro fill bar)
  - Mantener paleta warm wheat/amber/brown

### Card layout nuevo (Mexicanómetro style):
```
┌─────────────────────┐
│  [imagen AI 64×64]  │  ← rounded square, no circle
│                     │
│  Expresiones        │  ← FONTS.bodyBold, BROWN
│  ████████░░  28/35  │  ← barra amber + texto
└─────────────────────┘
```

---

## Orden de implementación

1. Generar 20 imágenes con IA → guardar en `assets/images/collections/`
2. Crear `convex/patchModismos.ts`
3. Crear `convex/seedCulturaDigitalV2.ts`
4. Actualizar `convex/collectionsQuery.ts` (nuevos iconos)
5. Actualizar `src/screens/ColeccionScreen.tsx` (UI Mexicanómetro style)
6. Ejecutar desde Convex dashboard: `patchModismos`, `seedCulturaDigitalV2`
7. Probar en dev build
