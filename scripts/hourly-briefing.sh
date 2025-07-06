#!/bin/bash
# TransferJuice Hourly Briefing Generator

# Change to project directory
cd /Users/deannewton/Documents/TransferJuice

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Log start time
echo "[$(date)] Starting hourly briefing generation" >> briefing-cron.log

# Run the briefing generator
npm run briefing:rss >> briefing-cron.log 2>&1

# Log completion
echo "[$(date)] Briefing generation completed" >> briefing-cron.log
echo "---" >> briefing-cron.log
