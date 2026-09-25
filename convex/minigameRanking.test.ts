import assert from "node:assert/strict";
import { isValidScore, mexicoDayKey, mexicoWeekKey, planScorePatch } from "./minigameRanking";

// «Hoy» cambia a medianoche de México, no a las 6 de la tarde (medianoche UTC).
const nightInMexico = Date.parse("2026-09-26T05:30:00Z"); // 25 sep, 23:30 en CDMX
assert.equal(mexicoDayKey(nightInMexico), "2026-09-25");
assert.equal(mexicoDayKey(Date.parse("2026-09-26T06:30:00Z")), "2026-09-26", "00:30 en CDMX ya es el día siguiente");

// La semana cambia en lunes, igual que la liga.
const sundayNight = Date.parse("2026-09-28T05:00:00Z"); // domingo 27, 23:00 en CDMX
const mondayMorning = Date.parse("2026-09-28T06:30:00Z"); // lunes 28, 00:30 en CDMX
assert.notEqual(mexicoWeekKey(sundayNight), mexicoWeekKey(mondayMorning));
assert.equal(mexicoWeekKey(mondayMorning), mexicoWeekKey(Date.parse("2026-10-04T05:00:00Z")), "de lunes a domingo es la misma semana");
assert.match(mexicoWeekKey(mondayMorning), /^\d{4}-W\d{2}$/);

// Solo se aceptan enteros positivos por debajo del tope del juego.
assert.equal(isValidScore(12, 500), true);
for (const bad of [0, -3, 2.5, Number.NaN, Number.POSITIVE_INFINITY, 501, 999999]) {
  assert.equal(isValidScore(bad, 500), false, `${bad} no es un puntaje válido`);
}

// Guardado de récords: el diario y el semanal se reinician al cambiar de periodo.
assert.deepEqual(planScorePatch(null, 7, "2026-09-25", "2026-W39"), {
  insert: { allTimeBest: 7, dailyBest: 7, dailyDate: "2026-09-25", weeklyBest: 7, weeklyStr: "2026-W39" },
});
const record = { _id: "x", userId: "u" as any, allTimeBest: 20, dailyBest: 9, dailyDate: "2026-09-25", weeklyBest: 15, weeklyStr: "2026-W39" };
assert.deepEqual(planScorePatch(record, 5, "2026-09-25", "2026-W39"), { patch: {} }, "un puntaje menor no cambia nada");
assert.deepEqual(planScorePatch(record, 12, "2026-09-25", "2026-W39"), { patch: { dailyBest: 12 } });
assert.deepEqual(planScorePatch(record, 3, "2026-09-26", "2026-W39"), { patch: { dailyBest: 3, dailyDate: "2026-09-26" } }, "día nuevo empieza de cero");
assert.deepEqual(
  planScorePatch(record, 25, "2026-09-28", "2026-W40"),
  { patch: { allTimeBest: 25, dailyBest: 25, dailyDate: "2026-09-28", weeklyBest: 25, weeklyStr: "2026-W40" } },
);

console.log("minigameRanking: hora de México, semana de lunes, puntajes válidos y récords");
