/**
 * Shared Baseball Game State Management
 * Core rules and state that work across both 3D and OG modes
 */

import { z } from 'zod';

// Base game state schema
export const BaseballGameStateSchema = z.object({
  inning: z.number().int().min(1).max(15).default(1),
  topHalf: z.boolean().default(true),
  balls: z.number().int().min(0).max(4).default(0),
  strikes: z.number().int().min(0).max(3).default(0),
  outs: z.number().int().min(0).max(3).default(0),
  homeScore: z.number().int().min(0).default(0),
  awayScore: z.number().int().min(0).default(0),
  basesOccupied: z.object({
    first: z.boolean().default(false),
    second: z.boolean().default(false),
    third: z.boolean().default(false),
  }),
  gamePhase: z.enum(['pregame', 'active', 'complete', 'suspended']).default('pregame'),
  weather: z.object({
    condition: z.enum(['clear', 'cloudy', 'rainy', 'windy']).default('clear'),
    temperature: z.number().default(72),
    windSpeed: z.number().default(0),
    windDirection: z.number().default(0),
  }),
});

export type BaseballGameState = z.infer<typeof BaseballGameStateSchema>;

export class GameState implements BaseballGameState {
  inning = 1;
  topHalf = true;
  balls = 0;
  strikes = 0;
  outs = 0;
  homeScore = 0;
  awayScore = 0;
  basesOccupied = { first: false, second: false, third: false };
  gamePhase: 'pregame' | 'active' | 'complete' | 'suspended' = 'pregame';
  weather = { condition: 'clear' as const, temperature: 72, windSpeed: 0, windDirection: 0 };
  
  // Additional dynamic state
  players: Array<{id: string, x: number, y: number, position: string, name: string}> = [];
  ball = { x: 512, y: 400, vx: 0, vy: 0, inPlay: false };
  currentBatter: string | null = null;
  currentPitcher: string | null = null;
  lastPlay = '';
  gameLog: string[] = [];

  constructor(config: Partial<BaseballGameState> = {}) {
    Object.assign(this, config);
    this.initializeFieldPositions();
  }

  private initializeFieldPositions() {
    // Standard baseball field positions (2D coordinates for OG mode)
    this.players = [
      { id: 'pitcher', x: 512, y: 350, position: 'P', name: 'Pitcher' },
      { id: 'catcher', x: 512, y: 650, position: 'C', name: 'Catcher' },
      { id: '1b', x: 650, y: 500, position: '1B', name: '1st Base' },
      { id: '2b', x: 580, y: 380, position: '2B', name: '2nd Base' },
      { id: '3b', x: 370, y: 500, position: '3B', name: '3rd Base' },
      { id: 'ss', x: 440, y: 380, position: 'SS', name: 'Shortstop' },
      { id: 'lf', x: 200, y: 200, position: 'LF', name: 'Left Field' },
      { id: 'cf', x: 512, y: 150, position: 'CF', name: 'Center Field' },
      { id: 'rf', x: 824, y: 200, position: 'RF', name: 'Right Field' },
    ];
  }

  startGame() {
    this.gamePhase = 'active';
    this.logPlay('Game started!');
  }

  endGame() {
    this.gamePhase = 'complete';
    const winner = this.homeScore > this.awayScore ? 'Home' : 
                   this.awayScore > this.homeScore ? 'Away' : 'Tie';
    this.logPlay(`Game over! Final: Away ${this.awayScore} - Home ${this.homeScore} (${winner})`);
  }

  swingBat(): { contact: boolean, result: string } {
    if (this.gamePhase !== 'active') return { contact: false, result: 'Game not active' };
    
    // Simplified swing mechanics for OG mode
    const contactChance = Math.random();
    
    if (contactChance > 0.7) {
      // Contact made
      const hitType = this.determineHitResult();
      this.processHit(hitType);
      return { contact: true, result: hitType };
    } else {
      // Miss or foul
      if (contactChance > 0.4) {
        // Foul ball
        if (this.strikes < 2) this.strikes++;
        this.logPlay('Foul ball!');
        return { contact: true, result: 'foul' };
      } else {
        // Swing and miss
        this.strikes++;
        this.checkStrikeout();
        this.logPlay('Strike swinging!');
        return { contact: false, result: 'miss' };
      }
    }
  }

  pitch(location: string): { result: string } {
    if (this.gamePhase !== 'active') return { result: 'Game not active' };
    
    const accuracy = Math.random();
    
    if (accuracy > 0.6) {
      // Strike
      this.strikes++;
      this.checkStrikeout();
      this.logPlay(`Strike looking! (${this.balls}-${this.strikes})`);
      return { result: 'strike' };
    } else {
      // Ball
      this.balls++;
      this.checkWalk();
      this.logPlay(`Ball ${this.balls}! (${this.balls}-${this.strikes})`);
      return { result: 'ball' };
    }
  }

  private determineHitResult(): string {
    const roll = Math.random();
    
    if (roll > 0.95) return 'homerun';
    if (roll > 0.85) return 'triple';
    if (roll > 0.65) return 'double';
    if (roll > 0.30) return 'single';
    if (roll > 0.10) return 'groundout';
    return 'flyout';
  }

  private processHit(hitType: string) {
    this.resetCount();
    
    switch (hitType) {
      case 'homerun':
        const rbi = this.countRunnersOnBase() + 1;
        this.addRuns(rbi);
        this.clearBases();
        this.logPlay(`HOME RUN! ${rbi} RBI!`);
        break;
        
      case 'triple':
        const tripleRBI = this.countRunnersOnBase();
        this.addRuns(tripleRBI);
        this.clearBases();
        this.basesOccupied.third = true;
        this.logPlay(`Triple! ${tripleRBI} RBI!`);
        break;
        
      case 'double':
        const doubleRBI = this.basesOccupied.third ? 1 : 0;
        if (this.basesOccupied.second) this.addRuns(1);
        this.addRuns(doubleRBI);
        this.basesOccupied = {
          first: false,
          second: true,
          third: this.basesOccupied.first
        };
        this.logPlay(`Double! ${doubleRBI + (this.basesOccupied.second ? 1 : 0)} RBI!`);
        break;
        
      case 'single':
        let singleRBI = 0;
        if (this.basesOccupied.third) { this.addRuns(1); singleRBI++; }
        if (this.basesOccupied.second) { this.addRuns(1); singleRBI++; }
        
        this.basesOccupied = {
          first: true,
          second: this.basesOccupied.first,
          third: false
        };
        this.logPlay(`Single! ${singleRBI} RBI!`);
        break;
        
      case 'groundout':
      case 'flyout':
        this.outs++;
        // Potential advancement on sacrifice
        if (this.basesOccupied.third && hitType === 'flyout') {
          this.addRuns(1);
          this.basesOccupied.third = false;
          this.logPlay(`Sacrifice ${hitType}! 1 RBI!`);
        } else {
          this.logPlay(`${hitType.charAt(0).toUpperCase() + hitType.slice(1)}!`);
        }
        this.checkThreeOuts();
        break;
    }
  }

  private checkStrikeout() {
    if (this.strikes >= 3) {
      this.outs++;
      this.resetCount();
      this.logPlay('Strikeout!');
      this.checkThreeOuts();
    }
  }

  private checkWalk() {
    if (this.balls >= 4) {
      this.advanceRunners('walk');
      this.resetCount();
      this.logPlay('Walk!');
    }
  }

  private checkThreeOuts() {
    if (this.outs >= 3) {
      this.endHalfInning();
    }
  }

  private endHalfInning() {
    this.outs = 0;
    this.resetCount();
    this.clearBases();
    
    if (this.topHalf) {
      this.topHalf = false;
      this.logPlay(`End of top ${this.inning}. Away: ${this.awayScore} - Home: ${this.homeScore}`);
    } else {
      this.inning++;
      this.topHalf = true;
      this.logPlay(`End of ${this.inning - 1}. Away: ${this.awayScore} - Home: ${this.homeScore}`);
      
      // Check for game end
      if (this.inning > 9 && this.homeScore !== this.awayScore) {
        this.endGame();
      } else if (this.inning > 15) {
        // Maximum innings reached
        this.endGame();
      }
    }
  }

  advanceRunner(direction: number) {
    // Simple base advancement for OG mode
    if (direction > 0) {
      // Advance
      if (this.basesOccupied.second) {
        this.basesOccupied.third = true;
        this.basesOccupied.second = false;
        this.logPlay('Runner advances to third!');
      } else if (this.basesOccupied.first) {
        this.basesOccupied.second = true;
        this.basesOccupied.first = false;
        this.logPlay('Runner advances to second!');
      }
    }
  }

  private advanceRunners(reason: string) {
    if (reason === 'walk') {
      // Force runners on walk
      if (this.basesOccupied.third && this.basesOccupied.second && this.basesOccupied.first) {
        this.addRuns(1);
      }
      if (this.basesOccupied.second && this.basesOccupied.first) {
        this.basesOccupied.third = true;
      }
      if (this.basesOccupied.first) {
        this.basesOccupied.second = true;
      }
      this.basesOccupied.first = true;
    }
  }

  private addRuns(count: number) {
    if (this.topHalf) {
      this.awayScore += count;
    } else {
      this.homeScore += count;
    }
  }

  private countRunnersOnBase(): number {
    return (this.basesOccupied.first ? 1 : 0) + 
           (this.basesOccupied.second ? 1 : 0) + 
           (this.basesOccupied.third ? 1 : 0);
  }

  private resetCount() {
    this.balls = 0;
    this.strikes = 0;
  }

  private clearBases() {
    this.basesOccupied = { first: false, second: false, third: false };
  }

  private logPlay(message: string) {
    this.lastPlay = message;
    this.gameLog.push(message);
    console.log(`[Game] ${message}`);
  }

  update() {
    // Update game state - called every frame
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    
    // Apply friction
    this.ball.vx *= 0.98;
    this.ball.vy *= 0.98;
  }

  getGameSummary() {
    return {
      inning: this.inning,
      topHalf: this.topHalf,
      score: `${this.awayScore} - ${this.homeScore}`,
      count: `${this.balls}-${this.strikes}`,
      outs: this.outs,
      basesOccupied: this.basesOccupied,
      lastPlay: this.lastPlay,
      phase: this.gamePhase
    };
  }
}