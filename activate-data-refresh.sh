#!/usr/bin/env bash
set -euo pipefail

# ╔══════════════════════════════════════════════════════════════╗
# ║     🔄 BLAZE CONTINUOUS DATA REFRESH ACTIVATION SCRIPT 🔄     ║
# ╚══════════════════════════════════════════════════════════════╝

echo "
╔══════════════════════════════════════════════════════════════╗
║     🔄 BLAZE CONTINUOUS DATA REFRESH ACTIVATION 🔄            ║
╚══════════════════════════════════════════════════════════════╝
"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed"
        exit 1
    fi
    
    # Check Redis (optional but recommended)
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            log_success "Redis is running"
        else
            log_warning "Redis is installed but not running. Starting Redis..."
            redis-server --daemonize yes
        fi
    else
        log_warning "Redis not found. Using in-memory caching (not recommended for production)"
    fi
    
    log_success "Prerequisites checked"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Create package.json if it doesn't exist
    if [ ! -f package.json ]; then
        cat > package.json << 'EOF'
{
  "name": "blaze-intelligence-data-system",
  "version": "2.0.0",
  "type": "module",
  "description": "Continuous Data Refresh System for Blaze Intelligence",
  "scripts": {
    "start": "node orchestration/ingestion-pipeline.js",
    "test": "node orchestration/ingestion-pipeline.js test",
    "havf": "node agents/havf-evaluation-engine.js",
    "connector": "node agents/multi-league-connector.js",
    "monitor": "node scripts/monitor-pipeline.js"
  },
  "dependencies": {
    "node-cron": "^3.0.3",
    "redis": "^4.6.0",
    "axios": "^1.6.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  }
}
EOF
        log_success "Created package.json"
    fi
    
    # Install dependencies
    npm install
    
    log_success "Dependencies installed"
}

# Create environment configuration
setup_environment() {
    log_info "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        cat > .env << 'EOF'
# Blaze Intelligence Data System Configuration

# Redis Configuration
REDIS_URL=redis://localhost:6379

# API Keys (Replace with actual keys)
CFBD_API_KEY=your_college_football_data_api_key
PG_API_KEY=your_perfect_game_api_key
MLB_API_KEY=your_mlb_api_key
NFL_API_KEY=your_nfl_api_key
NBA_API_KEY=your_nba_api_key

# Data Refresh Settings
REFRESH_INTERVAL_MLB=daily
REFRESH_INTERVAL_NFL=weekly
REFRESH_INTERVAL_NBA=daily
REFRESH_INTERVAL_NCAA=biweekly
REFRESH_INTERVAL_NIL=6hours

# Pipeline Configuration
MAX_PARALLEL_JOBS=3
BATCH_SIZE=100
RETRY_ATTEMPTS=3

# Logging
LOG_LEVEL=info
LOG_FILE=logs/pipeline.log

# Deployment
NODE_ENV=production
PORT=3000
EOF
        log_warning ".env file created. Please update with actual API keys"
    else
        log_info ".env file already exists"
    fi
    
    log_success "Environment configured"
}

# Create monitoring script
create_monitor() {
    log_info "Creating monitoring system..."
    
    mkdir -p scripts
    
    cat > scripts/monitor-pipeline.js << 'EOF'
#!/usr/bin/env node

/**
 * Pipeline Monitoring Dashboard
 * Real-time monitoring of the Blaze Intelligence data refresh system
 */

import { createClient } from 'redis';
import http from 'http';
import fs from 'fs/promises';

class PipelineMonitor {
    constructor() {
        this.redis = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        this.port = process.env.MONITOR_PORT || 3001;
    }

    async start() {
        await this.redis.connect();
        
        const server = http.createServer(async (req, res) => {
            if (req.url === '/health') {
                const health = await this.getHealth();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(health));
            } else if (req.url === '/') {
                const dashboard = await this.getDashboard();
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(dashboard);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`📊 Monitor running at http://localhost:${this.port}`);
        });
    }

    async getHealth() {
        const keys = await this.redis.keys('blaze:processed:*');
        const jobs = await this.redis.get('blaze:pipeline:state');
        
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            processedDatasets: keys.length,
            activeJobs: jobs ? JSON.parse(jobs).activeJobs.length : 0,
            redis: 'connected',
            uptime: process.uptime()
        };
    }

    async getDashboard() {
        const health = await this.getHealth();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Blaze Pipeline Monitor</title>
    <style>
        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: linear-gradient(135deg, #0A0A0F, #050507);
            color: #F8F9FA;
            padding: 2rem;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            background: linear-gradient(45deg, #BF5700, #FFB81C);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        .status-card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 1.5rem;
        }
        .metric {
            font-size: 2rem;
            font-weight: bold;
            color: #FFB81C;
        }
        .label {
            color: #888;
            margin-top: 0.5rem;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10B981;
            margin-right: 0.5rem;
        }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <div class="container">
        <h1>🔥 Blaze Intelligence Pipeline Monitor</h1>
        
        <div class="status-grid">
            <div class="status-card">
                <span class="status-indicator"></span>Status
                <div class="metric">${health.status.toUpperCase()}</div>
                <div class="label">System Health</div>
            </div>
            
            <div class="status-card">
                <div class="metric">${health.processedDatasets}</div>
                <div class="label">Processed Datasets</div>
            </div>
            
            <div class="status-card">
                <div class="metric">${health.activeJobs}</div>
                <div class="label">Active Jobs</div>
            </div>
            
            <div class="status-card">
                <div class="metric">${Math.floor(health.uptime / 60)}m</div>
                <div class="label">Uptime</div>
            </div>
        </div>
        
        <div style="margin-top: 2rem; opacity: 0.7;">
            Last Updated: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
        `;
    }
}

const monitor = new PipelineMonitor();
monitor.start();
EOF
    
    chmod +x scripts/monitor-pipeline.js
    
    log_success "Monitoring system created"
}

# Create systemd service (Linux/macOS with systemd)
create_service() {
    log_info "Creating system service..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux with systemd
        sudo tee /etc/systemd/system/blaze-pipeline.service > /dev/null << EOF
[Unit]
Description=Blaze Intelligence Data Pipeline
After=network.target redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node orchestration/ingestion-pipeline.js
Restart=on-failure
RestartSec=10
StandardOutput=append:$(pwd)/logs/pipeline.log
StandardError=append:$(pwd)/logs/pipeline-error.log

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable blaze-pipeline
        log_success "Systemd service created"
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS with launchd
        cat > ~/Library/LaunchAgents/com.blazeintelligence.pipeline.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.blazeintelligence.pipeline</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$(pwd)/orchestration/ingestion-pipeline.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$(pwd)/logs/pipeline.log</string>
    <key>StandardErrorPath</key>
    <string>$(pwd)/logs/pipeline-error.log</string>
</dict>
</plist>
EOF
        
        launchctl load ~/Library/LaunchAgents/com.blazeintelligence.pipeline.plist
        log_success "LaunchAgent created"
    else
        log_warning "Auto-start service not configured for this OS"
    fi
}

# Start the pipeline
start_pipeline() {
    log_info "Starting data refresh pipeline..."
    
    # Create necessary directories
    mkdir -p logs data/ingested data/processed data/cardinals
    
    # Start pipeline in background
    nohup node orchestration/ingestion-pipeline.js > logs/pipeline.log 2>&1 &
    PIPELINE_PID=$!
    
    echo $PIPELINE_PID > .pipeline.pid
    
    sleep 3
    
    # Check if pipeline started successfully
    if ps -p $PIPELINE_PID > /dev/null; then
        log_success "Pipeline started (PID: $PIPELINE_PID)"
    else
        log_error "Pipeline failed to start"
        exit 1
    fi
    
    # Start monitor
    nohup node scripts/monitor-pipeline.js > logs/monitor.log 2>&1 &
    MONITOR_PID=$!
    echo $MONITOR_PID > .monitor.pid
    
    log_success "Monitor started (PID: $MONITOR_PID)"
}

# Test the system
test_system() {
    log_info "Testing data refresh system..."
    
    # Test MLB ingestion
    log_info "Testing MLB data ingestion for Cardinals..."
    node orchestration/ingestion-pipeline.js test MLB STL
    
    # Check if data was created
    if [ -d "data/processed/MLB" ]; then
        log_success "MLB data processing successful"
    else
        log_warning "MLB data not found"
    fi
    
    # Test HAV-F evaluation
    log_info "Testing HAV-F evaluation engine..."
    node agents/havf-evaluation-engine.js
    
    log_success "System tests completed"
}

# Display status
display_status() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         🎉 DATA REFRESH SYSTEM ACTIVATED! 🎉                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 System Status:"
    echo "   Pipeline: RUNNING (PID: $(cat .pipeline.pid 2>/dev/null || echo 'N/A'))"
    echo "   Monitor: RUNNING (PID: $(cat .monitor.pid 2>/dev/null || echo 'N/A'))"
    echo ""
    echo "🌐 Access Points:"
    echo "   Monitor Dashboard: http://localhost:3001"
    echo "   Health Check: http://localhost:3001/health"
    echo ""
    echo "📅 Refresh Schedule:"
    echo "   MLB: Daily at 2 AM"
    echo "   NFL: Mondays at 3 AM"
    echo "   NBA: Daily at 4 AM"
    echo "   NCAA Football: Tuesdays & Saturdays at 5 AM"
    echo "   NCAA Baseball: Wednesdays & Sundays at 6 AM"
    echo "   Perfect Game: Fridays at 7 AM"
    echo "   NIL: Every 6 hours"
    echo "   International: Thursdays at 8 AM"
    echo ""
    echo "📝 Logs:"
    echo "   Pipeline: logs/pipeline.log"
    echo "   Monitor: logs/monitor.log"
    echo ""
    echo "🛑 To stop the system:"
    echo "   ./stop-data-refresh.sh"
    echo ""
}

# Create stop script
create_stop_script() {
    cat > stop-data-refresh.sh << 'EOF'
#!/usr/bin/env bash

echo "Stopping Blaze data refresh system..."

# Stop pipeline
if [ -f .pipeline.pid ]; then
    kill $(cat .pipeline.pid) 2>/dev/null
    rm .pipeline.pid
    echo "✅ Pipeline stopped"
fi

# Stop monitor
if [ -f .monitor.pid ]; then
    kill $(cat .monitor.pid) 2>/dev/null
    rm .monitor.pid
    echo "✅ Monitor stopped"
fi

# Stop service if exists
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl stop blaze-pipeline 2>/dev/null
elif [[ "$OSTYPE" == "darwin"* ]]; then
    launchctl unload ~/Library/LaunchAgents/com.blazeintelligence.pipeline.plist 2>/dev/null
fi

echo "✅ Data refresh system stopped"
EOF
    
    chmod +x stop-data-refresh.sh
}

# Main execution
main() {
    log_info "Activating Blaze Intelligence Continuous Data Refresh System..."
    
    check_prerequisites
    install_dependencies
    setup_environment
    create_monitor
    create_service
    create_stop_script
    start_pipeline
    test_system
    display_status
}

# Run main function
main "$@"