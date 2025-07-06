#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Manually triggering briefing generation...\n');

const child = spawn('npm', ['run', 'briefing:rss'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Briefing generated successfully!');
  } else {
    console.log('\n❌ Briefing generation failed with code:', code);
  }
});
