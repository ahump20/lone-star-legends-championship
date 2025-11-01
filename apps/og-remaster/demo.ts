/**
 * Backyard Baseball Demo - Complete 3-Inning Game
 * Production-ready playable demo
 */

import { GameState, Team, PitchResult } from '../../packages/rules/gameState';
import { TeamBuilder } from './data/TeamBuilder';
import { InputManager } from './input/InputManager';

class BackyardBaseballDemo {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private inputManager: InputManager;
  private teamBuilder: TeamBuilder;
  private isRunning: boolean = false;
  private gameMode: 'menu' | 'playing' | 'gameover' = 'menu';
  private autoPlay: boolean = false;
  private autoPlayTimer: number | null = null;

  constructor() {
    console.log('⚾ Backyard Baseball Demo - Starting up!');

    // Get canvas
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas not found!');
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D context not supported!');
    }
    this.ctx = ctx;

    // Set canvas size
    this.canvas.width = 1024;
    this.canvas.height = 768;

    // Initialize systems
    this.gameState = new GameState();
    this.inputManager = new InputManager();
    this.teamBuilder = new TeamBuilder();

    this.setupInput();
    this.setupGameCallbacks();
    this.start();
  }

  /**
   * Setup input handlers
   */
  private setupInput() {
    this.inputManager.setCanvas(this.canvas);

    this.inputManager.on('swing', (action, data) => {
      if (this.gameMode === 'playing' && !this.gameState.gameOver) {
        const result = this.gameState.swingBat(data.timing, data.power);
        this.handlePlayResult(result);
      } else if (this.gameMode === 'menu' || this.gameMode === 'gameover') {
        this.startNewGame();
      }
    });

    this.inputManager.on('pitch', (action, data) => {
      if (this.gameMode === 'playing' && !this.gameState.gameOver) {
        this.gameState.pitch(data.location, data.speed);
      }
    });

    this.inputManager.on('menu', () => {
      if (this.gameMode === 'playing') {
        this.gameMode = 'menu';
      }
    });
  }

  /**
   * Setup game state callbacks
   */
  private setupGameCallbacks() {
    this.gameState.onPitchResult = (result: PitchResult) => {
      console.log('Pitch result:', result.type, result.hitType);
    };

    this.gameState.onScoreUpdate = (home: number, away: number) => {
      console.log(`Score Update - Home: ${home}, Away: ${away}`);
    };

    this.gameState.onInningChange = (inning: number, half: string) => {
      console.log(`Inning Change - ${half} of ${inning}`);
    };

    this.gameState.onGameOver = (winner: Team) => {
      console.log(`Game Over! Winner: ${winner.name}`);
      this.gameMode = 'gameover';
      this.autoPlay = false;
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
      }
    };
  }

  /**
   * Start a new game
   */
  private startNewGame() {
    console.log('🎮 Starting new game...');

    // Create teams
    const { homeTeam, awayTeam } = this.teamBuilder.createQuickPlayTeams();

    // Initialize game
    this.gameState = new GameState();
    this.gameState.initializeGame(homeTeam, awayTeam);
    this.setupGameCallbacks();

    this.gameMode = 'playing';
    this.autoPlay = false;

    console.log(`${homeTeam.name} vs ${awayTeam.name}`);
    console.log('Press SPACE to swing, P to pitch, A to auto-play');
  }

  /**
   * Handle pitch result
   */
  private handlePlayResult(result: PitchResult) {
    const message = this.getResultMessage(result);
    console.log(message);
  }

  /**
   * Get message for pitch result
   */
  private getResultMessage(result: PitchResult): string {
    if (result.type === 'hit' && result.hitType) {
      switch (result.hitType) {
        case 'homerun':
          return '💥 HOME RUN!!!';
        case 'triple':
          return '⚡ TRIPLE!';
        case 'double':
          return '✨ DOUBLE!';
        case 'single':
          return '✓ Single';
        case 'flyout':
          return '✗ Fly out';
        case 'groundout':
          return '✗ Ground out';
        case 'lineout':
          return '✗ Line out';
      }
    } else if (result.type === 'strike') {
      return '⚾ Strike!';
    } else if (result.type === 'ball') {
      return '○ Ball';
    } else if (result.type === 'foul') {
      return '⚠ Foul ball';
    }
    return '';
  }

  /**
   * Toggle auto-play mode
   */
  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;

    if (this.autoPlay) {
      console.log('🤖 Auto-play enabled');
      this.autoPlayTimer = setInterval(() => {
        if (this.gameMode === 'playing' && !this.gameState.gameOver) {
          // Auto swing with random timing
          const result = this.gameState.swingBat(0.3 + Math.random() * 0.4, 0.5 + Math.random() * 0.5);
          this.handlePlayResult(result);
        }
      }, 1500) as unknown as number;
    } else {
      console.log('🎮 Manual control');
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
    }
  }

  /**
   * Start game loop
   */
  private start() {
    this.isRunning = true;
    this.gameLoop();
  }

  /**
   * Main game loop
   */
  private gameLoop() {
    if (!this.isRunning) return;

    // Update
    this.gameState.update();

    // Render
    this.render();

    // Next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Render the game
   */
  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#2a5c2a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.gameMode === 'menu') {
      this.renderMenu();
    } else if (this.gameMode === 'playing') {
      this.renderField();
      this.renderPlayers();
      this.renderBall();
      this.renderHUD();
      this.renderScoreboard();
    } else if (this.gameMode === 'gameover') {
      this.renderGameOver();
    }
  }

  /**
   * Render menu screen
   */
  private renderMenu() {
    // Title
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BACKYARD BASEBALL', 512, 250);

    // Subtitle
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '32px Arial';
    this.ctx.fillText('Demo Edition', 512, 310);

    // Instructions
    this.ctx.fillStyle = '#FFEB3B';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillText('Click or Press SPACE to Start!', 512, 450);

    // Controls
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Controls:', 512, 550);
    this.ctx.font = '20px Arial';
    this.ctx.fillText('SPACE / Click - Swing Bat', 512, 590);
    this.ctx.fillText('P - Pitch (Auto-pitches)', 512, 620);
    this.ctx.fillText('A - Toggle Auto-Play', 512, 650);

    // Footer
    this.ctx.fillStyle = '#888';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('A Blaze Intelligence Production', 512, 730);
  }

  /**
   * Render baseball field
   */
  private renderField() {
    const ctx = this.ctx;

    // Grass
    ctx.fillStyle = '#2a5c2a';
    ctx.fillRect(0, 0, 1024, 768);

    // Infield dirt
    ctx.fillStyle = '#c19a6b';
    ctx.beginPath();
    ctx.ellipse(512, 550, 280, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // Foul lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(512, 550);
    ctx.lineTo(50, 150);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(512, 550);
    ctx.lineTo(974, 150);
    ctx.stroke();

    // Home plate
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(512, 580);
    ctx.lineTo(500, 570);
    ctx.lineTo(500, 560);
    ctx.lineTo(524, 560);
    ctx.lineTo(524, 570);
    ctx.closePath();
    ctx.fill();

    // Bases
    const bases = [
      { x: 620, y: 450 }, // 1st
      { x: 512, y: 350 }, // 2nd
      { x: 404, y: 450 }  // 3rd
    ];

    ctx.fillStyle = '#FFFFFF';
    bases.forEach((base, i) => {
      // Highlight if runner on base
      if (this.gameState.bases[i + 1]) {
        ctx.fillStyle = '#FFD700';
      } else {
        ctx.fillStyle = '#FFFFFF';
      }

      ctx.save();
      ctx.translate(base.x, base.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
    });

    // Pitcher's mound
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(512, 480, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render players
   */
  private renderPlayers() {
    const ctx = this.ctx;

    this.gameState.players.forEach((player) => {
      // Player circle
      ctx.fillStyle = '#0066CC';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Position label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.position, player.x, player.y - 20);
    });

    // Batter
    if (this.gameState.currentBatter) {
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.arc(540, 560, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * Render ball
   */
  private renderBall() {
    if (this.gameState.ball.active) {
      const ctx = this.ctx;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(this.gameState.ball.x, 600, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(this.gameState.ball.x, this.gameState.ball.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Stitches
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.gameState.ball.x, this.gameState.ball.y, 4, 0, Math.PI);
      ctx.stroke();
    }
  }

  /**
   * Render HUD
   */
  private renderHUD() {
    const ctx = this.ctx;

    // Count display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(20, 20, 200, 120);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('COUNT', 30, 45);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.fillText(`Balls: ${this.gameState.balls}`, 30, 75);
    ctx.fillText(`Strikes: ${this.gameState.strikes}`, 30, 100);
    ctx.fillText(`Outs: ${this.gameState.outs}`, 30, 125);

    // Current batter
    if (this.gameState.currentBatter) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, 160, 250, 80);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('AT BAT', 30, 185);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(this.gameState.currentBatter.name, 30, 210);
      ctx.fillText(`"${this.gameState.currentBatter.nickname}"`, 30, 230);
    }

    // Instructions
    if (!this.autoPlay) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(804, 20, 200, 60);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('SPACE - Swing', 994, 45);
      ctx.fillText('A - Auto-play', 994, 70);
    } else {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillRect(804, 20, 200, 40);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('AUTO-PLAY ON', 994, 48);
    }
  }

  /**
   * Render scoreboard
   */
  private renderScoreboard() {
    const ctx = this.ctx;

    // Scoreboard background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(312, 20, 400, 80);

    // Header
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCOREBOARD', 512, 45);

    // Team names and scores
    if (this.gameState.homeTeam && this.gameState.awayTeam) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';

      // Away team
      ctx.textAlign = 'left';
      ctx.fillText(this.gameState.awayTeam.shortName, 330, 75);
      ctx.textAlign = 'right';
      ctx.fillText(this.gameState.awayTeam.score.toString(), 450, 75);

      // Home team
      ctx.textAlign = 'left';
      ctx.fillText(this.gameState.homeTeam.shortName, 550, 75);
      ctx.textAlign = 'right';
      ctx.fillText(this.gameState.homeTeam.score.toString(), 680, 75);

      // Inning
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${this.gameState.inningHalf.toUpperCase()} ${this.gameState.inning}`,
        475,
        75
      );
    }
  }

  /**
   * Render game over screen
   */
  private renderGameOver() {
    // Draw final field state
    this.renderField();
    this.renderScoreboard();

    // Game over overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, 1024, 768);

    // Title
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER!', 512, 250);

    // Winner
    if (this.gameState.winner) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText(`${this.gameState.winner.name} WIN!`, 512, 350);

      // Final score
      this.ctx.font = '36px Arial';
      this.ctx.fillText(
        `${this.gameState.awayTeam!.score} - ${this.gameState.homeTeam!.score}`,
        512,
        420
      );
    }

    // Play again
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.fillText('Click or Press SPACE to Play Again', 512, 550);
  }

  /**
   * Public API for controls
   */
  public swing() {
    if (this.gameMode === 'playing' && !this.gameState.gameOver) {
      const result = this.gameState.swingBat(0.5, 0.7);
      this.handlePlayResult(result);
    }
  }

  public getGameState() {
    return this.gameState.getGameSummary();
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new BackyardBaseballDemo();

    // Expose to window for debugging
    (window as any).game = game;

    // Add keyboard shortcut for auto-play
    window.addEventListener('keydown', (e) => {
      if (e.key === 'a' || e.key === 'A') {
        game.toggleAutoPlay();
      }
    });

    console.log('⚾ Backyard Baseball Demo Ready!');
    console.log('   window.game - Access game instance');
    console.log('   game.swing() - Manual swing');
    console.log('   game.toggleAutoPlay() - Toggle auto-play');
  } catch (error) {
    console.error('Failed to start game:', error);
  }
});
