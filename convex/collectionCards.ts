import { query } from "./_generated/server";

export const getAllCollectionCards = query({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("collectionCards").collect();

    // Use Promise.all to wait for all URLs
    const cardsWithURLs = await Promise.all(
        cards.map(async (collection) => ({
        ...collection,
        image: await ctx.storage.getUrl(collection.image),
      }))
    );

    return cardsWithURLs;
  },
});
