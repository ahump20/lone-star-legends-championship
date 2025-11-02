#!/usr/bin/env node
import { mkdirSync, rmSync } from 'node:fs';
import { cp, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const webPublicDir = resolve(root, 'apps/web/public/games/bbp-web');
const phaserDist = resolve(root, 'apps/games/phaser-bbp-web/dist');

const run = spawnSync('pnpm', ['--filter', 'phaser-bbp-web', 'build'], {
  cwd: root,
  stdio: 'inherit',
});

if (run.status !== 0) {
  process.exit(run.status ?? 1);
}

try {
  const stats = await stat(phaserDist);
  if (!stats.isDirectory()) {
    throw new Error('Phaser build output missing');
  }
} catch (error) {
  console.error('Unable to locate Phaser build output at', phaserDist);
  console.error(error);
  process.exit(1);
}

try {
  rmSync(webPublicDir, { recursive: true, force: true });
} catch (error) {
  console.warn('Nothing to clean in public games dir', error.message);
}

mkdirSync(webPublicDir, { recursive: true });

await cp(phaserDist, webPublicDir, { recursive: true });

console.log('Copied Phaser build to', webPublicDir);
