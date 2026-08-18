import assert from "node:assert/strict";
import { KNOWN_LEGACY_COLLECTION_NAMES, resolveLegacyCollectionName } from "./collectionGrouping";

assert.equal(resolveLegacyCollectionName("Expresiones y Modismos"), "vida-barrio");
assert.equal(resolveLegacyCollectionName("Cultura Popular y Deportes"), "tele-cultura-popular");
assert.equal(resolveLegacyCollectionName("Tacos"), "cocina-bebidas");

for (const legacyName of KNOWN_LEGACY_COLLECTION_NAMES) {
  assert.notEqual(resolveLegacyCollectionName(legacyName), "unclassified", `known legacy collection must resolve: ${legacyName}`);
}

assert.equal(resolveLegacyCollectionName("Categoría inventada"), "unclassified", "arbitrary unknown names remain reviewable");

console.log(`collection legacy aliases: ${KNOWN_LEGACY_COLLECTION_NAMES.length} nombres históricos cubiertos`);
