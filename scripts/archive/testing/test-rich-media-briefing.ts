#!/usr/bin/env tsx

/**
 * Test script for rich media briefing generation
 * Tests the complete pipeline from tweet monitoring to rich article generation
 */

import { config } from "dotenv";
import { testRichMediaGeneration } from "@/briefing-generator/RichMediaOrchestrator";
import { logger } from "@/lib/logger";

// Load environment variables
config();

async function main() {
  logger.info("Starting rich media briefing test");
  
  try {
    logger.info("Generating test rich media briefing...");
    const briefing = await testRichMediaGeneration();
    
    logger.info("Rich media briefing generated successfully!");
    
    // Log briefing details
    console.log("\n=== BRIEFING DETAILS ===");
    console.log(`ID: ${briefing.id}`);
    console.log(`Title: ${briefing.title}`);
    console.log(`Slug: ${briefing.slug}`);
    console.log(`Time Slot: ${briefing.timeSlot}`);
    console.log(`Word Count: ${briefing.metadata.wordCount}`);
    console.log(`Reading Time: ${briefing.metadata.readingTime} minutes`);
    
    // Log statistics
    console.log("\n=== STATISTICS ===");
    console.log(`Tweets Analyzed: ${briefing.enrichedData.stats.tweetCount}`);
    console.log(`Players Mentioned: ${briefing.enrichedData.stats.playerCount}`);
    console.log(`Clubs Involved: ${briefing.enrichedData.stats.clubCount}`);
    console.log(`Transfer Stories: ${briefing.enrichedData.stats.transferCount}`);
    
    // Log enrichment summary
    console.log("\n=== ENRICHMENT SUMMARY ===");
    briefing.enrichedData.tweets.slice(0, 3).forEach((tweet, index) => {
      console.log(`\nStory ${index + 1}:`);
      console.log(`- Players: ${tweet.entities.players.map(p => p.name).join(", ")}`);
      console.log(`- Clubs: ${tweet.entities.clubs.map(c => c.name).join(", ")}`);
      console.log(`- Stage: ${tweet.entities.stage}`);
      if (tweet.entities.fee) {
        console.log(`- Fee: €${tweet.entities.fee.amount}M`);
      }
      console.log(`- Narrative Hooks: ${tweet.storyElements.narrativeHooks.length}`);
    });
    
    // Log images summary
    console.log("\n=== IMAGES SUMMARY ===");
    console.log(`Stories with images: ${briefing.enrichedData.images.length}`);
    let totalImages = 0;
    briefing.enrichedData.images.forEach((storyImages, index) => {
      let imageCount = 0;
      if (storyImages.player) imageCount++;
      if (storyImages.fromClubBadge) imageCount++;
      if (storyImages.toClubBadge) imageCount++;
      if (storyImages.stadiumShot) imageCount++;
      if (storyImages.actionShot) imageCount++;
      imageCount += storyImages.additionalPlayers.size;
      
      totalImages += imageCount;
      console.log(`Story ${index + 1}: ${imageCount} images`);
    });
    console.log(`Total images fetched: ${totalImages}`);
    
    // Log content preview
    console.log("\n=== CONTENT PREVIEW ===");
    console.log("\nSummary:");
    console.log(briefing.summary);
    console.log("\nFirst 500 characters:");
    console.log(briefing.content.substring(0, 500) + "...");
    
    // Save preview HTML
    const previewHtml = generatePreviewHtml(briefing);
    const fs = await import("fs/promises");
    const previewPath = "./rich-media-briefing-preview.html";
    await fs.writeFile(previewPath, previewHtml);
    console.log(`\n✅ Preview saved to: ${previewPath}`);
    
  } catch (error) {
    logger.error("Failed to generate rich media briefing", error);
    process.exit(1);
  }
}

/**
 * Generate HTML preview of the briefing
 */
function generatePreviewHtml(briefing: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${briefing.title} - Rich Media Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #ff6b35, #f7931e);
      color: white;
      padding: 40px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 2.5em;
    }
    .meta {
      opacity: 0.9;
      font-size: 0.9em;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 30px 0;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #ff6b35;
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      white-space: pre-wrap;
    }
    .section-header {
      color: #ff6b35;
      font-weight: bold;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${briefing.title}</h1>
    <div class="meta">
      ${briefing.timeSlot} briefing • ${briefing.metadata.wordCount} words • ${briefing.metadata.readingTime} min read
    </div>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${briefing.enrichedData.stats.tweetCount}</div>
      <div class="stat-label">Tweets Analyzed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${briefing.enrichedData.stats.playerCount}</div>
      <div class="stat-label">Players</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${briefing.enrichedData.stats.clubCount}</div>
      <div class="stat-label">Clubs</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${briefing.enrichedData.stats.transferCount}</div>
      <div class="stat-label">Transfers</div>
    </div>
  </div>
  
  <div class="content">
    <p><strong>Summary:</strong> ${briefing.summary}</p>
    
    <div class="section-header">ARTICLE CONTENT</div>
    ${briefing.content}
  </div>
</body>
</html>`;
}

// Run the test
main().catch(console.error);