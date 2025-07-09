import OpenAI from "openai";
import {
  TransferContext,
  findRidiculousComparison,
  findMostEmbarrassingMoment,
} from "./dataSourceIntegration";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The Golby system prompt - now with variety to avoid repetition
const GOLBY_SYSTEM_PROMPT = `You are Joel Golby writing about football transfers. Your writing style:

VOICE & TONE:
- Mix genuine football knowledge with bewildered exasperation at the absurdity of modern football
- Use extremely specific numbers and comparisons (not "expensive" but "£87.3 million, which is 1.2 million Freddos")
- Include parenthetical asides that add texture and comedy
- Build to a crescendo of disbelief before pulling back with resignation

HEADLINES - CRITICAL:
- Make headlines ACCURATE to the actual transfer news
- Include the ACTUAL player name, clubs involved, and key detail (fee, loan, etc)
- Add humor through metaphor or comparison, not by obscuring facts
- Good: "Noni Madueke to Arsenal: £48m for a Player Who Scored Twice Last Season"
- Bad: "Someone Did Something Stupid Again" (too vague)
- Headlines should tell you WHO, WHERE, and HOW MUCH at a glance

ARTICLE CONTENT - BALANCE HUMOR WITH INFORMATION:
- First paragraph MUST include: Player name, clubs involved, fee/loan details, source
- Weave in actual stats: goals, assists, appearances, age
- Include context: Why is this happening? Manager's history with player? Club's needs?
- THEN add the comedy: absurd comparisons, cultural observations, existential dread
- Every article should leave reader knowing: Who's moving, from where to where, for how much, and why

CRITICAL - AVOID REPETITION:
- DO NOT start every article with "Picture this:" or "Imagine:" or similar
- DO NOT always use the same structural pattern
- DO NOT repeat the same cultural references (vary beyond just Greggs/Tesco)
- Each article should feel fresh and different

VARIED OPENING APPROACHES (pick one that fits):
1. Start mid-conversation: "So [Player] to [Club] for [Amount] is happening now, which—"
2. Historical callback: "The last time [club] spent this much money..."
3. Direct address: "You know what's mental about [specific detail]?"
4. Specific scene: "It's 3am in [place] and [person] is..."
5. Statistical absurdity: "[Amount] gets you [comparison], or one [Player]..."
6. Personal anecdote angle: "I once tried to buy [thing] and..."
7. News report parody: "BREAKING: [Club] discovers [amount] in sofa, immediately spends on [player]"
8. Question opening: "How much is too much for a [age]-year-old who [specific stat]?"

LANGUAGE VARIETY:
- Sometimes "Listen:" or "Right:" but also "Okay so:" "Here's the thing:" "Look:" etc
- Mix British references (Greggs, Argos, Boots meal deal, Spoons, British Bake Off, Love Island, etc)
- Include different eras of references (not just 2008-2015)
- Vary your comparisons: housing deposits, university fees, used cars, Netflix subscriptions, etc

CRUCIAL: Each article must feel distinct. Avoid formulaic patterns. Let each story find its own voice within the Golby style while ALWAYS being informative about the actual transfer.`;

export interface GolbyArticle {
  headline: string;
  content: string;
}

// Generate a transfer article in Golby style
export async function generateGolbyArticle(
  tweetContent: string,
  context: TransferContext,
): Promise<GolbyArticle> {
  try {
    // Build the context prompt with all our gathered data
    const contextPrompt = buildContextPrompt(tweetContent, context);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: GOLBY_SYSTEM_PROMPT },
        { role: "user", content: contextPrompt },
      ],
      temperature: 0.8, // Bit of creativity
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error("No response from OpenAI");

    // Parse the response - expect headline on first line, rest is article
    const lines = response.trim().split("\n");
    const headline = lines[0].replace(/^#+\s*/, "").trim();
    const content = lines.slice(1).join("\n").trim();

    return { headline, content };
  } catch (error) {
    console.error("Error generating Golby article:", error);
    // Fallback to a basic version
    return generateFallbackArticle(tweetContent, context);
  }
}

// Build context for the AI
function buildContextPrompt(
  tweetContent: string,
  context: TransferContext,
): string {
  const { player, fromClub, toClub } = context;

  let prompt = `Write a Joel Golby style article about this transfer news. IMPORTANT: Make this article unique and different from previous ones. Vary your opening, references, and structure.\n\n`;
  prompt += `TWEET: "${tweetContent}"\n\n`;
  prompt += `CONTEXT:\n`;

  // Player stats
  if (player.stats) {
    prompt += `- ${player.name} scored ${player.stats.goals} goals in ${player.stats.matches} games\n`;
    prompt += `- Missed ${player.stats.bigChancesMissed || "several"} big chances\n`;
    prompt += `- Expected goals (xG): ${player.stats.xG?.toFixed(1) || "unknown"}\n`;
  }

  // Market value
  if (player.marketValue) {
    const value = player.marketValue.current;
    prompt += `- Current market value: £${(value / 1000000).toFixed(1)}m (${findRidiculousComparison(value)})\n`;
  }
  
  // Add random context to inspire variety
  const randomContext = [
    "Consider the weather today and how it relates to this transfer",
    "Think about what the player's mum would say about this",
    "Imagine this transfer as a reality TV show episode",
    "Frame this through the lens of a specific British high street experience",
    "Compare this to a completely unrelated historical event",
    "What would happen if this transfer was a Tinder date?",
    "Relate this to a specific British TV show from the 2000s",
    "Think about this transfer in terms of public transport delays"
  ];
  
  prompt += `\nCREATIVE ANGLE: ${randomContext[Math.floor(Math.random() * randomContext.length)]}\n`;

  // Recent embarrassment
  const embarrassment = findMostEmbarrassingMoment(player.recentNews);
  if (embarrassment) {
    prompt += `- Recent low point: "${embarrassment}"\n`;
  }

  // Club contexts
  if (fromClub?.stats) {
    prompt += `- ${fromClub.name} currently ${fromClub.stats.position}${getOrdinalSuffix(fromClub.stats.position)} in the league\n`;
  }
  if (toClub?.stats) {
    prompt += `- ${toClub.name} currently ${toClub.stats.position}${getOrdinalSuffix(toClub.stats.position)} in the league\n`;
  }

  prompt += `\nIMPORTANT REQUIREMENTS:
- Headline MUST include player name, clubs, and key detail (fee/loan/etc)
- First paragraph MUST state the basic facts clearly
- Include actual numbers and stats throughout
- Make it informative AND funny, not just funny

Write a complete article with a headline. Make it flow naturally - no section headers or rigid structure. About 400-500 words.`;

  return prompt;
}

// Generate article when AI fails
function generateFallbackArticle(
  tweetContent: string,
  context: TransferContext,
): GolbyArticle {
  const { player, toClub, fromClub } = context;

  // Varied headlines
  const headlines = [
    `${player.name} Has Done Something Stupid Again`,
    `Someone Please Explain Why ${player.name} Costs This Much`,
    `${player.name} and the Terrible, Horrible, No Good, Very Bad Transfer`,
    `BREAKING: ${player.name} Transfer Makes Local Man Question Reality`,
    `The ${player.name} Situation Has Officially Lost the Plot`,
    `${toClub?.name || "Mystery Club"} Have Lost Their Minds (Re: ${player.name})`,
  ];

  const headline = headlines[Math.floor(Math.random() * headlines.length)];

  // Varied opening lines
  const openings = [
    `So apparently ${player.name} is worth actual money now, which—`,
    `Right, ${player.name} to ${toClub?.name || "somewhere"}. Sure. Why not.`,
    `The last time I felt this confused, I was trying to understand NFTs.`,
    `Here's the thing about ${player.name}:`,
    `${Math.floor(Math.random() * 30) + 2012} was a simpler time, before ${player.name} transfers broke our brains.`,
    `You know what's mental? This. This is mental.`,
  ];

  const opening = openings[Math.floor(Math.random() * openings.length)];

  // Varied middle observations
  const observations = [
    `You watch him play and think, "Yeah, this guy definitely ${["orders his steak well-done", "asks for ketchup with everything", "claps when the plane lands", "replies all to company emails", "uses comic sans unironically"][Math.floor(Math.random() * 5)]}."`,
    `This is like when ${["your mate Dave bought that sports car", "Blockbuster turned down buying Netflix", "someone paid £4 for a coffee", "you see Christmas stuff in shops in October"][Math.floor(Math.random() * 4)]}.`,
    `The transfer fee could buy ${Math.floor(Math.random() * 10000) + 1000} ${["Meal Deals", "pints in London", "Oyster card top-ups", "Netflix subscriptions", "pairs of Primark jeans"][Math.floor(Math.random() * 5)]}.`,
    `I've seen ${["pigeons make better decisions", "more coherent episodes of Love Island", "clearer instructions on shampoo bottles", "better plotting in EastEnders"][Math.floor(Math.random() * 4)]}.`,
  ];

  const observation = observations[Math.floor(Math.random() * observations.length)];

  const content = `${opening} ${tweetContent}

${observation} That's not a footballing assessment, just a vibe.

This is what football is now: ${fromClub?.name || "clubs"} letting players go like they're returning a jumper to ASOS, except the jumper costs £${Math.floor(Math.random() * 50) + 30} million and ${["comes with its own Instagram account", "demands a private jet", "only plays on Wednesdays", "requires gluten-free grass"][Math.floor(Math.random() * 4)]}.

What will happen is this: ${["the deal will drag on until deadline day", "someone will tweet a plane emoji", "Sky Sports will camp outside the training ground", "we'll all check Fabrizio Romano's Twitter every five minutes"][Math.floor(Math.random() * 4)]}, and then either it happens or it doesn't, and we all pretend ${["we knew all along", "it makes sense", "this is normal", "we're not dead inside"][Math.floor(Math.random() * 4)]}.

${["Football, everyone. Football.", "This is why we can't have nice things.", "I need a lie down.", "Same time next week then.", "The beautiful game, apparently."][Math.floor(Math.random() * 5)]}`;

  return { headline, content };
}

// Helper for ordinal numbers
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j == 1 && k != 11) return "st";
  if (j == 2 && k != 12) return "nd";
  if (j == 3 && k != 13) return "rd";
  return "th";
}

// Generate update paragraph when story changes
export async function generateGolbyUpdate(
  newDevelopment: string,
  previousContent: string,
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are Joel Golby. Write a brief update paragraph (2-3 sentences) about a new development in a transfer story. Maintain the same exasperated, specific, funny voice. Reference the absurdity of how quickly things change in football.",
        },
        {
          role: "user",
          content: `New development: "${newDevelopment}"\n\nWrite a short Golby-style update paragraph.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    return (
      completion.choices[0]?.message?.content ||
      generateFallbackUpdate(newDevelopment)
    );
  } catch (error) {
    console.error("Error generating update:", error);
    return generateFallbackUpdate(newDevelopment);
  }
}

function generateFallbackUpdate(newDevelopment: string): string {
  return `**Update**: ${newDevelopment}. This is the problem with following transfers in real-time: everything changes every forty-five minutes and we all have to pretend like the previous thing we said with absolute certainty never happened. Cool. Great. Love it here.`;
}

// Check if article passes Golby voice quality threshold
export async function validateGolbyVoice(content: string): Promise<{
  isValid: boolean;
  score: number;
  feedback?: string;
}> {
  // Quick heuristic checks
  const checks = {
    hasSpecificNumbers: /£?\d+(?:\.\d+)?(?:\s*million|\s*m)/i.test(content),
    hasComparisons: /which is|that's like|equivalent to/i.test(content),
    hasParentheticals: /\([^)]+\)/.test(content),
    hasBritishReferences:
      /Greggs|Tesco|Sainsbury|council tax|Question Time/i.test(content),
    hasGolbyPhrases: /Listen:|Right:|The thing about|What will happen/i.test(
      content,
    ),
    hasExasperation: /obviously|of course|somehow|inexplicably/i.test(content),
  };

  const score =
    Object.values(checks).filter(Boolean).length / Object.keys(checks).length;

  return {
    isValid: score >= 0.6, // 60% threshold
    score,
    feedback:
      score < 0.6
        ? "Article lacks distinctive Golby voice elements"
        : undefined,
  };
}
