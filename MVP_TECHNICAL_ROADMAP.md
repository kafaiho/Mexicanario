# 🚀 MEXICANARIO — MVP Technical Roadmap
## Features Priorizadas por Sprint (8 semanas)

---

## 📊 RESUMEN EJECUTIVO

**MVP Goal:** Juego funcional + mascota básica + leaderboard local + anuncios simples

**Timeline:** 8 semanas (2 meses)

**Team Size:** 2-3 dev (React Native) + 1 backend (Convex) + 1 QA

**Tech Stack:**
- Frontend: React Native + Expo
- Backend: Convex (ya implementado ✅)
- Database: Convex managed DB
- Ads: Google AdMob / Meta Audience Network
- Analytics: Amplitude + Firebase

---

## 🎯 DEFINICIÓN DE "MVP VIABLE"

### Mínimo para Launch:
- ✅ Core Loop (trivia + recompensas)
- ✅ Mascota simple (3 estados: feliz/normal/triste)
- ✅ Racha diaria
- ✅ Leaderboard MI CIUDAD (top 50)
- ✅ 1 anuncio recompensado
- ✅ 2-3 outfits IAP
- ⚠️ Sin Friend Streaks (Fase 2)
- ⚠️ Sin Misiones narrativas (Fase 2)
- ⚠️ Sin Suscripción Premium (Fase 2)

**Usuarios target MVP:** 1K-10K beta testers

---

## 📅 SPRINT BREAKDOWN (8 Semanas)

---

## 🔴 SPRINT 1-2: CORE GAMEPLAY (Semanas 1-2)

### **Features a entregar:**

#### **Feature 1.1: Pantalla HOME con Mascota**
```
Prioridad: CRÍTICA
Effort: 5 puntos
Assignee: React Native Dev

Specs:
├─ Componente Mascota visual (3 emojis básicos)
│  ├─ Feliz 😊 (verde)
│  ├─ Normal 😐 (gris)
│  └─ Triste 😢 (rojo)
├─ Barra de felicidad (0-100%)
├─ Barra de hambre (0-100%)
├─ Display de racha diaria (contador)
├─ 4 botones principales:
│  ├─ [JUGAR]
│  ├─ [CUIDAR]
│  ├─ [LEADERBOARD]
│  └─ [PERFIL]
└─ Estado persistente en AsyncStorage

Datos que persisten:
├─ currentLevel (número)
├─ mascotaName (string)
├─ mascotaHappiness (0-100)
├─ mascotaHunger (0-100)
├─ streakDays (número)
├─ lastPlayedDate (timestamp)
└─ totalCoinsEarned (número)

Design: [Figma reference]
Testing: Unit tests para persistencia
```

**Acceptance Criteria:**
- [ ] Mascota renderiza correctamente en 3 estados
- [ ] Barras de hambre/felicidad actualizan visualmente
- [ ] Datos persisten al cerrar/abrir app
- [ ] Emoji semanal animado (bounce suave)
- [ ] Performance: <100ms render time

---

#### **Feature 1.2: Componente Trivia Mejorado**
```
Prioridad: CRÍTICA
Effort: 8 puntos
Assignee: React Native Dev + Backend Dev

Cambios sobre código actual:
├─ Leer palabras desde Convex API
│  ├─ Endpoint: api.levels.getWordByLevel(level)
│  └─ Respuesta: { word, meaning, example, region, levelNumber }
├─ Mostrar progreso: "Palabra X/3 en esta sesión"
├─ Recompensas dinámicas por corrección:
│  ├─ Acierto: +50 monedas + 1 diamante + mascota +10% hambre
│  ├─ Fallo: -10 monedas + mascota -5% felicidad
│  └─ Skip: -25 monedas (opcional, evitar abuse)
├─ Contador de vidas: 3 intentos por palabra
│  └─ Si pierdes vida: [VER ANUNCIO] para +1 vida
├─ Botones de pista:
│  ├─ [💡 Ver pista -25🪙]: Muestra first letter
│  ├─ [🔓 Revelar -50🪙]: Muestra 2 letras random
│  └─ [⭐ Completar -200🪙]: Gana automáticamente
└─ Post-sesión summary:
   ├─ Palabras acertadas: X/3
   ├─ Monedas ganadas: +150
   ├─ Racha: Día 5 ✓
   └─ [COMPARTIR] [CONTINUAR]

Backend: CONVEX CHANGES
├─ Asegurar que words.ts tiene category field
├─ Query: getRandomWords(count, difficulty)
│  └─ Parámetro difficulty: "easy" | "medium" | "hard"
└─ Mutation: recordGameSession(userId, wordsPlayed, coinsEarned)
   └─ Guarda en DB cada sesión para analytics

Testing:
├─ Unit: correctAnswer(), wrongAnswer() logic
├─ Integration: API calls a Convex
├─ UI: Renderizado de pistas, vidas
└─ E2E: Flujo completo juego hasta resumen
```

**Acceptance Criteria:**
- [ ] Palabras cargan desde Convex correctamente
- [ ] Recompensas actualizan monedas/diamantes
- [ ] Mascota come después de acertar (hambre -20%)
- [ ] Vidas se recuperan con anuncio
- [ ] Resumen post-sesión muestra datos correctos

---

#### **Feature 1.3: Sistema de Racha Básico**
```
Prioridad: ALTA
Effort: 3 puntos
Assignee: React Native Dev

Specs:
├─ Almacenar lastPlayedDate en AsyncStorage
├─ Lógica:
│  ├─ Si hoy - lastPlayedDate = 1 día → streakDays++
│  ├─ Si hoy - lastPlayedDate > 1 día → streakDays = 0 (❌ perdida)
│  └─ Si hoy = lastPlayedDate → no cambiar
├─ Visual: Mostrar "🔥 Día X" en HOME
├─ Color: Rojo si está en peligro (<2h para romper)
└─ Notificación: Push cada día a las 8AM
   └─ "Tu Alebrijito te espera 🦅"

Datos en Convex user schema:
├─ streakDays: number
├─ lastPlayedDate: timestamp
└─ maxStreakEver: number (record)

Testing:
├─ Unit: Lógica de cálculo de racha
├─ Mock dates para testing
└─ Verificar push notifications
```

**Acceptance Criteria:**
- [ ] Racha incrementa correctamente cada día
- [ ] Racha se resetea si pasan >24h
- [ ] lastPlayedDate actualiza al jugar
- [ ] Push notification se envía diariamente

---

### **Testing & QA Sprint 1-2:**
- Smoke testing en emulator iOS/Android
- Performance: <2s startup time
- Battery: <5% drain por sesión de 10min
- Network: Funciona offline (cached data)

---

## 🟠 SPRINT 3-4: LEADERBOARDS LOCALES (Semanas 3-4)

### **Feature 2.1: Leaderboard MI CIUDAD**
```
Prioridad: ALTA
Effort: 13 puntos
Assignee: React Native Dev + Backend Dev (principal)

BACKEND: CONVEX NEW QUERY

export const getLeaderboard = query({
  args: {
    city: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Query users filtered by city
    const users = await ctx.db.query("users")
      .filter(q => q.eq(q.field("city"), args.city))
      .collect();

    // 2. Calculate score per user
    const leaderboardData = users.map(user => {
      const totalScore = user.coinsEarned + (user.diamondsEarned * 10);
      return {
        userId: user._id,
        name: user.name,
        level: user.currentLevel,
        city: user.city,
        score: totalScore,
        streakDays: user.streakDays,
        mascotaName: user.mascotaName,
        rank: 0 // será calculado después de sort
      };
    });

    // 3. Sort by score DESC
    leaderboardData.sort((a, b) => b.score - a.score);

    // 4. Add ranking
    leaderboardData.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    // 5. Return top N
    return leaderboardData.slice(0, args.limit);
  }
});
```

FRONTEND: React Native Component

```jsx
// LeaderboardScreen.tsx

interface LeaderboardEntry {
  rank: number;
  name: string;
  mascotaName: string;
  score: number;
  streakDays: number;
  isMe?: boolean;
}

export function LeaderboardTab() {
  const { userId, user } = useAuth();
  const [city, setCity] = useState(user?.city);
  const leaderboard = useQuery(api.leaderboard.getLeaderboard, {
    city,
    limit: 50
  });

  const findMyRank = () => {
    return leaderboard?.findIndex(entry => entry.userId === userId);
  };

  return (
    <ScrollView>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Top 50 — {city}</Text>
        <TouchableOpacity onPress={() => setCity(user?.city)}>
          <Text>📍 Cambiar ciudad</Text>
        </TouchableOpacity>
      </View>

      {/* Tu ranking */}
      <View style={styles.myRankCard}>
        <Text style={styles.myRankLabel}>Tu posición</Text>
        <Text style={styles.myRankNumber}>
          #{findMyRank() + 1}
        </Text>
      </View>

      {/* Leaderboard list */}
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => (
          <LeaderboardRow
            rank={index + 1}
            entry={item}
            isMe={item.userId === userId}
          />
        )}
      />
    </ScrollView>
  );
}

function LeaderboardRow({ rank, entry, isMe }) {
  const medal =
    rank === 1 ? "🥇" :
    rank === 2 ? "🥈" :
    rank === 3 ? "🥉" :
    `${rank}`;

  return (
    <View style={[
      styles.row,
      isMe && styles.rowHighlight
    ]}>
      <Text style={styles.rankBadge}>{medal}</Text>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{entry.name}</Text>
        <Text style={styles.userLevel}>Lvl {entry.level}</Text>
      </View>

      <View style={styles.statsRight}>
        <Text style={styles.score}>{entry.score} pts</Text>
        <Text style={styles.streak}>🔥 {entry.streakDays}d</Text>
      </View>

      {isMe && <Text style={styles.youBadge}>TÚ</Text>}
    </View>
  );
}
```

Specs:
├─ Endpoint refresh: cada 5 minutos (lazy load)
├─ Caché local: guardar en AsyncStorage
├─ Mostrar TOP 3 con medallitas (🥇🥈🥉)
├─ Resaltar fila actual (isMe: true) con fondo color
├─ Pull-to-refresh gesture
└─ Indicador "↑ Subiste 2 puestos esta semana"

Testing:
├─ Query Convex: verificar filtrado por city
├─ FlatList rendering: performance con 50+ items
└─ Sorting: score calculation correcto
```

---

#### **Feature 2.2: Geolocalización Automática**
```
Prioridad: MEDIA
Effort: 5 puntos
Assignee: React Native Dev

Lib: react-native-geolocation-service

On first launch:
├─ Pedir permiso GPS
├─ Obtener coordenadas
├─ Reverse geocode a ciudad (Google Maps API)
├─ Guardar city en user.city (Convex)
└─ Mostrar: "¿Eres de CDMX?" [SÍ] [CAMBIAR]

Alternativa manual:
├─ Si usuario rechaza GPS
├─ Dropdown de ciudades principales:
│  ├─ CDMX
│  ├─ Guadalajara
│  ├─ Monterrey
│  ├─ Cancún
│  ├─ Otros...
│  └─ [Buscar mi ciudad]
└─ Guardar selección

Backend Convex:
├─ UPDATE user.city (mutation)
└─ Validar city contra lista de ciudades mexicanas

Testing:
├─ Permission flow en Android/iOS
├─ Reverse geocoding accuracy
└─ Manual selection UX
```

---

### **Testing & QA Sprint 3-4:**
- Query performance: <1s load time para 50 entries
- Sorting: verificar matemáticas de score
- Network: caché fallback si sin conexión
- Stress: 100K usuarios en BD

---

## 🟡 SPRINT 5-6: ANUNCIOS & IAP (Semanas 5-6)

### **Feature 3.1: Anuncios Recompensados (Rewarded Video)**
```
Prioridad: CRÍTICA
Effort: 8 puntos
Assignee: React Native Dev

Lib: react-native-google-mobile-ads

Setup:
├─ Crear cuenta Google AdMob
├─ Registrar app iOS/Android
├─ Crear 3 Ad Units (Rewarded):
│  ├─ "rewarded_mascota" (comida)
│  ├─ "rewarded_vidas" (vidas en trivia)
│  └─ "rewarded_pista" (pista en trivia)
└─ Guardar AD_UNIT_IDs en env variables

Implementación punto 1: CUIDAR MASCOTA

```jsx
// CareScreen.tsx

const handleWatchAdForFood = async () => {
  const rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.mascota);

  rewardedAd.onAdEvent((type, error) => {
    if (type === RewardedAdEventType.LOADED) {
      rewardedAd.show();
    }
  });

  rewardedAd.onUserEarnedReward((reward) => {
    // Usuario completó anuncio
    updateMascotaHunger(-25); // mascota come
    updateUserCoins(+50); // bonus por mirar
    Toast.show("¡Alebrijito comió! +50 monedas");
    recordAdEvent('mascota_food_watched');
  });

  rewardedAd.load();
};

// UI Button
<TouchableOpacity
  style={styles.adButton}
  onPress={handleWatchAdForFood}
>
  <Text>📺 Ver anuncio para comida (+50🪙)</Text>
</TouchableOpacity>
```

Implementación punto 2: RECUPERAR VIDAS (Trivia)

```jsx
const handleWatchAdForLife = async () => {
  // Similar flow
  rewardedAd.onUserEarnedReward(() => {
    setLives(lives + 1);
    updateUserCoins(+30);
    recordAdEvent('trivia_life_watched');
  });
};
```

Backend Tracking (Convex mutation):

```typescript
export const recordAdEvent = mutation({
  args: {
    userId: v.string(),
    adType: v.string(), // "mascota_food" | "trivia_life" | etc
    coinsRewarded: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("adEvents", {
      userId: args.userId,
      adType: args.adType,
      coinsRewarded: args.coinsRewarded,
      timestamp: Date.now(),
    });
  }
});
```

Specs:
├─ Max 3 anuncios recompensados por día (evitar fatiga)
├─ Cooldown 4 horas entre anuncios
├─ Tracking: adEvents table (para analytics)
├─ Fallback: Si no carga anuncio, dar 50% de reward
└─ Analytics: track fill rate, reward rate

Testing:
├─ AdMob test mode (para no contaminar estadísticas reales)
├─ Reward triggering: verificar DB update
├─ Frequency capping: max 3/día
└─ Network: funciona sin conexión (cached)
```

---

#### **Feature 3.2: In-App Purchases (IAP) - Outfits**
```
Prioridad: ALTA
Effort: 10 puntos
Assignee: React Native Dev

Lib: react-native-iap

Setup:
├─ Apple App Store: Create In-App Purchase Products
│  ├─ "outfit.charro" ($0.99)
│  ├─ "outfit.frida" ($0.99)
│  ├─ "outfit.diademuertos" ($1.99)
│  └─ Consumable o Non-consumable: NON-CONSUMABLE
├─ Google Play: Similar setup
└─ Guardar product IDs en env

Schema Convex (user purchases):

```typescript
interface User {
  _id: Id<"users">;
  userId: string;
  ownedOutfits: ["outfit.charro", "outfit.frida"];
  currentOutfit: "outfit.charro" | null;
  // ... resto de fields
}
```

Frontend: Tienda de Outfits

```jsx
// OutfitShopScreen.tsx

const OUTFITS = [
  {
    id: "outfit.charro",
    name: "Charro Mexicano",
    price: 0.99,
    emoji: "🤠",
    description: "Traje tradicional",
  },
  {
    id: "outfit.frida",
    name: "Frida Kahlo",
    price: 0.99,
    emoji: "🌸",
    description: "Icono cultural",
  },
  // ... más outfits
];

export function OutfitShop() {
  const { user } = useAuth();
  const [purchasingId, setPurchasingId] = useState(null);

  const handleBuyOutfit = async (outfitId: string) => {
    try {
      setPurchasingId(outfitId);

      const products = await getProducts({ skus: [outfitId] });
      const product = products[0];

      if (!product) {
        Alert.alert("Error", "Producto no encontrado");
        return;
      }

      await requestPurchase({ sku: outfitId });

      // Si llega aquí, compra fue exitosa
      await recordOutfitPurchase(user._id, outfitId);

      Toast.show("¡Outfit desbloqueado!");
      setPurchasingId(null);

    } catch (e) {
      if (e.code !== PurchaseErrorCodeIOS.USER_CANCELLED) {
        Alert.alert("Error", e.message);
      }
    }
  };

  return (
    <FlatList
      data={OUTFITS}
      renderItem={({ item }) => {
        const owned = user?.ownedOutfits?.includes(item.id);
        const isEquipped = user?.currentOutfit === item.id;

        return (
          <View style={styles.outfitCard}>
            <Text style={styles.outfitEmoji}>{item.emoji}</Text>
            <Text style={styles.outfitName}>{item.name}</Text>
            <Text style={styles.outfitDesc}>{item.description}</Text>

            {!owned ? (
              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => handleBuyOutfit(item.id)}
                disabled={purchasingId === item.id}
              >
                <Text style={styles.buyBtnText}>
                  ${item.price}
                </Text>
              </TouchableOpacity>
            ) : isEquipped ? (
              <View style={styles.equippedBadge}>
                <Text>✓ Equipado</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.equipBtn}
                onPress={() => equipOutfit(item.id)}
              >
                <Text>Equipar</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
    />
  );
}
```

Backend Mutation:

```typescript
export const recordOutfitPurchase = mutation({
  args: {
    userId: v.string(),
    outfitId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as any);

    if (!user) return { success: false };

    const updatedOutfits = [
      ...(user.ownedOutfits || []),
      args.outfitId
    ];

    await ctx.db.patch(user._id, {
      ownedOutfits: updatedOutfits,
    });

    // Tracking para analytics
    await ctx.db.insert("purchases", {
      userId: args.userId,
      outfitId: args.outfitId,
      price: 0.99, // hardcode por ahora
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
```

Specs:
├─ Mostrar: "Tienes X outfits desbloqueados"
├─ Visual: preview mascota con outfit
├─ Transacciones: refund handling (Apple/Google)
├─ Validation: verificar compra antes de guardar
└─ Analytics: track conversión, average order value

Testing:
├─ Sandbox mode (Apple/Google test accounts)
├─ Purchase flow completo
├─ Refund handling
└─ Offline: queue de transacciones pendientes
```

---

### **Testing & QA Sprint 5-6:**
- AdMob: test mode funcionando
- IAP: test purchase en iOS/Android sandbox
- Payment security: validar receipts en backend
- Revenue tracking: integración con analytics

---

## 🟢 SPRINT 7-8: PULIDO & BETA LAUNCH (Semanas 7-8)

### **Feature 4.1: Perfil de Usuario**
```
Prioridad: MEDIA
Effort: 4 puntos

Mostrar:
├─ Avatar (inicial de nombre)
├─ Nombre y ciudad
├─ Nivel actual
├─ Total palabras aprendidas
├─ Mejor racha ever (record)
├─ Logros desbloqueados (early version)
└─ [EDITAR] [LOGOUT]

Editable:
├─ Nombre
├─ Ciudad (cambiar)
└─ Mascota name
```

---

#### **Feature 4.2: Notificaciones Push**
```
Prioridad: ALTA
Effort: 6 puntos

Setup:
├─ Firebase Cloud Messaging (FCM)
├─ Registrar app en Firebase console
└─ Guardar FCM token en user.fcmToken

Triggers:
├─ Daily: "Tu Alebrijito te espera 🦅" (8 AM)
├─ Racha en peligro: "¡Tu racha vence en 2h!" (22 PM)
├─ Nuevo outfit: "¡Nuevo outfit disponible!"
└─ Seasonal: "¡Evento Día de Muertos!"

Backend: Convex cron job

```typescript
export const sendDailyReminders = action({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      if (!user.fcmToken) continue;

      const lastPlayed = user.lastPlayedDate;
      const hoursAgo = (Date.now() - lastPlayed) / (1000 * 60 * 60);

      if (hoursAgo > 20) {
        // Enviar notificación
        await sendPushNotification({
          token: user.fcmToken,
          title: "Tu Alebrijito te extraña 🦅",
          body: `Tu racha de ${user.streakDays} días está en peligro!`,
        });
      }
    }
  }
});
```

Testing:
├─ Push delivery: verificar en devices reales
├─ Rate: no más de 1 push/día por user
└─ Opt-in: user puede desactivar desde settings
```

---

#### **Feature 4.3: Analytics & Tracking**
```
Prioridad: ALTA
Effort: 5 puntos

Lib: Amplitude (free tier soporta 100K events/mes)

Key Events a Trackear:

```
- app_opened (daily active)
- trivia_word_played
- trivia_word_correct
- trivia_word_wrong
- mascota_pet_played
- ad_watched (type: mascota, vida, pista)
- outfit_purchased
- leaderboard_viewed
- user_streak_lost
- streak_days (property para cohorting)
```

Código:

```javascript
import * as Amplitude from "@amplitude/react-native";

await Amplitude.Amplitude.getInstance().init(AMPLITUDE_KEY);

// En cada evento importante:
Amplitude.Amplitude.getInstance().logEvent("trivia_word_correct", {
  wordDifficulty: "medium",
  coinsEarned: 50,
  attemptCount: 2,
  streakDays: 15,
});
```

Dashboard:
├─ DAU/MAU
├─ Retention cohorts
├─ Conversion funnels (signup → first game → outfit purchase)
└─ Custom: "% de usuarios que rompen racha antes de día 7"

Testing:
├─ Event logging en development mode
└─ Dashboard: verificar datos reales después de launch
```

---

#### **Feature 4.4: Optimizaciones de Performance**
```
Prioridad: MEDIA
Effort: 4 puntos

Checklist:
├─ Lazy load mascota sprite (solo cargar cuando visible)
├─ Memoize componentes: LeaderboardRow, TrivaCard
├─ Code splitting: LeaderboardScreen en bundle separado
├─ Image optimization: assets <50KB cada uno
├─ Network: cache queries Convex por 5 minutos
└─ Memory: liberar listeners en unmount

Bundle size target: <10MB para iOS, <15MB para Android
```

---

### **Testing & QA Sprint 7-8:**

#### **Checklist de QA:**

**Functional:**
- [ ] Core loop: jugar 3 palabras de principio a fin
- [ ] Mascota: hambre/felicidad actualiza correctamente
- [ ] Racha: se incrementa y resetea según lógica
- [ ] Leaderboard: top 50 carga en <2s
- [ ] Anuncios: cargan y rewarded es correcta
- [ ] IAP: compra completa y outfit aparece

**Performance:**
- [ ] App startup: <3s
- [ ] Trivia UI: smooth 60fps
- [ ] Leaderboard scroll: smooth con 50 items
- [ ] Memoria: no crece >100MB
- [ ] Battery: <8% en 10min sesión

**Compatibility:**
- [ ] iOS 14+
- [ ] Android 8+
- [ ] Phones 5"+ y 6.7"+
- [ ] Landscape y portrait

**Edge Cases:**
- [ ] Sin conexión internet
- [ ] Low memory device
- [ ] Ads no cargan
- [ ] User rechaza GPS

---

## 📱 CHECKLIST PRE-LAUNCH

```
SEMANA 8 — Antes de publiscar a TestFlight/Google Play:

Backend:
├─ [ ] Convex DB migrations testeadas
├─ [ ] Backup strategy en lugar
├─ [ ] Rate limiting en APIs
├─ [ ] Error logging centralizado
└─ [ ] Production environment variables

Frontend:
├─ [ ] Remove console.logs
├─ [ ] Update versionCode/versionName
├─ [ ] Configurar signing keys (iOS/Android)
├─ [ ] TestFlight/Play Console app setup
└─ [ ] Privacy Policy & TOS ready

Ads & IAP:
├─ [ ] AdMob producción IDs
├─ [ ] IAP products en App Store/Play
├─ [ ] Receipt validation en backend
└─ [ ] Test purchases en sandbox

Analytics:
├─ [ ] Amplitude producción key
├─ [ ] Firebase configurado
├─ [ ] Eventos clave loguéados
└─ [ ] Dashboard inicial

Marketing:
├─ [ ] App Store listing escrito
├─ [ ] Play Store listing escrito
├─ [ ] Screenshots (6 assets mínimo)
├─ [ ] App icon (1024x1024 PNG)
├─ [ ] Privacy policy URL
└─ [ ] Social media posts schedulados
```

---

## 🎯 SUCCESS METRICS (Semana 1 post-launch)

```
Objetivo: 1K beta testers

D1 Retention: >40%
├─ Métrica: Users que juegan 2+ veces en día 1

D7 Retention: >20%
└─ Métrica: Users que todavía activos en día 7

Engagement:
├─ Sesiones/usuario/día: 1.5+
├─ Sesión promedio: 8-12 minutos
└─ Palabras/usuario/mes: 15+

Monetización (MVP sin mucho énfasis):
├─ Ad fill rate: 50%+
├─ IAP conversion: 2%+
└─ ARPU (primeros 1000): $0.05+

Streaks:
├─ % usuarios con racha activa: 70%+
├─ Racha promedio: 7+ días
└─ Churn por "racha perdida": <10%
```

---

## 🚀 POST-MVP FEATURES (No en sprint)

**Fase 2 (Sprint 9-10):**
- Friend Streaks (rachas grupales)
- Misiones semanales temáticas
- Suscripción Premium ($2.99/mes)
- Leaderboard ESTADO (Jalisco vs CDMX)

**Fase 3 (Sprint 11-12):**
- Reto de Región semanal
- Seasonal events (Día de Muertos, Navidad)
- Outfits + accesorios adicionales

**Fase 4 (Mes 4+):**
- Expansión Latinoaméricana
- Partnerships con influencers
- Monetización agresiva (más IAP tiers)

---

## 📊 ESTIMACIÓN TOTAL

```
MVP (8 sprints = 8 semanas):
├─ React Native Dev: 160 horas
├─ Backend Dev: 80 horas
├─ QA/Testing: 60 horas
├─ Design (UI/UX): 40 horas (assets)
└─ TOTAL: 340 horas ~ 2 devs × 8 semanas intensas

Costo estimado (Latam rates):
├─ 2 Senior Devs × $50/hr × 340 = $17,000
├─ Design/Assets: $3,000
└─ Herramientas (AdMob, Amplitude, etc): $500
═════════════════════════════════════════
   PRESUPUESTO MVP: ~$20,500 USD
```

---

**Documento preparado por: Technical Lead**
**Versión: MVP 2025**
**Última actualización: Febrero 2026**
