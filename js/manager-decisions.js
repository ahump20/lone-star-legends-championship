/**
 * Manager Decisions & Difficulty System
 * Strategic gameplay decisions and adaptive difficulty
 */

class ManagerDecisions {
    constructor(gameEngine, options = {}) {
        this.gameEngine = gameEngine;
        this.enabled = options.enabled !== false;
        this.listeners = [];

        // Decision history
        this.decisions = [];

        // AI manager for opponent
        this.aiManager = new AIManager(this);
    }

    /**
     * Request to bunt
     */
    requestBunt(batterId) {
        if (!this.enabled) return false;

        // Evaluate bunt situation
        const situation = this.evaluateSituation();
        const success = this.executeBunt(batterId, situation);

        this.recordDecision({
            type: 'bunt',
            batterId,
            situation,
            success
        });

        return success;
    }

    /**
     * Execute bunt
     */
    executeBunt(batterId, situation) {
        // Bunt success based on:
        // - Batter's bunting skill
        // - Defense positioning
        // - Pitcher's control
        const batter = this.gameEngine.getBatter(batterId);
        const pitcher = this.gameEngine.getCurrentPitcher();

        const buntSkill = batter.stats.contact * 0.8; // Contact helps bunting
        const defenseReaction = 0.7; // How well defense reacts
        const pitchQuality = pitcher.control;

        const successChance = buntSkill * (1 - defenseReaction * pitchQuality);

        const success = Math.random() < successChance;

        if (success) {
            // Bunt successful - advance runners
            this.gameEngine.advanceRunners(1, false);
            this.gameEngine.recordOut();
            console.log('Bunt successful!');
        } else {
            // Failed bunt - out or foul
            if (Math.random() < 0.7) {
                this.gameEngine.recordOut();
                console.log('Bunt failed - out!');
            } else {
                this.gameEngine.recordStrike();
                console.log('Bunt foul');
            }
        }

        return success;
    }

    /**
     * Request steal attempt
     */
    requestSteal(runnerId, base) {
        if (!this.enabled) return false;

        const situation = this.evaluateSituation();
        const success = this.executeSteal(runnerId, base, situation);

        this.recordDecision({
            type: 'steal',
            runnerId,
            base,
            situation,
            success
        });

        return success;
    }

    /**
     * Execute steal
     */
    executeSteal(runnerId, base, situation) {
        const runner = this.gameEngine.getRunner(runnerId);
        const pitcher = this.gameEngine.getCurrentPitcher();
        const catcher = this.gameEngine.getCatcher();

        // Steal success based on:
        // - Runner's speed
        // - Pitcher's pickoff move
        // - Catcher's arm strength
        // - Lead distance

        const runnerSpeed = runner.stats.speed;
        const pitcherMove = pitcher.stats.pickoffMove || 0.5;
        const catcherArm = catcher.stats.arm || 0.7;

        const lead = Math.random() * 0.3 + 0.1; // 10-40% lead
        const reactionTime = pitcherMove * catcherArm;

        const successChance = (runnerSpeed + lead) / (1 + reactionTime);

        const success = Math.random() < successChance;

        if (success) {
            this.gameEngine.advanceRunner(runnerId, base);
            console.log(`${runner.name} stole ${base} base!`);
        } else {
            this.gameEngine.recordOut();
            console.log(`${runner.name} caught stealing!`);
        }

        return success;
    }

    /**
     * Request hit and run play
     */
    requestHitAndRun() {
        if (!this.enabled) return false;

        const situation = this.evaluateSituation();
        const success = this.executeHitAndRun(situation);

        this.recordDecision({
            type: 'hitAndRun',
            situation,
            success
        });

        return success;
    }

    /**
     * Execute hit and run
     */
    executeHitAndRun(situation) {
        // Runner goes on pitch
        // Batter must make contact

        const batter = this.gameEngine.getCurrentBatter();
        const contactChance = batter.stats.contact;

        if (Math.random() < contactChance) {
            // Contact made - advance runners extra base
            const hitType = this.gameEngine.determineHitType(batter);
            this.gameEngine.recordHit(hitType);
            this.gameEngine.advanceRunners(2, true); // Extra base on hit-and-run
            console.log('Hit and run successful!');
            return true;
        } else {
            // No contact - runner likely out
            if (Math.random() < 0.7) {
                this.gameEngine.recordOut();
                console.log('Hit and run failed - runner out!');
            } else {
                this.gameEngine.recordStrike();
                console.log('Hit and run - swing and miss');
            }
            return false;
        }
    }

    /**
     * Request pitchout
     */
    requestPitchout() {
        if (!this.enabled) return false;

        // Pitch intentionally out of zone to give catcher better chance to throw out stealer
        const situation = this.evaluateSituation();

        this.recordDecision({
            type: 'pitchout',
            situation
        });

        // If steal attempt happens, increase caught stealing chance by 50%
        this.gameEngine.pitchoutActive = true;

        console.log('Pitchout called!');
        return true;
    }

    /**
     * Request intentional walk
     */
    requestIntentionalWalk(batterId) {
        if (!this.enabled) return false;

        const batter = this.gameEngine.getBatter(batterId);
        const situation = this.evaluateSituation();

        // Automatically walk the batter
        this.gameEngine.recordWalk();

        this.recordDecision({
            type: 'intentionalWalk',
            batterId,
            situation
        });

        console.log(`Intentional walk to ${batter.name}`);
        return true;
    }

    /**
     * Request defensive shift
     */
    requestDefensiveShift(shiftType) {
        if (!this.enabled) return false;

        // Shift types: 'normal', 'pull', 'spray', 'noDoublesDefense'
        const situation = this.evaluateSituation();

        this.gameEngine.setDefensiveShift(shiftType);

        this.recordDecision({
            type: 'defensiveShift',
            shiftType,
            situation
        });

        console.log(`Defensive shift: ${shiftType}`);
        return true;
    }

    /**
     * Request pinch hitter
     */
    requestPinchHitter(originalBatterId, pinchHitterId) {
        if (!this.enabled) return false;

        const situation = this.evaluateSituation();
        const pinchHitter = this.gameEngine.getPlayer(pinchHitterId);

        this.gameEngine.substituteBatter(originalBatterId, pinchHitterId);

        this.recordDecision({
            type: 'pinchHitter',
            originalBatterId,
            pinchHitterId,
            situation
        });

        console.log(`Pinch hitter: ${pinchHitter.name}`);
        return true;
    }

    /**
     * Request pitching change
     */
    requestPitchingChange(relieverid) {
        if (!this.enabled) return false;

        const situation = this.evaluateSituation();
        const reliever = this.gameEngine.getPlayer(relieverId);

        this.gameEngine.changePitcher(relieverId);

        this.recordDecision({
            type: 'pitchingChange',
            relieverId,
            situation
        });

        console.log(`Pitching change: ${reliever.name}`);
        return true;
    }

    /**
     * Evaluate current game situation
     */
    evaluateSituation() {
        const game = this.gameEngine.getGameState();

        return {
            inning: game.inning,
            outs: game.outs,
            score: {
                home: game.homeScore,
                away: game.awayScore,
                differential: game.homeScore - game.awayScore
            },
            runners: {
                first: game.runnerOnFirst !== null,
                second: game.runnerOnSecond !== null,
                third: game.runnerOnThird !== null
            },
            balls: game.balls,
            strikes: game.strikes,
            leverage: this.calculateLeverage(game)
        };
    }

    /**
     * Calculate leverage index (importance of situation)
     */
    calculateLeverage(game) {
        let leverage = 1.0;

        // Late innings increase leverage
        if (game.inning >= 7) leverage *= 1.5;
        if (game.inning >= 9) leverage *= 2.0;

        // Close game increases leverage
        const diff = Math.abs(game.homeScore - game.awayScore);
        if (diff <= 1) leverage *= 2.0;
        else if (diff <= 3) leverage *= 1.5;

        // Runners on base increase leverage
        const runnersOn = [game.runnerOnFirst, game.runnerOnSecond, game.runnerOnThird].filter(r => r !== null).length;
        leverage *= (1 + runnersOn * 0.3);

        // 2 outs increases leverage
        if (game.outs === 2) leverage *= 1.3;

        return leverage;
    }

    /**
     * Record decision to history
     */
    recordDecision(decision) {
        decision.timestamp = Date.now();
        decision.gameState = this.evaluateSituation();
        this.decisions.push(decision);

        this.notifyListeners('decisionMade', decision);
    }

    /**
     * Get decision statistics
     */
    getDecisionStats() {
        const stats = {
            total: this.decisions.length,
            byType: {},
            successRate: {}
        };

        this.decisions.forEach(decision => {
            const type = decision.type;

            if (!stats.byType[type]) {
                stats.byType[type] = 0;
                stats.successRate[type] = { successes: 0, attempts: 0 };
            }

            stats.byType[type]++;

            if (decision.success !== undefined) {
                stats.successRate[type].attempts++;
                if (decision.success) {
                    stats.successRate[type].successes++;
                }
            }
        });

        // Calculate percentages
        Object.keys(stats.successRate).forEach(type => {
            const data = stats.successRate[type];
            data.percentage = data.attempts > 0
                ? Math.round((data.successes / data.attempts) * 100)
                : 0;
        });

        return stats;
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
                    console.error('Manager decisions listener error:', error);
                }
            });
    }
}

/**
 * AI Manager
 * Makes strategic decisions for CPU team
 */
class AIManager {
    constructor(managerDecisions) {
        this.decisions = managerDecisions;
        this.aggressiveness = 0.5; // 0-1 scale
    }

    /**
     * Make decision based on situation
     */
    makeDecision(situation) {
        // Evaluate various strategic options
        const options = this.evaluateOptions(situation);

        // Pick best option
        return this.selectBestOption(options);
    }

    /**
     * Evaluate strategic options
     */
    evaluateOptions(situation) {
        const options = [];

        // Consider bunting
        if (this.shouldConsiderBunt(situation)) {
            options.push({
                type: 'bunt',
                value: this.evaluateBunt(situation)
            });
        }

        // Consider stealing
        if (this.shouldConsiderSteal(situation)) {
            options.push({
                type: 'steal',
                value: this.evaluateSteal(situation)
            });
        }

        // Consider hit and run
        if (this.shouldConsiderHitAndRun(situation)) {
            options.push({
                type: 'hitAndRun',
                value: this.evaluateHitAndRun(situation)
            });
        }

        // Consider pitching change
        if (this.shouldConsiderPitchingChange(situation)) {
            options.push({
                type: 'pitchingChange',
                value: this.evaluatePitchingChange(situation)
            });
        }

        return options;
    }

    /**
     * Select best option
     */
    selectBestOption(options) {
        if (options.length === 0) return null;

        // Sort by value and pick best
        options.sort((a, b) => b.value - a.value);

        // Add some randomness based on aggressiveness
        const topOption = options[0];
        if (topOption.value > 0.6 + (this.aggressiveness * 0.2)) {
            return topOption;
        }

        return null;
    }

    /**
     * Should consider bunting
     */
    shouldConsiderBunt(situation) {
        // Bunt in early/mid innings with runner on first, less than 2 outs
        return situation.inning < 7 &&
               situation.runners.first &&
               !situation.runners.second &&
               situation.outs < 2;
    }

    /**
     * Evaluate bunt value
     */
    evaluateBunt(situation) {
        let value = 0.5;

        // More valuable with fast runner
        value += 0.2;

        // Less valuable with 2 outs
        if (situation.outs === 2) value -= 0.3;

        // More valuable if behind
        if (situation.score.differential < 0) value += 0.1;

        return value;
    }

    /**
     * Should consider stealing
     */
    shouldConsiderSteal(situation) {
        return (situation.runners.first || situation.runners.second) &&
               situation.outs < 2;
    }

    /**
     * Evaluate steal value
     */
    evaluateSteal(situation) {
        let value = 0.4 + (this.aggressiveness * 0.3);

        // More valuable in close game
        if (Math.abs(situation.score.differential) <= 2) value += 0.2;

        // More valuable with 2 outs
        if (situation.outs === 2) value += 0.1;

        return value;
    }

    /**
     * Should consider hit and run
     */
    shouldConsiderHitAndRun(situation) {
        return situation.runners.first &&
               situation.outs < 2 &&
               situation.strikes < 2;
    }

    /**
     * Evaluate hit and run value
     */
    evaluateHitAndRun(situation) {
        let value = 0.5 + (this.aggressiveness * 0.2);

        // More valuable with good contact hitter
        value += 0.1;

        // Less valuable with 2 strikes
        if (situation.strikes === 2) value -= 0.3;

        return value;
    }

    /**
     * Should consider pitching change
     */
    shouldConsiderPitchingChange(situation) {
        // Based on pitcher fatigue, performance
        return situation.leverage > 1.5 && situation.inning >= 6;
    }

    /**
     * Evaluate pitching change value
     */
    evaluatePitchingChange(situation) {
        let value = 0.3;

        // More valuable in high leverage situations
        value += situation.leverage * 0.2;

        // More valuable if losing
        if (situation.score.differential < 0) value += 0.2;

        return value;
    }
}

/**
 * Difficulty System
 * Adjusts game difficulty dynamically
 */
class DifficultySystem {
    constructor(options = {}) {
        this.currentDifficulty = options.difficulty || 'medium';
        this.adaptiveDifficulty = options.adaptive !== false;
        this.listeners = [];

        // Difficulty presets
        this.presets = {
            rookie: {
                name: 'Rookie',
                description: 'Easy mode for beginners',
                modifiers: {
                    playerBatting: 1.3,
                    playerPitching: 1.2,
                    cpuBatting: 0.7,
                    cpuPitching: 0.8,
                    pitchSpeed: 0.8,
                    catchDifficulty: 0.7,
                    aiAggressiveness: 0.3
                }
            },
            pro: {
                name: 'Pro',
                description: 'Balanced gameplay',
                modifiers: {
                    playerBatting: 1.0,
                    playerPitching: 1.0,
                    cpuBatting: 1.0,
                    cpuPitching: 1.0,
                    pitchSpeed: 1.0,
                    catchDifficulty: 1.0,
                    aiAggressiveness: 0.5
                }
            },
            allStar: {
                name: 'All-Star',
                description: 'Challenging gameplay',
                modifiers: {
                    playerBatting: 0.85,
                    playerPitching: 0.9,
                    cpuBatting: 1.15,
                    cpuPitching: 1.1,
                    pitchSpeed: 1.15,
                    catchDifficulty: 1.2,
                    aiAggressiveness: 0.7
                }
            },
            legend: {
                name: 'Legend',
                description: 'Maximum difficulty',
                modifiers: {
                    playerBatting: 0.7,
                    playerPitching: 0.8,
                    cpuBatting: 1.3,
                    cpuPitching: 1.25,
                    pitchSpeed: 1.3,
                    catchDifficulty: 1.5,
                    aiAggressiveness: 0.9
                }
            }
        };

        // Performance tracking for adaptive difficulty
        this.performance = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            avgRunsScored: 0,
            avgRunsAllowed: 0,
            battingAverage: 0,
            recentPerformance: []
        };
    }

    /**
     * Set difficulty
     */
    setDifficulty(difficulty) {
        if (!this.presets[difficulty]) {
            console.error('Invalid difficulty:', difficulty);
            return;
        }

        this.currentDifficulty = difficulty;

        console.log(`Difficulty set to: ${this.presets[difficulty].name}`);

        this.notifyListeners('difficultyChanged', {
            difficulty,
            preset: this.presets[difficulty]
        });
    }

    /**
     * Get current modifiers
     */
    getModifiers() {
        return this.presets[this.currentDifficulty].modifiers;
    }

    /**
     * Update performance metrics
     */
    updatePerformance(gameStats) {
        this.performance.gamesPlayed++;

        if (gameStats.won) {
            this.performance.wins++;
        } else {
            this.performance.losses++;
        }

        // Update averages
        this.performance.avgRunsScored =
            (this.performance.avgRunsScored * (this.performance.gamesPlayed - 1) + gameStats.runsScored) /
            this.performance.gamesPlayed;

        this.performance.avgRunsAllowed =
            (this.performance.avgRunsAllowed * (this.performance.gamesPlayed - 1) + gameStats.runsAllowed) /
            this.performance.gamesPlayed;

        this.performance.battingAverage = gameStats.battingAverage;

        // Track recent performance (last 10 games)
        this.performance.recentPerformance.push(gameStats);
        if (this.performance.recentPerformance.length > 10) {
            this.performance.recentPerformance.shift();
        }

        // Adjust difficulty if adaptive
        if (this.adaptiveDifficulty) {
            this.adjustDifficulty();
        }
    }

    /**
     * Adjust difficulty based on performance
     */
    adjustDifficulty() {
        if (this.performance.gamesPlayed < 3) return; // Need at least 3 games

        const recentWinRate = this.getRecentWinRate();

        // If player is dominating, increase difficulty
        if (recentWinRate > 0.75 && this.currentDifficulty === 'rookie') {
            this.setDifficulty('pro');
            console.log('🔥 Performance detected! Difficulty increased to Pro');
        } else if (recentWinRate > 0.7 && this.currentDifficulty === 'pro') {
            this.setDifficulty('allStar');
            console.log('🔥 Excellent performance! Difficulty increased to All-Star');
        } else if (recentWinRate > 0.65 && this.currentDifficulty === 'allStar') {
            this.setDifficulty('legend');
            console.log('🔥 Legendary performance! Difficulty increased to Legend');
        }

        // If player is struggling, decrease difficulty
        else if (recentWinRate < 0.25 && this.currentDifficulty === 'legend') {
            this.setDifficulty('allStar');
            console.log('Difficulty decreased to All-Star');
        } else if (recentWinRate < 0.3 && this.currentDifficulty === 'allStar') {
            this.setDifficulty('pro');
            console.log('Difficulty decreased to Pro');
        } else if (recentWinRate < 0.35 && this.currentDifficulty === 'pro') {
            this.setDifficulty('rookie');
            console.log('Difficulty decreased to Rookie');
        }
    }

    /**
     * Get recent win rate (last 5-10 games)
     */
    getRecentWinRate() {
        if (this.performance.recentPerformance.length === 0) return 0.5;

        const wins = this.performance.recentPerformance.filter(g => g.won).length;
        return wins / this.performance.recentPerformance.length;
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        return {
            ...this.performance,
            winRate: this.performance.gamesPlayed > 0
                ? (this.performance.wins / this.performance.gamesPlayed).toFixed(3)
                : 0,
            recentWinRate: this.getRecentWinRate().toFixed(3)
        };
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
                    console.error('Difficulty system listener error:', error);
                }
            });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ManagerDecisions, AIManager, DifficultySystem };
}
