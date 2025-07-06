#!/usr/bin/env tsx

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

console.log("🕐 Setting up hourly briefing generation...\n");

// Create cron script
const cronScript = `#!/bin/bash
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
`;

// Write the cron script
const scriptPath = path.join(process.cwd(), "scripts", "hourly-briefing.sh");
fs.writeFileSync(scriptPath, cronScript);
fs.chmodSync(scriptPath, "755");

console.log("✅ Created cron script at:", scriptPath);

// Create systemd service (for Linux) or launchd plist (for macOS)
if (process.platform === "darwin") {
  // macOS - use launchd
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.transferjuice.hourly-briefing</string>
    <key>ProgramArguments</key>
    <array>
        <string>${scriptPath}</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${path.join(process.cwd(), "briefing-stdout.log")}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(process.cwd(), "briefing-stderr.log")}</string>
</dict>
</plist>`;

  const plistPath = path.join(process.cwd(), "com.transferjuice.hourly-briefing.plist");
  fs.writeFileSync(plistPath, plistContent);
  
  console.log("\n📝 Created launchd plist at:", plistPath);
  console.log("\n🚀 To enable hourly briefings on macOS:");
  console.log("1. Copy the plist to LaunchAgents:");
  console.log(`   cp ${plistPath} ~/Library/LaunchAgents/`);
  console.log("2. Load the service:");
  console.log("   launchctl load ~/Library/LaunchAgents/com.transferjuice.hourly-briefing.plist");
  console.log("3. To check if it's running:");
  console.log("   launchctl list | grep transferjuice");
  console.log("4. To stop:");
  console.log("   launchctl unload ~/Library/LaunchAgents/com.transferjuice.hourly-briefing.plist");
  
} else {
  // Linux - use cron
  console.log("\n📝 To enable hourly briefings on Linux:");
  console.log("1. Open crontab:");
  console.log("   crontab -e");
  console.log("2. Add this line:");
  console.log(`   0 * * * * ${scriptPath}`);
  console.log("3. Save and exit");
}

// Create manual run script
const manualScript = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Manually triggering briefing generation...\\n');

const child = spawn('npm', ['run', 'briefing:rss'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\\n✅ Briefing generated successfully!');
  } else {
    console.log('\\n❌ Briefing generation failed with code:', code);
  }
});
`;

const manualPath = path.join(process.cwd(), "scripts", "trigger-briefing.js");
fs.writeFileSync(manualPath, manualScript);
fs.chmodSync(manualPath, "755");

console.log("\n✅ Created manual trigger script at:", manualPath);
console.log("   Run with: node scripts/trigger-briefing.js");

// Add npm script
console.log("\n📦 Add this to your package.json scripts:");
console.log(`"briefing:hourly": "node scripts/trigger-briefing.js"`);

console.log("\n✨ Setup complete!");
console.log("\n📊 Monitor logs at:");
console.log("   - briefing-cron.log (main log)");
console.log("   - briefing-stdout.log (standard output)");
console.log("   - briefing-stderr.log (error output)");