#!/usr/bin/env node

/**
 * Blaze Intelligence Orchestrated Ingestion Pipeline
 * Manages scheduled data collection across all sports leagues
 * with HAV-F evaluation and unified schema transformation
 */

import cron from 'node-cron';
import { createClient } from 'redis';
import winston from 'winston';
import MultiLeagueConnector from '../agents/multi-league-connector.js';
import HavfEvaluationEngine from '../agents/havf-evaluation-engine.js';
import UnifiedSchema from '../schemas/unified-player-schema.js';
import fs from 'fs/promises';
import path from 'path';

class IngestionPipeline {
    constructor() {
        // Initialize logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.simple()
                }),
                new winston.transports.File({ 
                    filename: 'logs/ingestion-pipeline.log',
                    maxsize: 10485760, // 10MB
                    maxFiles: 5
                })
            ]
        });

        // Initialize Redis for state management
        this.redis = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        // Initialize connectors
        this.connector = new MultiLeagueConnector();
        this.havfEngine = new HavfEvaluationEngine();

        // Pipeline configuration
        this.config = {
            schedules: {
                mlb: '0 2 * * *',           // 2 AM daily
                nfl: '0 3 * * 1',           // 3 AM Mondays
                nba: '0 4 * * *',           // 4 AM daily
                ncaaFootball: '0 5 * * 2,6', // 5 AM Tuesdays & Saturdays
                ncaaBaseball: '0 6 * * 3,7', // 6 AM Wednesdays & Sundays
                perfectGame: '0 7 * * 5',    // 7 AM Fridays
                nil: '0 */6 * * *',         // Every 6 hours
                international: '0 8 * * 4'   // 8 AM Thursdays
            },
            batchSize: 100,
            parallelJobs: 3,
            retryAttempts: 3,
            dataPath: 'data/ingested',
            outputPath: 'data/processed'
        };

        // Job queue
        this.jobQueue = [];
        this.activeJobs = new Map();
        
        this.logger.info('Ingestion Pipeline initialized');
    }

    // Initialize pipeline
    async initialize() {
        try {
            // Connect to Redis
            await this.redis.connect();
            this.logger.info('Connected to Redis');

            // Create necessary directories
            await this.createDirectories();

            // Load previous state
            await this.loadState();

            // Schedule all jobs
            this.scheduleJobs();

            this.logger.info('Pipeline initialization complete');
            return true;
        } catch (error) {
            this.logger.error(`Initialization failed: ${error.message}`);
            throw error;
        }
    }

    // Schedule cron jobs for each league
    scheduleJobs() {
        // MLB Daily Ingestion
        cron.schedule(this.config.schedules.mlb, async () => {
            await this.executeJob('MLB', async () => {
                const teams = ['STL', 'BAL', 'NYY', 'BOS', 'LAD', 'SF', 'SD', 'ATL'];
                for (const team of teams) {
                    await this.ingestMLB(team);
                }
            });
        });

        // NFL Weekly Ingestion
        cron.schedule(this.config.schedules.nfl, async () => {
            await this.executeJob('NFL', async () => {
                const teams = ['TEN', 'BUF', 'KC', 'DAL', 'SF', 'MIA'];
                for (const team of teams) {
                    await this.ingestNFL(team);
                }
            });
        });

        // NBA Daily Ingestion
        cron.schedule(this.config.schedules.nba, async () => {
            await this.executeJob('NBA', async () => {
                const teams = ['MEM', 'LAL', 'BOS', 'GSW', 'MIA', 'DEN'];
                for (const team of teams) {
                    await this.ingestNBA(team);
                }
            });
        });

        // NCAA Football Bi-weekly
        cron.schedule(this.config.schedules.ncaaFootball, async () => {
            await this.executeJob('NCAA_FOOTBALL', async () => {
                const conferences = ['SEC', 'Big 12', 'Big Ten', 'ACC', 'Pac-12'];
                for (const conference of conferences) {
                    await this.ingestNCAAFootball(conference);
                }
            });
        });

        // NCAA Baseball Bi-weekly
        cron.schedule(this.config.schedules.ncaaBaseball, async () => {
            await this.executeJob('NCAA_BASEBALL', async () => {
                await this.ingestNCAABaseball();
            });
        });

        // Perfect Game Weekly
        cron.schedule(this.config.schedules.perfectGame, async () => {
            await this.executeJob('PERFECT_GAME', async () => {
                const years = [2024, 2025, 2026, 2027];
                for (const year of years) {
                    await this.ingestPerfectGame(year);
                }
            });
        });

        // NIL Every 6 Hours
        cron.schedule(this.config.schedules.nil, async () => {
            await this.executeJob('NIL', async () => {
                const schools = ['Texas', 'Alabama', 'Georgia', 'Ohio State', 'USC'];
                for (const school of schools) {
                    await this.ingestNIL(school);
                }
            });
        });

        // International Weekly
        cron.schedule(this.config.schedules.international, async () => {
            await this.executeJob('INTERNATIONAL', async () => {
                await this.ingestInternational('KBO');
                await this.ingestInternational('NPB');
                await this.ingestInternational('LATIN');
            });
        });

        this.logger.info('All jobs scheduled successfully');
    }

    // Execute a scheduled job
    async executeJob(jobName, jobFunction) {
        const jobId = `${jobName}_${Date.now()}`;
        
        try {
            this.logger.info(`Starting job: ${jobId}`);
            this.activeJobs.set(jobId, { 
                name: jobName, 
                startTime: new Date(),
                status: 'running'
            });

            // Execute the job
            await jobFunction();

            // Mark job complete
            this.activeJobs.get(jobId).status = 'completed';
            this.activeJobs.get(jobId).endTime = new Date();
            
            this.logger.info(`Job completed: ${jobId}`);
            
            // Save state
            await this.saveState();
            
        } catch (error) {
            this.logger.error(`Job failed: ${jobId} - ${error.message}`);
            this.activeJobs.get(jobId).status = 'failed';
            this.activeJobs.get(jobId).error = error.message;
            
            // Retry logic
            await this.retryJob(jobId, jobFunction);
        } finally {
            // Clean up old job records
            setTimeout(() => {
                this.activeJobs.delete(jobId);
            }, 3600000); // Keep for 1 hour
        }
    }

    // MLB Ingestion
    async ingestMLB(team) {
        this.logger.info(`Ingesting MLB data for ${team}`);
        
        const rawData = await this.connector.ingestMLB(team, new Date().getFullYear());
        const processedData = await this.processPlayers(rawData, 'MLB');
        
        await this.saveData('MLB', team, processedData);
        
        // Update real-time feed
        if (team === 'STL') {
            await this.updateCardinalsReadiness(processedData);
        }
        
        return processedData;
    }

    // NFL Ingestion
    async ingestNFL(team) {
        this.logger.info(`Ingesting NFL data for ${team}`);
        
        const rawData = await this.connector.ingestNFL(team, new Date().getFullYear());
        const processedData = await this.processPlayers(rawData, 'NFL');
        
        await this.saveData('NFL', team, processedData);
        
        return processedData;
    }

    // NBA Ingestion
    async ingestNBA(team) {
        this.logger.info(`Ingesting NBA data for ${team}`);
        
        const currentSeason = this.getCurrentNBASeason();
        const rawData = await this.connector.ingestNBA(team, currentSeason);
        const processedData = await this.processPlayers(rawData, 'NBA');
        
        await this.saveData('NBA', team, processedData);
        
        return processedData;
    }

    // NCAA Football Ingestion
    async ingestNCAAFootball(conference) {
        this.logger.info(`Ingesting NCAA Football data for ${conference}`);
        
        const rawData = await this.connector.ingestNCAAFootball(conference, new Date().getFullYear());
        const processedData = await this.processPlayers(rawData, 'NCAA_FOOTBALL');
        
        await this.saveData('NCAA_FOOTBALL', conference, processedData);
        
        return processedData;
    }

    // NCAA Baseball Ingestion
    async ingestNCAABaseball() {
        this.logger.info('Ingesting NCAA Baseball data');
        
        // Implementation for NCAA Baseball
        // Note: This would need specific API implementation
        const processedData = [];
        
        await this.saveData('NCAA_BASEBALL', 'all', processedData);
        
        return processedData;
    }

    // Perfect Game Ingestion
    async ingestPerfectGame(graduationYear) {
        this.logger.info(`Ingesting Perfect Game data for class of ${graduationYear}`);
        
        const rawData = await this.connector.ingestPerfectGame(null, graduationYear);
        const processedData = await this.processPlayers(rawData, 'PERFECT_GAME');
        
        await this.saveData('PERFECT_GAME', `class_${graduationYear}`, processedData);
        
        return processedData;
    }

    // NIL Ingestion
    async ingestNIL(school) {
        this.logger.info(`Ingesting NIL data for ${school}`);
        
        const sports = ['football', 'basketball', 'baseball'];
        let allData = [];
        
        for (const sport of sports) {
            const rawData = await this.connector.ingestNIL(school, sport);
            const processedData = await this.processPlayers(rawData, 'NIL');
            allData = allData.concat(processedData);
        }
        
        await this.saveData('NIL', school, allData);
        
        return allData;
    }

    // International Ingestion
    async ingestInternational(league) {
        this.logger.info(`Ingesting ${league} international data`);
        
        const rawData = await this.connector.ingestInternational(league, new Date().getFullYear());
        const processedData = await this.processPlayers(rawData, league);
        
        await this.saveData('INTERNATIONAL', league, processedData);
        
        return processedData;
    }

    // Process players through unified schema and HAV-F evaluation
    async processPlayers(players, league) {
        const processed = [];
        
        for (const player of players) {
            try {
                // Transform to unified schema
                const unified = this.transformToUnifiedSchema(player, league);
                
                // Calculate HAV-F metrics
                unified.havf = {
                    championReadiness: this.havfEngine.calculateChampionReadiness(player),
                    cognitiveLeverage: this.havfEngine.calculateCognitiveLeverage(player),
                    nilTrustScore: this.havfEngine.calculateNILTrustScore(player),
                    composite: {
                        overall: UnifiedSchema.calculateComposite(unified),
                        rank: null, // Will be calculated after all players processed
                        tier: this.calculateTier(unified),
                        confidence: this.calculateConfidence(player)
                    },
                    lastUpdated: new Date(),
                    nextEvaluation: this.getNextEvaluationDate(league)
                };
                
                // Validate against schema
                if (UnifiedSchema.validate(unified)) {
                    processed.push(unified);
                }
            } catch (error) {
                this.logger.error(`Failed to process player ${player.name}: ${error.message}`);
            }
        }
        
        // Calculate ranks within processed batch
        this.calculateRanks(processed);
        
        return processed;
    }

    // Transform raw data to unified schema
    transformToUnifiedSchema(player, league) {
        const blazeId = this.generateBlazeId(player, league);
        
        return {
            identity: {
                id: player.id,
                blazeId: blazeId,
                name: player.name,
                alternateNames: player.alternateNames || [],
                dateOfBirth: player.dateOfBirth || null,
                age: player.age || this.calculateAge(player.dateOfBirth),
                nationality: player.nationality || 'USA',
                secondaryNationality: player.secondaryNationality || null
            },
            
            affiliation: {
                league: {
                    type: league,
                    name: this.getLeagueName(league),
                    level: this.getLeagueLevel(league)
                },
                team: {
                    id: player.team,
                    name: player.teamName || player.team,
                    abbreviation: player.team,
                    conference: player.conference || null,
                    division: player.division || null
                },
                position: {
                    primary: player.position,
                    secondary: player.secondaryPositions || [],
                    depth: player.depthChart || null
                },
                contractStatus: {
                    type: this.getContractType(league, player),
                    years: player.contractYears || null,
                    value: player.contractValue || null,
                    expires: player.contractExpires || null
                }
            },
            
            physiology: {
                height: {
                    inches: player.height || null,
                    centimeters: player.height ? player.height * 2.54 : null
                },
                weight: {
                    pounds: player.weight || null,
                    kilograms: player.weight ? player.weight * 0.453592 : null
                },
                wingspan: player.wingspan || null,
                handSize: player.handSize || null,
                bodyFatPercentage: player.bodyFat || null,
                muscleComposition: {
                    fastTwitch: null,
                    slowTwitch: null
                }
            },
            
            statistics: {
                current: player.stats || {},
                career: player.careerStats || {},
                projections: player.projections || {}
            },
            
            athleticism: player.combine || {},
            
            health: {
                status: player.status || 'Healthy',
                injuryHistory: player.injuries || [],
                durabilityScore: this.calculateDurability(player),
                loadManagement: {}
            },
            
            development: {
                scoutingGrade: player.scoutingGrade || {},
                trajectory: player.trajectory || 'Unknown',
                coachability: null,
                workEthic: null,
                improvements: [],
                comparisons: player.comparisons || []
            },
            
            market: {
                contractValue: player.contractValue || null,
                marketValue: player.marketValue || null,
                nilValue: player.nilValue || null,
                endorsements: player.endorsements || [],
                transferValue: player.transferValue || null,
                roi: {
                    current: null,
                    projected: null,
                    efficiency: null
                }
            },
            
            metadata: {
                dataQuality: this.assessDataQuality(player),
                lastUpdated: new Date(),
                sources: [league],
                version: UnifiedSchema.version,
                flags: [],
                tags: this.generateTags(player, league)
            },
            
            pipeline: this.getPipelineInfo(player, league),
            
            cognitive: {
                iq: {},
                personality: {},
                mentalHealth: {
                    status: 'Unknown',
                    support: false,
                    programs: []
                }
            },
            
            digital: {
                social: player.social || {},
                gaming: player.gaming || {},
                media: player.media || {}
            }
        };
    }

    // Utility functions
    generateBlazeId(player, league) {
        const timestamp = Date.now().toString(36);
        const leagueCode = league.substring(0, 3).toUpperCase();
        const playerCode = player.name.substring(0, 3).toUpperCase();
        return `BLZ_${leagueCode}_${playerCode}_${timestamp}`;
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        const today = new Date();
        const birth = new Date(dateOfBirth);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    calculateTier(player) {
        const composite = player.havf?.composite?.overall || 0;
        if (composite >= 90) return 'Elite';
        if (composite >= 75) return 'High';
        if (composite >= 50) return 'Average';
        return 'Development';
    }

    calculateConfidence(player) {
        // Calculate confidence based on data completeness
        let fields = 0;
        let filled = 0;
        
        const checkFields = (obj) => {
            for (const key in obj) {
                fields++;
                if (obj[key] !== null && obj[key] !== undefined) {
                    filled++;
                }
                if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    checkFields(obj[key]);
                }
            }
        };
        
        checkFields(player);
        return Math.round((filled / fields) * 100);
    }

    calculateRanks(players) {
        // Sort by composite score
        players.sort((a, b) => 
            (b.havf?.composite?.overall || 0) - (a.havf?.composite?.overall || 0)
        );
        
        // Assign ranks
        players.forEach((player, index) => {
            if (player.havf?.composite) {
                player.havf.composite.rank = index + 1;
            }
        });
    }

    calculateDurability(player) {
        if (!player.injuries || player.injuries.length === 0) return 100;
        
        const totalDaysOut = player.injuries.reduce((sum, injury) => 
            sum + (injury.daysOut || 0), 0
        );
        
        const yearsPlayed = player.experience || 1;
        const avgDaysOutPerYear = totalDaysOut / yearsPlayed;
        
        // Scale: 0 days = 100, 100+ days = 0
        return Math.max(0, 100 - avgDaysOutPerYear);
    }

    assessDataQuality(player) {
        let quality = 100;
        
        // Deduct points for missing key fields
        if (!player.stats) quality -= 20;
        if (!player.age && !player.dateOfBirth) quality -= 10;
        if (!player.height || !player.weight) quality -= 10;
        if (!player.position) quality -= 15;
        
        return Math.max(0, quality);
    }

    generateTags(player, league) {
        const tags = [league];
        
        if (player.position) tags.push(player.position);
        if (player.team) tags.push(player.team);
        if (player.age && player.age < 25) tags.push('Young');
        if (player.age && player.age > 30) tags.push('Veteran');
        if (player.stats?.war > 5) tags.push('AllStar');
        
        return tags;
    }

    getLeagueName(league) {
        const names = {
            'MLB': 'Major League Baseball',
            'NFL': 'National Football League',
            'NBA': 'National Basketball Association',
            'NCAA_FOOTBALL': 'NCAA Division I Football',
            'NCAA_BASEBALL': 'NCAA Division I Baseball',
            'PERFECT_GAME': 'Perfect Game Youth Baseball',
            'NIL': 'Name, Image, Likeness',
            'KBO': 'Korea Baseball Organization',
            'NPB': 'Nippon Professional Baseball',
            'LATIN': 'Latin American Prospects'
        };
        return names[league] || league;
    }

    getLeagueLevel(league) {
        const levels = {
            'MLB': 'Professional',
            'NFL': 'Professional',
            'NBA': 'Professional',
            'NCAA_FOOTBALL': 'College',
            'NCAA_BASEBALL': 'College',
            'PERFECT_GAME': 'Youth',
            'NIL': 'College',
            'KBO': 'International',
            'NPB': 'International',
            'LATIN': 'International'
        };
        return levels[league] || 'Unknown';
    }

    getContractType(league, player) {
        if (['MLB', 'NFL', 'NBA'].includes(league)) return 'Professional';
        if (['NCAA_FOOTBALL', 'NCAA_BASEBALL'].includes(league)) return 'Scholarship';
        if (league === 'NIL') return 'NIL';
        if (league === 'PERFECT_GAME') return 'Amateur';
        return 'International';
    }

    getPipelineInfo(player, league) {
        if (!['PERFECT_GAME', 'LATIN', 'KBO', 'NPB'].includes(league)) return null;
        
        return {
            origin: player.origin || 'Unknown',
            pathway: player.pathway || 'Standard',
            milestones: player.milestones || [],
            projectedTimeline: {
                nextLevel: player.nextLevel || 'Unknown',
                timeframe: player.timeframe || 'Unknown',
                probability: player.probability || 0
            },
            internationalStatus: {
                eligible: player.eligible || false,
                posted: player.posted || false,
                visaStatus: player.visaStatus || 'Unknown'
            }
        };
    }

    getNextEvaluationDate(league) {
        const now = new Date();
        const schedules = {
            'MLB': 1,  // Daily
            'NBA': 1,  // Daily
            'NFL': 7,  // Weekly
            'NCAA_FOOTBALL': 3, // Bi-weekly
            'NCAA_BASEBALL': 3, // Bi-weekly
            'PERFECT_GAME': 7, // Weekly
            'NIL': 0.25, // Every 6 hours
            'KBO': 7,  // Weekly
            'NPB': 7,  // Weekly
            'LATIN': 7 // Weekly
        };
        
        const days = schedules[league] || 1;
        return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }

    getCurrentNBASeason() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        // NBA season runs October to June
        if (month >= 9) {
            return `${year}-${(year + 1).toString().substr(2)}`;
        } else {
            return `${year - 1}-${year.toString().substr(2)}`;
        }
    }

    // Data persistence
    async saveData(league, identifier, data) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${league}_${identifier}_${timestamp}.json`;
        const filepath = path.join(this.config.outputPath, league, filename);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        
        // Write data
        await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        
        // Update Redis cache
        const cacheKey = `blaze:processed:${league}:${identifier}`;
        await this.redis.setex(cacheKey, 86400, JSON.stringify({
            count: data.length,
            timestamp: timestamp,
            file: filepath
        }));
        
        this.logger.info(`Saved ${data.length} players to ${filepath}`);
    }

    // Update Cardinals Readiness (real-time)
    async updateCardinalsReadiness(players) {
        const readiness = players.map(p => ({
            name: p.identity.name,
            readiness: p.havf?.championReadiness?.score || 0,
            leverage: p.havf?.cognitiveLeverage?.score || 0,
            position: p.affiliation.position.primary
        }));
        
        // Write to real-time file
        const readinessFile = path.join('data', 'cardinals', 'readiness.json');
        await fs.mkdir(path.dirname(readinessFile), { recursive: true });
        await fs.writeFile(readinessFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            team: 'St. Louis Cardinals',
            readiness: readiness,
            averageReadiness: readiness.reduce((sum, p) => sum + p.readiness, 0) / readiness.length,
            averageLeverage: readiness.reduce((sum, p) => sum + p.leverage, 0) / readiness.length
        }, null, 2));
        
        this.logger.info('Updated Cardinals readiness board');
    }

    // Retry failed jobs
    async retryJob(jobId, jobFunction, attempt = 1) {
        if (attempt > this.config.retryAttempts) {
            this.logger.error(`Job ${jobId} failed after ${this.config.retryAttempts} attempts`);
            return;
        }
        
        const delay = attempt * 5000; // Exponential backoff
        this.logger.info(`Retrying job ${jobId} in ${delay}ms (attempt ${attempt})`);
        
        setTimeout(async () => {
            try {
                await jobFunction();
                this.activeJobs.get(jobId).status = 'completed';
                this.logger.info(`Job ${jobId} succeeded on retry ${attempt}`);
            } catch (error) {
                await this.retryJob(jobId, jobFunction, attempt + 1);
            }
        }, delay);
    }

    // State management
    async saveState() {
        const state = {
            activeJobs: Array.from(this.activeJobs.entries()),
            lastRun: new Date().toISOString(),
            config: this.config
        };
        
        await this.redis.set('blaze:pipeline:state', JSON.stringify(state));
    }

    async loadState() {
        const state = await this.redis.get('blaze:pipeline:state');
        if (state) {
            const parsed = JSON.parse(state);
            this.logger.info(`Loaded state from ${parsed.lastRun}`);
        }
    }

    // Directory creation
    async createDirectories() {
        const dirs = [
            'data/ingested',
            'data/processed',
            'data/cardinals',
            'logs'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    // Manual trigger for testing
    async manualIngest(league, identifier) {
        this.logger.info(`Manual ingestion triggered for ${league} - ${identifier}`);
        
        switch(league) {
            case 'MLB':
                return await this.ingestMLB(identifier);
            case 'NFL':
                return await this.ingestNFL(identifier);
            case 'NBA':
                return await this.ingestNBA(identifier);
            case 'NCAA_FOOTBALL':
                return await this.ingestNCAAFootball(identifier);
            case 'PERFECT_GAME':
                return await this.ingestPerfectGame(parseInt(identifier));
            case 'NIL':
                return await this.ingestNIL(identifier);
            case 'INTERNATIONAL':
                return await this.ingestInternational(identifier);
            default:
                throw new Error(`Unknown league: ${league}`);
        }
    }

    // Health check
    async healthCheck() {
        const health = {
            status: 'healthy',
            redis: this.redis.isOpen ? 'connected' : 'disconnected',
            activeJobs: this.activeJobs.size,
            lastUpdate: await this.redis.get('blaze:pipeline:lastUpdate') || 'Never',
            schedules: this.config.schedules
        };
        
        return health;
    }

    // Shutdown gracefully
    async shutdown() {
        this.logger.info('Shutting down ingestion pipeline');
        
        // Wait for active jobs to complete
        const timeout = setTimeout(() => {
            this.logger.warn('Force shutdown after timeout');
            process.exit(1);
        }, 30000);
        
        while (this.activeJobs.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        clearTimeout(timeout);
        
        // Disconnect from Redis
        await this.redis.disconnect();
        
        this.logger.info('Pipeline shutdown complete');
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const pipeline = new IngestionPipeline();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await pipeline.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await pipeline.shutdown();
        process.exit(0);
    });
    
    // Initialize and start pipeline
    pipeline.initialize()
        .then(() => {
            console.log('✅ Ingestion Pipeline started successfully');
            console.log('📊 Scheduled jobs:');
            for (const [league, schedule] of Object.entries(pipeline.config.schedules)) {
                console.log(`   ${league}: ${schedule}`);
            }
            console.log('\n🔄 Pipeline is running. Press Ctrl+C to stop.');
            
            // Manual test if specified
            if (process.argv[2] === 'test') {
                const league = process.argv[3] || 'MLB';
                const identifier = process.argv[4] || 'STL';
                pipeline.manualIngest(league, identifier)
                    .then(data => {
                        console.log(`✅ Test ingestion complete: ${data.length} players`);
                    })
                    .catch(error => {
                        console.error(`❌ Test ingestion failed: ${error.message}`);
                    });
            }
        })
        .catch(error => {
            console.error('❌ Pipeline initialization failed:', error);
            process.exit(1);
        });
}

export default IngestionPipeline;