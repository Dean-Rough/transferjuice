// List of known football clubs for accurate matching
const KNOWN_CLUBS = [
  // Premier League
  "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton", "Burnley", "Chelsea", 
  "Crystal Palace", "Everton", "Fulham", "Leeds United", "Leicester City", "Liverpool", 
  "Manchester City", "Manchester United", "Newcastle United", "Nottingham Forest", 
  "Sheffield United", "Tottenham Hotspur", "Tottenham", "Spurs", "West Ham United", 
  "West Ham", "Wolverhampton Wanderers", "Wolves",
  
  // La Liga
  "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Real Sociedad", "Villarreal",
  "Real Betis", "Athletic Bilbao", "Valencia", "Osasuna", "Celta Vigo", "Rayo Vallecano",
  
  // Serie A
  "Juventus", "Inter Milan", "AC Milan", "Napoli", "Roma", "Lazio", "Atalanta", "Fiorentina",
  
  // Bundesliga
  "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Union Berlin", "Freiburg", "Bayer Leverkusen",
  "Eintracht Frankfurt", "Wolfsburg", "Borussia Monchengladbach",
  
  // Ligue 1
  "Paris Saint-Germain", "PSG", "Marseille", "Monaco", "Lens", "Rennes", "Nice", "Lyon",
  
  // Others
  "Ajax", "PSV Eindhoven", "Feyenoord", "Porto", "Benfica", "Sporting CP", "Celtic", "Rangers"
];

// Common player name patterns
const PLAYER_NAME_PATTERNS = [
  // Full names (First Last)
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?=\s+(?:has|will|could|set|to|is|was|signs|joins|leaves|wants))/g,
  // Names with particles (de, van, etc.)
  /\b([A-Z][a-z]+(?:\s+(?:de|van|der|del|di|da|le|la)\s+[A-Z][a-z]+)+)/g,
  // Single names (Brazilian style)
  /\b(Neymar|Casemiro|Rodrygo|Vinicius|Raphinha|Richarlison|Alisson|Ederson|Fabinho|Fred)\b/g,
];

// Price patterns
const PRICE_PATTERNS = [
  /£(\d+(?:\.\d+)?)\s*(?:million|m|bn|billion)/gi,
  /€(\d+(?:\.\d+)?)\s*(?:million|m|bn|billion)/gi,
  /\$(\d+(?:\.\d+)?)\s*(?:million|m|bn|billion)/gi,
  /£(\d{1,3}(?:,\d{3})*)/g,
  /€(\d{1,3}(?:,\d{3})*)/g,
  /\$(\d{1,3}(?:,\d{3})*)/g,
];

export function formatTextWithHighlights(text: string): string {
  // Create a working copy
  let formattedText = text;
  
  // Track what we've already highlighted to avoid double highlighting
  const highlighted = new Set<string>();
  
  // Highlight clubs
  KNOWN_CLUBS.forEach(club => {
    const regex = new RegExp(`\\b(${club})\\b`, 'g');
    formattedText = formattedText.replace(regex, (match) => {
      if (!highlighted.has(match)) {
        highlighted.add(match);
        return `<span class="font-semibold text-orange-500">${match}</span>`;
      }
      return match;
    });
  });
  
  // Highlight player names
  PLAYER_NAME_PATTERNS.forEach(pattern => {
    formattedText = formattedText.replace(pattern, (match) => {
      // Check if already highlighted
      if (match.includes('<span') || highlighted.has(match)) {
        return match;
      }
      // Check if it's actually a club (already highlighted)
      if (KNOWN_CLUBS.some(club => match.includes(club))) {
        return match;
      }
      highlighted.add(match);
      return `<span class="font-semibold text-orange-500">${match}</span>`;
    });
  });
  
  // Highlight prices
  PRICE_PATTERNS.forEach(pattern => {
    formattedText = formattedText.replace(pattern, (match) => {
      if (!highlighted.has(match) && !match.includes('<span')) {
        highlighted.add(match);
        return `<span class="font-semibold text-orange-500">${match}</span>`;
      }
      return match;
    });
  });
  
  return formattedText;
}

// Cache bust: React component moved to components/FormattedText.tsx

