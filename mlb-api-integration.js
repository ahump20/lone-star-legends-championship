/**
 * MLB Stats API Integration Module
 * Fetches real MLB data for realistic gameplay
 * API Documentation: https://statsapi.mlb.com/docs/
 */

export class MLBApiIntegration {
  constructor() {
    this.baseUrl = 'https://statsapi.mlb.com/api/v1';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch data with caching
   */
  async fetchWithCache(url, cacheKey) {
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('MLB API fetch error:', error);
      return null;
    }
  }

  /**
   * Get current season schedule
   */
  async getSchedule(date = new Date().toISOString().split('T')[0]) {
    const url = `${this.baseUrl}/schedule?sportId=1&date=${date}`;
    return this.fetchWithCache(url, `schedule_${date}`);
  }

  /**
   * Get team information
   */
  async getTeam(teamId) {
    const url = `${this.baseUrl}/teams/${teamId}`;
    return this.fetchWithCache(url, `team_${teamId}`);
  }

  /**
   * Get all teams
   */
  async getAllTeams() {
    const url = `${this.baseUrl}/teams?sportId=1`;
    return this.fetchWithCache(url, 'all_teams');
  }

  /**
   * Get player information
   */
  async getPlayer(playerId) {
    const url = `${this.baseUrl}/people/${playerId}`;
    return this.fetchWithCache(url, `player_${playerId}`);
  }

  /**
   * Get player stats for current season
   */
  async getPlayerStats(playerId, season = new Date().getFullYear()) {
    const url = `${this.baseUrl}/people/${playerId}/stats?stats=season&season=${season}&group=hitting,pitching`;
    return this.fetchWithCache(url, `player_stats_${playerId}_${season}`);
  }

  /**
   * Get live game data
   */
  async getLiveGameData(gameId) {
    const url = `${this.baseUrl}/game/${gameId}/feed/live`;
    // Don't cache live data for too long
    const oldTimeout = this.cacheTimeout;
    this.cacheTimeout = 10000; // 10 seconds for live data
    const data = await this.fetchWithCache(url, `live_game_${gameId}`);
    this.cacheTimeout = oldTimeout;
    return data;
  }

  /**
   * Get game boxscore
   */
  async getBoxscore(gameId) {
    const url = `${this.baseUrl}/game/${gameId}/boxscore`;
    return this.fetchWithCache(url, `boxscore_${gameId}`);
  }

  /**
   * Get standings
   */
  async getStandings(leagueId = 103) { // 103 = American League, 104 = National League
    const url = `${this.baseUrl}/standings?leagueId=${leagueId}`;
    return this.fetchWithCache(url, `standings_${leagueId}`);
  }

  /**
   * Search for players by name
   */
  async searchPlayers(name) {
    const url = `${this.baseUrl}/people/search?names=${encodeURIComponent(name)}`;
    return this.fetchWithCache(url, `search_${name}`);
  }

  /**
   * Get team roster
   */
  async getTeamRoster(teamId) {
    const url = `${this.baseUrl}/teams/${teamId}/roster/active`;
    return this.fetchWithCache(url, `roster_${teamId}`);
  }

  /**
   * Convert MLB player stats to game format
   */
  convertPlayerToGameFormat(mlbPlayer, stats) {
    const batting = stats?.hitting || {};
    const pitching = stats?.pitching || {};
    
    return {
      id: mlbPlayer.id,
      name: mlbPlayer.fullName,
      number: mlbPlayer.primaryNumber || 0,
      position: mlbPlayer.primaryPosition?.abbreviation || 'DH',
      team: mlbPlayer.currentTeam?.name || 'Free Agent',
      
      battingStats: {
        average: batting.avg || '.000',
        homeRuns: batting.homeRuns || 0,
        rbi: batting.rbi || 0,
        ops: batting.ops || '.000',
        strikeouts: batting.strikeOuts || 0,
        walks: batting.baseOnBalls || 0,
        hits: batting.hits || 0,
        doubles: batting.doubles || 0,
        triples: batting.triples || 0,
        stolenBases: batting.stolenBases || 0
      },
      
      pitchingStats: {
        era: pitching.era || '0.00',
        wins: pitching.wins || 0,
        losses: pitching.losses || 0,
        saves: pitching.saves || 0,
        strikeouts: pitching.strikeOuts || 0,
        walks: pitching.baseOnBalls || 0,
        whip: pitching.whip || '0.00',
        inningsPitched: pitching.inningsPitched || '0.0'
      },
      
      // Game attributes derived from stats
      power: this.calculatePowerRating(batting),
      contact: this.calculateContactRating(batting),
      speed: this.calculateSpeedRating(mlbPlayer, batting),
      pitchVelocity: this.calculatePitchVelocity(pitching),
      pitchControl: this.calculatePitchControl(pitching)
    };
  }

  /**
   * Calculate power rating from stats (0-100)
   */
  calculatePowerRating(batting) {
    if (!batting.homeRuns) return 50;
    
    // Based on HRs and slugging percentage
    const hrScore = Math.min(batting.homeRuns / 40 * 100, 100);
    const slgScore = (parseFloat(batting.sluggingPct || 0) / 0.6) * 100;
    
    return Math.round((hrScore + slgScore) / 2);
  }

  /**
   * Calculate contact rating from stats (0-100)
   */
  calculateContactRating(batting) {
    if (!batting.avg) return 50;
    
    // Based on batting average and strikeout rate
    const avgScore = (parseFloat(batting.avg || 0) / 0.350) * 100;
    const kRate = batting.strikeOuts / (batting.atBats || 1);
    const kScore = (1 - kRate) * 100;
    
    return Math.round((avgScore + kScore) / 2);
  }

  /**
   * Calculate speed rating (0-100)
   */
  calculateSpeedRating(player, batting) {
    // Base on stolen bases and position
    const sbScore = Math.min((batting.stolenBases || 0) / 30 * 100, 100);
    
    // Adjust for position (catchers slower, CF faster)
    let positionBonus = 0;
    switch(player.primaryPosition?.abbreviation) {
      case 'CF': positionBonus = 10; break;
      case 'SS': positionBonus = 5; break;
      case '2B': positionBonus = 5; break;
      case 'C': positionBonus = -10; break;
      case '1B': positionBonus = -5; break;
    }
    
    return Math.max(0, Math.min(100, sbScore + positionBonus + 50));
  }

  /**
   * Calculate pitch velocity based on stats
   */
  calculatePitchVelocity(pitching) {
    // Estimate based on K rate
    const kPer9 = (pitching.strikeOuts || 0) / (parseFloat(pitching.inningsPitched || 1) / 9);
    
    // Map K/9 to velocity (rough estimate)
    if (kPer9 > 10) return 95;
    if (kPer9 > 8) return 92;
    if (kPer9 > 6) return 90;
    return 88;
  }

  /**
   * Calculate pitch control rating
   */
  calculatePitchControl(pitching) {
    if (!pitching.whip) return 50;
    
    // Based on WHIP and walk rate
    const whipScore = Math.max(0, (2 - parseFloat(pitching.whip || 2)) / 2 * 100);
    const bbPer9 = (pitching.baseOnBalls || 0) / (parseFloat(pitching.inningsPitched || 1) / 9);
    const bbScore = Math.max(0, (5 - bbPer9) / 5 * 100);
    
    return Math.round((whipScore + bbScore) / 2);
  }

  /**
   * Load a real MLB team's roster for the game
   */
  async loadMLBTeam(teamId) {
    try {
      const roster = await this.getTeamRoster(teamId);
      const team = await this.getTeam(teamId);
      
      const players = [];
      
      for (const rosterEntry of roster.roster || []) {
        const playerId = rosterEntry.person.id;
        const playerData = await this.getPlayer(playerId);
        const playerStats = await this.getPlayerStats(playerId);
        
        const gamePlayer = this.convertPlayerToGameFormat(
          playerData.people[0],
          playerStats.stats[0]?.splits[0]?.stat
        );
        
        players.push(gamePlayer);
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return {
        teamName: team.teams[0].name,
        teamId: team.teams[0].id,
        players: players
      };
    } catch (error) {
      console.error('Error loading MLB team:', error);
      return null;
    }
  }

  /**
   * Get today's games
   */
  async getTodaysGames() {
    const schedule = await this.getSchedule();
    
    if (!schedule || !schedule.dates || schedule.dates.length === 0) {
      return [];
    }
    
    const games = schedule.dates[0].games || [];
    
    return games.map(game => ({
      gameId: game.gamePk,
      status: game.status.detailedState,
      homeTeam: {
        id: game.teams.home.team.id,
        name: game.teams.home.team.name,
        score: game.teams.home.score || 0
      },
      awayTeam: {
        id: game.teams.away.team.id,
        name: game.teams.away.team.name,
        score: game.teams.away.score || 0
      },
      venue: game.venue.name,
      startTime: game.gameDate
    }));
  }

  /**
   * Get historical game data for simulation training
   */
  async getHistoricalGame(gameId) {
    const gameData = await this.getLiveGameData(gameId);
    
    if (!gameData) return null;
    
    // Extract play-by-play data
    const plays = gameData.liveData?.plays?.allPlays || [];
    
    return {
      gameId: gameId,
      plays: plays.map(play => ({
        description: play.result?.description,
        type: play.result?.type,
        pitcher: play.matchup?.pitcher,
        batter: play.matchup?.batter,
        balls: play.count?.balls,
        strikes: play.count?.strikes,
        outs: play.count?.outs,
        runners: play.runners || []
      })),
      finalScore: {
        home: gameData.liveData?.linescore?.teams?.home?.runs,
        away: gameData.liveData?.linescore?.teams?.away?.runs
      }
    };
  }
}

// Singleton instance
let mlbApiInstance = null;

export function getMLBApi() {
  if (!mlbApiInstance) {
    mlbApiInstance = new MLBApiIntegration();
  }
  return mlbApiInstance;
}

// Export default instance
export default MLBApiIntegration;