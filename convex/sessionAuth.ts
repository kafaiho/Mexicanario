/**
 * Device sessions: proves that the caller owns the `userId` it sends.
 *
 * Every device gets a random secret token (only its SHA-256 hash is stored).
 * Public functions that act on behalf of a player are declared with
 * `userMutation` / `userAction`, which add an optional `sessionToken` argument
 * and verify it before running the handler.
 *
 * Rollout: while the SESSION_ENFORCEMENT env var is not "on", calls without a
 * token are still accepted so older app versions keep working. A token that is
 * sent must always be valid. Set SESSION_ENFORCEMENT=on once old versions are
 * retired (forced update) to close the gap completely.
 */
import { ConvexError, v, type ObjectType, type PropertyValidators } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, mutation, type ActionCtx, type MutationCtx, type QueryCtx } from "./_generated/server";

export const sessionTokenArg = { sessionToken: v.optional(v.string()) };

export function sessionEnforced(): boolean {
  return process.env.SESSION_ENFORCEMENT === "on";
}

export async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Creates a session for `userId` and returns the plaintext token (shown once). */
export async function issueSession(ctx: MutationCtx, userId: Id<"users">, source: string): Promise<string> {
  const token = generateToken();
  await ctx.db.insert("sessions", {
    userId,
    tokenHash: await hashToken(token),
    createdAt: Date.now(),
    source,
  });
  return token;
}

/** Throws unless `sessionToken` belongs to `userId` (see rollout note above). */
export async function checkSession(
  ctx: { db: QueryCtx["db"] },
  userId: string,
  sessionToken: string | undefined,
): Promise<Id<"users">> {
  const id = ctx.db.normalizeId("users", userId);
  if (!id) throw new ConvexError("SESSION_INVALID");
  if (!sessionToken) {
    if (sessionEnforced()) throw new ConvexError("SESSION_REQUIRED");
    return id;
  }
  const tokenHash = await hashToken(sessionToken);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .unique();
  if (!session || session.userId !== id) throw new ConvexError("SESSION_INVALID");
  return id;
}

type UserArgs = PropertyValidators & { userId: PropertyValidators[string] };

/** A public mutation acting as `args.userId`; the caller must own that user. */
export function userMutation<Args extends UserArgs, Output>(def: {
  args: Args;
  handler: (ctx: MutationCtx, args: ObjectType<Args>) => Output;
}) {
  return mutation({
    args: { ...def.args, ...sessionTokenArg },
    handler: async (ctx, allArgs): Promise<Awaited<Output>> => {
      const { sessionToken, ...args } = allArgs as ObjectType<Args> & { sessionToken?: string };
      await checkSession(ctx, (args as unknown as { userId: string }).userId, sessionToken);
      return await def.handler(ctx, args as unknown as ObjectType<Args>);
    },
  });
}

/** A public action acting as `args.userId`; the caller must own that user. */
export function userAction<Args extends UserArgs, Output>(def: {
  args: Args;
  handler: (ctx: ActionCtx, args: ObjectType<Args>) => Output;
}) {
  return action({
    args: { ...def.args, ...sessionTokenArg },
    handler: async (ctx, allArgs): Promise<Awaited<Output>> => {
      const { sessionToken, ...args } = allArgs as ObjectType<Args> & { sessionToken?: string };
      await ctx.runQuery(internal.sessions.verifySession, {
        userId: (args as unknown as { userId: string }).userId,
        sessionToken,
      });
      return await def.handler(ctx, args as unknown as ObjectType<Args>);
    },
  });
}
