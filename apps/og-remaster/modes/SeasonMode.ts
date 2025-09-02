/**
 * Blaze Intelligence OG Remaster
 * Season Mode - Full 162-game MLB season
 * Championship journey through the regular season and playoffs
 */

import { MLBTeam } from '../data/MLBDataLoader';
import { GameState } from '../../../packages/rules/gameState';

export interface SeasonGame {
  id: string;
  gameNumber: number;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  played: boolean;
  result?: GameResult;
  isUserGame: boolean;
  isDivisionGame: boolean;
  isRivalryGame: boolean;
}

export interface GameResult {
  homeScore: number;
  awayScore: number;
  innings: number;
  winner: string;
  loser: string;
  winningPitcher?: string;
  losingPitcher?: string;
  save?: string;
  homeRuns?: string[];
  highlights?: string[];
}

export interface TeamStandings {
  teamId: string;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: number;
  streak: string;
  last10: string;
  homeRecord: string;
  awayRecord: string;
  divisionRecord: string;
  runDifferential: number;
}

export interface SeasonStats {
  batting: {
    average: number;
    homeRuns: number;
    rbi: number;
    hits: number;
    doubles: number;
    triples: number;
    stolenBases: number;
    walks: number;
    strikeouts: number;
  };
  pitching: {
    era: number;
    wins: number;
    losses: number;
    saves: number;
    strikeouts: number;
    walks: number;
    whip: number;
    qualityStarts: number;
  };
  team: {
    runsScored: number;
    runsAllowed: number;
    teamAverage: number;
    teamEra: number;
  };
}

export class SeasonMode {
  private userTeam: MLBTeam;
  private schedule: SeasonGame[] = [];
  private standings: Map<string, TeamStandings> = new Map();
  private currentGameIndex: number = 0;
  private seasonStats: SeasonStats;
  private isPlayoffs: boolean = false;
  private playoffBracket?: PlayoffBracket;
  private simulationSpeed: 'game-by-game' | 'daily' | 'weekly' | 'monthly' = 'game-by-game';
  
  constructor(userTeam: MLBTeam) {
    this.userTeam = userTeam;
    this.seasonStats = this.initializeStats();
    console.log(`⚾ Starting new season with ${userTeam.city} ${userTeam.name}`);
  }
  
  public generateSchedule(): void {
    const teams = this.getAllTeams();
    const totalGames = 162;
    let gameId = 0;
    
    // Reset schedule
    this.schedule = [];
    
    // Generate balanced schedule
    const gamesPerTeam = this.calculateGamesPerTeam(teams.length);
    
    // Division games (76 games - 19 games against each of 4 division rivals)
    const divisionRivals = this.getDivisionRivals(this.userTeam.id);
    divisionRivals.forEach(rival => {
      for (let i = 0; i < 19; i++) {
        const isHome = i % 2 === 0;
        this.schedule.push(this.createGame(
          gameId++,
          isHome ? this.userTeam.id : rival,
          isHome ? rival : this.userTeam.id,
          true,
          this.isRivalry(this.userTeam.id, rival)
        ));
      }
    });
    
    // Interleague and other games (86 games)
    const otherTeams = teams.filter(t => 
      !divisionRivals.includes(t) && t !== this.userTeam.id
    );
    
    const gamesPerOther = Math.floor(86 / otherTeams.length);
    otherTeams.forEach(team => {
      for (let i = 0; i < gamesPerOther; i++) {
        const isHome = Math.random() > 0.5;
        this.schedule.push(this.createGame(
          gameId++,
          isHome ? this.userTeam.id : team,
          isHome ? team : this.userTeam.id,
          false,
          false
        ));
      }
    });
    
    // Fill remaining games to reach 162
    while (this.schedule.length < totalGames) {
      const opponent = otherTeams[Math.floor(Math.random() * otherTeams.length)];
      const isHome = Math.random() > 0.5;
      this.schedule.push(this.createGame(
        gameId++,
        isHome ? this.userTeam.id : opponent,
        isHome ? opponent : this.userTeam.id,
        false,
        false
      ));
    }
    
    // Shuffle for realistic distribution
    this.schedule = this.distributeSchedule(this.schedule);
    
    // Assign dates
    this.assignDates();
    
    console.log(`📅 Generated ${this.schedule.length}-game schedule`);
  }
  
  private createGame(
    id: number,
    homeTeam: string,
    awayTeam: string,
    isDivision: boolean,
    isRivalry: boolean
  ): SeasonGame {
    return {
      id: `game_${id}`,
      gameNumber: id + 1,
      date: new Date(), // Will be updated
      homeTeam,
      awayTeam,
      played: false,
      isUserGame: homeTeam === this.userTeam.id || awayTeam === this.userTeam.id,
      isDivisionGame: isDivision,
      isRivalryGame: isRivalry
    };
  }
  
  private distributeSchedule(games: SeasonGame[]): SeasonGame[] {
    // Distribute games throughout the season realistically
    const distributed: SeasonGame[] = [];
    const homeStands: SeasonGame[][] = [];
    const roadTrips: SeasonGame[][] = [];
    
    // Group games into home stands and road trips
    let currentHomeStand: SeasonGame[] = [];
    let currentRoadTrip: SeasonGame[] = [];
    let lastWasHome = false;
    
    games.forEach(game => {
      const isHome = game.homeTeam === this.userTeam.id;
      
      if (isHome) {
        if (!lastWasHome && currentRoadTrip.length > 0) {
          roadTrips.push([...currentRoadTrip]);
          currentRoadTrip = [];
        }
        currentHomeStand.push(game);
        lastWasHome = true;
      } else {
        if (lastWasHome && currentHomeStand.length > 0) {
          homeStands.push([...currentHomeStand]);
          currentHomeStand = [];
        }
        currentRoadTrip.push(game);
        lastWasHome = false;
      }
      
      // Limit stand/trip length to 10 games
      if (currentHomeStand.length >= 10) {
        homeStands.push([...currentHomeStand]);
        currentHomeStand = [];
      }
      if (currentRoadTrip.length >= 10) {
        roadTrips.push([...currentRoadTrip]);
        currentRoadTrip = [];
      }
    });
    
    // Add remaining games
    if (currentHomeStand.length > 0) homeStands.push(currentHomeStand);
    if (currentRoadTrip.length > 0) roadTrips.push(currentRoadTrip);
    
    // Alternate between home and road
    while (homeStands.length > 0 || roadTrips.length > 0) {
      if (homeStands.length > 0) {
        const stand = homeStands.shift()!;
        distributed.push(...stand);
      }
      if (roadTrips.length > 0) {
        const trip = roadTrips.shift()!;
        distributed.push(...trip);
      }
    }
    
    return distributed;
  }
  
  private assignDates(): void {
    const seasonStart = new Date(2025, 3, 1); // April 1st
    const daysInSeason = 180; // 6 months
    
    this.schedule.forEach((game, index) => {
      const dayOffset = Math.floor((index / 162) * daysInSeason);
      const gameDate = new Date(seasonStart);
      gameDate.setDate(gameDate.getDate() + dayOffset);
      
      // No games on specific holidays
      if (this.isHoliday(gameDate)) {
        gameDate.setDate(gameDate.getDate() + 1);
      }
      
      game.date = gameDate;
      game.gameNumber = index + 1;
    });
  }
  
  private isHoliday(date: Date): boolean {
    // Check for major holidays
    const month = date.getMonth();
    const day = date.getDate();
    
    // July 4th
    if (month === 6 && day === 4) return true;
    
    // All-Star Break (mid-July)
    if (month === 6 && day >= 15 && day <= 18) return true;
    
    return false;
  }
  
  private getAllTeams(): string[] {
    // Return all 30 MLB team IDs
    return [
      'angels', 'astros', 'athletics', 'bluejays', 'braves',
      'brewers', 'cardinals', 'cubs', 'diamondbacks', 'dodgers',
      'giants', 'guardians', 'mariners', 'marlins', 'mets',
      'nationals', 'orioles', 'padres', 'phillies', 'pirates',
      'rangers', 'rays', 'reds', 'redsox', 'rockies',
      'royals', 'tigers', 'twins', 'whitesox', 'yankees'
    ];
  }
  
  private getDivisionRivals(teamId: string): string[] {
    // Return division rivals based on team
    const divisions: Record<string, string[]> = {
      'AL East': ['yankees', 'redsox', 'rays', 'orioles', 'bluejays'],
      'AL Central': ['guardians', 'twins', 'whitesox', 'tigers', 'royals'],
      'AL West': ['astros', 'rangers', 'mariners', 'angels', 'athletics'],
      'NL East': ['braves', 'phillies', 'mets', 'marlins', 'nationals'],
      'NL Central': ['brewers', 'cardinals', 'cubs', 'reds', 'pirates'],
      'NL West': ['dodgers', 'padres', 'giants', 'diamondbacks', 'rockies']
    };
    
    for (const [division, teams] of Object.entries(divisions)) {
      if (teams.includes(teamId)) {
        return teams.filter(t => t !== teamId);
      }
    }
    
    return [];
  }
  
  private isRivalry(team1: string, team2: string): boolean {
    const rivalries = [
      ['yankees', 'redsox'],
      ['dodgers', 'giants'],
      ['cardinals', 'cubs'],
      ['yankees', 'mets']
    ];
    
    return rivalries.some(rivalry => 
      (rivalry.includes(team1) && rivalry.includes(team2))
    );
  }
  
  private calculateGamesPerTeam(totalTeams: number): Map<string, number> {
    const gamesPerTeam = new Map<string, number>();
    // Implementation would calculate balanced schedule
    return gamesPerTeam;
  }
  
  public async playNextGame(): Promise<GameResult | null> {
    if (this.currentGameIndex >= this.schedule.length) {
      console.log('Season complete! Moving to playoffs...');
      this.startPlayoffs();
      return null;
    }
    
    const game = this.schedule[this.currentGameIndex];
    
    if (game.isUserGame) {
      // User plays this game
      console.log(`🎮 Your game: ${game.awayTeam} @ ${game.homeTeam}`);
      return null; // Game will be played by user
    } else {
      // Simulate CPU game
      const result = this.simulateGame(game);
      game.played = true;
      game.result = result;
      
      // Update standings
      this.updateStandings(game);
      
      this.currentGameIndex++;
      return result;
    }
  }
  
  private simulateGame(game: SeasonGame): GameResult {
    // Simple simulation based on team ratings
    const homeScore = Math.floor(Math.random() * 10) + 1;
    const awayScore = Math.floor(Math.random() * 10) + 1;
    
    return {
      homeScore,
      awayScore,
      innings: homeScore === awayScore ? 10 + Math.floor(Math.random() * 3) : 9,
      winner: homeScore > awayScore ? game.homeTeam : game.awayTeam,
      loser: homeScore > awayScore ? game.awayTeam : game.homeTeam,
      homeRuns: this.generateHomeRuns(homeScore, awayScore)
    };
  }
  
  private generateHomeRuns(homeScore: number, awayScore: number): string[] {
    const hrs: string[] = [];
    const totalHRs = Math.floor((homeScore + awayScore) / 5);
    
    for (let i = 0; i < totalHRs; i++) {
      hrs.push(`Player ${i + 1} (${Math.floor(Math.random() * 9) + 1}th)`);
    }
    
    return hrs;
  }
  
  public simulateToDate(targetDate: Date): void {
    let gamesSimulated = 0;
    
    while (this.currentGameIndex < this.schedule.length) {
      const game = this.schedule[this.currentGameIndex];
      
      if (game.date > targetDate) break;
      if (game.isUserGame) break; // Stop at user games
      
      const result = this.simulateGame(game);
      game.played = true;
      game.result = result;
      this.updateStandings(game);
      
      this.currentGameIndex++;
      gamesSimulated++;
    }
    
    console.log(`📊 Simulated ${gamesSimulated} games`);
  }
  
  private updateStandings(game: SeasonGame): void {
    if (!game.result) return;
    
    const winner = game.result.winner;
    const loser = game.result.loser;
    
    // Update winner
    let winnerStanding = this.standings.get(winner);
    if (!winnerStanding) {
      winnerStanding = this.createEmptyStanding(winner);
    }
    winnerStanding.wins++;
    this.standings.set(winner, winnerStanding);
    
    // Update loser
    let loserStanding = this.standings.get(loser);
    if (!loserStanding) {
      loserStanding = this.createEmptyStanding(loser);
    }
    loserStanding.losses++;
    this.standings.set(loser, loserStanding);
    
    // Recalculate standings
    this.recalculateStandings();
  }
  
  private createEmptyStanding(teamId: string): TeamStandings {
    return {
      teamId,
      wins: 0,
      losses: 0,
      winPercentage: 0,
      gamesBack: 0,
      streak: 'W0',
      last10: '0-0',
      homeRecord: '0-0',
      awayRecord: '0-0',
      divisionRecord: '0-0',
      runDifferential: 0
    };
  }
  
  private recalculateStandings(): void {
    // Calculate win percentages and games back
    this.standings.forEach(standing => {
      standing.winPercentage = standing.wins / (standing.wins + standing.losses) || 0;
    });
    
    // Sort by division and calculate games back
    const divisions = this.groupByDivision();
    
    divisions.forEach(divisionTeams => {
      const sorted = Array.from(divisionTeams)
        .sort((a, b) => b[1].winPercentage - a[1].winPercentage);
      
      if (sorted.length > 0) {
        const leader = sorted[0][1];
        
        sorted.forEach(([teamId, standing]) => {
          const gb = ((leader.wins - standing.wins) + (standing.losses - leader.losses)) / 2;
          standing.gamesBack = gb;
        });
      }
    });
  }
  
  private groupByDivision(): Map<string, TeamStandings>[] {
    // Group standings by division
    // This is simplified - would need actual division data
    return [this.standings];
  }
  
  private initializeStats(): SeasonStats {
    return {
      batting: {
        average: 0,
        homeRuns: 0,
        rbi: 0,
        hits: 0,
        doubles: 0,
        triples: 0,
        stolenBases: 0,
        walks: 0,
        strikeouts: 0
      },
      pitching: {
        era: 0,
        wins: 0,
        losses: 0,
        saves: 0,
        strikeouts: 0,
        walks: 0,
        whip: 0,
        qualityStarts: 0
      },
      team: {
        runsScored: 0,
        runsAllowed: 0,
        teamAverage: 0,
        teamEra: 0
      }
    };
  }
  
  public updateGameResult(game: SeasonGame, result: GameResult): void {
    game.played = true;
    game.result = result;
    
    // Update standings
    this.updateStandings(game);
    
    // Update season stats
    this.updateSeasonStats(result);
    
    // Move to next game
    this.currentGameIndex++;
    
    // Check for milestones
    this.checkMilestones();
  }
  
  private updateSeasonStats(result: GameResult): void {
    // Update cumulative season statistics
    if (result.winner === this.userTeam.id) {
      this.seasonStats.pitching.wins++;
    } else {
      this.seasonStats.pitching.losses++;
    }
    
    // Update team stats
    const isHome = result.winner === this.userTeam.id;
    this.seasonStats.team.runsScored += isHome ? result.homeScore : result.awayScore;
    this.seasonStats.team.runsAllowed += isHome ? result.awayScore : result.homeScore;
  }
  
  private checkMilestones(): void {
    const standing = this.standings.get(this.userTeam.id);
    if (!standing) return;
    
    // Check for milestone wins
    if (standing.wins === 50) {
      console.log('🎉 50 wins! Great season so far!');
    }
    if (standing.wins === 90) {
      console.log('🏆 90 wins! Playoff bound!');
    }
    if (standing.wins === 100) {
      console.log('💯 100 wins! Historic season!');
    }
  }
  
  private startPlayoffs(): void {
    this.isPlayoffs = true;
    console.log('🏆 Playoffs begin!');
    
    // Create playoff bracket
    this.playoffBracket = new PlayoffBracket(this.standings);
  }
  
  public getStandings(): TeamStandings[] {
    return Array.from(this.standings.values())
      .sort((a, b) => b.winPercentage - a.winPercentage);
  }
  
  public getCurrentGame(): SeasonGame | null {
    if (this.currentGameIndex >= this.schedule.length) return null;
    return this.schedule[this.currentGameIndex];
  }
  
  public getUpcomingGames(count: number = 5): SeasonGame[] {
    return this.schedule.slice(this.currentGameIndex, this.currentGameIndex + count);
  }
  
  public getSeasonProgress(): number {
    return (this.currentGameIndex / this.schedule.length) * 100;
  }
  
  public getSeasonSummary(): any {
    const standing = this.standings.get(this.userTeam.id) || this.createEmptyStanding(this.userTeam.id);
    
    return {
      gamesPlayed: this.currentGameIndex,
      gamesRemaining: this.schedule.length - this.currentGameIndex,
      record: `${standing.wins}-${standing.losses}`,
      winPercentage: standing.winPercentage,
      gamesBack: standing.gamesBack,
      playoffPosition: this.getPlayoffPosition(),
      stats: this.seasonStats
    };
  }
  
  private getPlayoffPosition(): string {
    const standing = this.standings.get(this.userTeam.id);
    if (!standing) return 'Out of playoffs';
    
    const divisionStandings = this.getStandings();
    const position = divisionStandings.findIndex(s => s.teamId === this.userTeam.id) + 1;
    
    if (position === 1) return 'Division Leader';
    if (position <= 5) return `Wild Card #${position - 1}`;
    return 'Out of playoffs';
  }
}

class PlayoffBracket {
  private rounds: any[] = [];
  
  constructor(standings: Map<string, TeamStandings>) {
    this.generateBracket(standings);
  }
  
  private generateBracket(standings: Map<string, TeamStandings>): void {
    // Generate playoff bracket based on final standings
    // Wild Card -> Division Series -> Championship Series -> World Series
    console.log('Generating playoff bracket...');
  }
}