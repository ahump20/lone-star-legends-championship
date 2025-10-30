/**
 * EffectsLibrary - Pre-built visual effects
 * Easy-to-use effects for common game scenarios
 */

import { Entity, Component } from '../scene/Entity';
import type { Scene } from '../scene/Scene';
import type { Color, Vector2 } from '../core/types';
import { ParticleEmitter } from './ParticleSystem';

/**
 * Glow effect component
 */
export class GlowComponent extends Component {
  constructor(
    public color: Color,
    public intensity: number = 1.0,
    public radius: number = 10,
    public pulseSpeed: number = 0
  ) {
    super();
  }

  private time: number = 0;

  update(deltaTime: number): void {
    if (this.pulseSpeed > 0) {
      this.time += deltaTime / 1000;
      this.intensity = 0.5 + Math.sin(this.time * this.pulseSpeed) * 0.5;
    }
  }
}

/**
 * Trail effect component
 */
export class TrailComponent extends Component {
  private positions: Vector2[] = [];
  private maxLength: number = 10;
  private emitTimer: number = 0;
  private emitInterval: number = 50; // ms

  constructor(
    public color: Color,
    public length: number = 10,
    private emitter?: ParticleEmitter
  ) {
    super();
    this.maxLength = length;
  }

  update(deltaTime: number): void {
    if (!this.entity) return;

    // Add current position to trail
    this.positions.push({ ...this.entity.transform.position });

    // Keep trail at max length
    if (this.positions.length > this.maxLength) {
      this.positions.shift();
    }

    // Emit trail particles
    if (this.emitter) {
      this.emitTimer += deltaTime;
      if (this.emitTimer >= this.emitInterval) {
        this.emitTimer = 0;
        const direction = this.entity.getComponent(VelocityComponent)?.velocity;
        if (direction) {
          const angle = Math.atan2(direction.y, direction.x);
          this.emitter.trail(this.entity.transform.position, this.color, angle);
        }
      }
    }
  }

  getPositions(): Vector2[] {
    return this.positions;
  }
}

/**
 * Flash effect component - temporarily changes entity appearance
 */
export class FlashComponent extends Component {
  private elapsed: number = 0;

  constructor(
    public duration: number,
    public color: Color,
    public intensity: number = 1.0
  ) {
    super();
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    if (this.elapsed >= this.duration) {
      // Remove self when done
      this.entity?.removeComponent(FlashComponent);
    }
  }

  getProgress(): number {
    return Math.min(1, this.elapsed / this.duration);
  }
}

// Import for trail
import { VelocityComponent } from '../scene/Entity';

/**
 * EffectsLibrary - High-level effects API
 */
export class EffectsLibrary {
  private particleEmitter: ParticleEmitter;

  constructor(private scene: Scene) {
    this.particleEmitter = new ParticleEmitter(scene);
  }

  /**
   * Add a glow effect to an entity
   */
  addGlow(entity: Entity, color: Color, intensity: number = 1.0, pulse: boolean = false): void {
    const glow = new GlowComponent(
      color,
      intensity,
      20,
      pulse ? 2 : 0
    );
    entity.addComponent(glow);
  }

  /**
   * Add a trail effect to an entity
   */
  addTrail(entity: Entity, color: Color, length: number = 10): void {
    const trail = new TrailComponent(color, length, this.particleEmitter);
    entity.addComponent(trail);
  }

  /**
   * Flash an entity (e.g., when hit)
   */
  flash(entity: Entity, color: Color, duration: number = 100): void {
    entity.addComponent(new FlashComponent(duration, color));
  }

  /**
   * Create a hit impact effect
   */
  hitImpact(position: Vector2, color: Color): void {
    this.particleEmitter.explosion(position, color, { intensity: 0.5 });
    this.particleEmitter.sparkle(position, color);
  }

  /**
   * Create a home run effect
   */
  homeRun(position: Vector2): void {
    const colors = [
      { r: 1, g: 0.42, b: 0.21, a: 1 }, // Orange
      { r: 1, g: 0.9, b: 0.43, a: 1 },  // Yellow
      { r: 0.31, g: 0.8, b: 0.78, a: 1 } // Teal
    ];

    for (const color of colors) {
      this.particleEmitter.explosion(position, color, { intensity: 1.5 });
    }
  }

  /**
   * Create a slide effect (dust cloud)
   */
  slideEffect(position: Vector2): void {
    const dustColor = { r: 0.6, g: 0.5, b: 0.4, a: 0.5 };
    this.particleEmitter.dustCloud(position, dustColor);
  }

  /**
   * Create a strikeout effect
   */
  strikeout(position: Vector2): void {
    const colors = [
      { r: 1, g: 0, b: 0, a: 1 },
      { r: 1, g: 1, b: 1, a: 1 }
    ];

    for (const color of colors) {
      this.particleEmitter.sparkle(position, color);
    }
  }

  /**
   * Create a power-up effect
   */
  powerUp(entity: Entity, color: Color): void {
    this.addGlow(entity, color, 1.5, true);

    // Spiral particles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.particleEmitter.emit({
          position: entity.transform.position,
          color,
          count: 8,
          size: 3,
          lifetime: 1000,
          direction: (i * Math.PI * 2) / 3,
          spread: Math.PI / 4,
          velocityVariance: 50,
          fade: true,
          shrink: true
        });
      }, i * 100);
    }
  }

  /**
   * Screen shake effect (returns shake offset for camera)
   */
  screenShake(intensity: number, duration: number): { x: number; y: number } {
    const progress = Math.random();
    const amount = intensity * (1 - progress);

    return {
      x: (Math.random() - 0.5) * amount,
      y: (Math.random() - 0.5) * amount
    };
  }

  /**
   * Get particle emitter for custom effects
   */
  getParticleEmitter(): ParticleEmitter {
    return this.particleEmitter;
  }
}
