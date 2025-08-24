/**
 * Unified Player Schema with HAV-F Metrics
 * Blaze Intelligence Proprietary Data Model
 * 
 * This schema represents the canonical structure for all player data
 * across all leagues with embedded HAV-F evaluation metrics
 */

const UnifiedPlayerSchema = {
    // Core Identity
    identity: {
        id: String,              // Unique identifier (league-specific)
        blazeId: String,         // Blaze Intelligence universal ID
        name: String,            // Full name
        alternateNames: [String], // Nicknames, international names
        dateOfBirth: Date,
        age: Number,
        nationality: String,
        secondaryNationality: String
    },

    // League & Team Information
    affiliation: {
        league: {
            type: String,        // MLB, NFL, NBA, NCAA_FOOTBALL, NCAA_BASEBALL, PERFECT_GAME, KBO, NPB, LATIN
            name: String,        // Full league name
            level: String        // Professional, College, Youth, International
        },
        team: {
            id: String,
            name: String,
            abbreviation: String,
            conference: String,   // For college sports
            division: String     // For pro sports
        },
        position: {
            primary: String,
            secondary: [String],
            depth: Number        // Depth chart position
        },
        contractStatus: {
            type: String,        // Signed, Draft Eligible, NIL, Amateur
            years: Number,
            value: Number,
            expires: Date
        }
    },

    // Physical Attributes
    physiology: {
        height: {
            inches: Number,
            centimeters: Number
        },
        weight: {
            pounds: Number,
            kilograms: Number
        },
        wingspan: Number,        // inches
        handSize: Number,        // inches
        bodyFatPercentage: Number,
        muscleComposition: {
            fastTwitch: Number,  // percentage
            slowTwitch: Number   // percentage
        }
    },

    // Performance Statistics (sport-specific)
    statistics: {
        current: {
            // Baseball/Softball specific
            batting: {
                avg: Number,
                obp: Number,
                slg: Number,
                ops: Number,
                woba: Number,
                wrc_plus: Number,
                barrel_rate: Number,
                exit_velocity: Number,
                launch_angle: Number,
                hard_hit_rate: Number
            },
            pitching: {
                era: Number,
                whip: Number,
                k9: Number,
                bb9: Number,
                fip: Number,
                xfip: Number,
                velocity_avg: Number,
                velocity_max: Number,
                spin_rate: Number,
                movement: Object
            },
            fielding: {
                fielding_pct: Number,
                drs: Number,
                uzr: Number,
                oaa: Number,
                arm_strength: Number
            },
            
            // Football specific
            passing: {
                yards: Number,
                touchdowns: Number,
                interceptions: Number,
                completion_pct: Number,
                qbr: Number,
                passer_rating: Number,
                air_yards: Number
            },
            rushing: {
                yards: Number,
                touchdowns: Number,
                ypc: Number,
                breakaway_rate: Number,
                yards_after_contact: Number
            },
            receiving: {
                receptions: Number,
                yards: Number,
                touchdowns: Number,
                ypr: Number,
                drop_rate: Number,
                separation: Number
            },
            defense: {
                tackles: Number,
                sacks: Number,
                interceptions: Number,
                pass_breakups: Number,
                qb_hits: Number,
                pressure_rate: Number
            },
            
            // Basketball specific
            scoring: {
                ppg: Number,
                fg_pct: Number,
                three_pct: Number,
                ft_pct: Number,
                efg_pct: Number,
                ts_pct: Number
            },
            rebounds: {
                total: Number,
                offensive: Number,
                defensive: Number,
                per_game: Number
            },
            playmaking: {
                assists: Number,
                turnovers: Number,
                ast_to_ratio: Number,
                usage_rate: Number
            },
            defense_bball: {
                steals: Number,
                blocks: Number,
                deflections: Number,
                defensive_rating: Number
            },
            advanced: {
                per: Number,
                ws: Number,
                bpm: Number,
                vorp: Number,
                pie: Number
            }
        },
        
        career: {
            games: Number,
            starts: Number,
            minutes: Number,
            war: Number,          // Wins Above Replacement (baseball)
            av: Number,           // Approximate Value (football)
            ws: Number,           // Win Shares (basketball)
            peak_season: Object,  // Best season stats
            consistency: Number   // Year-over-year consistency score
        },
        
        projections: {
            next_season: Object,  // Projected stats
            career_arc: String,   // Rising, Peak, Declining, Volatile
            ceiling: Object,      // Best case projection
            floor: Object        // Worst case projection
        }
    },

    // Athletic Testing & Combine Data
    athleticism: {
        speed: {
            forty_yard: Number,   // seconds
            sixty_yard: Number,   // seconds (baseball)
            shuttle: Number,      // seconds
            three_cone: Number    // seconds
        },
        power: {
            vertical_jump: Number, // inches
            broad_jump: Number,    // inches
            bench_press: Number,   // reps at 225
            squat_max: Number,     // pounds
            deadlift_max: Number   // pounds
        },
        agility: {
            lane_agility: Number,  // seconds
            shuttle_run: Number,   // seconds
            reaction_time: Number  // milliseconds
        },
        endurance: {
            vo2_max: Number,
            beep_test: Number,
            mile_time: Number
        }
    },

    // HAV-F Metrics (Human Athletic Valuation Framework)
    havf: {
        // Core HAV-F Scores
        championReadiness: {
            score: Number,        // 0-100
            components: {
                performanceDominance: Number,    // 50% weight
                physiologicalResilience: Number, // 40% weight
                careerTrajectory: Number         // 10% weight
            },
            percentile: Number,   // League percentile
            trend: String        // Improving, Stable, Declining
        },
        
        cognitiveLeverage: {
            score: Number,        // 0-100
            components: {
                neuralProcessingSpeed: Number,   // 60% weight
                pressureComposure: Number        // 40% weight
            },
            clutchRating: Number,
            decisionVelocity: Number,
            patternRecognition: Number
        },
        
        nilTrustScore: {
            score: Number,        // 0-100
            components: {
                brandAuthenticity: Number,       // 60% weight
                marketVelocity: Number,          // 25% weight
                publicSalience: Number           // 15% weight
            },
            valuation: Number,
            socialReach: Number,
            engagementRate: Number
        },
        
        // Composite Scores
        composite: {
            overall: Number,      // Weighted average of all three
            rank: Number,         // League rank
            tier: String,        // Elite, High, Average, Development
            confidence: Number   // Confidence in assessment (0-100)
        },
        
        // Contextual Adjustments
        adjustments: {
            ageAdjusted: Number,  // Score adjusted for age
            leagueAdjusted: Number, // Score adjusted for competition level
            injuryAdjusted: Number, // Score adjusted for injury history
            potentialBonus: Number  // Additional points for untapped potential
        },
        
        // Temporal Tracking
        history: [{
            date: Date,
            championReadiness: Number,
            cognitiveLeverage: Number,
            nilTrustScore: Number,
            composite: Number
        }],
        
        lastUpdated: Date,
        nextEvaluation: Date
    },

    // Injury & Health
    health: {
        status: String,          // Healthy, Injured, IL, Recovery
        injuryHistory: [{
            date: Date,
            type: String,
            severity: String,
            daysOut: Number,
            recovery: String
        }],
        durabilityScore: Number, // 0-100
        loadManagement: {
            recent: Number,      // Games in last 30 days
            season: Number,      // Games this season
            recommended: Number  // Recommended games
        }
    },

    // Development & Scouting
    development: {
        scoutingGrade: {
            overall: Number,     // 20-80 scale
            hit: Number,
            power: Number,
            speed: Number,
            arm: Number,
            field: Number
        },
        trajectory: String,      // Rising, Plateaued, Declining
        coachability: Number,    // 0-100
        workEthic: Number,       // 0-100
        improvements: [{
            area: String,
            startDate: Date,
            progress: Number
        }],
        comparisons: [String]    // Player comparisons
    },

    // Market & Financial
    market: {
        contractValue: Number,
        marketValue: Number,     // Estimated market value
        nilValue: Number,        // NIL valuation
        endorsements: [{
            brand: String,
            value: Number,
            duration: String
        }],
        transferValue: Number,   // For international/college
        roi: {
            current: Number,
            projected: Number,
            efficiency: Number
        }
    },

    // Analytics Metadata
    metadata: {
        dataQuality: Number,     // 0-100 confidence in data
        lastUpdated: Date,
        sources: [String],       // Data sources used
        version: String,         // Schema version
        flags: [String],        // Special flags or notes
        tags: [String]          // Searchable tags
    },

    // Pipeline Information (Youth/International)
    pipeline: {
        origin: String,          // Where discovered/signed
        pathway: String,         // Development pathway
        milestones: [{
            event: String,
            date: Date,
            achievement: String
        }],
        projectedTimeline: {
            nextLevel: String,
            timeframe: String,
            probability: Number
        },
        internationalStatus: {
            eligible: Boolean,
            posted: Boolean,
            visaStatus: String
        }
    },

    // Cognitive & Behavioral
    cognitive: {
        iq: {
            baseball: Number,    // Sport-specific IQ
            general: Number      // General intelligence
        },
        personality: {
            leadership: Number,
            teamwork: Number,
            competitiveness: Number,
            resilience: Number,
            discipline: Number
        },
        mentalHealth: {
            status: String,      // Good, Monitoring, Support
            support: Boolean,
            programs: [String]
        }
    },

    // Social & Digital Presence
    digital: {
        social: {
            twitter: String,
            instagram: String,
            tiktok: String,
            youtube: String,
            followers: Number,
            engagement: Number,
            sentiment: Number    // -100 to 100
        },
        gaming: {
            mlbTheShow: {
                rating: Number,
                attributes: Object
            },
            madden: {
                rating: Number,
                attributes: Object
            },
            nba2k: {
                rating: Number,
                attributes: Object
            }
        },
        media: {
            interviews: Number,
            highlights: Number,
            articles: Number,
            pressValue: Number
        }
    }
};

// Validation functions
const validatePlayer = (player) => {
    const required = ['identity.id', 'identity.name', 'affiliation.league.type'];
    for (const field of required) {
        if (!getNestedProperty(player, field)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    // Validate HAV-F scores
    if (player.havf) {
        const scores = ['championReadiness', 'cognitiveLeverage', 'nilTrustScore'];
        for (const score of scores) {
            if (player.havf[score] && (player.havf[score].score < 0 || player.havf[score].score > 100)) {
                throw new Error(`Invalid HAV-F ${score}: must be between 0 and 100`);
            }
        }
    }
    
    return true;
};

// Helper function to get nested properties
const getNestedProperty = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Calculate composite HAV-F score
const calculateCompositeHAVF = (player) => {
    if (!player.havf) return null;
    
    const weights = {
        championReadiness: 0.4,
        cognitiveLeverage: 0.35,
        nilTrustScore: 0.25
    };
    
    let composite = 0;
    let totalWeight = 0;
    
    for (const [metric, weight] of Object.entries(weights)) {
        if (player.havf[metric]?.score) {
            composite += player.havf[metric].score * weight;
            totalWeight += weight;
        }
    }
    
    return totalWeight > 0 ? composite / totalWeight : null;
};

// Export schema and utilities
export default {
    schema: UnifiedPlayerSchema,
    validate: validatePlayer,
    calculateComposite: calculateCompositeHAVF,
    version: '2.0.0'
};