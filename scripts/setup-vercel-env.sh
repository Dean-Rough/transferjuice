#!/bin/bash

# Setup Vercel Environment Variables
# This script reads from .env.local and sets them in Vercel

echo "🚀 Setting up Vercel Environment Variables"
echo "=========================================="

# Check if .env.local exists
if [[ ! -f ".env.local" ]]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your environment variables first."
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login check
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel first:"
    vercel login
fi

echo ""
echo "📋 Setting environment variables from .env.local..."
echo ""

# Read required variables from .env.local
DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2-)
OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" .env.local | cut -d'=' -f2-)
TWITTER_BEARER_TOKEN=$(grep "^TWITTER_BEARER_TOKEN=" .env.local | cut -d'=' -f2-)
APIFY_API_TOKEN=$(grep "^APIFY_API_TOKEN=" .env.local | cut -d'=' -f2-)

# Generate CRON_SECRET if not exists
CRON_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "transfer-juice-cron-$(date +%s)")

echo "Setting core environment variables..."

# Core required variables
if [[ -n "$DATABASE_URL" ]]; then
    echo "✅ Setting DATABASE_URL..."
    echo "$DATABASE_URL" | vercel env add DATABASE_URL production
else
    echo "❌ DATABASE_URL not found in .env.local"
fi

if [[ -n "$OPENAI_API_KEY" ]]; then
    echo "✅ Setting OPENAI_API_KEY..."
    echo "$OPENAI_API_KEY" | vercel env add OPENAI_API_KEY production
else
    echo "❌ OPENAI_API_KEY not found in .env.local"
fi

echo "✅ Setting CRON_SECRET..."
echo "$CRON_SECRET" | vercel env add CRON_SECRET production

# Optional but recommended variables
if [[ -n "$TWITTER_BEARER_TOKEN" ]]; then
    echo "✅ Setting TWITTER_BEARER_TOKEN..."
    echo "$TWITTER_BEARER_TOKEN" | vercel env add TWITTER_BEARER_TOKEN production
    echo "true" | vercel env add USE_REAL_TWITTER_API production
fi

if [[ -n "$APIFY_API_TOKEN" ]]; then
    echo "✅ Setting APIFY_API_TOKEN..."
    echo "$APIFY_API_TOKEN" | vercel env add APIFY_API_TOKEN production
fi

# Set monitoring flag
echo "true" | vercel env add ENABLE_MONITORING production

echo ""
echo "🎉 Environment variables setup complete!"
echo ""
echo "📝 Variables set:"
echo "   - DATABASE_URL (required)"
echo "   - OPENAI_API_KEY (required)"
echo "   - CRON_SECRET (generated)"
echo "   - TWITTER_BEARER_TOKEN (optional)"
echo "   - APIFY_API_TOKEN (optional)"
echo "   - USE_REAL_TWITTER_API (true)"
echo "   - ENABLE_MONITORING (true)"

echo ""
echo "🔍 To verify environment variables:"
echo "   vercel env ls"

echo ""
echo "🚀 Next steps:"
echo "   1. Run: vercel --prod"
echo "   2. Test cron endpoints after deployment"
echo "   3. Monitor logs for first briefing generation"

echo ""
echo "💡 Your CRON_SECRET is: $CRON_SECRET"
echo "   Save this for testing cron endpoints!"