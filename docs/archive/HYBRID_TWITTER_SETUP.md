# Hybrid Twitter Setup Guide

## Overview

The TransferJuice hybrid Twitter client uses @the-convocation/twitter-scraper as the primary method for fetching tweets, with the official Twitter API v2 as a fallback. This approach helps avoid rate limits while maintaining reliability.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @the-convocation/twitter-scraper twitter-api-v2
```

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Twitter API (existing)
TWITTER_BEARER_TOKEN=your_bearer_token_here

# Twitter Scraper (new)
TWITTER_SCRAPER_USERNAME=your_burner_account
TWITTER_SCRAPER_PASSWORD=your_password
USE_HYBRID_TWITTER=true
```

### 3. Create a Burner Account

1. Create a new Twitter/X account specifically for scraping
2. Use a separate email address
3. Complete the profile to avoid looking like a bot
4. Follow a few accounts to appear legitimate
5. **Important**: Don't use your main account - scraping violates Twitter ToS

## Architecture

```
TwitterClient (main)
    ↓
HybridTwitterClient
    ├── Scraper (primary)
    │   └── @the-convocation/twitter-scraper
    └── API Fallback
        └── Twitter API v2
```

### How It Works

1. **First Attempt**: Uses the scraper to fetch tweets
2. **On Failure**: Increments failure counter
3. **After 3 Failures**: Switches to API-only mode
4. **Automatic**: No code changes needed in existing codebase

## Usage

### Basic Usage

```typescript
// Existing code works without changes
const client = TwitterClient.getInstance();
const timeline = await client.getUserTimeline(userId, { username });
```

### Direct Hybrid Usage

```typescript
// New hybrid method
const tweets = await client.getUserTweetsHybrid('FabrizioRomano', 20);
```

### Check Status

```typescript
const status = client.getHybridStatus();
console.log(status);
// { scraperAvailable: true, failureCount: 0, mode: 'hybrid' }
```

## Testing

Run the test script to verify your setup:

```bash
npx tsx scripts/test-hybrid-twitter.ts
```

## Rate Limits Comparison

| Method | Rate Limit | Reset Time | Best For |
|--------|------------|------------|----------|
| Twitter API | 15 req/15min per endpoint | 15 minutes | Official access |
| Scraper | No hard limit* | N/A | Bulk fetching |
| Apify | 100 requests/month (free) | Monthly | Backup option |

*Scraper can still be rate-limited or blocked if used aggressively

## Troubleshooting

### Scraper Login Fails

1. Check credentials are correct
2. Ensure account isn't locked/suspended
3. Try logging in manually first
4. May need to complete CAPTCHA

### API Fallback Not Working

1. Verify TWITTER_BEARER_TOKEN is valid
2. Check API rate limits haven't been exceeded
3. Ensure bearer token starts with "AAAAAAA"

### Both Methods Fail

1. Check internet connection
2. Verify Twitter/X isn't down
3. Try with a different username
4. Check if account is private

## Best Practices

1. **Don't Overuse**: Even without hard limits, be respectful
2. **Cache Results**: Store fetched tweets to reduce requests
3. **Monitor Failures**: Track scraper reliability
4. **Have Backups**: Keep Apify as additional fallback
5. **Rotate Accounts**: Consider multiple scraper accounts

## Security Notes

- Never commit scraper credentials to git
- Use separate email for burner accounts  
- Don't link burner accounts to your main identity
- Consider using app-specific passwords
- Monitor for account suspensions

## Next Steps

1. Implement reply fetching for full conversations
2. Add media download capabilities
3. Create metrics dashboard for monitoring
4. Set up account rotation system
5. Implement caching layer