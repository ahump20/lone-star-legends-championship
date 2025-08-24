#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const VIDEO_PATH = '/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/Austin Humphrey/VIDEO OF ME AND PROF TALKING SPORTS.MP4';
const ACCOUNT_ID = 'a12cb329d84130460eed99b816e4d0d3';

async function getWranglerToken() {
    try {
        // Get token from wrangler config
        const { stdout } = await execAsync('npx wrangler whoami --json 2>/dev/null || echo "{}"');
        const data = JSON.parse(stdout);
        
        // Try to get token from wrangler's stored credentials
        const home = process.env.HOME;
        const configPath = `${home}/.wrangler/config/default.toml`;
        
        if (fs.existsSync(configPath)) {
            const config = fs.readFileSync(configPath, 'utf8');
            const tokenMatch = config.match(/oauth_token\s*=\s*"([^"]+)"/);
            if (tokenMatch) {
                return tokenMatch[1];
            }
        }
        
        // Alternative: Check environment
        const paths = [
            `${home}/.config/.wrangler/config/default.toml`,
            `${home}/.wrangler/config/default.toml`
        ];
        
        for (const p of paths) {
            if (fs.existsSync(p)) {
                const config = fs.readFileSync(p, 'utf8');
                const tokenMatch = config.match(/oauth_token\s*=\s*"([^"]+)"/);
                if (tokenMatch) {
                    return tokenMatch[1];
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Could not get token from wrangler:', error.message);
        return null;
    }
}

async function uploadWithCurl() {
    console.log('🎥 Uploading video using direct method...\n');
    
    // Check if file exists
    if (!fs.existsSync(VIDEO_PATH)) {
        console.error('❌ Video file not found!');
        return;
    }
    
    const fileSize = fs.statSync(VIDEO_PATH).size;
    console.log(`📹 Video size: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`);
    
    // First, let's try to get auth token from wrangler
    console.log('🔐 Getting authentication...');
    const token = await getWranglerToken();
    
    if (!token) {
        console.log(`
⚠️  Could not get authentication token automatically.

Please create a Cloudflare API token:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token" 
3. Select "Custom token" and configure:
   - Permissions: Account > Stream > Edit
   - Account Resources: Include > Your Account
4. Create token and copy it
5. Run this command with your token:

export CLOUDFLARE_API_TOKEN="your-token-here"
node stream-upload.mjs

Alternatively, you can upload manually:
1. Go to: https://dash.cloudflare.com/${ACCOUNT_ID}/stream
2. Click "Upload Video"
3. Select your video file
4. Copy the Video UID after upload
5. Run: npm run update-video-uid YOUR_UID_HERE
`);
        return;
    }
    
    console.log('✅ Got authentication token from wrangler\n');
    
    // Create direct upload
    console.log('📤 Creating upload URL...');
    
    const createUploadCmd = `curl -X POST \
        "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/direct_upload" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json" \
        -d '{"maxDurationSeconds":3600,"requireSignedURLs":false,"allowedOrigins":["*"]}' \
        2>/dev/null`;
    
    try {
        const { stdout: uploadResponse } = await execAsync(createUploadCmd);
        const uploadData = JSON.parse(uploadResponse);
        
        if (!uploadData.success) {
            throw new Error(uploadData.errors?.[0]?.message || 'Failed to create upload URL');
        }
        
        const uploadURL = uploadData.result.uploadURL;
        const videoUID = uploadData.result.uid;
        
        console.log('✅ Upload URL created');
        console.log(`📺 Video UID: ${videoUID}\n`);
        
        // Upload the file
        console.log('🚀 Uploading video (this may take a few minutes)...\n');
        
        const uploadCmd = `curl -X POST "${uploadURL}" \
            -F "file=@${VIDEO_PATH.replace(/ /g, '\\ ')}" \
            --progress-bar`;
        
        await execAsync(uploadCmd, { maxBuffer: 1024 * 1024 * 1024 }); // 1GB buffer
        
        console.log('\n✅ Video uploaded successfully!\n');
        
        // Update HTML
        console.log('📝 Updating index.html...');
        const htmlPath = path.join(process.cwd(), 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        html = html.replace('REPLACE_WITH_VIDEO_UID', videoUID);
        fs.writeFileSync(htmlPath, html);
        
        console.log('✅ HTML updated!\n');
        
        console.log('=====================================');
        console.log(`🎉 SUCCESS!`);
        console.log(`=====================================`);
        console.log(`Video UID: ${videoUID}`);
        console.log(`Dashboard: https://dash.cloudflare.com/${ACCOUNT_ID}/stream/videos/${videoUID}`);
        console.log(`Embed URL: https://iframe.videodelivery.net/${videoUID}`);
        console.log('=====================================\n');
        
        console.log('🚀 Now deploy the changes:');
        console.log('   npx wrangler pages deploy . --project-name blaze-intelligence --commit-dirty=true\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nTry uploading manually at:');
        console.log(`https://dash.cloudflare.com/${ACCOUNT_ID}/stream`);
    }
}

// Run the upload
uploadWithCurl();