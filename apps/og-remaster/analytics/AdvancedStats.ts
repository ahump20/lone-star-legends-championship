/**
 * Blaze Intelligence OG Remaster
 * Advanced Statistics Tracking System
 * Comprehensive analytics for championship performance
 */

export interface BattingStats {
  // Basic stats
  plateAppearances: number;
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runs: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  hitByPitch: number;
  sacrificeHits: number;
  sacrificeFlies: number;
  stolenBases: number;
  caughtStealing: number;
  
  // Advanced stats (calculated)
  battingAverage: number;        // H/AB
  onBasePercentage: number;      // (H+BB+HBP)/(AB+BB+HBP+SF)
  sluggingPercentage: number;    // Total Bases / AB
  onBasePlusSlugging: number;    // OBP + SLG
  walkRate: number;              // BB/PA
  strikeoutRate: number;         // K/PA
  isolatedPower: number;         // SLG - BA
  babip: number;                 // Batting Average on Balls in Play
  
  // Situational stats
  runnersInScoringPosition: { atBats: number; hits: number };
  basesLoaded: { atBats: number; hits: number };
  twoOutRBI: number;
  clutchHits: number;            // Late & close situations
  walkOffHits: number;
  
  // Count-specific stats
  firstPitchSwinging: number;
  firstPitchHits: number;
  twoStrikesHits: number;
  fullCountAtBats: number;
  fullCountHits: number;
  
  // Spray chart data
  hitLocations: HitLocation[];
  
  // Streak tracking
  currentHittingStreak: number;
  longestHittingStreak: number;
  currentOnBaseStreak: number;
  longestOnBaseStreak: number;
}

export interface PitchingStats {
  // Basic stats
  gamesStarted: number;
  gamesFinished: number;
  completeGames: number;
  shutouts: number;
  wins: number;
  losses: number;
  saves: number;
  holds: number;
  inningsPitched: number;
  hitsAllowed: number;
  runsAllowed: number;
  earnedRuns: number;
  homeRunsAllowed: number;
  walksAllowed: number;
  strikeouts: number;
  hitBatsmen: number;
  wildPitches: number;
  balks: number;
  
  // Advanced stats (calculated)
  era: number;                   // (ER * 9) / IP
  whip: number;                  // (H + BB) / IP
  strikeoutRate: number;         // K/9
  walkRate: number;              // BB/9
  homeRunRate: number;           // HR/9
  strikeoutToWalkRatio: number;  // K/BB
  fieldingIndependentPitching: number; // FIP
  
  // Quality metrics
  qualityStarts: number;         // 6+ IP, 3 or fewer ER
  dominantStarts: number;        // 8+ K, 1 or no walks
  
  // Pitch-specific data
  pitchCounts: Map<string, number>; // Fastball, Curveball, etc.
  averageVelocity: Map<string, number>;
  strikePercentage: number;
  swingAndMissRate: number;
  groundBallRate: number;
  flyBallRate: number;
  
  // Situational pitching
  leftHandedBatters: { faced: number; hits: number; walks: number };
  rightHandedBatters: { faced: number; hits: number; walks: number };
  runnersInScoringPosition: { faced: number; hits: number };
  basesLoaded: { faced: number; hits: number };
  
  // Pressure situations
  saveOpportunities: number;
  blownSaves: number;
  inheritedRunners: number;
  inheritedRunnersScored: number;
}

export interface FieldingStats {
  // Basic stats
  games: number;
  gamesStarted: number;
  innings: number;
  totalChances: number;
  putouts: number;
  assists: number;
  errors: number;
  doublePlays: number;
  
  // Advanced stats
  fieldingPercentage: number;    // (PO + A) / (PO + A + E)
  range: number;                 // (PO + A) / Innings
  zone: number;                  // Plays made in zone / Opportunities
  
  // Position-specific
  passedBalls?: number;          // Catchers only
  stolenBasesAllowed?: number;   // Catchers only
  caughtStealing?: number;       // Catchers only
  pickoffs?: number;             // Catchers & Pitchers
  
  // Advanced fielding metrics
  ultimateZoneRating: number;    // UZR - runs above/below average
  defensiveRunsSaved: number;    // DRS - runs saved vs average
  
  // Heat map data for defensive positioning
  successfulPlays: DefensivePlay[];
  missedPlays: DefensivePlay[];
}

export interface HitLocation {
  x: number;        // Field coordinate
  y: number;        // Field coordinate
  velocity: number; // Exit velocity
  angle: number;    // Launch angle
  distance: number; // Distance traveled
  result: 'single' | 'double' | 'triple' | 'homerun' | 'out';
  timestamp: Date;
}

export interface DefensivePlay {
  x: number;
  y: number;
  difficulty: number; // 0-100 scale
  playType: 'grounder' | 'liner' | 'flyball' | 'popup';
  success: boolean;
  timestamp: Date;
}

export interface GameSituation {
  inning: number;
  outs: number;
  balls: number;
  strikes: number;
  baseRunners: boolean[];
  homeAway: 'home' | 'away';
  score: { home: number; away: number };
  timeOfGame: number; // Minutes elapsed
  pressure: number;   // Calculated pressure index
}

export interface AdvancedAnalytics {
  winProbability: number;        // Real-time win probability
  leverageIndex: number;         // How much the game state matters
  winProbabilityAdded: number;   // WPA for last play
  expectedRuns: Map<string, number>; // Run expectancy by base state
  contextualStats: Map<string, any>; // Situational performance
  
  // Sabermetrics
  war: number;                   // Wins Above Replacement
  wrc: number;                   // Weighted Runs Created
  baseRunningValue: number;      // Value from baserunning
  positionalAdjustment: number;  // Position difficulty adjustment
}

export class AdvancedStatsTracker {
  private playerStats: Map<string, PlayerStatSheet> = new Map();
  private teamStats: Map<string, TeamStatSheet> = new Map();
  private gameLog: GameEvent[] = [];
  private currentSeason: string = '2025';
  
  constructor() {
    this.loadStatHistory();
    console.log('📊 Advanced Stats Tracker initialized');
  }
  
  public recordPlateAppearance(
    playerId: string,
    situation: GameSituation,
    result: PlateAppearanceResult
  ): void {
    const stats = this.getOrCreatePlayerStats(playerId);
    
    // Update basic counting stats
    stats.batting.plateAppearances++;
    
    if (result.type !== 'walk' && result.type !== 'hbp' && result.type !== 'sacrifice') {
      stats.batting.atBats++;
    }
    
    if (result.isHit) {
      stats.batting.hits++;
      this.recordHitLocation(playerId, result.hitData!);
      
      // Update hit type
      switch (result.type) {
        case 'single':
          break;
        case 'double':
          stats.batting.doubles++;
          break;
        case 'triple':
          stats.batting.triples++;
          break;
        case 'homerun':
          stats.batting.homeRuns++;
          break;
      }
      
      // Update hitting streak
      stats.batting.currentHittingStreak++;
      if (stats.batting.currentHittingStreak > stats.batting.longestHittingStreak) {
        stats.batting.longestHittingStreak = stats.batting.currentHittingStreak;
      }
    } else {
      // Reset hitting streak on hitless at-bat
      if (result.type !== 'walk' && result.type !== 'hbp') {
        stats.batting.currentHittingStreak = 0;
      }
    }
    
    // Record situational stats
    if (situation.baseRunners[1] || situation.baseRunners[2]) { // RISP
      stats.batting.runnersInScoringPosition.atBats++;
      if (result.isHit) {
        stats.batting.runnersInScoringPosition.hits++;
      }
    }
    
    if (situation.baseRunners.every(r => r)) { // Bases loaded
      stats.batting.basesLoaded.atBats++;
      if (result.isHit) {
        stats.batting.basesLoaded.hits++;
      }
    }
    
    // Update walks, strikeouts, etc.
    if (result.type === 'walk') {
      stats.batting.walks++;
    } else if (result.type === 'strikeout') {
      stats.batting.strikeouts++;
    }
    
    // Calculate advanced stats
    this.calculateBattingStats(stats.batting);
    
    // Record game event
    this.gameLog.push({
      playerId,
      timestamp: new Date(),
      situation,
      result,
      analytics: this.calculateAnalytics(situation, result)
    });
    
    this.saveStats();
  }
  
  public recordPitchingResult(
    pitcherId: string,
    situation: GameSituation,
    pitchData: PitchData,
    result: PitchResult
  ): void {
    const stats = this.getOrCreatePlayerStats(pitcherId);
    
    // Update pitch counts
    const pitchType = pitchData.type;
    stats.pitching.pitchCounts.set(pitchType, (stats.pitching.pitchCounts.get(pitchType) || 0) + 1);
    
    // Update velocity data
    const currentAvg = stats.pitching.averageVelocity.get(pitchType) || 0;
    const count = stats.pitching.pitchCounts.get(pitchType)!;
    const newAvg = ((currentAvg * (count - 1)) + pitchData.velocity) / count;
    stats.pitching.averageVelocity.set(pitchType, newAvg);
    
    // Track strike/ball rates
    if (pitchData.isStrike) {
      // Update strike percentage (rolling average)
    }
    
    // Calculate advanced metrics
    this.calculatePitchingStats(stats.pitching);
    
    this.saveStats();
  }
  
  public recordFieldingPlay(
    playerId: string,
    position: string,
    play: DefensivePlay
  ): void {
    const stats = this.getOrCreatePlayerStats(playerId);
    
    stats.fielding.totalChances++;
    
    if (play.success) {
      if (play.playType === 'grounder' || play.playType === 'liner') {
        stats.fielding.assists++;
      } else {
        stats.fielding.putouts++;
      }
    } else {
      stats.fielding.errors++;
    }
    
    // Store play data for heat maps
    if (play.success) {
      stats.fielding.successfulPlays.push(play);
    } else {
      stats.fielding.missedPlays.push(play);
    }
    
    // Calculate advanced fielding metrics
    this.calculateFieldingStats(stats.fielding, position);
    
    this.saveStats();
  }
  
  private calculateBattingStats(batting: BattingStats): void {
    // Basic calculations
    batting.battingAverage = batting.atBats > 0 ? batting.hits / batting.atBats : 0;
    
    const totalBases = batting.hits + batting.doubles + (batting.triples * 2) + (batting.homeRuns * 3);
    batting.sluggingPercentage = batting.atBats > 0 ? totalBases / batting.atBats : 0;
    
    const obpDenominator = batting.atBats + batting.walks + batting.hitByPitch + batting.sacrificeFlies;
    const obpNumerator = batting.hits + batting.walks + batting.hitByPitch;
    batting.onBasePercentage = obpDenominator > 0 ? obpNumerator / obpDenominator : 0;
    
    batting.onBasePlusSlugging = batting.onBasePercentage + batting.sluggingPercentage;
    
    // Rate stats
    batting.walkRate = batting.plateAppearances > 0 ? (batting.walks / batting.plateAppearances) * 100 : 0;
    batting.strikeoutRate = batting.plateAppearances > 0 ? (batting.strikeouts / batting.plateAppearances) * 100 : 0;
    
    // Advanced metrics
    batting.isolatedPower = batting.sluggingPercentage - batting.battingAverage;
    
    // BABIP calculation (simplified)
    const ballsInPlay = batting.atBats - batting.strikeouts - batting.homeRuns;
    const hitsInPlay = batting.hits - batting.homeRuns;
    batting.babip = ballsInPlay > 0 ? hitsInPlay / ballsInPlay : 0;
  }
  
  private calculatePitchingStats(pitching: PitchingStats): void {
    // Basic calculations
    pitching.era = pitching.inningsPitched > 0 ? (pitching.earnedRuns * 9) / pitching.inningsPitched : 0;
    pitching.whip = pitching.inningsPitched > 0 ? 
      (pitching.hitsAllowed + pitching.walksAllowed) / pitching.inningsPitched : 0;
    
    // Rate stats (per 9 innings)
    if (pitching.inningsPitched > 0) {
      pitching.strikeoutRate = (pitching.strikeouts * 9) / pitching.inningsPitched;
      pitching.walkRate = (pitching.walksAllowed * 9) / pitching.inningsPitched;
      pitching.homeRunRate = (pitching.homeRunsAllowed * 9) / pitching.inningsPitched;
    }
    
    // Strikeout-to-walk ratio
    pitching.strikeoutToWalkRatio = pitching.walksAllowed > 0 ? 
      pitching.strikeouts / pitching.walksAllowed : pitching.strikeouts;
    
    // FIP calculation (simplified)
    const fipConstant = 3.10; // League average
    pitching.fieldingIndependentPitching = fipConstant + 
      ((13 * pitching.homeRunsAllowed + 3 * pitching.walksAllowed - 2 * pitching.strikeouts) / pitching.inningsPitched);
  }
  
  private calculateFieldingStats(fielding: FieldingStats, position: string): void {
    // Basic calculations
    fielding.fieldingPercentage = fielding.totalChances > 0 ? 
      (fielding.putouts + fielding.assists) / fielding.totalChances : 0;
    
    fielding.range = fielding.innings > 0 ? 
      (fielding.putouts + fielding.assists) * 9 / fielding.innings : 0;
    
    // Position-specific adjustments
    const positionFactors: Record<string, number> = {
      '1B': 0.8, '2B': 1.2, '3B': 1.1, 'SS': 1.3, 
      'LF': 0.9, 'CF': 1.2, 'RF': 1.0, 'C': 1.1
    };
    
    const factor = positionFactors[position] || 1.0;
    
    // Calculate UZR (simplified)
    const avgFieldingPct = 0.975; // League average
    const runs = (fielding.fieldingPercentage - avgFieldingPct) * 1000 * factor;
    fielding.ultimateZoneRating = runs;
  }
  
  private calculateAnalytics(situation: GameSituation, result: PlateAppearanceResult): AdvancedAnalytics {
    // Win probability calculation (simplified)
    const baseWinProb = this.getBaseWinProbability(situation);
    const leverageIndex = this.calculateLeverageIndex(situation);
    
    return {
      winProbability: baseWinProb,
      leverageIndex: leverageIndex,
      winProbabilityAdded: 0, // Would calculate change from previous state
      expectedRuns: new Map(), // Would populate with run expectancy matrix
      contextualStats: new Map(),
      war: 0,
      wrc: 0,
      baseRunningValue: 0,
      positionalAdjustment: 0
    };
  }
  
  private getBaseWinProbability(situation: GameSituation): number {
    // Simplified win probability based on inning and score
    const scoreDiff = situation.homeAway === 'home' ? 
      situation.score.home - situation.score.away :
      situation.score.away - situation.score.home;
    
    const inningsLeft = 9 - situation.inning + (situation.homeAway === 'away' ? 0.5 : 0);
    
    // Base probability (50% for tied game)
    let winProb = 0.5;
    
    // Adjust for score difference
    winProb += scoreDiff * 0.1;
    
    // Adjust for time remaining
    winProb += scoreDiff * (1 - inningsLeft / 9) * 0.2;
    
    return Math.max(0, Math.min(1, winProb));
  }
  
  private calculateLeverageIndex(situation: GameSituation): number {
    // How much the current situation matters (1.0 = average)
    const scoreDiff = Math.abs(situation.score.home - situation.score.away);
    const inningsLeft = 9 - situation.inning;
    
    let leverage = 1.0;
    
    // Close games have higher leverage
    if (scoreDiff <= 1) leverage *= 2.0;
    else if (scoreDiff <= 3) leverage *= 1.5;
    else leverage *= 0.5;
    
    // Late innings have higher leverage
    if (inningsLeft <= 2) leverage *= 1.5;
    else if (inningsLeft <= 4) leverage *= 1.2;
    
    // Runners on base increase leverage
    const runnersOn = situation.baseRunners.filter(r => r).length;
    leverage *= (1 + runnersOn * 0.3);
    
    return leverage;
  }
  
  private recordHitLocation(playerId: string, hitData: HitLocation): void {
    const stats = this.getOrCreatePlayerStats(playerId);
    stats.batting.hitLocations.push(hitData);
    
    // Keep only recent 100 hits for memory efficiency
    if (stats.batting.hitLocations.length > 100) {
      stats.batting.hitLocations = stats.batting.hitLocations.slice(-100);
    }
  }
  
  public generateSprayChart(playerId: string): HitLocation[] {
    const stats = this.playerStats.get(playerId);
    return stats?.batting.hitLocations || [];
  }
  
  public generateHeatMap(playerId: string, position: string): DefensivePlay[] {
    const stats = this.playerStats.get(playerId);
    if (!stats) return [];
    
    return [...stats.fielding.successfulPlays, ...stats.fielding.missedPlays];
  }
  
  public getPlayerReport(playerId: string): PlayerReport {
    const stats = this.getOrCreatePlayerStats(playerId);
    
    return {
      playerId,
      season: this.currentSeason,
      batting: stats.batting,
      pitching: stats.pitching,
      fielding: stats.fielding,
      trends: this.calculateTrends(playerId),
      comparisons: this.generateComparisons(playerId),
      projections: this.generateProjections(playerId)
    };
  }
  
  private calculateTrends(playerId: string): StatTrends {
    // Calculate rolling averages and trends
    const recentGames = this.gameLog
      .filter(event => event.playerId === playerId)
      .slice(-20); // Last 20 games
    
    return {
      last10Games: this.calculateGameRange(recentGames.slice(-10)),
      last20Games: this.calculateGameRange(recentGames),
      hotStreak: this.identifyHotStreak(recentGames),
      coldStreak: this.identifyColdStreak(recentGames)
    };
  }
  
  private generateComparisons(playerId: string): PlayerComparisons {
    // Compare to league averages and similar players
    return {
      leagueRank: this.getLeagueRank(playerId),
      percentile: this.getPercentile(playerId),
      similarPlayers: this.findSimilarPlayers(playerId)
    };
  }
  
  private generateProjections(playerId: string): StatProjections {
    // Project end-of-season stats based on current pace
    const stats = this.playerStats.get(playerId)!;
    const gamesPlayed = this.getGamesPlayed(playerId);
    const projectedGames = 162;
    const factor = projectedGames / Math.max(1, gamesPlayed);
    
    return {
      battingAverage: stats.batting.battingAverage,
      homeRuns: Math.round(stats.batting.homeRuns * factor),
      rbi: Math.round(stats.batting.rbi * factor),
      era: stats.pitching.era,
      strikeouts: Math.round(stats.pitching.strikeouts * factor),
      wins: Math.round(stats.pitching.wins * factor)
    };
  }
  
  private getOrCreatePlayerStats(playerId: string): PlayerStatSheet {
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, this.createEmptyStatSheet());
    }
    return this.playerStats.get(playerId)!;
  }
  
  private createEmptyStatSheet(): PlayerStatSheet {
    return {
      batting: {
        plateAppearances: 0, atBats: 0, hits: 0, doubles: 0, triples: 0,
        homeRuns: 0, runs: 0, rbi: 0, walks: 0, strikeouts: 0,
        hitByPitch: 0, sacrificeHits: 0, sacrificeFlies: 0,
        stolenBases: 0, caughtStealing: 0, battingAverage: 0,
        onBasePercentage: 0, sluggingPercentage: 0, onBasePlusSlugging: 0,
        walkRate: 0, strikeoutRate: 0, isolatedPower: 0, babip: 0,
        runnersInScoringPosition: { atBats: 0, hits: 0 },
        basesLoaded: { atBats: 0, hits: 0 }, twoOutRBI: 0,
        clutchHits: 0, walkOffHits: 0, firstPitchSwinging: 0,
        firstPitchHits: 0, twoStrikesHits: 0, fullCountAtBats: 0,
        fullCountHits: 0, hitLocations: [], currentHittingStreak: 0,
        longestHittingStreak: 0, currentOnBaseStreak: 0, longestOnBaseStreak: 0
      },
      pitching: {
        gamesStarted: 0, gamesFinished: 0, completeGames: 0, shutouts: 0,
        wins: 0, losses: 0, saves: 0, holds: 0, inningsPitched: 0,
        hitsAllowed: 0, runsAllowed: 0, earnedRuns: 0, homeRunsAllowed: 0,
        walksAllowed: 0, strikeouts: 0, hitBatsmen: 0, wildPitches: 0,
        balks: 0, era: 0, whip: 0, strikeoutRate: 0, walkRate: 0,
        homeRunRate: 0, strikeoutToWalkRatio: 0, fieldingIndependentPitching: 0,
        qualityStarts: 0, dominantStarts: 0, pitchCounts: new Map(),
        averageVelocity: new Map(), strikePercentage: 0, swingAndMissRate: 0,
        groundBallRate: 0, flyBallRate: 0,
        leftHandedBatters: { faced: 0, hits: 0, walks: 0 },
        rightHandedBatters: { faced: 0, hits: 0, walks: 0 },
        runnersInScoringPosition: { faced: 0, hits: 0 },
        basesLoaded: { faced: 0, hits: 0 }, saveOpportunities: 0,
        blownSaves: 0, inheritedRunners: 0, inheritedRunnersScored: 0
      },
      fielding: {
        games: 0, gamesStarted: 0, innings: 0, totalChances: 0,
        putouts: 0, assists: 0, errors: 0, doublePlays: 0,
        fieldingPercentage: 0, range: 0, zone: 0, ultimateZoneRating: 0,
        defensiveRunsSaved: 0, successfulPlays: [], missedPlays: []
      }
    };
  }
  
  private loadStatHistory(): void {
    const saved = localStorage.getItem('advanced_stats');
    if (saved) {
      const data = JSON.parse(saved);
      this.playerStats = new Map(data.playerStats);
      this.teamStats = new Map(data.teamStats);
      this.gameLog = data.gameLog || [];
    }
  }
  
  private saveStats(): void {
    const data = {
      playerStats: Array.from(this.playerStats.entries()),
      teamStats: Array.from(this.teamStats.entries()),
      gameLog: this.gameLog.slice(-1000) // Keep last 1000 events
    };
    localStorage.setItem('advanced_stats', JSON.stringify(data));
  }
  
  // Additional helper methods would be implemented here...
  private calculateGameRange(events: GameEvent[]): any { return {}; }
  private identifyHotStreak(events: GameEvent[]): any { return {}; }
  private identifyColdStreak(events: GameEvent[]): any { return {}; }
  private getLeagueRank(playerId: string): number { return 1; }
  private getPercentile(playerId: string): number { return 50; }
  private findSimilarPlayers(playerId: string): string[] { return []; }
  private getGamesPlayed(playerId: string): number { return 1; }
}

// Supporting interfaces
export interface PlayerStatSheet {
  batting: BattingStats;
  pitching: PitchingStats;
  fielding: FieldingStats;
}

export interface TeamStatSheet {
  teamId: string;
  season: string;
  games: number;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  teamStats: PlayerStatSheet;
}

export interface PlateAppearanceResult {
  type: 'single' | 'double' | 'triple' | 'homerun' | 'out' | 'walk' | 'strikeout' | 'hbp' | 'sacrifice';
  isHit: boolean;
  runsScored: number;
  rbiCredit: number;
  hitData?: HitLocation;
}

export interface PitchData {
  type: string;
  velocity: number;
  location: { x: number; y: number };
  isStrike: boolean;
}

export interface PitchResult {
  swung: boolean;
  contact: boolean;
  foul: boolean;
  inPlay: boolean;
}

export interface GameEvent {
  playerId: string;
  timestamp: Date;
  situation: GameSituation;
  result: PlateAppearanceResult;
  analytics: AdvancedAnalytics;
}

export interface PlayerReport {
  playerId: string;
  season: string;
  batting: BattingStats;
  pitching: PitchingStats;
  fielding: FieldingStats;
  trends: StatTrends;
  comparisons: PlayerComparisons;
  projections: StatProjections;
}

export interface StatTrends {
  last10Games: any;
  last20Games: any;
  hotStreak: any;
  coldStreak: any;
}

export interface PlayerComparisons {
  leagueRank: number;
  percentile: number;
  similarPlayers: string[];
}

export interface StatProjections {
  battingAverage: number;
  homeRuns: number;
  rbi: number;
  era: number;
  strikeouts: number;
  wins: number;
}