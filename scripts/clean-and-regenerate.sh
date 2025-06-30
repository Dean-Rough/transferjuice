#!/bin/bash

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
elif [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: No .env or .env.local file found"
    echo "Please create a .env.local file with your credentials"
    exit 1
fi

# Validate required environment variables
REQUIRED_VARS=("DATABASE_URL" "OPENAI_API_KEY" "APIFY_API_TOKEN" "X_BEARER_TOKEN")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var not set in environment"
        exit 1
    fi
done

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Starting Clean and Regenerate Process...${NC}"
echo "=========================================="

# Step 1: Backup current database (optional)
echo -e "${YELLOW}Step 1: Creating database backup...${NC}"
pg_dump "$DATABASE_URL" > "backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null || echo "Backup skipped (pg_dump not available)"

# Step 2: Reset database
echo -e "${YELLOW}Step 2: Resetting database...${NC}"
npx prisma db push --force-reset --skip-generate

# Step 3: Generate Prisma client
echo -e "${YELLOW}Step 3: Generating Prisma client...${NC}"
npx prisma generate

# Step 4: Run database seeds (if exists)
echo -e "${YELLOW}Step 4: Running database seeds...${NC}"
if [ -f "prisma/seed.ts" ]; then
    npx tsx prisma/seed.ts
else
    echo "No seed file found, skipping..."
fi

# Step 5: Clear any cache directories
echo -e "${YELLOW}Step 5: Clearing cache directories...${NC}"
rm -rf .next/cache 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Step 6: Generate initial data
echo -e "${YELLOW}Step 6: Generating initial briefing...${NC}"
npx tsx scripts/test-briefing-generation.ts

echo -e "${GREEN}✅ Clean and regenerate process complete!${NC}"
echo "=========================================="
echo -e "${GREEN}Database has been reset and initial data generated.${NC}"