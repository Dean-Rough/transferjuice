import OpenAI from "openai";
import { aggregateStories, AggregatedStory } from "./storyAggregator";
import { generateGolbyNarrative, generateSectionHeader, generateRoundupParagraph } from "./golbyNarrativeGenerator";
import { RSSItem, CohesiveBriefing } from "./types";
import { factCheckStory, validateRSSItem, cleanStoryContent, extractFactualContent } from "./factChecker";

// Remove old interfaces, now using types from ./types

// Fetch player image from Wikipedia
async function getPlayerImage(playerName: string, usedImages: Set<string>, preferLandscape: boolean = false): Promise<string | null> {
  try {
    const wikiName = playerName.replace(' ', '_');
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      // For hero images, try to get a landscape-friendly image
      let imageUrl = null;
      if (preferLandscape && data.originalimage) {
        // Check aspect ratio if dimensions are available
        if (data.originalimage.width && data.originalimage.height) {
          const aspectRatio = data.originalimage.width / data.originalimage.height;
          // Only use if it's reasonably landscape (aspect ratio > 0.8)
          if (aspectRatio > 0.8) {
            imageUrl = data.originalimage.source;
          } else {
            console.log(`Skipping portrait image for ${playerName} (aspect ratio: ${aspectRatio})`);
            return null;
          }
        } else {
          // If no dimensions, use thumbnail which tends to be better cropped
          imageUrl = data.thumbnail?.source || null;
        }
      } else {
        // For inline images, use thumbnail
        imageUrl = data.thumbnail?.source || null;
      }
      
      // Don't use the same image twice
      if (imageUrl && usedImages.has(imageUrl)) {
        return null;
      }
      
      if (imageUrl) {
        usedImages.add(imageUrl);
        
        // For hero images, modify the URL to get a wider crop if it's a Wikipedia thumbnail
        if (preferLandscape && imageUrl.includes('/thumb/') && imageUrl.includes('px-')) {
          // Change thumbnail size to be wider for hero images
          imageUrl = imageUrl.replace(/\/\d+px-/, '/800px-');
        }
      }
      
      return imageUrl;
    }
  } catch (error) {
    console.error(`Failed to fetch image for ${playerName}:`, error);
  }
  return null;
}

// Fetch club badge from Wikipedia
async function getClubBadge(clubName: string): Promise<string | null> {
  const clubMappings: Record<string, string> = {
    'Arsenal': 'Arsenal_F.C.',
    'Chelsea': 'Chelsea_F.C.',
    'Liverpool': 'Liverpool_F.C.',
    'Manchester United': 'Manchester_United_F.C.',
    'Manchester City': 'Manchester_City_F.C.',
    'Tottenham': 'Tottenham_Hotspur_F.C.',
    'Barcelona': 'FC_Barcelona',
    'Real Madrid': 'Real_Madrid_CF',
    'Bayern': 'FC_Bayern_Munich',
    'PSG': 'Paris_Saint-Germain_F.C.',
    'Juventus': 'Juventus_F.C.',
    'Milan': 'A.C._Milan',
    'Inter': 'Inter_Milan',
    'Sporting': 'Sporting_CP',
    'Nottingham Forest': 'Nottingham_Forest_F.C.'
  };

  try {
    const wikiName = clubMappings[clubName] || clubName.replace(' ', '_') + '_F.C.';
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.thumbnail?.source || null;
    }
  } catch (error) {
    console.error(`Failed to fetch badge for ${clubName}:`, error);
  }
  return null;
}

export async function generateCohesiveBriefing(
  items: RSSItem[],
  openai: OpenAI | null
): Promise<CohesiveBriefing> {
  // Filter out invalid items
  const validItems = items.filter(item => validateRSSItem(item));
  
  // Clean content for each item
  validItems.forEach(item => {
    item.content_text = cleanStoryContent(item.content_text);
  });
  
  // Sort by date
  validItems.sort((a, b) => new Date(b.date_published).getTime() - new Date(a.date_published).getTime());
  
  // Aggregate stories by player using the new system
  const aggregatedStories = aggregateStories(validItems);
  
  // Fact-check aggregated stories and filter out problematic ones
  const factCheckedStories = aggregatedStories.filter(story => {
    // Check the aggregated content from all items
    const storyContent = story.items.map(item => item.content_text).join(' ');
    const factCheck = factCheckStory(storyContent, story.facts[0]);
    
    if (!factCheck.isValid) {
      console.log(`⚠️ Fact check failed for ${story.player}: ${factCheck.issues.join(', ')}`);
      // Skip stories with major fact-checking issues
      if (factCheck.issues.some(issue => 
        issue.includes('Manager mismatch') || 
        issue.includes('Invalid content')
      )) {
        return false;
      }
    }
    
    return true;
  });
  
  // If no valid stories after fact-checking, return a minimal briefing
  if (factCheckedStories.length === 0) {
    console.log("❌ No valid stories after fact-checking");
    return {
      title: "Transfer News Update - Limited Coverage",
      content: "<p>We're experiencing some technical difficulties with our news sources. Please check back later for the latest transfer updates.</p>",
      metadata: {
        keyPlayers: [],
        keyClubs: [],
        mainImage: undefined,
        playerImages: {}
      }
    };
  }
  
  // Track used images to avoid duplicates
  const usedImages = new Set<string>();
  
  // Extract key players and clubs from fact-checked stories
  const keyPlayers = factCheckedStories.slice(0, 8).map(s => s.player);
  const keyClubs = [...new Set(factCheckedStories.flatMap(s => s.primaryClubs))].slice(0, 5);
  
  // Determine the actual lead player based on story importance
  const leadStory = factCheckedStories[0]; // Highest importance story
  const leadPlayer = leadStory?.player;
  
  // Get main image for the ACTUAL lead player - prefer landscape for hero images
  let mainImage: string | undefined;
  let mainImagePlayer: string | undefined;
  
  if (leadPlayer) {
    const playerImage = await getPlayerImage(leadPlayer, usedImages, true);
    if (playerImage) {
      mainImage = playerImage;
      mainImagePlayer = leadPlayer;
    }
  }
  
  // Try other high-importance players if lead didn't have a good landscape image
  if (!mainImage && factCheckedStories.length > 1) {
    // Only try tier 1 stories (importance >= 7)
    const tier1Stories = factCheckedStories.filter(s => s.importance >= 7);
    for (let i = 0; i < Math.min(tier1Stories.length, 3); i++) {
      if (tier1Stories[i].player === leadPlayer) continue; // Skip already tried
      const playerImage = await getPlayerImage(tier1Stories[i].player, usedImages, true);
      if (playerImage) {
        mainImage = playerImage;
        mainImagePlayer = tier1Stories[i].player;
        break;
      }
    }
  }
  
  // Fall back to club badge if no good player images
  if (!mainImage && keyClubs[0]) {
    const clubBadge = await getClubBadge(keyClubs[0]);
    if (clubBadge) mainImage = clubBadge;
  }
  
  // Get ONE tier 2 image - best story that's not the lead
  const playerImages: Record<string, string> = {};
  let tier2Image: string | undefined;
  let tier2Player: string | undefined;
  
  // Find the best tier 2 story (high importance but not the lead)
  const tier2Stories = factCheckedStories.filter(s => s.importance >= 4 && s.player !== mainImagePlayer);
  if (tier2Stories.length > 0) {
    const bestTier2 = tier2Stories[0]; // Already sorted by importance
    const image = await getPlayerImage(bestTier2.player, usedImages, false);
    if (image) {
      tier2Image = image;
      tier2Player = bestTier2.player;
      playerImages[bestTier2.player] = image;
    }
  }
  
  // Generate content using new aggregation approach
  return generateAggregatedBriefing(factCheckedStories, keyPlayers, keyClubs, mainImage, playerImages, mainImagePlayer);
}

// Old functions removed - now using aggregation system

// New aggregated briefing generator using Golby-style narratives
async function generateAggregatedBriefing(
  stories: AggregatedStory[],
  keyPlayers: string[],
  keyClubs: string[],
  mainImage?: string,
  playerImages?: Record<string, string>,
  mainImagePlayer?: string
): Promise<CohesiveBriefing> {
  let content = "";
  
  // Format player and club names with highlighting
  const formatContent = (text: string): string => {
    // Format player names
    keyPlayers.forEach(player => {
      if (player) { // Check for undefined
        const regex = new RegExp(`\\b${player}\\b`, 'g');
        text = text.replace(regex, `<strong class="text-orange-500">${player}</strong>`);
      }
    });
    
    // Format club names
    keyClubs.forEach(club => {
      const regex = new RegExp(`\\b${club}\\b`, 'g');
      text = text.replace(regex, `<strong class="text-orange-500">${club}</strong>`);
    });
    
    // Format fees with green color
    text = text.replace(/([€£$]\d+(?:\.\d+)?m(?:illion)?)/gi, '<strong class="text-green-500">$1</strong>');
    
    return text;
  };
  
  // Add hero image if available
  if (mainImage && mainImagePlayer) {
    content += `<figure class="briefing-image hero-image">
<img src="${mainImage}" alt="${mainImagePlayer}" />
<figcaption>${mainImagePlayer}</figcaption>
</figure>\n\n`;
  } else if (mainImage) {
    // Fallback for club badges
    content += `<figure class="briefing-image hero-image">
<img src="${mainImage}" alt="${keyClubs[0]}" />
<figcaption>${keyClubs[0]}</figcaption>
</figure>\n\n`;
  }
  
  // Separate stories by importance
  const tier1Stories = stories.filter(s => s.importance >= 7); // High importance
  const tier2Stories = stories.filter(s => s.importance >= 4 && s.importance < 7); // Medium
  const tier3Stories = stories.filter(s => s.importance < 4); // Low
  
  // Process Tier 1 stories - full individual treatment
  if (tier1Stories.length > 0) {
    for (let i = 0; i < tier1Stories.length; i++) {
      const story = tier1Stories[i];
      
      if (i === 0) {
        // Lead story - no headline, just start
        const narrative = generateGolbyNarrative(story);
        content += `<p>${formatContent(narrative)}</p>\n\n`;
      } else {
        // Other tier 1 stories get specific headlines based on story type
        let storyHeader = `${story.player} Update`;
        
        if (story.storyType === 'confirmed' && story.primaryClubs.length > 0) {
          storyHeader = `${story.player} to ${story.primaryClubs[0]} Done`;
        } else if (story.storyType === 'negotiating' && story.primaryClubs.length > 0) {
          storyHeader = `${story.primaryClubs[0]} Close In on ${story.player}`;
        } else if (story.storyType === 'contract') {
          const hasPacut = story.facts.some(f => f.payCut);
          storyHeader = hasPacut ? `${story.player} Takes Pay Cut to Stay` : `${story.player} Signs New Deal`;
        } else if (story.storyType === 'rejected' && story.primaryClubs.length > 0) {
          storyHeader = `${story.player} Rejects ${story.primaryClubs[0]}`;
        } else if (story.storyType === 'interest' && story.primaryClubs.length > 0) {
          storyHeader = `${story.primaryClubs[0]} Eye ${story.player}`;
        }
        
        content += `<h3 class="text-xl font-bold mt-8 mb-4">${storyHeader}</h3>\n`;
        const narrative = generateGolbyNarrative(story);
        
        // No inline images for tier 1 stories anymore
        content += `<p>${formatContent(narrative)}</p>\n\n`;
      }
    }
  }
  
  // Process Tier 2 stories - grouped under relevant header
  if (tier2Stories.length > 0) {
    // Generate a header based on what's actually happening
    const sectionHeader = generateRelevantSectionHeader(tier2Stories);
    content += `<h3 class="text-xl font-bold mt-8 mb-4">${sectionHeader}</h3>\n`;
    
    // Add the single tier 2 image at the start of this section
    const tier2Image = Object.values(playerImages)[0];
    const tier2Player = Object.keys(playerImages)[0];
    if (tier2Image && tier2Player) {
      content += `<figure class="briefing-image mb-4" style="width: 300px; float: right; margin-left: 1rem;">
        <img src="${tier2Image}" alt="${tier2Player}" class="w-full h-auto rounded-lg shadow-lg" />
        <figcaption class="text-sm text-muted-foreground mt-2">${tier2Player}</figcaption>
      </figure>\n`;
    }
    
    // Each tier 2 story gets a paragraph (no inline images)
    for (const story of tier2Stories.slice(0, 3)) { // Limit to top 3
      const narrative = generateGolbyNarrative(story);
      content += `<p>${formatContent(narrative)}</p>\n\n`;
    }
    
    // Clear float after tier 2 section
    content += '<div style="clear: both;"></div>\n';
  }
  
  // Process Tier 3 stories - roundup paragraph with relevant header
  if (tier3Stories.length > 0) {
    // Generate header based on what these stories are about
    let tier3Header = "Quick Round-Up";
    
    const interestStories = tier3Stories.filter(s => s.storyType === 'interest');
    const rejectedStories = tier3Stories.filter(s => s.storyType === 'rejected');
    
    if (interestStories.length === tier3Stories.length) {
      tier3Header = "Clubs Monitoring Situations";
    } else if (rejectedStories.length > 0) {
      tier3Header = "Deals That Won't Happen";
    } else if (tier3Stories.every(s => s.storyType === 'contract')) {
      tier3Header = "Contract Situations";
    } else {
      // Mix of stories - mention the clubs involved
      const clubs = [...new Set(tier3Stories.flatMap(s => s.primaryClubs))];
      if (clubs.length <= 3) {
        tier3Header = `${clubs.slice(0, 2).join(' and ')} Busy`;
      }
    }
    
    content += `<h3 class="text-xl font-bold mt-8 mb-4">${tier3Header}</h3>\n`;
    const roundup = generateRoundupParagraph(tier3Stories);
    content += `<p>${formatContent(roundup)}</p>\n\n`;
  }
  
  return {
    title: generateBriefingTitle(stories),
    content,
    metadata: {
      keyPlayers: keyPlayers.filter(Boolean).slice(0, 5),
      keyClubs,
      mainImage,
      playerImages
    }
  };
}

// Generate title based on aggregated stories
function generateBriefingTitle(stories: AggregatedStory[]): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  
  const confirmedStories = stories.filter(s => s.storyType === 'confirmed');
  if (confirmedStories.length > 0) {
    return `${confirmedStories[0].player} Done Deal - Transfer Briefing ${date}`;
  }
  
  const bigStories = stories.filter(s => s.importance >= 7);
  if (bigStories.length > 0) {
    return `${bigStories[0].player} Latest - Transfer Briefing ${date}`;
  }
  
  return `Transfer Briefing ${date}: The Usual Chaos`;
}

// Generate relevant section headers based on actual content
function generateRelevantSectionHeader(stories: AggregatedStory[]): string {
  if (stories.length === 0) return "Other Business";
  
  // Check what types of stories we have
  const confirmedStories = stories.filter(s => s.storyType === 'confirmed');
  const negotiatingStories = stories.filter(s => s.storyType === 'negotiating');
  const contractStories = stories.filter(s => s.storyType === 'contract');
  
  // If all confirmed, mention the clubs/players
  if (confirmedStories.length === stories.length) {
    if (confirmedStories.length === 1) {
      const story = confirmedStories[0];
      return `${story.player} to ${story.primaryClubs[0]} Confirmed`;
    } else if (confirmedStories.length === 2) {
      return `${confirmedStories[0].player} and ${confirmedStories[1].player} Deals Done`;
    } else {
      // Multiple confirmations
      const clubs = [...new Set(confirmedStories.flatMap(s => s.primaryClubs[0]))];
      if (clubs.length === 1) {
        return `${clubs[0]} Complete Multiple Signings`;
      } else {
        return `More Confirmed Deals`;
      }
    }
  }
  
  // If all negotiations
  if (negotiatingStories.length === stories.length) {
    if (negotiatingStories.length === 1) {
      const story = negotiatingStories[0];
      return `${story.primaryClubs[0]} Push for ${story.player}`;
    } else {
      const clubs = [...new Set(negotiatingStories.map(s => s.primaryClubs[0]))];
      if (clubs.length === 1) {
        return `${clubs[0]} Working on Multiple Deals`;
      }
      return `Clubs Circle for Targets`;
    }
  }
  
  // If contract extensions dominate
  if (contractStories.length > stories.length / 2) {
    if (contractStories.length === 1) {
      return `${contractStories[0].player} ${contractStories[0].facts[0]?.payCut ? 'Takes Pay Cut' : 'Extends Contract'}`;
    } else {
      return `Contract Updates`;
    }
  }
  
  // Mixed bag - create specific header based on lead story
  const leadStory = stories[0];
  if (leadStory.storyType === 'confirmed' && leadStory.primaryClubs.length > 0) {
    return `${leadStory.player} to ${leadStory.primaryClubs[0]} Plus More`;
  } else if (leadStory.storyType === 'negotiating' && leadStory.primaryClubs.length > 0) {
    return `${leadStory.primaryClubs[0]} Lead Chase for ${leadStory.player}`;
  } else if (leadStory.primaryClubs.length > 0) {
    return `${leadStory.primaryClubs[0]} in the Market`;
  }
  
  return "Today's Other Moves";
}