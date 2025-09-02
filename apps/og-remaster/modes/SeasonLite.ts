/**
 * Season-Lite Mode
 * Mini championship tournament with playoffs
 */

import type { GameState } from '../../../packages/rules/gameState';

interface Team {
  name: string;
  players: string[];
  colors: string[];
  mascot: string;
  record: { wins: number; losses: number };
  runsFor: number;
  runsAgainst: number;
  stats: {
    homeruns: number;
    strikeouts: number;
    errors: number;
  };
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  completed: boolean;
  winner?: string;
  inning?: number;
}

interface Season {
  teams: Team[];
  schedule: Game[];
  currentWeek: number;
  playoffs: {
    bracket: Game[];
    completed: boolean;
    champion?: string;
  };
}

export class SeasonLiteMode {
  private gameState: GameState;
  private season: Season;
  private currentGame: Game | null = null;
  
  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.season = this.createSeason();
  }

  private createSeason(): Season {
    // Create 4 teams for a compact season
    const teams: Team[] = [
      {
        name: "Texas Legends",
        players: ["Ace", "Blaze", "Sage"],
        colors: ["burnt-orange"],
        mascot: "Longhorn",
        record: { wins: 0, losses: 0 },
        runsFor: 0,
        runsAgainst: 0,
        stats: { homeruns: 0, strikeouts: 0, errors: 0 }
      },
      {
        name: "Cardinal Scouts",
        players: ["Skye", "Scout", "Storm"],
        colors: ["sky-blue"],
        mascot: "Redbird",
        record: { wins: 0, losses: 0 },
        runsFor: 0,
        runsAgainst: 0,
        stats: { homeruns: 0, strikeouts: 0, errors: 0 }
      },
      {
        name: "Tennessee Titans",
        players: ["Tex", "Ranger", "Ridge"],
        colors: ["navy"],
        mascot: "Titan",
        record: { wins: 0, losses: 0 },
        runsFor: 0,
        runsAgainst: 0,
        stats: { homeruns: 0, strikeouts: 0, errors: 0 }
      },
      {
        name: "Pacific Grizzlies",
        players: ["Nova", "River", "Bay"],
        colors: ["teal"],
        mascot: "Grizzly Bear",
        record: { wins: 0, losses: 0 },
        runsFor: 0,
        runsAgainst: 0,
        stats: { homeruns: 0, strikeouts: 0, errors: 0 }
      }
    ];

    // Generate schedule: each team plays each other team twice (6 games per team)
    const schedule = this.generateSchedule(teams);

    return {
      teams,
      schedule,
      currentWeek: 1,
      playoffs: {
        bracket: [],
        completed: false
      }
    };
  }

  private generateSchedule(teams: Team[]): Game[] {
    const schedule: Game[] = [];
    let gameId = 1;

    // Round robin: each team plays each other team twice
    for (let week = 1; week <= 3; week++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const home = week % 2 === 1 ? teams[i] : teams[j];
          const away = week % 2 === 1 ? teams[j] : teams[i];
          
          schedule.push({
            id: `game_${gameId++}`,
            homeTeam: home.name,
            awayTeam: away.name,
            completed: false
          });
        }
      }
    }

    // Shuffle schedule for variety
    schedule.sort(() => Math.random() - 0.5);
    
    return schedule;
  }

  startSeason(): void {
    console.log('🏆 Starting Season-Lite Championship!');
    console.log(`⚾ ${this.season.teams.length} teams competing`);
    console.log(`📅 ${this.season.schedule.length} regular season games`);
    console.log(`🏟️ Top 2 teams advance to Championship Game`);
    
    this.displaySchedule();
  }

  private displaySchedule(): void {
    console.log('\n📅 SEASON SCHEDULE:');
    this.season.schedule.forEach((game, index) => {
      const status = game.completed ? '✅' : '⏳';
      console.log(`   ${status} Game ${index + 1}: ${game.awayTeam} @ ${game.homeTeam}`);
    });
  }

  // Play next game in schedule
  playNextGame(): Game | null {
    const nextGame = this.season.schedule.find(game => !game.completed);
    if (!nextGame) {
      console.log('🏁 Regular season complete!');
      this.setupPlayoffs();
      return null;
    }

    this.currentGame = nextGame;
    console.log(`🚀 Starting Game: ${nextGame.awayTeam} @ ${nextGame.homeTeam}`);
    
    return nextGame;
  }

  // Start a specific game
  startGame(gameId: string): boolean {
    const game = this.season.schedule.find(g => g.id === gameId);
    if (!game || game.completed) return false;

    this.currentGame = game;
    
    // Set up game state
    this.gameState = new GameState({
      inning: 1,
      topHalf: true,
      balls: 0,
      strikes: 0,
      outs: 0,
      homeScore: 0,
      awayScore: 0,
      basesOccupied: { first: false, second: false, third: false },
      gamePhase: 'active' as const
    });

    console.log(`⚾ Game started: ${game.awayTeam} @ ${game.homeTeam}`);
    return true;
  }

  // Complete the current game
  completeCurrentGame(homeScore: number, awayScore: number): void {
    if (!this.currentGame) return;

    this.currentGame.homeScore = homeScore;
    this.currentGame.awayScore = awayScore;
    this.currentGame.completed = true;
    this.currentGame.winner = homeScore > awayScore ? this.currentGame.homeTeam : this.currentGame.awayTeam;

    // Update team records
    this.updateTeamStats(this.currentGame.homeTeam, homeScore, awayScore, homeScore > awayScore);
    this.updateTeamStats(this.currentGame.awayTeam, awayScore, homeScore, awayScore > homeScore);

    console.log(`🏁 FINAL: ${this.currentGame.awayTeam} ${awayScore} - ${this.currentGame.homeTeam} ${homeScore}`);
    console.log(`🏆 Winner: ${this.currentGame.winner}`);

    this.currentGame = null;
    this.displayStandings();
  }

  private updateTeamStats(teamName: string, runsFor: number, runsAgainst: number, won: boolean): void {
    const team = this.season.teams.find(t => t.name === teamName);
    if (!team) return;

    if (won) {
      team.record.wins++;
    } else {
      team.record.losses++;
    }

    team.runsFor += runsFor;
    team.runsAgainst += runsAgainst;
  }

  private displayStandings(): void {
    const standings = [...this.season.teams]
      .sort((a, b) => {
        const aWinPct = a.record.wins / (a.record.wins + a.record.losses) || 0;
        const bWinPct = b.record.wins / (b.record.wins + b.record.losses) || 0;
        
        if (aWinPct !== bWinPct) return bWinPct - aWinPct;
        
        // Tiebreaker: run differential
        const aDiff = a.runsFor - a.runsAgainst;
        const bDiff = b.runsFor - b.runsAgainst;
        return bDiff - aDiff;
      });

    console.log('\n🏆 CURRENT STANDINGS:');
    console.log('   Team                 W   L   Pct   RS   RA   Diff');
    console.log('   ─────────────────────────────────────────────────');
    
    standings.forEach((team, index) => {
      const winPct = team.record.wins / (team.record.wins + team.record.losses) || 0;
      const diff = team.runsFor - team.runsAgainst;
      const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
      
      const playoffIndicator = index < 2 ? '*' : ' ';
      
      console.log(
        `${playoffIndicator}  ${team.name.padEnd(18)} ${team.record.wins.toString().padStart(2)} ` +
        `${team.record.losses.toString().padStart(3)} ${winPct.toFixed(3).padStart(5)} ` +
        `${team.runsFor.toString().padStart(3)} ${team.runsAgainst.toString().padStart(4)} ${diffStr.padStart(6)}`
      );
    });
    
    console.log('   * - Playoff eligible');
  }

  private setupPlayoffs(): void {
    const standings = [...this.season.teams]
      .sort((a, b) => {
        const aWinPct = a.record.wins / (a.record.wins + a.record.losses) || 0;
        const bWinPct = b.record.wins / (b.record.wins + b.record.losses) || 0;
        
        if (aWinPct !== bWinPct) return bWinPct - aWinPct;
        
        const aDiff = a.runsFor - a.runsAgainst;
        const bDiff = b.runsFor - b.runsAgainst;
        return bDiff - aDiff;
      });

    // Top 2 teams make the championship game
    const topTwo = standings.slice(0, 2);
    
    const championshipGame: Game = {
      id: 'championship',
      homeTeam: topTwo[0].name, // Better record gets home field
      awayTeam: topTwo[1].name,
      completed: false
    };

    this.season.playoffs.bracket = [championshipGame];
    
    console.log('\n🏆 PLAYOFFS SET!');
    console.log(`🥇 Championship Game: ${championshipGame.awayTeam} @ ${championshipGame.homeTeam}`);
    console.log(`🏟️ Home field advantage: ${championshipGame.homeTeam}`);
  }

  // Play championship game
  playChampionshipGame(): Game | null {
    if (this.season.playoffs.bracket.length === 0) {
      console.log('❌ Playoffs not yet available');
      return null;
    }

    const championshipGame = this.season.playoffs.bracket[0];
    this.currentGame = championshipGame;
    
    console.log('🏆 CHAMPIONSHIP GAME STARTING!');
    console.log(`⚾ ${championshipGame.awayTeam} @ ${championshipGame.homeTeam}`);
    
    // Championship games are full 9 innings
    this.gameState = new GameState({
      inning: 1,
      topHalf: true,
      balls: 0,
      strikes: 0,
      outs: 0,
      homeScore: 0,
      awayScore: 0,
      basesOccupied: { first: false, second: false, third: false },
      gamePhase: 'active' as const
    });

    (this.gameState as any).maxInnings = 9; // Full game
    (this.gameState as any).isChampionship = true;

    return championshipGame;
  }

  completeChampionshipGame(homeScore: number, awayScore: number): void {
    if (!this.currentGame || this.currentGame.id !== 'championship') return;

    this.currentGame.homeScore = homeScore;
    this.currentGame.awayScore = awayScore;
    this.currentGame.completed = true;
    this.currentGame.winner = homeScore > awayScore ? this.currentGame.homeTeam : this.currentGame.awayTeam;

    this.season.playoffs.completed = true;
    this.season.playoffs.champion = this.currentGame.winner;

    console.log('\n🏆 CHAMPIONSHIP GAME COMPLETE!');
    console.log(`🏁 FINAL: ${this.currentGame.awayTeam} ${awayScore} - ${this.currentGame.homeTeam} ${homeScore}`);
    console.log(`👑 SEASON CHAMPION: ${this.currentGame.winner}!`);
    
    this.displaySeasonSummary();
  }

  private displaySeasonSummary(): void {
    console.log('\n🏆 SEASON-LITE CHAMPIONSHIP COMPLETE!');
    console.log(`👑 Champion: ${this.season.playoffs.champion}`);
    console.log('\n📊 FINAL STANDINGS:');
    
    this.displayStandings();
    
    console.log('\n🎯 SEASON STATS:');
    this.season.teams.forEach(team => {
      const gamesPlayed = team.record.wins + team.record.losses;
      const winPct = gamesPlayed > 0 ? (team.record.wins / gamesPlayed) : 0;
      
      console.log(`${team.name}:`);
      console.log(`   Record: ${team.record.wins}-${team.record.losses} (${winPct.toFixed(3)})`);
      console.log(`   Runs: ${team.runsFor} for, ${team.runsAgainst} against`);
      console.log(`   Run Differential: ${team.runsFor - team.runsAgainst >= 0 ? '+' : ''}${team.runsFor - team.runsAgainst}`);
    });
  }

  // Getters
  getCurrentGame(): Game | null {
    return this.currentGame;
  }

  getSchedule(): Game[] {
    return this.season.schedule;
  }

  getStandings(): Team[] {
    return [...this.season.teams].sort((a, b) => {
      const aWinPct = a.record.wins / (a.record.wins + a.record.losses) || 0;
      const bWinPct = b.record.wins / (b.record.wins + b.record.losses) || 0;
      
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      
      const aDiff = a.runsFor - a.runsAgainst;
      const bDiff = b.runsFor - b.runsAgainst;
      return bDiff - aDiff;
    });
  }

  isRegularSeasonComplete(): boolean {
    return this.season.schedule.every(game => game.completed);
  }

  isPlayoffsAvailable(): boolean {
    return this.isRegularSeasonComplete() && this.season.playoffs.bracket.length > 0;
  }

  isSeasonComplete(): boolean {
    return this.season.playoffs.completed;
  }

  getChampion(): string | null {
    return this.season.playoffs.champion || null;
  }

  // Simulate remaining games (for AI/auto-play)
  simulateRemainingGames(): void {
    const remainingGames = this.season.schedule.filter(game => !game.completed);
    
    console.log(`🤖 Simulating ${remainingGames.length} remaining games...`);
    
    remainingGames.forEach(game => {
      // Simple simulation based on random with slight home field advantage
      const homeAdvantage = 0.55;
      const homeWins = Math.random() < homeAdvantage;
      
      const homeScore = Math.floor(Math.random() * 8) + 1;
      const awayScore = homeWins ? 
        Math.max(0, homeScore - Math.floor(Math.random() * 3) - 1) :
        homeScore + Math.floor(Math.random() * 3) + 1;
      
      game.homeScore = homeScore;
      game.awayScore = awayScore;
      game.completed = true;
      game.winner = homeScore > awayScore ? game.homeTeam : game.awayTeam;
      
      this.updateTeamStats(game.homeTeam, homeScore, awayScore, homeScore > awayScore);
      this.updateTeamStats(game.awayTeam, awayScore, homeScore, awayScore > homeScore);
    });
    
    console.log('✅ Simulation complete!');
    this.displayStandings();
    
    if (this.isRegularSeasonComplete()) {
      this.setupPlayoffs();
    }
  }
}