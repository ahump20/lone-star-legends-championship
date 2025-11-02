# Godot Native Baseball Game (Future)

This directory contains a **placeholder Godot 4 project** for future native desktop and mobile builds of the baseball game.

## Status: Stub/Placeholder

⚠️ **This project is NOT yet implemented.** It serves as a directory structure placeholder for future development.

## Why Godot?

- **Cross-platform:** Single codebase for Windows, macOS, Linux, iOS, Android
- **Performance:** Native compilation, better than web for intensive games
- **Free & Open Source:** MIT license, no runtime fees
- **Mobile-friendly:** Built-in touch controls, sensors, and mobile optimization
- **GDScript:** Easy to learn, Python-like scripting

## Future Implementation Plan

### Phase 1: Core Port

- [ ] Port Phaser game mechanics to Godot/GDScript
- [ ] Create main menu scene
- [ ] Implement batting and pitching gameplay
- [ ] Add scoreboard UI

### Phase 2: Native Features

- [ ] Gamepad support
- [ ] Better physics (Godot's built-in engine)
- [ ] Particle effects
- [ ] Advanced animations (AnimationPlayer)
- [ ] Local save data (user stats, achievements)

### Phase 3: Mobile Builds

- [ ] Touch controls optimization
- [ ] Adaptive UI for different screen sizes
- [ ] Performance tuning for mobile GPUs
- [ ] iOS App Store build
- [ ] Android Play Store build

### Phase 4: Advanced Features

- [ ] Multiplayer (local and online)
- [ ] Season mode with progression
- [ ] Team management
- [ ] Advanced statistics

## Quick Start (When Implemented)

### Prerequisites

1. Install Godot 4.3+ from https://godotengine.org/
2. Clone this repository
3. Open project in Godot Editor

### Running the Game

```bash
# From Godot Editor: Press F5 or click "Run"

# From command line:
godot --path . --main-pack game.pck
```

### Building Exports

```bash
# Desktop (from Godot Editor):
Project → Export → Select Platform → Export Project

# Mobile requires platform SDKs:
# - iOS: Xcode (macOS only)
# - Android: Android SDK + NDK
```

## Project Structure (Planned)

```
godot-bbp-native/
├── project.godot          # Project configuration
├── icon.png               # App icon
├── scenes/
│   ├── menu.tscn         # Main menu
│   ├── game.tscn         # Baseball gameplay
│   ├── ui.tscn           # Scoreboard/HUD
│   └── settings.tscn     # Settings menu
├── scripts/
│   ├── GameManager.gd    # Core game logic
│   ├── Batter.gd         # Batter controller
│   ├── Pitcher.gd        # Pitcher AI
│   ├── Ball.gd           # Ball physics
│   └── UI.gd             # UI controller
├── assets/
│   ├── sprites/          # Character and object sprites
│   ├── audio/            # Sound effects and music
│   ├── fonts/            # UI fonts
│   └── shaders/          # Visual effects (optional)
├── export/
│   ├── windows/          # Windows build
│   ├── macos/            # macOS build
│   ├── linux/            # Linux build
│   ├── ios/              # iOS build
│   └── android/          # Android build
└── README.md
```

## Why Not Implemented Yet?

**Focus:** The Phaser web version is the MVP (minimum viable product) to launch quickly and validate the concept. The Godot native version is a future enhancement for:

1. **Better performance** on mobile devices
2. **Offline play** without internet
3. **App store distribution** (iOS/Android)
4. **Advanced features** requiring native capabilities

## When Will This Be Built?

**Timeline:** After the web version is successful and stable.

**Estimated effort:** 2-4 weeks for initial port, then ongoing enhancements.

## Technology Comparison

| Feature | Phaser (Web) | Godot (Native) |
|---------|--------------|----------------|
| Platform | Browser | Win/Mac/Linux/iOS/Android |
| Performance | Good (WebGL) | Excellent (native) |
| Distribution | URL/link | App stores |
| Offline | Limited (PWA) | Full offline |
| File Size | <1MB | 15-30MB |
| Updates | Instant | App update required |
| Development Time | 1-2 weeks | 3-4 weeks |

## Legal Compliance

Same as Phaser version:

- ✅ All assets must be original or licensed
- ✅ No Backyard Baseball IP
- ✅ No real athlete likenesses
- ✅ Document all assets in `/assets/LICENSES.md`

See `/LEGAL_COMPLIANCE.md` for details.

## Contributing

If you want to help build the Godot version:

1. **Discuss first:** Open an issue to coordinate
2. **Match web version:** Keep gameplay consistent
3. **Test on multiple platforms:** Desktop + mobile
4. **Document:** Update this README with progress

## Resources

### Learning Godot

- [Official Godot Docs](https://docs.godotengine.org/)
- [Godot Tutorials](https://www.youtube.com/c/GDQuest)
- [GDScript Language Guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/index.html)

### Godot + Mobile

- [Mobile Game Development](https://docs.godotengine.org/en/stable/tutorials/platform/mobile.html)
- [Exporting for iOS](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_ios.html)
- [Exporting for Android](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html)

### Godot + Sports Games

- [Physics-based games](https://docs.godotengine.org/en/stable/tutorials/physics/index.html)
- [2D sprite animation](https://docs.godotengine.org/en/stable/tutorials/2d/2d_sprite_animation.html)

## License

MIT License (same as main project)

## Questions?

Open an issue on GitHub with the tag `godot-native`.

---

**This is a placeholder for future development. The web version (Phaser) is the current priority.**
