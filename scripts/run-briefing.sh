#!/bin/bash

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
elif [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: No .env or .env.local file found"
    exit 1
fi

# Validate required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY not set in environment"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set in environment"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Transfer Juice Briefing Generation...${NC}"
echo "================================================"

# Run the TypeScript script
npx tsx scripts/test-briefing-generation.ts

echo -e "${GREEN}✅ Briefing generation complete!${NC}"