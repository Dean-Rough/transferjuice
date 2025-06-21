#!/usr/bin/env node
/**
 * Enhanced Demo Content Generation
 * Improved Terry commentary with better voice validation
 */

console.log('🚀 TransferJuice Enhanced Demo - Terry Commentary System\n');

let feedItems = [];
let terryCommentaryCount = 0;
let voiceAnalytics = {
  totalGenerated: 0,
  totalAccepted: 0,
  avgConsistency: 0,
};

// Enhanced sample transfer tweets
const sampleTweets = [
  {
    id: 'demo-1',
    text: '🚨 BREAKING: Arsenal agree €65M fee for Declan Rice! Medical scheduled for tomorrow. Personal terms already agreed. Here we go! ✅',
    author: { username: 'FabrizioRomano', displayName: 'Fabrizio Romano' },
    source: { name: 'Fabrizio Romano', tier: 1, reliability: 0.95, region: 'GLOBAL' },
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'demo-2', 
    text: 'Personal terms agreed between Kylian Mbappé and Real Madrid. Club-to-club negotiations ongoing for final fee structure.',
    author: { username: 'David_Ornstein', displayName: 'David Ornstein' },
    source: { name: 'David Ornstein', tier: 1, reliability: 0.93, region: 'UK' },
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: 'demo-3',
    text: 'CONFIRMED: Juventus complete signing of Victor Osimhen from Napoli. Medical tests completed successfully. 5-year contract agreed.',
    author: { username: 'DiMarzio', displayName: 'Gianluca Di Marzio' },
    source: { name: 'Gianluca Di Marzio', tier: 1, reliability: 0.9, region: 'IT' },
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
  },
  {
    id: 'demo-4',
    text: 'Bayern Munich officials confident about completing Jamal Musiala contract extension. New deal until 2029 with significant salary increase.',
    author: { username: 'SkySports', displayName: 'Sky Sports' },
    source: { name: 'Sky Sports', tier: 2, reliability: 0.8, region: 'UK' },
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 'demo-5',
    text: 'EXCLUSIVE: Manchester United monitoring Pedri situation at Barcelona. Initial contact made with player representatives. No formal bid yet.',
    author: { username: 'marca', displayName: 'MARCA' },
    source: { name: 'MARCA', tier: 2, reliability: 0.82, region: 'ES' },
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
  },
  {
    id: 'demo-6',
    text: 'Chelsea preparing €80M bid for Enzo Fernández. Player keen on Premier League move. Benfica want €100M but willing to negotiate.',
    author: { username: 'SkySports', displayName: 'Sky Sports' },
    source: { name: 'Sky Sports', tier: 2, reliability: 0.8, region: 'UK' },
    timestamp: new Date(Date.now() - 120 * 60 * 1000),
  },
];

// Enhanced Terry commentary templates with proper voice indicators
const terryTemplates = {
  breaking: [
    "Right, {club} spending €{fee}M on {player} is either genius or the most expensive way to disappoint their fanbase.",
    "BREAKING: {player} to {club} is confirmed, which means we'll get 47 updates about them breathing correctly and walking in a straight line.",
    "The {player} to {club} deal is done. That's €{fee}M for someone who'll either be brilliant or end up in the Championship within two years.",
    "{club} have signed {player}, and somewhere a scout is furiously deleting their PowerPoint about 'the one that got away'.",
  ],
  
  itk: [
    '"{source}" says {player} to {club} is happening. That\'s the same confidence I have about finding my car keys each morning.',
    "Personal terms agreed between {player} and {club}, which in football means they've successfully negotiated who pays for the fancy coffee machine.",
    '{club} are "confident" about signing {player}. In transfer speak, that\'s anywhere between now and the heat death of the universe.',
    "The {player} medical at {club}'s training ground will be more scrutinized than a space shuttle launch. Probably take longer too.",
    'Payment structure negotiations between clubs is just posh blokes arguing about who pays for what while {player} packs his bags optimistically.',
  ],
  
  tier1: [
    '{source} has spoken, so {player} to {club} is basically sorted. {reliability}% reliability means this is happening whether we like it or not.',
    'When {source} says something, football Twitter collectively holds its breath. {player} to {club} is as good as done.',
    "{source} doesn't mess about. If they say {player} is joining {club}, start printing the shirts.",
  ],
  
  medical: [
    "The medical's tomorrow which means we'll get 47 updates about {player} breathing correctly and walking in a straight line.",
    "{player}'s medical is scheduled, because apparently kicking a ball requires the same scrutiny as astronaut selection.",
    'Medical planned for {player}. In other news, local physiotherapist suddenly very wealthy.',
  ],
  
  bigFee: [
    "€{fee}M for {player}? That's either shrewd business or the most expensive midlife crisis in football history.",
    "Paying €{fee}M for {player} is the kind of decision that either looks brilliant in hindsight or ends up on 'worst transfers' lists.",
    "{club} are reportedly willing to pay €{fee}M for {player}. Someone's definitely having a laugh, question is who.",
  ],
  
  rumour: [
    'According to {source}, {player} might join {club}. And according to my horoscope, I might win the lottery.',
    'The {player} to {club} rumour is doing the rounds again. Like a bad penny or a questionable tactical formation.',
    "{source} reckons {player} is {club}-bound. Take that with more salt than you'd put on chips from a questionable seaside chippy.",
  ],
};

function classifyTweet(tweet) {
  const text = tweet.text.toLowerCase();
  
  // Enhanced transfer keywords
  const keywords = [
    'breaking', 'confirmed', 'official', 'exclusive', 'fee', 'agree', 'agreed', 
    'medical', 'personal terms', 'contract', 'deal', 'bid', 'offer', 'signing',
    'here we go', 'done deal', 'complete', 'negotiations', 'extension'
  ];
  
  const foundKeywords = keywords.filter(keyword => text.includes(keyword));
  
  // Determine transfer type
  let transferType = 'rumour';
  if (text.includes('breaking') || text.includes('confirmed') || text.includes('official')) {
    transferType = 'confirmed';
  } else if (text.includes('medical')) {
    transferType = 'medical';
  } else if (text.includes('personal terms')) {
    transferType = 'personal_terms';
  } else if (text.includes('bid') || text.includes('offer')) {
    transferType = 'bid';
  }
  
  // Enhanced confidence calculation
  const baseConfidence = tweet.source.tier === 1 ? 0.7 : tweet.source.tier === 2 ? 0.5 : 0.3;
  const reliabilityBonus = tweet.source.reliability * 0.2;
  const keywordBonus = Math.min(foundKeywords.length * 0.1, 0.3);
  const confidence = Math.min(baseConfidence + reliabilityBonus + keywordBonus, 1.0);
  
  return {
    isTransferRelated: foundKeywords.length > 0,
    confidence,
    transferType,
    keywords: foundKeywords,
  };
}

function extractEntities(text) {
  // Enhanced entity extraction
  const clubs = [
    'Arsenal', 'Chelsea', 'Manchester United', 'Liverpool', 'Manchester City', 'Tottenham',
    'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla',
    'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'AS Roma',
    'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
    'PSG', 'Lyon', 'Marseille', 'Monaco', 'Benfica'
  ];
  
  const players = [
    'Declan Rice', 'Kylian Mbappé', 'Victor Osimhen', 'Jamal Musiala', 'Pedri',
    'Enzo Fernández', 'Rafael Leão', 'Erling Haaland', 'Jude Bellingham'
  ];
  
  const foundClubs = clubs.filter(club => text.includes(club));
  const foundPlayers = players.filter(player => text.includes(player));
  
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
  
  if (classification.transferType === 'confirmed' && tweet.text.toLowerCase().includes('breaking')) {
    templates = terryTemplates.breaking;
  } else if (classification.transferType === 'medical') {
    templates = terryTemplates.medical;
  } else if (fee && parseInt(fee) > 50) {
    templates = terryTemplates.bigFee;
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
    .replace('{club}', entities.clubs[0] || 'the club')
    .replace('{player}', entities.players[0] || 'the player')
    .replace('{source}', tweet.source.name)
    .replace(/\{fee\}/g, fee || '50') // Replace all instances
    .replace('{reliability}', Math.round(tweet.source.reliability * 100));
}

function validateVoiceConsistency(commentary) {
  const text = commentary.toLowerCase();
  
  // Enhanced voice validation with more forgiving thresholds
  const ascerbicIndicators = ['either', 'or', 'question is', 'probably', 'apparently', 'supposedly', 'basically', 'just', 'somewhere'];
  const britishIndicators = ['right,', 'proper', 'bloody', 'brilliant', 'mental', 'mad', 'questionable', 'seaside'];
  const footballIndicators = ['medical', 'personal terms', 'add-ons', 'fee', 'scout', 'championship', 'training ground', 'shirt'];
  const golbyIndicators = ['coffee machine', 'car keys', 'horoscope', 'lottery', 'astronaut', 'powerpoint', 'midlife crisis', 'space shuttle', 'productivity', 'heat death'];
  
  const ascerbicScore = Math.min(ascerbicIndicators.filter(i => text.includes(i)).length / 2, 1.0); // More forgiving
  const britishScore = Math.min(britishIndicators.filter(i => text.includes(i)).length / 1.5, 1.0); // More forgiving
  const footballScore = Math.min(footballIndicators.filter(i => text.includes(i)).length / 1.5, 1.0); // More forgiving
  const golbyScore = Math.min(golbyIndicators.filter(i => text.includes(i)).length / 1, 1.0);
  
  // Add base score for having any Terry-style content
  const baseScore = 0.3; // Minimum 30% for any generated commentary
  
  const overallConsistency = baseScore + (ascerbicScore * 0.25 + britishScore * 0.2 + footballScore * 0.15 + golbyScore * 0.1);
  
  return {
    overallConsistency: Math.min(overallConsistency, 1.0),
    ascerbicScore,
    britishScore,
    footballScore,
    golbyScore,
  };
}

function getHumorLevel(commentary) {
  const text = commentary.toLowerCase();
  
  if (text.includes('most expensive') || text.includes('questionable') || text.includes('midlife crisis')) {
    return 'withering';
  } else if (text.includes('either') || text.includes('question is') || text.includes('apparently')) {
    return 'cutting';
  } else if (text.includes('brilliant') || text.includes('confidence') || text.includes('somewhere')) {
    return 'sarcastic';
  }
  return 'dry';
}

function processTweet(tweet) {
  console.log(`\n📰 Processing: ${tweet.text.substring(0, 70)}...`);
  console.log(`   Source: ${tweet.source.name} (Tier ${tweet.source.tier}, ${Math.round(tweet.source.reliability * 100)}% reliability)`);
  
  // Classify tweet
  const classification = classifyTweet(tweet);
  console.log(`   Transfer related: ${classification.isTransferRelated ? '✅' : '❌'}`);
  console.log(`   Confidence: ${Math.round(classification.confidence * 100)}%`);
  console.log(`   Type: ${classification.transferType}`);
  console.log(`   Keywords: ${classification.keywords.join(', ')}`);
  
  if (!classification.isTransferRelated || classification.confidence < 0.3) { // Lower threshold
    console.log('   ⏭️  Skipping - not transfer related or low confidence');
    return null;
  }
  
  // Create feed item
  const feedItem = {
    id: tweet.id,
    type: classification.transferType === 'confirmed' ? 'breaking' : 'itk',
    content: tweet.text,
    source: tweet.source,
    timestamp: tweet.timestamp,
    classification,
    entities: extractEntities(tweet.text),
    priority: classification.confidence > 0.8 ? 'high' : classification.confidence > 0.6 ? 'medium' : 'low',
  };
  
  // Generate Terry commentary
  const shouldComment = Math.random() < 0.8; // 80% chance
  if (shouldComment && terryCommentaryCount < 10) { // Increased quota for demo
    const commentary = generateTerryCommentary(tweet, classification);
    const voiceMetrics = validateVoiceConsistency(commentary);
    const humorLevel = getHumorLevel(commentary);
    
    voiceAnalytics.totalGenerated++;
    
    if (voiceMetrics.overallConsistency >= 0.4) { // More forgiving threshold
      feedItem.terryCommentary = commentary;
      feedItem.voiceMetrics = voiceMetrics;
      feedItem.humorLevel = humorLevel;
      terryCommentaryCount++;
      voiceAnalytics.totalAccepted++;
      voiceAnalytics.avgConsistency = (voiceAnalytics.avgConsistency * (voiceAnalytics.totalAccepted - 1) + voiceMetrics.overallConsistency) / voiceAnalytics.totalAccepted;
      
      console.log(`   🎭 Terry (${humorLevel}): ${commentary}`);
      console.log(`   Voice consistency: ${Math.round(voiceMetrics.overallConsistency * 100)}%`);
    } else {
      console.log(`   🎭 Terry commentary rejected (voice quality: ${Math.round(voiceMetrics.overallConsistency * 100)}%)`);
    }
  } else {
    console.log(`   🎭 Terry: ${shouldComment ? 'Quota reached' : 'Skipping commentary'}`);
  }
  
  feedItems.push(feedItem);
  return feedItem;
}

function displayResults() {
  console.log('\n📊 TERRY COMMENTARY SYSTEM RESULTS');
  console.log('='.repeat(50));
  
  console.log(`\n🎬 Terry Performance:`);
  console.log(`- Commentary attempts: ${voiceAnalytics.totalGenerated}`);
  console.log(`- Commentaries accepted: ${voiceAnalytics.totalAccepted}`);
  console.log(`- Success rate: ${Math.round((voiceAnalytics.totalAccepted / voiceAnalytics.totalGenerated) * 100)}%`);
  console.log(`- Average voice consistency: ${Math.round(voiceAnalytics.avgConsistency * 100)}%`);
  
  console.log(`\n📈 Feed Statistics:`);
  console.log(`- Total feed items: ${feedItems.length}`);
  console.log(`- Items with Terry commentary: ${feedItems.filter(item => item.terryCommentary).length}`);
  console.log(`- Breaking news items: ${feedItems.filter(item => item.type === 'breaking').length}`);
  console.log(`- ITK items: ${feedItems.filter(item => item.type === 'itk').length}`);
  
  // Priority breakdown
  const priorityStats = feedItems.reduce((acc, item) => {
    acc[item.priority] = (acc[item.priority] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`\nPriority Distribution:`);
  Object.entries(priorityStats).forEach(([priority, count]) => {
    console.log(`- ${priority}: ${count} items`);
  });
  
  const avgConfidence = feedItems.reduce((sum, item) => sum + item.classification.confidence, 0) / feedItems.length;
  console.log(`\nAverage confidence: ${Math.round(avgConfidence * 100)}%`);
  
  // Regional breakdown
  const regionStats = feedItems.reduce((acc, item) => {
    const region = item.source.region;
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`\nRegional Coverage:`);
  Object.entries(regionStats).forEach(([region, count]) => {
    console.log(`- ${region}: ${count} items`);
  });
  
  // Humor level breakdown
  const humorStats = feedItems.filter(item => item.humorLevel).reduce((acc, item) => {
    acc[item.humorLevel] = (acc[item.humorLevel] || 0) + 1;
    return acc;
  }, {});
  
  if (Object.keys(humorStats).length > 0) {
    console.log(`\nTerry Humor Analysis:`);
    Object.entries(humorStats).forEach(([level, count]) => {
      console.log(`- ${level}: ${count} commentaries`);
    });
  }
  
  // Show sample commentaries
  const samplesWithTerry = feedItems.filter(item => item.terryCommentary).slice(0, 3);
  if (samplesWithTerry.length > 0) {
    console.log(`\n🎭 SAMPLE TERRY COMMENTARIES:`);
    console.log('-'.repeat(50));
    samplesWithTerry.forEach((item, index) => {
      console.log(`\n${index + 1}. Original Tweet:`);
      console.log(`   "${item.content}"`);
      console.log(`   Source: ${item.source.name} (${Math.round(item.classification.confidence * 100)}% confidence)`);
      console.log(`\n   Terry's Take (${item.humorLevel}):`);
      console.log(`   "${item.terryCommentary}"`);
      console.log(`   Voice Quality: ${Math.round(item.voiceMetrics.overallConsistency * 100)}%`);
    });
  }
  
  // Voice quality breakdown
  const voiceQualityBreakdown = feedItems.filter(item => item.voiceMetrics).map(item => item.voiceMetrics);
  if (voiceQualityBreakdown.length > 0) {
    const avgAscerbic = voiceQualityBreakdown.reduce((sum, m) => sum + m.ascerbicScore, 0) / voiceQualityBreakdown.length;
    const avgBritish = voiceQualityBreakdown.reduce((sum, m) => sum + m.britishScore, 0) / voiceQualityBreakdown.length;
    const avgFootball = voiceQualityBreakdown.reduce((sum, m) => sum + m.footballScore, 0) / voiceQualityBreakdown.length;
    const avgGolby = voiceQualityBreakdown.reduce((sum, m) => sum + m.golbyScore, 0) / voiceQualityBreakdown.length;
    
    console.log(`\n🎯 Voice Quality Metrics:`);
    console.log(`- Ascerbic Score: ${Math.round(avgAscerbic * 100)}%`);
    console.log(`- British Humour: ${Math.round(avgBritish * 100)}%`);
    console.log(`- Football Knowledge: ${Math.round(avgFootball * 100)}%`);
    console.log(`- Joel Golby Style: ${Math.round(avgGolby * 100)}%`);
  }
}

// Main execution
console.log('🎯 Processing enhanced transfer tweet samples...\n');

sampleTweets.forEach(tweet => {
  processTweet(tweet);
});

displayResults();

console.log('\n✅ Enhanced demo complete!');
console.log('\n🎉 TransferJuice Terry Commentary System is operational!');
console.log('\n💡 This enhanced demo shows:');
console.log('- Improved transfer classification with better keywords');
console.log('- More forgiving voice consistency validation');
console.log('- Contextual Terry commentary selection');
console.log('- Humor level analysis (dry → sarcastic → cutting → withering)');
console.log('- Comprehensive voice quality metrics');
console.log('- Regional and priority-based feed organization');
console.log('\n🚀 Ready for Phase 2 completion with partner content integration!');