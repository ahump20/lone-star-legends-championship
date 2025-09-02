/**
 * OG Remaster Main Entry Point
 * Backyard Baseball-style game with Blaze Intelligence polish
 */

import { CanvasRenderer } from './renderer/CanvasRenderer';
import { GameState } from '../../packages/rules/gameState';
import { InputManager } from './input';
import { AudioEngine } from './audio/AudioEngine';
import { themeManager } from './theme';
import config from './og.config';
import { BlazeAI } from './ai/BlazeAI';
import { CommentaryEngine } from './audio/CommentaryEngine';
import { TournamentMode } from './modes/TournamentMode';
import { ReplaySystem } from './replay/ReplaySystem';
import { HighlightsViewer } from './ui/HighlightsViewer';
import { MLBDataLoader, MLBTeam } from './data/MLBDataLoader';
import { TeamSelector } from './ui/TeamSelector';

class OGRemasterGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private renderer: CanvasRenderer;
  private inputManager: InputManager;
  private audioEngine: AudioEngine;
  private commentaryEngine: CommentaryEngine;
  private blazeAI: BlazeAI;
  private tournamentMode: TournamentMode;
  private replaySystem: ReplaySystem;
  private highlightsViewer: HighlightsViewer;
  private mlbDataLoader: MLBDataLoader;
  private teamSelector: TeamSelector;
  private selectedTeam?: MLBTeam;
  
  private isRunning = false;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;

  constructor() {
    console.log('🏆 Initializing Blaze Intelligence OG Remaster...');
    
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Game canvas not found!');
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D context not supported!');
    }
    this.ctx = ctx;

    // Initialize game systems
    this.gameState = new GameState();
    this.renderer = new CanvasRenderer(ctx, this.gameState, config);
    this.audioEngine = new AudioEngine();
    this.inputManager = new InputManager(this.gameState);
    this.commentaryEngine = new CommentaryEngine();
    this.blazeAI = new BlazeAI();
    this.tournamentMode = new TournamentMode(this.gameState);
    this.replaySystem = new ReplaySystem(this.canvas);
    this.highlightsViewer = new HighlightsViewer(this.replaySystem);
    this.mlbDataLoader = new MLBDataLoader();
    this.teamSelector = new TeamSelector(this.mlbDataLoader, (team) => this.onTeamSelected(team));

    this.setupEventListeners();
    this.setupGameplayCallbacks();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🎵 Loading audio assets...');
      await this.audioEngine.initialize();
      
      console.log('🎨 Loading character sprites...');
      await this.loadGameAssets();
      
      console.log('🎮 Setting up responsive canvas...');
      this.setupResponsiveCanvas();
      
      console.log('🏆 Game ready! Welcome to Championship Baseball!');
      
      // Hide loading screen
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500);
      }
      
      // Apply theme
      themeManager.applyGameState('menu');
      
      // Add highlights button to UI
      this.highlightsViewer.addHighlightsButton();
      
      // Start game loop
      this.start();
      
    } catch (error) {
      console.error('Initialization failed:', error);
      this.showError('Failed to initialize game. Please refresh and try again.');
    }
  }

  private async loadGameAssets(): Promise<void> {
    // In a real implementation, this would load sprite sheets and other assets
    // For now, we'll simulate loading
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('✅ Assets loaded successfully');
        resolve();
      }, 1000);
    });
  }

  private setupResponsiveCanvas(): void {
    const resizeCanvas = () => {
      const container = this.canvas.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const aspectRatio = 1024 / 768;
      
      let canvasWidth = containerRect.width;
      let canvasHeight = containerRect.height;
      
      // Maintain aspect ratio
      if (canvasWidth / canvasHeight > aspectRatio) {
        canvasWidth = canvasHeight * aspectRatio;
      } else {
        canvasHeight = canvasWidth / aspectRatio;
      }
      
      // Set display size
      this.canvas.style.width = canvasWidth + 'px';
      this.canvas.style.height = canvasHeight + 'px';
      
      // Notify renderer of resize
      this.renderer.resize(canvasWidth, canvasHeight);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial sizing
  }

  private setupEventListeners(): void {
    // Game event listeners
    this.inputManager.on('startGame', () => {
      this.startNewGame();
    });

    this.inputManager.on('swing', (result: any) => {
      this.handleSwing(result);
    });

    this.inputManager.on('pitch', (result: any) => {
      this.handlePitch(result);
    });

    this.inputManager.on('pause', () => {
      this.togglePause();
    });

    this.inputManager.on('restartGame', () => {
      this.startNewGame();
    });

    this.inputManager.on('selectTeam', () => {
      this.teamSelector.show();
    });

    // Theme changes
    themeManager.onChange((theme) => {
      console.log('🎨 Theme updated:', theme);
    });

    // Visibility change handling
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      }
    });
  }

  private setupGameplayCallbacks(): void {
    // Set up audio triggers based on game events
    const originalSwingBat = this.gameState.swingBat.bind(this.gameState);
    this.gameState.swingBat = () => {
      const result = originalSwingBat();
      
      // Start recording for potential highlights
      this.replaySystem.startRecording();
      
      if (result.contact) {
        let hitStrength: 'weak' | 'solid' | 'crushing' = 'solid';
        
        if (result.result === 'homerun') hitStrength = 'crushing';
        else if (result.result === 'foul') hitStrength = 'weak';
        
        this.audioEngine.onBatContact(hitStrength);
        
        // Create visual effects
        const ball = this.gameState.ball;
        if (result.result === 'homerun') {
          this.renderer.createHitEffect(ball.x, ball.y, 'homerun');
          this.audioEngine.onHomeRun();
          
          // Detect highlight
          this.replaySystem.detectHighlight(this.gameState, 'home_run');
        } else if (result.contact) {
          this.renderer.createHitEffect(ball.x, ball.y, 'contact');
        }
      }
      
      // Stop recording after a few seconds
      setTimeout(() => this.replaySystem.stopRecording(), 5000);
      
      return result;
    };
  }

  private startNewGame(): void {
    console.log('🚀 Starting new game...');
    
    // Show team selector if no team selected
    if (!this.selectedTeam) {
      this.teamSelector.show();
      return;
    }
    
    this.gameState = new GameState();
    this.gameState.startGame();
    
    // Set team data in game state
    this.applyTeamToGameState(this.selectedTeam);
    
    themeManager.applyGameState('playing');
    this.audioEngine.onGameStart();
    
    this.setupGameplayCallbacks(); // Re-setup callbacks for new game state
  }
  
  private onTeamSelected(team: MLBTeam): void {
    console.log(`🏆 Team selected: ${team.city} ${team.name}`);
    this.selectedTeam = team;
    
    // Update UI with team colors
    document.documentElement.style.setProperty('--team-primary', team.primaryColor);
    document.documentElement.style.setProperty('--team-secondary', team.secondaryColor);
    
    // Start new game with selected team
    this.startNewGame();
  }
  
  private applyTeamToGameState(team: MLBTeam): void {
    // Apply team roster to game state
    if (this.gameState) {
      // Set team name and colors
      (this.gameState as any).homeTeam = {
        name: team.name,
        city: team.city,
        abbreviation: team.abbreviation,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        roster: team.roster
      };
      
      // Set starting lineup (first 9 position players)
      const lineup = team.roster
        .filter(p => !['SP', 'RP', 'CP', 'P'].includes(p.position))
        .slice(0, 9);
      
      (this.gameState as any).homeLineup = lineup;
      
      // Set starting pitcher
      const pitcher = team.roster.find(p => p.position === 'SP') || team.roster[0];
      (this.gameState as any).currentPitcher = pitcher.name;
      
      // Set first batter
      if (lineup.length > 0) {
        (this.gameState as any).currentBatter = lineup[0].name;
      }
      
      console.log(`📋 Lineup set with ${lineup.length} players`);
      console.log(`⚾ Starting pitcher: ${pitcher.name}`);
    }
  }

  private handleSwing(result: any): void {
    if (result.contact) {
      console.log(`🏏 Contact! Result: ${result.result}`);
    } else {
      console.log(`⚾ Miss! Result: ${result.result}`);
    }
  }

  private handlePitch(result: any): void {
    console.log(`⚾ Pitch result: ${result.result}`);
    
    if (result.result === 'strike') {
      // Check if it was a strikeout
      if (this.gameState.strikes >= 3) {
        this.audioEngine.onStrikeout();
        
        // Detect strikeout highlight
        this.replaySystem.startRecording();
        this.replaySystem.detectHighlight(this.gameState, 'strikeout');
        setTimeout(() => this.replaySystem.stopRecording(), 3000);
      }
    }
  }

  private togglePause(): void {
    if (this.isRunning) {
      this.pause();
    } else {
      this.resume();
    }
  }

  private pause(): void {
    this.isRunning = false;
    themeManager.applyGameState('paused');
    console.log('⏸️ Game paused');
  }

  private resume(): void {
    this.isRunning = true;
    themeManager.applyGameState('playing');
    console.log('▶️ Game resumed');
    this.gameLoop(performance.now());
  }

  private start(): void {
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }

  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Calculate FPS
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / deltaTime);
    }

    // Update game state
    this.gameState.update();
    
    // Capture frame for replay system
    if (this.replaySystem) {
      this.replaySystem.captureFrame(this.gameState);
    }
    
    // Check for game end
    if (this.gameState.gamePhase === 'complete') {
      const won = this.gameState.homeScore > this.gameState.awayScore;
      this.audioEngine.onGameEnd(won);
      themeManager.applyGameState('gameover');
    }

    // Render frame
    this.renderer.render();
    
    // Debug info (remove in production)
    if (config.performance && this.frameCount % 60 === 0) {
      this.drawDebugInfo();
    }

    // Schedule next frame
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  private drawDebugInfo(): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 200, 80);
    
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`FPS: ${this.fps}`, 15, 25);
    this.ctx.fillText(`Frame: ${this.frameCount}`, 15, 40);
    this.ctx.fillText(`Audio: ${this.audioEngine.getLoadedStatus().isReady ? 'Ready' : 'Loading'}`, 15, 55);
    this.ctx.fillText(`Phase: ${this.gameState.gamePhase}`, 15, 70);
    this.ctx.restore();
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4444;
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      text-align: center;
      z-index: 10000;
    `;
    errorDiv.innerHTML = `
      <h3>Oops!</h3>
      <p>${message}</p>
      <button onclick="location.reload()" style="
        background: white;
        color: #ff4444;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      ">Refresh Page</button>
    `;
    
    document.body.appendChild(errorDiv);
  }

  // Public API for debugging/development
  public getGameState() {
    return this.gameState.getGameSummary();
  }

  public getAudioStatus() {
    return this.audioEngine.getLoadedStatus();
  }

  public setVolume(master: number, sfx?: number, commentary?: number, music?: number) {
    this.audioEngine.setMasterVolume(master);
    if (sfx !== undefined) this.audioEngine.setSFXVolume(sfx);
    if (commentary !== undefined) this.audioEngine.setCommentaryVolume(commentary);
    if (music !== undefined) this.audioEngine.setMusicVolume(music);
  }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new OGRemasterGame();
    
    // Expose game to window for debugging
    (window as any).blazeGame = game;
    
    console.log('🏆 Blaze Intelligence OG Remaster loaded successfully!');
    console.log('   Use window.blazeGame to access game API');
    
  } catch (error) {
    console.error('❌ Failed to start game:', error);
  }
});

// Service worker registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('📱 PWA: Service Worker registered', registration.scope);
      })
      .catch((error) => {
        console.log('📱 PWA: Service Worker registration failed', error);
      });
  });
}