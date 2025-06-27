#!/usr/bin/env tsx
/**
 * Demo: Terry-Style Transfer Content Generation
 * Shows how to format scraped tweets into proper TransferJuice stories
 */

import { config } from 'dotenv';
import { TwitterClient } from '@/lib/twitter/client';
import { GLOBAL_ITK_SOURCES } from '@/lib/twitter/globalSources';
import { generateTerryCommentary } from '@/lib/ai/terryCommentary';

// Load environment variables
config({ path: '.env.local' });

// Ensure hybrid mode is enabled
process.env.USE_HYBRID_TWITTER = 'true';

// Simple transfer classification for demo
function classifyTransferTweet(text: string) {
  const lowerText = text.toLowerCase();
  const transferKeywords = [
    'transfer', 'signing', 'signed', 'medical', 'fee', 'contract', 'agreement',
    'here we go', 'done deal', 'official', 'confirmed', 'joins', 'loan',
    'negotiations', 'talks', 'interest', 'target', 'bid', 'offer'
  ];
  
  const matches = transferKeywords.filter(keyword => lowerText.includes(keyword));
  const isTransferRelated = matches.length > 0;
  const confidence = Math.min(matches.length * 0.3, 1);
  
  return {
    isTransferRelated,
    confidence,
    keywords: matches
  };
}

// Terry-style story formatter
function formatTransferStory(tweet: any, source: any): string {
  const lines = [];
  
  // Extract key details from tweet
  const playerMatch = tweet.text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
  const feeMatch = tweet.text.match(/[£€]\d+m/);
  const clubsMatch = tweet.text.match(/from ([A-Z][a-z]+(?: [A-Z][a-z]+)?)|to ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/g);
  
  const player = playerMatch ? playerMatch[1] : 'Mystery Player';
  const fee = feeMatch ? feeMatch[0] : 'undisclosed fee';
  
  // Opening line - Terry style
  lines.push(`Right then, here's what ${source.name} is banging on about today.`);
  lines.push('');
  
  // Main story
  if (tweet.text.toLowerCase().includes('medical')) {
    lines.push(`${player} is apparently shuffling off for a medical, which means some poor sod in a white coat gets to prod about at a millionaire's hamstrings for an hour. The fee being chucked about is ${fee}, which is either daylight robbery or a bargain depending on which set of fans you ask.`);
    lines.push('');
    lines.push(`The whole thing should be wrapped up faster than you can say "failed medical", unless of course they actually find something wrong with his knees, in which case we'll all pretend we never wanted him anyway.`);
  } else if (tweet.text.toLowerCase().includes('agreement') || tweet.text.toLowerCase().includes('close')) {
    lines.push(`So ${player} might be on the move for ${fee}, which in today's market is about the same as a decent semi-detached in Zone 4. Personal terms are being "discussed", which is football speak for "his agent wants another yacht".`);
    lines.push('');
    lines.push(`Course, nothing's done until it's done, and we've all seen deals collapse because someone's wife doesn't fancy the local Waitrose. But the ITKs are getting giddy, so make of that what you will.`);
  } else if (tweet.text.toLowerCase().includes('done deal') || tweet.text.toLowerCase().includes('official')) {
    lines.push(`Well, that's that then. ${player} has only gone and done it, hasn't he? ${fee} later and everyone's pretending this was their plan all along. The selling club's fans are either convinced they've been robbed blind or delighted to see the back of him.`);
    lines.push('');
    lines.push(`Expect the usual "always rated him" brigade to come crawling out the woodwork, despite spending the last six months calling him a donkey on Twitter. Football, eh?`);
  } else {
    // Generic transfer rumour padding
    lines.push(`${player} is being linked with a move, because it's that time of year when every player is apparently desperate to leave wherever they are. The numbers being thrown about - ${fee} - are the sort that make normal people weep into their overdrafts.`);
    lines.push('');
    lines.push(`Whether there's anything in it or whether someone's agent just fancies a new contract negotiation is anyone's guess. But here we are, talking about it, so someone's doing their job right.`);
  }
  
  // Add context if it's a single tweet
  lines.push('');
  lines.push(`This nugget comes courtesy of ${source.handle}, who's got a reliability rating of ${(source.reliability * 5).toFixed(1)}/5, which means they're right more often than your mate Dave down the pub, but that's not saying much.`);
  
  // Add some Terry observations
  lines.push('');
  const observations = [
    'The transfer window: where grown men track flight patterns and argue about medical staff competence.',
    'Remember when transfers were announced with a fax machine and a prayer? Simpler times.',
    'Every fan becomes a financial expert during transfer season. Suddenly everyone knows about amortization.',
    'The best part of any transfer is watching rival fans convince themselves they never wanted the player anyway.',
    'Transfer Twitter is 90% people saying "tap in merchant" about journalists and 10% actual news.'
  ];
  lines.push(observations[Math.floor(Math.random() * observations.length)]);
  
  return lines.join('\n');
}

async function demoTerryFormat() {
  console.log('🍹 TransferJuice Content Generation Demo\n');
  console.log('📝 Showing Terry-style formatting for transfer news\n');
  
  const client = TwitterClient.getInstance();
  
  // Get Ornstein as he had recent transfers
  const ornstein = GLOBAL_ITK_SOURCES.find(s => s.handle === '@David_Ornstein');
  
  if (!ornstein) {
    console.error('Could not find David Ornstein in sources');
    return;
  }
  
  try {
    console.log(`Fetching latest from ${ornstein.handle}...\n`);
    
    const username = ornstein.handle.replace('@', '');
    const tweets = await client.getUserTweetsHybrid(username, 20);
    
    // Find transfer tweets
    const transferTweets = tweets.filter(tweet => {
      const classification = classifyTransferTweet(tweet.text);
      return classification.isTransferRelated && classification.confidence > 0.5;
    });
    
    console.log(`Found ${transferTweets.length} transfer-related tweets\n`);
    
    // Format each as a story
    for (let i = 0; i < Math.min(3, transferTweets.length); i++) {
      const tweet = transferTweets[i];
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📰 STORY ${i + 1}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('Original Tweet:');
      console.log(`"${tweet.text.substring(0, 150)}..."\n`);
      
      console.log('Terry-Style Story:');
      console.log('-------------------\n');
      console.log(formatTransferStory(tweet, ornstein));
      console.log('\n');
    }
    
    // Show how we'd pad out a single tweet
    if (transferTweets.length === 1) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 SINGLE TWEET PADDING EXAMPLE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('When we only have one tweet, we can expand it with:');
      console.log('• Background on the player\'s current situation');
      console.log('• Previous transfer history and fees');
      console.log('• Fan reaction and social media sentiment');
      console.log('• Terry\'s take on why this move makes sense (or doesn\'t)');
      console.log('• Related transfers or knock-on effects');
      console.log('• Historical context ("Remember when they signed X for half that?")\n');
      
      console.log('This turns a 280-character tweet into a proper 400-word story.');
    }
    
    // Show enrichment options
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎙️ CONTENT ENRICHMENT OPTIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('For quieter periods, we can add:');
    console.log('• "What The Upshot Podcast said about this..."');
    console.log('• "The Athletic\'s tactical analysis suggests..."');
    console.log('• "According to the stats boffins at Tifo..."');
    console.log('• "Even SportBible noticed this one..."');
    console.log('• "The Football Ramble lads reckon..."');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the demo
demoTerryFormat().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});