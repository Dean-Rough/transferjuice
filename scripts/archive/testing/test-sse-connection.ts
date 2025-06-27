/**
 * Test SSE Connection for Live Feed
 * Step 1.4 from the roadmap
 */

import { EventSource } from 'eventsource';

async function testSSEConnection() {
  console.log('🔌 Testing SSE Connection...\n');
  
  const url = 'http://localhost:4433/api/live-feed';
  console.log(`Connecting to: ${url}`);
  
  const eventSource = new EventSource(url);
  
  eventSource.onopen = () => {
    console.log('✅ SSE connected successfully!');
    console.log('📡 Waiting for messages...\n');
  };
  
  eventSource.onmessage = (event) => {
    console.log('📨 Received message:');
    console.log(`   Type: ${event.type || 'message'}`);
    console.log(`   Data: ${event.data}`);
    console.log('');
  };
  
  eventSource.addEventListener('feed-update', (event: any) => {
    console.log('🔄 Feed Update Event:');
    console.log(`   Data: ${event.data}`);
    console.log('');
  });
  
  eventSource.addEventListener('breaking-news', (event: any) => {
    console.log('🚨 Breaking News Event:');
    console.log(`   Data: ${event.data}`);
    console.log('');
  });
  
  eventSource.addEventListener('connection-count', (event: any) => {
    console.log('👥 Connection Count Update:');
    console.log(`   Data: ${event.data}`);
    console.log('');
  });
  
  eventSource.onerror = (error) => {
    console.error('❌ SSE connection error:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure dev server is running: npm run dev');
    console.log('2. Check /api/live-feed endpoint exists');
    console.log('3. Look for errors in server console');
    eventSource.close();
    process.exit(1);
  };
  
  // Keep connection open for 30 seconds
  console.log('⏱️  Will monitor for 30 seconds...\n');
  
  setTimeout(() => {
    console.log('\n✅ Test complete - closing connection');
    eventSource.close();
    process.exit(0);
  }, 30000);
}

// Check if eventsource is installed
try {
  require('eventsource');
} catch {
  console.error('❌ eventsource package not installed');
  console.log('📦 Installing: npm install eventsource');
  process.exit(1);
}

testSSEConnection();