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
  const keyPlayers = [...new Set(playerMatches)].slice(0, 5);
  
  const clubPattern = /(Arsenal|Chelsea|Liverpool|Manchester United|Manchester City|Tottenham|Newcastle|West Ham|Bayern Munich|Real Madrid|Barcelona|PSG|Juventus|Milan|Inter|Dortmund|Sporting|Nottingham Forest)/gi;
  const clubMatches = allText.match(clubPattern) || [];
  const keyClubs = [...new Set(clubMatches.map(c => c))].slice(0, 5);
  
  // Get main image
  let mainImage: string | undefined;
  if (keyPlayers[0]) {
    const playerImage = await getPlayerImage(keyPlayers[0]);
    if (playerImage) mainImage = playerImage;
  } else if (keyClubs[0]) {
    const clubBadge = await getClubBadge(keyClubs[0]);
    if (clubBadge) mainImage = clubBadge;
  }
  
  if (openai) {
    try {
      const prompt = `You are a football transfer journalist writing in the style of Joel Golby - witty, sardonic, but informative. 
      
      Write a cohesive transfer briefing article (400-600 words) from these updates:
      ${items.map(item => `- ${item.title}: ${item.content_text}`).join('\n')}
      
      Requirements:
      - Write as one flowing article, NOT separate sections
      - Lead with the biggest story
      - Weave all updates into a single narrative
      - Include relevant stats naturally in the text
      - Add dry humor and observations throughout
      - End with a punchy conclusion
      - Do NOT use section headers or bullet points
      - Write in a conversational, magazine style`;
      
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
          keyPlayers,
          keyClubs,
          mainImage
        }
      };
    } catch (error) {
      console.error("OpenAI error:", error);
    }
  }
  
  // Fallback: Create cohesive narrative without AI
  return generateFallbackBriefing(items, keyPlayers, keyClubs, mainImage);
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

function generateFallbackBriefing(
  items: RSSItem[],
  keyPlayers: string[],
  keyClubs: string[],
  mainImage?: string
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
  
  content += `The transfer window continues to deliver drama, and today's headline act features ${keyPlayers[0] || 'several key moves'}. ${leadText}\n\n`;
  
  // Weave in other stories
  if (items.length > 1) {
    content += `But that's not all punters. `;
    
    items.slice(1).forEach((item, index) => {
      const text = item.content_text.replace(/^[🚨🔴⚪️💣❤️🤍]+\s*/, '');
      
      if (index === 0) {
        content += text;
      } else if (index === items.length - 2) {
        content += ` Meanwhile, ${text}`;
      } else {
        content += ` In other news, ${text}`;
      }
      content += " ";
    });
    
    content += "\n\n";
  }
  
  // Add context about the window
  const hasAgreements = items.some(item => /agreement|agreed|deal/i.test(item.content_text));
  const hasNegotiations = items.some(item => /talks|negotiations|interested/i.test(item.content_text));
  
  if (hasAgreements) {
    content += `With deals being struck left and right, it's clear the summer window is heating up. `;
  } else if (hasNegotiations) {
    content += `Negotiations continue across Europe as clubs jostle for their targets. `;
  }
  
  // Extract any fees mentioned
  const feeMatches = items.map(item => item.content_text.match(/[€£](\d+)m/)).filter(Boolean);
  if (feeMatches.length > 0) {
    content += `The money being thrown around - ${feeMatches.map(m => m![0]).join(', ')} - would make your eyes water. `;
  }
  
  // Closing paragraph
  content += `\n\nAs always in the beautiful game, it's not about the football anymore, is it? It's about which millionaire can convince another millionaire to swap their millionaire lifestyle in one city for a millionaire lifestyle in another. The kids in the playground picking teams have nothing on these suits with their spreadsheets and private jets. Still, we watch, we wait, and we refresh our feeds, because what else is there to do in July?`;
  
  return {
    title: generateTitle(items, keyPlayers, keyClubs),
    content,
    metadata: {
      keyPlayers,
      keyClubs,
      mainImage
    }
  };
}