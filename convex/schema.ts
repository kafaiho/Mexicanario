import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Daily rewards configuration
const DAILY_REWARDS = {
  1: { coins: 50, diamonds: 0 },    // Day 1
  2: { coins: 75, diamonds: 0 },    // Day 2
  3: { coins: 100, diamonds: 0 },   // Day 3
  4: { coins: 125, diamonds: 0 },   // Day 4
  5: { coins: 150, diamonds: 1 },   // Day 5
  6: { coins: 175, diamonds: 1 },   // Day 6
  7: { coins: 200, diamonds: 2 },   // Day 7 (Weekly bonus)
};

export default defineSchema({

  // Tables for the game
  // Words table to store vocabulary terms
  words: defineTable({
    word: v.string(),
    meaning: v.string(),
    example: v.string(),
    region: v.string(),
    category: v.optional(v.string()), // Added for the Colección screen
    // Kept numeric for legacy writers; culturalValidation enforces the 1 | 2 | 3 domain.
    difficulty: v.optional(v.number()),
    pack: v.optional(v.string()),       // content pack ID (e.g. "insultos", "suegra") for adult packs
    collectionId: v.optional(v.string()),
    pathId: v.optional(v.string()),
    placeId: v.optional(v.string()),
    generation: v.optional(v.array(v.union(
      v.literal("tradicional"),
      v.literal("80s"),
      v.literal("90s"),
      v.literal("2000s"),
      v.literal("actual"),
    ))),
    rating: v.optional(v.union(v.literal("familiar"), v.literal("adulto"))),
    icon: v.optional(v.string()),
    editorialOrder: v.optional(v.number()),
    sourceNote: v.optional(v.string()),
    relatedConceptId: v.optional(v.string()),
    conceptId: v.optional(v.string()),
    normalizedWordKey: v.optional(v.string()),
    isRetired: v.optional(v.boolean()),
  }).index("by_word", ["word"]).index("by_normalized_word_key", ["normalizedWordKey"]),

  // Levels table to store level configurations
  levels: defineTable({
    levelNumber: v.number(),
    wordId: v.id("words"),
    reward: v.object({
      coins: v.number(),
      diamonds: v.number(),
    }),
  }),

  // Users table to store player information
  users: defineTable({
    name: v.string(),
    coins: v.number(),
    diamonds: v.number(),
    country: v.string(),
    avatar: v.string(),
    currentLevel: v.optional(v.number()),
    tacos: v.optional(v.number()),             // palabras adivinadas de verdad (≠ jumpToLevel)
    createdAt: v.number(),
    // ── Mascota fields ──────────────────────────────────────────────────
    petType: v.optional(v.string()),           // "ajolote" | "xolo" | "alebrije"
    petName: v.optional(v.string()),           // nombre elegido por el jugador
    petStage: v.optional(v.number()),          // 1=Cría 2=Juvenil 3=Guardián 4=Mítico
    petXp: v.optional(v.number()),             // XP total acumulado
    petHungerBase: v.optional(v.number()),     // hambre al momento de la última comida
    petLastFed: v.optional(v.number()),        // timestamp última comida (ms)
    petHappinessBase: v.optional(v.number()),  // felicidad al momento del último juego
    petLastPlayed: v.optional(v.number()),     // timestamp último juego (ms)
    petBornAt: v.optional(v.number()),         // timestamp cuando eclosionó el huevo
    petVinculo: v.optional(v.number()),        // vínculo invisible 0-2000, NUNCA mostrar en UI
    streakFreezeActive: v.optional(v.boolean()), // legacy — ya no se usa para lógica
    streakFreezeCount: v.optional(v.number()),   // protectores acumulados (≥0)
    // ── Power-up inventory ──────────────────────────────────────────────
    powerups: v.optional(v.object({
      hints: v.optional(v.number()),   // pistas de letra
      skips: v.optional(v.number()),   // saltar palabra
      completes: v.optional(v.number()),   // completar palabra
      synonyms: v.optional(v.number()),   // pista de frase
    })),
    // ── Free coins cooldown ─────────────────────────────────────────────
    freeCoinsClaimedAt: v.optional(v.number()),  // timestamp última reclamación gratis
    // ── Gift reward tracking ──────────────────────────────────────────────
    lastGiftClaimed: v.optional(v.number()),     // último taco count al reclamar regalo
    // ── Streak & combo tracking ──────────────────────────────────────────
    lastPlayDate: v.optional(v.string()),        // "YYYY-MM-DD" último día que jugó
    playStreak: v.optional(v.number()),          // días consecutivos jugando
    playStreakMax: v.optional(v.number()),        // récord de racha
    bestCombo: v.optional(v.number()),           // mejor combo en una sesión
    perfectLevels: v.optional(v.number()),       // niveles completados sin errores
    totalWordsToday: v.optional(v.number()),     // palabras completadas hoy
    todayDate: v.optional(v.string()),           // "YYYY-MM-DD" para resetear todayWords
    streakGoalDays: v.optional(v.number()),      // meta comprometida (7, 14, 30, 50)
    // ── League fields ─────────────────────────────────────────────────────
    leagueDivision: v.optional(v.number()),      // división actual (1-10), null = no colocado
    leagueHighestDiv: v.optional(v.number()),    // división más alta alcanzada
    leagueWeeklyStreak: v.optional(v.number()),  // semanas consecutivas participando
    leagueTrophies: v.optional(v.number()),      // conteo de top-3 en Tonatiuh
    lastLeagueWeekId: v.optional(v.string()),    // último weekId en que participó
    // ── Daily missions ───────────────────────────────────────────────────────
    bestComboToday: v.optional(v.number()),      // mejor combo del día actual
    comboTodayDate: v.optional(v.string()),      // "YYYY-MM-DD" para reset diario de combo
    // ── XP de sabiduría cultural ─────────────────────────────────────────────
    xp: v.optional(v.number()),                  // XP total acumulado (Experiencia Cultural)
    // ── XP tracking semanal/mensual (auto-reset por periodo) ──────────────────
    xpThisWeek: v.optional(v.number()),          // XP acumulado esta semana
    xpThisWeekId: v.optional(v.string()),        // "2026-W09" — se resetea cuando cambia
    xpThisMonth: v.optional(v.number()),         // XP acumulado este mes
    xpThisMonthId: v.optional(v.string()),       // "2026-03" — se resetea cuando cambia
    // ── Social auth linking (optional) ─────────────────────────────────────
    email: v.optional(v.string()),            // email from Google/Apple
    googleId: v.optional(v.string()),            // Google OAuth `sub`
    appleId: v.optional(v.string()),            // Apple user identifier
    // ── Multi-mascota slots ──────────────────────────────────────────────────
    petSlots: v.optional(v.string()),            // JSON: { ajolote:{...}, xolo:{...}, alebrije:{...}, nahual_norte:{...}, ... }
    // ── Mexicanario Plus subscription ───────────────────────────────────────
    mexPlusExpiresAt: v.optional(v.number()),    // epoch ms expiry; active when > Date.now()
    // ── Sistema de referidos ─────────────────────────────────────────────────────
    referredBy: v.optional(v.id("users")), // quién me invitó (solo 1 vez)
    referralCount: v.optional(v.number()),    // total de cuates que han entrado por mi link
    // ── Cuates / social ─────────────────────────────────────────────────────
    username: v.optional(v.string()),            // nombre único elegido por el jugador
    passwordHash: v.optional(v.string()),        // SHA-256 de la contraseña (hex)
    // ── Compartir con cuates (daily share reward) ──────────────────────────────
    lastShareRewardDate: v.optional(v.string()),   // "YYYY-MM-DD" — una recompensa por día
    // ── Skins & contenido desbloqueado ───────────────────────────────────────
    purchasedSkins: v.optional(v.array(v.string())),         // IDs de skins compradas con monedas
    adultContentUnlocked: v.optional(v.array(v.string())),   // IDs de paquetes de contenido adulto desbloqueados
    // ── Código de creador/referido ───────────────────────────────────────────
    creatorCode: v.optional(v.string()),         // código aplicado (e.g., "ALANA")
    creatorCodeAppliedAt: v.optional(v.number()), // timestamp de cuando lo aplicó
    // ── PvP / ELO fields ────────────────────────────────────────────────────
    eloRating: v.optional(v.number()),           // default 1000
    eloHighest: v.optional(v.number()),
    pvpWins: v.optional(v.number()),
    pvpLosses: v.optional(v.number()),
    pvpDraws: v.optional(v.number()),
    pvpStreak: v.optional(v.number()),           // current win streak
    pvpBestStreak: v.optional(v.number()),
  })
    .index("by_googleId", ["googleId"])
    .index("by_appleId", ["appleId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_tacos", ["tacos"])
    .index("by_xp", ["xp"])
    .index("by_country", ["country"])
    .index("by_elo", ["eloRating"]),

  // Colections for the game
  collections: defineTable({
    name: v.string(),
    image: v.string(),
  }),

  // Collection cards for the game
  collectionCards: defineTable({
    collectionId: v.id("collections"),
    name: v.string(),
    image: v.string(),
  }),

  // Game achievements
  achievements: defineTable({
    name: v.string(),
    description: v.string(),
    target: v.number(),
    iconId: v.string(),
    reward: v.object({
      coins: v.number(),
      diamonds: v.number(),
    }),
  }),

  // Game Milestones
  milestones: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.string()
  }),

  // Tables for users

  // User collected cards
  userCollectedCards: defineTable({
    userId: v.id("users"),
    cardId: v.id("collectionCards"),
  }),

  // Achievements to track user progress
  userAchievements: defineTable({
    userId: v.id("users"),
    achievementId: v.id("achievements"),
    progress: v.number(),
    claimed: v.boolean(),
  }),

  // Daily rewards tracking (one record per user)
  dailyRewards: defineTable({
    userId: v.id("users"),
    lastClaimDate: v.number(),
    nextResetTime: v.number(),
    currentStreak: v.number(),
    maxStreak: v.number(),
    totalClaims: v.number(),
  }),

  // Purchase history (IAP + coin/diamond purchases)
  purchases: defineTable({
    userId: v.id("users"),
    itemId: v.string(),                    // "coins_500" | "pass_mexica" | etc.
    type: v.string(),                      // "iap" | "coins" | "diamonds" | "free"
    amount: v.number(),
    purchasedAt: v.number(),
    receiptToken: v.optional(v.string()),  // RevenueCat receipt token
  }),

  // Season pass per user
  seasonPass: defineTable({
    userId: v.id("users"),
    passId: v.string(),     // "pass_mexica_2026_02"
    activatedAt: v.number(),
    expiresAt: v.number(),
    rewardsClaimed: v.boolean(),
  }),

  // Streak milestones claimed by users
  streakMilestones: defineTable({
    userId: v.id("users"),
    milestoneDays: v.number(),     // 7, 14, 30, 50, 100, 365
    claimedAt: v.number(),
  }),

  // Game sessions
  gameSessions: defineTable({
    userId: v.id("users"),
    startedAt: v.number(),
    status: v.string(),          // "active" | "completed" | "abandoned"
    score: v.optional(v.number()),
    currentWord: v.optional(v.id("words")),
    endedAt: v.optional(v.number()),
  }),

  // ── League system ─────────────────────────────────────────────────────────

  // One record per week
  leagueWeeks: defineTable({
    weekId: v.string(),          // "2026-W09"
    startTime: v.number(),       // epoch ms lunes 00:00 CST
    endTime: v.number(),         // epoch ms domingo 23:59:59 CST
    status: v.string(),          // "active" | "completed" | "processing"
    createdAt: v.number(),
  }),

  // Groups of ~30 players per division per week
  leagueGroups: defineTable({
    weekId: v.string(),
    division: v.number(),        // 1-10
    groupIndex: v.number(),
    playerCount: v.number(),
    createdAt: v.number(),
  }).index("by_week_division", ["weekId", "division"]),

  // Each player's weekly league entry
  leaguePlayers: defineTable({
    weekId: v.string(),
    groupId: v.id("leagueGroups"),
    userId: v.id("users"),
    division: v.number(),        // denormalized
    cxpTotal: v.number(),
    cxpToday: v.number(),
    todayDate: v.string(),       // "YYYY-MM-DD" para reset diario
    wordsToday: v.number(),
    wordsThisWeek: v.number(),
    rank: v.optional(v.number()),
    outcome: v.optional(v.string()), // "promoted" | "stayed" | "demoted"
    lastCompletionAt: v.optional(v.number()), // rate limiting — epoch ms del último registro
    createdAt: v.number(),
  }).index("by_week_user", ["weekId", "userId"])
    .index("by_group", ["groupId"])
    .index("by_group_cxp", ["groupId", "cxpTotal"]),

  // Daily mini-competition groups (3-5 players matched by activity tier)
  dailyMiniGroups: defineTable({
    dateStr: v.string(),
    players: v.array(v.id("users")),
    activityTier: v.number(),    // 0=casual, 1=regular, 2=activo
    createdAt: v.number(),
  }).index("by_date_tier", ["dateStr", "activityTier"]),

  // Daily mini-competition scores
  dailyMiniScores: defineTable({
    groupId: v.id("dailyMiniGroups"),
    userId: v.id("users"),
    dateStr: v.string(),
    cxpToday: v.number(),
    claimed: v.boolean(),
  }).index("by_group", ["groupId"])
    .index("by_date_user", ["dateStr", "userId"]),

  // ── Daily missions (3 per day, seeded by userId+date) ─────────────────────
  dailyMissions: defineTable({
    userId: v.id("users"),
    dateStr: v.string(),   // "YYYY-MM-DD"
    missions: v.array(v.object({
      id: v.string(),       // "words_5", "combo_3", "streak"
      type: v.string(),     // "words" | "combo" | "streak"
      label: v.string(),
      target: v.number(),
      reward: v.object({ coins: v.number(), diamonds: v.number() }),
      claimed: v.boolean(),
    })),
  }).index("by_user_date", ["userId", "dateStr"]),

  // ── Nahual runner scores ──────────────────────────────────────────────────
  // One record per user — stores their best scores per period
  nahualScores: defineTable({
    userId: v.id("users"),
    allTimeBest: v.number(),
    dailyBest: v.number(),
    dailyDate: v.string(),   // "YYYY-MM-DD"
    weeklyBest: v.number(),
    weeklyStr: v.string(),   // "YYYY-WXX"
  })
    .index("by_user", ["userId"])
    .index("by_alltime", ["allTimeBest"])
    .index("by_daily", ["dailyDate", "dailyBest"])
    .index("by_weekly", ["weeklyStr", "weeklyBest"]),

  // ── Taquero Rush scores ───────────────────────────────────────────────────────
  taqueroScores: defineTable({
    userId: v.id("users"),
    allTimeBest: v.number(),
    dailyBest: v.number(),
    dailyDate: v.string(),
    weeklyBest: v.number(),
    weeklyStr: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_alltime", ["allTimeBest"])
    .index("by_daily", ["dailyDate", "dailyBest"])
    .index("by_weekly", ["weeklyStr", "weeklyBest"]),

  // ── Duelo de Albures scores ───────────────────────────────────────────────────
  alburesScores: defineTable({
    userId: v.id("users"),
    allTimeBest: v.number(),
    dailyBest: v.number(),
    dailyDate: v.string(),
    weeklyBest: v.number(),
    weeklyStr: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_alltime", ["allTimeBest"])
    .index("by_daily", ["dailyDate", "dailyBest"])
    .index("by_weekly", ["weeklyStr", "weeklyBest"]),

  // ── Lotería Exprés scores ─────────────────────────────────────────────────────
  loteriaScores: defineTable({
    userId: v.id("users"),
    allTimeBest: v.number(),
    dailyBest: v.number(),
    dailyDate: v.string(),
    weeklyBest: v.number(),
    weeklyStr: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_alltime", ["allTimeBest"])
    .index("by_daily", ["dailyDate", "dailyBest"])
    .index("by_weekly", ["weeklyStr", "weeklyBest"]),

  // ── Password Reset (Recuperación) ───────────────────────────────────────────
  passwordResets: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  }).index("by_email", ["email"]),

  // ── Sistema de cuates (amigos) ────────────────────────────────────────────
  friendships: defineTable({
    userId: v.id("users"),    // quien agregó
    friendId: v.id("users"),    // a quien agregó
    status: v.optional(v.string()),  // "pending" | "accepted" | "declined" (null = legacy accepted)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_friend", ["userId", "friendId"])
    .index("by_friend_status", ["friendId", "status"]),

  // ── Notificaciones de cuates ────────────────────────────────────────────────
  friendNotifications: defineTable({
    userId: v.id("users"),          // quien recibe la notificación
    type: v.string(),               // "accepted" | "request"
    fromUserId: v.id("users"),      // quien causó la notificación
    fromUsername: v.optional(v.string()),
    fromName: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user_unread", ["userId", "read"])
    .index("by_user", ["userId"]),

  // ── Failed word review system ──────────────────────────────────────────────
  // Words the user failed are scheduled to reappear 2 days later.
  failedWords: defineTable({
    userId: v.id("users"),
    wordId: v.id("words"),
    wordText: v.string(),       // denormalized — word string for quick display
    failedAt: v.number(),       // timestamp of first failure (ms)
    scheduledAt: v.number(),    // failedAt + 2 days (172800000 ms)
    resolved: v.boolean(),      // true when user finally gets it right
    failCount: v.number(),      // total times failed across all sessions
  }).index("by_user_scheduled", ["userId", "scheduledAt"])
    .index("by_user_word", ["userId", "wordId"]),

  // ── Códigos de creadores (referral codes para YouTubers/streamers) ──────────
  referralCodes: defineTable({
    code: v.string(),             // MAYÚSCULAS único, e.g., "ALANA"
    creatorName: v.string(),      // nombre visible, e.g., "Alana Flores"
    creatorHandle: v.string(),    // @handle para UI
    discountPct: v.number(),      // % bonus varos en compras IAP (e.g., 5)
    bonusCoins: v.number(),       // varos gratis al aplicar por primera vez
    active: v.boolean(),
    totalUses: v.number(),        // usuarios que usaron este código
    totalPurchases: v.number(),   // compras IAP atribuidas (para analytics del creador)
  }).index("by_code", ["code"]),

  // ── Curador de Contenido: staging table ──────────────────────────────────────
  // Palabras candidatas generadas por el agente IA, pendientes de aprobación humana.
  wordCandidates: defineTable({
    word: v.string(),
    meaning: v.string(),
    example: v.string(),
    region: v.string(),
    category: v.string(),
    difficulty: v.number(),          // 1 | 2 | 3
    source: v.string(),          // "seed" | "trend" | "manual"
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    ipFlag: v.optional(v.string()), // razón de alerta legal si aplica
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_status_created", ["status", "createdAt"]),

  // ── Referidos (Invita y Gana) ─────────────────────────────────────────────────
  referrals: defineTable({
    referrerId: v.id("users"),
    referredId: v.id("users"),
    createdAt: v.number(),
    coinsReferrer: v.number(),
    coinsReferred: v.number(),
    milestoneBonus: v.optional(v.boolean()),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referred", ["referredId"]),

  // ── Configuración remota de la app (singleton) ────────────────────────────
  appConfig: defineTable({
    minAndroidVersionCode: v.number(),  // versionCode mínimo requerido en Android
    minIosVersion: v.string(),  // versión mínima en iOS (e.g. "1.2.2")
    forceUpdate: v.boolean(), // si true, el modal NO es dismissable
    updateMessage: v.optional(v.string()), // mensaje personalizado en el modal
  }),

  // ── Ranking snapshots (leaderboard precalculado, reemplaza full scans) ────
  rankingSnapshots: defineTable({
    periodType: v.string(),        // "alltime" | "weekly" | "monthly" | "seasonal"
    periodId: v.string(),          // "alltime" | "2026-W09" | "2026-03" | "2026-Q1"
    rankings: v.string(),          // JSON: top 200 [{userId, name, avatar, score, rank}]
    totalPlayers: v.number(),
    updatedAt: v.number(),
  }).index("by_period", ["periodType", "periodId"]),

  // ── User rank cache (posición individual precalculada) ────────────────────
  userRankCache: defineTable({
    userId: v.id("users"),
    periodType: v.string(),
    periodId: v.string(),
    rank: v.number(),
    score: v.number(),
    percentile: v.number(),        // 1-100
    updatedAt: v.number(),
  }).index("by_user_period", ["userId", "periodType", "periodId"]),

  // ── Seasonal rankings (XP por temporada trimestral) ───────────────────────
  seasonalRankings: defineTable({
    userId: v.id("users"),
    seasonId: v.string(),          // "2026-Q1"
    xpThisSeason: v.number(),
    wordsThisSeason: v.number(),
    perfectThisSeason: v.number(),
    createdAt: v.number(),
  }).index("by_user_season", ["userId", "seasonId"])
    .index("by_season_xp", ["seasonId", "xpThisSeason"]),

  // ── Weekly friend scores (ranking semanal entre cuates) ───────────────────
  weeklyFriendScores: defineTable({
    userId: v.id("users"),
    weekId: v.string(),            // "2026-W09"
    xpThisWeek: v.number(),
    wordsThisWeek: v.number(),
    bestComboThisWeek: v.number(),
    updatedAt: v.number(),
  }).index("by_user_week", ["userId", "weekId"])
    .index("by_week_xp", ["weekId", "xpThisWeek"]),

  // ── Friend challenges (retos entre cuates) ────────────────────────────────
  friendChallenges: defineTable({
    challengerId: v.id("users"),
    challengedId: v.id("users"),
    wordId: v.id("words"),
    status: v.string(),            // "pending" | "active" | "completed" | "expired"
    challengerAttempts: v.optional(v.number()),
    challengerTimeMs: v.optional(v.number()),
    challengedAttempts: v.optional(v.number()),
    challengedTimeMs: v.optional(v.number()),
    winnerId: v.optional(v.id("users")),
    rewardCoins: v.number(),       // apuesta (ambos ponen)
    createdAt: v.number(),
    expiresAt: v.number(),         // 24h
  }).index("by_challenged_status", ["challengedId", "status"])
    .index("by_challenger", ["challengerId"])
    .index("by_challenger_status", ["challengerId", "status"]),

  // ── PvP Queue ──────────────────────────────────────────────────────────────
  pvpQueue: defineTable({
    userId: v.id("users"),
    eloRating: v.number(),
    queuedAt: v.number(),
    status: v.string(),               // "waiting" | "matched" | "cancelled"
    matchId: v.optional(v.id("pvpMatches")),
    friendInviteId: v.optional(v.id("users")),  // if inviting a specific friend
  }).index("by_status_elo", ["status", "eloRating"])
    .index("by_user", ["userId"])
    .index("by_friend_invite", ["friendInviteId", "status"]),

  // ── PvP Matches ────────────────────────────────────────────────────────────
  pvpMatches: defineTable({
    player1Id: v.id("users"),
    player2Id: v.id("users"),
    wordIds: v.array(v.id("words")),
    words: v.string(),                // JSON [{word,meaning,example,region}]
    status: v.string(),               // "countdown"|"active"|"finished"|"abandoned"
    p1Progress: v.number(),           // 0-5
    p2Progress: v.number(),
    p1Attempts: v.string(),           // JSON [attempts_per_word]
    p2Attempts: v.string(),
    p1FinishedAt: v.optional(v.number()),
    p2FinishedAt: v.optional(v.number()),
    p1Score: v.optional(v.number()),
    p2Score: v.optional(v.number()),
    startTime: v.number(),
    maxDurationMs: v.number(),        // 300000 (5 min)
    winnerId: v.optional(v.id("users")),
    isDraw: v.optional(v.boolean()),
    eloChange: v.optional(v.number()),
    rewardCoins: v.number(),
    createdAt: v.number(),
  }).index("by_player1", ["player1Id", "status"])
    .index("by_player2", ["player2Id", "status"]),

  // ── PvP History ────────────────────────────────────────────────────────────
  pvpHistory: defineTable({
    matchId: v.id("pvpMatches"),
    userId: v.id("users"),
    opponentId: v.id("users"),
    won: v.boolean(),
    score: v.number(),
    opponentScore: v.number(),
    eloChange: v.number(),
    coinsEarned: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  // ── League Badges ──────────────────────────────────────────────────────────
  leagueBadges: defineTable({
    userId: v.id("users"),
    badgeType: v.string(),            // "div_reached_N", "promo_streak_N", "top3_div_N", "tonatiuh_champion", "comeback_king"
    earnedAt: v.number(),
    season: v.optional(v.string()),   // "2026-Q1"
  }).index("by_user", ["userId"])
    .index("by_user_badge", ["userId", "badgeType"]),
});
