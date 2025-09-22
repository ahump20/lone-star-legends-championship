/**
 * Blaze Intelligence Analytics Engine
 * Championship-level telemetry and player behavior tracking
 */

interface AnalyticsEvent {
  eventType: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface GameplayMetrics {
  battingAverage: number;
  homeRuns: number;
  strikeouts: number;
  gamesPlayed: number;
  gamesWon: number;
  totalPlayTime: number;
  favoriteMode: string;
  favoriteTeam: string;
}

interface PerformanceMetrics {
  fps: number[];
  loadTime: number;
  memoryUsage: number;
  deviceInfo: {
    platform: string;
    userAgent: string;
    screenResolution: string;
    touchEnabled: boolean;
  };
}

export class BlazeAnalytics {
  private sessionId: string;
  private userId: string | null = null;
  private events: AnalyticsEvent[] = [];
  private gameplayMetrics: GameplayMetrics;
  private performanceMetrics: PerformanceMetrics;
  private batchTimer: number | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_INTERVAL = 30000; // 30 seconds
  private readonly ANALYTICS_ENDPOINT = 'https://api.blaze-intelligence.com/analytics';
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMetrics();
    this.setupPerformanceTracking();
    this.loadUserId();
    this.startBatchTimer();
    
    console.log('📊 Blaze Analytics initialized:', this.sessionId);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): void {
    this.gameplayMetrics = {
      battingAverage: 0,
      homeRuns: 0,
      strikeouts: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      totalPlayTime: 0,
      favoriteMode: '',
      favoriteTeam: ''
    };

    this.performanceMetrics = {
      fps: [],
      loadTime: performance.now(),
      memoryUsage: 0,
      deviceInfo: {
        platform: navigator.platform || 'unknown',
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        touchEnabled: 'ontouchstart' in window
      }
    };
  }

  private setupPerformanceTracking(): void {
    // Track FPS
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        this.performanceMetrics.fps.push(fps);
        
        // Keep only last 60 FPS measurements
        if (this.performanceMetrics.fps.length > 60) {
          this.performanceMetrics.fps.shift();
        }
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);

    // Track memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.performanceMetrics.memoryUsage = memory.usedJSHeapSize / 1048576; // Convert to MB
      }, 10000);
    }
  }

  private loadUserId(): void {
    // Try to load from localStorage
    const stored = localStorage.getItem('blazeUserId');
    if (stored) {
      this.userId = stored;
    } else {
      // Generate new user ID
      this.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('blazeUserId', this.userId);
    }
  }

  private startBatchTimer(): void {
    this.batchTimer = window.setInterval(() => {
      this.flushEvents();
    }, this.BATCH_INTERVAL);
  }

  // Public tracking methods
  public trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      eventType: 'custom',
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      metadata
    };

    this.events.push(event);
    
    // Flush if batch size reached
    if (this.events.length >= this.BATCH_SIZE) {
      this.flushEvents();
    }
  }

  // Game-specific tracking
  public trackGameStart(mode: string, difficulty: string): void {
    this.trackEvent('game', 'start', mode, undefined, { difficulty });
    this.gameplayMetrics.gamesPlayed++;
  }

  public trackGameEnd(won: boolean, score: number, duration: number): void {
    this.trackEvent('game', 'end', won ? 'win' : 'loss', score, { duration });
    
    if (won) {
      this.gameplayMetrics.gamesWon++;
    }
    
    this.gameplayMetrics.totalPlayTime += duration;
  }

  public trackSwing(result: 'hit' | 'miss' | 'homerun' | 'foul'): void {
    this.trackEvent('gameplay', 'swing', result);
    
    if (result === 'homerun') {
      this.gameplayMetrics.homeRuns++;
    }
  }

  public trackPitch(type: string, result: 'strike' | 'ball' | 'hit'): void {
    this.trackEvent('gameplay', 'pitch', type, undefined, { result });
    
    if (result === 'strike') {
      this.gameplayMetrics.strikeouts++;
    }
  }

  public trackModeSelection(mode: string): void {
    this.trackEvent('ui', 'mode_select', mode);
    
    // Track favorite mode
    const modeCount = this.getModePlayCount();
    modeCount[mode] = (modeCount[mode] || 0) + 1;
    
    this.gameplayMetrics.favoriteMode = Object.entries(modeCount)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  public trackTeamSelection(team: string): void {
    this.trackEvent('ui', 'team_select', team);
    
    // Track favorite team
    const teamCount = this.getTeamPlayCount();
    teamCount[team] = (teamCount[team] || 0) + 1;
    
    this.gameplayMetrics.favoriteTeam = Object.entries(teamCount)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  public trackError(error: Error, context?: string): void {
    this.trackEvent('error', error.name, error.message, undefined, {
      stack: error.stack,
      context
    });
  }

  public trackPerformance(): void {
    const avgFPS = this.performanceMetrics.fps.length > 0
      ? this.performanceMetrics.fps.reduce((a, b) => a + b, 0) / this.performanceMetrics.fps.length
      : 0;
    
    this.trackEvent('performance', 'metrics', 'fps', avgFPS, {
      memory: this.performanceMetrics.memoryUsage,
      loadTime: this.performanceMetrics.loadTime,
      device: this.performanceMetrics.deviceInfo
    });
  }

  // Achievement tracking
  public trackAchievement(achievement: string, points: number): void {
    this.trackEvent('achievement', 'unlock', achievement, points);
    
    // Store achievement locally
    const achievements = this.getAchievements();
    achievements[achievement] = {
      unlockedAt: Date.now(),
      points
    };
    localStorage.setItem('blazeAchievements', JSON.stringify(achievements));
  }

  // Data persistence helpers
  private getModePlayCount(): Record<string, number> {
    const stored = localStorage.getItem('blazeModeCount');
    return stored ? JSON.parse(stored) : {};
  }

  private getTeamPlayCount(): Record<string, number> {
    const stored = localStorage.getItem('blazeTeamCount');
    return stored ? JSON.parse(stored) : {};
  }

  private getAchievements(): Record<string, any> {
    const stored = localStorage.getItem('blazeAchievements');
    return stored ? JSON.parse(stored) : {};
  }

  // Batch event sending
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;
    
    const eventsToSend = [...this.events];
    this.events = [];
    
    try {
      // In production, send to analytics endpoint
      if (this.ANALYTICS_ENDPOINT && !window.location.hostname.includes('localhost')) {
        const response = await fetch(this.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': this.sessionId,
            'X-User-Id': this.userId || 'anonymous'
          },
          body: JSON.stringify({
            events: eventsToSend,
            metrics: {
              gameplay: this.gameplayMetrics,
              performance: this.performanceMetrics
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`Analytics failed: ${response.status}`);
        }
      } else {
        // In development, log to console
        console.log('📊 Analytics Batch:', {
          sessionId: this.sessionId,
          userId: this.userId,
          eventCount: eventsToSend.length,
          events: eventsToSend
        });
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Re-add events to queue for retry
      this.events.unshift(...eventsToSend);
    }
  }

  // Privacy-compliant data export
  public exportUserData(): object {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      gameplayMetrics: this.gameplayMetrics,
      achievements: this.getAchievements(),
      modePreferences: this.getModePlayCount(),
      teamPreferences: this.getTeamPlayCount()
    };
  }

  // Privacy-compliant data deletion
  public deleteUserData(): void {
    localStorage.removeItem('blazeUserId');
    localStorage.removeItem('blazeAchievements');
    localStorage.removeItem('blazeModeCount');
    localStorage.removeItem('blazeTeamCount');
    
    this.userId = null;
    this.events = [];
    this.initializeMetrics();
    
    console.log('🗑️ User data deleted');
  }

  // Cleanup
  public destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    this.flushEvents();
  }
}

// Singleton instance
export const analytics = new BlazeAnalytics();

// Auto-track page visibility
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    analytics.trackEvent('session', 'background');
    analytics.flushEvents();
  } else {
    analytics.trackEvent('session', 'foreground');
  }
});

// Auto-track before unload
window.addEventListener('beforeunload', () => {
  analytics.trackEvent('session', 'end');
  analytics.trackPerformance();
  analytics.flushEvents();
});