#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

const program = new Command();
const botsDir = path.resolve('bots');

function ensureBotsDir() {
  if (!fs.existsSync(botsDir)) {
    fs.mkdirSync(botsDir, { recursive: true });
  }
}

program
  .name('smart-hub')
  .description('CLI for Smart Hub Ultra')
  .version('1.0.0');

program
  .command('init-bot <name>')
  .description('Create a new bot blueprint')
  .action((name) => {
    ensureBotsDir();
    const blueprint = {
      name,
      purpose: '',
      actions: []
    };
    const filePath = path.join(botsDir, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(blueprint, null, 2));
    console.log(`Created bot blueprint at ${filePath}`);
  });

program
  .command('run-task <file>')
  .description('Run a task script')
  .action(async (file) => {
    try {
      await import(path.resolve(file));
      console.log(`Executed ${file}`);
    } catch (err) {
      console.error(`Failed to run ${file}`);
      console.error(err);
      process.exit(1);
    }
  });

program.parse(process.argv);
