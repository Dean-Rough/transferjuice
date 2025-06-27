#!/usr/bin/env tsx

/**
 * Simple test for rich media briefing generation
 * Uses mock data to test the pipeline
 */

import { config } from "dotenv";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils/slug";
import { logger } from "@/lib/logger";

config();

async function createTestRichBriefing() {
  console.log("🚀 Creating test rich media briefing...\n");
  
  const now = new Date();
  const timestamp = new Date(now.setHours(22, 0, 0, 0)); // 10 PM slot
  
  // Rich content with embedded media and shithouse corner
  const richContent = `## Breaking: Erling Haaland Set for Real Madrid Move

The Norwegian goal machine is reportedly on the verge of a sensational switch to the Spanish capital, with Los Blancos preparing a €150 million bid that could reshape European football's landscape.

[HERO IMAGE: Erling Haaland celebration at Manchester City]

According to multiple ITK sources across Spain and England, Real Madrid have identified Haaland as their primary target for the summer window. The 24-year-old striker has been in devastating form for Manchester City, notching 28 goals in just 22 appearances this season.

<blockquote class="twitter-tweet">
<p>🚨 BREAKING: Real Madrid have made Erling Haaland their TOP priority for summer 2025. Personal terms already discussed. Here we go soon? 🔥⚪️ #HalaMadrid</p>
&mdash; Fabrizio Romano (@FabrizioRomano) <a href="https://twitter.com/FabrizioRomano/status/1234567890">June 25, 2025</a>
</blockquote>

## The Deal Taking Shape

Sources close to the negotiations suggest Real Madrid are willing to meet City's valuation, which sources indicate could reach €180 million with add-ons. The deal would make Haaland one of the most expensive transfers in football history, though still short of Neymar's €222 million record.

<blockquote class="twitter-tweet">
<p>Haaland to Madrid is happening. Personal terms already agreed in principle. Five-year deal worth €30m per season. 🚨⚪️ #RealMadrid</p>
&mdash; Miguel Delaney (@MiguelDelaney) <a href="https://twitter.com/MiguelDelaney/status/1234567891">June 25, 2025</a>
</blockquote>

[IMAGE: Real Madrid's Santiago Bernabéu stadium at night]

## Player Profile: The Ultimate Goal Machine

At just 24, Haaland has already established himself as one of the most prolific strikers in world football. His current season statistics read like a video game cheat code:
- 28 goals in 22 games (all competitions)
- 1.27 goals per 90 minutes
- 6 hat-tricks already this season
- 82% shot accuracy

The Norwegian's physical presence (6'4", 94kg) combined with surprising pace and clinical finishing make him the complete modern striker. His ability to score with both feet and his head gives defenders nightmares.

## Why Madrid Need Him Now

Real Madrid's aging attack desperately needs rejuvenation. With Benzema's departure and Vinicius Jr. often playing wide, Los Blancos lack a genuine number 9. Haaland would solve multiple problems:
- Guaranteed 40+ goals per season
- Physical presence in the box
- Ability to stretch defenses with pace
- Champions League pedigree

## The Financial Gymnastics

Madrid's offer reportedly includes:
- €150m base fee
- €30m in performance-related add-ons
- €600k weekly wages (€31.2m annually)
- €50m signing bonus
- 20% sell-on clause for City

This would represent Madrid's largest investment since Eden Hazard, though with considerably better injury history and age profile.

## What Happens Next

City are expected to resist initially, but Haaland's desire to test himself in La Liga could prove decisive. Sources suggest:
- Formal bid expected within 10 days
- Medical already provisionally scheduled
- Announcement targeted for early July
- Preseason debut in Los Angeles possible

The dominos are lining up. Haaland to Madrid feels inevitable.

## Shithouse Corner

And now for something completely different - it's time for Shithouse Corner, where we celebrate football's finest wind-up merchants and masters of the dark arts.

This week's nomination goes to Atletico Madrid's entire defensive unit for their masterclass against Barcelona. Special mention to Stefan Savic, who managed to:
- "Accidentally" step on Gavi's foot three times
- Take 47 seconds for every throw-in
- Develop sudden cramp in the 89th minute while 1-0 up
- Get booked for time-wasting, then take even longer

The beautiful game? More like the beautiful wind-up. Simeone stood on the touchline with the satisfied smile of a man watching his orchestra perform a symphony of shithousery.

That's all for Shithouse Corner. Remember, it's not cheating if the ref doesn't see it.`;
  
  // Create the briefing
  const title = {
    main: "Haaland to Madrid: The €180M Mega Deal",
    subtitle: "Norwegian striker set for record-breaking Santiago Bernabéu switch"
  };
  
  // Calculate word count
  const wordCount = richContent.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  
  try {
    const briefing = await prisma.briefing.create({
      data: {
        slug: generateSlug(title.main, timestamp),
        timestamp,
        title,
        content: {
          raw: richContent,
          sections: parseContentToSections(richContent),
          enriched: true,
        },
        visualTimeline: [],
        sidebarSections: [],
        wordCount,
        readTime,
        terryScore: 0.95,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    
    console.log("✅ Rich media briefing created successfully!");
    console.log("\n📊 Details:");
    console.log(`   ID: ${briefing.id}`);
    console.log(`   Slug: ${briefing.slug}`);
    console.log(`   Word Count: ${wordCount}`);
    console.log(`   Read Time: ${readTime} minutes`);
    console.log(`   Terry Score: ${briefing.terryScore}`);
    console.log("\n🔗 URLs:");
    console.log(`   View in Feed: http://localhost:4433/`);
    console.log(`   Direct Link: http://localhost:4433/briefings/${briefing.slug}`);
    
  } catch (error) {
    console.error("❌ Error creating briefing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function parseContentToSections(content: string) {
  const sections = [];
  const lines = content.split('\n\n');
  let currentSection = null;
  let sectionId = 0;
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      
      const title = line.replace('## ', '').trim();
      currentSection = {
        id: `section-${++sectionId}`,
        type: determineSectionType(title),
        title,
        content: '',
        metadata: {},
        feedItemIds: [],
      };
    } else if (currentSection) {
      currentSection.content += (currentSection.content ? '\n\n' : '') + line;
    } else {
      sections.push({
        id: `section-${++sectionId}`,
        type: 'intro',
        title: '',
        content: line,
        metadata: {},
        feedItemIds: [],
      });
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

function determineSectionType(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('breaking')) return 'transfer';
  if (lower.includes('profile')) return 'analysis';
  if (lower.includes('shithouse')) return 'outro'; // Use outro type for now
  return 'transfer';
}

// Run the test
createTestRichBriefing().catch(console.error);