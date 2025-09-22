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
