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
