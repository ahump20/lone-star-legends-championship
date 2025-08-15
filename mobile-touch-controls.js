/**
 * Mobile Touch Controls for Lone Star Legends Championship
 * Responsive touch interface for mobile baseball gaming
 */

class MobileTouchControls {
    constructor(gameInstance = null) {
        this.gameInstance = gameInstance;
        this.isMobile = this.detectMobile();
        this.touchStartPos = { x: 0, y: 0 };
        this.touchEndPos = { x: 0, y: 0 };
        this.swipeThreshold = 50;
        this.tapThreshold = 300; // milliseconds
        this.touchStartTime = 0;
        
        // Touch zones for different actions
        this.touchZones = new Map();
        this.gestureHistory = [];
        this.vibrationSupported = 'vibrate' in navigator;
        
        // Control state
        this.controlsVisible = false;
        this.currentControlMode = 'batting'; // batting, pitching, fielding
        
        this.initialize();
    }

    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUA = /android|blackberry|iphone|ipad|ipod|opera mini|iemobile|wpdesktop/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return isMobileUA || isTouchDevice;
    }

    initialize() {
        if (!this.isMobile) {
            console.log('📱 Desktop detected - Mobile touch controls in standby mode');
            return;
        }

        console.log('📱 Mobile device detected - Initializing touch controls');
        
        // Setup responsive design
        this.setupResponsiveDesign();
        
        // Create touch controls UI
        this.createTouchControlsUI();
        
        // Setup touch event listeners
        this.setupTouchEvents();
        
        // Setup gesture recognition
        this.setupGestureRecognition();
        
        // Setup orientation handling
        this.setupOrientationHandling();
        
        console.log('✅ Mobile Touch Controls: READY');
    }

    setupResponsiveDesign() {
        // Add mobile-specific CSS
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            @media (max-width: 768px) {
                .dashboard-container,
                .game-container {
                    padding: 10px;
                    grid-template-columns: 1fr;
                }
                
                .champion-enigma-display {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .game-info {
                    grid-template-columns: 1fr;
                    gap: 10px;
                }
                
                .control-panel {
                    justify-content: center;
                    flex-wrap: wrap;
                }
                
                .control-button,
                .action-button {
                    min-height: 44px;
                    min-width: 44px;
                    font-size: 16px;
                    padding: 12px 20px;
                }
            }
            
            .mobile-touch-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            }
            
            .touch-zone {
                position: absolute;
                pointer-events: auto;
                background: rgba(144, 238, 144, 0.1);
                border: 2px solid rgba(144, 238, 144, 0.3);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: bold;
                color: rgba(255, 255, 255, 0.8);
                user-select: none;
                transition: all 0.2s ease;
            }
            
            .touch-zone.active {
                background: rgba(144, 238, 144, 0.3);
                border-color: rgba(144, 238, 144, 0.8);
                color: white;
                transform: scale(1.05);
            }
            
            .mobile-hud {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(45, 90, 61, 0.95);
                border: 2px solid #4a7c59;
                border-radius: 20px;
                padding: 15px 25px;
                backdrop-filter: blur(10px);
                z-index: 1001;
                display: none;
            }
            
            .mobile-hud.visible {
                display: block;
            }
            
            .hud-stats {
                display: flex;
                gap: 20px;
                align-items: center;
                color: white;
                font-size: 14px;
            }
            
            .hud-stat {
                text-align: center;
            }
            
            .hud-value {
                color: #90EE90;
                font-weight: bold;
                font-size: 16px;
            }
            
            .gesture-indicator {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(144, 238, 144, 0.9);
                color: #1a4c2b;
                padding: 20px 30px;
                border-radius: 15px;
                font-size: 18px;
                font-weight: bold;
                z-index: 1002;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .gesture-indicator.show {
                opacity: 1;
            }
            
            .swing-zone {
                bottom: 100px;
                right: 30px;
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255, 100, 100, 0.1), rgba(255, 100, 100, 0.3));
                border-color: rgba(255, 100, 100, 0.5);
            }
            
            .pitch-zone {
                bottom: 100px;
                left: 30px;
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(100, 150, 255, 0.1), rgba(100, 150, 255, 0.3));
                border-color: rgba(100, 150, 255, 0.5);
            }
            
            .directional-pad {
                bottom: 250px;
                left: 50%;
                transform: translateX(-50%);
                width: 150px;
                height: 150px;
                background: rgba(144, 238, 144, 0.1);
                border: 2px solid rgba(144, 238, 144, 0.3);
                border-radius: 50%;
            }
        `;
        
        document.head.appendChild(mobileStyles);
    }

    createTouchControlsUI() {
        // Create touch overlay
        this.touchOverlay = document.createElement('div');
        this.touchOverlay.className = 'mobile-touch-overlay';
        document.body.appendChild(this.touchOverlay);
        
        // Create mobile HUD
        this.createMobileHUD();
        
        // Create touch zones based on current mode
        this.createTouchZones();
        
        // Create gesture indicator
        this.createGestureIndicator();
    }

    createMobileHUD() {
        this.mobileHUD = document.createElement('div');
        this.mobileHUD.className = 'mobile-hud';
        
        this.mobileHUD.innerHTML = `
            <div class="hud-stats">
                <div class="hud-stat">
                    <div class="hud-value" id="mobile-avg">---</div>
                    <div>AVG</div>
                </div>
                <div class="hud-stat">
                    <div class="hud-value" id="mobile-hr">0</div>
                    <div>HR</div>
                </div>
                <div class="hud-stat">
                    <div class="hud-value" id="mobile-score">0-0</div>
                    <div>Score</div>
                </div>
                <div class="hud-stat">
                    <div class="hud-value" id="mobile-inning">1</div>
                    <div>Inning</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.mobileHUD);
    }

    createTouchZones() {
        // Clear existing zones
        this.touchZones.clear();
        this.touchOverlay.innerHTML = '';
        
        switch (this.currentControlMode) {
            case 'batting':
                this.createBattingZones();
                break;
            case 'pitching':
                this.createPitchingZones();
                break;
            case 'fielding':
                this.createFieldingZones();
                break;
        }
    }

    createBattingZones() {
        // Swing zone (right side)
        const swingZone = document.createElement('div');
        swingZone.className = 'touch-zone swing-zone';
        swingZone.innerHTML = '⚾<br>SWING';
        swingZone.addEventListener('touchstart', (e) => this.handleZoneTouch('swing', e));
        this.touchOverlay.appendChild(swingZone);
        
        // Take/Watch zone (left side)
        const takeZone = document.createElement('div');
        takeZone.className = 'touch-zone pitch-zone';
        takeZone.innerHTML = '👁️<br>WATCH';
        takeZone.addEventListener('touchstart', (e) => this.handleZoneTouch('take', e));
        this.touchOverlay.appendChild(takeZone);
        
        // Directional pad (center)
        this.createDirectionalPad();
        
        this.touchZones.set('swing', swingZone);
        this.touchZones.set('take', takeZone);
    }

    createPitchingZones() {
        // Fastball zone
        const fastballZone = document.createElement('div');
        fastballZone.className = 'touch-zone';
        fastballZone.style.cssText = `
            bottom: 180px;
            right: 30px;
            width: 100px;
            height: 80px;
            background: rgba(255, 100, 100, 0.1);
            border-color: rgba(255, 100, 100, 0.5);
        `;
        fastballZone.innerHTML = '🔥<br>FAST';
        fastballZone.addEventListener('touchstart', (e) => this.handleZoneTouch('fastball', e));
        this.touchOverlay.appendChild(fastballZone);
        
        // Curveball zone
        const curveZone = document.createElement('div');
        curveZone.className = 'touch-zone';
        curveZone.style.cssText = `
            bottom: 180px;
            left: 30px;
            width: 100px;
            height: 80px;
            background: rgba(100, 150, 255, 0.1);
            border-color: rgba(100, 150, 255, 0.5);
        `;
        curveZone.innerHTML = '🌪️<br>CURVE';
        curveZone.addEventListener('touchstart', (e) => this.handleZoneTouch('curveball', e));
        this.touchOverlay.appendChild(curveZone);
        
        // Strike zone targeting
        this.createStrikeZoneTargeting();
        
        this.touchZones.set('fastball', fastballZone);
        this.touchZones.set('curveball', curveZone);
    }

    createFieldingZones() {
        // Fielding zones for different positions
        const positions = [
            { name: '1B', x: '80%', y: '60%' },
            { name: '2B', x: '60%', y: '40%' },
            { name: '3B', x: '20%', y: '60%' },
            { name: 'SS', x: '40%', y: '40%' },
            { name: 'OF', x: '50%', y: '20%' }
        ];
        
        positions.forEach(pos => {
            const zone = document.createElement('div');
            zone.className = 'touch-zone';
            zone.style.cssText = `
                left: ${pos.x};
                top: ${pos.y};
                width: 60px;
                height: 60px;
                border-radius: 50%;
                transform: translate(-50%, -50%);
            `;
            zone.textContent = pos.name;
            zone.addEventListener('touchstart', (e) => this.handleZoneTouch('field_' + pos.name.toLowerCase(), e));
            
            this.touchOverlay.appendChild(zone);
            this.touchZones.set('field_' + pos.name.toLowerCase(), zone);
        });
    }

    createDirectionalPad() {
        const dPad = document.createElement('div');
        dPad.className = 'touch-zone directional-pad';
        dPad.innerHTML = '🎯<br>AIM';
        
        // Handle directional input
        dPad.addEventListener('touchstart', (e) => this.handleDirectionalInput(e));
        dPad.addEventListener('touchmove', (e) => this.handleDirectionalInput(e));
        
        this.touchOverlay.appendChild(dPad);
        this.touchZones.set('directional', dPad);
    }

    createStrikeZoneTargeting() {
        // Strike zone overlay for precise pitching
        const strikeZone = document.createElement('div');
        strikeZone.className = 'touch-zone';
        strikeZone.style.cssText = `
            top: 30%;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 150px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px dashed rgba(255, 255, 255, 0.3);
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: 1fr 1fr 1fr;
            gap: 2px;
        `;
        
        // Create 9-zone targeting grid
        for (let i = 1; i <= 9; i++) {
            const zone = document.createElement('div');
            zone.style.cssText = `
                background: rgba(144, 238, 144, 0.1);
                border: 1px solid rgba(144, 238, 144, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
            `;
            zone.textContent = i;
            zone.addEventListener('touchstart', (e) => this.handleZoneTouch(`strike_zone_${i}`, e));
            strikeZone.appendChild(zone);
        }
        
        this.touchOverlay.appendChild(strikeZone);
        this.touchZones.set('strike_zone', strikeZone);
    }

    createGestureIndicator() {
        this.gestureIndicator = document.createElement('div');
        this.gestureIndicator.className = 'gesture-indicator';
        document.body.appendChild(this.gestureIndicator);
    }

    setupTouchEvents() {
        // Global touch handlers for gesture recognition
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Prevent default scroll behavior on game areas
        const gameAreas = document.querySelectorAll('.game-container, .dashboard-container');
        gameAreas.forEach(area => {
            area.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        });
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchStartPos = { x: touch.clientX, y: touch.clientY };
        this.touchStartTime = Date.now();
        
        // Haptic feedback
        this.hapticFeedback('light');
    }

    handleTouchMove(e) {
        // Track touch movement for gesture recognition
        const touch = e.touches[0];
        this.touchEndPos = { x: touch.clientX, y: touch.clientY };
    }

    handleTouchEnd(e) {
        const touchDuration = Date.now() - this.touchStartTime;
        const deltaX = this.touchEndPos.x - this.touchStartPos.x;
        const deltaY = this.touchEndPos.y - this.touchStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Determine gesture type
        if (touchDuration < this.tapThreshold && distance < this.swipeThreshold) {
            this.handleTap(this.touchStartPos);
        } else if (distance > this.swipeThreshold) {
            this.handleSwipe(deltaX, deltaY, distance);
        }
        
        // Record gesture for learning
        this.recordGesture({
            type: distance > this.swipeThreshold ? 'swipe' : 'tap',
            duration: touchDuration,
            distance: distance,
            deltaX: deltaX,
            deltaY: deltaY,
            timestamp: Date.now()
        });
    }

    handleZoneTouch(action, e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Visual feedback
        const zone = e.currentTarget;
        zone.classList.add('active');
        setTimeout(() => zone.classList.remove('active'), 200);
        
        // Haptic feedback
        this.hapticFeedback('medium');
        
        // Show gesture indicator
        this.showGestureIndicator(this.getActionDisplayName(action));
        
        // Execute action
        this.executeGameAction(action);
        
        console.log(`📱 Touch action: ${action}`);
    }

    handleDirectionalInput(e) {
        const dPad = e.currentTarget;
        const rect = dPad.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        
        // Calculate direction
        const angle = Math.atan2(deltaY, deltaX);
        const direction = this.getDirectionFromAngle(angle);
        
        // Apply directional input to game
        this.applyDirectionalInput(direction, deltaX, deltaY);
    }

    getDirectionFromAngle(angle) {
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        if (degrees >= 315 || degrees < 45) return 'right';
        if (degrees >= 45 && degrees < 135) return 'down';
        if (degrees >= 135 && degrees < 225) return 'left';
        if (degrees >= 225 && degrees < 315) return 'up';
        
        return 'center';
    }

    handleTap(position) {
        // Handle tap gestures
        console.log('👆 Tap detected at:', position);
    }

    handleSwipe(deltaX, deltaY, distance) {
        // Determine swipe direction
        let direction;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }
        
        console.log(`👋 Swipe detected: ${direction}, distance: ${distance}`);
        
        // Handle swipe-based actions
        this.handleSwipeAction(direction, distance);
    }

    handleSwipeAction(direction, distance) {
        const speed = this.calculateSwipeSpeed(distance);
        
        switch (direction) {
            case 'up':
                if (speed > 200) {
                    this.executeGameAction('swing_power');
                    this.showGestureIndicator('💥 POWER SWING');
                } else {
                    this.executeGameAction('swing_contact');
                    this.showGestureIndicator('🎯 CONTACT SWING');
                }
                break;
                
            case 'right':
                this.executeGameAction('swing_pull');
                this.showGestureIndicator('↗️ PULL SWING');
                break;
                
            case 'left':
                this.executeGameAction('swing_opposite');
                this.showGestureIndicator('↖️ OPPOSITE FIELD');
                break;
                
            case 'down':
                this.executeGameAction('bunt');
                this.showGestureIndicator('🥎 BUNT');
                break;
        }
    }

    calculateSwipeSpeed(distance) {
        return distance / (Date.now() - this.touchStartTime) * 1000; // pixels per second
    }

    setupGestureRecognition() {
        // Advanced gesture patterns
        this.gesturePatterns = {
            'home_run_swing': {
                pattern: ['down', 'up'],
                timing: [100, 200],
                description: 'Home Run Swing'
            },
            'steal_base': {
                pattern: ['left', 'right'],
                timing: [150, 150],
                description: 'Steal Base'
            },
            'pitchout': {
                pattern: ['right', 'up'],
                timing: [100, 100],
                description: 'Pitchout'
            }
        };
    }

    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustForOrientation();
            }, 500);
        });
        
        // Initial orientation setup
        this.adjustForOrientation();
    }

    adjustForOrientation() {
        const orientation = screen.orientation?.angle || window.orientation || 0;
        
        if (Math.abs(orientation) === 90) {
            // Landscape mode
            this.optimizeForLandscape();
        } else {
            // Portrait mode
            this.optimizeForPortrait();
        }
        
        console.log(`📱 Orientation changed: ${orientation}°`);
    }

    optimizeForLandscape() {
        this.touchOverlay.style.display = 'block';
        this.mobileHUD.classList.add('visible');
        this.currentControlMode = 'batting';
        this.createTouchZones();
    }

    optimizeForPortrait() {
        // Adjust layout for portrait mode
        const zones = this.touchOverlay.querySelectorAll('.touch-zone');
        zones.forEach(zone => {
            if (zone.classList.contains('swing-zone')) {
                zone.style.bottom = '80px';
                zone.style.right = '20px';
            } else if (zone.classList.contains('pitch-zone')) {
                zone.style.bottom = '80px';
                zone.style.left = '20px';
            }
        });
    }

    // Game integration methods
    executeGameAction(action) {
        // Map touch actions to game actions
        const actionMap = {
            'swing': 'swing',
            'take': 'take',
            'fastball': 'pitch_fastball',
            'curveball': 'pitch_curveball',
            'swing_power': 'swing_power',
            'swing_contact': 'swing_contact',
            'bunt': 'bunt'
        };
        
        const gameAction = actionMap[action] || action;
        
        // Execute through game instance or global functions
        if (this.gameInstance && this.gameInstance.handleMobileAction) {
            this.gameInstance.handleMobileAction(gameAction);
        } else if (window.gameAction) {
            window.gameAction(gameAction);
        } else if (window.client && window.client.send) {
            // Multiplayer integration
            window.client.send({
                type: 'gameAction',
                action: gameAction
            });
        }
        
        console.log(`🎮 Mobile action executed: ${gameAction}`);
    }

    applyDirectionalInput(direction, deltaX, deltaY) {
        // Apply directional input to camera or aim
        if (this.gameInstance && this.gameInstance.camera) {
            const sensitivity = 0.002;
            this.gameInstance.camera.rotation.y += deltaX * sensitivity;
            this.gameInstance.camera.rotation.x += deltaY * sensitivity;
        }
    }

    switchControlMode(mode) {
        this.currentControlMode = mode;
        this.createTouchZones();
        this.showGestureIndicator(`Switched to ${mode} mode`);
        
        console.log(`🔄 Control mode switched to: ${mode}`);
    }

    // Utility methods
    hapticFeedback(intensity = 'light') {
        if (!this.vibrationSupported) return;
        
        const patterns = {
            'light': 10,
            'medium': 50,
            'strong': 100
        };
        
        navigator.vibrate(patterns[intensity] || 10);
    }

    showGestureIndicator(text) {
        this.gestureIndicator.textContent = text;
        this.gestureIndicator.classList.add('show');
        
        setTimeout(() => {
            this.gestureIndicator.classList.remove('show');
        }, 1500);
    }

    getActionDisplayName(action) {
        const displayNames = {
            'swing': '⚾ SWING',
            'take': '👁️ WATCH',
            'fastball': '🔥 FASTBALL',
            'curveball': '🌪️ CURVE',
            'bunt': '🥎 BUNT'
        };
        
        return displayNames[action] || action.toUpperCase();
    }

    recordGesture(gesture) {
        this.gestureHistory.push(gesture);
        
        // Keep last 50 gestures
        if (this.gestureHistory.length > 50) {
            this.gestureHistory.shift();
        }
    }

    updateHUD(stats) {
        if (!this.mobileHUD) return;
        
        const elements = {
            'mobile-avg': stats.battingAverage?.toFixed(3) || '---',
            'mobile-hr': stats.homeRuns || '0',
            'mobile-score': `${stats.awayScore || 0}-${stats.homeScore || 0}`,
            'mobile-inning': stats.inning || '1'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Control visibility
    showControls() {
        if (this.isMobile) {
            this.touchOverlay.style.display = 'block';
            this.mobileHUD.classList.add('visible');
            this.controlsVisible = true;
        }
    }

    hideControls() {
        this.touchOverlay.style.display = 'none';
        this.mobileHUD.classList.remove('visible');
        this.controlsVisible = false;
    }

    toggleControls() {
        if (this.controlsVisible) {
            this.hideControls();
        } else {
            this.showControls();
        }
    }

    // Cleanup
    dispose() {
        if (this.touchOverlay) {
            this.touchOverlay.remove();
        }
        if (this.mobileHUD) {
            this.mobileHUD.remove();
        }
        if (this.gestureIndicator) {
            this.gestureIndicator.remove();
        }
        
        console.log('🧹 Mobile Touch Controls disposed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileTouchControls;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.MobileTouchControls = MobileTouchControls;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Delay to ensure other components are loaded
        setTimeout(() => {
            const mobileControls = new MobileTouchControls();
            window.mobileControls = mobileControls;
            
            // Connect to game instance if available
            if (window.gameInstance || window.threeJSGame) {
                mobileControls.gameInstance = window.gameInstance || window.threeJSGame;
            }
            
            // Auto-show controls on mobile
            if (mobileControls.isMobile) {
                mobileControls.showControls();
            }
            
            console.log('📱 Mobile Touch Controls: READY');
            console.log('🎮 Touch Gestures: ACTIVE');
            console.log('📳 Haptic Feedback: AVAILABLE');
        }, 2000);
    });
}

console.log('📱 Mobile Touch Controls Module Loaded');