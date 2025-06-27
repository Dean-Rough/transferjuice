/**
 * Terry's Daily Breaking News Ticker
 * Generates 6 absolute shitpost football banter stories daily
 */

import { generateTerryCommentary } from "@/lib/ai/terryCommentary";

export interface BreakingNewsStory {
  id: string;
  headline: string;
  timestamp: Date;
  emoji: string;
  terryQuip?: string;
}

/**
 * Breaking news templates for maximum shithousery
 */
const BREAKING_NEWS_TEMPLATES = [
  // Transfer chaos
  {
    template:
      "[CLUB] preparing £[AMOUNT]m bid for [PLAYER] who reportedly [ABSURDITY]",
    clubs: [
      "Arsenal",
      "Chelsea",
      "Man United",
      "Newcastle",
      "Everton",
      "West Ham",
    ],
    amounts: ["127", "89", "156", "243", "67", "198"],
    players: [
      "mystery striker",
      "unidentified midfielder",
      "YouTube wonderkid",
      "FM legend",
      "Twitter target",
    ],
    absurdities: [
      "can't pass a medical due to excessive FIFA playing",
      "only speaks in football clichés",
      "insists on wearing the number π",
      "demands a clause allowing TikTok breaks",
      "refuses to play on Tuesdays",
      "wants his mum as assistant manager",
      "requires a personal vibes coach",
      "won't sign unless club builds a slide from dressing room to pitch",
    ],
  },

  // Manager meltdowns
  {
    template:
      "[MANAGER] SLAMS [TARGET] after [INCIDENT] leaves him '[REACTION]'",
    managers: [
      "Arteta",
      "Ten Hag",
      "Pep",
      "Klopp",
      "Dyche",
      "Moyes",
      "Postecoglou",
    ],
    targets: [
      "the grass length",
      "ball boys",
      "the concept of time",
      "modern football",
      "VAR's aura",
      "the moon's position",
    ],
    incidents: [
      "wind changed direction during throw-in",
      "opposition manager looked at him funny",
      "someone breathed near the technical area",
      "corner flag moved 2mm",
      "fourth official existed",
      "fan sneezed in Row Z",
    ],
    reactions: [
      "spiritually wounded",
      "philosophically bereft",
      "existentially confused",
      "vibrationally misaligned",
      "emotionally discombobulated",
    ],
  },

  // Player drama
  {
    template:
      "[PLAYER] SHOCK: Star [ACTION] after [TRIGGER] causes '[CONSEQUENCE]'",
    players: [
      "Unnamed striker",
      "Mystery winger",
      "Anonymous midfielder",
      "Secret defender",
      "Phantom goalkeeper",
    ],
    actions: [
      "threatens retirement",
      "unfollows club on Instagram",
      "changes bio to just emojis",
      "posts cryptic hourglass",
      "likes rival tweet",
      "seen eating chips",
    ],
    triggers: [
      "being subbed in 89th minute",
      "kit man forgetting birthday",
      "wrong brand of water in dressing room",
      "training cone placement",
      "canteen running out of pasta",
      "teammate's new haircut",
    ],
    consequences: [
      "dressing room in TATTERS",
      "vibes absolutely FINISHED",
      "project in SHAMBLES",
      "culture DESTROYED",
      "harmony OBLITERATED",
    ],
  },

  // Tactical revolution
  {
    template:
      "[TEAM] to play revolutionary [FORMATION] with [INNOVATION] to combat [PROBLEM]",
    teams: [
      "Big Six side",
      "Struggling outfit",
      "Midtable warriors",
      "European hopefuls",
      "Relegation battlers",
    ],
    formations: [
      "2-2-2-2-2",
      "0-0-10-0",
      "4-4-fucking-2",
      "1-1-1-1-1-1-1-1-1-1",
      "False Everything",
      "Inverted Christmas Tree",
    ],
    innovations: [
      "all players wearing same number",
      "goalkeeper playing as false 9",
      "no boots allowed",
      "telepathic communication only",
      "playing backwards entire match",
      "substitutes already on pitch hiding",
    ],
    problems: [
      "bad juju",
      "Mercury in retrograde",
      "opponent's vibes",
      "cosmic imbalance",
      "tactical feng shui",
      "general existence",
    ],
  },

  // Medical madness
  {
    template:
      "MEDICAL DRAMA: [PLAYER] fails medical due to [CONDITION] discovered by [METHOD]",
    players: [
      "£50m target",
      "deadline day signing",
      "free agent",
      "wonderkid",
      "proven veteran",
    ],
    conditions: [
      "allergic to grass",
      "phobia of round objects",
      "inability to see the colour red",
      "compulsive need to nutmeg",
      "chronic celebration addiction",
      "persistent good vibes syndrome",
    ],
    methods: [
      "crystal ball analysis",
      "vibe check",
      "aura reading",
      "tea leaf consultation",
      "zodiac compatibility test",
      "asking his mum",
    ],
  },

  // Contract chaos
  {
    template:
      "[PLAYER] demands [CLAUSE] in new contract after [REASON] leaves him [EMOTION]",
    players: [
      "Star striker",
      "Club captain",
      "Youth prospect",
      "Benchwarmer",
      "Loan army soldier",
    ],
    clauses: [
      "own theme song for substitutions",
      "personal weather forecast",
      "designated nap room",
      "custom grass pattern under feet",
      "hourly compliment quota",
      "right to rename stadium on Wednesdays",
    ],
    reasons: [
      "dream told him to",
      "read it in his horoscope",
      "dog barked three times",
      "saw it in FIFA career mode",
      "mate said it would be jokes",
      "why not innit",
    ],
    emotions: [
      "spiritually awakened",
      "cosmically aligned",
      "vibrationally elevated",
      "dimensionally shifted",
      "quantumly entangled",
    ],
  },
];

/**
 * Generate a single breaking news story
 */
function generateBreakingStory(template: any): BreakingNewsStory {
  // Randomly select from each category
  const pickRandom = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  let headline = template.template;

  // Map plural keys to their singular placeholders
  const keyMapping: Record<string, string> = {
    clubs: "CLUB",
    amounts: "AMOUNT",
    players: "PLAYER",
    absurdities: "ABSURDITY",
    managers: "MANAGER",
    targets: "TARGET",
    incidents: "INCIDENT",
    reactions: "REACTION",
    actions: "ACTION",
    triggers: "TRIGGER",
    consequences: "CONSEQUENCE",
    teams: "TEAM",
    formations: "FORMATION",
    innovations: "INNOVATION",
    problems: "PROBLEM",
    conditions: "CONDITION",
    methods: "METHOD",
    clauses: "CLAUSE",
    reasons: "REASON",
    emotions: "EMOTION",
  };

  // Replace all placeholders
  Object.keys(template).forEach((key) => {
    if (key !== "template" && Array.isArray(template[key])) {
      const placeholderKey = keyMapping[key] || key.toUpperCase();
      const placeholder = `[${placeholderKey}]`;
      // Replace all occurrences of the placeholder
      while (headline.includes(placeholder)) {
        headline = headline.replace(placeholder, pickRandom(template[key]));
      }
    }
  });

  // Pick appropriate emoji
  const emojis = ["🚨", "⚡", "🔥", "💥", "🎪", "🤯", "😱", "🎭"];

  return {
    id: `breaking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    headline: headline.toUpperCase(), // ALL CAPS FOR MAXIMUM DRAMA
    timestamp: new Date(),
    emoji: "", // No emojis
  };
}

/**
 * Generate daily batch of 6 breaking news stories
 */
export async function generateDailyBreakingNews(): Promise<
  BreakingNewsStory[]
> {
  const stories: BreakingNewsStory[] = [];
  const usedTemplates = new Set<number>();

  // Generate 6 unique stories
  while (stories.length < 6) {
    const templateIndex = Math.floor(
      Math.random() * BREAKING_NEWS_TEMPLATES.length,
    );

    // Ensure we don't use the same template twice
    if (
      usedTemplates.has(templateIndex) &&
      usedTemplates.size < BREAKING_NEWS_TEMPLATES.length
    ) {
      continue;
    }

    usedTemplates.add(templateIndex);
    const template = BREAKING_NEWS_TEMPLATES[templateIndex];
    const story = generateBreakingStory(template);

    // No Terry quips needed

    stories.push(story);
  }

  return stories;
}

/**
 * Get current breaking news ticker
 */
export async function getCurrentBreakingNews(): Promise<BreakingNewsStory[]> {
  // In production, this would check cache/database for today's stories
  // For now, generate fresh ones
  return generateDailyBreakingNews();
}

/**
 * Random Terry quips for when AI fails
 */
function getRandomTerryQuip(): string {
  const quips = [
    "The Terry's seen some nonsense in his time, but this...",
    "Right, that's enough internet for today",
    "Someone's getting sacked in the morning",
    "This is why we can't have nice things",
    "Proper Brexit tackle on common sense, that",
    "The beautiful game, ladies and gentlemen",
    "Christ alive, what timeline is this?",
    "Terry needs a lie down after reading that",
    "Absolute scenes in the group chat",
    "Games gone, pack it up lads",
  ];

  return quips[Math.floor(Math.random() * quips.length)];
}

/**
 * Format breaking news for display
 */
export function formatBreakingNewsForDisplay(
  stories: BreakingNewsStory[],
): string {
  return stories
    .map((story) => {
      const base = `${story.emoji} ${story.headline}`;
      return story.terryQuip ? `${base} - "${story.terryQuip}"` : base;
    })
    .join(" • ");
}

/**
 * Check if we need new breaking news (daily refresh)
 */
export function needsNewBreakingNews(lastGenerated?: Date): boolean {
  if (!lastGenerated) return true;

  const now = new Date();
  const lastGen = new Date(lastGenerated);

  // New stories at 6 AM every day
  const today6AM = new Date(now);
  today6AM.setHours(6, 0, 0, 0);

  const yesterday6AM = new Date(today6AM);
  yesterday6AM.setDate(yesterday6AM.getDate() - 1);

  // If last generated before today's 6 AM and it's now after 6 AM
  return lastGen < today6AM && now >= today6AM;
}
