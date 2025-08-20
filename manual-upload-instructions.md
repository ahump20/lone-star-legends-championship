# Upload Video to Cloudflare Stream - Manual Instructions

Since the wrangler OAuth token doesn't have Stream permissions, you'll need to upload the video manually or create an API token.

## Option 1: Manual Upload (Easiest)

1. **Go to Cloudflare Stream Dashboard:**
   https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/stream

2. **Click "Upload Video"** button

3. **Select your video file:**
   `/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/Austin Humphrey/VIDEO OF ME AND PROF TALKING SPORTS.MP4`

4. **Wait for upload to complete** (may take a few minutes)

5. **Copy the Video UID** from the dashboard (looks like: `f4e94c7b8a2d1e9c3b5a7d2e1f8c9a0b`)

6. **Update the video UID** by running:
   ```bash
   # Replace YOUR_VIDEO_UID with the actual UID from Cloudflare
   sed -i '' 's/REPLACE_WITH_VIDEO_UID/YOUR_VIDEO_UID/g' index.html
   ```

7. **Deploy the updated site:**
   ```bash
   npx wrangler pages deploy . --project-name blaze-intelligence --commit-dirty=true
   ```

## Option 2: Create API Token and Use Script

1. **Go to API Tokens page:**
   https://dash.cloudflare.com/profile/api-tokens

2. **Click "Create Token"**

3. **Configure the token:**
   - Select "Custom token"
   - Add permission: `Account > Stream > Edit`
   - Account Resources: `Include > a12cb329d84130460eed99b816e4d0d3`
   - Continue to summary and create

4. **Copy the token** (starts with something like `v1.0-...`)

5. **Run the upload script:**
   ```bash
   export CLOUDFLARE_API_TOKEN="your-token-here"
   ./upload-video.sh
   ```

## Quick Update Script

Once you have the Video UID, you can also run this command directly:

```bash
# Replace abcd1234 with your actual video UID
VIDEO_UID="abcd1234" && \
sed -i '' "s/REPLACE_WITH_VIDEO_UID/$VIDEO_UID/g" index.html && \
npx wrangler pages deploy . --project-name blaze-intelligence --commit-dirty=true
```

## Verify Deployment

After deploying, check your video at:
- https://blaze-intelligence.com/#video-embed
- https://7941f263.blaze-intelligence.pages.dev/#video-embed