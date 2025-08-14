/**
 * Enhanced Game Integration Module
 * Integrates sportyR field geometry, physics, and statistics into Lone Star Legends
 */

import { generateFieldGeometry, drawField } from './baseball-field-geometry.js';
import BaseballPhysics from './baseball-physics.js';
import BaseballStatsTracker from './baseball-stats-tracker.js';

export class EnhancedGameIntegration {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.physics = new BaseballPhysics();
    this.stats = new BaseballStatsTracker();
    this.fieldGeometry = null;
    this.canvas = null;
    this.ctx = null;
    this.activePlay = null;
    this.fieldScale = 2; // pixels per foot
    
    // Game state
    this.gameState = {
      innings: 1,
      topBottom: 'top',
      outs: 0,
      balls: 0,
      strikes: 0,
      bases: {
        first: null,
        second: null,
        third: null
      },
      currentBatter: null,
      currentPitcher: null,
      ballInPlay: false,
      fieldersPositions: this.initializeFielderPositions()
    };

    // Animation state
    this.animations = {
      ballTrajectory: null,
      currentFrame: 0,
      isPlaying: false
    };
  }

  /**
   * Initialize the enhanced game features
   */
  async initialize() {
    console.log('Initializing Enhanced Game Features...');
    
    // Setup field geometry (MLB specs by default)
    this.fieldGeometry = generateFieldGeometry('mlb', this.fieldScale);
    
    // Setup canvas for field rendering
    this.setupCanvas();
    
    // Register initial players
    this.registerTeams();
    
    // Set environmental conditions (can be customized)
    this.physics.setEnvironment({
      temperature: 72, // Fahrenheit
      humidity: 45,
      windSpeed: { x: 5, y: 0, z: -3 }, // mph
      altitude: 500 // feet
    });
    
    // Draw initial field
    this.renderField();
    
    // Integrate with existing game engine
    this.integrateWithGameEngine();
    
    console.log('Enhanced features initialized successfully!');
  }

  /**
   * Setup canvas for field visualization
   */
  setupCanvas() {
    // Create or get existing canvas
    this.canvas = document.getElementById('gameFieldCanvas') || this.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Center the view on home plate
    this.ctx.translate(400, 500);
    this.ctx.scale(1, -1); // Flip Y axis for proper coordinates
  }

  /**
   * Create a new canvas element
   */
  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'gameFieldCanvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.border = '2px solid #8B4513';
    canvas.style.borderRadius = '10px';
    canvas.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    
    // Add to game container
    const container = document.querySelector('.baseball-game') || document.body;
    container.appendChild(canvas);
    
    return canvas;
  }

  /**
   * Initialize fielder positions
   */
  initializeFielderPositions() {
    return {
      pitcher: { x: 0, y: 60.5, name: 'Pitcher' },
      catcher: { x: 0, y: -5, name: 'Catcher' },
      firstBase: { x: 90, y: 15, name: '1B' },
      secondBase: { x: 45, y: 90, name: '2B' },
      thirdBase: { x: -90, y: 15, name: '3B' },
      shortStop: { x: -45, y: 90, name: 'SS' },
      leftField: { x: -250, y: 250, name: 'LF' },
      centerField: { x: 0, y: 350, name: 'CF' },
      rightField: { x: 250, y: 250, name: 'RF' }
    };
  }

  /**
   * Register teams and players
   */
  registerTeams() {
    // Register home team
    const homeTeam = [
      { id: 'h1', name: 'Texas Thunder', number: 1, position: 'P' },
      { id: 'h2', name: 'Austin Lightning', number: 2, position: 'C' },
      { id: 'h3', name: 'Dallas Dynamo', number: 3, position: '1B' },
      { id: 'h4', name: 'Houston Heat', number: 4, position: '2B' },
      { id: 'h5', name: 'San Antonio Storm', number: 5, position: '3B' },
      { id: 'h6', name: 'Fort Worth Flash', number: 6, position: 'SS' },
      { id: 'h7', name: 'El Paso Eagle', number: 7, position: 'LF' },
      { id: 'h8', name: 'Corpus Christi Comet', number: 8, position: 'CF' },
      { id: 'h9', name: 'Amarillo Ace', number: 9, position: 'RF' }
    ];

    // Register away team
    const awayTeam = [
      { id: 'a1', name: 'Oklahoma Outlaw', number: 11, position: 'P' },
      { id: 'a2', name: 'Louisiana Legend', number: 12, position: 'C' },
      { id: 'a3', name: 'Arkansas Arrow', number: 13, position: '1B' },
      { id: 'a4', name: 'New Mexico Nova', number: 14, position: '2B' },
      { id: 'a5', name: 'Colorado Crusher', number: 15, position: '3B' },
      { id: 'a6', name: 'Kansas Knight', number: 16, position: 'SS' },
      { id: 'a7', name: 'Missouri Maverick', number: 17, position: 'LF' },
      { id: 'a8', name: 'Nebraska Ninja', number: 18, position: 'CF' },
      { id: 'a9', name: 'Iowa Impact', number: 19, position: 'RF' }
    ];

    // Register with stats tracker
    homeTeam.forEach(player => {
      this.stats.registerPlayer(player.id, player.name, player.number, player.position, 'home');
    });

    awayTeam.forEach(player => {
      this.stats.registerPlayer(player.id, player.name, player.number, player.position, 'away');
    });
  }

  /**
   * Render the baseball field
   */
  renderField() {
    // Clear canvas
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    
    // Draw field using sportyR geometry
    drawField(this.ctx, this.fieldGeometry, {
      grass: '#2E8B57',
      dirt: '#8B4513',
      lines: '#FFFFFF',
      bases: '#F5F5F5',
      mound: '#8B4513'
    });
    
    // Draw fielders
    this.drawFielders();
    
    // Draw current ball position if in play
    if (this.gameState.ballInPlay && this.animations.ballTrajectory) {
      this.drawBall();
    }
    
    // Draw game info overlay
    this.drawGameInfo();
  }

  /**
   * Draw fielders on the field
   */
  drawFielders() {
    this.ctx.fillStyle = '#1E3A8A'; // Blue for fielders
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    
    Object.values(this.gameState.fieldersPositions).forEach(fielder => {
      this.ctx.beginPath();
      this.ctx.arc(fielder.x, fielder.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Draw position label
      this.ctx.save();
      this.ctx.scale(1, -1); // Flip text right-side up
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(fielder.name, fielder.x, -fielder.y - 10);
      this.ctx.restore();
    });
  }

  /**
   * Draw the ball
   */
  drawBall() {
    if (!this.animations.ballTrajectory || this.animations.currentFrame >= this.animations.ballTrajectory.length) {
      return;
    }
    
    const ballPos = this.animations.ballTrajectory[this.animations.currentFrame];
    
    // Draw ball shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(ballPos.x, ballPos.z, 3, 2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw ball
    const ballSize = Math.max(2, 5 - ballPos.y / 50); // Size based on height
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = '#DC143C';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(ballPos.x, ballPos.z + ballPos.y / 10, ballSize, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * Draw game information overlay
   */
  drawGameInfo() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Background for info
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 200, 100);
    
    // Game info text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Inning: ${this.gameState.topBottom === 'top' ? '▲' : '▼'} ${this.gameState.innings}`, 20, 30);
    this.ctx.fillText(`Outs: ${this.gameState.outs}`, 20, 50);
    this.ctx.fillText(`Count: ${this.gameState.balls}-${this.gameState.strikes}`, 20, 70);
    
    const summary = this.stats.getGameSummary();
    this.ctx.fillText(`Score: Home ${summary.score.home} - Away ${summary.score.away}`, 20, 90);
    
    this.ctx.restore();
  }

  /**
   * Simulate a pitch
   */
  simulatePitch(pitchType = 'fastball', velocity = 90) {
    const pitchTrajectory = this.physics.calculatePitchTrajectory({
      velocity,
      spinRate: 2200,
      pitchType,
      releasePoint: { x: 0, y: 6, z: 55 }
    });
    
    // Animate the pitch
    this.animateBallTrajectory(pitchTrajectory);
    
    return pitchTrajectory;
  }

  /**
   * Simulate a bat swing and contact
   */
  simulateSwing(swingParams = {}) {
    const defaultParams = {
      batSpeed: 70,
      pitchSpeed: 90,
      contactPoint: 'center',
      timing: 'perfect',
      batAngle: 10
    };
    
    const params = { ...defaultParams, ...swingParams };
    const contact = this.physics.calculateBatContact(params);
    
    // Calculate ball trajectory after contact
    const trajectory = this.physics.calculateBallTrajectory(contact);
    
    // Determine hit outcome
    const outcome = this.determineHitOutcome(trajectory);
    
    // Update stats
    if (this.gameState.currentBatter) {
      this.stats.recordAtBat(this.gameState.currentBatter, outcome.type, outcome.rbis);
    }
    
    // Animate the hit
    this.animateBallTrajectory(trajectory);
    
    return { contact, trajectory, outcome };
  }

  /**
   * Determine the outcome of a hit
   */
  determineHitOutcome(trajectory) {
    const landingSpot = this.physics.predictLandingSpot(trajectory);
    
    if (!landingSpot) {
      return { type: 'foul', rbis: 0 };
    }
    
    const distance = landingSpot.distance;
    const maxHeight = Math.max(...trajectory.map(p => p.y));
    
    // Home run check
    if (distance > 350 && maxHeight > 20) {
      return { type: 'homerun', rbis: 1 };
    }
    
    // Foul ball check
    if (Math.abs(landingSpot.x) > Math.abs(landingSpot.z)) {
      return { type: 'foul', rbis: 0 };
    }
    
    // Determine hit type based on distance and trajectory
    if (distance < 150 && maxHeight < 10) {
      return { type: 'single', rbis: 0 };
    } else if (distance < 250 && maxHeight < 30) {
      return { type: 'double', rbis: 0 };
    } else if (distance < 350) {
      return { type: 'triple', rbis: 0 };
    } else {
      return { type: 'flyout', rbis: 0 };
    }
  }

  /**
   * Animate ball trajectory
   */
  animateBallTrajectory(trajectory) {
    this.animations.ballTrajectory = trajectory;
    this.animations.currentFrame = 0;
    this.animations.isPlaying = true;
    this.gameState.ballInPlay = true;
    
    const animate = () => {
      if (!this.animations.isPlaying) return;
      
      this.animations.currentFrame++;
      this.renderField();
      
      if (this.animations.currentFrame < trajectory.length) {
        requestAnimationFrame(animate);
      } else {
        this.animations.isPlaying = false;
        this.gameState.ballInPlay = false;
      }
    };
    
    animate();
  }

  /**
   * Integrate with existing game engine
   */
  integrateWithGameEngine() {
    if (!this.gameEngine) return;
    
    // Add physics system to game engine
    this.gameEngine.systems.physics = this.physics;
    
    // Add stats system to game engine
    this.gameEngine.systems.stats = this.stats;
    
    // Override or enhance existing game methods
    const originalUpdate = this.gameEngine.updateGameplay.bind(this.gameEngine);
    this.gameEngine.updateGameplay = (deltaTime) => {
      originalUpdate(deltaTime);
      
      // Update enhanced features
      if (this.animations.isPlaying) {
        this.renderField();
      }
    };
    
    console.log('Successfully integrated with game engine!');
  }

  /**
   * Get current game statistics
   */
  getGameStats() {
    return {
      summary: this.stats.getGameSummary(),
      leaderboard: this.stats.getLeaderboard('battingAverage', 5),
      gameState: this.gameState
    };
  }

  /**
   * Save game state
   */
  saveGame() {
    const saveData = {
      stats: this.stats.exportStats(),
      gameState: this.gameState,
      timestamp: Date.now()
    };
    
    localStorage.setItem('loneStarLegends_save', JSON.stringify(saveData));
    console.log('Game saved successfully!');
    
    return saveData;
  }

  /**
   * Load game state
   */
  loadGame() {
    const saveData = localStorage.getItem('loneStarLegends_save');
    if (!saveData) return false;
    
    try {
      const data = JSON.parse(saveData);
      this.stats.importStats(data.stats);
      this.gameState = data.gameState;
      this.renderField();
      console.log('Game loaded successfully!');
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }
}

// Export for use in game
export default EnhancedGameIntegration;