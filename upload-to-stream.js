#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');

// Cloudflare account details
const ACCOUNT_ID = 'a12cb329d84130460eed99b816e4d0d3'; // Your account ID from wrangler whoami
const VIDEO_PATH = '/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/Austin Humphrey/VIDEO OF ME AND PROF TALKING SPORTS.MP4';

async function uploadToStream() {
    // Check if video file exists
    if (!fs.existsSync(VIDEO_PATH)) {
        console.error('❌ Video file not found:', VIDEO_PATH);
        return;
    }

    const fileStats = fs.statSync(VIDEO_PATH);
    console.log(`📹 Video file found: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Get API token from environment or prompt
    const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    
    if (!API_TOKEN) {
        console.log(`
⚠️  No API token found. To upload the video, you need a Cloudflare API token.

To create one:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Stream Videos - Edit" template or create custom token with:
   - Account: Stream:Edit
   - Zone: Stream:Edit
4. Copy the token and run:
   
   export CLOUDFLARE_API_TOKEN="your-token-here"
   node upload-to-stream.js
`);
        return;
    }

    console.log('🚀 Starting upload to Cloudflare Stream...');

    try {
        // Step 1: Create a tus upload URL
        const tusEndpoint = await createTusUpload(API_TOKEN, ACCOUNT_ID, fileStats.size);
        console.log('✅ Upload URL created');

        // Step 2: Upload the video
        const videoId = await uploadVideo(tusEndpoint, VIDEO_PATH, API_TOKEN);
        console.log('✅ Video uploaded successfully!');
        console.log('📺 Video UID:', videoId);

        // Step 3: Update the HTML file
        updateHtmlWithVideoId(videoId);
        
        console.log(`
🎉 SUCCESS! Video has been uploaded to Cloudflare Stream

Video UID: ${videoId}
Stream URL: https://dash.cloudflare.com/${ACCOUNT_ID}/stream/videos/${videoId}
Embed URL: https://iframe.videodelivery.net/${videoId}

The index.html has been updated with the video embed.
Now deploy the changes:

npx wrangler pages deploy . --project-name blaze-intelligence --commit-dirty=true
`);

    } catch (error) {
        console.error('❌ Upload failed:', error.message);
    }
}

function createTusUpload(token, accountId, fileSize) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.cloudflare.com',
            port: 443,
            path: `/client/v4/accounts/${accountId}/stream?direct_user=true`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Tus-Resumable': '1.0.0',
                'Upload-Length': fileSize,
                'Upload-Metadata': `name ${Buffer.from('Professor Interview Video').toString('base64')}`
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode === 201 && res.headers.location) {
                resolve(res.headers.location);
            } else {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    reject(new Error(`Failed to create upload: ${res.statusCode} - ${data}`));
                });
            }
        });

        req.on('error', reject);
        req.end();
    });
}

function uploadVideo(tusUrl, filePath, token) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filePath);
        const fileSize = fs.statSync(filePath).size;
        
        // Parse the URL
        const urlParts = new URL(tusUrl);
        const videoId = urlParts.pathname.split('/').pop();

        const options = {
            hostname: urlParts.hostname,
            port: 443,
            path: urlParts.pathname,
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Tus-Resumable': '1.0.0',
                'Upload-Offset': '0',
                'Content-Type': 'application/offset+octet-stream',
                'Content-Length': fileSize
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode === 204) {
                resolve(videoId);
            } else {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    reject(new Error(`Upload failed: ${res.statusCode} - ${data}`));
                });
            }
        });

        req.on('error', reject);
        
        // Pipe the file to the request
        fileStream.pipe(req);
        
        // Track progress
        let uploaded = 0;
        fileStream.on('data', (chunk) => {
            uploaded += chunk.length;
            const percent = ((uploaded / fileSize) * 100).toFixed(1);
            process.stdout.write(`\rUploading: ${percent}% (${(uploaded / 1024 / 1024).toFixed(1)} MB / ${(fileSize / 1024 / 1024).toFixed(1)} MB)`);
        });

        fileStream.on('end', () => {
            console.log('\n✅ Upload complete!');
        });
    });
}

function updateHtmlWithVideoId(videoId) {
    const htmlPath = path.join(__dirname, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Replace the placeholder with the actual video ID
    html = html.replace('REPLACE_WITH_VIDEO_UID', videoId);
    
    fs.writeFileSync(htmlPath, html);
    console.log('✅ Updated index.html with video ID');
}

// Run the upload
uploadToStream();