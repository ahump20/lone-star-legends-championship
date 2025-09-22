// Real-Time Data Connectors for Blaze Intelligence
class RealtimeDataConnectors {
    constructor() {
        this.connectors = {
            espn: {
                name: 'ESPN API',
                baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
                rateLimit: 100, // requests per minute
                lastRequest: 0,
                active: true
            },
            statsapi: {
                name: 'MLB Stats API',
                baseUrl: 'https://statsapi.mlb.com/api/v1',
                rateLimit: 60,
                lastRequest: 0,
                active: true
            },
            nflapi: {
                name: 'NFL Data',
                baseUrl: 'https://api.nfl.com/v1',
                rateLimit: 50,
                lastRequest: 0,
                active: false // Requires auth
            },
            nbaapi: {
                name: 'NBA Stats',
                baseUrl: 'https://stats.nba.com/stats',
                rateLimit: 45,
                lastRequest: 0,
                active: true
            },
            sportsdata: {
                name: 'SportsData.io',
                baseUrl: 'https://api.sportsdata.io/v3',
                rateLimit: 30,
                lastRequest: 0,
                active: false // Requires API key
            }
        };
        
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.websockets = new Map();
        this.eventListeners = new Map();
    }
    
    // Generic fetch with rate limiting
    async fetchWithRateLimit(connector, endpoint, options = {}) {
        const conn = this.connectors[connector];
        if (!conn || !conn.active) {
            throw new Error(`Connector ${connector} is not available`);
        }
        
        // Check rate limit
        const now = Date.now();
        const timeSinceLastRequest = now - conn.lastRequest;
        const minInterval = 60000 / conn.rateLimit;
        
        if (timeSinceLastRequest < minInterval) {
            await this.delay(minInterval - timeSinceLastRequest);
        }
        
        conn.lastRequest = Date.now();
        
        // Check cache
        const cacheKey = `${connector}:${endpoint}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }
        
        try {
            const response = await fetch(`${conn.baseUrl}${endpoint}`, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the response
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error(`Error fetching from ${connector}:`, error);
            throw error;
        }
    }
    
    // Delay helper for rate limiting
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ESPN Connectors
    async getESPNScores(sport, league) {
        const endpoint = `/${sport}/${league}/scoreboard`;
        return this.fetchWithRateLimit('espn', endpoint);
    }
    
    async getESPNTeamStats(sport, league, teamId) {
        const endpoint = `/${sport}/${league}/teams/${teamId}/statistics`;
        return this.fetchWithRateLimit('espn', endpoint);
    }
    
    async getESPNNews(sport, league, limit = 10) {
        const endpoint = `/${sport}/${league}/news?limit=${limit}`;
        return this.fetchWithRateLimit('espn', endpoint);
    }
    
    // MLB Stats API Connectors
    async getMLBGameToday() {
        const today = new Date().toISOString().split('T')[0];
        const endpoint = `/schedule?sportId=1&date=${today}`;
        return this.fetchWithRateLimit('statsapi', endpoint);
    }
    
    async getMLBTeamRoster(teamId) {
        const endpoint = `/teams/${teamId}/roster`;
        return this.fetchWithRateLimit('statsapi', endpoint);
    }
    
    async getMLBPlayerStats(playerId, season = 2024) {
        const endpoint = `/people/${playerId}/stats?stats=season&season=${season}`;
        return this.fetchWithRateLimit('statsapi', endpoint);
    }
    
    async getMLBStandings() {
        const endpoint = '/standings?leagueId=103,104';
        return this.fetchWithRateLimit('statsapi', endpoint);
    }
    
    // NBA Stats Connectors
    async getNBAScoreboard() {
        const endpoint = '/scoreboardv2?DayOffset=0';
        return this.fetchWithRateLimit('nbaapi', endpoint);
    }
    
    async getNBATeamStats(teamId) {
        const endpoint = `/teamdashboardbygeneralsplits?TeamID=${teamId}`;
        return this.fetchWithRateLimit('nbaapi', endpoint);
    }
    
    async getNBAPlayerTracking() {
        const endpoint = '/leaguedashptstats?PlayerOrTeam=Player';
        return this.fetchWithRateLimit('nbaapi', endpoint);
    }
    
    // WebSocket connections for real-time updates
    connectWebSocket(url, handlers) {
        if (this.websockets.has(url)) {
            return this.websockets.get(url);
        }
        
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
            console.log(`WebSocket connected to ${url}`);
            if (handlers.onOpen) handlers.onOpen();
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (handlers.onMessage) handlers.onMessage(data);
            
            // Trigger event listeners
            this.triggerEvent('message', data);
        };
        
        ws.onerror = (error) => {
            console.error(`WebSocket error:`, error);
            if (handlers.onError) handlers.onError(error);
        };
        
        ws.onclose = () => {
            console.log(`WebSocket disconnected from ${url}`);
            this.websockets.delete(url);
            if (handlers.onClose) handlers.onClose();
        };
        
        this.websockets.set(url, ws);
        return ws;
    }
    
    // Event system for real-time updates
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    triggerEvent(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                callback(data);
            });
        }
    }
    
    // Aggregate data from multiple sources
    async getAggregatedTeamData(teamName, sport) {
        const aggregated = {
            team: teamName,
            sport: sport,
            timestamp: Date.now(),
            sources: {},
            combined: {}
        };
        
        // Try multiple sources
        const promises = [];
        
        if (sport === 'MLB') {
            promises.push(
                this.getMLBStandings().then(data => {
                    aggregated.sources.mlb = data;
                }).catch(err => console.error('MLB fetch failed:', err))
            );
        }
        
        if (sport === 'NBA') {
            promises.push(
                this.getNBAScoreboard().then(data => {
                    aggregated.sources.nba = data;
                }).catch(err => console.error('NBA fetch failed:', err))
            );
        }
        
        promises.push(
            this.getESPNScores(sport.toLowerCase(), sport.toLowerCase()).then(data => {
                aggregated.sources.espn = data;
            }).catch(err => console.error('ESPN fetch failed:', err))
        );
        
        await Promise.allSettled(promises);
        
        // Combine data from successful sources
        aggregated.combined = this.mergeSourceData(aggregated.sources);
        
        return aggregated;
    }
    
    // Merge data from multiple sources
    mergeSourceData(sources) {
        const merged = {
            scores: [],
            standings: [],
            stats: {},
            news: []
        };
        
        // Merge scores
        if (sources.espn?.events) {
            merged.scores.push(...sources.espn.events);
        }
        
        if (sources.nba?.GameHeader) {
            merged.scores.push(...sources.nba.GameHeader);
        }
        
        // Merge standings
        if (sources.mlb?.records) {
            merged.standings.push(...sources.mlb.records);
        }
        
        return merged;
    }
    
    // Polling for continuous updates
    startPolling(callback, interval = 30000) {
        return setInterval(async () => {
            try {
                const data = await this.getAllLiveScores();
                callback(data);
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, interval);
    }
    
    stopPolling(intervalId) {
        clearInterval(intervalId);
    }
    
    // Get all live scores across sports
    async getAllLiveScores() {
        const scores = {
            timestamp: Date.now(),
            sports: {}
        };
        
        const sports = [
            { sport: 'baseball', league: 'mlb' },
            { sport: 'basketball', league: 'nba' },
            { sport: 'football', league: 'nfl' }
        ];
        
        const promises = sports.map(async ({ sport, league }) => {
            try {
                const data = await this.getESPNScores(sport, league);
                scores.sports[league] = data;
            } catch (error) {
                console.error(`Failed to get ${league} scores:`, error);
                scores.sports[league] = null;
            }
        });
        
        await Promise.allSettled(promises);
        
        return scores;
    }
    
    // Clear cache
    clearCache() {
        this.cache.clear();
    }
    
    // Close all connections
    disconnect() {
        this.websockets.forEach(ws => ws.close());
        this.websockets.clear();
        this.eventListeners.clear();
        this.clearCache();
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeDataConnectors;
}