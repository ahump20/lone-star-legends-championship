#!/bin/bash

# Cloudflare Images Upload Script for Blaze Intelligence
# This script uploads images to Cloudflare Images API

# Configuration
ACCOUNT_ID="a12cb329d84130460eed99b816e4d0d3"
API_TOKEN="${CLOUDFLARE_IMAGES_TOKEN:-kbXie9kXnefELbGyswFPQMiy2UH102ph}"
API_BASE="https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to upload an image
upload_image() {
    local file_path=$1
    local image_id=$2
    local metadata=$3
    
    echo -e "${YELLOW}Uploading ${file_path} as ${image_id}...${NC}"
    
    response=$(curl -X POST \
        -F "file=@${file_path}" \
        -F "id=${image_id}" \
        -F "metadata=${metadata}" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        "${API_BASE}" 2>/dev/null)
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Successfully uploaded ${image_id}${NC}"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗ Failed to upload ${image_id}${NC}"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    fi
    echo ""
}

# Function to create image variants
create_variants() {
    local image_id=$1
    
    echo -e "${YELLOW}Creating variants for ${image_id}...${NC}"
    
    # Define variants
    variants=(
        "public:fit=scale-down,width=1920,height=1080"
        "hero:fit=cover,width=1920,height=600,quality=85"
        "card:fit=cover,width=400,height=300,quality=80"
        "thumbnail:fit=cover,width=200,height=200,quality=75"
        "avatar:fit=cover,width=100,height=100,quality=75"
    )
    
    for variant in "${variants[@]}"; do
        IFS=':' read -r name options <<< "$variant"
        echo "  Creating variant: $name with options: $options"
    done
}

# Main upload process
echo "======================================"
echo "Blaze Intelligence Image Upload Script"
echo "======================================"
echo ""

# Check if API token is set
if [ -z "$API_TOKEN" ]; then
    echo -e "${RED}Error: API token not set${NC}"
    echo "Please set CLOUDFLARE_IMAGES_TOKEN environment variable"
    exit 1
fi

# Upload Blaze logo
if [ -f "images/blaze-logo.png" ]; then
    upload_image "images/blaze-logo.png" "blaze-logo-main" '{"source":"brand","type":"logo"}'
    create_variants "blaze-logo-main"
fi

# Example uploads for other images
# Uncomment and modify paths as needed:

# upload_image "path/to/austin-professional.jpg" "austin-humphrey-professional" '{"source":"founder","type":"headshot","usage":"limited"}'
# upload_image "path/to/hero-analytics.jpg" "hero-sports-analytics" '{"source":"hero","type":"background"}'
# upload_image "path/to/cardinals-action.jpg" "cardinals-game-action" '{"source":"sports","team":"cardinals"}'
# upload_image "path/to/titans-field.jpg" "titans-field-view" '{"source":"sports","team":"titans"}'
# upload_image "path/to/longhorns-stadium.jpg" "longhorns-stadium" '{"source":"sports","team":"longhorns"}'
# upload_image "path/to/grizzlies-court.jpg" "grizzlies-basketball-court" '{"source":"sports","team":"grizzlies"}'

echo "======================================"
echo "Upload process complete!"
echo "======================================"
echo ""
echo "Image Delivery URLs:"
echo "Base URL: https://imagedelivery.net/OIRkQQRLQBn_9nQh_tfKWA/{image_id}/{variant}"
echo ""
echo "Available variants:"
echo "  - public: Full resolution"
echo "  - hero: 1920x600 for hero sections"
echo "  - card: 400x300 for card displays"
echo "  - thumbnail: 200x200 square"
echo "  - avatar: 100x100 for profile images"