import {
  AggregatedStory,
  ExtractedFacts,
  compareFacts,
} from "./storyAggregator";

// Football context that matters
const CLUB_CONTEXT: Record<string, { needs: string[]; situation: string }> = {
  Arsenal: {
    needs: ["striker", "midfielder"],
    situation: "haven't won the league since YouTube was invented",
  },
  Chelsea: {
    needs: ["striker", "coherent strategy"],
    situation: "spent £1bn and still look confused",
  },
  "Manchester United": {
    needs: ["midfielder", "defender", "pride"],
    situation: "living off memories and vibes",
  },
  Liverpool: {
    needs: ["midfielder"],
    situation: "rebuilding after Klopp's heavy metal football",
  },
  "Manchester City": {
    needs: ["Gundogan replacement"],
    situation: "won the treble, now just showing off",
  },
  Tottenham: {
    needs: ["defender", "mentality"],
    situation: "it's Tottenham, what do you expect",
  },
  Newcastle: {
    needs: ["European depth"],
    situation: "Saudi money meets Champions League reality",
  },
  Barcelona: {
    needs: ["money", "then players"],
    situation: "selling tomorrow to buy today",
  },
  "Real Madrid": {
    needs: ["Benzema replacement"],
    situation: "collecting youngsters like Pokemon cards",
  },
};

// Generate narrative for confirmed transfers
function generateConfirmedNarrative(story: AggregatedStory): string {
  const { agreed, disputed } = compareFacts(story.facts);
  const leadFact = story.facts[0];
  const buyingClub = story.primaryClubs[0];
  const sellingClub = story.primaryClubs[1];

  let narrative = "";

  // Check if this is about a pay cut or contract negotiation
  if (leadFact.payCut) {
    // Add aggregation language when multiple sources
    if (story.facts.length > 1) {
      const sources = story.facts.map((f) => f.source.name).slice(0, 3);
      narrative += `Multiple sources - ${sources.join(", ")} - are reporting that ${story.player} is taking a ${leadFact.payCut} pay cut to ${leadFact.contractLength ? "extend at" : "stay at"} ${buyingClub}. `;
    } else {
      narrative += `${story.player} is taking a ${leadFact.payCut} pay cut to ${leadFact.contractLength ? "extend at" : "stay at"} ${buyingClub}. `;
    }
    narrative += `That's right, an actual footballer voluntarily taking less money. In 2025. The world's gone topsy-turvy. `;

    // Add context
    const clubContext = CLUB_CONTEXT[buyingClub];
    if (clubContext) {
      narrative += `Makes sense though - ${buyingClub} ${clubContext.situation}, and ${story.player} clearly values something more than just the zeros in his bank account. Or his agent's having a breakdown. `;
    }

    narrative += `\n\nThe financial sacrifice shows commitment, or desperation, depending on your level of cynicism. `;
    return narrative;
  }

  // Lead paragraph - more variety, less repetition
  const sources = [...new Set(story.facts.map((f) => f.source.name))];

  // Create narrative index based on player name to ensure variety
  const narrativeIndex = story.player.charCodeAt(0) % 8;

  const openingStyles = [
    // Straightforward
    () =>
      `${story.player} to ${buyingClub} is happening. ${sources.length > 1 ? "Multiple sources confirm it." : `${sources[0]} has the scoop.`}`,

    // Romano special
    () =>
      story.facts.some((f) => f.source.name.includes("Romano"))
        ? `Fabrizio's tweeted the magic words for ${story.player} to ${buyingClub}. You know what that means.`
        : `${story.player}'s ${buyingClub} move is done. Contracts signed, hands shaken, everyone's happy.`,

    // Cynical
    () =>
      `Another day, another transfer. ${story.player} swaps ${sellingClub || "his current club"} for ${buyingClub}.`,

    // Club focused
    () =>
      `${buyingClub} have landed ${story.player}. ${CLUB_CONTEXT[buyingClub] ? `They ${CLUB_CONTEXT[buyingClub].situation}, so this might help.` : "Make of that what you will."}`,

    // Player agency
    () => `${story.player} fancied a change of scenery. ${buyingClub} it is.`,

    // Source focused
    () =>
      sources.length > 1
        ? `When ${sources[0]} and ${sources[1]} agree on something, it's probably true. ${story.player} to ${buyingClub}.`
        : `${sources[0]} says ${story.player} to ${buyingClub} is done. Usually reliable.`,

    // Time focused
    () =>
      `${story.player} will be wearing ${buyingClub} colors next season. Deal done.`,

    // Matter of fact
    () => `${buyingClub} sign ${story.player}. That's it. That's the news.`,
  ];

  narrative += openingStyles[narrativeIndex]();

  // Vary what details we include based on the story
  const includeContext = narrativeIndex % 3 !== 2;
  const includeFee = agreed.fee && narrativeIndex % 2 === 0;
  const includeAge = leadFact.age && narrativeIndex % 3 === 1;

  // Sometimes add club context
  if (includeContext) {
    const clubContext = CLUB_CONTEXT[buyingClub];
    if (
      clubContext &&
      leadFact.position &&
      clubContext.needs.includes(leadFact.position)
    ) {
      narrative += ` ${buyingClub} needed a ${leadFact.position}.`;
    }
  }

  // Sometimes mention the fee
  if (includeFee) {
    const feeAmount = parseInt(agreed.fee.match(/\d+/)?.[0] || "0");
    if (feeAmount > 80) {
      narrative += ` ${agreed.fee} is silly money.`;
    } else if (feeAmount > 50) {
      narrative += ` ${agreed.fee}.`;
    } else if (feeAmount < 20) {
      narrative += ` Cheap at ${agreed.fee}.`;
    } else {
      narrative += ` Fee: ${agreed.fee}.`;
    }
  }

  // Sometimes mention age
  if (includeAge && leadFact.age) {
    const age = parseInt(leadFact.age);
    if (age < 23) {
      narrative += ` ${age} years old.`;
    } else if (age > 30) {
      narrative += ` Getting on a bit at ${age}.`;
    }
  }

  // Occasionally add goals
  if (leadFact.currentGoals && narrativeIndex % 4 === 3) {
    narrative += ` ${leadFact.currentGoals} this season.`;
  }

  // Contract details (sometimes skip, sometimes include)
  if (
    (agreed.contractLength || leadFact.contractUntil) &&
    narrativeIndex % 2 === 0
  ) {
    narrative += ` ${agreed.contractLength || `Contract until ${leadFact.contractUntil}`}. `;
  }

  // Vary the ending style based on story details
  const feeValue = agreed.fee
    ? parseFloat(agreed.fee.match(/[\d.]+/)?.[0] || "0")
    : 0;
  const endingIndex = (story.player.charCodeAt(1) || 0) % 6;

  const endingStyles = [
    // No ending - just stop
    () => "",

    // Short factual
    () =>
      `\n\n${agreed.fee || "Fee undisclosed"}. ${agreed.contractLength || "Contract length not confirmed"}.`,

    // Question
    () => `\n\nWill it work out? Ask again in six months.`,

    // Context only
    () => (feeValue > 50 ? "\n\nThat's a lot of money for one human." : ""),

    // Player focused
    () => `\n\n${story.player} gets what he wanted. Fair play.`,

    // Time will tell
    () =>
      sellingClub
        ? `\n\n${sellingClub} will either regret this or count their money laughing. Time will tell.`
        : "",
  ];

  narrative += endingStyles[endingIndex]();

  return narrative;
}

// Generate narrative for ongoing negotiations
function generateNegotiatingNarrative(story: AggregatedStory): string {
  const { agreed, disputed } = compareFacts(story.facts);
  const buyingClub = story.primaryClubs[0];

  const openings = [
    `${story.player} to ${buyingClub} is in that tedious stage where everyone knows it's happening but they're still arguing about who pays for the Uber. `,

    `The ${story.player} to ${buyingClub} saga continues. It's like watching paint dry, except the paint costs £50m and has an agent. `,

    `${story.player} and ${buyingClub} are doing the transfer tango - one step forward, two steps back, everyone pretending they're not desperate. `,

    `Negotiations between ${buyingClub} and ${story.player}'s camp are "ongoing", which is football-speak for "we're miles apart but don't want to admit it". `,
  ];

  let narrative = openings[Math.floor(Math.random() * openings.length)];

  // Sources and their different takes
  const sources = [...new Set(story.facts.map((f) => f.source.name))];
  if (sources.length > 1) {
    const sourceIntros = [
      `\n\n${sources[0]} reckons it's close. ${sources[1]} says it's complicated. Truth is, they're probably both making educated guesses while the actual negotiators argue over lunch options in a Dubai hotel. `,

      `\n\nThe journalism lottery continues: ${sources[0]} says one thing, ${sources[1]} says another. Someone's wrong, someone's guessing, or more likely, someone's agent is playing games. `,

      `\n\nDepending on who you believe - ${sources[0]} or ${sources[1]} - this is either nearly done or barely started. The beauty of transfer journalism: you can say anything if you use enough conditionals. `,
    ];
    narrative += sourceIntros[Math.floor(Math.random() * sourceIntros.length)];
  }

  // Fee negotiations
  if (disputed.fees && disputed.fees.length > 1) {
    narrative += `\n\nThe money? Well, that's where it gets properly silly. `;
    disputed.fees.forEach((fee: string, i: number) => {
      if (i === 0) narrative += `${story.facts[i].source.name} says ${fee}. `;
      else narrative += `${story.facts[i].source.name} reckons it's ${fee}. `;
    });
    narrative += `Someone's lying, someone's guessing, or more likely, they're all talking about different currencies after various bonuses for winning the Ballon d'Or, curing cancer, and teaching Lukaku how to control a football. `;
  } else if (agreed.fee) {
    narrative += `\n\nThe fee's apparently ${agreed.fee}, which in the current market is either daylight robbery or a bargain, depending on whether he can actually play football or just has a good YouTube compilation. `;
  }

  // Why it matters (or doesn't)
  const clubContext = CLUB_CONTEXT[buyingClub];
  if (clubContext) {
    narrative += `\n\n${buyingClub} need this because they ${clubContext.situation}. Whether ${story.player} is the answer to that particular existential crisis remains to be seen. Probably not, but hey, it's transfer season. Logic died sometime around when PSG paid €222m for Neymar. `;
  }

  return narrative;
}

// Generate narrative for interest/monitoring stories
function generateInterestNarrative(story: AggregatedStory): string {
  const interestedClubs = story.primaryClubs;

  const openings = [
    `${story.player} has done something - scored a goal, completed a pass, turned up to training on time - and now `,

    `Someone's drawn a circle around ${story.player}'s name on a whiteboard somewhere, and now `,

    `${story.player} is the latest name on the transfer merry-go-round, and `,

    `Alert the press: ${story.player} exists and plays football, which means `,
  ];

  let narrative = openings[Math.floor(Math.random() * openings.length)];

  if (interestedClubs.length === 1) {
    const singleClubEndings = [
      `${interestedClubs[0]} are "monitoring the situation." That's football speak for "we quite fancy him but haven't got our shit together yet." `,

      `${interestedClubs[0]} are "interested." Which could mean anything from "we've scouted him extensively" to "someone mentioned his name in a meeting once." `,

      `${interestedClubs[0]} have been "alerted to his availability." As if transfers work like eBay notifications. `,
    ];
    narrative +=
      singleClubEndings[Math.floor(Math.random() * singleClubEndings.length)];
  } else {
    const multiClubEndings = [
      `half of Europe are "interested." ${interestedClubs.join(", ")} are all supposedly sniffing around, which probably means their scouts watched the same highlight reel on Twitter. `,

      `we've got a proper transfer rumour bingo. ${interestedClubs.join(", ")} - basically everyone with a scouting department and a Wikipedia page. `,

      `the usual suspects are circling. ${interestedClubs.join(", ")} all want a piece, apparently. Or their names just sound good in a headline. `,
    ];
    narrative +=
      multiClubEndings[Math.floor(Math.random() * multiClubEndings.length)];
  }

  // Add context about likelihood
  if (story.facts.some((f) => f.fee)) {
    const fee = story.facts.find((f) => f.fee)?.fee;
    narrative += `\n\nValuation's apparently around ${fee}, which means it'll end up being twice that plus a friendly against the chairman's son's Sunday league team. `;
  }

  // Reality check
  narrative += `Will anything come of it? Probably not. But that's never stopped anyone before. "Interested" is to transfer news what "participating" is to school sports day - everyone gets a mention, nobody really wins. `;

  return narrative;
}

// Generate narrative for contract extensions
function generateContractNarrative(story: AggregatedStory): string {
  const club = story.primaryClubs[0];
  const contractDetails = story.facts[0];

  let narrative = `${story.player} has signed a new deal at ${club}, because sometimes players actually stay at their clubs. Mad, I know. `;

  if (contractDetails.contractUntil || contractDetails.contractLength) {
    narrative += `\n\nThe contract runs ${contractDetails.contractLength || `until ${contractDetails.contractUntil}`}, which in football terms is basically marriage. `;
  }

  if (contractDetails.age) {
    const age = parseInt(contractDetails.age);
    if (age > 30) {
      narrative += `At ${age}, this is probably his last big contract, unless he fancies a retirement tour of MLS or Saudi Arabia (he will). `;
    } else if (age < 25) {
      narrative += `At ${age}, this won't be his last contract negotiation. Give it two years and his agent will be back, claiming he's being "disrespected" because someone else earns 5p more. `;
    }
  }

  narrative += `\n\n${club} get to keep their player, the player gets more money, the fans get to keep singing his name. Everyone's happy until next summer when Real Madrid come calling and this contract becomes as meaningful as a chocolate teapot. `;

  return narrative;
}

// Main narrative generation function
export function generateGolbyNarrative(story: AggregatedStory): string {
  switch (story.storyType) {
    case "confirmed":
      return generateConfirmedNarrative(story);
    case "negotiating":
      return generateNegotiatingNarrative(story);
    case "interest":
      return generateInterestNarrative(story);
    case "contract":
      return generateContractNarrative(story);
    case "rejected":
      return generateRejectedNarrative(story);
    default:
      return generateInterestNarrative(story); // Fallback
  }
}

// Generate narrative for rejected transfers
function generateRejectedNarrative(story: AggregatedStory): string {
  const rejectingPlayer = story.player;
  const rejectedClub = story.primaryClubs[0];

  let narrative = `${rejectingPlayer} has told ${rejectedClub} to do one, politely of course. Professional football's version of "it's not you, it's me" (it's definitely you). `;

  // Add context about why
  const clubContext = CLUB_CONTEXT[rejectedClub];
  if (clubContext) {
    narrative += `Can't blame him really. ${rejectedClub} ${clubContext.situation}, and that's being generous. `;
  }

  // Sources
  if (story.facts.length > 1) {
    narrative += `\n\n${story.facts[0].source.name} broke it first, ${story.facts[1].source.name} confirmed it, and ${rejectedClub} fans are pretending they never wanted him anyway. Classic. `;
  }

  return narrative;
}

// Helper function to create section headers
export function generateSectionHeader(stories: AggregatedStory[]): string {
  // Use the first story's player name to generate variety
  const seed = stories[0]?.player.charCodeAt(0) || 0;
  const headerIndex = seed % 8;

  const headers = [
    "More Deals",
    "Also Happening",
    "Other Business",
    "Meanwhile",
    "In Other News",
    "Quick Updates",
    "More Movement",
    "Elsewhere",
  ];

  return headers[headerIndex];
}

// Generate a roundup paragraph for multiple lower-tier stories
export function generateRoundupParagraph(stories: AggregatedStory[]): string {
  const clubs = [...new Set(stories.flatMap((s) => s.primaryClubs))];
  const players = stories.map((s) => s.player);

  let narrative =
    "Meanwhile, in today's collection of spurious links and agent-manufactured interest: ";

  // List some players and their situations
  const snippets = stories.slice(0, 3).map((story) => {
    if (story.storyType === "interest") {
      return `${story.player} to ${story.primaryClubs[0]} (they're "monitoring")`;
    } else if (story.storyType === "contract") {
      return `${story.player} extending at ${story.primaryClubs[0]}`;
    } else {
      return `${story.player} doing something somewhere`;
    }
  });

  narrative += snippets.join(", ");

  if (stories.length > 3) {
    narrative += `, and about ${stories.length - 3} other moves that definitely won't happen`;
  }

  narrative +=
    ". The transfer window: where journalism goes to die and agents go to get rich.";

  return narrative;
}
