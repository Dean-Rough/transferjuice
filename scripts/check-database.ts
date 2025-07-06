import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Checking database connection...");
    
    // Check if we can connect
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    
    // Count existing data
    const briefingCount = await prisma.briefing.count();
    const storyCount = await prisma.story.count();
    const tweetCount = await prisma.tweet.count();
    const sourceCount = await prisma.source.count();
    
    console.log("\n📊 Database contents:");
    console.log(`- Briefings: ${briefingCount}`);
    console.log(`- Stories: ${storyCount}`);
    console.log(`- Tweets: ${tweetCount}`);
    console.log(`- Sources: ${sourceCount}`);
    
    if (briefingCount === 0) {
      console.log("\n💡 No briefings found. The homepage will show 'No briefings available yet.'");
      console.log("To create test data, run: npm run briefing:enhanced");
    }
    
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    console.log("\n💡 Make sure to:");
    console.log("1. Create a .env file with your DATABASE_URL");
    console.log("2. Run: npx prisma db push");
    console.log("3. Run: npx prisma generate");
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();