import { query } from "./_generated/server";

export const getAllCollections = query({
  args: {},
  handler: async (ctx) => {
    const collections = await ctx.db.query("collections").collect();

    // Use Promise.all to wait for all URLs
    const collectionsWithUrls = await Promise.all(
      collections.map(async (collection) => ({
        ...collection,
        image: await ctx.storage.getUrl(collection.image),
      }))
    );

    return collectionsWithUrls;
  },
});
