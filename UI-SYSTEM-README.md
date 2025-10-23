# 🎨 Sandlot Superstars UI System

Complete UI system with menus, achievements, statistics, and game mode interfaces.

---

## 📦 What's Included

### **Core UI Components**
- ✅ **UI Manager** - Central controller for all UI elements
- ✅ **Main Menu** - Beautiful game launcher with 9 menu options
- ✅ **Achievement System UI** - Gallery with progress tracking
- ✅ **Statistics Dashboard** - Career stats and records
- ✅ **Settings Panel** - Audio, gameplay, graphics, and data management
- ✅ **Notification System** - Toast notifications and achievement unlocks
- ✅ **Modal Dialogs** - Confirm dialogs and alerts

### **Game Mode UIs**
- ✅ **Home Run Derby HUD** - Live stats, timer, combo display
- ✅ **Season Dashboard** - Standings, schedule, team stats
- ✅ **Derby Results Screen** - Final stats and leaderboard
- ✅ **Game Mode Selection** - Easy navigation between modes

---

## 🚀 Quick Start

### **1. Include Files**

```html
<!-- CSS -->
<link rel="stylesheet" href="/css/ui-manager.css">
<link rel="stylesheet" href="/css/ui-game-modes.css">

<!-- Core Systems -->
<script src="/js/game-state-manager.js"></script>
<script src="/js/achievement-system.js"></script>
<script src="/js/game-modes.js"></script>
<script src="/js/analytics-manager.js"></script>

<!-- UI System -->
<script src="/js/ui-manager.js"></script>
<script src="/js/ui-screens.js"></script>
<script src="/js/ui-game-modes.js"></script>
```

### **2. Initialize**

```javascript
// Initialize core systems
window.gameStateManager = new GameStateManager();
window.achievementSystem = new AchievementSystem(gameStateManager);
window.analytics = new AnalyticsManager({ enabled: true });
window.gameModesManager = new GameModesManager();

// Initialize UI
window.uiManager = new UIManager();

// Register screens
uiManager.registerScreen('main-menu', MainMenuScreen);
uiManager.registerScreen('achievements', AchievementsScreen);
uiManager.registerScreen('statistics', StatisticsScreen);
uiManager.registerScreen('settings', SettingsScreen);
uiManager.registerScreen('derby-screen', DerbyScreen);
uiManager.registerScreen('season-screen', SeasonDashboardScreen);

// Show main menu
uiManager.showScreen('main-menu');
```

### **3. Setup Achievement Notifications**

```javascript
achievementSystem.onAchievementUnlocked((achievement) => {
    uiManager.showAchievement(achievement);
    analytics.trackEvent('achievement_unlocked', {
        achievementId: achievement.id
    });
});
```

---

## 📖 API Documentation

### **UIManager**

#### **Core Methods**

```javascript
// Show a screen
uiManager.showScreen('main-menu', options);

// Show notification
uiManager.showNotification({
    type: 'success', // 'success', 'error', 'info', 'achievement'
    title: 'Success!',
    message: 'Game saved',
    duration: 5000
});

// Show achievement notification
uiManager.showAchievement(achievement);

// Show modal dialog
uiManager.showModal({
    title: 'Confirm',
    content: 'Are you sure?',
    buttons: [
        { text: 'Cancel', class: 'btn-secondary', onClick: () => {} },
        { text: 'OK', class: 'btn-primary', onClick: () => {} }
    ]
});

// Show confirm dialog (returns Promise)
const confirmed = await uiManager.confirm('Delete this save?', {
    title: 'Confirm Delete',
    confirmText: 'Delete',
    cancelText: 'Cancel'
});

// Show/hide loading
uiManager.showLoading('Loading...');
uiManager.hideLoading();

// Utility messages
uiManager.showSuccess('Saved!');
uiManager.showError('Failed to load');
```

#### **Registering Custom Screens**

```javascript
class MyCustomScreen extends BaseScreen {
    create() {
        const screen = document.createElement('div');
        screen.className = 'screen my-screen';
        screen.innerHTML = `<h1>My Screen</h1>`;
        return screen;
    }

    onShow(options) {
        console.log('Screen shown with options:', options);
    }

    onHide() {
        console.log('Screen hidden');
    }
}

uiManager.registerScreen('my-screen', MyCustomScreen);
uiManager.showScreen('my-screen', { foo: 'bar' });
```

---

## 🎮 Screen Guides

### **Main Menu Screen**

Automatically shows:
- ✅ Continue button (if saved game exists)
- ✅ All game modes
- ✅ Achievements, Statistics, Settings
- ✅ Quick stats (games played, win rate, home runs)

```javascript
uiManager.showScreen('main-menu');
```

### **Achievements Screen**

Features:
- Filter by category (All, Milestone, Hitting, Winning, etc.)
- Shows locked achievements as `???`
- Progress bar (unlocked/total)
- Points earned
- Unlock dates

```javascript
uiManager.showScreen('achievements');
```

### **Statistics Screen**

Shows:
- **Overview:** Games, wins, losses, win rate
- **Batting:** Hits, home runs, batting average
- **Records:** Highest score, most HRs in game
- **Usage:** Favorite character, play time

```javascript
uiManager.showScreen('statistics');
```

### **Settings Screen**

Options:
- **Audio:** Master volume, music, SFX
- **Gameplay:** Difficulty, auto-save, tutorials
- **Graphics:** Quality, visual effects
- **Data:** Export, import, reset data

```javascript
uiManager.showScreen('settings');
```

### **Home Run Derby Screen**

HUD Elements:
- Time remaining (countdown timer)
- Outs (X/10)
- Home runs count
- Score (with combos)
- Pause/Quit buttons

```javascript
uiManager.showScreen('derby-screen', {
    player: selectedPlayer,
    stadium: 'sunny_park'
});
```

### **Season Dashboard Screen**

Shows:
- **Standings:** Full league table with W-L, win%, run diff
- **Schedule:** Next game, upcoming games
- **Team Card:** Your team stats and streak
- **Actions:** Play next game, simulate

```javascript
uiManager.showScreen('season-screen');
```

---

## 🎨 Customizing Styles

### **CSS Variables**

```css
:root {
    --color-primary: #FF6B35;      /* Main brand color */
    --color-secondary: #0A0E27;     /* Dark background */
    --color-accent: #FFD700;        /* Highlights (gold) */
    --color-success: #00C853;       /* Success messages */
    --color-error: #FF1744;         /* Error messages */
    --border-radius: 10px;          /* Border radius */
    --transition: all 0.3s;         /* Transitions */
}
```

### **Custom Button Styles**

```css
.btn-custom {
    background: linear-gradient(135deg, #FF1493 0%, #8B008B 100%);
    /* ... */
}
```

### **Override Notification Styles**

```css
.notification-achievement {
    border-color: #00FF00;
    /* ... */
}
```

---

## 💡 Usage Examples

### **Example 1: Show Achievement After Game**

```javascript
function onGameEnd(gameResult) {
    // Update stats
    gameStateManager.updateStatistics({
        wins: gameResult.won ? 1 : 0,
        totalHits: gameResult.hits,
        totalHomeRuns: gameResult.homeRuns
    });

    // Check achievements
    const stats = gameStateManager.getStatistics();
    const newAchievements = achievementSystem.checkAchievements(stats);

    // Will automatically show notifications via event listener
}
```

### **Example 2: Home Run Derby Integration**

```javascript
// Start derby
gameModesManager.startHomeRunDerby(player, stadium);
uiManager.showScreen('derby-screen', { player, stadium });

// Update HUD on each hit
function onHit(result) {
    const derby = gameModesManager.processHomeRunDerbyHit(result);

    // Update UI via DerbyScreen.updateStats()
    const derbyScreen = uiManager.screens['derby-screen'];
    if (derbyScreen) {
        derbyScreen.updateStats();
    }
}

// When time expires
const results = gameModesManager.endHomeRunDerby();
// DerbyScreen automatically shows results panel
```

### **Example 3: Saving with Confirmation**

```javascript
async function saveGame() {
    const confirmed = await uiManager.confirm(
        'Overwrite existing save?',
        {
            title: 'Save Game',
            confirmText: 'Save',
            cancelText: 'Cancel'
        }
    );

    if (confirmed) {
        gameStateManager.saveGame(currentGameState);
        uiManager.showSuccess('Game saved!');
        analytics.trackEvent('game_saved');
    }
}
```

### **Example 4: Settings Integration**

```javascript
// Settings are automatically saved by SettingsScreen
// To apply settings elsewhere:

const settings = gameStateManager.settings;

// Apply volume
if (audioManager) {
    audioManager.setVolume(settings.volume);
    audioManager.musicEnabled = settings.musicEnabled;
    audioManager.sfxEnabled = settings.sfxEnabled;
}

// Apply graphics
if (visualEffectsManager) {
    if (settings.graphics === 'low') {
        visualEffectsManager.disable();
    } else {
        visualEffectsManager.enable();
    }
}
```

---

## 🔧 Advanced Features

### **Custom Notifications**

```javascript
uiManager.showNotification({
    type: 'custom',
    icon: '🎉',
    title: 'Milestone Reached!',
    message: '100 games played!',
    duration: 8000
});
```

### **Modal with Custom Content**

```javascript
uiManager.showModal({
    title: 'Choose Difficulty',
    content: `
        <div class="difficulty-selector">
            <button onclick="selectDifficulty('easy')">Easy</button>
            <button onclick="selectDifficulty('medium')">Medium</button>
            <button onclick="selectDifficulty('hard')">Hard</button>
        </div>
    `,
    buttons: [] // No footer buttons
});
```

### **Progress Bars in Notifications**

```javascript
// Show loading notification
const loadingNotif = uiManager.showNotification({
    type: 'info',
    title: 'Loading Assets',
    message: '<div class="progress-bar"><div class="progress" style="width: 0%"></div></div>',
    duration: 99999 // Keep until manually closed
});

// Update progress
function updateProgress(percent) {
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }

    if (percent >= 100) {
        loadingNotif.hide();
    }
}
```

---

## 📱 Responsive Design

The UI system is fully responsive:

### **Desktop (>1024px)**
- Two-column layouts for season dashboard
- Full stats grids
- Large buttons and text

### **Tablet (768px - 1024px)**
- Single column layouts
- Simplified standings table
- Adjusted font sizes

### **Mobile (<768px)**
- Stacked layouts
- Simplified stats
- Touch-optimized buttons
- Full-screen notifications

---

## 🎯 Best Practices

### **1. Always Initialize in Order**

```javascript
// ✅ Correct order
gameStateManager → achievementSystem → analytics → uiManager

// ❌ Wrong
uiManager first (won't have access to systems)
```

### **2. Register Achievement Listener**

```javascript
// ✅ Always set up listener
achievementSystem.onAchievementUnlocked((achievement) => {
    uiManager.showAchievement(achievement);
});

// ❌ Without listener, achievements unlock silently
```

### **3. Save Before Showing Modals**

```javascript
// ✅ Save first
gameStateManager.saveGame(state);
await uiManager.confirm('Quit game?');

// ❌ User might lose progress if they quit
```

### **4. Use Async/Await for Confirms**

```javascript
// ✅ Async/await pattern
const confirmed = await uiManager.confirm('Delete?');
if (confirmed) { /* ... */ }

// ❌ Promise then/catch (works but verbose)
uiManager.confirm('Delete?').then(confirmed => { /* ... */ });
```

---

## 🐛 Troubleshooting

### **UI Not Showing**

```javascript
// Check if container exists
console.log(document.body); // Should exist

// Check if UIManager initialized
console.log(window.uiManager); // Should be object

// Check if screen registered
console.log(uiManager.screens['main-menu']); // Should be object
```

### **Notifications Not Appearing**

```javascript
// Check notification container
const container = document.getElementById('notification-container');
console.log(container); // Should exist

// Check CSS loaded
const styles = document.getElementById('ui-manager-styles');
console.log(styles); // Should exist
```

### **Achievements Not Unlocking**

```javascript
// Check if achievement system initialized
console.log(window.achievementSystem); // Should be object

// Check if listener registered
console.log(achievementSystem.listeners.length); // Should be > 0

// Manually unlock for testing
achievementSystem.unlockAchievement('first_game');
```

---

## 📊 Performance Tips

### **1. Lazy Load Screens**

Screens are only created when first shown (already implemented).

### **2. Limit Notifications**

```javascript
// ✅ Queue notifications
let notificationQueue = [];
function showNotification(notif) {
    if (uiManager.notifications.length < 3) {
        uiManager.showNotification(notif);
    } else {
        notificationQueue.push(notif);
    }
}
```

### **3. Cleanup on Hide**

```javascript
class MyScreen extends BaseScreen {
    onHide() {
        // Clear intervals/timeouts
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}
```

---

## 🎓 Learn More

### **Full Example**
See `examples/ui-integration.html` for a complete working example.

### **Demo Functions**
Open the example in browser and try:
```javascript
demoUnlockAchievement()  // Unlock random achievement
demoAddStats()           // Add stats
demoNotification('success') // Show notification
demoModal()             // Show modal
demoLoading()           // Show loading
```

### **Inspect Live**
```javascript
// Check current screen
console.log(uiManager.currentScreen);

// Check all screens
console.log(Object.keys(uiManager.screens));

// Check active notifications
console.log(uiManager.notifications);
```

---

## 📝 Summary

The UI System provides:
- ✅ **Complete Menu System** - Main menu with all game modes
- ✅ **Achievement Gallery** - Beautiful unlock notifications
- ✅ **Statistics Dashboard** - Career stats tracking
- ✅ **Settings Panel** - Full customization
- ✅ **Game Mode HUDs** - Derby, Season dashboards
- ✅ **Modal System** - Dialogs and confirmations
- ✅ **Notification System** - Toast messages
- ✅ **Responsive Design** - Works on all devices
- ✅ **Easy Integration** - Simple API
- ✅ **Fully Styled** - Professional appearance

**Total Files:** 6
- `js/ui-manager.js` (400+ lines)
- `js/ui-screens.js` (600+ lines)
- `js/ui-game-modes.js` (500+ lines)
- `css/ui-manager.css` (600+ lines)
- `css/ui-game-modes.css` (400+ lines)
- `examples/ui-integration.html` (300+ lines)

**Total Code:** 2,800+ lines of production-ready UI code!

---

**Happy building! 🎮⚾**
