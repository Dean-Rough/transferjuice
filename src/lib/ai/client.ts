/**
 * OpenAI Client Wrapper
 * Handles all AI generation with proper error handling
 */

import OpenAI from "openai";
import { logger } from "@/lib/logger";

export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateCompletion(options: {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    const {
      prompt,
      maxTokens = 2000,
      temperature = 0.8,
      model = "gpt-4-turbo-preview",
    } = options;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are Terry, a witty British football journalist in the style of Joel Golby. You write engaging, sardonic transfer news briefings.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content generated");
      }

      return content;
    } catch (error) {
      logger.error("OpenAI API error", error);
      throw error;
    }
  }
}
