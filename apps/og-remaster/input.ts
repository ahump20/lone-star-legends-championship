/**
 * Kid-Friendly Input System
 * Simple controls optimized for both keyboard and touch
 */

import type { GameState } from '../../packages/rules/gameState';

export interface InputConfig {
  keyboard: {
    swing: string[];
    pitch: string[];
    advance: string[];
    menu: string[];
  };
  touch: {
    enabled: boolean;
    swipeThreshold: number;
    tapTimeout: number;
  };
}

export class InputManager {
  private state: GameState;
  private config: InputConfig;
  private pressedKeys = new Set<string>();
  private touchStartPos = { x: 0, y: 0 };
  private lastTapTime = 0;
  private callbacks: Map<string, Function[]> = new Map();

  constructor(state: GameState, config: Partial<InputConfig> = {}) {
    this.state = state;
    this.config = {
      keyboard: {
        swing: ['Space', ' '],
        pitch: ['Enter'],
        advance: ['ArrowRight', 'ArrowLeft'],
        menu: ['Escape', 'KeyM']
      },
      touch: {
        enabled: true,
        swipeThreshold: 50,
        tapTimeout: 300
      },
      ...config
    };
    
    this.attachEventListeners();
    this.setupMobileControls();
  }

  private attachEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Touch events for mobile
    if (this.config.touch.enabled) {
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }

    // Prevent default behaviors that could interfere
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());
  }

  private handleKeyDown(event: KeyboardEvent) {
    const key = event.code || event.key;
    
    // Prevent default for game keys
    if (this.isGameKey(key)) {
      event.preventDefault();
    }
    
    if (this.pressedKeys.has(key)) return; // Prevent key repeat
    
    this.pressedKeys.add(key);
    
    // Handle input based on game state
    this.processInput(key);
  }

  private handleKeyUp(event: KeyboardEvent) {
    const key = event.code || event.key;
    this.pressedKeys.delete(key);
  }

  private handleTouchStart(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    
    const now = Date.now();
    const timeSinceLastTap = now - this.lastTapTime;
    
    if (timeSinceLastTap < this.config.touch.tapTimeout) {
      // Double tap detected
      this.processInput('DoubleTap');
    }
    
    this.lastTapTime = now;
  }

  private handleTouchMove(event: TouchEvent) {
    event.preventDefault();
  }

  private handleTouchEnd(event: TouchEvent) {
    event.preventDefault();
    
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartPos.x;
      const deltaY = touch.clientY - this.touchStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance < this.config.touch.swipeThreshold) {
        // Tap (not swipe)
        this.processInput('Tap');
      } else {
        // Swipe gesture
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          this.processInput(deltaX > 0 ? 'SwipeRight' : 'SwipeLeft');
        } else {
          // Vertical swipe
          this.processInput(deltaY > 0 ? 'SwipeDown' : 'SwipeUp');
        }
      }
    }
  }

  private setupMobileControls() {
    const mobileControls = document.getElementById('mobileControls');
    const swingBtn = document.getElementById('swingBtn');
    const advanceBtn = document.getElementById('advanceBtn');
    
    if (this.isMobileDevice() && mobileControls) {
      mobileControls.classList.remove('hidden');
      
      swingBtn?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.processInput('MobileSwing');
      });
      
      advanceBtn?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.processInput('MobileAdvance');
      });
    }
  }

  private processInput(input: string) {
    console.log(`Input received: ${input}`);
    
    // Route input based on game phase
    if (this.state.gamePhase === 'pregame') {
      this.handleMenuInput(input);
    } else if (this.state.gamePhase === 'active') {
      this.handleGameplayInput(input);
    } else if (this.state.gamePhase === 'complete') {
      this.handleGameOverInput(input);
    }
    
    // Trigger any registered callbacks
    const callbacks = this.callbacks.get(input) || [];
    callbacks.forEach(callback => callback());
  }

  private handleMenuInput(input: string) {
    switch (input) {
      case 'Space':
      case 'Enter':
      case 'Tap':
        this.emit('startGame');
        break;
        
      case 'KeyM':
      case 'SwipeDown':
        this.emit('openMenu');
        break;
    }
  }

  private handleGameplayInput(input: string) {
    // Batting controls
    if (this.isSwingInput(input)) {
      const result = this.state.swingBat();
      this.emit('swing', result);
      return;
    }
    
    // Pitching controls
    if (this.isPitchInput(input)) {
      const result = this.state.pitch('strike');
      this.emit('pitch', result);
      return;
    }
    
    // Baserunning controls
    if (this.isAdvanceInput(input)) {
      this.state.advanceRunner(1);
      this.emit('advanceRunner');
      return;
    }
    
    // Special controls
    switch (input) {
      case 'KeyP':
        this.emit('pause');
        break;
        
      case 'KeyH':
        this.emit('hint');
        break;
        
      case 'SwipeUp':
        this.emit('showStats');
        break;
    }
  }

  private handleGameOverInput(input: string) {
    switch (input) {
      case 'Space':
      case 'Enter':
      case 'Tap':
        this.emit('restartGame');
        break;
        
      case 'Escape':
      case 'SwipeDown':
        this.emit('mainMenu');
        break;
    }
  }

  private isGameKey(key: string): boolean {
    const gameKeys = [
      ...this.config.keyboard.swing,
      ...this.config.keyboard.pitch,
      ...this.config.keyboard.advance,
      ...this.config.keyboard.menu,
      'KeyP', 'KeyH', 'ArrowUp', 'ArrowDown'
    ];
    
    return gameKeys.includes(key);
  }

  private isSwingInput(input: string): boolean {
    return this.config.keyboard.swing.includes(input) || 
           input === 'Tap' || 
           input === 'MobileSwing';
  }

  private isPitchInput(input: string): boolean {
    return this.config.keyboard.pitch.includes(input) || 
           input === 'DoubleTap' || 
           input === 'SwipeUp';
  }

  private isAdvanceInput(input: string): boolean {
    return this.config.keyboard.advance.includes(input) || 
           input === 'SwipeRight' || 
           input === 'SwipeLeft' || 
           input === 'MobileAdvance';
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           'ontouchstart' in window;
  }

  // Event system for decoupled communication
  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.callbacks.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  // Helper methods for accessibility
  showInputHints() {
    const hints = [
      'SPACE - Swing the bat',
      'ENTER - Pitch the ball',
      'ARROWS - Move runners',
      'P - Pause game',
      'H - Show this help'
    ];
    
    this.emit('showHints', hints);
  }

  enableKeyboardNavigation() {
    // Add visual focus indicators for keyboard users
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-focus {
        outline: 3px solid #BF5700 !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Input remapping for accessibility
  remapKey(oldKey: string, newKey: string) {
    for (const [action, keys] of Object.entries(this.config.keyboard)) {
      const keyArray = keys as string[];
      const index = keyArray.indexOf(oldKey);
      if (index > -1) {
        keyArray[index] = newKey;
        console.log(`Remapped ${oldKey} to ${newKey} for ${action}`);
      }
    }
  }

  getInputSummary() {
    return {
      currentlyPressed: Array.from(this.pressedKeys),
      config: this.config,
      isMobile: this.isMobileDevice()
    };
  }

  cleanup() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    this.callbacks.clear();
  }
}