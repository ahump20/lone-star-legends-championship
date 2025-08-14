/**
 * Baseball Statistics Tracker
 * Advanced statistics tracking for Lone Star Legends
 * Inspired by professional baseball analytics
 */

export class BaseballStatsTracker {
  constructor() {
    this.gameStats = {
      innings: [],
      currentInning: 1,
      topOrBottom: 'top', // 'top' or 'bottom'
      outs: 0,
      score: {
        home: 0,
        away: 0
      },
      hits: {
        home: 0,
        away: 0
      },
      errors: {
        home: 0,
        away: 0
      }
    };

    this.playerStats = new Map();
    this.teamStats = {
      home: this.createTeamStats(),
      away: this.createTeamStats()
    };
  }

  createTeamStats() {
    return {
      batting: {
        atBats: 0,
        runs: 0,
        hits: 0,
        doubles: 0,
        triples: 0,
        homeRuns: 0,
        rbis: 0,
        walks: 0,
        strikeouts: 0,
        stolenBases: 0,
        caughtStealing: 0,
        leftOnBase: 0,
        battingAverage: 0,
        onBasePercentage: 0,
        sluggingPercentage: 0,
        ops: 0 // On-base Plus Slugging
      },
      pitching: {
        inningsPitched: 0,
        hits: 0,
        runs: 0,
        earnedRuns: 0,
        walks: 0,
        strikeouts: 0,
        homeRuns: 0,
        pitchCount: 0,
        strikes: 0,
        balls: 0,
        era: 0, // Earned Run Average
        whip: 0 // Walks + Hits per Inning Pitched
      },
      fielding: {
        putouts: 0,
        assists: 0,
        errors: 0,
        doublePlays: 0,
        triplePlays: 0,
        fieldingPercentage: 0
      }
    };
  }

  createPlayerStats(playerName, playerNumber, position) {
    return {
      name: playerName,
      number: playerNumber,
      position: position,
      batting: {
        plateAppearances: 0,
        atBats: 0,
        runs: 0,
        hits: 0,
        singles: 0,
        doubles: 0,
        triples: 0,
        homeRuns: 0,
        rbis: 0,
        walks: 0,
        intentionalWalks: 0,
        strikeouts: 0,
        stolenBases: 0,
        caughtStealing: 0,
        sacrificeHits: 0,
        sacrificeFlies: 0,
        groundedIntoDoublePlays: 0,
        // Advanced metrics
        battingAverage: 0,
        onBasePercentage: 0,
        sluggingPercentage: 0,
        ops: 0,
        totalBases: 0
      },
      pitching: {
        gamesStarted: 0,
        completeGames: 0,
        shutouts: 0,
        wins: 0,
        losses: 0,
        saves: 0,
        holds: 0,
        inningsPitched: 0,
        hits: 0,
        runs: 0,
        earnedRuns: 0,
        walks: 0,
        strikeouts: 0,
        homeRuns: 0,
        wildPitches: 0,
        balks: 0,
        pitchCount: 0,
        strikes: 0,
        balls: 0,
        // Advanced metrics
        era: 0,
        whip: 0,
        strikeoutToWalkRatio: 0,
        pitchesPerInning: 0
      },
      fielding: {
        gamesPlayed: 0,
        gamesStarted: 0,
        innings: 0,
        putouts: 0,
        assists: 0,
        errors: 0,
        doublePlays: 0,
        triplePlays: 0,
        // Advanced metrics
        fieldingPercentage: 0,
        rangeFactor: 0,
        totalChances: 0
      },
      gameLog: []
    };
  }

  // Register a new player
  registerPlayer(playerId, playerName, playerNumber, position, team) {
    if (!this.playerStats.has(playerId)) {
      const stats = this.createPlayerStats(playerName, playerNumber, position);
      stats.team = team;
      this.playerStats.set(playerId, stats);
    }
    return this.playerStats.get(playerId);
  }

  // Record batting events
  recordAtBat(playerId, result, rbis = 0) {
    const player = this.playerStats.get(playerId);
    if (!player) return;

    player.batting.plateAppearances++;
    
    switch(result) {
      case 'single':
        player.batting.atBats++;
        player.batting.hits++;
        player.batting.singles++;
        player.batting.totalBases++;
        break;
      case 'double':
        player.batting.atBats++;
        player.batting.hits++;
        player.batting.doubles++;
        player.batting.totalBases += 2;
        break;
      case 'triple':
        player.batting.atBats++;
        player.batting.hits++;
        player.batting.triples++;
        player.batting.totalBases += 3;
        break;
      case 'homerun':
        player.batting.atBats++;
        player.batting.hits++;
        player.batting.homeRuns++;
        player.batting.totalBases += 4;
        player.batting.runs++;
        break;
      case 'walk':
        player.batting.walks++;
        break;
      case 'intentional_walk':
        player.batting.walks++;
        player.batting.intentionalWalks++;
        break;
      case 'strikeout':
        player.batting.atBats++;
        player.batting.strikeouts++;
        break;
      case 'groundout':
      case 'flyout':
      case 'lineout':
        player.batting.atBats++;
        break;
      case 'sacrifice_fly':
        player.batting.sacrificeFlies++;
        break;
      case 'sacrifice_hit':
        player.batting.sacrificeHits++;
        break;
      case 'double_play':
        player.batting.atBats++;
        player.batting.groundedIntoDoublePlays++;
        break;
    }

    player.batting.rbis += rbis;
    this.updateBattingAverages(player);
    
    // Log the event
    player.gameLog.push({
      timestamp: Date.now(),
      inning: this.gameStats.currentInning,
      type: 'batting',
      result: result,
      rbis: rbis
    });
  }

  // Record pitching events
  recordPitch(pitcherId, type, result) {
    const pitcher = this.playerStats.get(pitcherId);
    if (!pitcher) return;

    pitcher.pitching.pitchCount++;
    
    if (type === 'strike') {
      pitcher.pitching.strikes++;
    } else if (type === 'ball') {
      pitcher.pitching.balls++;
    }

    // Record outcomes
    switch(result) {
      case 'strikeout':
        pitcher.pitching.strikeouts++;
        break;
      case 'walk':
        pitcher.pitching.walks++;
        break;
      case 'hit':
        pitcher.pitching.hits++;
        break;
      case 'homerun':
        pitcher.pitching.homeRuns++;
        pitcher.pitching.hits++;
        break;
    }

    // Log the event
    pitcher.gameLog.push({
      timestamp: Date.now(),
      inning: this.gameStats.currentInning,
      type: 'pitching',
      pitch: type,
      result: result
    });
  }

  // Record fielding events
  recordFieldingPlay(fielderId, playType) {
    const fielder = this.playerStats.get(fielderId);
    if (!fielder) return;

    switch(playType) {
      case 'putout':
        fielder.fielding.putouts++;
        break;
      case 'assist':
        fielder.fielding.assists++;
        break;
      case 'error':
        fielder.fielding.errors++;
        break;
      case 'double_play':
        fielder.fielding.doublePlays++;
        break;
      case 'triple_play':
        fielder.fielding.triplePlays++;
        break;
    }

    this.updateFieldingPercentage(fielder);
    
    // Log the event
    fielder.gameLog.push({
      timestamp: Date.now(),
      inning: this.gameStats.currentInning,
      type: 'fielding',
      play: playType
    });
  }

  // Update calculated statistics
  updateBattingAverages(player) {
    const batting = player.batting;
    
    // Batting Average (BA) = Hits / At Bats
    if (batting.atBats > 0) {
      batting.battingAverage = (batting.hits / batting.atBats).toFixed(3);
    }
    
    // On Base Percentage (OBP) = (Hits + Walks + HBP) / (At Bats + Walks + HBP + SF)
    const onBaseNumerator = batting.hits + batting.walks;
    const onBaseDenominator = batting.atBats + batting.walks + batting.sacrificeFlies;
    if (onBaseDenominator > 0) {
      batting.onBasePercentage = (onBaseNumerator / onBaseDenominator).toFixed(3);
    }
    
    // Slugging Percentage (SLG) = Total Bases / At Bats
    if (batting.atBats > 0) {
      batting.sluggingPercentage = (batting.totalBases / batting.atBats).toFixed(3);
    }
    
    // OPS = OBP + SLG
    batting.ops = (parseFloat(batting.onBasePercentage) + parseFloat(batting.sluggingPercentage)).toFixed(3);
  }

  updatePitchingStats(pitcher) {
    const pitching = pitcher.pitching;
    
    // ERA = (Earned Runs * 9) / Innings Pitched
    if (pitching.inningsPitched > 0) {
      pitching.era = ((pitching.earnedRuns * 9) / pitching.inningsPitched).toFixed(2);
    }
    
    // WHIP = (Walks + Hits) / Innings Pitched
    if (pitching.inningsPitched > 0) {
      pitching.whip = ((pitching.walks + pitching.hits) / pitching.inningsPitched).toFixed(2);
    }
    
    // K/BB = Strikeouts / Walks
    if (pitching.walks > 0) {
      pitching.strikeoutToWalkRatio = (pitching.strikeouts / pitching.walks).toFixed(2);
    }
    
    // Pitches Per Inning
    if (pitching.inningsPitched > 0) {
      pitching.pitchesPerInning = (pitching.pitchCount / pitching.inningsPitched).toFixed(1);
    }
  }

  updateFieldingPercentage(fielder) {
    const fielding = fielder.fielding;
    
    // Total Chances = Putouts + Assists + Errors
    fielding.totalChances = fielding.putouts + fielding.assists + fielding.errors;
    
    // Fielding Percentage = (Putouts + Assists) / Total Chances
    if (fielding.totalChances > 0) {
      fielding.fieldingPercentage = ((fielding.putouts + fielding.assists) / fielding.totalChances).toFixed(3);
    }
    
    // Range Factor = (Putouts + Assists) * 9 / Innings Played
    if (fielding.innings > 0) {
      fielding.rangeFactor = ((fielding.putouts + fielding.assists) * 9 / fielding.innings).toFixed(2);
    }
  }

  // Inning management
  advanceInning() {
    if (this.gameStats.topOrBottom === 'top') {
      this.gameStats.topOrBottom = 'bottom';
    } else {
      this.gameStats.topOrBottom = 'top';
      this.gameStats.currentInning++;
    }
    this.gameStats.outs = 0;
  }

  recordOut() {
    this.gameStats.outs++;
    if (this.gameStats.outs >= 3) {
      this.advanceInning();
    }
  }

  // Score management
  addRun(team) {
    this.gameStats.score[team]++;
  }

  // Get game summary
  getGameSummary() {
    return {
      inning: `${this.gameStats.topOrBottom === 'top' ? 'Top' : 'Bottom'} ${this.gameStats.currentInning}`,
      outs: this.gameStats.outs,
      score: { ...this.gameStats.score },
      hits: { ...this.gameStats.hits },
      errors: { ...this.gameStats.errors }
    };
  }

  // Get player leaderboard
  getLeaderboard(stat = 'battingAverage', limit = 10) {
    const players = Array.from(this.playerStats.values());
    
    // Determine which stat category and sort
    let sortedPlayers;
    if (stat.includes('batting') || ['hits', 'homeRuns', 'rbis', 'battingAverage', 'ops'].includes(stat)) {
      sortedPlayers = players
        .filter(p => p.batting.atBats > 0)
        .sort((a, b) => {
          const statPath = stat.includes('.') ? stat.split('.') : ['batting', stat];
          const aVal = statPath.reduce((obj, key) => obj[key], a);
          const bVal = statPath.reduce((obj, key) => obj[key], b);
          return parseFloat(bVal) - parseFloat(aVal);
        });
    } else if (stat.includes('pitching') || ['era', 'strikeouts', 'whip'].includes(stat)) {
      sortedPlayers = players
        .filter(p => p.pitching.inningsPitched > 0)
        .sort((a, b) => {
          const statPath = stat.includes('.') ? stat.split('.') : ['pitching', stat];
          const aVal = statPath.reduce((obj, key) => obj[key], a);
          const bVal = statPath.reduce((obj, key) => obj[key], b);
          // ERA and WHIP are better when lower
          if (stat === 'era' || stat === 'whip') {
            return parseFloat(aVal) - parseFloat(bVal);
          }
          return parseFloat(bVal) - parseFloat(aVal);
        });
    }
    
    return sortedPlayers.slice(0, limit);
  }

  // Export stats for saving
  exportStats() {
    return {
      gameStats: this.gameStats,
      playerStats: Array.from(this.playerStats.entries()),
      teamStats: this.teamStats,
      timestamp: Date.now()
    };
  }

  // Import saved stats
  importStats(data) {
    this.gameStats = data.gameStats;
    this.playerStats = new Map(data.playerStats);
    this.teamStats = data.teamStats;
  }
}

// Export for use in game
export default BaseballStatsTracker;