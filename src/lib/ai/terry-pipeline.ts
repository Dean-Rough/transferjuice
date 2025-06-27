/**
 * Terry AI Commentary Pipeline
 * Generates Joel Golby-style commentary for transfer feed items
 */

import OpenAI from "openai";
import { validateEnvironment } from "@/lib/validations/environment";
import { FeedItem, TransferType } from "@prisma/client";

const TERRY_PERSONALITY_PROMPT = `
You are Terry, the sardonic voice of Transfer Juice. Your writing style is exactly like Joel Golby from VICE - wit, ascerbic observations, and middle-class British pub humour. 

Key characteristics:
- High-brow middle-class British humour with occasional working-class observations
- Dry, sarcastic commentary on football's absurdities
- Clever wordplay and unexpected analogies
- Mild exasperation at obvious stupidity
- Constructive cynicism rather than mean-spirited attacks
- Occasional self-referential humour ("The Terry notes...")

Examples of your voice:
- "Right, Arsenal spending €65M on Declan Rice is either genius or the most expensive way to disappoint their fanbase."
- "Personal terms agreed between Mbappe and Real Madrid, which in football means they've successfully negotiated who pays for the fancy coffee machine."
- "The medical's tomorrow which means we'll get 47 updates about the player breathing correctly and walking in a straight line."
- "€120M for Rafael Leão? That's either shrewd business or the most expensive midlife crisis in football history."

Guidelines:
- Keep commentary under 200 characters for feed readability
- Focus on the absurdity of modern football transfer culture
- Be entertaining but not offensive
- Maintain consistent voice across all commentary
- Reference transfer window tropes and football journalism clichés
`;

const TRANSFER_CONTEXT_PROMPTS = {
  SIGNING: "A player has officially signed for a new club",
  RUMOUR: "Transfer speculation and unconfirmed reports",
  MEDICAL: "Medical examinations for transfers",
  CONFIRMED: "Transfer has been officially confirmed",
  BID: "Bids and offers between clubs",
  PERSONAL_TERMS: "Personal terms agreed with players",
  LOAN: "Loan deals and temporary transfers",
  EXTENSION: "Contract extensions and renewals",
};

export class TerryCommentaryGenerator {
  private openai: OpenAI;

  constructor() {
    const env = validateEnvironment();
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      organization: env.OPENAI_ORGANIZATION,
    });
  }

  /**
   * Generate Terry commentary for a transfer update
   */
  async generateCommentary(
    content: string,
    transferType?: TransferType,
    metadata?: {
      clubsExtracted?: string[];
      playersExtracted?: string[];
      fee?: string;
      league?: string;
    },
  ): Promise<string> {
    const contextPrompt = transferType
      ? TRANSFER_CONTEXT_PROMPTS[transferType]
      : "";
    const clubContext = metadata?.clubsExtracted?.join(", ") || "";
    const playerContext = metadata?.playersExtracted?.join(", ") || "";

    const prompt = `
${TERRY_PERSONALITY_PROMPT}

Transfer Context: ${contextPrompt}
Clubs mentioned: ${clubContext}
Players mentioned: ${playerContext}
Original content: "${content}"

Generate a single line of Terry commentary (under 200 characters) that:
1. Reflects on the absurdity or predictability of this transfer news
2. Uses your characteristic dry wit and British humour
3. References common transfer window tropes if relevant
4. Maintains the Joel Golby writing style

Commentary:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are Terry, the sardonic transfer commentary expert with Joel Golby's writing style.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.8,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const commentary = response.choices[0]?.message?.content?.trim();

      if (!commentary) {
        throw new Error("No commentary generated");
      }

      // Ensure commentary is under 200 characters
      if (commentary.length > 200) {
        return commentary.substring(0, 197) + "...";
      }

      return commentary;
    } catch (error) {
      console.error("Failed to generate Terry commentary:", error);

      // Fallback commentary based on transfer type
      return this.getFallbackCommentary(transferType, metadata);
    }
  }

  /**
   * Generate multiple commentary options for A/B testing
   */
  async generateCommentaryOptions(
    content: string,
    transferType?: TransferType,
    count: number = 3,
  ): Promise<string[]> {
    const options: string[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const commentary = await this.generateCommentary(content, transferType);
        options.push(commentary);

        // Small delay to avoid hitting rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to generate commentary option ${i + 1}:`, error);
      }
    }

    return options.length > 0
      ? options
      : [this.getFallbackCommentary(transferType)];
  }

  /**
   * Validate commentary quality and consistency
   */
  async validateCommentary(commentary: string): Promise<{
    score: number;
    issues: string[];
    isAcceptable: boolean;
  }> {
    const issues: string[] = [];
    let score = 100;

    // Length check
    if (commentary.length > 200) {
      issues.push("Commentary exceeds 200 character limit");
      score -= 20;
    }

    // Terry voice keywords check
    const terryKeywords = [
      "right,",
      "properly",
      "mental",
      "brilliant",
      "notes",
      "terry",
      "genius",
      "expensive",
      "ridiculous",
      "absolute",
      "perfectly",
    ];

    const hasKeywords = terryKeywords.some((keyword) =>
      commentary.toLowerCase().includes(keyword),
    );

    if (!hasKeywords) {
      issues.push("Commentary lacks Terry voice characteristics");
      score -= 15;
    }

    // Profanity/offensive content check
    const offensiveWords = ["fuck", "shit", "bloody hell", "bastard"];
    const hasOffensive = offensiveWords.some((word) =>
      commentary.toLowerCase().includes(word),
    );

    if (hasOffensive) {
      issues.push("Commentary contains inappropriate language");
      score -= 30;
    }

    // Sentiment check - should be witty but not mean
    if (commentary.includes("!") && commentary.includes("?")) {
      issues.push("Commentary may be too aggressive");
      score -= 10;
    }

    return {
      score,
      issues,
      isAcceptable: score >= 70 && issues.length < 3,
    };
  }

  /**
   * Fallback commentary for when AI generation fails
   */
  private getFallbackCommentary(
    transferType?: TransferType,
    metadata?: { clubsExtracted?: string[]; playersExtracted?: string[] },
  ): string {
    const club = metadata?.clubsExtracted?.[0] || "the club";
    const player = metadata?.playersExtracted?.[0] || "the player";

    const fallbacks = {
      SIGNING: `${club} getting ${player} is either brilliant business or Tuesday's regret waiting to happen.`,
      RUMOUR: `Transfer rumours about ${player} - because apparently we need 47 different ways to say "maybe."`,
      MEDICAL: `${player}'s medical scheduled, which means we'll get hourly updates about someone walking normally.`,
      CONFIRMED: `${player} to ${club} confirmed. Cue the inevitable "here we go!" tweets from every corner of football Twitter.`,
      BID: `${club} bidding for ${player}. Modern football's equivalent of haggling at a car boot sale but with more zeros.`,
      PERSONAL_TERMS: `Personal terms agreed with ${player}. Presumably they've sorted out who provides the better biscuits.`,
      LOAN: `${player} going on loan to ${club}. Football's version of "it's complicated" relationship status.`,
      EXTENSION: `${player} extending with ${club}. Nothing says commitment like negotiating for another few years.`,
    };

    return transferType && fallbacks[transferType]
      ? fallbacks[transferType]
      : "The beautiful chaos of transfer window strikes again with predictable unpredictability.";
  }

  /**
   * Generate daily email intro/outro commentary
   */
  async generateEmailCommentary(
    type: "intro" | "outro",
    date: Date,
    itemCount: number,
    topStories?: string[],
  ): Promise<string> {
    const dateStr = date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const prompt =
      type === "intro"
        ? `Write Terry's email intro for ${dateStr} with ${itemCount} transfer stories. Include a witty observation about the day/transfer window state.`
        : `Write Terry's email outro for ${dateStr}. Summarize the chaos with typical dry humour and sign off.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: TERRY_PERSONALITY_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return (
        response.choices[0]?.message?.content?.trim() ||
        this.getFallbackEmailCommentary(type, dateStr, itemCount)
      );
    } catch (error) {
      console.error("Failed to generate email commentary:", error);
      return this.getFallbackEmailCommentary(type, dateStr, itemCount);
    }
  }

  private getFallbackEmailCommentary(
    type: "intro" | "outro",
    date: string,
    count: number,
  ): string {
    if (type === "intro") {
      return `Good morning. It's ${date} and the transfer rumour mill has produced ${count} stories of varying degrees of believability. Let's dive into today's collection of football's finest chaos.`;
    } else {
      return `That's your lot for today's transfer circus. ${count} stories of dreams, disappointments, and the occasional bit of actual business. Until tomorrow's inevitable drama, stay sane. - The Terry`;
    }
  }
}

// Singleton instance
export const terryCommentaryGenerator = new TerryCommentaryGenerator();
