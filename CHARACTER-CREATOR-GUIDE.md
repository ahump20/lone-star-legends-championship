# Character Creator System Guide

Complete guide to the character customization system in Sandlot Superstars.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Character Creator API](#character-creator-api)
- [UI Integration](#ui-integration)
- [Character Manager Integration](#character-manager-integration)
- [Stat System](#stat-system)
- [Abilities System](#abilities-system)
- [Appearance Options](#appearance-options)
- [Preset Characters](#preset-characters)
- [Import/Export](#importexport)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Character Creator System allows players to create, customize, and save their own baseball characters with:

- **200 stat points** to allocate across 6 attributes
- **Custom appearance** (skin tone, jersey color, batting stance, pitching motion)
- **Special abilities** (choose up to 3, max 1 ultimate)
- **Preset templates** (6 archetypes: Power, Contact, Speed, Ace, Gold Glove, Balanced)
- **Save/Load** functionality with localStorage
- **Import/Export** JSON support

### File Structure

```
js/
├── character-creator.js        # Core character creation logic
├── ui-character-creator.js     # UI screens and components
└── character-manager.js        # Extended with custom character support

css/
└── character-creator.css       # Character creator styling

examples/
└── character-creator-demo.html # Working demo
```

---

## Quick Start

### 1. Include Required Files

```html
<!-- Dependencies -->
<script src="js/game-state-manager.js"></script>

<!-- Character Creator -->
<script src="js/character-creator.js"></script>
<script src="js/ui-character-creator.js"></script>
<link rel="stylesheet" href="css/character-creator.css">
```

### 2. Initialize System

```javascript
// Create game state manager
const gameStateManager = new GameStateManager();

// Create character creator
const characterCreator = new CharacterCreator(gameStateManager);

// Create UI manager
const uiManager = new UIManager();

// Register character creator screens
uiManager.registerScreen('character-creator',
    () => new CharacterCreatorScreen(uiManager, characterCreator)
);
uiManager.registerScreen('saved-characters',
    () => new SavedCharactersScreen(uiManager, characterCreator)
);

// Show character creator
uiManager.showScreen('character-creator');
```

### 3. Listen to Events

```javascript
// Listen for character saves
characterCreator.on('character_saved', (event, character) => {
    console.log('Character created:', character);
    // Refresh character manager if needed
    if (window.characterManager) {
        characterManager.refreshCustomCharacters();
    }
});

// Listen for all events
characterCreator.on('*', (event, data) => {
    console.log('Event:', event, data);
});
```

---

## Character Creator API

### Constructor

```javascript
const creator = new CharacterCreator(gameStateManager);
```

**Parameters:**
- `gameStateManager` (GameStateManager): Required for saving/loading characters

### Character Management

#### `startNewCharacter()`
Start creating a new character with default values.

```javascript
const character = creator.startNewCharacter();
// Returns empty character with 50 in all stats
```

#### `loadCharacter(characterData)`
Load an existing character for editing.

```javascript
const characters = creator.getSavedCharacters();
creator.loadCharacter(characters[0]);
```

#### `getCharacter()`
Get the current character being edited.

```javascript
const current = creator.getCharacter();
console.log(current.name, current.stats);
```

#### `saveCharacter()`
Validate and save the current character.

```javascript
try {
    const saved = creator.saveCharacter();
    console.log('Character saved!', saved);
} catch (error) {
    console.error('Validation failed:', error.message);
}
```

#### `getSavedCharacters()`
Get all saved custom characters.

```javascript
const allCharacters = creator.getSavedCharacters();
console.log(`${allCharacters.length} characters saved`);
```

#### `deleteCharacter(characterId)`
Delete a saved character.

```javascript
creator.deleteCharacter('custom_1234567890_abc123');
```

### Basic Info

#### `updateBasicInfo(info)`
Update character name, position, and jersey number.

```javascript
creator.updateBasicInfo({
    name: 'Lightning Joe',
    position: 'CF',
    jerseyNumber: 42
});
```

**Valid Positions:**
- `P` - Pitcher
- `C` - Catcher
- `1B`, `2B`, `3B` - Infield
- `SS` - Shortstop
- `LF`, `CF`, `RF` - Outfield

**Jersey Number:** 0-99

### Stat Allocation

#### `updateStat(statName, value)`
Update a single stat (validates point budget).

```javascript
try {
    creator.updateStat('power', 85);
    creator.updateStat('contact', 50);
} catch (error) {
    console.error('Stat update failed:', error.message);
}
```

**Available Stats:**
- `power` - Home run hitting (1-90)
- `contact` - Batting average (1-90)
- `speed` - Running/stealing (1-90)
- `defense` - Fielding ability (1-90)
- `arm` - Throwing power (1-90)
- `accuracy` - Throwing precision (1-90)

**Constraints:**
- Total points: 200 (must use all)
- Min per stat: 1
- Max per stat: 90

#### `getRemainingPoints()`
Get unallocated stat points.

```javascript
const remaining = creator.getRemainingPoints();
console.log(`${remaining} points left`);
```

#### `autoDistributePoints()`
Automatically distribute remaining points evenly.

```javascript
creator.autoDistributePoints();
// Fills all stats equally with remaining points
```

### Appearance Customization

#### `updateAppearance(option, value)`
Update appearance options.

```javascript
creator.updateAppearance('skinTone', 'medium');
creator.updateAppearance('jerseyColor', 'blue');
creator.updateAppearance('battingStance', 'power');
creator.updateAppearance('pitchingMotion', 'overhand');
```

**Appearance Options:**

| Option | Values |
|--------|--------|
| `skinTone` | `light`, `medium`, `tan`, `dark` |
| `jerseyColor` | `red`, `blue`, `green`, `orange`, `purple`, `yellow`, `black`, `white` |
| `battingStance` | `standard`, `power`, `contact`, `crouch`, `open`, `closed` |
| `pitchingMotion` | `overhand`, `three-quarter`, `sidearm`, `submarine`, `windup`, `stretch` |

### Abilities

#### `addAbility(abilityId)`
Add a special ability to the character (max 3, max 1 ultimate).

```javascript
try {
    creator.addAbility('power_surge');     // Common
    creator.addAbility('clutch_gene');     // Rare
    creator.addAbility('home_run_king');   // Ultimate
} catch (error) {
    console.error('Cannot add ability:', error.message);
}
```

#### `removeAbility(abilityId)`
Remove an ability from the character.

```javascript
creator.removeAbility('power_surge');
```

#### `getAvailableAbilities(category)`
Get available abilities by category.

```javascript
const battingAbilities = creator.getAvailableAbilities('batting');
const allAbilities = creator.getAvailableAbilities(); // All categories
```

**Ability Categories:**
- `batting` - Hitting abilities
- `fielding` - Defensive abilities
- `pitching` - Pitching abilities
- `baserunning` - Speed/stealing abilities

**Ability Tiers:**
- `common` - Standard abilities
- `rare` - Powerful abilities
- `ultimate` - Game-changing abilities (max 1 per character)

### Validation

#### `validateCharacter()`
Check if character is ready to save.

```javascript
const validation = creator.validateCharacter();

if (validation.valid) {
    creator.saveCharacter();
} else {
    console.error('Validation errors:', validation.errors);
    // ["Character must have a name", "Must allocate all 200 stat points"]
}
```

### Presets

#### `createPreset(presetType)`
Load a preset character template.

```javascript
creator.createPreset('powerHitter');
// Character is now loaded with preset stats and abilities
```

**Available Presets:**

| Preset | Focus | Stats | Abilities |
|--------|-------|-------|-----------|
| `powerHitter` | Home runs | Power 85, Contact 40 | Power Surge, Home Run King, Rally Starter |
| `contactHitter` | Batting avg | Contact 85, Power 20 | Contact Master, Eagle Eye, Hot Streak |
| `speedster` | Base stealing | Speed 85, Contact 40 | Speed Demon, Steal Master, Aggressive Runner |
| `ace` | Pitching | Arm 85, Accuracy 40 | Ace Mode, Strikeout King, Closer Mentality |
| `goldGlove` | Defense | Defense 85, Speed 40 | Magnet Glove, Quick Hands, Wall Climb |
| `balanced` | All-around | All stats 30-35 | Clutch Gene, Hot Streak, Rally Starter |

### Import/Export

#### `exportCharacter(characterId)`
Export character as JSON string.

```javascript
const json = creator.exportCharacter('custom_123'); // Specific character
const json = creator.exportCharacter(); // Current character
```

#### `importCharacter(jsonString)`
Import character from JSON.

```javascript
const jsonData = '{"name":"Imported Player",...}';

try {
    const character = creator.importCharacter(jsonData);
    console.log('Imported:', character.name);
} catch (error) {
    console.error('Import failed:', error.message);
}
```

### Events

#### `on(event, callback)`
Register event listener.

```javascript
creator.on('character_saved', (event, character) => {
    console.log('Saved:', character.name);
});

creator.on('stat_updated', (event, data) => {
    console.log(`${data.stat} = ${data.value}, Total: ${data.total}`);
});

creator.on('*', (event, data) => {
    console.log('Any event:', event, data);
});
```

**Available Events:**
- `character_reset` - New character started
- `character_loaded` - Character loaded for editing
- `basic_info_updated` - Name/position/number changed
- `stat_updated` - Stat value changed
- `stats_auto_distributed` - Auto-fill used
- `appearance_updated` - Appearance option changed
- `ability_added` - Ability added
- `ability_removed` - Ability removed
- `preset_loaded` - Preset template loaded
- `character_saved` - Character saved successfully
- `character_deleted` - Character deleted

#### `off(event, callback)`
Unregister event listener.

```javascript
const handler = (event, data) => console.log(data);
creator.on('character_saved', handler);
creator.off('character_saved', handler);
```

---

## UI Integration

### CharacterCreatorScreen

The main UI for creating/editing characters.

```javascript
// Register with UI manager
uiManager.registerScreen('character-creator',
    () => new CharacterCreatorScreen(uiManager, characterCreator)
);

// Show creator (new character)
uiManager.showScreen('character-creator');

// Show creator (edit existing)
uiManager.showScreen('character-creator', {
    characterId: 'custom_123'
});
```

**Features:**
- 4-step wizard (Basic Info → Stats → Appearance → Abilities)
- Real-time preview with overall rating
- Progress tracking
- Validation feedback
- Preset selector
- Keyboard navigation

### SavedCharactersScreen

Browse and manage saved characters.

```javascript
uiManager.registerScreen('saved-characters',
    () => new SavedCharactersScreen(uiManager, characterCreator)
);

uiManager.showScreen('saved-characters');
```

**Features:**
- Grid view of all characters
- Edit/Delete/Export actions
- Character cards with stats
- Empty state with quick create

---

## Character Manager Integration

The `CharacterManager` has been extended to support custom characters.

### Initialization

```javascript
const characterManager = new CharacterManager(gameStateManager);
await characterManager.loadRoster(); // Loads default + custom characters
```

### Methods

#### `getCustomCharacters()`
Get only custom-created characters.

```javascript
const customChars = characterManager.getCustomCharacters();
console.log(`${customChars.length} custom characters`);
```

#### `refreshCustomCharacters()`
Reload custom characters from game state (call after creating/deleting).

```javascript
characterCreator.saveCharacter();
characterManager.refreshCustomCharacters(); // Updates roster
```

### Custom Character Format

Custom characters are automatically converted from creator format (1-99 stats) to roster format (1-10 stats):

```javascript
// Creator format
{
    id: 'custom_123',
    name: 'Lightning Joe',
    stats: {
        power: 85,      // 1-99 scale
        contact: 50,
        speed: 30,
        defense: 25,
        arm: 15,
        accuracy: 10
    }
}

// Converted to roster format
{
    id: 'custom_123',
    name: 'Lightning Joe',
    stats: {
        power: 8,       // 1-10 scale
        batting: 5,
        speed: 3,
        fielding: 2,
        pitching: 1
    },
    custom: true        // Marked as custom
}
```

---

## Stat System

### Stat Budget

- **Total Points:** 200
- **Min per stat:** 1
- **Max per stat:** 90
- **Must allocate all points** before saving

### Stat Effects

Each stat affects gameplay differently:

| Stat | Effect | Game Impact |
|------|--------|-------------|
| **Power** | Home run distance | Higher = more home runs |
| **Contact** | Hit frequency | Higher = more base hits |
| **Speed** | Running speed | Higher = steal bases, beat throws |
| **Defense** | Catch probability | Higher = catch difficult balls |
| **Arm** | Throw velocity | Higher = throw out runners |
| **Accuracy** | Throw precision | Higher = hit cutoff man |

### Derived Ratings

The system calculates composite ratings:

```javascript
const character = creator.getCharacter();
console.log(character.ratings);

// Output:
{
    batting: 62,      // (contact * 0.6 + power * 0.4)
    power: 85,        // Raw power stat
    fielding: 65,     // (defense * 0.7 + speed * 0.3)
    throwing: 45,     // (arm * 0.7 + accuracy * 0.3)
    baserunning: 30,  // Raw speed stat
    overall: 51       // Average of all stats
}
```

### Stat Strategies

**Power Hitter Build:**
```javascript
power: 85-90
contact: 40-50
speed: 20-30
defense: 20-30
arm: 10-20
accuracy: 10-20
```

**Contact Hitter Build:**
```javascript
power: 20-30
contact: 85-90
speed: 40-50
defense: 20-30
arm: 10-20
accuracy: 10-20
```

**Speedster Build:**
```javascript
power: 10-20
contact: 40-50
speed: 85-90
defense: 30-40
arm: 10-20
accuracy: 10-20
```

**Gold Glove Build:**
```javascript
power: 20-30
contact: 20-30
speed: 40-50
defense: 85-90
arm: 10-20
accuracy: 10-20
```

---

## Abilities System

### Ability Selection Rules

1. **Maximum 3 abilities** per character
2. **Maximum 1 ultimate** (tier: ultimate)
3. Abilities have **cooldowns** (innings between uses)

### Batting Abilities

| Ability | Tier | Effect | Cooldown |
|---------|------|--------|----------|
| Power Surge | Common | +20 Power for next at-bat | 3 innings |
| Eagle Eye | Common | See pitch types before thrown | 4 innings |
| Contact Master | Common | +30 Contact for 2 at-bats | 3 innings |
| Clutch Gene | Rare | +15 to all stats in pressure | 5 innings |
| Home Run King | **Ultimate** | Next hit = automatic HR | Once per game |
| Rally Starter | Rare | Guaranteed base hit | 4 innings |
| Hot Streak | Rare | +10 all batting stats for inning | 6 innings |

### Fielding Abilities

| Ability | Tier | Effect | Cooldown |
|---------|------|--------|----------|
| Magnet Glove | Rare | Auto-catch next ball in play | 5 innings |
| Rocket Arm | Common | +50% throw speed for inning | 4 innings |
| Quick Hands | Rare | Turn any double play | 6 innings |
| Wall Climb | **Ultimate** | Catch any home run ball | Once per game |
| Dive Master | Common | Extended diving range | 3 innings |

### Pitching Abilities

| Ability | Tier | Effect | Cooldown |
|---------|------|--------|----------|
| Ace Mode | Rare | +20 all pitch stats for inning | 5 innings |
| Strikeout King | Rare | Next 3 pitches are strikes | 4 innings |
| Movement Master | Common | +30 Break on pitches | 3 innings |
| Perfect Control | Rare | Perfect accuracy for inning | 6 innings |
| Closer Mentality | **Ultimate** | +25 all stats in 9th inning | Once per game |

### Base Running Abilities

| Ability | Tier | Effect | Cooldown |
|---------|------|--------|----------|
| Speed Demon | Common | +40 Speed when on base | 4 innings |
| Steal Master | Rare | Guaranteed stolen base | 5 innings |
| Aggressive Runner | Rare | Take extra base on all hits | 6 innings |

---

## Appearance Options

### Skin Tones

```javascript
creator.updateAppearance('skinTone', 'medium');
```

- `light` - Light skin tone (#FFE0BD)
- `medium` - Medium skin tone (#D4A574)
- `tan` - Tan skin tone (#C68642)
- `dark` - Dark skin tone (#8D5524)

### Jersey Colors

```javascript
creator.updateAppearance('jerseyColor', 'blue');
```

- `red`, `blue`, `green`, `orange`
- `purple`, `yellow`, `black`, `white`

### Batting Stances

```javascript
creator.updateAppearance('battingStance', 'power');
```

- `standard` - Balanced, all-around
- `power` - Wide stance, home run focus
- `contact` - Choked up, bat control
- `crouch` - Low stance, pitch selection
- `open` - Pull hitter stance
- `closed` - Opposite field stance

### Pitching Motions

```javascript
creator.updateAppearance('pitchingMotion', 'overhand');
```

- `overhand` - Classic over-the-top
- `three-quarter` - Most common motion
- `sidearm` - Low arm angle
- `submarine` - Extreme underhand
- `windup` - Traditional slow windup
- `stretch` - Quick delivery

---

## Preset Characters

Load pre-configured character templates:

```javascript
creator.createPreset('powerHitter');
```

### Preset Details

**Power Slugger** (`powerHitter`)
- Focus: Maximum home run hitting
- Position: RF/LF
- Stats: Power 85, Contact 40, Speed 25
- Abilities: Power Surge, Home Run King, Rally Starter
- Stance: Power

**Contact Specialist** (`contactHitter`)
- Focus: High batting average
- Position: 2B/CF
- Stats: Contact 85, Power 20, Speed 40
- Abilities: Contact Master, Eagle Eye, Hot Streak
- Stance: Contact

**Speed Demon** (`speedster`)
- Focus: Base stealing master
- Position: CF/LF
- Stats: Speed 85, Contact 40, Defense 30
- Abilities: Speed Demon, Steal Master, Aggressive Runner
- Stance: Crouch

**Ace Pitcher** (`ace`)
- Focus: Dominant pitching
- Position: P
- Stats: Arm 85, Accuracy 40
- Abilities: Ace Mode, Strikeout King, Closer Mentality
- Motion: Overhand

**Gold Glove** (`goldGlove`)
- Focus: Defensive excellence
- Position: SS/CF
- Stats: Defense 85, Speed 40
- Abilities: Magnet Glove, Quick Hands, Wall Climb
- Stance: Standard

**All-Arounder** (`balanced`)
- Focus: Well-rounded player
- Position: Any
- Stats: Balanced across all (30-35 each)
- Abilities: Clutch Gene, Hot Streak, Rally Starter
- Stance: Standard

---

## Import/Export

### Export Character

```javascript
// Export current character
const json = creator.exportCharacter();

// Export saved character
const json = creator.exportCharacter('custom_123');

// Download as file
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-character.json';
a.click();
```

### Import Character

```javascript
// From JSON string
const json = '{"id":"custom_123","name":"Imported",...}';
creator.importCharacter(json);

// From file upload
document.querySelector('#file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        try {
            creator.importCharacter(event.target.result);
            console.log('Character imported!');
        } catch (error) {
            console.error('Import failed:', error);
        }
    };

    reader.readAsText(file);
});
```

### Character JSON Format

```json
{
    "id": "custom_1234567890_abc123",
    "name": "Lightning Joe",
    "position": "CF",
    "jerseyNumber": 42,
    "stats": {
        "power": 85,
        "contact": 50,
        "speed": 30,
        "defense": 25,
        "arm": 15,
        "accuracy": 10
    },
    "appearance": {
        "skinTone": "medium",
        "jerseyColor": "blue",
        "battingStance": "power",
        "pitchingMotion": "three-quarter"
    },
    "abilities": [
        {
            "id": "power_surge",
            "name": "Power Surge",
            "description": "+20 Power for next at-bat",
            "cooldown": 3,
            "tier": "common"
        }
    ],
    "ratings": {
        "batting": 62,
        "power": 85,
        "fielding": 65,
        "throwing": 45,
        "baserunning": 30,
        "overall": 51
    },
    "custom": true,
    "createdAt": 1703001234567
}
```

---

## Examples

### Example 1: Create Power Hitter

```javascript
// Start new character
creator.startNewCharacter();

// Set basic info
creator.updateBasicInfo({
    name: 'Bash Rodriguez',
    position: 'RF',
    jerseyNumber: 44
});

// Allocate stats
creator.updateStat('power', 90);
creator.updateStat('contact', 45);
creator.updateStat('speed', 25);
creator.updateStat('defense', 20);
creator.updateStat('arm', 10);
creator.updateStat('accuracy', 10);

// Set appearance
creator.updateAppearance('skinTone', 'tan');
creator.updateAppearance('jerseyColor', 'red');
creator.updateAppearance('battingStance', 'power');

// Add abilities
creator.addAbility('power_surge');
creator.addAbility('clutch_gene');
creator.addAbility('home_run_king');

// Save
const character = creator.saveCharacter();
console.log('Created:', character);
```

### Example 2: Use Preset and Customize

```javascript
// Load preset
creator.createPreset('speedster');

// Customize name and number
creator.updateBasicInfo({
    name: 'Flash Gordon',
    jerseyNumber: 99
});

// Adjust appearance
creator.updateAppearance('jerseyColor', 'yellow');

// Save
creator.saveCharacter();
```

### Example 3: Event-Driven Character Creation

```javascript
// Listen to stat updates
creator.on('stat_updated', (event, data) => {
    const remaining = creator.getRemainingPoints();
    document.getElementById('points').textContent = remaining;

    if (remaining < 0) {
        alert('Too many points allocated!');
    }
});

// Listen to ability changes
creator.on('ability_added', (event, ability) => {
    console.log(`Added: ${ability.name}`);
});

// Listen to save
creator.on('character_saved', (event, character) => {
    alert(`${character.name} saved!`);
    // Refresh character manager
    characterManager.refreshCustomCharacters();
});
```

### Example 4: Validate Before Save

```javascript
function createCharacter() {
    // Check validation
    const validation = creator.validateCharacter();

    if (!validation.valid) {
        alert('Cannot save:\n' + validation.errors.join('\n'));
        return;
    }

    try {
        const character = creator.saveCharacter();
        console.log('Success!', character);
    } catch (error) {
        console.error('Save failed:', error);
    }
}
```

### Example 5: Character Gallery

```javascript
function showCharacterGallery() {
    const characters = creator.getSavedCharacters();

    const html = characters.map(char => `
        <div class="char-card">
            <h3>${char.name} #${char.jerseyNumber}</h3>
            <p>Position: ${char.position}</p>
            <p>Overall: ${char.ratings.overall}</p>
            <button onclick="editCharacter('${char.id}')">Edit</button>
            <button onclick="deleteCharacter('${char.id}')">Delete</button>
        </div>
    `).join('');

    document.getElementById('gallery').innerHTML = html;
}

function editCharacter(id) {
    const characters = creator.getSavedCharacters();
    const char = characters.find(c => c.id === id);
    creator.loadCharacter(char);
    uiManager.showScreen('character-creator');
}

function deleteCharacter(id) {
    if (confirm('Delete this character?')) {
        creator.deleteCharacter(id);
        showCharacterGallery();
    }
}
```

---

## Troubleshooting

### "Stat update failed: Total stat points cannot exceed 200"

You've allocated more than 200 total points. Decrease other stats first.

```javascript
const total = creator.calculateTotalPoints();
const remaining = creator.getRemainingPoints();
console.log(`Total: ${total}, Remaining: ${remaining}`);
```

### "Character validation failed: Must allocate all 200 stat points"

You haven't used all 200 points. Use `autoDistributePoints()` or manually allocate:

```javascript
creator.autoDistributePoints(); // Auto-fill remaining
```

### "Character can only have 3 abilities"

Remove an ability before adding another:

```javascript
creator.removeAbility('power_surge');
creator.addAbility('clutch_gene');
```

### "Character can only have one ultimate ability"

Remove the existing ultimate before adding another:

```javascript
const char = creator.getCharacter();
const ultimate = char.abilities.find(a => a.tier === 'ultimate');
creator.removeAbility(ultimate.id);
```

### Custom characters not appearing in game

Refresh the character manager after creating characters:

```javascript
characterCreator.on('character_saved', () => {
    characterManager.refreshCustomCharacters();
});
```

### Stats seem too low/high in game

Custom characters use 1-99 scale, but are auto-converted to 1-10 scale:

```javascript
// Creator: power = 85 (out of 99)
// Game: power = 8.5 (out of 10)
```

### Lost characters after clearing browser data

Export your characters as JSON backups:

```javascript
// Export all characters
const characters = creator.getSavedCharacters();
characters.forEach(char => {
    const json = creator.exportCharacter(char.id);
    // Save json to file
});
```

### Import fails with "Invalid character data structure"

Ensure JSON has required fields:

```javascript
{
    "name": "Required",
    "stats": { /* required */ },
    "appearance": { /* required */ }
}
```

---

## Advanced Topics

### Custom Validation Rules

```javascript
// Add custom validation
const originalValidate = creator.validateCharacter.bind(creator);
creator.validateCharacter = function() {
    const result = originalValidate();

    // Add custom rule: names must be > 3 characters
    if (this.currentCharacter.name.length < 3) {
        result.valid = false;
        result.errors.push('Name must be at least 3 characters');
    }

    return result;
};
```

### Bulk Character Import

```javascript
async function importTeam(jsonArray) {
    const imported = [];

    for (const json of jsonArray) {
        try {
            const char = creator.importCharacter(json);
            creator.saveCharacter();
            imported.push(char);
        } catch (error) {
            console.error('Failed to import:', error);
        }
    }

    return imported;
}
```

### Character Templates

```javascript
const templates = {
    rookie: { /* stat allocations */ },
    veteran: { /* stat allocations */ },
    allStar: { /* stat allocations */ }
};

function applyTemplate(templateName) {
    const template = templates[templateName];
    Object.entries(template.stats).forEach(([stat, value]) => {
        creator.updateStat(stat, value);
    });
}
```

---

## Best Practices

1. **Always validate before saving**
   ```javascript
   const validation = creator.validateCharacter();
   if (validation.valid) creator.saveCharacter();
   ```

2. **Listen to events for UI updates**
   ```javascript
   creator.on('*', () => updateUI());
   ```

3. **Refresh character manager after saves**
   ```javascript
   creator.on('character_saved', () => {
       characterManager.refreshCustomCharacters();
   });
   ```

4. **Export backups regularly**
   ```javascript
   setInterval(() => {
       const chars = creator.getSavedCharacters();
       localStorage.setItem('backup', JSON.stringify(chars));
   }, 60000); // Every minute
   ```

5. **Use presets as starting points**
   ```javascript
   creator.createPreset('balanced');
   // Then customize from there
   ```

---

## Version History

**v1.0.0** (2025-01-23)
- Initial release
- 6 stat attributes with 200-point budget
- 30+ special abilities across 4 categories
- 6 preset character templates
- Full UI integration
- Import/export functionality

---

## Support

For questions or issues:
- Check the [demo page](examples/character-creator-demo.html)
- Review [UI System README](UI-SYSTEM-README.md)
- See [main documentation](README.md)

---

**Happy Character Creating!** ⚾
