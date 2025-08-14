export class AdvancedAnalyticsDashboard {
    constructor(gameEngine, leagueDataAPI, mlSystem) {
        this.gameEngine = gameEngine;
        this.leagueAPI = leagueDataAPI;
        this.mlSystem = mlSystem;
        this.visualizations = new Map();
        this.metrics = new AdvancedMetrics();
        this.realTimeProcessor = new RealTimeProcessor();
        this.dashboardState = new DashboardState();
        this.eventHandlers = new Map();
        
        this.initializeDashboard();
    }

    async initializeDashboard() {
        try {
            await this.setupMetricsEngine();
            await this.initializeRealTimeUpdates();
            this.createDashboardLayout();
            console.log('✅ Advanced Analytics Dashboard initialized');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
        }
    }

    // CORE DASHBOARD SETUP
    async setupMetricsEngine() {
        this.metricsEngine = {
            batting: new BattingMetrics(),
            pitching: new PitchingMetrics(),
            fielding: new FieldingMetrics(),
            advanced: new AdvancedSabermetrics(),
            predictive: new PredictiveAnalytics(this.mlSystem),
            comparative: new ComparativeAnalytics()
        };

        // Initialize metric calculations
        for (const [category, engine] of Object.entries(this.metricsEngine)) {
            await engine.initialize();
        }
    }

    createDashboardLayout() {
        this.layout = {
            header: this.createHeaderPanel(),
            sidebar: this.createSidebarPanel(),
            mainContent: this.createMainContentArea(),
            realTimePanel: this.createRealTimePanel(),
            controlPanel: this.createControlPanel()
        };
    }

    // REAL-TIME DATA PROCESSING
    async initializeRealTimeUpdates() {
        this.realTimeProcessor.start({
            interval: 1000, // 1 second updates
            sources: ['live_games', 'player_stats', 'team_performance'],
            onUpdate: (data) => this.handleRealTimeUpdate(data),
            onError: (error) => this.handleRealTimeError(error)
        });
    }

    handleRealTimeUpdate(data) {
        const updateTypes = {
            'live_game': this.updateLiveGameAnalytics,
            'player_stat': this.updatePlayerAnalytics,
            'team_performance': this.updateTeamAnalytics,
            'ml_prediction': this.updatePredictiveAnalytics
        };

        const handler = updateTypes[data.type];
        if (handler) {
            handler.call(this, data);
        }

        this.refreshVisualizationsForDataType(data.type);
    }

    // PLAYER ANALYTICS
    async analyzePlayer(playerId) {
        try {
            const [player, stats, advanced, statcast, predictions] = await Promise.all([
                this.leagueAPI.getPlayerData(playerId),
                this.leagueAPI.getPlayerStats(playerId),
                this.leagueAPI.getSabermetrics(playerId),
                this.leagueAPI.getStatcastData(playerId),
                this.mlSystem.predictPlayerPerformance(playerId)
            ]);

            const analytics = this.generatePlayerAnalytics(player, stats, advanced, statcast, predictions);
            this.displayPlayerAnalytics(analytics);
            
            return analytics;
        } catch (error) {
            console.error(`Failed to analyze player ${playerId}:`, error);
        }
    }

    generatePlayerAnalytics(player, stats, advanced, statcast, predictions) {
        return {
            identity: {
                name: player.fullName,
                position: player.position,
                team: player.teamId,
                age: this.calculateAge(player.birthDate)
            },
            performance: {
                current: this.calculateCurrentPerformance(stats),
                season: this.calculateSeasonMetrics(stats),
                career: this.calculateCareerProjection(stats, advanced),
                trends: this.analyzeTrends(stats, predictions)
            },
            advanced: {
                sabermetrics: this.processSabermetrics(advanced),
                statcast: this.processStatcastData(statcast),
                efficiency: this.calculateEfficiencyMetrics(stats, statcast),
                clutch: this.analyzeClutchPerformance(stats)
            },
            comparative: {
                vsLeague: this.compareToLeague(stats, player.position),
                vsPosition: this.compareToPosition(stats, player.position),
                vsSimilar: this.findSimilarPlayers(player, stats),
                historical: this.compareToHistorical(stats)
            },
            predictive: {
                nextGame: predictions.nextGame,
                restOfSeason: predictions.season,
                breakout: this.analyzeBreakoutPotential(stats, advanced, predictions),
                regression: this.analyzeRegressionRisk(stats, advanced)
            },
            insights: this.generateInsights(player, stats, advanced, predictions)
        };
    }

    // TEAM ANALYTICS
    async analyzeTeam(teamId) {
        try {
            const [team, roster, stats, schedule, standings] = await Promise.all([
                this.leagueAPI.getTeamData(teamId),
                this.leagueAPI.getTeamRoster(teamId),
                this.leagueAPI.getTeamStats(teamId),
                this.getTeamSchedule(teamId),
                this.leagueAPI.getStandings(this.getLeagueForTeam(teamId))
            ]);

            const analytics = this.generateTeamAnalytics(team, roster, stats, schedule, standings);
            this.displayTeamAnalytics(analytics);
            
            return analytics;
        } catch (error) {
            console.error(`Failed to analyze team ${teamId}:`, error);
        }
    }

    generateTeamAnalytics(team, roster, stats, schedule, standings) {
        return {
            identity: {
                name: team.name,
                division: team.division,
                record: this.getTeamRecord(standings, team.id),
                payroll: this.estimatePayroll(roster)
            },
            performance: {
                offensive: this.analyzeOffensivePerformance(stats, roster),
                defensive: this.analyzeDefensivePerformance(stats, roster),
                pitching: this.analyzePitchingPerformance(stats, roster),
                situational: this.analyzeSituationalPerformance(stats)
            },
            roster: {
                depth: this.analyzeRosterDepth(roster),
                balance: this.analyzeRosterBalance(roster),
                youth: this.analyzeYouthMovement(roster),
                veterans: this.analyzeVeteranPresence(roster)
            },
            projections: {
                playoffs: this.calculatePlayoffOdds(team, standings, schedule),
                wins: this.projectFinalRecord(team, stats, schedule),
                awards: this.predictAwardCandidates(roster),
                trades: this.identifyTradeNeeds(roster, stats)
            },
            insights: this.generateTeamInsights(team, roster, stats, standings)
        };
    }

    // LIVE GAME ANALYTICS
    async analyzeLiveGame(gameId) {
        try {
            const liveData = await this.leagueAPI.getLiveGameData(gameId);
            const analytics = this.generateLiveGameAnalytics(liveData);
            this.displayLiveGameAnalytics(analytics);
            
            return analytics;
        } catch (error) {
            console.error(`Failed to analyze live game ${gameId}:`, error);
        }
    }

    generateLiveGameAnalytics(liveData) {
        return {
            gameState: {
                inning: liveData.inning,
                situation: this.analyzeSituation(liveData),
                leverage: this.calculateLeverageIndex(liveData),
                winProbability: this.calculateWinProbability(liveData)
            },
            momentum: {
                current: this.calculateMomentum(liveData),
                shifts: this.identifyMomentumShifts(liveData),
                impact: this.analyzeMomentumImpact(liveData)
            },
            matchups: {
                batterVsPitcher: this.analyzeBatterPitcherMatchup(liveData),
                situational: this.analyzeSituationalMatchups(liveData),
                historical: this.getHistoricalMatchupData(liveData)
            },
            predictions: {
                nextPlay: this.mlSystem.predictNextPlay(liveData),
                finalScore: this.predictFinalScore(liveData),
                keyMoments: this.identifyUpcomingKeyMoments(liveData)
            }
        };
    }

    // ADVANCED CALCULATIONS
    calculateCurrentPerformance(stats) {
        if (!stats.batting) return null;
        
        const recentGames = 10; // Last 10 games
        return {
            avg: stats.batting.battingAverage,
            obp: stats.batting.onBasePercentage,
            slg: stats.batting.sluggingPercentage,
            ops: stats.batting.ops,
            wrc: this.calculateWRC(stats.batting),
            iso: this.calculateISO(stats.batting),
            babip: this.calculateBABIP(stats.batting),
            trend: this.calculateTrend(stats, recentGames)
        };
    }

    calculateWRC(battingStats) {
        // Weighted Runs Created formula
        const lgOBP = 0.320; // League average OBP
        const lgSLG = 0.420; // League average SLG
        const wOBAScale = 1.15;
        
        const wOBA = this.calculateWOBA(battingStats);
        return ((wOBA - lgOBP) / wOBAScale) * battingStats.atBats;
    }

    calculateWOBA(battingStats) {
        // Weighted On-Base Average
        const weights = {
            walk: 0.69,
            hitByPitch: 0.72,
            single: 0.89,
            double: 1.27,
            triple: 1.62,
            homeRun: 2.10
        };

        const singles = battingStats.hits - battingStats.doubles - battingStats.triples - battingStats.homeRuns;
        const totalBases = (singles * weights.single) + 
                          (battingStats.doubles * weights.double) + 
                          (battingStats.triples * weights.triple) + 
                          (battingStats.homeRuns * weights.homeRun) + 
                          (battingStats.walks * weights.walk);

        const plateAppearances = battingStats.atBats + battingStats.walks;
        return totalBases / plateAppearances;
    }

    calculateISO(battingStats) {
        // Isolated Power
        return battingStats.sluggingPercentage - battingStats.battingAverage;
    }

    calculateBABIP(battingStats) {
        // Batting Average on Balls in Play
        const hitsMinusHR = battingStats.hits - battingStats.homeRuns;
        const atBatsMinusHRMinusK = battingStats.atBats - battingStats.homeRuns - battingStats.strikeouts;
        return hitsMinusHR / atBatsMinusHRMinusK;
    }

    calculateLeverageIndex(gameData) {
        // Leverage Index calculation based on game situation
        const inning = gameData.inning;
        const inningState = gameData.topInning ? 'top' : 'bottom';
        const scoreDiff = Math.abs(gameData.homeScore - gameData.awayScore);
        const outs = gameData.outs;
        const runners = gameData.runners.length;

        let leverage = 1.0; // Base leverage

        // Inning factor
        if (inning >= 7) leverage *= 1.5;
        if (inning >= 9) leverage *= 2.0;

        // Score differential factor
        if (scoreDiff <= 1) leverage *= 2.0;
        else if (scoreDiff <= 2) leverage *= 1.5;
        else if (scoreDiff >= 5) leverage *= 0.5;

        // Outs factor
        if (outs === 2) leverage *= 1.5;

        // Runners factor
        leverage *= (1 + runners * 0.3);

        return Math.round(leverage * 10) / 10;
    }

    calculateWinProbability(gameData) {
        // Win Probability calculation
        const inning = gameData.inning;
        const scoreDiff = gameData.homeScore - gameData.awayScore;
        const inningState = gameData.topInning ? 'top' : 'bottom';
        
        let baseWinProb = 0.5;
        
        // Score differential impact
        if (scoreDiff > 0) {
            baseWinProb = 0.5 + (scoreDiff * 0.15);
        } else if (scoreDiff < 0) {
            baseWinProb = 0.5 - (Math.abs(scoreDiff) * 0.15);
        }
        
        // Inning impact
        const inningFactor = Math.max(0.1, (10 - inning) / 10);
        if (inningState === 'bottom' && scoreDiff > 0) {
            baseWinProb += 0.05; // Home team advantage in late innings
        }
        
        return Math.max(0.01, Math.min(0.99, baseWinProb));
    }

    // VISUALIZATION MANAGEMENT
    createVisualization(type, containerId, data, options = {}) {
        const visualizationTypes = {
            'line_chart': this.createLineChart,
            'bar_chart': this.createBarChart,
            'scatter_plot': this.createScatterPlot,
            'heat_map': this.createHeatMap,
            'radar_chart': this.createRadarChart,
            'box_plot': this.createBoxPlot,
            'trend_analysis': this.createTrendAnalysis,
            'comparison_chart': this.createComparisonChart
        };

        const createFunction = visualizationTypes[type];
        if (!createFunction) {
            throw new Error(`Unknown visualization type: ${type}`);
        }

        const visualization = createFunction.call(this, containerId, data, options);
        this.visualizations.set(`${type}_${containerId}`, visualization);
        
        return visualization;
    }

    createLineChart(containerId, data, options) {
        const container = document.getElementById(containerId);
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = options.width || 800;
        canvas.height = options.height || 400;
        
        return new LineChartRenderer(ctx, data, options);
    }

    createBarChart(containerId, data, options) {
        const container = document.getElementById(containerId);
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = options.width || 800;
        canvas.height = options.height || 400;
        
        return new BarChartRenderer(ctx, data, options);
    }

    createScatterPlot(containerId, data, options) {
        const container = document.getElementById(containerId);
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = options.width || 800;
        canvas.height = options.height || 400;
        
        return new ScatterPlotRenderer(ctx, data, options);
    }

    // DASHBOARD STATE MANAGEMENT
    saveState() {
        const state = {
            selectedPlayer: this.dashboardState.selectedPlayer,
            selectedTeam: this.dashboardState.selectedTeam,
            activeFilters: this.dashboardState.filters,
            visualizations: this.getVisualizationStates(),
            timestamp: Date.now()
        };
        
        localStorage.setItem('analytics_dashboard_state', JSON.stringify(state));
        return state;
    }

    loadState() {
        try {
            const saved = localStorage.getItem('analytics_dashboard_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.restoreState(state);
                return state;
            }
        } catch (error) {
            console.error('Failed to load dashboard state:', error);
        }
        return null;
    }

    restoreState(state) {
        this.dashboardState.selectedPlayer = state.selectedPlayer;
        this.dashboardState.selectedTeam = state.selectedTeam;
        this.dashboardState.filters = state.activeFilters;
        
        if (state.selectedPlayer) {
            this.analyzePlayer(state.selectedPlayer);
        }
        
        if (state.selectedTeam) {
            this.analyzeTeam(state.selectedTeam);
        }
    }

    // EXPORT FUNCTIONALITY
    exportAnalytics(format = 'json', data = null) {
        const exportData = data || this.getCurrentAnalyticsData();
        
        const exporters = {
            'json': () => JSON.stringify(exportData, null, 2),
            'csv': () => this.convertToCSV(exportData),
            'pdf': () => this.generatePDFReport(exportData),
            'excel': () => this.generateExcelReport(exportData)
        };
        
        const exporter = exporters[format];
        if (!exporter) {
            throw new Error(`Unsupported export format: ${format}`);
        }
        
        return exporter();
    }

    convertToCSV(data) {
        // Convert analytics data to CSV format
        const csvLines = [];
        
        if (data.player) {
            csvLines.push('Player Analytics');
            csvLines.push('Metric,Value');
            
            Object.entries(data.player.performance.current).forEach(([key, value]) => {
                csvLines.push(`${key},${value}`);
            });
        }
        
        return csvLines.join('\n');
    }

    // DASHBOARD PANELS
    createHeaderPanel() {
        return {
            title: 'Advanced Baseball Analytics',
            subtitle: 'Real-time performance insights and predictions',
            controls: ['export', 'settings', 'help'],
            status: 'live'
        };
    }

    createSidebarPanel() {
        return {
            sections: [
                {
                    title: 'Quick Select',
                    items: ['players', 'teams', 'games']
                },
                {
                    title: 'Filters',
                    items: ['position', 'team', 'league', 'timeframe']
                },
                {
                    title: 'Views',
                    items: ['overview', 'detailed', 'comparison', 'trends']
                }
            ]
        };
    }

    createMainContentArea() {
        return {
            tabs: [
                { id: 'overview', title: 'Overview', default: true },
                { id: 'players', title: 'Player Analytics' },
                { id: 'teams', title: 'Team Analytics' },
                { id: 'live', title: 'Live Games' },
                { id: 'predictions', title: 'ML Predictions' }
            ],
            content: {
                overview: this.createOverviewContent(),
                players: this.createPlayerContent(),
                teams: this.createTeamContent(),
                live: this.createLiveContent(),
                predictions: this.createPredictionsContent()
            }
        };
    }

    createRealTimePanel() {
        return {
            title: 'Live Updates',
            status: 'active',
            updateInterval: 1000,
            sources: ['games', 'stats', 'predictions'],
            lastUpdate: Date.now()
        };
    }

    createControlPanel() {
        return {
            refresh: () => this.refreshAllData(),
            export: () => this.showExportOptions(),
            settings: () => this.showSettings(),
            help: () => this.showHelp()
        };
    }

    // HELPER METHODS
    calculateAge(birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            return age - 1;
        }
        return age;
    }

    findSimilarPlayers(player, stats) {
        // Find players with similar performance profiles
        const similarity = this.mlSystem.findSimilarPlayers(player.id, {
            stats: stats,
            position: player.position,
            age: this.calculateAge(player.birthDate)
        });
        
        return similarity.slice(0, 5); // Top 5 similar players
    }

    generateInsights(player, stats, advanced, predictions) {
        const insights = [];
        
        // Performance insights
        if (stats.batting && stats.batting.battingAverage > 0.300) {
            insights.push({
                type: 'positive',
                message: `${player.fullName} is batting above .300 this season`,
                impact: 'high'
            });
        }
        
        // Predictive insights
        if (predictions.breakout > 0.7) {
            insights.push({
                type: 'prediction',
                message: `High breakout potential detected (${(predictions.breakout * 100).toFixed(1)}%)`,
                impact: 'high'
            });
        }
        
        // Advanced metric insights
        if (advanced.war > 5.0) {
            insights.push({
                type: 'achievement',
                message: `MVP candidate with ${advanced.war.toFixed(1)} WAR`,
                impact: 'very_high'
            });
        }
        
        return insights;
    }

    // CLEANUP
    destroy() {
        this.realTimeProcessor.stop();
        
        for (const visualization of this.visualizations.values()) {
            if (visualization.destroy) {
                visualization.destroy();
            }
        }
        
        this.visualizations.clear();
        this.eventHandlers.clear();
        
        console.log('Advanced Analytics Dashboard destroyed');
    }
}

// SUPPORTING CLASSES
class AdvancedMetrics {
    constructor() {
        this.calculations = new Map();
        this.cache = new Map();
    }

    calculate(type, data) {
        const cacheKey = `${type}_${JSON.stringify(data)}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const result = this.performCalculation(type, data);
        this.cache.set(cacheKey, result);
        
        return result;
    }

    performCalculation(type, data) {
        const calculators = {
            'war': this.calculateWAR,
            'wrc_plus': this.calculateWRCPlus,
            'fip': this.calculateFIP,
            'babip': this.calculateBABIP,
            'leverage': this.calculateLeverageIndex
        };

        const calculator = calculators[type];
        if (!calculator) {
            throw new Error(`Unknown metric type: ${type}`);
        }

        return calculator.call(this, data);
    }

    calculateWAR(playerData) {
        // Simplified WAR calculation
        const batting = playerData.battingRuns || 0;
        const fielding = playerData.fieldingRuns || 0;
        const baserunning = playerData.baserunningRuns || 0;
        const positional = this.getPositionalAdjustment(playerData.position);
        const replacement = this.getReplacementLevel(playerData.position);
        
        return (batting + fielding + baserunning + positional + replacement) / 10;
    }

    calculateWRCPlus(battingData) {
        // Weighted Runs Created Plus calculation
        const lgWOBA = 0.320;
        const wOBA = this.calculateWOBA(battingData);
        const parkFactor = battingData.parkFactor || 1.0;
        
        return ((wOBA - lgWOBA) / 1.15 + lgWOBA) * parkFactor * 100;
    }

    calculateFIP(pitchingData) {
        // Fielding Independent Pitching
        const fipConstant = 3.10;
        const innings = pitchingData.inningsPitched;
        
        const fip = ((13 * pitchingData.homeRuns) + 
                    (3 * (pitchingData.walks + pitchingData.hitByPitch)) - 
                    (2 * pitchingData.strikeouts)) / innings + fipConstant;
        
        return fip;
    }

    getPositionalAdjustment(position) {
        const adjustments = {
            'C': 12.5, '1B': -12.5, '2B': 2.5, '3B': 2.5, 'SS': 7.5,
            'LF': -7.5, 'CF': 2.5, 'RF': -7.5, 'DH': -17.5
        };
        
        return adjustments[position] || 0;
    }

    getReplacementLevel(position) {
        return 20; // Simplified replacement level
    }
}

class RealTimeProcessor {
    constructor() {
        this.isRunning = false;
        this.interval = null;
        this.callbacks = new Map();
    }

    start(config) {
        if (this.isRunning) return;

        this.isRunning = true;
        this.config = config;

        this.interval = setInterval(() => {
            this.processUpdates();
        }, config.interval || 1000);

        console.log('Real-time processor started');
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        console.log('Real-time processor stopped');
    }

    async processUpdates() {
        try {
            for (const source of this.config.sources) {
                const data = await this.fetchUpdateData(source);
                if (data && this.config.onUpdate) {
                    this.config.onUpdate(data);
                }
            }
        } catch (error) {
            if (this.config.onError) {
                this.config.onError(error);
            }
        }
    }

    async fetchUpdateData(source) {
        // Simulate real-time data fetching
        return {
            type: source,
            timestamp: Date.now(),
            data: { updated: true }
        };
    }
}

class DashboardState {
    constructor() {
        this.selectedPlayer = null;
        this.selectedTeam = null;
        this.filters = {};
        this.activeTab = 'overview';
        this.visualizationStates = new Map();
    }

    setPlayer(playerId) {
        this.selectedPlayer = playerId;
        this.notifyStateChange('player', playerId);
    }

    setTeam(teamId) {
        this.selectedTeam = teamId;
        this.notifyStateChange('team', teamId);
    }

    setFilter(key, value) {
        this.filters[key] = value;
        this.notifyStateChange('filter', { key, value });
    }

    notifyStateChange(type, data) {
        const event = new CustomEvent('dashboardStateChange', {
            detail: { type, data, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }
}