/**
 * Advanced Baseball Mechanics System
 * Adds stealing, bunting, intentional walks, and other advanced gameplay
 */

class AdvancedMechanicsSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.stealingInProgress = false;
        this.buntMode = false;
        this.intentionalWalkMode = false;

        // Mechanics configuration
        this.config = {
            stealing: {
                baseSuccessRate: 0.7,
                speedMultiplier: 0.3,
                leadoffBonus: 0.1,
                pitcherPenalty: 0.15
            },
            bunting: {
                baseSuccessRate: 0.6,
                battingSkillMultiplier: 0.2,
                sacrificeBonus: 0.15
            },
            intentionalWalk: {
                ballsRequired: 4,
                pitchDelay: 1000
            }
        };

        this.setupControls();
    }

    /**
     * Setup keyboard controls for advanced mechanics
     */
    setupControls() {
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyS':
                    if (!event.ctrlKey && !event.metaKey) {
                        this.attemptSteal();
                    }
                    break;
                case 'KeyB':
                    this.toggleBuntMode();
                    break;
                case 'KeyI':
                    this.toggleIntentionalWalk();
                    break;
                case 'KeyL':
                    this.takeLeadoff();
                    break;
            }
        });
    }

    /**
     * Attempt to steal a base
     */
    attemptSteal(runnerBaseIndex = 0) {
        if (this.stealingInProgress) {
            console.log('⚠️ Steal already in progress');
            return false;
        }

        // Check if there are runners on base
        const bases = this.gameEngine.bases || [false, false, false];
        const runnersOnBase = bases.map((occupied, index) => occupied ? index : -1).filter(i => i >= 0);

        if (runnersOnBase.length === 0) {
            console.log('⚠️ No runners on base to steal');
            return false;
        }

        // Get the lead runner
        const stealingFromBase = runnersOnBase[runnersOnBase.length - 1];
        const runner = bases[stealingFromBase];

        if (!runner || typeof runner !== 'object') {
            console.log('⚠️ Invalid runner data');
            return false;
        }

        this.stealingInProgress = true;

        // Calculate steal success probability
        const successRate = this.calculateStealSuccessRate(runner, stealingFromBase);
        const success = Math.random() < successRate;

        console.log(`🏃 ${runner.name || 'Runner'} attempting to steal! Success rate: ${(successRate * 100).toFixed(0)}%`);

        // Animate the steal attempt
        this.animateStealAttempt(stealingFromBase, success, runner);

        return success;
    }

    /**
     * Calculate steal success rate based on runner stats and game state
     */
    calculateStealSuccessRate(runner, fromBase) {
        let successRate = this.config.stealing.baseSuccessRate;

        // Speed factor
        if (runner.stats && runner.stats.speed) {
            const speedBonus = (runner.stats.speed - 5) * this.config.stealing.speedMultiplier / 10;
            successRate += speedBonus;
        }

        // Lead distance (if runner took a leadoff)
        if (runner.hasLead) {
            successRate += this.config.stealing.leadoffBonus;
        }

        // Pitcher's ability to hold runners
        const pitcher = this.gameEngine.currentPitcher;
        if (pitcher && pitcher.stats && pitcher.stats.pitching > 7) {
            successRate -= this.config.stealing.pitcherPenalty;
        }

        // Catcher's throwing ability
        const catcher = this.gameEngine.catcher;
        if (catcher && catcher.stats && catcher.stats.fielding > 8) {
            successRate -= 0.1;
        }

        // Double steal is harder
        const runnersOnBase = this.gameEngine.bases.filter(b => b).length;
        if (runnersOnBase > 1) {
            successRate -= 0.15;
        }

        // Base difficulty (stealing home is hardest)
        if (fromBase === 2) {
            successRate -= 0.2; // Stealing home
        }

        // Clamp between 0.1 and 0.95
        return Math.max(0.1, Math.min(0.95, successRate));
    }

    /**
     * Animate steal attempt
     */
    animateStealAttempt(fromBase, success, runner) {
        const toBase = fromBase + 1;

        // Show notification
        this.showMechanicNotification(
            success ? `✅ SAFE! ${runner.name || 'Runner'} steals ${this.getBaseName(toBase)}!` :
                     `❌ OUT! ${runner.name || 'Runner'} caught stealing!`,
            success ? 'success' : 'failure'
        );

        // Update game state
        setTimeout(() => {
            if (success) {
                // Move runner to next base
                if (this.gameEngine.bases) {
                    this.gameEngine.bases[fromBase] = false;
                    if (toBase < 3) {
                        this.gameEngine.bases[toBase] = runner;
                    } else {
                        // Runner scores
                        if (this.gameEngine.homeScore !== undefined) {
                            this.gameEngine.homeScore++;
                            this.gameEngine.updateScore?.();
                        }
                    }
                }

                // Track stat
                if (window.saveSystem) {
                    window.saveSystem.updateStats({ stolenBases: 1 });
                }
            } else {
                // Runner is out
                this.gameEngine.bases[fromBase] = false;
                if (this.gameEngine.outs !== undefined) {
                    this.gameEngine.outs++;
                }
            }

            this.stealingInProgress = false;
        }, 1500);
    }

    /**
     * Toggle bunt mode
     */
    toggleBuntMode() {
        this.buntMode = !this.buntMode;

        this.showMechanicNotification(
            this.buntMode ? '🎯 BUNT MODE ACTIVATED' : '⚾ BUNT MODE DEACTIVATED',
            this.buntMode ? 'info' : 'neutral'
        );

        // Visual indicator
        if (this.gameEngine.bat) {
            if (this.buntMode) {
                this.gameEngine.bat.material.color.setHex(0xFFFF00);
            } else {
                this.gameEngine.bat.material.color.setHex(0x8B4513);
            }
        }

        return this.buntMode;
    }

    /**
     * Execute bunt
     */
    executeBunt(batter, pitcher) {
        if (!this.buntMode) {
            return null;
        }

        console.log(`🎯 ${batter.name} attempts to bunt`);

        // Calculate bunt success
        const successRate = this.calculateBuntSuccessRate(batter);
        const success = Math.random() < successRate;

        if (success) {
            // Bunt result - slow ground ball
            const result = {
                contact: true,
                type: 'bunt',
                velocity: {
                    x: (Math.random() - 0.5) * 0.3,
                    y: 0.1,
                    z: -0.4
                },
                distance: 0.2 + Math.random() * 0.3,
                advancement: 'single' // Usually advances runners
            };

            this.showMechanicNotification(`✅ ${batter.name} lays down a bunt!`, 'success');
            return result;
        } else {
            // Failed bunt
            this.showMechanicNotification(`❌ ${batter.name} pops up the bunt!`, 'failure');
            return {
                contact: true,
                type: 'popup',
                velocity: { x: 0, y: 0.5, z: -0.2 },
                distance: 0.1,
                advancement: 'out'
            };
        }
    }

    /**
     * Calculate bunt success rate
     */
    calculateBuntSuccessRate(batter) {
        let successRate = this.config.bunting.baseSuccessRate;

        // Batting skill
        if (batter.stats && batter.stats.batting) {
            const skillBonus = (batter.stats.batting - 5) * this.config.bunting.battingSkillMultiplier / 10;
            successRate += skillBonus;
        }

        // Sacrifice situation (runners in scoring position)
        const bases = this.gameEngine.bases || [];
        if (bases[1] || bases[2]) {
            successRate += this.config.bunting.sacrificeBonus;
        }

        return Math.max(0.3, Math.min(0.85, successRate));
    }

    /**
     * Toggle intentional walk mode
     */
    toggleIntentionalWalk() {
        this.intentionalWalkMode = !this.intentionalWalkMode;

        this.showMechanicNotification(
            this.intentionalWalkMode ? '🚶 INTENTIONAL WALK ACTIVATED' : '⚾ INTENTIONAL WALK CANCELLED',
            this.intentionalWalkMode ? 'info' : 'neutral'
        );

        if (this.intentionalWalkMode) {
            this.executeIntentionalWalk();
        }

        return this.intentionalWalkMode;
    }

    /**
     * Execute intentional walk
     */
    executeIntentionalWalk() {
        console.log('🚶 Executing intentional walk');

        let ballsThrown = 0;

        const throwBall = () => {
            if (ballsThrown >= this.config.intentionalWalk.ballsRequired) {
                // Walk complete
                this.showMechanicNotification('🚶 Intentional Walk Complete', 'info');

                // Add batter to first base
                if (this.gameEngine.bases) {
                    // Advance all runners
                    if (this.gameEngine.bases[0]) {
                        // Force runners to advance
                        this.gameEngine.bases[2] = this.gameEngine.bases[1] || false;
                        this.gameEngine.bases[1] = this.gameEngine.bases[0];
                    }
                    this.gameEngine.bases[0] = this.gameEngine.currentBatter || true;
                }

                this.intentionalWalkMode = false;
                return;
            }

            ballsThrown++;
            this.showMechanicNotification(`Ball ${ballsThrown}`, 'neutral');

            setTimeout(throwBall, this.config.intentionalWalk.pitchDelay);
        };

        throwBall();
    }

    /**
     * Take a leadoff from base
     */
    takeLeadoff(baseIndex = 0) {
        const bases = this.gameEngine.bases || [];
        const runnersOnBase = bases.map((occupied, index) => occupied ? index : -1).filter(i => i >= 0);

        if (runnersOnBase.length === 0) {
            console.log('⚠️ No runners to take a leadoff');
            return false;
        }

        const leadingBase = runnersOnBase[runnersOnBase.length - 1];
        const runner = bases[leadingBase];

        if (runner && typeof runner === 'object') {
            runner.hasLead = true;
            this.showMechanicNotification(`👟 ${runner.name || 'Runner'} takes a leadoff`, 'info');
            return true;
        }

        return false;
    }

    /**
     * Hit and run play
     */
    executeHitAndRun() {
        console.log('⚡ HIT AND RUN activated');

        // Runners start running as pitch is thrown
        this.showMechanicNotification('⚡ HIT AND RUN!', 'info');

        // All runners attempt to steal
        const bases = this.gameEngine.bases || [];
        bases.forEach((runner, index) => {
            if (runner) {
                setTimeout(() => {
                    this.attemptSteal(index);
                }, 100 * index);
            }
        });
    }

    /**
     * Squeeze play (bunt with runner on third)
     */
    executeSqueezePlay() {
        const bases = this.gameEngine.bases || [];

        if (!bases[2]) {
            console.log('⚠️ No runner on third for squeeze play');
            return false;
        }

        console.log('🎯 SQUEEZE PLAY activated');
        this.showMechanicNotification('🎯 SQUEEZE PLAY!', 'info');

        // Activate bunt mode
        this.buntMode = true;

        // Runner on third goes on contact
        return true;
    }

    /**
     * Pitchout (defensive play to catch stealing)
     */
    executePitchout() {
        console.log('🎯 PITCHOUT called');
        this.showMechanicNotification('🎯 PITCHOUT!', 'info');

        // High and outside pitch, easier for catcher to throw out runner
        return {
            type: 'pitchout',
            catcherBonus: 0.3, // 30% better chance to throw out
            batterPenalty: 0.5  // Much harder to hit
        };
    }

    /**
     * Show mechanic notification
     */
    showMechanicNotification(message, type = 'info') {
        // Create or update notification element
        let notification = document.getElementById('mechanicNotification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'mechanicNotification';
            notification.style.cssText = `
                position: fixed;
                top: 120px;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 18px;
                font-weight: bold;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
                text-align: center;
                min-width: 250px;
            `;
            document.body.appendChild(notification);
        }

        // Set color based on type
        const colors = {
            success: { bg: 'rgba(76, 175, 80, 0.9)', text: 'white' },
            failure: { bg: 'rgba(244, 67, 54, 0.9)', text: 'white' },
            info: { bg: 'rgba(33, 150, 243, 0.9)', text: 'white' },
            neutral: { bg: 'rgba(158, 158, 158, 0.9)', text: 'white' }
        };

        const color = colors[type] || colors.info;
        notification.style.background = color.bg;
        notification.style.color = color.text;
        notification.textContent = message;

        // Show notification
        notification.style.opacity = '1';

        // Hide after 2 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 2000);
    }

    /**
     * Get base name
     */
    getBaseName(baseIndex) {
        const names = ['First Base', 'Second Base', 'Third Base', 'Home Plate'];
        return names[baseIndex] || 'Unknown Base';
    }

    /**
     * Get control help text
     */
    getControlsHelp() {
        return `
            <div style="background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; font-size: 14px;">
                <h3 style="color: #FF6B35; margin-bottom: 10px;">⚾ Advanced Controls</h3>
                <div style="display: grid; gap: 5px;">
                    <div><strong>S</strong> - Attempt to Steal Base</div>
                    <div><strong>B</strong> - Toggle Bunt Mode</div>
                    <div><strong>I</strong> - Intentional Walk</div>
                    <div><strong>L</strong> - Take Leadoff</div>
                    <div><strong>H</strong> - Hit and Run</div>
                    <div><strong>Q</strong> - Squeeze Play</div>
                    <div><strong>P</strong> - Pitchout (Defense)</div>
                </div>
            </div>
        `;
    }

    /**
     * Add controls help to game UI
     */
    addControlsHelp() {
        const helpButton = document.createElement('button');
        helpButton.textContent = '❓ Controls';
        helpButton.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 20px;
            padding: 10px 20px;
            background: rgba(255, 107, 53, 0.9);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 100;
            font-weight: bold;
        `;

        helpButton.onclick = () => {
            const existingHelp = document.getElementById('advancedControlsHelp');
            if (existingHelp) {
                existingHelp.remove();
            } else {
                const helpDiv = document.createElement('div');
                helpDiv.id = 'advancedControlsHelp';
                helpDiv.innerHTML = this.getControlsHelp();
                helpDiv.style.cssText = `
                    position: fixed;
                    bottom: 160px;
                    right: 20px;
                    z-index: 101;
                `;
                document.body.appendChild(helpDiv);

                // Auto-hide after 10 seconds
                setTimeout(() => {
                    helpDiv.remove();
                }, 10000);
            }
        };

        document.body.appendChild(helpButton);
    }

    /**
     * Initialize the advanced mechanics UI
     */
    initialize() {
        console.log('⚾ Advanced Baseball Mechanics initialized');
        this.addControlsHelp();

        // Add status indicator
        const statusDiv = document.createElement('div');
        statusDiv.id = 'advancedMechanicsStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 200px;
            right: 20px;
            background: rgba(10, 14, 39, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-size: 12px;
            z-index: 100;
            border: 1px solid #FF6B35;
            min-width: 150px;
        `;
        statusDiv.innerHTML = `
            <div style="color: #FF6B35; font-weight: bold; margin-bottom: 8px;">MECHANICS</div>
            <div id="buntStatus">🎯 Bunt: OFF</div>
            <div id="stealStatus">🏃 Steal: Ready</div>
        `;
        document.body.appendChild(statusDiv);

        // Update status periodically
        setInterval(() => {
            const buntStatus = document.getElementById('buntStatus');
            const stealStatus = document.getElementById('stealStatus');

            if (buntStatus) {
                buntStatus.textContent = `🎯 Bunt: ${this.buntMode ? 'ON' : 'OFF'}`;
                buntStatus.style.color = this.buntMode ? '#4CAF50' : 'white';
            }

            if (stealStatus) {
                stealStatus.textContent = `🏃 Steal: ${this.stealingInProgress ? 'In Progress' : 'Ready'}`;
                stealStatus.style.color = this.stealingInProgress ? '#FFA500' : 'white';
            }
        }, 100);
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedMechanicsSystem;
}
