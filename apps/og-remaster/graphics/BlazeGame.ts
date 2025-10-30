/**
 * BlazeGame - Main entry point for the graphics engine
 * Provides a simple, elegant API for creating games
 */

import { BlazeRenderer } from './core/BlazeRenderer';
import type { RendererConfig, Color } from './core/types';
import { Scene } from './scene/Scene';
import { Entity, SpriteComponent, AnimationComponent } from './scene/Entity';
import { RenderSystem } from './scene/System';
import { AssetLoader } from './assets/AssetLoader';
import { ThemeManager } from './materials/ThemeManager';
import { EffectsLibrary } from './effects/EffectsLibrary';
import { ParticleRenderSystem } from './effects/ParticleSystem';

export interface BlazeGameConfig {
  canvas: HTMLCanvasElement | string;
  width?: number;
  height?: number;
  backgroundColor?: Color;
  antialias?: boolean;
  autoResize?: boolean;
  theme?: 'auto' | string;
}

export class BlazeGame {
  public readonly renderer: BlazeRenderer;
  public readonly theme: ThemeManager;
  public readonly assets: AssetLoader;
  public readonly scene: Scene;
  public readonly effects: EffectsLibrary;

  private canvas: HTMLCanvasElement;
  private running: boolean = false;
  private lastTime: number = 0;
  private resizeObserver?: ResizeObserver;

  constructor(config: BlazeGameConfig) {
    // Get canvas
    this.canvas = typeof config.canvas === 'string'
      ? document.querySelector(config.canvas)!
      : config.canvas;

    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize theme system
    this.theme = new ThemeManager();

    // Create renderer
    const rendererConfig: RendererConfig = {
      canvas: this.canvas,
      width: config.width || this.canvas.clientWidth,
      height: config.height || this.canvas.clientHeight,
      backgroundColor: config.backgroundColor || this.theme.getColor('background'),
      antialias: config.antialias !== false
    };

    this.renderer = new BlazeRenderer(rendererConfig);

    // Initialize asset loader
    this.assets = new AssetLoader();

    // Create main scene
    this.scene = new Scene('main', this.renderer);

    // Add particle render system
    this.scene.addSystem(new ParticleRenderSystem(this.renderer));

    // Initialize effects library
    this.effects = new EffectsLibrary(this.scene);

    // Setup auto-resize
    if (config.autoResize) {
      this.setupAutoResize();
    }

    console.log(`[BlazeGame] Initialized with ${this.renderer.backend} renderer`);
  }

  /**
   * Load assets before starting the game
   */
  async load(manifestPath?: string): Promise<void> {
    if (manifestPath) {
      await this.assets.loadSpriteManifest(manifestPath);
      console.log('[BlazeGame] Assets loaded');

      // Register textures with render system
      this.registerLoadedAssets();
    }
  }

  private registerLoadedAssets(): void {
    const renderSystem = this.scene.getRenderSystem();
    if (!renderSystem) return;

    // Register all loaded textures
    const textureIds = Array.from((this.assets as any).textures.keys());
    for (const id of textureIds) {
      const texture = this.assets.getTexture(id);
      const frames = this.assets.getSpriteFrames(id);
      if (texture && frames) {
        renderSystem.registerTexture(id, texture, frames);
      }
    }
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.loop();

    console.log('[BlazeGame] Started');
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.running = false;
    console.log('[BlazeGame] Stopped');
  }

  /**
   * Main game loop
   */
  private loop(): void {
    if (!this.running) return;

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // Update
    this.update(deltaTime);

    // Render
    this.render();

    // Continue loop
    requestAnimationFrame(() => this.loop());
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    this.scene.update(deltaTime);
  }

  /**
   * Render the game
   */
  private render(): void {
    // Clear screen
    this.renderer.clear(this.theme.getColor('background'));

    // Set camera
    this.renderer.setCamera(this.scene.camera);

    // Scene rendering is handled by systems
  }

  /**
   * Create a character entity (simplified API)
   */
  createCharacter(characterId: string, options?: {
    position?: { x: number; y: number };
    animation?: string;
    scale?: number;
  }): Entity {
    const entity = this.scene.createEntity(characterId, {
      position: options?.position || { x: 0, y: 0 },
      scale: { x: options?.scale || 1, y: options?.scale || 1 }
    });

    // Add sprite component
    entity.addComponent(new SpriteComponent(characterId, 0));

    // Add animation component
    const animations = this.assets.getAnimations(characterId);
    if (animations) {
      const animComponent = new AnimationComponent(animations);
      entity.addComponent(animComponent);

      // Start animation if specified
      if (options?.animation) {
        animComponent.play(options.animation);
      }
    }

    return entity;
  }

  /**
   * Setup automatic canvas resizing
   */
  private setupAutoResize(): void {
    const resize = () => {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      this.renderer.resize(width, height);
    };

    // Resize on window resize
    window.addEventListener('resize', resize);

    // Use ResizeObserver if available
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(resize);
      this.resizeObserver.observe(this.canvas);
    }

    // Initial resize
    resize();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.scene.clear();
    this.assets.clear();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Get stats for debugging
   */
  getStats(): {
    backend: string;
    entityCount: number;
    fps: number;
  } {
    return {
      backend: this.renderer.backend,
      entityCount: this.scene.entityCount,
      fps: Math.round(1000 / (performance.now() - this.lastTime))
    };
  }
}

/**
 * Simple helper to create a game instance
 */
export function createGame(selector: string, config?: Omit<BlazeGameConfig, 'canvas'>): BlazeGame {
  return new BlazeGame({
    canvas: selector,
    autoResize: true,
    ...config
  });
}
