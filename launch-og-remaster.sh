#!/bin/bash

# 🏆 Blaze Intelligence OG Remaster Launcher
# Championship Baseball - Texas State of Mind

echo "🏆 BLAZE INTELLIGENCE OG REMASTER"
echo "⚾ Loading Championship Baseball..."
echo ""

# Build brand assets
echo "🎨 Building Blaze Intelligence brand system..."
npm run build:brand

# Generate character sprites
echo "👶 Generating character sprites..."
npm run sprites:generate

# Find available port
PORT=8000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    PORT=$((PORT + 1))
done

echo "🚀 Starting development server on port $PORT..."
echo "🌐 Opening http://localhost:$PORT"
echo ""
echo "🎮 GAME CONTROLS:"
echo "   SPACE - Swing bat"
echo "   ENTER - Pitch ball"  
echo "   ARROWS - Move runners"
echo "   Touch controls for mobile"
echo ""
echo "⚾ GAME MODES:"
echo "   🚀 Quick Play - Jump right into action"
echo "   🏃 Sandlot - Draft your dream team"
echo "   🏆 Season - Championship tournament"
echo ""
echo "Press CTRL+C to stop the server"
echo "────────────────────────────────────────"

# Start server in background
cd apps/og-remaster
python3 -m http.server $PORT &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Open in browser
if command -v open >/dev/null 2>&1; then
    open "http://localhost:$PORT"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:$PORT"
else
    echo "🌐 Open http://localhost:$PORT in your browser"
fi

echo "🏆 Blaze Intelligence OG Remaster is live!"
echo "⚾ Ready for Championship Baseball!"

# Keep server running
wait $SERVER_PID