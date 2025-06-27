#!/usr/bin/env tsx
/**
 * Demo: Terry-Style Transfer Content with Mock Data
 * Shows how TransferJuice formats transfer news
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Mock transfer tweets based on current news
const mockTransferTweets = [
  {
    id: '1',
    text: '🚨 Manchester United make improved bid of £50m for Bryan Mbeumo from Brentford. Personal terms already agreed with the player. Deal progressing well with talks continuing between clubs #MUFC',
    author: { name: 'David Ornstein', handle: '@David_Ornstein' },
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: '2',
    text: '🚨 Brahim Diaz has agreed personal terms with Real Madrid ahead of summer move from Milan. Contract until 2029 ready. Fee around €20m + bonuses. Medical planned for next week, here we go soon! ⚪️🇪🇸',
    author: { name: 'Fabrizio Romano', handle: '@FabrizioRomano' },
    createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
  },
  {
    id: '3',
    text: 'Garnacho drops cryptic Instagram story with 👀 emoji after liking posts about Barcelona interest. His agent was spotted in Catalonia yesterday. Make of that what you will... #MUFC',
    author: { name: 'Mark Goldbridge', handle: '@markgoldbridge' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  }
];

// Terry-style formatter for longer pieces
function formatLongFormStory(tweet: any): string {
  const lines = [];
  
  // Extract details
  const playerMatch = tweet.text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  const player = playerMatch ? playerMatch[0] : 'Some Bloke';
  
  if (tweet.id === '1') {
    // Mbeumo story
    lines.push("**UNITED THROW ANOTHER £50M AT THEIR PROBLEMS**");
    lines.push("");
    lines.push("Manchester United are at it again, chucking money about like confetti at a wedding where nobody really wants the bride and groom to get married. This time it's Bryan Mbeumo they're after, because apparently what they really need is another winger when they can't even get the ball to the ones they've got.");
    lines.push("");
    lines.push("Fifty million pounds. FIFTY. MILLION. POUNDS. For a lad who's scored 8 goals this season. That's £6.25m per goal, which makes each tap-in worth more than most people's entire street. But sure, that's the going rate now, isn't it? Remember when £50m got you a proven world-beater? Now it gets you someone Brentford fans will miss for about a week.");
    lines.push("");
    lines.push("Personal terms are agreed, which is football speak for 'his agent's getting a new boat'. The player himself is probably already mentally decorating his new box at Old Trafford, wondering if he'll get the one with the good prawn sandwiches or the one where the roof leaks.");
    lines.push("");
    lines.push("David Ornstein's reporting this one, so it's probably happening. He doesn't tweet unless he's triple-checked with the tea lady at both clubs. Still, United buying another expensive player who might not fix their actual problems? I'm shocked. Shocked, I tell you.");
  } else if (tweet.id === '2') {
    // Brahim Diaz story
    lines.push("**REAL MADRID DOING THAT THING THEY DO AGAIN**");
    lines.push("");
    lines.push("Oh look, Real Madrid are signing another talented young player for buttons. Brahim Diaz, who they originally sold to Milan for €17m, is coming back for €20m plus some imaginary bonuses that'll probably never get paid. It's like selling your car, watching someone else fix it up nicely, then buying it back for a tiny profit. Except the car is now a Ferrari.");
    lines.push("");
    lines.push("Contract until 2029, because that's how Madrid do business. Sign them young, pay them in prestige and the promise of playing alongside whoever they're going to spend £150m on next summer. Meanwhile, the rest of us are trying to convince players to join with elaborate PowerPoint presentations and promises of 'a project'.");
    lines.push("");
    lines.push("Fabrizio's already warming up his 'here we go', which means this deal is more done than a well-done steak at a vegetarian restaurant. Medical next week, probably just checking he's got two functioning feet and remembers which way the goal is.");
    lines.push("");
    lines.push("The truly painful bit? He'll probably win three Champions Leagues while whoever your club signed for twice the price is posting workout videos on Instagram to prove they're not made of glass.");
  } else if (tweet.id === '3') {
    // Garnacho Instagram story
    lines.push("**GARNACHO DOES AN INSTAGRAM, EVERYONE LOSES THEIR MINDS**");
    lines.push("");
    lines.push("Right, gather round for today's episode of 'Footballer Posts Emoji, Internet Detectives Solve Case'. Alejandro Garnacho has posted eyes on his Instagram story. EYES. That's it. That's the news. And now half of Manchester is convinced he's off to Barcelona while the other half is checking flight tracking websites.");
    lines.push("");
    lines.push("His agent being 'spotted in Catalonia' could mean anything. Maybe he likes the tapas. Maybe he's got a timeshare. Maybe – and stick with me here – he's on holiday. But no, it must mean Garnacho's off to warm his bench at the Nou Camp instead of Old Trafford.");
    lines.push("");
    lines.push("Mark Goldbridge is stirring the pot, because that's his job. 'Make of that what you will,' he says, knowing full well his replies will be 50% 'GLAZERS OUT' and 50% people with Garnacho in their Fantasy team having a nervous breakdown.");
    lines.push("");
    lines.push("The lad liked some posts about Barcelona being interested in him. You know what else he probably liked? Pictures of dogs. Videos of people falling over. That girl from Love Island's bikini photos. Doesn't mean he's signing for any of them.");
    lines.push("");
    lines.push("Marcus Rashford's apparently replied, probably with 'focus on your football m8' or some other revolutionary insight. Because nothing says 'I'm a senior player' like giving social media advice when you've spent half the season being subbed off.");
    lines.push("");
    lines.push("This is what we've become. Grown adults analyzing emoji usage like it's the Enigma code. Alan Turing didn't die for this.");
  }
  
  return lines.join("\n");
}

// Show the demo
function runTerryDemo() {
  console.log('🍹 TransferJuice Terry-Style Content Demo\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  for (const tweet of mockTransferTweets) {
    const timeAgo = getTimeAgo(tweet.createdAt);
    
    console.log(`📰 ${tweet.author.name} ${tweet.author.handle} • ${timeAgo}`);
    console.log(`"${tweet.text}"\n`);
    console.log('Terry\'s Take:');
    console.log('─────────────');
    console.log(formatLongFormStory(tweet));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
  
  // Show enrichment example
  console.log('🎙️ ENRICHED CONTENT EXAMPLE\n');
  console.log('When it\'s quiet, we pad with partner content:\n');
  
  console.log('**WHAT EVERYONE ELSE IS BANGING ON ABOUT**\n');
  console.log('The Upshot Podcast spent 45 minutes discussing whether Mbeumo is worth £50m, which is 44 minutes longer than United\'s scouting department spent on it.');
  console.log('');
  console.log('Meanwhile, The Athletic\'s tactical analysis suggests Garnacho would thrive in Barcelona\'s system, which is journo speak for "we need content and this Instagram story is all we\'ve got".');
  console.log('');
  console.log('Over at TalkSPORT, they\'re debating whether Brahim Diaz is better than Jude Bellingham, because apparently having reasonable takes doesn\'t generate phone-ins from Barry in Basildon.');
  console.log('');
  console.log('And SportBible\'s found a clip of Mbeumo scoring against United in 2019, which they\'re presenting like they\'ve discovered the Dead Sea Scrolls.');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Run it
runTerryDemo();