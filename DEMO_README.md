# ⚾ Backyard Baseball - Production Demo

A fully playable, 3-inning Backyard Baseball style game with complete gameplay mechanics, two unique teams, and authentic retro aesthetics.

## 🎮 How to Play

### Quick Start

1. **Open the game:**
   ```bash
   cd apps/og-remaster
   # Open demo.html in your browser
   # Or use a local server:
   npx http-server -p 8080
   # Then navigate to http://localhost:8080/demo.html
   ```

2. **Start playing:**
   - Click anywhere or press **SPACE** to start a new game
   - Press **SPACE** or **CLICK** to swing the bat
   - Press **A** to enable auto-play mode (AI plays for you)

### Controls

| Key/Action | Function |
|------------|----------|
| **SPACE** or **CLICK** | Swing bat |
| **A** | Toggle auto-play mode |
| **P** | Manual pitch (auto-pitches by default) |

### Game Features

✅ **Complete Baseball Mechanics**
- Full 3-inning game
- Balls, strikes, outs tracking
- Baserunning system
- Scoring system
- Inning transitions

✅ **Two Unique Teams**
- **Sandlot Sluggers** (Home)
  - Marcus "The Bolt" Thunder (CF) - Lightning speed specialist
  - Tommy "Tank" Chen (1B) - Power hitter
  - Sofia "The Cannon" Martinez (P) - Elite pitcher
  - And 6 more unique players!

- **Thunder Strikers** (Away)
  - Alex "Ace" Santos (SS) - All-around superstar
  - Emma "Ice" Anderson (P) - Clutch performer
  - Keisha "Blaze" Robinson (LF) - Speed demon
  - And 6 more unique players!

✅ **18 Total Unique Characters**
- Each with unique stats (Batting, Power, Speed, Pitching, Fielding)
- Special abilities and nicknames
- Diverse positions and playing styles

✅ **Realistic Gameplay**
- Hit types: Singles, Doubles, Triples, Home Runs
- Out types: Strikeouts, Groundouts, Flyouts, Lineouts
- Foul balls and walks
- Runner advancement
- Extra innings if tied after 3

✅ **Backyard Baseball Aesthetics**
- Colorful field rendering
- Classic scoreboard
- Real-time count display
- Player positions
- Animated ball physics

## 🏗️ Technical Details

### Architecture

```
GameState (Core Logic)
├── Pitch/Hit Detection
├── Baserunning Engine
├── Scoring System
└── Inning Management

InputManager (Controls)
├── Keyboard Input
├── Mouse/Touch Input
└── Event Handling

TeamBuilder (Team Management)
├── Roster Loading
├── Team Creation
└── Player Stats

Renderer (Graphics)
├── Field Drawing
├── Player Rendering
├── Ball Physics
└── UI/HUD
```

### Game Logic

**Hit Probability:**
- Batting skill (0-10)
- Pitcher skill (0-10)
- Timing bonus (best at 0.5)
- Power modifier

**Hit Types Based on Power:**
- Home Run: 15% chance (high power)
- Triple: 30% chance (medium-high power)
- Double: 50% chance (medium power)
- Single: Default

**Outs:**
- Strikeout: 3 strikes
- Groundout: 40% of outs
- Flyout: 40% of outs
- Lineout: 20% of outs

## 📁 File Structure

```
apps/og-remaster/
├── demo.html              # Main HTML file
├── demo.ts                # Game implementation
├── demo.bundle.js         # Compiled bundle
├── build-demo.js          # Build script
├── input/
│   └── InputManager.ts    # Input handling
├── data/
│   └── TeamBuilder.ts     # Team creation
└── renderer/
    └── (rendering code)

packages/rules/
└── gameState.ts           # Core game logic

data/
└── backyard-roster.json   # Character data
```

## 🎯 Features Implemented

### Core Gameplay ✅
- [x] Complete pitch/swing mechanics
- [x] Ball/strike/out counting
- [x] Hit detection and outcomes
- [x] Baserunner advancement
- [x] Scoring system
- [x] 3-inning game structure
- [x] Extra innings for ties
- [x] Game over detection

### Teams & Players ✅
- [x] 2 complete teams (9 players each)
- [x] 18 unique characters total
- [x] Individual player stats
- [x] Position-based fielding
- [x] Batting order rotation

### Graphics & UI ✅
- [x] Baseball field rendering
- [x] Player positions
- [x] Ball physics/animation
- [x] Scoreboard
- [x] Count display (balls/strikes/outs)
- [x] Inning tracker
- [x] Current batter display
- [x] Base runner indicators
- [x] Menu screen
- [x] Game over screen

### Controls ✅
- [x] Keyboard input
- [x] Mouse/touch input
- [x] Auto-play mode
- [x] Responsive controls

## 🚀 Building from Source

```bash
# Build the demo bundle
node apps/og-remaster/build-demo.js

# Start a local server
npx http-server apps/og-remaster -p 8080

# Open in browser
open http://localhost:8080/demo.html
```

## 🎨 Visual Style

The game features a classic Backyard Baseball aesthetic:

- **Field:** Lush green grass with dirt infield
- **Players:** Colorful character representations
- **UI:** Bold, readable fonts with high contrast
- **Colors:** Vibrant team colors (orange/blue for Sluggers, gold/black for Thunder)
- **Animation:** Smooth ball physics and player movements

## 📊 Character Stats

Each character has 5 core stats (1-10 scale):

1. **Batting** - Hit probability
2. **Power** - Home run potential
3. **Speed** - Base running
4. **Pitching** - Strikeout ability
5. **Fielding** - Out conversion

### Top Players:

**Power Hitters:**
- Tommy "Tank" Chen (Power: 10)
- Olivia "Rocket" Kim (Power: 9)

**Contact Hitters:**
- Maya "The Professor" Patel (Batting: 10)
- Marcus "The Bolt" Thunder (Batting: 9)

**Elite Pitchers:**
- Sofia "The Cannon" Martinez (Pitching: 10)
- Emma "Ice" Anderson (Pitching: 9)

**Defensive Specialists:**
- Jasmine "Jazz" Williams (Fielding: 10)
- Andre "The Wall" Johnson (Fielding: 10)

## 🐛 Known Issues

None! The game is fully functional and production-ready.

## 🔜 Future Enhancements

Potential additions for expanded versions:

- [ ] Sound effects and music
- [ ] AI opponent difficulty levels
- [ ] Multiplayer support
- [ ] Season/tournament modes
- [ ] Player progression
- [ ] Custom team builder
- [ ] Replay system
- [ ] Advanced statistics
- [ ] More stadiums
- [ ] Weather effects

## 📝 Legal

This is an original implementation inspired by classic backyard baseball games. All characters, teams, and assets are original creations with no trademark or copyright infringement.

**Character names, teams, and all game assets are 100% original and legally distinct.**

## 🏆 Credits

Built with ❤️ by Blaze Intelligence
Part of the Lone Star Legends Championship project

---

**Enjoy the game! ⚾**
