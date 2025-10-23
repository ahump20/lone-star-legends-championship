/**
 * Pitcher Fatigue & Injury System
 * Realistic pitcher stamina, performance degradation, and injury risk
 */

class PitcherFatigueSystem {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.pitchers = new Map();
        this.listeners = [];

        // Fatigue configuration
        this.config = {
            maxStamina: 100,
            staminaDrainPerPitch: 1.5,
            staminaDrainFastball: 2.0,
            staminaDrainBreakingBall: 2.5,
            recoveryRatePerSecond: 0.5,
            fatigueThresholds: {
                fresh: 80,      // 80-100%: Peak performance
                normal: 60,     // 60-80%: Good performance
                tired: 40,      // 40-60%: Reduced performance
                fatigued: 20,   // 20-40%: Significantly reduced
                exhausted: 0    // 0-20%: Should be pulled
            },
            injuryRisk: {
                fresh: 0.001,
                normal: 0.005,
                tired: 0.015,
                fatigued: 0.035,
                exhausted: 0.08
            }
        };
    }

    /**
     * Register a pitcher
     */
    registerPitcher(pitcherId, pitcherData) {
        this.pitchers.set(pitcherId, {
            id: pitcherId,
            name: pitcherData.name,
            stamina: this.config.maxStamina,
            pitchCount: 0,
            inningsPitched: 0,
            isWarmedUp: false,
            restTime: 0,
            injuries: [],
            performance: {
                velocity: pitcherData.velocity || 90,
                control: pitcherData.control || 0.8,
                movement: pitcherData.movement || 0.7
            },
            basePerformance: {
                velocity: pitcherData.velocity || 90,
                control: pitcherData.control || 0.8,
                movement: pitcherData.movement || 0.7
            },
            history: []
        });

        console.log(`Pitcher registered: ${pitcherData.name}`);
    }

    /**
     * Get pitcher data
     */
    getPitcher(pitcherId) {
        return this.pitchers.get(pitcherId);
    }

    /**
     * Record a pitch
     */
    recordPitch(pitcherId, pitchType) {
        if (!this.enabled) return;

        const pitcher = this.pitchers.get(pitcherId);
        if (!pitcher) return;

        // Determine stamina drain
        let drain = this.config.staminaDrainPerPitch;

        if (pitchType === 'fastball' || pitchType === 'cutter') {
            drain = this.config.staminaDrainFastball;
        } else if (pitchType === 'curveball' || pitchType === 'slider' || pitchType === 'changeup') {
            drain = this.config.staminaDrainBreakingBall;
        }

        // Apply stamina drain
        pitcher.stamina = Math.max(0, pitcher.stamina - drain);
        pitcher.pitchCount++;

        // Update performance based on fatigue
        this.updatePerformance(pitcher);

        // Check for injury risk
        this.checkInjuryRisk(pitcher, pitchType);

        // Record to history
        pitcher.history.push({
            pitch: pitcher.pitchCount,
            type: pitchType,
            stamina: pitcher.stamina,
            fatigueLevel: this.getFatigueLevel(pitcher),
            timestamp: Date.now()
        });

        // Notify listeners
        this.notifyListeners('pitchThrown', {
            pitcherId,
            pitchType,
            stamina: pitcher.stamina,
            fatigueLevel: this.getFatigueLevel(pitcher)
        });
    }

    /**
     * End inning for pitcher
     */
    endInning(pitcherId) {
        const pitcher = this.pitchers.get(pitcherId);
        if (!pitcher) return;

        pitcher.inningsPitched++;

        // Small recovery during inning break
        this.rest(pitcherId, 120); // 2 minutes rest

        this.notifyListeners('inningCompleted', {
            pitcherId,
            inningsPitched: pitcher.inningsPitched,
            stamina: pitcher.stamina
        });
    }

    /**
     * Pitcher rests (in dugout)
     */
    rest(pitcherId, seconds) {
        const pitcher = this.pitchers.get(pitcherId);
        if (!pitcher) return;

        const recovery = this.config.recoveryRatePerSecond * seconds;
        pitcher.stamina = Math.min(this.config.maxStamina, pitcher.stamina + recovery);
        pitcher.restTime += seconds;

        this.updatePerformance(pitcher);
    }

    /**
     * Update pitcher performance based on fatigue
     */
    updatePerformance(pitcher) {
        const fatiguePercent = pitcher.stamina / this.config.maxStamina;

        // Velocity decreases with fatigue
        pitcher.performance.velocity = pitcher.basePerformance.velocity * (0.7 + fatiguePercent * 0.3);

        // Control decreases more dramatically
        pitcher.performance.control = pitcher.basePerformance.control * (0.5 + fatiguePercent * 0.5);

        // Movement slightly decreases
        pitcher.performance.movement = pitcher.basePerformance.movement * (0.8 + fatiguePercent * 0.2);
    }

    /**
     * Get fatigue level
     */
    getFatigueLevel(pitcher) {
        const stamina = pitcher.stamina;
        const thresholds = this.config.fatigueThresholds;

        if (stamina >= thresholds.fresh) return 'fresh';
        if (stamina >= thresholds.normal) return 'normal';
        if (stamina >= thresholds.tired) return 'tired';
        if (stamina >= thresholds.fatigued) return 'fatigued';
        return 'exhausted';
    }

    /**
     * Check if pitcher should be pulled
     */
    shouldPullPitcher(pitcherId) {
        const pitcher = this.pitchers.get(pitcherId);
        if (!pitcher) return false;

        const fatigueLevel = this.getFatigueLevel(pitcher);

        // Definitely pull if exhausted
        if (fatigueLevel === 'exhausted') return true;

        // Consider pulling if fatigued and high pitch count
        if (fatigueLevel === 'fatigued' && pitcher.pitchCount > 90) return true;

        // Consider pitch count limits
        if (pitcher.pitchCount > 120) return true;

        // Consider innings pitched
        if (pitcher.inningsPitched >= 9) return true;

        return false;
    }

    /**
     * Get recommendation for pitcher management
     */
    getRecommendation(pitcherId) {
        const pitcher = this.pitchers.get(pitcherId);
        if (!pitcher) return null;

        const fatigueLevel = this.getFatigueLevel(pitcher);
        const recommendations = [];

        if (fatigueLevel === 'exhausted') {
            recommendations.push({
                priority: 'critical',
                action: 'pull',
                message: 'Pitcher is exhausted! Pull immediately to prevent injury.',
                icon: '🚨'
            });
        }

        if (fatigueLevel === 'fatigued') {
            recommendations.push({
                priority: 'high',
                action: 'warmUpBullpen',
                message: 'Pitcher is fatigued. Start warming up a reliever.',
                icon: '⚠️'
            });
        }

        if (pitcher.pitchCount > 100) {
            recommendations.push({
                priority: 'medium',
                action: 'monitor',
                message: `High pitch count (${pitcher.pitchCount}). Monitor closely.`,
                icon: '📊'
            });
        }

        if (fatigueLevel === 'tired' && pitcher.inningsPitched >= 6) {
            recommendations.push({
                priority: 'medium',
                action: 'consider',
                message: 'Consider bringing in a reliever soon.',
                icon: '💭'
            });
        }

        if (pitcher.injuries.length > 0) {
            recommendations.push({
                priority: 'critical',
                action: 'medicalCheck',
                message: 'Pitcher has injury. Medical evaluation required.',
                icon: '🏥'
            });
        }

        return recommendations;
    }

    /**
     * Check for injury risk
     */
    checkInjuryRisk(pitcher, pitchType) {
        if (!this.enabled) return;

        const fatigueLevel = this.getFatigueLevel(pitcher);
        const risk = this.config.injuryRisk[fatigueLevel];

        // Higher risk for breaking balls when fatigued
        let adjustedRisk = risk;
        if ((pitchType === 'curveball' || pitchType === 'slider') && fatigueLevel !== 'fresh') {
            adjustedRisk *= 1.5;
        }

        // Roll for injury
        if (Math.random() < adjustedRisk) {
            this.causeInjury(pitcher);
        }
    }

    /**
     * Cause injury to pitcher
     */
    causeInjury(pitcher) {
        const injuries = [
            { type: 'armSoreness', severity: 'minor', name: 'Arm Soreness', duration: 1, effect: 0.9 },
            { type: 'shoulderTightness', severity: 'minor', name: 'Shoulder Tightness', duration: 2, effect: 0.85 },
            { type: 'elbowStrain', severity: 'moderate', name: 'Elbow Strain', duration: 5, effect: 0.7 },
            { type: 'shoulderStrain', severity: 'moderate', name: 'Shoulder Strain', duration: 7, effect: 0.65 },
            { type: 'tommyJohn', severity: 'severe', name: 'UCL Tear', duration: 365, effect: 0.0 }
        ];

        // Weighted selection (more severe injuries are rarer)
        const weights = [0.5, 0.3, 0.15, 0.04, 0.01];
        let rand = Math.random();
        let cumulative = 0;
        let selectedInjury = injuries[0];

        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (rand <= cumulative) {
                selectedInjury = injuries[i];
                break;
            }
        }

        const injury = {
            ...selectedInjury,
            occurredAt: Date.now(),
            gamesRemaining: selectedInjury.duration
        };

        pitcher.injuries.push(injury);

        // Apply injury effect to performance
        pitcher.performance.velocity *= injury.effect;
        pitcher.performance.control *= injury.effect;
        pitcher.performance.movement *= injury.effect;

        console.log(`⚠️ ${pitcher.name} suffered ${injury.name}`);

        this.notifyListeners('injuryOccurred', {
            pitcherId: pitcher.id,
            pitcher: pitcher.name,
            injury
        });
    }

    /**
     * Heal pitcher (after rest/games)
     */
    healPitcher(pitcherId, gamesRested) {
        const pitcher = this.pitchers.get(pitcherId);
        if (!pitcher) return;

        pitcher.injuries = pitcher.injuries.filter(injury => {
            injury.gamesRemaining -= gamesRested;
            if (injury.gamesRemaining <= 0) {
                console.log(`✅ ${pitcher.name} recovered from ${injury.name}`);
                this.notifyListeners('injuryHealed', {
                    pitcherId,
                    pitcher: pitcher.name,
                    injury
                });
                return false;
            }
            return true;
        });

        // Restore performance if no injuries
        if (pitcher.injuries.length === 0) {
            pitcher.performance = { ...pitcher.basePerformance };
        }

        // Full stamina recovery
        pitcher.stamina = this.config.maxStamina;
    }

    /**
     * Get pitcher stats summary
     */
    getPitcherStats(pitcherId) {
        const pitcher = this.pitchers.get(pitcherId);
        if (!pitcher) return null;

        return {
            name: pitcher.name,
            stamina: Math.round(pitcher.stamina),
            staminaPercent: Math.round((pitcher.stamina / this.config.maxStamina) * 100),
            fatigueLevel: this.getFatigueLevel(pitcher),
            pitchCount: pitcher.pitchCount,
            inningsPitched: pitcher.inningsPitched,
            performance: {
                velocity: Math.round(pitcher.performance.velocity),
                control: Math.round(pitcher.performance.control * 100),
                movement: Math.round(pitcher.performance.movement * 100)
            },
            injuries: pitcher.injuries.map(inj => ({
                name: inj.name,
                severity: inj.severity,
                gamesRemaining: inj.gamesRemaining
            })),
            recommendation: this.getRecommendation(pitcherId)
        };
    }

    /**
     * Reset pitcher for new game
     */
    resetPitcher(pitcherId) {
        const pitcher = this.pitchers.get(pitcherId);
        if (!pitcher) return;

        pitcher.stamina = this.config.maxStamina;
        pitcher.pitchCount = 0;
        pitcher.inningsPitched = 0;
        pitcher.isWarmedUp = false;
        pitcher.restTime = 0;
        pitcher.history = [];

        // Keep injuries but update performance
        this.updatePerformance(pitcher);
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    /**
     * Unregister event listener
     */
    off(event, callback) {
        this.listeners = this.listeners.filter(
            l => l.event !== event || l.callback !== callback
        );
    }

    /**
     * Notify listeners
     */
    notifyListeners(event, data) {
        this.listeners
            .filter(l => l.event === event || l.event === '*')
            .forEach(l => {
                try {
                    l.callback(event, data);
                } catch (error) {
                    console.error('Pitcher fatigue listener error:', error);
                }
            });
    }

    /**
     * Save state
     */
    saveState() {
        const state = {};
        this.pitchers.forEach((pitcher, id) => {
            state[id] = {
                stamina: pitcher.stamina,
                pitchCount: pitcher.pitchCount,
                inningsPitched: pitcher.inningsPitched,
                injuries: pitcher.injuries,
                performance: pitcher.performance
            };
        });
        return state;
    }

    /**
     * Load state
     */
    loadState(state) {
        Object.entries(state).forEach(([id, data]) => {
            const pitcher = this.pitchers.get(id);
            if (pitcher) {
                Object.assign(pitcher, data);
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.pitchers.clear();
        this.listeners = [];
    }
}

/**
 * Injury System
 * Manages player injuries beyond just pitchers
 */
class InjurySystem {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.players = new Map();
        this.listeners = [];

        // Injury types for position players
        this.injuryTypes = {
            minor: [
                { type: 'bruise', name: 'Bruised Leg', duration: 1, effect: 0.95 },
                { type: 'cramping', name: 'Muscle Cramp', duration: 1, effect: 0.9 },
                { type: 'soreness', name: 'General Soreness', duration: 2, effect: 0.93 }
            ],
            moderate: [
                { type: 'pulledMuscle', name: 'Pulled Hamstring', duration: 7, effect: 0.75 },
                { type: 'sprain', name: 'Ankle Sprain', duration: 10, effect: 0.7 },
                { type: 'concussion', name: 'Concussion', duration: 14, effect: 0.6 }
            ],
            severe: [
                { type: 'fracture', name: 'Fractured Bone', duration: 60, effect: 0.0 },
                { type: 'torn', name: 'Torn Ligament', duration: 120, effect: 0.0 }
            ]
        };

        // Injury risks by activity
        this.injuryRisks = {
            sliding: 0.02,
            collision: 0.05,
            diving: 0.015,
            running: 0.005,
            swing: 0.001
        };
    }

    /**
     * Register player
     */
    registerPlayer(playerId, playerData) {
        this.players.set(playerId, {
            id: playerId,
            name: playerData.name,
            injuries: [],
            durability: playerData.durability || 0.8
        });
    }

    /**
     * Check for injury on action
     */
    checkInjury(playerId, action) {
        if (!this.enabled) return false;

        const player = this.players.get(playerId);
        if (!player) return false;

        const risk = this.injuryRisks[action] || 0;

        // Adjust risk by player durability
        const adjustedRisk = risk * (1 - player.durability);

        if (Math.random() < adjustedRisk) {
            this.causeInjury(player, action);
            return true;
        }

        return false;
    }

    /**
     * Cause injury
     */
    causeInjury(player, action) {
        // Determine severity based on action
        let severity = 'minor';
        if (action === 'collision') {
            severity = Math.random() < 0.3 ? 'severe' : Math.random() < 0.6 ? 'moderate' : 'minor';
        } else if (action === 'diving' || action === 'sliding') {
            severity = Math.random() < 0.7 ? 'minor' : 'moderate';
        }

        const injuryOptions = this.injuryTypes[severity];
        const selectedInjury = injuryOptions[Math.floor(Math.random() * injuryOptions.length)];

        const injury = {
            ...selectedInjury,
            occurredAt: Date.now(),
            action,
            gamesRemaining: selectedInjury.duration
        };

        player.injuries.push(injury);

        console.log(`⚠️ ${player.name} suffered ${injury.name} from ${action}`);

        this.notifyListeners('injuryOccurred', {
            playerId: player.id,
            player: player.name,
            injury
        });

        return injury;
    }

    /**
     * Get player injury status
     */
    getInjuryStatus(playerId) {
        const player = this.players.get(playerId);
        if (!player) return null;

        return {
            injured: player.injuries.length > 0,
            injuries: player.injuries,
            effectMultiplier: this.getEffectMultiplier(player)
        };
    }

    /**
     * Get cumulative effect multiplier
     */
    getEffectMultiplier(player) {
        if (player.injuries.length === 0) return 1.0;

        // Multiple injuries compound
        return player.injuries.reduce((mult, injury) => mult * injury.effect, 1.0);
    }

    /**
     * Heal player
     */
    healPlayer(playerId, gamesRested) {
        const player = this.players.get(playerId);
        if (!player) return;

        player.injuries = player.injuries.filter(injury => {
            injury.gamesRemaining -= gamesRested;
            if (injury.gamesRemaining <= 0) {
                console.log(`✅ ${player.name} recovered from ${injury.name}`);
                this.notifyListeners('injuryHealed', {
                    playerId,
                    player: player.name,
                    injury
                });
                return false;
            }
            return true;
        });
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    /**
     * Notify listeners
     */
    notifyListeners(event, data) {
        this.listeners
            .filter(l => l.event === event || l.event === '*')
            .forEach(l => {
                try {
                    l.callback(event, data);
                } catch (error) {
                    console.error('Injury system listener error:', error);
                }
            });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PitcherFatigueSystem, InjurySystem };
}
