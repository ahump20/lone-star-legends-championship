# Advanced Game Features Guide

Complete guide to the advanced gameplay features in Sandlot Superstars.

## Features Overview

✅ **Weather System** - Dynamic conditions affect gameplay  
✅ **Pitcher Fatigue** - Realistic stamina and performance degradation  
✅ **Injury System** - Player injuries with recovery times  
✅ **Manager Decisions** - Strategic gameplay choices  
✅ **Difficulty Modes** - 4 difficulty levels with adaptive AI  

---

## Weather System

### Quick Start

```javascript
const weatherSystem = new WeatherSystem({
    enabled: true,
    changeInterval: 300000 // 5 minutes
});

// Set specific weather
weatherSystem.setWeather('rainy');

// Get weather effects
const effects = weatherSystem.getVisualEffects();
```

### Weather Types

| Weather | Wind | Visibility | Effects |
|---------|------|------------|---------|
| ☀️ **Sunny** | Low (0.3) | 100% | Perfect conditions |
| ⛅ **Partly Cloudy** | Medium (0.5) | 95% | Slightly harder catches |
| ☁️ **Cloudy** | Medium (0.7) | 85% | Reduced visibility |
| 💨 **Windy** | High (2.5) | 90% | Ball trajectory affected |
| 🌧️ **Rainy** | Medium (1.0) | 70% | Slippery, hard catches |
| 🌫️ **Foggy** | Low (0.2) | 50% | Very limited visibility |

### Gameplay Impact

```javascript
// Apply weather to ball
weatherSystem.applyWeatherToBall(ball);

// Get difficulty modifiers
const catchDifficulty = weatherSystem.getCatchDifficulty(); // 1.0-1.8x
const pitchAccuracy = weatherSystem.getPitchAccuracyModifier(); // 0.7-1.0x

// Check for slip (rain only)
if (weatherSystem.checkSlip()) {
    console.log('Player slipped!');
}
```

---

## Pitcher Fatigue

### Setup

```javascript
const fatigueSystem = new PitcherFatigueSystem();

// Register pitcher
fatigueSystem.registerPitcher('pitcher1', {
    name: 'Ace Johnson',
    velocity: 95,
    control: 0.85,
    movement: 0.75
});
```

### Tracking Fatigue

```javascript
// Record each pitch
fatigueSystem.recordPitch('pitcher1', 'fastball'); // 2.0 stamina drain
fatigueSystem.recordPitch('pitcher1', 'curveball'); // 2.5 stamina drain

// Get pitcher stats
const stats = fatigueSystem.getPitcherStats('pitcher1');
// {
//   stamina: 85,
//   fatigueLevel: 'normal', // fresh, normal, tired, fatigued, exhausted
//   pitchCount: 45,
//   performance: { velocity: 93, control: 83, movement: 74 }
// }
```

### Fatigue Levels

| Level | Stamina | Performance | Injury Risk |
|-------|---------|-------------|-------------|
| Fresh | 80-100% | 100% | 0.1% |
| Normal | 60-80% | 90-100% | 0.5% |
| Tired | 40-60% | 75-90% | 1.5% |
| Fatigued | 20-40% | 60-75% | 3.5% |
| Exhausted | 0-20% | 50-60% | 8.0% |

### Manager Recommendations

```javascript
const recommendations = fatigueSystem.getRecommendation('pitcher1');
// [
//   { priority: 'high', action: 'warmUpBullpen', message: '...' },
//   { priority: 'medium', action: 'monitor', message: '...' }
// ]

// Check if should pull
if (fatigueSystem.shouldPullPitcher('pitcher1')) {
    console.log('Pull pitcher!');
}
```

---

## Injury System

### Types of Injuries

**Minor** (1-2 games)
- Bruised Leg
- Muscle Cramp
- General Soreness

**Moderate** (5-14 games)
- Pulled Hamstring
- Ankle Sprain
- Concussion

**Severe** (60-120 games)
- Fractured Bone
- Torn Ligament

### Usage

```javascript
const injurySystem = new InjurySystem();

// Check for injury on action
if (injurySystem.checkInjury('player1', 'sliding')) {
    console.log('Player injured sliding!');
}

// Get injury status
const status = injurySystem.getInjuryStatus('player1');
// {
//   injured: true,
//   injuries: [{ name: 'Ankle Sprain', gamesRemaining: 7 }],
//   effectMultiplier: 0.7 // 30% reduced performance
// }

// Heal over time
injurySystem.healPlayer('player1', 3); // 3 games rest
```

---

## Manager Decisions

### Strategic Options

#### Bunting
```javascript
managerDecisions.requestBunt(batterId);
// Success based on: contact skill, defense position, pitch control
```

#### Stealing
```javascript
managerDecisions.requestSteal(runnerId, 'second');
// Success based on: runner speed, pitcher move, catcher arm
```

#### Hit and Run
```javascript
managerDecisions.requestHitAndRun();
// Runner goes, batter must make contact
```

#### Pitchout
```javascript
managerDecisions.requestPitchout();
// Better chance to throw out stealer
```

#### Intentional Walk
```javascript
managerDecisions.requestIntentionalWalk(batterId);
```

#### Defensive Shift
```javascript
managerDecisions.requestDefensiveShift('pull'); // or 'spray', 'noDoublesDefense'
```

#### Substitutions
```javascript
managerDecisions.requestPinchHitter(originalId, pinchHitterId);
managerDecisions.requestPitchingChange(relieverId);
```

### Decision Statistics

```javascript
const stats = managerDecisions.getDecisionStats();
// {
//   total: 15,
//   byType: { bunt: 3, steal: 5, hitAndRun: 2 },
//   successRate: { bunt: { successes: 2, attempts: 3, percentage: 67 } }
// }
```

---

## Difficulty Modes

### Difficulty Levels

| Level | Description | Modifiers |
|-------|-------------|-----------|
| **Rookie** | Easy for beginners | Player: +30% batting, +20% pitching<br>CPU: -30% batting, -20% pitching |
| **Pro** | Balanced gameplay | All stats 1.0x (normal) |
| **All-Star** | Challenging | Player: -15% batting, -10% pitching<br>CPU: +15% batting, +10% pitching |
| **Legend** | Maximum difficulty | Player: -30% batting, -20% pitching<br>CPU: +30% batting, +25% pitching |

### Setup

```javascript
const difficulty = new DifficultySystem({
    difficulty: 'pro',
    adaptive: true // Auto-adjust based on performance
});

// Set difficulty
difficulty.setDifficulty('allStar');

// Get modifiers
const modifiers = difficulty.getModifiers();
// {
//   playerBatting: 0.85,
//   cpuBatting: 1.15,
//   pitchSpeed: 1.15,
//   aiAggressiveness: 0.7
// }
```

### Adaptive Difficulty

Automatically adjusts based on player performance:

- **Win Rate > 75%** → Increase difficulty
- **Win Rate < 30%** → Decrease difficulty

```javascript
// After each game
difficulty.updatePerformance({
    won: true,
    runsScored: 5,
    runsAllowed: 2,
    battingAverage: 0.285
});

// View performance
const summary = difficulty.getPerformanceSummary();
// {
//   gamesPlayed: 10,
//   wins: 7,
//   winRate: 0.700,
//   recentWinRate: 0.800
// }
```

---

## Integration Example

```javascript
// Initialize all systems
const weatherSystem = new WeatherSystem();
const fatigueSystem = new PitcherFatigueSystem();
const injurySystem = new InjurySystem();
const managerDecisions = new ManagerDecisions(gameEngine);
const difficulty = new DifficultySystem({ difficulty: 'pro' });

// Listen to events
weatherSystem.on('weatherChanged', (event, weather) => {
    console.log(`Weather: ${weather.name}`);
    showWeatherNotification(weather);
});

fatigueSystem.on('injuryOccurred', (event, data) => {
    console.log(`${data.pitcher} injured: ${data.injury.name}`);
    showInjuryAlert(data);
});

managerDecisions.on('decisionMade', (event, decision) => {
    console.log(`Decision: ${decision.type}`);
    updateDecisionLog(decision);
});

// Game loop
function updateGame(deltaTime) {
    // Update weather
    weatherSystem.update(deltaTime);
    
    // Apply weather to ball
    if (ball.inFlight) {
        weatherSystem.applyWeatherToBall(ball);
    }
    
    // Apply difficulty modifiers
    const mods = difficulty.getModifiers();
    player.battingPower *= mods.playerBatting;
    cpu.battingPower *= mods.cpuBatting;
    
    // Check pitcher fatigue
    if (shouldThrowPitch) {
        fatigueSystem.recordPitch(currentPitcherId, pitchType);
        
        const stats = fatigueSystem.getPitcherStats(currentPitcherId);
        if (stats.fatigueLevel === 'exhausted') {
            showPitcherTiredWarning();
        }
    }
    
    // Check for injuries on actions
    if (playerSliding) {
        injurySystem.checkInjury(playerId, 'sliding');
    }
    
    // AI manager decisions
    if (cpuTurn && highLeverageSituation) {
        const decision = aiManager.makeDecision(situation);
        if (decision) {
            executeDecision(decision);
        }
    }
}

// After game
difficulty.updatePerformance(gameStats);
fatigueSystem.healPitcher(pitcherId, 1);
injurySystem.healPlayer(playerId, 1);
```

---

## Best Practices

### Weather
- Enable weather for realistic gameplay
- Check effects before applying modifiers
- Use visual renderer for immersive experience

### Pitcher Fatigue
- Monitor stamina constantly
- Pull pitcher when exhausted
- Track pitch count (limit ~100-120)
- Rest pitchers between games

### Injuries
- Higher risk with fatigued players
- Check injuries after slides/collisions
- Track recovery time
- Adjust lineup for injured players

### Manager Decisions
- Bunt early innings, runner on first
- Steal with fast runners, < 2 outs
- Hit-and-run with good contact hitter
- Change pitcher in high leverage
- Use pinch hitters late game

### Difficulty
- Start on Pro for balanced experience
- Enable adaptive for automatic adjustment
- Monitor win rate (target 50-60%)
- Adjust manually if needed

---

## Files

```
js/
├── weather-system.js           # Weather & visual effects
├── pitcher-fatigue.js          # Pitcher stamina & injuries
└── manager-decisions.js        # Strategy & difficulty
```

---

For working examples, see the demo pages in `examples/` directory.
