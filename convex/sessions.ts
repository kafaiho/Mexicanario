import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation, type MutationCtx } from "./_generated/server";
import { checkSession, hashToken, issueSession, sessionEnforced } from "./sessionAuth";

/** Inserts a fresh anonymous player with the starting balance. */
export async function insertGuestUser(ctx: MutationCtx): Promise<Id<"users">> {
  return await ctx.db.insert("users", {
    name: `Player_${Math.floor(Math.random() * 10000)}`,
    coins: 100,
    diamonds: 0,
    country: "MX",
    avatar: "🌮",
    currentLevel: 1,
    culturalOrderVersion: 2,
    createdAt: Date.now(),
  });
}

/** New install: creates an anonymous player and its first device session. */
export const createGuestSession = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await insertGuestUser(ctx);
    const sessionToken = await issueSession(ctx, userId, "guest");
    return { userId: userId as string, sessionToken };
  },
});

/**
 * Upgrade path for installs created before sessions existed: the device only
 * knows its userId. Allowed only during the rollout window (enforcement off).
 */
export const claimLegacySession = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    if (sessionEnforced()) throw new ConvexError("LEGACY_CLAIM_CLOSED");
    const id = ctx.db.normalizeId("users", userId);
    const user = id ? await ctx.db.get(id) : null;
    if (!id || !user) throw new ConvexError("SESSION_INVALID");
    return { sessionToken: await issueSession(ctx, id, "legacy") };
  },
});

/** Logout on this device. */
export const revokeSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const tokenHash = await hashToken(sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

export const verifySession = internalQuery({
  args: { userId: v.string(), sessionToken: v.optional(v.string()) },
  handler: async (ctx, { userId, sessionToken }) => {
    return await checkSession(ctx, userId, sessionToken);
  },
});

export const issueSessionFor = internalMutation({
  args: { userId: v.id("users"), source: v.string() },
  handler: async (ctx, { userId, source }) => issueSession(ctx, userId, source),
});

// ── Google / Apple ────────────────────────────────────────────────────────────

// Public OAuth client IDs of the app (see src/hooks/useSocialAuth.js).
const GOOGLE_CLIENT_IDS = new Set([
  "238037079938-rlg954774ts69r3pkig9f39ubl48dm86.apps.googleusercontent.com",
  "238037079938-uk6c2f89ni70vnu4fu6rmtnghnu3p14m.apps.googleusercontent.com",
  "238037079938-8so7kfjsajjpesp1ger6r8nshfgspjs5.apps.googleusercontent.com",
]);
const APPLE_AUDIENCE = "com.kafaiho.mexicanario";

type SocialIdentity = { socialId: string; email: string | null };

async function verifyGoogleIdToken(idToken: string): Promise<SocialIdentity> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) throw new ConvexError("SOCIAL_TOKEN_INVALID");
  const info: any = await res.json();
  const issuerOk = info.iss === "accounts.google.com" || info.iss === "https://accounts.google.com";
  if (!issuerOk || !GOOGLE_CLIENT_IDS.has(info.aud) || !info.sub || Number(info.exp) * 1000 < Date.now()) {
    throw new ConvexError("SOCIAL_TOKEN_INVALID");
  }
  return { socialId: String(info.sub), email: info.email_verified === "true" || info.email_verified === true ? info.email ?? null : null };
}

function base64UrlToBytes(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const bin = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verifyAppleIdentityToken(idToken: string): Promise<SocialIdentity> {
  const [headerB64, payloadB64, signatureB64] = idToken.split(".");
  if (!headerB64 || !payloadB64 || !signatureB64) throw new ConvexError("SOCIAL_TOKEN_INVALID");
  const decode = (part: string) => JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
  const header = decode(headerB64);
  const payload = decode(payloadB64);

  const keysRes = await fetch("https://appleid.apple.com/auth/keys");
  if (!keysRes.ok) throw new ConvexError("SOCIAL_PROVIDER_UNAVAILABLE");
  const { keys } = (await keysRes.json()) as { keys: any[] };
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk || header.alg !== "RS256") throw new ConvexError("SOCIAL_TOKEN_INVALID");

  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToBytes(signatureB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  );
  if (!valid || payload.iss !== "https://appleid.apple.com" || payload.aud !== APPLE_AUDIENCE
    || !payload.sub || Number(payload.exp) * 1000 < Date.now()) {
    throw new ConvexError("SOCIAL_TOKEN_INVALID");
  }
  return { socialId: String(payload.sub), email: payload.email ?? null };
}

/**
 * Google/Apple sign-in, verified server-side.
 * - mode "restore": returns the linked account (with a new session) if any.
 * - mode "link": links the provider to the caller's account, or reports a
 *   conflict with a session for the already-linked account.
 */
export const socialSignIn = action({
  args: {
    provider: v.union(v.literal("google"), v.literal("apple")),
    idToken: v.string(),
    mode: v.union(v.literal("restore"), v.literal("link")),
    userId: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<
    | { found: true; userId: string; name: string; sessionToken: string }
    | { found: false }
    | { success: true }
    | { conflict: true; existingUserId: string; sessionToken: string }
  > => {
    const identity = args.provider === "google"
      ? await verifyGoogleIdToken(args.idToken)
      : await verifyAppleIdentityToken(args.idToken);
    return await ctx.runMutation(internal.sessions.applySocialSignIn, {
      provider: args.provider,
      socialId: identity.socialId,
      email: identity.email ?? undefined,
      mode: args.mode,
      userId: args.userId,
      sessionToken: args.sessionToken,
    });
  },
});

export const applySocialSignIn = internalMutation({
  args: {
    provider: v.union(v.literal("google"), v.literal("apple")),
    socialId: v.string(),
    email: v.optional(v.string()),
    mode: v.union(v.literal("restore"), v.literal("link")),
    userId: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<
    | { found: true; userId: string; name: string; sessionToken: string }
    | { found: false }
    | { success: true }
    | { conflict: true; existingUserId: string; sessionToken: string }
  > => {
    const existing = args.provider === "google"
      ? await ctx.db.query("users").withIndex("by_googleId", (q) => q.eq("googleId", args.socialId)).first()
      : await ctx.db.query("users").withIndex("by_appleId", (q) => q.eq("appleId", args.socialId)).first();

    if (args.mode === "restore") {
      if (!existing) return { found: false };
      const sessionToken = await issueSession(ctx, existing._id, args.provider);
      return { found: true, userId: existing._id, name: existing.name, sessionToken };
    }

    if (!args.userId) throw new ConvexError("SESSION_INVALID");
    const currentId = await checkSession(ctx, args.userId, args.sessionToken);
    if (existing && existing._id !== currentId) {
      const sessionToken = await issueSession(ctx, existing._id, args.provider);
      return { conflict: true, existingUserId: existing._id, sessionToken };
    }

    const current = await ctx.db.get(currentId);
    if (!current) throw new ConvexError("SESSION_INVALID");
    const patch: Record<string, string> = args.provider === "google"
      ? { googleId: args.socialId }
      : { appleId: args.socialId };
    // Keep an existing email: it is the login for email/password accounts.
    const isNewEmail = !!args.email && !current.email;
    if (isNewEmail) patch.email = args.email!.toLowerCase().trim();
    await ctx.db.patch(currentId, patch);
    if (isNewEmail) {
      await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
        email: patch.email,
        name: current.username || current.name || "Jugador",
      });
    }
    return { success: true };
  },
});
