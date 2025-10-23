/**
 * Special Abilities System
 * Manages and activates character special abilities during gameplay
 */

class SpecialAbilitiesManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.activeAbilities = [];
        this.abilityEffects = {};
        this.setupAbilityHandlers();
    }

    /**
     * Setup handlers for each ability type
     */
    setupAbilityHandlers() {
        this.abilityHandlers = {
            // Batting Abilities
            'mega_blast': (player) => {
                this.abilityEffects.guaranteedHomeRun = true;
                this.abilityEffects.megaBlastActive = true;
                return `${player.name} activates MEGA BLAST! Next hit is a guaranteed home run! 💥`;
            },

            'eagle_eye': (player) => {
                this.abilityEffects.perfectVision = true;
                this.abilityEffects.eagleEyeActive = true;
                return `${player.name} activates EAGLE EYE! Perfect strike zone vision! 👁️`;
            },

            'moon_shot': (player) => {
                this.abilityEffects.doublePower = true;
                this.abilityEffects.moonShotActive = true;
                return `${player.name} activates MOON SHOT! Hit travels twice as far! 🚀`;
            },

            'all_star': (player) => {
                this.abilityEffects.allStarBoost = {
                    player: player.name,
                    inningsRemaining: 1
                };
                return `${player.name} activates ALL-STAR MODE! All stats boosted for this inning! ⭐`;
            },

            // Pitching Abilities
            'rocket_arm': (player) => {
                this.abilityEffects.unhittablePitch = true;
                this.abilityEffects.rocketArmActive = true;
                return `${player.name} activates ROCKET ARM! Unhittable fastball incoming! 🚀`;
            },

            'trick_pitch': (player) => {
                this.abilityEffects.trickPitch = true;
                this.abilityEffects.trickPitchActive = true;
                return `${player.name} activates TRICK PITCH! Batter is confused! 🌀`;
            },

            // Running Abilities
            'lightning_speed': (player) => {
                this.abilityEffects.extraBase = true;
                this.abilityEffects.lightningSpeedActive = true;
                return `${player.name} activates LIGHTNING SPEED! Extra base on any hit! ⚡`;
            },

            'speedster': (player) => {
                this.abilityEffects.autoSteal = true;
                this.abilityEffects.speedsterActive = true;
                return `${player.name} activates SPEEDSTER! Steals an extra base! 💨`;
            },

            // Fielding Abilities
            'wall_climber': (player) => {
                this.abilityEffects.superCatch = true;
                this.abilityEffects.wallClimberActive = true;
                return `${player.name} activates SUPER CATCH! Can catch anything! 🧤`;
            },

            'laser_throw': (player) => {
                this.abilityEffects.perfectThrow = true;
                this.abilityEffects.laserThrowActive = true;
                return `${player.name} activates LASER THROW! Perfect throw to any base! 🎯`;
            },

            'magnetic_glove': (player) => {
                this.abilityEffects.magneticField = true;
                this.abilityEffects.magneticGloveActive = true;
                return `${player.name} activates MAGNETIC GLOVE! Auto-catch mode! 🧲`;
            },

            'defensive_wall': (player) => {
                this.abilityEffects.impenetrableDefense = true;
                this.abilityEffects.defensiveWallActive = true;
                return `${player.name} activates THE WALL! Impenetrable infield defense! 🛡️`;
            },

            'bike_speed': (player) => {
                this.abilityEffects.coverEntireField = true;
                this.abilityEffects.bikeSpeedActive = true;
                return `${player.name} activates BIKE SPEED! Covers the entire outfield! 🚴`;
            },

            // Team Abilities
            'rally_starter': (player) => {
                this.abilityEffects.rallyBoost = {
                    active: true,
                    nextBatterBonus: 0.2
                };
                return `${player.name} starts a RALLY! Next batter gets a boost! 🔥`;
            },

            'spark_plug': (player) => {
                this.abilityEffects.teamBoost = {
                    active: true,
                    battingBonus: 0.15,
                    inningsRemaining: 2
                };
                return `${player.name} ENERGIZES THE TEAM! Everyone gets a stat boost! ✨`;
            },

            // Passive Abilities (auto-trigger)
            'clutch_gene': (player) => {
                // Checked automatically in late innings
                return null;
            },

            'ice_veins': (player) => {
                // Checked automatically in pressure situations
                return null;
            },

            'hot_streak': (player) => {
                // Checked automatically after hits
                return null;
            }
        };
    }

    /**
     * Activate a player's special ability
     */
    activateAbility(player) {
        if (!player.specialAbility || !player.specialAbility.available) {
            return { success: false, message: 'Ability not available!' };
        }

        const abilityId = player.specialAbility.id;
        const handler = this.abilityHandlers[abilityId];

        if (!handler) {
            return { success: false, message: 'Unknown ability!' };
        }

        const message = handler(player);

        // Mark ability as used
        player.specialAbility.available = false;
        if (player.specialAbility.usesRemaining) {
            player.specialAbility.usesRemaining--;
        }

        // Track active ability
        this.activeAbilities.push({
            player: player.name,
            ability: abilityId,
            timestamp: Date.now()
        });

        return {
            success: true,
            message: message || `${player.name} activated ${player.specialAbility.name}!`,
            effect: abilityId
        };
    }

    /**
     * Check if ability should auto-trigger (passive abilities)
     */
    checkPassiveAbilities(player, situation) {
        if (!player.specialAbility) return false;

        const abilityId = player.specialAbility.id;

        switch (abilityId) {
            case 'clutch_gene':
                // Trigger in innings 7-9 or when behind
                if (this.gameEngine.currentInning >= 7 ||
                    this.gameEngine.currentBattingTeam.score < this.gameEngine.currentFieldingTeam.score) {
                    return { boost: 0.15, type: 'batting' };
                }
                break;

            case 'ice_veins':
                // Trigger in high-pressure situations
                const pressure = this.calculatePressure();
                if (pressure > 0.7) {
                    return { boost: 0.20, type: 'clutch' };
                }
                break;

            case 'hot_streak':
                // Trigger after getting a hit
                if (player.lastOutcome === 'hit') {
                    return { boost: 0.12, type: 'batting' };
                }
                break;

            case 'lightning_speed':
            case 'speedster':
                // Auto-activate on hits
                if (situation === 'onBase') {
                    return { boost: 1, type: 'running' };
                }
                break;
        }

        return false;
    }

    /**
     * Calculate current game pressure (0-1)
     */
    calculatePressure() {
        let pressure = 0;

        // Late innings increase pressure
        if (this.gameEngine.currentInning >= 7) pressure += 0.3;
        if (this.gameEngine.currentInning === 9) pressure += 0.2;

        // Close game increases pressure
        const scoreDiff = Math.abs(
            this.gameEngine.currentBattingTeam.score -
            this.gameEngine.currentFieldingTeam.score
        );
        if (scoreDiff <= 1) pressure += 0.2;
        if (scoreDiff === 0) pressure += 0.1;

        // Runners on base increase pressure
        const runnersOn = this.gameEngine.bases.filter(b => b !== null).length;
        pressure += runnersOn * 0.1;

        // Two outs increase pressure
        if (this.gameEngine.outs === 2) pressure += 0.15;

        return Math.min(pressure, 1);
    }

    /**
     * Modify pitch outcome based on active abilities
     */
    modifyPitchOutcome(outcome, pitcher, batter) {
        let modifiedOutcome = outcome;

        // Rocket Arm - unhittable pitch
        if (this.abilityEffects.unhittablePitch && pitcher.specialAbility?.id === 'rocket_arm') {
            modifiedOutcome = 'swing_miss';
            this.abilityEffects.unhittablePitch = false;
            return { outcome: modifiedOutcome, message: '⚡ UNHITTABLE FASTBALL! Strikeout!' };
        }

        // Trick Pitch - high strikeout chance
        if (this.abilityEffects.trickPitch && pitcher.specialAbility?.id === 'trick_pitch') {
            if (Math.random() < 0.7) {
                modifiedOutcome = 'swing_miss';
            }
            this.abilityEffects.trickPitch = false;
            return { outcome: modifiedOutcome, message: '🌀 Trick pitch confuses the batter!' };
        }

        // Eagle Eye - perfect vision, only swings at strikes
        if (this.abilityEffects.perfectVision && batter.specialAbility?.id === 'eagle_eye') {
            if (outcome === 'ball') {
                this.abilityEffects.perfectVision = false;
                return { outcome: 'ball', message: '👁️ Eagle eye takes the ball! Walk!' };
            }
        }

        // Mega Blast - guaranteed home run on contact
        if (this.abilityEffects.guaranteedHomeRun && batter.specialAbility?.id === 'mega_blast') {
            if (['single', 'double', 'triple', 'home_run'].includes(outcome)) {
                modifiedOutcome = 'home_run';
                this.abilityEffects.guaranteedHomeRun = false;
                return { outcome: modifiedOutcome, message: '💥 MEGA BLAST! MASSIVE HOME RUN!' };
            }
        }

        // Moon Shot - double power
        if (this.abilityEffects.doublePower && batter.specialAbility?.id === 'moon_shot') {
            if (['single', 'double'].includes(outcome)) {
                modifiedOutcome = 'home_run';
            } else if (outcome === 'triple') {
                modifiedOutcome = 'home_run';
            }
            this.abilityEffects.doublePower = false;
            return { outcome: modifiedOutcome, message: '🚀 MOON SHOT! Ball travels to space!' };
        }

        return { outcome: modifiedOutcome, message: null };
    }

    /**
     * Modify fielding outcome based on active abilities
     */
    modifyFieldingOutcome(hitType, fielder) {
        let modified = hitType;

        // Super Catch - catches everything
        if (this.abilityEffects.superCatch) {
            if (['single', 'double', 'triple', 'home_run'].includes(hitType)) {
                modified = 'fly_out';
                this.abilityEffects.superCatch = false;
                return {
                    outcome: modified,
                    message: `🧤 SUPER CATCH! ${fielder?.name || 'Fielder'} makes an impossible catch!`
                };
            }
        }

        // Magnetic Glove - auto-catch
        if (this.abilityEffects.magneticField) {
            if (['ground_out', 'fly_out', 'line_out'].includes(hitType)) {
                this.abilityEffects.magneticField = false;
                return {
                    outcome: modified,
                    message: `🧲 MAGNETIC GLOVE! Ball attracted to the glove!`
                };
            }
        }

        // Defensive Wall - impenetrable infield
        if (this.abilityEffects.impenetrableDefense) {
            if (hitType === 'single' || hitType === 'ground_out') {
                modified = 'ground_out';
                this.abilityEffects.impenetrableDefense = false;
                return {
                    outcome: modified,
                    message: `🛡️ THE WALL! Nothing gets through!`
                };
            }
        }

        return { outcome: modified, message: null };
    }

    /**
     * Modify base running based on abilities
     */
    modifyBaseRunning(basesAdvanced, runner) {
        let modified = basesAdvanced;
        let message = null;

        // Lightning Speed - extra base
        if (this.abilityEffects.extraBase && runner?.specialAbility?.id === 'lightning_speed') {
            modified += 1;
            this.abilityEffects.extraBase = false;
            message = `⚡ LIGHTNING SPEED! ${runner.name} takes an extra base!`;
        }

        // Speedster - auto steal
        if (this.abilityEffects.autoSteal && runner?.specialAbility?.id === 'speedster') {
            modified += 1;
            this.abilityEffects.autoSteal = false;
            message = `💨 SPEEDSTER! ${runner.name} steals an extra base!`;
        }

        return { basesAdvanced: modified, message };
    }

    /**
     * Apply stat boosts from active team abilities
     */
    getStatBoost(player, statType) {
        let boost = 0;

        // All-Star Mode
        if (this.abilityEffects.allStarBoost &&
            this.abilityEffects.allStarBoost.player === player.name) {
            boost += 0.25; // 25% boost to all stats
        }

        // Rally Boost
        if (this.abilityEffects.rallyBoost &&
            this.abilityEffects.rallyBoost.active) {
            boost += this.abilityEffects.rallyBoost.nextBatterBonus;
            this.abilityEffects.rallyBoost.active = false; // One-time boost
        }

        // Team Boost
        if (this.abilityEffects.teamBoost &&
            this.abilityEffects.teamBoost.active) {
            boost += this.abilityEffects.teamBoost.battingBonus;
        }

        // Check passive abilities
        const passiveBoost = this.checkPassiveAbilities(player, 'batting');
        if (passiveBoost && passiveBoost.type === statType) {
            boost += passiveBoost.boost;
        }

        return boost;
    }

    /**
     * Update abilities at end of inning
     */
    updateEndOfInning() {
        // Decrease inning-based ability durations
        if (this.abilityEffects.allStarBoost) {
            this.abilityEffects.allStarBoost.inningsRemaining--;
            if (this.abilityEffects.allStarBoost.inningsRemaining <= 0) {
                delete this.abilityEffects.allStarBoost;
            }
        }

        if (this.abilityEffects.teamBoost) {
            this.abilityEffects.teamBoost.inningsRemaining--;
            if (this.abilityEffects.teamBoost.inningsRemaining <= 0) {
                delete this.abilityEffects.teamBoost;
            }
        }
    }

    /**
     * Check if player can use ability
     */
    canUseAbility(player) {
        if (!player.specialAbility) return false;
        if (!player.specialAbility.available) return false;
        if (player.specialAbility.usesRemaining <= 0) return false;
        return true;
    }

    /**
     * Get ability cooldown status
     */
    getAbilityStatus(player) {
        if (!player.specialAbility) {
            return { available: false, reason: 'No special ability' };
        }

        if (player.specialAbility.available) {
            return {
                available: true,
                name: player.specialAbility.name,
                description: player.specialAbility.description
            };
        }

        return {
            available: false,
            reason: 'Ability on cooldown',
            usesRemaining: player.specialAbility.usesRemaining
        };
    }

    /**
     * Reset all ability effects (for new at-bat)
     */
    resetAtBatEffects() {
        // Keep inning-based effects, clear at-bat effects
        const keepEffects = ['allStarBoost', 'teamBoost'];
        Object.keys(this.abilityEffects).forEach(key => {
            if (!keepEffects.includes(key)) {
                delete this.abilityEffects[key];
            }
        });
    }

    /**
     * Get current active abilities for UI display
     */
    getActiveAbilities() {
        return this.activeAbilities.filter(ability => {
            // Keep recent abilities (last 30 seconds)
            return Date.now() - ability.timestamp < 30000;
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpecialAbilitiesManager;
}
