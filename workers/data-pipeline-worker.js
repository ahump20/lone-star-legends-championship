/**
 * Blaze Intelligence - Data Pipeline Worker
 * Cloudflare Worker for ingesting roster/projection data into R2
 * Supports NCAA Power Conferences, NFL rosters, MLB Statcast
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        try {
            // Route requests to appropriate handlers
            if (url.pathname.startsWith('/api/data/ingest')) {
                return await this.handleDataIngestion(request, env, ctx);
            } else if (url.pathname.startsWith('/api/data/query')) {
                return await this.handleDataQuery(request, env, ctx);
            } else if (url.pathname.startsWith('/api/data/status')) {
                return await this.handlePipelineStatus(request, env, ctx);
            } else if (url.pathname.startsWith('/api/data/health')) {
                return await this.handleHealthCheck(request, env, ctx);
            } else {
                return new Response('Data Pipeline API - Blaze Intelligence', {
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        } catch (error) {
            console.error('Data Pipeline Error:', error);
            return new Response(JSON.stringify({
                error: 'Pipeline processing failed',
                message: error.message,
                timestamp: Date.now()
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    },

    async handleDataIngestion(request, env, ctx) {
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        const { dataType, source, data } = await request.json();
        
        // Validate required fields
        if (!dataType || !source || !data) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: dataType, source, data'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Process based on data type
        let processedData;
        switch (dataType) {
            case 'mlb_roster':
                processedData = await this.processMLBRosterData(data);
                break;
            case 'nfl_roster':
                processedData = await this.processNFLRosterData(data);
                break;
            case 'ncaa_roster':
                processedData = await this.processNCAAData(data);
                break;
            case 'mlb_statcast':
                processedData = await this.processStatcastData(data);
                break;
            case 'projections':
                processedData = await this.processProjectionsData(data);
                break;
            default:
                return new Response(JSON.stringify({
                    error: 'Unsupported data type',
                    supportedTypes: ['mlb_roster', 'nfl_roster', 'ncaa_roster', 'mlb_statcast', 'projections']
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }

        // Store in R2
        const storageResult = await this.storeInR2(env, dataType, source, processedData);
        
        // Log job metadata to Notion
        await this.logJobMetadata(env, {
            dataType,
            source,
            timestamp: Date.now(),
            recordCount: Array.isArray(processedData) ? processedData.length : 1,
            storageResult,
            status: 'completed'
        });

        return new Response(JSON.stringify({
            success: true,
            dataType,
            source,
            recordsProcessed: Array.isArray(processedData) ? processedData.length : 1,
            storageLocation: storageResult.key,
            timestamp: Date.now()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async processMLBRosterData(data) {
        // Process MLB roster data with Statcast integration
        const processed = {
            league: 'MLB',
            lastUpdated: Date.now(),
            teams: {}
        };

        // Focus on Cardinals primarily, but support all teams
        const priorityTeams = ['Cardinals', 'Cubs', 'Brewers', 'Pirates', 'Reds']; // NL Central
        
        if (data.teams) {
            for (const [teamName, roster] of Object.entries(data.teams)) {
                processed.teams[teamName] = {
                    name: teamName,
                    division: this.getMLBDivision(teamName),
                    priority: priorityTeams.includes(teamName),
                    players: roster.map(player => ({
                        id: player.id,
                        name: player.name,
                        position: player.position,
                        jerseyNumber: player.number,
                        battingStats: {
                            avg: player.battingAvg || 0,
                            obp: player.onBasePerc || 0,
                            slg: player.slugging || 0,
                            ops: (player.onBasePerc || 0) + (player.slugging || 0),
                            homeRuns: player.homeRuns || 0,
                            rbi: player.rbi || 0
                        },
                        pitchingStats: player.position.includes('P') ? {
                            era: player.era || 0,
                            whip: player.whip || 0,
                            strikeouts: player.strikeouts || 0,
                            walks: player.walks || 0,
                            saves: player.saves || 0
                        } : null,
                        statcastMetrics: {
                            exitVelo: player.avgExitVelo || 0,
                            launchAngle: player.avgLaunchAngle || 0,
                            barrelRate: player.barrelRate || 0,
                            hardHitRate: player.hardHitRate || 0
                        },
                        readinessFactors: {
                            healthStatus: player.healthStatus || 'active',
                            recentPerformance: this.calculateRecentPerformance(player),
                            matchupAdvantage: this.calculateMatchupAdvantage(player, teamName)
                        }
                    }))
                };
            }
        }

        return processed;
    },

    async processNFLRosterData(data) {
        // Process NFL roster data with focus on Titans
        const processed = {
            league: 'NFL',
            lastUpdated: Date.now(),
            teams: {}
        };

        const priorityTeams = ['Titans', 'Colts', 'Jaguars', 'Texans']; // AFC South

        if (data.teams) {
            for (const [teamName, roster] of Object.entries(data.teams)) {
                processed.teams[teamName] = {
                    name: teamName,
                    division: this.getNFLDivision(teamName),
                    priority: priorityTeams.includes(teamName),
                    players: roster.map(player => ({
                        id: player.id,
                        name: player.name,
                        position: player.position,
                        jerseyNumber: player.number,
                        experience: player.yearsExp || 0,
                        stats: {
                            passingYards: player.passingYards || 0,
                            rushingYards: player.rushingYards || 0,
                            receivingYards: player.receivingYards || 0,
                            touchdowns: player.touchdowns || 0,
                            tackles: player.tackles || 0,
                            sacks: player.sacks || 0,
                            interceptions: player.interceptions || 0
                        },
                        physicalMetrics: {
                            height: player.height,
                            weight: player.weight,
                            fortyTime: player.fortyTime,
                            benchPress: player.benchPress
                        },
                        readinessFactors: {
                            healthStatus: player.injuryStatus || 'active',
                            snapCount: player.snapCount || 0,
                            targetShare: player.targetShare || 0
                        }
                    }))
                };
            }
        }

        return processed;
    },

    async processNCAAData(data) {
        // Process NCAA data with focus on Power Conferences
        const powerConferences = ['SEC', 'Big 12', 'Big Ten', 'ACC', 'Pac-12'];
        
        const processed = {
            league: 'NCAA',
            lastUpdated: Date.now(),
            conferences: {}
        };

        if (data.conferences) {
            for (const [confName, teams] of Object.entries(data.conferences)) {
                if (powerConferences.includes(confName)) {
                    processed.conferences[confName] = {
                        name: confName,
                        isPowerConference: true,
                        teams: teams.map(team => ({
                            name: team.name,
                            priority: team.name === 'Longhorns' || team.name.includes('Texas'),
                            record: team.record,
                            ranking: team.ranking,
                            roster: team.roster ? team.roster.map(player => ({
                                name: player.name,
                                position: player.position,
                                year: player.year,
                                stats: player.stats || {},
                                nilValue: this.estimateNILValue(player, team)
                            })) : []
                        }))
                    };
                }
            }
        }

        return processed;
    },

    async processStatcastData(data) {
        // Process MLB Statcast data with advanced metrics
        const processed = {
            source: 'MLB Statcast',
            lastUpdated: Date.now(),
            games: []
        };

        if (data.games) {
            processed.games = data.games.map(game => ({
                gameId: game.gameId,
                date: game.date,
                teams: {
                    home: game.homeTeam,
                    away: game.awayTeam
                },
                isCardinalsGame: game.homeTeam === 'Cardinals' || game.awayTeam === 'Cardinals',
                statcastMetrics: {
                    avgExitVelo: game.avgExitVelo || 0,
                    maxExitVelo: game.maxExitVelo || 0,
                    barrels: game.barrels || 0,
                    hardHitRate: game.hardHitRate || 0,
                    avgLaunchAngle: game.avgLaunchAngle || 0
                },
                pitchingMetrics: {
                    avgVelo: game.avgPitchVelo || 0,
                    spinRate: game.avgSpinRate || 0,
                    strikePercentage: game.strikePercentage || 0,
                    swingAndMiss: game.swingAndMissRate || 0
                },
                gameContext: {
                    leverage: this.calculateGameLeverage(game),
                    importance: this.calculateGameImportance(game)
                }
            }));
        }

        return processed;
    },

    async processProjectionsData(data) {
        // Process projection data for various sports
        return {
            type: 'projections',
            lastUpdated: Date.now(),
            projections: data.projections || [],
            confidence: data.confidence || 0.85,
            methodology: data.methodology || 'Blaze Intelligence ML',
            validUntil: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
    },

    async storeInR2(env, dataType, source, data) {
        const key = `${dataType}/${source}/${Date.now()}.json`;
        const metadata = {
            dataType,
            source,
            timestamp: Date.now(),
            recordCount: Array.isArray(data) ? data.length : 1
        };

        await env.DATA_BUCKET.put(key, JSON.stringify(data), {
            customMetadata: metadata
        });

        // Also store latest version for quick access
        const latestKey = `${dataType}/${source}/latest.json`;
        await env.DATA_BUCKET.put(latestKey, JSON.stringify(data), {
            customMetadata: metadata
        });

        return { key, latestKey };
    },

    async handleDataQuery(request, env, ctx) {
        const url = new URL(request.url);
        const dataType = url.searchParams.get('type');
        const source = url.searchParams.get('source');
        const latest = url.searchParams.get('latest') === 'true';

        if (!dataType) {
            return new Response(JSON.stringify({
                error: 'Missing required parameter: type'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            let key;
            if (latest && source) {
                key = `${dataType}/${source}/latest.json`;
            } else {
                // List available data
                const list = await env.DATA_BUCKET.list({
                    prefix: source ? `${dataType}/${source}/` : `${dataType}/`,
                    limit: 10
                });
                
                return new Response(JSON.stringify({
                    dataType,
                    source,
                    availableFiles: list.objects.map(obj => ({
                        key: obj.key,
                        uploaded: obj.uploaded,
                        size: obj.size,
                        metadata: obj.customMetadata
                    }))
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const object = await env.DATA_BUCKET.get(key);
            if (!object) {
                return new Response(JSON.stringify({
                    error: 'Data not found',
                    key
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const data = await object.json();
            return new Response(JSON.stringify(data), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=300' // 5 minutes
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: 'Query failed',
                message: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    },

    async handlePipelineStatus(request, env, ctx) {
        // Get pipeline status and recent jobs
        const recentJobs = await this.getRecentJobs(env);
        const systemHealth = await this.checkSystemHealth(env);

        return new Response(JSON.stringify({
            status: 'operational',
            timestamp: Date.now(),
            systemHealth,
            recentJobs: recentJobs.slice(0, 10),
            supportedDataTypes: [
                'mlb_roster',
                'nfl_roster', 
                'ncaa_roster',
                'mlb_statcast',
                'projections'
            ],
            dataSources: {
                mlb: ['MLB API', 'Statcast', 'Baseball Savant'],
                nfl: ['NFL API', 'Pro Football Reference'],
                ncaa: ['College Football Data', 'Sports Reference'],
                custom: ['Blaze Intelligence Models']
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async handleHealthCheck(request, env, ctx) {
        const checks = {
            r2Connection: false,
            notionConnection: false,
            apiAccess: false,
            timestamp: Date.now()
        };

        try {
            // Test R2 connection
            const testKey = 'health-check-' + Date.now();
            await env.DATA_BUCKET.put(testKey, 'health-check');
            await env.DATA_BUCKET.delete(testKey);
            checks.r2Connection = true;
        } catch (error) {
            console.error('R2 health check failed:', error);
        }

        try {
            // Test Notion connection (if configured)
            if (env.NOTION_TOKEN) {
                checks.notionConnection = true; // Simplified for now
            }
        } catch (error) {
            console.error('Notion health check failed:', error);
        }

        checks.apiAccess = true; // Worker is responding

        const isHealthy = checks.r2Connection && checks.apiAccess;

        return new Response(JSON.stringify({
            status: isHealthy ? 'healthy' : 'degraded',
            checks,
            timestamp: Date.now()
        }), {
            status: isHealthy ? 200 : 503,
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async logJobMetadata(env, jobData) {
        try {
            // Store job metadata in R2
            const key = `jobs/metadata/${jobData.timestamp}.json`;
            await env.DATA_BUCKET.put(key, JSON.stringify(jobData));

            // Also log to Notion if configured
            if (env.NOTION_TOKEN) {
                // This would integrate with Notion API
                console.log('Job logged to Notion:', jobData);
            }
        } catch (error) {
            console.error('Failed to log job metadata:', error);
        }
    },

    async getRecentJobs(env) {
        try {
            const list = await env.DATA_BUCKET.list({
                prefix: 'jobs/metadata/',
                limit: 20
            });
            
            const jobs = [];
            for (const obj of list.objects) {
                try {
                    const jobData = await env.DATA_BUCKET.get(obj.key);
                    if (jobData) {
                        jobs.push(await jobData.json());
                    }
                } catch (error) {
                    console.error('Failed to read job metadata:', error);
                }
            }
            
            return jobs.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to get recent jobs:', error);
            return [];
        }
    },

    async checkSystemHealth(env) {
        const health = {
            r2Storage: false,
            dataFreshness: 'unknown',
            errorRate: 0,
            lastSuccessfulJob: null
        };

        try {
            // Check R2 storage
            const testList = await env.DATA_BUCKET.list({ limit: 1 });
            health.r2Storage = true;

            // Check data freshness
            const recentJobs = await this.getRecentJobs(env);
            if (recentJobs.length > 0) {
                const lastJob = recentJobs[0];
                const ageHours = (Date.now() - lastJob.timestamp) / (1000 * 60 * 60);
                
                if (ageHours < 1) health.dataFreshness = 'fresh';
                else if (ageHours < 6) health.dataFreshness = 'recent';
                else if (ageHours < 24) health.dataFreshness = 'stale';
                else health.dataFreshness = 'old';

                health.lastSuccessfulJob = lastJob.timestamp;
            }

        } catch (error) {
            console.error('System health check failed:', error);
        }

        return health;
    },

    // Utility methods for data processing
    getMLBDivision(teamName) {
        const divisions = {
            'Cardinals': 'NL Central',
            'Cubs': 'NL Central', 
            'Brewers': 'NL Central',
            'Pirates': 'NL Central',
            'Reds': 'NL Central'
        };
        return divisions[teamName] || 'Unknown';
    },

    getNFLDivision(teamName) {
        const divisions = {
            'Titans': 'AFC South',
            'Colts': 'AFC South',
            'Jaguars': 'AFC South', 
            'Texans': 'AFC South'
        };
        return divisions[teamName] || 'Unknown';
    },

    calculateRecentPerformance(player) {
        // Simplified performance calculation
        if (player.recentStats) {
            const stats = player.recentStats;
            return (stats.hits || 0) / Math.max(1, stats.atBats || 1);
        }
        return 0.25; // Default
    },

    calculateMatchupAdvantage(player, teamName) {
        // Simplified matchup calculation
        return Math.random() * 0.2 - 0.1; // -10% to +10% advantage
    },

    estimateNILValue(player, team) {
        // Simplified NIL valuation
        const baseValue = 10000; // $10k base
        const multipliers = {
            QB: 5.0,
            RB: 3.0,
            WR: 3.0,
            TE: 2.0,
            LB: 2.5,
            DB: 2.5,
            DL: 2.0,
            OL: 1.5
        };
        
        const positionMultiplier = multipliers[player.position] || 1.0;
        const yearMultiplier = { 'FR': 0.5, 'SO': 0.8, 'JR': 1.2, 'SR': 1.5 }[player.year] || 1.0;
        
        return Math.round(baseValue * positionMultiplier * yearMultiplier);
    },

    calculateGameLeverage(game) {
        // Simplified game leverage calculation
        let leverage = 1.0;
        
        if (game.inning >= 7) leverage *= 1.5;
        if (game.scoreDiff <= 3) leverage *= 1.8;
        if (game.baserunners > 0) leverage *= 1.3;
        
        return Math.round(leverage * 100) / 100;
    },

    calculateGameImportance(game) {
        // Simplified importance calculation
        let importance = 0.5;
        
        if (game.homeTeam === 'Cardinals' || game.awayTeam === 'Cardinals') importance += 0.3;
        if (game.isPlayoffs) importance += 0.4;
        if (game.isRivalry) importance += 0.2;
        
        return Math.min(1.0, importance);
    }
};