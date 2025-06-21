// Transfermarkt API integration
// Documentation: https://transfermarkt-api.fly.dev/docs

const API_BASE_URL = 'https://transfermarkt-api.fly.dev';

// Rate limiting: 2 calls per 3 seconds as per documentation
class RateLimiter {
  private static instance: RateLimiter;
  private lastCall = 0;
  private readonly minInterval = 1500; // 1.5 seconds between calls

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastCall = Date.now();
  }
}

interface PlayerProfile {
  id: number;
  name: string;
  image_url: string;
  shirt_number: number;
  position: string;
  age: number;
  height: string;
  foot: string;
  joined: string;
  contract_expires: string;
  market_value: string;
  nationality: string;
  second_nationality?: string;
  club: {
    id: number;
    name: string;
    image_url: string;
  };
}

interface ClubProfile {
  id: number;
  name: string;
  image_url: string;
  legal_form: string;
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  tel: string;
  fax: string;
  website: string;
  founded: number;
  members: number;
  other_sports: string[];
  colors: string[];
  stadium_name: string;
  stadium_seats: number;
  current_transfer_record: string;
  current_market_value: string;
  squad_size: number;
  squad_average_age: number;
  foreigners_number: number;
  foreigners_percentage: number;
  national_team_players: number;
}

interface Transfer {
  id: number;
  player_name: string;
  player_id: number;
  transfer_date: string;
  transfer_fee: string;
  from_club: {
    id: number;
    name: string;
    image_url: string;
  };
  to_club: {
    id: number;
    name: string;
    image_url: string;
  };
}

interface MarketValue {
  age: number;
  date: string;
  market_value: string;
  club_name: string;
}

class TransfermarktAPI {
  private rateLimiter = RateLimiter.getInstance();

  private async request<T>(endpoint: string): Promise<T> {
    await this.rateLimiter.throttle();

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Transfermarkt API error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Search for players
  async searchPlayers(playerName: string): Promise<any[]> {
    return this.request(`/players/search/${encodeURIComponent(playerName)}`);
  }

  // Get player profile with image
  async getPlayerProfile(playerId: number): Promise<PlayerProfile> {
    return this.request(`/players/${playerId}/profile`);
  }

  // Get player market value history
  async getPlayerMarketValue(playerId: number): Promise<MarketValue[]> {
    return this.request(`/players/${playerId}/market_value`);
  }

  // Get player transfer history
  async getPlayerTransfers(playerId: number): Promise<Transfer[]> {
    return this.request(`/players/${playerId}/transfers`);
  }

  // Search for clubs
  async searchClubs(clubName: string): Promise<any[]> {
    return this.request(`/clubs/search/${encodeURIComponent(clubName)}`);
  }

  // Get club profile with badge
  async getClubProfile(clubId: number): Promise<ClubProfile> {
    return this.request(`/clubs/${clubId}/profile`);
  }

  // Get club players
  async getClubPlayers(clubId: number): Promise<PlayerProfile[]> {
    return this.request(`/clubs/${clubId}/players`);
  }

  // Search competitions (e.g., Premier League)
  async searchCompetitions(competitionName: string): Promise<any[]> {
    return this.request(
      `/competitions/search/${encodeURIComponent(competitionName)}`
    );
  }

  // Get competition clubs
  async getCompetitionClubs(competitionId: number): Promise<ClubProfile[]> {
    return this.request(`/competitions/${competitionId}/clubs`);
  }

  // Helper method to get Premier League clubs
  async getPremierLeagueClubs(): Promise<ClubProfile[]> {
    try {
      // Search for Premier League
      const competitions = await this.searchCompetitions('Premier League');

      if (competitions.length > 0) {
        const premierLeague = competitions[0];
        return this.getCompetitionClubs(premierLeague.id);
      }

      return [];
    } catch (error) {
      console.error('Error fetching Premier League clubs:', error);
      return [];
    }
  }

  // Enhanced method to get transfer with enriched data
  async getEnrichedTransfer(
    playerName: string,
    fromClub: string,
    toClub: string
  ): Promise<{
    player: PlayerProfile | null;
    fromClubData: ClubProfile | null;
    toClubData: ClubProfile | null;
    marketValue: MarketValue[] | null;
    transfers: Transfer[] | null;
  }> {
    try {
      // Search for player
      const players = await this.searchPlayers(playerName);
      let playerData = null;
      let marketValue = null;
      let transfers = null;

      if (players.length > 0) {
        const player = players[0];
        playerData = await this.getPlayerProfile(player.id);
        marketValue = await this.getPlayerMarketValue(player.id);
        transfers = await this.getPlayerTransfers(player.id);
      }

      // Search for clubs
      const fromClubs = await this.searchClubs(fromClub);
      const toClubs = await this.searchClubs(toClub);

      let fromClubData = null;
      let toClubData = null;

      if (fromClubs.length > 0) {
        fromClubData = await this.getClubProfile(fromClubs[0].id);
      }

      if (toClubs.length > 0) {
        toClubData = await this.getClubProfile(toClubs[0].id);
      }

      return {
        player: playerData,
        fromClubData,
        toClubData,
        marketValue,
        transfers,
      };
    } catch (error) {
      console.error('Error enriching transfer data:', error);
      return {
        player: null,
        fromClubData: null,
        toClubData: null,
        marketValue: null,
        transfers: null,
      };
    }
  }
}

// Export singleton instance
export const transfermarktAPI = new TransfermarktAPI();

// Export types
export type { PlayerProfile, ClubProfile, Transfer, MarketValue };
