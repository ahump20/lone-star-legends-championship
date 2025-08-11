/*
 * Lone Star Legends Championship - Client Integration
 * Bridges static GitHub Pages with edge intelligence
 * Memphis defense, Texas scale, Austin orchestration
 */

class LoneStarGameClient {
  constructor(config = {}) {
    this.config = {
      cloudflareWorkerUrl: config.cloudflareWorkerUrl || 'https://lone-star-worker.YOUR-SUBDOMAIN.workers.dev',
      netlifyPreviewUrl: config.netlifyPreviewUrl || null,
      environment: config.environment || 'production',
      debug: config.debug || false
    };
    this.sessionToken = localStorage.getItem('lone_star_session');
    this.playerId = localStorage.getItem('lone_star_player_id');
    this.playerState = null;
    this.featureFlags = {};
    // Initialize on construction
    this.init();
  }
  async init() {
    // Check for injected state from Cloudflare Worker
    if (window.__GAME_STATE__) {
      this.playerState = window.__GAME_STATE__;
      this.log('State injected from edge worker');
    }
    // Load feature flags if in preview
    if (this.config.environment === 'preview' && this.config.netlifyPreviewUrl) {
      await this.loadFeatureFlags();
    }
    // Validate session or create new player
    if (this.sessionToken) {
      await this.validateSession();
    }
    // Set up analytics tracking
    this.setupAnalytics();
  }
  // Core Player Management
  async createPlayer(username) {
    const endpoint = `${this.getApiUrl()}/api/player/create`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ username })
      });
      if (!response.ok) throw new Error('Failed to create player');
      const data = await response.json();
      this.sessionToken = data.sessionToken;
      this.playerId = data.playerId;
      this.playerState = data.player;
      localStorage.setItem('lone_star_session', this.sessionToken);
      localStorage.setItem('lone_star_player_id', this.playerId);
      this.log('Player created:', this.playerId);
      return data;
    } catch (error) {
      this.handleError('createPlayer', error);
      throw error;
    }
  }
  async validateSession() {
    if (!this.sessionToken) return false;
    try {
      const response = await fetch(`${this.getApiUrl()}/api/player/state`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (response.ok) {
        this.playerState = await response.json();
        this.log('Session validated');
        return true;
      } else if (response.status === 401 || response.status === 403) {
        this.clearSession();
        return false;
      }
    } catch (error) {
      this.handleError('validateSession', error);
      return false;
    }
  }
  async updatePlayerState(updates) {
    if (!this.sessionToken) {
      throw new Error('No active session');
    }
    try {
      const response = await fetch(`${this.getApiUrl()}/api/player/state`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update state');
      this.playerState = await response.json();
      this.log('State updated:', updates);
      return this.playerState;
    } catch (error) {
      this.handleError('updatePlayerState', error);
      throw error;
    }
  }
  // Leaderboard Operations
  async submitScore(score, context = {}) {
    if (!this.sessionToken) {
      throw new Error('No active session');
    }
    try {
      const response = await fetch(`${this.getApiUrl()}/api/leaderboard/submit`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ score, context })
      });
      if (!response.ok) throw new Error('Failed to submit score');
      const data = await response.json();
      this.log('Score submitted:', score);
      if (this.playerState && score > (this.playerState.highScore || 0)) {
        await this.unlockAchievement('new_high_score');
      }
      return data;
    } catch (error) {
      this.handleError('submitScore', error);
      throw error;
    }
  }
  async getLeaderboard() {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/leaderboard`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const leaderboard = await response.json();
      this.log('Leaderboard fetched:', leaderboard.length, 'entries');
      return leaderboard;
    } catch (error) {
      this.handleError('getLeaderboard', error);
      return [];
    }
  }
  // AI-Powered Features (Preview/HuggingFace)
  async getNPCDialogue(npcName, context = {}) {
    if (!this.isFeatureEnabled('dynamic_npcs')) {
      return this.getStaticNPCDialogue(npcName);
    }
    if (this.config.environment !== 'preview' || !this.config.netlifyPreviewUrl) {
      return this.getStaticNPCDialogue(npcName);
    }
    try {
      const response = await fetch(`${this.config.netlifyPreviewUrl}/game-api/ai/npc-dialogue`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          npcName,
          playerContext: {
            level: this.playerState?.level || 1,
            achievements: this.playerState?.achievements || []
          },
          dialogueHistory: context.history || []
        })
      });
      if (!response.ok) throw new Error('Failed to get NPC dialogue');
      const data = await response.json();
      this.log('NPC dialogue received:', data.source);
      return data.dialogue;
    } catch (error) {
      this.handleError('getNPCDialogue', error);
      return this.getStaticNPCDialogue(npcName);
    }
  }
  getStaticNPCDialogue(npcName) {
    const dialogues = {
      Sheriff_McGraw: 'Keep the peace, partner.',
      Merchant_Sally: 'Best prices in town!',
      Mysterious_Stranger: 'Destiny awaits...'
    };
    return dialogues[npcName] || '...';
  }
  // Community Features (Notion Integration)
  async submitFeedback(category, message, additionalData = {}) {
    if (this.config.environment !== 'preview' || !this.config.netlifyPreviewUrl) {
      console.log('Feedback (local):', { category, message });
      return { success: true, method: 'local' };
    }
    try {
      const response = await fetch(`${this.config.netlifyPreviewUrl}/game-api/feedback`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          category,
          message,
          playerInfo: {
            id: this.playerId,
            username: this.playerState?.username
          },
          sessionData: {
            ...additionalData,
            timestamp: Date.now(),
            environment: this.config.environment
          }
        })
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      const data = await response.json();
      this.log('Feedback submitted:', data.method);
      return data;
    } catch (error) {
      this.handleError('submitFeedback', error);
      return { success: false, error: error.message };
    }
  }
  // Achievement System
  async unlockAchievement(achievementKey) {
    if (!this.playerState) return;
    if (this.playerState.achievements?.includes(achievementKey)) {
      return false;
    }
    const achievements = [...(this.playerState.achievements || []), achievementKey];
    await this.updatePlayerState({ achievements });
    this.triggerAchievementNotification(achievementKey);
    this.trackEvent('achievement_unlocked', { achievement: achievementKey });
    return true;
  }
  triggerAchievementNotification(achievementKey) {
    const achievements = {
      frontier_arrival: 'Welcome to the Frontier',
      first_victory: 'First Victory',
      new_high_score: 'New High Score',
      legend_status: 'Legendary Status Achieved'
    };
    const title = achievements[achievementKey] || 'Achievement Unlocked';
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <div class="achievement-title">${title}</div>
        <div class="achievement-key">${achievementKey}</div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
  // Analytics
  setupAnalytics() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('game_backgrounded');
      } else {
        this.trackEvent('game_resumed');
      }
    });
    this.trackEvent('session_start', {
      environment: this.config.environment,
      playerId: this.playerId
    });
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        duration: performance.now()
      });
    });
  }
  async trackEvent(eventName, properties = {}) {
    const endpoint = this.config.environment === 'preview' && this.config.netlifyPreviewUrl
      ? `${this.config.netlifyPreviewUrl}/game-api/analytics/preview`
      : `${this.getApiUrl()}/api/analytics/event`;
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          event: eventName,
          properties: {
            ...properties,
            timestamp: Date.now(),
            environment: this.config.environment
          }
        })
      });
      this.log('Event tracked:', eventName);
    } catch (error) {
      this.log('Analytics error:', error);
    }
  }
  // Feature Flags
  async loadFeatureFlags() {
    if (!this.config.netlifyPreviewUrl) return;
    try {
      const response = await fetch(`${this.config.netlifyPreviewUrl}/game-api/features`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        this.featureFlags = data.features.reduce((acc, flag) => {
          acc[flag.name] = flag.enabled;
          return acc;
        }, {});
        this.log('Feature flags loaded:', this.featureFlags);
      }
    } catch (error) {
      this.log('Failed to load feature flags:', error);
    }
  }
  isFeatureEnabled(featureName) {
    return this.featureFlags[featureName] || false;
  }
  // Utility Methods
  getApiUrl() {
    return this.config.cloudflareWorkerUrl;
  }
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.sessionToken) {
      headers['X-Session-Token'] = this.sessionToken;
    }
    if (this.config.environment === 'preview') {
      headers['X-Preview-Mode'] = 'true';
    }
    return headers;
  }
  clearSession() {
    this.sessionToken = null;
    this.playerId = null;
    this.playerState = null;
    localStorage.removeItem('lone_star_session');
    localStorage.removeItem('lone_star_player_id');
    this.log('Session cleared');
  }
  handleError(method, error) {
    console.error(`[LoneStarGame] ${method} error:`, error);
    this.trackEvent('error', {
      method,
      error: error.message,
      stack: error.stack
    });
  }
  log(...args) {
    if (this.config.debug) {
      console.log('[LoneStarGame]', ...args);
    }
  }
}
// Auto-initialize if on GitHub Pages
if (window.location.hostname.includes('github.io')) {
  window.LoneStarGame = new LoneStarGameClient({
    environment: 'production',
    debug: true
  });
  console.log('Lone Star Legends Championship - Game Client Initialized');
  console.log('Access via: window.LoneStarGame');
}
// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoneStarGameClient;
}