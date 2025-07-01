/**
 * Sync Sources to Database
 * Updates the database to only include sources from our cleaned globalSources.ts
 */

import { PrismaClient } from "@prisma/client";
import { GLOBAL_ITK_SOURCES } from "../src/lib/twitter/globalSources";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function syncSourcesToDatabase() {
  console.log("🔄 Syncing sources to database...\n");

  try {
    // 1. Get current sources in database
    const dbSources = await prisma.iTKSource.findMany();
    console.log(`📊 Current database state:`);
    console.log(`   Total sources in DB: ${dbSources.length}`);
    
    // 2. Get usernames from our cleaned source list
    const validUsernames = GLOBAL_ITK_SOURCES.map(s => s.handle.replace('@', ''));
    console.log(`   Valid sources in code: ${validUsernames.length}`);
    console.log(`   - Tier 1: ${GLOBAL_ITK_SOURCES.filter(s => s.tier === 1 && !s.isShitTier).length}`);
    console.log(`   - Comedy: ${GLOBAL_ITK_SOURCES.filter(s => s.isShitTier).length}`);

    // 3. Find sources to remove
    const sourcesToRemove = dbSources.filter(
      dbSource => !validUsernames.includes(dbSource.username)
    );
    
    console.log(`\n🗑️  Sources to remove: ${sourcesToRemove.length}`);
    if (sourcesToRemove.length > 0) {
      console.log("   Removing:");
      sourcesToRemove.slice(0, 10).forEach(s => {
        console.log(`   - @${s.username} (${s.name})`);
      });
      if (sourcesToRemove.length > 10) {
        console.log(`   ... and ${sourcesToRemove.length - 10} more`);
      }
      
      // Delete invalid sources
      const deleteResult = await prisma.iTKSource.deleteMany({
        where: {
          username: {
            in: sourcesToRemove.map(s => s.username)
          }
        }
      });
      console.log(`   ✅ Removed ${deleteResult.count} sources`);
    }

    // 4. Update/create valid sources
    console.log("\n📝 Updating valid sources...");
    for (const source of GLOBAL_ITK_SOURCES) {
      const username = source.handle.replace('@', '');
      
      await prisma.iTKSource.upsert({
        where: { username },
        update: {
          name: source.name,
          tier: source.tier,
          reliability: source.reliability,
          region: source.region,
          isVerified: false,
          isActive: source.isActive,
        },
        create: {
          username,
          name: source.name,
          tier: source.tier,
          reliability: source.reliability,
          region: source.region,
          isVerified: false,
          isActive: source.isActive,
        }
      });
    }
    console.log("   ✅ All valid sources updated");

    // 5. Final verification
    const finalCount = await prisma.iTKSource.count();
    console.log(`\n✅ Sync complete!`);
    console.log(`   Total sources in DB: ${finalCount}`);
    console.log(`   Expected: ${GLOBAL_ITK_SOURCES.length}`);
    console.log(`   Match: ${finalCount === GLOBAL_ITK_SOURCES.length ? '✅' : '❌'}`);

  } catch (error) {
    console.error("❌ Error syncing sources:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncSourcesToDatabase().catch(console.error);