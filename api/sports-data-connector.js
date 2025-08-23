/**
 * Blaze Intelligence Sports Data Connector
 * Integrates with MLB, NFL, NBA, NCAA APIs
 */

export class SportsDataConnector {
    constructor(env) {
        this.env = env;
        this.cache = null; // KV namespace for caching
    }

    /**
     * MLB Stats API Integration
     */
    async getMLBData(teamId = '138') { // 138 = Cardinals
        const baseUrl = 'https://statsapi.mlb.com/api/v1';
        
        try {
            // Get team roster
            const rosterRes = await fetch(`${baseUrl}/teams/${teamId}/roster`);
            const roster = await rosterRes.json();
            
            // Get current season stats
            const seasonRes = await fetch(`${baseUrl}/teams/${teamId}/stats?season=2024`);
            const stats = await seasonRes.json();
            
            // Get recent games
            const gamesRes = await fetch(`${baseUrl}/schedule?teamId=${teamId}&sportId=1`);
            const games = await gamesRes.json();
            
            return {
                roster: roster.roster || [],
                stats: stats.stats || [],
                games: games.dates || [],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('MLB API error:', error);
            return null;
        }
    }

    /**
     * NFL Data Integration (via ESPN API)
     */
    async getNFLData(teamId = 'ten') { // Tennessee Titans
        const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
        
        try {
            // Get team info
            const teamRes = await fetch(`${baseUrl}/teams/${teamId}`);
            const team = await teamRes.json();
            
            // Get roster
            const rosterRes = await fetch(`${baseUrl}/teams/${teamId}/roster`);
            const roster = await rosterRes.json();
            
            return {
                team: team.team || {},
                roster: roster.athletes || [],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('NFL API error:', error);
            return null;
        }
    }

    /**
     * NBA Data Integration
     */
    async getNBAData(teamId = 'grizzlies') {
        const baseUrl = 'https://data.nba.net/data/10s/prod/v1';
        const season = '2024';
        
        try {
            // Get team roster
            const rosterRes = await fetch(`${baseUrl}/${season}/teams/${teamId}/roster.json`);
            const roster = await rosterRes.json();
            
            return {
                players: roster.league?.standard || [],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('NBA API error:', error);
            return null;
        }
    }

    /**
     * NCAA Data Integration
     */
    async getNCAAData(teamId = 'texas') {
        // CollegeFootballData.com API (requires API key)
        const baseUrl = 'https://api.collegefootballdata.com';
        const headers = {
            'Authorization': `Bearer ${this.env.CFBD_API_KEY || ''}`
        };
        
        try {
            // Get team info
            const teamRes = await fetch(`${baseUrl}/teams?school=${teamId}`, { headers });
            const team = await teamRes.json();
            
            // Get roster
            const rosterRes = await fetch(`${baseUrl}/roster?school=${teamId}&year=2024`, { headers });
            const roster = await rosterRes.json();
            
            return {
                team: team[0] || {},
                roster: roster || [],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('NCAA API error:', error);
            return null;
        }
    }

    /**
     * Aggregate all sports data
     */
    async getAllSportsData() {
        const [mlb, nfl, nba, ncaa] = await Promise.all([
            this.getMLBData(),
            this.getNFLData(),
            this.getNBAData(),
            this.getNCAAData()
        ]);

        return {
            mlb,
            nfl,
            nba,
            ncaa,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate CEE scores from raw sports data
     */
    calculateCEEFromStats(playerStats) {
        // Example CEE calculation based on performance metrics
        const dimensions = {
            clutchGene: 0,
            killerInstinct: 0,
            flowState: 0,
            mentalFortress: 0,
            predatorMindset: 0,
            championAura: 0,
            winnerDNA: 0,
            beastMode: 0
        };

        // Baseball specific calculations
        if (playerStats.sport === 'baseball') {
            const avg = playerStats.battingAverage || 0;
            const ops = playerStats.ops || 0;
            const risp = playerStats.battingAverageRISP || 0;
            
            dimensions.clutchGene = this.normalize((risp - avg) * 100 + 50);
            dimensions.killerInstinct = this.normalize(ops * 50);
            dimensions.flowState = this.normalize(avg * 300);
        }

        // Football specific calculations
        if (playerStats.sport === 'football') {
            const qbr = playerStats.qbRating || 0;
            const completionPct = playerStats.completionPercentage || 0;
            
            dimensions.clutchGene = this.normalize(qbr * 0.6);
            dimensions.killerInstinct = this.normalize(completionPct);
        }

        return dimensions;
    }

    normalize(value, min = 0, max = 100) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Store data in D1 database
     */
    async storeInDatabase(data) {
        if (!this.env.DB) return;

        const statements = [];

        // Store athletes
        if (data.roster) {
            for (const player of data.roster) {
                statements.push(this.env.DB.prepare(`
                    INSERT OR REPLACE INTO athletes (id, name, sport, position, jersey_number, external_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(
                    player.id,
                    player.name,
                    data.sport,
                    player.position,
                    player.jerseyNumber,
                    player.externalId
                ));
            }
        }

        // Batch execute
        if (statements.length > 0) {
            await this.env.DB.batch(statements);
        }
    }

    /**
     * Cache data in KV
     */
    async cacheData(key, data, ttl = 3600) {
        if (!this.env.KV) return;

        await this.env.KV.put(key, JSON.stringify(data), {
            expirationTtl: ttl
        });
    }

    /**
     * Get cached data
     */
    async getCachedData(key) {
        if (!this.env.KV) return null;

        const cached = await this.env.KV.get(key);
        return cached ? JSON.parse(cached) : null;
    }
}

// Worker handler
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const connector = new SportsDataConnector(env);

        // API endpoints
        if (url.pathname === '/api/sports/mlb') {
            const data = await connector.getMLBData();
            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (url.pathname === '/api/sports/all') {
            // Check cache first
            const cached = await connector.getCachedData('all-sports-data');
            if (cached) {
                return new Response(JSON.stringify(cached), {
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Cache': 'HIT'
                    }
                });
            }

            // Fetch fresh data
            const data = await connector.getAllSportsData();
            
            // Cache for 1 hour
            await connector.cacheData('all-sports-data', data, 3600);
            
            return new Response(JSON.stringify(data), {
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Cache': 'MISS'
                }
            });
        }

        return new Response('Not Found', { status: 404 });
    }
};