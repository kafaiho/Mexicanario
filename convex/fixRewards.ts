import { mutation } from "./_generated/server";

/**
 * Actualiza las recompensas de TODOS los niveles existentes
 * para usar la nueva fórmula: 2 coins base + 1 cada 100 niveles.
 *
 * Ejecutar desde Convex Dashboard: fixRewards:fixLevelRewards
 */
export const fixLevelRewards = mutation({
  args: {},
  handler: async (ctx) => {
    const allLevels = await ctx.db.query("levels").collect();
    let updated = 0;

    for (const level of allLevels) {
      const n = level.levelNumber;
      const coins = 2 + Math.floor((n - 1) / 100);
      const diamonds = Math.floor((n - 1) / 200);

      await ctx.db.patch(level._id, { reward: { coins, diamonds } });
      updated++;
    }

    return { updated, message: `Actualizadas recompensas de ${updated} niveles.` };
  },
});
