#!/usr/bin/env tsx
/**
 * Check the current state of Transfer Juice system
 */

import { prisma } from "@/lib/prisma";

async function checkSystemState() {
  console.log("🔍 Checking Transfer Juice System State");
  console.log("=====================================\n");

  try {
    // 1. Database connectivity
    console.log("1. DATABASE CONNECTIVITY");
    console.log("------------------------");
    try {
      await prisma.$connect();
      console.log("✅ Database connection successful");
    } catch (error) {
      console.log("❌ Database connection failed:", error);
      return;
    }

    // 2. Content counts
    console.log("\n2. CONTENT COUNTS");
    console.log("-----------------");
    const briefingCount = await prisma.briefing.count();
    const feedItemCount = await prisma.feedItem.count();
    const itkSourceCount = await prisma.itkSource.count();
    const tagCount = await prisma.tag.count();
    
    console.log(`📰 Briefings: ${briefingCount}`);
    console.log(`📡 Feed Items: ${feedItemCount}`);
    console.log(`👤 ITK Sources: ${itkSourceCount}`);
    console.log(`🏷️  Tags: ${tagCount}`);

    // 3. Latest content
    console.log("\n3. LATEST CONTENT");
    console.log("-----------------");
    
    const latestBriefings = await prisma.briefing.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        slug: true
      }
    });
    
    if (latestBriefings.length === 0) {
      console.log("⚠️  No briefings found");
    } else {
      console.log("Latest Briefings:");
      latestBriefings.forEach(b => {
        console.log(`  - [${b.status}] ${b.title}`);
        console.log(`    Created: ${b.createdAt.toISOString()}`);
        console.log(`    URL: /briefings/${b.slug}`);
      });
    }

    // 4. ITK Sources
    console.log("\n4. ITK SOURCES");
    console.log("--------------");
    const activeSources = await prisma.itkSource.count({
      where: { isActive: true }
    });
    const topSources = await prisma.itkSource.findMany({
      where: { isActive: true },
      take: 5,
      orderBy: { followers: 'desc' },
      select: {
        handle: true,
        reliability: true,
        region: true,
        leagues: true,
        followers: true
      }
    });
    
    console.log(`Active sources: ${activeSources}`);
    if (topSources.length > 0) {
      console.log("Top sources by followers:");
      topSources.forEach(s => {
        console.log(`  - @${s.handle} (${s.region}) - ${s.followers?.toLocaleString() || 'N/A'} followers`);
        console.log(`    Reliability: ${s.reliability}/5, Leagues: ${s.leagues.join(', ')}`);
      });
    }

    // 5. Recent feed activity
    console.log("\n5. RECENT FEED ACTIVITY");
    console.log("-----------------------");
    const recentFeedItems = await prisma.feedItem.findMany({
      take: 5,
      orderBy: { publishedAt: 'desc' },
      select: {
        title: true,
        source: true,
        publishedAt: true,
        tags: {
          select: { name: true }
        }
      }
    });
    
    if (recentFeedItems.length === 0) {
      console.log("⚠️  No recent feed items");
    } else {
      console.log("Recent feed items:");
      recentFeedItems.forEach(item => {
        const tags = item.tags.map(t => t.name).join(', ') || 'No tags';
        console.log(`  - ${item.title}`);
        console.log(`    Source: ${item.source}, Published: ${item.publishedAt.toISOString()}`);
        console.log(`    Tags: ${tags}`);
      });
    }

    // 6. Cron status (check last monitoring run)
    console.log("\n6. MONITORING STATUS");
    console.log("--------------------");
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentMonitoring = await prisma.feedItem.count({
      where: {
        createdAt: { gte: lastHour }
      }
    });
    
    console.log(`Feed items created in last hour: ${recentMonitoring}`);
    
    // 7. Environment check
    console.log("\n7. ENVIRONMENT VARIABLES");
    console.log("------------------------");
    const envVars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      CRON_SECRET: !!process.env.CRON_SECRET,
      USE_REAL_TWITTER_API: process.env.USE_REAL_TWITTER_API === 'true',
      X_BEARER_TOKEN: !!process.env.X_BEARER_TOKEN,
      TWITTER_BEARER_TOKEN: !!process.env.TWITTER_BEARER_TOKEN,
      APIFY_API_TOKEN: !!process.env.APIFY_API_TOKEN,
    };
    
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`${value ? '✅' : '❌'} ${key}: ${value ? 'Set' : 'Not set'}`);
    });

    // 8. Summary
    console.log("\n8. SYSTEM SUMMARY");
    console.log("-----------------");
    
    if (briefingCount === 0 && feedItemCount === 0) {
      console.log("⚠️  System appears to be empty - no content generated yet");
      console.log("\nNext steps:");
      console.log("1. Run 'npm run briefing:generate' to create a test briefing");
      console.log("2. Check cron jobs are configured in Vercel dashboard");
      console.log("3. Ensure CRON_SECRET is set in production environment");
    } else if (briefingCount === 0) {
      console.log("⚠️  Feed items exist but no briefings generated");
      console.log("\nNext steps:");
      console.log("1. Run 'npm run briefing:generate' to create first briefing");
      console.log("2. Check briefing cron job configuration");
    } else {
      console.log("✅ System appears to be functioning");
      console.log(`📊 Total briefings: ${briefingCount}, Total feed items: ${feedItemCount}`);
    }

  } catch (error) {
    console.error("❌ System check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemState().catch(console.error);