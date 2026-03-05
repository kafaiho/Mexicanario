import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ── SHA-256 usando Web Crypto API (disponible en V8 runtime de Convex) ────────
async function hashPassword(password: string): Promise<string> {
  const enc  = new TextEncoder();
  const data = enc.encode(password);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function cleanUsername(u: string) {
  return u.toLowerCase().trim();
}

function validateUsername(u: string): string | null {
  if (!/^[a-z0-9_]{3,20}$/.test(u)) {
    return "3-20 caracteres: letras, números y guion bajo (_)";
  }
  return null;
}

// ── Recompensa de registro (solo primera vez) ─────────────────────────────────
const REGISTER_COINS    = 500;
const REGISTER_DIAMONDS = 5;

// ── Registrar cuenta (añade email + contraseña + username al usuario anónimo) ─
// Devuelve { success, coinsAdded, diamondsAdded } solo en primera inscripción
export const registerAccount = mutation({
  args: {
    userId:           v.id("users"),
    email:            v.string(),
    password:         v.string(),
    username:         v.string(),
    referrerUsername: v.optional(v.string()),  // username del cuate que invitó
  },
  handler: async (ctx, { userId, email, password, username, referrerUsername }) => {
    const uname      = cleanUsername(username);
    const emailLower = email.toLowerCase().trim();

    const err = validateUsername(uname);
    if (err) throw new Error(err);

    if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

    // Correo no debe estar en otra cuenta
    const emailConflict = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();
    if (emailConflict && emailConflict._id !== userId) {
      throw new Error("Este correo ya tiene una cuenta. Usa 'Entrar' en su lugar.");
    }

    // Username único
    const usernameConflict = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", uname))
      .first();
    if (usernameConflict && usernameConflict._id !== userId) {
      throw new Error("Ese nombre ya lo tiene otro cuate. ¡Elige otro!");
    }

    const passwordHash = await hashPassword(password);

    // Dar recompensa (solo si aún no tenía correo = primera vez)
    const user = await ctx.db.get(userId);
    const isFirstTime = !user?.email;

    const patch: Record<string, unknown> = {
      email:        emailLower,
      passwordHash,
      username:     uname,
    };

    if (isFirstTime) {
      patch.coins    = (user?.coins    ?? 0) + REGISTER_COINS;
      patch.diamonds = (user?.diamonds ?? 0) + REGISTER_DIAMONDS;
    }

    await ctx.db.patch(userId, patch);

    // ── Claim referral bonus if invited by another user ───────────────────────────
    let referralResult = null;
    if (isFirstTime && referrerUsername) {
      try {
        const referrerUsernameCleaned = referrerUsername.toLowerCase().trim();
        const referrer = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", referrerUsernameCleaned))
          .first();

        if (referrer && referrer._id !== userId) {
          const currentReferred = await ctx.db.get(userId);
          if (!currentReferred?.referredBy) {
            const COINS_REFERRED  = 200;
            const COINS_REFERRER  = 300;
            const MILESTONES = [
              { count: 5,  coins: 500,   diamonds: 2  },
              { count: 10, coins: 1000,  diamonds: 5  },
              { count: 25, coins: 2000,  diamonds: 15 },
              { count: 50, coins: 3000,  diamonds: 30 },
            ];
            const newCount = (referrer.referralCount ?? 0) + 1;
            const milestone = MILESTONES.find((m) => m.count === newCount) ?? null;

            const referrerCoinsGain   = COINS_REFERRER + (milestone?.coins   ?? 0);
            const referrerDiamondGain = milestone?.diamonds ?? 0;

            // Award referred user bonus on top of already-patched coins
            await ctx.db.patch(userId, {
              coins:      (currentReferred?.coins ?? 0) + COINS_REFERRED,
              referredBy: referrer._id,
            });

            // Award referrer
            await ctx.db.patch(referrer._id, {
              coins:         (referrer.coins    ?? 0) + referrerCoinsGain,
              diamonds:      (referrer.diamonds ?? 0) + referrerDiamondGain,
              referralCount: newCount,
            });

            await ctx.db.insert("referrals", {
              referrerId:     referrer._id,
              referredId:     userId,
              createdAt:      Date.now(),
              coinsReferrer:  referrerCoinsGain,
              coinsReferred:  COINS_REFERRED,
              milestoneBonus: milestone ? true : undefined,
            });

            referralResult = {
              coinsReferred:    COINS_REFERRED,
              coinsReferrer:    referrerCoinsGain,
              milestoneReached: milestone?.count ?? null,
            };
          }
        }
      } catch (e) {
        // Referral is non-critical — never block registration
        if (process.env.NODE_ENV !== "production") console.log("[referral] error:", e);
      }
    }

    return {
      success:       true,
      coinsAdded:    isFirstTime ? REGISTER_COINS    : 0,
      diamondsAdded: isFirstTime ? REGISTER_DIAMONDS : 0,
      referral:      referralResult,
    };
  },
});

// ── Entrar con correo + contraseña ────────────────────────────────────────────
export const loginWithEmail = mutation({
  args: {
    email:    v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const emailLower = email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();

    if (!user) throw new Error("No encontramos una cuenta con ese correo.");
    if (!user.passwordHash) throw new Error("Esta cuenta usa Google o Apple. Inicia sesión por ahí.");

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) throw new Error("Contraseña incorrecta. ¡Échale otro intento!");

    return { userId: user._id as string };
  },
});

// ── Elegir / cambiar username ─────────────────────────────────────────────────
export const setUsername = mutation({
  args: { userId: v.id("users"), username: v.string() },
  handler: async (ctx, { userId, username }) => {
    const uname = cleanUsername(username);
    const err = validateUsername(uname);
    if (err) throw new Error(err);

    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", uname))
      .first();
    if (taken && taken._id !== userId) throw new Error("Ese nombre ya lo tiene otro cuate. ¡Elige otro!");

    await ctx.db.patch(userId, { username: uname });
    return { success: true };
  },
});

// ── Verificar disponibilidad de username ─────────────────────────────────────
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const uname = cleanUsername(username);
    if (validateUsername(uname)) return { available: false, reason: "invalid" };

    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", uname))
      .first();
    return { available: !taken };
  },
});

// ── Buscar usuarios por prefijo de username ───────────────────────────────────
export const searchUsers = query({
  args: {
    query:         v.string(),
    excludeUserId: v.optional(v.string()),
  },
  handler: async (ctx, { query: searchTerm, excludeUserId }) => {
    if (searchTerm.length < 2) return [];
    const lower = cleanUsername(searchTerm);

    const results = await ctx.db
      .query("users")
      .withIndex("by_username", (q) =>
        q.gte("username", lower).lt("username", lower + "\uffff")
      )
      .take(20);

    return results
      .filter((u) => u.username && u._id !== excludeUserId)
      .slice(0, 10)
      .map((u) => ({
        userId:   u._id,
        username: u.username!,
        name:     u.name,
        avatar:   u.avatar,
      }));
  },
});

// ── Agregar cuate ─────────────────────────────────────────────────────────────
export const addFriend = mutation({
  args: { userId: v.id("users"), friendId: v.id("users") },
  handler: async (ctx, { userId, friendId }) => {
    if (userId === friendId) throw new Error("No puedes agregarte a ti mismo 😅");

    // Verificar que no exista ya
    const exists = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", friendId)
      )
      .first();
    if (exists) return { success: true }; // ya estaba

    await ctx.db.insert("friendships", { userId, friendId, createdAt: Date.now() });
    return { success: true };
  },
});

// ── Quitar cuate ──────────────────────────────────────────────────────────────
export const removeFriend = mutation({
  args: { userId: v.id("users"), friendId: v.id("users") },
  handler: async (ctx, { userId, friendId }) => {
    const rec = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", friendId)
      )
      .first();
    if (rec) await ctx.db.delete(rec._id);
    return { success: true };
  },
});

// ── Obtener mis cuates (con info de usuario) ──────────────────────────────────
export const getMyFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const result = await Promise.all(
      friendships.map(async (f) => {
        const u = await ctx.db.get(f.friendId);
        if (!u) return null;
        return {
          friendId: f.friendId,
          username: u.username ?? null,
          name:     u.name,
          avatar:   u.avatar,
          addedAt:  f.createdAt,
        };
      })
    );
    return result.filter(Boolean);
  },
});

// ── Leaderboard de cuates (para tab Comparar) ────────────────────────────────
export const getFriendsLeaderboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Include self
    const selfUser = await ctx.db.get(userId);
    const friendIds = friendships.map((f) => f.friendId);

    const users = await Promise.all(
      [...friendIds, userId].map((id) => ctx.db.get(id))
    );

    return users
      .filter(Boolean)
      .map((u) => ({
        userId:   u!._id as string,
        username: u!.username ?? null,
        name:     u!.name ?? null,
        avatar:   u!.avatar ?? null,
        tacos:    u!.tacos ?? 0,
        coins:    u!.coins ?? 0,
        isSelf:   u!._id === userId,
      }))
      .sort((a, b) => b.tacos - a.tacos);
  },
});

// ── Comprobar si ya es cuate ──────────────────────────────────────────────────
export const isFriend = query({
  args: { userId: v.id("users"), friendId: v.id("users") },
  handler: async (ctx, { userId, friendId }) => {
    const rec = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", friendId)
      )
      .first();
    return !!rec;
  },
});
