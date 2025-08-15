/**
 * Dashboard Integration Module
 * Connects Advanced AI Player System with Real-Time Analytics Dashboard
 */

class DashboardIntegration {
    constructor() {
        this.connectedPlayers = new Map();
        this.dashboardInstance = null;
        this.dataStreamActive = false;
        this.updateInterval = null;
        this.historicalStorage = [];
        
        this.initializeConnection();
    }

    initializeConnection() {
        // Wait for dashboard to load
        this.waitForDashboard()
            .then(() => {
                this.dashboardInstance = window.dashboard;
                console.log('🔗 Dashboard Integration: Connected to Analytics Dashboard');
                this.startDataStream();
            })
            .catch(error => {
                console.error('❌ Dashboard Integration: Connection failed', error);
                this.retryConnection();
            });
    }

    async waitForDashboard(maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            if (window.dashboard) {
                return Promise.resolve();
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return Promise.reject(new Error('Dashboard not available'));
    }

    retryConnection() {
        setTimeout(() => {
            console.log('🔄 Dashboard Integration: Retrying connection...');
            this.initializeConnection();
        }, 3000);
    }

    // Connect AI player to dashboard tracking
    connectPlayer(aiPlayer) {
        if (!aiPlayer || !aiPlayer.name) {
            console.warn('⚠️ Invalid AI Player provided for dashboard connection');
            return false;
        }

        const playerId = aiPlayer.name;
        this.connectedPlayers.set(playerId, {
            aiPlayer: aiPlayer,
            lastUpdate: Date.now(),
            dataHistory: [],
            performanceMetrics: this.initializePlayerMetrics()
        });

        console.log(`🤖 Connected AI Player: ${playerId} to Dashboard Analytics`);
        
        // Initial data sync
        this.syncPlayerData(playerId);
        return true;
    }

    initializePlayerMetrics() {
        return {
            totalAtBats: 0,
            hits: 0,
            homeRuns: 0,
            strikeouts: 0,
            avgExitVelocity: 0,
            exitVelocities: [],
            decisionTimes: [],
            clutchMoments: 0,
            clutchSuccess: 0,
            biometricHistory: [],
            formProgression: []
        };
    }

    // Record at-bat result and update dashboard
    recordAtBatResult(playerId, gameContext, decision, outcome) {
        const playerData = this.connectedPlayers.get(playerId);
        if (!playerData) {
            console.warn(`⚠️ Player ${playerId} not connected to dashboard`);
            return;
        }

        const metrics = playerData.performanceMetrics;
        metrics.totalAtBats++;

        // Process outcome
        if (outcome.outcome === 'hit' || outcome.outcome === 'single' || 
            outcome.outcome === 'double' || outcome.outcome === 'triple' || 
            outcome.outcome === 'homerun') {
            metrics.hits++;
            
            if (outcome.exitVelocity) {
                metrics.exitVelocities.push(outcome.exitVelocity);
                metrics.avgExitVelocity = metrics.exitVelocities.reduce((a, b) => a + b, 0) / metrics.exitVelocities.length;
            }
        }

        if (outcome.outcome === 'homerun') {
            metrics.homeRuns++;
        }

        if (outcome.outcome === 'strikeout' || outcome.outcome === 'miss') {
            metrics.strikeouts++;
        }

        // Track clutch performance
        const pressure = this.calculateGamePressure(gameContext);
        if (pressure > 0.7) {
            metrics.clutchMoments++;
            if (outcome.outcome === 'hit' || outcome.outcome === 'homerun') {
                metrics.clutchSuccess++;
            }
        }

        // Record decision time (simulated)
        const decisionTime = 150 + Math.random() * 100; // 150-250ms range
        metrics.decisionTimes.push(decisionTime);

        // Store biometric data
        if (decision.biometricResponse) {
            metrics.biometricHistory.push({
                timestamp: Date.now(),
                heartRate: decision.biometricResponse.hrv ? 120 - decision.biometricResponse.hrv : 80,
                hrv: decision.biometricResponse.hrv || 45,
                stress: decision.biometricResponse.cortisolProxy || 0.5,
                focus: decision.mentalState ? decision.mentalState.focusLevel : 75
            });
        }

        // Update form progression
        const analysis = playerData.aiPlayer.getDetailedAnalysis();
        metrics.formProgression.push({
            timestamp: Date.now(),
            form: analysis.currentState.form,
            confidence: analysis.currentState.confidence,
            championQuotient: analysis.championQuotient
        });

        // Limit history size
        this.trimPlayerHistory(playerId);

        // Sync to dashboard
        this.syncPlayerData(playerId);
        
        console.log(`📊 Recorded at-bat for ${playerId}: ${outcome.outcome}`);
    }

    trimPlayerHistory(playerId) {
        const playerData = this.connectedPlayers.get(playerId);
        if (!playerData) return;

        const metrics = playerData.performanceMetrics;
        
        // Keep last 100 readings for each metric
        if (metrics.exitVelocities.length > 100) {
            metrics.exitVelocities = metrics.exitVelocities.slice(-100);
        }
        if (metrics.decisionTimes.length > 100) {
            metrics.decisionTimes = metrics.decisionTimes.slice(-100);
        }
        if (metrics.biometricHistory.length > 50) {
            metrics.biometricHistory = metrics.biometricHistory.slice(-50);
        }
        if (metrics.formProgression.length > 100) {
            metrics.formProgression = metrics.formProgression.slice(-100);
        }
    }

    calculateGamePressure(context) {
        if (!context) return 0;
        
        let pressure = 0;
        
        // Late inning pressure
        if (context.inning >= 8) pressure += 0.3;
        if (context.inning >= 9) pressure += 0.2;
        
        // Score differential
        if (context.score && typeof context.score === 'object') {
            const scoreDiff = Math.abs(context.score.home - context.score.away);
            if (scoreDiff <= 1) pressure += 0.3;
            if (scoreDiff <= 3) pressure += 0.1;
        }
        
        // Runners in scoring position
        if (context.runnersOnBase && context.runnersOnBase.length > 0) {
            pressure += 0.2;
        }
        
        return Math.min(pressure, 1.0);
    }

    syncPlayerData(playerId) {
        const playerData = this.connectedPlayers.get(playerId);
        if (!playerData || !this.dashboardInstance) return;

        const aiPlayer = playerData.aiPlayer;
        const metrics = playerData.performanceMetrics;
        
        // Update dashboard with current player stats
        try {
            // Use the integration function exposed by the dashboard
            if (window.integrateAIPlayerData) {
                window.integrateAIPlayerData(aiPlayer);
            }

            // Update live metrics if this is the active player
            if (this.shouldUpdateLiveMetrics(playerId)) {
                this.updateLiveMetrics(metrics);
            }

        } catch (error) {
            console.error(`❌ Error syncing data for ${playerId}:`, error);
        }
    }

    shouldUpdateLiveMetrics(playerId) {
        // Update live metrics for the most recently active player
        const playerData = this.connectedPlayers.get(playerId);
        if (!playerData) return false;

        // Check if this is the most recent player
        let mostRecentTime = 0;
        let mostRecentPlayer = null;
        
        for (const [id, data] of this.connectedPlayers.entries()) {
            if (data.lastUpdate > mostRecentTime) {
                mostRecentTime = data.lastUpdate;
                mostRecentPlayer = id;
            }
        }

        return mostRecentPlayer === playerId;
    }

    updateLiveMetrics(metrics) {
        try {
            // Update batting average
            const avg = metrics.totalAtBats > 0 ? (metrics.hits / metrics.totalAtBats) : 0;
            const avgElement = document.getElementById('battingAvg');
            if (avgElement) {
                avgElement.textContent = avg.toFixed(3);
            }

            // Update exit velocity
            if (metrics.avgExitVelocity > 0) {
                const velElement = document.getElementById('avgExitVelocity');
                if (velElement) {
                    velElement.textContent = metrics.avgExitVelocity.toFixed(1) + ' mph';
                }
            }

            // Update decision velocity
            if (metrics.decisionTimes.length > 0) {
                const avgDecision = metrics.decisionTimes.reduce((a, b) => a + b, 0) / metrics.decisionTimes.length;
                const decisionElement = document.getElementById('decisionVelocity');
                if (decisionElement) {
                    decisionElement.textContent = avgDecision.toFixed(0) + 'ms';
                }
            }

            // Update clutch factor
            const clutchFactor = metrics.clutchMoments > 0 ? 
                (metrics.clutchSuccess / metrics.clutchMoments) * 10 : 7.0;
            const clutchElement = document.getElementById('clutchFactor');
            if (clutchElement) {
                clutchElement.textContent = clutchFactor.toFixed(1) + '/10';
            }

            // Update OPS (simplified calculation)
            const obp = metrics.totalAtBats > 0 ? (metrics.hits / metrics.totalAtBats) : 0;
            const slg = metrics.totalAtBats > 0 ? 
                ((metrics.hits + metrics.homeRuns * 3) / metrics.totalAtBats) : 0;
            const ops = obp + slg;
            const opsElement = document.getElementById('ops');
            if (opsElement) {
                opsElement.textContent = ops.toFixed(3);
            }

        } catch (error) {
            console.error('❌ Error updating live metrics:', error);
        }
    }

    startDataStream() {
        if (this.dataStreamActive) return;

        this.dataStreamActive = true;
        this.updateInterval = setInterval(() => {
            this.periodicSync();
        }, 5000); // Sync every 5 seconds

        console.log('📡 Dashboard Integration: Data stream started');
    }

    stopDataStream() {
        this.dataStreamActive = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('📡 Dashboard Integration: Data stream stopped');
    }

    periodicSync() {
        // Update all connected players
        for (const [playerId, playerData] of this.connectedPlayers.entries()) {
            // Check if AI player has new data
            const currentAnalysis = playerData.aiPlayer.getDetailedAnalysis();
            
            // Store historical progression
            this.storeHistoricalData(playerId, currentAnalysis);
            
            // Sync if significant change detected
            if (this.hasSignificantChange(playerId, currentAnalysis)) {
                this.syncPlayerData(playerId);
                playerData.lastUpdate = Date.now();
            }
        }
    }

    hasSignificantChange(playerId, currentAnalysis) {
        const playerData = this.connectedPlayers.get(playerId);
        if (!playerData || !playerData.lastAnalysis) {
            playerData.lastAnalysis = currentAnalysis;
            return true;
        }

        const last = playerData.lastAnalysis;
        const current = currentAnalysis;

        // Check for significant changes (>5 point difference)
        const formChange = Math.abs(current.currentState.form - last.currentState.form);
        const confidenceChange = Math.abs(current.currentState.confidence - last.currentState.confidence);
        const quotientChange = Math.abs(current.championQuotient - last.championQuotient);

        const hasChange = formChange > 5 || confidenceChange > 5 || quotientChange > 3;
        
        if (hasChange) {
            playerData.lastAnalysis = currentAnalysis;
        }

        return hasChange;
    }

    storeHistoricalData(playerId, analysis) {
        this.historicalStorage.push({
            timestamp: Date.now(),
            playerId: playerId,
            analysis: analysis,
            sessionId: this.generateSessionId()
        });

        // Keep last 1000 historical records
        if (this.historicalStorage.length > 1000) {
            this.historicalStorage = this.historicalStorage.slice(-1000);
        }
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export comprehensive analytics data
    exportAnalytics() {
        const exportData = {
            timestamp: new Date().toISOString(),
            connectedPlayers: Array.from(this.connectedPlayers.entries()).map(([id, data]) => ({
                playerId: id,
                metrics: data.performanceMetrics,
                currentAnalysis: data.aiPlayer.getDetailedAnalysis(),
                lastUpdate: data.lastUpdate
            })),
            historicalData: this.historicalStorage,
            sessionInfo: {
                startTime: this.sessionStartTime || Date.now(),
                dataStreamActive: this.dataStreamActive,
                totalAtBats: this.getTotalAtBats()
            }
        };

        return exportData;
    }

    getTotalAtBats() {
        let total = 0;
        for (const [_, data] of this.connectedPlayers.entries()) {
            total += data.performanceMetrics.totalAtBats;
        }
        return total;
    }

    // Get performance summary for a player
    getPlayerSummary(playerId) {
        const playerData = this.connectedPlayers.get(playerId);
        if (!playerData) return null;

        const metrics = playerData.performanceMetrics;
        const analysis = playerData.aiPlayer.getDetailedAnalysis();

        return {
            name: analysis.name,
            position: analysis.position,
            championQuotient: analysis.championQuotient,
            battingAverage: metrics.totalAtBats > 0 ? (metrics.hits / metrics.totalAtBats) : 0,
            homeRuns: metrics.homeRuns,
            avgExitVelocity: metrics.avgExitVelocity,
            clutchPerformance: metrics.clutchMoments > 0 ? 
                (metrics.clutchSuccess / metrics.clutchMoments) : 0,
            currentForm: analysis.currentState.form,
            totalAtBats: metrics.totalAtBats
        };
    }

    // Cleanup and disconnect
    disconnect() {
        this.stopDataStream();
        this.connectedPlayers.clear();
        console.log('🔌 Dashboard Integration: Disconnected');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardIntegration;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.DashboardIntegration = DashboardIntegration;
}

// Example usage and auto-initialization
function initializeDashboardIntegration() {
    const integration = new DashboardIntegration();
    
    // Connect existing AI players if available
    if (window.createDemoTeam) {
        const team = window.createDemoTeam();
        team.forEach(player => {
            integration.connectPlayer(player);
        });
        console.log('🔗 Auto-connected demo team to dashboard analytics');
    }

    return integration;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Delay to ensure other components are loaded
        setTimeout(() => {
            const integration = initializeDashboardIntegration();
            window.dashboardIntegration = integration;
            
            console.log('📊 Dashboard Integration Module: READY');
            console.log('🤖 AI Player Tracking: ACTIVE');
            console.log('📡 Real-Time Analytics: STREAMING');
        }, 2000);
    });
}

console.log('🔗 Dashboard Integration Module Loaded');