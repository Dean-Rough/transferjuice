import { aggregateStories, extractFacts } from '../src/lib/storyAggregator';

// Test RSS data
async function analyzeScoring() {
  try {
    const feedUrl = "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
    const response = await fetch(feedUrl);
    const feed = await response.json();
    
    console.log("📊 Story Scoring Analysis\n");
    
    // Get recent items
    const recentItems = feed.items.slice(0, 25);
    
    // Aggregate stories
    const stories = aggregateStories(recentItems);
    
    // Show top 5 stories with scoring breakdown
    console.log("Top 5 Stories by Importance:\n");
    stories.slice(0, 5).forEach((story, index) => {
      console.log(`${index + 1}. ${story.player}`);
      console.log(`   Importance Score: ${story.importance}/10`);
      console.log(`   Story Type: ${story.storyType}`);
      console.log(`   Sources: ${story.items.length}`);
      console.log(`   Primary Clubs: ${story.primaryClubs.join(' → ')}`);
      
      // Check fees
      const fees = story.facts.map(f => f.fee).filter(Boolean);
      if (fees.length > 0) {
        console.log(`   Fees Found: ${fees.join(', ')}`);
      }
      
      // Check for "Here we go"
      const hasHereWeGo = story.facts.some(f => f.isHereWeGo);
      if (hasHereWeGo) {
        console.log(`   ✅ "Here we go" confirmed`);
      }
      
      console.log('');
    });
    
    // Look specifically for Gyökeres
    const gyokeres = stories.find(s => s.player.includes('Gyökeres') || s.player.includes('Gyokeres'));
    if (gyokeres) {
      console.log("🔍 Viktor Gyökeres Story Analysis:");
      console.log(`Position: #${stories.indexOf(gyokeres) + 1}`);
      console.log(`Importance Score: ${gyokeres.importance}/10`);
      console.log(`Story Type: ${gyokeres.storyType}`);
      
      // Show raw tweet content to check for fees
      console.log("\nRaw tweet content:");
      gyokeres.items.forEach(item => {
        console.log(`\nFrom ${item.authors[0]?.name}:`);
        console.log(item.content_text.substring(0, 200));
        
        // Extract facts to see what was found
        const facts = extractFacts(item);
        if (facts.fee) {
          console.log(`Fee extracted: ${facts.fee}`);
        } else {
          console.log("No fee found in this tweet");
        }
      });
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

analyzeScoring();