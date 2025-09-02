/**
 * 2D Canvas Renderer for OG Remaster
 * Backyard Baseball-style graphics with modern performance
 */

import type { GameState } from '../../../packages/rules/gameState';
import type { OGConfig } from '../og.config';
import { readTheme, getFont, type Theme } from '../theme';
import { HUD } from '../ui/HUD';

interface Sprite {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  frames: number;
  currentFrame: number;
  animationSpeed: number;
  lastFrameTime: number;
}

interface TextStyle {
  font: string;
  fillStyle: string;
  strokeStyle?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private config: OGConfig;
  private theme: Theme;
  private hud: HUD;
  private sprites: Map<string, Sprite> = new Map();
  private fieldImage: HTMLImageElement | null = null;
  private particleEffects: Array<{x: number, y: number, vx: number, vy: number, life: number, color: string}> = [];

  // Field coordinates (scaled for canvas)
  private readonly fieldCoords = {
    homeBase: { x: 512, y: 650 },
    firstBase: { x: 650, y: 500 },
    secondBase: { x: 512, y: 350 },
    thirdBase: { x: 374, y: 500 },
    pitcherMound: { x: 512, y: 450 },
    foulPoles: {
      left: { x: 100, y: 200 },
      right: { x: 924, y: 200 }
    }
  };

  constructor(ctx: CanvasRenderingContext2D, state: GameState, config: OGConfig) {
    this.ctx = ctx;
    this.state = state;
    this.config = config;
    this.theme = readTheme();
    this.hud = new HUD(ctx, state);
    this.initializeRenderer();
  }

  private async initializeRenderer() {
    // Set canvas properties for crisp 2D rendering
    this.ctx.imageSmoothingEnabled = false; // Pixel-perfect sprites
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';

    // Load field background
    await this.loadFieldBackground();
    
    // Preload sprite sheets
    await this.loadSpriteSheets();
  }

  private async loadFieldBackground() {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.fieldImage = img;
        resolve();
      };
      img.onerror = () => {
        console.warn('Could not load field background, using procedural field');
        resolve();
      };
      img.src = './assets/fields/sandlot-field.png';
    });
  }

  private async loadSpriteSheets() {
    const spriteDefinitions = [
      { id: 'players', src: './assets/sprites/players.png', frames: 8 },
      { id: 'ball', src: './assets/sprites/ball.png', frames: 4 },
      { id: 'effects', src: './assets/sprites/effects.png', frames: 12 }
    ];

    const loadPromises = spriteDefinitions.map(def => this.loadSprite(def));
    await Promise.all(loadPromises);
  }

  private loadSprite(definition: {id: string, src: string, frames: number}): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.sprites.set(definition.id, {
          image: img,
          x: 0,
          y: 0,
          width: img.width / definition.frames,
          height: img.height,
          frames: definition.frames,
          currentFrame: 0,
          animationSpeed: 8, // frames per second
          lastFrameTime: 0
        });
        resolve();
      };
      img.onerror = () => {
        console.warn(`Could not load sprite: ${definition.src}`);
        resolve();
      };
      img.src = definition.src;
    });
  }

  render() {
    // Update theme if it has changed
    this.theme = readTheme();
    
    this.clearCanvas();
    this.drawField();
    this.drawBases();
    this.drawPlayers();
    this.drawBall();
    this.drawParticleEffects();
    
    // Use HUD for UI rendering
    this.hud.render();
    
    this.updateAnimations();
  }

  private clearCanvas() {
    if (this.config.visuals.colorPalette === 'bright-saturated') {
      // Bright gradient background
      const gradient = this.ctx.createLinearGradient(0, 0, 0, 768);
      gradient.addColorStop(0, '#87CEEB'); // Sky blue
      gradient.addColorStop(0.3, '#90EE90'); // Light green
      gradient.addColorStop(1, this.theme.field); // Grass green
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, 1024, 768);
    } else {
      this.ctx.fillStyle = this.theme.field;
      this.ctx.fillRect(0, 0, 1024, 768);
    }
  }

  private drawField() {
    if (this.fieldImage) {
      this.ctx.drawImage(this.fieldImage, 0, 0, 1024, 768);
    } else {
      this.drawProceduralField();
    }
  }

  private drawProceduralField() {
    // Infield diamond - using theme colors
    this.ctx.fillStyle = this.theme.dirt;
    this.ctx.beginPath();
    this.ctx.moveTo(this.fieldCoords.homeBase.x, this.fieldCoords.homeBase.y);
    this.ctx.lineTo(this.fieldCoords.firstBase.x, this.fieldCoords.firstBase.y);
    this.ctx.lineTo(this.fieldCoords.secondBase.x, this.fieldCoords.secondBase.y);
    this.ctx.lineTo(this.fieldCoords.thirdBase.x, this.fieldCoords.thirdBase.y);
    this.ctx.closePath();
    this.ctx.fill();

    // Pitcher's mound - slightly darker dirt
    this.ctx.fillStyle = this.theme.graphite;
    this.ctx.beginPath();
    this.ctx.arc(this.fieldCoords.pitcherMound.x, this.fieldCoords.pitcherMound.y, 25, 0, Math.PI * 2);
    this.ctx.fill();

    // Foul lines - use theme lines color
    this.ctx.strokeStyle = this.theme.lines;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(this.fieldCoords.homeBase.x, this.fieldCoords.homeBase.y);
    this.ctx.lineTo(this.fieldCoords.firstBase.x, this.fieldCoords.firstBase.y);
    this.ctx.moveTo(this.fieldCoords.homeBase.x, this.fieldCoords.homeBase.y);
    this.ctx.lineTo(this.fieldCoords.thirdBase.x, this.fieldCoords.thirdBase.y);
    this.ctx.stroke();

    // Outfield fence - use brand navy
    this.ctx.strokeStyle = this.theme.navy;
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.arc(512, 650, 400, Math.PI * 0.8, Math.PI * 0.2);
    this.ctx.stroke();
  }

  private drawBases() {
    const baseSize = 20;
    this.ctx.fillStyle = '#FFFFFF';
    
    // Draw base squares
    [this.fieldCoords.firstBase, this.fieldCoords.secondBase, this.fieldCoords.thirdBase].forEach(base => {
      this.ctx.fillRect(base.x - baseSize/2, base.y - baseSize/2, baseSize, baseSize);
    });

    // Home plate (pentagon)
    const home = this.fieldCoords.homeBase;
    this.ctx.beginPath();
    this.ctx.moveTo(home.x, home.y - 10);
    this.ctx.lineTo(home.x + 8, home.y - 5);
    this.ctx.lineTo(home.x + 8, home.y + 5);
    this.ctx.lineTo(home.x, home.y + 10);
    this.ctx.lineTo(home.x - 8, home.y + 5);
    this.ctx.lineTo(home.x - 8, home.y - 5);
    this.ctx.closePath();
    this.ctx.fill();

    // Highlight occupied bases
    this.highlightOccupiedBases();
  }

  private highlightOccupiedBases() {
    const glowColor = '#FFD700'; // Gold glow
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 15;
    
    if (this.state.basesOccupied.first) {
      this.drawBaseGlow(this.fieldCoords.firstBase);
    }
    if (this.state.basesOccupied.second) {
      this.drawBaseGlow(this.fieldCoords.secondBase);
    }
    if (this.state.basesOccupied.third) {
      this.drawBaseGlow(this.fieldCoords.thirdBase);
    }

    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }

  private drawBaseGlow(base: {x: number, y: number}) {
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(base.x, base.y, 25, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawPlayers() {
    const playerSprite = this.sprites.get('players');
    
    this.state.players.forEach(player => {
      if (playerSprite) {
        this.drawSprite(playerSprite, player.x - 16, player.y - 32, 32, 32);
      } else {
        this.drawSimplePlayer(player);
      }
      
      // Player name tag (optional in OG mode)
      if (this.config.visuals.playerSize === 'oversized-cute') {
        this.drawText(player.name, player.x, player.y - 45, {
          font: '12px Arial',
          fillStyle: '#FFFFFF',
          strokeStyle: '#000000',
          strokeWidth: 2
        });
      }
    });
  }

  private drawSimplePlayer(player: any) {
    // Fallback stick figure style
    this.ctx.fillStyle = player.position === 'P' ? '#FF6B35' : '#4A90E2';
    
    // Body
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Position label
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.position, player.x, player.y);
  }

  private drawBall() {
    const ball = this.state.ball;
    const ballSprite = this.sprites.get('ball');
    
    if (ballSprite) {
      this.drawSprite(ballSprite, ball.x - 8, ball.y - 8, 16, 16);
    } else {
      // Simple white circle
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.strokeStyle = '#FF0000'; // Red stitches
      this.ctx.lineWidth = 1;
      
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    // Ball trail effect
    if (this.config.visuals.ballTrail && (ball.vx !== 0 || ball.vy !== 0)) {
      this.drawBallTrail(ball);
    }
  }

  private drawBallTrail(ball: any) {
    const trailLength = 8;
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    
    for (let i = 0; i < trailLength; i++) {
      const alpha = (trailLength - i) / trailLength * 0.3;
      const size = 6 * (trailLength - i) / trailLength;
      
      const trailX = ball.x - ball.vx * i * 2;
      const trailY = ball.y - ball.vy * i * 2;
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawSprite(sprite: Sprite, x: number, y: number, width: number, height: number) {
    const frameWidth = sprite.width;
    const sourceX = sprite.currentFrame * frameWidth;
    
    this.ctx.drawImage(
      sprite.image,
      sourceX, 0, frameWidth, sprite.height,
      x, y, width, height
    );
  }

  private drawParticleEffects() {
    this.particleEffects.forEach((particle, index) => {
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = particle.life / 100;
      
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Update particle
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 2;
      
      if (particle.life <= 0) {
        this.particleEffects.splice(index, 1);
      }
    });
    
    this.ctx.globalAlpha = 1;
  }

  private drawUI() {
    this.drawScoreboard();
    this.drawCountDisplay();
    this.drawGameStatus();
    
    if (this.state.lastPlay) {
      this.drawPlayResult();
    }
  }

  private drawScoreboard() {
    // Scoreboard background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(20, 20, 200, 80);
    
    // Border
    this.ctx.strokeStyle = '#BF5700';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(20, 20, 200, 80);
    
    // Score text
    this.drawText('SCORE', 120, 35, {
      font: 'bold 14px Arial',
      fillStyle: '#FFFFFF'
    });
    
    this.drawText(`Away: ${this.state.awayScore}`, 70, 55, {
      font: 'bold 16px Arial',
      fillStyle: '#FFD700'
    });
    
    this.drawText(`Home: ${this.state.homeScore}`, 170, 55, {
      font: 'bold 16px Arial',
      fillStyle: '#FFD700'
    });
    
    // Inning indicator
    this.drawText(
      `${this.state.topHalf ? '▲' : '▼'} ${this.state.inning}`,
      120, 85,
      {
        font: 'bold 12px Arial',
        fillStyle: '#FFFFFF'
      }
    );
  }

  private drawCountDisplay() {
    // Count display
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(1024 - 160, 20, 140, 60);
    
    this.ctx.strokeStyle = '#BF5700';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(1024 - 160, 20, 140, 60);
    
    this.drawText(`${this.state.balls} - ${this.state.strikes}`, 1024 - 90, 40, {
      font: 'bold 18px Arial',
      fillStyle: '#FFFFFF'
    });
    
    this.drawText(`${this.state.outs} OUT${this.state.outs === 1 ? '' : 'S'}`, 1024 - 90, 65, {
      font: 'bold 12px Arial',
      fillStyle: '#FFFFFF'
    });
  }

  private drawGameStatus() {
    if (this.state.gamePhase === 'complete') {
      const winner = this.state.homeScore > this.state.awayScore ? 'HOME WINS!' : 
                     this.state.awayScore > this.state.homeScore ? 'AWAY WINS!' : 'TIE GAME!';
      
      // Game over overlay
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, 1024, 768);
      
      this.drawText(winner, 512, 300, {
        font: 'bold 48px Arial',
        fillStyle: '#FFD700',
        strokeStyle: '#000000',
        strokeWidth: 4
      });
      
      this.drawText('Press SPACE to play again', 512, 400, {
        font: 'bold 24px Arial',
        fillStyle: '#FFFFFF'
      });
    }
  }

  private drawPlayResult() {
    if (Date.now() % 2000 < 1500) { // Flash for 1.5s every 2s
      this.drawText(this.state.lastPlay, 512, 200, {
        font: 'bold 24px Arial',
        fillStyle: '#FFD700',
        strokeStyle: '#000000',
        strokeWidth: 3,
        shadowColor: '#000000',
        shadowBlur: 4,
        shadowOffsetX: 2,
        shadowOffsetY: 2
      });
    }
  }

  private drawText(text: string, x: number, y: number, style: TextStyle) {
    this.ctx.font = style.font;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    if (style.shadowColor) {
      this.ctx.shadowColor = style.shadowColor;
      this.ctx.shadowBlur = style.shadowBlur || 0;
      this.ctx.shadowOffsetX = style.shadowOffsetX || 0;
      this.ctx.shadowOffsetY = style.shadowOffsetY || 0;
    }
    
    if (style.strokeStyle && style.strokeWidth) {
      this.ctx.strokeStyle = style.strokeStyle;
      this.ctx.lineWidth = style.strokeWidth;
      this.ctx.strokeText(text, x, y);
    }
    
    this.ctx.fillStyle = style.fillStyle;
    this.ctx.fillText(text, x, y);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  private updateAnimations() {
    const now = Date.now();
    
    this.sprites.forEach(sprite => {
      if (now - sprite.lastFrameTime > 1000 / sprite.animationSpeed) {
        sprite.currentFrame = (sprite.currentFrame + 1) % sprite.frames;
        sprite.lastFrameTime = now;
      }
    });
  }

  // Public methods for game events
  createHitEffect(x: number, y: number, type: 'contact' | 'homerun' | 'error') {
    const colors = {
      contact: ['#FFD700', '#FFA500'],
      homerun: ['#FF6B35', '#FF8C00', '#FFD700'],
      error: ['#FF4444', '#CC0000']
    };
    
    const particleColors = colors[type];
    
    for (let i = 0; i < 15; i++) {
      this.particleEffects.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 100,
        color: particleColors[Math.floor(Math.random() * particleColors.length)]
      });
    }
  }

  showComicEffect(text: string, x: number, y: number) {
    // This could be expanded to show comic book style "POW!" effects
    console.log(`Comic effect: ${text} at (${x}, ${y})`);
  }

  resize(width: number, height: number) {
    const canvas = this.ctx.canvas;
    canvas.width = width;
    canvas.height = height;
    
    // Maintain aspect ratio for mobile
    const aspectRatio = 1024 / 768;
    if (width / height > aspectRatio) {
      canvas.style.width = (height * aspectRatio) + 'px';
      canvas.style.height = height + 'px';
    } else {
      canvas.style.width = width + 'px';
      canvas.style.height = (width / aspectRatio) + 'px';
    }
  }
}