/**
 * Palabras que pueden salir en duelos y retos: activas, con pista y, cuando ya
 * existe, solo del catálogo curado «México vivido» (las que tienen editorialOrder).
 * Mientras un deployment no haya migrado el catálogo, se usan todas las activas.
 */
export async function loadPlayableWords(ctx: { db: any }) {
  const active = [
    ...(await ctx.db.query("words").withIndex("by_isRetired", (q: any) => q.eq("isRetired", undefined)).collect()),
    ...(await ctx.db.query("words").withIndex("by_isRetired", (q: any) => q.eq("isRetired", false)).collect()),
  ].filter((w: any) => typeof w.meaning === "string" && w.meaning.trim() !== "");
  const curated = active.filter((w: any) => typeof w.editorialOrder === "number");
  return curated.length >= 50 ? curated : active;
}
