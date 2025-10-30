/**
 * Scene - Container for entities and systems
 * Manages the game world and updates all entities/systems
 */

import { Entity } from './Entity';
import { System, RenderSystem, AnimationSystem, PhysicsSystem, LifetimeSystem } from './System';
import type { BlazeRenderer } from '../core/BlazeRenderer';
import type { Camera } from '../core/types';

export class Scene {
  public name: string;
  public active: boolean = true;

  private entities: Entity[] = [];
  private entityMap: Map<number, Entity> = new Map();
  private systems: System[] = [];

  public camera: Camera = {
    position: { x: 0, y: 0 },
    zoom: 1,
    rotation: 0
  };

  constructor(name: string, renderer?: BlazeRenderer) {
    this.name = name;

    // Add default systems
    if (renderer) {
      this.addSystem(new AnimationSystem());
      this.addSystem(new PhysicsSystem());
      this.addSystem(new LifetimeSystem());
      this.addSystem(new RenderSystem(renderer));
    }
  }

  // Entity management
  createEntity(name?: string, transform?: any): Entity {
    const entity = new Entity(name, transform);
    this.entities.push(entity);
    this.entityMap.set(entity.id, entity);
    return entity;
  }

  addEntity(entity: Entity): void {
    if (!this.entityMap.has(entity.id)) {
      this.entities.push(entity);
      this.entityMap.set(entity.id, entity);
    }
  }

  removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
      this.entityMap.delete(entity.id);
      entity.destroy();
    }
  }

  getEntity(id: number): Entity | undefined {
    return this.entityMap.get(id);
  }

  findEntitiesByTag(tag: string): Entity[] {
    return this.entities.filter(e => e.hasTag(tag));
  }

  findEntityByName(name: string): Entity | undefined {
    return this.entities.find(e => e.name === name);
  }

  // System management
  addSystem(system: System): void {
    this.systems.push(system);
  }

  getSystem<T extends System>(systemClass: new (...args: any[]) => T): T | undefined {
    return this.systems.find(s => s instanceof systemClass) as T;
  }

  // Lifecycle
  update(deltaTime: number): void {
    if (!this.active) return;

    // Update all systems
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(deltaTime, this.entities);
      }
    }

    // Remove dead entities (from LifetimeSystem)
    const lifetimeSystem = this.getSystem(LifetimeSystem);
    if (lifetimeSystem) {
      const toRemove = lifetimeSystem.getEntitiesToRemove();
      for (const id of toRemove) {
        const entity = this.getEntity(id);
        if (entity) {
          this.removeEntity(entity);
        }
      }
    }
  }

  clear(): void {
    for (const entity of this.entities) {
      entity.destroy();
    }
    this.entities = [];
    this.entityMap.clear();
  }

  // Helper methods for common operations
  setCamera(x: number, y: number, zoom?: number): void {
    this.camera.position.x = x;
    this.camera.position.y = y;
    if (zoom !== undefined) {
      this.camera.zoom = zoom;
    }
  }

  getRenderSystem(): RenderSystem | undefined {
    return this.getSystem(RenderSystem);
  }

  // Statistics
  get entityCount(): number {
    return this.entities.length;
  }

  get activeEntityCount(): number {
    return this.entities.filter(e => e.active).length;
  }
}
