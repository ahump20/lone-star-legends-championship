/**
 * Championship Tournament Mode
 * Single-elimination and double-elimination brackets
 */

import type { GameState } from '../../../packages/rules/gameState';
import { BlazeAI } from '../ai/BlazeAI';

interface Team {
  id: string;
  name: string;
  seed: number;
  players: string[];
  colors: string[];
  mascot: string;
  stats: {
    wins: number;
    losses: number;
    runsFor: number;
    runsAgainst: number;
    championships: number;
  };
  ai?: BlazeAI;
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  score: { team1: number; team2: number };
  status: 'pending' | 'in_progress' | 'completed';
  startTime?: number;
  endTime?: number;
  highlights?: Highlight[];
}

interface Highlight {
  inning: number;
  description: string;
  importance: number; // 1-10
  timestamp: number;
}

interface Bracket {
  id: string;
  name: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  teams: Team[];
  matches: Match[][];  // Organized by rounds
  champion: Team | null;
  runnerUp: Team | null;
  thirdPlace: Team | null;
  startDate: number;
  endDate?: number;
  currentRound: number;
  totalRounds: number;
}

interface TournamentSettings {
  name: string;
  type: Bracket['type'];
  teamCount: 4 | 8 | 16 | 32;
  difficulty: 'rookie' | 'amateur' | 'pro' | 'allstar' | 'legend';
  innings: 3 | 6 | 9;
  mercyRule: boolean;
  mercyRunDiff: number;
  wildcardSlots: number;
  doubleElimination: boolean;
  thirdPlaceGame: boolean;
  customRules: {
    ghostRunners: boolean;
    unlimitedSubs: boolean;
    designatedHitter: boolean;
    extraInningTiebreaker: boolean;
  };
}

export class TournamentMode {
  private bracket: Bracket;
  private currentMatch: Match | null = null;
  private gameState: GameState;
  private settings: TournamentSettings;
  private tournamentHistory: Bracket[] = [];
  private playerTeam: Team | null = null;

  constructor(gameState: GameState, settings: TournamentSettings) {
    this.gameState = gameState;
    this.settings = settings;
    this.bracket = this.createBracket();
  }

  private createBracket(): Bracket {
    const teams = this.generateTeams();
    const seededTeams = this.seedTeams(teams);
    const matches = this.generateMatches(seededTeams);

    return {
      id: `tournament_${Date.now()}`,
      name: this.settings.name,
      type: this.settings.type,
      teams: seededTeams,
      matches,
      champion: null,
      runnerUp: null,
      thirdPlace: null,
      startDate: Date.now(),
      currentRound: 1,
      totalRounds: this.calculateTotalRounds()
    };
  }

  private generateTeams(): Team[] {
    const teams: Team[] = [];
    const teamTemplates = [
      { name: "Texas Legends", colors: ["burnt-orange"], mascot: "Longhorn" },
      { name: "Cardinal Scouts", colors: ["sky-blue"], mascot: "Redbird" },
      { name: "Tennessee Titans", colors: ["navy"], mascot: "Titan" },
      { name: "Pacific Grizzlies", colors: ["teal"], mascot: "Grizzly" },
      { name: "Desert Hawks", colors: ["sand"], mascot: "Hawk" },
      { name: "Mountain Lions", colors: ["purple"], mascot: "Lion" },
      { name: "River Rats", colors: ["green"], mascot: "Rat" },
      { name: "Storm Chasers", colors: ["gray"], mascot: "Tornado" },
      { name: "Fire Ants", colors: ["red"], mascot: "Ant" },
      { name: "Ice Wolves", colors: ["ice-blue"], mascot: "Wolf" },
      { name: "Thunder Bolts", colors: ["yellow"], mascot: "Lightning" },
      { name: "Wind Riders", colors: ["white"], mascot: "Eagle" },
      { name: "Rock Crushers", colors: ["brown"], mascot: "Boulder" },
      { name: "Wave Runners", colors: ["aqua"], mascot: "Dolphin" },
      { name: "Sky Pilots", colors: ["light-blue"], mascot: "Jet" },
      { name: "Ground Pounders", colors: ["dark-green"], mascot: "Rhino" }
    ];

    for (let i = 0; i < this.settings.teamCount; i++) {
      const template = teamTemplates[i % teamTemplates.length];
      const team: Team = {
        id: `team_${i}`,
        name: template.name,
        seed: 0, // Will be set by seeding
        players: this.generatePlayers(template.name),
        colors: template.colors,
        mascot: template.mascot,
        stats: {
          wins: 0,
          losses: 0,
          runsFor: 0,
          runsAgainst: 0,
          championships: Math.floor(Math.random() * 3) // Random past championships
        }
      };

      // Add AI for computer-controlled teams
      if (i > 0) { // Assuming first team is player-controlled
        const aiDifficulty = this.getAIDifficulty();
        team.ai = new BlazeAI(aiDifficulty, this.gameState);
      }

      teams.push(team);
    }

    return teams;
  }

  private generatePlayers(teamName: string): string[] {
    // Generate roster of player names
    const firstNames = ['Mike', 'Jake', 'Alex', 'Sam', 'Chris', 'Pat', 'Jordan', 'Casey'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Wilson', 'Moore'];
    
    const players: string[] = [];
    for (let i = 0; i < 9; i++) {
      const first = firstNames[Math.floor(Math.random() * firstNames.length)];
      const last = lastNames[Math.floor(Math.random() * lastNames.length)];
      players.push(`${first} ${last}`);
    }

    return players;
  }

  private getAIDifficulty(): any {
    switch (this.settings.difficulty) {
      case 'rookie':
        return BlazeAI.DIFFICULTIES.ROOKIE;
      case 'amateur':
        return BlazeAI.DIFFICULTIES.AMATEUR;
      case 'pro':
        return BlazeAI.DIFFICULTIES.PRO;
      case 'allstar':
        return BlazeAI.DIFFICULTIES.ALLSTAR;
      case 'legend':
        return BlazeAI.DIFFICULTIES.LEGEND;
      default:
        return BlazeAI.DIFFICULTIES.PRO;
    }
  }

  private seedTeams(teams: Team[]): Team[] {
    // Seed based on past performance and random factor
    const rankedTeams = [...teams].sort((a, b) => {
      const aScore = a.stats.championships * 1000 + Math.random() * 500;
      const bScore = b.stats.championships * 1000 + Math.random() * 500;
      return bScore - aScore;
    });

    // Assign seeds
    rankedTeams.forEach((team, index) => {
      team.seed = index + 1;
    });

    return rankedTeams;
  }

  private generateMatches(teams: Team[]): Match[][] {
    const rounds: Match[][] = [];
    
    switch (this.settings.type) {
      case 'single_elimination':
        return this.generateSingleElimination(teams);
      case 'double_elimination':
        return this.generateDoubleElimination(teams);
      case 'round_robin':
        return this.generateRoundRobin(teams);
      case 'swiss':
        return this.generateSwiss(teams);
      default:
        return this.generateSingleElimination(teams);
    }
  }

  private generateSingleElimination(teams: Team[]): Match[][] {
    const rounds: Match[][] = [];
    const totalRounds = Math.ceil(Math.log2(teams.length));
    
    // First round - traditional bracket seeding (1v16, 2v15, etc.)
    const firstRound: Match[] = [];
    const halfCount = teams.length / 2;
    
    for (let i = 0; i < halfCount; i++) {
      const match: Match = {
        id: `match_r1_${i}`,
        round: 1,
        matchNumber: i + 1,
        team1: teams[i],
        team2: teams[teams.length - 1 - i],
        winner: null,
        score: { team1: 0, team2: 0 },
        status: 'pending',
        highlights: []
      };
      firstRound.push(match);
    }
    rounds.push(firstRound);

    // Generate placeholder matches for subsequent rounds
    let previousRoundCount = halfCount;
    for (let round = 2; round <= totalRounds; round++) {
      const roundMatches: Match[] = [];
      const matchCount = previousRoundCount / 2;
      
      for (let i = 0; i < matchCount; i++) {
        const match: Match = {
          id: `match_r${round}_${i}`,
          round,
          matchNumber: i + 1,
          team1: null, // Will be filled by winners
          team2: null,
          winner: null,
          score: { team1: 0, team2: 0 },
          status: 'pending',
          highlights: []
        };
        roundMatches.push(match);
      }
      
      rounds.push(roundMatches);
      previousRoundCount = matchCount;
    }

    return rounds;
  }

  private generateDoubleElimination(teams: Team[]): Match[][] {
    // Double elimination has winners bracket and losers bracket
    const rounds: Match[][] = [];
    
    // Winners bracket
    const winnersBracket = this.generateSingleElimination(teams);
    
    // Losers bracket (simplified version)
    // In full implementation, this would track all losing teams
    const losersBracket: Match[][] = [];
    
    // Combine brackets
    return [...winnersBracket, ...losersBracket];
  }

  private generateRoundRobin(teams: Team[]): Match[][] {
    const rounds: Match[][] = [];
    const teamCount = teams.length;
    
    // Each team plays every other team once
    for (let round = 0; round < teamCount - 1; round++) {
      const roundMatches: Match[] = [];
      
      for (let i = 0; i < teamCount / 2; i++) {
        const home = (round + i) % teamCount;
        const away = (teamCount - 1 - i + round) % teamCount;
        
        const match: Match = {
          id: `match_r${round + 1}_${i}`,
          round: round + 1,
          matchNumber: i + 1,
          team1: teams[home],
          team2: teams[away],
          winner: null,
          score: { team1: 0, team2: 0 },
          status: 'pending',
          highlights: []
        };
        
        roundMatches.push(match);
      }
      
      rounds.push(roundMatches);
    }
    
    return rounds;
  }

  private generateSwiss(teams: Team[]): Match[][] {
    // Swiss system - teams with similar records play each other
    // Simplified version - would need dynamic pairing in full implementation
    const rounds: Match[][] = [];
    const roundCount = Math.ceil(Math.log2(teams.length));
    
    for (let round = 0; round < roundCount; round++) {
      const roundMatches: Match[] = [];
      
      // Pair teams based on current standings
      // For now, using simple pairing
      for (let i = 0; i < teams.length / 2; i++) {
        const match: Match = {
          id: `match_r${round + 1}_${i}`,
          round: round + 1,
          matchNumber: i + 1,
          team1: teams[i * 2],
          team2: teams[i * 2 + 1],
          winner: null,
          score: { team1: 0, team2: 0 },
          status: 'pending',
          highlights: []
        };
        
        roundMatches.push(match);
      }
      
      rounds.push(roundMatches);
    }
    
    return rounds;
  }

  private calculateTotalRounds(): number {
    switch (this.settings.type) {
      case 'single_elimination':
        return Math.ceil(Math.log2(this.settings.teamCount));
      case 'double_elimination':
        return Math.ceil(Math.log2(this.settings.teamCount)) * 2 + 1;
      case 'round_robin':
        return this.settings.teamCount - 1;
      case 'swiss':
        return Math.ceil(Math.log2(this.settings.teamCount));
      default:
        return 1;
    }
  }

  // Tournament Management
  public startTournament(playerTeamId: string): void {
    this.playerTeam = this.bracket.teams.find(t => t.id === playerTeamId) || null;
    
    console.log('🏆 TOURNAMENT STARTED!');
    console.log(`📋 Format: ${this.settings.type}`);
    console.log(`👥 Teams: ${this.settings.teamCount}`);
    console.log(`🎮 Difficulty: ${this.settings.difficulty}`);
    console.log(`⚾ Your team: ${this.playerTeam?.name}`);
    
    this.displayBracket();
  }

  public getNextMatch(): Match | null {
    // Find next pending match involving player team
    for (const round of this.bracket.matches) {
      for (const match of round) {
        if (match.status === 'pending' && 
            (match.team1?.id === this.playerTeam?.id || 
             match.team2?.id === this.playerTeam?.id)) {
          return match;
        }
      }
    }
    
    // If no player matches, return next pending match for simulation
    for (const round of this.bracket.matches) {
      for (const match of round) {
        if (match.status === 'pending' && match.team1 && match.team2) {
          return match;
        }
      }
    }
    
    return null;
  }

  public startMatch(matchId: string): boolean {
    const match = this.findMatch(matchId);
    if (!match || match.status !== 'pending') return false;
    
    this.currentMatch = match;
    match.status = 'in_progress';
    match.startTime = Date.now();
    
    // Initialize game state for the match
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
    
    // Set innings based on settings
    (this.gameState as any).maxInnings = this.settings.innings;
    
    console.log(`⚾ Match started: ${match.team1?.name} vs ${match.team2?.name}`);
    return true;
  }

  public completeMatch(matchId: string, score: { team1: number; team2: number }): void {
    const match = this.findMatch(matchId);
    if (!match || match.status !== 'in_progress') return;
    
    match.status = 'completed';
    match.endTime = Date.now();
    match.score = score;
    match.winner = score.team1 > score.team2 ? match.team1 : match.team2;
    
    // Update team stats
    if (match.team1) {
      match.team1.stats.runsFor += score.team1;
      match.team1.stats.runsAgainst += score.team2;
      if (match.winner === match.team1) {
        match.team1.stats.wins++;
      } else {
        match.team1.stats.losses++;
      }
    }
    
    if (match.team2) {
      match.team2.stats.runsFor += score.team2;
      match.team2.stats.runsAgainst += score.team1;
      if (match.winner === match.team2) {
        match.team2.stats.wins++;
      } else {
        match.team2.stats.losses++;
      }
    }
    
    console.log(`🏁 Match complete: ${match.winner?.name} wins ${score.team1}-${score.team2}`);
    
    // Advance winner to next round
    this.advanceWinner(match);
    
    // Check if tournament is complete
    if (this.isTournamentComplete()) {
      this.completeTournament();
    }
  }

  private advanceWinner(match: Match): void {
    if (!match.winner) return;
    
    const nextRoundIndex = match.round;
    if (nextRoundIndex >= this.bracket.matches.length) return;
    
    const nextRound = this.bracket.matches[nextRoundIndex];
    const nextMatchIndex = Math.floor(match.matchNumber / 2);
    
    if (nextMatchIndex < nextRound.length) {
      const nextMatch = nextRound[nextMatchIndex];
      
      // Determine if winner goes to team1 or team2 slot
      if (match.matchNumber % 2 === 1) {
        nextMatch.team1 = match.winner;
      } else {
        nextMatch.team2 = match.winner;
      }
    }
  }

  private findMatch(matchId: string): Match | null {
    for (const round of this.bracket.matches) {
      for (const match of round) {
        if (match.id === matchId) {
          return match;
        }
      }
    }
    return null;
  }

  public simulateMatch(match: Match): void {
    if (!match.team1 || !match.team2) return;
    
    console.log(`🤖 Simulating: ${match.team1.name} vs ${match.team2.name}`);
    
    // Simple simulation based on team seeds and AI difficulty
    const team1Power = (17 - match.team1.seed) + Math.random() * 10;
    const team2Power = (17 - match.team2.seed) + Math.random() * 10;
    
    const team1Score = Math.floor(Math.random() * 10 * (team1Power / 20));
    const team2Score = Math.floor(Math.random() * 10 * (team2Power / 20));
    
    // Add some randomness to prevent always higher seed winning
    const finalScore = {
      team1: Math.max(0, team1Score),
      team2: Math.max(0, team2Score)
    };
    
    // Ensure no ties
    if (finalScore.team1 === finalScore.team2) {
      if (Math.random() > 0.5) {
        finalScore.team1++;
      } else {
        finalScore.team2++;
      }
    }
    
    this.completeMatch(match.id, finalScore);
  }

  public addHighlight(inning: number, description: string, importance: number): void {
    if (!this.currentMatch) return;
    
    this.currentMatch.highlights?.push({
      inning,
      description,
      importance,
      timestamp: Date.now()
    });
  }

  private isTournamentComplete(): boolean {
    const finalRound = this.bracket.matches[this.bracket.matches.length - 1];
    return finalRound.every(match => match.status === 'completed');
  }

  private completeTournament(): void {
    const finalMatch = this.bracket.matches[this.bracket.matches.length - 1][0];
    
    this.bracket.champion = finalMatch.winner;
    this.bracket.runnerUp = finalMatch.winner === finalMatch.team1 ? finalMatch.team2 : finalMatch.team1;
    this.bracket.endDate = Date.now();
    
    // Award championship
    if (this.bracket.champion) {
      this.bracket.champion.stats.championships++;
    }
    
    console.log('🏆 TOURNAMENT COMPLETE!');
    console.log(`👑 Champion: ${this.bracket.champion?.name}`);
    console.log(`🥈 Runner-up: ${this.bracket.runnerUp?.name}`);
    
    // Save to history
    this.tournamentHistory.push(this.bracket);
    
    this.displayFinalStandings();
  }

  // Display Methods
  private displayBracket(): void {
    console.log('\n📊 TOURNAMENT BRACKET:');
    
    this.bracket.matches.forEach((round, roundIndex) => {
      console.log(`\n--- Round ${roundIndex + 1} ---`);
      
      round.forEach(match => {
        const team1Name = match.team1?.name || 'TBD';
        const team2Name = match.team2?.name || 'TBD';
        const status = match.status === 'completed' ? 
          `✅ ${match.winner?.name} wins ${match.score.team1}-${match.score.team2}` :
          match.status === 'in_progress' ? '🎮 In Progress' : '⏳ Pending';
        
        console.log(`  Match ${match.matchNumber}: ${team1Name} vs ${team2Name} - ${status}`);
      });
    });
  }

  private displayFinalStandings(): void {
    console.log('\n🏆 FINAL STANDINGS:');
    
    const standings = [...this.bracket.teams].sort((a, b) => {
      // Sort by wins, then run differential
      if (b.stats.wins !== a.stats.wins) {
        return b.stats.wins - a.stats.wins;
      }
      
      const aDiff = a.stats.runsFor - a.stats.runsAgainst;
      const bDiff = b.stats.runsFor - b.stats.runsAgainst;
      return bDiff - aDiff;
    });
    
    standings.forEach((team, index) => {
      const icon = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${icon} ${index + 1}. ${team.name}: ${team.stats.wins}-${team.stats.losses}`);
    });
  }

  // Getters
  public getBracket(): Bracket {
    return this.bracket;
  }

  public getCurrentMatch(): Match | null {
    return this.currentMatch;
  }

  public getPlayerTeam(): Team | null {
    return this.playerTeam;
  }

  public getTournamentHistory(): Bracket[] {
    return this.tournamentHistory;
  }

  public getTeamPath(teamId: string): Match[] {
    const path: Match[] = [];
    
    for (const round of this.bracket.matches) {
      for (const match of round) {
        if ((match.team1?.id === teamId || match.team2?.id === teamId) && 
            match.status === 'completed') {
          path.push(match);
        }
      }
    }
    
    return path;
  }
}