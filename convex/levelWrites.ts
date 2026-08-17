import type { Id } from "./_generated/dataModel";

export type NewLevelData = {
  levelNumber: number;
  wordId: Id<"words">;
  reward: { coins: number; diamonds: number };
};

export function withNewLevelVersion<T extends NewLevelData>(data: T): T & { introducedOrderVersion: 2 } {
  return { ...data, introducedOrderVersion: 2 };
}

/** New content must be v2-only so it cannot shift returning users' v1 prefix. */
export async function insertNewLevel(ctx: { db: { insert: Function } }, data: NewLevelData) {
  return await ctx.db.insert("levels", withNewLevelVersion(data));
}
