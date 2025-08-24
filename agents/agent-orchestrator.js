/**
 * Agent Orchestrator - Blaze Intelligence
 * Central coordinator for all automated agents
 */

const DigitalCombineAutopilot = require('./digital-combine-autopilot');
const CardinalsReadinessBoard = require('./cardinals-readiness-board');
const InboxCallPipeline = require('./inbox-call-pipeline');

class AgentOrchestrator {
    constructor(config = {}) {
        this.config = {
            // Global agent settings
            enabledAgents: config.enabledAgents || ['autopilot', 'readiness', 'inbox'],
            healthCheckInterval: config.healthCheckInterval || 300000, // 5 minutes
            
            // Agent-specific configs
            agentConfigs: {
                autopilot: {
                    runInterval: 1800000, // 30 minutes
                    ...config.autopilot
                },
                readiness: {
                    runInterval: 600000, // 10 minutes
                    ...config.readiness
                },
                inbox: {
                    runInterval: 300000, // 5 minutes
                    ...config.inbox
                }
            },
            
            ...config
        };
        
        this.agents = new Map();
        this.healthStatus = new Map();
        this.isRunning = false;
        this.startTime = null;
        
        console.log('🤖 Agent Orchestrator initialized');
    }
    
    async initialize() {
        console.log('🚀 Initializing Blaze Intelligence Agent System...');
        
        // Initialize individual agents
        if (this.config.enabledAgents.includes('autopilot')) {
            this.agents.set('autopilot', new DigitalCombineAutopilot(this.config.agentConfigs.autopilot));
        }
        
        if (this.config.enabledAgents.includes('readiness')) {
            this.agents.set('readiness', new CardinalsReadinessBoard(this.config.agentConfigs.readiness));
        }
        
        if (this.config.enabledAgents.includes('inbox')) {
            this.agents.set('inbox', new InboxCallPipeline(this.config.agentConfigs.inbox));
        }
        
        // Set up health monitoring
        this.setupHealthMonitoring();
        
        console.log(`✅ Initialized ${this.agents.size} agents: ${Array.from(this.agents.keys()).join(', ')}`);
    }
    
    async startAll() {
        if (this.isRunning) {
            console.log('⚠️  Agent system already running');
            return;
        }
        
        console.log('🚀 Starting all agents...');
        this.isRunning = true;
        this.startTime = Date.now();
        
        const startPromises = [];
        
        for (const [name, agent] of this.agents) {
            try {
                console.log(`🔄 Starting ${name} agent...`);
                startPromises.push(agent.start());
                this.healthStatus.set(name, { status: 'starting', lastCheck: Date.now() });
            } catch (error) {
                console.error(`❌ Failed to start ${name} agent:`, error);
                this.healthStatus.set(name, { status: 'error', error: error.message, lastCheck: Date.now() });
            }
        }
        
        // Wait for all agents to start
        await Promise.allSettled(startPromises);
        
        // Start health monitoring
        this.startHealthMonitoring();
        
        console.log('✅ All agents started successfully');
        this.logSystemStatus();
    }
    
    async stopAll() {
        if (!this.isRunning) {
            console.log('⚠️  Agent system not running');
            return;
        }
        
        console.log('⏹️  Stopping all agents...');
        this.isRunning = false;
        
        // Stop health monitoring
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        // Stop all agents
        for (const [name, agent] of this.agents) {
            try {
                console.log(`⏹️  Stopping ${name} agent...`);
                agent.stop();
                this.healthStatus.set(name, { status: 'stopped', lastCheck: Date.now() });
            } catch (error) {
                console.error(`❌ Error stopping ${name} agent:`, error);
            }
        }
        
        console.log('⏹️  All agents stopped');
    }
    
    async restartAgent(agentName) {
        const agent = this.agents.get(agentName);
        if (!agent) {
            throw new Error(`Agent '${agentName}' not found`);
        }
        
        console.log(`🔄 Restarting ${agentName} agent...`);
        
        try {
            agent.stop();
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            await agent.start();
            
            this.healthStatus.set(agentName, { status: 'healthy', lastCheck: Date.now() });
            console.log(`✅ ${agentName} agent restarted successfully`);
            
        } catch (error) {
            console.error(`❌ Failed to restart ${agentName} agent:`, error);
            this.healthStatus.set(agentName, { status: 'error', error: error.message, lastCheck: Date.now() });
            throw error;
        }
    }
    
    setupHealthMonitoring() {
        console.log('🏥 Setting up health monitoring...');
        
        // Initialize health status for all agents
        for (const name of this.agents.keys()) {
            this.healthStatus.set(name, { status: 'initialized', lastCheck: Date.now() });
        }
    }
    
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, this.config.healthCheckInterval);
        
        console.log(`🏥 Health monitoring started (${this.config.healthCheckInterval / 1000}s intervals)`);
    }
    
    async performHealthCheck() {
        console.log('🏥 Performing health check...');
        
        for (const [name, agent] of this.agents) {
            try {
                const agentStatus = agent.getStatus();
                const isHealthy = this.assessAgentHealth(agentStatus);
                
                this.healthStatus.set(name, {
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    lastCheck: Date.now(),
                    agentStatus,
                    uptime: this.startTime ? Date.now() - this.startTime : 0
                });
                
                // Auto-restart unhealthy agents
                if (!isHealthy && this.config.autoRestart !== false) {
                    console.log(`🚨 Agent ${name} is unhealthy, attempting restart...`);
                    try {
                        await this.restartAgent(name);
                    } catch (error) {
                        console.error(`❌ Auto-restart failed for ${name}:`, error);
                    }
                }
                
            } catch (error) {
                console.error(`🏥 Health check failed for ${name}:`, error);
                this.healthStatus.set(name, {
                    status: 'error',
                    error: error.message,
                    lastCheck: Date.now()
                });
            }
        }
        
        this.logHealthSummary();
    }
    
    assessAgentHealth(agentStatus) {
        if (!agentStatus) return false;
        
        // Check if agent is running
        if (!agentStatus.isRunning) return false;
        
        // Check if last run was recent enough (varies by agent)
        if (agentStatus.lastRun) {
            const timeSinceLastRun = Date.now() - new Date(agentStatus.lastRun).getTime();
            const maxIdleTime = 3600000; // 1 hour max idle time
            
            if (timeSinceLastRun > maxIdleTime) return false;
        }
        
        return true;
    }
    
    logHealthSummary() {
        const healthSummary = Array.from(this.healthStatus.entries()).map(([name, status]) => {
            const statusEmoji = {
                'healthy': '✅',
                'unhealthy': '⚠️',
                'error': '❌',
                'starting': '🔄',
                'stopped': '⏹️'
            };
            
            return `${statusEmoji[status.status] || '❓'} ${name}: ${status.status}`;
        });
        
        console.log(`🏥 Health Summary: ${healthSummary.join(' | ')}`);
    }
    
    logSystemStatus() {
        console.log('📊 =================================');
        console.log('📊 BLAZE INTELLIGENCE AGENT SYSTEM');
        console.log('📊 =================================');
        console.log(`📊 Status: ${this.isRunning ? 'RUNNING' : 'STOPPED'}`);
        console.log(`📊 Uptime: ${this.getUptime()}`);
        console.log(`📊 Agents: ${this.agents.size} total, ${Array.from(this.agents.keys()).join(', ')}`);
        
        console.log('📊 Agent Details:');
        for (const [name, agent] of this.agents) {
            const status = agent.getStatus();
            console.log(`📊   ${name}:`);
            console.log(`📊     Running: ${status.isRunning ? 'YES' : 'NO'}`);
            console.log(`📊     Last Run: ${status.lastRun || 'Never'}`);
            if (status.runCount) console.log(`📊     Run Count: ${status.runCount}`);
            if (status.leadsToday) console.log(`📊     Leads Today: ${status.leadsToday}`);
            if (status.currentReadiness) console.log(`📊     Readiness: ${status.currentReadiness.toFixed(1)}%`);
        }
        
        console.log('📊 =================================');
    }
    
    // API methods for external control
    
    async getSystemStatus() {
        const agents = {};
        
        for (const [name, agent] of this.agents) {
            agents[name] = {
                ...agent.getStatus(),
                health: this.healthStatus.get(name)
            };
        }
        
        return {
            isRunning: this.isRunning,
            uptime: this.getUptime(),
            startTime: this.startTime,
            agentCount: this.agents.size,
            agents,
            lastHealthCheck: Math.max(...Array.from(this.healthStatus.values()).map(h => h.lastCheck))
        };
    }
    
    async executeCommand(command, agentName, parameters = {}) {
        console.log(`🎮 Executing command: ${command} on ${agentName || 'system'}`);
        
        switch (command) {
            case 'start':
                if (agentName) {
                    const agent = this.agents.get(agentName);
                    if (agent) await agent.start();
                } else {
                    await this.startAll();
                }
                break;
                
            case 'stop':
                if (agentName) {
                    const agent = this.agents.get(agentName);
                    if (agent) agent.stop();
                } else {
                    await this.stopAll();
                }
                break;
                
            case 'restart':
                if (agentName) {
                    await this.restartAgent(agentName);
                } else {
                    await this.stopAll();
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    await this.startAll();
                }
                break;
                
            case 'health':
                await this.performHealthCheck();
                break;
                
            case 'status':
                this.logSystemStatus();
                break;
                
            default:
                throw new Error(`Unknown command: ${command}`);
        }
        
        return { success: true, command, agentName, timestamp: Date.now() };
    }
    
    // Utility methods
    
    getUptime() {
        if (!this.startTime) return '0s';
        
        const uptime = Date.now() - this.startTime;
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
        
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    
    getAgent(name) {
        return this.agents.get(name);
    }
    
    listAgents() {
        return Array.from(this.agents.keys());
    }
}

// CLI Interface (if run directly)
if (require.main === module) {
    const orchestrator = new AgentOrchestrator();
    
    async function main() {
        try {
            await orchestrator.initialize();
            await orchestrator.startAll();
            
            // Keep process alive
            process.on('SIGINT', async () => {
                console.log('\\n🛑 Received shutdown signal...');
                await orchestrator.stopAll();
                process.exit(0);
            });
            
            // CLI command handling
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                prompt: 'blaze-agents> '
            });
            
            rl.prompt();
            
            rl.on('line', async (input) => {
                const parts = input.trim().split(' ');
                const command = parts[0];
                const agentName = parts[1];
                
                try {
                    switch (command) {
                        case 'status':
                            orchestrator.logSystemStatus();
                            break;
                        case 'health':
                            await orchestrator.performHealthCheck();
                            break;
                        case 'restart':
                            if (agentName) {
                                await orchestrator.restartAgent(agentName);
                            } else {
                                console.log('Usage: restart <agent-name>');
                            }
                            break;
                        case 'stop':
                            await orchestrator.stopAll();
                            rl.close();
                            return;
                        case 'help':
                            console.log('Available commands:');
                            console.log('  status - Show system status');
                            console.log('  health - Perform health check');
                            console.log('  restart <agent> - Restart specific agent');
                            console.log('  stop - Stop all agents and exit');
                            break;
                        default:
                            if (command) {
                                console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
                            }
                    }
                } catch (error) {
                    console.error('Command failed:', error.message);
                }
                
                rl.prompt();
            });
            
        } catch (error) {
            console.error('🚨 System startup failed:', error);
            process.exit(1);
        }
    }
    
    main().catch(console.error);
}

module.exports = AgentOrchestrator;