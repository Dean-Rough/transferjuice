# Headless Scraping Usage Guide

## Quick Answer

To run Twitter scraping **WITHOUT browser windows popping up**, use any of these methods:

### Method 1: Environment Variable (Recommended)
```bash
HEADLESS_SCRAPING=true npx tsx scripts/enhanced-session-scraper.ts
```

### Method 2: Production Scraper
```bash
npx tsx scripts/production-scraper.ts --headless
```

### Method 3: Hourly Monitoring (Silent)
```bash
HEADLESS_SCRAPING=true npx tsx scripts/hourly-itk-monitor.ts
```

## Default Behavior

- **Default**: Shows browser windows (easier debugging)
- **With HEADLESS_SCRAPING=true**: Completely silent
- **Production**: Use headless mode for automated runs

## Browser Window Control

| Command | Browser Windows | Use Case |
|---------|----------------|----------|
| `npx tsx scripts/production-scraper.ts` | ✅ Visible | Development/Testing |
| `npx tsx scripts/production-scraper.ts --headless` | ❌ Hidden | Production |
| `HEADLESS_SCRAPING=true npx tsx ...` | ❌ Hidden | Automated scripts |

## Examples

### Silent monitoring of all ITK sources:
```bash
HEADLESS_SCRAPING=true npx tsx scripts/hourly-itk-monitor.ts
```

### Quick test without browser windows:
```bash
npx tsx scripts/production-scraper.ts --headless
```

### Debug with visible browser:
```bash
npx tsx scripts/production-scraper.ts --debug
```

## Important Notes

⚠️ **Twitter Detection**: Headless mode may be detected by Twitter's anti-bot systems. If you get "browser not supported" errors, try visible mode first.

✅ **Session Management**: The saved session works in both visible and headless modes.

🔄 **Fallback**: If headless fails, the system will show error messages to help debug.

## Production Setup

For automated hourly monitoring:
```bash
# Add to cron job or systemd timer
HEADLESS_SCRAPING=true npx tsx scripts/hourly-itk-monitor.ts
```

This runs completely silently in the background.