# 🇲🇽 MEXICANARIO — Game Design Document v2025
## Core Loop, Mascota, Monetización & Estrategia Social

---

## 📋 ÍNDICE
1. [Visión del Juego](#visión-del-juego)
2. [Core Loop Diario (10-15 min)](#core-loop-diario)
3. [Sistema de Mascota Virtual](#sistema-de-mascota)
4. [Leaderboards & Gamificación Social](#leaderboards)
5. [Monetización Híbrida Exacta](#monetización)
6. [Estrategia de Retención (Streaks)](#retención)
7. [Dinámicas Sociales Innovadoras](#dinámicas-sociales)
8. [Roadmap de Implementación](#roadmap)

---

## 🎯 VISIÓN DEL JUEGO

**Mexicanario** es una app de trivia sobre cultura mexicana que recompensa el juego diario a través de una **mascota virtual evolucionable** (Alebrije/Alebrijito).

**Promesa principal:** *"Aprende cultura mexicana mientras cuidas tu mascota. Compite con tu ciudad. Únete a la revolución cultural."*

**Target:** Mexicanos 15-45 años (especialmente milenials con nostalgia cultural)

**Monetización Goal:** $50K-200K MRR en año 1 (híbrida: ads + IAP + suscripción)

---

## ⏱️ CORE LOOP DIARIO (10-15 MINUTOS)

### **FASE 1: ENTRADA (1 min)**
```
Usuario abre app
    ↓
[NOTIFICACIÓN PUSH] "Tu Alebrijito te extraña 🥺"
    ↓
Mascota aparece en pantalla HOME:
  • Estado visual (feliz/triste/hambriento)
  • Racha diaria (ej: "Día 15 🔥")
  • Botones: [JUGAR] [CUIDAR] [TIENDA]
```

**Psicología aplicada:**
- El Efecto Zeigarnik activa en el push (incompletitud emotiva)
- La mascota tristita → aversión a pérdida ("Si no juego hoy, mi mascota sufre")

---

### **FASE 2: CUIDADO PRE-JUEGO (2 min)**
```
Usuario toca [CUIDAR]
    ↓
Mini-pantalla de cuidado:
  📊 Estado: [====== ] Felicidad 75%
  🍽️ Hambre: [===     ] 40% (necesita comer)
  💤 Energía: [====== ] 85%

Opciones:
  [🌮 DAR COMIDA] (gratis, 1x diaria)
  [🎁 VER ANUNCIO para comida premium] (+25% hambre)
  [💎 COMPRAR COMIDA ESPECIAL] ($0.99)
```

**Monetización punto 1:** Anuncio recompensado aquí (no intrusivo, beneficia mascota)

---

### **FASE 3: TRIVIA PRINCIPAL (8-10 min)**
```
[JUGAR] → Pantalla de Trivia Mexicana

Estructura de 1 ronda = 1 PALABRA MEXICANA:
┌─────────────────────────────────────┐
│ 🌮 ADIVINA LA PALABRA MEXICANA       │
├─────────────────────────────────────┤
│ Pista: "Comida de masa rellena"      │
│ Ejemplo: "Se come en Día de Muertos" │
│ Región: "Nacional"                   │
├─────────────────────────────────────┤
│ Teclado interactivo (9 letras)       │
│ T A M A L _ _ _ _                    │
│ [A] [C] [M] [E] [L] [Ñ]...          │
├─────────────────────────────────────┤
│ [💡 Pista -25🪙] [🔓 Revelar -50🪙]  │
│ [⭐ Completar -200🪙]                │
└─────────────────────────────────────┘

Si acierto:
  ✅ +50 monedas + 1 diamante
  ✅ Mascota come 20% más (felicidad +10%)
  ✅ Nivel de mascota +1 XP
  ✅ Racha diaria sigue activa ✓

Si me equivoco (2 intentos antes de perder):
  ❌ -10 monedas
  ❌ Mascota pierde 5% felicidad
  ❌ Puedo ver anuncio para recuperar 1 vida
```

**Ajuste Dinámico de Dificultad:**
- Usuarios nuevos: palabras cortas (TACO, POZOLE)
- Usuarios nivel 10+: palabras regionales oscuras
- Usuarios nivel 30+: palabras náhuatl, modismos históricos

**Duración:** 3-4 palabras por sesión = 8-10 minutos

---

### **FASE 4: RECOMPENSA & CIERRE (1 min)**
```
Después de jugar 3-4 palabras:
┌─────────────────────────────────────┐
│ 🎉 SESIÓN COMPLETADA                │
├─────────────────────────────────────┤
│ 📊 RECOMPENSAS:                      │
│   💰 +150 monedas                    │
│   💎 +3 diamantes                    │
│   🔥 RACHA: Día 15 ¡Sigue adelante!  │
│   🦅 Alebrijito lvl 12 (↑ +2 XP)     │
├─────────────────────────────────────┤
│ [📤 COMPARTIR EN REDES]              │
│ "Mi Alebrijito lleva 15 días. ¿Qué  │
│  va a ser el tuyo? 🇲🇽"             │
│ → Enlace de referral                │
├─────────────────────────────────────┤
│ [🏙️ VER MI CIUDAD] [🏠 VOLVER HOME] │
└─────────────────────────────────────┘
```

**Monetización punto 2:**
- Botón [COMPARTIR] → tracking de referrals
- Si ve anuncio antes: +2 monedas bonus

---

## 🦅 SISTEMA DE MASCOTA VIRTUAL

### **EVOLUCIÓN DEL ALEBRIJITO**

```
NIVEL 1-5: BABY ALEBRIJITO 👶
├─ Tamaño: pequeño, colores pastel
├─ Comportamiento: come frecuentemente
├─ Emoji representativo: 🐝
├─ Nombre sugerido: "Alebrijín"

NIVEL 6-15: ALEBRIJITO ADOLESCENTE 🦋
├─ Tamaño: mediano
├─ Colores más vibrantes
├─ Come menos, juega más
├─ Nombre sugerido: "Alebrijón"

NIVEL 16-30: ALEBRIJITO ADULTO 🦅
├─ Tamaño: grande y majestuoso
├─ Colores intensos, detalles mitológicos
├─ Inteligencia aumenta (da pistas en trivia)
├─ Nombre sugerido: "Alebrije Mítico"

NIVEL 31+: ALEBRIJITO LEGENDARIO ⭐
├─ Animaciones especiales
├─ Aura dorada/mágica
├─ Acceso a "Retos Legendarios"
├─ Nombre sugerido: "Alebrije Eterno"
```

### **MECÁNICAS DE INTERACCIÓN CON LA MASCOTA**

| Acción | Felicidad | Hambre | XP | Costo |
|--------|-----------|--------|----|----|
| Jugar 1 palabra | +15% | +20% | +10 | Gratis |
| Acariciar (3x/día) | +5% | - | - | Gratis |
| Dar comida común | - | -30% | - | Gratis (1x/día) |
| Dar comida premium | +10% | -50% | +5 | Ver anuncio |
| Compra outfit (IAP) | +20% | - | - | $0.99-2.99 |
| Juego mini (adivina emoji) | +8% | - | +5 | Gratis (2x/día) |

---

## 🏆 LEADERBOARDS & GAMIFICACIÓN SOCIAL

### **ARQUITECTURA DE COMPETENCIA EQUILIBRADA**

```
HOME SCREEN → 4 TABS:
┌────────────────────────────────────┐
│ [YO] [MI CIUDAD] [ESTADO] [AMIGOS] │
└────────────────────────────────────┘
```

---

### **TAB 1: YO (Personal - Siempre ganador)**
```
Mi Perfil Mexicanario
┌─────────────────────────────────────┐
│ 👤 Juan García | Lvl 12            │
│ Ubicación: México City, CDMX 📍     │
├─────────────────────────────────────┤
│ 🔥 RACHA: 15 días                   │
│ 🦅 Alebrijito: "Aztlán" (Lvl 12)    │
│ 📚 Palabras aprendidas: 145          │
│ 💎 Score acumulado: 8,450pts        │
│ 🎖️ Logros: 23/50                   │
├─────────────────────────────────────┤
│ ÚLTIMOS LOGROS:
│ ✅ Experto en Comida (50 palabras)
│ ✅ Racha de Oro (7 días sin fallar)
│ ✅ Cultura Regiones (10+ estados)
├─────────────────────────────────────┤
│ [SEGUIR COMPITIENDO] [VER LOGROS]  │
└─────────────────────────────────────┘
```

---

### **TAB 2: MI CIUDAD (LOCAL - Emotivamente poderoso)**

```
CDMX — Top 50 Jugadores 🏙️

🥇 1. Carolina López | Lvl 28 ⭐⭐⭐
     Score: 18,950 | Alebrijito: "Tenochtitlán"
     🔥 Racha: 42 días

🥈 2. Miguel Ángel | Lvl 24 ⭐⭐
     Score: 16,220 | Alebrijito: "Moctezuma"
     🔥 Racha: 31 días

🥉 3. Sofia Chen | Lvl 22 ⭐⭐
     Score: 14,890 | Alebrijito: "Frida"
     🔥 Racha: 28 días

4. TÚ (Juan García) | Lvl 12
   Score: 8,450 | Alebrijito: "Aztlán"
   🔥 Racha: 15 días
   ↑ POSITION THIS WEEK: +3 📈

5. Marco Polo | Lvl 11
   ...

[🏆 VER TOP 100] [👥 ENVIAR DESAFÍO]
```

**Psicología implementada:**
- Top 3 destacados con ⭐ (aspiración)
- "Tu posición" claramente marcada (aversión a pérdida: "Bajé 2 puestos esta semana")
- Botón [ENVIAR DESAFÍO] para gamificar rivalidad local

---

### **TAB 3: ESTADO (Regional - Rivalidad Sana)**

```
MÉXICO — Liga de Estados 🗺️

Reglas: Top 5 estados con más puntos acumulados
(de todos sus jugadores suma).

🥇 JALISCO         | 2,450,000 pts | 1,240 jugadores
    🎸 Banda famosa | Alimenta rivalidad cultural

🥈 CDMX           | 2,390,000 pts | 2,100 jugadores
    🌮 Capital del mundo

🥉 OAXACA         | 1,890,000 pts | 890 jugadores
    🌿 Tradición viva

4. YUCATÁN        | 1,670,000 pts | 750 jugadores
   🏛️ Legado maya

5. NUEVO LEÓN     | 1,560,000 pts | 920 jugadores
   🤠 Norte brazo

[DESAFÍO ESTATAL]
┌─────────────────────────────────┐
│ ⚔️ JALISCO vs CDMX              │
│ Una batalla semanal de cultura  │
│ Gana el estado con más puntos   │
│ en 7 días.                      │
│ PREMIO: Outfit temático gratis  │
│ para el estado ganador          │
└─────────────────────────────────┘
```

**Ventaja:** Crea tribalismo positivo. Los jaliscenses se invitan entre sí para vencer a CDMX.

---

### **TAB 4: AMIGOS (Cooperativa - Friend Streaks)**

```
MIS AMIGOS — Rachas Conjuntas 👫

[Conecta con Amigos]
├─ Invita vía WhatsApp / SMS
└─ Código referral: AZTLAN2025

RACHAS CON AMIGOS:
┌────────────────────────────────────┐
│ 👥 "Banda Mexicana"                │
│    (Grupo de 4 amigos)             │
├────────────────────────────────────┤
│ 🔥 RACHA GRUPAL: 21 días          │
│ Cada miembro que juega suma a la  │
│ racha grupal.                     │
│ Si 1 falla un día → racha se      │
│ congela pero NO se rompe.         │
│ (Salvavidas grupal)               │
├────────────────────────────────────┤
│ Miembros:                         │
│ ✅ Juan - Jugó hoy                 │
│ ❌ Marco - NO jugó (1/3 días)     │
│ ✅ Sofia - Jugó hoy                │
│ ⏳ Luis - Próximo turno            │
├────────────────────────────────────┤
│ RECOMPENSA GRUPAL (Cada 7 días):  │
│ Si el 75%+ del grupo juega:       │
│ +100 monedas PARA TODOS           │
│ + Outfit exclusivo "Alianza"      │
│                                   │
│ BONO: Si llegan a 50 días → Cuero│
│ alebrijito temático "Hermandad"   │
└────────────────────────────────────┘

[CREAR GRUPO] [VER MIS AMIGOS]
```

**Retención viral:** Si Luis no juega, sus 3 amigos le escriben: "¡Ey! ¡Rompiste la racha!" Presión social positiva.

---

## 💰 MONETIZACIÓN HÍBRIDA EXACTA

### **ESTRUCTURA DE INGRESOS**

```
Total MRR Goal: $50K-200K
├─ 40% Rewarded Video Ads
├─ 35% In-App Purchases (IAP Cosméticas)
├─ 15% Premium Suscripción
└─ 10% One-time Purchases
```

---

### **ANUNCIOS RECOMPENSADOS (No Intrusivos)**

| Momento | Tipo | Duración | Recompensa | Frecuencia |
|---------|------|----------|-----------|------------|
| **Cuidado mascota** | 15-30s | Ver anuncio | Comida premium (+25% hambre) | 1x/día |
| **Recuperar vida** | 15-30s | Ver anuncio | +1 vida / +1 intento en trivia | 3x/día |
| **Pista trivia** | 15-30s | Ver anuncio | Revelar 1 letra | 2x/sesión |
| **Boost racha** | 30s | Ver anuncio | Congelador de racha (1 día gratis) | 1x semana |
| **Post-sesión** | 15-30s | Ver anuncio | +50 monedas bonus | 1x/día |
| **Competencia amigo** | 15-30s | Ver anuncio | Doble puntos en desafío | 2x/semana |

**Implementación clave:**
- Cada anuncio = beneficio TANGIBLE para la mascota o el juego
- Nunca obligatorio para progresar
- Opción clara [Ver anuncio] vs [Pagar con monedas]

**Estimación RPM (Revenue Per Mille ads):** $3-8 (juegos casuales mexicanos)
- 500K DAU × 1.5 ads/día = 750K ads/día
- $5 RPM × 750 ads = **$3,750/día = $112,500/mes solo en ads**

---

### **IN-APP PURCHASES (IAP) - COSMÉTICAS**

**Tier 1: Outfit Alebrijito ($0.99-1.99)**
```
🧥 OUTFITS TEMÁTICOS (10+ opciones):
├─ "Charro Mexicano" ($0.99)
├─ "Frida Kahlo" ($0.99)
├─ "Día de Muertos" ($1.99)
├─ "Viaje del Héroe Náhuatl" ($1.99)
├─ "Mariachi Dorado" ($1.99)
└─ "Alebrije Prehispánico" ($2.99)

Función:
- Cambio visual del alebrijito
- +2% felicidad permanente
- Acceso a animaciones exclusivas
- Badge en leaderboard ("Charro de CDMX")
```

**Tier 2: Accesorios ($0.49-0.99)**
```
🎀 ACCESORIOS:
├─ Collar de Jade ($0.49)
├─ Sombrero Veracruzano ($0.49)
├─ Corona de Flores ($0.99)
├─ Alas de Mariposa Monarca ($0.99)
└─ Anillo de Obsidiana ($1.99)

Función: Customización pura (sin bonus gameplay)
```

**Tier 3: Fondos de Pantalla ($1.99-2.99)**
```
🖼️ FONDOS:
├─ Trajineras de Xochimilco ($1.99)
├─ Pirámide de Chichén Itzá ($1.99)
├─ Fresco de Teotihuacán ($2.99)
├─ Mercado de Oaxaca ($2.99)
└─ Noches de Veracruz ($2.99)

Función: Customización visual global
```

**Tier 4: Paquetes Bundle (Mejor valor, $4.99-9.99)**
```
🎁 PACKS EXCLUSIVOS:
├─ "Revolución Mexicana" =
│   Outfit Revolucionario +
│   Fondo Muralismo +
│   300 monedas bonus
│   ($4.99 | Ahorro: 30%)
│
├─ "Patrimonio Mundial" =
│   3 Outfits Premium +
│   5 Accesorios +
│   Fondo Patrimonio +
│   500 monedas
│   ($9.99 | Ahorro: 40%)
│
└─ "Viajero Cultural" =
│   Salva racha 7 días +
│   Outfit "Viajero" +
│   200 monedas
│   ($5.99)
```

**Pricing Psychology:**
- $0.99: Impulse buy (gato de bajo riesgo)
- $1.99: Outfits premium (sweet spot)
- $4.99-9.99: Bundles (mejor percepción de valor)

**Estimación IAP Revenue:**
- 500K DAU × 15% conversion rate = 75K compradores/mes
- Ticket promedio: $2.50 (mezcla de tiers)
- **$187,500/mes en IAP**

---

### **SUSCRIPCIÓN PREMIUM (Paymium)**

```
MEXICANARIO PLUS — $2.99/mes (anual: $24.99)

BENEFICIOS:
✅ Sin anuncios intrusivos (mantiene rewarded ads)
✅ +2x monedas por victoria
✅ 1 congelador de racha GRATIS cada mes
✅ Acceso a "Nivel Legendario" (retos especiales)
✅ Outfit exclusivo mensual (solo Plus)
✅ Chat prioritario con soporte

CROSS-SELL STRATEGY:
Mostrar [Upgrade a Plus] cuando:
  - Usuario ve anuncio 3x en un día
  - Pierde racha de 7+ días
  - Intenta comprar outfit premium
```

**Estimación Suscripción:**
- 500K DAU × 8% conversion = 40K suscriptores activos
- $2.99 × 40K = **$119,600/mes en suscripción**

---

### **MONETIZACIÓN TOTAL PROYECTADA (Mes 1)**

```
📊 REVENUE PROYECTADO MES 1:
├─ Anuncios Recompensados:   $112,500 (40%)
├─ IAP Cosméticas:           $187,500 (35%)
├─ Suscripción Premium:      $119,600 (22%)
└─ One-time Purchases:        $55,400 (3%)
═════════════════════════════════════
   TOTAL: ~$475,000/mes

   MRR Realista (sin viral): $50K-120K
   MRR Optimista (con viral): $200K-500K
```

---

## 🔥 ESTRATEGIA DE RETENCIÓN (STREAKS)

### **PROBLEMA CRÍTICO: Burnout y Churn por Racha Perdida**

Datos de Duolingo: El 30% de usuarios que pierden racha de 7+ días desinstalan la app en 2 semanas.

### **SOLUCIÓN: Arquitectura de "Racha Flexible"**

```
SISTEMA DE STREAKS MEXICANARIO:

1️⃣ RACHA ACTIVA
   └─ Visible, emocionante (🔥🔥🔥)
   └─ Se rompe si no juegas en 24h

2️⃣ RACHA CONGELADA (Salvavidas)
   ├─ Usuario no juega → Racha se "congela"
   ├─ Duración: Depende del "Almuleto"
   └─ Automático 1x semana GRATIS
       (ej: viernes-domingo se congela automáticamente)

3️⃣ AMULETO DE RACHA (Premium Currency)
   ├─ Costo: 50 diamantes (compra o anuncio)
   ├─ Efecto: Congela racha por 1 día
   ├─ Visible en UI: "Amuletos disponibles: 2"
   └─ Uso: Anti-frustración máxima
```

**Implementación Visual:**

```
Home Screen - Racha Activa:
┌───────────────────────────────┐
│ 🔥🔥🔥🔥🔥 DÍA 15              │
│ "¡Vas a la vanguardia!"       │
│                               │
│ ⏰ Próxima racha en: 22h 45min │
│ 💎 Amuletos: 2 disponibles    │
└───────────────────────────────┘

Si no juega en 24h:
┌───────────────────────────────┐
│ ❄️ RACHA CONGELADA            │
│ "Tu racha está segura hoy"    │
│ (imagen de alebrije durmiendo) │
│                               │
│ ⏰ Se descongela en: 12h       │
│ [USAR AMULETO] [JUGAR AHORA] │
└───────────────────────────────┘
```

---

## 🚀 DINÁMICAS SOCIALES INNOVADORAS

### **IDEA 1: "Reto de Región" (Viral + Educativo)**

```
MECANISMO:
Cada semana = 1 región mexicana elegida al azar.
Ej: "Semana de Yucatán 🏛️"

DESAFÍO:
- Aprende 5 palabras yucatecas
- Compite en leaderboard SOLO de Yucatán
- Comparte tu Alebrijito con outfit "Maya"

RECOMPENSA:
✅ Outfit regional exclusivo (limitado)
✅ +200 monedas si completas
✅ Tu nombre en "Héroe de Yucatán" (hall of fame)
✅ Notificación a todos los jugadores de Yucatán

SHARE ORGÁNICO:
"🏛️ Acabo de ser 'Héroe de Yucatán' en Mexicanario.
¿Cuántas regiones puedes conquistar?
[Descarga Mexicanario] 🇲🇽"
→ Tracking: conversión de referral region-específica
```

**Por qué funciona:**
- Gamifica el aprendizaje de regiones
- Crea FOMO ("Llega otro a mi región, voy a perder")
- Share es orgánico (genuina celebración, no spam)
- Genera cohesión regional

---

### **IDEA 2: "Misión de la Mascota" (Narrative Gamification)**

```
CONTEXTO NARRATIVO:
Tu Alebrijito es "Guardián de la Cultura Mexicana".
Debe completar MISIONES para proteger tradiciones.

EJEMPLO DE MISIÓN (Semanal):

┌─────────────────────────────────────┐
│ 🦅 MISIÓN: "Salvaguarda de Comidas" │
│                                     │
│ Tu Alebrijito debe aprender sobre  │
│ 10 comidas prehispánicas antes de  │
│ que se olviden para siempre.       │
│                                     │
│ Palabras: Pozole, Chocolate,       │
│ Tlayuda, Mole, Tamale...           │
│                                     │
│ 🔁 PROGRESO: 3/10 palabras         │
│ ⏰ Plazo: 7 días                    │
│                                     │
│ RECOMPENSA AL COMPLETAR:           │
│ ✅ Outfit "Guardián de Comidas"    │
│ ✅ 300 monedas                     │
│ ✅ Badge "Protector" en perfil     │
│ ✅ Doble XP en próximas 3 palabras │
└─────────────────────────────────────┘

COMPARTIBLE:
"🦅 Mi Alebrijito protege la comida
mexicana. ¿El tuyo está listo para su
misión cultural? [DESCARGAR]"
→ Link con contexto: "Misión: Comidas"
```

**Psicología:**
- **Narrativa de propósito:** No es "adivina palabras", es "salva tu cultura"
- **Urgencia temporal:** "Antes de que se olviden" = FOMO genuino
- **Progreso visible:** Barra 3/10 = dopamina cada palabra
- **Shareable sin spam:** Hablando de misión cultural, no del juego

---

## 📅 ROADMAP DE IMPLEMENTACIÓN (Fases)

### **FASE 1: MVP (Meses 1-2)**
- [x] Core loop trivia + mascota básica
- [ ] Leaderboard MI CIUDAD (local storage first)
- [ ] 3 anuncios recompensados (cuidado, vida, pista)
- [ ] 5 outfits IAP
- [ ] Racha simple (sin congelación)
- [ ] Push notifications básicas

**Target:** 10K users, $5K MRR

---

### **FASE 2: Retención & Social (Meses 3-4)**
- [ ] Racha Congelada + Amuletos
- [ ] Leaderboard ESTADO (backend real)
- [ ] Friend Streaks (rachas grupales)
- [ ] Misión semanal de Región
- [ ] Suscripción Premium
- [ ] 10+ outfits totales

**Target:** 100K users, $50K MRR

---

### **FASE 3: Viral & Monetización (Meses 5-6)**
- [ ] Analytics de referral por región
- [ ] Sistema de invitación con recompensa
- [ ] Reto de Región semanal
- [ ] Chat integrado (amigos)
- [ ] Logros expandidos (50+)
- [ ] Seasonal events (Día de Muertos, Navidad)

**Target:** 500K users, $120K MRR

---

### **FASE 4: Expansión Latinoaméricana (Mes 7+)**
- [ ] Localización: palabras de otros países
- [ ] Leaderboard por país (Méx, Col, Arg, etc.)
- [ ] Batallas país vs país (Reto Regional XL)
- [ ] Traducción múltiples idiomas
- [ ] Partnerships con influencers regionales

**Target:** 2M+ users, $500K MRR

---

## 📊 MÉTRICAS CLAVE A MONITOREAR

```
RETENCIÓN:
├─ D1 (Day 1 Retention): Target 40%+
├─ D7: Target 20%+
├─ D30: Target 8%+
└─ Churn por "Pérdida de Racha": Target <5%

ENGAGEMENT:
├─ Sesiones/día: Target 1.2+
├─ Sesión duración: 10-15 minutos
├─ Words guessed/mes: 20+ por usuario activo
└─ Racha promedio: 10+ días

MONETIZACIÓN:
├─ ARPU (Average Revenue Per User): Target $2-5
├─ Conversion a pago: Target 8-15%
├─ LTV (Lifetime Value): Target $15-30
└─ Payback period: <30 días

VIRAL:
├─ Invitations sent: 0.5 por usuario
├─ Conversion referral: 25%+
├─ K-factor (viral coefficient): 1.2+
└─ Organic growth %: 30%+ del total
```

---

## 🎬 CONCLUSIÓN

**Mexicanario** es más que un juego: es una **plataforma de conexión cultural que monetiza emoción, no frustración**.

Cada elemento está diseñado para:
1. **Retener:** Racha flexible, mascota emotiva, narrativa de propósito
2. **Monetizar:** 4 canales sin hard paywalls
3. **Viralizar:** Share orgánico por narrativa y logros regionales
4. **Escalar:** Arquitectura lista para Latinoamérica

**Proyección conservadora (Año 1):**
- 500K DAU
- $50-120K MRR
- Churn < 3% mensual
- Net Score 50+

**Proyección agresiva (con viral):**
- 2M+ DAU
- $200-500K MRR
- Posibilidad de Series A

---

**Documento preparado por: Lead Game Designer**
**Versión: 2025**
**Última actualización: Febrero 2026**
