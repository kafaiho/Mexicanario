import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { MEXICO_VIVIDO_WORDS, REMOVED_WORDS } from "./mexicoVividoCatalog.generated";

const require = createRequire(import.meta.url);
const authoritative = require("../../src/content/mexicoVividoWords.js");
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

assert.equal(digest(MEXICO_VIVIDO_WORDS), digest(authoritative.MEXICO_VIVIDO_WORDS), "regenera el catálogo Convex cuando cambie la fuente");
assert.equal(digest(REMOVED_WORDS), digest(authoritative.REMOVED_WORDS), "regenera las retiradas Convex cuando cambie la fuente");
console.log(`mexicoVividoCatalog parity: ${MEXICO_VIVIDO_WORDS.length} entradas, sha256 ${digest(MEXICO_VIVIDO_WORDS)}`);
