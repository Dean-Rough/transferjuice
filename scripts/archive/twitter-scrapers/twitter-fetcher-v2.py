#!/usr/bin/env python3
"""
Twitter Fetcher v2 - Simplified ITK Tweet Collector
Based on Tweepy v4 best practices
"""

import os
import json
import logging
import time
from datetime import datetime
from pathlib import Path
import tweepy
from apscheduler.schedulers.blocking import BlockingScheduler

# Configure logging
log_format = "%(asctime)s [%(levelname)s] %(message)s"
logging.basicConfig(level=logging.INFO, format=log_format)
logger = logging.getLogger(__name__)

# Twitter API credentials via environment variables
twitter_bearer = os.getenv('TWITTER_BEARER_TOKEN')
if not twitter_bearer:
    logger.error('TWITTER_BEARER_TOKEN not set')
    raise SystemExit(1)

# File to persist last seen IDs
STATE_FILE = 'last_seen.json'

# List of target accounts by handle
ACCOUNTS = [
    'FabrizioRomano', 'David_Ornstein', 'SamLee', '_pauljoyce', 'lauriewhitwell',
    'RobDawsonESPN', 'LukeEdwardsTele', 'JPercyTelegraph', 'CraigHope_DM',
    'DeanJonesSoccer', 'SirayahShiraz', 'BouhafsiMohamed', 'DiMarzio', 'alfredopedulla', 'honigstein'
]

# Directory to save fetched data
OUT_DIR = 'tweets'

# Initialize Tweepy client
client = tweepy.Client(
    bearer_token=twitter_bearer,
    wait_on_rate_limit=True  # Auto-wait on rate limits
    # Note: Using default return_type for proper Response objects
)

def load_state():
    """Load last seen tweet IDs from state file"""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading {STATE_FILE}: {e}")
    return {}

def save_state(state):
    """Save last seen tweet IDs to state file"""
    try:
        with open(STATE_FILE, 'w') as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving {STATE_FILE}: {e}")

def get_user_id(username):
    """Get Twitter user ID from username"""
    try:
        user = client.get_user(username=username)
        if user and user.data:
            return user.data['id']
        else:
            logger.error(f"User @{username} not found")
            return None
    except Exception as e:
        logger.error(f"Error getting user ID for @{username}: {e}")
        return None

def fetch_tweets_for_user(username, since_id=None):
    """Fetch recent tweets for a specific user"""
    user_id = get_user_id(username)
    if not user_id:
        return []
    
    try:
        logger.info(f"Fetching tweets for @{username} (ID: {user_id})")
        
        # Fetch tweets with media expansions
        response = client.get_users_tweets(
            id=user_id,
            since_id=since_id,
            max_results=100,  # Max for user timeline
            tweet_fields=[
                'created_at', 'text', 'author_id', 'public_metrics',
                'entities', 'context_annotations', 'possibly_sensitive'
            ],
            expansions=[
                'attachments.media_keys',
                'author_id'
            ],
            media_fields=[
                'url', 'preview_image_url', 'type', 'alt_text',
                'height', 'width'
            ],
            user_fields=['username', 'name', 'verified'],
            exclude=['retweets', 'replies']  # Original tweets only
        )
        
        if not response.data:
            logger.info(f"  → No new tweets for @{username}")
            return []
        
        tweets = []
        media_dict = {}
        
        # Build media lookup if present
        if response.includes and 'media' in response.includes:
            for media in response.includes['media']:
                media_dict[media['media_key']] = {
                    'type': media.get('type'),
                    'url': media.get('url'),
                    'preview_url': media.get('preview_image_url'),
                    'alt_text': media.get('alt_text'),
                    'width': media.get('width'),
                    'height': media.get('height')
                }
        
        # Process each tweet
        for tweet in response.data:
            tweet_data = {
                'id': tweet['id'],
                'text': tweet['text'],
                'created_at': tweet['created_at'],
                'author': {
                    'username': username,
                    'id': tweet['author_id']
                },
                'metrics': tweet.get('public_metrics', {}),
                'entities': tweet.get('entities', {}),
                'context': tweet.get('context_annotations', []),
                'media': []
            }
            
            # Add media if present
            if 'attachments' in tweet and 'media_keys' in tweet['attachments']:
                for media_key in tweet['attachments']['media_keys']:
                    if media_key in media_dict:
                        tweet_data['media'].append(media_dict[media_key])
            
            tweets.append(tweet_data)
        
        logger.info(f"  → Found {len(tweets)} new tweets for @{username}")
        return tweets
        
    except Exception as e:
        logger.error(f"Error fetching tweets for @{username}: {e}")
        return []

def main_fetch():
    """Main fetch routine - called by scheduler"""
    logger.info("=" * 60)
    logger.info(f"Starting tweet fetch at {datetime.now()}")
    
    # Load state
    state = load_state()
    
    # Ensure output directory exists
    Path(OUT_DIR).mkdir(exist_ok=True)
    
    all_tweets = []
    new_state = state.copy()
    
    # Fetch from each account
    for username in ACCOUNTS:
        since_id = state.get(username)
        tweets = fetch_tweets_for_user(username, since_id)
        
        if tweets:
            all_tweets.extend(tweets)
            # Update state with most recent tweet ID
            new_state[username] = tweets[0]['id']  # Most recent is first
    
    # Save tweets if any were found
    if all_tweets:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = Path(OUT_DIR) / f'tweets_{timestamp}.json'
        
        output_data = {
            'timestamp': timestamp,
            'fetch_time': datetime.now().isoformat(),
            'tweet_count': len(all_tweets),
            'accounts': ACCOUNTS,
            'tweets': all_tweets
        }
        
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2, default=str)
        
        logger.info(f"Saved {len(all_tweets)} tweets to {output_file}")
    else:
        logger.info("No new tweets found in this fetch cycle")
    
    # Save updated state
    save_state(new_state)
    
    logger.info("Fetch cycle complete")
    logger.info("=" * 60)

def main():
    """Main entry point"""
    logger.info("Twitter Fetcher v2 Starting")
    logger.info(f"Monitoring {len(ACCOUNTS)} accounts")
    logger.info(f"Output directory: {OUT_DIR}")
    
    # Run immediately
    main_fetch()
    
    # Set up hourly scheduler
    scheduler = BlockingScheduler()
    scheduler.add_job(main_fetch, 'interval', hours=1, id='twitter_fetch')
    
    logger.info("Scheduler started - fetching every hour")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Fetcher stopped by user")
        scheduler.shutdown()

if __name__ == "__main__":
    main()