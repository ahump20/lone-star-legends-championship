# 🎨 Character & Stadium Customization Guide

## Overview

The Sandlot Superstars game now features comprehensive customization systems that allow you to create unique characters and explore amazing stadiums from around the world—and beyond!

---

## ✨ Character Customization System

### Access
Navigate to: `games/baseball/character-creator.html` or select **Character Creator** from the main menu.

### Features

#### 1. **Basic Information**
- **Name**: Give your character a unique name (up to 30 characters)
- **Nickname**: Add a cool nickname like "The Rocket" or "Flash"
- **Age**: Set age from 8-15 years old
- **Position**: Choose from 9 positions (P, C, 1B, 2B, 3B, SS, LF, CF, RF)
- **Jersey Number**: Pick any number from 0-99

#### 2. **Stats Allocation** (35 Total Points)
Distribute points across 5 key stats:
- ⚾ **Batting** (1-10): Hit accuracy and contact ability
- 💪 **Power** (1-10): Home run distance and strength
- ⚡ **Speed** (1-10): Base running and stealing ability
- 🎯 **Pitching** (1-10): Pitch control and velocity
- 🧤 **Fielding** (1-10): Catching and throwing accuracy

**Stat System**:
- Total pool: 35 points to allocate
- Each stat ranges from 1 (minimum) to 10 (maximum)
- Body type bonuses can push stats beyond allocation

#### 3. **Physical Appearance**

##### Skin Tones (6 Options)
- Light, Fair, Medium, Tan, Brown, Dark
- Full hex color customization

##### Hair Styles (10 Options)
- Short Spiky ✂️
- Buzzcut 👨‍🦲
- Long Ponytail 👱‍♀️
- Curly 🌀
- Mohawk 🦅
- Afro 🎾
- Braids 🪢
- Bald 🥚
- Long Flowing 💇
- Side Part ✨

##### Hair Colors (12 Options)
- Natural: Black, Dark Brown, Brown, Light Brown, Blonde, Red, Auburn, Gray
- Fun: Blue, Pink, Green, Purple

##### Eye Colors (6 Options)
- Brown, Blue, Green, Hazel, Gray, Amber

##### Body Types (5 Options)
Each affects stats differently:
- **Slim**: +2 Speed, -1 Power
- **Athletic**: Balanced (no modifiers)
- **Muscular**: +2 Power, -1 Speed
- **Stocky**: +1 Power, +1 Fielding
- **Tall**: +1 Pitching, -1 Speed

##### Accessories (10 Options)
- None ❌
- Headband 🎀 (+1 Cool)
- Cap (Backwards) 🧢 (+2 Cool)
- Sunglasses 😎 (+3 Cool)
- Wristbands 💪 (+1 Power)
- Batting Gloves 🧤 (+1 Batting)
- Chain Necklace 📿 (+2 Cool)
- Arm Sleeve 🎽 (+1 Pitching)
- Face Paint 🎨 (+2 Cool)
- Eye Black ⚫ (+1 Batting)

#### 4. **Uniform Customization**

##### Jersey Styles (4 Options)
- Classic 👕
- Modern 👔
- Vintage 🎩
- Sleeveless 🦾

##### Colors (12 Each for Primary & Secondary)
- Red, Blue, Green, Yellow, Orange, Purple
- Black, White, Pink, Teal, Navy, Gold

#### 5. **Personality Traits** (Select up to 2)
- Competitive 🔥
- Playful 😄
- Focused 🎯
- Energetic ⚡
- Calm 😌
- Intense 😤
- Friendly 🤝
- Confident 😎
- Humble 🙏
- Show-off 💫

Affects AI behavior and commentary!

#### 6. **Special Abilities**
Choose one based on your stats:

##### Batting Abilities
- **Power Surge** (Req: Power 7+): Temporary massive power boost
- **Clutch Master** (Req: Batting 6+, Power 6+): Stats increase in close games
- **Hot Streak** (Built-in): Momentum builds with consecutive hits

##### Pitching Abilities
- **Laser Focus** (Req: Pitching 7+): Perfect accuracy for 3 pitches
- **Ace in the Hole** (Req: Pitching 9+): Unhittable with 2 strikes

##### Running Abilities
- **Flash Step** (Req: Speed 8+): Teleport to any base (ultimate)
- **Momentum Builder** (Req: Batting 5+, Fielding 5+): Success breeds success

##### Fielding Abilities
- **Wall Run** (Req: Fielding 8+): Run up outfield wall for catches
- **Showboat** (Req: Fielding 7+): Flashy plays energize team

#### 7. **Playing Style**

##### Batting Stances (5 Options)
- Traditional ⚾ (Balanced)
- Open ↔️ (+1 Power)
- Closed → (+1 Contact)
- Crouch ⬇️ (+1 Strike Zone)
- Upright ⬆️ (+1 Speed)

##### Pitching Styles (4 Options)
- Overhand ↓ (+1 Velocity)
- Sidearm → (+1 Movement)
- Submarine ↗️ (+1 Deception)
- 3/4 Arm ↘️ (Balanced)

---

### Character Ratings

Based on average stats:
- **S+ (Legendary)**: 9.0+ average
- **A+ (Star)**: 8.0-8.9 average
- **A (All-Star)**: 7.0-7.9 average
- **B+ (Great)**: 6.0-6.9 average
- **B (Solid)**: 5.0-5.9 average
- **C+ (Developing)**: <5.0 average

---

### Export & Import

**Export**: Save your character as JSON file for sharing
**Import**: Load characters from JSON files
**Storage**: All custom characters saved to localStorage

---

## 🏟️ Stadium Gallery

### Access
Navigate to: `games/baseball/stadiums.html` or select **Stadium Gallery** from main menu.

### Built-In Stadiums

#### Original Stadiums (Unlocked by Default)

##### 1. **Sunny Park** 🌞
- **Difficulty**: Medium
- **Description**: Classic grass field with perfect conditions
- **Characteristics**:
  - Fence Distance: 100%
  - Wind: 0%
  - Visibility: 100%
- **Best For**: Balanced gameplay, beginners

##### 2. **Sandy Shores Beach** 🏖️
- **Difficulty**: Medium
- **Description**: Beach setting with wind effects
- **Characteristics**:
  - Fence Distance: 90%
  - Wind: +15%
  - Ground Speed: 80% (slow on sand)
- **Features**: Wind gusts, sand traps
- **Best For**: Contact hitters who can place the ball

#### New Unique Stadiums (Must Be Unlocked)

##### 3. **Volcano Valley** 🌋
- **Difficulty**: Hard
- **Unlock**: Win 10 games
- **Description**: Active volcano creates rising heat that affects fly balls
- **Characteristics**:
  - Fence Distance: 120%
  - Ball Speed: 115%
  - Thermal Uplift: +30%
  - Visibility: 85%
- **Special Features**: Thermal uplift, lava pits, earthquakes
- **Hazards**: Random eruptions shake the field
- **Best For**: Power hitters who can reach the deep fences

##### 4. **Ice Palace Arena** ❄️
- **Difficulty**: Hard
- **Unlock**: Hit 5 home runs
- **Description**: Frozen wonderland with ice patches
- **Characteristics**:
  - Ball Speed: 85%
  - Ground Speed: 150% (very fast on ice)
  - Slipperiness: 80%
- **Special Features**: Icy patches, slip sliding, blizzards
- **Hazards**: Players may slip on ice
- **Best For**: Speed demons who can handle the ice

##### 5. **Neon City Rooftop** 🌃
- **Difficulty**: Very Hard
- **Unlock**: Complete a season
- **Description**: High-rise cyberpunk stadium
- **Characteristics**:
  - Fence Distance: 75% (short fences!)
  - Wind: +30% (high altitude)
  - Visibility: 70% (bright neon lights)
- **Special Features**: Neon lights, height advantage, urban noise
- **Hazards**: Balls may fly off building
- **Best For**: Players who like home run derbies

##### 6. **Jungle Diamond** 🌴
- **Difficulty**: Hard
- **Unlock**: Steal 10 bases total
- **Description**: Hidden field in dense rainforest
- **Characteristics**:
  - Visibility: 75%
  - Humidity: 90%
  - Ground Speed: 85%
- **Special Features**: Hanging vines, wildlife calls, sudden rain
- **Hazards**: Balls may get stuck in vines
- **Best For**: Fielders with quick reflexes

##### 7. **Lunar Base Alpha** 🌙
- **Difficulty**: Extreme
- **Unlock**: Hit a 500ft home run
- **Description**: Low gravity moon base - balls fly incredibly far!
- **Characteristics**:
  - Fence Distance: 200% (very deep!)
  - Gravity: 16% (1/6 Earth)
  - Ball Speed: 50%
  - No wind (no atmosphere)
- **Special Features**: Low gravity, floaty balls, space suits
- **Hazards**: Everything floats!
- **Best For**: Anyone who wants to hit 1000ft home runs

##### 8. **Aquatic Dome Stadium** 🌊
- **Difficulty**: Hard
- **Unlock**: Win underwater-themed challenge
- **Description**: Glass dome under the ocean
- **Characteristics**:
  - Ball Speed: 70%
  - Water Resistance: 30%
  - Visibility: 80%
- **Special Features**: Water currents, fish swim by, wave patterns
- **Hazards**: Pressure affects ball movement
- **Best For**: Pitchers who can use the resistance

##### 9. **Ancient Colosseum** 🏛️
- **Difficulty**: Medium
- **Unlock**: Play 25 games
- **Description**: Historic Roman arena converted for baseball
- **Characteristics**:
  - Fence Distance: 85%
  - Echo: 80%
- **Special Features**: Acoustic boost, crowd echo, historic aura
- **Hazards**: Crowd roar can distract
- **Best For**: Players who thrive under pressure

##### 10. **Candy Land Park** 🍭
- **Difficulty**: Easy
- **Unlock**: Create a custom character
- **Description**: Whimsical candy-themed field
- **Characteristics**:
  - Fence Distance: 80% (short)
  - Ball Speed: 110%
  - Visibility: 100%
  - Sweetness: 100%
- **Special Features**: Candy bounce, gummy bases, sugar rush
- **Hazards**: Too much fun!
- **Best For**: Fun, casual gameplay

##### 11. **Desert Oasis** 🏜️
- **Difficulty**: Hard
- **Unlock**: Win 5 consecutive games
- **Description**: Scorching desert heat with sandstorms
- **Characteristics**:
  - Visibility: 60% (sandstorms)
  - Heat: 90%
  - Ground Speed: 130%
- **Special Features**: Sandstorms, mirages, heat waves
- **Hazards**: Limited visibility in storms
- **Best For**: Players with good instincts

##### 12. **Haunted Mansion Grounds** 🏚️
- **Difficulty**: Very Hard
- **Unlock**: Play on Halloween
- **Description**: Spooky gothic stadium with ghostly interference
- **Characteristics**:
  - Visibility: 50% (very dark)
  - Spookiness: 100%
- **Special Features**: Ghostly players, cursed balls, fog banks
- **Hazards**: Ghosts may move the ball
- **Best For**: Brave players who aren't afraid

##### 13. **Orbital Space Station** 🛸
- **Difficulty**: Extreme
- **Unlock**: Hit 100 home runs total
- **Description**: Rotating space station with gravity zones
- **Characteristics**:
  - Fence Distance: 150%
  - Ball Speed: 80%
  - Rotation: 50%
- **Special Features**: Rotating field, gravity zones, earth view
- **Hazards**: Gravity shifts unexpectedly
- **Best For**: Advanced players seeking challenge

##### 14. **Cherry Blossom Gardens** 🌸
- **Difficulty**: Easy
- **Unlock**: Achieve inner peace (meditation mode)
- **Description**: Serene Japanese garden with falling petals
- **Characteristics**:
  - All stats balanced
  - Tranquility: 100%
- **Special Features**: Falling petals, peaceful aura, koi pond
- **Hazards**: Too beautiful to focus
- **Best For**: Relaxing, enjoyable gameplay

---

### Stadium Customization

**Create Custom Stadiums**:
- Adjust all physical characteristics
- Set visual appearance (colors, lighting)
- Add special features and hazards
- Name and describe your creation

**Random Stadium Generator**:
- Instantly creates unique stadium
- Random theme, colors, and physics
- Perfect for variety

---

### Home Field Advantage

Characters gain **+1 to all stats** when playing at their assigned home stadium!

**Setting Home Stadium**:
1. Create/edit character
2. Select favorite stadium
3. Enjoy bonuses when playing there

---

### Character-Stadium Synergies

Certain character types excel in specific stadiums:

#### Synergy Bonuses

1. **Speed Characters (8+ Speed) + Ice Palace**
   - +2 Speed bonus
   - Description: "⚡ Speed demon on ice!"

2. **Power Hitters (8+ Power) + Moon Base/Space Station**
   - +2 Power bonus
   - Description: "💪 Power surge in low gravity!"

3. **Pitchers (8+ Pitching) + Underwater Dome**
   - +1 Pitching bonus
   - Description: "🌊 Master of water resistance!"

4. **Fielders (8+ Fielding) + Jungle Diamond**
   - +2 Fielding bonus
   - Description: "🌴 Jungle cat reflexes!"

5. **Contact Hitters (8+ Batting) + Candy Land**
   - +1 Batting bonus
   - Description: "🍭 Sweet spot master!"

---

## 🎮 Using Custom Content in Games

### Playing with Custom Characters

1. **Create Character**:
   - Go to Character Creator
   - Design your player
   - Save character

2. **Select in Game**:
   - Go to Team Selection
   - Custom characters appear alongside built-in characters
   - Add to your roster
   - Play!

### Playing at Custom Stadiums

1. **Browse Stadiums**:
   - Visit Stadium Gallery
   - View available venues
   - Check unlock status

2. **Select Stadium**:
   - Click "Play Here" on any unlocked stadium
   - Stadium carries through to team selection
   - Game adapts to stadium characteristics

3. **Unlock Stadiums**:
   - Complete challenges
   - Achieve milestones
   - Track progress in Stadium Gallery

---

## 📊 Statistics & Tracking

### Saves Data
- All custom characters
- Unlocked stadiums
- Stadium preferences
- Character-stadium assignments

### Progress Tracking
- Games played at each stadium
- Characters created
- Unlock progression
- Home field advantage uses

---

## 🔧 Technical Details

### Storage
- **LocalStorage**: All customizations saved locally
- **Export/Import**: Share characters and stadiums
- **Automatic Saving**: Changes saved immediately

### Performance
- Stadiums dynamically load characteristics
- Character stats calculated in real-time
- Synergies applied automatically

### File Structure
```
/js/
├── character-customization.js    # Character creation system
└── stadium-customization.js      # Stadium management

/games/baseball/
├── character-creator.html        # Character creator UI
├── stadiums.html                 # Stadium gallery
└── index.html                    # Main game (with integration)
```

---

## 🎯 Tips & Tricks

### Character Creation
1. **Balanced Build**: Spread points evenly for versatile player
2. **Specialist Build**: Max out 1-2 stats for specific role
3. **Body Type Strategy**: Choose body type that complements your stat allocation
4. **Ability Matching**: Pick abilities that match your highest stats

### Stadium Selection
1. **Match Character**: Choose stadium that complements your character's strengths
2. **Learn Mechanics**: Practice in easier stadiums first
3. **Use Synergies**: Exploit character-stadium bonuses
4. **Home Advantage**: Set home stadium for automatic +1 boost

### Unlock Strategy
1. **Candy Land First**: Create a character to unlock easy stadium
2. **Power Up**: Hit home runs to unlock Ice Palace
3. **Grind Wins**: Complete games for Volcano Valley
4. **Master Basics**: Learn core mechanics before extreme stadiums

---

## 🏆 Achievement Integration

Custom content unlocks achievements:
- **Character Creator**: Create your first custom character
- **Stadium Master**: Unlock all stadiums
- **Home Hero**: Win 10 games at home stadium
- **Synergy Expert**: Win with all synergy bonuses
- **Ultimate Customizer**: Create 10 custom characters

---

## 📝 Examples

### Example Character: "Lightning Jack"
```
Name: Jack "Lightning" Rodriguez
Position: CF
Stats: Batting 7, Power 5, Speed 10, Pitching 4, Fielding 9
Body Type: Slim (+2 Speed = 12!)
Ability: Flash Step (Speed 8+ req)
Accessories: Sunglasses, Wristbands
Home Stadium: Ice Palace (Speed synergy!)
Rating: A (All-Star)
```

### Example Stadium Setup
```
Playing At: Volcano Valley
Character: Tank "Slugger" Chen (Power 10)
Bonuses: None (but deep fences good for power)
Strategy: Wait for thermal lift, hit it high!
Expected: 500+ ft home runs
```

---

## 🚀 Future Enhancements

Planned features:
- [ ] Share characters online
- [ ] Download community stadiums
- [ ] Character progression/leveling
- [ ] Stadium editor (visual)
- [ ] Team builder (all custom characters)
- [ ] Tournament mode with custom venues
- [ ] Weather customization per stadium
- [ ] Character animations based on appearance

---

## ❓ FAQ

**Q: How many custom characters can I create?**
A: Unlimited! Limited only by browser localStorage capacity.

**Q: Can I use multiple custom characters on one team?**
A: Yes! Build an entire team of custom characters.

**Q: Do custom characters appear in season mode?**
A: Yes, they're fully integrated into all game modes.

**Q: Can I edit a character after creation?**
A: Yes, via the character management system (coming soon).

**Q: What happens if I clear browser data?**
A: Custom characters are lost unless exported first.

**Q: Can I unlock all stadiums instantly?**
A: No, stadiums must be unlocked through gameplay achievements.

**Q: Do stadium characteristics actually affect gameplay?**
A: Yes! All characteristics modify ball physics and game mechanics.

**Q: Can I create a stadium similar to a real one?**
A: Yes, customize characteristics to match real-world venues.

---

## 📞 Support

For help or feature requests:
1. Check this guide
2. Review in-game tooltips
3. Experiment with different combinations
4. Report issues via GitHub

---

**Enjoy creating your ultimate baseball superstars and exploring incredible venues!** ⚾✨

*"In Sandlot Superstars, you're not just a player—you're the creator!"*
