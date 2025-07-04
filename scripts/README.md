# Production Scripts

This folder contains only the essential production scripts for Transfer Juice.

## Active Scripts

### 🚀 Briefing Generation

- `run-briefing-generator.ts` - Main briefing generator (use `npm run briefing:generate`)

### 📊 Monitoring

- `hourly-itk-monitor.ts` - Monitors 52 global ITK sources hourly

### 🛠 Utilities

- `seed-database.ts` - Initialize database with sources
- `clear-briefings.ts` - Clean up old briefings
- `clean-and-regenerate.sh` - Full system reset

### 🗄 Archive

All legacy, test, and demo scripts have been moved to `/archive/` subdirectories.

## Usage

See `/docs/PRODUCTION_PROCESS.md` for detailed usage instructions.

## Quick Commands

```bash
# Generate a briefing
npm run briefing:generate

# Generate test briefing
npm run briefing:test

# Monitor ITK sources
npx tsx scripts/hourly-itk-monitor.ts

# Clean old data
npx tsx scripts/clear-briefings.ts
```
