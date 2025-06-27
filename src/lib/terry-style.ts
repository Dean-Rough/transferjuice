/**
 * The Terry Style System
 * Weaponised irritation for comedic transfer journalism
 */

import { z } from "zod";

// Style configuration schema
export const TerryStyleConfigSchema = z.object({
  snarkLevel: z.enum(["mild", "medium", "nuclear"]).default("medium"),
  terryReferences: z.boolean().default(false), // Use "The Terry" sparingly
  targetAudience: z
    .enum(["general", "football_nerds", "transfer_addicts"])
    .default("general"),
  topicSeriousness: z.enum(["low", "medium", "high"]).default("medium"),
});

export type TerryStyleConfig = z.infer<typeof TerryStyleConfigSchema>;

// Transfer-specific Terry vocabulary
export const transferVocabulary = {
  // Money descriptions (increasingly unhinged)
  fees: [
    "£40m (or roughly the GDP of a small Caribbean island)",
    "£75m (which is exactly £75m more than I have)",
    "£100m (enough to buy a modest house in London, or one decent midfielder)",
    "£150m (the sort of money that makes accountants weep openly)",
  ],

  // Medical descriptions
  medicals: [
    "the ritualistic poking and prodding that passes for a medical these days",
    "a medical examination (basically checking he has two legs and a pulse)",
    "medical tests that would make the NHS weep with envy",
    "the traditional medical circus of clipboard-wielding professionals",
  ],

  // Agent descriptions
  agents: [
    "his agent (a man who could sell ice to penguins)",
    "representatives who charge more per hour than most people earn per month",
    "agents circling like well-dressed vultures",
    "the sort of agent who wears sunglasses indoors unironically",
  ],

  // Club descriptions
  clubs: {
    arsenal: [
      'Arsenal (currently in their "cautiously optimistic" phase)',
      "the Gunners (who love a dramatic summer signing)",
    ],
    united: [
      "Manchester United (still pretending it's 2008)",
      "United (masters of the expensive disappointment)",
    ],
    city: [
      "Manchester City (where money goes to feel less lonely)",
      "City (who treat transfer fees like pocket change)",
    ],
    chelsea: [
      "Chelsea (currently experiencing an identity crisis)",
      "the Blues (who change managers like most people change socks)",
    ],
    liverpool: [
      'Liverpool (always "monitoring the situation")',
      "the Reds (who somehow make thriftiness seem romantic)",
    ],
    spurs: [
      'Tottenham (perpetually "building for the future")',
      "Spurs (where hope goes to die beautifully)",
    ],
    generic: [
      "a club that shall remain nameless (for legal reasons)",
      "one of those clubs with more money than sense",
    ],
  },
};

// Terry-style sentence starters for different contexts
export const terryStarters = {
  breaking: [
    "Right, this might be the most cursed transfer saga I've witnessed today, and I've been watching football for longer than I care to admit.",
    "Breaking news, or as close to breaking as anything gets in the glacial world of transfer negotiations:",
    "Hold onto your sanity, because this transfer story is about to make your brain hurt in ways you didn't know were possible.",
    "In a development that surprises absolutely no one who's been paying attention:",
  ],

  rumour: [
    "According to sources (and by sources, I mean someone who knows someone who once met an agent in a Nando's):",
    "The rumour mill is churning out fresh nonsense, and today's special is:",
    'In today\'s edition of "Journalists Making Things Up For Clicks":',
    "Word on the street (specifically, the very expensive street where football agents live):",
  ],

  analysis: [
    "Let's unpack this absolute car crash of a situation, shall we?",
    "Now, this is where things get properly mental:",
    "The implications of this are either brilliant or catastrophic, depending on your tolerance for chaos:",
    "What this actually means, beyond the obvious financial lunacy:",
  ],

  conclusion: [
    "So there you have it: modern football in all its gloriously unhinged splendour.",
    "And that, dear readers, is why nothing works anymore in the beautiful game.",
    "This is either the future of football or evidence that we've all lost our collective minds.",
    "The Terry suggests we all take a moment to appreciate the magnificent absurdity of it all.",
  ],
};

// Emotional register mappings
export const emotionalRegisters = {
  excitement: {
    mild: "mildly intrigued",
    medium: "cautiously optimistic (a dangerous state for any football fan)",
    high: "buzzing like a caffeinated wasp",
  },
  frustration: {
    mild: "slightly vexed",
    medium: "properly wound up",
    high: "experiencing the sort of rage that makes you question your life choices",
  },
  disbelief: {
    mild: "marginally baffled",
    medium: "thoroughly perplexed by the madness of it all",
    high: "so confused I can feel my brain trying to escape through my ears",
  },
  satisfaction: {
    mild: "grudgingly pleased",
    medium: "actually quite chuffed",
    high: "delighted in that smug way that makes other people want to punch you",
  },
};

// Generate Terry-style content modifiers
export function generateTerryModifiers(config: TerryStyleConfig) {
  const { snarkLevel, topicSeriousness } = config;

  const modifiers = {
    // Parenthetical asides (The Terry's trademark)
    asides:
      snarkLevel === "nuclear"
        ? [
            "(and yes, I'm aware of the irony)",
            "(which is exactly as mental as it sounds)",
            "(assuming any of this makes sense, which it doesn't)",
            "(because nothing matters anymore)",
          ]
        : snarkLevel === "medium"
          ? [
              "(because of course they did)",
              "(which surprises precisely no one)",
              "(in a move that baffles football purists)",
              "(as if any of this is normal)",
            ]
          : [
              "(apparently)",
              "(somehow)",
              "(for reasons unknown)",
              "(allegedly)",
            ],

    // Escalation patterns
    escalation:
      topicSeriousness === "high"
        ? [
            "This isn't just football anymore. This is late-stage capitalism with shinpads.",
            "We've officially entered the realm of financial fantasy football.",
            "This is what happens when you let accountants run the beautiful game.",
          ]
        : [
            "This is why we can't have nice things.",
            "And people wonder why football fans drink.",
            "Modern football, ladies and gentlemen.",
          ],

    // Specificity bombs (Terry's secret weapon)
    specifics: [
      "wet pasta, three grapes, and a single sad Babybel",
      "a man wearing Crocs to a wedding",
      "watching someone try to eat soup with a fork",
      "a pigeon that's learned to use Twitter",
      "the sound a football makes when it hits the crossbar at 3am",
    ],
  };

  return modifiers;
}

// Main style application function

// Content generation prompts with Terry's voice embedded
export const terryPrompts = {
  articleGeneration: `
You are The Terry, a brilliantly acerbic football journalist with a gift for weaponised irritation and emotional intelligence. Write in the voice described below:

VOICE CHARACTERISTICS:
- Acerbic, funny, witty, overstimulated but emotionally intelligent
- World-weary, hyper-observant, baffled by modern life but trying to keep it together  
- Hates things smartly—irritation weaponised for comedy
- Delightfully specific in detail; hates generalities unless they're ironic

RHYTHM & SYNTAX:
- Mix sentence lengths like stand-up: Short. Clipped. Then long, winding, overflowing with rage or joy. Then fragments. For punch.
- Lists of three (or more), ideally with escalating weirdness
- Parentheses for inner thoughts (or sudden tangents)
- No hedging. Say what you mean. Loudly. Wrong is fine if it's funny.
- Start mid-thought like picking up a rant midstream

VOICE MOVES:
- Meta-commentary: admit when something is stupid or you're being dramatic
- Specificity for laughs: not "a weird meal"—"wet pasta, three grapes, and a single sad Babybel"
- Sudden zoom-outs: minor gripe to society crumbling in two lines
- Juxtaposition: formal phrasing with dumb topics

Write a transfer briefing that captures this voice perfectly. Make it funny, specific, and emotionally intelligent.
`,

  subjectLineGeneration: `
Generate email subject lines in The Terry's voice—acerbic, specific, and irresistibly clickable. Think:
- "This transfer saga is more cursed than a haunted Gregg's"
- "Breaking: Football club does something that makes no sense (again)"
- "The daily dose of transfer chaos your sanity didn't order"

Make it witty, specific, and impossible to ignore.
`,

  contentOptimization: `
Optimize this content for The Terry's voice. Add:
- Specific, absurd details instead of vague descriptions
- Parenthetical asides that reveal inner thoughts
- Escalating lists that get progressively more unhinged
- Meta-commentary about the absurdity of modern football
- Sharp transitions between mild observations and societal collapse

Keep the facts accurate but make the delivery magnificently chaotic.
`,
};

// Quality assessment with Terry standards
export const terryQualityMetrics = {
  snark: {
    low: "Needs more weaponised irritation",
    medium: "Appropriately snarky without being mean",
    high: "Peak Terry energy—magnificently acerbic",
  },
  specificity: {
    low: "Too generic. Where are the absurd details?",
    medium: "Good specificity, could use more weird examples",
    high: "Perfectly specific—like watching someone eat soup with a fork",
  },
  voice: {
    low: "Sounds like a corporate press release",
    medium: "Getting there, but needs more emotional intelligence",
    high: "Pure Terry—acerbic but warm, chaotic but smart",
  },
};

// Helper functions for applying Terry style to different content types
export const applyTerryStyle = {
  // Enhance regular messages with Terry flair
  enhanceMessage: (
    message: string,
    config: TerryStyleConfig = {
      snarkLevel: "medium",
      terryReferences: false,
      targetAudience: "general",
      topicSeriousness: "medium",
    },
  ): string => {
    const styled = applyTerryStyleToContent(message, config);
    return styled;
  },

  // Enhance error messages with Terry attitude
  enhanceError: (error: string): string => {
    const terryErrorPrefixes = [
      "Right, this is properly mental:",
      "Well, that's gone spectacularly wrong:",
      "Oh brilliant, just brilliant:",
      "Of course this happened:",
      "This is exactly the sort of chaos we needed:",
    ];
    const prefix =
      terryErrorPrefixes[Math.floor(Math.random() * terryErrorPrefixes.length)];
    return `${prefix} ${error}`;
  },

  // Apply style to content with configuration
  toContent: applyTerryStyleToContent,
};

// Rename the original function to avoid naming conflict
function applyTerryStyleToContent(
  content: string,
  config: TerryStyleConfig,
): string {
  const modifiers = generateTerryModifiers(config);

  // Apply Terry transformations
  let styledContent = content;

  // Add parenthetical asides (randomly)
  if (Math.random() > 0.7) {
    const randomAside =
      modifiers.asides[Math.floor(Math.random() * modifiers.asides.length)];
    styledContent = styledContent.replace(/\.$/, ` ${randomAside}.`);
  }

  // Replace generic terms with Terry-specific vocabulary
  Object.entries(transferVocabulary.clubs).forEach(([club, variations]) => {
    if (club !== "generic") {
      const clubRegex = new RegExp(`\\b${club}\\b`, "gi");
      if (styledContent.match(clubRegex)) {
        const variation =
          variations[Math.floor(Math.random() * variations.length)];
        styledContent = styledContent.replace(clubRegex, variation);
      }
    }
  });

  return styledContent;
}

// Export the complete Terry style system
export const terryStyle = {
  vocabulary: transferVocabulary,
  starters: terryStarters,
  emotions: emotionalRegisters,
  prompts: terryPrompts,
  quality: terryQualityMetrics,
  apply: applyTerryStyle,
  generate: generateTerryModifiers,
} as const;
