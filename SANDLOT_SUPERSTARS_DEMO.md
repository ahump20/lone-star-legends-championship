# Sandlot Superstars - Production Demo Game

## Overview

A fully playable 3-inning baseball game featuring two unique teams, complete game mechanics, and backyard baseball-style aesthetics. This production-ready demo showcases the Lone Star Legends Championship platform's gaming capabilities.

## 🎮 Live Demo

**File:** `blaze-swing-engine.html`

**Play Online:** Open `/blaze-swing-engine.html` in a web browser

## Features

### ⚾ Complete Baseball Experience

- **3 Full Innings** - Top and bottom of each inning
- **Two Unique Teams:**
  - **Thunder Bolts** (Orange) - 9 players with unique stats
  - **Sandstorm Squad** (Gold) - 9 players with unique stats
- **Realistic Game Flow** - Automatic inning changes, team switching, and game completion

### 🎯 Game Mechanics

- **Pitching System** - Realistic ball physics with gravity
- **Batting System** - Timing-based swing mechanics
- **Hit Types:**
  - Singles
  - Doubles
  - Triples
  - Home Runs
- **Outs:**
  - Strike outs (3 strikes)
  - Caught fly balls
- **Walks** - 4 balls = automatic walk to first base
- **Base Running** - Automatic runner advancement based on hit type

### 📊 Player Statistics

Each of the 18 players has unique stats:
- **Batting Average** (0.295 - 0.380) - Affects hit probability
- **Power** (0.25 - 0.50) - Determines hit distance and home run chance
- **Speed** (0.40 - 0.90) - Affects base running (future expansion)

### 🎨 Visual Design

**Backyard Baseball-Inspired Aesthetics:**
- Bright, sunny sky background
- Green grass field with dirt infield
- White chalk foul lines
- Wood outfield fence
- Simple, colorful character models
- Comic Sans font for playful feel
- Stadium-style scoreboard

**3D Graphics:**
- Full 3D baseball diamond
- Realistic lighting and shadows
- Smooth ball physics
- Animated pitcher windup
- Animated bat swing

### 🎯 User Interface

**Scoreboard** (Top of screen):
- Team names and scores
- Current inning (1-3)
- Top/Bottom indicator
- Outs counter (visual indicators)
- Balls and strikes count

**Bases Display** (Top right):
- Diamond-shaped base indicators
- Highlights occupied bases

**Player Info** (Bottom center):
- Current batter name
- Batting average
- Power rating
- Speed rating

**Controls** (Bottom center):
- PITCH button - Throws the ball
- SWING button - Swings the bat
- Keyboard shortcuts:
  - `P` - Pitch
  - `SPACE` - Swing

**Visual Feedback:**
- Hit type indicators (HOME RUN!, TRIPLE!, etc.)
- Ball/Strike announcements
- Out notifications
- Game over summary

## 🏃 How to Play

1. **Start the Game**
   - The Thunder Bolts (away team) bats first
   - Current batter's stats are displayed

2. **Pitching**
   - Click "PITCH" button or press `P`
   - Ball is thrown toward home plate
   - Watch the pitch animation

3. **Batting**
   - Once pitch is in motion, "SWING" button activates
   - Click "SWING" or press `SPACE` to swing
   - Timing is critical - swing when ball is near plate

4. **Results**
   - **Hit:** Ball flies into field, runners advance
   - **Strike:** Miss or no swing, strike count increases
   - **Ball:** Pitch too far from plate, ball count increases
   - **Out:** 3 strikes or caught ball

5. **Inning Flow**
   - 3 outs = half inning ends
   - Teams switch offense/defense
   - After 3 complete innings, game ends
   - Winner is team with most runs

## 🎯 Game Strategy

### Batting Tips
- Wait for good pitches (not too high/low)
- Players with higher batting averages get more hits
- High power players hit more home runs
- Time your swing for solid contact

### Team Rosters

**Thunder Bolts (Away Team)**
- Marcus Thunder - Speed demon (0.350 avg, 0.40 pwr, 0.90 spd)
- Sofia Martinez - Balanced (0.320 avg, 0.30 pwr, 0.70 spd)
- Tommy Chen - Power hitter (0.380 avg, 0.50 pwr, 0.40 spd)
- Jazz Williams - Fast (0.300 avg, 0.25 pwr, 0.80 spd)
- Diego Rivera - Solid (0.340 avg, 0.35 pwr, 0.60 spd)
- Emma Stone - Contact hitter (0.310 avg, 0.28 pwr, 0.70 spd)
- Kai Nakamura - All-around (0.330 avg, 0.32 pwr, 0.75 spd)
- Zara Johnson - Speedy (0.295 avg, 0.30 pwr, 0.85 spd)
- Alex Rodriguez - Balanced (0.315 avg, 0.33 pwr, 0.65 spd)

**Sandstorm Squad (Home Team)**
- Blake Rocket - Power (0.360 avg, 0.45 pwr, 0.70 spd)
- Luna Garcia - Fast (0.325 avg, 0.31 pwr, 0.80 spd)
- Max Power - Slugger (0.340 avg, 0.48 pwr, 0.50 spd)
- Mia Santos - Lightning (0.310 avg, 0.27 pwr, 0.90 spd)
- Ryan Lee - All-around (0.330 avg, 0.36 pwr, 0.65 spd)
- Olivia Brown - Contact (0.315 avg, 0.29 pwr, 0.75 spd)
- Tyler Swift - Speedy (0.305 avg, 0.34 pwr, 0.85 spd)
- Nina Patel - Balanced (0.320 avg, 0.30 pwr, 0.70 spd)
- Jordan Kim - Solid (0.300 avg, 0.35 pwr, 0.60 spd)

## 🛠️ Technical Details

### Technologies Used
- **Three.js** (r128) - 3D graphics engine
- **Vanilla JavaScript** - Game logic
- **HTML5 Canvas** - Rendering
- **CSS3** - UI styling

### Browser Requirements
- Modern browser with WebGL support
- Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- JavaScript enabled
- Minimum 1024x768 resolution (responsive down to 768px)

### Performance
- 60 FPS target frame rate
- Hardware-accelerated 3D rendering
- Efficient ball physics calculations
- Shadow mapping for visual quality

### Accessibility
- ARIA labels on interactive elements
- Keyboard controls supported
- High-contrast UI elements
- Screen reader friendly status updates

### File Structure
```
blaze-swing-engine.html (41KB)
├── HTML Structure
├── CSS Styles (embedded)
│   ├── Scoreboard
│   ├── Controls
│   ├── UI overlays
│   └── Responsive design
└── JavaScript Game Engine
    ├── Three.js Scene Setup
    ├── Game State Management
    ├── Physics Engine
    ├── Hit Detection
    └── UI Updates
```

## 🎨 Design Philosophy

### Backyard Baseball Inspiration
The game captures the spirit of classic backyard baseball games:
- **Colorful and Fun** - Bright colors, playful fonts
- **Simple Characters** - Geometric shapes (cylinders + spheres)
- **Accessible Gameplay** - Easy to learn, fun to play
- **Casual Atmosphere** - Sunny day, friendly competition

### Original Design
**No Copyright Issues:**
- All graphics are original geometric primitives
- Character names are unique and original
- Team names are original creations
- No trademarked elements or likenesses
- Custom color schemes and designs
- Original game mechanics and UI

## 🚀 Future Enhancements

Potential additions for future versions:
- [ ] More innings (configurable)
- [ ] Fielder animations
- [ ] Advanced batting mechanics (direction control)
- [ ] Sound effects and music
- [ ] Save/load game state
- [ ] Player substitutions
- [ ] Detailed statistics tracking
- [ ] Replay system
- [ ] Multi-player support
- [ ] Mobile-optimized touch controls
- [ ] Character customization
- [ ] Additional stadiums
- [ ] Weather effects
- [ ] Achievement system

## 📝 Development Notes

### Code Quality
- Clean, commented code
- Modular class structure
- Error handling for edge cases
- Input sanitization for security
- Responsive design patterns

### Testing
- Tested in Chrome, Firefox, Safari
- Validated game flow (all innings)
- Tested all hit types
- Verified scoring system
- Checked UI responsiveness
- Accessibility validation

## 📄 License

See repository root for license information.

## 🤝 Credits

**Development:** Blaze Intelligence / Lone Star Legends Championship  
**Graphics Engine:** Three.js  
**Game Design:** Original backyard baseball-inspired gameplay  
**Teams & Characters:** Original creations

## 🐛 Known Issues

None currently identified. Report issues via GitHub repository.

## 📞 Support

For questions or issues:
- Check the code comments in `blaze-swing-engine.html`
- Review the game mechanics in this README
- Create an issue on GitHub
- Contact: ahump20@outlook.com

---

⚾ **Enjoy playing Sandlot Superstars!** ⚾
