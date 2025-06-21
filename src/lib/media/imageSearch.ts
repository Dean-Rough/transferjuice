/**
 * Image Search System
 * 
 * Searches for relevant images based on transfer update content:
 * - Player photos (Wikipedia Commons, official club sources)
 * - Club badges and logos
 * - Stadium shots
 * - Action photos from recent matches
 */

export interface ImageResult {
  url: string;
  type: 'player' | 'club_badge' | 'stadium' | 'action';
  altText: string;
  source: string;
  thumbnailUrl?: string;
}

export interface ImageSearchOptions {
  maxResults?: number;
  preferredTypes?: Array<'player' | 'club_badge' | 'stadium' | 'action'>;
  fallbackToGeneric?: boolean;
}

/**
 * Search for relevant images based on update content and tags
 */
export async function searchRelevantImages(
  content: string,
  tags: Array<{name: string, type: 'club' | 'player' | 'source'}>,
  options: ImageSearchOptions = {}
): Promise<ImageResult[]> {
  const {
    maxResults = 3,
    preferredTypes = ['player', 'club_badge', 'stadium'],
    fallbackToGeneric = true
  } = options;

  console.log('🔍 Searching for images based on content:', content.substring(0, 100));
  
  const images: ImageResult[] = [];
  
  try {
    // 1. Search for player images
    const playerTags = tags.filter(tag => tag.type === 'player');
    for (const playerTag of playerTags.slice(0, 2)) { // Limit to 2 players
      const playerImages = await searchPlayerImages(playerTag.name);
      images.push(...playerImages.slice(0, 1)); // 1 image per player
    }
    
    // 2. Search for club badges
    const clubTags = tags.filter(tag => tag.type === 'club');
    for (const clubTag of clubTags.slice(0, 2)) { // Limit to 2 clubs
      const clubImages = await searchClubImages(clubTag.name);
      images.push(...clubImages.slice(0, 1)); // 1 badge per club
    }
    
    // 3. Search for stadium/action images if space allows
    if (images.length < maxResults) {
      const actionImages = await searchActionImages(content, clubTags);
      images.push(...actionImages.slice(0, maxResults - images.length));
    }
    
    // 4. Fallback to generic football images if needed
    if (images.length === 0 && fallbackToGeneric) {
      const genericImages = await searchGenericFootballImages();
      images.push(...genericImages.slice(0, 1));
    }
    
    console.log(`✅ Found ${images.length} relevant images`);
    return images.slice(0, maxResults);
    
  } catch (error) {
    console.error('❌ Image search failed:', error);
    return [];
  }
}

/**
 * Search for player images from Wikipedia Commons and other sources
 */
async function searchPlayerImages(playerName: string): Promise<ImageResult[]> {
  const cleanName = playerName.replace(/[@#]/g, '').trim();
  
  try {
    // Try Wikipedia Commons first (high quality, copyright-free)
    const wikiImages = await searchWikipediaImages(cleanName + ' footballer');
    if (wikiImages.length > 0) {
      return wikiImages.map(img => ({
        ...img,
        type: 'player' as const,
        altText: `${cleanName} - Football player`,
        source: 'Wikipedia Commons'
      }));
    }
    
    // Fallback to generic player silhouette
    return [{
      url: '/images/player-placeholder.svg',
      type: 'player' as const,
      altText: `${cleanName} - Football player`,
      source: 'Local',
      thumbnailUrl: '/images/player-placeholder-thumb.svg'
    }];
    
  } catch (error) {
    console.error(`Failed to search player images for ${cleanName}:`, error);
    return [];
  }
}

/**
 * Search for club badges and logos
 */
async function searchClubImages(clubName: string): Promise<ImageResult[]> {
  const cleanName = clubName.replace(/[@#]/g, '').trim();
  
  try {
    // Club badges from our local collection or Wikipedia
    const clubImages = await searchWikipediaImages(cleanName + ' football club badge');
    if (clubImages.length > 0) {
      return clubImages.map(img => ({
        ...img,
        type: 'club_badge' as const,
        altText: `${cleanName} - Club badge`,
        source: 'Wikipedia Commons'
      }));
    }
    
    // Fallback to generic club badge
    return [{
      url: '/images/club-placeholder.svg',
      type: 'club_badge' as const,
      altText: `${cleanName} - Football club`,
      source: 'Local',
      thumbnailUrl: '/images/club-placeholder-thumb.svg'
    }];
    
  } catch (error) {
    console.error(`Failed to search club images for ${cleanName}:`, error);
    return [];
  }
}

/**
 * Search for stadium and action images
 */
async function searchActionImages(
  content: string,
  clubTags: Array<{name: string, type: 'club'}>
): Promise<ImageResult[]> {
  const images: ImageResult[] = [];
  
  try {
    // Look for stadium mentions or use club stadiums
    for (const clubTag of clubTags.slice(0, 1)) {
      const cleanName = clubTag.name.replace(/[@#]/g, '').trim();
      const stadiumImages = await searchWikipediaImages(cleanName + ' stadium');
      
      if (stadiumImages.length > 0) {
        images.push({
          ...stadiumImages[0],
          type: 'stadium' as const,
          altText: `${cleanName} stadium`,
          source: 'Wikipedia Commons'
        });
      }
    }
    
    // Generic action shots if no specific stadium found
    if (images.length === 0) {
      images.push({
        url: '/images/football-action-placeholder.jpg',
        type: 'action' as const,
        altText: 'Football action shot',
        source: 'Local',
        thumbnailUrl: '/images/football-action-placeholder-thumb.jpg'
      });
    }
    
    return images;
    
  } catch (error) {
    console.error('Failed to search action images:', error);
    return [];
  }
}

/**
 * Search for generic football images as fallback
 */
async function searchGenericFootballImages(): Promise<ImageResult[]> {
  return [{
    url: '/images/football-generic.jpg',
    type: 'action' as const,
    altText: 'Football transfer news',
    source: 'Local',
    thumbnailUrl: '/images/football-generic-thumb.jpg'
  }];
}

/**
 * Search Wikipedia Commons for images
 */
async function searchWikipediaImages(query: string): Promise<Array<{url: string, thumbnailUrl?: string}>> {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=3&origin=*`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (!data.query?.search) {
      return [];
    }
    
    const images = [];
    for (const result of data.query.search.slice(0, 2)) {
      // Get image info
      const imageUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(result.title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&origin=*`;
      
      const imageResponse = await fetch(imageUrl);
      const imageData = await imageResponse.json();
      
      const pages = imageData.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as any;
        if (page.imageinfo?.[0]?.url) {
          images.push({
            url: page.imageinfo[0].url,
            thumbnailUrl: page.imageinfo[0].thumburl
          });
        }
      }
    }
    
    return images;
    
  } catch (error) {
    console.error('Wikipedia Commons search failed:', error);
    return [];
  }
}

/**
 * Extract entities from content for targeted image search
 */
export function extractImageSearchTerms(content: string): {
  players: string[];
  clubs: string[];
  locations: string[];
} {
  // Common football player patterns
  const playerPatterns = [
    /\b([A-Z][a-z]+ [A-Z][a-z]+)\b(?=.*(?:transfer|signing|move|join))/g,
    /@([A-Za-z]+)/g
  ];
  
  // Common club patterns
  const clubPatterns = [
    /\b(Arsenal|Chelsea|Liverpool|Manchester United|Manchester City|Tottenham|Real Madrid|Barcelona|PSG|Bayern Munich|Juventus|AC Milan|Inter Milan|Atletico Madrid|Borussia Dortmund)\b/gi,
    /#([A-Za-z]+)/g
  ];
  
  const players: string[] = [];
  const clubs: string[] = [];
  const locations: string[] = [];
  
  // Extract players
  playerPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      players.push(match[1] || match[0].replace('@', ''));
    }
  });
  
  // Extract clubs
  clubPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      clubs.push(match[1] || match[0].replace('#', ''));
    }
  });
  
  return {
    players: [...new Set(players)],
    clubs: [...new Set(clubs)],
    locations: [...new Set(locations)]
  };
}

/**
 * Validate image URLs and ensure they're accessible
 */
export async function validateImageUrls(images: ImageResult[]): Promise<ImageResult[]> {
  const validImages: ImageResult[] = [];
  
  for (const image of images) {
    try {
      const response = await fetch(image.url, { method: 'HEAD' });
      if (response.ok) {
        validImages.push(image);
      }
    } catch (error) {
      console.warn(`Image URL validation failed for ${image.url}:`, error);
    }
  }
  
  return validImages;
}