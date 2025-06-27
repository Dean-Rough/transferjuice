#!/usr/bin/env tsx

/**
 * Create a rich media briefing with enhanced content
 * Demonstrates the OneFootball-style rich media features
 */

import { config } from "dotenv";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { generateSlug } from "@/lib/utils/slug";

// Load environment variables
config();

async function createRichBriefing() {
  logger.info("Creating rich media briefing with enhanced content");
  
  try {
    const now = new Date();
    const title = {
      main: "Erling Haaland to Real Madrid",
      subtitle: "Norwegian striker emerges as top target for Los Blancos rebuild"
    };
    
    const richContent = `BREAKING TRANSFER EXCLUSIVE

Real Madrid have identified Erling Haaland as their primary transfer target for the summer window, with the Spanish giants preparing a €150 million bid that could reshape European football's landscape.

THE STORY

According to multiple Tier 1 sources across Spain and England, Real Madrid president Florentino Pérez has personally intervened to accelerate negotiations for the Manchester City striker. The 24-year-old Norwegian has reportedly grown frustrated with City's tactical constraints and is open to a new challenge in La Liga.

"Haaland to Madrid is happening. The player wants the move, and Madrid will make it happen" - @FabrizioRomano

PLAYER PROFILE

Erling Haaland has redefined what it means to be a modern striker. At just 24, he's already:
- Scored 178 goals in 180 appearances for Manchester City
- Won 2 Premier League titles, 1 Champions League
- Broken numerous scoring records including most goals in a Premier League season (36)

His combination of pace, power, and clinical finishing makes him the perfect Galáctico for Madrid's next generation. Standing at 6'4", Haaland brings a physical presence that Madrid have lacked since Cristiano Ronaldo's departure.

Current Season Stats:
- 31 goals in 28 appearances
- 7 assists
- Goal every 76 minutes
- 87% shot accuracy in the box

TACTICAL ANALYSIS

Carlo Ancelotti's 4-3-3 system would be transformed by Haaland's arrival. Unlike Karim Benzema's false 9 role, Haaland would operate as a traditional number 9, occupying central defenders and creating space for Vinícius Jr. and potentially Kylian Mbappé.

The Norwegian's ability to stretch defenses vertically would complement Madrid's possession-based approach. His movement in the box - particularly his near-post runs - would give Luka Modrić and Jude Bellingham new passing options.

Key tactical benefits:
- Aerial dominance from crosses (wins 78% of aerial duels)
- Counter-attacking threat with 36.9 km/h top speed
- Link-up play improving (82% pass completion this season)

CLUB CONTEXT

Real Madrid's need for a striker has become urgent. Joselu's loan expires this summer, and the club views Haaland as the long-term solution to their attacking needs. With €200m in available transfer funds and strong FFP compliance, Madrid can afford the deal.

Manchester City face a dilemma. While they don't want to lose Haaland, keeping an unhappy player goes against Guardiola's philosophy. City have already identified Viktor Gyökeres and Benjamin Šeško as potential replacements.

HISTORICAL PERSPECTIVE

This wouldn't be the first time Madrid have signed the world's best striker from the Premier League. Similar high-profile moves include:
- Cristiano Ronaldo from Manchester United (€94m, 2009)
- Gareth Bale from Tottenham (€100m, 2013)

The proposed €150m fee would make Haaland the second-most expensive player in history, behind only Neymar's €222m move to PSG.

WHAT HAPPENS NEXT

The transfer window opens in 67 days. Key dates to watch:
- March 15: Champions League quarter-final draw (potential Madrid vs City clash)
- April 30: Haaland's release clause becomes active
- June 1: Official transfer window opens

Expect intense negotiations through intermediaries over the next month. If City exit the Champions League early, it could accelerate Haaland's decision. Madrid are confident but preparing alternatives including Harry Kane and Victor Osimhen.

The Terry's Take: This has more legs than a centipede convention. When Madrid want their man, they usually get him. City won't go down without a fight, but Haaland in white feels inevitable.

---
Generated at ${now.toISOString()}
Word Count: 580
Terry Commentary Confidence: 92%
Transfer Likelihood: 75%`;

    // Count words
    const wordCount = richContent.split(/\s+/).length;
    
    // Create sections for structured content
    const sections = [
      { type: "breaking", content: richContent.split("\n\n")[0] },
      { type: "story", content: richContent.split("THE STORY")[1].split("PLAYER PROFILE")[0].trim() },
      { type: "player", content: richContent.split("PLAYER PROFILE")[1].split("TACTICAL ANALYSIS")[0].trim() },
      { type: "tactical", content: richContent.split("TACTICAL ANALYSIS")[1].split("CLUB CONTEXT")[0].trim() },
      { type: "club", content: richContent.split("CLUB CONTEXT")[1].split("HISTORICAL PERSPECTIVE")[0].trim() },
      { type: "history", content: richContent.split("HISTORICAL PERSPECTIVE")[1].split("WHAT HAPPENS NEXT")[0].trim() },
      { type: "next", content: richContent.split("WHAT HAPPENS NEXT")[1].split("---")[0].trim() }
    ];
    
    // Create visual timeline events
    const timelineEvents = [
      { date: "Now", event: "Negotiations Begin", status: "active" },
      { date: "Mar 15", event: "UCL Quarter Finals", status: "upcoming" },
      { date: "Apr 30", event: "Release Clause Active", status: "upcoming" },
      { date: "Jun 1", event: "Transfer Window Opens", status: "upcoming" },
      { date: "Jul 1", event: "Expected Announcement", status: "future" }
    ];
    
    // Create briefing
    const briefing = await prisma.briefing.create({
      data: {
        id: `briefing-rich-${now.getTime()}`,
        slug: generateSlug(title.main, now),
        timestamp: now,
        title,
        content: {
          raw: richContent,
          sections: sections,
          metadata: {
            mainPlayer: "Erling Haaland",
            fromClub: "Manchester City", 
            toClub: "Real Madrid",
            fee: 150000000,
            likelihood: 0.75
          }
        },
        readTime: Math.ceil(wordCount / 200),
        wordCount: wordCount,
        terryScore: 0.92,
        visualTimeline: {
          events: timelineEvents,
          currentStage: "negotiations"
        },
        sidebarSections: {
          sections: [
            { 
              type: "transfer-details",
              title: "Deal Summary",
              content: {
                fee: "€150M",
                wages: "€30M/year",
                contract: "6 years",
                agent: "Rafaela Pimenta"
              }
            },
            {
              type: "player-stats",
              title: "Key Stats",
              content: {
                goals: "31 in 28",
                assists: "7",
                minutesPerGoal: "76",
                shotAccuracy: "87%"
              }
            },
            {
              type: "terry-verdict",
              title: "Terry's Verdict",
              content: {
                confidence: "92%",
                likelihood: "75%",
                snark: "More inevitable than England penalties heartbreak"
              }
            }
          ]
        },
        isPublished: true,
        publishedAt: now,
        viewCount: 0
      }
    });
    
    logger.info("Rich media briefing created successfully!", {
      id: briefing.id,
      slug: briefing.slug,
      url: `http://localhost:4433/briefings/${briefing.slug}?style=rich`
    });
    
    // Log details
    console.log("\n=== RICH MEDIA BRIEFING CREATED ===");
    console.log(`ID: ${briefing.id}`);
    console.log(`Title: ${title.main}`);
    console.log(`Subtitle: ${title.subtitle}`);
    console.log(`Slug: ${briefing.slug}`);
    console.log(`Word Count: ${wordCount}`);
    console.log(`Read Time: ${Math.ceil(wordCount / 200)} minutes`);
    console.log(`Terry Score: 92%`);
    
    console.log("\n=== ENHANCED FEATURES ===");
    console.log("✓ Player profile section with career stats");
    console.log("✓ Tactical analysis with formation details");
    console.log("✓ Club context with financial implications");
    console.log("✓ Historical transfer comparisons");
    console.log("✓ Visual timeline with key dates");
    console.log("✓ Sidebar with deal summary and stats");
    console.log("✓ Embedded tweet quotes");
    console.log("✓ Transfer likelihood percentage");
    
    console.log("\n=== VIEW OPTIONS ===");
    console.log(`Classic Layout: http://localhost:4433/briefings/${briefing.slug}`);
    console.log(`Rich Media Layout: http://localhost:4433/briefings/${briefing.slug}?style=rich`);
    
    console.log("\n✅ Rich media briefing ready for viewing!");
    
  } catch (error) {
    logger.error("Failed to create rich briefing", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createRichBriefing().catch(console.error);