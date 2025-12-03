#!/usr/bin/env node
// Minimal example script to demonstrate CLI usage and tasks
import fs from 'fs';
import path from 'path';

const cmd = process.argv[2] || 'show';

if (cmd === 'show') {
  const file = path.join(process.cwd(), 'bots', 'exampleBot.json');
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log('Example bot:', data.name, '-', data.description);
    process.exit(0);
  }
  console.warn('No example bot found.');
  process.exit(2);
}

console.log('Unknown command. Usage: node scripts/sampleTask.js show');
