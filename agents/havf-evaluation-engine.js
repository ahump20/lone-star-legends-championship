#!/usr/bin/env node

/**
 * HAV-F Evaluation Engine v3.0
 * Human Athletic Valuation Framework Implementation
 * 
 * Computes three core metrics:
 * - Champion Readiness (Performance + Resilience + Trajectory)
 * - Cognitive Leverage (Neural Processing + Composure)
 * - NIL Trust Score (Authenticity + Velocity + Salience)
 */

class HAVFEvaluationEngine {
    constructor() {
        this.version = '3.0.0';
        this.metrics = {
            championReadiness: {
                weights: {
                    performance: 0.5,
                    physiology: 0.4,
                    trajectory: 0.1
                }
            },
            cognitiveLeverage: {
                weights: {
                    neuralProcessing: 0.6,
                    composure: 0.4
                }
            },
            nilTrustScore: {
                weights: {
                    authenticity: 0.6,
                    velocity: 0.25,
                    salience: 0.15
                }
            }
        };
        
        console.log('⚡ HAV-F Evaluation Engine initialized');
    }
    
    /**
     * Calculate Champion Readiness Score
     * Elite performance potential (0-100)
     */
    calculateChampionReadiness(player) {
        try {
            // Performance Dominance (50% weight)
            const performanceScore = this.calculatePerformanceDominance(player);
            
            // Physiological Resilience (40% weight)
            const physiologyScore = this.calculatePhysiologicalResilience(player);
            
            // Career Trajectory (10% weight)
            const trajectoryScore = this.calculateCareerTrajectory(player);
            
            // Weighted calculation
            const score = 
                (performanceScore * this.metrics.championReadiness.weights.performance) +
                (physiologyScore * this.metrics.championReadiness.weights.physiology) +
                (trajectoryScore * this.metrics.championReadiness.weights.trajectory);
            
            return this.clampScore(score);
            
        } catch (error) {
            console.error('Error calculating Champion Readiness:', error);
            return null;
        }
    }
    
    /**
     * Calculate Performance Dominance
     * Sport-specific metrics normalized to 0-100
     */
    calculatePerformanceDominance(player) {
        const stats = player['2024_stats'] || {};
        const league = this.identifyLeague(player);
        
        switch(league) {
            case 'MLB':
                return this.calculateMLBPerformance(stats);
            case 'NFL':
                return this.calculateNFLPerformance(stats);
            case 'NCAA':
                return this.calculateNCAAPerformance(stats);
            case 'NBA':
                return this.calculateNBAPerformance(stats);
            default:
                return this.calculateGenericPerformance(stats);
        }
    }
    
    calculateMLBPerformance(stats) {
        // WAR + WPA composite for MLB
        const war = stats.war_est || 0;
        const wpa = stats.wpa || 0;
        const avg = stats.avg || 0;
        const hr = stats.hr || 0;
        
        // Normalize WAR (0-10 scale typically)
        const warScore = Math.min(100, (war / 10) * 100);
        
        // Normalize WPA (-5 to +5 typical range)
        const wpaScore = Math.min(100, Math.max(0, ((wpa + 5) / 10) * 100));
        
        // Batting metrics bonus
        const battingBonus = (avg * 100) + (hr * 2);
        
        return Math.min(100, (warScore * 0.5) + (wpaScore * 0.3) + (battingBonus * 0.2));
    }
    
    calculateNFLPerformance(stats) {
        // EPA-based for NFL
        const epa = stats.epa || 0;
        const yards = stats.rec_yards || stats.rush_yards || stats.pass_yards || 0;
        const td = stats.td || 0;
        
        // Normalize EPA (typically -50 to +150 for season)
        const epaScore = Math.min(100, Math.max(0, ((epa + 50) / 200) * 100));
        
        // Production score
        const productionScore = Math.min(100, (yards / 20) + (td * 5));
        
        return (epaScore * 0.6) + (productionScore * 0.4);
    }
    
    calculateNCAAPerformance(stats) {
        // College football/basketball metrics
        const passYards = stats.pass_yards || 0;
        const passTD = stats.pass_TD || 0;
        const rushYards = stats.rush_yards || 0;
        const rushTD = stats.rush_TD || 0;
        
        // QB rating approximation
        const qbScore = Math.min(100, ((passYards / 40) + (passTD * 3) + (rushYards / 10) + (rushTD * 5)));
        
        return qbScore;
    }
    
    calculateNBAPerformance(stats) {
        // PER or basic stats for NBA
        const ppg = stats.ppg || 0;
        const rpg = stats.rpg || 0;
        const apg = stats.apg || 0;
        const efficiency = stats.per || 15; // 15 is league average PER
        
        // Normalize PER (0-35 scale)
        const perScore = Math.min(100, (efficiency / 35) * 100);
        
        // Production score
        const productionScore = Math.min(100, ppg + (rpg * 0.5) + (apg * 0.8));
        
        return (perScore * 0.6) + (productionScore * 0.4);
    }
    
    calculateGenericPerformance(stats) {
        // Fallback for other sports
        const values = Object.values(stats).filter(v => typeof v === 'number');
        if (values.length === 0) return 50;
        
        // Use average of normalized values
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return Math.min(100, avg);
    }
    
    /**
     * Calculate Physiological Resilience
     * Based on biometric data if available
     */
    calculatePhysiologicalResilience(player) {
        const biometrics = player.biometrics || {};
        
        // Default to average if no data
        if (Object.keys(biometrics).length === 0) {
            return 50; // Neutral score
        }
        
        let score = 50; // Base score
        
        // HRV (Heart Rate Variability) - Higher is better
        if (biometrics.hrv_rmssd_ms) {
            const hrvScore = Math.min(100, (biometrics.hrv_rmssd_ms / 100) * 100);
            score += (hrvScore - 50) * 0.3;
        }
        
        // Resting Heart Rate - Lower is better (40-80 typical)
        if (biometrics.resting_hr_bpm) {
            const hrScore = Math.max(0, 100 - ((biometrics.resting_hr_bpm - 40) * 2));
            score += (hrScore - 50) * 0.2;
        }
        
        // Sleep quality (7-9 hours optimal)
        if (biometrics.sleep_hrs_avg) {
            const sleepScore = biometrics.sleep_hrs_avg >= 7 && biometrics.sleep_hrs_avg <= 9 ? 
                100 : Math.max(0, 100 - Math.abs(8 - biometrics.sleep_hrs_avg) * 20);
            score += (sleepScore - 50) * 0.2;
        }
        
        // GSR (Galvanic Skin Response) - Lower is better
        if (biometrics.gsr_microsiemens) {
            const gsrScore = Math.max(0, 100 - (biometrics.gsr_microsiemens * 20));
            score += (gsrScore - 50) * 0.3;
        }
        
        return this.clampScore(score);
    }
    
    /**
     * Calculate Career Trajectory
     * Age and experience factors
     */
    calculateCareerTrajectory(player) {
        const age = player.age || 25;
        const yearsPro = player.years_pro || 0;
        const position = player.position || '';
        
        // Sport-specific peak ages
        const peakAges = {
            'QB': 28, 'RB': 26, 'WR': 27, 'TE': 28,
            'P': 27, 'C': 26, 'OF': 27, '1B': 28,
            'G': 27, 'F': 27, 'C': 26
        };
        
        const peakAge = peakAges[position] || 27;
        
        // Distance from peak (negative = approaching, positive = past)
        const distanceFromPeak = age - peakAge;
        
        let score = 50;
        
        // Approaching peak = bonus
        if (distanceFromPeak < 0) {
            score += Math.min(30, Math.abs(distanceFromPeak) * 5);
        } else {
            // Past peak = penalty
            score -= Math.min(30, distanceFromPeak * 5);
        }
        
        // Experience bonus (max 20 points)
        score += Math.min(20, yearsPro * 2);
        
        return this.clampScore(score);
    }
    
    /**
     * Calculate Cognitive Leverage Score
     * Mental processing and composure (0-100)
     */
    calculateCognitiveLeverage(player) {
        const biometrics = player.biometrics || {};
        
        // Return null if no cognitive data available
        if (!biometrics.reaction_ms && !biometrics.hrv_rmssd_ms) {
            return null;
        }
        
        try {
            // Neural Processing Speed (60% weight)
            const neuralScore = this.calculateNeuralProcessing(biometrics);
            
            // Composure/Stress Regulation (40% weight)
            const composureScore = this.calculateComposure(biometrics);
            
            const score = 
                (neuralScore * this.metrics.cognitiveLeverage.weights.neuralProcessing) +
                (composureScore * this.metrics.cognitiveLeverage.weights.composure);
            
            return this.clampScore(score);
            
        } catch (error) {
            console.error('Error calculating Cognitive Leverage:', error);
            return null;
        }
    }
    
    calculateNeuralProcessing(biometrics) {
        const reactionMs = biometrics.reaction_ms || 250;
        
        // Excellent: 150-200ms, Good: 200-250ms, Average: 250-300ms
        // Linear scale: 150ms = 100, 300ms = 0
        const score = Math.max(0, Math.min(100, ((300 - reactionMs) / 150) * 100));
        
        return score;
    }
    
    calculateComposure(biometrics) {
        let score = 50;
        
        // HRV component (higher = better composure)
        if (biometrics.hrv_rmssd_ms) {
            const hrvScore = Math.min(100, (biometrics.hrv_rmssd_ms / 100) * 100);
            score += (hrvScore - 50) * 0.6;
        }
        
        // GSR component (lower = better composure)
        if (biometrics.gsr_microsiemens) {
            const gsrScore = Math.max(0, 100 - (biometrics.gsr_microsiemens * 20));
            score += (gsrScore - 50) * 0.4;
        }
        
        return this.clampScore(score);
    }
    
    /**
     * Calculate NIL Trust Score
     * Brand quality and marketability (0-100)
     */
    calculateNILTrustScore(player) {
        const nilProfile = player.NIL_profile || {};
        
        // No NIL data = no score
        if (Object.keys(nilProfile).length === 0) {
            return null;
        }
        
        try {
            // Audience Authenticity (60% weight)
            const authenticityScore = this.calculateAudienceAuthenticity(nilProfile);
            
            // Market Velocity (25% weight)
            const velocityScore = this.calculateMarketVelocity(nilProfile);
            
            // Public Salience (15% weight)
            const salienceScore = this.calculatePublicSalience(nilProfile);
            
            const score = 
                (authenticityScore * this.metrics.nilTrustScore.weights.authenticity) +
                (velocityScore * this.metrics.nilTrustScore.weights.velocity) +
                (salienceScore * this.metrics.nilTrustScore.weights.salience);
            
            return this.clampScore(score);
            
        } catch (error) {
            console.error('Error calculating NIL Trust Score:', error);
            return null;
        }
    }
    
    calculateAudienceAuthenticity(nilProfile) {
        const engRate = nilProfile.eng_rate || 0;
        
        // 5% engagement = perfect score
        // Linear scale: 0% = 0, 5%+ = 100
        const score = Math.min(100, (engRate / 0.05) * 100);
        
        return score;
    }
    
    calculateMarketVelocity(nilProfile) {
        const dealsLast90d = nilProfile.deals_last_90d || 0;
        const dealValue90d = nilProfile.deal_value_90d_usd || 0;
        
        // Each deal worth 10 points, each $100k worth 10 points
        const dealScore = Math.min(50, dealsLast90d * 10);
        const valueScore = Math.min(50, (dealValue90d / 100000) * 10);
        
        return dealScore + valueScore;
    }
    
    calculatePublicSalience(nilProfile) {
        const searchIndex = nilProfile.search_index || 0;
        const localPopularity = nilProfile.local_popularity_index || 0;
        
        // Average of two indices (assumed 0-100 scale)
        return (searchIndex + localPopularity) / 2;
    }
    
    /**
     * Identify league from player affiliation
     */
    identifyLeague(player) {
        const affiliation = player.affiliation || '';
        
        if (affiliation.includes('MLB')) return 'MLB';
        if (affiliation.includes('NFL')) return 'NFL';
        if (affiliation.includes('NCAA')) return 'NCAA';
        if (affiliation.includes('NBA')) return 'NBA';
        if (affiliation.includes('High School')) return 'HS';
        if (affiliation.includes('KBO') || affiliation.includes('NPB')) return 'International';
        
        return 'Unknown';
    }
    
    /**
     * Clamp score to 0-100 range
     */
    clampScore(score) {
        return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
    }
    
    /**
     * Process full player profile with all HAV-F metrics
     */
    evaluatePlayer(player) {
        const evaluation = {
            name: player.name,
            affiliation: player.affiliation,
            champion_readiness: this.calculateChampionReadiness(player),
            cognitive_leverage: this.calculateCognitiveLeverage(player),
            nil_trust_score: this.calculateNILTrustScore(player),
            timestamp: new Date().toISOString()
        };
        
        // Add sub-scores for transparency
        evaluation.components = {
            performance: this.calculatePerformanceDominance(player),
            physiology: this.calculatePhysiologicalResilience(player),
            trajectory: this.calculateCareerTrajectory(player)
        };
        
        return evaluation;
    }
    
    /**
     * Batch evaluate multiple players
     */
    evaluateTeam(players) {
        const evaluations = players.map(player => this.evaluatePlayer(player));
        
        // Calculate team averages
        const avgChampionReadiness = this.average(evaluations.map(e => e.champion_readiness));
        const avgCognitiveLeverage = this.average(evaluations.filter(e => e.cognitive_leverage).map(e => e.cognitive_leverage));
        const avgNILTrust = this.average(evaluations.filter(e => e.nil_trust_score).map(e => e.nil_trust_score));
        
        return {
            players: evaluations,
            teamMetrics: {
                avg_champion_readiness: avgChampionReadiness,
                avg_cognitive_leverage: avgCognitiveLeverage,
                avg_nil_trust: avgNILTrust,
                elite_players: evaluations.filter(e => e.champion_readiness > 90).length,
                total_evaluated: evaluations.length
            }
        };
    }
    
    average(numbers) {
        if (numbers.length === 0) return null;
        return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) / 10;
    }
    
    /**
     * Validate HAV-F calculation with known examples
     */
    validateWithKnownExamples() {
        console.log('🧪 Validating HAV-F calculations...');
        
        // Player Longhorn example from whitepaper
        const playerLonghorn = {
            name: 'Player Longhorn',
            position: 'QB',
            age: 21,
            years_pro: 0,
            affiliation: 'University of Texas (NCAA)',
            '2024_stats': {
                pass_yards: 3500,
                pass_TD: 30,
                rush_yards: 600,
                rush_TD: 8
            },
            biometrics: {
                hrv_rmssd_ms: 92,
                resting_hr_bpm: 52,
                sleep_hrs_avg: 8.2,
                reaction_ms: 195,
                gsr_microsiemens: 2.1
            },
            NIL_profile: {
                eng_rate: 0.041,
                deals_last_90d: 4,
                deal_value_90d_usd: 50000,
                search_index: 75,
                local_popularity_index: 85
            }
        };
        
        const evaluation = this.evaluatePlayer(playerLonghorn);
        
        console.log('Expected: Champion Readiness ~94.2, NIL Trust ~95.1');
        console.log(`Actual: Champion Readiness ${evaluation.champion_readiness}, NIL Trust ${evaluation.nil_trust_score}`);
        
        // Player Redbird example
        const playerRedbird = {
            name: 'Player Redbird',
            position: 'OF',
            age: 27,
            years_pro: 4,
            affiliation: 'St. Louis Cardinals (MLB)',
            '2024_stats': {
                war_est: 0.3,
                wpa: 0.18,
                avg: 0.245,
                hr: 8
            },
            biometrics: {
                hrv_rmssd_ms: 84,
                sleep_hrs_avg: 7.8
            },
            NIL_profile: {
                eng_rate: 0.032,
                deals_last_90d: 2,
                deal_value_90d_usd: 45000
            }
        };
        
        const evaluation2 = this.evaluatePlayer(playerRedbird);
        
        console.log('Expected: Champion Readiness ~89.8, NIL Trust ~70.2');
        console.log(`Actual: Champion Readiness ${evaluation2.champion_readiness}, NIL Trust ${evaluation2.nil_trust_score}`);
        
        return {
            longhorn: evaluation,
            redbird: evaluation2
        };
    }
}

// Export for use in agents
export default HAVFEvaluationEngine;

if (typeof window !== 'undefined') {
    window.HAVFEvaluationEngine = HAVFEvaluationEngine;
}

// Test if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const engine = new HAVFEvaluationEngine();
    const results = engine.validateWithKnownExamples();
    
    console.log('\n📊 HAV-F Engine Test Complete');
    console.log('Results:', JSON.stringify(results, null, 2));
}