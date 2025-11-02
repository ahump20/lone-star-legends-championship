# Game Development Guide

This guide covers building, running, and developing both game implementations in the Lone Star Legends Championship project.

## Games Overview

We have **two baseball game implementations**:

1. **OG Remaster** (`apps/og-remaster/`) - Canvas 2D game with WebGL rendering
2. **Phaser Web Game** (`apps/games/phaser-bbp-web/`) - Phaser 3 game engine implementation
3. **Godot Native** (`apps/games/godot-bbp-native/`) - Future native desktop/mobile (placeholder)

## Quick Start

### OG Remaster (Existing Canvas Game)

```bash
# This game is already integrated into the main site
# Just serve the root and navigate to /apps/og-remaster/

# Using Python
python3 -m http.server 8000

# Then open: http://localhost:8000/apps/og-remaster/
```

### Phaser Web Game (New)

```bash
# Navigate to game directory
cd apps/games/phaser-bbp-web

# Serve locally
npx http-server . -p 8080

# Or use Python
python3 -m http.server 8080

# Then open: http://localhost:8080
```

### Building All Games

```bash
# From project root
npm run build:games

# This will:
# 1. Generate sprites for OG Remaster (if needed)
# 2. Copy Phaser game to public/games/bbp-web/
# 3. Prepare all games for deployment
```

## Development Workflow

### 1. Local Development

#### OG Remaster

```bash
# Watch mode (if using TypeScript compiler)
npx tsc --watch

# Serve and auto-reload
npx live-server apps/og-remaster/
```

#### Phaser Game

```bash
cd apps/games/phaser-bbp-web

# Serve with auto-reload
npx live-server .

# Or use Vite for faster reloads
npx vite
```

### 2. Making Changes

#### OG Remaster Architecture

```
apps/og-remaster/
├── main.ts                    # Entry point
├── graphics/
│   └── core/
│       └── BlazeRenderer.ts   # Main renderer
├── renderer/
│   └── BlazeGraphicsRenderer.ts  # Scene rendering
├── analytics/
│   └── BlazeAnalytics.ts      # Performance tracking
├── ui/                        # UI components
├── audio/                     # Audio engine
└── assets/
    └── sprites/               # Character sprites
```

**Key files to modify:**

- **Game mechanics:** `main.ts`, `packages/rules/gameState.ts`
- **Rendering:** `renderer/BlazeGraphicsRenderer.ts`
- **Performance:** `analytics/BlazeAnalytics.ts`
- **Mobile:** `index.html` (viewport, touch controls)

#### Phaser Game Architecture

```
apps/games/phaser-bbp-web/
├── index.html
├── src/
│   ├── config.js              # Game constants
│   ├── main.js                # Entry point
│   ├── scenes/
│   │   ├── BootScene.js       # Loading
│   │   ├── MenuScene.js       # Main menu
│   │   ├── GameScene.js       # Gameplay
│   │   └── UIScene.js         # Scoreboard
│   └── systems/
│       ├── BattingSystem.js
│       └── PitchingSystem.js
└── assets/                    # (Generated dynamically)
```

**Key files to modify:**

- **Game logic:** `src/scenes/GameScene.js`
- **Batting mechanics:** `src/systems/BattingSystem.js`
- **UI/menus:** `src/scenes/MenuScene.js`
- **Constants:** `src/config.js`

### 3. Testing Changes

#### Manual Testing Checklist

```bash
# Desktop browsers
✓ Chrome (latest)
✓ Firefox (latest)
✓ Safari (latest)
✓ Edge (latest)

# Mobile browsers (use DevTools device emulation or real devices)
✓ iOS Safari (iPhone 12+)
✓ Android Chrome (Pixel 5+)
✓ Samsung Internet

# Functionality
✓ Game loads without errors
✓ Touch controls work (mobile)
✓ Keyboard controls work (desktop)
✓ Score tracking accurate
✓ Game completes successfully
✓ Performance is smooth (60fps target)
```

#### Performance Testing

```bash
# Chrome DevTools
1. Open game in Chrome
2. F12 → Performance tab
3. Record 30 seconds of gameplay
4. Check:
   - FPS (should be stable 60fps)
   - Memory (no leaks)
   - Long tasks (<50ms for INP)

# Lighthouse
1. F12 → Lighthouse tab
2. Select "Mobile" mode
3. Run audit
4. Target scores:
   - Performance: >90
   - Accessibility: >95
```

#### Mobile Testing

```bash
# Using Chrome Remote Debugging
1. Enable USB debugging on Android device
2. Connect via USB
3. Chrome → chrome://inspect
4. Test on actual device

# Using iOS Simulator (macOS only)
1. Open Xcode
2. Window → Devices and Simulators
3. Launch iOS Simulator
4. Open Safari → Develop → Simulator
```

## Asset Management

### Adding New Sprites (OG Remaster)

```bash
# 1. Create sprite PNG (64x64 or appropriate size)
# 2. Add metadata JSON (see existing sprites for format)
# 3. Update sprite manifest

# Generate sprite sheets
npx tsx tools/sprites/generate.ts

# Sprites are in: apps/og-remaster/assets/sprites/
```

### Adding New Sprites (Phaser Game)

**Option 1: Programmatic (current approach)**

Edit `src/scenes/BootScene.js`:

```javascript
// Add new sprite generation
const newSpriteGraphics = this.add.graphics();
newSpriteGraphics.fillStyle(0xFF0000);  // Red
newSpriteGraphics.fillCircle(32, 32, 30);
newSpriteGraphics.generateTexture('new-sprite', 64, 64);
newSpriteGraphics.destroy();
```

**Option 2: Image files (for higher quality)**

```javascript
// In BootScene.preload()
this.load.image('new-sprite', 'assets/sprites/new-sprite.png');
```

**IMPORTANT:** See `/docs/ai-assets/prompts-and-guidelines.md` for safe, legal asset creation.

### Adding Sound Effects

```bash
# OG Remaster
# Sounds are synthesized in audio/AudioEngine.ts

# Phaser Game
# Add to BootScene.preload()
this.load.audio('hit-sound', 'assets/audio/bat-hit.mp3');

# Use in game
this.sound.play('hit-sound');
```

**Audio sources:**

- [Freesound.org](https://freesound.org/) (CC0 and CC-BY)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (synthesize your own)
- [Zapsplat](https://www.zapsplat.com/) (free with attribution)

**Always document in `/assets/LICENSES.md`!**

## Build Process

### OG Remaster Build

```bash
# From project root
npm run build:brand         # Build brand CSS
npm run validate            # Validate production readiness

# The build copies files to dist/ (configured in GitHub Actions)
```

### Phaser Game Build

```bash
cd apps/games/phaser-bbp-web

# Build (copy to public directory)
npm run build

# This copies everything to:
# /public/games/bbp-web/

# The game is then served at:
# https://your-domain.com/games/bbp-web/
```

### Full Build (All Games)

```bash
# From project root (to be added to package.json)
npm run build:games

# This script would:
# 1. Build OG Remaster
# 2. Build Phaser game
# 3. Copy to appropriate directories
# 4. Generate manifests
```

## Deployment

### Local Testing of Production Build

```bash
# Serve the public directory
npx http-server public/ -p 8000

# Test games:
# http://localhost:8000/og-remaster/     (if copied there)
# http://localhost:8000/games/bbp-web/
```

### Cloudflare Pages Deployment

The games are automatically deployed via GitHub Actions:

```yaml
# .github/workflows/og-remaster-deploy.yml

- name: Build games
  run: |
    # Generate sprites
    npx tsx tools/sprites/generate.ts

    # Copy Phaser game
    mkdir -p public/games
    cp -r apps/games/phaser-bbp-web public/games/bbp-web

- name: Deploy to Cloudflare Pages
  uses: cloudflare/pages-action@v1
  with:
    projectName: blaze-intelligence
    directory: public
```

### Manual Deployment

```bash
# Using Wrangler
npx wrangler pages deploy public --project-name=blaze-intelligence

# Or via Cloudflare dashboard:
# 1. Log into Cloudflare
# 2. Pages → blaze-intelligence
# 3. Create deployment
# 4. Upload public/ directory
```

## Integration with Main Site

### Adding Game Links

#### In OG Remaster (existing game)

Already integrated at `/apps/og-remaster/index.html`

#### In Main Site (if you have a home page)

```html
<!-- Add to navigation or home page -->
<nav>
  <a href="/og-remaster/">Original Game</a>
  <a href="/games/bbp-web/">Backyard Play (New)</a>
</nav>
```

### Creating a Games Landing Page

```bash
# Create public/games/index.html

<!DOCTYPE html>
<html>
<head>
  <title>Games - Blaze Intelligence</title>
</head>
<body>
  <h1>Choose Your Game</h1>

  <div class="game-card">
    <h2>OG Remaster Baseball</h2>
    <p>Full-featured baseball simulation</p>
    <a href="/og-remaster/">Play Now</a>
  </div>

  <div class="game-card">
    <h2>Backyard Play</h2>
    <p>Quick, fun baseball action</p>
    <a href="/games/bbp-web/">Play Now</a>
  </div>
</body>
</html>
```

### Embedding Games (iframe approach)

```html
<!-- For embedding in another page -->
<iframe
  src="/games/bbp-web/index.html"
  width="1024"
  height="768"
  frameborder="0"
  allow="fullscreen"
  loading="lazy">
</iframe>
```

## Performance Optimization

### OG Remaster Optimizations

#### 1. Canvas Scaling for Mobile

```typescript
// In main.ts or setup code
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const dpr = window.devicePixelRatio || 1;

canvas.width = 1024 * dpr;
canvas.height = 768 * dpr;
canvas.style.width = '1024px';
canvas.style.height = '768px';

const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);
```

#### 2. Lazy Load Heavy Components

```typescript
// Instead of importing everything upfront
// import { HeavyFeature } from './heavy';

// Load on demand
async function loadHeavyFeature() {
  const { HeavyFeature } = await import('./heavy');
  return new HeavyFeature();
}
```

#### 3. Optimize Analytics

```typescript
// In BlazeAnalytics.ts

// Pause analytics when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    this.pauseTracking();
  } else {
    this.resumeTracking();
  }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  this.stopTracking();
  this.flushEvents();
});
```

### Phaser Game Optimizations

#### 1. Use Sprite Batching

Phaser does this automatically, but ensure:

```javascript
// Group similar sprites
const batterGroup = this.add.group();
batterGroup.createMultiple({
  key: 'batter',
  repeat: 10
});
```

#### 2. Object Pooling

```javascript
// Reuse objects instead of creating new ones
class BallPool {
  constructor(scene) {
    this.balls = scene.add.group({
      classType: Ball,
      maxSize: 10,
      runChildUpdate: true
    });
  }

  spawn(x, y) {
    const ball = this.balls.get(x, y);
    if (ball) ball.setActive(true).setVisible(true);
    return ball;
  }

  despawn(ball) {
    this.balls.killAndHide(ball);
  }
}
```

#### 3. Texture Atlases (for multiple sprites)

```javascript
// Pack sprites into atlas for faster loading
// Use TexturePacker or similar tool

this.load.atlas('game-sprites',
  'assets/sprites.png',
  'assets/sprites.json'
);

// Use:
this.add.sprite(x, y, 'game-sprites', 'batter');
```

## Troubleshooting

### Common Issues

#### Game Won't Load

```
Problem: Blank screen, console errors
Solutions:
1. Check browser console (F12)
2. Ensure served via HTTP (not file://)
3. Check for CORS issues
4. Verify asset paths are correct
```

#### Poor Performance

```
Problem: Low FPS, laggy
Solutions:
1. Check GPU utilization (may be throttled)
2. Reduce particle effects
3. Lower canvas resolution
4. Disable debug mode
5. Profile with Chrome DevTools
```

#### Touch Controls Not Working

```
Problem: Can't tap buttons on mobile
Solutions:
1. Ensure touch-action: none in CSS
2. Check button hitbox sizes (>=48px)
3. Verify event listeners are attached
4. Test on actual device (not just emulator)
```

#### Assets Not Found (404)

```
Problem: Sprites/sounds fail to load
Solutions:
1. Check file paths (case-sensitive on Linux)
2. Verify assets are in correct directory
3. Check build script copied assets
4. Inspect Network tab in DevTools
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# Add to .github/workflows/og-remaster-deploy.yml

- name: Build and test games
  run: |
    # Install dependencies
    npm ci

    # Generate OG Remaster sprites
    npx tsx tools/sprites/generate.ts

    # Build Phaser game
    cd apps/games/phaser-bbp-web
    npm run build
    cd ../../..

    # Run tests
    npm test

    # Performance audit
    npm run audit:performance

- name: Deploy
  uses: cloudflare/pages-action@v1
  with:
    directory: dist
```

### Pre-commit Hooks

```bash
# .husky/pre-commit

#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for IP violations
node .github/scripts/check-ip-terms.js

# Run linter
npm run lint

# Check bundle size
npm run size-check
```

## Resources

### Phaser 3 Documentation

- [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)
- [Phaser Examples](https://phaser.io/examples)
- [Phaser Community](https://phaser.discourse.group/)

### Canvas 2D / WebGL

- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [WebGL Fundamentals](https://webglfundamentals.org/)

### Performance

- [Web.dev Performance](https://web.dev/performance/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## Support

- **Issues:** [GitHub Issues](https://github.com/ahump20/lone-star-legends-championship/issues)
- **Discussions:** [GitHub Discussions](https://github.com/ahump20/lone-star-legends-championship/discussions)

---

**Last Updated:** 2025-11-02
**Next Review:** 2025-12-01
