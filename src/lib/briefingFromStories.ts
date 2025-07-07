import OpenAI from "openai";
import { getStoriesForBriefing, getMegaStoriesForRecap } from "./storyProcessor";
import { generateGolbyNarrative, generateSectionHeader, generateRoundupParagraph } from "./golbyNarrativeGenerator";
import { AggregatedStory } from "./storyAggregator";
import { CohesiveBriefing } from "./types";

// Convert stored story to AggregatedStory format for narrative generation
function storyToAggregatedStory(story: any): AggregatedStory {
  const metadata = story.metadata as any;
  
  // Build facts array from metadata
  const facts = [{
    fee: metadata.fee,
    wages: metadata.wages,
    payCut: metadata.payCut,
    contractLength: metadata.contractLength,
    contractUntil: metadata.contractUntil,
    clubs: [metadata.fromClub, metadata.toClub].filter(Boolean),
    isConfirmed: metadata.status === 'completed',
    isHereWeGo: metadata.isHereWeGo || false,
    isNearConfirmed: metadata.status === 'negotiating',
    isInterest: metadata.status === 'interest',
    isRejected: metadata.status === 'rejected',
    age: undefined, // Not tracked in new system yet
    position: undefined, // Not tracked in new system yet
    currentGoals: undefined, // Not tracked in new system yet
    source: {
      name: metadata.sources[0] || 'Unknown',
      url: story.tweet.url
    }
  }];
  
  return {
    player: metadata.player,
    items: [story.tweet], // Simplified - just reference the tweet
    facts,
    primaryClubs: [metadata.toClub, metadata.fromClub].filter(Boolean),
    storyType: mapStatusToStoryType(metadata),
    importance: metadata.importance
  };
}

// Map our status to the expected story type
function mapStatusToStoryType(metadata: any): AggregatedStory['storyType'] {
  if (metadata.type === 'contract_extension') return 'contract';
  if (metadata.status === 'completed') return 'confirmed';
  if (metadata.status === 'negotiating') return 'negotiating';
  if (metadata.status === 'rejected') return 'rejected';
  return 'interest';
}

// Fetch player/club images (reusing from cohesiveBriefingGenerator)
async function getPlayerImage(playerName: string, usedImages: Set<string>): Promise<string | null> {
  try {
    const wikiName = playerName.replace(' ', '_');
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      const imageUrl = data.thumbnail?.source || null;
      
      if (imageUrl && !usedImages.has(imageUrl)) {
        usedImages.add(imageUrl);
        return imageUrl;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch image for ${playerName}:`, error);
  }
  return null;
}

// Generate briefing from stored stories
export async function generateBriefingFromStories(
  hours: number = 3,
  openai: OpenAI | null
): Promise<CohesiveBriefing> {
  // Get recent stories prioritized by importance
  let stories = await getStoriesForBriefing(hours);
  let usingMegaStories = false;
  
  if (stories.length === 0) {
    // If no new stories, get mega stories for recap
    const megaStories = await getMegaStoriesForRecap(24, 7);
    if (megaStories.length > 0) {
      console.log("No new stories - creating recap of mega stories");
      // Convert mega stories to match the expected format with empty briefings array
      stories = megaStories.slice(0, 5).map(story => ({
        ...story,
        briefings: []
      }));
      usingMegaStories = true;
    }
  }
  
  // Convert to aggregated story format
  const aggregatedStories = stories.map(storyToAggregatedStory);
  
  // Extract key players and clubs
  const keyPlayers = [...new Set(aggregatedStories.map(s => s.player))].slice(0, 8);
  const keyClubs = [...new Set(aggregatedStories.flatMap(s => s.primaryClubs))].slice(0, 5);
  
  // Track used images
  const usedImages = new Set<string>();
  
  // Get main image for lead story
  let mainImage: string | undefined;
  let mainImagePlayer: string | undefined;
  
  if (aggregatedStories.length > 0) {
    const leadPlayer = aggregatedStories[0].player;
    const playerImage = await getPlayerImage(leadPlayer, usedImages);
    if (playerImage) {
      mainImage = playerImage;
      mainImagePlayer = leadPlayer;
    }
  }
  
  // Get one tier 2 image
  const playerImages: Record<string, string> = {};
  if (aggregatedStories.length > 1) {
    const tier2Player = aggregatedStories[1].player;
    if (tier2Player !== mainImagePlayer) {
      const image = await getPlayerImage(tier2Player, usedImages);
      if (image) {
        playerImages[tier2Player] = image;
      }
    }
  }
  
  // Generate content
  let content = "";
  
  // Format helpers
  const formatContent = (text: string): string => {
    // Format player names
    keyPlayers.forEach(player => {
      if (player) {
        const regex = new RegExp(`\\b${player}\\b`, 'g');
        text = text.replace(regex, `<strong class="text-orange-500">${player}</strong>`);
      }
    });
    
    // Format club names
    keyClubs.forEach(club => {
      const regex = new RegExp(`\\b${club}\\b`, 'g');
      text = text.replace(regex, `<strong class="text-orange-500">${club}</strong>`);
    });
    
    // Format fees
    text = text.replace(/([€£$]\d+(?:\.\d+)?m(?:illion)?)/gi, '<strong class="text-green-500">$1</strong>');
    
    return text;
  };
  
  // Add hero image
  if (mainImage && mainImagePlayer) {
    content += `<figure class="briefing-image hero-image">
<img src="${mainImage}" alt="${mainImagePlayer}" />
<figcaption>${mainImagePlayer}</figcaption>
</figure>\n\n`;
  }
  
  // Separate by tiers
  const tier1Stories = aggregatedStories.filter(s => s.importance >= 7);
  const tier2Stories = aggregatedStories.filter(s => s.importance >= 4 && s.importance < 7);
  const tier3Stories = aggregatedStories.filter(s => s.importance < 4);
  
  // Process Tier 1 stories
  if (tier1Stories.length > 0) {
    for (let i = 0; i < Math.min(tier1Stories.length, 3); i++) {
      const story = tier1Stories[i];
      
      if (i === 0) {
        // Lead story - no headline
        const narrative = generateGolbyNarrative(story);
        content += `<p>${formatContent(narrative)}</p>\n\n`;
      } else {
        // Generate specific headline
        let headline = `${story.player} Update`;
        const meta = stories.find(s => (s.metadata as any).player === story.player)?.metadata as any;
        
        if (meta) {
          if (meta.status === 'completed' && meta.toClub) {
            headline = `${story.player} to ${meta.toClub} Done`;
          } else if (meta.status === 'negotiating' && meta.toClub) {
            headline = `${meta.toClub} Close In on ${story.player}`;
          } else if (meta.type === 'contract_extension') {
            headline = `${story.player} ${meta.payCut ? 'Takes Pay Cut' : 'Signs New Deal'}`;
          }
        }
        
        content += `<h3 class="text-xl font-bold mt-8 mb-4">${headline}</h3>\n`;
        const narrative = generateGolbyNarrative(story);
        content += `<p>${formatContent(narrative)}</p>\n\n`;
      }
    }
  }
  
  // Process Tier 2 stories with section header
  if (tier2Stories.length > 0) {
    const sectionHeader = generateRelevantSectionHeader(tier2Stories);
    content += `<h3 class="text-xl font-bold mt-8 mb-4">${sectionHeader}</h3>\n`;
    
    // Add tier 2 image if available
    const tier2Image = Object.values(playerImages)[0];
    const tier2Player = Object.keys(playerImages)[0];
    if (tier2Image && tier2Player) {
      content += `<figure class="briefing-image mb-4" style="width: 300px; float: right; margin-left: 1rem;">
        <img src="${tier2Image}" alt="${tier2Player}" class="w-full h-auto rounded-lg shadow-lg" />
        <figcaption class="text-sm text-muted-foreground mt-2">${tier2Player}</figcaption>
      </figure>\n`;
    }
    
    // Add narratives
    for (const story of tier2Stories.slice(0, 3)) {
      const narrative = generateGolbyNarrative(story);
      content += `<p>${formatContent(narrative)}</p>\n\n`;
    }
    
    content += '<div style="clear: both;"></div>\n';
  }
  
  // Process Tier 3 as roundup
  if (tier3Stories.length > 0) {
    content += `<h3 class="text-xl font-bold mt-8 mb-4">Quick Round-Up</h3>\n`;
    const roundup = generateRoundupParagraph(tier3Stories);
    content += `<p>${formatContent(roundup)}</p>\n\n`;
  }
  
  // Generate title
  const title = generateBriefingTitle(aggregatedStories, stories.length === 0);
  
  return {
    title,
    content,
    metadata: {
      keyPlayers: keyPlayers.filter(Boolean).slice(0, 5),
      keyClubs,
      mainImage,
      playerImages
    }
  };
}

// Generate relevant section headers
function generateRelevantSectionHeader(stories: AggregatedStory[]): string {
  const confirmedCount = stories.filter(s => s.storyType === 'confirmed').length;
  const negotiatingCount = stories.filter(s => s.storyType === 'negotiating').length;
  
  if (confirmedCount === stories.length) {
    return confirmedCount === 1 ? `${stories[0].player} Deal Complete` : "More Confirmed Moves";
  }
  
  if (negotiatingCount === stories.length) {
    return "Deals in Progress";
  }
  
  return "Today's Other Business";
}

// Generate briefing title
function generateBriefingTitle(stories: AggregatedStory[], isRecap: boolean): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  
  if (isRecap) {
    return `Transfer Mega Deal Recap - ${date}`;
  }
  
  const confirmedStories = stories.filter(s => s.storyType === 'confirmed');
  if (confirmedStories.length > 0) {
    return `${confirmedStories[0].player} Done Deal - Transfer Briefing ${date}`;
  }
  
  if (stories.length > 0 && stories[0].importance >= 7) {
    return `${stories[0].player} Latest - Transfer Briefing ${date}`;
  }
  
  return `Transfer Briefing ${date}: The Usual Chaos`;
}