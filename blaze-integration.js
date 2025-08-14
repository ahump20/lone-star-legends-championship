/**
 * Blaze Intelligence Integration Module
 * Connects Blaze Analytics with Lone Star Legends game engine
 */

import BlazeDashboard from './blaze-dashboard.js';
import BlazeMomentumAnalyzer from './blaze-momentum-analyzer.js';
import BlazeCriticalPlayAnalyzer from './blaze-critical-plays.js';

export class BlazeIntegration {
  constructor(gameEngine, enhancedGame) {
    this.gameEngine = gameEngine;
    this.enhancedGame = enhancedGame;
    
    // Initialize Blaze components
    this.dashboard = new BlazeDashboard(document.body);
    this.momentumAnalyzer = new BlazeMomentumAnalyzer();
    this.criticalPlayAnalyzer = new BlazeCriticalPlayAnalyzer();
    
    // Game state tracking
    this.gameState = {
      inning: 1,
      topBottom: 'top',
      outs: 0,
      balls: 0,
      strikes: 0,
      homeScore: 0,
      awayScore: 0,
      runnersOnBase: 0,
      basesLoaded: false,
      consecutiveHits: 0,
      lastEvent: null
    };
    
    // Performance tracking
    this.performanceMetrics = {
      pitchCount: 0,
      totalPitchVelocity: 0,
      hardHitBalls: 0,
      totalBattedBalls: 0,
      strikeouts: 0,
      walks: 0,
      errors: 0
    };
    
    this.init();
  }

  /**
   * Initialize integration
   */
  init() {
    this.attachGameHooks();
    this.setupKeyboardShortcuts();
    this.createUI();
    
    console.log('🔥 Blaze Intelligence Integration Activated!');
  }

  /**
   * Attach hooks to game engine
   */
  attachGameHooks() {
    // Override game engine methods to capture events
    if (this.enhancedGame) {
      const originalSimulatePitch = this.enhancedGame.simulatePitch.bind(this.enhancedGame);
      this.enhancedGame.simulatePitch = (type, velocity) => {
        const result = originalSimulatePitch(type, velocity);
        this.processPitchEvent(type, velocity, result);
        return result;
      };
      
      const originalSimulateSwing = this.enhancedGame.simulateSwing.bind(this.enhancedGame);
      this.enhancedGame.simulateSwing = (params) => {
        const result = originalSimulateSwing(params);
        this.processSwingEvent(params, result);
        return result;
      };
    }
    
    // Listen for game state changes
    if (this.gameEngine) {
      // Hook into game state updates
      const originalUpdate = this.gameEngine.updateGameState?.bind(this.gameEngine);
      if (originalUpdate) {
        this.gameEngine.updateGameState = (deltaTime) => {
          originalUpdate(deltaTime);
          this.updateGameState();
        };
      }
    }
  }

  /**
   * Process pitch event
   */
  processPitchEvent(type, velocity, result) {
    // Update metrics
    this.performanceMetrics.pitchCount++;
    this.performanceMetrics.totalPitchVelocity += velocity;
    
    // Determine outcome
    let eventType = 'pitch';
    if (result && result.strike) {
      this.gameState.strikes++;
      if (this.gameState.strikes >= 3) {
        eventType = 'strikeout';
        this.performanceMetrics.strikeouts++;
        this.handleOut();
      }
    } else if (result && result.ball) {
      this.gameState.balls++;
      if (this.gameState.balls >= 4) {
        eventType = 'walk';
        this.performanceMetrics.walks++;
        this.handleWalk();
      }
    }
    
    // Create event for analyzers
    const event = {
      type: eventType,
      team: this.gameState.topBottom === 'top' ? 'away' : 'home',
      inning: this.gameState.inning,
      topBottom: this.gameState.topBottom,
      outs: this.gameState.outs,
      balls: this.gameState.balls,
      strikes: this.gameState.strikes,
      velocity: velocity,
      pitchType: type,
      scoreDifferential: this.gameState.homeScore - this.gameState.awayScore,
      runnersOnBase: this.gameState.runnersOnBase
    };
    
    // Process through Blaze analyzers
    this.processGameEvent(event);
  }

  /**
   * Process swing event
   */
  processSwingEvent(params, result) {
    if (!result || !result.outcome) return;
    
    const outcome = result.outcome;
    let eventType = outcome.type;
    
    // Track batting stats
    this.performanceMetrics.totalBattedBalls++;
    if (result.contact && result.contact.exitVelocity > 95) {
      this.performanceMetrics.hardHitBalls++;
    }
    
    // Handle hits
    if (['single', 'double', 'triple', 'homerun'].includes(eventType)) {
      this.gameState.consecutiveHits++;
      this.resetCount();
    } else {
      this.gameState.consecutiveHits = 0;
    }
    
    // Handle outs
    if (['flyout', 'groundout', 'lineout', 'strikeout'].includes(eventType)) {
      this.handleOut();
    }
    
    // Create play event
    const play = {
      type: eventType,
      player: `Batter ${this.gameState.topBottom}`,
      runsScored: outcome.rbis || 0,
      exitVelocity: result.contact?.exitVelocity,
      launchAngle: result.contact?.launchAngle,
      distance: result.trajectory ? 
        this.calculateDistance(result.trajectory) : 0
    };
    
    const gameContext = {
      inning: this.gameState.inning,
      topBottom: this.gameState.topBottom,
      outs: this.gameState.outs,
      balls: this.gameState.balls,
      strikes: this.gameState.strikes,
      homeScore: this.gameState.homeScore,
      awayScore: this.gameState.awayScore,
      scoreDifferential: this.gameState.homeScore - this.gameState.awayScore,
      runnersOnBase: this.gameState.runnersOnBase,
      basesLoaded: this.gameState.basesLoaded,
      consecutiveHits: this.gameState.consecutiveHits
    };
    
    // Process critical play
    const criticalResult = this.criticalPlayAnalyzer.analyzePlay(play, gameContext);
    
    // Process momentum event
    const momentumEvent = {
      type: eventType,
      team: this.gameState.topBottom === 'top' ? 'away' : 'home',
      inning: this.gameState.inning,
      ...gameContext
    };
    
    const momentumResult = this.momentumAnalyzer.processEvent(momentumEvent);
    
    // Update dashboard
    this.dashboard.processGameEvent({
      play: play,
      context: gameContext
    });
    
    // Show notification for critical plays
    if (criticalResult.isCritical) {
      this.showCriticalPlayNotification(criticalResult);
    }
  }

  /**
   * Process general game event
   */
  processGameEvent(event) {
    // Process through momentum analyzer
    const momentumResult = this.momentumAnalyzer.processEvent(event);
    
    // Check for significant momentum shifts
    if (momentumResult.isSignificant) {
      this.showMomentumNotification(momentumResult);
    }
    
    // Update dashboard
    if (this.dashboard.isVisible) {
      this.dashboard.updateDashboard();
    }
  }

  /**
   * Handle out
   */
  handleOut() {
    this.gameState.outs++;
    this.resetCount();
    
    // Apply momentum decay
    this.momentumAnalyzer.applyDecay();
    
    if (this.gameState.outs >= 3) {
      this.switchHalfInning();
    }
  }

  /**
   * Handle walk
   */
  handleWalk() {
    this.resetCount();
    this.gameState.runnersOnBase = Math.min(3, this.gameState.runnersOnBase + 1);
    this.gameState.basesLoaded = this.gameState.runnersOnBase === 3;
  }

  /**
   * Reset count
   */
  resetCount() {
    this.gameState.balls = 0;
    this.gameState.strikes = 0;
  }

  /**
   * Switch half inning
   */
  switchHalfInning() {
    if (this.gameState.topBottom === 'top') {
      this.gameState.topBottom = 'bottom';
    } else {
      this.gameState.topBottom = 'top';
      this.gameState.inning++;
    }
    
    this.gameState.outs = 0;
    this.gameState.runnersOnBase = 0;
    this.gameState.basesLoaded = false;
    this.gameState.consecutiveHits = 0;
    this.resetCount();
  }

  /**
   * Update game state from engine
   */
  updateGameState() {
    // Sync with game engine state if available
    if (this.enhancedGame) {
      const stats = this.enhancedGame.getGameStats();
      if (stats && stats.gameState) {
        // Update our tracked state
        this.gameState.outs = stats.gameState.outs || 0;
        this.gameState.balls = stats.gameState.balls || 0;
        this.gameState.strikes = stats.gameState.strikes || 0;
      }
    }
  }

  /**
   * Calculate distance from trajectory
   */
  calculateDistance(trajectory) {
    if (!trajectory || trajectory.length === 0) return 0;
    
    const lastPoint = trajectory[trajectory.length - 1];
    return Math.sqrt(lastPoint.x * lastPoint.x + lastPoint.z * lastPoint.z);
  }

  /**
   * Show critical play notification
   */
  showCriticalPlayNotification(result) {
    const notification = document.createElement('div');
    notification.className = 'blaze-notification critical';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">🔥</span>
        <div class="notification-text">
          <strong>CRITICAL PLAY!</strong>
          <p>${result.description}</p>
          <small>Impact: ${(result.impact * 100).toFixed(0)}%</small>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }

  /**
   * Show momentum notification
   */
  showMomentumNotification(result) {
    const notification = document.createElement('div');
    notification.className = 'blaze-notification momentum';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">📈</span>
        <div class="notification-text">
          <strong>MOMENTUM SHIFT!</strong>
          <p>${result.description}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // B key for Blaze Dashboard
      if (e.key === 'b' || e.key === 'B') {
        this.dashboard.toggle();
      }
      
      // M key for momentum view
      if (e.key === 'm' || e.key === 'M') {
        this.dashboard.show();
        this.dashboard.switchTab('momentum');
      }
      
      // C key for critical plays
      if (e.key === 'c' || e.key === 'C') {
        if (!e.ctrlKey && !e.metaKey) { // Don't interfere with copy
          this.dashboard.show();
          this.dashboard.switchTab('critical');
        }
      }
    });
  }

  /**
   * Create UI elements
   */
  createUI() {
    // Add Blaze button to game UI
    const blazeButton = document.createElement('button');
    blazeButton.id = 'blaze-toggle-btn';
    blazeButton.className = 'blaze-toggle-button';
    blazeButton.innerHTML = '🔥 Blaze Analytics';
    blazeButton.onclick = () => this.dashboard.toggle();
    
    // Add to game container or body
    const gameContainer = document.querySelector('.game-container') || document.body;
    gameContainer.appendChild(blazeButton);
    
    // Add notification styles
    this.addNotificationStyles();
  }

  /**
   * Add notification styles
   */
  addNotificationStyles() {
    if (document.getElementById('blaze-notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'blaze-notification-styles';
    style.textContent = `
      .blaze-toggle-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #FF6B6B, #FFD93D);
        border: none;
        border-radius: 30px;
        color: white;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        transition: all 0.3s ease;
        z-index: 1000;
      }
      
      .blaze-toggle-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
      }
      
      .blaze-notification {
        position: fixed;
        top: 20px;
        right: -400px;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-left: 4px solid #FFD93D;
        border-radius: 10px;
        padding: 15px;
        min-width: 300px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        transition: right 0.3s ease;
        z-index: 10001;
      }
      
      .blaze-notification.show {
        right: 20px;
      }
      
      .blaze-notification.critical {
        border-left-color: #FF6B6B;
        background: linear-gradient(135deg, #2e1a1a, #3e1621);
      }
      
      .blaze-notification.momentum {
        border-left-color: #4CAF50;
        background: linear-gradient(135deg, #1a2e1a, #21Value continues with original code
`;
        
    
    document.head.appendChild(style);
  }

  /**
   * Get current analytics data
   */
  getAnalytics() {
    return {
      momentum: this.momentumAnalyzer.getVisualizationData(),
      critical: this.criticalPlayAnalyzer.getVisualizationData(),
      predictions: this.momentumAnalyzer.getPredictions(),
      metrics: this.performanceMetrics,
      gameState: this.gameState
    };
  }

  /**
   * Reset for new game
   */
  reset() {
    this.momentumAnalyzer.reset();
    this.criticalPlayAnalyzer.reset();
    this.dashboard.reset();
    
    // Reset game state
    this.gameState = {
      inning: 1,
      topBottom: 'top',
      outs: 0,
      balls: 0,
      strikes: 0,
      homeScore: 0,
      awayScore: 0,
      runnersOnBase: 0,
      basesLoaded: false,
      consecutiveHits: 0,
      lastEvent: null
    };
    
    // Reset metrics
    this.performanceMetrics = {
      pitchCount: 0,
      totalPitchVelocity: 0,
      hardHitBalls: 0,
      totalBattedBalls: 0,
      strikeouts: 0,
      walks: 0,
      errors: 0
    };
  }
}

export default BlazeIntegration;