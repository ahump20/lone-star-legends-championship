# Sandlot Superstars - Baseball Championship Game

A fully-featured 3D baseball game built with Three.js, featuring unique characters, special abilities, dynamic stadiums, and immersive gameplay.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Game Systems](#game-systems)
- [Development](#development)
- [Configuration](#configuration)
- [Browser Support](#browser-support)
- [Credits](#credits)

## Overview

Sandlot Superstars is a browser-based baseball game that combines arcade-style gameplay with strategic depth. Players can choose from 18 unique characters across 6 teams, each with special abilities and distinct playing styles. The game features realistic 3D graphics, physics-based ball movement, AI-controlled fielders, and procedurally-generated audio.

## Features

### Core Gameplay
- ⚾ **Full 3D Baseball Field** - Realistic diamond with outfield walls, bases, and pitcher's mound
- 🎮 **Intuitive Controls** - Keyboard and button controls for batting, pitching, and fielding
- 🤖 **AI Fielders** - 9 defensive players with intelligent ball-tracking behavior
- 🎯 **Physics Engine** - Realistic ball trajectory, gravity, and collision detection

### Character System
- 👥 **18 Unique Characters** - Each with distinct stats and personalities
- ⚡ **Special Abilities** - Unique powers like Mega Blast, Lightning Speed, and Rocket Arm
- 📊 **Balanced Stats** - Batting, power, speed, pitching, and fielding ratings (1-10 scale)
- 🏆 **6 Teams** - Pre-built team rosters with themed characters

### Stadium Variety
- 🌞 **Sunny Park** - Classic grass field with perfect conditions
- 🏖️ **Sandy Shores Beach** - Beach setting with wind and sand hazards
- 🏙️ **Urban Lot** - City field with close fences and building obstacles
- 🌙 **Night Stadium** - Evening game with reduced visibility under lights
- ❄️ **Winter Wonderland** - Snow-covered field with unique ball physics
- 🏜️ **Dusty Diamond** - Desert field with dust storms and hard ground

### Audio & Visual Effects
- 🔊 **Procedural Audio** - Web Audio API generates realistic sound effects
- 🎨 **Dynamic Lighting** - Stadium lights and day/night cycles
- 💥 **Hit Indicators** - Visual feedback for hits, home runs, and outs
- 📣 **Commentary System** - Dynamic play-by-play announcements

## Getting Started

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ahump20/lone-star-legends-championship.git
   cd lone-star-legends-championship
   ```

2. **Start a local web server:**

   Using Python 3:
   ```bash
   python -m http.server 8000
   ```

   Or using Node.js:
   ```bash
   npx http-server -p 8000
   ```

3. **Open in browser:**
   Navigate to `http://localhost:8000/games/baseball/`

### Controls

**Keyboard:**
- `SPACE` - Swing bat
- `P` - Pitch ball
- `R` - Reset game
- `A` / `Left Arrow` - Move batter left
- `D` / `Right Arrow` - Move batter right

**Mouse/Touch:**
- Click buttons at bottom of screen for swing, pitch, reset

## Project Structure

```
games/baseball/
├── index.html              # Main game file
└── README.md              # This file

js/                         # JavaScript modules (root level)
├── character-manager.js   # Character/roster management
├── stadium-manager.js     # Stadium definitions and physics
├── audio-manager.js       # Sound effects and commentary
├── special-abilities.js   # Special ability system
├── enhanced-3d-engine.js  # Advanced 3D rendering (if separate)
├── character-renderer.js  # Character visualization
├── enhanced-game-ui.js    # UI components
├── season-mode.js         # Season/tournament mode
└── game-integration.js    # Game flow integration

data/
└── backyard-roster.json   # Character and team definitions
```

## Game Systems

### Character Management

The `CharacterManager` class handles:
- Loading character roster from JSON
- Creating player objects with converted stats
- Team selection and lineup creation
- Character stat summaries and ratings

**Stat Conversion:**
- Batting (1-10) → Batting Average (0.200-0.400)
- Power (1-10) → Power Factor (0.05-0.50)
- Speed (1-10) → Speed Multiplier (0.5-1.5)
- Pitching (1-10) → Pitching Skill (0.5-1.0)
- Fielding (1-10) → Fielding Skill (0.6-1.0)

### Special Abilities

Each character has a unique special ability with a cooldown system:

**Cooldown Values:**
- `1-9`: Multiple uses per game (uses = floor(9 / cooldown))
- `99`: One-time use (ultimate ability)

**Ability Types:**
- **Batting:** Mega Blast, Eagle Eye, Moon Shot, All-Star
- **Pitching:** Rocket Arm, Trick Pitch
- **Running:** Lightning Speed, Speedster
- **Fielding:** Wall Climber, Laser Throw, Magnetic Glove, Defensive Wall, Bike Speed
- **Team:** Rally Starter, Spark Plug

### Stadium Physics

Each stadium has unique characteristics that affect gameplay:

```javascript
characteristics: {
  fenceDistance: 1.0,   // Home run distance multiplier
  ballSpeed: 1.0,       // Ball velocity multiplier
  windFactor: 0,        // Wind effect (-0.2 to 0.2)
  groundSpeed: 1.0,     // Ground ball speed
  visibility: 1.0       // Affects hitting difficulty
}
```

### Audio System

Procedural audio generation using Web Audio API:
- Bat crack sounds
- Glove catch pops
- Crowd cheers and reactions
- Umpire calls
- Home run fanfares
- Dynamic commentary lines

## Development

### Adding New Characters

Edit `/data/backyard-roster.json`:

```json
{
  "id": "unique_id",
  "name": "Player Name",
  "nickname": "Nickname",
  "age": 12,
  "position": "CF",
  "favoriteNumber": 7,
  "stats": {
    "batting": 8,
    "power": 7,
    "speed": 9,
    "pitching": 5,
    "fielding": 8
  },
  "specialAbility": {
    "id": "ability_id",
    "name": "Ability Name",
    "description": "Ability description",
    "cooldown": 3
  },
  "appearance": {
    "skinTone": "medium",
    "hairColor": "black",
    "shirtColor": "#FF6B35"
  },
  "personality": {
    "trait1": "Energetic",
    "trait2": "Competitive"
  },
  "bio": "Character backstory"
}
```

### Adding New Special Abilities

1. Define the ability handler in `js/special-abilities.js`:

```javascript
this.abilityHandlers = {
  'your_ability_id': (player) => {
    this.abilityEffects.yourEffect = true;
    return `${player.name} activates YOUR ABILITY!`;
  }
}
```

2. Implement the effect in `modifyPitchOutcome()`, `modifyFieldingOutcome()`, or `modifyBaseRunning()` methods.

### Adding New Stadiums

Add to `StadiumManager.initializeStadiums()` in `js/stadium-manager.js`:

```javascript
'your_stadium': {
  id: 'your_stadium',
  name: 'Stadium Name',
  description: 'Stadium description',
  characteristics: { /* physics modifiers */ },
  appearance: { /* visual settings */ },
  ambience: { /* weather and sounds */ }
}
```

## Configuration

### Error Handling

The game includes comprehensive error handling:
- Network request failures show user-friendly error messages
- Audio initialization failures gracefully disable audio
- Invalid data structures are validated and logged

### Input Sanitization

All user-provided text (team names, etc.) is sanitized to prevent XSS:

```javascript
sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### Accessibility

The game includes ARIA labels for screen readers:
- `role="toolbar"` for game controls
- `role="status"` for score updates with `aria-live="polite"`
- `aria-label` attributes on all interactive elements

## Browser Support

**Minimum Requirements:**
- Modern browser with ES6+ support (Chrome 51+, Firefox 54+, Safari 10+, Edge 15+)
- WebGL support (for Three.js 3D rendering)
- Web Audio API support (for sound effects)

**Recommended:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Desktop or tablet (mobile supported but optimized for larger screens)

## Performance Optimization

- Procedural audio reduces file size and HTTP requests
- Efficient ball physics with cleanup of out-of-bounds objects
- Optimized fielder AI with distance-based targeting
- Shadow mapping with PCF soft shadows for visual quality

## Known Limitations

- Single-player only (multiplayer planned for future release)
- No save/load game state (planned)
- Limited to 9 innings (configurable in future versions)
- Procedural audio may be CPU-intensive on low-end devices

## Future Enhancements

- [ ] Online multiplayer support
- [ ] Save/load game progress
- [ ] Custom character creation
- [ ] Tournament/season mode
- [ ] Achievement system
- [ ] Replay system
- [ ] Pre-rendered audio option for performance
- [ ] Mobile-optimized controls
- [ ] Localization/internationalization

## Credits

**Development:** Claude (Anthropic)
**Graphics:** Three.js 3D Engine
**Audio:** Web Audio API
**Character System:** Custom roster management
**Game Design:** Backyard baseball-inspired gameplay

## License

See repository root for license information.

## Support

For issues or questions:
- Create an issue on GitHub
- Check existing documentation
- Review the code comments in source files

---

⚾ **Play ball and have fun!**
