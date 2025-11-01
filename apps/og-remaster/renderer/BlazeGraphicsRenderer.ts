import { GameState } from "../../../packages/rules/gameState";
import { BlazeGame } from "../graphics/BlazeGame";
import { Scene } from "../graphics/scene/Scene";
import { Entity, SpriteComponent } from "../graphics/scene/Entity";
import { EffectsLibrary } from "../graphics/effects/EffectsLibrary";
import { ThemeManager } from "../graphics/materials/ThemeManager";
import { readTheme } from "../theme";
import { VisualEffects } from "./VisualEffects";
import type { Color } from "../graphics/core/types";

/**
 * Enhanced renderer using the Blaze Graphics Engine
 * Provides high-quality visuals with sprites, particles, and effects
 */
export class BlazeGraphicsRenderer {
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private blazeGame: BlazeGame;
  private scene: Scene;
  private effects: EffectsLibrary;
  private themeManager: ThemeManager;
  private visualEffects: VisualEffects;

  private playerEntities: Map<string, Entity> = new Map();
  private ballEntity?: Entity;
  private backgroundEntities: Entity[] = [];

  private canvas: HTMLCanvasElement;
  private width = 1024;
  private height = 768;
  private time = 0;

  constructor(canvas: HTMLCanvasElement, state: GameState) {
    this.canvas = canvas;
    this.state = state;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    // Initialize Blaze Graphics Engine
    this.blazeGame = new BlazeGame({
      canvas: canvas,
      width: this.width,
      height: this.height,
      backgroundColor: [10, 22, 40, 255] as any,
      antialias: true,
      autoResize: false
    });

    this.scene = this.blazeGame.scene;
    this.effects = new EffectsLibrary(this.scene);
    this.themeManager = new ThemeManager();
    this.visualEffects = new VisualEffects(this.width, this.height);

    this.initializeBackground();
  }

  /**
   * Initialize beautiful stadium background
   */
  private initializeBackground(): void {
    const theme = readTheme();

    // Create gradient background layers
    this.drawStadiumBackground();

    // Add ambient particles for atmosphere
    this.createAmbientParticles();
  }

  /**
   * Draw a beautiful stadium background
   */
  private drawStadiumBackground(): void {
    // Sky gradient
    const skyGradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 3, 100,
      this.width / 2, this.height / 3, this.height
    );
    skyGradient.addColorStop(0, '#4a90e2');
    skyGradient.addColorStop(0.5, '#357abd');
    skyGradient.addColorStop(1, '#0a1628');

    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    this.visualEffects.drawStars(this.ctx, this.time);

    // Clouds
    this.visualEffects.drawClouds(this.ctx, 16);

    // Stadium lights glow
    this.drawStadiumLights();

    // Crowd in stands
    this.visualEffects.drawCrowd(this.ctx);

    // Field
    this.drawEnhancedField();

    // Vignette
    this.visualEffects.drawVignette(this.ctx);
  }

  /**
   * Draw stadium lights with glow effect
   */
  private drawStadiumLights(): void {
    const lights = [
      { x: 150, y: 100 },
      { x: 874, y: 100 },
      { x: 150, y: 650 },
      { x: 874, y: 650 }
    ];

    lights.forEach(light => {
      // Glow
      const gradient = this.ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, 80
      );
      gradient.addColorStop(0, 'rgba(255, 230, 100, 0.4)');
      gradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 180, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(light.x - 80, light.y - 80, 160, 160);

      // Light fixture
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(light.x - 15, light.y - 10, 30, 20);

      // Bright center
      this.ctx.fillStyle = '#ffe066';
      this.ctx.beginPath();
      this.ctx.arc(light.x, light.y, 8, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  /**
   * Draw enhanced field with beautiful grass, dirt, and details
   */
  private drawEnhancedField(): void {
    const centerX = this.width / 2;
    const baseY = 550;

    // Outfield grass with pattern
    const grassGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grassGradient.addColorStop(0, '#2d5016');
    grassGradient.addColorStop(0.5, '#3d7019');
    grassGradient.addColorStop(1, '#4a8821');

    this.ctx.fillStyle = grassGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add grass texture pattern
    this.ctx.save();
    this.ctx.globalAlpha = 0.1;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 3 + 1;
      this.ctx.fillStyle = '#2a4512';
      this.ctx.fillRect(x, y, size, size);
    }
    this.ctx.restore();

    // Infield dirt with gradient
    const dirtGradient = this.ctx.createRadialGradient(
      centerX, baseY, 50,
      centerX, baseY, 250
    );
    dirtGradient.addColorStop(0, '#c4915c');
    dirtGradient.addColorStop(0.7, '#a67951');
    dirtGradient.addColorStop(1, '#8b6342');

    this.ctx.fillStyle = dirtGradient;
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, baseY, 280, 180, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Add dirt texture
    this.ctx.save();
    this.ctx.globalAlpha = 0.15;
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 250;
      const x = centerX + Math.cos(angle) * distance * 1.5;
      const y = baseY + Math.sin(angle) * distance;
      const size = Math.random() * 2 + 1;
      this.ctx.fillStyle = '#8b6342';
      this.ctx.fillRect(x, y, size, size);
    }
    this.ctx.restore();

    // Pitcher's mound
    this.ctx.fillStyle = '#a67951';
    this.ctx.beginPath();
    this.ctx.arc(centerX, baseY - 80, 35, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#8b6342';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Home plate
    this.drawBase(centerX, baseY + 150, '#ffffff', true);

    // Bases with shadows
    const baseDistance = 180;
    this.drawBase(centerX + baseDistance, baseY + 80, '#ffffff');  // First
    this.drawBase(centerX, baseY - 100, '#ffffff');                // Second
    this.drawBase(centerX - baseDistance, baseY + 80, '#ffffff');  // Third

    // Foul lines with chalk effect
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    this.ctx.shadowBlur = 5;
    this.ctx.setLineDash([]);

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, baseY + 150);
    this.ctx.lineTo(this.width, this.height);
    this.ctx.moveTo(centerX, baseY + 150);
    this.ctx.lineTo(0, this.height);
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;

    // Basepaths
    this.ctx.strokeStyle = '#8b6342';
    this.ctx.lineWidth = 50;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, baseY + 150);
    this.ctx.lineTo(centerX + baseDistance, baseY + 80);
    this.ctx.lineTo(centerX, baseY - 100);
    this.ctx.lineTo(centerX - baseDistance, baseY + 80);
    this.ctx.lineTo(centerX, baseY + 150);
    this.ctx.stroke();
  }

  /**
   * Draw a base with shadow and 3D effect
   */
  private drawBase(x: number, y: number, color: string, isHome = false): void {
    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(x - 13, y - 13, 26, 26);

    // Base
    this.ctx.fillStyle = color;
    if (isHome) {
      // Home plate pentagon
      this.ctx.beginPath();
      this.ctx.moveTo(x, y - 12);
      this.ctx.lineTo(x + 12, y - 12);
      this.ctx.lineTo(x + 12, y);
      this.ctx.lineTo(x, y + 12);
      this.ctx.lineTo(x - 12, y);
      this.ctx.closePath();
      this.ctx.fill();
    } else {
      // Regular base - rotated square
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(Math.PI / 4);
      this.ctx.fillRect(-10, -10, 20, 20);
      this.ctx.restore();
    }

    // Highlight
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 10, y - 10, 20, 20);
  }

  /**
   * Create ambient particles for atmosphere
   */
  private createAmbientParticles(): void {
    // Floating dust particles
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        this.effects.slideEffect({ x, y });
      }, i * 500);
    }
  }

  /**
   * Create or update player entities
   */
  private updatePlayers(): void {
    const players = (this.state as any).players || this.getDefaultPlayers();

    players.forEach((player: any, index: number) => {
      let entity = this.playerEntities.get(player.id || `player_${index}`);

      if (!entity) {
        // Create new player entity
        entity = this.scene.createEntity();

        // Add sprite component (circle for now, can be replaced with actual sprites)
        entity.addComponent(new SpriteComponent({
          texture: undefined,
          frame: {
            x: 0,
            y: 0,
            width: 40,
            height: 40
          },
          width: 40,
          height: 40,
          color: this.getPlayerColorRGBA(player.team)
        }));

        // Add glow effect
        this.effects.addGlow(entity, this.getPlayerColorRGBA(player.team), 1.5);

        this.playerEntities.set(player.id || `player_${index}`, entity);
      }

      // Update position
      entity.transform.position.x = player.x;
      entity.transform.position.y = player.y;
    });
  }

  /**
   * Get default player positions
   */
  private getDefaultPlayers(): any[] {
    const centerX = this.width / 2;
    const baseY = 550;

    return [
      // Defense
      { id: 'pitcher', x: centerX, y: baseY - 80, team: 'away' },
      { id: 'catcher', x: centerX, y: baseY + 170, team: 'away' },
      { id: 'first', x: centerX + 200, y: baseY + 80, team: 'away' },
      { id: 'second', x: centerX, y: baseY - 100, team: 'away' },
      { id: 'third', x: centerX - 200, y: baseY + 80, team: 'away' },
      { id: 'short', x: centerX - 100, y: baseY - 20, team: 'away' },
      { id: 'left', x: centerX - 200, y: baseY - 200, team: 'away' },
      { id: 'center', x: centerX, y: baseY - 250, team: 'away' },
      { id: 'right', x: centerX + 200, y: baseY - 200, team: 'away' },
      // Batter
      { id: 'batter', x: centerX + 30, y: baseY + 140, team: 'home' }
    ];
  }

  /**
   * Get player color based on team
   */
  private getPlayerColor(team: string): string {
    return team === 'home' ? '#ff6b35' : '#4ecdc4';
  }

  /**
   * Get player color as RGBA for graphics engine
   */
  private getPlayerColorRGBA(team: string): Color {
    return team === 'home'
      ? { r: 255, g: 107, b: 53, a: 255 }
      : { r: 78, g: 205, b: 196, a: 255 };
  }

  /**
   * Update ball entity
   */
  private updateBall(): void {
    const ball = (this.state as any).ball || { x: this.width / 2, y: 550 };

    if (!this.ballEntity) {
      this.ballEntity = this.scene.createEntity();
      this.ballEntity.addComponent(new SpriteComponent({
        texture: undefined,
        frame: {
          x: 0,
          y: 0,
          width: 16,
          height: 16
        },
        width: 16,
        height: 16,
        color: { r: 255, g: 255, b: 255, a: 255 }
      }));

      // Add glow to ball
      this.effects.addGlow(this.ballEntity, { r: 255, g: 255, b: 255, a: 255 }, 2);
    }

    // Update position
    const prevX = this.ballEntity.transform.position.x;
    const prevY = this.ballEntity.transform.position.y;

    this.ballEntity.transform.position.x = ball.x;
    this.ballEntity.transform.position.y = ball.y;

    // Create trail if ball is moving fast
    if (ball.vx || ball.vy) {
      const speed = Math.sqrt((ball.vx || 0) ** 2 + (ball.vy || 0) ** 2);
      if (speed > 5) {
        this.effects.addTrail(
          this.ballEntity,
          { r: 255, g: 255, b: 255, a: 255 },
          10
        );
      }
    }
  }

  /**
   * Create hit effect
   */
  public createHitEffect(x: number, y: number, type: 'contact' | 'homerun' | 'strikeout'): void {
    switch (type) {
      case 'homerun':
        this.effects.homeRun({ x, y });
        this.effects.screenShake(15, 500);
        break;
      case 'contact':
        this.effects.hitImpact({ x, y }, { r: 255, g: 255, b: 255, a: 255 });
        this.effects.screenShake(8, 300);
        break;
      case 'strikeout':
        this.effects.strikeout({ x, y });
        break;
    }
  }

  /**
   * Resize handler
   */
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    // BlazeGame doesn't have a resize method, recreate if needed
    this.visualEffects.resize(width, height);
  }

  /**
   * Main render method
   */
  public render(): void {
    // Update time for animations
    this.time += 0.016; // Assume 60 FPS

    // Clear with background
    this.drawStadiumBackground();

    // Update entities
    this.updatePlayers();
    this.updateBall();

    // Draw players as enhanced circles with shadows
    this.drawEnhancedPlayers();

    // Draw ball with glow
    this.drawEnhancedBall();

    // Update scene (BlazeGame update/render are private, use scene instead)
    this.scene.update(16);

    // Draw UI overlay
    this.drawUI();
  }

  /**
   * Draw enhanced players with shadows and outlines
   */
  private drawEnhancedPlayers(): void {
    const players = (this.state as any).players || this.getDefaultPlayers();

    players.forEach((player: any) => {
      const x = player.x;
      const y = player.y;
      const color = this.getPlayerColor(player.team);

      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(x + 2, y + 2, 18, 0, Math.PI * 2);
      this.ctx.fill();

      // Glow
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 25);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.7, color + '88');
      gradient.addColorStop(1, color + '00');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 25, 0, Math.PI * 2);
      this.ctx.fill();

      // Player body
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 16, 0, Math.PI * 2);
      this.ctx.fill();

      // Outline
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(x - 4, y - 4, 6, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  /**
   * Draw enhanced ball with glow and trail
   */
  private drawEnhancedBall(): void {
    const ball = (this.state as any).ball || { x: this.width / 2, y: 550 };
    const x = ball.x;
    const y = ball.y;

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x + 1, y + 1, 10, 0, Math.PI * 2);
    this.ctx.fill();

    // Glow
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 20);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 20, 0, Math.PI * 2);
    this.ctx.fill();

    // Ball
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fill();

    // Highlight
    this.ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Seams
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0.2, Math.PI * 0.8);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, Math.PI + 0.2, Math.PI * 1.8);
    this.ctx.stroke();
  }

  /**
   * Draw UI overlay with game info
   */
  private drawUI(): void {
    const padding = 20;
    const panelWidth = 300;
    const panelHeight = 120;

    // Scoreboard panel
    this.ctx.save();

    // Panel background with glassmorphism
    this.ctx.fillStyle = 'rgba(10, 22, 40, 0.85)';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    this.ctx.fillRect(padding, padding, panelWidth, panelHeight);

    // Border
    this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(padding, padding, panelWidth, panelHeight);

    this.ctx.shadowBlur = 0;

    // Title
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillText('INNING', padding + 15, padding + 30);

    // Inning info
    const inning = this.state.inning || 1;
    const isTop = (this.state as any).isTop !== false;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.fillText(`${isTop ? '▲' : '▼'} ${inning}`, padding + 15, padding + 70);

    // Count
    this.ctx.fillStyle = '#ffe66d';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(
      `${this.state.balls}-${this.state.strikes}`,
      padding + 120, padding + 50
    );

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('COUNT', padding + 120, padding + 35);

    // Outs
    this.ctx.fillStyle = '#ff6b35';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(
      `${this.state.outs} OUTS`,
      padding + 120, padding + 85
    );

    // Score panel
    const scoreX = padding;
    const scoreY = padding + panelHeight + 20;
    const scoreHeight = 80;

    this.ctx.fillStyle = 'rgba(10, 22, 40, 0.85)';
    this.ctx.fillRect(scoreX, scoreY, panelWidth, scoreHeight);

    this.ctx.strokeStyle = 'rgba(255, 107, 53, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(scoreX, scoreY, panelWidth, scoreHeight);

    // Score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('HOME', scoreX + 15, scoreY + 25);
    this.ctx.fillText('AWAY', scoreX + 15, scoreY + 55);

    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#ff6b35';
    this.ctx.fillText(
      `${(this.state as any).homeScore || 0}`,
      scoreX + panelWidth - 50, scoreY + 30
    );

    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.fillText(
      `${(this.state as any).awayScore || 0}`,
      scoreX + panelWidth - 50, scoreY + 60
    );

    this.ctx.restore();
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.blazeGame.destroy();
    this.playerEntities.clear();
  }
}
