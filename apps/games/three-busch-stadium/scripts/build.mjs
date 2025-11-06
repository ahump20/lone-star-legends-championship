import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = resolve(__dirname, '..');
const projectRoot = resolve(__dirname, '..', '..', '..', '..');

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', cwd: appRoot });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const distDir = resolve(appRoot, 'dist');
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}

run('npx', ['tsc', '-p', resolve(appRoot, 'tsconfig.json')]);

const publicDir = resolve(projectRoot, 'public', 'games', 'busch-stadium-ii');
if (existsSync(publicDir)) {
  rmSync(publicDir, { recursive: true, force: true });
}
mkdirSync(publicDir, { recursive: true });

cpSync(resolve(appRoot, 'demo', 'index.html'), resolve(publicDir, 'index.html'));
cpSync(resolve(appRoot, 'demo', 'styles.css'), resolve(publicDir, 'styles.css'));
cpSync(distDir, resolve(publicDir, 'dist'), { recursive: true });

console.log('✅ Busch Stadium II build artifacts ready in public/games/busch-stadium-ii');
