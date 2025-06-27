# Twitter API Alternatives

## Current Situation

- Twitter v2 API: Only 3 user lookups per 15 minutes (extremely restrictive)
- Nitter: Dead/discontinued
- Rate limit resets at 11:31:13 AM

## Potential Solutions

1. **Use Search API Instead**

   - Search tweets endpoint has higher limits (180 requests/15min for app auth)
   - Can search for "from:FabrizioRomano" directly
   - Better for our use case

2. **Use Streaming API**

   - Real-time updates
   - Different rate limits
   - More suitable for continuous monitoring

3. **Use OAuth 1.0a (User Auth)**

   - We have API key, secret, access token, and access token secret
   - Different rate limits than Bearer token
   - 900 requests per 15-minute window for user timeline

4. **Third-party Services**

   - RapidAPI Twitter endpoints
   - SocialData API
   - Apify Twitter scraper

5. **Schedule Smarter**
   - Cache user IDs to avoid lookups
   - Batch operations
   - Use webhooks where possible

## Recommendation

Switch to using the search API or OAuth 1.0a authentication for better rate limits.
