export class LeagueDataAPI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.apiKey = null;
        this.baseURL = 'https://api.mlb.com/api/v1';
        this.cache = new Map();
        this.rateLimiter = new RateLimiter();
        this.dataProcessor = new DataProcessor();
        this.realTimeUpdates = new RealTimeUpdates();
        
        this.initializeAPI();
    }

    async initializeAPI() {
        try {
            await this.setupAPIKey();
            await this.validateConnection();
            this.startRealTimeUpdates();
            console.log('✅ League Data API initialized');
        } catch (error) {
            console.error('❌ API initialization failed:', error);
            this.fallbackToMockData();
        }
    }

    async setupAPIKey() {
        // In production, this would be handled securely
        this.apiKey = localStorage.getItem('mlb_api_key') || 'demo_key';
        
        // For demo purposes, we'll use mock API responses
        this.useMockData = !this.apiKey || this.apiKey === 'demo_key';
    }

    async validateConnection() {
        if (this.useMockData) {
            console.log('Using mock MLB data for demo');
            return true;
        }

        try {
            const response = await this.makeAPICall('/sports');
            return response && response.sports;
        } catch (error) {
            throw new Error('API connection failed');
        }
    }

    // TEAM DATA
    async getTeamData(teamId) {
        const cacheKey = `team_${teamId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let teamData;
        if (this.useMockData) {
            teamData = this.getMockTeamData(teamId);
        } else {
            const response = await this.makeAPICall(`/teams/${teamId}`);
            teamData = this.dataProcessor.processTeamData(response.teams[0]);
        }

        this.cache.set(cacheKey, teamData);
        return teamData;
    }

    async getAllTeams() {
        const cacheKey = 'all_teams';
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let teamsData;
        if (this.useMockData) {
            teamsData = this.getMockAllTeams();
        } else {
            const response = await this.makeAPICall('/teams?sportId=1');
            teamsData = response.teams.map(team => this.dataProcessor.processTeamData(team));
        }

        this.cache.set(cacheKey, teamsData);
        return teamsData;
    }

    // PLAYER DATA
    async getPlayerData(playerId) {
        const cacheKey = `player_${playerId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let playerData;
        if (this.useMockData) {
            playerData = this.getMockPlayerData(playerId);
        } else {
            const response = await this.makeAPICall(`/people/${playerId}`);
            playerData = this.dataProcessor.processPlayerData(response.people[0]);
        }

        this.cache.set(cacheKey, playerData);
        return playerData;
    }

    async getTeamRoster(teamId, season = new Date().getFullYear()) {
        const cacheKey = `roster_${teamId}_${season}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let rosterData;
        if (this.useMockData) {
            rosterData = this.getMockRosterData(teamId);
        } else {
            const response = await this.makeAPICall(`/teams/${teamId}/roster?rosterType=active&season=${season}`);
            rosterData = response.roster.map(player => this.dataProcessor.processPlayerData(player.person));
        }

        this.cache.set(cacheKey, rosterData);
        return rosterData;
    }

    // STATISTICS
    async getPlayerStats(playerId, season = new Date().getFullYear()) {
        const cacheKey = `stats_${playerId}_${season}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let statsData;
        if (this.useMockData) {
            statsData = this.getMockPlayerStats(playerId);
        } else {
            const response = await this.makeAPICall(`/people/${playerId}/stats?stats=season&season=${season}`);
            statsData = this.dataProcessor.processPlayerStats(response.stats[0]);
        }

        this.cache.set(cacheKey, statsData);
        return statsData;
    }

    async getTeamStats(teamId, season = new Date().getFullYear()) {
        const cacheKey = `team_stats_${teamId}_${season}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let statsData;
        if (this.useMockData) {
            statsData = this.getMockTeamStats(teamId);
        } else {
            const response = await this.makeAPICall(`/teams/${teamId}/stats?stats=season&season=${season}`);
            statsData = this.dataProcessor.processTeamStats(response.stats[0]);
        }

        this.cache.set(cacheKey, statsData);
        return statsData;
    }

    // SCHEDULE & GAMES
    async getSchedule(teamId, startDate, endDate) {
        const cacheKey = `schedule_${teamId}_${startDate}_${endDate}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let scheduleData;
        if (this.useMockData) {
            scheduleData = this.getMockScheduleData(teamId, startDate, endDate);
        } else {
            const response = await this.makeAPICall(`/schedule?teamId=${teamId}&startDate=${startDate}&endDate=${endDate}`);
            scheduleData = response.dates.flatMap(date => 
                date.games.map(game => this.dataProcessor.processGameData(game))
            );
        }

        this.cache.set(cacheKey, scheduleData);
        return scheduleData;
    }

    async getLiveGameData(gameId) {
        // Don't cache live data
        if (this.useMockData) {
            return this.getMockLiveGameData(gameId);
        }

        const response = await this.makeAPICall(`/game/${gameId}/feed/live`);
        return this.dataProcessor.processLiveGameData(response);
    }

    async getStandings(leagueId, season = new Date().getFullYear()) {
        const cacheKey = `standings_${leagueId}_${season}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let standingsData;
        if (this.useMockData) {
            standingsData = this.getMockStandingsData(leagueId);
        } else {
            const response = await this.makeAPICall(`/standings?leagueId=${leagueId}&season=${season}`);
            standingsData = this.dataProcessor.processStandingsData(response.records);
        }

        this.cache.set(cacheKey, standingsData);
        return standingsData;
    }

    // ADVANCED METRICS
    async getSabermetrics(playerId, season = new Date().getFullYear()) {
        const cacheKey = `sabermetrics_${playerId}_${season}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let saberData;
        if (this.useMockData) {
            saberData = this.getMockSabermetrics(playerId);
        } else {
            // This would integrate with services like FanGraphs or Baseball Savant
            saberData = await this.fetchAdvancedMetrics(playerId, season);
        }

        this.cache.set(cacheKey, saberData);
        return saberData;
    }

    async getStatcastData(playerId, season = new Date().getFullYear()) {
        const cacheKey = `statcast_${playerId}_${season}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let statcastData;
        if (this.useMockData) {
            statcastData = this.getMockStatcastData(playerId);
        } else {
            // Baseball Savant Statcast data
            statcastData = await this.fetchStatcastData(playerId, season);
        }

        this.cache.set(cacheKey, statcastData);
        return statcastData;
    }

    // UTILITY METHODS
    async makeAPICall(endpoint) {
        await this.rateLimiter.wait();
        
        const url = `${this.baseURL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    clearCache(pattern = null) {
        if (pattern) {
            for (const [key] of this.cache) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    // REAL-TIME UPDATES
    startRealTimeUpdates() {
        this.realTimeUpdates.start(this);
    }

    stopRealTimeUpdates() {
        this.realTimeUpdates.stop();
    }

    // MOCK DATA METHODS
    getMockTeamData(teamId) {
        const teams = {
            117: { // Los Angeles Angels
                id: 117,
                name: 'Los Angeles Angels',
                city: 'Los Angeles',
                abbreviation: 'LAA',
                division: 'American League West',
                colors: { primary: '#BA0021', secondary: '#C4CED4' },
                founded: 1961,
                ballpark: 'Angel Stadium'
            },
            111: { // Boston Red Sox
                id: 111,
                name: 'Boston Red Sox',
                city: 'Boston',
                abbreviation: 'BOS',
                division: 'American League East',
                colors: { primary: '#BD3039', secondary: '#0C2340' },
                founded: 1901,
                ballpark: 'Fenway Park'
            }
        };
        
        return teams[teamId] || this.generateMockTeam(teamId);
    }

    getMockAllTeams() {
        return [
            { id: 117, name: 'Los Angeles Angels', city: 'Los Angeles', abbreviation: 'LAA' },
            { id: 111, name: 'Boston Red Sox', city: 'Boston', abbreviation: 'BOS' },
            { id: 147, name: 'New York Yankees', city: 'New York', abbreviation: 'NYY' },
            { id: 110, name: 'Baltimore Orioles', city: 'Baltimore', abbreviation: 'BAL' },
            { id: 141, name: 'Toronto Blue Jays', city: 'Toronto', abbreviation: 'TOR' },
            { id: 114, name: 'Cleveland Guardians', city: 'Cleveland', abbreviation: 'CLE' },
            { id: 116, name: 'Detroit Tigers', city: 'Detroit', abbreviation: 'DET' },
            { id: 118, name: 'Kansas City Royals', city: 'Kansas City', abbreviation: 'KC' },
            { id: 142, name: 'Minnesota Twins', city: 'Minneapolis', abbreviation: 'MIN' },
            { id: 145, name: 'Chicago White Sox', city: 'Chicago', abbreviation: 'CWS' },
            { id: 117, name: 'Los Angeles Angels', city: 'Los Angeles', abbreviation: 'LAA' },
            { id: 136, name: 'Seattle Mariners', city: 'Seattle', abbreviation: 'SEA' },
            { id: 140, name: 'Texas Rangers', city: 'Arlington', abbreviation: 'TEX' },
            { id: 133, name: 'Oakland Athletics', city: 'Oakland', abbreviation: 'OAK' },
            { id: 108, name: 'Los Angeles Dodgers', city: 'Los Angeles', abbreviation: 'LAD' },
            { id: 137, name: 'San Francisco Giants', city: 'San Francisco', abbreviation: 'SF' },
            { id: 135, name: 'San Diego Padres', city: 'San Diego', abbreviation: 'SD' },
            { id: 109, name: 'Arizona Diamondbacks', city: 'Phoenix', abbreviation: 'AZ' },
            { id: 115, name: 'Colorado Rockies', city: 'Denver', abbreviation: 'COL' },
            { id: 144, name: 'Atlanta Braves', city: 'Atlanta', abbreviation: 'ATL' },
            { id: 146, name: 'Miami Marlins', city: 'Miami', abbreviation: 'MIA' },
            { id: 143, name: 'Philadelphia Phillies', city: 'Philadelphia', abbreviation: 'PHI' },
            { id: 121, name: 'New York Mets', city: 'New York', abbreviation: 'NYM' },
            { id: 120, name: 'Washington Nationals', city: 'Washington', abbreviation: 'WSH' },
            { id: 112, name: 'Chicago Cubs', city: 'Chicago', abbreviation: 'CHC' },
            { id: 113, name: 'Cincinnati Reds', city: 'Cincinnati', abbreviation: 'CIN' },
            { id: 158, name: 'Milwaukee Brewers', city: 'Milwaukee', abbreviation: 'MIL' },
            { id: 134, name: 'Pittsburgh Pirates', city: 'Pittsburgh', abbreviation: 'PIT' },
            { id: 138, name: 'St. Louis Cardinals', city: 'St. Louis', abbreviation: 'STL' }
        ];
    }

    getMockPlayerData(playerId) {
        const players = {
            545361: { // Mike Trout
                id: 545361,
                fullName: 'Mike Trout',
                firstName: 'Mike',
                lastName: 'Trout',
                primaryNumber: '27',
                position: 'Center Field',
                teamId: 117,
                birthDate: '1991-08-07',
                height: '6\' 2"',
                weight: 235,
                bats: 'R',
                throws: 'R'
            }
        };
        
        return players[playerId] || this.generateMockPlayer(playerId);
    }

    getMockPlayerStats(playerId) {
        return {
            playerId: playerId,
            season: 2024,
            batting: {
                gamesPlayed: 145,
                atBats: 540,
                runs: 104,
                hits: 159,
                doubles: 32,
                triples: 3,
                homeRuns: 40,
                rbi: 103,
                stolenBases: 16,
                caughtStealing: 4,
                walks: 95,
                strikeouts: 124,
                battingAverage: .294,
                onBasePercentage: .408,
                sluggingPercentage: .541,
                ops: .949
            },
            pitching: null // This player doesn't pitch
        };
    }

    getMockSabermetrics(playerId) {
        return {
            playerId: playerId,
            season: 2024,
            war: 8.7, // Wins Above Replacement
            wrcPlus: 170, // Weighted Runs Created Plus
            babip: .295, // Batting Average on Balls in Play
            iso: .247, // Isolated Power
            woba: .389, // Weighted On-Base Average
            xwoba: .395, // Expected wOBA
            hardHitRate: 0.52, // Hard Hit Rate
            barrelRate: 0.185, // Barrel Rate
            xStats: {
                expectedBA: .287,
                expectedSLG: .554,
                expectedwOBA: .395
            }
        };
    }

    getMockStatcastData(playerId) {
        return {
            playerId: playerId,
            season: 2024,
            exitVelocity: {
                average: 91.2,
                max: 115.3,
                percentile90th: 105.8
            },
            launchAngle: {
                average: 12.4,
                sweetSpot: 0.34 // 34% sweet spot rate
            },
            sprintSpeed: 28.1, // ft/sec
            outfieldJumps: {
                efficiency: 0.89,
                reaction: 0.72
            },
            catchProbability: 0.87,
            armStrength: 89.2, // mph
            popTime: null // Not a catcher
        };
    }

    getMockRosterData(teamId) {
        // Generate 26-man roster
        const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CP'];
        const roster = [];
        
        for (let i = 0; i < 26; i++) {
            roster.push({
                id: 500000 + i,
                fullName: `Player ${i + 1}`,
                position: positions[i % positions.length],
                jerseyNumber: (i + 1).toString(),
                teamId: teamId
            });
        }
        
        return roster;
    }

    getMockScheduleData(teamId, startDate, endDate) {
        const games = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        let gameId = 700000;
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (Math.random() < 0.6) { // 60% chance of game on any given day
                games.push({
                    gameId: gameId++,
                    gameDate: d.toISOString().split('T')[0],
                    homeTeam: { id: teamId, name: 'Home Team' },
                    awayTeam: { id: teamId + 1, name: 'Away Team' },
                    venue: 'Stadium Name',
                    gameTime: '19:05'
                });
            }
        }
        
        return games;
    }

    getMockLiveGameData(gameId) {
        return {
            gameId: gameId,
            status: 'Live',
            inning: 7,
            topInning: false,
            outs: 2,
            balls: 2,
            strikes: 1,
            homeScore: 5,
            awayScore: 3,
            currentBatter: {
                id: 545361,
                name: 'Mike Trout'
            },
            currentPitcher: {
                id: 592450,
                name: 'Gerrit Cole'
            },
            runners: ['2B', '3B'],
            lastPlay: 'Single to right field',
            gameTime: '2:47'
        };
    }

    getMockStandingsData(leagueId) {
        return [
            {
                division: 'AL West',
                teams: [
                    { teamId: 117, name: 'Los Angeles Angels', wins: 85, losses: 77, pct: .525, gb: 0 },
                    { teamId: 136, name: 'Seattle Mariners', wins: 82, losses: 80, pct: .506, gb: 3 },
                    { teamId: 140, name: 'Texas Rangers', wins: 78, losses: 84, pct: .481, gb: 7 },
                    { teamId: 133, name: 'Oakland Athletics', wins: 69, losses: 93, pct: .426, gb: 16 }
                ]
            }
        ];
    }

    getMockTeamStats(teamId) {
        return {
            teamId: teamId,
            season: 2024,
            batting: {
                gamesPlayed: 162,
                atBats: 5543,
                runs: 789,
                hits: 1456,
                doubles: 298,
                triples: 28,
                homeRuns: 234,
                rbi: 756,
                stolenBases: 87,
                walks: 521,
                strikeouts: 1387,
                battingAverage: .263,
                onBasePercentage: .329,
                sluggingPercentage: .446,
                ops: .775
            },
            pitching: {
                gamesPlayed: 162,
                wins: 85,
                losses: 77,
                saves: 45,
                inningsPitched: 1458.1,
                hits: 1389,
                runs: 723,
                earnedRuns: 667,
                homeRuns: 178,
                walks: 456,
                strikeouts: 1523,
                era: 4.12,
                whip: 1.26,
                babip: .298
            }
        };
    }

    generateMockTeam(teamId) {
        const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
        const names = ['Eagles', 'Lions', 'Bears', 'Tigers', 'Hawks', 'Wolves'];
        
        return {
            id: teamId,
            name: `${cities[teamId % cities.length]} ${names[teamId % names.length]}`,
            city: cities[teamId % cities.length],
            abbreviation: `T${teamId}`,
            division: 'Mock Division',
            colors: { primary: '#000000', secondary: '#FFFFFF' },
            founded: 1900 + (teamId % 50),
            ballpark: `${cities[teamId % cities.length]} Stadium`
        };
    }

    generateMockPlayer(playerId) {
        const firstNames = ['Mike', 'John', 'David', 'Chris', 'Matt', 'Alex', 'Ryan', 'Tyler'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'];
        const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP'];
        
        return {
            id: playerId,
            fullName: `${firstNames[playerId % firstNames.length]} ${lastNames[playerId % lastNames.length]}`,
            firstName: firstNames[playerId % firstNames.length],
            lastName: lastNames[playerId % lastNames.length],
            primaryNumber: ((playerId % 50) + 1).toString(),
            position: positions[playerId % positions.length],
            teamId: 117 + (playerId % 30),
            birthDate: `199${(playerId % 10)}-0${(playerId % 9) + 1}-${(playerId % 28) + 1}`,
            height: `${Math.floor(playerId % 12) + 5}\' ${playerId % 12}"`,
            weight: 180 + (playerId % 60),
            bats: playerId % 2 === 0 ? 'R' : 'L',
            throws: playerId % 3 === 0 ? 'L' : 'R'
        };
    }

    fallbackToMockData() {
        this.useMockData = true;
        console.log('🔄 Falling back to mock data');
    }

    // API STATUS
    getAPIStatus() {
        return {
            connected: !this.useMockData,
            rateLimitRemaining: this.rateLimiter.remaining,
            cacheSize: this.cache.size,
            realTimeActive: this.realTimeUpdates.isActive(),
            lastUpdate: new Date().toISOString()
        };
    }
}

class RateLimiter {
    constructor(requestsPerMinute = 100) {
        this.requestsPerMinute = requestsPerMinute;
        this.requests = [];
        this.remaining = requestsPerMinute;
    }

    async wait() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < 60000); // Remove requests older than 1 minute
        
        if (this.requests.length >= this.requestsPerMinute) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = 60000 - (now - oldestRequest);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.requests.push(now);
        this.remaining = Math.max(0, this.requestsPerMinute - this.requests.length);
    }
}

class DataProcessor {
    processTeamData(rawTeam) {
        return {
            id: rawTeam.id,
            name: rawTeam.name,
            city: rawTeam.locationName,
            abbreviation: rawTeam.abbreviation,
            division: rawTeam.division?.name,
            league: rawTeam.league?.name,
            colors: {
                primary: rawTeam.teamColor || '#000000',
                secondary: rawTeam.alternateColor || '#FFFFFF'
            },
            venue: rawTeam.venue?.name,
            founded: rawTeam.firstYearOfPlay,
            website: rawTeam.officialSiteUrl
        };
    }

    processPlayerData(rawPlayer) {
        return {
            id: rawPlayer.id,
            fullName: rawPlayer.fullName,
            firstName: rawPlayer.firstName,
            lastName: rawPlayer.lastName,
            primaryNumber: rawPlayer.primaryNumber,
            position: rawPlayer.primaryPosition?.abbreviation,
            teamId: rawPlayer.currentTeam?.id,
            birthDate: rawPlayer.birthDate,
            height: rawPlayer.height,
            weight: rawPlayer.weight,
            bats: rawPlayer.batSide?.code,
            throws: rawPlayer.pitchHand?.code,
            mlbDebutDate: rawPlayer.mlbDebutDate,
            active: rawPlayer.active
        };
    }

    processPlayerStats(rawStats) {
        const splits = rawStats.splits[0]?.stat || {};
        
        return {
            season: rawStats.season,
            batting: splits.gamesPlayed ? {
                gamesPlayed: splits.gamesPlayed,
                atBats: splits.atBats,
                runs: splits.runs,
                hits: splits.hits,
                doubles: splits.doubles,
                triples: splits.triples,
                homeRuns: splits.homeRuns,
                rbi: splits.rbi,
                stolenBases: splits.stolenBases,
                caughtStealing: splits.caughtStealing,
                walks: splits.baseOnBalls,
                strikeouts: splits.strikeOuts,
                battingAverage: parseFloat(splits.avg),
                onBasePercentage: parseFloat(splits.obp),
                sluggingPercentage: parseFloat(splits.slg),
                ops: parseFloat(splits.ops)
            } : null,
            pitching: splits.wins !== undefined ? {
                wins: splits.wins,
                losses: splits.losses,
                saves: splits.saves,
                gamesPlayed: splits.gamesPlayed,
                gamesStarted: splits.gamesStarted,
                inningsPitched: parseFloat(splits.inningsPitched),
                hits: splits.hits,
                runs: splits.runs,
                earnedRuns: splits.earnedRuns,
                homeRuns: splits.homeRuns,
                walks: splits.baseOnBalls,
                strikeouts: splits.strikeOuts,
                era: parseFloat(splits.era),
                whip: parseFloat(splits.whip)
            } : null
        };
    }

    processGameData(rawGame) {
        return {
            gameId: rawGame.gamePk,
            gameDate: rawGame.gameDate,
            status: rawGame.status.detailedState,
            homeTeam: {
                id: rawGame.teams.home.team.id,
                name: rawGame.teams.home.team.name,
                score: rawGame.teams.home.score
            },
            awayTeam: {
                id: rawGame.teams.away.team.id,
                name: rawGame.teams.away.team.name,
                score: rawGame.teams.away.score
            },
            venue: rawGame.venue.name,
            inning: rawGame.linescore?.currentInning,
            inningState: rawGame.linescore?.inningState
        };
    }

    processLiveGameData(rawData) {
        const gameData = rawData.gameData;
        const liveData = rawData.liveData;
        
        return {
            gameId: gameData.game.pk,
            status: gameData.status.detailedState,
            inning: liveData.linescore.currentInning,
            topInning: liveData.linescore.isTopInning,
            outs: liveData.linescore.outs,
            balls: liveData.linescore.balls,
            strikes: liveData.linescore.strikes,
            homeScore: liveData.linescore.teams.home.runs,
            awayScore: liveData.linescore.teams.away.runs,
            currentBatter: liveData.plays.currentPlay?.matchup.batter,
            currentPitcher: liveData.plays.currentPlay?.matchup.pitcher,
            runners: this.parseRunners(liveData.linescore.offense),
            lastPlay: liveData.plays.currentPlay?.result.description,
            attendance: gameData.gameInfo.attendance
        };
    }

    parseRunners(offense) {
        const runners = [];
        if (offense.first) runners.push('1B');
        if (offense.second) runners.push('2B');
        if (offense.third) runners.push('3B');
        return runners;
    }

    processStandingsData(rawRecords) {
        return rawRecords.map(division => ({
            division: division.division.name,
            teams: division.teamRecords.map(team => ({
                teamId: team.team.id,
                name: team.team.name,
                wins: team.wins,
                losses: team.losses,
                pct: parseFloat(team.winningPercentage),
                gb: team.gamesBack,
                streak: team.streak?.streakCode
            }))
        }));
    }
}

class RealTimeUpdates {
    constructor() {
        this.isRunning = false;
        this.updateInterval = null;
        this.websocket = null;
    }

    start(api) {
        if (this.isRunning) return;
        
        this.api = api;
        this.isRunning = true;
        
        // Poll for updates every 30 seconds
        this.updateInterval = setInterval(() => {
            this.checkForUpdates();
        }, 30000);
        
        console.log('📡 Real-time updates started');
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        console.log('📡 Real-time updates stopped');
    }

    async checkForUpdates() {
        try {
            // Clear live game data from cache to force fresh requests
            this.api.clearCache('live_game');
            
            // Notify game engine of potential updates
            if (this.api.gameEngine && this.api.gameEngine.onDataUpdate) {
                this.api.gameEngine.onDataUpdate({
                    timestamp: Date.now(),
                    source: 'real_time_update'
                });
            }
        } catch (error) {
            console.error('Real-time update error:', error);
        }
    }

    isActive() {
        return this.isRunning;
    }
}