/**
 * Core Game Engine
 * The living system that orchestrates gameplay
 */

export class GameEngine {
  constructor({ container, platformServices, config }) {
    this.container = container;
    this.services = platformServices;
    this.config = config;
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
    // Physics system
    this.systems.physics = new PhysicsSystem();
    // Audio system
    this.systems.audio = new AudioSystem();
    // Achievement system
    this.systems.achievements = new AchievementSystem(this.services, this);
  }

  async initializePlayer() {
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
    const deltaTime = 16; // ~60fps
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
    switch (this.state.scene) {
      case 'gameplay':
        this.updateGameplay(deltaTime);
        break;
      case 'title':
        this.updateTitleScreen(deltaTime);
        break;
      default:
        break;
    }
  }

  updateGameplay(deltaTime) {
    if (this.state.player) {
      // Update game-specific logic here
      this.systems.achievements.check(this.state);
      // Sync state to Cloudflare periodically
      if (Date.now() % 5000 < deltaTime) {
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
    this.container.innerHTML = '';
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
    const titleHTML = `
      <div class="title-screen">
        <h1 class="game-title">Lone Star Legends Championship</h1>
        <p class="tagline">Forge your legend on the Texas frontier</p>
        <div class="title-menu">
          <button id="start-game" class="menu-button">Start Journey</button>
          <button id="leaderboard" class="menu-button">Leaderboard</button>
          <button id="settings" class="menu-button">Settings</button>
        </div>
      </div>
    `;
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
    const creationHTML = `
      <div class="character-creation">
        <h2>Create Your Legend</h2>
        <div class="creation-form">
          <input type="text" id="player-name" placeholder="Enter your name" maxlength="20">
          <button id="create-character" class="action-button">Begin Adventure</button>
        </div>
      </div>
    `;
    this.container.innerHTML = creationHTML;
    document.getElementById('create-character')?.addEventListener('click', async () => {
      const username = document.getElementById('player-name').value;
      if (username && username.length >= 3) {
        await this.createPlayer(username);
      }
    });
  }

  renderGameplay() {
    const gameplayHTML = `
      <div class="gameplay-container">
        <div class="game-header">
          <div class="player-info">
            <span class="player-name">${this.state.player.username}</span>
            <span class="player-level">Level ${this.state.player.level}</span>
          </div>
          <div class="resources">
            <span class="gold">Gold: ${this.state.player.inventory?.gold || 0}</span>
          </div>
        </div>
        <div id="game-canvas" class="game-canvas">
          <!-- Game rendering happens here -->
        </div>
        <div class="game-ui">
          <!-- UI elements -->
        </div>
      </div>
    `;
    this.container.innerHTML = gameplayHTML;
    this.initializeGameCanvas();
  }

  initializeGameCanvas() {
    const canvasContainer = document.getElementById('game-canvas');
    const canvas = document.createElement('canvas');
    canvasContainer.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
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
      this.renderScene('gameplay');
    } catch (error) {
      console.error('Failed to create player:', error);
      alert('Failed to create character. Please try again.');
    }
  }

  async showLeaderboard() {
    const leaderboard = await this.services.cloudflare.getLeaderboard();
    const leaderboardHTML = `
      <div class="leaderboard-modal">
        <h2>Legends of the Frontier</h2>
        <div class="leaderboard-list">
          ${leaderboard.map((entry, index) => `
            <div class="leaderboard-entry">
              <span class="rank">#${index + 1}</span>
              <span class="name">${entry.username}</span>
              <span class="score">${entry.score}</span>
            </div>
          `).join('')}
        </div>
        <button id="close-leaderboard" class="action-button">Close</button>
      </div>
    `;
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
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    // Render game state
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
  constructor(services, engine) {
    this.services = services;
    this.engine = engine;
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
    notification.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <div class="achievement-title">${name}</div>
        <div class="achievement-subtitle">Achievement Unlocked!</div>
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
}