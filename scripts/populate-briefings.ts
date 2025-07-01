import { League, FeedItemType } from "@prisma/client";
import { generateBriefing } from "../src/lib/briefings/generator";
import { prisma } from "../src/lib/prisma";

async function populateBriefings() {
  try {
    console.log("🚀 Populating database with briefings");
    console.log("=====================================");
    
    // Debug prisma
    console.log("Prisma client:", typeof prisma);
    console.log("Prisma source model:", typeof prisma?.source);
    
    if (!prisma || !prisma.source) {
      throw new Error("Prisma client not properly initialized");
    }
    
    // Create a manual source
    const source = await prisma.source.upsert({
      where: { username: "transferjuice-official" },
      update: {},
      create: {
        username: "transferjuice-official",
        name: "Transfer Juice Official",
        type: "MANUAL",
        region: "GLOBAL",
        isReliable: true,
        reliability: 1.0,
        language: "en",
        specialties: ["transfers", "exclusives", "breaking-news"],
        leagues: [
          League.PREMIER_LEAGUE,
          League.LA_LIGA,
          League.SERIE_A,
          League.BUNDESLIGA,
          League.LIGUE_1
        ]
      }
    });
    
    console.log("✅ Created source:", source.name);
    
    // Create feed items for today's hot stories
    const feedItems = [
      {
        headline: "BREAKING: Arsenal Complete £105m Declan Rice Deal",
        content: "Arsenal have officially completed the signing of Declan Rice from West Ham United for a British record transfer fee of £105 million. The England midfielder has signed a five-year contract with the option for an additional year. Rice passed his medical earlier today and will wear the number 41 shirt. Mikel Arteta described the signing as 'transformative' for the club's ambitions.",
        sourceId: source.id,
        type: FeedItemType.CONFIRMED,
        league: League.PREMIER_LEAGUE,
        isRelevant: true,
        confidence: 1.0,
        rawContent: { verified: true },
        extractedAt: new Date()
      },
      {
        headline: "Liverpool Hijack Chelsea's Romeo Lavia Deal",
        content: "Liverpool have dramatically entered the race for Southampton midfielder Romeo Lavia, matching Chelsea's £60m bid. The 19-year-old Belgian is now weighing up his options after initially agreeing personal terms with Chelsea. Jurgen Klopp personally called Lavia to outline Liverpool's project. Southampton have accepted both bids.",
        sourceId: source.id,
        type: FeedItemType.DEVELOPING,
        league: League.PREMIER_LEAGUE,
        isRelevant: true,
        confidence: 0.9,
        rawContent: { sources: ["Sky Sports", "BBC Sport"] },
        extractedAt: new Date()
      },
      {
        headline: "Real Madrid Prepare €150m Mbappé Bid",
        content: "Real Madrid are preparing a final €150 million bid for Kylian Mbappé as PSG show signs of softening their stance. The French superstar has refused to sign a contract extension, leaving PSG with a dilemma: sell now or lose him for free next summer. Florentino Pérez is confident of finally landing his long-term target.",
        sourceId: source.id,
        type: FeedItemType.EXCLUSIVE,
        league: League.LA_LIGA,
        isRelevant: true,
        confidence: 0.85,
        rawContent: { exclusive: true },
        extractedAt: new Date()
      },
      {
        headline: "Manchester United Close In on Højlund",
        content: "Manchester United are finalizing a £72m deal for Atalanta striker Rasmus Højlund. The 20-year-old Danish international is expected to undergo a medical this weekend. Erik ten Hag has identified Højlund as his primary striker target after missing out on Harry Kane. Personal terms have been agreed on a five-year contract.",
        sourceId: source.id,
        type: FeedItemType.EXCLUSIVE,
        league: League.PREMIER_LEAGUE,
        isRelevant: true,
        confidence: 0.92,
        rawContent: { medical: "scheduled" },
        extractedAt: new Date()
      },
      {
        headline: "Chelsea's £115m Caicedo Bid Rejected",
        content: "Brighton have rejected Chelsea's British record £115m bid for Moises Caicedo. The Seagulls are holding out for £120m for the Ecuadorian midfielder. Chelsea remain confident of completing the deal but face competition from Liverpool. Caicedo has made it clear he wants to leave this summer.",
        sourceId: source.id,
        type: FeedItemType.DEVELOPING,
        league: League.PREMIER_LEAGUE,
        isRelevant: true,
        confidence: 0.88,
        rawContent: { bidAmount: "£115m" },
        extractedAt: new Date()
      },
      {
        headline: "Bayern Munich Launch Harry Kane Offensive",
        content: "Bayern Munich have submitted an €100m bid for Tottenham striker Harry Kane. The German champions are desperate to replace Robert Lewandowski and see Kane as the perfect solution. Daniel Levy is reluctant to sell to a Premier League rival, making Bayern the frontrunners. Kane has one year left on his contract.",
        sourceId: source.id,
        type: FeedItemType.SPECULATION,
        league: League.BUNDESLIGA,
        isRelevant: true,
        confidence: 0.8,
        rawContent: { bid: "€100m" },
        extractedAt: new Date()
      }
    ];
    
    // Clear existing feed items to avoid duplicates
    await prisma.feedItem.deleteMany({
      where: { sourceId: source.id }
    });
    
    // Create new feed items
    for (const item of feedItems) {
      await prisma.feedItem.create({ data: item });
    }
    
    console.log(`✅ Created ${feedItems.length} feed items`);
    
    // Generate briefing
    const timestamp = new Date();
    console.log(`\n📝 Generating briefing for ${timestamp.toISOString()}`);
    
    const briefing = await generateBriefing({ 
      timestamp,
      forceGeneration: true // Force generation even if one exists
    });
    
    console.log("\n✅ Briefing generated successfully!");
    console.log(`ID: ${briefing.id}`);
    console.log(`Title: ${briefing.title.main}`);
    console.log(`Slug: ${briefing.slug}`);
    console.log(`Feed items used: ${briefing.feedItems.length}`);
    console.log(`Word count: ${briefing.wordCount}`);
    console.log(`Read time: ${briefing.readTime} minutes`);
    console.log(`Published: ${briefing.isPublished}`);
    console.log(`URL: https://www.transferjuice.com/briefing/${briefing.slug}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

populateBriefings();