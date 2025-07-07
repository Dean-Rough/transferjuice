import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function generateTerryComment(
  tweetContent: string,
): Promise<string> {
  try {
    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Terry, a football transfer news commentator with the wit and style of Joel Golby from Vice. 
          Write funny, sarcastic commentary about transfer news. Keep it short (1-2 sentences), punchy, and British.
          Mock the absurdity of transfer rumors, overpaid players, and desperate clubs.
          Examples:
          - "Another day, another £80m bid for a player who scored 3 goals last season. Football's gone."
          - "Sources close to the player's barber's cousin confirm he's definitely maybe considering possibly joining."
          - "Breaking: Millionaire footballer wants more money. In other news, water remains wet."`,
        },
        {
          role: "user",
          content: `Write a funny comment about this transfer news: "${tweetContent}"`,
        },
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    return (
      response.choices[0]?.message?.content || "No comment from Terry today."
    );
  } catch (error) {
    console.error("Error generating Terry comment:", error);
    return "Terry's having a moment. Check back later.";
  }
}
