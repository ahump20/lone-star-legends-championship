#!/usr/bin/env node

/**
 * Multi-League API Connector for Blaze Intelligence
 * Implements comprehensive data ingestion from all approved sports sources
 * Following HAV-F Evaluation Plan specifications
 */

import axios from 'axios';
import { createClient } from 'redis';
import winston from 'winston';

class MultiLeagueConnector {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'multi-league-connector.log' })
            ]
        });

        // Redis for caching
        this.redis = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        // API configurations
        this.apis = {
            mlb: {
                statcast: 'https://baseballsavant.mlb.com/statcast_search/csv',
                statsApi: 'https://statsapi.mlb.com/api/v1',
                rateLimit: 10 // requests per second
            },
            ncaaFootball: {
                baseUrl: 'https://api.collegefootballdata.com',
                apiKey: process.env.CFBD_API_KEY,
                rateLimit: 5
            },
            ncaaBaseball: {
                baseUrl: 'https://stats.ncaa.org/teams',
                rateLimit: 3
            },
            nfl: {
                nflverse: 'https://github.com/nflverse/nflverse-data/releases',
                espnApi: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
                rateLimit: 8
            },
            nba: {
                statsApi: 'https://stats.nba.com/stats',
                rateLimit: 10
            },
            perfectGame: {
                baseUrl: 'https://api.perfectgame.org/v2',
                apiKey: process.env.PG_API_KEY,
                rateLimit: 5
            },
            nil: {
                on3: 'https://www.on3.com/api/nil',
                athleteData: 'https://opendorse.com/api/athletes',
                rateLimit: 3
            },
            international: {
                kbo: 'https://api.kbostats.com',
                npb: 'https://npb.jp/api',
                latinAmerica: 'https://api.mlb.com/international',
                rateLimit: 2
            }
        };

        this.logger.info('Multi-League Connector initialized with all data sources');
    }

    // MLB Data Ingestion
    async ingestMLB(team = 'STL', year = 2024) {
        this.logger.info(`Ingesting MLB data for ${team} - ${year}`);
        
        try {
            // Statcast data
            const statcastUrl = `${this.apis.mlb.statcast}?year=${year}&player_type=batter&team=${team}`;
            const statcastData = await this.fetchWithRetry(statcastUrl);
            
            // MLB Stats API
            const teamId = await this.getMLBTeamId(team);
            const rosterUrl = `${this.apis.mlb.statsApi}/teams/${teamId}/roster?season=${year}`;
            const rosterData = await this.fetchWithRetry(rosterUrl);
            
            // Process and normalize
            const normalizedPlayers = await this.normalizeMLBData(statcastData, rosterData);
            
            // Calculate HAV-F metrics
            for (const player of normalizedPlayers) {
                player.havf = await this.calculateHAVF(player, 'MLB');
            }
            
            await this.cacheData('mlb', team, normalizedPlayers);
            this.logger.info(`Successfully ingested ${normalizedPlayers.length} MLB players`);
            
            return normalizedPlayers;
        } catch (error) {
            this.logger.error(`MLB ingestion error: ${error.message}`);
            throw error;
        }
    }

    // NCAA Football Data Ingestion
    async ingestNCAAFootball(conference = 'SEC', year = 2024) {
        this.logger.info(`Ingesting NCAA Football data for ${conference} - ${year}`);
        
        try {
            const headers = { 'Authorization': `Bearer ${this.apis.ncaaFootball.apiKey}` };
            
            // Get teams in conference
            const teamsUrl = `${this.apis.ncaaFootball.baseUrl}/teams?conference=${conference}&year=${year}`;
            const teams = await this.fetchWithRetry(teamsUrl, { headers });
            
            let allPlayers = [];
            
            for (const team of teams) {
                // Get roster
                const rosterUrl = `${this.apis.ncaaFootball.baseUrl}/roster?team=${team.school}&year=${year}`;
                const roster = await this.fetchWithRetry(rosterUrl, { headers });
                
                // Get stats
                const statsUrl = `${this.apis.ncaaFootball.baseUrl}/stats/player/season?team=${team.school}&year=${year}`;
                const stats = await this.fetchWithRetry(statsUrl, { headers });
                
                const teamPlayers = await this.normalizeNCAAFootballData(roster, stats, team);
                
                // Calculate HAV-F metrics
                for (const player of teamPlayers) {
                    player.havf = await this.calculateHAVF(player, 'NCAA_FOOTBALL');
                }
                
                allPlayers = allPlayers.concat(teamPlayers);
            }
            
            await this.cacheData('ncaa_football', conference, allPlayers);
            this.logger.info(`Successfully ingested ${allPlayers.length} NCAA Football players`);
            
            return allPlayers;
        } catch (error) {
            this.logger.error(`NCAA Football ingestion error: ${error.message}`);
            throw error;
        }
    }

    // NFL Data Ingestion
    async ingestNFL(team = 'TEN', year = 2024) {
        this.logger.info(`Ingesting NFL data for ${team} - ${year}`);
        
        try {
            // Use nflverse data (CSV from GitHub)
            const pbpUrl = `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${year}.csv`;
            const rosterUrl = `https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_${year}.csv`;
            
            // ESPN API for additional stats
            const espnUrl = `${this.apis.nfl.espnApi}/teams/${team}/roster`;
            const espnData = await this.fetchWithRetry(espnUrl);
            
            const normalizedPlayers = await this.normalizeNFLData(espnData, team);
            
            // Calculate HAV-F metrics
            for (const player of normalizedPlayers) {
                player.havf = await this.calculateHAVF(player, 'NFL');
            }
            
            await this.cacheData('nfl', team, normalizedPlayers);
            this.logger.info(`Successfully ingested ${normalizedPlayers.length} NFL players`);
            
            return normalizedPlayers;
        } catch (error) {
            this.logger.error(`NFL ingestion error: ${error.message}`);
            throw error;
        }
    }

    // NBA Data Ingestion
    async ingestNBA(team = 'MEM', season = '2023-24') {
        this.logger.info(`Ingesting NBA data for ${team} - ${season}`);
        
        try {
            const headers = {
                'User-Agent': 'Mozilla/5.0',
                'x-nba-stats-origin': 'stats',
                'Referer': 'https://stats.nba.com/'
            };
            
            // Get team roster
            const rosterUrl = `${this.apis.nba.statsApi}/commonteamroster?TeamID=${this.getNBATeamId(team)}&Season=${season}`;
            const rosterData = await this.fetchWithRetry(rosterUrl, { headers });
            
            // Get player stats
            const statsUrl = `${this.apis.nba.statsApi}/teamplayerdashboard?TeamID=${this.getNBATeamId(team)}&Season=${season}`;
            const statsData = await this.fetchWithRetry(statsUrl, { headers });
            
            const normalizedPlayers = await this.normalizeNBAData(rosterData, statsData);
            
            // Calculate HAV-F metrics
            for (const player of normalizedPlayers) {
                player.havf = await this.calculateHAVF(player, 'NBA');
            }
            
            await this.cacheData('nba', team, normalizedPlayers);
            this.logger.info(`Successfully ingested ${normalizedPlayers.length} NBA players`);
            
            return normalizedPlayers;
        } catch (error) {
            this.logger.error(`NBA ingestion error: ${error.message}`);
            throw error;
        }
    }

    // Perfect Game Youth Baseball Ingestion
    async ingestPerfectGame(tournamentId = null, graduationYear = 2026) {
        this.logger.info(`Ingesting Perfect Game data for graduation year ${graduationYear}`);
        
        try {
            const headers = { 'Authorization': `Bearer ${this.apis.perfectGame.apiKey}` };
            
            // Get top prospects
            const prospectsUrl = `${this.apis.perfectGame.baseUrl}/rankings/national?grad_year=${graduationYear}`;
            const prospects = await this.fetchWithRetry(prospectsUrl, { headers });
            
            // Get tournament data if specified
            let tournamentPlayers = [];
            if (tournamentId) {
                const tournamentUrl = `${this.apis.perfectGame.baseUrl}/tournaments/${tournamentId}/players`;
                tournamentPlayers = await this.fetchWithRetry(tournamentUrl, { headers });
            }
            
            const allPlayers = await this.normalizePerfectGameData(prospects, tournamentPlayers);
            
            // Calculate HAV-F metrics with youth adjustments
            for (const player of allPlayers) {
                player.havf = await this.calculateHAVF(player, 'YOUTH');
            }
            
            await this.cacheData('perfect_game', graduationYear, allPlayers);
            this.logger.info(`Successfully ingested ${allPlayers.length} Perfect Game players`);
            
            return allPlayers;
        } catch (error) {
            this.logger.error(`Perfect Game ingestion error: ${error.message}`);
            throw error;
        }
    }

    // NIL Data Ingestion
    async ingestNIL(school = 'Texas', sport = 'football') {
        this.logger.info(`Ingesting NIL data for ${school} ${sport}`);
        
        try {
            // On3 NIL valuations
            const on3Url = `${this.apis.nil.on3}/valuations?school=${school}&sport=${sport}`;
            const on3Data = await this.fetchWithRetry(on3Url);
            
            // Process NIL valuations
            const nilPlayers = await this.normalizeNILData(on3Data);
            
            // Calculate NIL Trust Score component of HAV-F
            for (const player of nilPlayers) {
                player.nilMetrics = {
                    valuation: player.valuation,
                    socialReach: player.followers,
                    brandDeals: player.deals,
                    marketVelocity: this.calculateMarketVelocity(player),
                    trustScore: this.calculateNILTrustScore(player)
                };
            }
            
            await this.cacheData('nil', `${school}_${sport}`, nilPlayers);
            this.logger.info(`Successfully ingested ${nilPlayers.length} NIL valuations`);
            
            return nilPlayers;
        } catch (error) {
            this.logger.error(`NIL ingestion error: ${error.message}`);
            throw error;
        }
    }

    // International Baseball Ingestion
    async ingestInternational(league = 'KBO', year = 2024) {
        this.logger.info(`Ingesting ${league} international data for ${year}`);
        
        try {
            let players = [];
            
            switch(league) {
                case 'KBO':
                    const kboUrl = `${this.apis.international.kbo}/stats/${year}`;
                    const kboData = await this.fetchWithRetry(kboUrl);
                    players = await this.normalizeKBOData(kboData);
                    break;
                    
                case 'NPB':
                    const npbUrl = `${this.apis.international.npb}/stats/${year}`;
                    const npbData = await this.fetchWithRetry(npbUrl);
                    players = await this.normalizeNPBData(npbData);
                    break;
                    
                case 'LATIN':
                    const latinUrl = `${this.apis.international.latinAmerica}/prospects/${year}`;
                    const latinData = await this.fetchWithRetry(latinUrl);
                    players = await this.normalizeLatinAmericaData(latinData);
                    break;
            }
            
            // Calculate HAV-F with international adjustments
            for (const player of players) {
                player.havf = await this.calculateHAVF(player, 'INTERNATIONAL');
                player.mlbProjection = await this.projectMLBPotential(player);
            }
            
            await this.cacheData('international', league, players);
            this.logger.info(`Successfully ingested ${players.length} ${league} players`);
            
            return players;
        } catch (error) {
            this.logger.error(`International ingestion error: ${error.message}`);
            throw error;
        }
    }

    // HAV-F Calculation (delegated to evaluation engine)
    async calculateHAVF(player, league) {
        const HavfEngine = (await import('./havf-evaluation-engine.js')).default;
        const engine = new HavfEngine();
        
        return {
            championReadiness: engine.calculateChampionReadiness(player),
            cognitiveLeverage: engine.calculateCognitiveLeverage(player),
            nilTrustScore: league === 'YOUTH' ? 0 : engine.calculateNILTrustScore(player),
            composite: engine.calculateCompositeScore(player)
        };
    }

    // Normalization functions
    async normalizeMLBData(statcast, roster) {
        const normalized = [];
        
        for (const player of roster.roster || []) {
            const stats = statcast.find(s => s.player_id === player.person.id);
            
            normalized.push({
                id: player.person.id,
                name: player.person.fullName,
                position: player.position.abbreviation,
                team: 'STL',
                league: 'MLB',
                stats: {
                    avg: stats?.batting_avg || 0,
                    obp: stats?.on_base_percent || 0,
                    slg: stats?.slg_percent || 0,
                    ops: stats?.on_base_plus_slg || 0,
                    war: stats?.war || 0,
                    exitVelocity: stats?.launch_speed || 0,
                    barrelRate: stats?.barrel_batted_rate || 0
                },
                age: this.calculateAge(player.person.birthDate),
                experience: player.person.mlbDebutDate ? 
                    new Date().getFullYear() - new Date(player.person.mlbDebutDate).getFullYear() : 0
            });
        }
        
        return normalized;
    }

    async normalizeNCAAFootballData(roster, stats, team) {
        const normalized = [];
        
        for (const player of roster || []) {
            const playerStats = stats.find(s => s.player_id === player.id);
            
            normalized.push({
                id: player.id,
                name: `${player.first_name} ${player.last_name}`,
                position: player.position,
                team: team.school,
                league: 'NCAA_FOOTBALL',
                year: player.year,
                stats: {
                    passingYards: playerStats?.passing_yards || 0,
                    passingTDs: playerStats?.passing_tds || 0,
                    rushingYards: playerStats?.rushing_yards || 0,
                    rushingTDs: playerStats?.rushing_tds || 0,
                    receptions: playerStats?.receptions || 0,
                    receivingYards: playerStats?.receiving_yards || 0,
                    tackles: playerStats?.tackles || 0,
                    sacks: playerStats?.sacks || 0,
                    interceptions: playerStats?.interceptions || 0,
                    pff_grade: playerStats?.pff_grade || 0
                },
                height: player.height,
                weight: player.weight,
                hometown: player.hometown
            });
        }
        
        return normalized;
    }

    async normalizeNFLData(espnData, team) {
        const normalized = [];
        
        for (const player of espnData.athletes || []) {
            normalized.push({
                id: player.id,
                name: player.fullName,
                position: player.position.abbreviation,
                team: team,
                league: 'NFL',
                jersey: player.jersey,
                stats: {
                    gamesPlayed: player.statistics?.splits?.categories?.[0]?.stats?.[0] || 0,
                    yards: player.statistics?.splits?.categories?.[0]?.stats?.[1] || 0,
                    touchdowns: player.statistics?.splits?.categories?.[0]?.stats?.[2] || 0,
                    rating: player.statistics?.splits?.categories?.[0]?.stats?.[3] || 0
                },
                age: player.age,
                experience: player.experience?.years || 0,
                status: player.status?.type?.name || 'Active'
            });
        }
        
        return normalized;
    }

    async normalizeNBAData(roster, stats) {
        const normalized = [];
        const players = roster.resultSets?.[0]?.rowSet || [];
        const playerStats = stats.resultSets?.[1]?.rowSet || [];
        
        for (const player of players) {
            const pStats = playerStats.find(s => s[1] === player[12]); // Match by player_id
            
            normalized.push({
                id: player[12],
                name: player[3],
                position: player[5],
                team: 'MEM',
                league: 'NBA',
                jersey: player[4],
                stats: {
                    ppg: pStats?.[3] || 0,
                    rpg: pStats?.[4] || 0,
                    apg: pStats?.[5] || 0,
                    fg_pct: pStats?.[6] || 0,
                    three_pct: pStats?.[7] || 0,
                    ft_pct: pStats?.[8] || 0,
                    per: pStats?.[9] || 0
                },
                height: player[6],
                weight: player[7],
                age: player[9],
                experience: player[10]
            });
        }
        
        return normalized;
    }

    async normalizePerfectGameData(prospects, tournamentPlayers) {
        const normalized = [];
        const allPlayers = [...prospects, ...tournamentPlayers];
        
        for (const player of allPlayers) {
            normalized.push({
                id: player.player_id,
                name: player.name,
                position: player.primary_position,
                graduationYear: player.grad_year,
                league: 'PERFECT_GAME',
                ranking: player.national_rank,
                stats: {
                    battingAvg: player.batting_avg || 0,
                    era: player.era || 0,
                    velocity: player.fb_velocity || 0,
                    sixtyTime: player.sixty_time || 0,
                    exitVelo: player.exit_velo || 0,
                    popTime: player.pop_time || 0
                },
                height: player.height,
                weight: player.weight,
                commitment: player.commitment,
                state: player.state,
                perfectGameGrade: player.pg_grade || 0
            });
        }
        
        return normalized;
    }

    async normalizeNILData(on3Data) {
        const normalized = [];
        
        for (const player of on3Data.athletes || []) {
            normalized.push({
                id: player.id,
                name: player.name,
                school: player.school,
                sport: player.sport,
                position: player.position,
                year: player.class,
                valuation: player.nil_valuation,
                followers: player.total_followers,
                deals: player.disclosed_deals || [],
                rank: player.nil_rank,
                delta: player.valuation_change,
                lastUpdated: player.last_updated
            });
        }
        
        return normalized;
    }

    async normalizeKBOData(data) {
        const normalized = [];
        
        for (const player of data.players || []) {
            normalized.push({
                id: player.id,
                name: player.name,
                nameKorean: player.name_kr,
                position: player.position,
                team: player.team,
                league: 'KBO',
                stats: {
                    avg: player.batting_average || 0,
                    obp: player.on_base_percentage || 0,
                    slg: player.slugging_percentage || 0,
                    ops: player.ops || 0,
                    hr: player.home_runs || 0,
                    rbi: player.rbi || 0,
                    war: player.war || 0
                },
                age: player.age,
                mlbExperience: player.mlb_experience || false,
                projectedMLB: player.mlb_projection || 'Unknown'
            });
        }
        
        return normalized;
    }

    async normalizeNPBData(data) {
        const normalized = [];
        
        for (const player of data.players || []) {
            normalized.push({
                id: player.id,
                name: player.name_en,
                nameJapanese: player.name_jp,
                position: player.position,
                team: player.team,
                league: 'NPB',
                stats: {
                    avg: player.batting_average || 0,
                    era: player.era || 0,
                    whip: player.whip || 0,
                    k9: player.k_per_9 || 0,
                    hr: player.home_runs || 0,
                    saves: player.saves || 0
                },
                age: player.age,
                yearsInNPB: player.years_npb || 0,
                mlbPosting: player.posting_eligible || false
            });
        }
        
        return normalized;
    }

    async normalizeLatinAmericaData(data) {
        const normalized = [];
        
        for (const player of data.prospects || []) {
            normalized.push({
                id: player.id,
                name: player.name,
                country: player.country,
                position: player.position,
                league: 'LATIN_PROSPECT',
                age: player.age,
                signingBonus: player.signing_bonus,
                stats: {
                    velocity: player.fastball_velo || 0,
                    battingPractice: player.bp_grade || 0,
                    fieldingGrade: player.field_grade || 0,
                    armStrength: player.arm_grade || 0,
                    speed: player.speed_grade || 0
                },
                mlbTeam: player.signed_by,
                projectedDebut: player.projected_mlb_debut,
                scoutingGrade: player.overall_grade || 0
            });
        }
        
        return normalized;
    }

    // Utility functions
    async fetchWithRetry(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.get(url, options);
                return response.data;
            } catch (error) {
                if (i === retries - 1) throw error;
                await this.delay(1000 * (i + 1)); // Exponential backoff
            }
        }
    }

    async cacheData(league, key, data) {
        const cacheKey = `blaze:${league}:${key}`;
        await this.redis.connect();
        await this.redis.setex(cacheKey, 3600, JSON.stringify(data)); // 1 hour cache
        await this.redis.disconnect();
    }

    calculateAge(birthDate) {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    calculateMarketVelocity(player) {
        // Calculate rate of change in NIL valuation
        if (!player.delta || !player.lastUpdated) return 0;
        const daysSinceUpdate = (new Date() - new Date(player.lastUpdated)) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate > 0 ? player.delta / daysSinceUpdate : 0;
    }

    calculateNILTrustScore(player) {
        const weights = {
            valuation: 0.3,
            followers: 0.25,
            deals: 0.2,
            velocity: 0.15,
            consistency: 0.1
        };
        
        // Normalize each component to 0-100 scale
        const valuationScore = Math.min(player.valuation / 5000000 * 100, 100);
        const followersScore = Math.min(player.followers / 5000000 * 100, 100);
        const dealsScore = Math.min(player.deals.length * 10, 100);
        const velocityScore = Math.min(Math.abs(this.calculateMarketVelocity(player)) / 1000 * 100, 100);
        const consistencyScore = player.rank <= 100 ? 100 - player.rank : 0;
        
        return (
            valuationScore * weights.valuation +
            followersScore * weights.followers +
            dealsScore * weights.deals +
            velocityScore * weights.velocity +
            consistencyScore * weights.consistency
        );
    }

    async projectMLBPotential(player) {
        // Project MLB potential for international players
        const factors = {
            age: player.age < 25 ? 1.2 : player.age < 30 ? 1.0 : 0.8,
            performance: player.stats.war > 3 ? 1.3 : player.stats.war > 1 ? 1.1 : 0.9,
            league: player.league === 'NPB' ? 1.1 : player.league === 'KBO' ? 1.0 : 0.9
        };
        
        const baseScore = (player.stats.ops || 0) * 100;
        const adjustedScore = baseScore * factors.age * factors.performance * factors.league;
        
        if (adjustedScore > 90) return 'MLB Ready';
        if (adjustedScore > 70) return 'AAA Level';
        if (adjustedScore > 50) return 'AA Level';
        return 'Development Needed';
    }

    getMLBTeamId(abbreviation) {
        const teams = {
            'STL': 138, 'BAL': 110, 'NYY': 147, 'BOS': 111,
            'LAD': 119, 'SF': 137, 'SD': 135, 'ATL': 144
            // Add all MLB teams
        };
        return teams[abbreviation] || 138;
    }

    getNBATeamId(abbreviation) {
        const teams = {
            'MEM': 1610612763, 'LAL': 1610612747, 'BOS': 1610612738,
            'GSW': 1610612744, 'MIA': 1610612748
            // Add all NBA teams
        };
        return teams[abbreviation] || 1610612763;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Master ingestion orchestrator
    async ingestAll() {
        this.logger.info('Starting comprehensive multi-league ingestion');
        
        const results = {
            mlb: await this.ingestMLB(),
            ncaaFootball: await this.ingestNCAAFootball(),
            nfl: await this.ingestNFL(),
            nba: await this.ingestNBA(),
            perfectGame: await this.ingestPerfectGame(),
            nil: await this.ingestNIL(),
            kbo: await this.ingestInternational('KBO'),
            npb: await this.ingestInternational('NPB'),
            latinAmerica: await this.ingestInternational('LATIN')
        };
        
        const totalPlayers = Object.values(results).reduce((sum, league) => sum + league.length, 0);
        this.logger.info(`Ingestion complete: ${totalPlayers} total players across all leagues`);
        
        return results;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const connector = new MultiLeagueConnector();
    connector.ingestAll()
        .then(results => {
            console.log('✅ Multi-league ingestion completed successfully');
            console.log(`📊 Total players ingested: ${Object.values(results).reduce((sum, league) => sum + league.length, 0)}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ingestion failed:', error);
            process.exit(1);
        });
}

export default MultiLeagueConnector;