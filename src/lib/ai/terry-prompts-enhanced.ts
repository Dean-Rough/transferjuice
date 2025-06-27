/**
 * Enhanced Terry AI Prompts for Rich Media Articles
 * Generates OneFootball-style long-form content with Terry's voice
 */

import { EnrichedTweet } from "@/lib/enrichment/contentEnrichmentOrchestrator";
import { PlayerStats } from "@/lib/enrichment/playerStatsService";
import { ClubContext } from "@/lib/enrichment/clubContextService";
import { TransferContext } from "@/lib/enrichment/transferHistoryService";

interface RichArticlePromptContext {
  enrichedTweets: EnrichedTweet[];
  briefingType: "morning" | "afternoon" | "evening";
  targetWordCount: number; // 1000-1500 for rich articles
  includeStats: boolean;
  includeHistory: boolean;
  style: {
    tone: "professional-witty" | "casual-sarcastic" | "analytical-dry";
    snarkLevel: number; // 1-10, with 5 being optimal
  };
}

/**
 * Generate rich media article prompt
 */
export function generateRichMediaArticlePrompt(
  context: RichArticlePromptContext,
): string {
  const { enrichedTweets, briefingType, targetWordCount, style } = context;

  // Extract key story elements
  const mainStory = enrichedTweets[0];
  const playerStats = Array.from(mainStory.enrichment.players.values()).filter(
    Boolean,
  );
  const clubContexts = Array.from(mainStory.enrichment.clubs.values()).filter(
    Boolean,
  );

  return `You are writing a rich, detailed transfer article for Transfer Juice in the style of premium sports media (think The Athletic meets OneFootball with Terry's personality).

TARGET: ${targetWordCount} words of engaging, information-rich content

ARTICLE STRUCTURE:
1. COMPELLING HEADLINE (10-15 words)
   - Specific and newsworthy
   - Includes key names/clubs
   - Creates urgency or intrigue

2. LEAD PARAGRAPH (80-120 words)
   - Hook readers immediately with the main story
   - Include the key transfer details upfront
   - Set the stakes and context
   - End with a question or compelling statement

3. MAIN STORY DEVELOPMENT (400-500 words)
   - Expand on the transfer details with rich context
   - EMBED TWEETS: Use <blockquote class="twitter-tweet">...</blockquote> format
   - Include [IMAGE: player-name] placeholders for hero/inline images
   - Add tactical analysis of how the player fits
   - Include financial context and fee comparisons
   - Discuss timeline and deal progression

4. PLAYER PROFILE SECTION (200-300 words)
   - Current season performance with specific stats
   - Career trajectory and key moments
   - Playing style and strengths/weaknesses
   - Notable achievements and potential

5. CLUB CONTEXT SECTION (200-300 words)
   - Why this club needs this player specifically
   - Current squad situation and gaps
   - Manager's system and tactical fit
   - Recent transfer strategy and spending

6. HISTORICAL CONTEXT (150-200 words)
   - Similar transfers and their outcomes
   - Transfer records and market trends
   - Previous dealings between clubs
   - Player's connection to the clubs

7. WHAT HAPPENS NEXT (100-150 words)
   - Deal timeline and next steps
   - Potential obstacles or competition
   - Impact on other transfers
   - Immediate and long-term implications

8. SHITHOUSE CORNER (150-200 words)
   - Introduce as: "And now for something completely different - it's time for Shithouse Corner, where we celebrate football's finest wind-up merchants and masters of the dark arts."
   - Pick a recent example of football shithousery
   - Describe it with admiration and wit
   - Connect it to the broader art of winding up opponents
   - End with "That's all for Shithouse Corner. Remember, it's not cheating if the ref doesn't see it."

ENRICHED DATA TO INCORPORATE:
${formatEnrichedDataForPrompt(mainStory)}

WRITING GUIDELINES:
- Lead with facts, support with analysis
- Weave Terry's wit throughout (${style.snarkLevel}/10 snark level)
- Use specific examples and comparisons
- Create narrative tension and resolution
- Include relevant statistics naturally
- Make every paragraph information-dense
- Connect to broader football narratives

MEDIA EMBEDDING RULES:
- Start with [HERO IMAGE: player-name] after the lead paragraph
- Embed actual tweets using: <blockquote class="twitter-tweet"><p>Tweet text here</p>&mdash; Author (@handle) <a href="url">Date</a></blockquote>
- Add [IMAGE: description] placeholders where visual breaks would help
- Space media elements throughout for visual rhythm

TONE: ${getToneDescription(style.tone)}

TERRY'S VOICE ELEMENTS:
- Dry observations about transfer madness: 5-7 per article
- Pop culture comparisons: 2-3 maximum
- Self-aware football journalism jokes: 1-2
- Sharp transitions between serious and absurd
- Never refer to yourself, maintain third-person narrative

SPECIFIC REQUIREMENTS:
- Include exact tweet quotes with attribution
- Reference at least 3 specific statistics
- Make 2-3 tactical observations
- Include 1-2 historical comparisons
- End with forward-looking analysis

Remember: This is premium sports journalism with personality, not a comedy sketch. The wit enhances the content, it doesn't replace it.`;
}

/**
 * Format enriched data for the prompt
 */
function formatEnrichedDataForPrompt(enrichedTweet: EnrichedTweet): string {
  const parts: string[] = [];

  // Original tweets with embed format
  parts.push("ORIGINAL SOURCES (USE THESE AS EMBEDS):");
  parts.push(`Tweet: "${enrichedTweet.originalContent}"`);
  parts.push(`Author: @TransferSource`);
  parts.push(
    `Embed format: <blockquote class="twitter-tweet"><p>${enrichedTweet.originalContent}</p>&mdash; Transfer Source (@TransferSource) <a href="https://twitter.com/TransferSource/status/${enrichedTweet.id}">June 25, 2025</a></blockquote>`,
  );
  parts.push("");

  // Player data
  const mainPlayer = enrichedTweet.storyElements.mainPlayer;
  if (mainPlayer) {
    const stats = enrichedTweet.enrichment.players.get(mainPlayer);
    if (stats) {
      parts.push(`PLAYER DATA - ${mainPlayer}:`);
      parts.push(
        `- Age: ${stats.player.age}, Position: ${stats.player.position}`,
      );
      parts.push(`- Current Club: ${stats.player.currentClub}`);
      parts.push(
        `- This Season: ${stats.currentSeason.goals}G, ${stats.currentSeason.assists}A in ${stats.currentSeason.appearances} apps`,
      );
      parts.push(
        `- Market Value: €${(stats.player.marketValue || 0) / 1000000}m`,
      );
      parts.push(
        `- Career: ${stats.careerStats.totalGoals}G in ${stats.careerStats.totalAppearances} apps`,
      );
      parts.push("");
    }
  }

  // Club data
  enrichedTweet.storyElements.mainClubs.forEach((clubName) => {
    const context = enrichedTweet.enrichment.clubs.get(clubName);
    if (context) {
      parts.push(`CLUB DATA - ${clubName}:`);
      parts.push(
        `- League Position: ${context.leaguePosition} (${context.points} pts)`,
      );
      parts.push(
        `- Recent Form: ${context.recentForm} - ${context.lastFiveResults.join("")}`,
      );
      parts.push(
        `- Squad: ${context.squadInfo.size} players, avg age ${context.squadInfo.averageAge}`,
      );
      parts.push(
        `- Needs: ${context.needs.positions.join(", ")} (${context.needs.priority} priority)`,
      );
      parts.push(`- Net Spend: €${context.financials.netSpend / 1000000}m`);
      parts.push("");
    }
  });

  // Transfer context
  if (enrichedTweet.enrichment.transferContext) {
    const ctx = enrichedTweet.enrichment.transferContext;
    parts.push("TRANSFER MARKET CONTEXT:");
    parts.push(
      `- Average fee for position: €${ctx.marketTrend.averageFee / 1000000}m`,
    );
    parts.push(
      `- Record transfer: ${ctx.recordTransfer.player} for €${ctx.recordTransfer.fee / 1000000}m`,
    );
    if (ctx.similarTransfers.length > 0) {
      parts.push(
        `- Recent comparable: ${ctx.similarTransfers[0].player} to ${ctx.similarTransfers[0].toClub}`,
      );
    }
    parts.push("");
  }

  // Story hooks
  parts.push("NARRATIVE HOOKS:");
  enrichedTweet.storyElements.narrativeHooks.forEach((hook) => {
    parts.push(`- ${hook}`);
  });

  return parts.join("\n");
}

/**
 * Get tone description for the AI
 */
function getToneDescription(
  tone: RichArticlePromptContext["style"]["tone"],
): string {
  const descriptions = {
    "professional-witty":
      "Professional sports journalism with clever observations. Think The Athletic with a dash of Guardian Football Weekly. Informative first, entertaining second.",
    "casual-sarcastic":
      "Conversational tone with sharp edges. Like a knowledgeable mate at the pub who's had enough of transfer nonsense but can't look away.",
    "analytical-dry":
      "Data-driven and tactical with bone-dry humor. Think Michael Cox meets David Squires. Let the absurdity speak for itself.",
  };

  return descriptions[tone];
}

/**
 * Generate section-specific prompts for rich articles
 */
export function generateSectionPrompt(
  section:
    | "player-profile"
    | "tactical-analysis"
    | "financial-breakdown"
    | "historical-context",
  data: any,
): string {
  const prompts = {
    "player-profile": `Write a 200-300 word player profile that covers:
- Current form with specific statistics
- Key strengths and how they've been demonstrated this season
- Areas for improvement based on data
- Career trajectory and potential ceiling
- Why this player is attracting interest now
Include personality and playing style insights.`,

    "tactical-analysis": `Write a 250-word tactical analysis covering:
- How the player fits the team's current system
- Specific formations and roles they could play
- Which current players they'd complement or compete with
- Tactical problems they solve for the team
- How the manager has used similar players before
Be specific with formations, positions, and tactical concepts.`,

    "financial-breakdown": `Write a 200-word financial analysis including:
- Fee in context of current market
- Comparison to similar recent transfers
- Impact on buying club's budget and FFP
- Wage implications and contract length
- Whether this represents value for money
Include specific numbers and comparisons.`,

    "historical-context": `Write a 150-word historical perspective covering:
- Previous transfers between these clubs
- How similar moves have worked out
- The player's history with either club
- Record fees for this position/age/nationality
- Market evolution for this type of player
Connect past to present to predict future.`,
  };

  return prompts[section] + `\n\nDATA: ${JSON.stringify(data, null, 2)}`;
}

/**
 * Generate tweet embed descriptions
 */
export function generateTweetEmbedPrompt(tweet: {
  author: string;
  content: string;
}): string {
  return `Create a 50-word contextual introduction for this embedded tweet that:
- Explains who the source is and their credibility
- Sets up why this tweet matters
- Connects it to the broader story
- Maintains article flow

TWEET: @${tweet.author}: "${tweet.content}"

Make it feel like natural storytelling, not just "X tweeted Y".`;
}

/**
 * Generate image caption prompt
 */
export function generateRichImageCaptionPrompt(imageContext: {
  type: "player" | "celebration" | "action" | "stadium";
  mainSubject: string;
  storyContext: string;
}): string {
  return `Write a 15-25 word image caption that:
- Describes what's shown factually
- Adds story context or Terry's wit
- Enhances rather than repeats article text
- Includes proper credit

IMAGE: ${imageContext.type} shot of ${imageContext.mainSubject}
STORY CONTEXT: ${imageContext.storyContext}

Examples of good captions:
- "${imageContext.mainSubject} in action - the ${imageContext.type} every top club wants to see (Getty Images)"
- "The ${imageContext.mainSubject} celebrating - scenes that could become familiar at [club] (Reuters)"

Make it informative with a touch of personality.`;
}

/**
 * Quality check prompt for rich articles
 */
export function generateRichArticleQualityPrompt(article: string): string {
  return `Assess this Transfer Juice article against premium sports media standards:

ARTICLE:
${article}

SCORING (0-100):
1. INFORMATION DENSITY: How much valuable transfer/football info per paragraph?
2. NARRATIVE FLOW: Does it tell a compelling story with clear progression?
3. CONTEXT DEPTH: Are claims supported with stats, history, and analysis?
4. TERRY VOICE: Is the wit present but not overwhelming (5/10 ideal)?
5. READABILITY: Clear, engaging prose that keeps readers hooked?
6. FACTUAL ACCURACY: Are all stats, fees, and claims verifiable?
7. VISUAL ELEMENTS: Are images/tweets referenced naturally in text?

IDENTIFY ISSUES:
- Thin paragraphs that need more substance
- Missing context or analysis
- Overuse of humor at expense of information
- Unclear transitions or structure problems
- Generic statements needing specifics

Provide scores and 3-5 specific improvements to reach OneFootball/Athletic quality.`;
}

export const terryPromptsEnhanced = {
  richArticle: generateRichMediaArticlePrompt,
  section: generateSectionPrompt,
  tweetEmbed: generateTweetEmbedPrompt,
  imageCaption: generateRichImageCaptionPrompt,
  qualityCheck: generateRichArticleQualityPrompt,
} as const;
