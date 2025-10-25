#!/usr/bin/env node
/*
  Simple audit script: runs ESLint and performs a few greps to collect suspicious
  patterns into `audit-report.md`. Designed to be fast and useful in CI.
*/
import { execSync } from 'child_process';
import fs from 'fs';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    return e.stdout ? e.stdout.toString() : String(e);
  }
}

const lines = [];
lines.push('# Audit Report');
lines.push('Generated: ' + new Date().toISOString());
lines.push('\n----\n');

lines.push('## ESLint results');
const eslintOut = run('npx eslint . --ext .js --format compact || true');
lines.push(eslintOut || '(no output)');
lines.push('\n----\n');

lines.push('## Grep results');
const grepPatterns = ['firebase', 'TODO', 'FIXME', 'console.error', "// TODO", "// FIXME"];
for (const p of grepPatterns) {
  lines.push('\n### Pattern: ' + p);
  const out = run(`grep -RIn --color=never -e "${p}" || true`);
  lines.push(out || '(none)');
}

fs.writeFileSync('audit-report.md', lines.join('\n'));
console.log('Audit written to audit-report.md');
