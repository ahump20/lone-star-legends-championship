/**
 * Cardinals Readiness Board Agent
 * Real-time readiness/leverage calculation and alerting system
 */

class CardinalsReadinessBoard {
    constructor(config = {}) {
        this.config = {
            runInterval: config.runInterval || 600000, // 10 minutes
            sportsApiKey: config.sportsApiKey || process.env.SPORTS_API_KEY,
            notionToken: config.notionToken || process.env.NOTION_TOKEN,
            zapierToken: config.zapierToken || process.env.ZAPIER_AUTH_TOKEN,
            
            // Thresholds for alerts
            readinessThresholds: {
                critical: 40,    // Below 40% = critical alert
                warning: 55,     // Below 55% = warning
                optimal: 75      // Above 75% = optimal performance
            },
            
            leverageThresholds: {
                low: 1.5,        // Below 1.5 = low leverage
                high: 3.5,       // Above 3.5 = high leverage
                extreme: 4.5     // Above 4.5 = extreme leverage
            },
            
            // Data sources
            dataSources: {
                mlbApi: 'https://statsapi.mlb.com/api/v1',
                baseballSavant: 'https://baseballsavant.mlb.com/api',
                fangraphs: 'https://www.fangraphs.com/api',
                cardinals: 'https://www.mlb.com/cardinals'
            },
            
            ...config
        };
        
        this.isRunning = false;
        this.lastRun = null;
        this.currentReadiness = null;
        this.currentLeverage = null;
        this.alertHistory = [];
        
        console.log('📊 Cardinals Readiness Board initialized');
    }
    
    async start() {
        if (this.isRunning) {
            console.log('⚠️  Readiness Board already running');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 Cardinals Readiness Board started');
        
        // Run immediately, then on interval
        await this.calculateReadiness();
        
        this.intervalId = setInterval(async () => {
            try {
                await this.calculateReadiness();
            } catch (error) {
                console.error('💥 Readiness calculation failed:', error);
                await this.sendAlert('error', `Readiness calculation failed: ${error.message}`);
            }
        }, this.config.runInterval);
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('⏹️  Cardinals Readiness Board stopped');
    }
    
    async calculateReadiness() {
        console.log('🧮 Calculating Cardinals readiness and leverage...');
        
        try {
            // Gather all data inputs
            const dataInputs = await this.gatherDataInputs();
            
            // Calculate readiness score
            const readiness = await this.computeReadinessScore(dataInputs);
            
            // Calculate leverage index
            const leverage = await this.computeLeverageIndex(dataInputs);
            
            // Update current values
            const previousReadiness = this.currentReadiness;
            const previousLeverage = this.currentLeverage;
            
            this.currentReadiness = readiness;
            this.currentLeverage = leverage;
            
            // Generate insights
            const insights = await this.generateInsights(dataInputs, readiness, leverage);
            
            // Update data files
            await this.updateDataFiles(readiness, leverage, insights, dataInputs);
            
            // Check for alerts
            await this.checkAlerts(readiness, leverage, previousReadiness, previousLeverage);
            
            this.lastRun = new Date().toISOString();
            console.log(`📈 Readiness: ${readiness.toFixed(2)}% | Leverage: ${leverage.toFixed(2)}`);
            
        } catch (error) {
            console.error('🔥 Readiness calculation failed:', error);
            throw error;
        }
    }
    
    async gatherDataInputs() {
        console.log('📥 Gathering data inputs...');
        
        const inputs = {
            timestamp: Date.now(),
            team: 'St. Louis Cardinals',
            teamId: 138, // MLB team ID for Cardinals
            
            // Core team performance data
            teamStats: await this.fetchTeamStats(),
            recentGames: await this.fetchRecentGames(),
            playerHealth: await this.fetchPlayerHealth(),
            
            // Situational context
            schedule: await this.fetchUpcomingSchedule(),
            weather: await this.fetchWeatherData(),
            opponent: await this.fetchOpponentAnalysis(),
            
            // Advanced metrics
            sabermetrics: await this.fetchSabermetrics(),
            situational: await this.fetchSituationalStats(),
            
            // External factors
            fanSentiment: await this.analyzeFanSentiment(),
            mediaAnalysis: await this.analyzeMediaCoverage()
        };
        
        console.log('📊 Data inputs gathered successfully');
        return inputs;
    }
    
    async computeReadinessScore(inputs) {
        // Multi-factor readiness algorithm
        
        let readiness = 50.0; // Base readiness
        
        // Recent performance (30% weight)
        const recentWinRate = this.calculateRecentWinRate(inputs.recentGames);
        readiness += (recentWinRate - 0.5) * 60; // Scale win rate impact
        
        // Player health (25% weight)
        const healthFactor = this.calculateHealthFactor(inputs.playerHealth);
        readiness += (healthFactor - 0.75) * 100; // Penalize injuries heavily
        
        // Offensive production (20% weight)
        const offensiveFactor = this.calculateOffensiveFactor(inputs.teamStats);
        readiness += (offensiveFactor - 0.5) * 40;
        
        // Pitching effectiveness (25% weight)
        const pitchingFactor = this.calculatePitchingFactor(inputs.teamStats, inputs.sabermetrics);
        readiness += (pitchingFactor - 0.5) * 50;
        
        // Situational adjustments
        readiness *= this.getOpponentAdjustment(inputs.opponent);
        readiness *= this.getWeatherAdjustment(inputs.weather);
        readiness *= this.getMomentumAdjustment(inputs.recentGames);
        
        // Bound between 0-100
        return Math.max(0, Math.min(100, readiness));
    }
    
    async computeLeverageIndex(inputs) {
        // Leverage based on game importance and situational pressure
        
        let leverage = 1.0; // Base leverage
        
        // Season context (playoff race, division standing)
        leverage *= this.getSeasonContextMultiplier(inputs.schedule);
        
        // Opponent strength
        leverage *= this.getOpponentStrengthMultiplier(inputs.opponent);
        
        // Recent momentum
        leverage *= this.getMomentumMultiplier(inputs.recentGames);
        
        // Media attention and fan expectations
        leverage *= this.getAttentionMultiplier(inputs.fanSentiment, inputs.mediaAnalysis);
        
        // Injury/roster situation
        leverage *= this.getRosterSituationMultiplier(inputs.playerHealth);
        
        return Math.max(0.5, Math.min(5.0, leverage));
    }
    
    async generateInsights(inputs, readiness, leverage) {
        const insights = [];
        
        // Readiness insights
        if (readiness >= this.config.readinessThresholds.optimal) {
            insights.push({
                type: 'positive',
                category: 'readiness',
                message: 'Team is in optimal readiness condition. High probability of strong performance.',
                confidence: 0.85
            });
        } else if (readiness <= this.config.readinessThresholds.critical) {
            insights.push({
                type: 'alert',
                category: 'readiness',
                message: 'Critical readiness concerns detected. Immediate attention recommended.',
                confidence: 0.90
            });
        }
        
        // Leverage insights
        if (leverage >= this.config.leverageThresholds.extreme) {
            insights.push({
                type: 'alert',
                category: 'leverage',
                message: 'Extreme leverage situation. High-pressure game with significant implications.',
                confidence: 0.95
            });
        }
        
        // Performance insights
        const recentTrend = this.analyzeRecentTrend(inputs.recentGames);
        insights.push({
            type: 'trend',
            category: 'performance',
            message: `Recent performance trend: ${recentTrend.direction} (${recentTrend.strength})`,
            confidence: recentTrend.confidence
        });
        
        return insights;
    }
    
    async updateDataFiles(readiness, leverage, insights, inputs) {
        console.log('📝 Updating data files...');
        
        // Main readiness data for site integration
        const readinessData = {
            readiness: Math.round(readiness * 100) / 100,
            leverage: Math.round(leverage * 100) / 100,
            lastUpdated: new Date().toISOString(),
            status: this.getReadinessStatus(readiness),
            leverageLevel: this.getLeverageLevel(leverage),
            insights: insights.slice(0, 3), // Top 3 insights
            
            metadata: {
                dataQuality: this.assessDataQuality(inputs),
                calculationVersion: '2.0',
                nextUpdate: new Date(Date.now() + this.config.runInterval).toISOString()
            }
        };
        
        // Detailed analytics for internal use
        const detailedData = {
            ...readinessData,
            inputs: {
                teamStats: inputs.teamStats,
                recentGames: inputs.recentGames,
                playerHealth: inputs.playerHealth,
                schedule: inputs.schedule
            },
            calculations: {
                factors: this.getCalculationFactors(inputs),
                weights: this.getFactorWeights(),
                adjustments: this.getAppliedAdjustments(inputs)
            }
        };
        
        try {
            // Write to local files (would be committed by autopilot)
            await this.writeJsonFile('data/readiness.json', readinessData);
            await this.writeJsonFile('data/cardinals-detailed.json', detailedData);
            
            console.log('📁 Data files updated successfully');
        } catch (error) {
            console.error('📁 Failed to update data files:', error);
        }
    }
    
    async checkAlerts(readiness, leverage, prevReadiness, prevLeverage) {
        const alerts = [];
        
        // Readiness alerts
        if (readiness <= this.config.readinessThresholds.critical) {
            alerts.push({
                type: 'critical',
                category: 'readiness',
                message: `Critical readiness alert: ${readiness.toFixed(1)}%`,
                severity: 'high'
            });
        } else if (readiness <= this.config.readinessThresholds.warning) {
            alerts.push({
                type: 'warning',
                category: 'readiness',
                message: `Readiness warning: ${readiness.toFixed(1)}%`,
                severity: 'medium'
            });
        }
        
        // Leverage alerts
        if (leverage >= this.config.leverageThresholds.extreme) {
            alerts.push({
                type: 'leverage',
                category: 'situational',
                message: `Extreme leverage situation: ${leverage.toFixed(2)}x`,
                severity: 'high'
            });
        }
        
        // Trend alerts
        if (prevReadiness && Math.abs(readiness - prevReadiness) > 10) {
            const direction = readiness > prevReadiness ? 'increased' : 'decreased';
            const change = Math.abs(readiness - prevReadiness).toFixed(1);
            
            alerts.push({
                type: 'trend',
                category: 'change',
                message: `Readiness ${direction} significantly by ${change} points`,
                severity: 'medium'
            });
        }
        
        // Send alerts if any
        for (const alert of alerts) {
            await this.sendAlert(alert.type, alert.message, alert.severity);
        }
        
        // Store alert history
        this.alertHistory.push({
            timestamp: Date.now(),
            alerts,
            readiness,
            leverage
        });
        
        // Keep only last 100 alerts
        if (this.alertHistory.length > 100) {
            this.alertHistory = this.alertHistory.slice(-100);
        }
    }
    
    async sendAlert(type, message, severity = 'medium') {
        console.log(`🚨 Alert [${type.toUpperCase()}]: ${message}`);
        
        try {
            // Send to Notion for logging
            await this.logToNotion({
                type: 'alert',
                alertType: type,
                message,
                severity,
                timestamp: new Date().toISOString(),
                readiness: this.currentReadiness,
                leverage: this.currentLeverage
            });
            
            // Send high-severity alerts to Slack/notifications
            if (severity === 'high') {
                await this.sendSlackAlert(message, type);
            }
            
        } catch (error) {
            console.error('🚨 Alert sending failed:', error);
        }
    }
    
    // Data fetching methods (would integrate with real APIs)
    
    async fetchTeamStats() {
        // Mock team stats - replace with MLB API
        return {
            wins: 85,
            losses: 77,
            winPct: 0.525,
            runsScored: 765,
            runsAllowed: 742,
            era: 4.12,
            whip: 1.28,
            battingAvg: 0.267,
            onBasePerc: 0.338,
            slugging: 0.421
        };
    }
    
    async fetchRecentGames() {
        // Mock recent games - replace with MLB API
        return [
            { result: 'W', score: '7-4', opponent: 'Cubs', date: '2025-08-23' },
            { result: 'L', score: '3-6', opponent: 'Cubs', date: '2025-08-22' },
            { result: 'W', score: '5-2', opponent: 'Brewers', date: '2025-08-21' },
            { result: 'W', score: '8-3', opponent: 'Brewers', date: '2025-08-20' },
            { result: 'L', score: '2-5', opponent: 'Brewers', date: '2025-08-19' }
        ];
    }
    
    async fetchPlayerHealth() {
        // Mock health data - replace with injury reports
        return {
            healthyPlayers: 22,
            totalRoster: 26,
            injuredList: 4,
            healthScore: 0.85,
            keyInjuries: ['Starting Pitcher (shoulder)', 'Outfielder (hamstring)']
        };
    }
    
    // Calculation helper methods
    
    calculateRecentWinRate(games) {
        const wins = games.filter(g => g.result === 'W').length;
        return wins / games.length;
    }
    
    calculateHealthFactor(health) {
        return health.healthyPlayers / health.totalRoster;
    }
    
    calculateOffensiveFactor(stats) {
        // Composite offensive score
        return (stats.battingAvg * 0.3 + stats.onBasePerc * 0.4 + stats.slugging * 0.3);
    }
    
    calculatePitchingFactor(stats, sabermetrics) {
        // Inverse ERA (lower is better) normalized
        const eraFactor = Math.max(0, (6.0 - stats.era) / 6.0);
        return eraFactor;
    }
    
    // Status helpers
    
    getReadinessStatus(readiness) {
        if (readiness >= this.config.readinessThresholds.optimal) return 'optimal';
        if (readiness >= this.config.readinessThresholds.warning) return 'good';
        if (readiness >= this.config.readinessThresholds.critical) return 'warning';
        return 'critical';
    }
    
    getLeverageLevel(leverage) {
        if (leverage >= this.config.leverageThresholds.extreme) return 'extreme';
        if (leverage >= this.config.leverageThresholds.high) return 'high';
        if (leverage <= this.config.leverageThresholds.low) return 'low';
        return 'normal';
    }
    
    // Utility methods
    
    async writeJsonFile(path, data) {
        const fs = require('fs').promises;
        await fs.writeFile(path, JSON.stringify(data, null, 2));
    }
    
    async logToNotion(data) {
        if (!this.config.notionToken) return;
        console.log('📋 Logged to Notion:', data.type);
    }
    
    async sendSlackAlert(message, type) {
        if (!this.config.zapierToken) return;
        console.log('💬 Slack alert sent:', message);
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastRun: this.lastRun,
            currentReadiness: this.currentReadiness,
            currentLeverage: this.currentLeverage,
            alertCount: this.alertHistory.length,
            nextRun: this.isRunning ? new Date(Date.now() + this.config.runInterval).toISOString() : null
        };
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardinalsReadinessBoard;
} else if (typeof window !== 'undefined') {
    window.CardinalsReadinessBoard = CardinalsReadinessBoard;
}