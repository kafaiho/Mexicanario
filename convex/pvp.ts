import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ══════════════════════════════════════════════════════════════════════════════
// ═══  PvP DUELOS EN TIEMPO REAL  ═══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

const PVP_WORDS_COUNT = 5;
const PVP_MAX_DURATION_MS = 90_000; // 90 seconds
const PVP_COUNTDOWN_MS = 3_000;
const PVP_REWARD_BASE = 100; // base coins for winner
const PVP_REWARD_LOSER = 20; // consolation coins
const ELO_FLOOR = 100;
const ELO_DEFAULT = 1000;
const ELO_RANGE_INITIAL = 200;
const ELO_RANGE_EXPANDED = 400;
const ELO_EXPAND_AFTER_MS = 15_000;

// ── ELO Computation ─────────────────────────────────────────────────────────

function computeElo(
  ratingA: number,
  ratingB: number,
  scoreA: number, // 1 = win, 0.5 = draw, 0 = loss
  gamesA: number,
  gamesB: number
) {
  const kA = gamesA < 10 ? 64 : 32;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const deltaA = Math.round(kA * (scoreA - expectedA));
  return {
    newR1: Math.max(ELO_FLOOR, ratingA + deltaA),
    newR2: Math.max(ELO_FLOOR, ratingB - deltaA),
    delta: Math.abs(deltaA),
  };
}

// ── ELO Tiers ───────────────────────────────────────────────────────────────

export const ELO_TIERS = [
  { min: 0, max: 799, name: "Nopal", emoji: "🌵", color: "#4A7C59" },
  { min: 800, max: 999, name: "Obsidiana", emoji: "⬛", color: "#2C2C2C" },
  { min: 1000, max: 1199, name: "Copal", emoji: "💨", color: "#8B7355" },
  { min: 1200, max: 1399, name: "Cenote", emoji: "💧", color: "#2196F3" },
  { min: 1400, max: 1599, name: "Jade", emoji: "💎", color: "#00C853" },
  { min: 1600, max: 1799, name: "Quetzal", emoji: "🦜", color: "#00BFA5" },
  { min: 1800, max: 1999, name: "Jaguar", emoji: "🐆", color: "#D4A017" },
  { min: 2000, max: Infinity, name: "Tonatiuh", emoji: "👑", color: "#FFD700" },
];

export function getEloTier(elo: number) {
  return ELO_TIERS.find((t) => elo >= t.min && elo <= t.max) ?? ELO_TIERS[0];
}

// ── PvP Scoring ─────────────────────────────────────────────────────────────

function computePvpScore(
  wordsCompleted: number,
  attemptsPerWord: number[],
  elapsedMs: number,
  maxDurationMs: number
) {
  let score = 0;
  for (let i = 0; i < wordsCompleted; i++) {
    const attempts = attemptsPerWord[i] ?? 1;
    score += 100; // base per word
    score -= Math.max(0, (attempts - 1) * 15); // penalty for extra attempts
  }
  // Speed bonus: 2 pts per second remaining (compensates for shorter 90s match)
  const remainingS = Math.max(0, Math.floor((maxDurationMs - elapsedMs) / 1000));
  score += remainingS * 2;
  return Math.max(0, score);
}

// ══════════════════════════════════════════════════════════════════════════════
// ═══  MUTATIONS  ════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

// ── Join matchmaking queue ──────────────────────────────────────────────────
export const joinQueue = mutation({
  args: {
    userId: v.id("users"),
    friendInviteId: v.optional(v.id("users")),
  },
  handler: async (ctx, { userId, friendInviteId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("Usuario no encontrado.");

    // Clean up ALL old queue entries for this user to prevent stale data
    const oldEntries = await ctx.db
      .query("pvpQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const entry of oldEntries) {
      if (entry.status === "waiting") {
        // Already waiting — reuse this entry (don't duplicate)
        return { queueEntryId: entry._id, status: "already_waiting" };
      }
      // Delete old matched/cancelled entries to keep the table clean
      if (entry.status === "matched" || entry.status === "cancelled") {
        await ctx.db.delete(entry._id);
      }
    }

    const elo = user.eloRating ?? ELO_DEFAULT;

    // If friend invite, check if friend is already waiting for us
    if (friendInviteId) {
      const friendEntry = await ctx.db
        .query("pvpQueue")
        .withIndex("by_friend_invite", (q) =>
          q.eq("friendInviteId", userId).eq("status", "waiting")
        )
        .first();
      if (friendEntry && friendEntry.userId === friendInviteId) {
        // Match found with friend!
        const match = await createMatchInternal(ctx, friendEntry.userId, userId);
        await ctx.db.patch(friendEntry._id, { status: "matched", matchId: match._id });
        const myEntry = await ctx.db.insert("pvpQueue", {
          userId,
          eloRating: elo,
          queuedAt: Date.now(),
          status: "matched",
          matchId: match._id,
          friendInviteId,
        });
        return { queueEntryId: myEntry, status: "matched", matchId: match._id };
      }
    }

    // Try to find a suitable opponent (ELO-based matchmaking)
    if (!friendInviteId) {
      const waitingEntries = await ctx.db
        .query("pvpQueue")
        .withIndex("by_status_elo", (q) => q.eq("status", "waiting"))
        .collect();

      // Find closest ELO within range
      let bestMatch: typeof waitingEntries[0] | null = null;
      let bestDiff = Infinity;

      for (const entry of waitingEntries) {
        if (entry.userId === userId) continue;
        if (entry.friendInviteId) continue; // skip friend-specific invites
        const diff = Math.abs(entry.eloRating - elo);
        const waitTime = Date.now() - entry.queuedAt;
        const range = waitTime > ELO_EXPAND_AFTER_MS ? ELO_RANGE_EXPANDED : ELO_RANGE_INITIAL;
        if (diff <= range && diff < bestDiff) {
          bestDiff = diff;
          bestMatch = entry;
        }
      }

      if (bestMatch) {
        const match = await createMatchInternal(ctx, bestMatch.userId, userId);
        await ctx.db.patch(bestMatch._id, { status: "matched", matchId: match._id });
        const myEntry = await ctx.db.insert("pvpQueue", {
          userId,
          eloRating: elo,
          queuedAt: Date.now(),
          status: "matched",
          matchId: match._id,
        });
        return { queueEntryId: myEntry, status: "matched", matchId: match._id };
      }
    }

    // No match found — enter queue
    const queueEntryId = await ctx.db.insert("pvpQueue", {
      userId,
      eloRating: elo,
      queuedAt: Date.now(),
      status: "waiting",
      friendInviteId,
    });
    return { queueEntryId, status: "waiting" };
  },
});

// Internal helper to create a match
async function createMatchInternal(
  ctx: any,
  player1Id: Id<"users">,
  player2Id: Id<"users">
) {
  const p1 = await ctx.db.get(player1Id);
  const p2 = await ctx.db.get(player2Id);
  const maxLevel = Math.min(
    p1?.currentLevel ?? 50,
    p2?.currentLevel ?? 50,
    50
  );

  // ── Select 5 words with progressive difficulty ──
  // Pool: only words the lower-level player has seen (capped at 800 for perf)
  const allWords = await ctx.db.query("words").collect();

  // Classify by difficulty (field or word length fallback)
  const classify = (w: any): number => {
    if (w.difficulty === 1) return 1;
    if (w.difficulty === 3) return 3;
    if (w.difficulty === 2) return 2;
    // Fallback: short words = easy, long = hard
    const len = (w.word ?? "").replace(/\s/g, "").length;
    if (len <= 5) return 1;
    if (len <= 8) return 2;
    return 3;
  };

  const easy: any[] = [];
  const med: any[] = [];
  const hard: any[] = [];
  for (const w of allWords) {
    const d = classify(w);
    if (d === 1) easy.push(w);
    else if (d === 2) med.push(w);
    else hard.push(w);
  }

  // Fisher-Yates shuffle
  const shuffle = (arr: any[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  shuffle(easy);
  shuffle(med);
  shuffle(hard);

  // Pick: word 1-2 easy, 3-4 medium, 5 hard (fallback to next pool if not enough)
  const pick = (pools: any[][], count: number): any[] => {
    const result: any[] = [];
    const used = new Set<string>();
    for (const pool of pools) {
      for (const w of pool) {
        if (result.length >= count) break;
        const id = String(w._id);
        if (!used.has(id)) {
          result.push(w);
          used.add(id);
        }
      }
      if (result.length >= count) break;
    }
    return result;
  };

  const w1 = pick([easy, med, hard], 2);
  const w2 = pick([med, easy, hard], 2).filter((w: any) => !w1.some((x: any) => String(x._id) === String(w._id)));
  // Ensure we have 2 for medium slot
  if (w2.length < 2) {
    for (const pool of [med, easy, hard]) {
      for (const w of pool) {
        if (w2.length >= 2) break;
        if (!w1.some((x: any) => String(x._id) === String(w._id)) && !w2.some((x: any) => String(x._id) === String(w._id))) {
          w2.push(w);
        }
      }
    }
  }
  const usedIds = new Set([...w1, ...w2].map((w: any) => String(w._id)));
  const w3 = pick([hard, med], 1).filter((w: any) => !usedIds.has(String(w._id)));
  if (w3.length < 1) {
    for (const pool of [hard, med, easy]) {
      for (const w of pool) {
        if (w3.length >= 1) break;
        if (!usedIds.has(String(w._id))) {
          w3.push(w);
        }
      }
    }
  }

  // Final order: easy → medium → hard
  const selectedWords = [...w1.slice(0, 2), ...w2.slice(0, 2), ...w3.slice(0, 1)];

  const wordIds = selectedWords.map((w: any) => w._id);
  const wordsJson = JSON.stringify(
    selectedWords.map((w: any) => ({
      word: w.word,
      meaning: w.meaning,
      example: w.example,
      region: w.region,
    }))
  );

  const now = Date.now();
  const matchId = await ctx.db.insert("pvpMatches", {
    player1Id,
    player2Id,
    wordIds,
    words: wordsJson,
    status: "countdown",
    p1Progress: 0,
    p2Progress: 0,
    p1Attempts: JSON.stringify([]),
    p2Attempts: JSON.stringify([]),
    startTime: now + PVP_COUNTDOWN_MS,
    maxDurationMs: PVP_MAX_DURATION_MS,
    rewardCoins: PVP_REWARD_BASE,
    createdAt: now,
  });

  return { _id: matchId };
}

// ── Leave queue ─────────────────────────────────────────────────────────────
export const leaveQueue = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const entry = await ctx.db
      .query("pvpQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (entry && entry.status === "waiting") {
      await ctx.db.patch(entry._id, { status: "cancelled" });
    }
    return { ok: true };
  },
});

// ── Submit word result during PvP match ─────────────────────────────────────
export const submitWordResult = mutation({
  args: {
    matchId: v.id("pvpMatches"),
    userId: v.id("users"),
    wordIndex: v.number(),
    attempts: v.number(),
    timeMs: v.number(),
  },
  handler: async (ctx, { matchId, userId, wordIndex, attempts, timeMs }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new ConvexError("Match no encontrado.");
    if (match.status !== "active" && match.status !== "countdown") {
      throw new ConvexError("Este match ya no está activo.");
    }

    // Anti-cheat validations
    if (timeMs < 500) throw new ConvexError("Tiempo inválido.");
    if (attempts > 10 || attempts < 1) throw new ConvexError("Intentos inválidos.");
    if (wordIndex < 0 || wordIndex >= PVP_WORDS_COUNT) throw new ConvexError("Índice de palabra inválido.");

    const isP1 = match.player1Id === userId;
    const isP2 = match.player2Id === userId;
    if (!isP1 && !isP2) throw new ConvexError("No eres parte de este match.");

    const progressField = isP1 ? "p1Progress" : "p2Progress";
    const attemptsField = isP1 ? "p1Attempts" : "p2Attempts";
    const currentProgress = isP1 ? match.p1Progress : match.p2Progress;

    // Must submit in order
    if (wordIndex !== currentProgress) {
      throw new ConvexError("Debes completar las palabras en orden.");
    }

    // Update progress
    const attemptsArr = JSON.parse(isP1 ? match.p1Attempts : match.p2Attempts) as number[];
    attemptsArr.push(attempts);

    const newProgress = currentProgress + 1;
    const patch: any = {
      [progressField]: newProgress,
      [attemptsField]: JSON.stringify(attemptsArr),
    };

    // If match was in countdown and now someone submitted, activate it
    if (match.status === "countdown" && Date.now() >= match.startTime) {
      patch.status = "active";
    }

    // Check if this player just finished all words
    if (newProgress >= PVP_WORDS_COUNT) {
      const finishedField = isP1 ? "p1FinishedAt" : "p2FinishedAt";
      patch[finishedField] = Date.now();
    }

    await ctx.db.patch(matchId, patch);

    // Re-read to check if both finished
    const updated = await ctx.db.get(matchId);
    if (!updated) return { progress: newProgress };

    const bothFinished =
      (isP1 ? newProgress : updated.p1Progress) >= PVP_WORDS_COUNT &&
      (isP2 ? newProgress : updated.p2Progress) >= PVP_WORDS_COUNT;

    if (bothFinished) {
      await finishMatchInternal(ctx, matchId);
    }

    return { progress: newProgress, matchFinished: bothFinished };
  },
});

// ── Finish match (determine winner, compute ELO, award rewards) ────────────
async function finishMatchInternal(ctx: any, matchId: Id<"pvpMatches">) {
  const match = await ctx.db.get(matchId);
  if (!match || match.status === "finished" || match.status === "ghost") return;

  const now = Date.now();
  const elapsed = now - match.startTime;

  const p1Attempts = JSON.parse(match.p1Attempts) as number[];
  const p2Attempts = JSON.parse(match.p2Attempts) as number[];

  // ── Ghost match detection: if one player has 0 progress, it's invalid ──
  const isGhostMatch = match.p1Progress === 0 || match.p2Progress === 0;

  const p1Score = computePvpScore(
    match.p1Progress,
    p1Attempts,
    match.p1FinishedAt ? match.p1FinishedAt - match.startTime : elapsed,
    match.maxDurationMs
  );
  const p2Score = computePvpScore(
    match.p2Progress,
    p2Attempts,
    match.p2FinishedAt ? match.p2FinishedAt - match.startTime : elapsed,
    match.maxDurationMs
  );

  let winnerId: Id<"users"> | undefined;
  let isDraw = false;

  if (isGhostMatch) {
    // Ghost match — no winner, no rewards, no ELO change
    isDraw = false;
  } else if (p1Score > p2Score) {
    winnerId = match.player1Id;
  } else if (p2Score > p1Score) {
    winnerId = match.player2Id;
  } else {
    isDraw = true;
  }

  // Update match
  await ctx.db.patch(matchId, {
    status: isGhostMatch ? "ghost" : "finished",
    p1Score,
    p2Score,
    winnerId,
    isDraw,
    eloChange: isGhostMatch ? 0 : undefined, // set below for real matches
  });

  // Ghost match: no coins, no ELO, no stats — just record it
  if (isGhostMatch) {
    await ctx.db.insert("pvpHistory", {
      matchId,
      userId: match.player1Id,
      opponentId: match.player2Id,
      won: false,
      score: p1Score,
      opponentScore: p2Score,
      eloChange: 0,
      coinsEarned: 0,
      createdAt: now,
    });
    await ctx.db.insert("pvpHistory", {
      matchId,
      userId: match.player2Id,
      opponentId: match.player1Id,
      won: false,
      score: p2Score,
      opponentScore: p1Score,
      eloChange: 0,
      coinsEarned: 0,
      createdAt: now,
    });
    return;
  }

  // ── Real match — compute ELO and award coins ──
  const p1 = await ctx.db.get(match.player1Id);
  const p2 = await ctx.db.get(match.player2Id);
  const p1Elo = p1?.eloRating ?? ELO_DEFAULT;
  const p2Elo = p2?.eloRating ?? ELO_DEFAULT;
  const p1Games = (p1?.pvpWins ?? 0) + (p1?.pvpLosses ?? 0) + (p1?.pvpDraws ?? 0);
  const p2Games = (p2?.pvpWins ?? 0) + (p2?.pvpLosses ?? 0) + (p2?.pvpDraws ?? 0);

  const scoreA = isDraw ? 0.5 : winnerId === match.player1Id ? 1 : 0;
  const { newR1, newR2, delta } = computeElo(p1Elo, p2Elo, scoreA, p1Games, p2Games);

  // Update match with ELO change
  await ctx.db.patch(matchId, { eloChange: delta });

  // Award coins
  const p1Won = winnerId === match.player1Id;
  const p2Won = winnerId === match.player2Id;
  const p1Coins = p1Won ? PVP_REWARD_BASE : isDraw ? Math.floor(PVP_REWARD_BASE / 2) : PVP_REWARD_LOSER;
  const p2Coins = p2Won ? PVP_REWARD_BASE : isDraw ? Math.floor(PVP_REWARD_BASE / 2) : PVP_REWARD_LOSER;

  // Update player 1
  if (p1) {
    const p1Streak = p1Won ? (p1.pvpStreak ?? 0) + 1 : 0;
    await ctx.db.patch(match.player1Id, {
      eloRating: newR1,
      eloHighest: Math.max(p1.eloHighest ?? 0, newR1),
      pvpWins: (p1.pvpWins ?? 0) + (p1Won ? 1 : 0),
      pvpLosses: (p1.pvpLosses ?? 0) + (!p1Won && !isDraw ? 1 : 0),
      pvpDraws: (p1.pvpDraws ?? 0) + (isDraw ? 1 : 0),
      pvpStreak: p1Streak,
      pvpBestStreak: Math.max(p1.pvpBestStreak ?? 0, p1Streak),
      coins: (p1.coins ?? 0) + p1Coins,
    });
  }

  // Update player 2
  if (p2) {
    const p2Streak = p2Won ? (p2.pvpStreak ?? 0) + 1 : 0;
    await ctx.db.patch(match.player2Id, {
      eloRating: newR2,
      eloHighest: Math.max(p2.eloHighest ?? 0, newR2),
      pvpWins: (p2.pvpWins ?? 0) + (p2Won ? 1 : 0),
      pvpLosses: (p2.pvpLosses ?? 0) + (!p2Won && !isDraw ? 1 : 0),
      pvpDraws: (p2.pvpDraws ?? 0) + (isDraw ? 1 : 0),
      pvpStreak: p2Streak,
      pvpBestStreak: Math.max(p2.pvpBestStreak ?? 0, p2Streak),
      coins: (p2.coins ?? 0) + p2Coins,
    });
  }

  // Insert PvP history for both players
  await ctx.db.insert("pvpHistory", {
    matchId,
    userId: match.player1Id,
    opponentId: match.player2Id,
    won: p1Won,
    score: p1Score,
    opponentScore: p2Score,
    eloChange: scoreA === 1 ? delta : scoreA === 0 ? -delta : 0,
    coinsEarned: p1Coins,
    createdAt: now,
  });
  await ctx.db.insert("pvpHistory", {
    matchId,
    userId: match.player2Id,
    opponentId: match.player1Id,
    won: p2Won,
    score: p2Score,
    opponentScore: p1Score,
    eloChange: scoreA === 0 ? delta : scoreA === 1 ? -delta : 0,
    coinsEarned: p2Coins,
    createdAt: now,
  });
}

// ── Abandon match ───────────────────────────────────────────────────────────
export const abandonMatch = mutation({
  args: {
    matchId: v.id("pvpMatches"),
    userId: v.id("users"),
  },
  handler: async (ctx, { matchId, userId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new ConvexError("Match no encontrado.");
    if (match.status === "finished" || match.status === "abandoned" || match.status === "ghost") return { ok: true };

    const isP1 = match.player1Id === userId;
    const isP2 = match.player2Id === userId;
    if (!isP1 && !isP2) throw new ConvexError("No eres parte de este match.");

    // The other player wins
    const winnerId = isP1 ? match.player2Id : match.player1Id;

    await ctx.db.patch(matchId, {
      status: "abandoned",
      winnerId,
    });

    // Compute ELO (abandoner gets a loss)
    const p1 = await ctx.db.get(match.player1Id);
    const p2 = await ctx.db.get(match.player2Id);
    const p1Elo = p1?.eloRating ?? ELO_DEFAULT;
    const p2Elo = p2?.eloRating ?? ELO_DEFAULT;
    const p1Games = (p1?.pvpWins ?? 0) + (p1?.pvpLosses ?? 0) + (p1?.pvpDraws ?? 0);
    const p2Games = (p2?.pvpWins ?? 0) + (p2?.pvpLosses ?? 0) + (p2?.pvpDraws ?? 0);

    const scoreA = isP1 ? 0 : 1; // P1 abandoned = P1 loses
    const { newR1, newR2, delta } = computeElo(p1Elo, p2Elo, scoreA, p1Games, p2Games);

    if (p1) {
      await ctx.db.patch(match.player1Id, {
        eloRating: newR1,
        pvpWins: (p1.pvpWins ?? 0) + (isP2 ? 0 : 0),
        pvpLosses: (p1.pvpLosses ?? 0) + (isP1 ? 1 : 0),
        pvpStreak: isP1 ? 0 : (p1.pvpStreak ?? 0) + 1,
        pvpBestStreak: isP2 ? Math.max(p1.pvpBestStreak ?? 0, (p1.pvpStreak ?? 0) + 1) : p1.pvpBestStreak,
        coins: (p1.coins ?? 0) + (isP2 ? 0 : PVP_REWARD_LOSER),
      });
    }
    if (p2) {
      await ctx.db.patch(match.player2Id, {
        eloRating: newR2,
        pvpWins: (p2.pvpWins ?? 0) + (isP1 ? 1 : 0),
        pvpLosses: (p2.pvpLosses ?? 0) + (isP2 ? 1 : 0),
        pvpStreak: isP2 ? 0 : (p2.pvpStreak ?? 0) + 1,
        pvpBestStreak: isP1 ? Math.max(p2.pvpBestStreak ?? 0, (p2.pvpStreak ?? 0) + 1) : p2.pvpBestStreak,
        coins: (p2.coins ?? 0) + (isP1 ? PVP_REWARD_BASE : PVP_REWARD_LOSER),
      });
    }

    return { ok: true };
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// ═══  QUERIES  ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

// ── Queue status (reactive) ─────────────────────────────────────────────────
export const getQueueStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const entry = await ctx.db
      .query("pvpQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (!entry) return { status: "none" };
    return {
      status: entry.status,
      matchId: entry.matchId,
      queuedAt: entry.queuedAt,
    };
  },
});

// ── Match state (reactive — both players subscribe) ─────────────────────────
export const getMatchState = query({
  args: { matchId: v.id("pvpMatches") },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) return null;

    // Only reveal words up to current progress + current word for each player
    const words = JSON.parse(match.words) as any[];

    // Get player names/avatars
    const p1 = await ctx.db.get(match.player1Id);
    const p2 = await ctx.db.get(match.player2Id);

    return {
      matchId: match._id,
      status: match.status,
      player1: {
        id: match.player1Id,
        name: p1?.username ?? p1?.name ?? "Jugador 1",
        avatar: p1?.avatar ?? "🌮",
        elo: p1?.eloRating ?? ELO_DEFAULT,
        progress: match.p1Progress,
        score: match.p1Score,
        finishedAt: match.p1FinishedAt,
      },
      player2: {
        id: match.player2Id,
        name: p2?.username ?? p2?.name ?? "Jugador 2",
        avatar: p2?.avatar ?? "🌮",
        elo: p2?.eloRating ?? ELO_DEFAULT,
        progress: match.p2Progress,
        score: match.p2Score,
        finishedAt: match.p2FinishedAt,
      },
      words, // all words sent — client reveals based on progress
      startTime: match.startTime,
      maxDurationMs: match.maxDurationMs,
      winnerId: match.winnerId,
      isDraw: match.isDraw,
      eloChange: match.eloChange,
      rewardCoins: match.rewardCoins,
    };
  },
});

// ── PvP History ─────────────────────────────────────────────────────────────
export const getPvpHistory = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    const history = await ctx.db
      .query("pvpHistory")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 20);

    const result = await Promise.all(
      history.map(async (h) => {
        const opponent = await ctx.db.get(h.opponentId);
        return {
          ...h,
          opponentName: opponent?.username ?? opponent?.name ?? "Jugador",
          opponentAvatar: opponent?.avatar ?? "🌮",
          opponentElo: opponent?.eloRating ?? ELO_DEFAULT,
        };
      })
    );
    return result;
  },
});

// ── PvP Stats for a user ────────────────────────────────────────────────────
export const getPvpStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      eloRating: user.eloRating ?? ELO_DEFAULT,
      eloHighest: user.eloHighest ?? ELO_DEFAULT,
      pvpWins: user.pvpWins ?? 0,
      pvpLosses: user.pvpLosses ?? 0,
      pvpDraws: user.pvpDraws ?? 0,
      pvpStreak: user.pvpStreak ?? 0,
      pvpBestStreak: user.pvpBestStreak ?? 0,
      tier: getEloTier(user.eloRating ?? ELO_DEFAULT),
    };
  },
});

// ── PvP Leaderboard (top by ELO) ────────────────────────────────────────────
export const getPvpLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_elo")
      .order("desc")
      .take(limit ?? 50);

    return users
      .filter((u) => (u.eloRating ?? 0) > 0 && ((u.pvpWins ?? 0) + (u.pvpLosses ?? 0)) > 0)
      .map((u, i) => ({
        rank: i + 1,
        userId: u._id,
        name: u.username ?? u.name ?? "Jugador",
        avatar: u.avatar ?? "🌮",
        elo: u.eloRating ?? ELO_DEFAULT,
        wins: u.pvpWins ?? 0,
        losses: u.pvpLosses ?? 0,
        tier: getEloTier(u.eloRating ?? ELO_DEFAULT),
      }));
  },
});

// ── Activate match (transition from countdown to active) ────────────────────
export const activateMatch = mutation({
  args: { matchId: v.id("pvpMatches") },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (!match || match.status !== "countdown") return;
    if (Date.now() >= match.startTime) {
      await ctx.db.patch(matchId, { status: "active" });
    }
  },
});

// ── Check and finish timed-out matches ──────────────────────────────────────
export const checkMatchTimeout = mutation({
  args: { matchId: v.id("pvpMatches") },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (!match || match.status === "finished" || match.status === "abandoned" || match.status === "ghost") return;

    const now = Date.now();
    if (now > match.startTime + match.maxDurationMs) {
      await finishMatchInternal(ctx, matchId);
    }
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// ═══  INTERNAL (crons)  ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

// ── Cleanup stale queue entries ─────────────────────────────────────────────
export const cleanupQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // >24h old
    const stale = await ctx.db
      .query("pvpQueue")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "cancelled"),
          q.eq(q.field("status"), "matched")
        )
      )
      .collect();

    let cleaned = 0;
    for (const entry of stale) {
      if (entry.queuedAt < cutoff) {
        await ctx.db.delete(entry._id);
        cleaned++;
      }
    }

    // Also timeout waiting entries >2 min old
    const waitingStale = await ctx.db
      .query("pvpQueue")
      .withIndex("by_status_elo", (q) => q.eq("status", "waiting"))
      .collect();

    for (const entry of waitingStale) {
      if (Date.now() - entry.queuedAt > 120_000) {
        await ctx.db.patch(entry._id, { status: "cancelled" });
        cleaned++;
      }
    }

    return { cleaned };
  },
});

// ── Auto-finish timed-out matches (called by cron) ──────────────────────────
export const finishTimedOutMatches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Find active or countdown matches that have exceeded their duration
    const activeMatches = await ctx.db
      .query("pvpMatches")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "countdown")
        )
      )
      .collect();

    let finished = 0;
    for (const match of activeMatches) {
      if (now > match.startTime + match.maxDurationMs) {
        await finishMatchInternal(ctx, match._id);
        finished++;
      }
    }
    return { finished };
  },
});
