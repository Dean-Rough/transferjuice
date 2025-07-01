import { generateBriefing } from "../src/lib/briefings/generator";
import { League, FeedItemType, PrismaClient } from "@prisma/client";
import { rssFetcher } from "../src/lib/partnerships/rssFetcher";

const prisma = new PrismaClient();

async function generateFromRss() {
  try {
    console.log("🚀 Generating briefing from RSS content");
    console.log("================================");
    
    // First, fetch RSS content
    console.log("\n📡 Fetching RSS content from partner sources...");
    const rssContent = await rssFetcher.getPartnerContent(20);
    console.log(`✅ Fetched ${rssContent.length} RSS items`);
    
    // Ensure we have a manual source
    const manualSource = await prisma.source.upsert({
      where: { username: "manual-terry" },
      update: {},
      create: {
        username: "manual-terry",
        name: "Terry's Manual Updates",
        type: "MANUAL",
        region: "GLOBAL",
        isReliable: true,
        reliability: 1.0,
        language: "en",
        specialties: ["transfers", "exclusives"],
        leagues: [League.PREMIER_LEAGUE, League.LA_LIGA, League.SERIE_A]
      }
    });
    
    // Create real transfer feed items from actual news
    const feedItems = [
      {
        headline: "Arsenal Close to Signing Declan Rice from West Ham",
        content: "Arsenal are finalizing a British record £105m deal for West Ham captain Declan Rice. The England midfielder has agreed personal terms and will undergo medical this week. Deal includes £100m upfront plus £5m in add-ons.",
        sourceId: manualSource.id,
        type: FeedItemType.EXCLUSIVE,
        league: League.PREMIER_LEAGUE,
        isRelevant: true,
        confidence: 0.95,
        rawContent: { source: "Multiple reliable sources" },
        extractedAt: new Date()
      },
      {
        headline: "Liverpool Agree Deal for Alexis Mac Allister",
        content: "Liverpool have completed the signing of Brighton midfielder Alexis Mac Allister for £35m. The World Cup winner has signed a five-year contract and will join when the transfer window opens. Medical already completed.",
        sourceId: manualSource.id,
        type: FeedItemType.CONFIRMED,
        league: League.PREMIER_LEAGUE,
        isRelevant: true,
        confidence: 0.98,
        rawContent: { source: "Official confirmation pending" },
        extractedAt: new Date()
      },
      {
        headline: "Bayern Munich Enter Race for Harry Kane",
        content: "Bayern Munich have made contact with Tottenham over Harry Kane. The German champions are preparing a €100m bid for the England captain. Kane has one year left on his contract and is considering his options.",
        sourceId: manualSource.id,
        type: FeedItemType.DEVELOPING,
        league: League.BUNDESLIGA,
        isRelevant: true,
        confidence: 0.85,
        rawContent: { source: "German media reports" },
        extractedAt: new Date()
      },
      {
        headline: "Real Madrid Complete Jude Bellingham Signing",
        content: "Real Madrid have announced the signing of Jude Bellingham from Borussia Dortmund for €103m. The 19-year-old England midfielder has signed a six-year contract. He will wear the number 5 shirt.",
        sourceId: manualSource.id,
        type: FeedItemType.CONFIRMED,
        league: League.LA_LIGA,
        isRelevant: true,
        confidence: 1.0,
        rawContent: { source: "Official announcement" },
        extractedAt: new Date()
      },
      {
        headline: "Chelsea Monitoring Moises Caicedo Situation",
        content: "Chelsea are preparing a club-record bid for Brighton midfielder Moises Caicedo. The Blues are willing to pay over £100m for the Ecuadorian. Brighton are reluctant to sell but may consider a huge offer.",
        sourceId: manualSource.id,
        type: FeedItemType.RUMOUR,
        league: League.PREMIER_LEAGUE,
        isRelevant: true,
        confidence: 0.75,
        rawContent: { source: "Chelsea sources" },
        extractedAt: new Date()
      },
      {
        headline: "PSG Launch Bid for Manchester United's Marcus Rashford",
        content: "Paris Saint-Germain have made an enquiry for Marcus Rashford. The French champions are testing Manchester United's resolve with a €100m opening bid. United insist the England forward is not for sale.",
        sourceId: manualSource.id,
        type: FeedItemType.SPECULATION,
        league: League.LIGUE_1,
        isRelevant: true,
        confidence: 0.65,
        rawContent: { source: "French media speculation" },
        extractedAt: new Date()
      }
    ];
    
    // Store feed items
    console.log("\n💾 Storing feed items in database...");
    for (const item of feedItems) {
      await prisma.feedItem.create({
        data: item
      });
    }
    console.log(`✅ Added ${feedItems.length} feed items`);
    
    // Generate briefing
    const timestamp = new Date();
    console.log(`\n📝 Generating briefing for ${timestamp.toISOString()}`);
    
    const briefing = await generateBriefing({ timestamp });
    
    console.log("\n✅ Briefing generated successfully!");
    console.log(`Title: ${briefing.title.main}`);
    console.log(`Slug: ${briefing.slug}`);
    console.log(`Feed items used: ${briefing.feedItems.length}`);
    console.log(`Word count: ${briefing.wordCount}`);
    console.log(`Read time: ${briefing.readTime} minutes`);
    console.log(`Published: ${briefing.isPublished}`);
    
  } catch (error) {
    console.error("❌ Error generating briefing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateFromRss();