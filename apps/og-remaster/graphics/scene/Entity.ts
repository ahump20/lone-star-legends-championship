/**
 * Entity-Component-System (ECS) Implementation
 *
 * Entities are containers for components
 * Components are pure data (no behavior)
 * Systems operate on entities with specific components
 */

import type { Transform, Vector2 } from '../core/types';

let entityIdCounter = 0;

export class Entity {
  public readonly id: number;
  public name: string;
  public active: boolean = true;
  public transform: Transform;

  private components: Map<string, Component> = new Map();
  private tags: Set<string> = new Set();

  constructor(name: string = 'Entity', transform?: Partial<Transform>) {
    this.id = entityIdCounter++;
    this.name = name;
    this.transform = {
      position: transform?.position || { x: 0, y: 0 },
      rotation: transform?.rotation || 0,
      scale: transform?.scale || { x: 1, y: 1 }
    };
  }

  // Component management
  addComponent<T extends Component>(component: T): this {
    const type = component.constructor.name;
    this.components.set(type, component);
    component.entity = this;
    component.onAdd?.();
    return this;
  }

  getComponent<T extends Component>(componentClass: new (...args: any[]) => T): T | undefined {
    return this.components.get(componentClass.name) as T;
  }

  hasComponent<T extends Component>(componentClass: new (...args: any[]) => T): boolean {
    return this.components.has(componentClass.name);
  }

  removeComponent<T extends Component>(componentClass: new (...args: any[]) => T): boolean {
    const type = componentClass.name;
    const component = this.components.get(type);
    if (component) {
      component.onRemove?.();
      return this.components.delete(type);
    }
    return false;
  }

  // Tag management
  addTag(tag: string): this {
    this.tags.add(tag);
    return this;
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  removeTag(tag: string): boolean {
    return this.tags.delete(tag);
  }

  // Lifecycle
  update(deltaTime: number): void {
    for (const component of this.components.values()) {
      component.update?.(deltaTime);
    }
  }

  destroy(): void {
    for (const component of this.components.values()) {
      component.onRemove?.();
    }
    this.components.clear();
  }
}

/**
 * Base Component class
 * All components should extend this
 */
export abstract class Component {
  public entity?: Entity;

  onAdd?(): void;
  onRemove?(): void;
  update?(deltaTime: number): void;
}

/**
 * Common built-in components
 */

export class SpriteComponent extends Component {
  constructor(
    public textureId: string,
    public frameIndex: number = 0,
    public tint?: { r: number; g: number; b: number; a: number },
    public opacity: number = 1
  ) {
    super();
  }
}

export class AnimationComponent extends Component {
  public currentAnimation: string = '';
  public currentFrame: number = 0;
  public timeAccumulator: number = 0;
  public playing: boolean = false;
  public loop: boolean = true;

  constructor(
    public animations: Map<string, { frames: number[]; fps: number; loop?: boolean }> = new Map()
  ) {
    super();
  }

  play(name: string, loop: boolean = true): void {
    if (this.currentAnimation !== name) {
      this.currentAnimation = name;
      this.currentFrame = 0;
      this.timeAccumulator = 0;
    }
    this.playing = true;
    this.loop = loop;
  }

  stop(): void {
    this.playing = false;
  }

  reset(): void {
    this.currentFrame = 0;
    this.timeAccumulator = 0;
  }

  update(deltaTime: number): void {
    if (!this.playing) return;

    const animation = this.animations.get(this.currentAnimation);
    if (!animation) return;

    this.timeAccumulator += deltaTime;
    const frameDuration = 1000 / animation.fps;

    while (this.timeAccumulator >= frameDuration) {
      this.timeAccumulator -= frameDuration;
      this.currentFrame++;

      if (this.currentFrame >= animation.frames.length) {
        if (this.loop || animation.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = animation.frames.length - 1;
          this.playing = false;
        }
      }
    }

    // Update sprite component
    const sprite = this.entity?.getComponent(SpriteComponent);
    if (sprite && animation) {
      sprite.frameIndex = animation.frames[this.currentFrame];
    }
  }
}

export class VelocityComponent extends Component {
  constructor(
    public velocity: Vector2 = { x: 0, y: 0 },
    public angularVelocity: number = 0
  ) {
    super();
  }
}

export class LifetimeComponent extends Component {
  public elapsed: number = 0;

  constructor(public duration: number) {
    super();
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;
  }

  get isDead(): boolean {
    return this.elapsed >= this.duration;
  }
}
