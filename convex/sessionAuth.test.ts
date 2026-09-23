import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkSession, hashToken } from "./sessionAuth";

// ── checkSession against an in-memory sessions table ─────────────────────────
const USER_A = "user_a";
const USER_B = "user_b";
const sessions: Array<{ userId: string; tokenHash: string }> = [];

const fakeDb: any = {
  normalizeId: (_table: string, id: string) => ([USER_A, USER_B].includes(id) ? id : null),
  query: () => ({
    withIndex: (_name: string, build: (q: any) => any) => {
      let wanted = "";
      build({ eq: (_field: string, value: string) => { wanted = value; return null; } });
      return { unique: async () => sessions.find((s) => s.tokenHash === wanted) ?? null };
    },
  }),
};
const ctx = { db: fakeDb };

async function rejects(promise: Promise<unknown>, code: string, message: string) {
  await assert.rejects(promise, (err: any) => String(err?.data ?? err?.message).includes(code), message);
}

// Public functions that legitimately take a userId without an existing session.
const PUBLIC_BY_DESIGN = new Set([
  "sessions.claimLegacySession", // one-time upgrade of pre-session installs (rollout only)
  "sessions.socialSignIn", // authenticated by a verified Google/Apple token instead
]);

async function main() {
  sessions.push({ userId: USER_A, tokenHash: await hashToken("token-a") });

  delete process.env.SESSION_ENFORCEMENT;
  assert.equal(await checkSession(ctx, USER_A, "token-a"), USER_A, "a valid token proves ownership");
  await rejects(checkSession(ctx, USER_B, "token-a"), "SESSION_INVALID", "a token cannot act as another player");
  await rejects(checkSession(ctx, USER_A, "forged"), "SESSION_INVALID", "unknown tokens are rejected");
  await rejects(checkSession(ctx, "not-a-user", "token-a"), "SESSION_INVALID", "invalid ids are rejected");
  assert.equal(await checkSession(ctx, USER_A, undefined), USER_A, "rollout mode keeps old app versions working");

  process.env.SESSION_ENFORCEMENT = "on";
  await rejects(checkSession(ctx, USER_A, undefined), "SESSION_REQUIRED", "enforcement requires a token");
  assert.equal(await checkSession(ctx, USER_A, "token-a"), USER_A);
  delete process.env.SESSION_ENFORCEMENT;

  // ── Contract: public functions acting on a player must verify the session ──
  const convexDir = path.resolve(process.cwd(), "convex");
  const offenders: string[] = [];
  for (const file of readdirSync(convexDir)) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts") || file === "schema.ts") continue;
    const src = readFileSync(path.join(convexDir, file), "utf8");
    const re = /export const (\w+)\s*=\s*(mutation|action)\(\s*\{([\s\S]*?)handler/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const [, name, , head] = m;
      const key = `${file.replace(/\.ts$/, "")}.${name}`;
      if (/\buserId\s*:/.test(head) && !PUBLIC_BY_DESIGN.has(key)) offenders.push(key);
    }
  }
  assert.deepEqual(offenders, [], `public functions taking userId must use userMutation/userAction: ${offenders.join(", ")}`);

  console.log("sessionAuth: tokens verificados y funciones de jugador protegidas");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
