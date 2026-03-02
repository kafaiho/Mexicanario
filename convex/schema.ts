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
    difficulty: v.optional(v.number()), // 1=Fácil 2=Medio 3=Difícil (optional per-word override)
  }),

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
    // ── Power-up inventory ──────────────────────────────────────────────
    powerups: v.optional(v.object({
      hints:     v.optional(v.number()),   // pistas de letra
      skips:     v.optional(v.number()),   // saltar palabra
      completes: v.optional(v.number()),   // completar palabra
      synonyms:  v.optional(v.number()),   // pista de frase
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
  }),

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
    createdAt: v.number(),
  }).index("by_week_user", ["weekId", "userId"])
    .index("by_group", ["groupId"]),

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
});