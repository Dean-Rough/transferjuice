#!/usr/bin/env python3
"""
Twitter Fetcher - Hybrid Implementation
Combines clean structure with Tweepy v4 best practices
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
TWITTER_BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN')
if not TWITTER_BEARER_TOKEN:
    logger.error('TWITTER_BEARER_TOKEN not set')
    raise SystemExit(1)

# Configuration
STATE_FILE = 'last_seen.json'
OUT_DIR = 'tweets'

# ITK Sources with metadata (your list + reliability scores)
ACCOUNTS = {
    'FabrizioRomano': {'name': 'Fabrizio Romano', 'reliability': 0.95, 'tier': 1},
    'David_Ornstein': {'name': 'David Ornstein', 'reliability': 0.93, 'tier': 1},
    'SamLee': {'name': 'Sam Lee', 'reliability': 0.92, 'tier': 1},
    '_pauljoyce': {'name': 'Paul Joyce', 'reliability': 0.91, 'tier': 1},
    'lauriewhitwell': {'name': 'Laurie Whitwell', 'reliability': 0.90, 'tier': 1},
    'RobDawsonESPN': {'name': 'Rob Dawson', 'reliability': 0.89, 'tier': 1},
    'LukeEdwardsTele': {'name': 'Luke Edwards', 'reliability': 0.88, 'tier': 1},
    'JPercyTelegraph': {'name': 'John Percy', 'reliability': 0.90, 'tier': 1},
    'CraigHope_DM': {'name': 'Craig Hope', 'reliability': 0.87, 'tier': 1},
    'DeanJonesSoccer': {'name': 'Dean Jones', 'reliability': 0.86, 'tier': 1},
    'SirayahShiraz': {'name': 'Sirayah Shiraz', 'reliability': 0.85, 'tier': 1},
    'BouhafsiMohamed': {'name': 'Mohamed Bouhafsi', 'reliability': 0.90, 'tier': 1},
    'DiMarzio': {'name': 'Gianluca Di Marzio', 'reliability': 0.91, 'tier': 1},
    'alfredopedulla': {'name': 'Alfredo Pedulla', 'reliability': 0.88, 'tier': 1},
    'honigstein': {'name': 'Raphael Honigstein', 'reliability': 0.89, 'tier': 1}
}

class TwitterFetcher:
    def __init__(self):
        """Initialize Twitter client with best practices from Tweepy v4 docs"""
        self.client = tweepy.Client(
            bearer_token=TWITTER_BEARER_TOKEN,
            wait_on_rate_limit=True,  # Auto-wait when rate limited
            return_type=tweepy.Response  # Use Response objects for proper error handling
        )
        self.state = self.load_state()
        
        # Ensure output directory exists
        Path(OUT_DIR).mkdir(exist_ok=True)
    
    def load_state(self):
        """Load last seen tweet IDs from state file"""
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading {STATE_FILE}: {e}")
        return {}
    
    def save_state(self):
        """Save last seen tweet IDs to state file"""
        try:
            with open(STATE_FILE, 'w') as f:
                json.dump(self.state, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving {STATE_FILE}: {e}")
    
    def get_user_id(self, username):
        """Get Twitter user ID from username with proper error handling"""
        try:
            response = self.client.get_user(username=username)
            if response.data:
                return response.data.id
            else:
                logger.error(f"User @{username} not found")
                return None
        except Exception as e:
            logger.error(f"Error getting user ID for @{username}: {e}")
            return None
    
    def fetch_user_tweets(self, username, since_id=None):
        """Fetch tweets for a user following Tweepy v4 best practices"""
        user_id = self.get_user_id(username)
        if not user_id:
            return []
        
        try:
            logger.debug(f"Fetching tweets for @{username} (ID: {user_id})")
            
            # Use comprehensive field selections as per Tweepy v4 docs
            response = self.client.get_users_tweets(
                id=user_id,
                since_id=since_id,
                max_results=100,  # Max for user timeline endpoint
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
            
            if not response.data:
                return []
            
            # Process response with includes handling
            tweets = []
            media_dict = {}
            users_dict = {}
            
            # Build media lookup if present
            if hasattr(response, 'includes') and response.includes:
                if 'media' in response.includes:
                    for media in response.includes['media']:
                        media_dict[media.media_key] = {
                            'type': media.type,
                            'url': getattr(media, 'url', None),
                            'preview_url': getattr(media, 'preview_image_url', None),
                            'alt_text': getattr(media, 'alt_text', None),
                            'width': getattr(media, 'width', None),
                            'height': getattr(media, 'height', None),
                            'duration_ms': getattr(media, 'duration_ms', None)
                        }
                
                # Build users lookup if present
                if 'users' in response.includes:
                    for user in response.includes['users']:
                        users_dict[user.id] = {
                            'username': user.username,
                            'name': user.name,
                            'verified': getattr(user, 'verified', False)
                        }
            
            # Process each tweet
            for tweet in response.data:
                # Get account metadata
                account_info = ACCOUNTS.get(username, {})
                
                tweet_data = {
                    'id': tweet.id,
                    'text': tweet.text,
                    'created_at': tweet.created_at.isoformat(),
                    'author': {
                        'username': username,
                        'name': account_info.get('name', username),
                        'id': tweet.author_id,
                        'reliability': account_info.get('reliability', 0.5),
                        'tier': account_info.get('tier', 3)
                    },
                    'metrics': tweet.public_metrics,
                    'entities': getattr(tweet, 'entities', {}),
                    'context': getattr(tweet, 'context_annotations', []),
                    'possibly_sensitive': getattr(tweet, 'possibly_sensitive', False),
                    'media': []
                }
                
                # Add media if present
                if hasattr(tweet, 'attachments') and tweet.attachments:
                    if 'media_keys' in tweet.attachments:
                        for media_key in tweet.attachments['media_keys']:
                            if media_key in media_dict:
                                tweet_data['media'].append(media_dict[media_key])
                
                tweets.append(tweet_data)
            
            # Update state with most recent tweet ID
            if tweets:
                self.state[username] = str(tweets[0]['id'])  # Most recent is first
            
            return tweets
            
        except Exception as e:
            logger.error(f"Error fetching tweets for @{username}: {e}")
            return []
    
    def fetch_all_accounts(self):
        """Fetch tweets from all configured ITK accounts"""
        logger.info(f"Starting fetch cycle for {len(ACCOUNTS)} accounts")
        
        all_tweets = []
        
        for username in ACCOUNTS.keys():
            logger.info(f"Fetching tweets from @{username}")
            
            since_id = self.state.get(username)
            tweets = self.fetch_user_tweets(username, since_id)
            
            if tweets:
                logger.info(f"  → Found {len(tweets)} new tweets")
                all_tweets.extend(tweets)
            else:
                logger.info(f"  → No new tweets")
        
        return all_tweets
    
    def save_tweets(self, tweets):
        """Save tweets to timestamped JSON file"""
        if not tweets:
            logger.info("No tweets to save")
            return None
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = Path(OUT_DIR) / f'tweets_{timestamp}.json'
        
        output_data = {
            'timestamp': timestamp,
            'fetch_time': datetime.now().isoformat(),
            'tweet_count': len(tweets),
            'accounts_monitored': list(ACCOUNTS.keys()),
            'tweets': tweets
        }
        
        try:
            with open(output_file, 'w') as f:
                json.dump(output_data, f, indent=2, default=str)
            
            logger.info(f"Saved {len(tweets)} tweets to {output_file}")
            return output_file
        except Exception as e:
            logger.error(f"Error saving tweets: {e}")
            return None

def main_fetch():
    """Main fetch routine - called by scheduler"""
    logger.info("=" * 60)
    logger.info(f"Starting tweet fetch at {datetime.now()}")
    
    fetcher = TwitterFetcher()
    tweets = fetcher.fetch_all_accounts()
    output_file = fetcher.save_tweets(tweets)
    fetcher.save_state()
    
    logger.info(f"Fetch complete. Total new tweets: {len(tweets)}")
    if output_file:
        logger.info(f"Data saved to: {output_file}")
    logger.info("=" * 60)
    
    return tweets

def main():
    """Main entry point with scheduler"""
    logger.info("Twitter Fetcher - Hybrid Implementation")
    logger.info(f"Monitoring {len(ACCOUNTS)} ITK accounts")
    logger.info(f"Output directory: {OUT_DIR}")
    logger.info(f"State file: {STATE_FILE}")
    
    # Run immediately on startup
    main_fetch()
    
    # Set up hourly scheduler
    scheduler = BlockingScheduler()
    scheduler.add_job(main_fetch, 'interval', hours=1, id='twitter_fetch')
    
    logger.info("Scheduler started. Fetching tweets every hour...")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped by user")
        scheduler.shutdown()

if __name__ == "__main__":
    main()