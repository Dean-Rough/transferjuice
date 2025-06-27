/**
 * Test script to verify homepage changes
 */

async function testHomepage() {
  try {
    console.log('Testing homepage modifications...');
    
    // Check if the server is running
    const response = await fetch('http://localhost:4433');
    if (!response.ok) {
      console.error('❌ Server not responding. Please run: npm run dev');
      process.exit(1);
    }
    
    const html = await response.text();
    
    // Check for key indicators
    const hasLiveFeed = html.includes('Live feed') || html.includes('live-feed');
    const hasBriefings = html.includes('briefing') || html.includes('Briefing');
    
    console.log('\n📊 Homepage Analysis:');
    console.log(`- Has Live Feed references: ${hasLiveFeed ? '✅' : '❌'}`);
    console.log(`- Has Briefing references: ${hasBriefings ? '✅' : '❌'}`);
    
    if (hasLiveFeed) {
      console.log('\n✅ LiveFeedContainer appears to be loading!');
      console.log('📍 Next step: Check for import errors in browser console');
    } else if (hasBriefings) {
      console.log('\n⚠️  Still showing briefings - LiveFeedContainer may not be connected');
      console.log('📍 Check src/app/page.tsx to ensure LiveFeedContainer is imported');
    }
    
  } catch (error) {
    console.error('❌ Error testing homepage:', error);
    console.log('\n💡 Make sure the dev server is running: npm run dev');
  }
}

testHomepage();