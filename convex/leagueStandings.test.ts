import assert from "node:assert/strict";
import { compareStanding, cxpGaps, rankGroup, zoneFor, zoneSizes } from "./leagueStandings";

// Tamaños de zona: los grupos chicos ya no castigan al último por defecto.
assert.deepEqual(zoneSizes(1), { promoCount: 1, demoCount: 0 });
assert.deepEqual(zoneSizes(2), { promoCount: 1, demoCount: 0 }, "con dos jugadores el segundo ya no baja siempre");
assert.deepEqual(zoneSizes(5), { promoCount: 1, demoCount: 1 });
assert.deepEqual(zoneSizes(30), { promoCount: 6, demoCount: 6 }, "un grupo lleno conserva el 20% arriba y abajo");

// La inactividad sigue bajando aunque el grupo sea chico.
assert.equal(zoneFor(2, 2, 120, 3), "safe");
assert.equal(zoneFor(2, 2, 20, 3), "demotion", "menos de 50 cXP baja en cualquier grupo");
assert.equal(zoneFor(1, 1, 150, 3), "safe", "jugar solo en tu grupo ya no te baja si estás activo");
assert.equal(zoneFor(1, 8, 250, 3), "promotion");
assert.equal(zoneFor(1, 8, 150, 3), "safe", "para ascender hacen falta 200 cXP");
assert.equal(zoneFor(1, 8, 250, 10), "safe", "no hay división arriba de Tonatiuh");
assert.equal(zoneFor(8, 8, 20, 1), "safe", "no hay división abajo de Obsidiana");

// Desempate: mismos cXP y palabras → gana quien llegó primero a esa marca.
const early = { cxpTotal: 300, wordsThisWeek: 30, lastCompletionAt: 1_000 };
const late = { cxpTotal: 300, wordsThisWeek: 30, lastCompletionAt: 5_000 };
const more = { cxpTotal: 300, wordsThisWeek: 31, lastCompletionAt: 9_000 };
assert.ok(compareStanding(early, late) < 0);
assert.deepEqual(rankGroup([late, more, early], 3).map(({ player }) => player), [more, early, late]);
assert.deepEqual(rankGroup([late, early], 3).map(({ player }) => player), rankGroup([early, late], 3).map(({ player }) => player), "el orden no depende de cómo llegan los datos");

// Lo que falta para ascender o salvarse, contando el desempate.
const group = Array.from({ length: 10 }, (_, i) => ({ cxpTotal: 400 - i * 40, wordsThisWeek: 10, lastCompletionAt: i }));
const ranked = rankGroup(group, 4);
const third = group[2]; // 320 cXP, fuera del top 2 (20% de 10)
assert.equal(cxpGaps(ranked, third, 4).toPromotion, 360 - 320 + 1);
const last = group[9]; // 40 cXP: zona de descenso y además inactivo
assert.equal(ranked.find(({ player }) => player === last)?.zone, "demotion");
// En 10 jugadores bajan 2 (lugares 9 y 10): hay que superar al 8.º, que tiene 120 cXP.
assert.equal(cxpGaps(ranked, last, 4).toSafety, Math.max(120 - 40 + 1, 50 - 40));
const leader = group[0];
assert.deepEqual(cxpGaps(ranked, leader, 4), { toPromotion: null, toSafety: null });

console.log("leagueStandings: zonas justas en grupos chicos, desempate estable y metas exactas");
