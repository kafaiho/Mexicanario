import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { COIN_ITEMS, IAP_ITEMS } from "./shop";

// El cliente compra con RC_PRODUCT_IDS y el servidor verifica con IAP_ITEMS.rcProductId:
// si difieren, la tienda cobra pero el servidor no encuentra la compra.
const clientSource = fs.readFileSync(path.join(__dirname, "../src/services/RevenueCatService.ts"), "utf8");
const block = (name: string) => clientSource.match(new RegExp(`export const ${name}[^=]*=\\s*\\{([\\s\\S]*?)\\r?\\n\\};`))?.[1] ?? "";
const productIds = Object.fromEntries([...block("RC_PRODUCT_IDS").matchAll(/(\w+):\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
const grants = Object.fromEntries([...block("IAP_GRANTS").matchAll(/(\w+):\s*\{([^}]*)\}/g)].map((m) => [m[1], m[2]]));

for (const [itemId, item] of Object.entries(IAP_ITEMS)) {
  assert.equal(productIds[itemId], item.rcProductId, `${itemId}: el producto del cliente y del servidor deben coincidir`);
  const grant = grants[itemId] ?? "";
  assert.equal(Number(grant.match(/coins:\s*(\d+)/)?.[1] ?? 0), item.coins ?? 0, `${itemId}: monedas`);
  assert.equal(Number(grant.match(/diamonds:\s*(\d+)/)?.[1] ?? 0), item.diamonds ?? 0, `${itemId}: diamantes`);
}

// Todo lo que la tienda ofrece con dinero real debe existir en el servidor con la misma cantidad.
const shopSource = fs.readFileSync(path.join(__dirname, "../src/screens/ShopScreen.jsx"), "utf8");
for (const m of shopSource.matchAll(/\{\s*id:\s*"(\w+)",\s*qty:\s*(\d+)[^}]*currency:\s*"real"/g)) {
  const item = IAP_ITEMS[m[1]];
  assert.ok(item, `la tienda ofrece ${m[1]} pero el servidor no lo conoce`);
  assert.equal(Number(m[2]), (item.coins ?? 0) + (item.diamonds ?? 0), `${m[1]}: la tienda muestra otra cantidad`);
}

// El Pase Mexica muestra lo mismo que entrega el servidor.
const pase = shopSource.match(/const PASE_MEXICA = \{([\s\S]*?)\};/)?.[1] ?? "";
assert.match(pase, /id:\s*"pass_mexica"/, "la tienda debe ofrecer el Pase Mexica real");
assert.equal(Number(pase.match(/coins:\s*(\d+)/)?.[1]), IAP_ITEMS.pass_mexica.coins, "Pase Mexica: varos");
assert.equal(Number(pase.match(/diamonds:\s*(\d+)/)?.[1]), IAP_ITEMS.pass_mexica.diamonds, "Pase Mexica: diamantes");

// Los trucos y trajes que ofrece la tienda existen en el servidor con el mismo precio.
for (const m of shopSource.matchAll(/\{\s*id:\s*"((?:hint|synonym)_x\d)",\s*qty:\s*\d+[^}]*price:\s*"(\d+)"/g)) {
  assert.equal(COIN_ITEMS[m[1]]?.price, Number(m[2]), `${m[1]}: precio distinto en tienda y servidor`);
}
for (const m of shopSource.matchAll(/\{\s*id:\s*"(skin_\w+)",\s*price:\s*(\d+)\s*\}/g)) {
  assert.equal(COIN_ITEMS[m[1]]?.price, Number(m[2]), `${m[1]}: precio distinto en tienda y servidor`);
}

console.log(`iapCatalogParity: ${Object.keys(IAP_ITEMS).length} productos iguales en cliente, servidor y tienda`);
