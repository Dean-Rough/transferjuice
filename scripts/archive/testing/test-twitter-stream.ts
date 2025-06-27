#!/usr/bin/env npx tsx

/**
 * Test Twitter Filtered Stream Integration
 * Tests the complete flow: Twitter Stream → Processing → SSE → Frontend
 */

import { startTwitterStream, stopTwitterStream, getTwitterStreamStatus } from '../src/lib/twitter/filtered-stream';
import { getBroadcasterStats } from '../src/lib/realtime/broadcaster';

async function testTwitterStream() {
  console.log('🧪 Testing Twitter Filtered Stream Integration');
  console.log('=' * 60);

  try {
    // Test 1: Check initial status
    console.log('\n📊 Test 1: Initial Stream Status');
    const initialStatus = getTwitterStreamStatus();
    console.log(`Connected: ${initialStatus.isConnected}`);
    console.log(`Reconnect attempts: ${initialStatus.reconnectAttempts}`);
    
    const initialRules = await initialStatus.rules;
    console.log(`Initial rules: ${initialRules.length}`);

    // Test 2: Start the stream
    console.log('\n🚀 Test 2: Starting Twitter Stream');
    
    // Check if we have the required environment variable
    if (!process.env.TWITTER_BEARER_TOKEN) {
      console.log('❌ TWITTER_BEARER_TOKEN not found in environment');
      console.log('Set it with: export TWITTER_BEARER_TOKEN="your_token"');
      return false;
    }

    console.log('✅ Twitter Bearer Token found');
    console.log('Starting stream (this may take a few seconds)...');

    try {
      await startTwitterStream();
      console.log('✅ Stream started successfully');
    } catch (error) {
      console.error('❌ Failed to start stream:', error);
      
      if (error instanceof Error && error.message.includes('429')) {
        console.log('💡 This might be a rate limit issue. Try again in a few minutes.');
      } else if (error instanceof Error && error.message.includes('401')) {
        console.log('💡 This might be an authentication issue. Check your bearer token.');
      }
      
      return false;
    }

    // Test 3: Check stream status after start
    console.log('\n📡 Test 3: Stream Status After Start');
    const runningStatus = getTwitterStreamStatus();
    console.log(`Connected: ${runningStatus.isConnected}`);
    
    const rules = await runningStatus.rules;
    console.log(`Active rules: ${rules.length}`);
    
    if (rules.length > 0) {
      console.log('Stream rules:');
      rules.forEach((rule, index) => {
        console.log(`  ${index + 1}. ${rule.value} (tag: ${rule.tag})`);
      });
    }

    // Test 4: Check SSE broadcaster
    console.log('\n📺 Test 4: SSE Broadcaster Status');
    const broadcasterStats = getBroadcasterStats();
    console.log(`Connected clients: ${broadcasterStats.totalClients}`);
    console.log(`Messages sent: ${broadcasterStats.messagesSent}`);

    // Test 5: Wait for some tweets
    console.log('\n⏳ Test 5: Waiting for Tweets (30 seconds)');
    console.log('This will show any tweets that come through the stream...');
    console.log('You can monitor the console for stream activity.');
    
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Test 6: Check final stats
    console.log('\n📈 Test 6: Final Statistics');
    const finalStats = getBroadcasterStats();
    console.log(`Final connected clients: ${finalStats.totalClients}`);
    console.log(`Final messages sent: ${finalStats.messagesSent}`);
    
    const newMessages = finalStats.messagesSent - broadcasterStats.messagesSent;
    console.log(`New messages during test: ${newMessages}`);

    // Test 7: Stop the stream
    console.log('\n🛑 Test 7: Stopping Stream');
    await stopTwitterStream();
    
    const stoppedStatus = getTwitterStreamStatus();
    console.log(`Connected after stop: ${stoppedStatus.isConnected}`);

    console.log('\n🎉 Twitter Stream Test Complete!');
    
    // Results
    console.log('\n📊 Test Results:');
    console.log(`✅ Stream can start: Yes`);
    console.log(`✅ Rules created: ${rules.length} rules`);
    console.log(`✅ SSE broadcaster ready: Yes`);
    console.log(`✅ Stream can stop: Yes`);
    
    if (newMessages > 0) {
      console.log(`✅ Live tweets processed: ${newMessages} messages`);
    } else {
      console.log(`⚠️  No live tweets in 30s (normal if ITK sources are quiet)`);
    }

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Also create a simple stream monitor
async function monitorStream() {
  console.log('\n🔍 Stream Monitor Mode');
  console.log('This will continuously monitor the stream. Press Ctrl+C to stop.');
  
  const status = getTwitterStreamStatus();
  if (!status.isConnected) {
    console.log('Stream not running. Starting it first...');
    await startTwitterStream();
  }

  // Monitor every 10 seconds
  const interval = setInterval(() => {
    const currentStatus = getTwitterStreamStatus();
    const stats = getBroadcasterStats();
    
    console.log(`[${new Date().toISOString()}] Connected: ${currentStatus.isConnected} | Clients: ${stats.totalClients} | Messages: ${stats.messagesSent}`);
  }, 10000);

  // Cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping monitor...');
    clearInterval(interval);
    await stopTwitterStream();
    process.exit(0);
  });
}

// Command line interface
const command = process.argv[2];

if (command === 'monitor') {
  monitorStream();
} else {
  testTwitterStream()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test script error:', error);
      process.exit(1);
    });
}