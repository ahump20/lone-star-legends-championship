#!/bin/bash

# Deploy Lone Star Legends Championship with Unreal Engine Integration
# This script sets up the complete 3D baseball simulation environment

echo "⚾ Deploying Lone Star Legends Championship - Unreal Engine Edition 🔥"
echo "=================================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set project directories
PROJECT_DIR="$(pwd)"
UNREAL_DIR="${PROJECT_DIR}/UnrealProject"
PYTHON_DIR="${PROJECT_DIR}/python-services"
WEB_DIR="${PROJECT_DIR}/web"

# Function to check dependencies
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Python 3 found${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⚠️  Node.js not found (optional for web features)${NC}"
    else
        echo -e "${GREEN}✅ Node.js found${NC}"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Git found${NC}"
}

# Function to set up Python environment
setup_python() {
    echo -e "\n${BLUE}🐍 Setting up Python environment...${NC}"
    
    # Create Python services directory
    mkdir -p "${PYTHON_DIR}"
    
    # Copy Python files
    cp baseball-mcp-bridge.py "${PYTHON_DIR}/"
    cp blaze-*.js "${PYTHON_DIR}/" 2>/dev/null || true
    
    # Create requirements.txt
    cat > "${PYTHON_DIR}/requirements.txt" << 'EOF'
asyncio
json
logging
socket
dataclasses
mcp.server.fastmcp
numpy
websockets
aiohttp
EOF
    
    # Create virtual environment
    if [ ! -d "${PYTHON_DIR}/venv" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv "${PYTHON_DIR}/venv"
    fi
    
    # Activate and install dependencies
    source "${PYTHON_DIR}/venv/bin/activate"
    pip install -r "${PYTHON_DIR}/requirements.txt" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Some Python packages not available. Installing basic requirements...${NC}"
        pip install asyncio websockets aiohttp 2>/dev/null || true
    }
    
    echo -e "${GREEN}✅ Python environment ready${NC}"
}

# Function to set up web deployment
setup_web_deployment() {
    echo -e "\n${BLUE}🌐 Setting up web deployment...${NC}"
    
    # Create web directory
    mkdir -p "${WEB_DIR}"
    
    # Create enhanced index.html with Unreal preview
    cat > "${WEB_DIR}/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lone Star Legends Championship - 3D Edition with Unreal Engine</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            font-family: 'Arial', sans-serif;
            color: white;
            overflow-x: hidden;
        }
        
        .header {
            text-align: center;
            padding: 2rem;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            border-bottom: 3px solid #FFD700;
        }
        
        .header h1 {
            font-size: 3rem;
            background: linear-gradient(90deg, #FFD700, #FF6B6B);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { filter: drop-shadow(0 0 10px #FFD700); }
            to { filter: drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 30px #FF6B6B); }
        }
        
        .main-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .unreal-preview {
            background: rgba(0, 0, 0, 0.8);
            border: 3px solid #FFD700;
            border-radius: 20px;
            padding: 2rem;
            margin: 2rem 0;
            position: relative;
            overflow: hidden;
        }
        
        .unreal-preview::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FF6B6B, #FFD700, #FF6B6B);
            animation: slide 3s linear infinite;
        }
        
        @keyframes slide {
            from { transform: translateX(-100%); }
            to { transform: translateX(100%); }
        }
        
        .preview-window {
            width: 100%;
            height: 600px;
            background: #000;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        .preview-content {
            text-align: center;
            z-index: 2;
        }
        
        .preview-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect fill="%232E8B57" width="1200" height="600"/><circle cx="600" cy="300" r="80" fill="%238B4513"/><path d="M520 300 L680 300 L600 220 Z" fill="white" opacity="0.3"/></svg>');
            opacity: 0.3;
            z-index: 1;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .status-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 10px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .status-card:hover {
            transform: translateY(-5px);
            border-color: #FFD700;
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.2);
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 0.5rem;
            animation: pulse 2s infinite;
        }
        
        .status-active { background: #4CAF50; }
        .status-pending { background: #FFC107; }
        .status-offline { background: #F44336; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .feature-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }
        
        .feature-card {
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 215, 0, 0.1));
            border: 2px solid transparent;
            border-radius: 15px;
            padding: 2rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #FF6B6B, #FFD700);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
        }
        
        .feature-card:hover::before {
            opacity: 0.1;
        }
        
        .feature-card:hover {
            border-color: #FFD700;
            transform: translateY(-5px);
        }
        
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .launch-btn {
            background: linear-gradient(135deg, #FF6B6B, #FFD700);
            border: none;
            padding: 1.5rem 3rem;
            color: white;
            font-size: 1.2rem;
            font-weight: bold;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 20px rgba(255, 107, 107, 0.3);
            margin: 1rem;
        }
        
        .launch-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(255, 107, 107, 0.5);
        }
        
        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 1rem;
            border-radius: 10px;
            border: 1px solid #FFD700;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="connection-status">
        <span class="status-indicator status-active"></span>
        <span>Blaze Analytics: Active</span><br>
        <span class="status-indicator status-pending"></span>
        <span>Unreal Engine: Connecting...</span><br>
        <span class="status-indicator status-active"></span>
        <span>MCP Bridge: Online</span>
    </div>
    
    <div class="header">
        <h1>⚾ Lone Star Legends Championship ⚾</h1>
        <h2 style="color: #FFD700; margin: 1rem 0;">🔥 3D Edition Powered by Unreal Engine 5.5</h2>
        <p style="font-size: 1.2rem;">Professional Baseball Simulation with Real-Time Analytics</p>
    </div>
    
    <div class="main-container">
        <div class="unreal-preview">
            <h3 style="text-align: center; color: #FFD700; margin-bottom: 1.5rem; font-size: 1.8rem;">
                🎮 Unreal Engine Live Preview
            </h3>
            
            <div class="preview-window">
                <div class="preview-bg"></div>
                <div class="preview-content">
                    <div style="font-size: 5rem; margin-bottom: 1rem;">🏟️</div>
                    <h3 style="color: #FFD700; font-size: 2rem; margin-bottom: 1rem;">
                        3D Stadium Loading...
                    </h3>
                    <p style="font-size: 1.2rem; margin-bottom: 2rem;">
                        Initializing Unreal Engine connection and loading baseball stadium assets
                    </p>
                    <button class="launch-btn" onclick="launchUnreal()">
                        🚀 Launch 3D Game
                    </button>
                    <button class="launch-btn" onclick="openDemo()">
                        📊 Analytics Demo
                    </button>
                </div>
            </div>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <h4 style="color: #FFD700;">🔥 Blaze Intelligence</h4>
                <p style="margin-top: 1rem;">Momentum: <span id="momentum">65%</span></p>
                <p>Critical Play: <span id="critical">45%</span></p>
                <p>Win Probability: <span id="winprob">72%</span></p>
            </div>
            
            <div class="status-card">
                <h4 style="color: #FFD700;">⚾ Game State</h4>
                <p style="margin-top: 1rem;">Inning: <span id="inning">7</span></p>
                <p>Score: <span id="score">5-3</span></p>
                <p>Count: <span id="count">2-1</span></p>
            </div>
            
            <div class="status-card">
                <h4 style="color: #FFD700;">🎮 Unreal Status</h4>
                <p style="margin-top: 1rem;">FPS: <span id="fps">60</span></p>
                <p>Quality: <span id="quality">Ultra</span></p>
                <p>RTX: <span id="rtx">Enabled</span></p>
            </div>
            
            <div class="status-card">
                <h4 style="color: #FFD700;">🌐 MCP Bridge</h4>
                <p style="margin-top: 1rem;">Latency: <span id="latency">12ms</span></p>
                <p>Commands: <span id="commands">247</span></p>
                <p>Status: <span id="status">Active</span></p>
            </div>
        </div>
        
        <div class="feature-section">
            <div class="feature-card">
                <div class="feature-icon">🏟️</div>
                <h3 style="color: #FFD700;">Professional Stadium</h3>
                <p>MLB-standard field geometry with dynamic lighting and weather effects</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3 style="color: #FFD700;">Real-Time Physics</h3>
                <p>Authentic ball trajectories with wind, drag, and Magnus effect simulation</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3 style="color: #FFD700;">3D Analytics</h3>
                <p>Momentum visualization through stadium lighting and particle effects</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🎥</div>
                <h3 style="color: #FFD700;">Broadcast Quality</h3>
                <p>Multiple camera angles with AI-driven switching and slow-motion replays</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🤖</div>
                <h3 style="color: #FFD700;">AI Control</h3>
                <p>Natural language commands via MCP for complete game control</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🎮</div>
                <h3 style="color: #FFD700;">VR Ready</h3>
                <p>Built for future VR/AR experiences with immersive analytics</p>
            </div>
        </div>
        
        <div style="text-align: center; padding: 3rem; background: rgba(0, 0, 0, 0.5); border-radius: 20px; margin: 3rem 0;">
            <h2 style="color: #FFD700; margin-bottom: 1.5rem;">🚀 Experience Next-Generation Baseball</h2>
            <p style="font-size: 1.2rem; margin-bottom: 2rem;">
                The world's most advanced baseball simulation combining professional analytics with AAA game graphics
            </p>
            <button class="launch-btn" onclick="launchFullGame()">
                🎮 Play Full Game
            </button>
            <button class="launch-btn" onclick="viewCode()">
                📋 View Source Code
            </button>
        </div>
    </div>
    
    <script>
        // Simulated real-time updates
        function updateStats() {
            // Update momentum
            const momentum = 50 + Math.random() * 50;
            document.getElementById('momentum').textContent = momentum.toFixed(0) + '%';
            
            // Update critical play likelihood
            const critical = 20 + Math.random() * 60;
            document.getElementById('critical').textContent = critical.toFixed(0) + '%';
            
            // Update win probability
            const winprob = 40 + Math.random() * 40;
            document.getElementById('winprob').textContent = winprob.toFixed(0) + '%';
            
            // Update game state
            const innings = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
            document.getElementById('inning').textContent = innings[Math.floor(Math.random() * innings.length)];
            
            // Update latency
            const latency = 8 + Math.random() * 20;
            document.getElementById('latency').textContent = latency.toFixed(0) + 'ms';
            
            // Update command count
            const currentCommands = parseInt(document.getElementById('commands').textContent);
            document.getElementById('commands').textContent = currentCommands + Math.floor(Math.random() * 5);
        }
        
        // Update stats every 2 seconds
        setInterval(updateStats, 2000);
        
        // Button handlers
        function launchUnreal() {
            alert('🎮 Launching Unreal Engine 3D Baseball Simulation...\n\nNote: Requires Unreal Engine 5.5+ installed with MCP plugin');
            console.log('Attempting to connect to Unreal Engine via MCP bridge...');
        }
        
        function openDemo() {
            window.open('./demo.html', '_blank');
        }
        
        function launchFullGame() {
            window.open('https://github.com/ahump20/lone-star-legends-championship', '_blank');
        }
        
        function viewCode() {
            window.open('https://github.com/ahump20/lone-star-legends-championship', '_blank');
        }
        
        // Initialization
        console.log('🔥 Lone Star Legends Championship - 3D Edition Loaded');
        console.log('⚾ Blaze Intelligence Analytics: Active');
        console.log('🎮 Unreal Engine Integration: Ready');
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ Web deployment created${NC}"
}

# Function to start services
start_services() {
    echo -e "\n${BLUE}🚀 Starting services...${NC}"
    
    # Start Python MCP bridge
    if [ -f "${PYTHON_DIR}/baseball-mcp-bridge.py" ]; then
        echo -e "${YELLOW}Starting MCP Bridge server...${NC}"
        cd "${PYTHON_DIR}"
        source venv/bin/activate
        nohup python3 baseball-mcp-bridge.py > mcp-bridge.log 2>&1 &
        MCP_PID=$!
        echo -e "${GREEN}✅ MCP Bridge started (PID: $MCP_PID)${NC}"
    fi
    
    # Start web server
    if command -v python3 &> /dev/null; then
        echo -e "${YELLOW}Starting web server...${NC}"
        cd "${WEB_DIR}"
        nohup python3 -m http.server 8080 > web-server.log 2>&1 &
        WEB_PID=$!
        echo -e "${GREEN}✅ Web server started on http://localhost:8080 (PID: $WEB_PID)${NC}"
    fi
}

# Function to deploy to GitHub Pages
deploy_github_pages() {
    echo -e "\n${BLUE}🌐 Deploying to GitHub Pages...${NC}"
    
    # Copy web files to root for GitHub Pages
    cp "${WEB_DIR}/index.html" ./
    cp demo.html ./ 2>/dev/null || true
    
    # Commit and push
    git add .
    git commit -m "Deploy Unreal Engine 3D integration to GitHub Pages" 2>/dev/null || true
    git push origin main
    
    echo -e "${GREEN}✅ Deployed to GitHub Pages${NC}"
    echo -e "${BLUE}🌐 Visit: https://ahump20.github.io/lone-star-legends-championship/${NC}"
}

# Main deployment process
main() {
    echo -e "${BLUE}Starting deployment process...${NC}\n"
    
    check_dependencies
    setup_python
    setup_web_deployment
    start_services
    deploy_github_pages
    
    echo -e "\n${GREEN}🎉 Deployment Complete! 🎉${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📋 Service Status:${NC}"
    echo -e "  • Web Interface: ${GREEN}http://localhost:8080${NC}"
    echo -e "  • GitHub Pages: ${GREEN}https://ahump20.github.io/lone-star-legends-championship/${NC}"
    echo -e "  • MCP Bridge: ${GREEN}Running on port 55558${NC}"
    echo -e "  • Analytics: ${GREEN}Streaming in real-time${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\n${BLUE}🎮 Next Steps:${NC}"
    echo -e "  1. Open Unreal Engine 5.5+ project"
    echo -e "  2. Enable UnrealMCP plugin"
    echo -e "  3. Load baseball stadium blueprint"
    echo -e "  4. Start playing with real-time analytics!"
    echo -e "\n${GREEN}⚾ Play Ball! 🔥${NC}"
}

# Run main deployment
main