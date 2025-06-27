#!/bin/bash

# Setup Cron Jobs for Transfer Juice
# Run this script to set up automated scheduling

echo "🕒 Setting up Transfer Juice Cron Jobs"
echo "======================================"

# Get the absolute path to the project
PROJECT_PATH=$(cd "$(dirname "$0")/.." && pwd)
echo "Project path: $PROJECT_PATH"

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

# Check if tsx is available
if ! npx tsx --version &> /dev/null; then
    echo "❌ tsx not found. Installing..."
    npm install -g tsx
fi

# Create log directory
mkdir -p /tmp/transferjuice-logs

# Create the cron entries
CRON_ENTRIES="
# Transfer Juice - ITK Monitoring (every hour)
0 * * * * cd $PROJECT_PATH && /usr/local/bin/npx tsx scripts/hourly-itk-monitor.ts >> /tmp/transferjuice-logs/monitor.log 2>&1

# Transfer Juice - Briefing Generation (9am, 2pm, 9pm)
0 9,14,21 * * * cd $PROJECT_PATH && /usr/local/bin/npm run briefing:generate >> /tmp/transferjuice-logs/briefing.log 2>&1

# Transfer Juice - Daily Cleanup (3am)
0 3 * * * cd $PROJECT_PATH && /usr/local/bin/npx tsx scripts/clear-briefings.ts --keep-days=7 >> /tmp/transferjuice-logs/cleanup.log 2>&1
"

echo ""
echo "📝 Cron entries to be added:"
echo "$CRON_ENTRIES"
echo ""

read -p "Do you want to add these cron jobs? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Backup existing crontab
    echo "📋 Backing up existing crontab..."
    crontab -l > /tmp/crontab-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "No existing crontab found"
    
    # Add new cron entries
    echo "✅ Adding Transfer Juice cron jobs..."
    (crontab -l 2>/dev/null; echo "$CRON_ENTRIES") | crontab -
    
    echo ""
    echo "🎉 Cron jobs added successfully!"
    echo ""
    echo "📊 Current crontab:"
    crontab -l | grep -A 10 -B 2 "Transfer Juice"
    
    echo ""
    echo "📁 Log files will be created in:"
    echo "   - /tmp/transferjuice-logs/monitor.log"
    echo "   - /tmp/transferjuice-logs/briefing.log" 
    echo "   - /tmp/transferjuice-logs/cleanup.log"
    
    echo ""
    echo "🔍 To monitor logs:"
    echo "   tail -f /tmp/transferjuice-logs/monitor.log"
    echo ""
    echo "🗑️ To remove cron jobs later:"
    echo "   crontab -e  # Then delete the Transfer Juice lines"
    
else
    echo "❌ Cron setup cancelled"
    exit 1
fi

echo ""
echo "✨ Setup complete! Your briefings will now run automatically."