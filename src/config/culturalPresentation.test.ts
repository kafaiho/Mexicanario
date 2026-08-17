import assert from "node:assert/strict";
import { getCulturalEmojis, getCulturalVictoryPhrase } from "./culturalPresentation.js";

assert.deepEqual(getCulturalEmojis("cdmx"), ["🚇"]);
assert.deepEqual(getCulturalEmojis("todo-mexico"), ["🦅"]);
assert.deepEqual(getCulturalEmojis("lugar-inventado"), []);
assert.deepEqual(getCulturalEmojis(), []);

assert.match(getCulturalVictoryPhrase(1, "patio-recreo", "todo-mexico"), /recreo|juego/i);
assert.match(getCulturalVictoryPhrase(1, "mexico-regional", "cdmx"), /Ciudad de México/);
assert.doesNotMatch(getCulturalVictoryPhrase(3, "casa-abuela", "todo-mexico"), /chilango|metro/i);
assert.ok(getCulturalVictoryPhrase(2, undefined, undefined).length > 0);

console.log("culturalPresentation: iconos y celebraciones contextuales válidos");
