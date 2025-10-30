/**
 * Blaze Graphics Engine
 * Main export file
 */

// Core
export { BlazeRenderer } from './core/BlazeRenderer';
export type { IRenderer, RendererConfig } from './core/BlazeRenderer';
export type {
  RenderBackend,
  Quality,
  Vector2,
  Vector3,
  Transform,
  Bounds,
  Color,
  RenderOptions,
  BlendMode,
  Texture,
  SpriteFrame,
  Animation,
  Camera
} from './core/types';

// Scene & ECS
export { Entity, Component, SpriteComponent, AnimationComponent, VelocityComponent, LifetimeComponent } from './scene/Entity';
export { System, RenderSystem, AnimationSystem, PhysicsSystem, LifetimeSystem } from './scene/System';
export { Scene } from './scene/Scene';

// Assets
export { AssetLoader } from './assets/AssetLoader';
export type { SpriteManifest, CharacterSprite, SpriteFrameData } from './assets/AssetLoader';
export { SpriteAtlas } from './assets/SpriteAtlas';
export type { AtlasFrame } from './assets/SpriteAtlas';

// Materials
export { ThemeManager } from './materials/ThemeManager';
export type { ThemeColors, ThemeConfig } from './materials/ThemeManager';

// Effects
export { ParticleEmitter, ParticleRenderSystem } from './effects/ParticleSystem';
export type { ParticleConfig } from './effects/ParticleSystem';
export { EffectsLibrary, GlowComponent, TrailComponent, FlashComponent } from './effects/EffectsLibrary';

// Main API
export { BlazeGame, createGame } from './BlazeGame';
export type { BlazeGameConfig } from './BlazeGame';
