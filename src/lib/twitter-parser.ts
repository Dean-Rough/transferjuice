// Twitter Transfer Data Parser for Transfer Juice v1
// Extracts transfer info from ITK tweets

import {
  TwitterTransferData,
  TransferStatus,
  TransferType,
  PREMIER_LEAGUE_CLUBS,
  TRANSFER_KEYWORDS,
  FEE_PATTERNS,
} from '@/types/transfers';

export class TwitterTransferParser {
  /**
   * Main parsing function for tweet content
   */
  static parseTweet(
    tweetText: string,
    author: string = ''
  ): TwitterTransferData {
    const normalizedText = tweetText.toLowerCase();

    return {
      playerName: this.extractPlayerName(tweetText),
      fromClub: this.extractFromClub(tweetText),
      toClub: this.extractToClub(tweetText),
      fee: this.extractFee(tweetText),
      status: this.extractStatus(normalizedText),
      type: this.extractType(normalizedText),
      keywords: this.extractKeywords(normalizedText),
      confidence: this.calculateConfidence(tweetText, author),
    };
  }

  /**
   * Extract player name - typically capitalized words before club names
   */
  private static extractPlayerName(text: string): string | undefined {
    // Look for capitalized words that aren't club names
    const words = text.split(/\s+/);
    const playerWords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Stop if we hit a club name
      if (
        PREMIER_LEAGUE_CLUBS.some((club) =>
          word.toLowerCase().includes(club.toLowerCase())
        )
      ) {
        break;
      }

      // Look for capitalized names (not common words)
      if (
        /^[A-Z][a-z]+/.test(word) &&
        !['The', 'A', 'An', 'To', 'From', 'At', 'In', 'On'].includes(word)
      ) {
        playerWords.push(word);
      }
    }

    return playerWords.length > 0 ? playerWords.join(' ') : undefined;
  }

  /**
   * Extract 'from' club using transfer direction indicators
   */
  private static extractFromClub(text: string): string | undefined {
    const fromPatterns = [
      /from\s+([A-Za-z\s]+?)(?:\s+to|\s+→|\s+for|\s+in|$)/gi,
      /([A-Za-z\s]+?)\s+(?:striker|midfielder|defender|winger|goalkeeper)/gi,
      /([A-Za-z\s]+?)\s+star/gi,
    ];

    for (const pattern of fromPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const club = this.findClubInText(match);
          if (club) return club;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract 'to' club using transfer direction indicators
   */
  private static extractToClub(text: string): string | undefined {
    const toPatterns = [
      /(?:to|→|joins?|signs? for)\s+([A-Za-z\s]+?)(?:\s+for|\s+in|\s+on|$)/gi,
      /([A-Za-z\s]+?)\s+(?:move|transfer|deal|signing)/gi,
      /close to\s+([A-Za-z\s]+?)(?:\s+move|\s+deal|$)/gi,
    ];

    for (const pattern of toPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const club = this.findClubInText(match);
          if (club) return club;
        }
      }
    }

    return undefined;
  }

  /**
   * Find Premier League club in text
   */
  private static findClubInText(text: string): string | undefined {
    const normalizedText = text.toLowerCase();

    return PREMIER_LEAGUE_CLUBS.find(
      (club) =>
        normalizedText.includes(club.toLowerCase()) ||
        this.getClubAliases(club).some((alias) =>
          normalizedText.includes(alias.toLowerCase())
        )
    );
  }

  /**
   * Get common aliases for clubs
   */
  private static getClubAliases(club: string): string[] {
    const aliases: Record<string, string[]> = {
      'Manchester United': ['Man Utd', 'Man United', 'United'],
      'Manchester City': ['Man City', 'City'],
      Tottenham: ['Spurs', 'Tottenham Hotspur'],
      Brighton: ['Brighton & Hove Albion', 'Seagulls'],
      'West Ham': ['West Ham United', 'Hammers'],
      Newcastle: ['Newcastle United', 'Magpies'],
      'Nottingham Forest': ['Forest', "Nott'm Forest"],
      'Crystal Palace': ['Palace', 'Eagles'],
    };

    return aliases[club] || [];
  }

  /**
   * Extract transfer fee from text
   */
  private static extractFee(text: string): string | undefined {
    // Try exact fee pattern first
    const exactMatch = text.match(FEE_PATTERNS.exact);
    if (exactMatch) {
      return exactMatch[0];
    }

    // Check for free transfer
    if (FEE_PATTERNS.free.test(text)) {
      return 'Free';
    }

    // Check for undisclosed
    if (FEE_PATTERNS.undisclosed.test(text)) {
      return 'Undisclosed';
    }

    // Check for loan
    if (FEE_PATTERNS.loan.test(text)) {
      return 'Loan';
    }

    return undefined;
  }

  /**
   * Extract transfer status from keywords
   */
  private static extractStatus(text: string): TransferStatus | undefined {
    for (const [status, keywords] of Object.entries(TRANSFER_KEYWORDS)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return status as TransferStatus;
      }
    }

    return 'rumoured'; // Default status
  }

  /**
   * Extract transfer type
   */
  private static extractType(text: string): TransferType | undefined {
    if (text.includes('loan') || text.includes('temporary')) {
      return 'loan';
    }
    if (text.includes('free') || text.includes('bosman')) {
      return 'free';
    }
    if (text.includes('swap') || text.includes('exchange')) {
      return 'swap';
    }
    if (text.includes('option to buy') || text.includes('buy option')) {
      return 'option';
    }

    return 'permanent'; // Default type
  }

  /**
   * Extract relevant keywords for categorization
   */
  private static extractKeywords(text: string): string[] {
    const keywords: string[] = [];

    // Position keywords
    const positions = [
      'striker',
      'midfielder',
      'defender',
      'winger',
      'goalkeeper',
    ];
    positions.forEach((pos) => {
      if (text.includes(pos)) keywords.push(pos);
    });

    // Urgency keywords
    const urgency = ['urgent', 'imminent', 'soon', 'today', 'tomorrow'];
    urgency.forEach((word) => {
      if (text.includes(word)) keywords.push(word);
    });

    // Quality keywords
    const quality = ['star', 'talent', 'target', 'priority'];
    quality.forEach((word) => {
      if (text.includes(word)) keywords.push(word);
    });

    return keywords;
  }

  /**
   * Calculate confidence score based on various factors
   */
  private static calculateConfidence(text: string, author: string): number {
    let confidence = 0.5; // Base confidence

    // Author reliability (would be mapped from tier system)
    const tierMap: Record<string, number> = {
      fabrizioromano: 0.95,
      davidornstein: 0.9,
      arsenal_itk: 0.7,
      chelseaitk: 0.7,
      // Add more as needed
    };

    confidence += tierMap[author.toLowerCase()] || 0;

    // Text indicators
    if (
      text.toLowerCase().includes('confirmed') ||
      text.toLowerCase().includes('official')
    ) {
      confidence += 0.3;
    }
    if (text.toLowerCase().includes('medical')) {
      confidence += 0.2;
    }
    if (
      text.toLowerCase().includes('rumoured') ||
      text.toLowerCase().includes('considering')
    ) {
      confidence -= 0.1;
    }

    // Club and player name presence
    const hasClubs = PREMIER_LEAGUE_CLUBS.some((club) =>
      text.toLowerCase().includes(club.toLowerCase())
    );
    if (hasClubs) confidence += 0.1;

    // Fee mentioned
    if (FEE_PATTERNS.exact.test(text)) {
      confidence += 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1); // Clamp between 0 and 1
  }

  /**
   * Batch process multiple tweets
   */
  static parseTweets(
    tweets: Array<{ text: string; author: string; url?: string }>
  ): TwitterTransferData[] {
    return tweets
      .map((tweet) => ({
        ...this.parseTweet(tweet.text, tweet.author),
        sourceUrl: tweet.url,
      }))
      .filter((data) => data.confidence > 0.3); // Filter low confidence
  }

  /**
   * Generate transfer ID from parsed data
   */
  static generateTransferId(data: TwitterTransferData): string {
    const parts = [
      data.playerName?.replace(/\s+/g, '-').toLowerCase(),
      data.fromClub?.replace(/\s+/g, '-').toLowerCase(),
      data.toClub?.replace(/\s+/g, '-').toLowerCase(),
    ].filter(Boolean);

    return parts.join('_') + '_' + Date.now();
  }
}

// Export convenience functions
export const parseTweet = TwitterTransferParser.parseTweet.bind(
  TwitterTransferParser
);
export const parseTweets = TwitterTransferParser.parseTweets.bind(
  TwitterTransferParser
);
export const generateTransferId = TwitterTransferParser.generateTransferId.bind(
  TwitterTransferParser
);
