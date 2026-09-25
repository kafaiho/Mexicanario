import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ACHIEVEMENT_REWARDS, AD_MIN_GAP_MS, AD_REWARDS_PER_DAY, REWARD_TICKET_TTL, SPEND_PRICES,
  WHEEL_AD_SPINS_PER_DAY, WHEEL_FREE_COOLDOWN_MS, WHEEL_SEGMENTS,
  achievementStat, dayIdCST, levelCoinReward, nextAdCount, rewardCap, wheelState,
} from "./rewards";

const src = (rel: string) => fs.readFileSync(path.join(__dirname, "..", rel), "utf8");

// ── La app ya no se suma varos sola ─────────────────────────────────────────
for (const dir of ["src", "App.jsx"]) {
  const walk = (p: string): string[] => fs.statSync(p).isDirectory()
    ? fs.readdirSync(p).flatMap((f) => walk(path.join(p, f)))
    : /\.(jsx?|tsx?)$/.test(p) ? [p] : [];
  for (const file of walk(path.join(__dirname, "..", dir))) {
    assert.ok(!/api\.users\.updateUserCurrency/.test(fs.readFileSync(file, "utf8")), `${file}: usa updateUserCurrency; usa convex/rewards.ts`);
  }
}

// ── Mismos precios y premios en la app y en el servidor ─────────────────────
const gameplay = src("src/screens/GameplayScreen.jsx");
for (const [item, name] of [["hint", "HINT_COST"], ["synonym", "SYNONYM_COST"], ["borrar", "BORRAR_COST"], ["verificar", "VERIFICAR_COST"]]) {
  assert.equal(Number(gameplay.match(new RegExp(`const ${name} = (\\d+)`))?.[1]), SPEND_PRICES[item], `${name} distinto en juego y servidor`);
}
assert.match(gameplay, /const coins = 3 \+ Math\.floor\(\(levelPos - 1\) \/ 25\);/, "calculateReward cambió: actualiza levelCoinReward");
assert.equal(levelCoinReward(1), 3);
assert.equal(levelCoinReward(26), 4);

const wheel = src("src/components/WheelModal.jsx");
const segs = [...(wheel.match(/const SEGMENTS = \[([\s\S]*?)\];/)?.[1] ?? "").matchAll(/\{[^}]*\}/g)].map(([seg]) => ({
  coins: Number(seg.match(/coins: (\d+)/)?.[1] ?? 0),
  diamonds: Number(seg.match(/diamonds: (\d+)/)?.[1] ?? 0),
}));
assert.deepEqual(segs, WHEEL_SEGMENTS, "la ruleta muestra premios distintos a los del servidor");

const achievements = src("src/screens/AchievementsScreen.jsx");
const shown = [...achievements.matchAll(/id: "([^"]+)"[\s\S]*?reward: \{ coins: (\d+), diamonds: (\d+) \}/g)];
assert.equal(shown.length, Object.keys(ACHIEVEMENT_REWARDS).length, "logros distintos en app y servidor");
for (const [, id, coins, diamonds] of shown) {
  const r = ACHIEVEMENT_REWARDS[id];
  assert.ok(r, `logro ${id} no existe en el servidor`);
  assert.equal(r.coins, Number(coins), `${id}: varos`);
  assert.equal(r.diamonds, Number(diamonds), `${id}: diamantes`);
}

// ── Reglas ──────────────────────────────────────────────────────────────────
// Boleto: moneda dorada x2 + bono de tramo solo en niveles
assert.deepEqual(rewardCap({ kind: "level", level: 1, diamonds: 1 }), { coins: 106, diamonds: 1 });
assert.deepEqual(rewardCap({ kind: "review", level: 30, diamonds: 1 }), { coins: 8, diamonds: 1 });
assert.ok(REWARD_TICKET_TTL >= 5 * 60 * 1000);

// Anuncios: tope diario y espera entre anuncios; el contador se reinicia al día siguiente
const now = Date.UTC(2026, 8, 25, 18);
assert.deepEqual(nextAdCount({}, now), { ok: true, count: 1 });
assert.equal(nextAdCount({ lastAdRewardAt: now - AD_MIN_GAP_MS / 2 }, now).ok, false);
assert.equal(nextAdCount({ adRewardDay: dayIdCST(now), adRewardCount: AD_REWARDS_PER_DAY }, now).ok, false);
assert.deepEqual(nextAdCount({ adRewardDay: "2026-09-24", adRewardCount: AD_REWARDS_PER_DAY }, now), { ok: true, count: 1 });
assert.equal(dayIdCST(Date.UTC(2026, 8, 26, 5)), "2026-09-25", "el día cambia a medianoche de México");

// Ruleta
assert.deepEqual(wheelState({}, now), { freeReadyAt: WHEEL_FREE_COOLDOWN_MS, adSpinsLeft: WHEEL_AD_SPINS_PER_DAY });
assert.equal(wheelState({ wheelFreeSpunAt: now }, now).freeReadyAt, now + WHEEL_FREE_COOLDOWN_MS);
assert.equal(wheelState({ wheelAdDay: dayIdCST(now), wheelAdCount: 2 }, now).adSpinsLeft, WHEEL_AD_SPINS_PER_DAY - 2);

// Logros: la meta se mide igual que en la pantalla
const player = { currentLevel: 51, playStreak: 2, playStreakMax: 8, bestCombo: 4, perfectLevels: 3 };
assert.equal(achievementStat(player, "words"), 50);
assert.equal(achievementStat(player, "level"), 51);
assert.equal(achievementStat(player, "streak"), 8);
assert.equal(achievementStat(player, "combo"), 4);
assert.equal(achievementStat(player, "perfect"), 3);
assert.ok(ACHIEVEMENT_REWARDS.invitar_3.never && ACHIEVEMENT_REWARDS.invitar_10.never, "las invitaciones aún no se cuentan");

console.log("rewards: premios y gastos los decide el servidor, iguales a lo que muestra la app");
