#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const disallowed = [
  'Pablo Sanchez',
  'Pete Wheeler',
  'Achmed Khan',
  'Angela Delvecchio',
  'Backyard Baseball',
];

const roots = [
  'apps/games',
  'apps/web/app/games',
  'apps/web/components',
  'apps/web/lib',
  'assets',
  'docs/ai-assets',
];

async function walk(dir, results = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, results);
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  let violations = [];
  for (const root of roots) {
    const fullRoot = resolve(root);
    try {
      const files = await walk(fullRoot);
      for (const file of files) {
        const content = await readFile(file, 'utf8');
        for (const term of disallowed) {
          if (content.includes(term)) {
            violations.push({ file: relative(process.cwd(), file), term });
          }
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }

  if (violations.length > 0) {
    console.error('Disallowed references detected:\n');
    for (const issue of violations) {
      console.error(` - ${issue.term} in ${issue.file}`);
    }
    process.exit(1);
  }
  console.log('Blocklist check passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
