# Rich Media Briefing Pipeline Documentation

## Overview

TransferJuice now features a complete rich media briefing system that transforms ITK tweets into OneFootball-style long-form articles with enriched content, player statistics, tactical analysis, and even a "Shithouse Corner" featuring TikTok embeds.

## Architecture

### Pipeline Flow

```
1. Tweet Monitoring → 2. Content Classification → 3. Entity Extraction & Enrichment
       ↓                        ↓                            ↓
4. AI Article Generation → 5. Image Fetching → 6. Database Storage
       ↓                        ↓                      ↓
7. Feed Display → 8. Individual Pages → 9. Shithouse Corner (TikTok)
```

### Key Components

#### 1. **Rich Media Orchestrator** (`src/briefing-generator/RichMediaOrchestrator.ts`)
- Coordinates the entire pipeline
- Manages time slots (morning/afternoon/evening)
- Handles test mode and production modes

#### 2. **Entity Extraction** (`src/lib/enrichment/entityExtractor.ts`)
- Extracts players, clubs, fees, and deal stages from tweets
- Uses regex patterns and known entity lists
- Identifies transfer types and progression stages

#### 3. **Content Enrichment Services**
- **Player Stats** (`playerStatsService.ts`): Season stats, career history, transfer records
- **Club Context** (`clubContextService.ts`): Squad needs, financials, recent form
- **Transfer History** (`transferHistoryService.ts`): Market trends, similar deals
- **Enhanced Images** (`enhancedImageService.ts`): Player photos, club badges, action shots

#### 4. **AI Content Generation**
- **Enhanced Terry Prompts** (`terry-prompts-enhanced.ts`): 1,000-1,500 word articles
- **OpenAI Client** (`ai/client.ts`): GPT-4 integration for Terry's voice
- **Section-based structure**: Headlines, player profiles, tactical analysis, etc.

#### 5. **UI Components**
- **ContinuousFeed**: Displays briefings in infinite scroll
- **BriefingContent**: Renders sections with rich formatting
- **TikTokEmbed**: Shithouse Corner with embedded TikTok videos
- **Rich Media Elements**: Player cards, tweet embeds, timeline visualizations

## Usage

### Generate a Rich Media Briefing

```bash
# Generate for current time slot
npx tsx scripts/generate-rich-media-briefing.ts

# Force regenerate existing slot
npx tsx scripts/generate-rich-media-briefing.ts --force

# Test mode (doesn't save to DB)
npx tsx scripts/generate-rich-media-briefing.ts --test

# Save summary to file
npx tsx scripts/generate-rich-media-briefing.ts --save-summary
```

### Test with Simple Data

```bash
# Create test briefing with mock content
npx tsx scripts/test-simple-rich-briefing.ts
```

### Check Briefing Status

```bash
# View all briefings and their publish status
npx tsx scripts/check-briefing-status.ts
```

### Delete Old Briefings

```bash
# Clean up test data
npx tsx scripts/delete-briefings.ts
```

## Data Flow

### 1. Tweet Collection
```typescript
// Monitors ITK sources for time range
const tweets = await monitorTweets({
  sources: "all",
  timeRange: { start, end },
  limit: 50,
  testMode: false
});
```

### 2. Content Classification
```typescript
// Filters for transfer-related content
const classifiedTweets = await classifyContent({ tweets });
const transferTweets = classifiedTweets.filter(
  tweet => tweet.classification.isTransferRelated
);
```

### 3. Entity Extraction & Enrichment
```typescript
// Extracts entities and enriches with data
const enrichedTweets = await enrichContent({
  tweets: transferTweets,
  priority: "depth"
});
```

### 4. AI Article Generation
```typescript
// Generates long-form article with Terry's voice
const richArticle = await generateRichMediaArticle({
  enrichedTweets,
  timeSlot: "evening",
  targetWordCount: 1200
});
```

### 5. Database Storage
```typescript
// Saves with proper structure
await saveBriefing({
  briefing: {
    title,
    content,
    enrichedData,
    // ... other fields
  }
});
```

## Content Structure

### Briefing Sections

1. **Breaking News Header**: Eye-catching headline with key details
2. **Lead Paragraph**: Hook readers with main story (80-120 words)
3. **Main Story**: Detailed transfer information (400-500 words)
4. **Player Profile**: Stats, playing style, career trajectory (200-300 words)
5. **Club Context**: Why this transfer makes sense (200-300 words)
6. **Historical Context**: Similar transfers, market trends (150-200 words)
7. **What Happens Next**: Timeline and implications (100-150 words)
8. **Shithouse Corner**: TikTok embed celebrating football's dark arts (150-200 words)

### Terry's Voice Guidelines

- **Snark Level**: 5/10 (optimal balance)
- **Tone**: Professional-witty
- **References**: 5-7 dry observations per article
- **Pop Culture**: 2-3 comparisons maximum
- **Self-aware jokes**: 1-2 about football journalism

## Shithouse Corner Integration

Every briefing ends with "Shithouse Corner" - a celebration of football's finest shithousery:

```typescript
// TikTok embed component
<TikTokEmbed 
  videoId="7337533041232596225"
  username="footballshithousery"
  description="Peak shithousery from today's matches"
  hashtag="shithousery"
/>
```

The system randomly selects from curated TikTok videos featuring:
- Time-wasting masterclasses
- Wind-up merchants
- Dark arts compilations
- Tactical fouls appreciation

## API Endpoints

### Briefing Generation
- `POST /api/briefings/generate` - Trigger manual generation
- `POST /api/cron/hourly` - Automated hourly generation

### Briefing Access
- `GET /api/briefings` - List all briefings
- `GET /api/briefings/[timestamp]` - Get specific briefing
- `GET /api/briefings/archive` - Historical briefings

## Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...

# Optional
LOG_LEVEL=info
USE_REAL_TWITTER_API=false
TWITTER_BEARER_TOKEN=...
```

## Troubleshooting

### Common Issues

1. **404 on briefing pages**: Check if briefing is published (`isPublished: true`)
2. **No content showing**: Verify content structure has `sections` array
3. **Missing Terry commentary**: Ensure feedItems are connected to briefing
4. **TikTok not loading**: Check if TikTok embed URL is accessible

### Debug Commands

```bash
# Check briefing structure in DB
npx tsx scripts/check-briefing-structure.ts

# View enrichment process
LOG_LEVEL=debug npm run generate-briefing

# Test individual components
npm test src/lib/enrichment
```

## Future Enhancements

1. **Real API Integrations**
   - Connect to actual player stats APIs
   - Live transfer fee data
   - Real-time club information

2. **Enhanced Media**
   - YouTube highlight reels
   - Instagram story embeds
   - Live match footage

3. **Personalization**
   - User club preferences
   - Custom Terry snark levels
   - Notification preferences

4. **Analytics**
   - Read depth tracking
   - Popular sections analysis
   - Engagement metrics

## Example Output

A complete rich media briefing includes:
- 1,000-1,500 words of content
- 3-5 embedded tweets
- 5-10 player/club images
- Tactical diagrams (future)
- Transfer timeline visualization
- Shithouse Corner TikTok embed

View examples at:
- Feed: http://localhost:4433/
- Direct: http://localhost:4433/briefings/[slug]

---

*Last updated: June 2025*
*Pipeline version: 1.0.0*