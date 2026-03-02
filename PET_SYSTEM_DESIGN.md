# 🦎 MEXICANARIO — System Design Document: La Mascota
## Diseño Completo del Sistema de Mascota Virtual v2025

---

## 📋 ÍNDICE
1. [Filosofía de Diseño](#filosofía)
2. [Ciclo de Vida & Evolución](#ciclo-de-vida)
3. [Sistema de Estados y Necesidades](#estados)
4. [Core Loop: Trivia ↔ Mascota](#core-loop)
5. [Misiones de Rescate (Earn-Back)](#earn-back)
6. [Tienda & Monetización Contextual](#tienda)
7. [Integración Social: Barrios & Familias](#social)
8. [Especificaciones Técnicas](#técnicas)

---

## 🎯 FILOSOFÍA DE DISEÑO

### Principio Central: **"La Mascota Eres Tú"**

La mascota no es un minijuego secundario. Es la **representación emocional del jugador** dentro del universo de Mexicanario. Cada decisión de diseño debe fortalecer esa identidad.

```
❌ LO QUE NO HACEMOS:
├─ La mascota NO muere de forma permanente
├─ NO existe "Game Over" para la mascota
├─ NO interrumpimos la trivia con popups de mascota
├─ NO castigamos al jugador por no entrar 1 día
└─ NO usamos confirmshaming ("¿Abandonas a tu Axolote?")

✅ LO QUE SÍ HACEMOS:
├─ La mascota SIEMPRE puede recuperarse (Earn-Back)
├─ Cada trivia correcta alimenta/alegra a la mascota
├─ El look de la mascota refleja el estatus del jugador
├─ Los amigos ven y envidian tu mascota evolucionada
└─ La personalización profunda crea apego genuino
```

### Los 3 Pilares Emocionales:
1. **Identidad** — "Esta mascota es única en el mundo"
2. **Responsabilidad** — "Me necesita, pero no me castiga si fallo"
3. **Orgullo** — "Quiero presumirla en el leaderboard"

---

## 🥚 CICLO DE VIDA & EVOLUCIÓN

### **Las 5 Etapas del Alebrije**

```
ETAPA 1: HUEVO MÁGICO (Nivel 0)
════════════════════════════════════
Visual: Huevo con patrones prehispánicos
        ┌──────────┐
        │  🥚✨    │ ← Vibra levemente en la pantalla
        │  ???     │ ← El jugador no sabe qué saldrá
        └──────────┘

Duración: 24 horas desde el registro
Requisito para eclosionar:
  ├─ Jugar 3 trivias en el primer día
  ├─ Elegir el NOMBRE de su mascota
  └─ Elegir el TIPO BASE:
      ├─ 🦎 Ajolote   (fácil de cuidar, lento en evolucionar)
      ├─ 🐕 Xolo      (equilibrado, el más social)
      └─ 🦅 Alebrije  (difícil, pero el más majestuoso)

Psicología: El periodo de espera de 24h + nombre personalizado
activa el Efecto de Dotación ANTES de la adopción.
Cuando el huevo eclosiona, el jugador ya está invertido
emocionalmente.

Notificación al eclosionar:
  "🥚 ¡Tu huevo está listo! ¡Ven a conocer a [NOMBRE]! 🎉"

────────────────────────────────────────────────────────

ETAPA 2: CRÍA (Niveles 1-10)
════════════════════════════════════
Visual: Criatura pequeña, ojos grandes, movimientos torpes
        ┌──────────────┐
        │  (=˘ω˘=)    │ ← Expresivo, lindo, pide atención
        │  [NOMBRE]   │
        │  ⭐ Nivel 3  │
        └──────────────┘

Requerimientos por nivel:
  ├─ Cada nivel = 100 XP
  ├─ XP se gana jugando trivia (ver tabla abajo)
  └─ Necesita comer al menos 1x/día para ganar XP

Cambios visuales en la Cría:
  Nv 1-3:  Criatura pequeñita (6 emojis básicos de expresión)
  Nv 4-6:  Aparecen los primeros colores prehispánicos en el cuerpo
  Nv 7-9:  Detalles ornamentales (patrones zapotecas o mayas)
  Nv 10:   EVOLUCIÓN → animación especial + notificación

────────────────────────────────────────────────────────

ETAPA 3: JUVENIL (Niveles 11-25)
════════════════════════════════════
Visual: Criatura mediana, más estilizada, colores vivos
        ┌──────────────────┐
        │   ┌─(ᵔᵕᵔ)─┐     │
        │   │[NOMBRE]│     │
        │   └────────┘     │
        │ ⭐⭐ Nivel 15     │
        │ [ACCESORIO: 🤠]  │ ← Los outfits son visibles aquí
        └──────────────────┘

Requerimientos por nivel:
  ├─ Cada nivel = 250 XP
  ├─ Debes haber completado al menos 10 trivias de cada categoría
  └─ Primeros accesorios equipables desbloquean aquí

Habilidades nuevas:
  ├─ La mascota puede "visitar" a amigos (Feature social)
  ├─ Puede participar en "Desafíos de Barrio"
  └─ Muestra su estado en el Leaderboard de Ciudad

────────────────────────────────────────────────────────

ETAPA 4: GUARDIÁN ADULTO (Niveles 26-50)
════════════════════════════════════════
Visual: Criatura majestuosa, con aura de color único
        ┌────────────────────────────┐
        │  ╔═══════════════════╗    │
        │  ║ ✨[NOMBRE]✨      ║    │
        │  ║   (^◡^ )          ║    │
        │  ║  Aura dorada       ║    │
        │  ╚═══════════════════╝    │
        │  ⭐⭐⭐ Nivel 35          │
        │  ESTADO: GUARDIÁN          │
        └────────────────────────────┘

Requerimientos:
  ├─ Racha de 30+ días acumulados (no necesariamente seguidos)
  ├─ 500 trivias respondidas correctamente
  └─ 50 palabras mexicanas dominadas

Habilidades especiales:
  ├─ Puede dar "Bonos de Maestro" a amigos nuevos
  │  (friend que reclute recibe +200 monedas)
  ├─ Badge exclusivo en Leaderboard: "Guardián de [Ciudad]"
  └─ Acceso a trivias de nivel "Legendario" (palabras náhuatl raras)

────────────────────────────────────────────────────────

ETAPA 5: ALEBRIJE MÍTICO (Nivel 51+)
════════════════════════════════════════
Visual: Criatura etérea, semi-transparente, partículas brillantes
        Único en su tipo — nadie más tiene el mismo color combination

        ╔══════════════════════════════╗
        ║  🌟✨🌟  [NOMBRE]  🌟✨🌟  ║
        ║      ⊂(◕‿◕)⊃               ║
        ║    ~ GUARDIÁN ETERNO ~      ║
        ║  Colores: [ÚNICOS del USER] ║
        ╚══════════════════════════════╝

Requerimientos:
  ├─ Racha acumulada de 100 días
  ├─ 1,000 palabras correctas
  ├─ Nivel 51 de trivia en el juego
  └─ Haber completado al menos 1 "Misión Legendaria"

Privilegios exclusivos:
  ├─ Nombre aparece en "Salón de la Fama" de tu ciudad
  ├─ Paleta de colores generativa ÚNICA (algoritmo basado en UserID)
  ├─ Acceso a "Modo Transmisión" (livestream tu mascota en perfil)
  └─ Badge dorado en TODOS los leaderboards

Monetización especial:
  └─ Jugadores con Alebrije Mítico tienen 3x más probabilidad
     de comprar IAP (datos de Tamagotchi/Neopets research)
```

### **Tabla de XP por Acción:**

| Acción | XP ganado | Notas |
|--------|-----------|-------|
| Trivia correcta (primera vez) | +15 XP | Bonus de primer intento |
| Trivia correcta (intento 2) | +8 XP | Reducido |
| Trivia correcta (intento 3) | +3 XP | Mínimo |
| Racha 5 correctas seguidas | +50 XP | "Modo Fiesta" activo |
| Jugar diariamente | +25 XP | Bonus de constancia |
| Alimentar mascota | +10 XP | Acción de cuidado |
| Invitar amigo (que instala) | +100 XP | Referral bonus |
| Completar categoría completa | +200 XP | Coleccionista |
| Ganar desafío de barrio | +150 XP | Competencia |

---

## 📊 SISTEMA DE ESTADOS Y NECESIDADES

### **Las 4 Métricas de la Mascota**

```
┌─────────────────────────────────────────────────────┐
│                    [NOMBRE del PLAYER]               │
│                  ╔═══════════════════╗              │
│                  ║   (^◡^ )           ║              │
│                  ╚═══════════════════╝              │
│                                                     │
│  🌮 HAMBRE:    [████████░░]  80%  → Estado: Lleno   │
│  😊 FELICIDAD: [██████░░░░]  60%  → Estado: Contento│
│  🧠 INTELECTO: [████░░░░░░]  40%  → Estado: Aprendiz│
│  ✨ ENERGÍA:   [██████████]  100% → Estado: ¡Fiesta!│
│                                                     │
│  📅 Última vez jugado: Hace 2 horas                 │
│  🔥 Racha: 12 días                                  │
└─────────────────────────────────────────────────────┘
```

---

### **Métrica 1: HAMBRE** 🌮

```
Rango: 0% - 100%
Decaimiento: -8% por hora sin jugar
Crítico en: <20% (mascota hace pucheros)
Emergencia en: <5% (mascota llora, notificación push)

ESTADOS DE HAMBRE:
  100% → 🌮🌮🌮 "¡Satisfecho!" → +5% velocidad XP
   80% → 🌮🌮   "Bien alimentado" → Normal
   60% → 🌮     "Algo de hambre" → Normal
   40% → 😐     "Hambrienta" → -10% XP ganado
   20% → 😟     "¡Necesita comer!" → PUSH NOTIFICATION
    5% → 😢     "¡Emergencia!" → PANTALLA DE RESCATE

CÓMO ALIMENTAR:
  Opción A (Gratis): 1 trivia correcta = -15% hambre
  Opción B (Monedas): Tamal básico = 25 monedas
  Opción C (Ad): Ver anuncio = Tamal de pollo especial
  Opción D (Premium): Tamales de mole (comida máxima)

CUANDO HAMBRE = 0%:
  ❌ La mascota NO muere
  ✅ Entra en "Modo Siesta" (animación de dormir)
  ✅ Se activa la pantalla de "MISIÓN DE RESCATE"
  ✅ El jugador recupera todo con 1 sesión especial
```

---

### **Métrica 2: FELICIDAD** 😊

```
Rango: 0% - 100%
Decaimiento: -5% por día sin interacción
Critico en: <25% (mascota triste, colores apagados)

ESTADOS:
  100% → 🎉 "¡Modo Fiesta!" → Animación especial + 2x XP (20 min)
   80% → 😊 "Feliz" → Normal
   60% → 😐 "Contenta" → Normal
   40% → 😟 "Algo triste" → Pide atención
   20% → 😢 "Triste" → Colores más opacos, sonido melancólico
    0% → 💔 "Desolada" → MODO SIESTA + MISIÓN DE RESCATE

CÓMO AUMENTAR FELICIDAD:
  Opción A: Acariciar (tap en mascota) → +2% (máx 5x/día)
  Opción B: Trivia de la categoría FAVORITA → +10%
  Opción C: Amigo visita tu mascota → +5%
  Opción D: Usar accesorio nuevo → +20% (una vez por item)
  Opción E: Completar "Misión Cultural" → +30%

MECÁNICA ESPECIAL — "MODO FIESTA" (Felicidad 100%):
  Duración: 20 minutos tras llegar al 100%
  Efectos:
    ├─ Animación de baile de la mascota (género = tipo mascota)
    │  Ajolote: nada feliz 🌊
    │  Xolo: corre en círculos 🐕
    │  Alebrije: vuela y deja estelas de colores ✨
    ├─ 2x XP en todas las trivias durante 20 minutos
    ├─ Doble monedas en trivias correctas
    └─ Notificación a amigos: "[NOMBRE] está de FIESTA 🎉"
       → Los amigos pueden "unirse" y ganar +5% felicidad ellos
```

---

### **Métrica 3: INTELECTO** 🧠

```
Rango: 0% - 100% (NO decae con el tiempo)
Esta es la única métrica que solo SUBE, nunca baja.
Sube: +3% por cada NUEVA categoría aprendida

Función del Intelecto:
  ├─ Refleja cuánta cultura mexicana conoce el jugador
  ├─ Desbloquea trivias más difíciles y raras
  └─ Da bonificaciones pasivas en el leaderboard

ESTADOS DE INTELECTO:
   0-20%  → "Turista" → Sin bonus
  21-40%  → "Visitante" → +5% monedas en trivias de Comida
  41-60%  → "Chilango" → +10% monedas, trivias Región desbloqueadas
  61-80%  → "Conocedor" → +15% monedas, acceso a palabras náhuatl
  81-100% → "Maestro del Folklore" → +25% monedas, badge en leaderboard

CÓMO SUBE EL INTELECTO:
  ├─ Responder correctamente trivias de NUEVA categoría: +5%
  ├─ Completar colección de una categoría entera: +10%
  ├─ Alcanzar nivel 10 en trivia: +5%
  └─ Dominar una región específica (Yucatán, CDMX, etc.): +3%
```

---

### **Métrica 4: ENERGÍA** ✨

```
Rango: 0% - 100%
Función: Multiplicador general de todas las demás métricas
Recarga: 25% cada 6 horas (automático)

ESTADOS:
  100% → ⚡ "¡Súper Energizada!" → Todas las métricas 1.5x velocidad
   75% → ✨ "Enérgica" → Normal + 10% bonus XP
   50% → 😌 "Descansada" → Normal
   25% → 😴 "Cansada" → -10% XP ganado
    0% → 💤 "Dormida" → -25% XP, no puede participar en Desafíos

CÓMO RECARGAR ENERGÍA:
  Opción A (Pasivo): Automático +25% cada 6h
  Opción B (Ad): "Poción de Ajolote" = ver anuncio = +50% energía
  Opción C (Monedas): "Atole energético" = 50 monedas = +40%
  Opción D (Diamantes): "Elixir del Sol" = 5 diamantes = 100%

MECÁNICA ESPECIAL — "OVERCHARGE" (Energía > 100%):
  ├─ Solo posible con item premium "Rayos del Sol" ($0.99)
  ├─ Energía al 150% por 1 hora
  ├─ Durante Overcharge: 3x XP + 2x monedas + Fiesta automática
  └─ Ideal para Eventos especiales o Desafíos de Barrio
```

---

## 🔄 CORE LOOP: TRIVIA ↔ MASCOTA

### **El Ciclo Virtuoso**

```
ANTES DE JUGAR:
User abre app → Ve estado actual de mascota
    ├─ Si mascota feliz → Motivación positiva
    │   "¡[NOMBRE] está lista para aprender! 🎉"
    └─ Si mascota hambrienta → Aversión a pérdida ética
        "[NOMBRE] tiene hambre, ¡juega para alimentarla! 🌮"

DURANTE EL JUEGO (por cada respuesta):
    Respuesta CORRECTA:
      ├─ Animación: mascota brinca de alegría
      ├─ Hambre: -15% (mascota "come")
      ├─ Felicidad: +10%
      ├─ Intelecto: +3% (si es categoría nueva)
      ├─ XP: según tabla
      └─ Audio: sonido de victoria culturalmente apropiado

    Respuesta INCORRECTA:
      ├─ Animación: mascota hace cara de "ay..."
      ├─ Felicidad: -5% (pequeño bajón)
      ├─ XP: +3% si respondiste en segundo intento
      └─ Notificación: "Igual [NOMBRE] te quiere aunque sea difícil ❤️"

RACHA DE 5 CORRECTAS:
    ├─ "¡COMBO x5! ¡MODO FIESTA!" aparece en pantalla
    ├─ Mascota entra en Modo Fiesta (20 min)
    ├─ 2x XP activado inmediatamente
    ├─ Efectos visuales especiales en el teclado
    └─ Push a amigos: "[USER] está en racha 🔥 ¡Desafíalo!"
```

### **Tabla de Sinergia Trivia→Mascota:**

| Acción en Trivia | Efecto en Mascota | Motivación al jugador |
|-----------------|------------------|----------------------|
| 1 respuesta correcta | Mascota come 🌮 | Alimento visible |
| 3 correctas seguidas | +15% felicidad | Mascota baila un paso |
| 5 correctas seguidas | MODO FIESTA 🎉 | 2x XP durante 20 min |
| Completar categoría | +25% Intelecto | Badge en mascota |
| Nivel de trivia subido | Mascota evoluciona | Animación cinemática |
| Racha de 7 días | Mascota crece visualmente | Nuevo stage de evolución |
| Fallar 3 veces | Mascota hace puchero | Trigger para pista gratis |

---

## 🆘 MISIONES DE RESCATE (EARN-BACK)

### **La Filosofía: Penalización = Oportunidad**

Cuando la mascota cae en estado crítico, en lugar de un muro de pago o una muerte permanente, el jugador enfrenta una **"Misión de Rescate"** — una trivia especial que convierte la penalización en la mejor sesión de juego del día.

```
PANTALLA DE MISIÓN DE RESCATE:
┌──────────────────────────────────────────────────┐
│         😢 [NOMBRE] TE NECESITA                  │
│                                                  │
│  Tu Alebrije lleva tiempo sin tu energía.         │
│  ¡Pero no está perdido! Puedes salvarlo ahora.   │
│                                                  │
│         ╔══════════════════════╗                 │
│         ║  (;-;) ← cara triste║                 │
│         ╚══════════════════════╝                 │
│                                                  │
│  HAMBRE:     [░░░░░░░░░░]  0%                   │
│  FELICIDAD:  [█░░░░░░░░░] 10%                   │
│                                                  │
│  ELIGE CÓMO RESCATARLO:                          │
│                                                  │
│  ┌──────────────────────────────┐               │
│  │ 🎯 MISIÓN RÁPIDA (GRATIS)    │               │
│  │ 3 trivias especiales         │               │
│  │ Si aciertas 2/3 → Mascota    │               │
│  │ recupera 75% de todo         │               │
│  │ Dificultad: Media            │               │
│  └──────────────────────────────┘               │
│                                                  │
│  ┌──────────────────────────────┐               │
│  │ ⭐ MISIÓN LEGENDARIA         │               │
│  │ 1 trivia muy difícil         │               │
│  │ Si aciertas → 100% recuperado│               │
│  │ + BONUS 200 monedas          │               │
│  │ + 50 XP extra                │               │
│  │ Dificultad: Difícil          │               │
│  └──────────────────────────────┘               │
│                                                  │
│  ┌──────────────────────────────┐               │
│  │ 📺 VER ANUNCIO (INSTANTÁNEO) │               │
│  │ Ver 30s → Mascota recupera   │               │
│  │ 50% inmediatamente           │               │
│  │ Sin jugar                    │               │
│  └──────────────────────────────┘               │
│                                                  │
│  ┌──────────────────────────────┐               │
│  │ 💎 RESCATE PREMIUM (3 💎)    │               │
│  │ Recupera 100% + 30 min de    │               │
│  │ MODO FIESTA garantizado      │               │
│  └──────────────────────────────┘               │
└──────────────────────────────────────────────────┘
```

### **Tipos de Misiones de Rescate:**

**Misión Tipo 1: "La Leyenda del Conocedor"** (3 trivias medias)
```
Contexto narrativo mostrado en pantalla:
"[NOMBRE] soñó que olvidaba la cultura de México.
¡Recuérdasela respondiendo estas 3 preguntas!"

Condición: Acertar 2 de 3
Premio al ganar:
  ├─ Hambre: 100%
  ├─ Felicidad: 75%
  ├─ Energía: 75%
  └─ +50 monedas bonus

Premio al perder:
  ├─ Hambre: 40% (igual algo recupera)
  ├─ "¡Casi! Inténtalo de nuevo mañana"
  └─ Consolation: +10 monedas
```

**Misión Tipo 2: "El Gran Reto Prehispánico"** (1 trivia difícil)
```
Contexto narrativo:
"Los antiguos sabios guardan el secreto para
revivir a [NOMBRE]. ¿Puedes descifrar esta
palabra de los mexicas?"

Condición: Acertar la 1 trivia
Premio al ganar:
  ├─ TODOS los stats al 100%
  ├─ 200 monedas bonus
  ├─ 50 XP extra
  └─ Animación cinemática de resurrección ⚡

Premio al perder:
  ├─ Hambre: 30% (pequeña ayuda)
  ├─ Pista especial desbloqueada
  └─ Puedes reintentar en 1 hora
```

---

## 🏪 TIENDA & MONETIZACIÓN CONTEXTUAL

### **Moneda Dual:**

```
💰 MONEDAS MEXICANAS (Moneda Básica)
  Ganadas: Jugando trivia
  Uso: Comida estándar, pistas, consumibles básicos
  NO se compran directamente (para no crear inflación)
  Símbolo: Moneda con la insignia del águila

💎 DIAMANTES (Moneda Premium)
  Ganadas: Logros especiales, rachas largas, misiones raras
  Uso: Accesorios cosméticos, rescates, boosts premium
  TAMBIÉN se compran con dinero real
  Símbolo: Jade (piedra sagrada prehispánica de color verde)

TABLA DE CONVERSIÓN:
  50 💎 = $0.99
  130 💎 = $1.99 (+10 bonus)
  300 💎 = $3.99 (+50 bonus)
  700 💎 = $8.99 (+100 bonus)
  1500 💎 = $14.99 (+300 bonus)
```

---

### **CATÁLOGO DE ACCESORIOS ESTÉTICOS (5 Iniciales)**

**Accesorio 1: Sombrero de Charro** 🤠
```
ID: "acc_sombrero_charro"
Precio: 80 💎 (≈$1.59)
Categoría: Sombreros
Visual: Sombrero negro con adornos plateados sobre la mascota
Bonus: +5% felicidad (pasivo, mientras esté equipado)
Rarity: Común ⭐
Descripción: "El símbolo del mariachi. ¡Tu Alebrije ya
             puede tocar con la banda!"
Disponible: Siempre

Contexto de monetización:
  Aparece en tienda cuando:
  ├─ El jugador responde trivia sobre "Música"
  ├─ "[NOMBRE] quiere presumir su sombrero charro 🤠"
  └─ Banner discreto en esquina (no popup)
```

**Accesorio 2: Corona de Jade** 💚
```
ID: "acc_corona_jade"
Precio: 200 💎 (≈$3.99)
Categoría: Coronas
Visual: Corona de jade verde brillante (estilo mexica)
Bonus: +10% XP ganado (pasivo)
Rarity: Raro ⭐⭐
Descripción: "Solo los Guardianes de la Cultura
             merecen el jade sagrado de Tenochtitlán"
Disponible: Solo para Nivel 15+

Contexto de monetización:
  Aparece cuando:
  ├─ Jugador sube al Nivel 15
  ├─ "¡[NOMBRE] ha evolucionado! ¡Merece la Corona!"
  └─ Mostrar durante animación de evolución
```

**Accesorio 3: Sarape de Colores** 🌈
```
ID: "acc_sarape"
Precio: 60 💎 (≈$1.19)
Categoría: Ropa
Visual: Sarape multicolor que envuelve el cuerpo de la mascota
Bonus: +3% monedas en trivias de Historia
Rarity: Común ⭐
Descripción: "Del corazón de Saltillo, el más fino
             sarape para tu compañero cultural"
Disponible: Siempre

Contexto de monetización:
  Aparece cuando:
  └─ Trivia de "Historia" o "Artesanías" superada
```

**Accesorio 4: Alas de Mariposa Monarca** 🦋
```
ID: "acc_alas_monarca"
Precio: 350 💎 (≈$6.99)
Categoría: Alas / Especiales
Visual: Alas animadas de mariposa monarca
        (se mueven suavemente mientras la mascota está quieta)
Bonus: Mascota puede "volar" en la pantalla HOME
       (animación especial de vuelo circular)
Rarity: Épico ⭐⭐⭐
Descripción: "La mariposa monarca migra miles de kilómetros.
             Tu Alebrije ahora lleva esa magia contigo."
Disponible: Solo durante Evento "Migración Monarca"
            (Octubre-Noviembre)

Contexto de monetización:
  Evento de temporada → urgencia → conversión alta
  "¡Solo disponible 30 días! ¡No lo pierdas!"
  Precio puede subir a 400 💎 la última semana
```

**Accesorio 5: Máscara de Catrina** 💀
```
ID: "acc_catrina"
Precio: 150 💎 (≈$2.99)
Categoría: Mascaras / Eventos
Visual: Media máscara de catrina con flores
        Las flores cambian de color según el humor de la mascota
Bonus: En Modo Fiesta, las flores brillan y parpadean
       + 15% extra XP durante Modo Fiesta
Rarity: Raro ⭐⭐
Descripción: "La Catrina sonríe ante la vida y la muerte.
             Que tu Alebrije lleve ese misterio."
Disponible: Siempre

Contexto de monetización:
  ├─ Aparece en Día de Muertos (Evento Especial)
  ├─ Bundle especial: Catrina + Fondo "Ofrenda" = 220 💎
  └─ Fuera del evento: disponible a 150 💎
```

---

### **CATÁLOGO DE CONSUMIBLES (3 Iniciales)**

**Consumible 1: Tamal de Rescate** 🫔
```
ID: "cons_tamal_rescate"
Tipo: Alimentación
Precio: 25 💰 monedas
Efecto: +40% Hambre instantáneo
Duración: Instantáneo
Descripción: "Un tamal calentito para calmar el hambre"

ANUNCIO RECOMPENSADO aquí:
  Trigger: Hambre < 30%
  Opción en pantalla:
    [💰 25 monedas] ← botón normal
    [📺 Ver anuncio → Tamal GRATIS] ← botón destacado
  Recompensa ad: Tamal especial +50% hambre (mejor que pagar)
```

**Consumible 2: Poción de Ajolote** 🦎
```
ID: "cons_pocion_ajolote"
Tipo: Energía
Precio: 50 💰 monedas
Efecto: +50% Energía instantáneo
Descripción: "El poder regenerativo del axolote en una botella"

ANUNCIO RECOMPENSADO aquí:
  Trigger: Energía < 25% Y el jugador quiere participar en Desafío
  Popup: "¡[NOMBRE] necesita energía para el Desafío de Barrio!
          [Ver anuncio 📺] → +50% Energía GRATIS"
```

**Consumible 3: Atole de Felicidad** ☕
```
ID: "cons_atole_felicidad"
Tipo: Estado de Ánimo
Precio: 40 💰 monedas
Efecto: +30% Felicidad
Descripción: "Un atole caliente y espeso para alegrar el día"
Especial: Si se da cuando Felicidad > 70%, sube a 100% y activa
          MODO FIESTA automáticamente

ANUNCIO RECOMPENSADO aquí:
  Trigger: Jugador está a 30% de Modo Fiesta (70% actual)
  Mensaje: "¡[NOMBRE] casi está en MODO FIESTA!
            [Ver anuncio 📺] → ¡Actívalo ahora!"
  Psicología: El jugador ya está a 70%, quiere el 100% → conversión
```

---

### **ESTRATEGIA DE ANUNCIOS: "El Momento Exacto"**

```
REGLA DE ORO: Nunca interrumpir, siempre ofrecer valor.

MOMENTOS ÓPTIMOS PARA ANUNCIOS RECOMPENSADOS:

1. POST-SESIÓN (Mejor momento, mayor reward)
   Cuándo: Después de completar 3 trivias
   Mensaje: "¡[NOMBRE] quiere más energía!
             [📺 Ver anuncio → +100 monedas + Tamal GRATIS]"
   Por qué funciona: Usuario ya terminó → no hay interrupción
   Fill rate esperado: 85%

2. UMBRAL DE HAMBRE (Alta urgencia, buen momento)
   Cuándo: Hambre < 25%
   Mensaje: "[NOMBRE] tiene mucha hambre 😢
             [📺 Ver anuncio → Tamal Especial GRATIS]"
   Por qué funciona: El apego emocional impulsa la acción
   Fill rate esperado: 70%

3. PRE-MODO FIESTA (FOMO puro)
   Cuándo: Felicidad entre 65-75% (cerca del 100%)
   Mensaje: "¡MODO FIESTA casi activo! 🎉
             [📺 Ver anuncio → +30% Felicidad → FIESTA garantizada!]"
   Por qué funciona: Están a 1 paso del premio más grande
   Fill rate esperado: 80%

4. RESCATE COMO ÚLTIMA OPCIÓN
   Cuándo: En la pantalla de Misión de Rescate
   Botón: [📺 Ver anuncio → +50% recuperación instantánea]
   Posición: Segunda opción (primera es la Misión, más engagement)
   Por qué funciona: El jugador ya está en modo "solucionar"
   Fill rate esperado: 65%

5. ANTES DE DESAFÍO DE BARRIO
   Cuándo: Intentando unirse a desafío sin energía
   Mensaje: "[NOMBRE] necesita energía para pelear! 💪
             [📺 Poción de Ajolote GRATIS]"
   Por qué funciona: Motivación competitiva es la más fuerte
   Fill rate esperado: 90% (la más alta)
```

---

## 👥 INTEGRACIÓN SOCIAL: BARRIOS & FAMILIAS

### **El Sistema de Barrios**

```
CONCEPTO:
Un "Barrio" es un grupo de 5-20 jugadores de la misma ciudad.
Las mascotas de un barrio se CONOCEN entre sí y pueden
interactuar para darse beneficios mutuos.

CREACIÓN DE BARRIO:
  ├─ Cualquier jugador Nivel 10+ puede fundar un barrio
  ├─ Elige nombre temático: "La Banda del Tianguis", "Los del Zócalo"
  ├─ Elige un escudo (emoji cultural)
  └─ Invita a amigos (máx 20 por barrio)

MASCOTA EN EL BARRIO:
  Tu mascota aparece en la "Casa del Barrio" (pantalla colectiva)
  donde todas las mascotas conviven:

  ┌────────────────────────────────────────────────────┐
  │           🏠 BARRIO: "La Banda del Tianguis"        │
  │           Puntos: 15,240 | Rango: #3 en CDMX       │
  ├────────────────────────────────────────────────────┤
  │                                                    │
  │  [JUAN]    [SOFIA]   [MARCO]   [LUIS]   [TÚ]     │
  │   😊🤠      😄🌸      😎💎      😴?      🎉🦋    │
  │   Nv.15    Nv.22     Nv.31     Nv.8    Nv.19     │
  │                                                    │
  │  NOVEDADES:                                        │
  │  ⚡ Sofia está en MODO FIESTA → ¡Únete para +5%!   │
  │  😴 Marco no ha jugado hoy → ¿Le mandas comida?    │
  │  🔥 Luis perdió su racha → Misión de Barrio activa │
  └────────────────────────────────────────────────────┘
```

### **Mecánicas de Interacción entre Mascotas:**

**Mecánica 1: "Dar de Comer"** 🌮
```
FLUJO:
  Jugador ve que la mascota de un amigo tiene hambre
    → Toca [🌮 Dar Tamal]
    → Su mascota "camina" hacia la mascota del amigo (animación)
    → La mascota del amigo come el tamal

EFECTOS:
  DADOR:   +10% felicidad propia (se siente buena persona)
            +5 XP
  RECEPTOR: +20% hambre (más que un tamal normal)
            +5% felicidad ("alguien pensó en mí")

COSTO para el DADOR:
  Opción A: 15 monedas (descuento por ser para amigo)
  Opción B: Ver un anuncio corto = tamal gratis para amigo

PSICOLOGÍA: Crea bucles de reciprocidad.
  Luis da tamal a Juan.
  Juan siente obligación de devolver → retención mutua.
```

**Mecánica 2: "Unirse al Modo Fiesta"** 🎉
```
FLUJO:
  Sofia entra en MODO FIESTA (100% felicidad)
    → Notificación a TODO el barrio:
       "🎉 ¡El Alebrije de Sofia está de FIESTA!
        ¡Únete en los próximos 10 min para ganar bonos!"
    → Jugadores que tocan [UNIRME] en 10 minutos:
       Ganan +15% felicidad en su propia mascota
       + 20% de los XP de Sofia durante su Fiesta

DISEÑO: Hace que el Modo Fiesta sea un EVENTO SOCIAL
  no solo personal. Crea urgencia y comunidad.

MONETIZACIÓN: Jugadores que no tienen 100% felicidad
  tienen más razón para comprar Atole de Felicidad
  justo cuando un amigo está en Modo Fiesta.
```

**Mecánica 3: "Desafío de Barrio"** ⚔️
```
FORMATO:
  Un desafío semanal entre TODOS los barrios de una ciudad.
  Ej: "Desafío del Miércoles: ¿Quién conoce más sobre Comida?"

  Cada miembro del barrio juega 5 trivias de la categoría.
  Los puntos de TODOS se suman = Puntos del Barrio.

  El barrio con más puntos gana el desafío.

PREMIOS AL BARRIO GANADOR:
  ├─ Badge "Campeón de [Categoría]" por 1 semana
  ├─ +200 monedas para CADA miembro
  ├─ Su barrio aparece en la pantalla principal de la ciudad
  └─ Acceso anticipado a 1 outfit nuevo (1 semana antes)

EFECTO SOBRE LA MASCOTA:
  Mientras dura el desafío (24h):
    ├─ Mascotas del barrio ganador tienen aura dorada
    └─ +10% XP para todos sus miembros (1 día)

MONETIZACIÓN: Para el Desafío se necesita Energía.
  → Trigger perfecto para vender "Poción de Ajolote"
  → Los jugadores tienen motivación social (no decepcionar al barrio)
  → Fill rate de ads aquí: 90%
```

**Mecánica 4: "Adopción Comunitaria"** 🐣
```
FLUJO:
  Cuando un jugador nuevo se une al barrio:
    → Su mascota aparece como "Huevo" en la Casa del Barrio
    → Los miembros veteranos pueden "nutrir" el huevo:
       Tocar el huevo = dar 10 monedas al nuevo jugador
       Los primeros 5 en nutrir = se convierten en "Padrinos"

  PADRINO = badge especial en el perfil
  El nuevo jugador al eclosionar ve quiénes le ayudaron
  → Relación de lealtad inmediata
  → Retención del nuevo jugador aumenta (no quiere decepcionar a sus padrinos)

PSICOLOGÍA: Crea vínculos antes de que el jugador
  haya jugado siquiera su primera trivia.
```

---

## 🔔 SISTEMA DE NOTIFICACIONES ÉTICAS

```
PRINCIPIO: Solo enviar cuando hay valor real para el jugador.
  Máximo: 2 notificaciones por día.
  Tiempo: Nunca entre 11PM y 8AM.

JERARQUÍA DE PRIORIDAD:

Alta Prioridad (enviar siempre):
  ├─ "🎉 [BARRIO] ganó el Desafío de Barrio!"
  ├─ "🥚 ¡Tu huevo está listo para eclosionar!"
  └─ "⭐ [NOMBRE] acaba de evolucionar a Nivel X!"

Media Prioridad (max 1/día):
  ├─ "😢 [NOMBRE] tiene hambre. ¡1 trivia la alimenta!"
  ├─ "🎉 Sofia está en MODO FIESTA, ¡únete!"
  └─ "🔥 Tu racha está a 2 horas de romperse"

Baja Prioridad (solo si no hay otras):
  ├─ "🛒 Nuevo accesorio disponible: [NOMBRE ITEM]"
  └─ "📅 ¡Hoy es [DÍA FESTIVO MEXICANO]! Evento especial"

NO ENVIAR NUNCA:
  ├─ "Tu mascota está muriendo" (no existe la muerte)
  ├─ "Últimas horas para comprar" (sin urgencia artificial)
  └─ Más de 2 notificaciones en el mismo día
```

---

## 🔧 ESPECIFICACIONES TÉCNICAS

### **Esquema Convex — Tabla `pets`**

```typescript
interface Pet {
  _id: Id<"pets">;
  userId: string;            // Foreign key a users
  name: string;              // Nombre personalizado
  type: "ajolote" | "xolo" | "alebrije";
  stage: 1 | 2 | 3 | 4 | 5; // Etapa evolutiva

  // Métricas (0-100)
  hunger: number;            // Hambre actual
  happiness: number;         // Felicidad actual
  intellect: number;         // Solo sube, nunca baja
  energy: number;            // Energía actual

  // XP & Level
  xp: number;                // XP total acumulado
  level: number;             // Nivel de la mascota (1-51+)
  xpForNextLevel: number;    // XP necesaria para siguiente nivel

  // Inventario
  equippedAccessory: string | null;  // ID del accesorio equipado
  ownedAccessories: string[];        // IDs de todos los outfits
  ownedConsumables: {
    id: string;
    quantity: number;
  }[];

  // Social
  barrio: string | null;     // ID del barrio al que pertenece
  isParticipatingInChallenge: boolean;

  // Timing
  lastFedAt: number;         // Timestamp
  lastHappinessUpdateAt: number;
  lastEnergyUpdateAt: number;
  createdAt: number;
}
```

### **Lógica de Decaimiento (Función)**

```typescript
// Ejecutar en Convex Cron Job cada 2 horas
export const decayPetStats = action({
  handler: async (ctx) => {
    const pets = await ctx.db.query("pets").collect();
    const now = Date.now();

    for (const pet of pets) {
      const hoursSinceLastFed = (now - pet.lastFedAt) / (1000 * 60 * 60);
      const hoursSinceLastHappiness = (now - pet.lastHappinessUpdateAt) / (1000 * 60 * 60);
      const hoursSinceLastEnergy = (now - pet.lastEnergyUpdateAt) / (1000 * 60 * 60);

      // Calcular nuevos valores (no bajar de 0)
      const newHunger = Math.max(0, pet.hunger - (hoursSinceLastFed * 8));
      const newHappiness = Math.max(0, pet.happiness - (hoursSinceLastHappiness * 5));
      const newEnergy = Math.min(100, pet.energy + (hoursSinceLastEnergy * 4.17)); // +25% cada 6h

      await ctx.db.patch(pet._id, {
        hunger: newHunger,
        happiness: newHappiness,
        energy: newEnergy,
        lastHedAt: now,
        lastHappinessUpdateAt: now,
        lastEnergyUpdateAt: now,
      });

      // Trigger notificación si baja de umbrales
      if (newHunger < 20) {
        await sendPushNotification(pet.userId, "hungerLow");
      }
    }
  }
});
```

### **Función de XP y Level Up**

```typescript
export const gainXP = mutation({
  args: {
    petId: v.id("pets"),
    xpAmount: v.number(),
    source: v.string(), // "trivia_correct" | "daily_bonus" | etc
  },
  handler: async (ctx, args) => {
    const pet = await ctx.db.get(args.petId);
    if (!pet) return;

    const newXP = pet.xp + args.xpAmount;
    const xpThreshold = pet.level <= 10 ? 100 : pet.level <= 25 ? 250 : 500;
    const levelsGained = Math.floor(newXP / xpThreshold) - Math.floor(pet.xp / xpThreshold);

    let newStage = pet.stage;
    if (pet.level + levelsGained >= 51) newStage = 5;
    else if (pet.level + levelsGained >= 26) newStage = 4;
    else if (pet.level + levelsGained >= 11) newStage = 3;
    else if (pet.level + levelsGained >= 1) newStage = 2;

    const didEvolve = newStage > pet.stage;

    await ctx.db.patch(args.petId, {
      xp: newXP % xpThreshold,
      level: pet.level + levelsGained,
      stage: newStage,
    });

    return {
      levelsGained,
      didEvolve,
      newStage: didEvolve ? newStage : null,
    };
  }
});
```

---

## 📊 MÉTRICAS DE ÉXITO DEL SISTEMA

```
MÉTRICAS CLAVE A MONITOREAR:

Apego emocional:
  ├─ % users que nombran su mascota (target: 85%)
  ├─ % users que equipan un accesorio (target: 40%)
  ├─ Sesiones de "cuidado" sin trivia: 0.5/semana/user
  └─ CSAT preguntando "¿Te importa tu mascota?": 8/10

Monetización:
  ├─ Fill rate de Rewarded Ads: target 75%+
  ├─ Conversión a IAP primer accesorio: target 12%
  ├─ ARPU por mascota (accesorios): $3-8
  └─ Compra repeat rate: 40% en 30 días

Social:
  ├─ % users en un barrio: target 60%
  ├─ Acciones "dar de comer a amigo"/semana: 2+
  ├─ Participación en Desafíos de Barrio: 70%
  └─ Invitaciones enviadas por mascota: 0.8/user/mes

Retención:
  ├─ D30 Retention (con mascota): target 18%
  ├─ D30 Retention (sin mascota): proyectado 8%
  └─ Diferencia: +10% → La mascota duplica retención
```

---

**Sistema de Mascota — Versión 1.0**
**Preparado por: Lead Pet System Designer**
**Fecha: Febrero 2026**
