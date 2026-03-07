import { query } from "./_generated/server";
import { getOrderedLevels } from "./levelOrdering";

export const testLevelState = query({
    args: {},
    handler: async (ctx) => {
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
