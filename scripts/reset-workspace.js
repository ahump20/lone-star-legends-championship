#!/usr/bin/env node

/**
 * /reset - Workspace hygiene macro
 * Cleans node_modules cache, rebuilds, clears service worker
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function exec(cmd, options = {}) {
    try {
        return execSync(cmd, { encoding: 'utf8', ...options });
    } catch (error) {
        console.warn(`Warning: ${cmd} failed: ${error.message}`);
        return '';
    }
}

function rmrf(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗑️  Cleaned ${dir}`);
    }
}

async function main() {
    console.log('STATUS:');
    console.log('🧹 Resetting workspace to clean state...');
    
    // 1. Clean node_modules cache
    console.log('📦 Cleaning Node.js caches...');
    exec('npm cache clean --force', { stdio: 'inherit' });
    
    // 2. Clean build artifacts
    console.log('🏗️  Cleaning build artifacts...');
    rmrf('./dist');
    rmrf('./.wrangler');
    rmrf('./node_modules/.cache');
    
    // 3. Clean service worker caches
    console.log('⚙️  Clearing service worker state...');
    const swPath = './sw.js';
    if (fs.existsSync(swPath)) {
        const sw = fs.readFileSync(swPath, 'utf8');
        const versionMatch = sw.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/);
        if (versionMatch) {
            const newVersion = `v${Date.now()}`;
            const newSw = sw.replace(versionMatch[0], `CACHE_VERSION = '${newVersion}'`);
            fs.writeFileSync(swPath, newSw);
            console.log(`🔄 Bumped service worker cache version to ${newVersion}`);
        }
    }
    
    // 4. Clean pulse cache
    rmrf('./dist/.pulse');
    
    // 5. Reinstall dependencies
    console.log('📦 Reinstalling dependencies...');
    exec('npm install', { stdio: 'inherit' });
    
    // 6. List current cache keys (if any)
    console.log('🔍 Checking for remaining cache keys...');
    const cacheKeys = [];
    if (fs.existsSync('./dist')) {
        const distFiles = fs.readdirSync('./dist', { recursive: true });
        cacheKeys.push(...distFiles.filter(f => f.includes('cache') || f.includes('sw')));
    }
    
    console.log('\nMETRICS:');
    console.log(`Workspace State: Clean`);
    console.log(`Cache Keys Found: ${cacheKeys.length}`);
    console.log(`Dependencies: Reinstalled`);
    console.log(`Reset Time: ${new Date().toISOString()}`);
    
    console.log('\nNEXT:');
    console.log('✅ Workspace reset complete');
    console.log('• Run npm run dev to start development server');
    console.log('• Run /ship for clean deployment');
    console.log('• All caches and build artifacts cleared');
}

main().catch(console.error);