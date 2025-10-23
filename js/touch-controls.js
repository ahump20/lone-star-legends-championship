/**
 * Touch Controls System
 * Handles touch input for mobile gameplay
 */

class TouchControls {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.enabled = true;

        // Touch state
        this.touches = new Map();
        this.gestures = [];

        // Swipe detection
        this.swipeThreshold = options.swipeThreshold || 50;
        this.swipeTimeout = options.swipeTimeout || 300;
        this.tapThreshold = options.tapThreshold || 10;
        this.doubleTapDelay = options.doubleTapDelay || 300;

        // Last tap for double-tap detection
        this.lastTap = null;

        // Callbacks
        this.listeners = {
            tap: [],
            doubleTap: [],
            longPress: [],
            swipe: [],
            pinch: [],
            rotate: [],
            dragStart: [],
            drag: [],
            dragEnd: []
        };

        // Long press
        this.longPressTimeout = options.longPressTimeout || 500;
        this.longPressTimer = null;

        // Visual feedback
        this.showVisualFeedback = options.showVisualFeedback !== false;
        this.feedbackElements = [];

        this.init();
    }

    init() {
        // Prevent default touch behaviors
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.container.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

        console.log('✅ Touch controls initialized');
    }

    handleTouchStart(event) {
        if (!this.enabled) return;

        // Store touch info
        Array.from(event.changedTouches).forEach(touch => {
            this.touches.set(touch.identifier, {
                id: touch.identifier,
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: Date.now(),
                moved: false
            });

            // Show visual feedback
            if (this.showVisualFeedback) {
                this.showTouchFeedback(touch.clientX, touch.clientY);
            }
        });

        // Start long press timer
        if (this.touches.size === 1) {
            const touch = Array.from(this.touches.values())[0];
            this.longPressTimer = setTimeout(() => {
                this.triggerLongPress(touch);
            }, this.longPressTimeout);
        }

        // Trigger drag start
        if (this.touches.size === 1) {
            const touch = Array.from(this.touches.values())[0];
            this.trigger('dragStart', {
                x: touch.startX,
                y: touch.startY,
                touchId: touch.id
            });
        }
    }

    handleTouchMove(event) {
        if (!this.enabled) return;

        event.preventDefault(); // Prevent scrolling

        // Update touch positions
        Array.from(event.changedTouches).forEach(touch => {
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                touchData.currentX = touch.clientX;
                touchData.currentY = touch.clientY;
                touchData.moved = true;

                // Cancel long press if moved
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            }
        });

        // Handle single touch drag
        if (this.touches.size === 1) {
            const touch = Array.from(this.touches.values())[0];
            this.trigger('drag', {
                x: touch.currentX,
                y: touch.currentY,
                deltaX: touch.currentX - touch.startX,
                deltaY: touch.currentY - touch.startY,
                touchId: touch.id
            });
        }

        // Handle two-finger gestures (pinch, rotate)
        if (this.touches.size === 2) {
            this.handleTwoFingerGestures();
        }
    }

    handleTouchEnd(event) {
        if (!this.enabled) return;

        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // Process ended touches
        Array.from(event.changedTouches).forEach(touch => {
            const touchData = this.touches.get(touch.identifier);
            if (!touchData) return;

            const deltaX = touch.clientX - touchData.startX;
            const deltaY = touch.clientY - touchData.startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const duration = Date.now() - touchData.startTime;

            // Determine gesture type
            if (distance < this.tapThreshold) {
                // Tap or double tap
                this.handleTap(touch.clientX, touch.clientY);
            } else if (duration < this.swipeTimeout) {
                // Swipe
                this.handleSwipe(deltaX, deltaY, duration);
            }

            // Trigger drag end
            if (touchData.moved) {
                this.trigger('dragEnd', {
                    x: touch.clientX,
                    y: touch.clientY,
                    deltaX: deltaX,
                    deltaY: deltaY,
                    touchId: touch.identifier
                });
            }

            // Remove touch
            this.touches.delete(touch.identifier);

            // Remove visual feedback
            this.removeTouchFeedback();
        });
    }

    handleTouchCancel(event) {
        // Clear all touches
        Array.from(event.changedTouches).forEach(touch => {
            this.touches.delete(touch.identifier);
        });

        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        this.removeTouchFeedback();
    }

    handleTap(x, y) {
        const now = Date.now();

        // Check for double tap
        if (this.lastTap && (now - this.lastTap.time) < this.doubleTapDelay) {
            const distance = Math.sqrt(
                Math.pow(x - this.lastTap.x, 2) + Math.pow(y - this.lastTap.y, 2)
            );

            if (distance < this.tapThreshold * 2) {
                this.trigger('doubleTap', { x, y });
                this.lastTap = null; // Prevent triple tap
                return;
            }
        }

        // Single tap
        this.trigger('tap', { x, y });
        this.lastTap = { x, y, time: now };
    }

    handleSwipe(deltaX, deltaY, duration) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Determine swipe direction
        let direction;
        let distance;

        if (absX > absY) {
            // Horizontal swipe
            if (Math.abs(deltaX) < this.swipeThreshold) return;
            direction = deltaX > 0 ? 'right' : 'left';
            distance = absX;
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) < this.swipeThreshold) return;
            direction = deltaY > 0 ? 'down' : 'up';
            distance = absY;
        }

        this.trigger('swipe', {
            direction,
            distance,
            deltaX,
            deltaY,
            duration,
            velocity: distance / duration
        });
    }

    handleTwoFingerGestures() {
        const touchArray = Array.from(this.touches.values());
        if (touchArray.length !== 2) return;

        const [touch1, touch2] = touchArray;

        // Calculate current distance
        const currentDistance = Math.sqrt(
            Math.pow(touch2.currentX - touch1.currentX, 2) +
            Math.pow(touch2.currentY - touch1.currentY, 2)
        );

        // Calculate initial distance
        const initialDistance = Math.sqrt(
            Math.pow(touch2.startX - touch1.startX, 2) +
            Math.pow(touch2.startY - touch1.startY, 2)
        );

        // Pinch gesture
        const scale = currentDistance / initialDistance;
        if (Math.abs(scale - 1) > 0.1) {
            this.trigger('pinch', {
                scale,
                distance: currentDistance,
                centerX: (touch1.currentX + touch2.currentX) / 2,
                centerY: (touch1.currentY + touch2.currentY) / 2
            });
        }

        // Rotate gesture
        const currentAngle = Math.atan2(
            touch2.currentY - touch1.currentY,
            touch2.currentX - touch1.currentX
        );
        const initialAngle = Math.atan2(
            touch2.startY - touch1.startY,
            touch2.startX - touch1.startX
        );

        const rotation = (currentAngle - initialAngle) * (180 / Math.PI);
        if (Math.abs(rotation) > 5) {
            this.trigger('rotate', {
                rotation,
                centerX: (touch1.currentX + touch2.currentX) / 2,
                centerY: (touch1.currentY + touch2.currentY) / 2
            });
        }
    }

    triggerLongPress(touch) {
        this.trigger('longPress', {
            x: touch.currentX,
            y: touch.currentY,
            touchId: touch.id
        });
    }

    showTouchFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.className = 'touch-feedback';
        feedback.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 60px;
            height: 60px;
            margin-left: -30px;
            margin-top: -30px;
            border-radius: 50%;
            background: rgba(255, 107, 53, 0.3);
            border: 2px solid rgba(255, 107, 53, 0.8);
            pointer-events: none;
            z-index: 99999;
            animation: touchPulse 0.3s ease-out;
        `;

        // Add animation keyframes if not already added
        if (!document.getElementById('touch-feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'touch-feedback-styles';
            style.textContent = `
                @keyframes touchPulse {
                    0% {
                        transform: scale(0.5);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(feedback);
        this.feedbackElements.push(feedback);
    }

    removeTouchFeedback() {
        this.feedbackElements.forEach(el => {
            el.style.animation = 'none';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        });
        this.feedbackElements = [];
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    trigger(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Touch control listener error:', error);
                }
            });
        }
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
        this.touches.clear();
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    destroy() {
        this.disable();
        this.listeners = {};
        this.removeTouchFeedback();
    }
}

/**
 * Baseball-specific touch controls
 * Maps touch gestures to baseball actions
 */
class BaseballTouchControls {
    constructor(touchControls, gameEngine) {
        this.touchControls = touchControls;
        this.gameEngine = gameEngine;
        this.controlMode = 'batting'; // 'batting', 'pitching', 'fielding', 'baserunning'

        this.setupControls();
    }

    setupControls() {
        // Batting controls
        this.touchControls.on('swipe', (data) => {
            if (this.controlMode === 'batting') {
                this.handleBattingSwipe(data);
            }
        });

        this.touchControls.on('tap', (data) => {
            if (this.controlMode === 'batting') {
                this.handleBattingTap(data);
            } else if (this.controlMode === 'baserunning') {
                this.handleBaserunningTap(data);
            }
        });

        // Pitching controls
        this.touchControls.on('drag', (data) => {
            if (this.controlMode === 'pitching') {
                this.handlePitchingDrag(data);
            }
        });

        this.touchControls.on('dragEnd', (data) => {
            if (this.controlMode === 'pitching') {
                this.handlePitchingRelease(data);
            }
        });

        // Fielding controls
        this.touchControls.on('doubleTap', (data) => {
            if (this.controlMode === 'fielding') {
                this.handleFieldingDoubleTap(data);
            }
        });

        // Long press for special abilities
        this.touchControls.on('longPress', (data) => {
            this.handleSpecialAbility(data);
        });
    }

    handleBattingSwipe(data) {
        const { direction, velocity } = data;

        // Swipe direction determines swing type
        let swingType = 'normal';
        let swingPower = Math.min(1, velocity / 2);

        if (direction === 'up') {
            swingType = 'uppercut'; // Try to hit home run
            swingPower *= 1.2;
        } else if (direction === 'down') {
            swingType = 'groundball'; // Hit groundball
            swingPower *= 0.8;
        } else if (direction === 'left') {
            swingType = 'pull'; // Pull the ball
        } else if (direction === 'right') {
            swingType = 'opposite'; // Opposite field
        }

        console.log(`Swing: ${swingType}, Power: ${swingPower.toFixed(2)}`);

        // Trigger swing in game engine
        if (this.gameEngine && this.gameEngine.swing) {
            this.gameEngine.swing(swingType, swingPower);
        }

        // Haptic feedback
        this.vibrate(50);
    }

    handleBattingTap(data) {
        const { y } = data;
        const screenHeight = window.innerHeight;
        const tapPosition = y / screenHeight;

        // Tap position determines swing timing
        // Top = early, middle = normal, bottom = late
        let timing = 'normal';
        if (tapPosition < 0.33) {
            timing = 'early';
        } else if (tapPosition > 0.66) {
            timing = 'late';
        }

        console.log(`Swing timing: ${timing}`);

        if (this.gameEngine && this.gameEngine.swing) {
            this.gameEngine.swing('normal', 0.8, timing);
        }

        this.vibrate(30);
    }

    handlePitchingDrag(data) {
        // Show pitch trajectory preview
        if (this.gameEngine && this.gameEngine.updatePitchPreview) {
            this.gameEngine.updatePitchPreview(data.x, data.y);
        }
    }

    handlePitchingRelease(data) {
        const { deltaX, deltaY, velocity } = data;

        // Calculate pitch type based on drag direction
        let pitchType = 'fastball';
        let speed = Math.min(100, velocity * 50);

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY && absX > 50) {
            pitchType = deltaX > 0 ? 'curveball' : 'slider';
        } else if (absY > absX && absY > 50) {
            pitchType = deltaY > 0 ? 'changeup' : 'fastball';
        }

        console.log(`Pitch: ${pitchType}, Speed: ${speed.toFixed(0)} mph`);

        if (this.gameEngine && this.gameEngine.throwPitch) {
            this.gameEngine.throwPitch(pitchType, speed);
        }

        this.vibrate(40);
    }

    handleBaserunningTap(data) {
        const { x } = data;
        const screenWidth = window.innerWidth;

        // Left side = previous base, Right side = next base
        if (x < screenWidth / 2) {
            console.log('Return to previous base');
            if (this.gameEngine && this.gameEngine.runToPreviousBase) {
                this.gameEngine.runToPreviousBase();
            }
        } else {
            console.log('Advance to next base');
            if (this.gameEngine && this.gameEngine.advanceRunner) {
                this.gameEngine.advanceRunner();
            }
        }

        this.vibrate(25);
    }

    handleFieldingDoubleTap(data) {
        console.log('Dive for ball');

        if (this.gameEngine && this.gameEngine.dive) {
            this.gameEngine.dive(data.x, data.y);
        }

        this.vibrate([20, 50, 20]);
    }

    handleSpecialAbility(data) {
        console.log('Activate special ability');

        if (this.gameEngine && this.gameEngine.useSpecialAbility) {
            this.gameEngine.useSpecialAbility();
        }

        this.vibrate([30, 50, 30, 50, 30]);
    }

    setControlMode(mode) {
        this.controlMode = mode;
        console.log(`Control mode: ${mode}`);
    }

    vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}

/**
 * Touch-friendly UI controls
 */
class TouchUI {
    constructor(container) {
        this.container = container;
        this.buttons = [];
        this.joystick = null;
    }

    createButton(options) {
        const button = document.createElement('button');
        button.className = 'touch-button';
        button.textContent = options.label || '';
        button.style.cssText = `
            position: fixed;
            ${options.position || 'bottom: 20px; right: 20px;'}
            width: ${options.size || 80}px;
            height: ${options.size || 80}px;
            border-radius: 50%;
            background: rgba(255, 107, 53, 0.8);
            border: 3px solid rgba(255, 255, 255, 0.8);
            color: #fff;
            font-size: ${options.fontSize || 18}px;
            font-weight: bold;
            z-index: 1000;
            touch-action: manipulation;
            user-select: none;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;

        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.style.transform = 'scale(0.9)';
            if (options.onPress) options.onPress();
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.style.transform = 'scale(1)';
        });

        this.container.appendChild(button);
        this.buttons.push(button);

        return button;
    }

    createVirtualJoystick(options = {}) {
        const container = document.createElement('div');
        container.className = 'virtual-joystick';
        container.style.cssText = `
            position: fixed;
            ${options.position || 'bottom: 20px; left: 20px;'}
            width: 120px;
            height: 120px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.5);
            z-index: 1000;
        `;

        const stick = document.createElement('div');
        stick.className = 'joystick-stick';
        stick.style.cssText = `
            position: absolute;
            width: 50px;
            height: 50px;
            background: rgba(255, 107, 53, 0.8);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 2px solid #fff;
        `;

        container.appendChild(stick);
        this.container.appendChild(container);

        const maxDistance = 35;
        let active = false;
        let centerX = 60;
        let centerY = 60;

        container.addEventListener('touchstart', (e) => {
            active = true;
            e.preventDefault();
        });

        container.addEventListener('touchmove', (e) => {
            if (!active) return;
            e.preventDefault();

            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();
            const dx = touch.clientX - rect.left - centerX;
            const dy = touch.clientY - rect.top - centerY;
            const distance = Math.min(maxDistance, Math.sqrt(dx * dx + dy * dy));
            const angle = Math.atan2(dy, dx);

            const x = distance * Math.cos(angle);
            const y = distance * Math.sin(angle);

            stick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

            if (options.onChange) {
                options.onChange({
                    x: x / maxDistance,
                    y: y / maxDistance,
                    angle: angle * (180 / Math.PI),
                    distance: distance / maxDistance
                });
            }
        });

        const resetStick = () => {
            active = false;
            stick.style.transform = 'translate(-50%, -50%)';
            if (options.onRelease) options.onRelease();
        };

        container.addEventListener('touchend', resetStick);
        container.addEventListener('touchcancel', resetStick);

        this.joystick = { container, stick };
        return this.joystick;
    }

    destroy() {
        this.buttons.forEach(btn => btn.remove());
        if (this.joystick) {
            this.joystick.container.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TouchControls, BaseballTouchControls, TouchUI };
}
