/**
 * InputManager - Handles all user input for the game
 * Supports keyboard, mouse, and touch controls
 */
export class InputManager {
    constructor() {
        this.callbacks = new Map();
        this.keyStates = new Map();
        this.canvas = null;
        this.enabled = true;
        this.setupKeyboardListeners();
    }
    /**
     * Set the canvas for mouse/touch input
     */
    setCanvas(canvas) {
        this.canvas = canvas;
        this.setupMouseListeners();
        this.setupTouchListeners();
    }
    /**
     * Register a callback for an input action
     */
    on(action, callback) {
        if (!this.callbacks.has(action)) {
            this.callbacks.set(action, []);
        }
        this.callbacks.get(action).push(callback);
    }
    /**
     * Remove a callback for an input action
     */
    off(action, callback) {
        const callbacks = this.callbacks.get(action);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    /**
     * Trigger an input action
     */
    trigger(action, data) {
        if (!this.enabled)
            return;
        const callbacks = this.callbacks.get(action);
        if (callbacks) {
            callbacks.forEach(cb => cb(action, data));
        }
    }
    /**
     * Enable/disable input
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Check if a key is currently pressed
     */
    isKeyDown(key) {
        return this.keyStates.get(key) || false;
    }
    /**
     * Setup keyboard event listeners
     */
    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            this.keyStates.set(e.key, true);
            this.handleKeyDown(e);
        });
        window.addEventListener('keyup', (e) => {
            this.keyStates.set(e.key, false);
        });
    }
    /**
     * Handle keydown events
     */
    handleKeyDown(e) {
        if (!this.enabled)
            return;
        // Prevent default for game keys
        const gameKeys = [' ', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (gameKeys.includes(e.key)) {
            e.preventDefault();
        }
        switch (e.key) {
            case ' ':
            case 'Enter':
                // Space or Enter to swing
                this.trigger('swing', {
                    timing: Math.random(), // Random timing for now
                    power: 0.5 + Math.random() * 0.5 // Random power between 0.5 and 1.0
                });
                break;
            case 'p':
            case 'P':
                // P to pitch
                this.trigger('pitch', {
                    location: { x: 512 + (Math.random() - 0.5) * 100, y: 550 },
                    speed: 0.8 + Math.random() * 0.4
                });
                break;
            case 's':
            case 'S':
                // S to steal
                this.trigger('steal');
                break;
            case 'Escape':
                // Escape to pause/menu
                this.trigger('pause');
                break;
            case 'm':
            case 'M':
                this.trigger('menu');
                break;
        }
    }
    /**
     * Setup mouse event listeners
     */
    setupMouseListeners() {
        if (!this.canvas)
            return;
        this.canvas.addEventListener('click', (e) => {
            if (!this.enabled)
                return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // Click to swing
            this.trigger('swing', {
                timing: 0.5 + (Math.random() - 0.5) * 0.3,
                power: 0.5 + (y / rect.height) * 0.5
            });
        });
    }
    /**
     * Setup touch event listeners
     */
    setupTouchListeners() {
        if (!this.canvas)
            return;
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.enabled)
                return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            // Touch to swing
            this.trigger('swing', {
                timing: 0.5 + (Math.random() - 0.5) * 0.3,
                power: 0.5 + (y / rect.height) * 0.5
            });
        });
    }
    /**
     * Cleanup event listeners
     */
    destroy() {
        // Remove event listeners
        this.callbacks.clear();
        this.keyStates.clear();
    }
}
