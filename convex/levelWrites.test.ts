import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { withNewLevelVersion } from "./levelWrites";

const versioned = withNewLevelVersion({ levelNumber: 10, wordId: "word" as any, reward: { coins: 2, diamonds: 0 } });
assert.equal(versioned.introducedOrderVersion, 2);

const root = path.resolve("convex");
const files = fs.readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts"))
  .map((entry) => path.join(entry.parentPath, entry.name));
const violations = files.flatMap((file) => {
  if (path.basename(file) === "levelWrites.ts") return [];
  const source = fs.readFileSync(file, "utf8");
  return /\.insert\(\s*(["'])levels\1/g.test(source) ? [path.relative(root, file)] : [];
});
assert.deepEqual(violations, [], `inserciones directas de levels fuera del helper: ${violations.join(", ")}`);
console.log("levelWrites: todas las altas nuevas quedan marcadas como v2");
