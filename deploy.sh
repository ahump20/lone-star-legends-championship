#!/bin/bash

# Lone Star Legends - Deployment Script
# Deploys to GitHub Pages

echo "🚀 Deploying Lone Star Legends Championship Edition..."

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "gh-pages branch exists"
else
    echo "Creating gh-pages branch..."
    git checkout --orphan gh-pages
    git rm -rf .
    git checkout main
fi

# Build the project (if using build tools)
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then
        echo "🔨 Building with Vite..."
        npm run build
        BUILD_DIR="dist"
    else
        echo "📁 No build step required, using source files..."
        BUILD_DIR="."
    fi
else
    BUILD_DIR="."
fi

# Create a temporary directory for deployment
TEMP_DIR=$(mktemp -d)
echo "📂 Using temp directory: $TEMP_DIR"

# Copy files to temp directory
if [ "$BUILD_DIR" = "dist" ]; then
    cp -r dist/* $TEMP_DIR/
else
    # Copy all game files
    cp *.html $TEMP_DIR/ 2>/dev/null || true
    cp *.js $TEMP_DIR/ 2>/dev/null || true
    cp *.css $TEMP_DIR/ 2>/dev/null || true
    cp *.json $TEMP_DIR/ 2>/dev/null || true
    cp -r src $TEMP_DIR/ 2>/dev/null || true
    cp -r assets $TEMP_DIR/ 2>/dev/null || true
    cp *.png $TEMP_DIR/ 2>/dev/null || true
    cp *.jpg $TEMP_DIR/ 2>/dev/null || true
    cp *.svg $TEMP_DIR/ 2>/dev/null || true
fi

# Switch to gh-pages branch
git checkout gh-pages

# Clear old files
git rm -rf . 2>/dev/null || true

# Copy new files
cp -r $TEMP_DIR/* .

# Add .nojekyll file to bypass Jekyll processing
touch .nojekyll

# Commit and push
git add -A
git commit -m "Deploy to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')"
git push origin gh-pages --force

# Switch back to main branch
git checkout main

# Clean up
rm -rf $TEMP_DIR

echo "✅ Deployment complete!"
echo "🌐 Your game should be available at:"
echo "   https://ahump20.github.io/lone-star-legends-championship/"
echo ""
echo "Note: It may take a few minutes for changes to appear."