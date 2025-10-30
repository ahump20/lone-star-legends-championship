# Blaze Graphics Engine

A sophisticated yet elegantly simple graphics engine for creating beautiful 2D games.

## Features

- **Multi-Backend Rendering**: Automatically selects WebGL2, WebGL, or Canvas2D based on browser support
- **Entity-Component-System**: Flexible, performant game architecture
- **Sprite System**: Integrates seamlessly with existing sprite manifests
- **Theme-Driven**: Uses CSS design tokens for consistent styling
- **Built-in Effects**: Particles, trails, glows, and more
- **Simple API**: Create complex visuals with minimal code

## Quick Start

### Basic Setup

```typescript
import { createGame } from '@/graphics';

// Create a game instance
const game = createGame('#gameCanvas', {
  autoResize: true,
  antialias: true
});

// Load assets
await game.load('/assets/sprites/manifest.json');

// Start the game loop
game.start();
```

### Creating Characters

```typescript
// Simple character creation
const player = game.createCharacter('ace', {
  position: { x: 400, y: 300 },
  animation: 'batting',
  scale: 2
});

// The engine automatically:
// - Loads the sprite sheet
// - Sets up animations
// - Handles rendering
```

### Adding Effects

```typescript
// Hit effect with particles
game.effects.hitImpact(
  { x: 500, y: 400 },
  game.theme.getColor('primary')
);

// Add glow to entity
game.effects.addGlow(player, { r: 1, g: 0.42, b: 0.21, a: 1 }, 1.5, true);

// Add trail effect
game.effects.addTrail(player, { r: 1, g: 0.9, b: 0.43, a: 1 });

// Home run celebration
game.effects.homeRun({ x: 512, y: 384 });
```

## Architecture Levels

### Level 1: Simple API (Recommended for most use cases)

```typescript
// Create and animate with one line
const batter = game.createCharacter('ace', {
  position: { x: 400, y: 300 },
  animation: 'batting'
});

// Pre-built effects
game.effects.hitImpact(position, color);
game.effects.homeRun(position);
```

### Level 2: Component Composition

```typescript
// Manual entity creation with custom components
const entity = game.scene.createEntity('custom', {
  position: { x: 100, y: 100 }
});

entity.addComponent(new SpriteComponent('ace', 0));
entity.addComponent(new AnimationComponent(animations));
entity.addComponent(new VelocityComponent({ x: 50, y: 0 }));

// Add effects
game.effects.addGlow(entity, color);
game.effects.addTrail(entity, color);
```

### Level 3: Full Control

```typescript
// Custom systems
class CustomSystem extends System {
  protected shouldProcess(entity: Entity): boolean {
    return entity.hasTag('custom');
  }

  update(deltaTime: number, entities: Entity[]): void {
    for (const entity of this.filter(entities)) {
      // Custom logic
    }
  }
}

game.scene.addSystem(new CustomSystem());

// Direct renderer access
game.renderer.drawSprite(texture, frame, transform, options);
```

## Theme Integration

The engine automatically reads your CSS design tokens:

```typescript
// Use theme colors in effects
const primaryColor = game.theme.getColor('primary');
const accentColor = game.theme.getColor('accent');

// Color manipulation
const lightColor = game.theme.lighten(primaryColor, 0.2);
const darkColor = game.theme.darken(primaryColor, 0.2);
const mixedColor = game.theme.mix(primaryColor, accentColor, 0.5);
```

## Camera Control

```typescript
// Set camera position and zoom
game.scene.setCamera(x, y, zoom);

// Access camera directly
game.scene.camera.position.x = 512;
game.scene.camera.position.y = 384;
game.scene.camera.zoom = 1.5;
```

## Performance

The engine includes automatic optimizations:

- **Automatic Batching**: Sprites with the same texture are batched together
- **Culling**: Off-screen objects are not rendered
- **Texture Atlas**: Sprites are packed into single GPU texture
- **Progressive Enhancement**: Falls back to Canvas2D on older devices

## Custom Particles

```typescript
// Get particle emitter for custom effects
const emitter = game.effects.getParticleEmitter();

emitter.emit({
  position: { x: 100, y: 100 },
  color: { r: 1, g: 0, b: 0, a: 1 },
  count: 50,
  size: 4,
  sizeVariance: 2,
  lifetime: 1000,
  lifetimeVariance: 200,
  velocityVariance: 100,
  spread: Math.PI * 2,
  fade: true,
  shrink: true
});
```

## Animation Control

```typescript
// Play animation
const animComponent = entity.getComponent(AnimationComponent);
animComponent.play('batting', true); // loop

// Stop animation
animComponent.stop();

// Reset to first frame
animComponent.reset();
```

## Scene Management

```typescript
// Entity management
const entity = game.scene.createEntity('name');
game.scene.addEntity(entity);
game.scene.removeEntity(entity);

// Find entities
const entity = game.scene.findEntityByName('player');
const entities = game.scene.findEntitiesByTag('enemy');

// Clear all entities
game.scene.clear();

// Stats
console.log(`Total entities: ${game.scene.entityCount}`);
console.log(`Active entities: ${game.scene.activeEntityCount}`);
```

## Asset Loading

```typescript
// Load sprite manifest (your existing format)
await game.assets.loadSpriteManifest('/assets/sprites/manifest.json');

// Load individual texture
await game.assets.loadTexture('custom', '/path/to/image.png');

// Get loaded assets
const texture = game.assets.getTexture('ace');
const frames = game.assets.getSpriteFrames('ace');
const animations = game.assets.getAnimations('ace');
```

## Debugging

```typescript
// Get engine stats
const stats = game.getStats();
console.log(`Backend: ${stats.backend}`);
console.log(`Entities: ${stats.entityCount}`);
console.log(`FPS: ${stats.fps}`);

// Check what's loaded
console.log('Renderer backend:', game.renderer.backend);
console.log('Scene entities:', game.scene.entityCount);
```

## Cleanup

```typescript
// Properly cleanup when done
game.destroy();
```

## Integration with Existing Code

The engine is designed to work alongside your existing renderer:

```typescript
// Use new graphics engine
import { createGame } from '@/graphics';
const game = createGame('#gameCanvas');

// Keep using existing CanvasRenderer for compatibility
import { CanvasRenderer } from '@/renderer/CanvasRenderer';
const oldRenderer = new CanvasRenderer(canvas);

// Gradually migrate systems to new engine
```

## Examples

See `/examples` directory for:
- Basic setup
- Character animation
- Particle effects
- Custom systems
- Theme integration
