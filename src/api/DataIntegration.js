export class DataIntegration {
    constructor(gameEngine, leagueDataAPI) {
        this.gameEngine = gameEngine;
        this.leagueAPI = leagueDataAPI;
        this.syncScheduler = new SyncScheduler();
        this.dataMapper = new DataMapper();
        this.conflictResolver = new ConflictResolver();
        this.syncHistory = [];
        
        this.initializeIntegration();
    }

    async initializeIntegration() {
        try {
            await this.setupSyncSchedule();
            await this.performInitialSync();
            console.log('✅ Data integration initialized');
        } catch (error) {
            console.error('❌ Data integration failed:', error);
        }
    }

    // SYNC MANAGEMENT
    async setupSyncSchedule() {
        // Schedule different types of data syncs
        this.syncScheduler.schedule('teams', this.syncTeamData.bind(this), '0 2 * * *'); // Daily at 2 AM
        this.syncScheduler.schedule('players', this.syncPlayerData.bind(this), '0 3 * * *'); // Daily at 3 AM
        this.syncScheduler.schedule('stats', this.syncStatistics.bind(this), '*/30 * * * *'); // Every 30 minutes
        this.syncScheduler.schedule('standings', this.syncStandings.bind(this), '0 */4 * * *'); // Every 4 hours
        this.syncScheduler.schedule('schedule', this.syncSchedule.bind(this), '0 1 * * *'); // Daily at 1 AM
    }

    async performInitialSync() {
        console.log('🔄 Starting initial data sync...');
        
        const syncTasks = [
            { name: 'teams', task: this.syncTeamData.bind(this) },
            { name: 'standings', task: this.syncStandings.bind(this) },
            { name: 'schedule', task: this.syncSchedule.bind(this) },
            { name: 'players', task: this.syncPlayerData.bind(this) },
            { name: 'stats', task: this.syncStatistics.bind(this) }
        ];

        for (const { name, task } of syncTasks) {
            try {
                console.log(`Syncing ${name}...`);
                await task();
                console.log(`✅ ${name} sync completed`);
            } catch (error) {
                console.error(`❌ ${name} sync failed:`, error);
            }
        }

        console.log('✅ Initial sync completed');
    }

    // TEAM DATA SYNC
    async syncTeamData() {
        try {
            const realTeams = await this.leagueAPI.getAllTeams();
            const gameTeams = this.gameEngine.getAllTeams();
            
            for (const realTeam of realTeams) {
                const gameTeam = gameTeams.find(t => t.realWorldId === realTeam.id);
                
                if (gameTeam) {
                    // Update existing team
                    await this.updateGameTeam(gameTeam, realTeam);
                } else {
                    // Create new team
                    await this.createGameTeam(realTeam);
                }
            }
            
            this.recordSync('teams', realTeams.length, 0);
        } catch (error) {
            this.recordSync('teams', 0, 1, error.message);
            throw error;
        }
    }

    async updateGameTeam(gameTeam, realTeam) {
        const conflicts = this.conflictResolver.detectTeamConflicts(gameTeam, realTeam);
        
        if (conflicts.length > 0) {
            const resolution = await this.conflictResolver.resolveTeamConflicts(conflicts);
            await this.applyTeamResolution(gameTeam, realTeam, resolution);
        } else {
            // Direct update
            const mappedData = this.dataMapper.mapTeamData(realTeam);
            await this.gameEngine.updateTeam(gameTeam.id, mappedData);
        }
    }

    async createGameTeam(realTeam) {
        const mappedData = this.dataMapper.mapTeamData(realTeam);
        const gameTeam = await this.gameEngine.createTeam(mappedData);
        
        // Link to real-world team
        gameTeam.realWorldId = realTeam.id;
        gameTeam.dataSource = 'mlb_api';
        gameTeam.lastSync = Date.now();
        
        return gameTeam;
    }

    // PLAYER DATA SYNC
    async syncPlayerData() {
        try {
            const teams = this.gameEngine.getAllTeams();
            let totalPlayers = 0;
            let errors = 0;

            for (const team of teams) {
                if (!team.realWorldId) continue;
                
                try {
                    const roster = await this.leagueAPI.getTeamRoster(team.realWorldId);
                    await this.syncTeamRoster(team, roster);
                    totalPlayers += roster.length;
                } catch (error) {
                    console.error(`Failed to sync roster for ${team.name}:`, error);
                    errors++;
                }
            }
            
            this.recordSync('players', totalPlayers, errors);
        } catch (error) {
            this.recordSync('players', 0, 1, error.message);
            throw error;
        }
    }

    async syncTeamRoster(gameTeam, realRoster) {
        const gameRoster = this.gameEngine.getTeamRoster(gameTeam.id);
        
        for (const realPlayer of realRoster) {
            const gamePlayer = gameRoster.find(p => p.realWorldId === realPlayer.id);
            
            if (gamePlayer) {
                await this.updateGamePlayer(gamePlayer, realPlayer);
            } else {
                await this.createGamePlayer(realPlayer, gameTeam.id);
            }
        }
        
        // Handle players no longer on roster
        await this.handleRosterMoves(gameRoster, realRoster, gameTeam.id);
    }

    async updateGamePlayer(gamePlayer, realPlayer) {
        const conflicts = this.conflictResolver.detectPlayerConflicts(gamePlayer, realPlayer);
        
        if (conflicts.length > 0) {
            const resolution = await this.conflictResolver.resolvePlayerConflicts(conflicts);
            await this.applyPlayerResolution(gamePlayer, realPlayer, resolution);
        } else {
            const mappedData = this.dataMapper.mapPlayerData(realPlayer);
            await this.gameEngine.updatePlayer(gamePlayer.id, mappedData);
        }
    }

    async createGamePlayer(realPlayer, teamId) {
        const mappedData = this.dataMapper.mapPlayerData(realPlayer);
        mappedData.teamId = teamId;
        
        const gamePlayer = await this.gameEngine.createPlayer(mappedData);
        gamePlayer.realWorldId = realPlayer.id;
        gamePlayer.dataSource = 'mlb_api';
        gamePlayer.lastSync = Date.now();
        
        return gamePlayer;
    }

    async handleRosterMoves(gameRoster, realRoster, teamId) {
        const realPlayerIds = new Set(realRoster.map(p => p.id));
        
        for (const gamePlayer of gameRoster) {
            if (gamePlayer.realWorldId && !realPlayerIds.has(gamePlayer.realWorldId)) {
                // Player no longer on team - handle trade/release
                await this.handlePlayerMove(gamePlayer);
            }
        }
    }

    async handlePlayerMove(gamePlayer) {
        // Try to find player's new team
        const allTeams = this.gameEngine.getAllTeams();
        
        for (const team of allTeams) {
            if (!team.realWorldId) continue;
            
            try {
                const roster = await this.leagueAPI.getTeamRoster(team.realWorldId);
                const foundPlayer = roster.find(p => p.id === gamePlayer.realWorldId);
                
                if (foundPlayer) {
                    // Player moved to new team
                    await this.gameEngine.transferPlayer(gamePlayer.id, team.id);
                    console.log(`Player ${gamePlayer.name} transferred to ${team.name}`);
                    return;
                }
            } catch (error) {
                console.error(`Error checking roster for ${team.name}:`, error);
            }
        }
        
        // Player not found on any team - mark as free agent or retired
        await this.gameEngine.updatePlayer(gamePlayer.id, { 
            status: 'free_agent',
            teamId: null 
        });
    }

    // STATISTICS SYNC
    async syncStatistics() {
        try {
            const players = this.gameEngine.getAllPlayers().filter(p => p.realWorldId);
            let statsUpdated = 0;
            let errors = 0;

            for (const player of players) {
                try {
                    const realStats = await this.leagueAPI.getPlayerStats(player.realWorldId);
                    await this.updatePlayerStats(player, realStats);
                    statsUpdated++;
                } catch (error) {
                    console.error(`Failed to sync stats for ${player.name}:`, error);
                    errors++;
                }
            }
            
            this.recordSync('stats', statsUpdated, errors);
        } catch (error) {
            this.recordSync('stats', 0, 1, error.message);
            throw error;
        }
    }

    async updatePlayerStats(gamePlayer, realStats) {
        const mappedStats = this.dataMapper.mapPlayerStats(realStats);
        
        // Handle conflicts between game stats and real stats
        const conflicts = this.conflictResolver.detectStatsConflicts(gamePlayer.stats, mappedStats);
        
        if (conflicts.length > 0) {
            const resolution = await this.conflictResolver.resolveStatsConflicts(conflicts);
            await this.applyStatsResolution(gamePlayer, mappedStats, resolution);
        } else {
            await this.gameEngine.updatePlayerStats(gamePlayer.id, mappedStats);
        }
    }

    // STANDINGS SYNC
    async syncStandings() {
        try {
            const leagues = [103, 104]; // AL and NL
            let totalTeams = 0;

            for (const leagueId of leagues) {
                const standings = await this.leagueAPI.getStandings(leagueId);
                await this.updateGameStandings(standings);
                totalTeams += standings.reduce((sum, div) => sum + div.teams.length, 0);
            }
            
            this.recordSync('standings', totalTeams, 0);
        } catch (error) {
            this.recordSync('standings', 0, 1, error.message);
            throw error;
        }
    }

    async updateGameStandings(standings) {
        for (const division of standings) {
            for (const teamRecord of division.teams) {
                const gameTeam = this.gameEngine.getTeamByRealWorldId(teamRecord.teamId);
                
                if (gameTeam) {
                    await this.gameEngine.updateTeamRecord(gameTeam.id, {
                        wins: teamRecord.wins,
                        losses: teamRecord.losses,
                        winningPercentage: teamRecord.pct,
                        gamesBack: teamRecord.gb,
                        streak: teamRecord.streak
                    });
                }
            }
        }
    }

    // SCHEDULE SYNC
    async syncSchedule() {
        try {
            const teams = this.gameEngine.getAllTeams().filter(t => t.realWorldId);
            const today = new Date();
            const endDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days ahead
            
            let gamesUpdated = 0;

            for (const team of teams) {
                try {
                    const schedule = await this.leagueAPI.getSchedule(
                        team.realWorldId,
                        today.toISOString().split('T')[0],
                        endDate.toISOString().split('T')[0]
                    );
                    
                    await this.updateTeamSchedule(team, schedule);
                    gamesUpdated += schedule.length;
                } catch (error) {
                    console.error(`Failed to sync schedule for ${team.name}:`, error);
                }
            }
            
            this.recordSync('schedule', gamesUpdated, 0);
        } catch (error) {
            this.recordSync('schedule', 0, 1, error.message);
            throw error;
        }
    }

    async updateTeamSchedule(team, schedule) {
        for (const game of schedule) {
            const existingGame = this.gameEngine.getGameByRealWorldId(game.gameId);
            
            if (existingGame) {
                await this.gameEngine.updateGame(existingGame.id, this.dataMapper.mapGameData(game));
            } else {
                const mappedGame = this.dataMapper.mapGameData(game);
                mappedGame.realWorldId = game.gameId;
                await this.gameEngine.createGame(mappedGame);
            }
        }
    }

    // LIVE DATA INTEGRATION
    async syncLiveGameData(gameId) {
        try {
            const liveData = await this.leagueAPI.getLiveGameData(gameId);
            const gameMatch = this.gameEngine.getGameByRealWorldId(gameId);
            
            if (gameMatch && gameMatch.isActive()) {
                await this.updateLiveGameState(gameMatch, liveData);
            }
        } catch (error) {
            console.error(`Failed to sync live data for game ${gameId}:`, error);
        }
    }

    async updateLiveGameState(gameMatch, liveData) {
        const mappedState = this.dataMapper.mapLiveGameData(liveData);
        
        // Only update if game is still live
        if (mappedState.status === 'Live' || mappedState.status === 'In Progress') {
            await this.gameEngine.updateGameState(gameMatch.id, mappedState);
        }
    }

    // ADVANCED METRICS SYNC
    async syncAdvancedMetrics() {
        try {
            const players = this.gameEngine.getAllPlayers().filter(p => p.realWorldId);
            let metricsUpdated = 0;

            for (const player of players.slice(0, 50)) { // Limit to prevent rate limiting
                try {
                    const [sabermetrics, statcast] = await Promise.all([
                        this.leagueAPI.getSabermetrics(player.realWorldId),
                        this.leagueAPI.getStatcastData(player.realWorldId)
                    ]);
                    
                    await this.updatePlayerAdvancedMetrics(player, sabermetrics, statcast);
                    metricsUpdated++;
                } catch (error) {
                    console.error(`Failed to sync advanced metrics for ${player.name}:`, error);
                }
            }
            
            this.recordSync('advanced_metrics', metricsUpdated, 0);
        } catch (error) {
            this.recordSync('advanced_metrics', 0, 1, error.message);
        }
    }

    async updatePlayerAdvancedMetrics(player, sabermetrics, statcast) {
        const mappedMetrics = this.dataMapper.mapAdvancedMetrics(sabermetrics, statcast);
        await this.gameEngine.updatePlayerMetrics(player.id, mappedMetrics);
    }

    // CONFLICT RESOLUTION
    async applyTeamResolution(gameTeam, realTeam, resolution) {
        const updates = {};
        
        for (const [field, action] of Object.entries(resolution)) {
            switch (action) {
                case 'use_real':
                    updates[field] = realTeam[field];
                    break;
                case 'use_game':
                    // Keep existing game value
                    break;
                case 'merge':
                    updates[field] = this.dataMapper.mergeTeamField(gameTeam[field], realTeam[field], field);
                    break;
            }
        }
        
        if (Object.keys(updates).length > 0) {
            await this.gameEngine.updateTeam(gameTeam.id, updates);
        }
    }

    async applyPlayerResolution(gamePlayer, realPlayer, resolution) {
        const updates = {};
        
        for (const [field, action] of Object.entries(resolution)) {
            switch (action) {
                case 'use_real':
                    updates[field] = realPlayer[field];
                    break;
                case 'use_game':
                    break;
                case 'merge':
                    updates[field] = this.dataMapper.mergePlayerField(gamePlayer[field], realPlayer[field], field);
                    break;
            }
        }
        
        if (Object.keys(updates).length > 0) {
            await this.gameEngine.updatePlayer(gamePlayer.id, updates);
        }
    }

    async applyStatsResolution(gamePlayer, realStats, resolution) {
        const updates = {};
        
        for (const [field, action] of Object.entries(resolution)) {
            switch (action) {
                case 'use_real':
                    updates[field] = realStats[field];
                    break;
                case 'use_game':
                    break;
                case 'scale_to_real':
                    // Scale game stats to match real-world pace
                    updates[field] = this.dataMapper.scaleGameStats(gamePlayer.stats[field], realStats[field]);
                    break;
            }
        }
        
        if (Object.keys(updates).length > 0) {
            await this.gameEngine.updatePlayerStats(gamePlayer.id, updates);
        }
    }

    // SYNC MONITORING
    recordSync(type, successes, failures, error = null) {
        const record = {
            timestamp: Date.now(),
            type,
            successes,
            failures,
            error,
            duration: Date.now() - this.lastSyncStart
        };
        
        this.syncHistory.push(record);
        
        // Keep only last 100 sync records
        if (this.syncHistory.length > 100) {
            this.syncHistory = this.syncHistory.slice(-100);
        }
    }

    getSyncStatus() {
        const recent = this.syncHistory.slice(-10);
        
        return {
            lastSync: Math.max(...recent.map(r => r.timestamp)),
            totalSyncs: this.syncHistory.length,
            recentSuccess: recent.filter(r => r.failures === 0).length,
            recentFailures: recent.filter(r => r.failures > 0).length,
            scheduledSyncs: this.syncScheduler.getSchedule(),
            apiStatus: this.leagueAPI.getAPIStatus()
        };
    }

    // MANUAL SYNC CONTROLS
    async forceSyncAll() {
        console.log('🔄 Starting manual full sync...');
        this.lastSyncStart = Date.now();
        
        await this.performInitialSync();
        await this.syncAdvancedMetrics();
        
        console.log('✅ Manual full sync completed');
    }

    async forceSyncTeam(teamId) {
        const team = this.gameEngine.getTeam(teamId);
        if (!team || !team.realWorldId) {
            throw new Error('Team not found or not linked to real data');
        }
        
        const realTeam = await this.leagueAPI.getTeamData(team.realWorldId);
        const roster = await this.leagueAPI.getTeamRoster(team.realWorldId);
        
        await this.updateGameTeam(team, realTeam);
        await this.syncTeamRoster(team, roster);
        
        console.log(`✅ Manual sync completed for ${team.name}`);
    }

    // CLEANUP
    cleanup() {
        this.syncScheduler.stop();
        this.syncHistory = [];
        console.log('🧹 Data integration cleaned up');
    }
}

class SyncScheduler {
    constructor() {
        this.jobs = new Map();
        this.intervals = new Map();
    }

    schedule(name, task, cronPattern) {
        this.jobs.set(name, { task, cronPattern });
        
        // For demo, convert cron to simple interval
        const interval = this.cronToInterval(cronPattern);
        const intervalId = setInterval(async () => {
            try {
                console.log(`🔄 Running scheduled sync: ${name}`);
                await task();
            } catch (error) {
                console.error(`❌ Scheduled sync failed (${name}):`, error);
            }
        }, interval);
        
        this.intervals.set(name, intervalId);
    }

    cronToInterval(cronPattern) {
        // Simple conversion for common patterns
        if (cronPattern.includes('*/30 * * * *')) return 30 * 60 * 1000; // 30 minutes
        if (cronPattern.includes('0 */4 * * *')) return 4 * 60 * 60 * 1000; // 4 hours
        if (cronPattern.includes('* * *')) return 24 * 60 * 60 * 1000; // Daily
        return 60 * 60 * 1000; // Default 1 hour
    }

    getSchedule() {
        return Array.from(this.jobs.entries()).map(([name, job]) => ({
            name,
            cronPattern: job.cronPattern,
            nextRun: 'Calculated based on cron'
        }));
    }

    stop() {
        for (const intervalId of this.intervals.values()) {
            clearInterval(intervalId);
        }
        this.intervals.clear();
    }
}

class DataMapper {
    mapTeamData(realTeam) {
        return {
            name: realTeam.name,
            city: realTeam.city,
            abbreviation: realTeam.abbreviation,
            division: realTeam.division,
            league: realTeam.league,
            colors: realTeam.colors,
            venue: realTeam.venue,
            founded: realTeam.founded,
            realWorldId: realTeam.id,
            dataSource: 'mlb_api',
            lastSync: Date.now()
        };
    }

    mapPlayerData(realPlayer) {
        return {
            name: realPlayer.fullName,
            firstName: realPlayer.firstName,
            lastName: realPlayer.lastName,
            jerseyNumber: parseInt(realPlayer.primaryNumber) || 0,
            position: realPlayer.position,
            birthDate: realPlayer.birthDate,
            height: realPlayer.height,
            weight: realPlayer.weight,
            bats: realPlayer.bats,
            throws: realPlayer.throws,
            mlbDebut: realPlayer.mlbDebutDate,
            active: realPlayer.active,
            realWorldId: realPlayer.id,
            dataSource: 'mlb_api',
            lastSync: Date.now()
        };
    }

    mapPlayerStats(realStats) {
        const mapped = {
            season: realStats.season,
            lastUpdated: Date.now()
        };

        if (realStats.batting) {
            mapped.batting = {
                games: realStats.batting.gamesPlayed,
                atBats: realStats.batting.atBats,
                runs: realStats.batting.runs,
                hits: realStats.batting.hits,
                doubles: realStats.batting.doubles,
                triples: realStats.batting.triples,
                homeRuns: realStats.batting.homeRuns,
                rbi: realStats.batting.rbi,
                stolenBases: realStats.batting.stolenBases,
                walks: realStats.batting.walks,
                strikeouts: realStats.batting.strikeouts,
                average: realStats.batting.battingAverage,
                obp: realStats.batting.onBasePercentage,
                slg: realStats.batting.sluggingPercentage,
                ops: realStats.batting.ops
            };
        }

        if (realStats.pitching) {
            mapped.pitching = {
                games: realStats.pitching.gamesPlayed,
                starts: realStats.pitching.gamesStarted,
                wins: realStats.pitching.wins,
                losses: realStats.pitching.losses,
                saves: realStats.pitching.saves,
                innings: realStats.pitching.inningsPitched,
                hits: realStats.pitching.hits,
                runs: realStats.pitching.runs,
                earnedRuns: realStats.pitching.earnedRuns,
                walks: realStats.pitching.walks,
                strikeouts: realStats.pitching.strikeouts,
                era: realStats.pitching.era,
                whip: realStats.pitching.whip
            };
        }

        return mapped;
    }

    mapGameData(realGame) {
        return {
            date: realGame.gameDate,
            status: realGame.status,
            homeTeamId: realGame.homeTeam.id,
            awayTeamId: realGame.awayTeam.id,
            homeScore: realGame.homeTeam.score || 0,
            awayScore: realGame.awayTeam.score || 0,
            venue: realGame.venue,
            inning: realGame.inning,
            inningState: realGame.inningState,
            realWorldId: realGame.gameId,
            dataSource: 'mlb_api'
        };
    }

    mapLiveGameData(liveData) {
        return {
            status: liveData.status,
            inning: liveData.inning,
            topInning: liveData.topInning,
            outs: liveData.outs,
            balls: liveData.balls,
            strikes: liveData.strikes,
            homeScore: liveData.homeScore,
            awayScore: liveData.awayScore,
            currentBatter: liveData.currentBatter,
            currentPitcher: liveData.currentPitcher,
            runners: liveData.runners,
            lastPlay: liveData.lastPlay,
            lastUpdated: Date.now()
        };
    }

    mapAdvancedMetrics(sabermetrics, statcast) {
        return {
            sabermetrics: {
                war: sabermetrics.war,
                wrcPlus: sabermetrics.wrcPlus,
                babip: sabermetrics.babip,
                iso: sabermetrics.iso,
                woba: sabermetrics.woba,
                expectedStats: sabermetrics.xStats
            },
            statcast: {
                exitVelocity: statcast.exitVelocity,
                launchAngle: statcast.launchAngle,
                sprintSpeed: statcast.sprintSpeed,
                armStrength: statcast.armStrength,
                reactionTime: statcast.outfieldJumps?.reaction
            },
            lastUpdated: Date.now()
        };
    }

    mergeTeamField(gameValue, realValue, field) {
        switch (field) {
            case 'colors':
                return { ...gameValue, ...realValue };
            default:
                return realValue; // Default to real-world data
        }
    }

    mergePlayerField(gameValue, realValue, field) {
        switch (field) {
            case 'name':
                // Prefer real-world name but keep any custom formatting
                return realValue;
            default:
                return realValue;
        }
    }

    scaleGameStats(gameStats, realStats) {
        // Scale game stats to match real-world performance
        if (!gameStats || !realStats) return realStats;
        
        const scaleFactor = realStats / Math.max(gameStats, 1);
        return Math.round(gameStats * scaleFactor);
    }
}

class ConflictResolver {
    detectTeamConflicts(gameTeam, realTeam) {
        const conflicts = [];
        
        if (gameTeam.name !== realTeam.name) {
            conflicts.push({ field: 'name', game: gameTeam.name, real: realTeam.name });
        }
        
        if (gameTeam.city !== realTeam.city) {
            conflicts.push({ field: 'city', game: gameTeam.city, real: realTeam.city });
        }
        
        return conflicts;
    }

    detectPlayerConflicts(gamePlayer, realPlayer) {
        const conflicts = [];
        
        if (gamePlayer.name !== realPlayer.fullName) {
            conflicts.push({ field: 'name', game: gamePlayer.name, real: realPlayer.fullName });
        }
        
        if (gamePlayer.position !== realPlayer.position) {
            conflicts.push({ field: 'position', game: gamePlayer.position, real: realPlayer.position });
        }
        
        if (gamePlayer.jerseyNumber !== parseInt(realPlayer.primaryNumber)) {
            conflicts.push({ field: 'jerseyNumber', game: gamePlayer.jerseyNumber, real: parseInt(realPlayer.primaryNumber) });
        }
        
        return conflicts;
    }

    detectStatsConflicts(gameStats, realStats) {
        const conflicts = [];
        
        // Check for major discrepancies
        if (gameStats.batting && realStats.batting) {
            const gameAvg = gameStats.batting.average || 0;
            const realAvg = realStats.batting.average || 0;
            
            if (Math.abs(gameAvg - realAvg) > 0.1) { // More than 100 points difference
                conflicts.push({ field: 'battingAverage', game: gameAvg, real: realAvg });
            }
        }
        
        return conflicts;
    }

    async resolveTeamConflicts(conflicts) {
        const resolution = {};
        
        for (const conflict of conflicts) {
            switch (conflict.field) {
                case 'name':
                case 'city':
                    resolution[conflict.field] = 'use_real'; // Always use real-world data
                    break;
                default:
                    resolution[conflict.field] = 'use_real';
            }
        }
        
        return resolution;
    }

    async resolvePlayerConflicts(conflicts) {
        const resolution = {};
        
        for (const conflict of conflicts) {
            switch (conflict.field) {
                case 'name':
                case 'position':
                case 'jerseyNumber':
                    resolution[conflict.field] = 'use_real';
                    break;
                default:
                    resolution[conflict.field] = 'use_real';
            }
        }
        
        return resolution;
    }

    async resolveStatsConflicts(conflicts) {
        const resolution = {};
        
        for (const conflict of conflicts) {
            switch (conflict.field) {
                case 'battingAverage':
                    resolution[conflict.field] = 'scale_to_real'; // Scale game stats to real performance
                    break;
                default:
                    resolution[conflict.field] = 'use_real';
            }
        }
        
        return resolution;
    }
}