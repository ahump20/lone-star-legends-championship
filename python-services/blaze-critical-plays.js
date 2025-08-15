/**
 * Blaze Critical Play Analyzer for Baseball
 * Identifies and analyzes game-changing moments in Lone Star Legends
 * Adapted from Blaze Intelligence framework
 */

export class BlazeCriticalPlayAnalyzer {
  constructor(config = {}) {
    this.config = {
      impactThreshold: 0.15,  // Min impact to be considered critical
      maxCriticalPlays: 10,   // Maximum critical plays to track
      recencyBias: 0.1,       // Weight for recent plays
      contextualFactors: {
        score: 1.0,
        inning: 0.8,
        bases: 0.7,
        outs: 0.6,
        count: 0.4
      },
      ...config
    };
    
    this.criticalPlays = [];
    this.playHistory = [];
    
    // Impact weights for different play outcomes
    this.playImpacts = {
      // Offensive plays
      grandSlam: 1.0,
      homerun: 0.8,
      triple: 0.6,
      double: 0.4,
      single: 0.2,
      walkOffHit: 1.0,
      rbiBingle: 0.3,
      sacrificeFly: 0.15,
      stolenBase: 0.1,
      
      // Defensive plays
      doublePlay: 0.5,
      triplePlay: 0.9,
      spectacularCatch: 0.6,
      throwingError: -0.4,
      fieldingError: -0.3,
      
      // Pitching plays
      strikeoutLookingWithBasesLoaded: 0.7,
      strikeoutSwinging: 0.15,
      walk: -0.1,
      walkWithBasesLoaded: -0.5,
      wildPitch: -0.3,
      balk: -0.2,
      
      // Special situations
      comebackStart: 0.8,
      rallyKiller: 0.6,
      tieBreaker: 0.9,
      insuranceRun: 0.4
    };
  }

  /**
   * Analyze a play for criticality
   */
  analyzePlay(play, gameContext) {
    // Calculate raw impact
    let impact = this.calculateImpact(play, gameContext);
    
    // Apply contextual factors
    impact = this.applyContextualFactors(impact, play, gameContext);
    
    // Create play record
    const playRecord = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      inning: gameContext.inning,
      topBottom: gameContext.topBottom,
      play: play,
      impact: impact,
      context: { ...gameContext },
      description: this.generateDescription(play, gameContext),
      category: this.categorizePlay(play, impact)
    };
    
    // Add to history
    this.playHistory.push(playRecord);
    
    // Check if it's critical
    if (impact >= this.config.impactThreshold) {
      this.addCriticalPlay(playRecord);
    }
    
    return {
      isCritical: impact >= this.config.impactThreshold,
      impact: impact,
      category: playRecord.category,
      description: playRecord.description
    };
  }

  /**
   * Calculate base impact of a play
   */
  calculateImpact(play, gameContext) {
    // Get base impact from play type
    let impact = this.playImpacts[play.type] || 0;
    
    // Adjust for runs scored
    if (play.runsScored) {
      impact += play.runsScored * 0.2;
    }
    
    // Adjust for win probability change
    if (play.winProbabilityChange) {
      impact += Math.abs(play.winProbabilityChange);
    }
    
    return Math.abs(impact);
  }

  /**
   * Apply contextual factors to impact score
   */
  applyContextualFactors(rawImpact, play, gameContext) {
    let adjustedImpact = rawImpact;
    const factors = this.config.contextualFactors;
    
    // Inning factor (later innings are more critical)
    if (gameContext.inning) {
      const inningFactor = gameContext.inning / 9;
      adjustedImpact *= (1 + inningFactor * factors.inning);
      
      // Extra innings are super critical
      if (gameContext.inning > 9) {
        adjustedImpact *= 1.5;
      }
    }
    
    // Score differential factor (closer games = more critical)
    if (gameContext.scoreDifferential !== undefined) {
      const closeness = Math.max(0, 1 - Math.abs(gameContext.scoreDifferential) / 10);
      adjustedImpact *= (1 + closeness * factors.score);
    }
    
    // Bases occupied factor
    if (gameContext.runnersOnBase) {
      const baseMultiplier = 1 + (gameContext.runnersOnBase / 3) * factors.bases;
      adjustedImpact *= baseMultiplier;
    }
    
    // Outs factor (2 outs = more pressure)
    if (gameContext.outs === 2) {
      adjustedImpact *= (1 + factors.outs * 0.5);
    }
    
    // Count factor (full count, 3-2 = higher stakes)
    if (gameContext.balls === 3 && gameContext.strikes === 2) {
      adjustedImpact *= (1 + factors.count);
    }
    
    // Walk-off situation
    if (gameContext.inning >= 9 && gameContext.topBottom === 'bottom' && 
        gameContext.scoreDifferential <= 0) {
      adjustedImpact *= 2.0;
    }
    
    return Math.min(1.0, adjustedImpact);
  }

  /**
   * Add a play to critical plays list
   */
  addCriticalPlay(playRecord) {
    this.criticalPlays.push(playRecord);
    
    // Sort by impact
    this.criticalPlays.sort((a, b) => b.impact - a.impact);
    
    // Keep only top N critical plays
    if (this.criticalPlays.length > this.config.maxCriticalPlays) {
      this.criticalPlays = this.criticalPlays.slice(0, this.config.maxCriticalPlays);
    }
  }

  /**
   * Categorize a play
   */
  categorizePlay(play, impact) {
    if (impact >= 0.8) return 'game-changing';
    if (impact >= 0.5) return 'momentum-shift';
    if (impact >= 0.3) return 'significant';
    if (impact >= this.config.impactThreshold) return 'notable';
    return 'routine';
  }

  /**
   * Generate human-readable description
   */
  generateDescription(play, gameContext) {
    const inning = `${gameContext.topBottom === 'top' ? 'Top' : 'Bottom'} ${gameContext.inning}`;
    const score = `(${gameContext.homeScore}-${gameContext.awayScore})`;
    
    let description = `${inning} ${score}: `;
    
    switch(play.type) {
      case 'homerun':
        description += `${play.player} crushes a HOME RUN`;
        if (play.runsScored > 1) {
          description += ` (${play.runsScored} runs score!)`;
        }
        break;
      case 'grandSlam':
        description += `${play.player} hits a GRAND SLAM! The crowd goes wild!`;
        break;
      case 'triple':
        description += `${play.player} legs out a triple to ${play.location}`;
        break;
      case 'double':
        description += `${play.player} doubles to ${play.location}`;
        break;
      case 'single':
        description += `${play.player} singles`;
        if (play.runsScored) {
          description += ` (${play.runsScored} run${play.runsScored > 1 ? 's' : ''} score)`;
        }
        break;
      case 'doublePlay':
        description += `Double play! ${play.description || 'Rally killed!'}`;
        break;
      case 'strikeoutLookingWithBasesLoaded':
        description += `${play.pitcher} strikes out ${play.batter} looking with the bases loaded!`;
        break;
      case 'walkOffHit':
        description += `${play.player} delivers a WALK-OFF ${play.hitType}! Game over!`;
        break;
      case 'spectacularCatch':
        description += `${play.fielder} makes a SPECTACULAR catch! Robbery!`;
        break;
      default:
        description += play.description || play.type;
    }
    
    return description;
  }

  /**
   * Get momentum score based on recent critical plays
   */
  getMomentumScore(team) {
    const recentCritical = this.criticalPlays.slice(-3);
    
    let momentum = 0;
    recentCritical.forEach((play, index) => {
      if (play.play.team === team) {
        // More recent plays have more weight
        const recencyWeight = (index + 1) / 3;
        momentum += play.impact * recencyWeight;
      }
    });
    
    return Math.min(1.0, momentum);
  }

  /**
   * Get game flow narrative
   */
  getGameNarrative() {
    if (this.criticalPlays.length === 0) {
      return "No critical plays yet - the game is just getting started!";
    }
    
    const narrative = [];
    
    // Opening
    narrative.push("Key moments in this game:");
    
    // Describe top 3 critical plays
    this.criticalPlays.slice(0, 3).forEach((play, index) => {
      narrative.push(`${index + 1}. ${play.description} (Impact: ${(play.impact * 100).toFixed(0)}%)`);
    });
    
    // Current momentum
    const homeMomentum = this.getMomentumScore('home');
    const awayMomentum = this.getMomentumScore('away');
    
    if (homeMomentum > awayMomentum + 0.2) {
      narrative.push("\nThe home team has seized the momentum!");
    } else if (awayMomentum > homeMomentum + 0.2) {
      narrative.push("\nThe away team is in control right now!");
    } else {
      narrative.push("\nThis game is a back-and-forth battle!");
    }
    
    return narrative.join('\n');
  }

  /**
   * Predict next critical play likelihood
   */
  predictNextCriticalPlay(gameContext) {
    let likelihood = 0.1; // Base 10% chance
    
    // Increase in late innings
    if (gameContext.inning >= 7) {
      likelihood += 0.1;
    }
    if (gameContext.inning >= 9) {
      likelihood += 0.2;
    }
    
    // Increase in close games
    if (Math.abs(gameContext.scoreDifferential) <= 2) {
      likelihood += 0.15;
    }
    
    // Increase with runners on base
    if (gameContext.runnersOnBase >= 2) {
      likelihood += 0.1;
    }
    
    // Increase with 2 outs
    if (gameContext.outs === 2) {
      likelihood += 0.05;
    }
    
    // Recent pattern
    const recentCriticalCount = this.playHistory
      .slice(-10)
      .filter(p => p.impact >= this.config.impactThreshold)
      .length;
    
    if (recentCriticalCount >= 2) {
      likelihood += 0.1; // Hot streak
    }
    
    return Math.min(0.75, likelihood);
  }

  /**
   * Get visualization data
   */
  getVisualizationData() {
    return {
      criticalPlays: this.criticalPlays.map(p => ({
        inning: p.inning,
        impact: p.impact,
        team: p.play.team,
        description: p.description,
        category: p.category
      })),
      timeline: this.playHistory.map(p => ({
        inning: p.inning,
        impact: p.impact,
        isCritical: p.impact >= this.config.impactThreshold
      })),
      categories: this.getCategoryBreakdown(),
      narrative: this.getGameNarrative()
    };
  }

  /**
   * Get breakdown by category
   */
  getCategoryBreakdown() {
    const breakdown = {
      'game-changing': 0,
      'momentum-shift': 0,
      'significant': 0,
      'notable': 0,
      'routine': 0
    };
    
    this.playHistory.forEach(play => {
      breakdown[play.category]++;
    });
    
    return breakdown;
  }

  /**
   * Reset for new game
   */
  reset() {
    this.criticalPlays = [];
    this.playHistory = [];
  }
}

export default BlazeCriticalPlayAnalyzer;