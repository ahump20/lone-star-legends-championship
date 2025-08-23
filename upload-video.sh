#!/bin/bash

# Video file path
VIDEO_FILE="/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/Austin Humphrey/VIDEO OF ME AND PROF TALKING SPORTS.MP4"
ACCOUNT_ID="a12cb329d84130460eed99b816e4d0d3"

echo "🎥 Cloudflare Stream Video Upload Script"
echo "========================================="

# Check if video exists
if [ ! -f "$VIDEO_FILE" ]; then
    echo "❌ Video file not found: $VIDEO_FILE"
    exit 1
fi

# Get file size in MB
FILE_SIZE=$(ls -lh "$VIDEO_FILE" | awk '{print $5}')
echo "📹 Found video file: $FILE_SIZE"

# Check for API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo ""
    echo "⚠️  No API token found!"
    echo ""
    echo "To upload the video, you need a Cloudflare API token."
    echo ""
    echo "Steps to create one:"
    echo "1. Go to: https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Click 'Create Token'"
    echo "3. Use 'Custom token' and set:"
    echo "   - Permissions: Account > Stream > Edit"
    echo "4. Copy the token and run:"
    echo ""
    echo "   export CLOUDFLARE_API_TOKEN='your-token-here'"
    echo "   ./upload-video.sh"
    echo ""
    exit 1
fi

echo "🚀 Uploading to Cloudflare Stream..."
echo ""

# Upload using direct creator upload
RESPONSE=$(curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/direct_upload" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"maxDurationSeconds":3600,"requireSignedURLs":false,"allowedOrigins":["*"]}' \
  2>/dev/null)

# Extract upload URL
UPLOAD_URL=$(echo "$RESPONSE" | grep -o '"uploadURL":"[^"]*' | sed 's/"uploadURL":"//')

if [ -z "$UPLOAD_URL" ]; then
    echo "❌ Failed to get upload URL. Response:"
    echo "$RESPONSE"
    exit 1
fi

# Extract UID from response
VIDEO_UID=$(echo "$RESPONSE" | grep -o '"uid":"[^"]*' | sed 's/"uid":"//')

echo "📤 Got upload URL, uploading video..."
echo "   This may take a few minutes..."
echo ""

# Upload the video file
curl -X POST "$UPLOAD_URL" \
  -F "file=@$VIDEO_FILE" \
  --progress-bar

echo ""
echo "✅ Upload complete!"
echo ""
echo "========================================="
echo "📺 Video UID: $VIDEO_UID"
echo "🔗 Stream Dashboard: https://dash.cloudflare.com/${ACCOUNT_ID}/stream/videos/${VIDEO_UID}"
echo "🌐 Embed URL: https://iframe.videodelivery.net/${VIDEO_UID}"
echo "========================================="
echo ""

# Update the HTML file
echo "📝 Updating index.html with video UID..."
sed -i '' "s/REPLACE_WITH_VIDEO_UID/${VIDEO_UID}/g" index.html

echo "✅ index.html updated!"
echo ""
echo "🚀 Now deploy the changes:"
echo "   npx wrangler pages deploy . --project-name blaze-intelligence --commit-dirty=true"
echo ""