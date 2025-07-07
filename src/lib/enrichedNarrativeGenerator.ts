import { generateTerryComment } from "./terry";

interface EnrichedContext {
  currentForm?: string;
  recentStats?: string;
  injuryStatus?: string;
  transferContext?: string;
}

// Generate enriched narrative with current context
export async function generateEnrichedNarrative(
  playerName: string,
  tweetText: string,
  isContract: boolean = false
): Promise<string> {
  // Extract basic info from tweet
  const feeMatch = tweetText.match(/[€£$](\d+(?:\.\d+)?m(?:illion)?)/i);
  const fee = feeMatch ? feeMatch[0] : null;
  
  const yearMatch = tweetText.match(/until (\d{4})|(\d{4}) contract|(\d+)yr|(\d+)-year/i);
  const contractLength = yearMatch ? (yearMatch[1] || yearMatch[2] || yearMatch[3] || yearMatch[4]) : null;
  
  // Extract any stats mentioned in the tweet itself
  const goalsMatch = tweetText.match(/(\d+)\s+goals?\s+(?:this season|in \d+ games?)/i);
  const currentGoals = goalsMatch ? goalsMatch[0] : null;
  
  const ageMatch = tweetText.match(/(\d{2})(?:-year-old|yo)/i);
  const age = ageMatch ? ageMatch[1] : null;
  
  // Build narrative based on available info
  let narrative = "";
  
  if (isContract) {
    narrative = `So ${playerName} has decided to ${tweetText.includes("new") ? "commit their future" : "stick around"}, then. `;
    
    if (age) {
      narrative += `At ${age}, ${parseInt(age) > 30 ? "they're hardly in the first flush of youth, but football's ageism only applies to those who can't still do the business" : "they've got their peak years ahead of them, assuming knees and hamstrings cooperate"}. `;
    }
    
    if (contractLength) {
      if (contractLength.length === 4) {
        narrative += `The deal runs until ${contractLength}, which in football terms might as well be a lifetime commitment. `;
      } else {
        narrative += `${contractLength} more years of watching this particular millionaire ply their trade. `;
      }
    }
    
    if (fee) {
      narrative += `And for ${fee}? That's a lot of zeros for someone who, let's be honest, kicks a ball around for a living. Still, market forces and all that. `;
    }
    
    if (currentGoals) {
      narrative += `With ${currentGoals}, they're certainly earning their corn. `;
    }
    
    // Add context about the player from the tweet
    if (tweetText.includes("key player") || tweetText.includes("important")) {
      narrative += `Apparently they're a 'key player' - football speak for 'we'd be properly stuffed without them'. `;
    }
    
    if (tweetText.includes("international")) {
      narrative += `International pedigree too, because nothing validates a footballer quite like occasionally wearing their country's shirt. `;
    }
    
    if (tweetText.includes("captain") || tweetText.includes("leader")) {
      narrative += `They've got the armband as well, which means they get to shout at referees with impunity and give post-match interviews full of clichés. Living the dream. `;
    }
    
    return narrative + `The suits upstairs will be patting themselves on the back for this one, while the rest of us wonder if loyalty in football died sometime around 1992.`;
  }
  
  // For transfer stories
  if (tweetText.includes("here we go")) {
    narrative = `Well, well, well. ${playerName} is happening, apparently. Fabrizio's given it the old 'here we go' treatment, which means it's more done than a Sunday roast at 3pm. `;
    
    if (fee) {
      narrative += `For ${fee}, no less. That's approximately 47,000 season tickets, but who's counting? `;
    }
    
    if (currentGoals) {
      narrative += `${currentGoals} suggests they might actually be worth a punt, though in this market a decent YouTube compilation could get you a £20m move. `;
    }
    
    narrative += `Medical booked, contracts drafted, and another chapter in the beautiful game's never-ending money carousel. You have to admire the theatre of it all - grown men in suits haggling over millions while the rest of us check our bank balance before buying a coffee.`;
    
    return narrative;
  }
  
  // For interest/monitoring stories
  if (tweetText.includes("interested") || tweetText.includes("monitoring")) {
    narrative = `${playerName} is the latest name doing the rounds, because transfer windows wouldn't be complete without linking every player to every club at least once. `;
    
    if (age) {
      narrative += `At ${age}, they're ${parseInt(age) < 25 ? "young enough for the 'potential' tax" : parseInt(age) > 30 ? "getting a bit long in the tooth for a big move, but football's full of late bloomers" : "in that sweet spot where experience meets ability"}. `;
    }
    
    narrative += `'Monitoring the situation' they say, which is football-speak for 'we quite fancy them but haven't got our act together yet'. `;
    
    if (fee) {
      narrative += `With ${fee} being mentioned, it's enough to make your eyes water. Remember when that would have bought you an entire team? `;
    }
    
    narrative += `Will they? Won't they? The suspension is killing absolutely nobody, but here we are, refreshing our feeds like addicts anyway.`;
    
    return narrative;
  }
  
  // Generic transfer narrative
  narrative = `More movement in the market as ${playerName} finds themselves at the center of today's speculation. `;
  
  if (age && currentGoals) {
    narrative += `${age} years old with ${currentGoals} - decent numbers in anyone's book, though stats are like bikinis: what they reveal is suggestive, but what they conceal is vital. `;
  } else if (age) {
    narrative += `At ${age}, they're ${parseInt(age) < 23 ? "still young enough to be called 'promising'" : "experienced enough to know better"}. `;
  }
  
  if (fee) {
    narrative += `With ${fee} being bandied about, it's another reminder that football's financial reality left actual reality behind sometime in the early 2000s. `;
  }
  
  // Add position-specific commentary if mentioned
  if (tweetText.includes("striker") || tweetText.includes("forward")) {
    narrative += `Strikers, eh? Score a few goals and suddenly everyone wants you. Miss a few sitters and you're yesterday's news. `;
  } else if (tweetText.includes("defender") || tweetText.includes("centre-back")) {
    narrative += `Defenders don't get the glory, but they do get to boot strikers up in the air and call it 'game management'. `;
  } else if (tweetText.includes("midfielder")) {
    narrative += `Midfielders - the engine room, apparently, though most engines don't cost £50m and throw tantrums when substituted. `;
  } else if (tweetText.includes("goalkeeper")) {
    narrative += `Goalkeepers are a different breed - you need a special kind of madness to voluntarily stand in front of things flying at 70mph. `;
  }
  
  return narrative + `Still, we watch, we wait, and we pretend to be surprised when millionaires move between millionaire clubs for millionaire fees. The beautiful game, ladies and gentlemen.`;
}