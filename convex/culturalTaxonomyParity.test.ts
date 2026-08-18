import assert from "node:assert/strict";
import { CULTURAL_COLLECTIONS, CULTURAL_PLACES } from "./culturalTaxonomy";

const client = require("../src/config/culturalTaxonomy.js");
const collectionFields = (item: any) => ({ id: item.id, name: item.name, icon: item.icon, color: item.color, description: item.description });
const placeFields = (item: any) => ({ id: item.id, name: item.name, icon: item.icon, color: item.color, kind: item.kind, demonym: item.demonym, aliases: item.aliases });

assert.deepEqual(CULTURAL_COLLECTIONS.map(collectionFields), client.COLLECTIONS.map(collectionFields));
assert.deepEqual(CULTURAL_PLACES.map(placeFields), client.PLACES.map(placeFields));

console.log("culturalTaxonomy parity tests passed");
