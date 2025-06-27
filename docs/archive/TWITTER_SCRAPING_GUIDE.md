# Twitter Scraping Guide for TransferJuice

## Current Twitter/X Situation (June 2025)

Twitter has severely restricted access:
- **API**: 96 requests/day on free tier (useless for monitoring 44 sources)
- **Web Scraping**: Instant detection and blocking
- **Nitter**: Now requires browser verification
- **Public Access**: Only ~3 tweets visible without login

## Our Solution: Authenticated Playwright Scraping

### Setup

1. **Create a Dedicated Twitter Account**
   ```
   - Use a separate email (not your personal one)
   - Complete the profile (bio, avatar, etc.)
   - Follow some accounts to look legitimate
   - Let it age for a few days before heavy use
   ```

2. **Environment Variables**
   ```env
   # .env.local
   TWITTER_AUTH_USERNAME=your_twitter_handle
   TWITTER_AUTH_PASSWORD=your_password
   USE_PLAYWRIGHT_AUTH=true
   ```

3. **Usage**
   ```typescript
   import { createAuthenticatedScraper } from '@/lib/twitter/playwright-scraper-auth';
   
   const scraper = createAuthenticatedScraper(
     process.env.TWITTER_AUTH_USERNAME!,
     process.env.TWITTER_AUTH_PASSWORD!,
     { headless: true }
   );
   
   const tweets = await scraper.scrapeUserTweets('FabrizioRomano', 20);
   ```

### Performance Expectations

- **Speed**: 3-5 seconds per account
- **Reliability**: 95%+ success rate
- **Media**: Full access to images and videos
- **Rate Limits**: None (but don't abuse it)

### Monitoring All 44 ITK Sources

Full scrape time: ~3-4 minutes for all sources

```typescript
// Hourly monitoring script
async function monitorAllSources() {
  const scraper = createAuthenticatedScraper(username, password);
  
  for (const source of GLOBAL_ITK_SOURCES) {
    const tweets = await scraper.scrapeUserTweets(source.handle, 10);
    // Process tweets, generate Terry commentary
    // Store in database
    
    // Random delay to appear human
    await delay(3000 + Math.random() * 2000);
  }
  
  await scraper.close();
}
```

### Best Practices

1. **Avoid Detection**
   - Random delays between requests (3-5 seconds)
   - Vary the number of tweets scraped
   - Don't run 24/7 from the same IP
   - Consider proxy rotation for production

2. **Account Management**
   - Have 2-3 backup accounts ready
   - Monitor for suspicious activity emails
   - Don't use accounts for anything else
   - Rotate accounts weekly

3. **Caching**
   - Cache everything aggressively
   - Tweets don't change after posting
   - Only fetch new tweets (use since_id)
   - Store media URLs locally

### When This Breaks

Twitter will eventually block this too. Have these backups ready:

1. **Manual Curation**: Best long-term solution
2. **Twitter Blue API**: $100/month for 10k requests
3. **Partner Access**: Find someone with enterprise access
4. **Community Sources**: Discord/Telegram/Reddit APIs

### The Reality

Every transfer news aggregator faces this problem. The successful ones:
- Started with scraping
- Built an audience
- Got official API access or pivoted to manual curation
- Or got acquired by someone with access

We're in the "scraping phase" - it works for now, but plan for the future.

### Emergency Fallback

If everything fails, here's the nuclear option:

```typescript
// RSS feeds from news sites (no Twitter needed)
const sources = [
  'https://www.skysports.com/rss/12040', // Sky Sports Football
  'https://feeds.bbci.co.uk/sport/football/rss.xml', // BBC
  'https://www.theguardian.com/football/rss', // Guardian
];

// Parse RSS, filter for transfers, add Terry commentary
// Not as good as ITK tweets but better than nothing
```

## Conclusion

Playwright with authentication is the most reliable solution today. It's not perfect, but it works. Just be prepared to adapt when Twitter inevitably breaks it.