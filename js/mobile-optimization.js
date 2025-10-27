/**
 * Mobile Optimization System for Sandlot Superstars
 * Provides touch controls, gestures, and performance enhancements for mobile devices
 */

class MobileOptimizationSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isMobile = this.detectMobile();
        this.touchStartPos = { x: 0, y: 0 };
        this.touchEndPos = { x: 0, y: 0 };
        this.swipeThreshold = 50; // Minimum distance for swipe
        this.tapThreshold = 10; // Maximum distance for tap
        this.longPressThreshold = 500; // ms for long press
        this.touchStartTime = 0;
        this.longPressTimer = null;
        this.isLongPress = false;

        // Touch controls state
        this.touchControls = {
            swinging: false,
            pitching: false,
            batting: false,
            running: false
        };

        // Performance settings
        this.performanceMode = 'auto'; // auto, high, medium, low
        this.currentPerformanceLevel = 'high';

        // Virtual joystick
        this.joystick = null;
        this.joystickActive = false;

        if (this.isMobile) {
            this.initialize();
        }
    }

    /**
     * Detect if device is mobile
     */
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Check for mobile devices
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isMobileDevice = mobileRegex.test(userAgent.toLowerCase());

        // Check for touch support
        const isTouchDevice = (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );

        // Check screen size
        const isSmallScreen = window.innerWidth < 768;

        return isMobileDevice || (isTouchDevice && isSmallScreen);
    }

    /**
     * Initialize mobile optimization
     */
    initialize() {
        console.log('📱 Mobile Optimization: Initializing...');

        // Setup touch controls
        this.setupTouchControls();

        // Create mobile UI
        this.createMobileUI();

        // Optimize performance
        this.optimizePerformance();

        // Setup orientation handling
        this.setupOrientationHandling();

        // Setup haptic feedback
        this.setupHapticFeedback();

        console.log('📱 Mobile Optimization: Ready');
    }

    /**
     * Setup touch controls and gestures
     */
    setupTouchControls() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        // Touch start
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });

        // Touch move
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });

        // Touch end
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Prevent default touch behaviors
        canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        console.log('✅ Touch controls initialized');
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchStartPos = { x: touch.clientX, y: touch.clientY };
        this.touchStartTime = Date.now();
        this.isLongPress = false;

        // Start long press timer
        this.longPressTimer = setTimeout(() => {
            this.isLongPress = true;
            this.handleLongPress(this.touchStartPos);
        }, this.longPressThreshold);

        // Multi-touch handling
        if (e.touches.length === 2) {
            this.handlePinchStart(e);
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        // Cancel long press if finger moves
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        const touch = e.touches[0];
        this.touchEndPos = { x: touch.clientX, y: touch.clientY };

        // Handle dragging/panning
        if (e.touches.length === 1) {
            this.handleDrag(this.touchStartPos, this.touchEndPos);
        }

        // Handle pinch zoom
        if (e.touches.length === 2) {
            this.handlePinch(e);
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        if (this.isLongPress) {
            return; // Already handled by long press
        }

        const touch = e.changedTouches[0];
        this.touchEndPos = { x: touch.clientX, y: touch.clientY };

        const deltaX = this.touchEndPos.x - this.touchStartPos.x;
        const deltaY = this.touchEndPos.y - this.touchStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = Date.now() - this.touchStartTime;

        // Determine gesture type
        if (distance < this.tapThreshold) {
            this.handleTap(this.touchEndPos);
        } else if (distance > this.swipeThreshold) {
            this.handleSwipe(deltaX, deltaY, duration);
        }

        // Reset joystick if active
        if (this.joystickActive) {
            this.resetJoystick();
        }
    }

    /**
     * Handle tap gesture
     */
    handleTap(position) {
        console.log('👆 Tap detected');

        // Determine what was tapped based on position
        const screenHeight = window.innerHeight;
        const screenWidth = window.innerWidth;

        // Bottom third - swing
        if (position.y > screenHeight * 0.66) {
            this.handleSwingTap();
        }
        // Top third - pitch
        else if (position.y < screenHeight * 0.33) {
            this.handlePitchTap();
        }
        // Middle - depends on game state
        else {
            this.handleMiddleTap(position);
        }

        this.triggerHapticFeedback('light');
    }

    /**
     * Handle swipe gesture
     */
    handleSwipe(deltaX, deltaY, duration) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / duration;

        console.log(`👋 Swipe detected: angle=${angle.toFixed(0)}°, velocity=${velocity.toFixed(2)}`);

        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                this.handleSwipeRight(velocity);
            } else {
                this.handleSwipeLeft(velocity);
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                this.handleSwipeDown(velocity);
            } else {
                this.handleSwipeUp(velocity);
            }
        }

        this.triggerHapticFeedback('medium');
    }

    /**
     * Handle long press gesture
     */
    handleLongPress(position) {
        console.log('⏱️ Long press detected');

        // Show context menu or special action
        this.showContextMenu(position);
        this.triggerHapticFeedback('heavy');
    }

    /**
     * Handle swing tap
     */
    handleSwingTap() {
        if (this.gameEngine && typeof this.gameEngine.swing === 'function') {
            this.gameEngine.swing();
            this.showTouchFeedback('SWING!', '#FFD700');
        }
    }

    /**
     * Handle pitch tap
     */
    handlePitchTap() {
        if (this.gameEngine && typeof this.gameEngine.pitch === 'function') {
            this.gameEngine.pitch();
            this.showTouchFeedback('PITCH!', '#4CAF50');
        }
    }

    /**
     * Handle middle tap (depends on context)
     */
    handleMiddleTap(position) {
        // Could be: activate special ability, steal base, etc.
        if (this.gameEngine && typeof this.gameEngine.activateAbility === 'function') {
            this.gameEngine.activateAbility();
        }
    }

    /**
     * Handle swipe right
     */
    handleSwipeRight(velocity) {
        // Move batter right or advance runner
        if (this.gameEngine && this.gameEngine.batter) {
            this.gameEngine.batter.position.x = Math.min(2, this.gameEngine.batter.position.x + 0.5);
            if (this.gameEngine.bat) {
                this.gameEngine.bat.position.x = this.gameEngine.batter.position.x + 1;
            }
        }
    }

    /**
     * Handle swipe left
     */
    handleSwipeLeft(velocity) {
        // Move batter left
        if (this.gameEngine && this.gameEngine.batter) {
            this.gameEngine.batter.position.x = Math.max(-2, this.gameEngine.batter.position.x - 0.5);
            if (this.gameEngine.bat) {
                this.gameEngine.bat.position.x = this.gameEngine.batter.position.x + 1;
            }
        }
    }

    /**
     * Handle swipe up
     */
    handleSwipeUp(velocity) {
        // Power swing or jump
        if (velocity > 1.5) {
            this.handleSwingTap();
        }
    }

    /**
     * Handle swipe down
     */
    handleSwipeDown(velocity) {
        // Bunt or slide
        if (this.gameEngine && this.gameEngine.advancedMechanics) {
            this.gameEngine.advancedMechanics.toggleBuntMode();
            this.showTouchFeedback('BUNT MODE', '#FFA500');
        }
    }

    /**
     * Handle pinch start (zoom)
     */
    handlePinchStart(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        this.initialPinchDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }

    /**
     * Handle pinch zoom
     */
    handlePinch(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const scale = currentDistance / this.initialPinchDistance;

        // Adjust camera zoom
        if (this.gameEngine && this.gameEngine.camera) {
            const newZ = Math.max(15, Math.min(50, this.gameEngine.camera.position.z / scale));
            this.gameEngine.camera.position.z = newZ;
        }
    }

    /**
     * Handle drag
     */
    handleDrag(start, end) {
        // Implement camera panning or player movement
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;

        if (this.gameEngine && this.gameEngine.camera) {
            // Smooth camera follow
            this.gameEngine.camera.position.x += deltaX * 0.01;
        }
    }

    /**
     * Create mobile-specific UI
     */
    createMobileUI() {
        // Create mobile control panel
        const controlPanel = document.createElement('div');
        controlPanel.id = 'mobileControls';
        controlPanel.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 180px;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 20px;
            z-index: 999;
            pointer-events: none;
        `;

        // Swing button
        const swingBtn = this.createTouchButton('⚾ SWING', 'left');
        swingBtn.onclick = () => this.handleSwingTap();

        // Pitch button
        const pitchBtn = this.createTouchButton('🎯 PITCH', 'right');
        pitchBtn.onclick = () => this.handlePitchTap();

        controlPanel.appendChild(swingBtn);
        controlPanel.appendChild(pitchBtn);
        document.body.appendChild(controlPanel);

        // Create virtual joystick for player movement
        this.createVirtualJoystick();

        // Add mobile-specific indicators
        this.addMobileIndicators();
    }

    /**
     * Create touch button
     */
    createTouchButton(label, position) {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.cssText = `
            padding: 20px 40px;
            font-size: 20px;
            font-weight: bold;
            border: 3px solid #FF6B35;
            border-radius: 15px;
            background: rgba(255, 107, 53, 0.3);
            color: white;
            cursor: pointer;
            pointer-events: all;
            transition: all 0.2s;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        `;

        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.style.transform = 'scale(0.95)';
            button.style.background = 'rgba(255, 107, 53, 0.5)';
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.style.transform = 'scale(1)';
            button.style.background = 'rgba(255, 107, 53, 0.3)';
        });

        return button;
    }

    /**
     * Create virtual joystick
     */
    createVirtualJoystick() {
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'virtualJoystick';
        joystickContainer.style.cssText = `
            position: fixed;
            bottom: 200px;
            left: 20px;
            width: 100px;
            height: 100px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            background: rgba(0,0,0,0.3);
            z-index: 998;
            display: none;
        `;

        const joystickKnob = document.createElement('div');
        joystickKnob.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #FF6B35;
        `;

        joystickContainer.appendChild(joystickKnob);
        document.body.appendChild(joystickContainer);

        this.joystick = {
            container: joystickContainer,
            knob: joystickKnob
        };
    }

    /**
     * Reset virtual joystick
     */
    resetJoystick() {
        if (this.joystick) {
            this.joystick.knob.style.transform = 'translate(-50%, -50%)';
            this.joystickActive = false;
        }
    }

    /**
     * Add mobile-specific indicators
     */
    addMobileIndicators() {
        const indicator = document.createElement('div');
        indicator.id = 'mobileIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            padding: 5px 10px;
            background: rgba(0,0,0,0.7);
            color: #4CAF50;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        `;
        indicator.textContent = '📱 Touch Controls Active';
        document.body.appendChild(indicator);
    }

    /**
     * Show touch feedback
     */
    showTouchFeedback(message, color = '#FFD700') {
        let feedback = document.getElementById('touchFeedback');

        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'touchFeedback';
            feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 20px 40px;
                background: rgba(0,0,0,0.9);
                color: ${color};
                border: 3px solid ${color};
                border-radius: 15px;
                font-size: 32px;
                font-weight: bold;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            `;
            document.body.appendChild(feedback);
        }

        feedback.textContent = message;
        feedback.style.color = color;
        feedback.style.borderColor = color;
        feedback.style.opacity = '1';

        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 1000);
    }

    /**
     * Show context menu
     */
    showContextMenu(position) {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            top: ${position.y}px;
            left: ${position.x}px;
            background: rgba(0,0,0,0.9);
            border: 2px solid #FF6B35;
            border-radius: 10px;
            padding: 10px;
            z-index: 10000;
        `;

        const options = [
            { label: '🏃 Steal Base', action: () => console.log('Steal') },
            { label: '🎯 Bunt', action: () => console.log('Bunt') },
            { label: '⚡ Ability', action: () => console.log('Ability') }
        ];

        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.label;
            button.style.cssText = `
                display: block;
                width: 100%;
                padding: 10px;
                margin: 5px 0;
                background: #FF6B35;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 14px;
            `;
            button.onclick = () => {
                option.action();
                menu.remove();
            };
            menu.appendChild(button);
        });

        document.body.appendChild(menu);

        // Remove menu after 3 seconds or on next touch
        setTimeout(() => menu.remove(), 3000);
        document.addEventListener('touchstart', () => menu.remove(), { once: true });
    }

    /**
     * Optimize performance for mobile
     */
    optimizePerformance() {
        console.log('⚡ Optimizing performance for mobile...');

        // Detect device capabilities
        const performanceLevel = this.detectPerformanceLevel();
        this.applyPerformanceSettings(performanceLevel);
    }

    /**
     * Detect device performance level
     */
    detectPerformanceLevel() {
        // Check hardware concurrency (CPU cores)
        const cores = navigator.hardwareConcurrency || 2;

        // Check memory (if available)
        const memory = navigator.deviceMemory || 4;

        // Check screen resolution
        const pixels = window.innerWidth * window.innerHeight;

        // Determine performance level
        if (cores >= 8 && memory >= 8 && pixels >= 1920 * 1080) {
            return 'high';
        } else if (cores >= 4 && memory >= 4) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Apply performance settings
     */
    applyPerformanceSettings(level) {
        this.currentPerformanceLevel = level;

        console.log(`⚡ Performance level: ${level}`);

        const settings = {
            high: {
                particleCount: 1.0,
                shadowQuality: 'high',
                textureQuality: 'high',
                antialiasing: true,
                postProcessing: true
            },
            medium: {
                particleCount: 0.6,
                shadowQuality: 'medium',
                textureQuality: 'medium',
                antialiasing: true,
                postProcessing: false
            },
            low: {
                particleCount: 0.3,
                shadowQuality: 'low',
                textureQuality: 'low',
                antialiasing: false,
                postProcessing: false
            }
        };

        const appliedSettings = settings[level];

        // Apply to renderer if available
        if (this.gameEngine && this.gameEngine.renderer) {
            this.gameEngine.renderer.setPixelRatio(
                appliedSettings.antialiasing ? window.devicePixelRatio : 1
            );

            this.gameEngine.renderer.shadowMap.enabled = (appliedSettings.shadowQuality !== 'low');
        }

        console.log('✅ Performance settings applied:', appliedSettings);
    }

    /**
     * Setup orientation handling
     */
    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Initial check
        this.handleOrientationChange();
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        const orientation = window.orientation || screen.orientation?.angle || 0;
        const isLandscape = Math.abs(orientation) === 90;

        console.log(`📱 Orientation: ${isLandscape ? 'Landscape' : 'Portrait'}`);

        // Suggest landscape for better experience
        if (!isLandscape) {
            this.showOrientationHint();
        }

        // Resize renderer
        if (this.gameEngine && this.gameEngine.onWindowResize) {
            this.gameEngine.onWindowResize();
        }
    }

    /**
     * Show orientation hint
     */
    showOrientationHint() {
        let hint = document.getElementById('orientationHint');

        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'orientationHint';
            hint.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 25px;
                background: rgba(255, 107, 53, 0.95);
                color: white;
                border-radius: 10px;
                font-size: 14px;
                z-index: 10001;
                text-align: center;
            `;
            hint.innerHTML = '🔄 Rotate device to landscape for best experience';
            document.body.appendChild(hint);

            setTimeout(() => {
                hint.style.opacity = '0';
                setTimeout(() => hint.remove(), 300);
            }, 5000);
        }
    }

    /**
     * Setup haptic feedback
     */
    setupHapticFeedback() {
        this.hapticSupported = 'vibrate' in navigator;
        console.log(`📳 Haptic feedback: ${this.hapticSupported ? 'Supported' : 'Not supported'}`);
    }

    /**
     * Trigger haptic feedback
     */
    triggerHapticFeedback(intensity = 'medium') {
        if (!this.hapticSupported) return;

        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            double: [20, 50, 20],
            success: [10, 20, 10, 20, 30],
            error: [50, 100, 50]
        };

        const pattern = patterns[intensity] || patterns.medium;
        navigator.vibrate(pattern);
    }
}

// Auto-initialize if mobile
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (window.game) {
            window.mobileOptimization = new MobileOptimizationSystem(window.game);
        }
    });
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizationSystem;
}
