# Progressive Web App (PWA) Guide

Complete guide to the PWA features in Sandlot Superstars - offline play, touch controls, and mobile optimization.

## Quick Start

```html
<!-- Add to your HTML head -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="theme-color" content="#FF6B35">
<link rel="manifest" href="/manifest.json">

<!-- Include PWA scripts -->
<link rel="stylesheet" href="/css/mobile.css">
<script src="/js/pwa-manager.js"></script>
<script src="/js/touch-controls.js"></script>
<script src="/js/mobile-utils.js"></script>

<script>
// Initialize PWA
const pwaManager = new PWAManager();
const mobileUtils = new MobileUtils();
const touchControls = new TouchControls();
</script>
```

## Features

✅ **Offline Play** - Service worker with intelligent caching  
✅ **Touch Controls** - Swipe, tap, long press, pinch, rotate gestures  
✅ **Add to Home Screen** - Install as native app  
✅ **Mobile Optimization** - Performance tuning based on device  
✅ **Auto Updates** - Background service worker updates  
✅ **Network Detection** - Online/offline indicators  
✅ **Wake Lock** - Prevent screen sleep during gameplay  
✅ **Vibration** - Haptic feedback for actions  
✅ **Fullscreen** - Immersive gaming experience  
✅ **Battery Aware** - Reduce quality on low battery  

## Service Worker

Handles offline caching with multiple strategies:
- **Cache First**: Images, fonts (rarely change)
- **Network First**: HTML, JSON (always fresh)
- **Stale While Revalidate**: JS, CSS (balance speed and freshness)

### Cache Management

```javascript
// Get cache size
const size = await pwaManager.getCacheSize();
console.log(`${size.usage / 1024 / 1024} MB used`);

// Clear cache
await pwaManager.clearCache();
```

## Touch Controls

### Basic Setup

```javascript
const touchControls = new TouchControls({
    container: document.body,
    swipeThreshold: 50,
    longPressTimeout: 500
});

// Listen to gestures
touchControls.on('swipe', (data) => {
    console.log(`Swiped ${data.direction} with velocity ${data.velocity}`);
});

touchControls.on('tap', (data) => {
    console.log(`Tapped at ${data.x}, ${data.y}`);
});
```

### Baseball Controls

```javascript
const baseballControls = new BaseballTouchControls(touchControls, gameEngine);

// Swipe gestures control batting
touchControls.on('swipe', (data) => {
    if (data.direction === 'up') {
        // Uppercut swing for home run
    }
});

// Tap for swing timing
touchControls.on('tap', () => {
    // Quick swing
});

// Long press for special ability
touchControls.on('longPress', () => {
    // Activate power-up
});
```

### Available Gestures

| Gesture | Trigger | Use Case |
|---------|---------|----------|
| **Tap** | Quick touch | Swing, confirm |
| **Double Tap** | Two quick taps | Zoom, special action |
| **Long Press** | Hold 500ms | Special ability |
| **Swipe** | Quick drag | Batting direction |
| **Drag** | Touch and move | Pitching aim |
| **Pinch** | Two-finger scale | Zoom camera |
| **Rotate** | Two-finger rotate | Camera rotation |

## Mobile Optimization

### Device Detection

```javascript
const mobileUtils = new MobileUtils();

// Device info
console.log(mobileUtils.deviceInfo);
// {
//   isMobile: true,
//   isTablet: false,
//   isIOS: true,
//   screenWidth: 375,
//   pixelRatio: 2,
//   hasTouchScreen: true,
//   deviceMemory: 4,
//   connection: { effectiveType: '4g' }
// }

// Performance tier
console.log(mobileUtils.performance.tier); // 'low', 'medium', 'high'
```

### Adaptive Quality

```javascript
const quality = mobileUtils.getRecommendedQuality();
// {
//   resolution: 0.8,
//   particles: true,
//   shadows: false,
//   maxParticles: 500,
//   textureQuality: 'medium'
// }

// Apply to game engine
gameEngine.setQuality(quality);
```

### Battery Awareness

```javascript
if (await mobileUtils.shouldReducePerformance()) {
    // Reduce particle effects
    // Lower frame rate target
    // Disable shadows
}
```

## PWA Installation

### Detect Installation

```javascript
const isInstalled = pwaManager.checkIfInstalled();
if (!isInstalled) {
    // Show install banner
    pwaManager.showInstallBanner();
}
```

### Trigger Install Prompt

```javascript
const accepted = await pwaManager.showInstallPrompt();
if (accepted) {
    console.log('User installed the app!');
}
```

## Updates

### Check for Updates

```javascript
// Manual check
await pwaManager.checkForUpdates();

// Or automatic (every 60 seconds)
const pwaManager = new PWAManager({
    checkUpdateInterval: 60000
});
```

### Apply Updates

```javascript
pwaManager.onUpdate = () => {
    // Show notification
    if (confirm('New version available. Update now?')) {
        pwaManager.applyUpdate(); // Reloads page
    }
};
```

## Device Features

### Vibration

```javascript
// Single vibration
mobileUtils.vibrate(200);

// Pattern (vibrate, pause, vibrate)
mobileUtils.vibrate([200, 100, 200]);
```

### Fullscreen

```javascript
// Enter fullscreen
await mobileUtils.requestFullscreen();

// Exit fullscreen
await mobileUtils.exitFullscreen();

// Check if fullscreen
if (mobileUtils.isFullscreen()) {
    console.log('In fullscreen mode');
}
```

### Wake Lock

```javascript
// Prevent screen from sleeping
const wakeLock = await mobileUtils.requestWakeLock();

// Release when done
await wakeLock.release();
```

### Share

```javascript
const success = await mobileUtils.share({
    title: 'My Score',
    text: 'I hit 10 home runs!',
    url: window.location.href
});
```

### Clipboard

```javascript
const success = await mobileUtils.copyToClipboard('Score: 1000');
```

## Performance Monitoring

```javascript
const monitor = new PerformanceMonitor();

// Get FPS summary
const summary = monitor.getSummary();
console.log(`Average FPS: ${summary.average}`);
console.log(`Min: ${summary.min}, Max: ${summary.max}`);

// Measure FPS for 1 second
const fps = await mobileUtils.measureFPS(1000);
```

## Responsive Design

### CSS Classes

```css
/* Show only on mobile */
.mobile-only { }

/* Show only on desktop */
.desktop-only { }

/* Show on tablet */
.tablet-visible { }
```

### Media Queries

```css
/* Mobile portrait */
@media (max-width: 480px) { }

/* Mobile landscape */
@media (max-width: 896px) and (orientation: landscape) { }

/* Tablet */
@media (min-width: 481px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

### Safe Areas

```css
/* Handle notches and rounded corners */
@supports (padding: env(safe-area-inset-top)) {
    body {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
    }
}
```

## Virtual Controls

### Create Touch Button

```javascript
const touchUI = new TouchUI(document.body);

const swingButton = touchUI.createButton({
    label: 'SWING',
    position: 'bottom: 80px; right: 20px;',
    size: 80,
    onPress: () => {
        gameEngine.swing();
    }
});
```

### Create Virtual Joystick

```javascript
const joystick = touchUI.createVirtualJoystick({
    position: 'bottom: 80px; left: 20px;',
    onChange: (data) => {
        // data.x, data.y = -1 to 1
        // data.angle = 0-360 degrees
        gameEngine.movePlayer(data.x, data.y);
    },
    onRelease: () => {
        gameEngine.stopMoving();
    }
});
```

## Best Practices

### 1. Always Test on Real Devices
- Use Chrome DevTools mobile emulation
- Test on iOS and Android
- Check different screen sizes

### 2. Optimize for Touch
- Minimum touch target: 48x48px
- Prevent accidental taps
- Provide visual feedback

### 3. Handle Network Changes
```javascript
window.addEventListener('online', () => {
    console.log('Back online');
    syncGameData();
});

window.addEventListener('offline', () => {
    console.log('Offline mode');
    showOfflineNotification();
});
```

### 4. Test Offline
- Open DevTools → Network → Offline
- Unregister SW and test fresh install
- Test update flow

### 5. Performance
- Use GPU acceleration (`will-change: transform`)
- Lazy load images
- Reduce particles on mobile
- Target 60 FPS on mobile

## Troubleshooting

### Service Worker Not Updating
```javascript
// Force update
await navigator.serviceWorker.register('/service-worker.js', {
    updateViaCache: 'none'
});
```

### Install Banner Not Showing
- Must be HTTPS (or localhost)
- User must visit site twice
- Must have valid manifest.json
- Check Chrome DevTools → Application → Manifest

### Touch Events Not Working
```javascript
// Prevent default behaviors
event.preventDefault();

// Use passive: false for preventDefault
element.addEventListener('touchstart', handler, { passive: false });
```

### iOS Specific Issues
```javascript
// Request orientation permission (iOS 13+)
await mobileUtils.requestOrientationPermission();

// Fix iOS viewport
document.querySelector('meta[name="viewport"]').content =
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
```

## File Structure

```
lone-star-legends-championship/
├── service-worker.js               # Offline caching
├── manifest.json                   # PWA configuration
├── js/
│   ├── pwa-manager.js             # PWA lifecycle management
│   ├── touch-controls.js          # Touch gesture handling
│   └── mobile-utils.js            # Device detection & optimization
├── css/
│   └── mobile.css                 # Mobile-optimized styles
└── examples/
    └── pwa-demo.html              # Working demo
```

## Testing Checklist

- [ ] Install as PWA
- [ ] Works offline
- [ ] Updates automatically
- [ ] Touch controls responsive
- [ ] Vibration works
- [ ] Fullscreen works
- [ ] Share works
- [ ] Performance acceptable on low-end devices
- [ ] Battery-aware quality reduction
- [ ] Safe areas handled (notches)
- [ ] Orientation changes handled
- [ ] Network changes detected

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web App Manifest](https://web.dev/add-manifest/)

---

For the complete demo, open `examples/pwa-demo.html` in a mobile browser.
