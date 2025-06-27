/**
 * Test Feed API Endpoint
 * Verifies /api/feed returns data for LiveFeedContainer
 */

async function testFeedAPI() {
  console.log('🔍 Testing Feed API...\n');
  
  try {
    const response = await fetch('http://localhost:4433/api/feed?limit=20');
    
    if (!response.ok) {
      console.error(`❌ Feed API returned ${response.status}: ${response.statusText}`);
      console.log('\n💡 Make sure dev server is running: npm run dev');
      process.exit(1);
    }
    
    const data = await response.json();
    
    console.log('✅ Feed API Response:');
    console.log(`- Success: ${data.success}`);
    console.log(`- Items: ${data.data?.length || 0}`);
    console.log(`- Has cursor: ${!!data.cursor}`);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📋 Sample Feed Item:');
      const item = data.data[0];
      console.log(`- ID: ${item.id}`);
      console.log(`- Type: ${item.type}`);
      console.log(`- Content: ${item.content?.substring(0, 50)}...`);
      console.log(`- Has Terry Commentary: ${!!item.terryCommentary}`);
      console.log(`- Tags: ${item.tags?.length || 0}`);
      console.log(`- Source: ${item.source?.name || 'Unknown'}`);
    } else {
      console.log('\n⚠️  No feed items found');
      console.log('This might be normal if no data has been generated yet');
    }
    
    console.log('\n✅ Feed API is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing feed API:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure dev server is running: npm run dev');
    console.log('2. Check server logs for errors');
    console.log('3. Verify database connection');
  }
}

testFeedAPI();