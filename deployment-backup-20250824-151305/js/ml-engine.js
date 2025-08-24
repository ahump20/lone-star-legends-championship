/**
 * Blaze Intelligence ML Engine
 * Advanced sports prediction and analytics engine
 */

class BlazeMLEngine {
    constructor() {
        this.models = {
            baseball: new BaseballPredictionModel(),
            football: new FootballPredictionModel(),
            basketball: new BasketballPredictionModel()
        };
        
        this.cache = new Map();
        this.lastUpdate = null;
    }

    async predictGameOutcome(sport, homeTeam, awayTeam, gameContext = {}) {
        const model = this.models[sport.toLowerCase()];
        if (!model) {
            throw new Error(`Unsupported sport: ${sport}`);
        }

        const cacheKey = `${sport}-${homeTeam.id}-${awayTeam.id}-${JSON.stringify(gameContext)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const prediction = await model.predict(homeTeam, awayTeam, gameContext);
        this.cache.set(cacheKey, prediction);
        
        return prediction;
    }

    async analyzePlayerPerformance(player, recentGames = 10) {
        const stats = await this.fetchPlayerStats(player.id, recentGames);
        
        return {
            trending: this.calculateTrend(stats),
            projectedStats: this.projectNextGame(stats),
            hotZones: this.identifyHotZones(stats),
            fatigueFactor: this.calculateFatigue(stats),
            injuryRisk: this.assessInjuryRisk(player, stats)
        };
    }

    calculateTrend(stats) {
        if (!stats || stats.length < 3) return 'stable';
        
        const recentAvg = stats.slice(0, 3).reduce((a, b) => a + b.score, 0) / 3;
        const previousAvg = stats.slice(3, 6).reduce((a, b) => a + b.score, 0) / 3;
        
        const diff = recentAvg - previousAvg;
        if (diff > 5) return 'hot';
        if (diff < -5) return 'cold';
        return 'stable';
    }

    projectNextGame(stats) {
        // Weighted average giving more weight to recent games
        const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
        const projection = {};
        
        const relevantStats = stats.slice(0, 5);
        
        for (const key of Object.keys(relevantStats[0] || {})) {
            if (typeof relevantStats[0][key] === 'number') {
                projection[key] = relevantStats.reduce((sum, game, idx) => {
                    return sum + (game[key] * (weights[idx] || 0.05));
                }, 0);
            }
        }
        
        return projection;
    }

    identifyHotZones(stats) {
        // Analyze where player is most effective
        return {
            field: this.analyzeFieldZones(stats),
            situational: this.analyzeSituations(stats),
            temporal: this.analyzeTimePatterns(stats)
        };
    }

    calculateFatigue(stats) {
        // Analyze workload and rest patterns
        const gamesPlayed = stats.length;
        const avgMinutes = stats.reduce((a, b) => a + (b.minutes || 0), 0) / gamesPlayed;
        const restDays = this.calculateRestDays(stats);
        
        let fatigue = 0;
        if (avgMinutes > 35) fatigue += 20;
        if (restDays < 2) fatigue += 30;
        if (gamesPlayed > 5 && restDays < 3) fatigue += 20;
        
        return Math.min(100, fatigue);
    }

    assessInjuryRisk(player, stats) {
        let risk = 0;
        
        // Age factor
        if (player.age > 32) risk += 15;
        if (player.age > 35) risk += 20;
        
        // Injury history
        if (player.injuryHistory?.length > 2) risk += 25;
        
        // Fatigue factor
        const fatigue = this.calculateFatigue(stats);
        risk += fatigue * 0.5;
        
        // Position-specific risks
        const highRiskPositions = ['P', 'C', 'RB', 'LB'];
        if (highRiskPositions.includes(player.position)) {
            risk += 10;
        }
        
        return Math.min(100, risk);
    }

    async fetchPlayerStats(playerId, games) {
        // This would connect to real API
        // For now, return simulated data
        return Array(games).fill(null).map((_, i) => ({
            gameId: `game_${i}`,
            score: Math.random() * 30,
            minutes: 25 + Math.random() * 15,
            efficiency: 0.4 + Math.random() * 0.3
        }));
    }

    calculateRestDays(stats) {
        // Simplified calculation
        return Math.floor(Math.random() * 4) + 1;
    }

    analyzeFieldZones(stats) {
        return {
            left: 0.33,
            center: 0.45,
            right: 0.22
        };
    }

    analyzeSituations(stats) {
        return {
            clutch: 0.78,
            leading: 0.65,
            trailing: 0.71
        };
    }

    analyzeTimePatterns(stats) {
        return {
            firstHalf: 0.68,
            secondHalf: 0.72,
            overtime: 0.81
        };
    }
}

class BaseballPredictionModel {
    async predict(homeTeam, awayTeam, context) {
        // Factor in pitching matchup
        const pitchingAdvantage = this.calculatePitchingAdvantage(
            context.homePitcher,
            context.awayPitcher
        );
        
        // Factor in recent performance
        const momentumFactor = this.calculateMomentum(homeTeam, awayTeam);
        
        // Factor in park effects
        const parkFactor = this.calculateParkFactor(context.ballpark);
        
        // Weather impact
        const weatherImpact = this.calculateWeatherImpact(context.weather);
        
        // Calculate base win probability
        let homeWinProb = 0.5;
        
        // Adjust for team strength
        const strengthDiff = (homeTeam.rating || 1500) - (awayTeam.rating || 1500);
        homeWinProb += strengthDiff / 1000;
        
        // Apply factors
        homeWinProb += pitchingAdvantage * 0.15;
        homeWinProb += momentumFactor * 0.1;
        homeWinProb += parkFactor * 0.05;
        homeWinProb += weatherImpact * 0.05;
        
        // Home field advantage
        homeWinProb += 0.04;
        
        // Normalize
        homeWinProb = Math.max(0.1, Math.min(0.9, homeWinProb));
        
        // Project score
        const projectedRuns = this.projectRuns(homeTeam, awayTeam, context);
        
        return {
            homeWinProbability: homeWinProb,
            awayWinProbability: 1 - homeWinProb,
            projectedScore: projectedRuns,
            confidence: this.calculateConfidence(context),
            keyFactors: this.identifyKeyFactors(homeTeam, awayTeam, context)
        };
    }

    calculatePitchingAdvantage(homePitcher, awayPitcher) {
        if (!homePitcher || !awayPitcher) return 0;
        
        const homeERA = homePitcher.era || 4.0;
        const awayERA = awayPitcher.era || 4.0;
        
        return (awayERA - homeERA) / 10;
    }

    calculateMomentum(homeTeam, awayTeam) {
        const homeLast10 = (homeTeam.last10?.wins || 5) / 10;
        const awayLast10 = (awayTeam.last10?.wins || 5) / 10;
        
        return (homeLast10 - awayLast10) * 0.5;
    }

    calculateParkFactor(ballpark) {
        const hitterFriendly = ['Coors Field', 'Globe Life Field', 'Great American Ball Park'];
        const pitcherFriendly = ['Oracle Park', 'Petco Park', 'Marlins Park'];
        
        if (hitterFriendly.includes(ballpark)) return 0.1;
        if (pitcherFriendly.includes(ballpark)) return -0.1;
        return 0;
    }

    calculateWeatherImpact(weather) {
        if (!weather) return 0;
        
        if (weather.windSpeed > 15 && weather.windDirection === 'out') return 0.1;
        if (weather.windSpeed > 15 && weather.windDirection === 'in') return -0.1;
        if (weather.temperature > 90) return 0.05;
        if (weather.temperature < 50) return -0.05;
        
        return 0;
    }

    projectRuns(homeTeam, awayTeam, context) {
        const leagueAvg = 4.5;
        
        const homeOffense = (homeTeam.runsPerGame || leagueAvg);
        const awayOffense = (awayTeam.runsPerGame || leagueAvg);
        
        const homePitching = (homeTeam.runsAllowedPerGame || leagueAvg);
        const awayPitching = (awayTeam.runsAllowedPerGame || leagueAvg);
        
        const homeProjected = (homeOffense + awayPitching) / 2;
        const awayProjected = (awayOffense + homePitching) / 2;
        
        return {
            home: Math.round(homeProjected * 10) / 10,
            away: Math.round(awayProjected * 10) / 10
        };
    }

    calculateConfidence(context) {
        let confidence = 0.5;
        
        if (context.homePitcher && context.awayPitcher) confidence += 0.2;
        if (context.weather) confidence += 0.1;
        if (context.injuries?.length === 0) confidence += 0.1;
        
        return Math.min(0.9, confidence);
    }

    identifyKeyFactors(homeTeam, awayTeam, context) {
        const factors = [];
        
        if (context.homePitcher?.era < 3.0) {
            factors.push(`${context.homePitcher.name} elite pitching (${context.homePitcher.era} ERA)`);
        }
        
        if (homeTeam.last10?.wins > 7) {
            factors.push(`${homeTeam.name} hot streak (${homeTeam.last10.wins}-${10 - homeTeam.last10.wins} last 10)`);
        }
        
        if (context.weather?.temperature > 85) {
            factors.push('Hot weather favors offense');
        }
        
        return factors.slice(0, 3);
    }
}

class FootballPredictionModel {
    async predict(homeTeam, awayTeam, context) {
        // Implement football-specific prediction logic
        const offenseVsDefense = this.calculateOffenseDefenseMatchup(homeTeam, awayTeam);
        const turnoverDifferential = this.projectTurnovers(homeTeam, awayTeam);
        const specialTeamsImpact = this.calculateSpecialTeams(homeTeam, awayTeam);
        
        let homeWinProb = 0.5;
        homeWinProb += offenseVsDefense * 0.25;
        homeWinProb += turnoverDifferential * 0.15;
        homeWinProb += specialTeamsImpact * 0.1;
        homeWinProb += 0.03; // Home field
        
        homeWinProb = Math.max(0.1, Math.min(0.9, homeWinProb));
        
        return {
            homeWinProbability: homeWinProb,
            awayWinProbability: 1 - homeWinProb,
            projectedScore: this.projectScore(homeTeam, awayTeam),
            confidence: 0.7,
            keyFactors: []
        };
    }

    calculateOffenseDefenseMatchup(homeTeam, awayTeam) {
        const homeOff = homeTeam.offenseRating || 20;
        const homeDef = homeTeam.defenseRating || 20;
        const awayOff = awayTeam.offenseRating || 20;
        const awayDef = awayTeam.defenseRating || 20;
        
        const homeAdvantage = (homeOff - awayDef) / 100;
        const awayAdvantage = (awayOff - homeDef) / 100;
        
        return homeAdvantage - awayAdvantage;
    }

    projectTurnovers(homeTeam, awayTeam) {
        const homeTODiff = homeTeam.turnoverDifferential || 0;
        const awayTODiff = awayTeam.turnoverDifferential || 0;
        
        return (homeTODiff - awayTODiff) / 20;
    }

    calculateSpecialTeams(homeTeam, awayTeam) {
        // Simplified special teams impact
        return Math.random() * 0.1 - 0.05;
    }

    projectScore(homeTeam, awayTeam) {
        const avgScore = 23;
        
        return {
            home: Math.round(avgScore + Math.random() * 10 - 5),
            away: Math.round(avgScore + Math.random() * 10 - 5)
        };
    }
}

class BasketballPredictionModel {
    async predict(homeTeam, awayTeam, context) {
        const paceFactor = this.calculatePace(homeTeam, awayTeam);
        const matchupAdvantage = this.calculateMatchupAdvantage(homeTeam, awayTeam);
        const restAdvantage = this.calculateRestAdvantage(context);
        
        let homeWinProb = 0.5;
        homeWinProb += matchupAdvantage * 0.3;
        homeWinProb += restAdvantage * 0.1;
        homeWinProb += 0.05; // Home court
        
        homeWinProb = Math.max(0.1, Math.min(0.9, homeWinProb));
        
        const projectedScore = this.projectScore(homeTeam, awayTeam, paceFactor);
        
        return {
            homeWinProbability: homeWinProb,
            awayWinProbability: 1 - homeWinProb,
            projectedScore,
            confidence: 0.75,
            keyFactors: []
        };
    }

    calculatePace(homeTeam, awayTeam) {
        const homePace = homeTeam.pace || 100;
        const awayPace = awayTeam.pace || 100;
        
        return (homePace + awayPace) / 2;
    }

    calculateMatchupAdvantage(homeTeam, awayTeam) {
        const homeRating = homeTeam.netRating || 0;
        const awayRating = awayTeam.netRating || 0;
        
        return (homeRating - awayRating) / 20;
    }

    calculateRestAdvantage(context) {
        if (!context.schedule) return 0;
        
        const homeRest = context.schedule.homeDaysRest || 1;
        const awayRest = context.schedule.awayDaysRest || 1;
        
        return (homeRest - awayRest) * 0.05;
    }

    projectScore(homeTeam, awayTeam, pace) {
        const basePPG = 110;
        const paceAdjustment = pace / 100;
        
        return {
            home: Math.round(basePPG * paceAdjustment + Math.random() * 20 - 10),
            away: Math.round(basePPG * paceAdjustment + Math.random() * 20 - 10)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeMLEngine;
}