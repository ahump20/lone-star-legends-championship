/**
 * Blaze Intelligence Leaderboard Manager
 * Championship-level score tracking and persistence
 */

interface PlayerScore {
  playerId: string;
  username: string;
  score: number;
  wins: number;
  losses: number;
  homeRuns: number;
  strikeouts: number;
  battingAverage: number;
  era: number; // Earned Run Average
  gamesPlayed: number;
  winStreak: number;
  bestScore: number;
  rank: number;
  tier: 'rookie' | 'amateur' | 'pro' | 'allstar' | 'legend';
  achievements: string[];
  lastPlayed: number;
  createdAt: number;
}

interface LeaderboardEntry {
  rank: number;
  player: PlayerScore;
  change: 'up' | 'down' | 'same';
  changeAmount: number;
}

interface SeasonData {
  seasonId: string;
  name: string;
  startDate: number;
  endDate: number;
  leaderboard: LeaderboardEntry[];
  rewards: {
    tier: string;
    minRank: number;
    maxRank: number;
    prize: string;
  }[];
}

export class LeaderboardManager {
  private readonly API_ENDPOINT = 'https://api.blaze-intelligence.com/leaderboard';
  private readonly CACHE_KEY = 'blazeLeaderboardCache';
  private readonly PLAYER_KEY = 'blazePlayerScore';
  private readonly SYNC_INTERVAL = 60000; // 1 minute
  
  private leaderboardCache: Map<string, LeaderboardEntry[]> = new Map();
  private playerScore: PlayerScore | null = null;
  private syncTimer: number | null = null;
  private pendingUpdates: Partial<PlayerScore>[] = [];
  
  constructor() {
    this.loadPlayerScore();
    this.loadCachedLeaderboard();
    this.startSyncTimer();
    
    console.log('🏆 Leaderboard Manager initialized');
  }

  // Player score management
  private loadPlayerScore(): void {
    const stored = localStorage.getItem(this.PLAYER_KEY);
    if (stored) {
      this.playerScore = JSON.parse(stored);
    } else {
      this.initializePlayerScore();
    }
  }

  private initializePlayerScore(): void {
    const playerId = this.generatePlayerId();
    
    this.playerScore = {
      playerId,
      username: `Player${playerId.substr(-6)}`,
      score: 0,
      wins: 0,
      losses: 0,
      homeRuns: 0,
      strikeouts: 0,
      battingAverage: 0,
      era: 0,
      gamesPlayed: 0,
      winStreak: 0,
      bestScore: 0,
      rank: 0,
      tier: 'rookie',
      achievements: [],
      lastPlayed: Date.now(),
      createdAt: Date.now()
    };
    
    this.savePlayerScore();
  }

  private savePlayerScore(): void {
    if (this.playerScore) {
      localStorage.setItem(this.PLAYER_KEY, JSON.stringify(this.playerScore));
    }
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API for game integration
  public updateGameResult(result: {
    won: boolean;
    score: number;
    opponentScore: number;
    hits: number;
    atBats: number;
    homeRuns: number;
    strikeouts: number;
    runsAllowed?: number;
    inningsPitched?: number;
  }): void {
    if (!this.playerScore) return;
    
    // Update basic stats
    this.playerScore.gamesPlayed++;
    this.playerScore.lastPlayed = Date.now();
    
    if (result.won) {
      this.playerScore.wins++;
      this.playerScore.winStreak++;
      this.playerScore.score += result.score * 100; // Points for scoring
    } else {
      this.playerScore.losses++;
      this.playerScore.winStreak = 0;
      this.playerScore.score += result.score * 25; // Fewer points for losing
    }
    
    // Update batting stats
    this.playerScore.homeRuns += result.homeRuns;
    this.playerScore.strikeouts += result.strikeouts;
    
    // Calculate batting average
    const totalHits = this.playerScore.homeRuns * this.playerScore.gamesPlayed;
    const totalAtBats = this.playerScore.gamesPlayed * 30; // Estimate
    this.playerScore.battingAverage = totalAtBats > 0 ? totalHits / totalAtBats : 0;
    
    // Calculate ERA if pitching stats provided
    if (result.runsAllowed !== undefined && result.inningsPitched) {
      const totalRunsAllowed = (this.playerScore.era * this.playerScore.gamesPlayed * 9) + result.runsAllowed;
      const totalInnings = (this.playerScore.gamesPlayed * 9) + result.inningsPitched;
      this.playerScore.era = totalInnings > 0 ? (totalRunsAllowed / totalInnings) * 9 : 0;
    }
    
    // Update best score
    if (result.score > this.playerScore.bestScore) {
      this.playerScore.bestScore = result.score;
      this.unlockAchievement('high_scorer');
    }
    
    // Update tier based on score
    this.updatePlayerTier();
    
    // Check for achievements
    this.checkAchievements();
    
    // Save locally
    this.savePlayerScore();
    
    // Queue for sync
    this.pendingUpdates.push({ ...this.playerScore });
    
    console.log('📊 Game result recorded:', {
      won: result.won,
      newScore: this.playerScore.score,
      tier: this.playerScore.tier
    });
  }

  private updatePlayerTier(): void {
    if (!this.playerScore) return;
    
    const score = this.playerScore.score;
    
    if (score >= 50000) {
      this.playerScore.tier = 'legend';
    } else if (score >= 25000) {
      this.playerScore.tier = 'allstar';
    } else if (score >= 10000) {
      this.playerScore.tier = 'pro';
    } else if (score >= 5000) {
      this.playerScore.tier = 'amateur';
    } else {
      this.playerScore.tier = 'rookie';
    }
  }

  private checkAchievements(): void {
    if (!this.playerScore) return;
    
    // Win streak achievements
    if (this.playerScore.winStreak >= 10) {
      this.unlockAchievement('win_streak_10');
    }
    if (this.playerScore.winStreak >= 5) {
      this.unlockAchievement('win_streak_5');
    }
    
    // Home run achievements
    if (this.playerScore.homeRuns >= 100) {
      this.unlockAchievement('century_slugger');
    }
    if (this.playerScore.homeRuns >= 50) {
      this.unlockAchievement('power_hitter');
    }
    
    // Games played achievements
    if (this.playerScore.gamesPlayed >= 100) {
      this.unlockAchievement('veteran');
    }
    if (this.playerScore.gamesPlayed >= 50) {
      this.unlockAchievement('experienced');
    }
    
    // Batting average achievements
    if (this.playerScore.battingAverage >= 0.400) {
      this.unlockAchievement('batting_champion');
    }
    
    // Perfect game achievement
    if (this.playerScore.era === 0 && this.playerScore.gamesPlayed > 0) {
      this.unlockAchievement('perfect_pitcher');
    }
  }

  private unlockAchievement(achievementId: string): void {
    if (!this.playerScore) return;
    
    if (!this.playerScore.achievements.includes(achievementId)) {
      this.playerScore.achievements.push(achievementId);
      
      // Bonus points for achievements
      const bonusPoints = this.getAchievementPoints(achievementId);
      this.playerScore.score += bonusPoints;
      
      console.log(`🏅 Achievement unlocked: ${achievementId} (+${bonusPoints} points)`);
      
      // Trigger UI notification
      this.notifyAchievement(achievementId);
    }
  }

  private getAchievementPoints(achievementId: string): number {
    const points: Record<string, number> = {
      'win_streak_5': 500,
      'win_streak_10': 1500,
      'power_hitter': 1000,
      'century_slugger': 2500,
      'experienced': 750,
      'veteran': 2000,
      'batting_champion': 3000,
      'perfect_pitcher': 5000,
      'high_scorer': 1000
    };
    
    return points[achievementId] || 100;
  }

  private notifyAchievement(achievementId: string): void {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('achievement_unlocked', {
      detail: { achievementId, timestamp: Date.now() }
    }));
  }

  // Leaderboard fetching and caching
  public async getLeaderboard(
    type: 'global' | 'weekly' | 'daily' | 'friends' = 'global',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `${type}_${limit}`;
    
    // Check cache first
    if (this.leaderboardCache.has(cacheKey)) {
      const cached = this.leaderboardCache.get(cacheKey)!;
      const cacheAge = Date.now() - (cached[0]?.player.lastPlayed || 0);
      
      if (cacheAge < 30000) { // 30 seconds cache
        return cached;
      }
    }
    
    try {
      // Fetch from server
      const response = await fetch(`${this.API_ENDPOINT}/${type}?limit=${limit}`, {
        headers: {
          'X-Player-Id': this.playerScore?.playerId || 'anonymous'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Leaderboard fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      const leaderboard = this.processLeaderboardData(data);
      
      // Update cache
      this.leaderboardCache.set(cacheKey, leaderboard);
      this.saveCachedLeaderboard();
      
      return leaderboard;
      
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      
      // Return cached data if available
      return this.leaderboardCache.get(cacheKey) || this.getLocalLeaderboard();
    }
  }

  private processLeaderboardData(data: any[]): LeaderboardEntry[] {
    return data.map((entry, index) => ({
      rank: index + 1,
      player: entry,
      change: entry.previousRank ? 
        (entry.previousRank > index + 1 ? 'up' : 
         entry.previousRank < index + 1 ? 'down' : 'same') : 'same',
      changeAmount: Math.abs((entry.previousRank || index + 1) - (index + 1))
    }));
  }

  private getLocalLeaderboard(): LeaderboardEntry[] {
    // Generate mock leaderboard for offline play
    const mockPlayers: PlayerScore[] = [
      {
        playerId: 'ai_1',
        username: 'BlazeBot Pro',
        score: 75000,
        wins: 150,
        losses: 25,
        homeRuns: 200,
        strikeouts: 50,
        battingAverage: 0.385,
        era: 2.15,
        gamesPlayed: 175,
        winStreak: 12,
        bestScore: 15,
        rank: 1,
        tier: 'legend',
        achievements: ['all'],
        lastPlayed: Date.now(),
        createdAt: Date.now()
      },
      // Add more mock players...
    ];
    
    // Add current player
    if (this.playerScore) {
      mockPlayers.push(this.playerScore);
    }
    
    // Sort by score
    mockPlayers.sort((a, b) => b.score - a.score);
    
    return mockPlayers.map((player, index) => ({
      rank: index + 1,
      player,
      change: 'same',
      changeAmount: 0
    }));
  }

  private loadCachedLeaderboard(): void {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        Object.entries(data).forEach(([key, value]) => {
          this.leaderboardCache.set(key, value as LeaderboardEntry[]);
        });
      } catch (error) {
        console.error('Failed to load cached leaderboard:', error);
      }
    }
  }

  private saveCachedLeaderboard(): void {
    const cache: Record<string, LeaderboardEntry[]> = {};
    this.leaderboardCache.forEach((value, key) => {
      cache[key] = value;
    });
    
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
  }

  // Sync with server
  private startSyncTimer(): void {
    this.syncTimer = window.setInterval(() => {
      this.syncWithServer();
    }, this.SYNC_INTERVAL);
  }

  private async syncWithServer(): Promise<void> {
    if (this.pendingUpdates.length === 0) return;
    
    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];
    
    try {
      const response = await fetch(`${this.API_ENDPOINT}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Player-Id': this.playerScore?.playerId || 'anonymous'
        },
        body: JSON.stringify({
          updates,
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Update player rank from server
      if (result.rank && this.playerScore) {
        this.playerScore.rank = result.rank;
        this.savePlayerScore();
      }
      
      console.log('☁️ Leaderboard synced with server');
      
    } catch (error) {
      console.error('Failed to sync with server:', error);
      // Re-add updates for retry
      this.pendingUpdates.unshift(...updates);
    }
  }

  // Season management
  public async getCurrentSeason(): Promise<SeasonData | null> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/season/current`);
      
      if (!response.ok) {
        throw new Error(`Season fetch failed: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Failed to fetch season data:', error);
      return null;
    }
  }

  public async getSeasonRewards(seasonId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/season/${seasonId}/rewards`, {
        headers: {
          'X-Player-Id': this.playerScore?.playerId || 'anonymous'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Rewards fetch failed: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
      return null;
    }
  }

  // Public getters
  public getPlayerScore(): PlayerScore | null {
    return this.playerScore;
  }

  public getPlayerRank(): number {
    return this.playerScore?.rank || 0;
  }

  public getPlayerTier(): string {
    return this.playerScore?.tier || 'rookie';
  }

  public getAchievements(): string[] {
    return this.playerScore?.achievements || [];
  }

  public setUsername(username: string): void {
    if (this.playerScore) {
      this.playerScore.username = username.substring(0, 20); // Limit length
      this.savePlayerScore();
      this.pendingUpdates.push({ username: this.playerScore.username });
    }
  }

  // Cleanup
  public destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncWithServer(); // Final sync
  }
}

// Singleton instance
export const leaderboardManager = new LeaderboardManager();

// Auto-save on page unload
window.addEventListener('beforeunload', () => {
  leaderboardManager.destroy();
});