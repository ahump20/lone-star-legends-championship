/**
 * Enhanced Main Entry Point for Lone Star Legends
 * Integrates sportyR field geometry and physics enhancements
 */

import { GameEngine } from './engine.js';
import EnhancedGameIntegration from './enhanced-game-integration.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌟 Lone Star Legends: Championship Edition 🌟');
  console.log('Enhanced with sportyR field geometry and realistic physics!');
  
  // Get or create game container
  const container = document.querySelector('.baseball-game') || createGameContainer();
  
  // Initialize platform services (if available)
  const platformServices = {
    cloudflare: window.cloudflareServices || null,
    achievements: window.achievementSystem || null
  };
  
  // Game configuration
  const gameConfig = {
    league: 'mlb', // Use MLB field dimensions
    difficulty: 'normal',
    features: {
      physics: true,
      statistics: true,
      fieldGeometry: true,
      animations: true
    }
  };
  
  // Initialize base game engine
  const gameEngine = new GameEngine({
    container,
    platformServices,
    config: gameConfig
  });
  
  // Initialize enhanced features
  const enhancedGame = new EnhancedGameIntegration(gameEngine);
  await enhancedGame.initialize();
  
  // Make game globally accessible for debugging
  window.loneStarLegends = {
    engine: gameEngine,
    enhanced: enhancedGame,
    debug: {
      simulatePitch: (type, speed) => enhancedGame.simulatePitch(type, speed),
      simulateSwing: (params) => enhancedGame.simulateSwing(params),
      getStats: () => enhancedGame.getGameStats(),
      saveGame: () => enhancedGame.saveGame(),
      loadGame: () => enhancedGame.loadGame()
    }
  };
  
  // Setup UI controls
  setupGameControls(enhancedGame);
  
  // Start the game engine
  await gameEngine.start();
  
  // Check for saved game
  if (localStorage.getItem('loneStarLegends_save')) {
    const loadSave = confirm('Found saved game. Would you like to load it?');
    if (loadSave) {
      enhancedGame.loadGame();
    }
  }
  
  console.log('Game initialized successfully! Play ball! ⚾');
});

/**
 * Create game container if it doesn't exist
 */
function createGameContainer() {
  const container = document.createElement('div');
  container.className = 'baseball-game';
  container.innerHTML = `
    <div class="game-header">
      <h1>⭐ Lone Star Legends ⭐</h1>
      <p>Championship Edition with Enhanced Physics</p>
    </div>
    <div class="game-content">
      <div class="game-viewport"></div>
      <div class="game-controls"></div>
      <div class="game-stats"></div>
    </div>
  `;
  document.body.appendChild(container);
  return container;
}

/**
 * Setup game control UI
 */
function setupGameControls(enhancedGame) {
  const controlsContainer = document.querySelector('.game-controls') || createControlsPanel();
  
  controlsContainer.innerHTML = `
    <div class="control-panel">
      <h3>Game Controls</h3>
      
      <div class="pitch-controls">
        <h4>Pitching</h4>
        <button id="pitch-fastball">Fastball (90 mph)</button>
        <button id="pitch-curveball">Curveball (78 mph)</button>
        <button id="pitch-slider">Slider (85 mph)</button>
        <button id="pitch-changeup">Changeup (82 mph)</button>
      </div>
      
      <div class="batting-controls">
        <h4>Batting</h4>
        <button id="swing-power">Power Swing</button>
        <button id="swing-contact">Contact Swing</button>
        <button id="swing-bunt">Bunt</button>
      </div>
      
      <div class="game-actions">
        <h4>Game</h4>
        <button id="save-game">Save Game</button>
        <button id="load-game">Load Game</button>
        <button id="view-stats">View Stats</button>
        <button id="reset-game">New Game</button>
      </div>
    </div>
    
    <div class="stats-panel" id="stats-display" style="display: none;">
      <h3>Game Statistics</h3>
      <div id="stats-content"></div>
      <button id="close-stats">Close</button>
    </div>
  `;
  
  // Attach event listeners
  attachControlListeners(enhancedGame, controlsContainer);
}

/**
 * Create controls panel if it doesn't exist
 */
function createControlsPanel() {
  const panel = document.createElement('div');
  panel.className = 'game-controls';
  panel.style.cssText = `
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #8B4513;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    max-width: 250px;
  `;
  document.body.appendChild(panel);
  return panel;
}

/**
 * Attach event listeners to control buttons
 */
function attachControlListeners(enhancedGame, container) {
  // Pitching controls
  container.querySelector('#pitch-fastball')?.addEventListener('click', () => {
    enhancedGame.simulatePitch('fastball', 90);
  });
  
  container.querySelector('#pitch-curveball')?.addEventListener('click', () => {
    enhancedGame.simulatePitch('curveball', 78);
  });
  
  container.querySelector('#pitch-slider')?.addEventListener('click', () => {
    enhancedGame.simulatePitch('slider', 85);
  });
  
  container.querySelector('#pitch-changeup')?.addEventListener('click', () => {
    enhancedGame.simulatePitch('changeup', 82);
  });
  
  // Batting controls
  container.querySelector('#swing-power')?.addEventListener('click', () => {
    enhancedGame.simulateSwing({
      batSpeed: 80,
      batAngle: 25,
      timing: 'perfect'
    });
  });
  
  container.querySelector('#swing-contact')?.addEventListener('click', () => {
    enhancedGame.simulateSwing({
      batSpeed: 65,
      batAngle: 5,
      timing: 'perfect',
      contactPoint: 'center'
    });
  });
  
  container.querySelector('#swing-bunt')?.addEventListener('click', () => {
    enhancedGame.simulateSwing({
      batSpeed: 30,
      batAngle: -5,
      timing: 'perfect',
      contactPoint: 'upper'
    });
  });
  
  // Game actions
  container.querySelector('#save-game')?.addEventListener('click', () => {
    enhancedGame.saveGame();
    alert('Game saved successfully!');
  });
  
  container.querySelector('#load-game')?.addEventListener('click', () => {
    if (enhancedGame.loadGame()) {
      alert('Game loaded successfully!');
    } else {
      alert('No saved game found!');
    }
  });
  
  container.querySelector('#view-stats')?.addEventListener('click', () => {
    const statsDisplay = container.querySelector('#stats-display');
    const statsContent = container.querySelector('#stats-content');
    
    if (statsDisplay && statsContent) {
      const stats = enhancedGame.getGameStats();
      
      // Format stats for display
      let statsHTML = `
        <div class="game-summary">
          <h4>Game Summary</h4>
          <p>Inning: ${stats.summary.inning}</p>
          <p>Score: Home ${stats.summary.score.home} - Away ${stats.summary.score.away}</p>
          <p>Hits: Home ${stats.summary.hits.home} - Away ${stats.summary.hits.away}</p>
          <p>Errors: Home ${stats.summary.errors.home} - Away ${stats.summary.errors.away}</p>
        </div>
        
        <div class="leaderboard">
          <h4>Top Batters</h4>
          <ol>
      `;
      
      stats.leaderboard.forEach(player => {
        statsHTML += `<li>${player.name}: ${player.batting.battingAverage} AVG</li>`;
      });
      
      statsHTML += `
          </ol>
        </div>
      `;
      
      statsContent.innerHTML = statsHTML;
      statsDisplay.style.display = 'block';
    }
  });
  
  container.querySelector('#close-stats')?.addEventListener('click', () => {
    const statsDisplay = container.querySelector('#stats-display');
    if (statsDisplay) {
      statsDisplay.style.display = 'none';
    }
  });
  
  container.querySelector('#reset-game')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to start a new game? This will reset all progress.')) {
      localStorage.removeItem('loneStarLegends_save');
      location.reload();
    }
  });
  
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    switch(e.key) {
      case ' ': // Spacebar for swing
        e.preventDefault();
        enhancedGame.simulateSwing();
        break;
      case 'p': // P for pitch
        enhancedGame.simulatePitch();
        break;
      case 's': // S for save
        if (e.ctrlKey) {
          e.preventDefault();
          enhancedGame.saveGame();
        }
        break;
      case 'l': // L for load
        if (e.ctrlKey) {
          e.preventDefault();
          enhancedGame.loadGame();
        }
        break;
    }
  });
}

// Add some basic styling
const style = document.createElement('style');
style.textContent = `
  .control-panel {
    font-family: Arial, sans-serif;
  }
  
  .control-panel h3 {
    color: #2E8B57;
    margin-bottom: 15px;
  }
  
  .control-panel h4 {
    color: #8B4513;
    margin: 10px 0 5px 0;
    font-size: 14px;
  }
  
  .control-panel button {
    display: block;
    width: 100%;
    padding: 8px;
    margin: 5px 0;
    background: linear-gradient(to bottom, #4CAF50, #45a049);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.3s;
  }
  
  .control-panel button:hover {
    background: linear-gradient(to bottom, #45a049, #4CAF50);
  }
  
  .stats-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 3px solid #8B4513;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.5);
    z-index: 1000;
    max-width: 400px;
  }
  
  .game-summary, .leaderboard {
    margin: 15px 0;
  }
  
  .game-summary p {
    margin: 5px 0;
  }
  
  .leaderboard ol {
    margin-left: 20px;
  }
  
  #gameFieldCanvas {
    background: linear-gradient(to bottom, #87CEEB, #98FB98);
  }
`;
document.head.appendChild(style);

// Export for module usage
export default {
  GameEngine,
  EnhancedGameIntegration
};