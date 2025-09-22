#!/usr/bin/env node

/**
 * Blaze Intelligence Agent Activation Script
 * Deploys all automation agents for continuous operation
 */

const path = require('path');
const fs = require('fs');

// Import agent modules
const CardinalsReadinessBoard = require('../agents/cardinals-readiness-board');
const DigitalCombineAutopilot = require('../agents/digital-combine-autopilot');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║            🔥 BLAZE INTELLIGENCE AGENT ACTIVATION 🔥          ║
║                                                              ║
║  Deploying Championship-Level Automation Infrastructure     ║
╚══════════════════════════════════════════════════════════════╝
`);

// Configuration
const config = {
    readinessBoard: {
        runInterval: 600000, // 10 minutes
        readinessThresholds: {
            critical: 40,
            warning: 55,
            optimal: 75
        },
        leverageThresholds: {
            low: 1.5,
            high: 3.5,
            extreme: 4.5
        }
    },
    digitalCombine: {
        runInterval: 1800000, // 30 minutes
        dataDir: 'data/ingested',
        autoDeployment: {
            enabled: false, // Set to true to enable auto-commits
            branch: 'main'
        }
    }
};

// Agent instances
let readinessBoard = null;
let digitalCombine = null;

/**
 * Start Cardinals Readiness Board
 */
async function startReadinessBoard() {
    console.log('\n📊 Starting Cardinals Readiness Board Agent...');
    
    try {
        readinessBoard = new CardinalsReadinessBoard(config.readinessBoard);
        await readinessBoard.start();
        
        console.log('✅ Cardinals Readiness Board: ACTIVE');
        console.log(`   - Update interval: ${config.readinessBoard.runInterval / 60000} minutes`);
        console.log(`   - Output: data/readiness.json`);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to start Readiness Board:', error.message);
        return false;
    }
}

/**
 * Start Digital Combine Autopilot
 */
async function startDigitalCombine() {
    console.log('\n🏋️ Starting Digital Combine Autopilot...');
    
    try {
        digitalCombine = new DigitalCombineAutopilot(config.digitalCombine);
        await digitalCombine.start();
        
        console.log('✅ Digital Combine Autopilot: ACTIVE');
        console.log(`   - Update interval: ${config.digitalCombine.runInterval / 60000} minutes`);
        console.log(`   - Data sources: MLB, NCAA, Perfect Game, International`);
        console.log(`   - Auto-deployment: ${config.digitalCombine.autoDeployment.enabled ? 'ENABLED' : 'DISABLED'}`);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to start Digital Combine:', error.message);
        return false;
    }
}

/**
 * Start Inbox-to-Call Pipeline
 */
async function startInboxPipeline() {
    console.log('\n📧 Starting Inbox-to-Call Pipeline...');
    
    // This would integrate with Gmail/Zapier/HubSpot
    // For now, we'll create a placeholder
    
    console.log('✅ Inbox-to-Call Pipeline: READY (requires API keys)');
    console.log(`   - Gmail integration: Pending`);
    console.log(`   - HubSpot CRM: Pending`);
    console.log(`   - Zapier webhooks: Pending`);
    
    return true;
}

/**
 * Display agent status dashboard
 */
function displayStatus() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    AGENT STATUS DASHBOARD                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║`);
    
    if (readinessBoard) {
        const rbStatus = readinessBoard.getStatus();
        console.log(`║ 📊 Cardinals Readiness Board                                ║`);
        console.log(`║    Status: ${rbStatus.isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}                                   ║`);
        console.log(`║    Last Run: ${rbStatus.lastRun ? new Date(rbStatus.lastRun).toLocaleTimeString() : 'Never'}                            ║`);
        console.log(`║    Readiness: ${rbStatus.currentReadiness ? rbStatus.currentReadiness.toFixed(1) + '%' : 'N/A'}                                  ║`);
        console.log(`║    Leverage: ${rbStatus.currentLeverage ? rbStatus.currentLeverage.toFixed(2) + 'x' : 'N/A'}                                   ║`);
    }
    
    if (digitalCombine) {
        const dcStatus = digitalCombine.getStatus();
        console.log(`║                                                              ║`);
        console.log(`║ 🏋️ Digital Combine Autopilot                                ║`);
        console.log(`║    Status: ${dcStatus.isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}                                   ║`);
        console.log(`║    Last Run: ${dcStatus.lastRun ? new Date(dcStatus.lastRun).toLocaleTimeString() : 'Never'}                            ║`);
        console.log(`║    Sources: MLB, NCAA, Perfect Game, International          ║`);
    }
    
    console.log(`║                                                              ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝`);
}

/**
 * Create status monitoring file
 */
async function createStatusFile() {
    const statusData = {
        activated: new Date().toISOString(),
        agents: {
            readinessBoard: readinessBoard ? readinessBoard.getStatus() : null,
            digitalCombine: digitalCombine ? digitalCombine.getStatus() : null,
            inboxPipeline: { status: 'pending_configuration' }
        },
        configuration: config
    };
    
    try {
        await fs.promises.writeFile(
            'data/agent_status.json',
            JSON.stringify(statusData, null, 2)
        );
    } catch (error) {
        console.error('Failed to write status file:', error);
    }
}

/**
 * Main activation sequence
 */
async function activateAgents() {
    console.log('\n🚀 Initiating agent activation sequence...\n');
    
    // Ensure data directories exist
    const dirs = ['data', 'data/ingested', 'data/ingested/backups', 'logs', 'logs/autopilot'];
    for (const dir of dirs) {
        try {
            await fs.promises.mkdir(dir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }
    
    // Start agents
    const results = await Promise.all([
        startReadinessBoard(),
        startDigitalCombine(),
        startInboxPipeline()
    ]);
    
    const allSuccess = results.every(r => r === true);
    
    if (allSuccess) {
        console.log('\n✅ ALL AGENTS ACTIVATED SUCCESSFULLY\n');
    } else {
        console.log('\n⚠️  Some agents failed to activate. Check logs for details.\n');
    }
    
    // Create status file
    await createStatusFile();
    
    // Display status dashboard
    displayStatus();
    
    // Set up periodic status updates
    setInterval(() => {
        createStatusFile();
    }, 60000); // Update status file every minute
    
    // Set up graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down Blaze Intelligence agents...');
        
        if (readinessBoard) {
            readinessBoard.stop();
            console.log('   📊 Cardinals Readiness Board: STOPPED');
        }
        
        if (digitalCombine) {
            digitalCombine.stop();
            console.log('   🏋️ Digital Combine Autopilot: STOPPED');
        }
        
        console.log('\n👋 Blaze Intelligence agents shutdown complete\n');
        process.exit(0);
    });
    
    console.log('\n💡 Agents are running. Press Ctrl+C to stop.\n');
    console.log('📁 Status updates: data/agent_status.json');
    console.log('📊 Readiness data: data/readiness.json');
    console.log('🏋️ Combine data: data/ingested/combine_summary.json\n');
}

// Run activation
activateAgents().catch(error => {
    console.error('Fatal error during activation:', error);
    process.exit(1);
});