#!/usr/bin/env node

/**
 * /pages-domain - Domain automation for Cloudflare Pages
 * Lists projects, verifies custom domain binding, suggests fixes
 */

import { execSync } from 'child_process';

function exec(cmd, options = {}) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
    } catch (error) {
        throw new Error(`Command failed: ${cmd}\n${error.stderr || error.message}`);
    }
}

async function main() {
    console.log('STATUS:');
    console.log('🌐 Checking Cloudflare Pages domain configuration...');
    
    try {
        // 1. List Pages projects
        console.log('📋 Listing Pages projects...');
        const projectsOutput = exec('npx wrangler pages project list');
        console.log(projectsOutput);
        
        // 2. Get project details
        const projectName = 'blaze-intelligence-lsl'; // or lone-star-legends-championship
        console.log(`🔍 Checking project: ${projectName}`);
        
        try {
            const projectInfo = exec(`npx wrangler pages project get ${projectName}`);
            console.log(projectInfo);
        } catch (error) {
            console.log('⚠️  Could not get project details - trying alternate name...');
            try {
                const altProjectInfo = exec('npx wrangler pages project get lone-star-legends-championship');
                console.log(altProjectInfo);
            } catch (altError) {
                throw new Error('No matching Pages projects found');
            }
        }
        
        // 3. Check custom domains
        console.log('🔗 Checking custom domain status...');
        try {
            const domainsOutput = exec(`npx wrangler pages domain list ${projectName}`);
            console.log(domainsOutput);
        } catch (error) {
            console.log('❌ No custom domains configured');
        }
        
        console.log('\nMETRICS:');
        console.log(`Target Domain: blaze-intelligence.com`);
        console.log(`Project Name: ${projectName}`);
        console.log(`Check Time: ${new Date().toISOString()}`);
        
        console.log('\nNEXT:');
        console.log('📝 To add custom domain, run these commands:');
        console.log(`npx wrangler pages domain add ${projectName} blaze-intelligence.com`);
        console.log('');
        console.log('📋 Required DNS records at your registrar:');
        console.log('Type: CNAME');
        console.log('Name: blaze-intelligence.com (or @)');
        console.log(`Value: ${projectName}.pages.dev`);
        console.log('');
        console.log('🔍 To verify DNS propagation:');
        console.log('dig blaze-intelligence.com CNAME');
        console.log('nslookup blaze-intelligence.com');
        
    } catch (error) {
        console.error('❌ Domain check failed:', error.message);
        console.log('\nNEXT:');
        console.log('• Verify wrangler is authenticated: npx wrangler auth whoami');
        console.log('• Check if Pages project exists: npx wrangler pages project list');
        console.log('• Deploy project first if missing: npm run deploy');
        process.exit(1);
    }
}

main().catch(console.error);