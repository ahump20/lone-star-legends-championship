# Blaze Graphics Engine - Architecture

## Overview

The Blaze Graphics Engine is a sophisticated yet elegantly simple 2D graphics engine designed for high-performance game development. It follows a layered architecture that allows developers to work at different complexity levels while maintaining consistent performance.

## Design Principles

### 1. Progressive Complexity
- **Simple API** for common use cases (90% of scenarios)
- **Component Composition** for custom behaviors
- **Full Control** for advanced optimizations

### 2. Performance First
- Automatic WebGL batching
- Texture atlasing
- Off-screen culling
- Efficient memory management

### 3. Developer Experience
- Type-safe TypeScript API
- Integrates with existing CSS themes
- Comprehensive documentation
- Clear examples

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│           User-Facing API (BlazeGame)       │
│   Simple, elegant, handles 90% of use cases │
└─────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────┐
│         High-Level Systems                   │
│  Effects │ Particles │ Animation │ Physics  │
└─────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────┐
│    Entity-Component-System (ECS)             │
│  Flexible game object architecture           │
└─────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────┐
│         Renderer Abstraction                 │
│  Unified API across backends                 │
└─────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────┐
│    Multi-Backend Implementation              │
│  WebGL2 → WebGL → Canvas2D (fallback)       │
└─────────────────────────────────────────────┘
```

## Core Components

### 1. BlazeRenderer (`core/BlazeRenderer.ts`)

Multi-backend rendering engine that automatically selects the best available graphics API.

**Features:**
- Auto-detection: WebGL2 → WebGL → Canvas2D
- Unified API across all backends
- Automatic sprite batching (WebGL)
- GPU texture caching

**Backend Selection:**
```typescript
detectBackend() {
  try WebGL2
  catch try WebGL
  catch fallback Canvas2D
}
```

### 2. Scene & ECS (`scene/`)

Entity-Component-System architecture for flexible game object composition.

**Components:**
- `Entity`: Container for components
- `Component`: Pure data (no behavior)
- `System`: Logic that operates on components

**Built-in Components:**
- `SpriteComponent`: Visual representation
- `AnimationComponent`: Frame-based animation
- `VelocityComponent`: Movement
- `LifetimeComponent`: Auto-destroy after duration

**Built-in Systems:**
- `RenderSystem`: Draws sprites
- `AnimationSystem`: Updates animations
- `PhysicsSystem`: Applies velocity
- `LifetimeSystem`: Removes expired entities

### 3. Asset Loading (`assets/`)

Integrates with existing sprite manifest system.

**Features:**
- Async texture loading
- Sprite atlas management
- Animation data parsing
- Asset caching

**Compatible with existing format:**
```json
{
  "characters": [
    {
      "id": "ace",
      "spriteSheet": "ace.png",
      "sprites": [...]
    }
  ]
}
```

### 4. Theme System (`materials/ThemeManager.ts`)

Bridges CSS design tokens with GPU rendering.

**Features:**
- Parses CSS custom properties
- Converts colors to GPU format
- Color manipulation utilities
- Consistent theming across UI and game

### 5. Effects Library (`effects/`)

Pre-built visual effects for common game scenarios.

**Particle System:**
- Emitter-based particle generation
- Configurable properties (velocity, lifetime, color)
- Pre-built effects (explosion, trail, sparkle)

**Effect Components:**
- `GlowComponent`: Pulsing glow
- `TrailComponent`: Motion trail
- `FlashComponent`: Temporary flash

**Pre-configured Effects:**
- Hit impact
- Home run celebration
- Slide dust cloud
- Strikeout sparkle
- Power-up spiral

### 6. BlazeGame API (`BlazeGame.ts`)

Main entry point with simple, elegant API.

**Responsibilities:**
- Initialization
- Asset loading
- Game loop management
- Scene management
- Easy access to all subsystems

## Data Flow

```
User Input → BlazeGame → Scene → Systems → Entities
                                                │
                                                ↓
Assets ←─────────────────────── RenderSystem → Renderer
                                                │
                                                ↓
Theme ←─────────────────────────── Effects → Particles
                                                │
                                                ↓
                                           GPU/Canvas
```

## Performance Optimizations

### WebGL Batching
- Groups sprites by texture
- Single draw call per texture
- Reduces CPU-GPU communication

### Automatic Culling
- Off-screen entities not processed
- Bounds checking before render

### Texture Atlasing
- Multiple sprites in single texture
- Reduces texture swaps
- Better GPU cache utilization

### Progressive Enhancement
```
High-end: WebGL2 + Shaders + Particles + Post-FX
Mid-range: WebGL + Sprites + Basic particles
Low-end: Canvas2D + Essential visuals only
```

## Integration Strategy

### Phase 1: Parallel Development
- New engine runs alongside existing renderer
- No breaking changes
- Gradual feature migration

### Phase 2: Feature Parity
- All existing features implemented
- Performance comparison
- A/B testing

### Phase 3: Transition
- Switch to new engine as default
- Keep old renderer as fallback
- Monitor performance

### Phase 4: Enhancement
- Add new features not possible before
- Advanced effects
- Better performance

## Memory Management

### Texture Lifecycle
```
Load → Cache → Use → (Unused for X time) → Unload
```

### Entity Lifecycle
```
Create → Add Components → Update Loop → Remove → Destroy
```

### Particle Pool
- Reuse particle entities
- Avoid allocation during gameplay
- Fixed memory footprint

## Extension Points

### Custom Components
```typescript
class CustomComponent extends Component {
  // Your data
  update(deltaTime: number) {
    // Your logic
  }
}
```

### Custom Systems
```typescript
class CustomSystem extends System {
  shouldProcess(entity: Entity) {
    // Your filter
  }

  update(deltaTime: number, entities: Entity[]) {
    // Your logic
  }
}
```

### Custom Effects
```typescript
const emitter = game.effects.getParticleEmitter();
emitter.emit({
  // Your config
});
```

## Testing Strategy

### Unit Tests
- Component logic
- System updates
- Color manipulation
- Asset loading

### Integration Tests
- Renderer backends
- Scene updates
- Effect triggering
- Memory management

### Performance Tests
- Batching efficiency
- Frame timing
- Memory usage
- Texture swaps

## Future Enhancements

### Near-term
- Shader support for custom effects
- Post-processing pipeline
- Improved particle pooling
- Animation blending

### Mid-term
- 3D sprite support
- Advanced lighting
- Physics integration
- Better culling (spatial hash)

### Long-term
- WebGPU backend
- Ray-traced lighting
- Advanced particle simulations
- Level editor integration

## File Structure

```
graphics/
├── core/
│   ├── types.ts              # Type definitions
│   └── BlazeRenderer.ts      # Multi-backend renderer
├── scene/
│   ├── Entity.ts             # Entity & Components
│   ├── System.ts             # System base & built-ins
│   └── Scene.ts              # Scene management
├── assets/
│   ├── AssetLoader.ts        # Asset loading
│   └── SpriteAtlas.ts        # Texture atlas
├── materials/
│   └── ThemeManager.ts       # CSS theme integration
├── effects/
│   ├── ParticleSystem.ts     # Particle emitter
│   └── EffectsLibrary.ts     # Pre-built effects
├── examples/
│   ├── basic-example.ts
│   ├── particle-showcase.ts
│   ├── advanced-ecs.ts
│   └── integration-with-existing.ts
├── BlazeGame.ts              # Main API
├── index.ts                  # Exports
├── README.md                 # User documentation
└── ARCHITECTURE.md           # This file
```

## Conclusion

The Blaze Graphics Engine provides a sophisticated rendering system with an elegantly simple API. Its layered architecture allows developers to work at the complexity level that suits their needs while maintaining consistent performance across devices.

The engine is designed for gradual adoption, allowing it to coexist with existing systems and be integrated incrementally without disrupting current development.
