# Colecciones Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Dividir Modismos en 4 sub-categorías, expandir Cultura Digital, y rediseñar ColeccionScreen con iconos AI estilo Mexicanómetro.

**Architecture:** (1) Mutation de Convex reclasifica 110 palabras de Modismos. (2) Nuevo seed agrega ~25 entradas a Streamers/Músicos. (3) Imágenes AI generadas por `ai-image-generation` skill se guardan como PNGs estáticos en assets. (4) ColeccionScreen usa `CATEGORY_IMAGE_MAP` con `require()` y rediseña tarjetas con barra de progreso horizontal amber.

**Tech Stack:** Convex mutations, React Native (Animated, Image), TypeScript, PNG assets estáticos.

---

## Task 1: Generar imágenes AI para las 20 categorías

**Files:**
- Create: `assets/images/collections/expresiones.png`
- Create: `assets/images/collections/picaresca.png`
- Create: `assets/images/collections/tipos_sociales.png`
- Create: `assets/images/collections/verbos_barrio.png`
- Create: `assets/images/collections/comida.png`
- Create: `assets/images/collections/bebida.png`
- Create: `assets/images/collections/animales.png`
- Create: `assets/images/collections/historia.png`
- Create: `assets/images/collections/musica.png`
- Create: `assets/images/collections/juegos.png`
- Create: `assets/images/collections/tradiciones.png`
- Create: `assets/images/collections/plantas.png`
- Create: `assets/images/collections/monumentos.png`
- Create: `assets/images/collections/artistas.png`
- Create: `assets/images/collections/streamers.png`
- Create: `assets/images/collections/musicos_digital.png`
- Create: `assets/images/collections/futbolistas.png`
- Create: `assets/images/collections/jerga_digital.png`
- Create: `assets/images/collections/regionalismos.png`
- Create: `assets/images/collections/leyendas.png`

**Step 1: Crear directorio**

```bash
mkdir -p assets/images/collections
```

**Step 2: Generar cada imagen con ai-image-generation skill**

Usar el skill `ai-image-generation` con estos prompts. Estilo consistente:
`"mexican flat art illustration, papel amate style, vibrant warm colors, transparent background, 512x512, no text"`

| Archivo | Prompt adicional |
|---|---|
| `expresiones.png` | Mexican mouth with colorful speech bubble, otomi motifs |
| `picaresca.png` | Mischievous jalapeño pepper with charro hat winking, Day of Dead palette |
| `tipos_sociales.png` | Four Mexican social archetypes silhouettes: fresa, naco, godin, morro, papel picado style |
| `verbos_barrio.png` | Colorful Mexican barrio street with graffiti, talavera tiles |
| `comida.png` | Tacos al pastor with salsa verde, lime, onion, vibrant illustration |
| `bebida.png` | Mezcal glass with blue agave plant |
| `animales.png` | Axolotl and Mexican golden eagle together, bright colors |
| `historia.png` | Aztec pyramid with sun stone and feathered serpent |
| `musica.png` | Guitarrón with charro hat and musical notes, festive |
| `juegos.png` | Pirinola top and lotería card "El Catrín", talavera colors |
| `tradiciones.png` | Día de Muertos altar with cempasúchil flowers |
| `plantas.png` | Blue agave + nochebuena flower + cacao pod |
| `monumentos.png` | Angel of Independence Mexico City with vibrant sky |
| `artistas.png` | Painter palette with murals Diego Rivera Frida Kahlo style |
| `streamers.png` | Live streaming screen with chat, neon colors Mexican flag |
| `musicos_digital.png` | Electric guitar corrido tumbado style neon lights |
| `futbolistas.png` | Soccer ball with Mexican green jersey and goal net |
| `jerga_digital.png` | Phone with memes emojis TikTok vibes Mexican style |
| `regionalismos.png` | Map of Mexico with colorful regional patterns |
| `leyendas.png` | La Llorona in nocturnal lagoon, papel amate style |

**Step 3: Commit assets**

```bash
git add assets/images/collections/
git commit -m "feat(collections): add AI-generated category icons"
```

---

## Task 2: Crear `convex/patchModismos.ts`

**Files:**
- Create: `convex/patchModismos.ts`

**Step 1: Crear la mutation con el mapping completo**

```typescript
// convex/patchModismos.ts
import { mutation } from "./_generated/server";

// ── Palabras → nueva categoría ──────────────────────────────────────────────
// Normalización: UPPERCASE sin acentos para comparación robusta
function norm(s: string) {
  return s.toUpperCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const PICARESCA = new Set([
  "CHINGON", "CHINGONA", "DESMADRE", "PISTEAR", "PEDA",
  "NO TENER MADRE", "ESTAR DE MALA LECHE", "HUEVON",
  "ECHAR LA HUEVA", "A HUEVO", "DARLE AL HIGADO",
  "ESTAR CUETE", "MAICEAR", "CABULA", "PELOS DE GATO",
  "ESTAR EN CHINO", "ESTAR HASTA EL TOPE",
].map(norm));

const TIPOS_SOCIALES = new Set([
  "FRESA", "NACO", "GANDALLA", "MORRO", "MORRA",
  "ANDAR DE LAMBISCON", "CHAFA", "SER UN COYOTE",
].map(norm));

const VERBOS_BARRIO = new Set([
  "COTORREAR", "APAPACHAR", "CHANTEAR", "JALE", "CHAMBA",
  "DAR EL ROL", "AVENTAR EL ROLLO", "ARMAR EL MITOTE",
  "IR DE PINTA", "QUEDARSE CON EL OJO CUADRADO",
  "QUEDARSE PLANTADO", "SACAR EL COBRE", "SACAR DE QUICIO",
  "TOMAR EL PELO", "TRAER ENTRE OJOS", "PONERSE TRUCHA",
  "TIRARSE A LA BARTOLA", "HACER EL OSO", "HACER SU AGOSTO",
  "HACER DE TRIPAS CORAZON", "DAR EL GATAZO",
  "DAR ATOLE CON EL DEDO", "DAR LATA", "DAR EN EL CLAVO",
  "DAR EN LA TORRE", "METER EL PIE", "LLEVAR EL GATO AL AGUA",
  "ECHAR RAICES", "ECHAR UN OJO", "ECHARSE UN TACO DE OJO",
  "ESTAR EN EL QUINTO SUENO", "ESTAR EN LAS ULTIMAS",
  "ESTAR COMO AGUA PARA CHOCOLATE", "ESTAR PATO",
  "AGARRAR DE BAJADA", "AGARRAR EL TORO POR LOS CUERNOS",
  "ANDAR CON EL JESUS EN LA BOCA", "ANDAR DE VOLADA",
  "AL AHI SE VA", "COSTAR UN OJO DE LA CARA", "A TODO MECATE",
  "TENER EL SARTEN POR EL MANGO", "NO DAR PIE CON BOLA",
  "HACERSE GUAJE", "HACERSE EL OCCISO", "QUE OSO",
  "MANDAR AL DIABLO", "PONER EL DEDO", "TENER MUCHA LABIA",
  "IR AL GRANO", "AGARRAR LA ONDA",
].map(norm));

// Everything else → Expresiones (Órale, Sale, Simón, Güey, etc.)

function getNewCategory(word: string): string {
  const n = norm(word);
  if (PICARESCA.has(n))     return "Picaresca";
  if (TIPOS_SOCIALES.has(n)) return "Tipos Sociales";
  if (VERBOS_BARRIO.has(n))  return "Verbos del Barrio";
  return "Expresiones";
}

export const patchModismos = mutation({
  args: {},
  handler: async (ctx) => {
    const allWords = await ctx.db.query("words").collect();
    const modismos = allWords.filter((w) => (w as any).category === "Modismos");

    const results: { word: string; newCat: string }[] = [];
    for (const w of modismos) {
      const newCat = getNewCategory(w.word);
      await ctx.db.patch(w._id, { category: newCat } as any);
      results.push({ word: w.word, newCat });
    }

    const summary: Record<string, number> = {};
    for (const r of results) {
      summary[r.newCat] = (summary[r.newCat] ?? 0) + 1;
    }

    return { patched: results.length, summary };
  },
});
```

**Step 2: Commit**

```bash
git add convex/patchModismos.ts
git commit -m "feat(collections): add patchModismos mutation — split 110 Modismos into 4 sub-categories"
```

---

## Task 3: Crear `convex/seedCulturaDigitalV2.ts`

**Files:**
- Create: `convex/seedCulturaDigitalV2.ts`

**Step 1: Escribir el seed con ~25 palabras nuevas**

```typescript
// convex/seedCulturaDigitalV2.ts
import { mutation } from "./_generated/server";

const NEW_ENTRIES = [
  // ── STREAMERS adicionales ──────────────────────────────────────────────────
  {
    word: "EL RUBIUS",
    meaning: "Youtuber hispano (Rubén Doblas) muy popular en México, conocido por Minecraft y reacciones",
    example: "El Rubius fue uno de los primeros youtubers en llegar a 40 millones de suscriptores en español",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "AURONPLAY",
    meaning: "Streamer español (Raúl Álvarez) muy seguido en México, conocido por reacciones y drama",
    example: "Auronplay es uno de los streamers más vistos de habla hispana en Twitch",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "THEGREFG",
    meaning: "Streamer español (David Cánovas) popular en México por Fortnite y su skin oficial en el juego",
    example: "TheGrefg batió el récord de Twitch con 2.4 millones de espectadores simultáneos al revelar su skin de Fortnite",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "SPREEN",
    meaning: "Streamer argentino (Agustín Esperon) conocido por eventos de Minecraft y su popularidad en México",
    example: "Spreen participó en el servidor de Minecraft hispano con millones de espectadores en vivo",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "QUACKITY",
    meaning: "Streamer mexicano (Alexis) creador del Dream SMP y eventos virales en Twitch",
    example: "Quackity es uno de los streamers mexicanos con mayor proyección internacional en Twitch",
    region: "México", category: "Streamers", difficulty: 2,
  },
  {
    word: "RIVERS",
    meaning: "Streamer mexicano de videojuegos conocido en la escena hispana de Twitch",
    example: "Rivers es uno de los streamers mexicanos más activos en la comunidad hispanohablante",
    region: "México", category: "Streamers", difficulty: 2,
  },
  {
    word: "IBAI LLANOS",
    meaning: "Streamer vasco muy popular en México, organizador de La Velada del Año y Kings League",
    example: "Ibai Llanos organizó La Velada del Año 4 en 2024 rompiendo récords mundiales en Twitch",
    region: "Digital", category: "Streamers", difficulty: 2,
  },
  {
    word: "KENAI",
    meaning: "Streamer mexicano de Twitch conocido por Among Us y contenido de terror",
    example: "Kenai es uno de los streamers mexicanos más activos en el ámbito del gaming de horror",
    region: "México", category: "Streamers", difficulty: 2,
  },

  // ── MÚSICOS adicionales ────────────────────────────────────────────────────
  {
    word: "CARIN LEON",
    meaning: "Cantante de regional mexicano de Sonora, uno de los más escuchados en 2023-2024",
    example: "Carín León colaboró con Peso Pluma y ganó un Grammy Latino en 2023",
    region: "Sonora", category: "Músicos", difficulty: 2,
  },
  {
    word: "GRUPO FRONTERA",
    meaning: "Agrupación de música norteña de Texas con raíces mexicanas, viral en TikTok",
    example: "Grupo Frontera colaboró con Bad Bunny en 'Un x100to' que fue número 1 en Billboard",
    region: "Texas/México", category: "Músicos", difficulty: 2,
  },
  {
    word: "EDEN MUNOZ",
    meaning: "Cantante y compositor sinaloense, ex vocalista de Calibre 50 y exitoso solista",
    example: "Edén Muñoz escribió éxitos para Maluma y Becky G antes de triunfar como solista",
    region: "Sinaloa", category: "Músicos", difficulty: 2,
  },
  {
    word: "BANDA MS",
    meaning: "Banda sinaloense de Mazatlán, una de las más populares del regional mexicano moderno",
    example: "Banda MS es considerada una de las bandas de sinaloense más exitosas del siglo XXI",
    region: "Sinaloa", category: "Músicos", difficulty: 2,
  },
  {
    word: "CALIBRE 50",
    meaning: "Agrupación de regional mexicano de Sinaloa conocida por corridos y norteño romántico",
    example: "Calibre 50 ganó el Latin Grammy al Mejor Álbum de Música Norteña en 2014",
    region: "Sinaloa", category: "Músicos", difficulty: 2,
  },
  {
    word: "CHRISTIAN NODAL",
    meaning: "Cantante sonorense de mariacheño (fusión mariachi-norteño) y corridos, novio de Ángela Aguilar",
    example: "Christian Nodal lanzó 'Botella tras botella' con Gera MXM consolidando el mariacheño",
    region: "Sonora", category: "Músicos", difficulty: 2,
  },
  {
    word: "YAHRITZA Y SU ESENCIA",
    meaning: "Agrupación norteña liderada por Yahritza Martínez, viral por su estilo melódico en TikTok",
    example: "Yahritza y Su Esencia se volvió viral en TikTok con su versión de 'Obsessed' de Mariah Carey",
    region: "Washington/México", category: "Músicos", difficulty: 2,
  },
  {
    word: "LOS DOS CARNALES",
    meaning: "Duo de regional mexicano de Sonora conocido por corridos y narcocorridos modernos",
    example: "Los Dos Carnales tienen más de 10 millones de seguidores en YouTube con sus corridos",
    region: "Sonora", category: "Músicos", difficulty: 2,
  },
  {
    word: "XAVI",
    meaning: "Cantante de corridos tumbados y trap mexicano, conocido por 'La Diabla'",
    example: "Xavi lanzó 'La Diabla' en 2023, una de las canciones más escuchadas del corrido tumbado",
    region: "México", category: "Músicos", difficulty: 2,
  },
  {
    word: "GRUPO SOMBRA",
    meaning: "Agrupación de cumbia norteña de Jalisco muy popular en redes sociales",
    example: "Grupo Sombra se volvió viral en TikTok con covers de canciones pop en estilo cumbia",
    region: "Jalisco", category: "Músicos", difficulty: 2,
  },
  {
    word: "LUPILLO RIVERA",
    meaning: "Cantante de regional mexicano de Baja California, hermano de Jenni Rivera",
    example: "Lupillo Rivera es conocido como 'El Toro del Corrido' y tiene décadas de trayectoria",
    region: "Baja California", category: "Músicos", difficulty: 2,
  },
];

export const seedCulturaDigitalV2 = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("words").collect();
    const existingKeys = new Set(
      existing.map((w) => w.word.toUpperCase().trim().replace(/\s+/g, " "))
    );

    const allLevels = await ctx.db.query("levels").collect();
    const maxLevel = allLevels.length > 0
      ? Math.max(...allLevels.map((l) => l.levelNumber))
      : 0;

    let nextLevel = maxLevel + 1;
    const added: string[] = [];
    const skipped: string[] = [];

    for (const entry of NEW_ENTRIES) {
      const key = entry.word.toUpperCase().trim().replace(/\s+/g, " ");
      if (existingKeys.has(key)) { skipped.push(key); continue; }

      const wordId = await ctx.db.insert("words", {
        word: key,
        meaning: entry.meaning,
        example: entry.example,
        region: entry.region,
        category: entry.category,
        difficulty: entry.difficulty,
      });

      await ctx.db.insert("levels", {
        levelNumber: nextLevel,
        wordId,
        reward: { coins: 50 + (nextLevel - 1) * 10, diamonds: Math.floor((nextLevel - 1) / 5) + 1 },
      });

      existingKeys.add(key);
      added.push(key);
      nextLevel++;
    }

    return { added: added.length, skipped: skipped.length };
  },
});
```

**Step 2: Commit**

```bash
git add convex/seedCulturaDigitalV2.ts
git commit -m "feat(collections): add seedCulturaDigitalV2 — 8 streamers + 9 músicos nuevos"
```

---

## Task 4: Actualizar `convex/collectionsQuery.ts`

**Files:**
- Modify: `convex/collectionsQuery.ts:6-36`

**Step 1: Agregar las 4 nuevas categorías al mapa `categoryIcon()`**

Encontrar el bloque:
```typescript
function categoryIcon(cat: string): string {
  const map: Record<string, string> = {
    // Tier 1 — Fácil
    "Comida":            "🌮",
```

Agregar las 4 nuevas entradas en el bloque Tier 1:
```typescript
    // Sub-categorías de Modismos
    "Expresiones":       "🗣️",
    "Picaresca":         "🌶️",
    "Tipos Sociales":    "🎭",
    "Verbos del Barrio": "🏙️",
```

**Step 2: Commit**

```bash
git add convex/collectionsQuery.ts
git commit -m "feat(collections): add icons for 4 Modismos sub-categories"
```

---

## Task 5: Rediseñar `src/screens/ColeccionScreen.tsx`

**Files:**
- Modify: `src/screens/ColeccionScreen.tsx`

**Step 1: Agregar el mapa de imágenes AI**

Después de los imports existentes, agregar:

```typescript
// ── Imágenes AI por categoría ─────────────────────────────────────────────────
const CATEGORY_IMAGE_MAP: Record<string, any> = {
  "Expresiones":       require("../../assets/images/collections/expresiones.png"),
  "Picaresca":         require("../../assets/images/collections/picaresca.png"),
  "Tipos Sociales":    require("../../assets/images/collections/tipos_sociales.png"),
  "Verbos del Barrio": require("../../assets/images/collections/verbos_barrio.png"),
  "Comida":            require("../../assets/images/collections/comida.png"),
  "Bebida":            require("../../assets/images/collections/bebida.png"),
  "Animales":          require("../../assets/images/collections/animales.png"),
  "Historia":          require("../../assets/images/collections/historia.png"),
  "Música":            require("../../assets/images/collections/musica.png"),
  "Juegos":            require("../../assets/images/collections/juegos.png"),
  "Tradiciones":       require("../../assets/images/collections/tradiciones.png"),
  "Plantas":           require("../../assets/images/collections/plantas.png"),
  "Monumentos":        require("../../assets/images/collections/monumentos.png"),
  "Artistas":          require("../../assets/images/collections/artistas.png"),
  "Streamers":         require("../../assets/images/collections/streamers.png"),
  "Músicos":           require("../../assets/images/collections/musicos_digital.png"),
  "Futbolistas":       require("../../assets/images/collections/futbolistas.png"),
  "Jerga Digital":     require("../../assets/images/collections/jerga_digital.png"),
  "Regionalismos":     require("../../assets/images/collections/regionalismos.png"),
  "Leyendas":          require("../../assets/images/collections/leyendas.png"),
};
```

**Step 2: Reemplazar `CollectionCard` con diseño estilo Mexicanómetro**

Reemplazar la función `CollectionCard` completa:

```typescript
const CollectionCard = (category: any, index: number) => {
  const totalWords = category.levels.length;
  const unlockedWords = category.levels.filter(
    (lvl: any) => isWordUnlocked(lvl.levelNumber)
  ).length;
  const pct = totalWords > 0 ? unlockedWords / totalWords : 0;
  const img = CATEGORY_IMAGE_MAP[category.name] ?? null;

  return (
    <TouchableOpacity
      key={index}
      style={styles.card}
      onPress={() => onCardPress(category)}
      activeOpacity={0.8}
    >
      {/* Icono cuadrado AI */}
      <View style={styles.iconSquare}>
        {img ? (
          <Image source={img} style={styles.iconImage} resizeMode="cover" />
        ) : (
          <Text style={styles.iconFallbackEmoji}>{category.icon}</Text>
        )}
      </View>

      {/* Nombre */}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {category.name}
      </Text>

      {/* Barra de progreso estilo Mexicanómetro */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {unlockedWords}/{totalWords}
      </Text>
    </TouchableOpacity>
  );
};
```

**Step 3: Agregar los nuevos estilos al StyleSheet**

En `StyleSheet.create({...})`, reemplazar los estilos de `iconCircle` y `cardIcon` y agregar los nuevos:

```typescript
  // ── Card icon (reemplaza iconCircle + cardIcon) ───────────────────────────
  iconSquare: {
    width: width * 0.17,
    height: width * 0.17,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.25)",
  },
  iconImage: {
    width: "100%",
    height: "100%",
  },
  iconFallbackEmoji: {
    fontSize: width * 0.09,
    textAlign: "center",
    lineHeight: width * 0.17,
  },
  // ── Progress bar (Mexicanómetro style) ───────────────────────────────────
  progressTrack: {
    width: "88%",
    height: 5,
    backgroundColor: "rgba(139,69,19,0.18)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: AMBER,         // '#D2691E'
    borderRadius: 3,
  },
```

Y actualizar `progressText`:
```typescript
  progressText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.027,
    color: AMBER,
  },
```

**Step 4: Añadir `Image` al import de react-native si no está**

Verificar que el import tenga `Image`:
```typescript
import {
  ActivityIndicator,
  Dimensions,
  Image,          // ← asegurar que esté
  ImageBackground,
  Modal,
  ...
} from "react-native";
```

**Step 5: Commit**

```bash
git add src/screens/ColeccionScreen.tsx
git commit -m "feat(collections): redesign cards — AI icons + amber progress bar (Mexicanómetro style)"
```

---

## Task 6: Ejecutar mutations en Convex Dashboard

**Step 1: Abrir Convex Dashboard**

Ir a https://dashboard.convex.dev → tu proyecto → Functions.

**Step 2: Ejecutar en orden**

1. `patchModismos:patchModismos` → verifica que summary muestre ~35/30/25/20
2. `seedCulturaDigitalV2:seedCulturaDigitalV2` → verifica added: 19

**Step 3: Verificar en la app**

- Pantalla Colección debe mostrar ~20 tarjetas
- "Modismos" ya no aparece, en su lugar: Expresiones, Picaresca, Tipos Sociales, Verbos del Barrio
- Cada tarjeta tiene imagen cuadrada + barra amber

---

## Task 7: Commit final

```bash
git add -A
git commit -m "feat(collections): complete redesign — Modismos split + Cultura Digital expansion + AI icons + Mexicanometro-style cards"
```
