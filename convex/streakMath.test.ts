import assert from "node:assert/strict";
import {
  daysMissedSince,
  previewDailyStreakReward,
  projectStreak,
  rollDailyStreakReward,
  streakCycleDay,
} from "./streakMath";
import clientRewards from "../src/config/streakRewards.js";

assert.equal(daysMissedSince("", "2026-09-25"), 0, "primera partida");
assert.equal(daysMissedSince("2026-09-24", "2026-09-25"), 0, "jugó ayer");
assert.equal(daysMissedSince("2026-09-22", "2026-09-25"), 2);

// Racha continua, primera vez, escudos y reinicio
assert.deepEqual(projectStreak({ lastPlay: "2026-09-24", oldStreak: 4, freezeCount: 0, today: "2026-09-25" }),
  { newStreak: 5, freezesConsumed: 0, daysMissed: 0 });
assert.equal(projectStreak({ lastPlay: "", oldStreak: 0, freezeCount: 0, today: "2026-09-25" }).newStreak, 1);
assert.deepEqual(projectStreak({ lastPlay: "2026-09-22", oldStreak: 9, freezeCount: 2, today: "2026-09-25" }),
  { newStreak: 10, freezesConsumed: 2, daysMissed: 2 }, "los escudos salvan la racha");
assert.deepEqual(projectStreak({ lastPlay: "2026-09-22", oldStreak: 9, freezeCount: 1, today: "2026-09-25" }),
  { newStreak: 1, freezesConsumed: 0, daysMissed: 2 }, "sin escudos suficientes no se gastan");

// Ciclo de 7 días: 10..35 y piñata 50-200 el día 7
assert.equal(streakCycleDay(1), 1);
assert.equal(streakCycleDay(7), 7);
assert.equal(streakCycleDay(8), 1);
assert.deepEqual(rollDailyStreakReward(1), { coins: 10, isPinata: false });
assert.deepEqual(rollDailyStreakReward(6), { coins: 35, isPinata: false });
assert.deepEqual(rollDailyStreakReward(7, () => 0), { coins: 50, isPinata: true });
assert.deepEqual(rollDailyStreakReward(14, () => 0.9999), { coins: 200, isPinata: true });

// La vista previa coincide con el pago (sin azar)
assert.deepEqual(previewDailyStreakReward(3), { cycleDay: 3, coins: 20, isPinata: false, pinataRange: [50, 200] });
assert.equal(previewDailyStreakReward(7).coins, null);
assert.equal(previewDailyStreakReward(7).isPinata, true);

// Paridad: la tabla espejo del cliente (textos y vista previa) = la del servidor
for (let streak = 1; streak <= 21; streak++) {
  const client = clientRewards.getDailyStreakReward(streak);
  const server = previewDailyStreakReward(streak);
  assert.equal(client.isPinata, server.isPinata, `piñata en racha ${streak}`);
  assert.equal(client.coins, server.coins, `monedas en racha ${streak}`);
}

console.log("streakMath: racha, escudos y premio diario unificado");
