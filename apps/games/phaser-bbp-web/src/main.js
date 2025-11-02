/**
 * Main game entry point
 * Initializes Phaser and starts the game
 */

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: GAME_CONFIG.COLORS.SKY,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME_CONFIG.GRAVITY },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container'
  },
  scene: [BootScene, MenuScene, GameScene, UIScene]
};

// Initialize game
const game = new Phaser.Game(config);

// Hide loading screen once game is ready
game.events.on('ready', () => {
  setTimeout(() => {
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
  }, 500);
});

// Analytics tracking (lightweight)
const trackEvent = (eventName, data = {}) => {
  if (typeof window.BlazeAnalytics !== 'undefined') {
    window.BlazeAnalytics.trackEvent(eventName, data);
  }
};

// Track game start
trackEvent('phaser_game_started', {
  timestamp: Date.now(),
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  }
});

// Track session duration on unload
window.addEventListener('beforeunload', () => {
  trackEvent('phaser_game_session_end', {
    duration: performance.now()
  });
});
