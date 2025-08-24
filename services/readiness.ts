/**
 * Blaze Intelligence - Readiness Service
 * Team and player readiness calculations with caching
 */

import { ReadinessSnapshot, TeamReadinessQuery } from '../packages/schema/types.js';

interface ReadinessData {
  averageReadiness: number;
  players: ReadinessSnapshot[];
  context: string;
  confidence: number;
}

class ReadinessService {
  private cache = new Map<string, { data: ReadinessData; expiry: number }>();
  private readonly CACHE_TTL = 60 * 1000; // 1 minute

  async getTeamReadiness(teamId: string, query: TeamReadinessQuery): Promise<ReadinessData> {
    const cacheKey = `readiness:${teamId}:${JSON.stringify(query)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // Calculate readiness data
    const data = await this.calculateTeamReadiness(teamId, query);
    
    // Cache the result
    this.cache.set(cacheKey, {
      data,
      expiry: Date.now() + this.CACHE_TTL
    });
    
    return data;
  }

  private async calculateTeamReadiness(teamId: string, query: TeamReadinessQuery): Promise<ReadinessData> {
    // In production, this would query the database
    // For now, return mock data based on team
    
    const mockPlayers = await this.getMockPlayersData(teamId);
    const windowMultiplier = this.getWindowMultiplier(query.window);
    
    const players: ReadinessSnapshot[] = mockPlayers.map(player => ({
      id: crypto.randomUUID(),
      teamId,
      playerId: player.id,
      timestamp: new Date(),
      readinessScore: this.calculatePlayerReadiness(player, windowMultiplier),
      leverageScore: this.calculatePlayerLeverage(player, windowMultiplier),
      context: query.context || 'season',
      confidence: this.calculateConfidence(player),
      factors: {
        performance: Math.random() * 100,
        health: Math.random() * 100,
        workload: Math.random() * 100,
        sleep: Math.random() * 100
      }
    }));

    const averageReadiness = players.reduce((sum, p) => sum + p.readinessScore, 0) / players.length;

    return {
      averageReadiness,
      players,
      context: query.context || 'season',
      confidence: players.reduce((sum, p) => sum + p.confidence, 0) / players.length
    };
  }

  private async getMockPlayersData(teamId: string) {
    // Mock player data - in production, query from database
    const teamPlayers = {
      'STL': [
        { id: 'goldschmidt_p', name: 'Paul Goldschmidt', position: '1B', performance: 85 },
        { id: 'arenado_n', name: 'Nolan Arenado', position: '3B', performance: 88 },
        { id: 'carlson_d', name: 'Dylan Carlson', position: 'OF', performance: 76 },
        { id: 'wainwright_a', name: 'Adam Wainwright', position: 'P', performance: 82 }
      ],
      'TEN': [
        { id: 'henry_d', name: 'Derrick Henry', position: 'RB', performance: 92 },
        { id: 'tannehill_r', name: 'Ryan Tannehill', position: 'QB', performance: 79 },
        { id: 'brown_aj', name: 'A.J. Brown', position: 'WR', performance: 89 }
      ],
      'MEM': [
        { id: 'morant_j', name: 'Ja Morant', position: 'PG', performance: 91 },
        { id: 'jackson_j', name: 'Jaren Jackson Jr.', position: 'PF', performance: 86 },
        { id: 'bane_d', name: 'Desmond Bane', position: 'SG', performance: 84 }
      ]
    };

    return teamPlayers[teamId as keyof typeof teamPlayers] || [
      { id: 'unknown_1', name: 'Unknown Player 1', position: 'UTIL', performance: 70 },
      { id: 'unknown_2', name: 'Unknown Player 2', position: 'UTIL', performance: 75 }
    ];
  }

  private calculatePlayerReadiness(player: any, windowMultiplier: number): number {
    // Complex readiness calculation based on:
    // - Recent performance trends
    // - Health status
    // - Workload management
    // - Sleep/recovery data
    
    const baseReadiness = player.performance;
    const randomVariation = (Math.random() - 0.5) * 20; // ±10 points
    const windowAdjustment = windowMultiplier * 5;
    
    const readiness = Math.max(0, Math.min(100, 
      baseReadiness + randomVariation + windowAdjustment
    ));
    
    return Math.round(readiness * 100) / 100;
  }

  private calculatePlayerLeverage(player: any, windowMultiplier: number): number {
    // Leverage = impact potential in high-pressure situations
    const positionWeight = this.getPositionWeight(player.position);
    const performanceBonus = player.performance > 85 ? 10 : 0;
    const baseLeverage = (player.performance * positionWeight) + performanceBonus;
    
    const leverage = Math.max(0, Math.min(100, baseLeverage + (windowMultiplier * 3)));
    return Math.round(leverage * 100) / 100;
  }

  private calculateConfidence(player: any): number {
    // Confidence in the readiness calculation
    // Based on data completeness and recency
    const dataCompleteness = 0.85; // 85% of expected data points available
    const recencyScore = 0.92; // Data is recent
    const reliabilityScore = 0.88; // Source reliability
    
    return Math.round((dataCompleteness * recencyScore * reliabilityScore) * 100);
  }

  private getWindowMultiplier(window: string): number {
    // Adjust readiness based on time window context
    switch (window) {
      case 'day': return 1.0;    // Current form
      case 'week': return 0.8;   // Recent trend
      case 'month': return 0.6;  // Seasonal form
      case 'season': return 0.4; // Long-term average
      default: return 1.0;
    }
  }

  private getPositionWeight(position: string): number {
    // Position impact on leverage scoring
    const weights: Record<string, number> = {
      // Baseball
      'P': 0.95,   // Pitcher - highest leverage
      'C': 0.85,   // Catcher - field general
      'SS': 0.80,  // Shortstop - key defensive position
      '1B': 0.75, '2B': 0.75, '3B': 0.75,
      'OF': 0.70,  // Outfielders
      
      // Football  
      'QB': 0.95,  // Quarterback - highest leverage
      'RB': 0.80,  // Running back
      'WR': 0.85,  // Wide receiver
      'TE': 0.75,  // Tight end
      'OL': 0.70,  // Offensive line
      'DL': 0.75,  // Defensive line
      'LB': 0.75,  // Linebacker
      'DB': 0.80,  // Defensive back
      
      // Basketball
      'PG': 0.95,  // Point guard - highest leverage
      'SG': 0.85,  // Shooting guard
      'SF': 0.80,  // Small forward
      'PF': 0.75,  // Power forward
      'C': 0.80,   // Center
      
      // Default
      'UTIL': 0.70
    };
    
    return weights[position] || 0.70;
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }
}

export const readinessService = new ReadinessService();

// Clean up cache every 5 minutes
setInterval(() => {
  readinessService.clearExpiredCache();
}, 5 * 60 * 1000);