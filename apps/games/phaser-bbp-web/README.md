# Backyard Play - Original Baseball Game

An original, kid-friendly baseball game built with Phaser 3. **No IP infringement** - all assets and content are original.

## Quick Start

### Development

```bash
# Serve locally (any HTTP server)
npx http-server . -p 8080

# Or use Python
python3 -m http.server 8080

# Then open http://localhost:8080
```

### Build for Production

```bash
# Copy to public directory for deployment
cp -r . ../../../public/games/bbp-web/
```

## Game Features

- ⚾ **3-Inning Baseball Game** - Quick, fun gameplay
- 🎯 **Timing-Based Batting** - Perfect timing = home run!
- 📱 **Mobile-Friendly** - Touch controls for smartphones
- 🎨 **Original Assets** - All sprites generated programmatically
- 🆓 **Free & Open Source** - MIT License

## Controls

- **Desktop:** Press SPACEBAR to swing
- **Mobile:** Tap the SWING button

## Gameplay

1. Watch the pitcher wind up and throw
2. Time your swing perfectly when the ball reaches the plate
3. Score more runs than the CPU in 3 innings to win!

### Timing Guide

- **Perfect** (±50ms): Home run! 2 runs scored
- **Good** (±100ms): Base hit, 1 run scored
- **OK** (±150ms): Weak hit, out recorded
- **Miss** (>150ms): Strike!

## Project Structure

```
phaser-bbp-web/
├── index.html              # Main game page
├── src/
│   ├── config.js          # Game configuration
│   ├── main.js            # Entry point
│   ├── scenes/
│   │   ├── BootScene.js   # Asset loading
│   │   ├── MenuScene.js   # Main menu
│   │   ├── GameScene.js   # Core gameplay
│   │   └── UIScene.js     # Scoreboard overlay
│   └── systems/
│       ├── BattingSystem.js   # Batting logic
│       └── PitchingSystem.js  # Pitching logic
├── assets/
│   ├── sprites/           # (Generated programmatically)
│   ├── audio/             # Sound effects (optional)
│   └── backgrounds/       # Field graphics (generated)
└── dist/                  # Build output
```

## Technology

- **Phaser 3.85.2** - Game engine (MIT License)
- **HTML5 Canvas** - Rendering
- **Arcade Physics** - Ball physics
- **Responsive Scaling** - Works on all screen sizes

## Legal Compliance

### Original Content

This game is **100% original** and does **NOT** use:

- ❌ Backyard Baseball assets, characters, or names
- ❌ Real athlete likenesses or names
- ❌ MLB, NCAA, or other league trademarks
- ❌ Copyrighted music or sound effects

### What We Use

- ✅ Procedurally generated sprites (simple shapes)
- ✅ Generic baseball mechanics
- ✅ Original color palette (orange/teal)
- ✅ Open-source libraries (Phaser - MIT)

See `/LEGAL_COMPLIANCE.md` for full details.

## Asset Generation

All sprites are generated programmatically in `BootScene.js`:

- **Batter:** Orange stick figure with bat
- **Pitcher:** Teal stick figure
- **Ball:** White circle with red stitching
- **Field:** Green grass + brown diamond

To replace with custom sprites:

1. Create PNG files in `/assets/sprites/`
2. Update `BootScene.js` preload section:

```javascript
this.load.image('batter', 'assets/sprites/batter.png');
this.load.image('pitcher', 'assets/sprites/pitcher.png');
this.load.image('ball', 'assets/sprites/ball.png');
```

3. Comment out or remove `generateSprites()` call

See `/docs/ai-assets/prompts-and-guidelines.md` for safe asset generation.

## Performance

### Optimizations

- Sprite batching via Phaser renderer
- Minimal DOM manipulation
- Efficient physics (Arcade, not Matter.js)
- Responsive scaling (FIT mode)
- Lazy-loaded via iframe on main site

### Lighthouse Scores (Target)

- Performance: >90
- Accessibility: >95
- Best Practices: >90

### Mobile Performance

- LCP: <2.5s
- FID/INP: <100ms
- CLS: <0.1

## Future Enhancements

### Planned Features

- [ ] Multiple difficulty levels
- [ ] Different stadiums/environments
- [ ] Power-ups and special pitches
- [ ] Multiplayer mode
- [ ] Achievements and stats tracking
- [ ] Sound effects and music (original)
- [ ] Better AI pitcher strategy
- [ ] Base running mechanics

### Asset Upgrades

- [ ] Replace placeholder sprites with AI-generated art
- [ ] Add character animations (wind-up, swing, etc.)
- [ ] Stadium crowd animations
- [ ] Particle effects (dust clouds, hit sparks)
- [ ] Weather effects (day/night, rain)

## Development Guidelines

### Adding New Features

1. **Check legal compliance** before adding any assets
2. **Document in LICENSES.md** with source and license
3. **Test on mobile** (Chrome DevTools device emulation)
4. **Keep bundle size small** (<500KB total)

### Code Style

- ES6+ JavaScript (no TypeScript in this project)
- Phaser 3 class-based scenes
- Clear comments for complex logic
- Follow existing naming conventions

### Testing Checklist

- [ ] Works on desktop (Chrome, Firefox, Safari)
- [ ] Works on mobile (iOS Safari, Android Chrome)
- [ ] Touch controls responsive (>=48px targets)
- [ ] No console errors
- [ ] Graceful degradation on slow devices
- [ ] Accessible (keyboard navigation, screen readers)

## Troubleshooting

### Game won't load

- Check browser console for errors
- Ensure served via HTTP(S), not `file://`
- Verify Phaser CDN is accessible

### Performance issues

- Try on a different device
- Check FPS in browser DevTools
- Disable debug mode in config

### Touch controls not working

- Ensure `user-scalable=no` in viewport meta
- Check `touch-action: none` in CSS
- Verify button hit boxes are large enough

## Contributing

See main project CONTRIBUTING.md. Key points:

1. All assets must be original or properly licensed
2. Document sources in `/assets/LICENSES.md`
3. No IP infringement (run blocklist check)
4. Test on mobile devices

## License

MIT License - See LICENSE file in project root.

## Credits

- **Game Engine:** Phaser 3 (MIT) - https://phaser.io
- **Assets:** Original (programmatically generated)
- **Concept:** Original baseball game mechanics

---

**No Backyard Baseball assets were used in the making of this game.**

For questions, open an issue on GitHub.
