#!/bin/bash
# Setup optimized images for Blaze Intelligence

echo "🖼️ Setting up optimized images..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Installing..."
    brew install imagemagick
fi

# Create variants of the logo
if [ -f "images/blaze-logo.png" ]; then
    echo "Creating logo variants..."
    convert images/blaze-logo.png -resize 800x800 images/logo-800.webp
    convert images/blaze-logo.png -resize 400x400 images/logo-400.webp
    convert images/blaze-logo.png -resize 200x200 images/logo-200.webp
    echo "✅ Logo variants created"
else
    echo "⚠️ Logo file not found at images/blaze-logo.png"
fi

# Create placeholder hero images if they don't exist
echo "Creating placeholder hero images..."
convert -size 1600x900 xc:'#0A0E27' -fill '#FF6B35' \
  -draw "circle 800,450 900,450" \
  -blur 0x50 images/hero-dashboard-1600.webp

convert -size 800x450 xc:'#0A0E27' -fill '#FF6B35' \
  -draw "circle 400,225 450,225" \
  -blur 0x25 images/hero-dashboard-800.webp

# Create OG image
convert -size 1200x630 xc:'#0A0E27' \
  -fill white -pointsize 60 -gravity center \
  -annotate +0-50 'Blaze Intelligence' \
  -fill '#FF6B35' -pointsize 30 \
  -annotate +0+50 'Championship Sports Analytics Platform' \
  images/og-corporate-1200x630.jpg

echo "✅ All images created successfully"
ls -la images/