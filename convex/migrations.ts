import { mutation } from "./_generated/server";

export const migrateUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query("users").collect();
    
    // Update each user to remove username and password fields
    for (const user of users) {
      // Delete the old document
      await ctx.db.delete(user._id);
      
      // Insert a new document with only the allowed fields
      await ctx.db.insert("users", {
        name: user.name,
        coins: user.coins,
        diamonds: user.diamonds,
        country: user.country,
        avatar: user.avatar,
        currentLevel: 1, // Default level for existing users
        createdAt: user.createdAt,
      });
    }
    
    return "Migration completed";
  },
});

// Helper function to get all words
export const getAllWords = mutation({
  args: {},
  handler: async (ctx) => {
    const words = await ctx.db.query("words").collect();
    return words;
  },
});

// Helper function to get all levels
export const getAllLevels = mutation({
  args: {},
  handler: async (ctx) => {
    const levels = await ctx.db.query("levels").collect();
    return levels;
  },
});

// Migration to add currentLevel field to existing users
export const addCurrentLevelToUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query("users").collect();
    
    // Update each user to add currentLevel field (default to 1)
    for (const user of users) {
      // Check if user already has currentLevel field
      if (user.currentLevel === undefined) {
        await ctx.db.patch(user._id, {
          currentLevel: 1,
        });
      }
    }
    
    return `Migration completed: Added currentLevel field to ${users.length} users`;
  },
});