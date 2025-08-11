// ============================================
// LONE STAR LEGENDS CHAMPIONSHIP
// Complete Platform Integration Suite
// ============================================

// ============================================
// 1. GITHUB PAGES FIX - index.html
// ============================================
const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lone Star Legends Championship</title>
  
  <!-- Critical: Fix base path for GitHub Pages -->
  <base href="/lone-star-legends-championship/">
  
  <style>
    /* Immediate visual feedback during load */
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #1a1a2e, #0f0f1e);
      color: #f0f0f0;
      font-family: 'Georgia', serif;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    #game-root {
      width: 100%;
      max-width: 1200px;
      padding: 20px;
    }
    
    .loading-state {
      text-align: center;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    
    .achievement-notification {
      position: fixed;
      top: 20px;
      right: -400px;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #1a1a2e;
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
      transition: right 0.5s ease;
      z-index: 1000;
    }
    
    .achievement-notification.show {
      right: 20px;
    }
    
    .achievement-icon {
      font-size: 2em;
    }
    
    .achievement-title {
      font-weight: bold;
      font-size: 1.1em;
    }
    
    .achievement-key {
      font-size: 0.9em;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div id="game-root">
    <div class="loading-state">
      <h1>Lone Star Legends Championship</h1>
      <p>Loading frontier assets...</p>
    </div>
  </div>
  
  <!-- Configuration injected by build process -->
  <script>
    window.GAME_CONFIG = {
      cloudflareWorkerUrl: 'https://lone-star-worker.YOUR-SUBDOMAIN.workers.dev',
      netlifyPreviewUrl: null, // Set via environment variable in preview builds
      environment: 'production',
      version: '1.0.0',
      debug: true
    };
  </script>
  
  <!-- Core game integration -->
  <script type="module" src="./game-integration.js"></script>
  
  <!-- Main game bundle -->
  <script type="module" src="./main.js"></script>
</body>
</html>`;

// ============================================
// 2. MAIN GAME ENTRY - main.js
// ============================================
const mainJS = `/**
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
}`;

// ============================================
// 3. PLATFORM ORCHESTRATOR
// ============================================
const orchestratorJS = `/**
 * Platform Orchestrator
 * Coordinates all external services into unified game intelligence
 */

export class PlatformOrchestrator {
  constructor(config) {
    this.config = config;
    this.services = {};
    this.featureFlags = {};
    this.initialized = false;
  }

  async initialize() {
    console.log('Initializing platform services...');
    
    // Initialize Cloudflare integration
    this.services.cloudflare = new CloudflareService(this.config);
    await this.services.cloudflare.init();
    
    // Initialize HuggingFace if available
    if (this.config.huggingFaceApiKey) {
      this.services.ai = new HuggingFaceService(this.config);
    }
    
    // Initialize Notion for community features
    if (this.config.notionApiKey) {
      this.services.community = new NotionService(this.config);
    }
    
    // Load feature flags for A/B testing
    await this.loadFeatureFlags();
    
    this.initialized = true;
    console.log('Platform services ready');
  }

  async loadFeatureFlags() {
    try {
      const endpoint = this.config.environment === 'preview' 
        ? \`\${this.config.netlifyPreviewUrl}/game-api/features\`
        : \`\${this.config.cloudflareWorkerUrl}/api/features\`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        this.featureFlags = data.features.reduce((acc, flag) => {
          acc[flag.name] = flag.enabled;
          return acc;
        }, {});
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  }

  getServices() {
    return this.services;
  }

  isFeatureEnabled(featureName) {
    return this.featureFlags[featureName] || false;
  }

  // Unified analytics tracking
  async trackEvent(eventName, properties = {}) {
    const enrichedProperties = {
      ...properties,
      timestamp: Date.now(),
      environment: this.config.environment,
      version: this.config.version,
      featureFlags: this.featureFlags
    };

    // Send to Cloudflare D1 for persistence
    if (this.services.cloudflare) {
      await this.services.cloudflare.trackEvent(eventName, enrichedProperties);
    }

    // Send to preview analytics if in preview mode
    if (this.config.environment === 'preview' && this.config.netlifyPreviewUrl) {
      await fetch(\`\${this.config.netlifyPreviewUrl}/game-api/analytics/preview\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, properties: enrichedProperties })
      });
    }
  }

  // Dynamic content generation via AI
  async generateContent(type, context) {
    if (!this.services.ai || !this.isFeatureEnabled('ai_content')) {
      return this.getFallbackContent(type, context);
    }

    try {
      return await this.services.ai.generate(type, context);
    } catch (error) {
      console.error('AI generation failed:', error);
      return this.getFallbackContent(type, context);
    }
  }

  getFallbackContent(type, context) {
    const fallbacks = {
      npc_dialogue: [
        "The frontier holds many secrets, partner.",
        "Keep your wits about you out there.",
        "Legends aren't born, they're forged."
      ],
      quest_description: [
        "Explore the mysterious caverns to the west.",
        "Help the townspeople defend against bandits.",
        "Discover the truth behind the ancient legend."
      ]
    };

    const options = fallbacks[type] || ["..."];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Community feedback submission
  async submitFeedback(category, message, context = {}) {
    if (this.services.community) {
      return await this.services.community.submitFeedback({
        category,
        message,
        playerContext: context,
        timestamp: new Date().toISOString()
      });
    }

    // Fallback to console logging
    console.log('Community feedback:', { category, message, context });
    return { success: true, method: 'local' };
  }
}

// Cloudflare Service Integration
class CloudflareService {
  constructor(config) {
    this.config = config;
    this.sessionToken = localStorage.getItem('lone_star_session');
    this.playerId = localStorage.getItem('lone_star_player_id');
  }

  async init() {
    if (this.sessionToken) {
      await this.validateSession();
    }
  }

  async validateSession() {
    try {
      const response = await fetch(\`\${this.config.cloudflareWorkerUrl}/api/player/state\`, {
        headers: { 'X-Session-Token': this.sessionToken }
      });

      if (!response.ok) {
        this.clearSession();
        return false;
      }

      const state = await response.json();
      this.playerState = state;
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  async createPlayer(username) {
    const response = await fetch(\`\${this.config.cloudflareWorkerUrl}/api/player/create\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    const data = await response.json();
    this.sessionToken = data.sessionToken;
    this.playerId = data.playerId;
    this.playerState = data.player;
    
    localStorage.setItem('lone_star_session', this.sessionToken);
    localStorage.setItem('lone_star_player_id', this.playerId);
    
    return data;
  }

  async updateState(updates) {
    const response = await fetch(\`\${this.config.cloudflareWorkerUrl}/api/player/state\`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': this.sessionToken
      },
      body: JSON.stringify(updates)
    });

    this.playerState = await response.json();
    return this.playerState;
  }

  async submitScore(score, context = {}) {
    const response = await fetch(\`\${this.config.cloudflareWorkerUrl}/api/leaderboard/submit\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': this.sessionToken
      },
      body: JSON.stringify({ score, context })
    });

    return await response.json();
  }

  async getLeaderboard() {
    const response = await fetch(\`\${this.config.cloudflareWorkerUrl}/api/leaderboard\`);
    return await response.json();
  }

  async trackEvent(eventName, properties) {
    await fetch(\`\${this.config.cloudflareWorkerUrl}/api/analytics/event\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': this.sessionToken
      },
      body: JSON.stringify({ event: eventName, properties })
    });
  }

  clearSession() {
    this.sessionToken = null;
    this.playerId = null;
    this.playerState = null;
    localStorage.removeItem('lone_star_session');
    localStorage.removeItem('lone_star_player_id');
  }
}

// HuggingFace Service Integration
class HuggingFaceService {
  constructor(config) {
    this.config = config;
    this.apiKey = config.huggingFaceApiKey;
    this.modelEndpoint = 'https://api-inference.huggingface.co/models/';
  }

  async generate(type, context) {
    const prompts = {
      npc_dialogue: this.buildNPCPrompt(context),
      quest_description: this.buildQuestPrompt(context),
      item_lore: this.buildItemPrompt(context)
    };

    const prompt = prompts[type];
    if (!prompt) throw new Error(\`Unknown content type: \${type}\`);

    const response = await fetch(\`\${this.modelEndpoint}mistralai/Mistral-7B-Instruct-v0.1\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.8,
          top_p: 0.9
        }
      })
    });

    const result = await response.json();
    return result[0]?.generated_text || '';
  }

  buildNPCPrompt(context) {
    return \`You are \${context.npcName}, an NPC in "Lone Star Legends Championship", a Texas frontier game.
Player level: \${context.playerLevel}
Location: \${context.location}
Previous interaction: \${context.lastInteraction || 'None'}

Respond in character with one line of frontier dialogue (max 20 words):
\${context.npcName}:\`;
  }

  buildQuestPrompt(context) {
    return \`Generate a quest description for "Lone Star Legends Championship" (Texas frontier setting).
Difficulty: \${context.difficulty}
Player level: \${context.playerLevel}
Location: \${context.location}

Quest description (max 30 words):\`;
  }

  buildItemPrompt(context) {
    return \`Create lore for an item in "Lone Star Legends Championship" (Texas frontier setting).
Item type: \${context.itemType}
Rarity: \${context.rarity}

Item lore (max 25 words):\`;
  }
}

// Notion Service Integration
class NotionService {
  constructor(config) {
    this.config = config;
    this.apiKey = config.notionApiKey;
    this.databaseId = config.notionDatabaseId;
  }

  async submitFeedback(data) {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: this.databaseId },
        properties: {
          'Category': { select: { name: data.category } },
          'Message': {
            rich_text: [{
              text: { content: data.message }
            }]
          },
          'Player ID': {
            rich_text: [{
              text: { content: data.playerContext?.playerId || 'anonymous' }
            }]
          },
          'Timestamp': {
            date: { start: data.timestamp }
          }
        }
      })
    });

    return await response.json();
  }
}`;

// ============================================
// 4. GAME ENGINE CORE
// ============================================
const engineJS = `/**
 * Core Game Engine
 * The living system that orchestrates gameplay
 */

export class GameEngine {
  constructor(config) {
    this.config = config;
    this.container = config.container;
    this.services = config.platformServices;
    this.state = {
      scene: 'title',
      player: null,
      world: {},
      ui: {}
    };
    
    this.systems = {};
    this.running = false;
  }

  async start() {
    console.log('Starting game engine...');
    
    // Initialize core systems
    await this.initializeSystems();
    
    // Load or create player
    await this.initializePlayer();
    
    // Start game loop
    this.running = true;
    this.gameLoop();
    
    // Render initial scene
    this.renderScene('title');
  }

  async initializeSystems() {
    // Input system
    this.systems.input = new InputSystem(this);
    
    // Render system
    this.systems.render = new RenderSystem(this.container);
    
    // Physics system (if needed)
    this.systems.physics = new PhysicsSystem();
    
    // Audio system
    this.systems.audio = new AudioSystem();
    
    // Achievement system
    this.systems.achievements = new AchievementSystem(this.services);
  }

  async initializePlayer() {
    // Check for existing player
    if (this.services.cloudflare?.playerState) {
      this.state.player = this.services.cloudflare.playerState;
      console.log('Loaded existing player:', this.state.player.username);
    } else {
      // Show player creation UI
      this.state.scene = 'character_creation';
    }
  }

  gameLoop() {
    if (!this.running) return;
    
    const deltaTime = 16; // Assume 60fps for now
    
    // Update systems
    this.systems.input.update(deltaTime);
    this.systems.physics.update(deltaTime);
    
    // Update game state
    this.updateGameState(deltaTime);
    
    // Render
    this.systems.render.render(this.state);
    
    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }

  updateGameState(deltaTime) {
    // Scene-specific updates
    switch (this.state.scene) {
      case 'gameplay':
        this.updateGameplay(deltaTime);
        break;
      case 'title':
        this.updateTitleScreen(deltaTime);
        break;
      // Add more scenes as needed
    }
  }

  updateGameplay(deltaTime) {
    // Core gameplay logic
    if (this.state.player) {
      // Update player position, actions, etc.
      
      // Check for achievements
      this.systems.achievements.check(this.state);
      
      // Sync state to Cloudflare periodically
      if (Date.now() % 5000 < deltaTime) { // Every 5 seconds
        this.syncPlayerState();
      }
    }
  }

  updateTitleScreen(deltaTime) {
    // Title screen animations, etc.
  }

  async syncPlayerState() {
    if (this.services.cloudflare && this.state.player) {
      await this.services.cloudflare.updateState(this.state.player);
    }
  }

  renderScene(sceneName) {
    this.state.scene = sceneName;
    
    // Clear container
    this.container.innerHTML = '';
    
    // Render based on scene
    switch (sceneName) {
      case 'title':
        this.renderTitleScreen();
        break;
      case 'character_creation':
        this.renderCharacterCreation();
        break;
      case 'gameplay':
        this.renderGameplay();
        break;
    }
  }

  renderTitleScreen() {
    const titleHTML = \`
      <div class="title-screen">
        <h1 class="game-title">Lone Star Legends Championship</h1>
        <p class="tagline">Forge your legend on the Texas frontier</p>
        <div class="title-menu">
          <button id="start-game" class="menu-button">Start Journey</button>
          <button id="leaderboard" class="menu-button">Leaderboard</button>
          <button id="settings" class="menu-button">Settings</button>
        </div>
      </div>
    \`;
    
    this.container.innerHTML = titleHTML;
    
    // Attach event handlers
    document.getElementById('start-game')?.addEventListener('click', () => {
      if (this.state.player) {
        this.renderScene('gameplay');
      } else {
        this.renderScene('character_creation');
      }
    });
    
    document.getElementById('leaderboard')?.addEventListener('click', () => {
      this.showLeaderboard();
    });
  }

  renderCharacterCreation() {
    const creationHTML = \`
      <div class="character-creation">
        <h2>Create Your Legend</h2>
        <div class="creation-form">
          <input type="text" id="player-name" placeholder="Enter your name" maxlength="20">
          <button id="create-character" class="action-button">Begin Adventure</button>
        </div>
      </div>
    \`;
    
    this.container.innerHTML = creationHTML;
    
    document.getElementById('create-character')?.addEventListener('click', async () => {
      const username = document.getElementById('player-name').value;
      if (username && username.length >= 3) {
        await this.createPlayer(username);
      }
    });
  }

  renderGameplay() {
    const gameplayHTML = \`
      <div class="gameplay-container">
        <div class="game-header">
          <div class="player-info">
            <span class="player-name">\${this.state.player.username}</span>
            <span class="player-level">Level \${this.state.player.level}</span>
          </div>
          <div class="resources">
            <span class="gold">Gold: \${this.state.player.inventory?.gold || 0}</span>
          </div>
        </div>
        <div id="game-canvas" class="game-canvas">
          <!-- Game rendering happens here -->
        </div>
        <div class="game-ui">
          <!-- UI elements -->
        </div>
      </div>
    \`;
    
    this.container.innerHTML = gameplayHTML;
    
    // Initialize game canvas/rendering
    this.initializeGameCanvas();
  }

  initializeGameCanvas() {
    const canvas = document.getElementById('game-canvas');
    // Initialize your game rendering (Pixi.js, Canvas API, etc.)
    
    // Example: Basic canvas setup
    const ctx = document.createElement('canvas').getContext('2d');
    canvas.appendChild(ctx.canvas);
    
    // Set canvas size
    ctx.canvas.width = canvas.clientWidth;
    ctx.canvas.height = canvas.clientHeight;
    
    // Start rendering game world
    this.systems.render.initCanvas(ctx);
  }

  async createPlayer(username) {
    try {
      const result = await this.services.cloudflare.createPlayer(username);
      this.state.player = result.player;
      
      // Track event
      await this.services.orchestrator?.trackEvent('player_created', {
        username,
        timestamp: Date.now()
      });
      
      // Move to gameplay
      this.renderScene('gameplay');
    } catch (error) {
      console.error('Failed to create player:', error);
      alert('Failed to create character. Please try again.');
    }
  }

  async showLeaderboard() {
    const leaderboard = await this.services.cloudflare.getLeaderboard();
    
    const leaderboardHTML = \`
      <div class="leaderboard-modal">
        <h2>Legends of the Frontier</h2>
        <div class="leaderboard-list">
          \${leaderboard.map((entry, index) => \`
            <div class="leaderboard-entry">
              <span class="rank">#\${index + 1}</span>
              <span class="name">\${entry.username}</span>
              <span class="score">\${entry.score}</span>
            </div>
          \`).join('')}
        </div>
        <button id="close-leaderboard" class="action-button">Close</button>
      </div>
    \`;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = leaderboardHTML;
    document.body.appendChild(modal);
    
    document.getElementById('close-leaderboard')?.addEventListener('click', () => {
      modal.remove();
    });
  }
}

// Support Systems
class InputSystem {
  constructor(engine) {
    this.engine = engine;
    this.keys = {};
    this.mouse = { x: 0, y: 0, buttons: {} };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    document.addEventListener('mousedown', (e) => {
      this.mouse.buttons[e.button] = true;
    });
    
    document.addEventListener('mouseup', (e) => {
      this.mouse.buttons[e.button] = false;
    });
  }

  update(deltaTime) {
    // Process input and update game state
  }
}

class RenderSystem {
  constructor(container) {
    this.container = container;
    this.ctx = null;
  }

  initCanvas(ctx) {
    this.ctx = ctx;
  }

  render(state) {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Render game state
    // This would be your actual game rendering logic
  }
}

class PhysicsSystem {
  update(deltaTime) {
    // Physics calculations
  }
}

class AudioSystem {
  constructor() {
    this.sounds = {};
    this.music = null;
  }

  play(soundName) {
    // Play sound effect
  }

  playMusic(trackName) {
    // Play background music
  }
}

class AchievementSystem {
  constructor(services) {
    this.services = services;
    this.achievements = {
      first_victory: { 
        name: 'First Victory', 
        check: (state) => state.player?.victories >= 1 
      },
      gold_rush: { 
        name: 'Gold Rush', 
        check: (state) => state.player?.inventory?.gold >= 1000 
      },
      legend_status: { 
        name: 'Legendary Status', 
        check: (state) => state.player?.level >= 50 
      }
    };
  }

  check(state) {
    for (const [key, achievement] of Object.entries(this.achievements)) {
      if (!state.player?.achievements?.includes(key)) {
        if (achievement.check(state)) {
          this.unlock(key, achievement.name);
        }
      }
    }
  }

  async unlock(key, name) {
    // Update player state
    await this.services.cloudflare?.updateState({
      achievements: [...(this.services.cloudflare.playerState.achievements || []), key]
    });
    
    // Show notification
    this.showNotification(name);
    
    // Track event
    await this.services.orchestrator?.trackEvent('achievement_unlocked', {
      achievement: key,
      name
    });
  }

  showNotification(name) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = \`
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <div class="achievement-title">\${name}</div>
        <div class="achievement-subtitle">Achievement Unlocked!</div>
      </div>
    \`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
}`;

// ============================================
// 5. GAME STYLES
// ============================================
const gameCSS = `/* Lone Star Legends Championship - Core Styles */

:root {
  --primary-gold: #FFD700;
  --secondary-bronze: #CD7F32;
  --frontier-brown: #8B4513;
  --desert-sand: #DEB887;
  --night-sky: #1a1a2e;
  --deep-shadow: #0f0f1e;
  --text-light: #f0f0f0;
  --text-muted: #a0a0a0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Georgia', serif;
  background: linear-gradient(135deg, var(--night-sky), var(--deep-shadow));
  color: var(--text-light);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Title Screen */
.title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  animation: fadeIn 1s ease;
}

.game-title {
  font-size: 3.5em;
  background: linear-gradient(135deg, var(--primary-gold), var(--secondary-bronze));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  margin-bottom: 0.2em;
}

.tagline {
  font-size: 1.2em;
  color: var(--text-muted);
  margin-bottom: 3em;
  font-style: italic;
}

.title-menu {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.menu-button,
.action-button {
  padding: 1em 2em;
  font-size: 1.1em;
  background: linear-gradient(135deg, var(--frontier-brown), var(--desert-sand));
  color: var(--text-light);
  border: 2px solid var(--primary-gold);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
  font-family: inherit;
}

.menu-button:hover,
.action-button:hover {
  background: linear-gradient(135deg, var(--desert-sand), var(--frontier-brown));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

/* Character Creation */
.character-creation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  animation: fadeIn 0.5s ease;
}

.character-creation h2 {
  font-size: 2.5em;
  color: var(--primary-gold);
  margin-bottom: 1em;
}

.creation-form {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
  align-items: center;
}

#player-name {
  padding: 0.8em 1.5em;
  font-size: 1.2em;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid var(--primary-gold);
  border-radius: 8px;
  color: var(--text-light);
  min-width: 300px;
  text-align: center;
  font-family: inherit;
}

#player-name:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
}

/* Gameplay UI */
.gameplay-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.game-header {
  display: flex;
  justify-content: space-between;
  padding: 1em 2em;
  background: linear-gradient(to bottom, rgba(26, 26, 46, 0.95), transparent);
  position: relative;
  z-index: 10;
}

.player-info {
  display: flex;
  gap: 2em;
  align-items: center;
}

.player-name {
  font-size: 1.2em;
  color: var(--primary-gold);
  font-weight: bold;
}

.player-level {
  color: var(--text-muted);
}

.resources {
  display: flex;
  gap: 2em;
  align-items: center;
}

.gold {
  color: var(--primary-gold);
  font-weight: bold;
}

.game-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.game-canvas canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.game-ui {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1em;
  background: linear-gradient(to top, rgba(26, 26, 46, 0.95), transparent);
}

/* Leaderboard Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.leaderboard-modal {
  background: linear-gradient(135deg, var(--night-sky), var(--deep-shadow));
  border: 2px solid var(--primary-gold);
  border-radius: 12px;
  padding: 2em;
  max-width: 500px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
}

.leaderboard-modal h2 {
  color: var(--primary-gold);
  text-align: center;
  margin-bottom: 1em;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  margin-bottom: 1.5em;
}

.leaderboard-entry {
  display: flex;
  justify-content: space-between;
  padding: 0.8em;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: background 0.3s ease;
}

.leaderboard-entry:hover {
  background: rgba(255, 255, 255, 0.1);
}

.leaderboard-entry .rank {
  color: var(--primary-gold);
  font-weight: bold;
  min-width: 3em;
}

.leaderboard-entry .name {
  flex: 1;
  text-align: left;
  padding: 0 1em;
}

.leaderboard-entry .score {
  color: var(--secondary-bronze);
  font-weight: bold;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .game-title {
    font-size: 2.5em;
  }
  
  .menu-button,
  .action-button {
    min-width: 150px;
    padding: 0.8em 1.5em;
  }
  
  .game-header {
    flex-direction: column;
    gap: 1em;
    align-items: center;
  }
}`;

// ============================================
// 6. DEPLOYMENT SCRIPTS
// ============================================
const deploymentGuide = `# Lone Star Legends Championship - Deployment Guide

## Prerequisites
- GitHub account with Pages enabled
- Cloudflare account (free tier works)
- Node.js installed locally
- Git configured

## Step 1: GitHub Pages Setup

1. Update vite.config.js with your repo name:
\`\`\`javascript
export default defineConfig({
  base: '/YOUR-REPO-NAME/',
  // ... rest of config
});
\`\`\`

2. Build and deploy:
\`\`\`bash
npm run build
git add dist -f
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages
\`\`\`

3. Enable GitHub Pages in repo settings:
- Settings > Pages > Source: Deploy from branch
- Branch: gh-pages / (root)

## Step 2: Cloudflare Worker Setup

1. Create a new Worker in Cloudflare dashboard
2. Copy the worker code (lone-star-worker.ts)
3. Set up KV namespaces:
   - PLAYER_STATE
   - LEADERBOARDS
4. Set up D1 database:
   - Create database: "lone-star-analytics"
   - Run schema from d1-schema.sql
5. Configure environment variables:
   - GITHUB_PAGES_URL: https://YOUR-USERNAME.github.io/YOUR-REPO-NAME

## Step 3: Connect Services

Update game-integration.js with your URLs:
\`\`\`javascript
window.GAME_CONFIG = {
  cloudflareWorkerUrl: 'https://lone-star-worker.YOUR-SUBDOMAIN.workers.dev',
  // ... other config
};
\`\`\`

## Step 4: Optional Services

### HuggingFace Integration
1. Get API key from HuggingFace
2. Add to Netlify/Vercel environment variables
3. Enable AI features in feature flags

### Notion Community Features
1. Create Notion integration
2. Create feedback database
3. Add API key and database ID to environment

### Vercel/Netlify Preview
1. Import repo to platform
2. Set environment variables
3. Configure build settings:
   - Build command: npm run build
   - Publish directory: dist

## Monitoring

Check these endpoints:
- Game: https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
- Worker API: https://lone-star-worker.YOUR-SUBDOMAIN.workers.dev/api/player/state
- Analytics: Check D1 database in Cloudflare dashboard

## Troubleshooting

**Blank page on GitHub Pages:**
- Check base path in vite.config.js
- Verify index.html has correct base tag
- Check browser console for 404 errors

**Worker not responding:**
- Verify CORS headers match GitHub Pages URL
- Check KV namespace bindings
- Review worker logs in Cloudflare dashboard

**State not persisting:**
- Verify session token in localStorage
- Check worker authentication logic
- Ensure KV namespace has correct permissions`;

// Return the complete package
const completePackage = {
  'index.html': indexHTML,
  'main.js': mainJS,
  'platform/orchestrator.js': orchestratorJS,
  'game/engine.js': engineJS,
  'styles/game.css': gameCSS,
  'DEPLOYMENT.md': deploymentGuide,
  
  // Reference to existing files
  'workers/lone-star-worker.ts': '// See lone-star-worker.ts in documents',
  'functions/game-api.mts': '// See netlify-preview-api.ts in documents',
  'schema/d1-schema.sql': '// See d1-schema.sql in documents',
  'vite.config.js': '// See vite-config-fix.js in documents'
};

// Output structure for easy copying
console.log('='.repeat(60));
console.log('LONE STAR LEGENDS - COMPLETE INTEGRATION PACKAGE');
console.log('='.repeat(60));
console.log('\\nFile structure:');
console.log(\`
lone-star-legends-championship/
├── index.html
├── main.js
├── vite.config.js
├── platform/
│   └── orchestrator.js
├── game/
│   └── engine.js
├── styles/
│   └── game.css
├── workers/
│   └── lone-star-worker.ts
├── netlify/
│   └── functions/
│       └── game-api.mts
├── schema/
│   └── d1-schema.sql
└── DEPLOYMENT.md
\`);

console.log('\\n' + '='.repeat(60));
console.log('Copy each file to its location and follow DEPLOYMENT.md');
console.log('='.repeat(60));