#!/bin/bash

# TransferJuice Hourly Cron Setup
# This script sets up the hourly story generation

echo "🚀 TransferJuice Hourly Story Generation Setup"
echo "=============================================="

# Get the current directory
PROJECT_DIR=$(pwd)

# Create the cron command
CRON_CMD="cd $PROJECT_DIR && npm run hourly >> $PROJECT_DIR/logs/hourly.log 2>&1"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

echo ""
echo "📝 Cron job command:"
echo "0 * * * * $CRON_CMD"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "npm run hourly"; then
    echo "⚠️  Hourly job already exists in crontab!"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep "transferjuice\|hourly"
else
    echo "Would you like to add this to your crontab? (y/n)"
    read -r response
    
    if [[ "$response" == "y" ]]; then
        # Add to crontab
        (crontab -l 2>/dev/null; echo "0 * * * * $CRON_CMD") | crontab -
        echo "✅ Cron job added successfully!"
        echo ""
        echo "The script will run:"
        echo "- Every hour at minute 0"
        echo "- Process new tweets into stories"
        echo "- Update existing stories"
        echo "- Log output to: $PROJECT_DIR/logs/hourly.log"
    else
        echo ""
        echo "To add manually, run:"
        echo "crontab -e"
        echo ""
        echo "Then add this line:"
        echo "0 * * * * $CRON_CMD"
    fi
fi

echo ""
echo "📊 To check logs:"
echo "tail -f $PROJECT_DIR/logs/hourly.log"
echo ""
echo "🧪 To test the script now:"
echo "npm run hourly"