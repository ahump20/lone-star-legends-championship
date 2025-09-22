/**
 * Shared Baserunning Logic
 * Handles runner advancement, stealing, and base coaching
 */

export interface Runner {
  id: string;
  name: string;
  currentBase: 0 | 1 | 2 | 3; // 0 = home plate
  speed: number; // 1-100 scale
  advancement: number; // 0-1 progress to next base
  status: 'safe' | 'running' | 'sliding' | 'tagged';
}

export interface BaserunningState {
  runners: Runner[];
  stolenBases: number;
  caughtStealing: number;
  pickoffAttempts: number;
}

export class BaserunningEngine {
  private runners: Runner[] = [];
  private stolenBases = 0;
  private caughtStealing = 0;
  private pickoffAttempts = 0;

  constructor() {}

  addRunner(id: string, name: string, speed: number = 75): Runner {
    const runner: Runner = {
      id,
      name,
      currentBase: 1, // Start at first base
      speed,
      advancement: 0,
      status: 'safe'
    };
    
    this.runners.push(runner);
    return runner;
  }

  removeRunner(runnerId: string) {
    this.runners = this.runners.filter(r => r.id !== runnerId);
  }

  attemptSteal(runnerId: string): { success: boolean, result: string } {
    const runner = this.runners.find(r => r.id === runnerId);
    if (!runner || runner.currentBase >= 3) {
      return { success: false, result: 'Invalid steal attempt' };
    }

    // Simplified steal mechanics
    const successChance = (runner.speed / 100) * 0.7 + Math.random() * 0.3;
    
    if (successChance > 0.6) {
      // Successful steal
      runner.currentBase++;
      this.stolenBases++;
      return { success: true, result: `${runner.name} steals ${this.getBaseName(runner.currentBase)}!` };
    } else {
      // Caught stealing
      this.removeRunner(runnerId);
      this.caughtStealing++;
      return { success: false, result: `${runner.name} caught stealing!` };
    }
  }

  advanceRunners(hitType: 'single' | 'double' | 'triple' | 'homerun' | 'groundout' | 'flyout'): {
    scored: Runner[],
    advanced: Runner[],
    out: Runner[]
  } {
    const scored: Runner[] = [];
    const advanced: Runner[] = [];
    const out: Runner[] = [];

    // Process each runner based on hit type
    this.runners.forEach(runner => {
      const advancement = this.calculateAdvancement(runner, hitType);
      
      if (runner.currentBase + advancement >= 4) {
        // Runner scores
        scored.push(runner);
        this.removeRunner(runner.id);
      } else if (advancement > 0) {
        // Runner advances
        runner.currentBase += advancement as 1 | 2 | 3;
        advanced.push(runner);
      }
    });

    return { scored, advanced, out };
  }

  private calculateAdvancement(runner: Runner, hitType: string): number {
    const baseSpeed = runner.speed / 100;
    const situational = Math.random() * 0.3;
    const totalSpeed = baseSpeed + situational;

    switch (hitType) {
      case 'homerun':
        return 4 - runner.currentBase; // All runners score
      
      case 'triple':
        return Math.min(3 - runner.currentBase, 3);
      
      case 'double':
        if (runner.currentBase === 1) return totalSpeed > 0.6 ? 2 : 1;
        if (runner.currentBase === 2) return 2; // Score from second
        if (runner.currentBase === 3) return 1; // Score from third
        return 0;
      
      case 'single':
        if (runner.currentBase === 1) return totalSpeed > 0.7 ? 2 : 1;
        if (runner.currentBase === 2) return totalSpeed > 0.5 ? 2 : 1;
        if (runner.currentBase === 3) return 1; // Score from third
        return 0;
      
      case 'groundout':
        // Runners advance on contact, but risk being forced
        if (runner.currentBase === 3) return 1; // Score on contact
        return totalSpeed > 0.8 ? 1 : 0;
      
      case 'flyout':
        // Tag up scenario - only if deep enough
        if (runner.currentBase === 3) return Math.random() > 0.4 ? 1 : 0;
        return 0;
      
      default:
        return 0;
    }
  }

  private getBaseName(base: number): string {
    switch (base) {
      case 1: return 'first base';
      case 2: return 'second base';
      case 3: return 'third base';
      default: return 'home';
    }
  }

  getRunnerAtBase(base: number): Runner | null {
    return this.runners.find(r => r.currentBase === base) || null;
  }

  getBasesOccupied(): { first: boolean, second: boolean, third: boolean } {
    return {
      first: this.runners.some(r => r.currentBase === 1),
      second: this.runners.some(r => r.currentBase === 2),
      third: this.runners.some(r => r.currentBase === 3)
    };
  }

  clearBases() {
    this.runners = [];
  }

  getStats() {
    return {
      runnersOnBase: this.runners.length,
      stolenBases: this.stolenBases,
      caughtStealing: this.caughtStealing,
      pickoffAttempts: this.pickoffAttempts
    };
  }

  // OG Mode simplified controls
  tryAdvanceAll(): { success: boolean, message: string } {
    if (this.runners.length === 0) {
      return { success: false, message: 'No runners on base' };
    }

    let advanced = 0;
    let scored = 0;
    
    this.runners.forEach(runner => {
      const chance = (runner.speed / 100) * 0.8;
      if (Math.random() < chance) {
        if (runner.currentBase === 3) {
          scored++;
          this.removeRunner(runner.id);
        } else {
          runner.currentBase++;
          advanced++;
        }
      }
    });

    if (scored > 0) {
      return { success: true, message: `${scored} runner(s) scored!` };
    } else if (advanced > 0) {
      return { success: true, message: `${advanced} runner(s) advanced!` };
    } else {
      return { success: false, message: 'Runners held their bases' };
    }
  }
}