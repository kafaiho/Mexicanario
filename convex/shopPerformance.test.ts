import assert from "node:assert/strict";
import fs from "node:fs";

const schemaSource = fs.readFileSync("convex/schema.ts", "utf8");
const shopSource = fs.readFileSync("convex/shop.ts", "utf8");

const seasonPassSchema = schemaSource.slice(
  schemaSource.indexOf('seasonPass: defineTable'),
  schemaSource.indexOf('streakMilestones: defineTable'),
);

assert.match(
  seasonPassSchema,
  /seasonPass:\s*defineTable\([\s\S]*?\)\s*\.index\("by_user",\s*\["userId"\]\)/,
  "seasonPass debe tener un índice por usuario",
);

assert.match(
  shopSource,
  /query\("seasonPass"\)[\s\S]*?\.withIndex\("by_user",\s*\(q(?::\s*any)?\)\s*=>\s*q\.eq\("userId",\s*args\.userId\)\)/,
  "getShopState debe buscar el pase mediante el índice por usuario",
);

console.log("shopPerformance: la tienda consulta el pase por índice");
