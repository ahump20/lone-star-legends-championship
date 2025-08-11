/**
 * Main Game Entry Point
 * Initializes the game after platform services are ready
 */

import './styles/game.css';
import { GameEngine } from './game/engine.js';
import { PlatformOrchestrator } from './platform/orchestrator.js';

// Wait for DOM and platform services
async function initGame() {
  console.log('Lone Star Legends Championship - Initializing...');
  
  // Initialize platform orchestration
  const orchestrator = new PlatformOrchestrator(window.GAME_CONFIG);
  await orchestrator.initialize();
  
  // Store globally for debugging
  window.gameOrchestrator = orchestrator;
  
  // Initialize game engine with platform services
  const gameEngine = new GameEngine({
    container: document.getElementById('game-root'),
    platformServices: orchestrator.getServices(),
    config: window.GAME_CONFIG
  });
  
  // Start the game
  await gameEngine.start();
  
  // Remove loading state
  const loadingElement = document.querySelector('.loading-state');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  console.log('Game initialized successfully');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}