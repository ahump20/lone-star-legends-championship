/**
 * Sandlot Mode
 * Pick-up style game with character drafting and house rules
 */

import type { GameState } from '../../../packages/rules/gameState';

interface Kid {
  name: string;
  speed: number;
  contact: number;
  power: number;
  arm: number;
  fielding: number;
  position: string;
  nickname: string;
  palette: string;
}

interface SandlotRules {
  mercyRule: number;
  ghostRunners: boolean;
  pitchersDenied: boolean; // No stealing on the pitcher
  wallBallRules: boolean;
  unlimitedFouls: boolean;
  quickGameLength: number;
}

export class SandlotMode {
  private gameState: GameState;
  private availableKids: Kid[] = [];
  private homeTeam: Kid[] = [];
  private awayTeam: Kid[] = [];
  private rules: SandlotRules;
  private captains: { home: Kid | null, away: Kid | null } = { home: null, away: null };
  private draftOrder: ('home' | 'away')[] = [];
  private currentPick = 0;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.rules = this.getDefaultRules();
    this.loadKids();
  }

  private getDefaultRules(): SandlotRules {
    return {
      mercyRule: 10, // 10-run mercy rule
      ghostRunners: true, // Auto-advance runners in certain situations
      pitchersDenied: false, // Allow stealing on pitcher
      wallBallRules: true, // Special boundary rules
      unlimitedFouls: true, // Can't strike out on fouls (except bunts)
      quickGameLength: 5 // 5 innings for sandlot
    };
  }

  private async loadKids(): Promise<void> {
    try {
      const charactersResponse = await fetch('./content/og/characters.json');
      const characters = await charactersResponse.json();
      this.availableKids = [...characters.kids];
    } catch (error) {
      console.warn('Could not load characters, using defaults');
      this.createDefaultKids();
    }
  }

  private createDefaultKids(): void {
    this.availableKids = [
      { name: "Ace", speed: 8, contact: 6, power: 5, arm: 7, fielding: 6, position: "P", nickname: "The Flame", palette: "burnt-orange" },
      { name: "Skye", speed: 6, contact: 8, power: 4, arm: 6, fielding: 7, position: "CF", nickname: "Cardinal", palette: "sky-blue" },
      { name: "Tex", speed: 5, contact: 6, power: 8, arm: 7, fielding: 5, position: "1B", nickname: "The Titan", palette: "navy" },
      { name: "Nova", speed: 7, contact: 5, power: 6, arm: 6, fielding: 8, position: "SS", nickname: "Grizzly", palette: "teal" }
    ];
  }

  // Start the captain selection process
  startCaptainSelection(): { availableKids: Kid[] } {
    console.log('🏃‍♂️ Choose your captains for the sandlot draft!');
    
    // Shuffle kids for variety
    this.availableKids.sort(() => Math.random() - 0.5);
    
    return {
      availableKids: this.availableKids
    };
  }

  selectCaptain(kidName: string, team: 'home' | 'away'): boolean {
    const kid = this.availableKids.find(k => k.name === kidName);
    if (!kid) return false;

    this.captains[team] = kid;
    this.removeKidFromPool(kidName);
    
    if (team === 'home') {
      this.homeTeam.push(kid);
    } else {
      this.awayTeam.push(kid);
    }

    console.log(`👑 ${kid.nickname} is captain of the ${team} team!`);
    
    // Start draft if both captains selected
    if (this.captains.home && this.captains.away) {
      this.setupDraftOrder();
    }
    
    return true;
  }

  private setupDraftOrder(): void {
    // Standard draft: alternate picks, with away team going first
    const totalPicks = this.availableKids.length;
    this.draftOrder = [];
    
    for (let i = 0; i < totalPicks; i++) {
      this.draftOrder.push(i % 2 === 0 ? 'away' : 'home');
    }
    
    this.currentPick = 0;
    console.log('📝 Draft order set! Away team picks first.');
  }

  // Draft a player
  draftPlayer(kidName: string): { 
    success: boolean, 
    team?: 'home' | 'away', 
    nextPick?: 'home' | 'away' | null,
    draftComplete?: boolean 
  } {
    if (this.currentPick >= this.draftOrder.length) {
      return { success: false };
    }

    const currentTeam = this.draftOrder[this.currentPick];
    const kid = this.availableKids.find(k => k.name === kidName);
    
    if (!kid) {
      return { success: false };
    }

    // Add to team
    if (currentTeam === 'home') {
      this.homeTeam.push(kid);
    } else {
      this.awayTeam.push(kid);
    }

    this.removeKidFromPool(kidName);
    this.currentPick++;

    const nextPick = this.currentPick < this.draftOrder.length ? 
      this.draftOrder[this.currentPick] : null;
    
    const draftComplete = this.currentPick >= this.draftOrder.length;

    console.log(`⚾ ${kid.nickname} picked by ${currentTeam} team!`);
    
    if (draftComplete) {
      this.completeDraft();
    }

    return {
      success: true,
      team: currentTeam,
      nextPick,
      draftComplete
    };
  }

  private removeKidFromPool(kidName: string): void {
    this.availableKids = this.availableKids.filter(k => k.name !== kidName);
  }

  private completeDraft(): void {
    console.log('🏆 Draft complete!');
    console.log(`🏠 Home team: ${this.homeTeam.map(k => k.nickname).join(', ')}`);
    console.log(`🚌 Away team: ${this.awayTeam.map(k => k.nickname).join(', ')}`);
  }

  // Start the sandlot game
  startSandlotGame(customRules?: Partial<SandlotRules>): void {
    if (customRules) {
      this.rules = { ...this.rules, ...customRules };
    }

    console.log('⚾ Starting Sandlot Game!');
    console.log('📏 House Rules:');
    console.log(`   💥 Mercy Rule: ${this.rules.mercyRule} runs`);
    console.log(`   👻 Ghost Runners: ${this.rules.ghostRunners ? 'YES' : 'NO'}`);
    console.log(`   🏃 Pitcher Denied: ${this.rules.pitchersDenied ? 'YES' : 'NO'}`);
    console.log(`   🧱 Wall Ball: ${this.rules.wallBallRules ? 'YES' : 'NO'}`);
    console.log(`   🤷 Unlimited Fouls: ${this.rules.unlimitedFouls ? 'YES' : 'NO'}`);
    console.log(`   ⏱️ Game Length: ${this.rules.quickGameLength} innings`);

    // Reset game state
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

    // Apply sandlot rules
    this.applySandlotRules();
  }

  private applySandlotRules(): void {
    // Store rules on game state for easy access
    (this.gameState as any).sandlotRules = this.rules;
    (this.gameState as any).maxInnings = this.rules.quickGameLength;

    // Override some game methods for house rules
    const originalSwingBat = this.gameState.swingBat.bind(this.gameState);
    this.gameState.swingBat = () => {
      const result = originalSwingBat();
      
      // Unlimited fouls rule
      if (this.rules.unlimitedFouls && result.result === 'foul' && this.gameState.strikes === 2) {
        // Don't increment strikes on foul with 2 strikes
        console.log('🤷 Unlimited fouls: no strikeout on foul ball!');
        // The strikes were already incremented, so decrement them
        if (this.gameState.strikes > 2) {
          (this.gameState as any).strikes = 2;
        }
      }
      
      return result;
    };

    // Check mercy rule after each half inning
    const originalEndHalfInning = (this.gameState as any).endHalfInning?.bind(this.gameState);
    if (originalEndHalfInning) {
      (this.gameState as any).endHalfInning = () => {
        originalEndHalfInning();
        this.checkMercyRule();
      };
    }
  }

  private checkMercyRule(): void {
    const scoreDiff = Math.abs(this.gameState.homeScore - this.gameState.awayScore);
    
    if (scoreDiff >= this.rules.mercyRule && this.gameState.inning >= 3) {
      console.log(`💥 MERCY RULE: Game called due to ${scoreDiff}-run lead!`);
      (this.gameState as any).gamePhase = 'complete';
    }
  }

  // Getters for game info
  getDraftStatus(): {
    homeTeam: Kid[];
    awayTeam: Kid[];
    availableKids: Kid[];
    currentPick: 'home' | 'away' | null;
    draftComplete: boolean;
  } {
    return {
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      availableKids: this.availableKids,
      currentPick: this.currentPick < this.draftOrder.length ? this.draftOrder[this.currentPick] : null,
      draftComplete: this.currentPick >= this.draftOrder.length
    };
  }

  getTeamStats(): {
    homeTeam: { name: string, totalStats: number, bestStat: string }[];
    awayTeam: { name: string, totalStats: number, bestStat: string }[];
  } {
    const calculateTeamStats = (team: Kid[]) => {
      return team.map(kid => {
        const totalStats = kid.speed + kid.contact + kid.power + kid.arm + kid.fielding;
        const stats = { speed: kid.speed, contact: kid.contact, power: kid.power, arm: kid.arm, fielding: kid.fielding };
        const bestStat = Object.entries(stats).reduce((a, b) => stats[a[0] as keyof typeof stats] > stats[b[0] as keyof typeof stats] ? a : b)[0];
        
        return {
          name: kid.nickname,
          totalStats,
          bestStat: bestStat.charAt(0).toUpperCase() + bestStat.slice(1)
        };
      });
    };

    return {
      homeTeam: calculateTeamStats(this.homeTeam),
      awayTeam: calculateTeamStats(this.awayTeam)
    };
  }

  getRules(): SandlotRules {
    return { ...this.rules };
  }

  updateRules(newRules: Partial<SandlotRules>): void {
    this.rules = { ...this.rules, ...newRules };
    console.log('📏 House rules updated!');
  }
}