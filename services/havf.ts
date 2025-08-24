/**
 * Blaze Intelligence - HAV-F Service
 * HAV-F (Human Athletic Valuation Framework) calculations
 */

import { HavfMetrics } from '../packages/schema/types.js';

interface HAVFOptions {
  history?: boolean;
  window?: string;
}

interface HAVFResponse {
  havf: HavfMetrics;
  history?: Array<{
    timestamp: Date;
    havf: HavfMetrics;
  }>;
}

class HAVFService {
  async getPlayerHavf(playerId: string, options: HAVFOptions = {}): Promise<HAVFResponse> {
    // In production, this would fetch from database
    const player = await this.getPlayerData(playerId);
    const havf = await this.calculateHAVF(player);
    
    const response: HAVFResponse = { havf };
    
    if (options.history) {
      response.history = await this.getHAVFHistory(playerId, options.window || 'month');
    }
    
    return response;
  }

  private async getPlayerData(playerId: string) {
    // Mock player data - in production, query database
    const mockPlayers = {
      'goldschmidt_p': {
        id: 'goldschmidt_p',
        name: 'Paul Goldschmidt',
        league: 'MLB',
        team: 'STL',
        position: '1B',
        stats: {
          avg: 0.289,
          hr: 35,
          rbi: 115,
          ops: 0.981
        },
        age: 34,
        experience: 12
      },
      'morant_j': {
        id: 'morant_j', 
        name: 'Ja Morant',
        league: 'NBA',
        team: 'MEM',
        position: 'PG',
        stats: {
          ppg: 27.4,
          apg: 8.1,
          rpg: 6.0,
          fg_pct: 0.469
        },
        age: 24,
        experience: 4
      }
    };

    return mockPlayers[playerId as keyof typeof mockPlayers] || {
      id: playerId,
      name: 'Unknown Player',
      league: 'UNKNOWN',
      team: 'UNK',
      position: 'UTIL',
      stats: {},
      age: 25,
      experience: 3
    };
  }

  private async calculateHAVF(player: any): Promise<HavfMetrics> {
    // Calculate Champion Readiness (40% weight)
    const championReadiness = {
      score: this.calculateChampionReadiness(player),
      components: {
        performanceDominance: this.calculatePerformanceDominance(player),
        physiologicalResilience: this.calculatePhysiologicalResilience(player), 
        careerTrajectory: this.calculateCareerTrajectory(player)
      },
      percentile: Math.floor(Math.random() * 100),
      trend: this.getTrend(player) as 'Improving' | 'Stable' | 'Declining'
    };

    // Calculate Cognitive Leverage (35% weight)
    const cognitiveLeverage = {
      score: this.calculateCognitiveLeverage(player),
      components: {
        neuralProcessingSpeed: Math.floor(Math.random() * 40) + 60, // 60-100
        pressureComposure: Math.floor(Math.random() * 40) + 60
      },
      clutchRating: Math.floor(Math.random() * 30) + 70,
      decisionVelocity: Math.floor(Math.random() * 35) + 65,
      patternRecognition: Math.floor(Math.random() * 40) + 60
    };

    // Calculate NIL Trust Score (25% weight) 
    const nilTrustScore = {
      score: this.calculateNILTrustScore(player),
      components: {
        brandAuthenticity: Math.floor(Math.random() * 30) + 70,
        marketVelocity: (Math.random() - 0.5) * 1000, // Can be negative
        publicSalience: Math.floor(Math.random() * 40) + 60
      },
      valuation: Math.floor(Math.random() * 2000000) + 500000, // $500K-$2.5M
      socialReach: Math.floor(Math.random() * 1000000) + 100000, // 100K-1.1M
      engagementRate: Math.random() * 0.1 + 0.02 // 2-12%
    };

    // Calculate composite score
    const composite = {
      overall: this.calculateComposite(championReadiness, cognitiveLeverage, nilTrustScore),
      rank: Math.floor(Math.random() * 500) + 1,
      tier: this.getTier(championReadiness.score, cognitiveLeverage.score, nilTrustScore.score) as 'Elite' | 'High' | 'Average' | 'Development',
      confidence: Math.floor(Math.random() * 20) + 80 // 80-100
    };

    return {
      championReadiness,
      cognitiveLeverage,
      nilTrustScore,
      composite,
      lastUpdated: new Date(),
      nextEvaluation: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      version: '2.0.0'
    };
  }

  private calculateChampionReadiness(player: any): number {
    const perfScore = this.calculatePerformanceDominance(player);
    const physioScore = this.calculatePhysiologicalResilience(player);
    const trajectoryScore = this.calculateCareerTrajectory(player);
    
    return Math.round(
      (perfScore * 0.5) + 
      (physioScore * 0.4) + 
      (trajectoryScore * 0.1)
    );
  }

  private calculatePerformanceDominance(player: any): number {
    // League-specific performance calculations
    let baseScore = 70; // Default
    
    if (player.league === 'MLB') {
      const ops = player.stats.ops || 0.750;
      baseScore = Math.min(100, (ops / 1.200) * 100); // Elite OPS = 1.200
    } else if (player.league === 'NBA') {
      const ppg = player.stats.ppg || 15;
      baseScore = Math.min(100, (ppg / 35) * 100); // Elite PPG = 35
    } else if (player.league === 'NFL') {
      // Position-specific calculations would go here
      baseScore = Math.floor(Math.random() * 30) + 70;
    }
    
    return Math.round(baseScore);
  }

  private calculatePhysiologicalResilience(player: any): number {
    // Age curve adjustments
    const ageScore = this.getAgeScore(player.age, player.league);
    const experienceBonus = Math.min(20, player.experience * 2);
    const injuryPenalty = Math.floor(Math.random() * 10); // Mock injury history
    
    return Math.max(0, Math.min(100, ageScore + experienceBonus - injuryPenalty));
  }

  private calculateCareerTrajectory(player: any): number {
    const experience = player.experience || 1;
    const age = player.age || 25;
    
    // Peak years by position/league
    const peakAge = this.getPeakAge(player.league, player.position);
    const yearsFromPeak = Math.abs(age - peakAge);
    
    // Trajectory score (higher is better)
    let trajectory = 100 - (yearsFromPeak * 5); // Decline 5 points per year from peak
    trajectory = Math.max(30, Math.min(100, trajectory)); // Floor of 30, ceiling of 100
    
    return Math.round(trajectory);
  }

  private calculateCognitiveLeverage(player: any): number {
    const neuralSpeed = Math.floor(Math.random() * 40) + 60;
    const composure = Math.floor(Math.random() * 40) + 60;
    
    return Math.round((neuralSpeed * 0.6) + (composure * 0.4));
  }

  private calculateNILTrustScore(player: any): number {
    // Mock NIL calculation
    const authenticity = Math.floor(Math.random() * 30) + 70;
    const velocity = Math.floor(Math.random() * 40) + 30;
    const salience = Math.floor(Math.random() * 40) + 60;
    
    return Math.round(
      (authenticity * 0.6) + 
      (velocity * 0.25) + 
      (salience * 0.15)
    );
  }

  private calculateComposite(champion: any, cognitive: any, nil: any): number {
    return Math.round(
      (champion.score * 0.4) +
      (cognitive.score * 0.35) + 
      (nil.score * 0.25)
    );
  }

  private getAgeScore(age: number, league: string): number {
    // Age curves by league
    const curves = {
      'MLB': { peak: 28, decline: 2 },
      'NBA': { peak: 27, decline: 3 },
      'NFL': { peak: 26, decline: 4 },
      'NCAA': { peak: 20, decline: 1 }
    };
    
    const curve = curves[league as keyof typeof curves] || curves.MLB;
    const yearsFromPeak = Math.abs(age - curve.peak);
    
    return Math.max(40, 100 - (yearsFromPeak * curve.decline));
  }

  private getPeakAge(league: string, position: string): number {
    const peakAges = {
      'MLB': { 'P': 28, 'C': 29, default: 28 },
      'NBA': { 'PG': 27, 'C': 29, default: 27 },
      'NFL': { 'QB': 30, 'RB': 25, default: 27 }
    };
    
    const leaguePeaks = peakAges[league as keyof typeof peakAges];
    if (!leaguePeaks) return 27;
    
    return leaguePeaks[position as keyof typeof leaguePeaks] || leaguePeaks.default;
  }

  private getTrend(player: any): string {
    const trends = ['Improving', 'Stable', 'Declining'];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private getTier(champion: number, cognitive: number, nil: number): string {
    const composite = (champion * 0.4) + (cognitive * 0.35) + (nil * 0.25);
    
    if (composite >= 90) return 'Elite';
    if (composite >= 75) return 'High';
    if (composite >= 50) return 'Average';
    return 'Development';
  }

  private async getHAVFHistory(playerId: string, window: string) {
    // Mock historical data
    const history = [];
    const days = window === 'week' ? 7 : window === 'month' ? 30 : 90;
    
    for (let i = days; i > 0; i--) {
      const timestamp = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const player = await this.getPlayerData(playerId);
      const havf = await this.calculateHAVF(player);
      
      // Add some historical variation
      havf.championReadiness.score += Math.floor((Math.random() - 0.5) * 10);
      havf.cognitiveLeverage.score += Math.floor((Math.random() - 0.5) * 8);
      havf.nilTrustScore.score += Math.floor((Math.random() - 0.5) * 12);
      havf.composite.overall = this.calculateComposite(
        havf.championReadiness, 
        havf.cognitiveLeverage, 
        havf.nilTrustScore
      );
      
      history.push({ timestamp, havf });
    }
    
    return history;
  }
}

export const havfService = new HAVFService();