import assert from "node:assert/strict";
import { IAP_ITEMS, RECOVER_PURCHASES_SINCE, recoverableTransactions } from "./shop";

// Solo se recuperan compras desde RECOVER_PURCHASES_SINCE (las anteriores se
// acreditaban con otro identificador), la más reciente primero.
const day = 24 * 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();
const product = IAP_ITEMS.coins_500.rcProductId;
const subscriber = {
  non_subscriptions: {
    [product]: [
      { id: "old", store_transaction_id: "GPA.old", purchase_date: iso(RECOVER_PURCHASES_SINCE - day) },
      { id: "a", store_transaction_id: "GPA.a", purchase_date: iso(RECOVER_PURCHASES_SINCE + day) },
      { id: "b", store_transaction_id: "GPA.b", purchase_date: iso(RECOVER_PURCHASES_SINCE + 3 * day) },
      { id: "c", purchase_date: iso(RECOVER_PURCHASES_SINCE + 2 * day) },
      { purchase_date: iso(RECOVER_PURCHASES_SINCE + 2 * day) },
    ],
  },
};
assert.deepEqual(recoverableTransactions(subscriber, product).map((t) => t.id), ["b", "c", "a"]);
assert.deepEqual(recoverableTransactions(subscriber, "otro_producto"), []);
assert.deepEqual(recoverableTransactions({}, product), []);
assert.deepEqual(recoverableTransactions(null, product), []);

console.log("iapRecovery: compras pendientes recuperables en orden y sin tocar las anteriores");
