import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isoWeekId } from "./weekId";

const at = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d, 12); };

// La semana cambia en lunes, no a media semana.
assert.equal(isoWeekId(at("2026-09-20")), "2026-W38", "domingo cierra la semana 38");
assert.equal(isoWeekId(at("2026-09-21")), "2026-W39", "lunes abre la semana 39");
assert.equal(isoWeekId(at("2026-09-23")), "2026-W39");
assert.equal(isoWeekId(at("2026-09-24")), "2026-W39", "el jueves sigue en la misma semana");
assert.equal(isoWeekId(at("2026-09-27")), "2026-W39");
// Cambio de año ISO
assert.equal(isoWeekId(at("2025-12-29")), "2026-W01");
assert.equal(isoWeekId(at("2027-01-03")), "2026-W53");
assert.equal(isoWeekId(at("2027-01-04")), "2027-W01");

// Todos los módulos del servidor usan la función compartida.
for (const file of ["league.ts", "rankings.ts", "users.ts", "friends.ts"]) {
  const src = fs.readFileSync(path.join(__dirname, file), "utf8");
  assert.ok(!/jan4/.test(src), `${file} no debe calcular la semana por su cuenta`);
  assert.ok(/isoWeekId\(/.test(src), `${file} debe usar isoWeekId`);
}

// La copia de la app da lo mismo.
const screen = fs.readFileSync(path.join(__dirname, "../src/screens/LeaderboardScreen.jsx"), "utf8");
const body = screen.match(/export function isoWeekIdCST\(date\) \{([\s\S]*?)\n\}/)?.[1];
assert.ok(body, "LeaderboardScreen debe tener isoWeekIdCST");
const clientWeekId = new Function("date", body) as (d: Date) => string;
for (let t = Date.UTC(2025, 11, 20); t < Date.UTC(2028, 0, 10); t += 86400000) {
  const d = new Date(t);
  const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);
  assert.equal(clientWeekId(local), isoWeekId(local), `app y servidor difieren el ${d.toISOString().slice(0, 10)}`);
}

console.log("weekId: semanas ISO de lunes a domingo, iguales en app y servidor");
