#!/usr/bin/env python3
"""
Twitter Fetcher - Hourly ITK Tweet Collector
Fetches new tweets from configured ITK sources using Tweepy v2 API
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
import tweepy
from apscheduler.schedulers.blocking import BlockingScheduler

# Configure logging
log_format = "%(asctime)s [%(levelname)s] %(message)s"
logging.basicConfig(level=logging.INFO, format=log_format)
logger = logging.getLogger(__name__)

# Twitter API credentials via environment variables
TWITTER_BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN')
if not TWITTER_BEARER_TOKEN:
    raise ValueError("TWITTER_BEARER_TOKEN environment variable not set")

# Configuration
LAST_SEEN_FILE = "last_seen.json"
OUTPUT_DIR = Path("tweet_data")
OUTPUT_DIR.mkdir(exist_ok=True)

# ITK Sources to monitor (from your tier 1 list)
ITK_SOURCES = {
    "FabrizioRomano": {"name": "Fabrizio Romano", "reliability": 0.95},
    "David_Ornstein": {"name": "David Ornstein", "reliability": 0.93},
    "DiMarzio": {"name": "Gianluca Di Marzio", "reliability": 0.91},
    "SamLee": {"name": "Sam Lee", "reliability": 0.92},
    "_pauljoyce": {"name": "Paul Joyce", "reliability": 0.91},
    "lauriewhitwell": {"name": "Laurie Whitwell", "reliability": 0.90},
    "RobDawsonESPN": {"name": "Rob Dawson", "reliability": 0.89},
    "LukeEdwardsTele": {"name": "Luke Edwards", "reliability": 0.88},
    "JPercyTelegraph": {"name": "John Percy", "reliability": 0.90},
    "CraigHope_DM": {"name": "Craig Hope", "reliability": 0.87},
    "DeanJonesSoccer": {"name": "Dean Jones", "reliability": 0.86},
    "SirayahShiraz": {"name": "Sirayah Shiraz", "reliability": 0.85},
    "BouhafsiMohamed": {"name": "Mohamed Bouhafsi", "reliability": 0.90},
    "alfredopedulla": {"name": "Alfredo Pedulla", "reliability": 0.88},
    "honigstein": {"name": "Raphael Honigstein", "reliability": 0.89},
}

class TwitterFetcher:
    def __init__(self):
        """Initialize Twitter client and load last seen IDs"""
        # Initialize client with rate limit handling
        self.client = tweepy.Client(
            bearer_token=TWITTER_BEARER_TOKEN,
            wait_on_rate_limit=True,  # Automatically wait when rate limited
            return_type=dict  # Return responses as dictionaries for easier processing
        )
        self.last_seen = self.load_last_seen()
        
    def load_last_seen(self):
        """Load last seen tweet IDs from file"""
        if os.path.exists(LAST_SEEN_FILE):
            try:
                with open(LAST_SEEN_FILE, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading last_seen.json: {e}")
                return {}
        return {}
    
    def save_last_seen(self):
        """Save last seen tweet IDs to file"""
        try:
            with open(LAST_SEEN_FILE, 'w') as f:
                json.dump(self.last_seen, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving last_seen.json: {e}")
    
    def fetch_user_tweets(self, username, since_id=None):
        """Fetch tweets for a specific user since last seen ID"""
        try:
            # Get user ID first with error handling
            user = self.client.get_user(username=username)
            if not user or not user.data:
                logger.error(f"User @{username} not found")
                return []
            
            user_id = user.data.id
            logger.debug(f"Found user @{username} with ID {user_id}")
            
            # Fetch tweets with expansions for media (following Tweepy v4 best practices)
            tweets = self.client.get_users_tweets(
                id=user_id,
                since_id=since_id,
                max_results=100,  # Max allowed per request for user timeline
                tweet_fields=[
                    'created_at', 'text', 'author_id', 'conversation_id', 
                    'entities', 'public_metrics', 'context_annotations',
                    'referenced_tweets', 'possibly_sensitive'
                ],
                expansions=[
                    'attachments.media_keys', 
                    'author_id', 
                    'referenced_tweets.id',
                    'attachments.poll_ids'
                ],
                media_fields=[
                    'url', 'preview_image_url', 'type', 'alt_text',
                    'duration_ms', 'height', 'width', 'public_metrics'
                ],
                user_fields=['username', 'name', 'verified', 'public_metrics'],
                exclude=['retweets', 'replies']  # Focus on original tweets only
            )
            
            if not tweets.data:
                return []
            
            # Process tweets with media
            processed_tweets = []
            media_dict = {}
            
            # Build media dictionary if media is included
            if tweets.includes and 'media' in tweets.includes:
                for media in tweets.includes['media']:
                    media_dict[media.media_key] = {
                        'type': media.type,
                        'url': getattr(media, 'url', None),
                        'preview_url': getattr(media, 'preview_image_url', None),
                        'alt_text': getattr(media, 'alt_text', None)
                    }
            
            # Process each tweet
            for tweet in tweets.data:
                tweet_data = {
                    'id': tweet.id,
                    'text': tweet.text,
                    'created_at': tweet.created_at.isoformat(),
                    'author': {
                        'username': username,
                        'name': ITK_SOURCES.get(username, {}).get('name', username),
                        'reliability': ITK_SOURCES.get(username, {}).get('reliability', 0.5)
                    },
                    'metrics': tweet.public_metrics,
                    'media': []
                }
                
                # Add media if present
                if hasattr(tweet, 'attachments') and 'media_keys' in tweet.attachments:
                    for media_key in tweet.attachments['media_keys']:
                        if media_key in media_dict:
                            tweet_data['media'].append(media_dict[media_key])
                
                processed_tweets.append(tweet_data)
            
            # Update last seen ID
            if tweets.data:
                self.last_seen[username] = str(tweets.data[0].id)
            
            return processed_tweets
            
        except Exception as e:
            logger.error(f"Error fetching tweets for @{username}: {e}")
            return []
    
    def fetch_all_sources(self):
        """Fetch tweets from all configured ITK sources"""
        all_tweets = []
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        logger.info(f"Starting tweet fetch for {len(ITK_SOURCES)} sources")
        
        for username, info in ITK_SOURCES.items():
            logger.info(f"Fetching tweets from @{username} ({info['name']})")
            
            # Get last seen ID for this user
            since_id = self.last_seen.get(username)
            
            # Fetch new tweets
            tweets = self.fetch_user_tweets(username, since_id)
            
            if tweets:
                logger.info(f"  → Found {len(tweets)} new tweets from @{username}")
                all_tweets.extend(tweets)
            else:
                logger.info(f"  → No new tweets from @{username}")
        
        # Save tweets to timestamped JSON file
        if all_tweets:
            output_file = OUTPUT_DIR / f"tweets_{timestamp}.json"
            with open(output_file, 'w') as f:
                json.dump({
                    'timestamp': timestamp,
                    'tweet_count': len(all_tweets),
                    'sources': list(ITK_SOURCES.keys()),
                    'tweets': all_tweets
                }, f, indent=2)
            
            logger.info(f"Saved {len(all_tweets)} tweets to {output_file}")
        else:
            logger.info("No new tweets found in this fetch cycle")
        
        # Save last seen IDs
        self.save_last_seen()
        
        return all_tweets

def job():
    """Job function to be run by scheduler"""
    logger.info("=" * 60)
    logger.info("Starting scheduled tweet fetch")
    
    fetcher = TwitterFetcher()
    tweets = fetcher.fetch_all_sources()
    
    logger.info(f"Fetch complete. Total new tweets: {len(tweets)}")
    logger.info("=" * 60)

def main():
    """Main function to set up scheduler"""
    logger.info("Twitter Fetcher Starting")
    logger.info(f"Monitoring {len(ITK_SOURCES)} ITK sources")
    logger.info(f"Output directory: {OUTPUT_DIR}")
    
    # Run immediately on startup
    job()
    
    # Set up scheduler to run every hour
    scheduler = BlockingScheduler()
    scheduler.add_job(job, 'interval', hours=1, id='twitter_fetch')
    
    logger.info("Scheduler started. Fetching tweets every hour...")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped by user")
        scheduler.shutdown()

if __name__ == "__main__":
    main()