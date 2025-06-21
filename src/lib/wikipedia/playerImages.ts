/**
 * Wikipedia Player Image Service
 * Fetches player images from Wikipedia Commons
 */

export interface PlayerImage {
  url: string;
  wikipediaUrl: string;
  license: string;
  attribution?: string;
}

/**
 * Get player image from Wikipedia
 */
export async function getPlayerImage(playerName: string): Promise<PlayerImage | null> {
  // For now, return mock data
  // In production, this would query Wikipedia API
  
  const mockImages: Record<string, PlayerImage> = {
    'Erling Haaland': {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Erling_Haaland_2023.jpg/440px-Erling_Haaland_2023.jpg',
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Erling_Haaland',
      license: 'CC BY-SA 4.0',
      attribution: 'Via Wikipedia Commons'
    },
    'Kylian Mbappé': {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129.jpg/440px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129.jpg',
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Kylian_Mbapp%C3%A9',
      license: 'CC BY-SA 4.0',
      attribution: 'Via Wikipedia Commons'
    },
    'Jude Bellingham': {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Jude_Bellingham_2023.jpg/440px-Jude_Bellingham_2023.jpg',
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Jude_Bellingham',
      license: 'CC BY-SA 4.0',
      attribution: 'Via Wikipedia Commons'
    }
  };
  
  return mockImages[playerName] || null;
}

/**
 * Search for player on Wikipedia
 */
export async function searchWikipediaPlayer(query: string): Promise<string[]> {
  // Mock implementation
  return [query];
}

/**
 * Validate image license is acceptable
 */
export function isAcceptableLicense(license: string): boolean {
  const acceptableLicenses = [
    'CC BY-SA 4.0',
    'CC BY-SA 3.0',
    'CC BY 4.0',
    'CC BY 3.0',
    'CC0',
    'Public Domain'
  ];
  
  return acceptableLicenses.some(l => license.includes(l));
}