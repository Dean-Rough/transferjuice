import OpenAI from "openai";
import { generateTerryComment } from "./terry";

interface RSSItem {
  id: string;
  url: string;
  title: string;
  content_text: string;
  content_html: string;
  image?: string;
  date_published: string;
  authors: { name: string }[];
  attachments?: { url: string }[];
}

interface CohesiveBriefing {
  title: string;
  content: string;
  metadata: {
    keyPlayers: string[];
    keyClubs: string[];
    mainImage?: string;
    playerImages?: Record<string, string>;
  };
}

// Fetch player image from Wikipedia
async function getPlayerImage(playerName: string): Promise<string | null> {
  try {
    const wikiName = playerName.replace(' ', '_');
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.thumbnail?.source || null;
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
  // Sort by date
  items.sort((a, b) => new Date(b.date_published).getTime() - new Date(a.date_published).getTime());
  
  // Extract key information
  const allText = items.map(item => `${item.title} ${item.content_text}`).join(' ');
  
  // Extract players and clubs
  const playerPattern = /\b([A-Z][a-z]+ [A-Z][a-zöäüßéè]+)\b/g;
  const playerMatches = allText.match(playerPattern) || [];
  const keyPlayers = [...new Set(playerMatches)].slice(0, 8); // Get more players for images
  
  const clubPattern = /(Arsenal|Chelsea|Liverpool|Manchester United|Manchester City|Tottenham|Newcastle|West Ham|Bayern Munich|Real Madrid|Barcelona|PSG|Juventus|Milan|Inter|Dortmund|Sporting|Nottingham Forest)/gi;
  const clubMatches = allText.match(clubPattern) || [];
  const keyClubs = [...new Set(clubMatches.map(c => c))].slice(0, 5);
  
  // Get main image for lead player
  let mainImage: string | undefined;
  if (keyPlayers[0]) {
    const playerImage = await getPlayerImage(keyPlayers[0]);
    if (playerImage) mainImage = playerImage;
  } else if (keyClubs[0]) {
    const clubBadge = await getClubBadge(keyClubs[0]);
    if (clubBadge) mainImage = clubBadge;
  }
  
  // Get images for other key players (tier 2)
  const playerImages: Record<string, string> = {};
  for (let i = 1; i < Math.min(keyPlayers.length, 4); i++) {
    const image = await getPlayerImage(keyPlayers[i]);
    if (image) {
      playerImages[keyPlayers[i]] = image;
    }
  }
  
  if (openai) {
    try {
      const prompt = `You are a football transfer journalist writing in the style of Joel Golby - witty, sardonic, but informative. 
      
      Write a cohesive transfer briefing article (600-800 words) from these updates:
      ${items.map(item => `- ${item.title}: ${item.content_text}`).join('\n')}
      
      Format Requirements:
      - Lead with the biggest story (2-3 paragraphs)
      - Before each new story, create a SPECIFIC mini headline that relates to that story's content
      - Examples: "### Forest Lock Down Their Nigerian Wall" for Ola Aina story
      - Or "### Milan's Midfield Makeover Takes Shape" for a Milan transfer
      - Or "### Chelsea's Clear-out Continues at Cobham" for departures
      - Make mini headlines punchy, specific, and relevant to the actual story
      - Each story gets 2-3 paragraphs after its mini headline
      - Format player names as **Viktor Gyökeres**
      - Format club names as **Arsenal** 
      - Format fees as **€50m**
      - Add relevant stats naturally in the text
      - Include dry humor throughout
      - End with a punchy conclusion
      
      HTML Formatting:
      - Use <h3> for mini headlines
      - Use <strong class="text-orange-500"> for player names
      - Use <strong class="text-orange-500"> for club names
      - Use <strong class="text-green-500"> for fees (€50m, £30m, etc)
      - Format Twitter handles as <a href="https://twitter.com/handle" class="text-orange-500 hover:underline" target="_blank">@handle</a>
      - Keep paragraphs in <p> tags
      - Add source attribution after each story section: <p class="text-sm text-muted-foreground">via <a href="url" class="text-orange-500 hover:underline" target="_blank">Source Name</a></p>`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "Write the briefing now." }
        ],
        max_tokens: 800,
        temperature: 0.8,
      });
      
      const content = response.choices[0]?.message?.content || "";
      
      // Add image if found
      let finalContent = content;
      if (mainImage) {
        finalContent = `<figure class="briefing-image hero-image">
<img src="${mainImage}" alt="${keyPlayers[0] || keyClubs[0]}" />
<figcaption>${keyPlayers[0] || keyClubs[0]}</figcaption>
</figure>\n\n${content}`;
      }
      
      return {
        title: generateTitle(items, keyPlayers, keyClubs),
        content: finalContent,
        metadata: {
          keyPlayers: keyPlayers.slice(0, 5), // Limit to top 5 for metadata
          keyClubs,
          mainImage,
          playerImages
        }
      };
    } catch (error) {
      console.error("OpenAI error:", error);
    }
  }
  
  // Fallback: Create cohesive narrative without AI
  return generateFallbackBriefing(items, keyPlayers, keyClubs, mainImage, playerImages);
}

function generateTitle(items: RSSItem[], players: string[], clubs: string[]): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  
  // Check for confirmed deals
  const hasConfirmed = items.some(item => 
    /agreement|agreed|deal reached|here we go|confirmed/i.test(item.title + item.content_text)
  );
  
  if (hasConfirmed && players[0]) {
    return `${players[0]} Deal Agreed - Transfer Briefing ${date}`;
  }
  
  if (players.length >= 2) {
    return `${players.slice(0, 2).join(' and ')} Lead Transfer News - ${date}`;
  }
  
  if (clubs.length >= 2) {
    return `${clubs.slice(0, 2).join(' vs ')} Battle for Transfers - ${date}`;
  }
  
  return `Transfer Briefing: Latest Updates - ${date}`;
}

function generateMiniHeadline(text: string, item: RSSItem): string {
  // Extract key elements from the story
  const playerMatch = text.match(/\b([A-Z][a-z]+ [A-Z][a-zöäüßéè]+)\b/);
  const player = playerMatch ? playerMatch[1] : null;
  
  const clubPattern = /(Arsenal|Chelsea|Liverpool|Manchester United|Manchester City|Tottenham|Newcastle|West Ham|Bayern Munich|Real Madrid|Barcelona|PSG|Juventus|Milan|Inter|Dortmund|Sporting|Nottingham Forest|Roma|Napoli|Atletico|Valencia|Sevilla|Porto|Benfica|Ajax|Feyenoord|Celtic|Rangers)/gi;
  const clubs = text.match(clubPattern) || [];
  
  // Check for specific keywords to determine story type
  const isContract = /contract|deal|sign|pen|agree|extend/i.test(text);
  const isRejected = /reject|turn down|refuse|snub/i.test(text);
  const isMedical = /medical|tests|examination/i.test(text);
  const isInterest = /interested|monitoring|tracking|considering|eye/i.test(text);
  const isFee = /€\d+m|£\d+m|\$\d+m|fee|price|valuation/i.test(text);
  const isLoan = /loan|temporary|season-long/i.test(text);
  const isDeparture = /leave|exit|departure|farewell/i.test(text);
  
  // Generate relevant headline based on content
  if (player && clubs.length >= 2) {
    if (isContract) {
      return `${player} Puts Pen to Paper`;
    } else if (isRejected) {
      return `${player} Snubs ${clubs[1] || 'Suitors'}`;
    } else if (isMedical) {
      return `${player} Medical Scheduled`;
    } else if (isLoan) {
      return `${player} Loan Deal Taking Shape`;
    } else if (isDeparture) {
      return `${player} Heads for the Exit`;
    } else {
      return `${clubs[0]} Make Their Move for ${player}`;
    }
  } else if (clubs.length >= 1) {
    if (isContract && player) {
      return `${clubs[0]} Secure ${player}`;
    } else if (isInterest) {
      return `${clubs[0]} Enter the Race`;
    } else if (isFee) {
      return `${clubs[0]}'s Big Money Move`;
    } else {
      return `Latest from ${clubs[0]}`;
    }
  } else if (player) {
    if (isContract) {
      return `${player} Signs New Deal`;
    } else if (isInterest) {
      return `Race Heats Up for ${player}`;
    } else {
      return `${player} Update`;
    }
  }
  
  // Fallback headlines based on content type
  if (isContract) return "Another Deal Done";
  if (isRejected) return "Transfer Bid Rejected";
  if (isMedical) return "Medical Tests Ahead";
  if (isInterest) return "New Suitors Emerge";
  if (isFee) return "Big Money on the Table";
  
  // Generic fallback
  return "Transfer Update";
}

function generateFallbackBriefing(
  items: RSSItem[],
  keyPlayers: string[],
  keyClubs: string[],
  mainImage?: string,
  playerImages?: Record<string, string>
): CohesiveBriefing {
  let content = "";
  
  // Add image if available
  if (mainImage) {
    content += `<figure class="briefing-image hero-image">
<img src="${mainImage}" alt="${keyPlayers[0] || keyClubs[0]}" />
<figcaption>${keyPlayers[0] || keyClubs[0]}</figcaption>
</figure>\n\n`;
  }
  
  // Lead story
  const leadStory = items[0];
  const leadText = leadStory.content_text.replace(/^[🚨🔴⚪️💣❤️🤍]+\s*/, '');
  
  // Format player and club names with highlighting
  const formatContent = (text: string): string => {
    // Format player names
    keyPlayers.forEach(player => {
      const regex = new RegExp(`\\b${player}\\b`, 'g');
      text = text.replace(regex, `<strong class="text-orange-500">${player}</strong>`);
    });
    
    // Format club names
    keyClubs.forEach(club => {
      const regex = new RegExp(`\\b${club}\\b`, 'g');
      text = text.replace(regex, `<strong class="text-orange-500">${club}</strong>`);
    });
    
    // Format fees with green color
    text = text.replace(/([€£$]\d+(?:\.\d+)?m(?:illion)?)/gi, '<strong class="text-green-500">$1</strong>');
    
    // Format Twitter handles
    text = text.replace(/@(\w+)/g, '<a href="https://twitter.com/$1" class="text-orange-500 hover:underline" target="_blank">@$1</a>');
    
    return text;
  };
  
  content += `<p>The transfer window continues to deliver drama, and today's headline act features ${keyPlayers[0] ? `<strong class="text-orange-500">${keyPlayers[0]}</strong>` : 'several key moves'}. ${formatContent(leadText)}</p>\n\n`;
  
  // Add source link if it's a tweet
  if (leadStory.url && leadStory.authors[0]) {
    content += `<p class="text-sm text-muted-foreground">via <a href="${leadStory.url}" class="text-orange-500 hover:underline" target="_blank">${leadStory.authors[0].name}</a></p>\n\n`;
  }
  
  // Weave in other stories with mini headlines
  if (items.length > 1) {
    items.slice(1).forEach((item, index) => {
      const text = item.content_text.replace(/^[🚨🔴⚪️💣❤️🤍]+\s*/, '');
      
      // Create a relevant mini headline based on the story content
      const miniHeadline = generateMiniHeadline(text, item);
      content += `<h3 class="text-xl font-bold mt-8 mb-4">${miniHeadline}</h3>\n`;
      
      // Check if we should add an inline image for this story
      let storyPlayerImage: string | undefined;
      if (playerImages) {
        // Find which player is mentioned in this story
        for (const [player, image] of Object.entries(playerImages)) {
          if (text.includes(player)) {
            storyPlayerImage = image;
            break;
          }
        }
      }
      
      if (storyPlayerImage) {
        content += `<div class="flex gap-4 items-start">
          <div class="flex-1">
            <p>${formatContent(text)}</p>
          </div>
          <figure class="briefing-image flex-shrink-0" style="width: 300px;">
            <img src="${storyPlayerImage}" alt="Player" class="w-full h-auto rounded-lg shadow-lg" />
          </figure>
        </div>\n`;
      } else {
        content += `<p>${formatContent(text)}</p>\n`;
      }
      
      // Add source link
      if (item.url && item.authors[0]) {
        content += `<p class="text-sm text-muted-foreground">via <a href="${item.url}" class="text-orange-500 hover:underline" target="_blank">${item.authors[0].name}</a></p>\n\n`;
      }
    });
  }
  
  // Add context about the window with mini headline
  content += `<h3 class="text-xl font-bold mt-8 mb-4">The Bigger Picture</h3>\n`;
  
  const hasAgreements = items.some(item => /agreement|agreed|deal/i.test(item.content_text));
  const hasNegotiations = items.some(item => /talks|negotiations|interested/i.test(item.content_text));
  
  if (hasAgreements) {
    content += `<p>With deals being struck left and right, it's clear the summer window is heating up. `;
  } else if (hasNegotiations) {
    content += `<p>Negotiations continue across Europe as clubs jostle for their targets. `;
  }
  
  // Extract any fees mentioned
  const feeMatches = items.map(item => item.content_text.match(/[€£$](\d+(?:\.\d+)?m(?:illion)?)/gi)).filter(Boolean);
  if (feeMatches.length > 0) {
    content += `The money being thrown around - ${feeMatches.map(m => `<strong class="text-green-500">${m![0]}</strong>`).join(', ')} - would make your eyes water.</p>\n\n`;
  } else {
    content += `</p>\n\n`;
  }
  
  // Closing paragraph
  content += `<p>As always in the beautiful game, it's not about the football anymore, is it? It's about which millionaire can convince another millionaire to swap their millionaire lifestyle in one city for a millionaire lifestyle in another. The kids in the playground picking teams have nothing on these suits with their spreadsheets and private jets. Still, we watch, we wait, and we refresh our feeds, because what else is there to do in July?</p>`;
  
  return {
    title: generateTitle(items, keyPlayers, keyClubs),
    content,
    metadata: {
      keyPlayers: keyPlayers.slice(0, 5), // Limit to top 5 for metadata
      keyClubs,
      mainImage,
      playerImages
    }
  };
}