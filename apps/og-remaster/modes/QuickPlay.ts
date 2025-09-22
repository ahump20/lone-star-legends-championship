/**
 * Quick Play Mode
 * Jump right into a game with random teams
 */

import type { GameState } from '../../../packages/rules/gameState';
import { readTheme } from '../theme';

interface Team {
  name: string;
  players: string[];
  colors: string[];
  mascot: string;
}

export class QuickPlayMode {
  private gameState: GameState;
  private homeTeam: Team | null = null;
  private awayTeam: Team | null = null;
  private teams: Team[] = [];

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.loadTeams();
  }

  private async loadTeams(): Promise<void> {
    try {
      const charactersResponse = await fetch('./content/og/characters.json');
      const characters = await charactersResponse.json();
      this.teams = characters.teams;
    } catch (error) {
      console.warn('Could not load teams, using defaults');
      this.createDefaultTeams();
    }
  }

  private createDefaultTeams(): void {
    this.teams = [
      {
        name: "Texas Legends",
        players: ["Ace", "Blaze", "Sage"],
        colors: ["burnt-orange"],
        mascot: "Longhorn"
      },
      {
        name: "Cardinal Scouts",
        players: ["Skye", "Scout", "Storm"],
        colors: ["sky-blue"],
        mascot: "Redbird"
      },
      {
        name: "Tennessee Titans",
        players: ["Tex", "Ranger", "Ridge"],
        colors: ["navy"],
        mascot: "Titan"
      },
      {
        name: "Pacific Grizzlies",
        players: ["Nova", "River", "Bay"],
        colors: ["teal"],
        mascot: "Grizzly Bear"
      }
    ];
  }

  startQuickGame(innings: number = 6): void {
    console.log('🚀 Starting Quick Play...');
    
    // Randomly select teams
    this.selectRandomTeams();
    
    // Set up game
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
    
    // Set game length
    (this.gameState as any).maxInnings = innings;
    
    console.log(`⚾ ${this.awayTeam?.name} vs ${this.homeTeam?.name}`);
    console.log(`🏟️ ${innings} innings`);
  }

  private selectRandomTeams(): void {
    const shuffled = [...this.teams].sort(() => Math.random() - 0.5);
    this.awayTeam = shuffled[0];
    this.homeTeam = shuffled[1];
    
    // Apply team colors to game theme
    this.applyTeamColors();
  }

  private applyTeamColors(): void {
    if (!this.homeTeam || !this.awayTeam) return;
    
    const theme = readTheme();
    const root = document.documentElement;
    
    // Set team-specific colors
    root.style.setProperty('--home-team-color', this.getTeamColor(this.homeTeam));
    root.style.setProperty('--away-team-color', this.getTeamColor(this.awayTeam));
  }

  private getTeamColor(team: Team): string {
    const colorMap: Record<string, string> = {
      'burnt-orange': '#BF5700',
      'sky-blue': '#9BCBEB', 
      'navy': '#002244',
      'teal': '#00B2A9'
    };
    
    return colorMap[team.colors[0]] || '#666666';
  }

  getGameInfo(): {
    homeTeam: Team | null;
    awayTeam: Team | null;
    innings: number;
  } {
    return {
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      innings: (this.gameState as any).maxInnings || 9
    };
  }

  // Different difficulty settings
  startEasyGame(): void {
    this.startQuickGame(3); // Shorter game
    this.adjustDifficulty('easy');
  }

  startNormalGame(): void {
    this.startQuickGame(6); // Standard game
    this.adjustDifficulty('normal');
  }

  startChampionshipGame(): void {
    this.startQuickGame(9); // Full game
    this.adjustDifficulty('hard');
  }

  private adjustDifficulty(level: 'easy' | 'normal' | 'hard'): void {
    const adjustments = {
      easy: {
        hitZone: 1.3,
        pitchAccuracy: 0.7,
        fieldingSkill: 0.8
      },
      normal: {
        hitZone: 1.0,
        pitchAccuracy: 1.0,
        fieldingSkill: 1.0
      },
      hard: {
        hitZone: 0.8,
        pitchAccuracy: 1.3,
        fieldingSkill: 1.2
      }
    };

    const settings = adjustments[level];
    
    // Store difficulty adjustments on game state
    (this.gameState as any).difficulty = {
      level,
      ...settings
    };

    console.log(`🎮 Difficulty set to: ${level.toUpperCase()}`);
  }
}