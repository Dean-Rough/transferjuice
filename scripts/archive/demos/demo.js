#!/usr/bin/env node
/**
 * Demo Content Generation Script
 * Demonstrates Terry commentary system with sample transfer content
 */

console.log("🚀 TransferJuice Demo Content Generation\n");

// Mock feed store for demonstration
let feedItems = [];
let terryCommentaryCount = 0;

// Sample transfer tweets with different languages and sources
const sampleTweets = [
  {
    id: "demo-1",
    text: "🚨 BREAKING: Arsenal agree €65M fee for Declan Rice! Medical scheduled for tomorrow. Here we go! ✅",
    author: { username: "FabrizioRomano", displayName: "Fabrizio Romano" },
    source: {
      name: "Fabrizio Romano",
      tier: 1,
      reliability: 0.95,
      region: "GLOBAL",
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "demo-2",
    text: "Personal terms agreed between Kylian Mbappé and Real Madrid. Club-to-club negotiations ongoing.",
    author: { username: "David_Ornstein", displayName: "David Ornstein" },
    source: {
      name: "David Ornstein",
      tier: 1,
      reliability: 0.93,
      region: "UK",
    },
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "demo-3",
    text: "UFFICIALE: Juventus confermato accordo per Victor Osimhen! Visite mediche programmate. 🇳🇬⚫⚪",
    author: { username: "DiMarzio", displayName: "Gianluca Di Marzio" },
    source: {
      name: "Gianluca Di Marzio",
      tier: 1,
      reliability: 0.9,
      region: "IT",
    },
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
  },
  {
    id: "demo-4",
    text: "Bayern Munich officials confident about completing Jamal Musiala contract extension. Deal until 2029.",
    author: { username: "SkySports", displayName: "Sky Sports" },
    source: { name: "Sky Sports", tier: 2, reliability: 0.8, region: "UK" },
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: "demo-5",
    text: "Manchester United monitoring Pedri situation. Initial contact made, no formal bid yet.",
    author: { username: "marca", displayName: "MARCA" },
    source: { name: "MARCA", tier: 2, reliability: 0.82, region: "ES" },
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
  },
];

// Terry commentary templates based on context
const terryTemplates = {
  breaking: [
    "Right, {club} spending €{fee}M on {player} is either genius or the most expensive way to disappoint their fanbase.",
    "BREAKING: {player} to {club} is confirmed, which means we'll get 47 updates about them breathing correctly and walking in a straight line.",
    "The {player} to {club} deal is done. That's €{fee}M for someone who'll either be brilliant or end up in the Championship within two years.",
  ],

  itk: [
    '"{source}" says {player} to {club} is happening. That\'s the same confidence I have about finding my car keys each morning.',
    "Personal terms agreed between {player} and {club}, which in football means they've successfully negotiated who pays for the fancy coffee machine.",
    '{club} are "confident" about signing {player}. In transfer speak, that\'s anywhere between now and the heat death of the universe.',
  ],

  tier1: [
    "{source} has spoken, so {player} to {club} is basically sorted. {reliability}% reliability means this is happening whether we like it or not.",
    "When {source} says something, football Twitter collectively holds its breath. {player} to {club} is as good as done.",
    "{source} doesn't mess about. If they say {player} is joining {club}, start printing the shirts.",
  ],

  rumour: [
    "According to {source}, {player} might join {club}. And according to my horoscope, I might win the lottery.",
    "The {player} to {club} rumour is doing the rounds again. Like a bad penny or a questionable tactical formation.",
  ],
};

function classifyTweet(tweet) {
  const text = tweet.text.toLowerCase();

  // Extract transfer keywords
  const keywords = [
    "breaking",
    "fee",
    "agree",
    "medical",
    "personal terms",
    "confirmed",
    "official",
    "here we go",
  ];
  const foundKeywords = keywords.filter((keyword) => text.includes(keyword));

  // Determine transfer type
  let transferType = "rumour";
  if (
    text.includes("breaking") ||
    text.includes("confirmed") ||
    text.includes("official")
  ) {
    transferType = "confirmed";
  } else if (text.includes("medical")) {
    transferType = "medical";
  } else if (text.includes("personal terms")) {
    transferType = "personal_terms";
  }

  // Calculate confidence based on source tier and keywords
  const baseConfidence =
    tweet.source.tier === 1 ? 0.8 : tweet.source.tier === 2 ? 0.6 : 0.4;
  const keywordBonus = foundKeywords.length * 0.1;
  const confidence = Math.min(baseConfidence + keywordBonus, 1.0);

  return {
    isTransferRelated: foundKeywords.length > 0,
    confidence,
    transferType,
    keywords: foundKeywords,
  };
}

function extractEntities(text) {
  // Simple entity extraction (in production would use NLP)
  const clubs = [
    "Arsenal",
    "Real Madrid",
    "Juventus",
    "Bayern Munich",
    "Manchester United",
    "Barcelona",
  ];
  const players = [
    "Declan Rice",
    "Kylian Mbappé",
    "Victor Osimhen",
    "Jamal Musiala",
    "Pedri",
  ];

  const foundClubs = clubs.filter((club) => text.includes(club));
  const foundPlayers = players.filter((player) => text.includes(player));

  return { clubs: foundClubs, players: foundPlayers };
}

function extractFee(text) {
  const feeMatch = text.match(/€(\d+)M/);
  return feeMatch ? feeMatch[1] : null;
}

function generateTerryCommentary(tweet, classification) {
  const entities = extractEntities(tweet.text);
  const fee = extractFee(tweet.text);

  // Choose template based on context
  let templates;
  if (
    classification.transferType === "confirmed" &&
    tweet.text.includes("BREAKING")
  ) {
    templates = terryTemplates.breaking;
  } else if (tweet.source.tier === 1) {
    templates = terryTemplates.tier1;
  } else if (classification.confidence < 0.6) {
    templates = terryTemplates.rumour;
  } else {
    templates = terryTemplates.itk;
  }

  const template = templates[Math.floor(Math.random() * templates.length)];

  // Replace placeholders
  return template
    .replace("{club}", entities.clubs[0] || "the club")
    .replace("{player}", entities.players[0] || "the player")
    .replace("{source}", tweet.source.name)
    .replace("{fee}", fee || "50")
    .replace("{reliability}", Math.round(tweet.source.reliability * 100));
}

function validateVoiceConsistency(commentary) {
  const text = commentary.toLowerCase();

  // Check for Terry voice indicators
  const ascerbicIndicators = [
    "either",
    "or",
    "question is",
    "probably",
    "apparently",
    "basically",
  ];
  const britishIndicators = ["right,", "brilliant", "mental", "proper"];
  const footballIndicators = [
    "medical",
    "personal terms",
    "fee",
    "training ground",
  ];
  const golbyIndicators = [
    "coffee machine",
    "car keys",
    "horoscope",
    "heat death",
  ];

  const ascerbicScore =
    ascerbicIndicators.filter((i) => text.includes(i)).length / 3;
  const britishScore =
    britishIndicators.filter((i) => text.includes(i)).length / 2;
  const footballScore =
    footballIndicators.filter((i) => text.includes(i)).length / 2;
  const golbyScore = golbyIndicators.filter((i) => text.includes(i)).length / 1;

  const overallConsistency =
    ascerbicScore * 0.3 +
    britishScore * 0.25 +
    footballScore * 0.25 +
    golbyScore * 0.2;

  return {
    overallConsistency: Math.min(overallConsistency, 1.0),
    ascerbicScore: Math.min(ascerbicScore, 1.0),
    britishScore: Math.min(britishScore, 1.0),
    footballScore: Math.min(footballScore, 1.0),
    golbyScore: Math.min(golbyScore, 1.0),
  };
}

function processTweet(tweet) {
  console.log(`\n📰 Processing: ${tweet.text.substring(0, 60)}...`);
  console.log(
    `   Source: ${tweet.source.name} (Tier ${tweet.source.tier}, ${Math.round(tweet.source.reliability * 100)}% reliability)`,
  );

  // Classify tweet
  const classification = classifyTweet(tweet);
  console.log(
    `   Transfer related: ${classification.isTransferRelated ? "✅" : "❌"}`,
  );
  console.log(`   Confidence: ${Math.round(classification.confidence * 100)}%`);
  console.log(`   Type: ${classification.transferType}`);
  console.log(`   Keywords: ${classification.keywords.join(", ")}`);

  if (!classification.isTransferRelated || classification.confidence < 0.4) {
    console.log("   ⏭️  Skipping - not transfer related or low confidence");
    return null;
  }

  // Create feed item
  const feedItem = {
    id: tweet.id,
    type: classification.transferType === "confirmed" ? "breaking" : "itk",
    content: tweet.text,
    source: tweet.source,
    timestamp: tweet.timestamp,
    classification,
    entities: extractEntities(tweet.text),
  };

  // Generate Terry commentary
  const shouldComment = Math.random() < 0.7; // 70% chance
  if (shouldComment && terryCommentaryCount < 8) {
    // Max 8 per "hour"
    const commentary = generateTerryCommentary(tweet, classification);
    const voiceMetrics = validateVoiceConsistency(commentary);

    if (voiceMetrics.overallConsistency >= 0.6) {
      // Voice quality threshold
      feedItem.terryCommentary = commentary;
      feedItem.voiceMetrics = voiceMetrics;
      terryCommentaryCount++;

      console.log(`   🎭 Terry: ${commentary}`);
      console.log(
        `   Voice consistency: ${Math.round(voiceMetrics.overallConsistency * 100)}%`,
      );
    } else {
      console.log(
        `   🎭 Terry commentary rejected (low voice quality: ${Math.round(voiceMetrics.overallConsistency * 100)}%)`,
      );
    }
  } else {
    console.log(
      `   🎭 Terry: ${shouldComment ? "Quota reached" : "Skipping commentary"}`,
    );
  }

  feedItems.push(feedItem);
  return feedItem;
}

function displayResults() {
  console.log("\n📊 GENERATION RESULTS");
  console.log("=" * 50);

  console.log(`\nFeed Statistics:`);
  console.log(`- Total items: ${feedItems.length}`);
  console.log(
    `- Items with Terry commentary: ${feedItems.filter((item) => item.terryCommentary).length}`,
  );
  console.log(
    `- Breaking news items: ${feedItems.filter((item) => item.type === "breaking").length}`,
  );
  console.log(
    `- ITK items: ${feedItems.filter((item) => item.type === "itk").length}`,
  );

  const avgConfidence =
    feedItems.reduce((sum, item) => sum + item.classification.confidence, 0) /
    feedItems.length;
  console.log(`- Average confidence: ${Math.round(avgConfidence * 100)}%`);

  const itemsWithTerry = feedItems.filter((item) => item.terryCommentary);
  if (itemsWithTerry.length > 0) {
    const avgVoiceConsistency =
      itemsWithTerry.reduce(
        (sum, item) => sum + item.voiceMetrics.overallConsistency,
        0,
      ) / itemsWithTerry.length;
    console.log(
      `- Average Terry voice consistency: ${Math.round(avgVoiceConsistency * 100)}%`,
    );
  }

  // Regional breakdown
  const regionStats = {};
  feedItems.forEach((item) => {
    const region = item.source.region;
    if (!regionStats[region]) regionStats[region] = 0;
    regionStats[region]++;
  });

  console.log(`\nRegional Coverage:`);
  Object.entries(regionStats).forEach(([region, count]) => {
    console.log(`- ${region}: ${count} items`);
  });

  console.log(
    `\nTerry Commentary Success Rate: ${Math.round((terryCommentaryCount / feedItems.length) * 100)}%`,
  );

  // Show sample commentaries
  const samplesWithTerry = itemsWithTerry.slice(0, 3);
  if (samplesWithTerry.length > 0) {
    console.log(`\n🎭 Sample Terry Commentaries:`);
    samplesWithTerry.forEach((item, index) => {
      console.log(
        `\n${index + 1}. Original: ${item.content.substring(0, 70)}...`,
      );
      console.log(`   Terry: ${item.terryCommentary}`);
      console.log(
        `   Voice Quality: ${Math.round(item.voiceMetrics.overallConsistency * 100)}%`,
      );
    });
  }
}

// Main execution
console.log("🎯 Processing sample transfer tweets...\n");

sampleTweets.forEach((tweet) => {
  processTweet(tweet);
});

displayResults();

console.log("\n✅ Demo content generation complete!");
console.log("🎉 TransferJuice feed ready with Terry commentary!");
console.log("\n💡 This demonstrates:");
console.log("- Global source monitoring (UK, IT, ES regions)");
console.log("- Multi-language transfer classification");
console.log("- Terry voice consistency validation");
console.log("- Contextual commentary generation");
console.log("- Feed prioritization and filtering");
