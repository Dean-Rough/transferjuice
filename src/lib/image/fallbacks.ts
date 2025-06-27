/**
 * Fallback images for when external sources fail
 */

export const PLAYER_IMAGE_FALLBACKS: Record<string, string> = {
  // Use placeholder images that won't fail
  "Erling Haaland": "/images/player-placeholder.png",
  "Kylian Mbappé": "/images/player-placeholder.png",
  "Jude Bellingham": "/images/player-placeholder.png",
  "Mohamed Salah": "/images/player-placeholder.png",
  "Kevin De Bruyne": "/images/player-placeholder.png",
  "Harry Kane": "/images/player-placeholder.png",
  "Bukayo Saka": "/images/player-placeholder.png",
  "Declan Rice": "/images/player-placeholder.png",
  "Bruno Fernandes": "/images/player-placeholder.png",
  "Marcus Rashford": "/images/player-placeholder.png",
  "Cristiano Ronaldo": "/images/player-placeholder.png",
  "Lionel Messi": "/images/player-placeholder.png",
};

export const CLUB_BADGE_FALLBACKS: Record<string, string> = {
  Arsenal: "/images/club-badge-placeholder.png",
  Chelsea: "/images/club-badge-placeholder.png",
  Liverpool: "/images/club-badge-placeholder.png",
  "Manchester United": "/images/club-badge-placeholder.png",
  "Manchester City": "/images/club-badge-placeholder.png",
  Tottenham: "/images/club-badge-placeholder.png",
  "Real Madrid": "/images/club-badge-placeholder.png",
  Barcelona: "/images/club-badge-placeholder.png",
  "Bayern Munich": "/images/club-badge-placeholder.png",
  PSG: "/images/club-badge-placeholder.png",
};

export function getPlayerImageUrl(playerName: string): string {
  // For now, always use placeholder to avoid 403 errors
  return PLAYER_IMAGE_FALLBACKS[playerName] || "/images/player-placeholder.png";
}

export function getClubBadgeUrl(clubName: string): string {
  return CLUB_BADGE_FALLBACKS[clubName] || "/images/club-badge-placeholder.png";
}
