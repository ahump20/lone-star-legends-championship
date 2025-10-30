/**
 * ParticleSystem - Efficient particle effects
 * Creates visual effects like explosions, trails, sparks, etc.
 */

import { Entity, Component, VelocityComponent, LifetimeComponent } from '../scene/Entity';
import { System } from '../scene/System';
import type { Scene } from '../scene/Scene';
import type { Color, Vector2 } from '../core/types';

export interface ParticleConfig {
  position: Vector2;
  velocity?: Vector2;
  velocityVariance?: number;
  color: Color;
  colorVariance?: number;
  size: number;
  sizeVariance?: number;
  lifetime: number;
  lifetimeVariance?: number;
  count: number;
  spread?: number; // angle spread in radians
  direction?: number; // base direction in radians
  gravity?: Vector2;
  fade?: boolean;
  shrink?: boolean;
}

class ParticleComponent extends Component {
  constructor(
    public color: Color,
    public size: number,
    public fade: boolean = true,
    public shrink: boolean = true,
    public initialSize: number = size,
    public initialAlpha: number = color.a
  ) {
    super();
  }

  update(deltaTime: number): void {
    if (!this.entity) return;

    const lifetime = this.entity.getComponent(LifetimeComponent);
    if (!lifetime) return;

    const progress = lifetime.elapsed / lifetime.duration;

    if (this.fade) {
      this.color.a = this.initialAlpha * (1 - progress);
    }

    if (this.shrink) {
      this.size = this.initialSize * (1 - progress);
    }
  }
}

export class ParticleEmitter {
  constructor(private scene: Scene) {}

  /**
   * Emit particles with the given configuration
   */
  emit(config: ParticleConfig): Entity[] {
    const particles: Entity[] = [];

    for (let i = 0; i < config.count; i++) {
      const particle = this.createParticle(config);
      particles.push(particle);
    }

    return particles;
  }

  private createParticle(config: ParticleConfig): Entity {
    // Randomize properties
    const lifetime = config.lifetime + (Math.random() * 2 - 1) * (config.lifetimeVariance || 0);
    const size = config.size + (Math.random() * 2 - 1) * (config.sizeVariance || 0);

    // Calculate velocity
    const spread = config.spread || Math.PI * 2;
    const baseDirection = config.direction || 0;
    const angle = baseDirection + (Math.random() - 0.5) * spread;

    const baseSpeed = config.velocity ?
      Math.sqrt(config.velocity.x ** 2 + config.velocity.y ** 2) : 100;
    const speedVariance = config.velocityVariance || 50;
    const speed = baseSpeed + (Math.random() * 2 - 1) * speedVariance;

    const velocity: Vector2 = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };

    // Randomize color
    const color = { ...config.color };
    if (config.colorVariance) {
      const variance = config.colorVariance;
      color.r = Math.max(0, Math.min(1, color.r + (Math.random() * 2 - 1) * variance));
      color.g = Math.max(0, Math.min(1, color.g + (Math.random() * 2 - 1) * variance));
      color.b = Math.max(0, Math.min(1, color.b + (Math.random() * 2 - 1) * variance));
    }

    // Create particle entity
    const particle = this.scene.createEntity('particle', {
      position: { ...config.position },
      scale: { x: size, y: size }
    });

    particle.addComponent(new ParticleComponent(color, size, config.fade, config.shrink));
    particle.addComponent(new VelocityComponent(velocity));
    particle.addComponent(new LifetimeComponent(lifetime));

    // Add gravity if specified
    if (config.gravity) {
      const gravityComponent = new VelocityComponent({ x: 0, y: 0 });
      // Gravity will be applied by a GravitySystem
    }

    return particle;
  }

  /**
   * Pre-configured effect: Explosion
   */
  explosion(position: Vector2, color: Color, options?: { intensity?: number }): Entity[] {
    const intensity = options?.intensity || 1;

    return this.emit({
      position,
      color,
      count: Math.floor(20 * intensity),
      size: 4,
      sizeVariance: 2,
      lifetime: 500,
      lifetimeVariance: 200,
      velocityVariance: 150 * intensity,
      colorVariance: 0.1,
      fade: true,
      shrink: true
    });
  }

  /**
   * Pre-configured effect: Trail
   */
  trail(position: Vector2, color: Color, direction: number): Entity[] {
    return this.emit({
      position,
      color,
      count: 3,
      size: 3,
      lifetime: 300,
      direction: direction + Math.PI, // Opposite direction
      spread: Math.PI / 4,
      velocityVariance: 30,
      fade: true,
      shrink: true
    });
  }

  /**
   * Pre-configured effect: Sparkle
   */
  sparkle(position: Vector2, color: Color): Entity[] {
    return this.emit({
      position,
      color,
      count: 5,
      size: 2,
      lifetime: 400,
      velocityVariance: 80,
      fade: true,
      shrink: false
    });
  }

  /**
   * Pre-configured effect: Dust cloud
   */
  dustCloud(position: Vector2, color: Color): Entity[] {
    return this.emit({
      position,
      color: { ...color, a: 0.3 },
      count: 15,
      size: 8,
      sizeVariance: 4,
      lifetime: 800,
      lifetimeVariance: 200,
      velocityVariance: 50,
      fade: true,
      shrink: false
    });
  }
}

/**
 * ParticleRenderSystem - Renders particles efficiently
 */
export class ParticleRenderSystem extends System {
  constructor(private renderer: any) {
    super();
  }

  protected shouldProcess(entity: Entity): boolean {
    return entity.hasComponent(ParticleComponent);
  }

  update(deltaTime: number, entities: Entity[]): void {
    if (!this.enabled) return;

    for (const entity of this.filter(entities)) {
      const particle = entity.getComponent(ParticleComponent)!;
      const size = particle.size;

      // Draw particle as a circle
      this.renderer.drawCircle(
        entity.transform.position,
        size,
        particle.color,
        { opacity: particle.color.a }
      );
    }
  }
}
