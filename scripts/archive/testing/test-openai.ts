#!/usr/bin/env tsx

/**
 * Test OpenAI API connection
 */

import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testOpenAI() {
  console.log("🤖 Testing OpenAI API...");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not found in environment");
    return;
  }

  console.log("API key starts with:", apiKey.substring(0, 10) + "...");

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    console.log("\n📝 Generating Terry-style commentary...");

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are The Terry, a football journalist with Joel Golby's voice. 
          Ascerbic, witty, exhausted by transfer nonsense but unable to look away.
          Write a brief reaction to a transfer rumour.`,
        },
        {
          role: "user",
          content:
            "Manchester United are reportedly preparing a £150m bid for a Championship striker who scored 3 goals last season.",
        },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const commentary = response.choices[0]?.message?.content;

    console.log("\n✅ SUCCESS! OpenAI is working.");
    console.log("\n🎭 Terry's Commentary:");
    console.log(commentary);

    console.log("\n📊 Usage:");
    console.log(`- Model: ${response.model}`);
    console.log(`- Tokens used: ${response.usage?.total_tokens}`);
  } catch (error: any) {
    console.error("\n❌ OpenAI API Error:");
    console.error(error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

testOpenAI();
