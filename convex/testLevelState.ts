import { query } from "./_generated/server";
import { v } from "convex/values";
import { getOrderedLevels } from "./levelOrdering";

const OWNER_IDS = new Set([
    "k9761v6vrcwpafm745mhh5m95x8215dv",
    "k97b1y69czyn1zsm4d2avzxzrx826k7a",
]);

export const testLevelState = query({
    args: { requesterId: v.string() },
    handler: async (ctx, { requesterId }) => {
        if (!OWNER_IDS.has(requesterId))
            throw new Error("❌ Acceso denegado.");
        const user = await ctx.db.query("users").first();
        if (!user) return "No user found";

        const allLevels = await ctx.db.query("levels").collect();
        const allWords = await ctx.db.query("words").collect();

        const ordered = getOrderedLevels(allLevels, allWords, user._id.toString());

        // Check for duplicate levelNumbers
        const levelNumCount: Record<number, number> = {};
        for (const lvl of allLevels) {
            levelNumCount[lvl.levelNumber] = (levelNumCount[lvl.levelNumber] ?? 0) + 1;
        }
        const duplicates = Object.entries(levelNumCount)
            .filter(([, count]) => count > 1)
            .map(([num, count]) => ({ levelNumber: Number(num), count }))
            .sort((a, b) => a.levelNumber - b.levelNumber);

        return {
            allLevelsCount: allLevels.length,
            orderedLength: ordered.length,
            duplicateCount: duplicates.length,
            firstDuplicates: duplicates.slice(0, 20),
        };
    }
});
