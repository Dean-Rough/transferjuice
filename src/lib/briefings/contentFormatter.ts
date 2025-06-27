/**
 * Content Formatting Utilities
 * Formats briefing content with rich formatting, links, and embedded tweets
 */

export interface FormattingOptions {
  linkPlayers: boolean;
  linkClubs: boolean;
  boldEntities: boolean;
  includeTweets: boolean;
  baseUrl?: string;
}

/**
 * Format briefing content with rich formatting
 */
export function formatBriefingContent(
  content: string,
  feedItems: any[],
  options: FormattingOptions = {
    linkPlayers: true,
    linkClubs: true,
    boldEntities: true,
    includeTweets: true,
    baseUrl: process.env.APP_URL || "http://localhost:3000",
  },
): string {
  let formattedContent = content;

  // Step 1: Extract and embed quoted tweets
  if (options.includeTweets) {
    formattedContent = embedQuotedTweets(formattedContent, feedItems);
  }

  // Step 2: Format player names
  if (options.linkPlayers || options.boldEntities) {
    formattedContent = formatPlayerNames(formattedContent, options);
  }

  // Step 3: Format club names
  if (options.linkClubs || options.boldEntities) {
    formattedContent = formatClubNames(formattedContent, options);
  }

  // Step 4: Format transfer fees
  if (options.boldEntities) {
    formattedContent = formatTransferFees(formattedContent);
  }

  // Step 5: Add enhanced styling for key elements
  formattedContent = addEnhancedStyling(formattedContent);

  return formattedContent;
}

/**
 * Embed quoted tweets in the content
 */
function embedQuotedTweets(content: string, feedItems: any[]): string {
  // Find tweet references in content
  const tweetReferencePattern =
    /@[A-Za-z0-9_]+ (tweeted|reports|says|confirms|reveals)/gi;
  const matches = content.matchAll(tweetReferencePattern);

  let enhancedContent = content;

  for (const match of matches) {
    const tweetReference = match[0];
    const username = tweetReference.split(" ")[0].replace("@", "");

    // Find the corresponding feed item
    const relatedTweet = feedItems.find(
      (item) =>
        item.source?.handle?.toLowerCase().includes(username.toLowerCase()) ||
        item.source?.name?.toLowerCase().includes(username.toLowerCase()),
    );

    if (relatedTweet) {
      const tweetEmbed = generateTweetEmbed(relatedTweet);
      enhancedContent = enhancedContent.replace(
        tweetReference,
        `${tweetReference}\n\n${tweetEmbed}\n`,
      );
    }
  }

  return enhancedContent;
}

/**
 * Generate embedded tweet HTML
 */
function generateTweetEmbed(feedItem: any): string {
  const timestamp = new Date(feedItem.publishedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <blockquote class="tweet-embed" style="
      background: #1a1a1a; 
      border-left: 4px solid #ff6b35; 
      padding: 20px; 
      margin: 20px 0; 
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="
          width: 40px; 
          height: 40px; 
          background: #ff6b35; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          color: white; 
          margin-right: 12px;
        ">
          ${feedItem.source.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="font-weight: 600; color: #f0f0f0; font-size: 15px;">
            ${feedItem.source.name}
          </div>
          <div style="color: #888; font-size: 13px;">
            ${feedItem.source.handle ? `@${feedItem.source.handle}` : ""} • ${timestamp}
          </div>
        </div>
      </div>
      <p style="
        color: #f0f0f0; 
        line-height: 1.4; 
        margin: 0; 
        font-size: 15px;
      ">
        ${feedItem.originalText || feedItem.content}
      </p>
      ${
        feedItem.originalUrl
          ? `
        <div style="margin-top: 12px;">
          <a href="${feedItem.originalUrl}" 
             target="_blank" 
             rel="noopener noreferrer"
             style="color: #ff6b35; text-decoration: none; font-size: 13px;">
            View original tweet →
          </a>
        </div>
      `
          : ""
      }
    </blockquote>
  `;
}

/**
 * Format player names with bold and links
 */
function formatPlayerNames(
  content: string,
  options: FormattingOptions,
): string {
  // Enhanced player name patterns
  const playerPatterns = [
    /\b([A-Z][a-z]+ [A-Z][a-z]+)(?= to | from | has | agrees | signs | joins | leaves | moves | is set to | will join | underwent | completed | failed)/g,
    /\b([A-Z][a-z]+ [A-Z][a-z]+) (?:transfer|move|signing|deal|medical|contract)/g,
    /(?:striker|midfielder|defender|goalkeeper|winger|forward) ([A-Z][a-z]+ [A-Z][a-z]+)/g,
  ];

  let formattedContent = content;
  const processedNames = new Set<string>();

  playerPatterns.forEach((pattern) => {
    formattedContent = formattedContent.replace(
      pattern,
      (match, playerName) => {
        if (processedNames.has(playerName)) return match;
        processedNames.add(playerName);

        let formatted = playerName;

        if (options.boldEntities) {
          formatted = `<strong style="color: #ff6b35; font-weight: 600;">${formatted}</strong>`;
        }

        if (options.linkPlayers) {
          const filterUrl = `${options.baseUrl}/briefings?player=${encodeURIComponent(playerName)}`;
          formatted = `<a href="${filterUrl}" 
                       style="color: #ff6b35; text-decoration: none; border-bottom: 1px dotted #ff6b35;"
                       onmouseover="this.style.backgroundColor='rgba(255,107,53,0.1)'"
                       onmouseout="this.style.backgroundColor='transparent'"
                       title="View all briefings about ${playerName}">
                       ${formatted}
                     </a>`;
        }

        return match.replace(playerName, formatted);
      },
    );
  });

  return formattedContent;
}

/**
 * Format club names with bold and links
 */
function formatClubNames(content: string, options: FormattingOptions): string {
  // Premier League and major European clubs
  const majorClubs = [
    "Arsenal",
    "Liverpool",
    "Manchester United",
    "Manchester City",
    "Chelsea",
    "Tottenham",
    "Newcastle",
    "Brighton",
    "Aston Villa",
    "West Ham",
    "Leicester City",
    "Everton",
    "Real Madrid",
    "Barcelona",
    "Atletico Madrid",
    "Sevilla",
    "Valencia",
    "Bayern Munich",
    "Borussia Dortmund",
    "RB Leipzig",
    "Bayer Leverkusen",
    "Juventus",
    "AC Milan",
    "Inter Milan",
    "Napoli",
    "Roma",
    "Lazio",
    "PSG",
    "Monaco",
    "Lyon",
    "Marseille",
  ];

  // Club patterns including common suffixes
  const clubPatterns = [
    new RegExp(`\\b(${majorClubs.join("|")})\\b`, "g"),
    /\b([A-Z][a-z]+ (?:FC|United|City|Town|Rovers|Albion|Athletic|Wanderers|County))\b/g,
    /\b([A-Z][a-z]+(?:'s)? (?:Football Club|FC))\b/g,
  ];

  let formattedContent = content;
  const processedClubs = new Set<string>();

  clubPatterns.forEach((pattern) => {
    formattedContent = formattedContent.replace(pattern, (match, clubName) => {
      if (processedClubs.has(clubName)) return match;
      processedClubs.add(clubName);

      let formatted = clubName;

      if (options.boldEntities) {
        formatted = `<strong style="color: #ff6b35; font-weight: 600;">${formatted}</strong>`;
      }

      if (options.linkClubs) {
        const filterUrl = `${options.baseUrl}/briefings?club=${encodeURIComponent(clubName)}`;
        formatted = `<a href="${filterUrl}" 
                       style="color: #ff6b35; text-decoration: none; border-bottom: 1px dotted #ff6b35;"
                       onmouseover="this.style.backgroundColor='rgba(255,107,53,0.1)'"
                       onmouseout="this.style.backgroundColor='transparent'"
                       title="View all briefings about ${clubName}">
                       ${formatted}
                     </a>`;
      }

      return match.replace(clubName, formatted);
    });
  });

  return formattedContent;
}

/**
 * Format transfer fees with bold styling
 */
function formatTransferFees(content: string): string {
  const feePatterns = [
    /£(\d+(?:\.\d+)?(?:m|million|k|thousand|bn|billion))/gi,
    /€(\d+(?:\.\d+)?(?:m|million|k|thousand|bn|billion))/gi,
    /\$(\d+(?:\.\d+)?(?:m|million|k|thousand|bn|billion))/gi,
    /(\d+(?:\.\d+)?\s?(?:million|million euros|million pounds|m|k))/gi,
  ];

  let formattedContent = content;

  feePatterns.forEach((pattern) => {
    formattedContent = formattedContent.replace(pattern, (match) => {
      return `<strong style="color: #4ade80; font-weight: 700; background: rgba(74, 222, 128, 0.1); padding: 2px 6px; border-radius: 4px;">${match}</strong>`;
    });
  });

  return formattedContent;
}

/**
 * Add enhanced styling for key elements
 */
function addEnhancedStyling(content: string): string {
  let styledContent = content;

  // Style breaking news alerts
  styledContent = styledContent.replace(
    /🚨\s*(BREAKING|CONFIRMED|EXCLUSIVE|DONE DEAL|MEDICAL COMPLETE)([^.!]*[.!])/gi,
    '<div style="background: linear-gradient(135deg, #ff6b35, #f53e3e); padding: 16px; border-radius: 8px; margin: 20px 0; color: white; font-weight: 600; box-shadow: 0 4px 12px rgba(255,107,53,0.3);">🚨 $1$2</div>',
  );

  // Style quotes and important statements
  // IMPORTANT: First protect HTML tags to avoid wrapping attribute values
  const htmlTags: string[] = [];
  let tagIndex = 0;

  // Temporarily replace HTML tags with placeholders
  let protectedContent = styledContent.replace(/<[^>]+>/g, (match) => {
    const placeholder = `__HTML_PLACEHOLDER_${tagIndex}__`;
    htmlTags[tagIndex] = match;
    tagIndex++;
    return placeholder;
  });

  // Now safely apply blockquotes to quoted text (20+ chars)
  protectedContent = protectedContent.replace(
    /"([^"]{20,}?)"/g,
    '<blockquote style="border-left: 3px solid #ff6b35; padding-left: 16px; margin: 16px 0; font-style: italic; color: #e5e5e5; background: rgba(255,107,53,0.05); padding: 12px 16px; border-radius: 0 8px 8px 0;">"$1"</blockquote>',
  );

  // Restore HTML tags
  styledContent = protectedContent;
  htmlTags.forEach((tag, index) => {
    styledContent = styledContent.replace(`__HTML_PLACEHOLDER_${index}__`, tag);
  });

  // Style time-sensitive information
  styledContent = styledContent.replace(
    /\b(48 hours|24 hours|this week|next week|imminent|soon|today|tomorrow)\b/gi,
    '<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 6px; border-radius: 4px; font-weight: 500;">$1</span>',
  );

  return styledContent;
}

/**
 * Extract all entities from content for analysis
 */
export function extractContentEntities(content: string): {
  players: string[];
  clubs: string[];
  fees: string[];
  sources: string[];
} {
  const players: string[] = [];
  const clubs: string[] = [];
  const fees: string[] = [];
  const sources: string[] = [];

  // Player extraction
  const playerPattern =
    /\b([A-Z][a-z]+ [A-Z][a-z]+)(?= to | from | has | agrees | signs | joins | leaves | moves)/g;
  let match;
  while ((match = playerPattern.exec(content)) !== null) {
    if (!players.includes(match[1])) {
      players.push(match[1]);
    }
  }

  // Club extraction (similar to formatClubNames but for extraction)
  const clubPattern =
    /\b(Arsenal|Liverpool|Manchester United|Manchester City|Chelsea|Tottenham|Real Madrid|Barcelona|Bayern Munich|PSG|Juventus|AC Milan|Inter Milan|[A-Z][a-z]+ (?:FC|United|City|Town|Rovers|Albion|Athletic|Wanderers))\b/g;
  while ((match = clubPattern.exec(content)) !== null) {
    if (!clubs.includes(match[1])) {
      clubs.push(match[1]);
    }
  }

  // Fee extraction
  const feePattern = /[£€$]?\d+(?:\.\d+)?(?:m|million|k|thousand|bn|billion)/gi;
  while ((match = feePattern.exec(content)) !== null) {
    if (!fees.includes(match[0])) {
      fees.push(match[0]);
    }
  }

  // Source extraction
  const sourcePattern = /@([A-Za-z0-9_]+)|according to ([A-Z][a-zA-Z\s]+)/g;
  while ((match = sourcePattern.exec(content)) !== null) {
    const source = match[1] || match[2];
    if (source && !sources.includes(source)) {
      sources.push(source);
    }
  }

  return { players, clubs, fees, sources };
}

/**
 * Generate table of contents for long briefings
 */
export function generateTableOfContents(sections: any[]): string {
  if (sections.length <= 3) return "";

  const tocItems = sections
    .filter((section) => section.title)
    .map((section, index) => {
      const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `<li style="margin: 8px 0;"><a href="#${anchor}" style="color: #ff6b35; text-decoration: none;">${section.title}</a></li>`;
    })
    .join("");

  return `
    <div style="background: rgba(255,107,53,0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #ff6b35; margin-top: 0;">📋 In This Briefing</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${tocItems}
      </ul>
    </div>
  `;
}
