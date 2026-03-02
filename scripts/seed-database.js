const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const client = new ConvexHttpClient(process.env.CONVEX_URL || "https://your-convex-url.convex.cloud");

async function seedDatabase() {
  try {
    console.log("🌱 Starting to seed the database with Mexican slang words...");
    
    // Call the seedWords mutation
    const result = await client.mutation("seedWords", {});
    
    console.log("✅ Database seeded successfully!");
    console.log(`📊 Added ${result.words.length} words to the database`);
    console.log("📝 Words added:");
    
    result.words.forEach((word, index) => {
      console.log(`${index + 1}. ${word.word}`);
    });
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
