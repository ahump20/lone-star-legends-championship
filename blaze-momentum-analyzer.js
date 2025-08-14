/**
 * Blaze Momentum Analyzer for Lone Star Legends
 * Adapted from Blaze Intelligence framework for baseball gameplay
 * Tracks and visualizes momentum shifts during games
 */

export class BlazeMomentumAnalyzer {
  constructor(config = {}) {
    this.config = {
      smoothingFactor: 0.3,
      momentumThreshold: 0.2,
      significantShiftThreshold: 0.4,
      timeWindow: 3, // innings
      maxMomentumScore: 100,
      decayRate: 0.95, // momentum decay per out
      ...config
    };
    
    this.momentumHistory = [];
    this.currentMomentum = {
      home: 50,
      away: 50
    };
    
    this.momentumEvents = {
      homerun: 25,
      triple: 15,
      double: 10,
      single: 5,
      walk: 2,
      strikeout: -3,
      doublePlay: -8,
      error: -5,
      stolenBase: 3,
      caughtStealing: -3,
      runScored: 10,
      runnerLeftOnBase: -2
    };
  }

  /**
   * Process a game event and update momentum
   */
  processEvent(event) {
    const oldMomentum = { ...this.currentMomentum };
    
    // Calculate momentum shift based on event
    const shift = this.calculateMomentumShift(event);
    
    // Apply momentum shift with smoothing
    if (event.team === 'home') {
      this.currentMomentum.home = this.smoothMomentum(
        this.currentMomentum.home + shift
      );
      this.currentMomentum.away = this.smoothMomentum(
        this.currentMomentum.away - shift * 0.5 // Opposing team loses some momentum
      );
    } else {
      this.currentMomentum.away = this.smoothMomentum(
        this.currentMomentum.away + shift
      );
      this.currentMomentum.home = this.smoothMomentum(
        this.currentMomentum.home - shift * 0.5
      );
    }
    
    // Normalize to ensure total is 100
    this.normalizeMomentum();
    
    // Record in history
    this.momentumHistory.push({
      timestamp: Date.now(),
      inning: event.inning,
      event: event.type,
      team: event.team,
      shift: shift,
      momentum: { ...this.currentMomentum },
      description: this.getEventDescription(event)
    });
    
    // Check for significant shifts
    const isSignificant = this.isSignificantShift(oldMomentum, this.currentMomentum);
    
    return {
      momentum: this.currentMomentum,
      shift: shift,
      isSignificant: isSignificant,
      description: this.getEventDescription(event)
    };
  }

  /**
   * Calculate momentum shift for an event
   */
  calculateMomentumShift(event) {
    let baseShift = this.momentumEvents[event.type] || 0;
    
    // Apply contextual modifiers
    baseShift = this.applyContextualModifiers(baseShift, event);
    
    return baseShift;
  }

  /**
   * Apply contextual modifiers to momentum shift
   */
  applyContextualModifiers(baseShift, event) {
    let modifiedShift = baseShift;
    
    // Late game multiplier (9th inning or extra innings)
    if (event.inning >= 9) {
      modifiedShift *= 1.5;
    }
    
    // Close game multiplier
    if (event.scoreDifferential !== undefined && Math.abs(event.scoreDifferential) <= 2) {
      modifiedShift *= 1.3;
    }
    
    // Bases loaded multiplier
    if (event.basesLoaded) {
      modifiedShift *= 1.4;
    }
    
    // Two outs multiplier (clutch situations)
    if (event.outs === 2) {
      modifiedShift *= 1.2;
    }
    
    // Consecutive hits bonus
    if (event.consecutiveHits > 2) {
      modifiedShift *= (1 + event.consecutiveHits * 0.1);
    }
    
    return modifiedShift;
  }

  /**
   * Smooth momentum value with bounds
   */
  smoothMomentum(value) {
    // Apply smoothing factor
    const smoothed = value * (1 - this.config.smoothingFactor) + 
                    (value > 50 ? 50 : 50) * this.config.smoothingFactor;
    
    // Ensure bounds [0, 100]
    return Math.max(0, Math.min(100, smoothed));
  }

  /**
   * Normalize momentum to ensure total is 100
   */
  normalizeMomentum() {
    const total = this.currentMomentum.home + this.currentMomentum.away;
    if (total !== 100 && total > 0) {
      const factor = 100 / total;
      this.currentMomentum.home *= factor;
      this.currentMomentum.away *= factor;
    }
  }

  /**
   * Check if a momentum shift is significant
   */
  isSignificantShift(oldMomentum, newMomentum) {
    const homeShift = Math.abs(newMomentum.home - oldMomentum.home);
    const awayShift = Math.abs(newMomentum.away - oldMomentum.away);
    
    return homeShift >= this.config.significantShiftThreshold * 100 ||
           awayShift >= this.config.significantShiftThreshold * 100;
  }

  /**
   * Apply momentum decay (called on outs)
   */
  applyDecay() {
    const decayFactor = this.config.decayRate;
    
    // Move both teams slightly toward neutral (50)
    this.currentMomentum.home = this.currentMomentum.home * decayFactor + 50 * (1 - decayFactor);
    this.currentMomentum.away = this.currentMomentum.away * decayFactor + 50 * (1 - decayFactor);
    
    this.normalizeMomentum();
  }

  /**
   * Get momentum trend
   */
  getMomentumTrend(lookback = 5) {
    if (this.momentumHistory.length < lookback) {
      return 'neutral';
    }
    
    const recent = this.momentumHistory.slice(-lookback);
    const homeChanges = recent.map(h => h.momentum.home);
    const homeTrend = homeChanges[homeChanges.length - 1] - homeChanges[0];
    
    if (homeTrend > 10) return 'home_rising';
    if (homeTrend < -10) return 'away_rising';
    return 'neutral';
  }

  /**
   * Get critical momentum points
   */
  getCriticalMoments() {
    return this.momentumHistory.filter(h => 
      Math.abs(h.shift) >= this.config.significantShiftThreshold * 100
    ).map(h => ({
      inning: h.inning,
      event: h.event,
      team: h.team,
      shift: h.shift,
      description: h.description
    }));
  }

  /**
   * Get event description
   */
  getEventDescription(event) {
    const teamName = event.team === 'home' ? 'Home team' : 'Away team';
    const descriptions = {
      homerun: `${teamName} hits a HOME RUN!`,
      triple: `${teamName} hits a triple!`,
      double: `${teamName} hits a double!`,
      single: `${teamName} gets a single`,
      walk: `${teamName} draws a walk`,
      strikeout: `${teamName} strikes out`,
      doublePlay: `${teamName} hits into a double play`,
      error: `${teamName} commits an error`,
      stolenBase: `${teamName} steals a base`,
      caughtStealing: `${teamName} caught stealing`,
      runScored: `${teamName} scores a run!`,
      runnerLeftOnBase: `${teamName} leaves a runner on base`
    };
    
    return descriptions[event.type] || `${teamName} ${event.type}`;
  }

  /**
   * Get momentum visualization data for charts
   */
  getVisualizationData() {
    return {
      current: this.currentMomentum,
      history: this.momentumHistory.map(h => ({
        inning: h.inning,
        home: h.momentum.home,
        away: h.momentum.away,
        event: h.event
      })),
      trend: this.getMomentumTrend(),
      critical: this.getCriticalMoments()
    };
  }

  /**
   * Reset momentum for new game
   */
  reset() {
    this.momentumHistory = [];
    this.currentMomentum = {
      home: 50,
      away: 50
    };
  }

  /**
   * Get momentum-based predictions
   */
  getPredictions() {
    const trend = this.getMomentumTrend();
    const momentum = this.currentMomentum;
    
    // Simple prediction based on current momentum
    const homeWinProbability = momentum.home / 100;
    const awayWinProbability = momentum.away / 100;
    
    // Adjust based on trend
    let trendAdjustment = 0;
    if (trend === 'home_rising') trendAdjustment = 0.05;
    if (trend === 'away_rising') trendAdjustment = -0.05;
    
    return {
      homeWinProbability: Math.max(0, Math.min(1, homeWinProbability + trendAdjustment)),
      awayWinProbability: Math.max(0, Math.min(1, awayWinProbability - trendAdjustment)),
      trend: trend,
      confidence: this.calculateConfidence()
    };
  }

  /**
   * Calculate prediction confidence
   */
  calculateConfidence() {
    // Base confidence on how extreme the momentum is
    const extremity = Math.abs(this.currentMomentum.home - 50) / 50;
    
    // Also factor in consistency of recent events
    const recentConsistency = this.calculateRecentConsistency();
    
    return (extremity * 0.6 + recentConsistency * 0.4);
  }

  /**
   * Calculate recent consistency
   */
  calculateRecentConsistency() {
    if (this.momentumHistory.length < 3) return 0.5;
    
    const recent = this.momentumHistory.slice(-3);
    const shifts = recent.map(h => h.shift);
    
    // Check if all shifts are in same direction
    const allPositive = shifts.every(s => s > 0);
    const allNegative = shifts.every(s => s < 0);
    
    if (allPositive || allNegative) return 1.0;
    
    // Calculate variance
    const avg = shifts.reduce((a, b) => a + b, 0) / shifts.length;
    const variance = shifts.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / shifts.length;
    
    // Lower variance means more consistency
    return Math.max(0, 1 - variance / 100);
  }
}

export default BlazeMomentumAnalyzer;