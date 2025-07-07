// Manual trigger for RSS briefing generation
// Usage: npm run briefing:trigger

async function triggerRSSBriefing() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:4433';
    
    const url = `${baseUrl}/api/cron/rss-briefing`;
    
    console.log(`🚀 Triggering RSS briefing at ${url}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ RSS Briefing triggered successfully!');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Failed to trigger RSS briefing:', error);
  }
}

triggerRSSBriefing();