/**
 * System - Base class for all systems in the ECS
 * Systems contain logic that operates on entities with specific components
 */

import type { Entity } from './Entity';
import type { BlazeRenderer } from '../core/BlazeRenderer';

export abstract class System {
  public enabled: boolean = true;

  /**
   * Called once per frame to update all relevant entities
   */
  abstract update(deltaTime: number, entities: Entity[]): void;

  /**
   * Filter entities that this system should process
   */
  protected filter(entities: Entity[]): Entity[] {
    return entities.filter(e => e.active && this.shouldProcess(e));
  }

  /**
   * Override this to define which entities this system processes
   */
  protected abstract shouldProcess(entity: Entity): boolean;
}

/**
 * RenderSystem - Renders all entities with sprite components
 */
import { SpriteComponent, AnimationComponent } from './Entity';
import type { Texture, SpriteFrame } from '../core/types';

export class RenderSystem extends System {
  private textures: Map<string, { texture: Texture; frames: SpriteFrame[] }> = new Map();

  constructor(private renderer: BlazeRenderer) {
    super();
  }

  registerTexture(id: string, texture: Texture, frames: SpriteFrame[]): void {
    this.textures.set(id, { texture, frames });
  }

  protected shouldProcess(entity: Entity): boolean {
    return entity.hasComponent(SpriteComponent);
  }

  update(deltaTime: number, entities: Entity[]): void {
    if (!this.enabled) return;

    this.renderer.beginBatch();

    for (const entity of this.filter(entities)) {
      const sprite = entity.getComponent(SpriteComponent)!;
      const textureData = this.textures.get(sprite.textureId);

      if (!textureData) {
        console.warn(`Texture not found: ${sprite.textureId}`);
        continue;
      }

      const frame = textureData.frames[sprite.frameIndex] || textureData.frames[0];

      this.renderer.drawSprite(
        textureData.texture,
        frame,
        entity.transform,
        {
          opacity: sprite.opacity,
          tint: sprite.tint
        }
      );
    }

    this.renderer.endBatch();
  }
}

/**
 * AnimationSystem - Updates animation components
 */
export class AnimationSystem extends System {
  protected shouldProcess(entity: Entity): boolean {
    return entity.hasComponent(AnimationComponent);
  }

  update(deltaTime: number, entities: Entity[]): void {
    if (!this.enabled) return;

    for (const entity of this.filter(entities)) {
      const animation = entity.getComponent(AnimationComponent)!;
      animation.update(deltaTime);
    }
  }
}

/**
 * PhysicsSystem - Updates entity positions based on velocity
 */
import { VelocityComponent } from './Entity';

export class PhysicsSystem extends System {
  protected shouldProcess(entity: Entity): boolean {
    return entity.hasComponent(VelocityComponent);
  }

  update(deltaTime: number, entities: Entity[]): void {
    if (!this.enabled) return;

    const dt = deltaTime / 1000; // Convert to seconds

    for (const entity of this.filter(entities)) {
      const velocity = entity.getComponent(VelocityComponent)!;

      entity.transform.position.x += velocity.velocity.x * dt;
      entity.transform.position.y += velocity.velocity.y * dt;
      entity.transform.rotation += velocity.angularVelocity * dt;
    }
  }
}

/**
 * LifetimeSystem - Removes entities that have expired
 */
import { LifetimeComponent } from './Entity';

export class LifetimeSystem extends System {
  private entitiesToRemove: Set<number> = new Set();

  protected shouldProcess(entity: Entity): boolean {
    return entity.hasComponent(LifetimeComponent);
  }

  update(deltaTime: number, entities: Entity[]): void {
    if (!this.enabled) return;

    this.entitiesToRemove.clear();

    for (const entity of this.filter(entities)) {
      const lifetime = entity.getComponent(LifetimeComponent)!;
      lifetime.update(deltaTime);

      if (lifetime.isDead) {
        this.entitiesToRemove.add(entity.id);
      }
    }
  }

  getEntitiesToRemove(): Set<number> {
    return this.entitiesToRemove;
  }
}
