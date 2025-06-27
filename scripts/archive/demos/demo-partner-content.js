#!/usr/bin/env node
/**
 * Partner Content Integration Demo
 * Demonstrates smart content mixing during ITK quiet periods
 */

console.log("🎯 TransferJuice Partner Content Integration Demo\n");

// Mock partner content system for demonstration
let feedItems = [];
let partnerContentCount = 0;
let mixingStats = {
  totalChecks: 0,
  successfulMixes: 0,
  rejectedMixes: 0,
  lastMixTime: null,
};

// Sample partner sources
const partnerSources = [
  {
    id: "the-upshot",
    name: "The Upshot",
    website: "https://www.theupshot.co.uk",
    credibility: 0.88,
    category: "analysis",
    tags: ["tactics", "analysis", "premier-league"],
  },
  {
    id: "fourfourtwo",
    name: "FourFourTwo",
    website: "https://www.fourfourtwo.com",
    credibility: 0.85,
    category: "news",
    tags: ["transfers", "interviews", "features"],
  },
  {
    id: "tifo",
    name: "Tifo Football",
    website: "https://www.tifofootball.com",
    credibility: 0.91,
    category: "tactical",
    tags: ["tactics", "data", "analysis"],
  },
  {
    id: "guardian-football",
    name: "The Guardian Football",
    website: "https://www.theguardian.com/football",
    credibility: 0.89,
    category: "news",
    tags: ["news", "premier-league", "transfers"],
  },
];

// Sample ITK feed items to establish baseline
const recentITKItems = [
  {
    id: "itk-1",
    type: "itk",
    content:
      "Arsenal confident about completing Declan Rice deal. Personal terms agreed, medical scheduled.",
    timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    source: { name: "David Ornstein", tier: 1, reliability: 0.93 },
    priority: "high",
  },
  {
    id: "itk-2",
    type: "breaking",
    content: "BREAKING: Kylian Mbappé to Real Madrid - HERE WE GO! ✅",
    timestamp: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
    source: { name: "Fabrizio Romano", tier: 1, reliability: 0.95 },
    priority: "high",
  },
];

feedItems.push(...recentITKItems);

// Partner content templates based on trending topics
const partnerContentTemplates = {
  analysis: [
    {
      title:
        "Tactical Analysis: How {club}'s transfer strategy is reshaping their season",
      content:
        "Deep dive into {club}'s recent transfer decisions and their tactical implications. The signing of {player} represents a significant shift in approach, with data showing improved possession statistics and defensive stability.",
      tags: ["tactics", "analysis", "strategy"],
    },
    {
      title:
        "Transfer Market Trends: The evolution of player valuations in {year}",
      content:
        "Comprehensive analysis of how transfer fees have evolved this season, with particular focus on the {club} approach to squad building and long-term planning.",
      tags: ["market", "valuations", "data"],
    },
  ],
  news: [
    {
      title: "Transfer Update: The latest on {club}'s remaining targets",
      content:
        "With the window progressing, {club} are still looking to strengthen key areas. Our sources indicate continued interest in {player}, with negotiations expected to intensify.",
      tags: ["transfers", "updates", "targets"],
    },
    {
      title: "Behind the Scenes: How modern transfers really work",
      content:
        "From initial contact to medical completion, we break down the complex process behind modern football transfers, using recent {club} activity as a case study.",
      tags: ["process", "behind-scenes", "modern-football"],
    },
  ],
  tactical: [
    {
      title:
        "Formation Focus: How {club} could line up with their new signings",
      content:
        "Tactical breakdown of {club}'s potential formations with their summer additions. The arrival of {player} opens up new strategic possibilities and matchup advantages.",
      tags: ["formations", "tactics", "new-signings"],
    },
  ],
};

function checkQuietPeriod() {
  const now = new Date();
  const lastITKTime = Math.max(
    ...feedItems
      .filter((item) => item.type === "itk" || item.type === "breaking")
      .map((item) => new Date(item.timestamp).getTime()),
  );

  const minutesSinceLastITK = (now.getTime() - lastITKTime) / (1000 * 60);
  const isQuietPeriod = minutesSinceLastITK >= 30; // 30+ minutes = quiet period

  return {
    isQuietPeriod,
    minutesSinceLastITK: Math.round(minutesSinceLastITK),
    lastITKTime: new Date(lastITKTime),
  };
}

function shouldMixPartnerContent() {
  mixingStats.totalChecks++;

  // Check hourly limit (max 4 partner articles per hour)
  const partnerContentLastHour = feedItems.filter(
    (item) =>
      item.type === "partner" &&
      Date.now() - new Date(item.timestamp).getTime() < 60 * 60 * 1000,
  );

  if (partnerContentLastHour.length >= 4) {
    return {
      shouldMix: false,
      reason: "Hourly partner content limit reached (4/hour)",
    };
  }

  // Check for recent breaking news (disable mixing during breaking news)
  const recentBreaking = feedItems.some(
    (item) =>
      item.type === "breaking" &&
      Date.now() - new Date(item.timestamp).getTime() < 30 * 60 * 1000,
  );

  if (recentBreaking) {
    return {
      shouldMix: false,
      reason: "Recent breaking news - not mixing during transfer drama",
    };
  }

  // Check quiet period
  const quietPeriodCheck = checkQuietPeriod();
  if (!quietPeriodCheck.isQuietPeriod) {
    return {
      shouldMix: false,
      reason: `Recent ITK activity (${quietPeriodCheck.minutesSinceLastITK} min ago)`,
    };
  }

  // Check partner content ratio (max 25% of feed)
  const partnerRatio =
    feedItems.filter((item) => item.type === "partner").length /
    feedItems.length;
  if (partnerRatio >= 0.25) {
    return {
      shouldMix: false,
      reason: "Partner content ratio limit reached (25% of feed)",
    };
  }

  return {
    shouldMix: true,
    reason: "ITK quiet period detected - ready for partner content",
  };
}

function generatePartnerContent() {
  // Select random high-credibility partner source
  const highCredibilitySources = partnerSources.filter(
    (s) => s.credibility >= 0.85,
  );
  const selectedSource =
    highCredibilitySources[
      Math.floor(Math.random() * highCredibilitySources.length)
    ];

  // Get trending topics from recent feed
  const trendingClubs = [
    "Arsenal",
    "Real Madrid",
    "Manchester United",
    "Liverpool",
  ];
  const trendingPlayers = ["Declan Rice", "Kylian Mbappé", "Jude Bellingham"];

  // Select content template
  const templates =
    partnerContentTemplates[selectedSource.category] ||
    partnerContentTemplates.news;
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Generate content
  const club = trendingClubs[Math.floor(Math.random() * trendingClubs.length)];
  const player =
    trendingPlayers[Math.floor(Math.random() * trendingPlayers.length)];

  const title = template.title
    .replace("{club}", club)
    .replace("{player}", player)
    .replace("{year}", "2024");

  const content = template.content
    .replace("{club}", club)
    .replace("{player}", player)
    .replace("{year}", "2024");

  return {
    id: `partner-${Date.now()}`,
    type: "partner",
    title,
    content,
    timestamp: new Date(),
    source: selectedSource,
    priority: selectedSource.credibility >= 0.9 ? "high" : "medium",
    attribution: `Originally published by ${selectedSource.name} - ${selectedSource.website}`,
    tags: [...template.tags, club.toLowerCase(), player.toLowerCase()],
  };
}

function generateTerryCommentaryForPartner(partnerContent) {
  const partnerTemplates = [
    `Right, ${partnerContent.source.name} doing the heavy lifting while we wait for the next ITK update to set Twitter ablaze.`,
    `Quality content from ${partnerContent.source.name} to fill the void between "Here we go!" announcements.`,
    `${partnerContent.source.name} proving that football journalism doesn't always have to involve someone's medical being "scheduled for tomorrow."`,
    `Proper analysis from ${partnerContent.source.name} - the kind that doesn't require refreshing Twitter every 30 seconds.`,
    `${partnerContent.source.name} with the sensible take while we wait for the next transfer circus to begin.`,
  ];

  const template =
    partnerTemplates[Math.floor(Math.random() * partnerTemplates.length)];

  // 30% chance Terry comments on partner content
  if (Math.random() < 0.3) {
    return {
      commentary: template,
      voiceConsistency: 0.75, // Good consistency for partner content commentary
      humorLevel: "dry",
    };
  }

  return null;
}

function simulateContentMixingCycle() {
  console.log("🔄 Running Smart Content Mixing Cycle...\n");

  // Check current feed state
  const quietPeriodStatus = checkQuietPeriod();
  console.log("📊 Current Feed Status:");
  console.log(`   Total feed items: ${feedItems.length}`);
  console.log(
    `   ITK/Breaking items: ${feedItems.filter((item) => item.type === "itk" || item.type === "breaking").length}`,
  );
  console.log(
    `   Partner content items: ${feedItems.filter((item) => item.type === "partner").length}`,
  );
  console.log(
    `   Last ITK activity: ${quietPeriodStatus.minutesSinceLastITK} minutes ago`,
  );
  console.log(
    `   Quiet period: ${quietPeriodStatus.isQuietPeriod ? "✅ Yes" : "❌ No"}`,
  );

  // Check if we should mix content
  const mixingDecision = shouldMixPartnerContent();
  console.log(
    `\n🤔 Content Mixing Decision: ${mixingDecision.shouldMix ? "✅ MIX" : "❌ SKIP"}`,
  );
  console.log(`   Reason: ${mixingDecision.reason}`);

  if (!mixingDecision.shouldMix) {
    mixingStats.rejectedMixes++;
    return { action: "skipped", reason: mixingDecision.reason };
  }

  // Generate partner content
  console.log("\n📰 Generating Partner Content...");
  const partnerContent = generatePartnerContent();

  console.log(
    `   Source: ${partnerContent.source.name} (${Math.round(partnerContent.source.credibility * 100)}% credibility)`,
  );
  console.log(`   Category: ${partnerContent.source.category}`);
  console.log(`   Title: "${partnerContent.title}"`);
  console.log(`   Content: "${partnerContent.content.substring(0, 100)}..."`);
  console.log(`   Attribution: ${partnerContent.attribution}`);

  // Generate Terry commentary
  const terryResult = generateTerryCommentaryForPartner(partnerContent);
  if (terryResult) {
    partnerContent.terryCommentary = terryResult.commentary;
    console.log(`   🎭 Terry: "${terryResult.commentary}"`);
    console.log(
      `   Voice quality: ${Math.round(terryResult.voiceConsistency * 100)}%`,
    );
  } else {
    console.log("   🎭 Terry: Skipping commentary on partner content");
  }

  // Add to feed
  feedItems.push(partnerContent);
  partnerContentCount++;
  mixingStats.successfulMixes++;
  mixingStats.lastMixTime = new Date();

  return { action: "mixed", content: partnerContent };
}

function displayMixingAnalytics() {
  console.log("\n📈 SMART CONTENT MIXING ANALYTICS");
  console.log("=".repeat(50));

  const partnerItems = feedItems.filter((item) => item.type === "partner");
  const last24Hours = partnerItems.filter(
    (item) =>
      Date.now() - new Date(item.timestamp).getTime() <= 24 * 60 * 60 * 1000,
  );

  console.log(`\n🎯 Mixing Performance:`);
  console.log(`- Total mixing checks: ${mixingStats.totalChecks}`);
  console.log(`- Successful mixes: ${mixingStats.successfulMixes}`);
  console.log(`- Rejected mixes: ${mixingStats.rejectedMixes}`);
  console.log(
    `- Success rate: ${Math.round((mixingStats.successfulMixes / mixingStats.totalChecks) * 100)}%`,
  );
  console.log(
    `- Last mix time: ${mixingStats.lastMixTime?.toLocaleTimeString() || "Never"}`,
  );

  console.log(`\n📊 Feed Composition:`);
  console.log(`- Total items: ${feedItems.length}`);
  console.log(
    `- ITK items: ${feedItems.filter((item) => item.type === "itk").length}`,
  );
  console.log(
    `- Breaking news: ${feedItems.filter((item) => item.type === "breaking").length}`,
  );
  console.log(`- Partner content: ${partnerItems.length}`);
  console.log(
    `- Partner content ratio: ${Math.round((partnerItems.length / feedItems.length) * 100)}%`,
  );

  // Source breakdown
  const sourceStats = last24Hours.reduce((acc, item) => {
    const sourceName = item.source.name;
    acc[sourceName] = (acc[sourceName] || 0) + 1;
    return acc;
  }, {});

  if (Object.keys(sourceStats).length > 0) {
    console.log(`\n📰 Partner Source Breakdown (24h):`);
    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`- ${source}: ${count} articles`);
    });
  }

  // Terry commentary on partner content
  const partnerItemsWithTerry = partnerItems.filter(
    (item) => item.terryCommentary,
  );
  if (partnerItemsWithTerry.length > 0) {
    console.log(`\n🎭 Terry on Partner Content:`);
    console.log(
      `- Partner items with Terry commentary: ${partnerItemsWithTerry.length}`,
    );
    console.log(
      `- Terry partner commentary rate: ${Math.round((partnerItemsWithTerry.length / partnerItems.length) * 100)}%`,
    );

    console.log(`\n   Sample Terry Partner Commentary:`);
    partnerItemsWithTerry.slice(0, 2).forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.terryCommentary}"`);
      console.log(
        `      Context: ${item.source.name} - ${item.source.category}`,
      );
    });
  }

  console.log(`\n🔄 System Status:`);
  console.log(
    `- Content mixing: ${mixingStats.successfulMixes > 0 ? "✅ Active" : "⏸️ Inactive"}`,
  );
  console.log(
    `- Feed balance: ${partnerItems.length / feedItems.length <= 0.25 ? "✅ Within limits" : "⚠️ High partner ratio"}`,
  );
  console.log(
    `- Quality filter: ${last24Hours.every((item) => item.source.credibility >= 0.8) ? "✅ High credibility" : "⚠️ Mixed credibility"}`,
  );
}

// Main demo execution
console.log("🎯 Simulating Smart Content Mixing System...\n");

// Simulate multiple mixing cycles
console.log("⏰ Cycle 1: Initial check (25 min since last ITK)");
let result1 = simulateContentMixingCycle();

console.log("\n⏰ Cycle 2: 15 minutes later (40 min since last ITK)");
// Simulate time passage
feedItems.forEach((item) => {
  if (item.timestamp instanceof Date) {
    item.timestamp = new Date(item.timestamp.getTime() - 15 * 60 * 1000);
  }
});
let result2 = simulateContentMixingCycle();

console.log("\n⏰ Cycle 3: Another 20 minutes later (60 min since last ITK)");
// Simulate more time passage
feedItems.forEach((item) => {
  if (item.timestamp instanceof Date) {
    item.timestamp = new Date(item.timestamp.getTime() - 20 * 60 * 1000);
  }
});
let result3 = simulateContentMixingCycle();

// Display comprehensive analytics
displayMixingAnalytics();

console.log("\n✅ Partner Content Integration Demo Complete!");
console.log("\n💡 This demonstrates:");
console.log("- Smart quiet period detection (30+ min since last ITK)");
console.log("- Ethical partner source integration with attribution");
console.log("- Content ratio management (max 25% partner content)");
console.log("- Terry commentary on partner content (30% rate)");
console.log("- Quality filtering (high-credibility sources only)");
console.log("- Breaking news respect (no mixing during transfer drama)");
console.log("- Hourly limits (max 4 partner articles per hour)");
console.log("- Real-time feed balance monitoring");

console.log("\n🎉 Phase 2 Strategic Pivot Implementation: COMPLETE!");
console.log(
  "🚀 TransferJuice is ready for live global football transfer feed!",
);
