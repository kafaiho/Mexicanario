import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { COINS_REFERRED, COINS_REFERRER, REFERRAL_MILESTONES } from "./referralConfig";
import { buildChallengeWordData } from "./friendsPresentation";

// ── SHA-256 usando Web Crypto API (disponible en V8 runtime de Convex) ────────
async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function cleanUsername(u: string) {
  return u.replace(/^@/, "").toLowerCase().trim();
}

function validateUsername(u: string): string | null {
  if (!/^[a-z0-9_]{3,20}$/.test(u)) {
    return "3-20 caracteres: letras, números y guion bajo (_)";
  }
  return null;
}

// ── Recompensa de registro (solo primera vez) ─────────────────────────────────
const REGISTER_COINS = 500;
const REGISTER_DIAMONDS = 5;

// ── Registrar cuenta (añade email + contraseña + username al usuario anónimo) ─
// Devuelve { success, coinsAdded, diamondsAdded } solo en primera inscripción
export const registerAccountInDb = internalMutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    password: v.string(),
    username: v.string(),
    referrerUsername: v.optional(v.string()),  // username del cuate que invitó
  },
  handler: async (ctx, { userId, email, password, username, referrerUsername }) => {
    const uname = cleanUsername(username);
    const emailLower = email.toLowerCase().trim();

    const err = validateUsername(uname);
    if (err) throw new ConvexError(err);

    if (password.length < 6) throw new ConvexError("La contraseña debe tener al menos 6 caracteres");

    // Correo no debe estar en otra cuenta
    const emailConflict = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();
    if (emailConflict && emailConflict._id !== userId) {
      throw new ConvexError("Este correo ya tiene una cuenta. Usa 'Entrar' en su lugar.");
    }

    // Username único
    const usernameConflict = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", uname))
      .first();
    if (usernameConflict && usernameConflict._id !== userId) {
      throw new ConvexError("Ese nombre ya lo tiene otro cuate. ¡Elige otro!");
    }

    const passwordHash = await hashPassword(password);

    // Dar recompensa (solo si aún no tenía correo = primera vez)
    const user = await ctx.db.get(userId);
    const isFirstTime = !user?.email;

    const patch: Record<string, unknown> = {
      email: emailLower,
      passwordHash,
      username: uname,
      name: uname,
    };

    if (isFirstTime) {
      patch.coins = (user?.coins ?? 0) + REGISTER_COINS;
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
            const newCount = (referrer.referralCount ?? 0) + 1;
            const milestone = REFERRAL_MILESTONES.find((m) => m.count === newCount) ?? null;

            const referrerCoinsGain = COINS_REFERRER + (milestone?.coins ?? 0);
            const referrerDiamondGain = milestone?.diamonds ?? 0;

            // Award referred user bonus on top of already-patched coins
            await ctx.db.patch(userId, {
              coins: (currentReferred?.coins ?? 0) + COINS_REFERRED,
              referredBy: referrer._id,
            });

            // Award referrer
            await ctx.db.patch(referrer._id, {
              coins: (referrer.coins ?? 0) + referrerCoinsGain,
              diamonds: (referrer.diamonds ?? 0) + referrerDiamondGain,
              referralCount: newCount,
            });

            await ctx.db.insert("referrals", {
              referrerId: referrer._id,
              referredId: userId,
              createdAt: Date.now(),
              coinsReferrer: referrerCoinsGain,
              coinsReferred: COINS_REFERRED,
              milestoneBonus: milestone ? true : undefined,
            });

            referralResult = {
              coinsReferred: COINS_REFERRED,
              coinsReferrer: referrerCoinsGain,
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
      success: true,
      coinsAdded: isFirstTime ? REGISTER_COINS : 0,
      diamondsAdded: isFirstTime ? REGISTER_DIAMONDS : 0,
      referral: referralResult,
      username: uname,
      email: emailLower,
    };
  },
});

export const registerAccount = action({
  args: {
    userId: v.id("users"),
    email: v.string(),
    password: v.string(),
    username: v.string(),
    referrerUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Efectuar el registro en la base de datos
    const result: any = await ctx.runMutation(internal.friends.registerAccountInDb, args);

    // 2. Intentar mandar el correo de bienvenida (sin bloquear si falla)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Mexicanario <onboarding@resend.dev>",
            to: result.email,
            subject: "¡Bienvenido a Mexicanario! 🎉",
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #8B4513; text-align: center;">
                <h1 style="font-size: 40px; margin-bottom: 5px;">🌮</h1>
                <h2 style="color: #D2691E;">¡Qué onda, ${result.username}!</h2>
                <p style="font-size: 16px; line-height: 1.5;">
                  Ya eres oficialmente un cuate en <strong>Mexicanario</strong>. Prepárate para descubrir, jugar y aprender el lado más divertido del español de México.
                </p>
                <div style="background-color: #F5DEB3; border-radius: 12px; padding: 20px; margin: 20px 0; border: 2px solid #D2691E;">
                  <h3 style="margin-top: 0; color: #8B4513;">Tu cuenta está asegurada</h3>
                  <p style="margin-bottom: 0;">Con este correo podrás recuperar tu cuenta si algún día cambias de celular o se te olvida tu contraseña.</p>
                </div>
                <p style="font-size: 16px;">
                  ¡Órale a darle duro al juego y a armar esa racha!
                </p>
              </div>
            `,
          }),
        });
      } catch (e) {
        // En un registro exitoso, no queremos fallar toda la solicitud si Resend falla
        console.error("No se pudo enviar correo de bienvenida", e);
      }
    }

    return result;
  },
});

// ── Entrar con correo + contraseña ────────────────────────────────────────────
export const loginWithEmail = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const emailLower = email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();

    if (!user) throw new ConvexError("No encontramos una cuenta con ese correo.");
    if (!user.passwordHash) throw new ConvexError("Esta cuenta usa Google o Apple. Inicia sesión por ahí.");

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) throw new ConvexError("Contraseña incorrecta. ¡Échale otro intento!");

    return { userId: user._id as string };
  },
});

// ── Elegir / cambiar username ─────────────────────────────────────────────────
export const setUsername = mutation({
  args: { userId: v.id("users"), username: v.string() },
  handler: async (ctx, { userId, username }) => {
    const uname = cleanUsername(username);
    const err = validateUsername(uname);
    if (err) throw new ConvexError(err);

    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", uname))
      .first();
    if (taken && taken._id !== userId) throw new ConvexError("Ese nombre ya lo tiene otro cuate. ¡Elige otro!");

    await ctx.db.patch(userId, { username: uname, name: uname });
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
    query: v.string(),
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
        userId: u._id,
        username: u.username!,
        name: u.name,
        avatar: u.avatar,
      }));
  },
});

// ── Agregar cuate (bidireccional) ──────────────────────────────────────────────
// Si el otro ya te envió solicitud → auto-acepta ambas direcciones.
// Si no → crea solicitud pendiente.
export const addFriend = mutation({
  args: { userId: v.id("users"), friendId: v.id("users") },
  handler: async (ctx, { userId, friendId }) => {
    if (userId === friendId) throw new ConvexError("No puedes agregarte a ti mismo");

    // Verificar que no exista ya (A→B)
    const existingAB = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", friendId)
      )
      .first();

    if (existingAB) {
      // Already friends or pending — if pending, keep as-is
      if (!existingAB.status || existingAB.status === "accepted") {
        return { success: true, status: "already_friends" };
      }
      // If declined, allow re-request
      if (existingAB.status === "declined") {
        await ctx.db.patch(existingAB._id, { status: "pending", createdAt: Date.now() });
        return { success: true, status: "re_requested" };
      }
      return { success: true, status: "pending" };
    }

    // Check if the other person already sent us a request (B→A)
    const existingBA = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", friendId).eq("friendId", userId)
      )
      .first();

    const now = Date.now();

    if (existingBA && existingBA.status === "pending") {
      // Auto-accept: B already wants to be friends with A
      await ctx.db.patch(existingBA._id, { status: "accepted" });
      // Create reverse direction (A→B accepted)
      await ctx.db.insert("friendships", {
        userId,
        friendId,
        status: "accepted",
        createdAt: now,
      });
      return { success: true, status: "auto_accepted" };
    }

    if (existingBA && (!existingBA.status || existingBA.status === "accepted")) {
      // They already have us as friend — just create reverse
      await ctx.db.insert("friendships", {
        userId,
        friendId,
        status: "accepted",
        createdAt: now,
      });
      return { success: true, status: "accepted" };
    }

    // No existing relationship → create pending request
    await ctx.db.insert("friendships", {
      userId,
      friendId,
      status: "pending",
      createdAt: now,
    });

    // Notificar al destinatario: "alguien quiere ser tu cuate"
    const sender = await ctx.db.get(userId);
    await ctx.db.insert("friendNotifications", {
      userId: friendId,  // quien recibe la notificación
      type: "request",
      fromUserId: userId,
      fromUsername: sender?.username ?? undefined,
      fromName: sender?.name ?? "Alguien",
      read: false,
      createdAt: now,
    });

    return { success: true, status: "pending" };
  },
});

// ── Aceptar solicitud de cuate ──────────────────────────────────────────────
export const acceptFriendRequest = mutation({
  args: { userId: v.id("users"), requesterId: v.id("users") },
  handler: async (ctx, { userId, requesterId }) => {
    // Find the pending request (requester→userId)
    const request = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", requesterId).eq("friendId", userId)
      )
      .first();

    if (!request || request.status !== "pending") {
      throw new ConvexError("No hay solicitud pendiente de este cuate.");
    }

    const now = Date.now();

    // Accept the request
    await ctx.db.patch(request._id, { status: "accepted" });

    // Create reverse direction (userId→requesterId)
    const reverseExists = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", requesterId)
      )
      .first();

    if (!reverseExists) {
      await ctx.db.insert("friendships", {
        userId,
        friendId: requesterId,
        status: "accepted",
        createdAt: now,
      });
    } else {
      await ctx.db.patch(reverseExists._id, { status: "accepted" });
    }

    // Notificar al que envió la solicitud: "te aceptaron"
    const accepter = await ctx.db.get(userId);
    await ctx.db.insert("friendNotifications", {
      userId: requesterId,  // quien recibe la notificación
      type: "accepted",
      fromUserId: userId,
      fromUsername: accepter?.username ?? undefined,
      fromName: accepter?.name ?? "Alguien",
      read: false,
      createdAt: now,
    });

    return { success: true };
  },
});

// ── Rechazar solicitud de cuate ─────────────────────────────────────────────
export const declineFriendRequest = mutation({
  args: { userId: v.id("users"), requesterId: v.id("users") },
  handler: async (ctx, { userId, requesterId }) => {
    const request = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", requesterId).eq("friendId", userId)
      )
      .first();

    if (!request || request.status !== "pending") {
      throw new ConvexError("No hay solicitud pendiente de este cuate.");
    }

    await ctx.db.patch(request._id, { status: "declined" });
    return { success: true };
  },
});

// ── Solicitudes pendientes (entrantes) ──────────────────────────────────────
export const getPendingRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const pending = await ctx.db
      .query("friendships")
      .withIndex("by_friend_status", (q) =>
        q.eq("friendId", userId).eq("status", "pending")
      )
      .collect();

    const result = await Promise.all(
      pending.map(async (f) => {
        const u = await ctx.db.get(f.userId);
        if (!u) return null;
        return {
          requesterId: f.userId,
          username: u.username ?? null,
          name: u.name,
          avatar: u.avatar,
          sentAt: f.createdAt,
        };
      })
    );
    return result.filter(Boolean);
  },
});

// ── Quitar cuate (borra ambas direcciones) ──────────────────────────────────
export const removeFriend = mutation({
  args: { userId: v.id("users"), friendId: v.id("users") },
  handler: async (ctx, { userId, friendId }) => {
    // Delete A→B
    const recAB = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", friendId)
      )
      .first();
    if (recAB) await ctx.db.delete(recAB._id);

    // Delete B→A
    const recBA = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", friendId).eq("friendId", userId)
      )
      .first();
    if (recBA) await ctx.db.delete(recBA._id);

    return { success: true };
  },
});

// ── Perfil Público (para Modal de Competencia) ────────────────────────────────
export const getUserProfile = query({
  args: { targetId: v.id("users") },
  handler: async (ctx, { targetId }) => {
    const u = await ctx.db.get(targetId);
    if (!u) return null;

    // Fetch mini-game all-time bests
    const nahual = await ctx.db.query("nahualScores").withIndex("by_user", (q) => q.eq("userId", targetId)).first();
    const taquero = await ctx.db.query("taqueroScores").withIndex("by_user", (q) => q.eq("userId", targetId)).first();
    const albures = await ctx.db.query("alburesScores").withIndex("by_user", (q) => q.eq("userId", targetId)).first();
    const loteria = await ctx.db.query("loteriaScores").withIndex("by_user", (q) => q.eq("userId", targetId)).first();

    return {
      userId: u._id,
      username: u.username ?? null,
      name: u.name ?? "Jugador",
      avatar: u.avatar ?? "default",
      tacos: u.tacos ?? 0,
      xp: u.xp ?? 0,
      playStreakMax: u.playStreakMax ?? 0,
      leagueTrophies: u.leagueTrophies ?? 0,
      bestCombo: u.bestCombo ?? 0,
      leagueHighestDiv: u.leagueHighestDiv ?? null,
      miniGames: {
        nahual: nahual?.allTimeBest ?? 0,
        taquero: taquero?.allTimeBest ?? 0,
        albures: albures?.allTimeBest ?? 0,
        loteria: loteria?.allTimeBest ?? 0,
      }
    };
  },
});

// ── Obtener mis cuates (solo aceptados) ──────────────────────────────────────
export const getMyFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Filter: accepted or null (legacy — pre-bidirectional records)
    const accepted = friendships.filter(
      (f) => !f.status || f.status === "accepted"
    );

    const result = await Promise.all(
      accepted.map(async (f) => {
        const u = await ctx.db.get(f.friendId);
        if (!u) return null;
        return {
          friendId: f.friendId,
          username: u.username ?? null,
          name: u.name,
          avatar: u.avatar,
          addedAt: f.createdAt,
        };
      })
    );
    return result.filter(Boolean);
  },
});

// ── Leaderboard de cuates (para tab Comparar) ────────────────────────────────
// Soporta vista "alltime" (tacos) y "weekly" (XP semanal).
export const getFriendsLeaderboard = query({
  args: {
    userId: v.id("users"),
    period: v.optional(v.string()),  // "alltime" | "weekly" — default "alltime"
  },
  handler: async (ctx, { userId, period }) => {
    const mode = period ?? "alltime";

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Only accepted/legacy friends
    const accepted = friendships.filter(
      (f) => !f.status || f.status === "accepted"
    );
    const friendIds = accepted.map((f) => f.friendId);
    const allIds = [...friendIds, userId];

    if (mode === "weekly") {
      // Get current week ID
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const cst = new Date(utc + (-6 * 60 * 60 * 1000));
      const jan4 = new Date(cst.getFullYear(), 0, 4);
      const dayOfYear = Math.floor((cst.getTime() - jan4.getTime()) / 86400000) + 4;
      const weekNum = Math.ceil(dayOfYear / 7);
      const weekId = `${cst.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

      // Batch fetch weekly scores + user data
      const entries = await Promise.all(
        allIds.map(async (id) => {
          const score = await ctx.db
            .query("weeklyFriendScores")
            .withIndex("by_user_week", (q) => q.eq("userId", id).eq("weekId", weekId))
            .first();
          const u = await ctx.db.get(id);
          if (!u) return null;
          return {
            userId: u._id as string,
            username: u.username ?? null,
            name: u.name ?? null,
            avatar: u.avatar ?? null,
            xpThisWeek: score?.xpThisWeek ?? 0,
            wordsThisWeek: score?.wordsThisWeek ?? 0,
            bestComboThisWeek: score?.bestComboThisWeek ?? 0,
            tacos: u.tacos ?? 0,
            eloRating: u.eloRating ?? null,
            isSelf: u._id === userId,
          };
        })
      );

      return entries
        .filter(Boolean)
        .sort((a: any, b: any) => b.xpThisWeek - a.xpThisWeek);
    }

    // All-time mode (by tacos)
    const users = await Promise.all(
      allIds.map((id) => ctx.db.get(id))
    );

    return users
      .filter(Boolean)
      .map((u) => ({
        userId: u!._id as string,
        username: u!.username ?? null,
        name: u!.name ?? null,
        avatar: u!.avatar ?? null,
        tacos: u!.tacos ?? 0,
        coins: u!.coins ?? 0,
        xpThisWeek: 0,
        wordsThisWeek: 0,
        bestComboThisWeek: 0,
        eloRating: u!.eloRating ?? null,
        isSelf: u!._id === userId,
      }))
      .sort((a, b) => b.tacos - a.tacos);
  },
});

// ── Comprobar si ya es cuate (bidireccional) ─────────────────────────────────
export const isFriend = query({
  args: { userId: v.id("users"), friendId: v.id("users") },
  handler: async (ctx, { userId, friendId }) => {
    const rec = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", friendId)
      )
      .first();
    if (rec && (!rec.status || rec.status === "accepted")) return true;
    // Check reverse
    const rev = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", friendId).eq("friendId", userId)
      )
      .first();
    return !!(rev && (!rev.status || rev.status === "accepted"));
  },
});

// ── Migración: hacer bidireccionales las amistades legacy ───────────────────
// Ejecutar una vez desde el Convex dashboard.
export const migrateFriendshipsBidirectional = internalMutation({
  handler: async (ctx) => {
    const all = await ctx.db.query("friendships").collect();
    let migrated = 0;

    for (const f of all) {
      // Mark legacy records as accepted if no status
      if (!f.status) {
        await ctx.db.patch(f._id, { status: "accepted" });
      }

      // Create reverse direction if missing
      const reverse = await ctx.db
        .query("friendships")
        .withIndex("by_user_friend", (q) =>
          q.eq("userId", f.friendId).eq("friendId", f.userId)
        )
        .first();

      if (!reverse) {
        await ctx.db.insert("friendships", {
          userId: f.friendId,
          friendId: f.userId,
          status: "accepted",
          createdAt: f.createdAt,
        });
        migrated++;
      }
    }

    return { total: all.length, migratedNewRecords: migrated };
  },
});

// ── Recuperación de Contraseña ────────────────────────────────────────────────

// 1. Generar código y guardarlo en la tabla
export const createPasswordResetCode = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const emailLower = email.toLowerCase().trim();

    // Verificar que el usuario exista y no use red social (sin passwordHash)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();

    if (!user) {
      throw new ConvexError("No encontramos una cuenta con ese correo.");
    }
    if (!user.passwordHash) {
      throw new ConvexError(
        "Esta cuenta usa Google o Apple. Inicia sesión por ahí."
      );
    }

    // Borrar códigos anteriores de este correo para evitar spam/confusión
    const existing = await ctx.db
      .query("passwordResets")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

    await ctx.db.insert("passwordResets", {
      email: emailLower,
      code,
      expiresAt,
    });

    return { code, username: user.username || "cuate" };
  },
});

// 2. Acción expuesta al cliente para solicitar el reseteo (envía el correo)
export const requestPasswordReset = action({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new ConvexError("Servicio de correos no configurado (falta API Key)");
    }

    // Obtener código
    const { code, username } = await ctx.runMutation(internal.friends.createPasswordResetCode, { email });

    // Enviar correo vía Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mexicanario <onboarding@resend.dev>",
        to: email.toLowerCase().trim(),
        subject: "Código de recuperación - Mexicanario",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #8B4513;">
            <h2>¡Hola, ${username}! 🌮</h2>
            <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta en Mexicanario.</p>
            <p>Tu código de recuperación es:</p>
            <h1 style="background: #F8BE17; color: #8B4513; padding: 10px; text-align: center; border-radius: 8px; letter-spacing: 4px;">
              ${code}
            </h1>
            <p>Este código expira en 15 minutos.</p>
            <p>Si no pediste esto, simplemente ignora el correo. ¡Nos vemos en el juego!</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend Error:", errorText);
      throw new ConvexError("No pudimos enviar el correo. Intenta de nuevo más tarde.");
    }

    return { success: true };
  },
});

// 3. Verificar código y cambiar contraseña
export const resetPassword = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { email, code, newPassword }) => {
    const emailLower = email.toLowerCase().trim();

    if (newPassword.length < 6) {
      throw new ConvexError("La nueva contraseña debe tener al menos 6 caracteres.");
    }

    // Buscar código
    const resetDoc = await ctx.db
      .query("passwordResets")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .filter((q) => q.eq(q.field("code"), code))
      .first();

    if (!resetDoc) {
      throw new ConvexError("El código de verificación es incorrecto.");
    }

    if (Date.now() > resetDoc.expiresAt) {
      // Borrar por limpieza
      await ctx.db.delete(resetDoc._id);
      throw new ConvexError("El código ya expiró. Solicita uno nuevo.");
    }

    // Cambiar contraseña
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();

    if (!user) {
      throw new ConvexError("Usuario no encontrado.");
    }

    // Usar la función hashPassword ya definida en este archivo
    const enc = new TextEncoder();
    const data = enc.encode(newPassword);
    const buf = await crypto.subtle.digest("SHA-256", data);
    const passwordHash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await ctx.db.patch(user._id, { passwordHash });

    // Borrar TODOS los códigos de este usuario para que no se reusen
    const allResets = await ctx.db
      .query("passwordResets")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .collect();
    for (const doc of allResets) {
      await ctx.db.delete(doc._id);
    }

    return { success: true };
  },
});

// ── Notificaciones de cuates ────────────────────────────────────────────────

export const getUnreadFriendNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("friendNotifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .order("desc")
      .take(20);
  },
});

export const markFriendNotificationsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const unread = await ctx.db
      .query("friendNotifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
    return { marked: unread.length };
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// ═══  RETOS ENTRE CUATES  ═══════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

const CHALLENGE_BET = 50;         // coins cada jugador apuesta
const CHALLENGE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// ── Crear reto ─────────────────────────────────────────────────────────────
export const createChallenge = mutation({
  args: {
    challengerId: v.id("users"),
    challengedId: v.id("users"),
    challengerAttempts: v.number(),
    challengerTimeMs: v.number(),
  },
  handler: async (ctx, { challengerId, challengedId, challengerAttempts, challengerTimeMs }) => {
    const now = Date.now();

    // Verify friendship
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", challengerId).eq("friendId", challengedId)
      )
      .first();
    if (!friendship || (friendship.status !== "accepted" && friendship.status != null)) {
      throw new ConvexError("Solo puedes retar a tus cuates.");
    }

    // Check challenger has enough coins
    const challenger = await ctx.db.get(challengerId);
    if (!challenger || (challenger.coins ?? 0) < CHALLENGE_BET) {
      throw new ConvexError(`Necesitas al menos ${CHALLENGE_BET} monedas para retar.`);
    }

    // Pick a random word from completed levels (so both players have seen it)
    const totalWords = await ctx.db.query("words").collect();
    if (totalWords.length === 0) throw new ConvexError("No hay palabras disponibles.");
    const randomIdx = Math.floor(Math.random() * totalWords.length);
    const word = totalWords[randomIdx];

    // Deduct bet from challenger
    await ctx.db.patch(challengerId, { coins: (challenger.coins ?? 0) - CHALLENGE_BET });

    const challengeId = await ctx.db.insert("friendChallenges", {
      challengerId,
      challengedId,
      wordId: word._id,
      status: "pending",
      challengerAttempts,
      challengerTimeMs,
      rewardCoins: CHALLENGE_BET,
      createdAt: now,
      expiresAt: now + CHALLENGE_TTL_MS,
    });

    // Notify challenged user
    await ctx.db.insert("friendNotifications", {
      userId: challengedId,
      type: "challenge",
      fromUserId: challengerId,
      fromUsername: challenger.username ?? undefined,
      fromName: challenger.name ?? "Alguien",
      read: false,
      createdAt: now,
    });

    return { challengeId, wordId: word._id, word: word.word };
  },
});

// ── Aceptar reto (paso separado: deducir coins + cambiar status → active) ──
export const acceptChallenge = mutation({
  args: {
    challengeId: v.id("friendChallenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, { challengeId, userId }) => {
    const challenge = await ctx.db.get(challengeId);
    if (!challenge) throw new ConvexError("Reto no encontrado.");
    if (challenge.status !== "pending") throw new ConvexError("Este reto ya no está pendiente.");
    if (challenge.challengedId !== userId) throw new ConvexError("Este reto no es para ti.");

    if (Date.now() > challenge.expiresAt) {
      // Expired — refund challenger
      await ctx.db.patch(challengeId, { status: "expired" });
      const challenger = await ctx.db.get(challenge.challengerId);
      if (challenger) {
        await ctx.db.patch(challenge.challengerId, {
          coins: (challenger.coins ?? 0) + CHALLENGE_BET,
        });
      }
      return { expired: true };
    }

    // Check challenged user has enough coins
    const challenged = await ctx.db.get(userId);
    if (!challenged || (challenged.coins ?? 0) < CHALLENGE_BET) {
      throw new ConvexError(`Necesitas al menos ${CHALLENGE_BET} monedas para aceptar el reto.`);
    }

    // Deduct bet from challenged
    await ctx.db.patch(userId, { coins: (challenged.coins ?? 0) - CHALLENGE_BET });

    // Change status to active
    await ctx.db.patch(challengeId, { status: "active" });

    // Return word data for gameplay
    const word = await ctx.db.get(challenge.wordId);
    return {
      expired: false,
      challengeId: challenge._id,
      wordData: buildChallengeWordData(word),
      betCoins: CHALLENGE_BET,
      challengerName: (await ctx.db.get(challenge.challengerId))?.name ?? "Cuate",
    };
  },
});

// ── Responder a un reto (enviar resultado después de jugar) ────────────────
export const respondToChallenge = mutation({
  args: {
    challengeId: v.id("friendChallenges"),
    userId: v.id("users"),
    attempts: v.number(),
    timeMs: v.number(),
  },
  handler: async (ctx, { challengeId, userId, attempts, timeMs }) => {
    const challenge = await ctx.db.get(challengeId);
    if (!challenge) throw new ConvexError("Reto no encontrado.");
    if (challenge.status !== "active") throw new ConvexError("Este reto no está activo. Acepta primero.");
    if (challenge.challengedId !== userId) throw new ConvexError("Este reto no es para ti.");

    // Anti-cheat: validate timeMs and attempts
    if (timeMs < 1000) throw new ConvexError("Tiempo de resolución inválido.");
    if (attempts > 10 || attempts < 1) throw new ConvexError("Intentos inválidos.");

    // Determine winner: fewer attempts wins; tiebreak: faster time
    const cAttempts = challenge.challengerAttempts ?? 999;
    const cTimeMs = challenge.challengerTimeMs ?? 999999;

    let winnerId: any;
    if (attempts < cAttempts) {
      winnerId = userId;
    } else if (attempts > cAttempts) {
      winnerId = challenge.challengerId;
    } else {
      // Same attempts → faster time wins
      winnerId = timeMs < cTimeMs ? userId : challenge.challengerId;
    }

    // Award winner 2x bet
    const winner = await ctx.db.get(winnerId as any);
    if (winner) {
      await ctx.db.patch(winnerId as any, {
        coins: ((winner as any).coins ?? 0) + CHALLENGE_BET * 2,
      });
    }

    await ctx.db.patch(challengeId, {
      status: "completed",
      challengedAttempts: attempts,
      challengedTimeMs: timeMs,
      winnerId,
    });

    // Notify challenger about result
    const challengedUser = await ctx.db.get(userId);
    await ctx.db.insert("friendNotifications", {
      userId: challenge.challengerId,
      type: "challenge_result",
      fromUserId: userId,
      fromUsername: challengedUser?.username ?? undefined,
      fromName: challengedUser?.name ?? "Alguien",
      read: false,
      createdAt: Date.now(),
    });

    return {
      winnerId,
      isWinner: winnerId === userId,
      reward: CHALLENGE_BET * 2,
      challengerAttempts: cAttempts,
      challengerTimeMs: cTimeMs,
      challengedAttempts: attempts,
      challengedTimeMs: timeMs,
    };
  },
});

// ── Mis retos pendientes (que me retaron) ──────────────────────────────────
export const getMyPendingChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    const pending = await ctx.db
      .query("friendChallenges")
      .withIndex("by_challenged_status", (q) =>
        q.eq("challengedId", userId).eq("status", "pending")
      )
      .collect();

    const result = await Promise.all(
      pending.map(async (c) => {
        if (now > c.expiresAt) return null; // skip expired
        const challenger = await ctx.db.get(c.challengerId);
        const word = await ctx.db.get(c.wordId);
        return {
          challengeId: c._id,
          challengerName: challenger?.username ?? challenger?.name ?? "Cuate",
          challengerAvatar: challenger?.avatar ?? "🌮",
          word: word?.word ?? "???",
          wordMeaning: word?.meaning ?? "",
          betCoins: c.rewardCoins,
          expiresAt: c.expiresAt,
          createdAt: c.createdAt,
        };
      })
    );
    return result.filter(Boolean);
  },
});

// ── Historial de retos ─────────────────────────────────────────────────────
export const getChallengeHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Challenges I created
    const sent = await ctx.db
      .query("friendChallenges")
      .withIndex("by_challenger", (q) => q.eq("challengerId", userId))
      .order("desc")
      .take(20);

    // Challenges sent to me
    const received = await ctx.db
      .query("friendChallenges")
      .withIndex("by_challenged_status", (q) => q.eq("challengedId", userId))
      .order("desc")
      .take(20);

    const allChallenges = [...sent, ...received]
      .filter((c) => c.status === "completed" || c.status === "expired")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);

    const result = await Promise.all(
      allChallenges.map(async (c) => {
        const opponent = c.challengerId === userId
          ? await ctx.db.get(c.challengedId)
          : await ctx.db.get(c.challengerId);
        const word = await ctx.db.get(c.wordId);
        return {
          challengeId: c._id,
          opponentName: opponent?.username ?? opponent?.name ?? "Cuate",
          opponentAvatar: opponent?.avatar ?? "🌮",
          word: word?.word ?? "???",
          status: c.status,
          iWon: c.winnerId === userId,
          wasTie: false,
          betCoins: c.rewardCoins,
          createdAt: c.createdAt,
          iWasChallenger: c.challengerId === userId,
        };
      })
    );
    return result;
  },
});

// ── Expirar retos viejos (cron diario) ────────────────────────────────────
export const expireOldChallenges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Get all pending challenges
    const pending = await ctx.db
      .query("friendChallenges")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    let expired = 0;
    for (const c of pending) {
      if (now > c.expiresAt) {
        await ctx.db.patch(c._id, { status: "expired" });
        // Refund challenger
        const challenger = await ctx.db.get(c.challengerId);
        if (challenger) {
          await ctx.db.patch(c.challengerId, {
            coins: (challenger.coins ?? 0) + CHALLENGE_BET,
          });
        }
        expired++;
      }
    }

    // Also expire "active" challenges that are >48h old (safety net)
    const active = await ctx.db
      .query("friendChallenges")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const c of active) {
      if (now > c.expiresAt + CHALLENGE_TTL_MS) {
        await ctx.db.patch(c._id, { status: "expired" });
        // Refund both players
        const challenger = await ctx.db.get(c.challengerId);
        if (challenger) {
          await ctx.db.patch(c.challengerId, {
            coins: (challenger.coins ?? 0) + CHALLENGE_BET,
          });
        }
        const challenged = await ctx.db.get(c.challengedId);
        if (challenged) {
          await ctx.db.patch(c.challengedId, {
            coins: (challenged.coins ?? 0) + CHALLENGE_BET,
          });
        }
        expired++;
      }
    }

    return { expired };
  },
});
