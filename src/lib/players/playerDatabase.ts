/**
 * Enhanced Player Database and Name Matching System
 * Handles player name variations, nicknames, and intelligent matching
 */

export interface PlayerRecord {
  id: string;
  fullName: string;
  commonName: string;
  nicknames: string[];
  aliases: string[];
  currentClub?: string;
  nationality?: string;
  position?: string;
  birthYear?: number;
  wikipediaTitle?: string; // Exact Wikipedia page title if known
  imageUrls?: string[]; // Cached image URLs
}

export interface PlayerMatch {
  player: PlayerRecord;
  confidence: number; // 0-1
  matchedName: string;
  matchType: 'exact' | 'common' | 'nickname' | 'alias' | 'fuzzy';
}

export class PlayerDatabase {
  private static players: Map<string, PlayerRecord> = new Map();
  private static nameIndex: Map<string, string[]> = new Map(); // normalized name -> player IDs
  private static initialized = false;

  /**
   * Initialize with comprehensive player database
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load core players database
    await this.loadCorePlayersDatabase();
    this.buildNameIndex();
    this.initialized = true;
  }

  /**
   * Find the best player match for a given name
   */
  static async findPlayer(name: string): Promise<PlayerMatch | null> {
    await this.initialize();

    const normalizedInput = this.normalizeName(name);
    const candidates = this.findCandidates(normalizedInput);

    if (candidates.length === 0) {
      return null;
    }

    // Score all candidates
    const scoredMatches = candidates.map(player => ({
      player,
      ...this.calculateMatchScore(normalizedInput, name, player),
    }));

    // Sort by confidence and return best match
    scoredMatches.sort((a, b) => b.confidence - a.confidence);
    
    const bestMatch = scoredMatches[0];
    return bestMatch.confidence > 0.3 ? bestMatch : null;
  }

  /**
   * Get player by exact ID
   */
  static async getPlayer(id: string): Promise<PlayerRecord | null> {
    await this.initialize();
    return this.players.get(id) || null;
  }

  /**
   * Add or update a player record
   */
  static async addPlayer(player: PlayerRecord): Promise<void> {
    await this.initialize();
    
    this.players.set(player.id, player);
    this.addToNameIndex(player);
  }

  /**
   * Load core players database
   */
  private static async loadCorePlayersDatabase(): Promise<void> {
    // This would typically load from a file or API
    // For now, we'll define a comprehensive list of current top players
    const corePlayersData: Omit<PlayerRecord, 'id'>[] = [
      // Premier League Stars
      {
        fullName: 'Erling Braut Haaland',
        commonName: 'Erling Haaland',
        nicknames: ['Haaland', 'The Terminator', 'The Machine'],
        aliases: ['Erling Haaland', 'E. Haaland'],
        currentClub: 'Manchester City',
        nationality: 'Norway',
        position: 'Striker',
        birthYear: 2000,
        wikipediaTitle: 'Erling Haaland',
      },
      {
        fullName: 'Kylian Mbappé Lottin',
        commonName: 'Kylian Mbappé',
        nicknames: ['Mbappé', 'Kylian', 'Donatello'],
        aliases: ['Kylian Mbappe', 'K. Mbappé', 'Mbappe'],
        currentClub: 'Paris Saint-Germain',
        nationality: 'France',
        position: 'Forward',
        birthYear: 1998,
        wikipediaTitle: 'Kylian Mbappé',
      },
      {
        fullName: 'Jude Victor William Bellingham',
        commonName: 'Jude Bellingham',
        nicknames: ['Bellingham', 'Jude'],
        aliases: ['J. Bellingham'],
        currentClub: 'Real Madrid',
        nationality: 'England',
        position: 'Midfielder',
        birthYear: 2003,
        wikipediaTitle: 'Jude Bellingham',
      },
      {
        fullName: 'Harry Edward Kane',
        commonName: 'Harry Kane',
        nicknames: ['Kane', 'Harry', 'Hurricane'],
        aliases: ['H. Kane'],
        currentClub: 'Bayern Munich',
        nationality: 'England',
        position: 'Striker',
        birthYear: 1993,
        wikipediaTitle: 'Harry Kane',
      },
      {
        fullName: 'Mohamed Salah Hamed Mahrous Ghaly',
        commonName: 'Mohamed Salah',
        nicknames: ['Salah', 'Mo Salah', 'The Egyptian King'],
        aliases: ['M. Salah', 'Mohammed Salah'],
        currentClub: 'Liverpool',
        nationality: 'Egypt',
        position: 'Winger',
        birthYear: 1992,
        wikipediaTitle: 'Mohamed Salah',
      },
      {
        fullName: 'Vinícius José Paixão de Oliveira Júnior',
        commonName: 'Vinícius Júnior',
        nicknames: ['Vinicius Jr', 'Vini Jr', 'Vinicius'],
        aliases: ['Vinicius Junior', 'V. Júnior', 'Vini'],
        currentClub: 'Real Madrid',
        nationality: 'Brazil',
        position: 'Winger',
        birthYear: 2000,
        wikipediaTitle: 'Vinícius Júnior',
      },
      {
        fullName: 'Pedro González López',
        commonName: 'Pedri',
        nicknames: ['Pedri', 'Pedro'],
        aliases: ['P. González'],
        currentClub: 'Barcelona',
        nationality: 'Spain',
        position: 'Midfielder',
        birthYear: 2002,
        wikipediaTitle: 'Pedri',
      },
      {
        fullName: 'Pablo Martín Páez Gavira',
        commonName: 'Gavi',
        nicknames: ['Gavi', 'Pablo Gavi'],
        aliases: ['P. Gavira'],
        currentClub: 'Barcelona',
        nationality: 'Spain',
        position: 'Midfielder',
        birthYear: 2004,
        wikipediaTitle: 'Gavi (footballer)',
      },
      {
        fullName: 'Jamal Musiala',
        commonName: 'Jamal Musiala',
        nicknames: ['Musiala', 'Jamal'],
        aliases: ['J. Musiala'],
        currentClub: 'Bayern Munich',
        nationality: 'Germany',
        position: 'Attacking Midfielder',
        birthYear: 2003,
        wikipediaTitle: 'Jamal Musiala',
      },
      {
        fullName: 'Eduardo Celmi Camavinga',
        commonName: 'Eduardo Camavinga',
        nicknames: ['Camavinga', 'Eduardo'],
        aliases: ['E. Camavinga'],
        currentClub: 'Real Madrid',
        nationality: 'France',
        position: 'Midfielder',
        birthYear: 2002,
        wikipediaTitle: 'Eduardo Camavinga',
      },
      {
        fullName: 'Victor James Osimhen',
        commonName: 'Victor Osimhen',
        nicknames: ['Osimhen', 'Victor'],
        aliases: ['V. Osimhen'],
        currentClub: 'Napoli',
        nationality: 'Nigeria',
        position: 'Striker',
        birthYear: 1998,
        wikipediaTitle: 'Victor Osimhen',
      },
      {
        fullName: 'Rafael Alexandre da Conceição Leão',
        commonName: 'Rafael Leão',
        nicknames: ['Leão', 'Rafael', 'Leao'],
        aliases: ['R. Leão', 'Rafael Leao'],
        currentClub: 'AC Milan',
        nationality: 'Portugal',
        position: 'Winger',
        birthYear: 1999,
        wikipediaTitle: 'Rafael Leão',
      },
      {
        fullName: 'Khvicha Kvaratskhelia',
        commonName: 'Khvicha Kvaratskhelia',
        nicknames: ['Kvaratskhelia', 'Kvara', 'Kvaradona'],
        aliases: ['K. Kvaratskhelia'],
        currentClub: 'Napoli',
        nationality: 'Georgia',
        position: 'Winger',
        birthYear: 2001,
        wikipediaTitle: 'Khvicha Kvaratskhelia',
      },
      {
        fullName: 'Dušan Vlahović',
        commonName: 'Dušan Vlahović',
        nicknames: ['Vlahović', 'Dusan', 'Vlahovic'],
        aliases: ['D. Vlahović', 'Dusan Vlahovic'],
        currentClub: 'Juventus',
        nationality: 'Serbia',
        position: 'Striker',
        birthYear: 2000,
        wikipediaTitle: 'Dušan Vlahović',
      },
      {
        fullName: 'Bukayo Ayoyinka Temidayo Saka',
        commonName: 'Bukayo Saka',
        nicknames: ['Saka', 'Bukayo'],
        aliases: ['B. Saka'],
        currentClub: 'Arsenal',
        nationality: 'England',
        position: 'Winger',
        birthYear: 2001,
        wikipediaTitle: 'Bukayo Saka',
      },
      {
        fullName: 'Philip Walter Foden',
        commonName: 'Phil Foden',
        nicknames: ['Foden', 'Phil', 'The Stockport Iniesta'],
        aliases: ['P. Foden', 'Philip Foden'],
        currentClub: 'Manchester City',
        nationality: 'England',
        position: 'Midfielder',
        birthYear: 2000,
        wikipediaTitle: 'Phil Foden',
      },
      {
        fullName: 'Florian Richard Wirtz',
        commonName: 'Florian Wirtz',
        nicknames: ['Wirtz', 'Florian'],
        aliases: ['F. Wirtz'],
        currentClub: 'Bayer Leverkusen',
        nationality: 'Germany',
        position: 'Attacking Midfielder',
        birthYear: 2003,
        wikipediaTitle: 'Florian Wirtz',
      },
      {
        fullName: 'Youssoufa Moukoko',
        commonName: 'Youssoufa Moukoko',
        nicknames: ['Moukoko', 'Youssoufa'],
        aliases: ['Y. Moukoko'],
        currentClub: 'Borussia Dortmund',
        nationality: 'Germany',
        position: 'Striker',
        birthYear: 2004,
        wikipediaTitle: 'Youssoufa Moukoko',
      },
      // Add more players as needed...
    ];

    // Convert to full PlayerRecord format and add to database
    corePlayersData.forEach((playerData, index) => {
      const player: PlayerRecord = {
        id: `player-${index + 1}`,
        ...playerData,
      };
      this.players.set(player.id, player);
    });
  }

  /**
   * Build name index for fast lookup
   */
  private static buildNameIndex(): void {
    this.nameIndex.clear();

    for (const player of this.players.values()) {
      this.addToNameIndex(player);
    }
  }

  /**
   * Add player to name index
   */
  private static addToNameIndex(player: PlayerRecord): void {
    const names = [
      player.fullName,
      player.commonName,
      ...player.nicknames,
      ...player.aliases,
    ];

    for (const name of names) {
      const normalized = this.normalizeName(name);
      if (!this.nameIndex.has(normalized)) {
        this.nameIndex.set(normalized, []);
      }
      const playerIds = this.nameIndex.get(normalized)!;
      if (!playerIds.includes(player.id)) {
        playerIds.push(player.id);
      }
    }
  }

  /**
   * Find candidate players for a name
   */
  private static findCandidates(normalizedName: string): PlayerRecord[] {
    const directMatches = this.nameIndex.get(normalizedName) || [];
    const candidates = new Set(directMatches);

    // Add fuzzy matches
    for (const [indexedName, playerIds] of this.nameIndex.entries()) {
      if (this.isFuzzyMatch(normalizedName, indexedName)) {
        playerIds.forEach(id => candidates.add(id));
      }
    }

    return Array.from(candidates)
      .map(id => this.players.get(id)!)
      .filter(Boolean);
  }

  /**
   * Calculate match score for a player
   */
  private static calculateMatchScore(
    normalizedInput: string,
    originalInput: string,
    player: PlayerRecord
  ): { confidence: number; matchedName: string; matchType: PlayerMatch['matchType'] } {
    const names = [
      { name: player.fullName, type: 'exact' as const, weight: 1.0 },
      { name: player.commonName, type: 'common' as const, weight: 0.9 },
      ...player.nicknames.map(name => ({ name, type: 'nickname' as const, weight: 0.8 })),
      ...player.aliases.map(name => ({ name, type: 'alias' as const, weight: 0.7 })),
    ];

    let bestMatch = { confidence: 0, matchedName: '', matchType: 'fuzzy' as const };

    for (const { name, type, weight } of names) {
      const normalized = this.normalizeName(name);
      let confidence = 0;

      if (normalized === normalizedInput) {
        confidence = 1.0 * weight;
      } else if (normalized.includes(normalizedInput) || normalizedInput.includes(normalized)) {
        confidence = 0.8 * weight;
      } else {
        const similarity = this.calculateStringSimilarity(normalizedInput, normalized);
        confidence = similarity * weight * 0.6; // Fuzzy matches get lower confidence
      }

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          confidence,
          matchedName: name,
          matchType: type,
        };
      }
    }

    // Boost confidence for exact original input matches
    if (originalInput.toLowerCase() === bestMatch.matchedName.toLowerCase()) {
      bestMatch.confidence = Math.min(bestMatch.confidence * 1.2, 1.0);
    }

    return bestMatch;
  }

  /**
   * Check if two normalized names are a fuzzy match
   */
  private static isFuzzyMatch(name1: string, name2: string): boolean {
    if (name1.length < 3 || name2.length < 3) return false;
    
    // Check for substring matches
    if (name1.includes(name2) || name2.includes(name1)) return true;
    
    // Check for similar words
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.length > 2 && word2.length > 2) {
          if (this.calculateStringSimilarity(word1, word2) > 0.8) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return 1 - matrix[len1][len2] / maxLen;
  }

  /**
   * Normalize name for consistent comparison
   */
  private static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<{
    totalPlayers: number;
    totalNameVariations: number;
    topClubs: string[];
    coverageByPosition: Record<string, number>;
  }> {
    await this.initialize();

    const clubs = new Map<string, number>();
    const positions = new Map<string, number>();

    for (const player of this.players.values()) {
      if (player.currentClub) {
        clubs.set(player.currentClub, (clubs.get(player.currentClub) || 0) + 1);
      }
      if (player.position) {
        positions.set(player.position, (positions.get(player.position) || 0) + 1);
      }
    }

    const topClubs = Array.from(clubs.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([club]) => club);

    return {
      totalPlayers: this.players.size,
      totalNameVariations: this.nameIndex.size,
      topClubs,
      coverageByPosition: Object.fromEntries(positions),
    };
  }
}

// Export convenience functions
export const findPlayer = (name: string) => PlayerDatabase.findPlayer(name);
export const getPlayer = (id: string) => PlayerDatabase.getPlayer(id);
export const addPlayer = (player: PlayerRecord) => PlayerDatabase.addPlayer(player);
export const getPlayerStats = () => PlayerDatabase.getStats();