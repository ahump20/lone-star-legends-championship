/**
 * Blaze Intelligence OG Remaster
 * MLB Data Loader - Real player stats integration
 * Pattern Recognition Weaponized ⚾
 */
export class MLBDataLoader {
    constructor() {
        this.teams = new Map();
        this.players = new Map();
        this.dataPath = '/data/ingested/mlb/';
        console.log('⚾ MLB Data Loader initialized');
    }
    async loadTeamData(teamId) {
        try {
            // Check cache first
            if (this.teams.has(teamId)) {
                return this.teams.get(teamId);
            }
            // Load roster data
            const rosterResponse = await fetch(`${this.dataPath}${teamId}_roster_20250820_095420.json`);
            if (!rosterResponse.ok) {
                console.warn(`No roster data found for team: ${teamId}`);
                return this.generateDefaultTeam(teamId);
            }
            const rosterData = await rosterResponse.json();
            // Load stats data
            const statsResponse = await fetch(`${this.dataPath}${teamId}_stats_20250820_095420.json`);
            const statsData = statsResponse.ok ? await statsResponse.json() : null;
            // Convert to game format
            const team = this.convertToGameTeam(teamId, rosterData, statsData);
            // Cache the team
            this.teams.set(teamId, team);
            return team;
        }
        catch (error) {
            console.error(`Failed to load team data for ${teamId}:`, error);
            return this.generateDefaultTeam(teamId);
        }
    }
    convertToGameTeam(teamId, rosterData, statsData) {
        const teamInfo = this.getTeamInfo(teamId);
        const roster = [];
        // Process roster data
        if (rosterData.players) {
            for (const player of rosterData.players) {
                const mlbPlayer = this.convertToMLBPlayer(player, statsData, teamId);
                roster.push(mlbPlayer);
                this.players.set(mlbPlayer.id, mlbPlayer);
            }
        }
        return {
            id: teamId,
            name: teamInfo.name,
            city: teamInfo.city,
            abbreviation: teamInfo.abbreviation,
            division: teamInfo.division,
            league: teamInfo.league,
            primaryColor: teamInfo.primaryColor,
            secondaryColor: teamInfo.secondaryColor,
            logoUrl: teamInfo.logoUrl,
            roster
        };
    }
    convertToMLBPlayer(playerData, statsData, teamId) {
        // Find player stats if available
        const playerStats = statsData?.players?.find((p) => p.id === playerData.id);
        // Calculate attributes based on real stats
        const attributes = this.calculatePlayerAttributes(playerData, playerStats);
        return {
            id: playerData.id || `player_${Math.random().toString(36).substr(2, 9)}`,
            name: playerData.name || 'Unknown Player',
            number: playerData.number || '00',
            position: playerData.position || 'UTL',
            battingAverage: playerStats?.battingAverage || playerData.battingAverage,
            homeRuns: playerStats?.homeRuns || playerData.homeRuns,
            rbi: playerStats?.rbi || playerData.rbi,
            stolenBases: playerStats?.stolenBases || playerData.stolenBases,
            era: playerStats?.era || playerData.era,
            strikeouts: playerStats?.strikeouts || playerData.strikeouts,
            wins: playerStats?.wins || playerData.wins,
            saves: playerStats?.saves || playerData.saves,
            imageUrl: playerData.imageUrl,
            team: teamId,
            attributes
        };
    }
    calculatePlayerAttributes(player, stats) {
        const isPitcher = ['SP', 'RP', 'CP', 'P'].includes(player.position);
        if (isPitcher) {
            return this.calculatePitcherAttributes(player, stats);
        }
        else {
            return this.calculateBatterAttributes(player, stats);
        }
    }
    calculateBatterAttributes(player, stats) {
        // Use real stats to calculate game attributes
        const avg = stats?.battingAverage || player.battingAverage || .250;
        const hr = stats?.homeRuns || player.homeRuns || 10;
        const sb = stats?.stolenBases || player.stolenBases || 5;
        const ops = stats?.ops || .750;
        return {
            // Batting (based on real performance)
            contact: Math.min(100, Math.round(avg * 350)), // .300 = 105, capped at 100
            power: Math.min(100, Math.round(hr * 2.5)), // 40 HR = 100
            speed: Math.min(100, Math.round(sb * 3)), // 33 SB = 100
            eye: Math.min(100, Math.round(ops * 100)), // .900 OPS = 90
            clutch: Math.min(100, 50 + Math.round(avg * 100)), // Base 50 + avg bonus
            // Fielding (position-based defaults with variations)
            fielding: this.getFieldingByPosition(player.position),
            armStrength: this.getArmStrengthByPosition(player.position),
            range: this.getRangeByPosition(player.position),
            // Mental (randomized with position bias)
            composure: 60 + Math.round(Math.random() * 30),
            intelligence: 65 + Math.round(Math.random() * 25)
        };
    }
    calculatePitcherAttributes(player, stats) {
        const era = stats?.era || player.era || 4.00;
        const k = stats?.strikeouts || player.strikeouts || 100;
        const wins = stats?.wins || player.wins || 8;
        const whip = stats?.whip || 1.30;
        return {
            // Batting (minimal for pitchers)
            contact: 15 + Math.round(Math.random() * 15),
            power: 10 + Math.round(Math.random() * 10),
            speed: 40 + Math.round(Math.random() * 20),
            eye: 20 + Math.round(Math.random() * 15),
            clutch: 30 + Math.round(Math.random() * 20),
            // Pitching (based on real performance)
            velocity: Math.min(100, 70 + Math.round(k / 10)), // 200K = 90
            control: Math.min(100, Math.round((1 / whip) * 100)), // 1.00 WHIP = 100
            stamina: player.position === 'SP' ? 70 + Math.round(Math.random() * 20) : 40 + Math.round(Math.random() * 20),
            movement: Math.min(100, 100 - Math.round(era * 15)), // 2.00 ERA = 70
            // Fielding
            fielding: 50 + Math.round(Math.random() * 25),
            armStrength: 85 + Math.round(Math.random() * 10),
            range: 40 + Math.round(Math.random() * 20),
            // Mental
            composure: Math.min(100, 60 + wins * 2),
            intelligence: 70 + Math.round(Math.random() * 20)
        };
    }
    getFieldingByPosition(position) {
        const fieldingMap = {
            'C': 85, 'SS': 90, '2B': 85, '3B': 80,
            '1B': 75, 'CF': 85, 'LF': 70, 'RF': 75,
            'DH': 40, 'UTL': 65
        };
        return fieldingMap[position] || 60;
    }
    getArmStrengthByPosition(position) {
        const armMap = {
            'C': 85, 'SS': 85, '3B': 90, 'RF': 90,
            '2B': 75, 'CF': 80, 'LF': 75, '1B': 65,
            'DH': 50, 'UTL': 70
        };
        return armMap[position] || 65;
    }
    getRangeByPosition(position) {
        const rangeMap = {
            'CF': 90, 'SS': 85, '2B': 80, 'LF': 75,
            'RF': 75, '3B': 70, 'C': 50, '1B': 55,
            'DH': 30, 'UTL': 65
        };
        return rangeMap[position] || 60;
    }
    getTeamInfo(teamId) {
        const teams = {
            'cardinals': {
                name: 'Cardinals',
                city: 'St. Louis',
                abbreviation: 'STL',
                division: 'NL Central',
                league: 'National',
                primaryColor: '#C41E3A',
                secondaryColor: '#0C2340',
                logoUrl: '/assets/logos/cardinals.png'
            },
            'yankees': {
                name: 'Yankees',
                city: 'New York',
                abbreviation: 'NYY',
                division: 'AL East',
                league: 'American',
                primaryColor: '#003087',
                secondaryColor: '#E4002C',
                logoUrl: '/assets/logos/yankees.png'
            },
            'dodgers': {
                name: 'Dodgers',
                city: 'Los Angeles',
                abbreviation: 'LAD',
                division: 'NL West',
                league: 'National',
                primaryColor: '#005A9C',
                secondaryColor: '#EF3E42',
                logoUrl: '/assets/logos/dodgers.png'
            },
            // Add more teams as needed
            'default': {
                name: 'Team',
                city: 'City',
                abbreviation: 'TBD',
                division: 'Division',
                league: 'League',
                primaryColor: '#FF6B35',
                secondaryColor: '#1E3A8A',
                logoUrl: '/assets/logos/default.png'
            }
        };
        return teams[teamId] || teams['default'];
    }
    generateDefaultTeam(teamId) {
        const teamInfo = this.getTeamInfo(teamId);
        const roster = [];
        // Generate default roster
        const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
        // Generate batters
        for (let i = 0; i < positions.length; i++) {
            roster.push(this.generateDefaultPlayer(positions[i], i + 1, teamId, false));
        }
        // Generate pitchers
        for (let i = 0; i < 5; i++) {
            roster.push(this.generateDefaultPlayer('SP', 30 + i, teamId, true));
        }
        for (let i = 0; i < 7; i++) {
            roster.push(this.generateDefaultPlayer('RP', 40 + i, teamId, true));
        }
        return {
            id: teamId,
            name: teamInfo.name,
            city: teamInfo.city,
            abbreviation: teamInfo.abbreviation,
            division: teamInfo.division,
            league: teamInfo.league,
            primaryColor: teamInfo.primaryColor,
            secondaryColor: teamInfo.secondaryColor,
            logoUrl: teamInfo.logoUrl,
            roster
        };
    }
    generateDefaultPlayer(position, number, teamId, isPitcher) {
        const names = [
            'Johnny Rocket', 'Billy Thunder', 'Mike Power', 'Tommy Speed',
            'Joe Classic', 'Steve Slugger', 'Dave Diamond', 'Rick Rally',
            'Pete Perfect', 'Chuck Champion', 'Ace Armstrong', 'Max Muscle'
        ];
        const name = names[Math.floor(Math.random() * names.length)];
        const id = `${teamId}_player_${number}`;
        const attributes = {
            contact: 50 + Math.round(Math.random() * 40),
            power: 50 + Math.round(Math.random() * 40),
            speed: 50 + Math.round(Math.random() * 40),
            eye: 50 + Math.round(Math.random() * 40),
            clutch: 50 + Math.round(Math.random() * 40),
            fielding: 50 + Math.round(Math.random() * 40),
            armStrength: 50 + Math.round(Math.random() * 40),
            range: 50 + Math.round(Math.random() * 40),
            composure: 50 + Math.round(Math.random() * 40),
            intelligence: 50 + Math.round(Math.random() * 40)
        };
        if (isPitcher) {
            attributes.velocity = 70 + Math.round(Math.random() * 25);
            attributes.control = 60 + Math.round(Math.random() * 30);
            attributes.stamina = position === 'SP' ? 70 + Math.round(Math.random() * 25) : 40 + Math.round(Math.random() * 30);
            attributes.movement = 65 + Math.round(Math.random() * 30);
        }
        return {
            id,
            name,
            number: number.toString(),
            position,
            team: teamId,
            attributes,
            battingAverage: isPitcher ? undefined : .250 + Math.random() * .100,
            homeRuns: isPitcher ? undefined : Math.floor(Math.random() * 40),
            rbi: isPitcher ? undefined : Math.floor(Math.random() * 100),
            era: isPitcher ? 3.00 + Math.random() * 2.00 : undefined,
            strikeouts: isPitcher ? Math.floor(100 + Math.random() * 150) : undefined,
            wins: isPitcher ? Math.floor(Math.random() * 20) : undefined
        };
    }
    async loadAllTeams() {
        const teamIds = [
            'cardinals', 'yankees', 'dodgers', 'redsox', 'cubs',
            'giants', 'astros', 'braves', 'nationals', 'mariners'
        ];
        const teams = [];
        for (const teamId of teamIds) {
            const team = await this.loadTeamData(teamId);
            if (team) {
                teams.push(team);
            }
        }
        return teams;
    }
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    getTeam(teamId) {
        return this.teams.get(teamId);
    }
    getAllPlayers() {
        return Array.from(this.players.values());
    }
    getAllTeams() {
        return Array.from(this.teams.values());
    }
}
