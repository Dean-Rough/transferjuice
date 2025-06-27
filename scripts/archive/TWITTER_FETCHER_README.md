# Twitter Fetcher - ITK Tweet Collector

## Overview

This Python script fetches new tweets from Tier 1 ITK sources every hour using the Twitter API v2 via Tweepy. It maintains state to avoid refetching tweets and saves all new content to timestamped JSON files.

## Features

- **Stateful fetching**: Tracks last seen tweet ID per account in `last_seen.json`
- **Media support**: Fetches tweet images and media attachments
- **Hourly scheduling**: Runs automatically every hour using APScheduler
- **JSON output**: Saves tweets to timestamped files in `tweet_data/` directory
- **15 Tier 1 ITK sources**: Pre-configured with reliability scores

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements-twitter-fetcher.txt
   # or directly:
   pip install tweepy apscheduler
   ```

2. **Set environment variable**:
   ```bash
   export TWITTER_BEARER_TOKEN="your_bearer_token_here"
   ```

3. **Run the fetcher**:
   ```bash
   python twitter-fetcher.py
   ```

## Output Format

Tweets are saved to `tweet_data/tweets_YYYYMMDD_HHMMSS.json` with this structure:

```json
{
  "timestamp": "20250623_210000",
  "tweet_count": 42,
  "sources": ["FabrizioRomano", "David_Ornstein", ...],
  "tweets": [
    {
      "id": "1234567890",
      "text": "BREAKING: Player X to Club Y, here we go! 🔴⚪",
      "created_at": "2025-06-23T21:00:00Z",
      "author": {
        "username": "FabrizioRomano",
        "name": "Fabrizio Romano",
        "reliability": 0.95
      },
      "metrics": {
        "retweet_count": 1000,
        "reply_count": 500,
        "like_count": 5000,
        "quote_count": 200
      },
      "media": [
        {
          "type": "photo",
          "url": "https://pbs.twimg.com/...",
          "preview_url": "https://pbs.twimg.com/...",
          "alt_text": "Player signing contract"
        }
      ]
    }
  ]
}
```

## Monitored Sources

All 15 Tier 1 ITK sources from your list:
- Fabrizio Romano (@FabrizioRomano)
- David Ornstein (@David_Ornstein)
- Gianluca Di Marzio (@DiMarzio)
- Sam Lee (@SamLee)
- Paul Joyce (@_pauljoyce)
- Laurie Whitwell (@lauriewhitwell)
- Rob Dawson (@RobDawsonESPN)
- Luke Edwards (@LukeEdwardsTele)
- John Percy (@JPercyTelegraph)
- Craig Hope (@CraigHope_DM)
- Dean Jones (@DeanJonesSoccer)
- Sirayah Shiraz (@SirayahShiraz)
- Mohamed Bouhafsi (@BouhafsiMohamed)
- Alfredo Pedulla (@alfredopedulla)
- Raphael Honigstein (@honigstein)

## Integration with TransferJuice

The JSON files can be consumed by the briefing generator:

1. Read latest tweet file from `tweet_data/`
2. Process through Terry's classification system
3. Generate briefings with real tweets instead of hitting rate limits

## Customization

- **Add sources**: Edit the `ITK_SOURCES` dictionary in the script
- **Change interval**: Modify `hours=1` in the scheduler setup
- **Output format**: Adjust the `processed_tweets` structure
- **Output directory**: Change `OUTPUT_DIR` variable

## Running as a Service

For production use, consider:
- Running via systemd on Linux
- Using a process manager like supervisor
- Deploying to a cloud service with cron
- Setting up proper logging rotation

## Rate Limits

Twitter API v2 rate limits:
- User timeline: 1500 requests per 15 minutes (app-level)
- That's ~100 requests per minute
- With 15 sources, we use 15 requests per hour
- Well within limits even with hourly fetching