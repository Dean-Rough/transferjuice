#!/usr/bin/env tsx

/**
 * Test briefing with Wikipedia player images
 */

import { config } from "dotenv";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils/slug";
import { processMediaPlaceholders } from "@/briefing-generator/steps/07-process-media-placeholders";

config();

async function createWikipediaBriefing() {
  console.log("🚀 Creating briefing with Wikipedia images...\n");
  
  const now = new Date();
  const timestamp = new Date(now.setHours(23, 0, 0, 0)); // 11 PM slot
  
  // Rich content with multiple player images
  const richContent = `## Breaking: Chelsea Eye Triple Swoop for Bellingham, Mbappé and Haaland

[HERO IMAGE: Jude Bellingham celebration]

In what could be the most ambitious transfer window in football history, Chelsea are reportedly preparing a £500 million war chest to sign three of world football's biggest stars.

<blockquote class="twitter-tweet">
<p>🚨 EXCLUSIVE: Chelsea preparing MEGA offers for Bellingham, Mbappé AND Haaland. Todd Boehly ready to break the bank. More to follow... 💙</p>
&mdash; Matt Law (@Matt_Law_DT) <a href="https://twitter.com/Matt_Law_DT/status/1234567892">June 26, 2025</a>
</blockquote>

## The Bellingham Factor

[IMAGE: Jude Bellingham in action]

The England midfielder has been sensational at Real Madrid, but Chelsea believe they can tempt him back to the Premier League with a £150 million offer. At just 21, Bellingham represents the future of English football.

## Mbappé's Next Move

[IMAGE: Kylian Mbappé celebration]

With his PSG contract situation still unresolved, Mbappé could finally make his long-awaited move. Chelsea's offer would make him the highest-paid player in Premier League history at £1 million per week.

<blockquote class="twitter-tweet">
<p>Mbappé to Chelsea is ON. Personal terms agreed in principle. This is happening. 🔵 #CFC</p>
&mdash; Simon Phillips (@siphillipssport) <a href="https://twitter.com/siphillipssport/status/1234567893">June 26, 2025</a>
</blockquote>

## The Haaland Hijack

[IMAGE: Erling Haaland celebration at Manchester City]

Perhaps the most audacious part of Chelsea's plan involves prising Haaland away from Manchester City. The Norwegian has a release clause that Chelsea are prepared to trigger.

[IMAGE: Stamford Bridge stadium]

## Financial Fair Play? What's That?

Chelsea's spending shows no signs of slowing down. With over £1 billion already spent under Todd Boehly's ownership, this triple swoop would take their outlay to astronomical levels.

The club insists they have a plan to comply with FFP regulations through player sales and increased commercial revenue.

## What Happens Next

- Formal bids expected this week
- Player agents in London for talks
- Medical facilities on standby
- Announcement videos already in production

The football world holds its breath. Is this genius or madness?

## Shithouse Corner

And now for something completely different - it's time for Shithouse Corner, where we celebrate football's finest wind-up merchants and masters of the dark arts.

This week's hero is Emiliano Martinez, who took his World Cup mind games to a whole new level. During Argentina's recent friendly, he:

- Danced on the penalty spot before every opposition kick
- Threw the ball away "accidentally" three times
- Convinced the referee his gloves were "too slippery" to hold the ball
- Celebrated a miss by doing the worm

When asked about his behavior, Martinez simply said: "I learned from watching old videos of Bruce Grobbelaar. But I added my own sauce."

That's all for Shithouse Corner. Remember, it's not cheating if the ref doesn't see it.`;
  
  // Create the briefing
  const title = {
    main: "Chelsea's £500M Triple Transfer Bombshell",
    subtitle: "Blues target Bellingham, Mbappé and Haaland in record-breaking spree"
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
          sections: [], // Will be parsed
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
    
    // Process media placeholders
    const { content: processedContent } = await processMediaPlaceholders(
      richContent,
      briefing.id
    );
    
    // Update with processed content
    await prisma.briefing.update({
      where: { id: briefing.id },
      data: {
        content: {
          raw: processedContent,
          sections: parseContentToSections(processedContent),
          enriched: true,
          hasMedia: true,
        },
      },
    });
    
    console.log("✅ Briefing with Wikipedia images created!");
    console.log("\n📊 Details:");
    console.log(`   ID: ${briefing.id}`);
    console.log(`   Slug: ${briefing.slug}`);
    console.log("\n🔗 URLs:");
    console.log(`   View in Feed: http://localhost:4433/`);
    console.log(`   Direct Link: http://localhost:4433/briefings/${briefing.slug}`);
    console.log("\n📷 Images:");
    console.log("   - Jude Bellingham (Wikipedia)");
    console.log("   - Kylian Mbappé (Wikipedia)");
    console.log("   - Erling Haaland (Wikipedia)");
    console.log("   - Stamford Bridge (Wikipedia)");
    
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
  if (lower.includes('shithouse')) return 'outro';
  return 'transfer';
}

// Run the test
createWikipediaBriefing().catch(console.error);