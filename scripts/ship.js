#!/usr/bin/env node

/**
 * /ship - One-keystroke deployment system
 * Checks git, builds, deploys, tags, and reports production status
 */

import { execSync } from 'child_process';
import fs from 'fs';

const PROD_URL = process.env.PROD_URL || 'https://fe5b775f.blaze-intelligence-lsl.pages.dev';

function exec(cmd, options = {}) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
    } catch (error) {
        throw new Error(`Command failed: ${cmd}\n${error.message}`);
    }
}

function getVersion() {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return pkg.version || '1.0.0';
}

function incrementVersion(version) {
    const parts = version.split('.');
    parts[2] = (parseInt(parts[2]) + 1).toString();
    return parts.join('.');
}

async function main() {
    console.log('STATUS:');
    console.log('🚀 Starting Blaze deployment sequence...');
    
    try {
        // 1. Check git status
        const gitStatus = exec('git status --porcelain').trim();
        if (gitStatus) {
            throw new Error('Git working directory is not clean. Commit or stash changes first.');
        }
        console.log('✅ Git working directory clean');
        
        // 2. Run security scan
        console.log('🔒 Running security scan...');
        exec('node security-scanner.js');
        console.log('✅ Security scan passed');
        
        // 3. Build if needed
        if (fs.existsSync('./dist')) {
            console.log('📦 Using existing build in ./dist');
        } else {
            console.log('📦 No dist found, assuming static site');
        }
        
        // 4. Deploy to Cloudflare Pages
        console.log('🌐 Deploying to Cloudflare Pages...');
        const deployOutput = exec('npx wrangler pages deploy . --project-name lone-star-legends-championship');
        const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
        const deployUrl = urlMatch ? urlMatch[0] : PROD_URL;
        console.log(`✅ Deployed to: ${deployUrl}`);
        
        // 5. Tag release
        const currentVersion = getVersion();
        const newVersion = incrementVersion(currentVersion);
        exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
        console.log(`✅ Tagged release v${newVersion}`);
        
        // 6. Push tags
        exec('git push origin --tags');
        console.log('✅ Pushed tags to origin');
        
        console.log('\nMETRICS:');
        console.log(`Version: v${newVersion}`);
        console.log(`Production URL: ${deployUrl}`);
        console.log(`Deploy Hash: ${exec('git rev-parse HEAD').slice(0, 8)}`);
        console.log(`Deploy Time: ${new Date().toISOString()}`);
        
        console.log('\nNEXT:');
        console.log('• Monitor production health at /health endpoint');
        console.log('• Run /qa to verify deployment');
        console.log('• Check /enigma and /readiness for live data');
        
    } catch (error) {
        console.error('\n❌ DEPLOYMENT FAILED:');
        console.error(error.message);
        process.exit(1);
    }
}

main().catch(console.error);